
#import <Foundation/Foundation.h>

@protocol ChildProcessController

- (void)appendOutput:(NSString *)output;

- (void)processStarted;

- (void)processFinished;

- (void)firstData;


@end


@interface ChildProcess : NSObject {
    NSTask *task;
    id <ChildProcessController> delegate;
    NSString *basePath;
    NSString *command;
    bool launched;
}

@property (nonatomic, assign) id <ChildProcessController> delegate;

- (id)initWithBasePath:(NSString *)basePath command:(NSString *)command;

- (void) startProcess;

- (void) stopProcess;

@end

