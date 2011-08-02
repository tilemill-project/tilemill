
#import <Cocoa/Cocoa.h>
#import "TileMillChildProcess.h"

@class TileMillMainWindowController;

@interface TileMillAppDelegate : NSObject <TileMillChildProcessDelegate>
{
    IBOutlet id relNotesWin;
    IBOutlet id relNotesTextField;
    TileMillChildProcess *searchTask;
    BOOL appTerminating;
    NSString *logPath;
    TileMillMainWindowController *mainWindow;
}

- (IBAction)openDirectory:(id)sender;
- (IBAction)openHelp:(id)sender;
- (IBAction)openDiscussions:(id)sender;
- (IBAction)openKnowledgeBase:(id)sender;
- (IBAction)displayReleaseNotes:(id)sender;
- (IBAction)openConsole:(id)sender;

- (void)startTileMill;
- (void)writeToLog:(NSString *)message;

@end
