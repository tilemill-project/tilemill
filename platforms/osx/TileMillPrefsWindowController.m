//
//  TileMillPrefsWindowController.m
//  TileMill
//
//  Created by Justin Miller on 8/15/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillPrefsWindowController.h"

@implementation TileMillPrefsWindowController

- (void)awakeFromNib
{
    [[self window] center];
}

#pragma mark -

- (NSString *)lastUpdateCheckString
{
    if ([[NSUserDefaults standardUserDefaults] objectForKey:@"SULastCheckTime"])
    {
        NSDateFormatter *formatter = [[[NSDateFormatter alloc] init] autorelease];
        
        [formatter setDateStyle:NSDateFormatterLongStyle];
        [formatter setTimeStyle:NSDateFormatterShortStyle];
        
        return [NSString stringWithFormat:@"Last checked %@", [formatter stringFromDate:[[NSUserDefaults standardUserDefaults] objectForKey:@"SULastCheckTime"]]];
    }

    return @"Never checked";
}

#pragma mark -
#pragma mark NSWindowDelegate

- (void)windowWillClose:(NSNotification *)notification
{
    [[self window] makeFirstResponder:nil];
}

@end