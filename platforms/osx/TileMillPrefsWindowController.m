//
//  TileMillPrefsWindowController.m
//  tilemill
//
//  Created by Justin Miller on 8/15/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillPrefsWindowController.h"

#import <Security/Security.h>

#define kRestartKeyPaths [NSArray arrayWithObjects:@"serverPort", @"filesPath", @"bufferSize", nil]

@interface TileMillPrefsWindowController ()

@property (nonatomic, assign) BOOL needsRestart;

@end

#pragma mark -

@implementation TileMillPrefsWindowController

@synthesize needsRestart;
@synthesize commandLinePathButton;
@synthesize selectedCommandLinePath = _selectedCommandLinePath;

- (id)initWithWindowNibName:(NSString *)windowNibName
{
    self = [super initWithWindowNibName:windowNibName];
    
    if (self)
    {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(windowWillClose:)
                                                     name:NSWindowWillCloseNotification
                                                   object:[self window]];
        
        for (NSString *keyPath in kRestartKeyPaths)
            [[NSUserDefaults standardUserDefaults] addObserver:self
                                                    forKeyPath:keyPath
                                                       options:0
                                                       context:nil];
    }

    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self 
                                                    name:NSWindowWillCloseNotification 
                                                  object:[self window]];
    
    for (NSString *keyPath in kRestartKeyPaths)
        [[NSUserDefaults standardUserDefaults] removeObserver:self
                                                   forKeyPath:keyPath];

    [commandLinePathButton release];
    [_selectedCommandLinePath release];
    
    [super dealloc];
}

- (void)awakeFromNib
{
    [[[commandLinePathButton menu] itemWithTitle:@"$HOME/bin"] setTitle:[NSString stringWithFormat:@"%@/bin", NSHomeDirectory()]];    
    
    [[self window] center];
}

#pragma mark -

- (NSString *)abbreviatedFilesPath
{
    NSString *path = [[NSUserDefaults standardUserDefaults] stringForKey:@"filesPath"];
    
    if ([path isEqualToString:NSHomeDirectory()])
        return path;
    
    return [path stringByAbbreviatingWithTildeInPath];
}

- (void)setAbbreviatedFilesPath:(NSString *)path
{
    // this is a dummy pass-through to satisfy bindings KVO
    //
    [[NSUserDefaults standardUserDefaults] setObject:path forKey:@"filesPath"];
    [[NSUserDefaults standardUserDefaults] synchronize];
}

- (NSString *)lastUpdateCheckString
{
    if ([[NSUserDefaults standardUserDefaults] objectForKey:@"SULastCheckTime"])
    {
        NSDateFormatter *formatter = [[[NSDateFormatter alloc] init] autorelease];
        
        [formatter setDateStyle:NSDateFormatterLongStyle];
        [formatter setTimeStyle:NSDateFormatterShortStyle];
        
        return [NSString stringWithFormat:@"Last checked %@", [formatter stringFromDate:[[NSUserDefaults standardUserDefaults] objectForKey:@"SULastCheckTime"]]];
    }

    return @"Never checked";
}

- (NSString *)selectedCommandLinePath
{
    return (_selectedCommandLinePath ? _selectedCommandLinePath : [[[commandLinePathButton menu] itemAtIndex:0] title]);
}

#pragma mark -

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
    // Assume we get here only via notifications of prefs changes
    // requiring a restart.
    //
    self.needsRestart = YES;
}

#pragma mark -

- (void)windowWillClose:(NSNotification *)notification
{
    [[self window] makeFirstResponder:nil];

    if (self.needsRestart)
    {
        self.needsRestart = NO;

        NSAlert *alert = [NSAlert alertWithMessageText:@"Manual Restart Required"
                                         defaultButton:@"OK"
                                       alternateButton:nil 
                                           otherButton:nil 
                             informativeTextWithFormat:@"TileMill must be restarted manually for these changes to take effect."
                          ];
        
        [alert runModal];
    }
}

