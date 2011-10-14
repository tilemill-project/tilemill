//
//  TileMillMainWindowController.m
//  TileMill
//
//  Created by Will White on 8/2/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillMainWindowController.h"

@implementation TileMillMainWindowController

@synthesize openBrowserButton;
@synthesize spinner;
@synthesize childRunning;

- (void)awakeFromNib
{
    [[self window] center];
}

- (void)dealloc
{
    [openBrowserButton release];
    [spinner release];
    
    [super dealloc];
}

#pragma mark -

- (IBAction)openBrowser:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%i", [[NSUserDefaults standardUserDefaults] integerForKey:@"serverPort"]]]];
}

@end