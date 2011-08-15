
#import <Cocoa/Cocoa.h>
#import "TileMillChildProcess.h"

@class TileMillMainWindowController;
@class TileMillPrefsWindowController;

@interface TileMillAppDelegate : NSObject <TileMillChildProcessDelegate>
{
    TileMillChildProcess *searchTask;
    BOOL appTerminating;
    NSString *logPath;
    TileMillMainWindowController *mainWindowController;
    TileMillPrefsWindowController *prefsController;
}

- (IBAction)openDirectory:(id)sender;
- (IBAction)openHelp:(id)sender;
- (IBAction)openDiscussions:(id)sender;
- (IBAction)openKnowledgeBase:(id)sender;
- (IBAction)openConsole:(id)sender;
- (IBAction)showMainWindow:(id)sender;
- (IBAction)openPreferences:(id)sender;

- (void)startTileMill;
- (void)writeToLog:(NSString *)message;

@end
