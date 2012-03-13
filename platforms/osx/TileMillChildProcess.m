//
//  TileMillChildProcess.m
//  TileMill
//
//  Created by Will White on 8/2/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillChildProcess.h"

@interface TileMillChildProcess ()

@property (nonatomic, retain) NSTask *task;
@property (nonatomic, retain) NSString *basePath;
@property (nonatomic, retain) NSString *command;
@property (nonatomic, assign, getter=isLaunched) BOOL launched;

- (void)receivedData:(NSNotification *)notification;

@end

#pragma mark -

@implementation TileMillChildProcess

@synthesize delegate;
@synthesize task;
@synthesize basePath;
@synthesize command;
@synthesize launched;
@synthesize port;

- (id)initWithBasePath:(NSString *)inBasePath command:(NSString *)inCommand
{
    self = [super init];
    
    if (self)
    {
        basePath = [inBasePath retain];
        command  = [inCommand retain];
    }

    return self;
}

- (void)dealloc
{
    [self stopProcess];

    [task release];
    [basePath release];
    [command release];

    [super dealloc];
}

#pragma mark -

- (void)startProcess
{
    if ([(id <NSObject>)self.delegate respondsToSelector:@selector(childProcessDidStart:)])
        [self.delegate childProcessDidStart:self];
 
    self.task = [[[NSTask alloc] init] autorelease];
    
    [self.task setStandardOutput:[NSPipe pipe]];
    [self.task setStandardError:[self.task standardOutput]];
    [self.task setCurrentDirectoryPath:self.basePath];
    [self.task setLaunchPath:self.command];
    
    [[NSNotificationCenter defaultCenter] addObserver:self 
                                             selector:@selector(receivedData:) 
                                                 name:NSFileHandleReadCompletionNotification 
                                               object:[[self.task standardOutput] fileHandleForReading]];
    
    [[[self.task standardOutput] fileHandleForReading] readInBackgroundAndNotify];
    
    [self.task launch];
}

- (void)stopProcess
{
    [[NSNotificationCenter defaultCenter] removeObserver:self 
                                                    name:NSFileHandleReadCompletionNotification 
                                                  object:[[self.task standardOutput] fileHandleForReading]];

    // @TODO - check if [self.task isRunning] before terminating?
    [self.task terminate];
    [self.task waitUntilExit];

    int status = [self.task terminationStatus];
    if (status != 0)
    {
        NSTaskTerminationReason reason = [self.task terminationReason];
        // TODO - catch signals and display crash/spin log from DiagosticReports
        // http://cocoawithlove.com/2010/05/handling-unhandled-exceptions-and.html
        if (reason == 2) // uncaught signal
        {
            if ([(id <NSObject>)self.delegate respondsToSelector:@selector(childProcess:didCrash:)])
                [self.delegate childProcess:self didCrash:@"TileMill child process crashed on unhandled signal: please report to: https://github.com/mapbox/tilemill/issues\n"];
        }
    }

    if ([(id <NSObject>)self.delegate respondsToSelector:@selector(childProcessDidFinish:)])
    {
        [self.delegate childProcessDidFinish:self];
    }
}

- (void)receivedData:(NSNotification *)notification
{
    NSData *data = [[notification userInfo] objectForKey:NSFileHandleNotificationDataItem];
    
    if ([data length])
    {
        NSString *message = [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];

        if ([(id <NSObject>)self.delegate respondsToSelector:@selector(childProcess:didSendOutput:)])
            [self.delegate childProcess:self didSendOutput:message];
        
        if ([message hasPrefix:@"Started [Server Core"] && ! self.isLaunched)
        {
            self.launched = YES;
            NSScanner *aScanner = [NSScanner scannerWithString:message];
            NSInteger aPort;
            [aScanner scanString:@"Started [Server Core:" intoString:NULL];
            [aScanner scanInteger:&aPort];
            self.port = aPort;
            
            if ([(id <NSObject>)self.delegate respondsToSelector:@selector(childProcessDidSendFirstData:)])
                [self.delegate childProcessDidSendFirstData:self];
        }
    }
    else
    {
        [self stopProcess];
    }
    
    [[notification object] readInBackgroundAndNotify];  
}

@end