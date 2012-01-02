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

#import "PFMoveApplication.h"

#import <Sparkle/Sparkle.h>

@interface TileMillAppDelegate ()

@property (nonatomic, strong) TileMillChildProcess *searchTask;
@property (nonatomic, strong) TileMillBrowserWindowController *browserController;
@property (nonatomic, strong) TileMillPrefsWindowController *prefsController;
@property (nonatomic, strong) NSString *logPath;
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

#pragma mark -
#pragma mark NSApplicationDelegate

- (void)applicationWillFinishLaunching:(NSNotification *)notification
{
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    SUUpdater *updater = [SUUpdater sharedUpdater];
    
    /*
     * This ensures that fresh installs of dev builds sync up the 
     * defaults to reflect the dev channel.
     */
    
    if ([[updater feedURL] isEqual:TileMillDevelopmentAppcastURL] && ( ! [defaults objectForKey:@"installDevBuilds"] || ! [defaults objectForKey:@"SUFeedURL"]))
    {
        [defaults setBool:YES forKey:@"installDevBuilds"];
        [updater setFeedURL:TileMillDevelopmentAppcastURL];
    }
    
    // clear shared URL cache (see #1057)
    //
    [[NSURLCache sharedURLCache] removeAllCachedResponses];
}

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
    // offer to move app to Applications folder
    //
    PFMoveToApplicationsFolderIfNecessary();

    // v0.7.2+ migrations from defaults to dotfile (see #1015)
    //
    if ( ! [[NSFileManager defaultManager] fileExistsAtPath:[NSString stringWithFormat:@"%@/.tilemill/config.json", NSHomeDirectory()]])
    {
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        NSMutableArray *options  = [NSMutableArray array];

        if ([defaults objectForKey:@"SUSendProfileInfo"])
            [options addObject:[NSString stringWithFormat:@"\"profile\": \"%@\"", ([defaults boolForKey:@"SUSendProfileInfo"] ? @"true" : @"false")]];
        
        if ([defaults objectForKey:@"serverPort"])
            [options addObject:[NSString stringWithFormat:@"\"port\": %i", [defaults integerForKey:@"serverPort"]]];
        
        if ([defaults objectForKey:@"filesPath"])
            [options addObject:[NSString stringWithFormat:@"\"files\": \"%@\"", [defaults objectForKey:@"filesPath"]]];

        if ([defaults objectForKey:@"bufferSize"])
            [options addObject:[NSString stringWithFormat:@"\"bufferSize\": %i", [defaults integerForKey:@"bufferSize"]]];
        
        if ([defaults objectForKey:@"listenAllInterfaces"])
            [options addObject:[NSString stringWithFormat:@"\"listenHost\": \"%@\"", ([defaults boolForKey:@"listenAllInterfaces"] ? @"0.0.0.0" : @"127.0.0.1")]];
        
        if ([options count])
        {
            NSMutableString *contents = [NSMutableString stringWithString:@"{\n    "];
            
            [contents appendString:[options componentsJoinedByString:@",\n    "]];
            [contents appendString:@"\n}\n"];
            
            if ( ! [[NSFileManager defaultManager] fileExistsAtPath:[NSString stringWithFormat:@"%@/.tilemill", NSHomeDirectory()]])
            {
                [[NSFileManager defaultManager] createDirectoryAtPath:[NSString stringWithFormat:@"%@/.tilemill", NSHomeDirectory()] withIntermediateDirectories:YES attributes:nil error:nil];
            }

            [contents writeToFile:[NSString stringWithFormat:@"%@/.tilemill/config.json", NSHomeDirectory()]
                       atomically:YES
                         encoding:NSUTF8StringEncoding
                            error:NULL];
        }
    }
    
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
    return ([self.browserController shouldDiscardUnsavedWork] ? NSTerminateNow : NSTerminateCancel);
}

- (void)applicationWillTerminate:(NSNotification *)notification
{
    [[NSUserDefaults standardUserDefaults] synchronize];
    
    self.shouldAttemptRestart = NO;

    // This doesn't run when app is forced to quit, so the child process is left running.
    // We clean up any orphan processes in [self startTileMill].
    //
    [self stopTileMill];
    
    // clear shared URL cache (see #1057)
    //
    [[NSURLCache sharedURLCache] removeAllCachedResponses];
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
        self.browserController = [[TileMillBrowserWindowController alloc] initWithWindowNibName:@"TileMillBrowserWindow"];
    
    [self.browserController showWindow:self];
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
    [[NSWorkspace sharedWorkspace] openFile:[[self configurationForKey:@"files"] stringByExpandingTildeInPath]];
}

