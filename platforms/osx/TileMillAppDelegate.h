//
//  TileMillAppDelegate.h
//  TileMill
//
//  Created by Dane Springmeyer on 7/28/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillChildProcess.h"

@class TileMillBrowserWindowController;
@class TileMillSparklePrefsWindowController;

void (^requestLoadBlock)(void) = NULL;

@interface TileMillAppDelegate : NSObject <NSApplicationDelegate, TileMillChildProcessDelegate>
{
    TileMillChildProcess *searchTask;
    TileMillBrowserWindowController *browserController;
    TileMillSparklePrefsWindowController *sparklePrefsController;
    NSString *logPath;
    BOOL shouldAttemptRestart;
}

- (IBAction)openDocumentsFolder:(id)sender;
- (IBAction)openHelp:(id)sender;
- (IBAction)openDiscussions:(id)sender;
- (IBAction)openOnlineHelp:(id)sender;
- (IBAction)openConsole:(id)sender;
- (IBAction)openSparklePreferences:(id)sender;
- (IBAction)showBrowserWindow:(id)sender;
- (NSString *)configurationForKey:(NSString *)key;

@end