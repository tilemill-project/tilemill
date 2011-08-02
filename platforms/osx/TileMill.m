
#import "TileMill.h"

@implementation TileMill

- (id)init
{
    if (![super init]) {
        return nil;
    }
    NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
   
    [nc addObserver:self
          selector:@selector(windowWillClose:)
              name:NSWindowWillCloseNotification
            object:nil]; // pass window to observe only that window
    return self;
}

-(void)awakeFromNib
{
    logPath = [[NSHomeDirectory() stringByAppendingPathComponent:@"Library/Logs/TileMill.log"] retain];
    [self startTileMill];
}

- (void)startTileMill {
    [spinner startAnimation:self];

    // Look for orphan node processes from previous crashes.
    NSURL *nodeExecURL = [[NSBundle mainBundle] URLForResource:@"node" withExtension:@""];
    NSArray *applications = [[NSWorkspace sharedWorkspace] runningApplications];
    for (NSRunningApplication *app in applications) {
        if ([[app executableURL] isEqual:nodeExecURL]) {
            if (![app forceTerminate]) {
                [self writeToLog:@"Failed to terminate orphan tilemill process."];
            }
        }
    }

    if (searchTask) {
        [searchTask release];
        searchTask = nil;
    }
    NSString *base_path = [[NSBundle mainBundle] resourcePath];
    NSString *command = [NSString stringWithFormat:@"%@/index.js", base_path];
    searchTask = [[ChildProcess alloc] initWithBasePath:base_path command:command];
    [searchTask setDelegate:self];
    [searchTask startProcess];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)tilemillAppDelegate {
	  //NSLog(@"closed window!");
    return YES;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
    appTerminating = YES;
    // This doesn't run when app is forced to quit, so the child process is left running.
    // We clean up any orphan processes in [self startTileMill].
    [searchTask stopProcess];
    [searchTask release];
    searchTask = nil;
}

- (void)windowWillClose:(NSNotification *)notification
{
    // TODO break this out into a window controller to avoid this check.
    if ([notification.object isEqual:window]) {
        appTerminating = YES;
        [searchTask stopProcess];
        [searchTask release];
        searchTask = nil;
    }
}

-(BOOL)windowShouldClose:(id)sender
{
    [[NSApplication sharedApplication] terminate:nil];
    return YES;
}

- (void)writeToLog:(NSString *)message {
    if (![[NSFileManager defaultManager] fileExistsAtPath:logPath]) {
        NSError *error;
        if (![@"" writeToFile:logPath atomically:YES encoding:NSUTF8StringEncoding error:&error]) {
            NSLog(@"Error creating log file at %@.", logPath);
        }
    }
    NSFileHandle *logFile = [NSFileHandle fileHandleForWritingAtPath:logPath];
    [logFile seekToEndOfFile];
    [logFile writeData:[message dataUsingEncoding:NSUTF8StringEncoding]];
    [logFile closeFile];
}

#pragma IBActions

- (IBAction)openBrowser:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://localhost:8889/"]];
}

- (IBAction)openDirectory:(id)sender
{
    [[NSWorkspace sharedWorkspace] openFile: [NSString stringWithFormat:@"%@/Documents/TileMill", NSHomeDirectory()]];
}

- (IBAction)openHelp:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://localhost:8889/#!/manual"]];
}

- (IBAction)openDiscussions:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://support.mapbox.com/discussions/tilemill"]];
}

- (IBAction)openKnowledgeBase:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://support.mapbox.com/kb/tilemill"]];
}

- (IBAction)displayReleaseNotes:(id)sender
{
    [relNotesTextField readRTFDFromFile:[[NSBundle mainBundle] pathForResource:@"ReadMe" ofType:@"rtf"]];
    [relNotesWin makeKeyAndOrderFront:self];
}

- (IBAction)openConsole:(id)sender
{
    [[NSWorkspace sharedWorkspace] openFile:logPath withApplication:@"Console" andDeactivate:YES];
}

#pragma ChildProcessDelegate Methods

- (void)childProcess:(ChildProcess *)process didSendOutput:(NSString *)output
{
    [self writeToLog:output];
}

- (void)childProcessDidStart:(ChildProcess *)process
{
//    NSLog(@"Process started.");
}

- (void)childProcessDidFinish:(ChildProcess *)process
{
    NSLog(@"Finished");
    [openBrowserButton setEnabled:NO];
    if (!appTerminating) {
        // We're not shutting down so the app crashed. Restart it.
        NSLog(@"Restart");
        [self startTileMill];
    }
}

- (void)childProcessDidSendFirstData:(ChildProcess *)process;
{
    [openBrowserButton setEnabled:YES];
    [spinner stopAnimation:self];
}

@end
