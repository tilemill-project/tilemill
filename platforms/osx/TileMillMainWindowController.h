//
//  TileMillMainWindowController.h
//  tilemill
//
//  Created by Will White on 8/2/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

@interface TileMillMainWindowController : NSWindowController
{
}

@property (nonatomic, readonly, retain) IBOutlet NSButton *openBrowserButton;
@property (nonatomic, readonly, retain) IBOutlet NSProgressIndicator *spinner;
@property (nonatomic, assign) BOOL childRunning;

- (IBAction)openBrowser:(id)sender;

@end