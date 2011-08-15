
#import "TileMillMainWindowController.h"

@implementation TileMillMainWindowController

@synthesize childRunning;

- (id)init {
    if (![super initWithWindowNibName:@"TileMillMainWindow"]) {
        return nil;
    }
    return self;
}

- (IBAction)openBrowser:(id)sender {
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://localhost:8889/"]];
}

@end