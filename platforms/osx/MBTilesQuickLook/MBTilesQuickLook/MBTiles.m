//
//  MBTiles.m
//  MBTilesQuickLook
//
//  Created by Käfer Konstantin on 04.08.11.
//  Copyright 2011 Development Seed, Inc. All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//  
//      * Redistributions of source code must retain the above copyright
//        notice, this list of conditions and the following disclaimer.
//  
//      * Redistributions in binary form must reproduce the above copyright
//        notice, this list of conditions and the following disclaimer in the
//        documentation and/or other materials provided with the distribution.
//  
//      * Neither the name of Development Seed, Inc. nor the names of its 
//        contributors may be used to endorse or promote products derived from 
//        this software without specific prior written permission.
//  
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
//  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
//  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
//  ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
//  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
//  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
//  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
//  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
//  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

#import "MBTiles.h"

@implementation MBTiles

const int maxZoomLevel = 23;

+ (id)withPath:(NSString*)path
{
    return [[self alloc] initWithPath:path];
}

+ (id)withURL:(CFURLRef)url
{
    CFStringRef path_ref = CFURLCopyFileSystemPath(url, kCFURLPOSIXPathStyle);
    return [[self alloc] initWithPath:(__bridge NSString*)path_ref];
}

- (id)initWithPath:(NSString*)aPath
{
    self = [super init];
    if (self) {
        db = [FMDatabase databaseWithPath:(NSString*)aPath];
        if (![db open]) {
            return nil;
        }
        [self loadInfo];
    }
    
    return self;
}

- (void)loadInfo
{
    bounds[0] = -180.0;
    bounds[1] = -85.05112877980659;
    bounds[2] = 180.0;
    bounds[3] = 85.05112877980659;
    
    center[0] = 0.0;
    center[1] = 0.0;
    centerZoom = -1;
    
    minZoom = -1;
    maxZoom = maxZoomLevel;
    
    [self loadMinZoom];
    [self loadMaxZoom];
    [self loadCenter];
    [self loadBounds];
    
    // Estimate center when we don't have an explicit center yet.
    if (centerZoom < 0) {
        [self estimateCenter];
    }
}

- (void)loadBounds
{
    FMResultSet *results = [db executeQuery:@"SELECT value FROM metadata WHERE name = 'bounds'"];
    if (![db hadError]) {
        if ([results next]) {
            [self setBounds:[results stringForColumnIndex:0]];
        }
        [results close];
    }
}

- (void) loadMinZoom
{
    FMResultSet *results = [db executeQuery:@"SELECT MIN(zoom_level) FROM tiles"];
    if (![db hadError]) {
        if ([results next]) minZoom = [results intForColumnIndex:0];
        [results close];
    }
}

- (void) loadMaxZoom 
{
    FMResultSet *results = [db executeQuery:@"SELECT MAX(zoom_level) FROM tiles"];
    if (![db hadError]) {
        if ([results next]) maxZoom = [results intForColumnIndex:0];
        [results close];
    }
}

- (void) loadCenter
{
    FMResultSet *results = [db executeQuery:@"SELECT value FROM metadata WHERE name = 'center'"];
    if (![db hadError]) {
        if ([results next]) [self setCenter:[results stringForColumnIndex:0]];
        [results close];
    }
}

- (NSData *) tileAtZoom:(int)z column:(int)x row:(int)y
{
    // Interface is xyz, but MBTiles files are tms.
    y = (1 << z) - 1 - y;
    
    FMResultSet *tile = [db executeQuery:@"SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?", 
                         [NSNumber numberWithInt:z], 
                         [NSNumber numberWithInt:x], 
                         [NSNumber numberWithInt:y]];
    
    if (![db hadError]) {
        if ([tile next]) {
            return [tile dataForColumnIndex:0];
        }
    }
    return nil;
}

- (NSData *)centerTile
{
    int centerTileZoom = minZoom + (double)(maxZoom - minZoom) * 0.5;
    return [self
            tileAtZoom:centerTileZoom
            column:[MBTiles xFromLongitude:[self centerLongitude] zoom:centerTileZoom]
            row:[MBTiles yFromLatitude:[self centerLatitude] zoom:centerTileZoom]];
}

