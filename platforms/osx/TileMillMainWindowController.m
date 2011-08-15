
#import "TileMillMainWindowController.h"

@implementation TileMillMainWindowController

@synthesize childRunning;

- (id)init {
    if (![super initWithWindowNibName:@"TileMillMainWindow"]) {
        return nil;
    }
    return self;
}

- (void)awakeFromNib
{
    [[self window] center];
}

- (IBAction)openBrowser:(id)sender {
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%i", [[NSUserDefaults standardUserDefaults] integerForKey:@"serverPort"]]]];
}

@end