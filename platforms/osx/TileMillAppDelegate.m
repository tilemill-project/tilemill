//
//  TileMillAppDelegate.m
//  TileMill
//
//  Created by Dane Springmeyer on 7/28/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillAppDelegate.h"
#import "TileMillBrowserWindowController.h"
#import "TileMillSparklePrefsWindowController.h"

#import "PFMoveApplication.h"

#import <Sparkle/Sparkle.h>

@interface TileMillAppDelegate ()

@property (nonatomic, retain) TileMillChildProcess *searchTask;
@property (nonatomic, retain) TileMillBrowserWindowController *browserController;
@property (nonatomic, retain) TileMillSparklePrefsWindowController *sparklePrefsController;
@property (nonatomic, retain) NSString *logPath;

- (void)startTileMill;
- (void)writeToLog:(NSString *)message;
- (void)presentFatalError;

@end
   
#pragma mark -

@implementation TileMillAppDelegate

@synthesize searchTask;
@synthesize browserController;
@synthesize sparklePrefsController;
@synthesize logPath;

- (void)dealloc
{
    [searchTask release];
    [browserController release];
    [sparklePrefsController release];
    [logPath release];

    [super dealloc];
}

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
    
    // go full screen if last quit that way
    //
    if ([self.browserController.window respondsToSelector:@selector(toggleFullScreen:)])
        if ([[NSUserDefaults standardUserDefaults] boolForKey:@"startFullScreen"])
            [self.browserController.window toggleFullScreen:self];
    
    // remove full screen mode menu item on 10.6
    //
    if ( ! [self.browserController.window respondsToSelector:@selector(toggleFullScreen:)])
        for (NSMenu *menu in [[NSApp mainMenu] itemArray])
            if ([menu indexOfItemWithTarget:nil andAction:@selector(toggleFullScreen:)] > -1)
                [[menu itemAtIndex:[menu indexOfItemWithTarget:nil andAction:@selector(toggleFullScreen:)]] setHidden:YES];
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
    // remember full screen mode
    //
    if ([self.browserController.window respondsToSelector:@selector(toggleFullScreen:)])
        [[NSUserDefaults standardUserDefaults] setBool:(([self.browserController.window styleMask] & NSFullScreenWindowMask) == NSFullScreenWindowMask) 
                                                forKey:@"startFullScreen"];
    
    [[NSUserDefaults standardUserDefaults] synchronize];

    // This doesn't run when app is forced to quit, so the child process is left running.
    // We clean up any orphan processes in [self startTileMill].
    //
    if (self.searchTask)
    {
        if (self.searchTask.launched)
            [self.searchTask stopProcess];

        self.searchTask = nil;
    }

    
    // clear shared URL cache (see #1057)
    //
    [[NSURLCache sharedURLCache] removeAllCachedResponses];
}

#pragma mark -

- (void)startTileMill
{
    if ( ! [[NSBundle mainBundle] URLForResource:@"node" withExtension:@""])
    {
        [self writeToLog:@"Node executable is missing."];

        [self presentFatalError];
    }
    
    // Look for orphan node processes from previous crashes.
    //
    NSPredicate *nodePredicate     = [NSPredicate predicateWithFormat:@"SELF CONTAINS 'node'"];
    NSPredicate *tilemillPredicate = [NSPredicate predicateWithFormat:@"SELF CONTAINS 'tilemill'"];
    
    for (NSRunningApplication *app in [[NSWorkspace sharedWorkspace] runningApplications])
        if ([nodePredicate evaluateWithObject:[[app executableURL] absoluteString]] && [tilemillPredicate evaluateWithObject:[app localizedName]])
            if ( ! [app forceTerminate])
                [self writeToLog:@"Failed to terminate orphan tilemill process."];
    
    if (self.searchTask)
        self.searchTask = nil;

    NSString *command = [NSString stringWithFormat:@"%@/index.js", [[NSBundle mainBundle] resourcePath]];
    
    self.searchTask = [[TileMillChildProcess alloc] initWithBasePath:[[NSBundle mainBundle] resourcePath] command:command];
    
    [self.searchTask setDelegate:self];
    [self.searchTask startProcess];
}

- (IBAction)showBrowserWindow:(id)sender
{
    if ( ! self.browserController)
        self.browserController = [[[TileMillBrowserWindowController alloc] initWithWindowNibName:@"TileMillBrowserWindow"] autorelease];
    
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
                                     defaultButton:@"Quit TileMill"
                                   alternateButton:@"Contact Support & Quit"
                                       otherButton:nil
                         informativeTextWithFormat:@"TileMill experienced a fatal error while trying to start the server process. Please restart the application. If this persists, please contact support."];
    
    NSInteger status = [alert runModal];
    
    if (status == NSAlertAlternateReturn)
        [self openDiscussions:self];
    
    [[NSApplication sharedApplication] terminate:self];
}

#pragma mark -

- (IBAction)openDocumentsFolder:(id)sender
{
    [[NSWorkspace sharedWorkspace] openFile:[[self configurationForKey:@"files"] stringByExpandingTildeInPath]];
}

- (IBAction)openHelp:(id)sender
{
    [self.browserController loadRequestPath:@"/manual" showingWindow:YES];
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

- (IBAction)openSparklePreferences:(id)sender
{
    if ( ! self.sparklePrefsController)
        self.sparklePrefsController = [[[TileMillSparklePrefsWindowController alloc] initWithWindowNibName:@"TileMillSparklePrefsWindow"] autorelease];

    [self.sparklePrefsController showWindow:self];
}

- (IBAction)openNodeSettingsView:(id)sender
{
    [self.browserController loadRequestPath:@"/settings" showingWindow:YES];
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
    
    if ([[NSPredicate predicateWithFormat:@"SELF contains 'throw e; // process'"] evaluateWithObject:output])
        [self presentFatalError];
}

- (void)childProcessDidSendFirstData:(TileMillChildProcess *)process;
{
    [self.browserController loadInitialRequestWithPort:self.searchTask.port];
}

@end
