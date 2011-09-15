//
//  TileMillPrefsWindowController.m
//  tilemill
//
//  Created by Justin Miller on 8/15/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillPrefsWindowController.h"

#define kRestartKeyPaths [NSArray arrayWithObjects:@"serverPort", @"filesPath", @"bufferSize", nil]

@interface TileMillPrefsWindowController ()

@property (nonatomic, assign) BOOL needsRestart;

@end

#pragma mark -

@implementation TileMillPrefsWindowController

@synthesize needsRestart;

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

    [super dealloc];
}

- (void)awakeFromNib
{
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

@end