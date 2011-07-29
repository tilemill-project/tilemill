
#import "TileMill.h"

@implementation TileMill

- (id)init
{
    NSNotificationCenter  *nc = [NSNotificationCenter defaultCenter];
   
    [nc addObserver:self
          selector:@selector(windowWillClose:)
              name:NSWindowWillCloseNotification
            object:nil];  // pass window to observe only that window
    return (self);
}

- (void)applicationWillFinishLaunching:(NSNotification *)aNotification
{   
    if (findRunning)
    {
        [searchTask stopProcess];
        [searchTask release];
        searchTask=nil;
    }
    else
    {
        if (searchTask!=nil) {
            [searchTask release];
        }
    
        NSString *base_path = [[NSBundle mainBundle] pathForResource:@"tilemill" ofType:@""];
        if (base_path == nil) {
            [resultsTextField setString:@""];
            [resultsTextField setString:@"Error: unable to start, tilemill nodejs program folder not found...\n"];
        } else {
            searchTask = [[ChildProcess alloc] initWithController:self arguments:
                    [NSArray arrayWithObjects:
                     base_path, // working directory
                     [NSString stringWithFormat:@"%@/index.js", base_path], // abs path to program
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
    searchTask=nil;
}


- (IBAction)startTileMill:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://localhost:8889/"]];

}

- (IBAction)openExports:(id)sender
{
    [[NSWorkspace sharedWorkspace] openFile: [NSString stringWithFormat:@"%@/Documents/TileMill/export",NSHomeDirectory()]];
}

- (IBAction)openProjects:(id)sender
{
    [[NSWorkspace sharedWorkspace] openFile: [NSString stringWithFormat:@"%@/Documents/TileMill/project",NSHomeDirectory()]];

}

- (IBAction)openData:(id)sender
{
    [[NSWorkspace sharedWorkspace] openFile: [NSString stringWithFormat:@"%@/Documents/TileMill/data",NSHomeDirectory()]];
}


- (IBAction)openSupport:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:
        [NSURL URLWithString:@"http://support.mapbox.com"]];
}

- (IBAction)openTilemillHome:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:
        [NSURL URLWithString:@"http://tilemill.com"]];
}

- (void)firstData
{
    [[NSWorkspace sharedWorkspace] openURL:
       [NSURL URLWithString:@"http://localhost:8889/"]];
}

- (void)appendOutput:(NSString *)output
{
    [[resultsTextField textStorage] appendAttributedString: [[[NSAttributedString alloc]
                             initWithString: output] autorelease]];
    [self performSelector:@selector(scrollToVisible:) withObject:nil afterDelay:0.0];
}

- (void)scrollToVisible:(id)ignore {
    [resultsTextField scrollRangeToVisible:NSMakeRange([[resultsTextField string] length], 0)];
}

- (void)processStarted
{
    findRunning=YES;
    [resultsTextField setString:@""];
    [resultsTextField setString:@"Launching in browser...\n"];
    //[startButton setTitle:@"Stop TileMill"];
}

- (void)processFinished
{
    findRunning=NO;
    //[resultsTextField setString:@"stopped!"];
    //[startButton setTitle:@"Start TileMill"];
}

/*
-(BOOL)windowWillClose:(id)sender
{
    [searchTask stopProcess];
    [searchTask release];
    searchTask=nil;
    return YES;
}*/

- (void)windowWillClose:(NSNotification *)notification
{
    [searchTask stopProcess];
    [searchTask release];
    searchTask=nil;
}

-(BOOL)windowShouldClose:(id)sender
{
    [[NSApplication sharedApplication] terminate:nil];
    return YES;
}

- (IBAction)displayReleaseNotes:(id)sender
{
    [relNotesTextField readRTFDFromFile:[[NSBundle mainBundle] pathForResource:@"ReadMe" ofType:@"rtf"]];
    [relNotesWin makeKeyAndOrderFront:self];
}

-(void)awakeFromNib
{
    findRunning=NO;
    searchTask=nil;
}

@end
