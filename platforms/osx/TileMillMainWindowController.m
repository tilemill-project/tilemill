//
//  TileMillMainWindowController.m
//  tilemill
//
//  Created by Will White on 8/2/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

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