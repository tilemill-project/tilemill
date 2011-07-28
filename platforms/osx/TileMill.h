
#import <Cocoa/Cocoa.h>
#import "ChildProcess.h"

@interface TileMill : NSObject <ChildProcessController>
{
    IBOutlet id resultsTextField;
    IBOutlet id window;
    IBOutlet id relNotesWin;
    IBOutlet id relNotesTextField;
    IBOutlet NSButton *startButton;
    IBOutlet NSButton *exportsButton;
    IBOutlet NSButton *projectsButton;
    IBOutlet NSButton *dataButton;
    IBOutlet NSButton *supportButton;
    IBOutlet NSButton *tilemillHomeButton;
    BOOL findRunning;
    ChildProcess *searchTask;
}
- (IBAction)startTileMill:(id)sender;
- (IBAction)openExports:(id)sender;
- (IBAction)openProjects:(id)sender;
- (IBAction)openData:(id)sender;
- (IBAction)openSupport:(id)sender;
- (IBAction)openTilemillHome:(id)sender;
- (IBAction)displayReleaseNotes:(id)sender;
@end
