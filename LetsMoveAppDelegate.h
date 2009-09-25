//
//  LetsMoveAppDelegate.h
//  LetsMove
//
//  Created by Andy Kim on 9/17/09.
//  Copyright 2009 Potion Factory LLC. All rights reserved.
//

#import <Cocoa/Cocoa.h>

#ifdef MAC_OS_X_VERSION_10_6
@interface LetsMoveAppDelegate : NSObject <NSApplicationDelegate>
#else
@interface LetsMoveAppDelegate : NSObject
#endif
{
    IBOutlet NSWindow *window;
}

- (NSWindow *)window;

@end
