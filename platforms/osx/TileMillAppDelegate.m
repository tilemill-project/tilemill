//
//  TileMillAppDelegate.m
//  TileMill
//
//  Created by Dane Springmeyer on 7/28/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillAppDelegate.h"
#import "TileMillBrowserWindowController.h"
#import "TileMillPrefsWindowController.h"
#import "TileMillVersionComparator.h"
#import <Sparkle/SUUpdater.h>

#import "JSONKit.h"

#import "PFMoveApplication.h"

@interface TileMillAppDelegate ()

@property (nonatomic, retain) TileMillChildProcess *searchTask;
@property (nonatomic, retain) TileMillBrowserWindowController *browserController;
@property (nonatomic, retain) TileMillPrefsWindowController *prefsController;
@property (nonatomic, retain) NSString *logPath;
@property (nonatomic, assign) BOOL shouldAttemptRestart;
@property (nonatomic, assign) BOOL fatalErrorCaught;

- (void)startTileMill;
- (void)stopTileMill;
- (void)writeToLog:(NSString *)message;
- (void)presentFatalError;

@end
   
#pragma mark -

@implementation TileMillAppDelegate

@synthesize searchTask;
@synthesize browserController;
@synthesize prefsController;
@synthesize logPath;
@synthesize shouldAttemptRestart;
@synthesize fatalErrorCaught;

- (void)dealloc
{
    [searchTask release];
    [browserController release];
    [prefsController release];
    [logPath release];

    [super dealloc];
}

#pragma mark -
#pragma mark NSApplicationDelegate

- (void)applicationWillFinishLaunching:(NSNotification *)notification
{
    // Set delegate before the first automatic update check.
    [[SUUpdater sharedUpdater] setDelegate:self];
}

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
    // offer to move app to Applications folder
    //
    PFMoveToApplicationsFolderIfNecessary();
    
    // used defaults shared between TileMill core & OS X (see #622)
    //
    NSString *jsonDefaults = [NSString stringWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"config.defaults" ofType:@"json" inDirectory:@"lib"]
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

    [self showBrowserWindow:self];
    [self startTileMill];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)tilemillAppDelegate
{
    return NO;
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)theApplication hasVisibleWindows:(BOOL)flag
{
    if ( ! flag)
        [self.browserController showWindow:self];
    
    return YES;
}

- (NSApplicationTerminateReply)applicationShouldTerminate:(NSApplication *)sender
{
    return ([self.browserController browserShouldQuit] ? NSTerminateNow : NSTerminateCancel);
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

- (IBAction)showBrowserWindow:(id)sender
{
    if ( ! self.browserController)
        self.browserController = [[[TileMillBrowserWindowController alloc] initWithWindowNibName:@"TileMillBrowserWindow"] autorelease];
    
    [self.browserController showWindow:self];
}

- (IBAction)showAboutPanel:(id)sender
{
    // supply silhouette icon & custom version string for about box
    // see #730 for background on the version string
    //
    NSDictionary *options = [NSDictionary dictionaryWithObjectsAndKeys:
                                [NSImage imageNamed:@"tilemill.icns"],                                               @"ApplicationIcon",
                                [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"], @"Version",
                                nil];
    
    [NSApp orderFrontStandardAboutPanelWithOptions:options];
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
    [self.browserController loadRequestURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%i/#!/manual", [[NSUserDefaults standardUserDefaults] integerForKey:@"serverPort"]]]];

    // give page time to load, then be sure browser window is visible
    //
    [self performSelector:@selector(showBrowserWindow:) withObject:self afterDelay:0.25];
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
#pragma mark TileMillChildProcessDelegate

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
    NSLog(@"Finished");
    
    if (self.shouldAttemptRestart)
    {
        NSLog(@"Restart");

        [self startTileMill];
    }
}

- (void)childProcessDidSendFirstData:(TileMillChildProcess *)process;
{
    [self.browserController loadInitialRequest];
}

#pragma mark -
#pragma mark TileMillChildProcessDelegate

// This method allows you to provide a custom version comparator.
// If you don't implement this method or return nil, the standard version
// comparator will be used. See SUVersionComparisonProtocol.h for more.
- (id <SUVersionComparison>)versionComparatorForUpdater:(SUUpdater *)updater
{
    return [[TileMillVersionComparator alloc] init];
}

@end