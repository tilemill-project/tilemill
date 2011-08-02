
#import <Cocoa/Cocoa.h>
#import "ChildProcess.h"

@class TileMillMainWindowController;

@interface TileMill : NSObject <ChildProcessDelegate>
{
    IBOutlet id relNotesWin;
    IBOutlet id relNotesTextField;
    ChildProcess *searchTask;
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
