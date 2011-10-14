//
//  TileMillAppDelegate.h
//  TileMill
//
//  Created by Dane Springmeyer on 7/28/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillChildProcess.h"

@class TileMillMainWindowController;
@class TileMillPrefsWindowController;

@interface TileMillAppDelegate : NSObject <TileMillChildProcessDelegate>
{
    TileMillChildProcess *searchTask;
    TileMillMainWindowController *mainWindowController;
    TileMillPrefsWindowController *prefsController;
    NSString *logPath;
    BOOL shouldAttemptRestart;
    BOOL fatalErrorCaught;
}

- (IBAction)openDocumentsFolder:(id)sender;
- (IBAction)openHelp:(id)sender;
- (IBAction)openDiscussions:(id)sender;
- (IBAction)openKnowledgeBase:(id)sender;
- (IBAction)openConsole:(id)sender;
- (IBAction)openPreferences:(id)sender;
- (IBAction)showMainWindow:(id)sender;
- (IBAction)showAboutPanel:(id)sender;

@end