//
//  TileMillMainWindowController.h
//  tilemill
//
//  Created by Will White on 8/2/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@interface TileMillMainWindowController : NSWindowController {
    IBOutlet NSButton *openBrowserButton;
    IBOutlet NSProgressIndicator *spinner;
    BOOL childRunning;
}

@property (nonatomic, assign) BOOL childRunning;

- (IBAction)openBrowser:(id)sender;

@end
