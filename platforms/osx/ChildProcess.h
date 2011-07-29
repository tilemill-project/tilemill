
#import <Foundation/Foundation.h>

@protocol ChildProcessController

- (void)appendOutput:(NSString *)output;

- (void)processStarted;

- (void)processFinished;

- (void)firstData;


@end


@interface ChildProcess : NSObject {
    NSTask             *task;
    id                 <ChildProcessController>controller;
    NSArray            *arguments;
    bool               launched;
}

- (id)initWithController:(id <ChildProcessController>)controller arguments:(NSArray *)args;

- (void) startProcess;

- (void) stopProcess;

@end

