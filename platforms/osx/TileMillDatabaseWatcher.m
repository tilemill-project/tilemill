//
//  TileMillDatabaseWatcher.m
//  TileMill
//
//  Created by Justin R. Miller on 8/26/13.
//  Copyright 2013 MapBox, Inc. All rights reserved.
//

#import "TileMillDatabaseWatcher.h"

@interface TileMillDatabaseWatcher ()

@property (nonatomic, strong) NSFileHandle *fileHandle;
@property (nonatomic, strong) NSMutableDictionary *exports;

@end

#pragma mark -

@implementation TileMillDatabaseWatcher

@synthesize fileHandle;
@synthesize exports;

- (id)init
{
    self = [super init];

    if (self)
        [self performSelector:@selector(beginWatching:) withObject:nil afterDelay:5.0];

    return self;
}

- (void)beginWatching:(id)sender
{
    NSString *configPath   = [NSString stringWithFormat:@"%@/.tilemill/config.json", NSHomeDirectory()];
    NSDictionary *config   = [NSJSONSerialization JSONObjectWithData:[NSData dataWithContentsOfFile:configPath] options:0 error:nil];
    NSString *configPrefix = ([config valueForKey:@"files"] ? [config valueForKey:@"files"] : [NSHomeDirectory() stringByAppendingString:@"/Documents/MapBox"]);
    NSString *databasePath = [NSString stringWithFormat:@"%@/app.db", configPrefix];

    if ([[NSFileManager defaultManager] fileExistsAtPath:databasePath])
    {
        self.fileHandle = [NSFileHandle fileHandleForReadingAtPath:databasePath];

        [self.fileHandle seekToEndOfFile];

        self.exports = [NSMutableDictionary dictionary];

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(processData:)
                                                     name:NSFileHandleDataAvailableNotification
                                                   object:self.fileHandle];

        [self.fileHandle waitForDataInBackgroundAndNotify];
    }
}

- (void)processData:(NSNotification *)notification
{
    [self.fileHandle waitForDataInBackgroundAndNotify];

    NSData *availableData = [self.fileHandle availableData];

    if ([availableData isEqual:[NSData data]])
        return;

    NSDictionary *info = [NSJSONSerialization JSONObjectWithData:availableData options:0 error:nil];

    if (info)
    {
        if ([[self.exports allKeys] containsObject:info[@"key"]] && [info[@"val"][@"status"] isEqualToString:@"complete"])
        {
            // export complete
            //
            if (NSClassFromString(@"NSUserNotification"))
            {
                // notify user on 10.8+
                //
                NSUserNotification *userNotification = [NSUserNotification new];

                userNotification.title    = [NSString stringWithFormat:@"Export complete for %@", info[@"val"][@"project"]];
                userNotification.subtitle = info[@"val"][@"filename"];

                [[NSUserNotificationCenter defaultUserNotificationCenter] deliverNotification:userNotification];
            }

            if ([NSProcessInfo instancesRespondToSelector:@selector(endActivity:)])
            {
                // end background activity on 10.9+
                //
                [[NSProcessInfo processInfo] endActivity:info[@"val"][@"NSProcessInfo"]];
            }

            [self.exports removeObjectForKey:info[@"key"]];
        }
        else if ([[self.exports allKeys] containsObject:info[@"key"]] && [info[@"val"][@"status"] isEqualToString:@"error"])
        {
            // export error
            //
            if (NSClassFromString(@"NSUserNotification"))
            {
                // notify user on 10.8+
                //
                NSUserNotification *userNotification = [NSUserNotification new];

                userNotification.title    = [NSString stringWithFormat:@"Export failed for %@", info[@"val"][@"project"]];
                userNotification.subtitle = [NSString stringWithFormat:@"Error during export of %@", info[@"val"][@"filename"]];

                [[NSUserNotificationCenter defaultUserNotificationCenter] deliverNotification:userNotification];
            }

            if ([NSProcessInfo instancesRespondToSelector:@selector(endActivity:)])
            {
                // end background activity on 10.9+
                //
                [[NSProcessInfo processInfo] endActivity:info[@"val"][@"NSProcessInfo"]];
            }

            [self.exports removeObjectForKey:info[@"key"]];
        }
        else if ( ! [[self.exports allKeys] containsObject:info[@"key"]] && ([info[@"val"][@"status"] isEqualToString:@"waiting"] || [info[@"val"][@"status"] isEqualToString:@"processing"]))
        {
            // new export
            //
            NSMutableDictionary *details = [NSMutableDictionary dictionaryWithDictionary:info[@"val"]];

            if ([NSProcessInfo instancesRespondToSelector:@selector(beginActivityWithOptions:reason:)])
            {
                // begin background activity on 10.9+
                //
                id <NSObject>activity = [[NSProcessInfo processInfo] beginActivityWithOptions:NSActivityUserInitiatedAllowingIdleSystemSleep
                                                                                       reason:[NSString stringWithFormat:@"exporting %@ for %@", info[@"val"][@"filename"], info[@"val"][@"project"]]];

                [details setObject:activity forKey:@"NSProcessInfo"];
            }

            [self.exports setObject:details forKey:info[@"key"]];
        }

        // badge dock with export count
        //
        if ([[[NSApp dockTile] badgeLabel] integerValue] != [self.exports count])
            [[NSApp dockTile] setBadgeLabel:([self.exports count] ? [NSString stringWithFormat:@"%lu", [self.exports count]] : nil)];
    }
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [self.fileHandle closeFile];
}

@end