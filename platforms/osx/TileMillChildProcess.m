//
//  TileMillChildProcess.m
//  tilemill
//
//  Created by Will White on 8/2/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillChildProcess.h"

@implementation TileMillChildProcess

@synthesize delegate;
@synthesize launched;

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
    if ([(id <NSObject>)self.delegate respondsToSelector:@selector(childProcessDidStart:)])
        [self.delegate childProcessDidStart:self];
 
    task = [[NSTask alloc] init];
    [task setStandardOutput: [NSPipe pipe]];
    [task setStandardError: [task standardOutput]];
    [task setCurrentDirectoryPath: basePath];
    [task setLaunchPath: command];
    [task setArguments:[NSArray arrayWithObjects:[NSString stringWithFormat:@"--port=%i",       [[NSUserDefaults standardUserDefaults] integerForKey:@"serverPort"]],
                                                 [NSString stringWithFormat:@"--bufferSize=%i", [[NSUserDefaults standardUserDefaults] integerForKey:@"bufferSize"]],
                                                 [NSString stringWithFormat:@"--files=%@",      [[NSUserDefaults standardUserDefaults] stringForKey:@"filesPath"]], 
                                                 nil]];

    [[NSNotificationCenter defaultCenter] addObserver:self 
                                             selector:@selector(getData:) 
                                                 name:NSFileHandleReadCompletionNotification 
                                               object:[[task standardOutput] fileHandleForReading]];
    
    [[[task standardOutput] fileHandleForReading] readInBackgroundAndNotify];
    
    [task launch];    
}

- (void) stopProcess
{
    NSData *data;
    [[NSNotificationCenter defaultCenter] removeObserver:self name:NSFileHandleReadCompletionNotification object: [[task standardOutput] fileHandleForReading]];
    [task terminate];

    if ([(id <NSObject>)self.delegate respondsToSelector:@selector(childProcess:didSendOutput:)])
        while ((data = [[[task standardOutput] fileHandleForReading] availableData]) && [data length])
            [self.delegate childProcess:self didSendOutput:[[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease]];

    if ([(id <NSObject>)self.delegate respondsToSelector:@selector(childProcessDidFinish:)])
        [self.delegate childProcessDidFinish:self];
}

- (void) getData: (NSNotification *)aNotification
{
    NSData *data = [[aNotification userInfo] objectForKey:NSFileHandleNotificationDataItem];
    if ([data length])
    {
        NSString *message = [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];

        if ([(id <NSObject>)self.delegate respondsToSelector:@selector(childProcess:didSendOutput:)])
            [self.delegate childProcess:self didSendOutput:message];
        
        if ([message hasPrefix:@"Started"] && !launched) {
            launched = YES;
            
            if ([(id <NSObject>)self.delegate respondsToSelector:@selector(childProcessDidSendFirstData:)])
                [self.delegate childProcessDidSendFirstData:self];
        }
    } else {
        [self stopProcess];
    }
    
    [[aNotification object] readInBackgroundAndNotify];  
}

@end

