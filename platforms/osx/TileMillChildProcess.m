
#import "TileMillChildProcess.h"

@implementation TileMillChildProcess

@synthesize delegate;

- (id)initWithBasePath:(NSString *)bp command:(NSString *)c
{
    if (![super init]) {
        return nil;
    }
    basePath = [bp retain];
    command = [c retain];
    return self;
}

- (void)dealloc
{
    delegate = nil;
    [self stopProcess];
    [basePath release];
    [command release];
    [task release];
    [super dealloc];
}

- (void) startProcess
{
    [self.delegate childProcessDidStart:self];
    task = [[NSTask alloc] init];
    [task setStandardOutput: [NSPipe pipe]];
    [task setStandardError: [task standardOutput]];
    [task setCurrentDirectoryPath: basePath];
    [task setLaunchPath: command];
    [task setArguments:[NSArray arrayWithObjects:[NSString stringWithFormat:@"--port=%i",      [[NSUserDefaults standardUserDefaults] integerForKey:@"serverPort"]],
                                                 [NSString stringWithFormat:@"--files=\"%@\"", [[NSUserDefaults standardUserDefaults] stringForKey:@"filesPath"]], 
                                                 nil]];
    [[NSNotificationCenter defaultCenter] addObserver:self 
        selector:@selector(getData:) 
        name: NSFileHandleReadCompletionNotification 
        object: [[task standardOutput] fileHandleForReading]];
    [[[task standardOutput] fileHandleForReading] readInBackgroundAndNotify];
    [task launch];    
}

- (void) stopProcess
{
    NSData *data;
    [[NSNotificationCenter defaultCenter] removeObserver:self name:NSFileHandleReadCompletionNotification object: [[task standardOutput] fileHandleForReading]];
    [task terminate];

    while ((data = [[[task standardOutput] fileHandleForReading] availableData]) && [data length])
    {
        [self.delegate childProcess:self didSendOutput:[[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease]];
    }

    [self.delegate childProcessDidFinish:self];
}

- (void) getData: (NSNotification *)aNotification
{
    NSData *data = [[aNotification userInfo] objectForKey:NSFileHandleNotificationDataItem];
    if ([data length])
    {
        NSString *message = [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
        [self.delegate childProcess:self didSendOutput:message];
        if ([message hasPrefix:@"Started"] && !launched) {
            launched = YES;
            [self.delegate childProcessDidSendFirstData:self];
        }
    } else {
        [self stopProcess];
    }
    
    [[aNotification object] readInBackgroundAndNotify];  
}

@end

