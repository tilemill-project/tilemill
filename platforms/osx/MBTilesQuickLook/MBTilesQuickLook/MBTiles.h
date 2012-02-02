//
//  MBTiles.h
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
