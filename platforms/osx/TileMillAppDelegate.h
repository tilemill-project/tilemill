//
//  TileMillAppDelegate.h
//  TileMill
//
//  Copyright 2011-2014 Mapbox, Inc. All rights reserved.
//

#import "TileMillChildProcess.h"

@class TileMillBrowserWindowController;

void (^requestLoadBlock)(void) = NULL;

@interface TileMillAppDelegate : NSObject <NSApplicationDelegate, TileMillChildProcessDelegate>

- (IBAction)openDocumentsFolder:(id)sender;
- (IBAction)openHelp:(id)sender;
- (IBAction)openDiscussions:(id)sender;
- (IBAction)openOnlineHelp:(id)sender;
- (IBAction)openConsole:(id)sender;
- (IBAction)showBrowserWindow:(id)sender;
- (NSString *)configurationForKey:(NSString *)key;

@end