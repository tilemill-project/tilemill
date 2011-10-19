//
//  TileMillPrefsWindowController.h
//  TileMill
//
//  Created by Justin Miller on 8/15/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

@interface TileMillPrefsWindowController : NSWindowController <NSWindowDelegate>
{
    BOOL needsRestart;
}

- (IBAction)clickedFilesPathButton:(id)sender;

@end