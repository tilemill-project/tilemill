
#import <Foundation/Foundation.h>

@class ChildProcess;

@protocol ChildProcessDelegate

- (void)childProcess:(ChildProcess *)process didSendOutput:(NSString *)output;

- (void)childProcessDidStart:(ChildProcess *)process;

- (void)childProcessDidFinish:(ChildProcess *)process;

- (void)childProcessDidSendFirstData:(ChildProcess *)process;

@end


@interface ChildProcess : NSObject {
    NSTask *task;
    id <ChildProcessDelegate> delegate;
    NSString *basePath;
    NSString *command;
    bool launched;
}

@property (nonatomic, assign) id <ChildProcessDelegate> delegate;

- (id)initWithBasePath:(NSString *)basePath command:(NSString *)command;

- (void) startProcess;

- (void) stopProcess;

@end
