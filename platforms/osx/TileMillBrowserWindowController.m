//
//  TileMillBrowserWindowController.m
//  TileMill
//
//  Created by Justin Miller on 10/12/11.
//  Copyright (c) 2011 Development Seed. All rights reserved.
//

#import "TileMillBrowserWindowController.h"

#import <objc/message.h>

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

- (void)webView:(WebView *)sender didStartProvisionalLoadForFrame:(WebFrame *)frame
{
    NSURL *loadURL = [NSURL URLWithString:sender.mainFrameURL];
    
    if ( ! [[loadURL scheme] isEqualToString:@"http"] || ! [[loadURL host] isEqualToString:@"localhost"])
    {
        [frame stopLoading];

        [[NSWorkspace sharedWorkspace] openURL:loadURL];
    }
}

- (void)webView:(WebView *)sender didCommitLoadForFrame:(WebFrame *)frame
{
    if ( ! self.initialRequestComplete)
    {
        self.initialRequestComplete = YES;
        
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.25 * NSEC_PER_SEC), dispatch_get_main_queue(), ^(void)
        {
            /*
             * This is a nasty runtime hack to get rid of scroll bouncing when
             * building the app against the 10.6 SDK. We'll get around this soon
             * by building on 10.7.
             *
             * We do this on a delay so that the first request has time to start
             * rendering on the page. Otherwise, the scrollbars don't exist yet.
             */

            NSScrollView *scroller = self.webView.mainFrame.frameView.documentView.enclosingScrollView;
           
            if ([scroller respondsToSelector:@selector(setHorizontalScrollElasticity:)])
            {
                objc_msgSend(scroller, @selector(setHorizontalScrollElasticity:), 1);
                objc_msgSend(scroller, @selector(setVerticalScrollElasticity:),   1);
            }
        });
    }
}

#pragma mark -

- (NSArray *)webView:(WebView *)sender contextMenuItemsForElement:(NSDictionary *)element defaultMenuItems:(NSArray *)defaultMenuItems
{
    return [NSArray array];
}

@end