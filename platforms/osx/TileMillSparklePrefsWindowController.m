//
//  TileMillSparklePrefsWindowController.m
//  TileMill
//
//  Created by Justin Miller on 8/15/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillSparklePrefsWindowController.h"

#import <Sparkle/Sparkle.h>

@implementation TileMillSparklePrefsWindowController

- (id)initWithWindowNibName:(NSString *)windowNibName
{
    self = [super initWithWindowNibName:windowNibName];
    
    if (self)
        [[NSNotificationCenter defaultCenter] addObserverForName:NSUserDefaultsDidChangeNotification
                                                          object:[NSUserDefaults standardUserDefaults]
                                                           queue:[NSOperationQueue mainQueue]
                                                      usingBlock:^(NSNotification *notification)
                                                      {
                                                          /*
                                                           * This routine makes sure the feed URL is updated when the dev/live
                                                           * preference is changed, since they are tied. The feed URL is updated
                                                           * in the running process, as well as automatically in the user's 
                                                           * defaults by the Sparkle engine.
                                                           */
                                                          
                                                          NSUserDefaults *defaults = [notification object];
                                                          SUUpdater *updater = [SUUpdater sharedUpdater];
                                                          
                                                          if ([defaults boolForKey:@"installDevBuilds"] && ! [[updater feedURL] isEqual:TileMillDevelopmentAppcastURL])
                                                              [updater setFeedURL:TileMillDevelopmentAppcastURL];
                                                          
                                                          else if ( ! [defaults boolForKey:@"installDevBuilds"] && ! [[updater feedURL] isEqual: TileMillProductionAppcastURL])
                                                              [updater setFeedURL:TileMillProductionAppcastURL];
                                                      }];

    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self name:NSUserDefaultsDidChangeNotification object:nil];
    
    [super dealloc];
}

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
        
        return [NSString stringWithFormat:@"Checked %@", [formatter stringFromDate:[[NSUserDefaults standardUserDefaults] objectForKey:@"SULastCheckTime"]]];
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