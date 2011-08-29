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

@implementation TileMillAppDelegate

- (void)dealloc {
    [mainWindowController release];
    [logPath release];
    [prefsController release];
    [super dealloc];
}

- (void)startTileMill {
    if (![[NSBundle mainBundle] URLForResource:@"node" withExtension:@""]) {
        NSLog(@"node is missing.");
        [NSApp terminate:nil];
    }
    // Look for orphan node processes from previous crashes.
    NSURL *nodeExecURL = [[NSBundle mainBundle] URLForResource:@"node" withExtension:@""];
    NSArray *applications = [[NSWorkspace sharedWorkspace] runningApplications];
    for (NSRunningApplication *app in applications) {
        if ([[app executableURL] isEqual:nodeExecURL]) {
            if (![app forceTerminate]) {
                [self writeToLog:@"Failed to terminate orphan tilemill process."];
            }
        }
    }

    if (searchTask) {
        [searchTask release];
        searchTask = nil;
    }
    NSString *base_path = [[NSBundle mainBundle] resourcePath];
    NSString *command = [NSString stringWithFormat:@"%@/index.js", base_path];
    searchTask = [[TileMillChildProcess alloc] initWithBasePath:base_path command:command];
    [searchTask setDelegate:self];
    [searchTask startProcess];
}

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
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
    logPath = [[NSHomeDirectory() stringByAppendingPathComponent:@"Library/Logs/TileMill.log"] retain];
    [self showMainWindow:self];
    mainWindowController.childRunning = NO;
    [self startTileMill];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)tilemillAppDelegate {
    return YES;
}

- (void)applicationWillTerminate:(NSNotification *)aNotification {
    [[NSUserDefaults standardUserDefaults] synchronize];
    appTerminating = YES;
    // This doesn't run when app is forced to quit, so the child process is left running.
    // We clean up any orphan processes in [self startTileMill].
    [searchTask stopProcess];
    [searchTask release];
    searchTask = nil;
}

- (IBAction)showMainWindow:(id)sender
{
    if ( ! mainWindowController)
        mainWindowController = [[TileMillMainWindowController alloc] init];
    
    [mainWindowController showWindow:self];
}

- (void)writeToLog:(NSString *)message {
    if (![[NSFileManager defaultManager] fileExistsAtPath:logPath]) {
        NSError *error;
        if (![@"" writeToFile:logPath atomically:YES encoding:NSUTF8StringEncoding error:&error]) {
            NSLog(@"Error creating log file at %@.", logPath);
        }
    }
    NSFileHandle *logFile = [NSFileHandle fileHandleForWritingAtPath:logPath];
    [logFile seekToEndOfFile];
    [logFile writeData:[message dataUsingEncoding:NSUTF8StringEncoding]];
    [logFile closeFile];
}

#pragma MainMenu IBActions

- (IBAction)openDirectory:(id)sender
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
    [[NSWorkspace sharedWorkspace] openFile:logPath withApplication:@"Console" andDeactivate:YES];
}

- (IBAction)openPreferences:(id)sender
{
    if ( ! prefsController)
        prefsController = [[TileMillPrefsWindowController alloc] initWithWindowNibName:@"TileMillPrefsWindow"];
    
    [prefsController showWindow:self];
}

#pragma ChildProcessDelegate Methods

- (void)childProcess:(TileMillChildProcess *)process didSendOutput:(NSString *)output
{
    [self writeToLog:output];
}

- (void)childProcessDidStart:(TileMillChildProcess *)process
{
//    NSLog(@"Process started.");
}

- (void)childProcessDidFinish:(TileMillChildProcess *)process
{
    mainWindowController.childRunning = NO;
    NSLog(@"Finished");
    if (!appTerminating) {
        // We're not shutting down so the app crashed. Restart it.
        NSLog(@"Restart");
        [self startTileMill];
    }
}

- (void)childProcessDidSendFirstData:(TileMillChildProcess *)process;
{
    mainWindowController.childRunning = YES;
}

@end
