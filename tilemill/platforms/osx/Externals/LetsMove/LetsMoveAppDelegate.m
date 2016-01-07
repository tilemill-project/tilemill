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

- (NSWindow *)window {
	return window;
}

- (void)applicationWillFinishLaunching:(NSNotification *)aNotification {
	// Offer to the move the Application if necessary.
	// Note that if the user chooses to move the application,
	// this call will never return. Therefore you can suppress
	// any first run UI by putting it after this call.
	
	PFMoveToApplicationsFolderIfNecessary();
	
	[window center];
	[window makeKeyAndOrderFront:self];
}

@end