- (void) setBounds:(NSString *)boundsString
{
    if (bounds) {
        NSArray *parts = [boundsString componentsSeparatedByString:@","];
        
        if ([parts count] == 4) {
            bounds[0] = [[parts objectAtIndex:0] doubleValue];
            bounds[1] = [[parts objectAtIndex:1] doubleValue];
            bounds[2] = [[parts objectAtIndex:2] doubleValue];
            bounds[3] = [[parts objectAtIndex:3] doubleValue];
        }
    }
}

- (NSString *) bounds
{
    return [NSString stringWithFormat:@"%f,%f,%f,%f", bounds[0], bounds[1], bounds[2], bounds[3]];
}

- (void) setCenter:(NSString *)centerString
{
    if (centerString) {
        NSArray *parts = [centerString componentsSeparatedByString:@","];
        if ([parts count] == 3) {
            center[0] = [[parts objectAtIndex:0] doubleValue];
            center[1] = [[parts objectAtIndex:1] doubleValue];
            centerZoom = [[parts objectAtIndex:2] intValue];
        }
    }
}

- (NSString *) center
{
    return [NSString stringWithFormat:@"%f,%f,%d", center[1], center[0], centerZoom];
}

- (void) estimateCenter
{
    int range = maxZoom - minZoom;
    centerZoom = minZoom + range * 0.5;
    int estimateZoom = MAX(minZoom, maxZoom - 1);
    
    int max = (1 << estimateZoom) - 1;
    int minX = 0, maxX = max;
    int minY = 0, maxY = max;
    
    FMResultSet *results;
    results = [db executeQuery:@"SELECT MIN(tile_column) FROM tiles WHERE zoom_level = ?",
               [NSNumber numberWithInt:estimateZoom]];
    if (![db hadError]) {
        if ([results next]) minX = [results intForColumnIndex:0];
        [results close];
    }
    
    results = [db executeQuery:@"SELECT MAX(tile_column) FROM tiles WHERE zoom_level = ?",
               [NSNumber numberWithInt:estimateZoom]];
    if (![db hadError]) {
        if ([results next]) maxX = [results intForColumnIndex:0];
        [results close];
    }
    
    results = [db executeQuery:@"SELECT MIN(tile_row) FROM tiles WHERE zoom_level = ? AND tile_column = ?",
               [NSNumber numberWithInt:estimateZoom],
               [NSNumber numberWithInt:minX + (maxX - minX) / 2]];
    if (![db hadError]) {
        if ([results next]) maxY = max - [results intForColumnIndex:0];
        [results close];
    }
    
    results = [db executeQuery:@"SELECT MAX(tile_row) FROM tiles WHERE zoom_level = ? AND tile_column = ?",
               [NSNumber numberWithInt:estimateZoom],
               [NSNumber numberWithInt:minX + (maxX - minX) / 2]];
    if (![db hadError]) {
        if ([results next]) minY = max - [results intForColumnIndex:0];
        [results close];
    }
    
    // Now that we have minX/maxX/minY/maxY, convert them to lat/lon and set the center coordinates.
    double west = [MBTiles longitudeFromX:minX zoom:estimateZoom];
    double east = [MBTiles longitudeFromX:maxX zoom:estimateZoom];
    double south = [MBTiles latitudeFromY:maxY zoom:estimateZoom];
    double north = [MBTiles latitudeFromY:minY zoom:estimateZoom];
    
    center[0] = (east - west) / 2 + west;
    center[1] = (north - south) / 2 + south;
}

- (int) minZoom { return minZoom; }
- (int) maxZoom { return maxZoom; }
- (int) centerZoom { return centerZoom; }
- (double) centerLongitude { return center[0]; }
- (double) centerLatitude { return center[1]; }


// From http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#C.2FC.2B.2B
+ (double)longitudeFromX:(int)x zoom:(int)z
{
	return x / pow(2.0, z) * 360.0 - 180;
}

+ (double)latitudeFromY:(int)y zoom:(int)z
{
	double n = M_PI - 2.0 * M_PI * y / pow(2.0, z);
	return 180.0 / M_PI * atan(0.5 * (exp(n) - exp(-n)));
}

+ (int)xFromLongitude:(double)lon zoom:(int)z
{ 
	return (int)(floor((lon + 180.0) / 360.0 * pow(2.0, z)));
}

+ (int)yFromLatitude:(double)lat zoom:(int)z;
{ 
    return (int)(floor((1.0 - log(tan(lat * M_PI/180.0) + 1.0 / cos(lat * M_PI/180.0)) / M_PI) / 2.0 * pow(2.0, z)));
}


@end
