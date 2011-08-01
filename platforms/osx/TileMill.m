
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
    [self startTileMill];
}

- (void)startTileMill {
    [spinner startAnimation:self];
    if (searchTask) {
        [searchTask release];
    }
    NSString *base_path = [[NSBundle mainBundle] resourcePath];
    NSString *command = [NSString stringWithFormat:@"%@/index.js", base_path];
    searchTask = [[ChildProcess alloc] initWithController:self arguments:
                  [NSArray arrayWithObjects:
                   base_path, // working directory
                   command, // abs path to program
                   nil
                   ]
                  ];
    [searchTask startProcess];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)tilemillAppDelegate {
	  //NSLog(@"closed window!");
    return YES;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
    // TODO doesn't run when app is forced to quit, which leaves the child process running.
//	  NSLog(@"terminating tilemill task!");
    [searchTask stopProcess];
    [searchTask release];
    searchTask = nil;
    appTerminating = YES;
}

- (void)windowWillClose:(NSNotification *)notification
{
    [searchTask stopProcess];
    [searchTask release];
    searchTask = nil;
}

-(BOOL)windowShouldClose:(id)sender
{
    [[NSApplication sharedApplication] terminate:nil];
    return YES;
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

#pragma ChildProcessController Delegate Methods

- (void)appendOutput:(NSString *)output
{
    NSLog(@"Append output: %@", output);
    NSString *logPath = [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Logs/TileMill.log"];
    if (![[NSFileManager defaultManager] fileExistsAtPath:logPath]) {
        NSError *error;
        if (![@"" writeToFile:logPath atomically:YES encoding:NSUTF8StringEncoding error:&error]) {
            NSLog(@"Error creating log file at %@.", logPath);
        }
    }
    NSFileHandle *logFile = [NSFileHandle fileHandleForWritingAtPath:logPath];
    [logFile seekToEndOfFile];
    [logFile writeData:[output dataUsingEncoding:NSUTF8StringEncoding]];
    [logFile closeFile];
}

- (void)processStarted
{
    NSLog(@"Process started.");
}

- (void)processFinished
{
    NSLog(@"Finished");
    [openBrowserButton setEnabled:NO];
    if (!appTerminating) {
        // We're not shutting down so the app crashed. Restart it.
        NSLog(@"Restart");
        // TODO figure out why this causes an infinite loop.
        //[self startTileMill];
    }
}

- (void)firstData
{
    NSLog(@"First data.");
    [openBrowserButton setEnabled:YES];
    [spinner stopAnimation:self];
}

@end
