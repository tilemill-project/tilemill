//
//  TileMillPrefsWindowController.h
//  tilemill
//
//  Created by Justin Miller on 8/15/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@interface TileMillPrefsWindowController : NSWindowController
{
    BOOL needsRestart;
}

- (IBAction)clickedFilesPathButton:(id)sender;

@end