- (IBAction)openHelp:(id)sender
{
    if ( ! [self.browserController shouldDiscardUnsavedWork])
        return;

    [self.browserController loadRequestURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%ld/#!/manual", self.searchTask.port]]];
    
    [self.browserController performSelector:@selector(showWindow:) withObject:self afterDelay:0.25];
}

- (IBAction)openDiscussions:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://support.mapbox.com/discussions/tilemill"]];
}

- (IBAction)openOnlineHelp:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://mapbox.com/tilemill/docs/"]];
}

- (IBAction)openConsole:(id)sender
{
    // we do this twice to make sure the right window comes forward (see #940)
    //
    [[NSWorkspace sharedWorkspace] openFile:self.logPath withApplication:@"Console"];
    [[NSWorkspace sharedWorkspace] openFile:self.logPath withApplication:@"Console" andDeactivate:YES];
}

- (IBAction)openPreferences:(id)sender
{
    if ( ! self.prefsController)
        self.prefsController = [[TileMillPrefsWindowController alloc] initWithWindowNibName:@"TileMillPrefsWindow"];
    
    [self.prefsController showWindow:self];
}

- (IBAction)openNodeAboutView:(id)sender
{
    if ( ! [self.browserController shouldDiscardUnsavedWork])
        return;
    
    void (^aboutClick)(void) = ^{ [self.browserController runJavaScript:@"$('a[href=#about]').click()"]; };
    
    // go to main Projects view if needed
    //
    [self.browserController showWindow:self];
    
    if ( ! [[self.browserController runJavaScript:@"$('div.projects').length"] boolValue])
    {    
        if (requestLoadBlock != NULL)
            [[NSNotificationCenter defaultCenter] removeObserver:requestLoadBlock];
        
        requestLoadBlock = [[NSNotificationCenter defaultCenter] addObserverForName:TileMillBrowserLoadCompleteNotification 
                                                                             object:nil
                                                                              queue:nil
                                                                         usingBlock:^(NSNotification *notification)
                                                                         {
                                                                             aboutClick();
                                                                             
                                                                             [[NSNotificationCenter defaultCenter] removeObserver:requestLoadBlock];
                                                                             
                                                                             requestLoadBlock = NULL;
                                                                         }];
        
        [self.browserController loadRequestURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%ld/", self.searchTask.port]]];
    }

    else
        aboutClick();
}

- (IBAction)openNodeSettingsView:(id)sender
{
    if ( ! [self.browserController shouldDiscardUnsavedWork])
        return;

    void (^configClick)(void) = ^{ [self.browserController runJavaScript:@"$('a[href=#config]').click()"]; };

    // go to main Projects view if needed
    //
    [self.browserController showWindow:self];

    if ( ! [[self.browserController runJavaScript:@"$('div.projects').length"] boolValue])
    {    
        if (requestLoadBlock != NULL)
            [[NSNotificationCenter defaultCenter] removeObserver:requestLoadBlock];

        requestLoadBlock = [[NSNotificationCenter defaultCenter] addObserverForName:TileMillBrowserLoadCompleteNotification 
                                                                             object:nil
                                                                              queue:nil
                                                                         usingBlock:^(NSNotification *notification)
                                                                         {
                                                                             configClick();

                                                                             [[NSNotificationCenter defaultCenter] removeObserver:requestLoadBlock];
                                                                             
                                                                             requestLoadBlock = NULL;
                                                                         }];
        
        [self.browserController loadRequestURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%ld/", self.searchTask.port]]];
    }
    
    else
        configClick();
}

- (NSString *)configurationForKey:(NSString *)key
{
    NSURL *fetchURL = [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%ld/api/Key/%@", self.searchTask.port, key]];
    
    NSError *error = nil;
    
    NSString *result = [NSString stringWithContentsOfURL:fetchURL encoding:NSUTF8StringEncoding error:&error];
    
    return (error ? nil : result);
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
                             informativeTextWithFormat:@"TileMill's port is already in use by another application on the system. Please quit that application and relaunch TileMill."];
        
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
    [self.browserController loadRequestURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%ld/", self.searchTask.port]]];
}

@end