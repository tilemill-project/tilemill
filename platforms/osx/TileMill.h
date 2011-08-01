
#import <Cocoa/Cocoa.h>
#import "ChildProcess.h"

@interface TileMill : NSObject <ChildProcessController>
{
    IBOutlet id window;
    IBOutlet id relNotesWin;
    IBOutlet id relNotesTextField;
    IBOutlet NSButton *openBrowserButton;
    BOOL findRunning;
    ChildProcess *searchTask;
}
- (IBAction)openBrowser:(id)sender;
- (IBAction)openDirectory:(id)sender;
- (IBAction)openHelp:(id)sender;
- (IBAction)openDiscussions:(id)sender;
- (IBAction)openKnowledgeBase:(id)sender;
- (IBAction)displayReleaseNotes:(id)sender;
@end
