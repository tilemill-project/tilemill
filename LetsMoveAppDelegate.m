//
//  LetsMoveAppDelegate.m
//  LetsMove
//
//  Created by Andy Kim on 9/17/09.
//  Copyright 2009 Potion Factory LLC. All rights reserved.
//

#import "LetsMoveAppDelegate.h"
#import "PFMoveApplication.h"

@implementation LetsMoveAppDelegate

@synthesize window;

- (void)applicationWillFinishLaunching:(NSNotification *)aNotification
{
	[window center];

	// If not in /Applications, offer to move it there
	PFMoveToApplicationsFolderIfNecessary();
}

@end
