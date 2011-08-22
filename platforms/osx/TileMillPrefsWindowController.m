//
//  TileMillPrefsWindowController.m
//  tilemill
//
//  Created by Justin Miller on 8/15/11.
//  Copyright 2011 Development Seed. All rights reserved.
//

#import "TileMillPrefsWindowController.h"

@implementation TileMillPrefsWindowController

- (id)initWithWindowNibName:(NSString *)windowNibName
{
    self = [super initWithWindowNibName:windowNibName];
    
    if (self)
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(windowWillClose:)
                                                     name:NSWindowWillCloseNotification
                                                   object:[self window]];

    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self 
                                                    name:NSWindowWillCloseNotification 
                                                  object:[self window]];
    
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

#pragma mark -

- (void)windowWillClose:(NSNotification *)notification
{
    [[self window] makeFirstResponder:nil];
    [[NSUserDefaults standardUserDefaults] synchronize];
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