
#import "TileMill.h"

@implementation TileMill

- (id)init
{
    NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
   
    [nc addObserver:self
          selector:@selector(windowWillClose:)
              name:NSWindowWillCloseNotification
            object:nil]; // pass window to observe only that window
    return (self);
}

-(void)awakeFromNib
{
    findRunning = NO;
    searchTask = nil;
}

- (void)applicationWillFinishLaunching:(NSNotification *)aNotification
{   
    if (findRunning)
    {
        [searchTask stopProcess];
        [searchTask release];
        searchTask = nil;
    }
    else
    {
        if (searchTask != nil) {
            [searchTask release];
        }
    
        NSString *base_path = [[NSBundle mainBundle] pathForResource:@"tilemill" ofType:@""];

        if (base_path == nil) {
            // TODO: Handle error.
        } else {
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
    }
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)tilemillAppDelegate {
	  //NSLog(@"closed window!");
    return YES;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
	  //NSLog(@"terminating tilemill task!");
    [searchTask stopProcess];
    [searchTask release];
    searchTask = nil;
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
    NSLog(@"Append output.");
    // TODO: Handle output.
}

- (void)processStarted
{
    NSLog(@"Process started.");
    findRunning=YES;
    // TODO: Stop spinner and enable button.
    //[startButton setTitle:@"Stop TileMill"];
}

- (void)processFinished
{
    findRunning=NO;
    //[startButton setTitle:@"Start TileMill"];
}

- (void)firstData
{
    NSLog(@"First data.");
    // TODO handle first data
}

@end
