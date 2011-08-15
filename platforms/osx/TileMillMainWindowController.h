
#import <Cocoa/Cocoa.h>

@interface TileMillMainWindowController : NSWindowController {
    IBOutlet id window;
    IBOutlet NSButton *openBrowserButton;
    IBOutlet NSProgressIndicator *spinner;
    BOOL childRunning;
}

@property (nonatomic, assign) BOOL childRunning;

- (IBAction)openBrowser:(id)sender;

@end
