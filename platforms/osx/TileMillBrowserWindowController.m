//
//  TileMillBrowserWindowController.m
//  TileMill
//
//  Created by Justin Miller on 10/12/11.
//  Copyright (c) 2011 Development Seed. All rights reserved.
//

#import "TileMillBrowserWindowController.h"

@interface TileMillBrowserWindowController ()

@property (nonatomic, assign) BOOL initialRequestComplete;

@end

#pragma mark -

@implementation TileMillBrowserWindowController

@synthesize webView;
@synthesize initialRequestComplete;

- (void)awakeFromNib
{
    [[self window] center];
}

- (void)dealloc
{
    [webView release];
}

#pragma mark -

- (void)loadInitialRequest
{
    NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%i", [[NSUserDefaults standardUserDefaults] integerForKey:@"serverPort"]]]];
    
    [self.webView.mainFrame loadRequest:request];
}

- (void)loadRequestURL:(NSURL *)loadURL
{
    [self.webView.mainFrame loadRequest:[NSURLRequest requestWithURL:loadURL]];
}

#pragma mark -

- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame
{
    if ( ! self.initialRequestComplete)
        self.initialRequestComplete = YES;
}

@end