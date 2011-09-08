//
//  TileMillAppDelegate.h
//  tilemill
//
//  Created by Dane Springmeyer on 7/28/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillChildProcess.h"

@interface TileMillAppDelegate : NSObject <TileMillChildProcessDelegate>
{
}

- (IBAction)openDocumentsFolder:(id)sender;
- (IBAction)openHelp:(id)sender;
- (IBAction)openDiscussions:(id)sender;
- (IBAction)openKnowledgeBase:(id)sender;
- (IBAction)openConsole:(id)sender;
- (IBAction)openPreferences:(id)sender;
- (IBAction)showMainWindow:(id)sender;

@end