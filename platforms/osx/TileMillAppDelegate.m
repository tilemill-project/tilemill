
#import "TileMillAppDelegate.h"
#import "TileMillMainWindowController.h"

@implementation TileMillAppDelegate

-(void)awakeFromNib {
    logPath = [[NSHomeDirectory() stringByAppendingPathComponent:@"Library/Logs/TileMill.log"] retain];
    mainWindow = [[TileMillMainWindowController alloc] init];
    [mainWindow showWindow:nil];
    mainWindow.childRunning = NO;
    [self startTileMill];
}

- (void)dealloc {
    [mainWindow release];
    [super dealloc];
}

- (void)startTileMill {
    if (![[NSBundle mainBundle] URLForResource:@"node" withExtension:@""]) {
        NSLog(@"node is missing.");
        [NSApp terminate:nil];
    }
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
    searchTask = [[TileMillChildProcess alloc] initWithBasePath:base_path command:command];
    [searchTask setDelegate:self];
    [searchTask startProcess];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)tilemillAppDelegate {
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

#pragma MainMenu IBActions

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

- (IBAction)openConsole:(id)sender
{
    [[NSWorkspace sharedWorkspace] openFile:logPath withApplication:@"Console" andDeactivate:YES];
}

#pragma ChildProcessDelegate Methods

- (void)childProcess:(TileMillChildProcess *)process didSendOutput:(NSString *)output
{
    [self writeToLog:output];
}

- (void)childProcessDidStart:(TileMillChildProcess *)process
{
//    NSLog(@"Process started.");
}

- (void)childProcessDidFinish:(TileMillChildProcess *)process
{
    mainWindow.childRunning = NO;
    NSLog(@"Finished");
    if (!appTerminating) {
        // We're not shutting down so the app crashed. Restart it.
        NSLog(@"Restart");
        [self startTileMill];
    }
}

- (void)childProcessDidSendFirstData:(TileMillChildProcess *)process;
{
    mainWindow.childRunning = YES;
}

@end
