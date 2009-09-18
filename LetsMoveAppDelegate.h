//
//  LetsMoveAppDelegate.h
//  LetsMove
//
//  Created by Andy Kim on 9/17/09.
//  Copyright 2009 Potion Factory LLC. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@interface LetsMoveAppDelegate : NSObject <NSApplicationDelegate> {
    NSWindow *window;
}

@property (assign) IBOutlet NSWindow *window;

@end