- (IBAction)clickedFilesPathButton:(id)sender
{
    NSOpenPanel *panel = [NSOpenPanel openPanel];
    
    panel.showsHiddenFiles        = YES;
    panel.canCreateDirectories    = YES;
    panel.canChooseDirectories    = YES;
    panel.canChooseFiles          = NO;
    panel.allowsMultipleSelection = NO;
    
    [panel beginSheetModalForWindow:[self window]
                  completionHandler:^(NSInteger result)
                  {
                      if (result == NSFileHandlingPanelOKButton)
                      {
                          [self setAbbreviatedFilesPath:[[[panel URLs] objectAtIndex:0] relativePath]];
                      }
                  }];
}

- (IBAction)clickedInstallCommandLineButton:(id)sender
{
    NSString *toolName        = @"tilemill.sh";
    NSString *toolBaseName    = [[toolName componentsSeparatedByString:@"."] objectAtIndex:0];
    
    NSString *toolPath        = [[NSBundle mainBundle] pathForResource:toolBaseName 
                                                                ofType:[toolName pathExtension]];

    NSString *linkPath        = [[self.selectedCommandLinePath stringByAppendingString:@"/"] stringByAppendingString:toolBaseName];
    
    NSString *messageText     = nil;
    NSString *informativeText = nil;
    NSString *alternateText   = nil;
    
    NSError *linkError        = nil;
    
    BOOL success = NO;
    
    NSFileManager *fileManager = [NSFileManager defaultManager];
    
    if ([fileManager fileExistsAtPath:linkPath])
    {
        messageText     = @"Command-line tool already installed";
        informativeText = [NSString stringWithFormat:@"The command-line tool already exists at %@.", [linkPath stringByAbbreviatingWithTildeInPath]];
    }
    else if ([fileManager isWritableFileAtPath:[linkPath stringByDeletingLastPathComponent]])
    {
        if ([fileManager createSymbolicLinkAtPath:linkPath withDestinationPath:toolPath error:&linkError] && ! linkError)
        {
            success = YES;
        }
    }
    else
    {
        AuthorizationRef auth = NULL;
        OSStatus authStat     = errAuthorizationDenied;
        
        while (authStat == errAuthorizationDenied)
        {
            authStat = AuthorizationCreate(NULL,
                                           kAuthorizationEmptyEnvironment,
                                           kAuthorizationFlagDefaults,
                                           &auth);
        }
        
        if (authStat == errAuthorizationSuccess)
        {
            const char *command           = [@"/bin/ln" UTF8String];
            const char *const arguments[] = { "-s", [toolPath UTF8String], [linkPath UTF8String], NULL };
            
            if (AuthorizationExecuteWithPrivileges(auth, command, kAuthorizationFlagDefaults, (char *const *)arguments, NULL) == errAuthorizationSuccess)
            {
                success = YES;
            }
        }
        
        AuthorizationFree(auth, kAuthorizationFlagDefaults);
    }
    
    if (success && ! messageText)
    {
        messageText     = @"Installed successfully";
        informativeText = [NSString stringWithFormat:@"The command-line tool '%@' was installed successfully. If %@ is in your path, you should be all set!", toolBaseName, [self.selectedCommandLinePath stringByAbbreviatingWithTildeInPath]];
    }
    else if ( ! messageText)
    {
        messageText     = @"Installation failed";
        informativeText = [NSString stringWithFormat:@"The command-line tool was unable to be installed in %@. If you'd like to try manually, you may symbolically link to the tool in the application bundle yourself.", [self.selectedCommandLinePath stringByAbbreviatingWithTildeInPath]];
        alternateText   = @"Copy Path";
    }
    
    NSAlert *alert = [NSAlert alertWithMessageText:messageText
                                     defaultButton:@"OK"
                                   alternateButton:alternateText
                                       otherButton:nil
                         informativeTextWithFormat:informativeText];
    
    if ( ! success)
        [alert setAlertStyle:NSCriticalAlertStyle];
    
    int status = [alert runModal];
    
    if (status == NSAlertAlternateReturn)
    {
        [[NSPasteboard generalPasteboard] declareTypes:[NSArray arrayWithObject:NSStringPboardType] owner:nil];
        [[NSPasteboard generalPasteboard] setString:toolPath forType:NSStringPboardType];
    }
}

@end