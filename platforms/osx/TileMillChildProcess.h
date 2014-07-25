//
//  TileMillChildProcess.h
//  TileMill
//
//  Copyright 2011-2014 Mapbox, Inc. All rights reserved.
//

@class TileMillChildProcess;

@protocol TileMillChildProcessDelegate <NSObject>

@optional

- (void)childProcessDidStart:(TileMillChildProcess *)process;
- (void)childProcessDidSendFirstData:(TileMillChildProcess *)process;
- (void)childProcess:(TileMillChildProcess *)process didSendOutput:(NSString *)output;
- (void)childProcess:(TileMillChildProcess *)process didCrash:(NSString *)output;
- (void)childProcessDidFinish:(TileMillChildProcess *)process;

@end

#pragma mark -

@interface TileMillChildProcess : NSObject

@property (nonatomic, unsafe_unretained) id <TileMillChildProcessDelegate> delegate;
@property (nonatomic, readonly, assign, getter=isLaunched) BOOL launched;
@property (nonatomic, assign) NSInteger port;

- (id)initWithBasePath:(NSString *)inBasePath command:(NSString *)inCommand;
- (void)startProcess;
- (void)stopProcess;

@end