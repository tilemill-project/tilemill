//
//  TileMillAppDelegate.m
//  tilemill
//
//  Created by Dane Springmeyer on 7/28/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillAppDelegate.h"
#import "TileMillMainWindowController.h"
#import "TileMillPrefsWindowController.h"

#import "JSONKit.h"

@interface TileMillAppDelegate ()

- (void)startTileMill;
- (void)stopTileMill;
- (void)writeToLog:(NSString *)message;
- (void)presentFatalError;

@property (nonatomic, retain) TileMillChildProcess *searchTask;
@property (nonatomic, retain) TileMillMainWindowController *mainWindowController;
@property (nonatomic, retain) TileMillPrefsWindowController *prefsController;
@property (nonatomic, retain) NSString *logPath;
@property (nonatomic, assign) BOOL shouldAttemptRestart;
@property (nonatomic, assign) BOOL fatalErrorCaught;

@end
   
#pragma mark -

@implementation TileMillAppDelegate

@synthesize searchTask;
@synthesize mainWindowController;
@synthesize prefsController;
@synthesize logPath;
@synthesize shouldAttemptRestart;
@synthesize fatalErrorCaught;

- (void)dealloc
{
    [searchTask release];
    [mainWindowController release];
    [prefsController release];
    [logPath release];

    [super dealloc];
}

#pragma mark -

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
    // used defaults shared between TileMill core & OS X (see #622)
    //
    NSString *jsonDefaults = [NSString stringWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"config.defaults" ofType:@"json"]
                                                       encoding:NSUTF8StringEncoding
                                                          error:NULL];
    
    NSAssert(jsonDefaults, @"JSON file containing shared defaults not found");
    
    id json = [jsonDefaults objectFromJSONString];
    
    NSAssert([json isKindOfClass:[NSDictionary class]], @"JSON file containing shared defaults not formatted as expected");

    int serverPort = [[json objectForKey:@"port"]       intValue];
    int bufferSize = [[json objectForKey:@"bufferSize"] intValue];

    NSString *filesPath = [[json objectForKey:@"files"] stringByExpandingTildeInPath];
    
    [[NSUserDefaults standardUserDefaults] registerDefaults:[NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithInt:serverPort], @"serverPort",
                                                                                                       [NSNumber numberWithInt:bufferSize], @"bufferSize",
                                                                                                       filesPath,                           @"filesPath", 
                                                                                                       nil]];
    
    // setup logging & fire up main functionality
    //
    self.logPath = [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Logs/TileMill.log"];

    self.mainWindowController.childRunning = NO;
    
    [self showMainWindow:self];
    [self startTileMill];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)tilemillAppDelegate
{
    return YES;
}

- (void)applicationWillTerminate:(NSNotification *)notification
{
    [[NSUserDefaults standardUserDefaults] synchronize];
    
    self.shouldAttemptRestart = NO;

    // This doesn't run when app is forced to quit, so the child process is left running.
    // We clean up any orphan processes in [self startTileMill].
    //
    [self stopTileMill];
}

#pragma mark -

- (void)startTileMill
{
    NSURL *nodeExecURL = [[NSBundle mainBundle] URLForResource:@"node" withExtension:@""];

    if ( ! nodeExecURL)
    {
        NSLog(@"node is missing.");

        [self presentFatalError];
    }
    
    // Look for orphan node processes from previous crashes.
    //
    for (NSRunningApplication *app in [[NSWorkspace sharedWorkspace] runningApplications])
        if ([[app executableURL] isEqual:nodeExecURL])
            if ( ! [app forceTerminate])
                [self writeToLog:@"Failed to terminate orphan tilemill process."];
    
    if (self.searchTask)
        self.searchTask = nil;

    self.shouldAttemptRestart = YES;

    NSString *command = [NSString stringWithFormat:@"%@/index.js", [[NSBundle mainBundle] resourcePath]];
    
    self.searchTask = [[TileMillChildProcess alloc] initWithBasePath:[[NSBundle mainBundle] resourcePath] command:command];
    
    [self.searchTask setDelegate:self];
    [self.searchTask startProcess];
}

- (void)stopTileMill
{
    if (self.searchTask)
    {
        if (self.searchTask.launched)
            [self.searchTask stopProcess];
        
        self.searchTask = nil;
    }
}

