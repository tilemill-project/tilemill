//
//  LetsMoveAppDelegate.h
//  LetsMove
//
//  Created by Andy Kim on 9/17/09.
//  Copyright 2009 Potion Factory LLC. All rights reserved.
//

#import <Cocoa/Cocoa.h>

#if MAC_OS_X_VERSION_MAX_ALLOWED <= MAC_OS_X_VERSION_10_5
@interface LetsMoveAppDelegate : NSObject {
#else
@interface LetsMoveAppDelegate : NSObject <NSApplicationDelegate> {
#endif
    NSWindow *window;
}

@property (assign) IBOutlet NSWindow *window;

@end
