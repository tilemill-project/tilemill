//
//  TileMillChildProcess.h
//  tilemill
//
//  Created by Will White on 8/2/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import <Foundation/Foundation.h>

@class TileMillChildProcess;

@protocol TileMillChildProcessDelegate

- (void)childProcess:(TileMillChildProcess *)process didSendOutput:(NSString *)output;

- (void)childProcessDidStart:(TileMillChildProcess *)process;

- (void)childProcessDidFinish:(TileMillChildProcess *)process;

- (void)childProcessDidSendFirstData:(TileMillChildProcess *)process;

@end


@interface TileMillChildProcess : NSObject {
    NSTask *task;
    id <TileMillChildProcessDelegate> delegate;
    NSString *basePath;
    NSString *command;
    BOOL launched;
}

@property (nonatomic, assign) id <TileMillChildProcessDelegate> delegate;
@property (nonatomic, readonly, assign) BOOL launched;

- (id)initWithBasePath:(NSString *)basePath command:(NSString *)command;

- (void) startProcess;

- (void) stopProcess;

@end