- (IBAction)showMainWindow:(id)sender
{
    if ( ! self.mainWindowController)
        self.mainWindowController = [[[TileMillMainWindowController alloc] initWithWindowNibName:@"TileMillMainWindow"] autorelease];
    
    [self.mainWindowController showWindow:self];
}

- (void)writeToLog:(NSString *)message
{
    if ( ! [[NSFileManager defaultManager] fileExistsAtPath:self.logPath])
    {
        NSError *error = nil;
        
        if ( ! [@"" writeToFile:self.logPath atomically:YES encoding:NSUTF8StringEncoding error:&error])
            NSLog(@"Error creating log file at %@.", self.logPath);
    }
    
    NSFileHandle *logFile = [NSFileHandle fileHandleForWritingAtPath:logPath];
    
    [logFile seekToEndOfFile];
    [logFile writeData:[message dataUsingEncoding:NSUTF8StringEncoding]];
    [logFile closeFile];
}

- (void)presentFatalError
{
    NSAlert *alert = [NSAlert alertWithMessageText:@"There was a problem trying to start the server process"
                                     defaultButton:@"OK"
                                   alternateButton:@"Contact Support"
                                       otherButton:nil
                         informativeTextWithFormat:@"TileMill experienced a fatal error while trying to start the server process. Please restart the application. If this persists, please contact support."];
    
    NSInteger status = [alert runModal];
    
    if (status == NSAlertAlternateReturn)
        [self openDiscussions:self];
    
    self.shouldAttemptRestart = NO;
    
    [self stopTileMill];
}

#pragma mark -

- (IBAction)openDocumentsFolder:(id)sender
{
    [[NSWorkspace sharedWorkspace] openFile:[[NSUserDefaults standardUserDefaults] stringForKey:@"filesPath"]];
}

- (IBAction)openHelp:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%i/#!/manual", [[NSUserDefaults standardUserDefaults] integerForKey:@"serverPort"]]]];
}

- (IBAction)openDiscussions:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://support.mapbox.com/discussions/tilemill"]];
}

- (IBAction)openKnowledgeBase:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://support.mapbox.com/kb/tilemill"]];
}

- (IBAction)openConsole:(id)sender
{
    [[NSWorkspace sharedWorkspace] openFile:self.logPath withApplication:@"Console" andDeactivate:YES];
}

- (IBAction)openPreferences:(id)sender
{
    if ( ! self.prefsController)
        self.prefsController = [[[TileMillPrefsWindowController alloc] initWithWindowNibName:@"TileMillPrefsWindow"] autorelease];
    
    [self.prefsController showWindow:self];
}

#pragma mark -

- (void)childProcess:(TileMillChildProcess *)process didSendOutput:(NSString *)output
{
    [self writeToLog:output];
    
    if ([[NSPredicate predicateWithFormat:@"SELF contains 'EADDRINUSE'"] evaluateWithObject:output])
    {
        // port in use error
        //
        NSAlert *alert = [NSAlert alertWithMessageText:@"Port already in use"
                                         defaultButton:@"OK"
                                       alternateButton:nil
                                           otherButton:nil
                             informativeTextWithFormat:@"Port %@ is already in use by another application on the system. Please change either that application or TileMill's preference, then relaunch TileMill.", [[NSUserDefaults standardUserDefaults] objectForKey:@"serverPort"]];
        
        [alert runModal];
    
        self.shouldAttemptRestart = NO;
        
        [self stopTileMill];
    }
    else if (self.fatalErrorCaught)
    {
        // generic fatal error
        //
        [self presentFatalError];
    }
    else if ([[NSPredicate predicateWithFormat:@"SELF contains 'throw e; // process'"] evaluateWithObject:output])
    {
        // We noticed a fatal error, so let's mark it, but not do
        // anything yet. Let's get more output so that we can 
        // further evaluate & act accordingly.

        self.fatalErrorCaught = YES;
    }
}

- (void)childProcessDidFinish:(TileMillChildProcess *)process
{
    self.mainWindowController.childRunning = NO;
    
    NSLog(@"Finished");
    
    if (self.shouldAttemptRestart)
    {
        NSLog(@"Restart");

        [self startTileMill];
    }
}

- (void)childProcessDidSendFirstData:(TileMillChildProcess *)process;
{
    self.mainWindowController.childRunning = YES;
}

@end