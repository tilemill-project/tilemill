//
//  MBTiles.h
//  MBTilesQuickLook
//
//  Created by Käfer Konstantin on 04.08.11.
//  Copyright 2011 Development Seed, Inc. All rights reserved.
//

#include <Foundation/Foundation.h>

#import "FMDatabase.h"

@interface MBTiles : NSObject {
    FMDatabase *db;
    double bounds[4];
    double center[2];
    int centerZoom;
    int minZoom;
    int maxZoom;
}

// Accessors
- (int) minZoom;
- (int) maxZoom;
- (int) centerZoom;
- (double) centerLatitude;
- (double) centerLongitude;

- (NSString *)bounds;
- (void)setBounds:(NSString *)boundsString;
- (NSString *)center;
- (void)setCenter:(NSString *)centerString;


// Instance methods
- (void)loadInfo;
- (void)estimateCenter;
- (void)loadBounds;
- (void)loadMinZoom;
- (void)loadMaxZoom;
- (void)loadCenter;
- (NSData *)tileAtZoom:(int)z column:(int)x row:(int)y;
- (NSData *)centerTile;


// Class methods
+ (double)longitudeFromX:(int)x zoom:(int)z;
+ (double)latitudeFromY:(int)y zoom:(int)z;
+ (int)xFromLongitude:(double)lon zoom:(int)z;
+ (int)yFromLatitude:(double)lat zoom:(int)z;

// Class initializers
+ (id)withPath:(NSString*)aPath;
+ (id)withURL:(CFURLRef)url;

@end
