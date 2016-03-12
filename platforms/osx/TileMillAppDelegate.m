//
//  TileMillAppDelegate.m
//  TileMill
//
//  Copyright 2011-2014 Mapbox, Inc. All rights reserved.
//

#import "TileMillAppDelegate.h"
#import "TileMillBrowserWindowController.h"
#import "TileMillDatabaseWatcher.h"

#import "PFMoveApplication.h"

@interface TileMillAppDelegate ()

@property (nonatomic, strong) TileMillChildProcess *searchTask;
@property (nonatomic, strong) TileMillBrowserWindowController *browserController;
@property (nonatomic, strong) TileMillDatabaseWatcher *databaseWatcher;
@property (nonatomic, strong) NSString *logPath;

- (void)startTileMill;
- (void)writeToLog:(NSString *)message;
- (void)presentFatalError;

@end
   
#pragma mark -

@implementation TileMillAppDelegate

@synthesize searchTask;
@synthesize browserController;
@synthesize databaseWatcher;
@synthesize logPath;

#pragma mark -
#pragma mark NSApplicationDelegate

- (BOOL)application:(NSApplication *)theApplication openFile:(NSString *)filename
{
    if ([[[filename pathExtension] lowercaseString] isEqualToString:@"mbtiles"])
    {
        NSAlert *alert = [NSAlert alertWithMessageText:@"Unable to open MBTiles"
                                         defaultButton:@"OK"
                                       alternateButton:nil
                                           otherButton:nil
                             informativeTextWithFormat:@"While %@ can export to MBTiles, it is unable to do anything with them itself. Maybe try uploading the file to your Mapbox account?", [[NSProcessInfo processInfo] processName]];
        
        [alert runModal];
    }
    
    return NO;
}

- (void)applicationWillFinishLaunching:(NSNotification *)notification
{
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
            [options addObject:[NSString stringWithFormat:@"\"port\": %li", [defaults integerForKey:@"serverPort"]]];
        
        if ([defaults objectForKey:@"filesPath"])
            [options addObject:[NSString stringWithFormat:@"\"files\": \"%@\"", [defaults objectForKey:@"filesPath"]]];

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
                            error:nil];
        }
    }
    
    // setup logging
    //
    self.logPath = [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Logs/TileMill.log"];

    // truncate overly long log (5MB+)
    //
    NSFileManager *fileManager = [NSFileManager defaultManager];

    unsigned long long logLength = [[[fileManager attributesOfItemAtPath:self.logPath error:nil] objectForKey:NSFileSize] unsignedLongLongValue];

    if (logLength > 5242880)
    {
        NSMutableData *newData = [[@"---continuing truncated log---\n" dataUsingEncoding:NSUTF8StringEncoding] mutableCopy];

        NSFileHandle *fileHandle = [NSFileHandle fileHandleForReadingAtPath:self.logPath];
        [fileHandle seekToFileOffset:(logLength - 1048576)]; // last 1MB
        [newData appendData:[fileHandle availableData]];
        [fileHandle closeFile];

        [newData writeToFile:self.logPath atomically:YES];
    }

    // fire up main functionality
    //
    [self showBrowserWindow:self];
    [self startTileMill];

    self.databaseWatcher = [TileMillDatabaseWatcher new];

    // go full screen if last quit that way
    //
    if ([NSWindow instancesRespondToSelector:@selector(toggleFullScreen:)] && [[NSUserDefaults standardUserDefaults] boolForKey:@"startFullScreen"])
        [self.browserController.window toggleFullScreen:self];
    
    // remove full screen mode menu item on 10.6
    //
    if ( ! [NSWindow instancesRespondToSelector:@selector(toggleFullScreen:)])
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
    if ([NSWindow instancesRespondToSelector:@selector(toggleFullScreen:)])
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
    if ( ! [[NSBundle mainBundle] URLForResource:@"TileMill" withExtension:@""])
    {
        [self writeToLog:@"TileMill (Node) executable is missing."];

        [self presentFatalError];
    }
    
    // Look for orphan node processes from previous crashes.
    //
    NSPredicate *nodePredicate     = [NSPredicate predicateWithFormat:@"SELF CONTAINS 'TileMill'"];
    NSPredicate *tilemillPredicate = [NSPredicate predicateWithFormat:@"SELF CONTAINS 'tilemill'"];
    
    BOOL triedToKillOrphans = NO;
    
    for (NSRunningApplication *app in [[NSWorkspace sharedWorkspace] runningApplications])
    {
        if ([nodePredicate evaluateWithObject:[[app executableURL] absoluteString]] && [tilemillPredicate evaluateWithObject:[app localizedName]])
        {
            if ( ! [app forceTerminate])
                [self writeToLog:@"Failed to terminate orphan tilemill process."];
            
            triedToKillOrphans = YES;
        }
    }
    
    if ( ! triedToKillOrphans)
        [self writeToLog:@"No previous node process cleanups were attempted."];
    
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
        self.browserController = [[TileMillBrowserWindowController alloc] initWithWindowNibName:@"TileMillBrowserWindow"];
    
    [self.browserController showWindow:self];
}

- (void)writeToLog:(NSString *)message
{
    if ( ! [[NSFileManager defaultManager] fileExistsAtPath:self.logPath])
        if ( ! [@"" writeToFile:self.logPath atomically:YES encoding:NSUTF8StringEncoding error:nil])
            NSLog(@"Error creating log file at %@.", self.logPath);
    
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
                         informativeTextWithFormat:@"TileMill experienced a fatal error while trying to start. Please check the logs for details:\n\n\t%@\n\nIf this problem persists, please contact support.", self.logPath];
    
    if ([alert runModal] == NSAlertAlternateReturn)
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
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"https://mapbox.com/tilemill/docs/"]];
}

- (IBAction)openConsole:(id)sender
{
    // we do this twice to make sure the right window comes forward (see #940)
    //
    [[NSWorkspace sharedWorkspace] openFile:self.logPath withApplication:@"Console"];
    [[NSWorkspace sharedWorkspace] openFile:self.logPath withApplication:@"Console" andDeactivate:YES];
}

- (IBAction)openNodeSettingsView:(id)sender
{
    [self.browserController loadRequestPath:@"/settings" showingWindow:YES];
}

- (NSString *)configurationForKey:(NSString *)key
{
    NSURL *fetchURL = [NSURL URLWithString:[NSString stringWithFormat:@"http://127.0.0.1:%ld/api/Key/%@", self.searchTask.port, key]];
    
    return [NSString stringWithContentsOfURL:fetchURL encoding:NSUTF8StringEncoding error:nil];
}

#pragma mark -
#pragma mark TileMillChildProcessDelegate

- (void)childProcess:(TileMillChildProcess *)process didSendOutput:(NSString *)output
{
    [self writeToLog:output];
    
    if ([[NSPredicate predicateWithFormat:@"SELF contains 'Error:'"] evaluateWithObject:output] &&
        ![[NSPredicate predicateWithFormat:@"SELF contains 'Client Error'"] evaluateWithObject:output]
        )
        [self presentFatalError];

}

- (void)childProcess:(TileMillChildProcess *)process didCrash:(NSString *)output
{
    [self writeToLog:output];
    [self presentFatalError];
}

- (void)childProcessDidSendFirstData:(TileMillChildProcess *)process;
{
    [self.browserController loadInitialRequestWithPort:self.searchTask.port];
}

@end
