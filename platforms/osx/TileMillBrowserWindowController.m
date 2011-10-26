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

- (void)promptToSaveRemoteURL:(NSURL *)remoteURL revealingInFinder:(BOOL)shouldReveal;

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

- (void)promptToSaveRemoteURL:(NSURL *)remoteURL revealingInFinder:(BOOL)shouldReveal;
{
    NSSavePanel *savePanel = [NSSavePanel savePanel];
    
    savePanel.nameFieldStringValue = remoteURL.lastPathComponent;
    
    [savePanel beginSheetModalForWindow:self.webView.window completionHandler:^(NSInteger result)
    {
        if (result == NSFileHandlingPanelOKButton)
        {
            NSURL *destinationURL = [[NSURL URLWithString:remoteURL.lastPathComponent relativeToURL:savePanel.directoryURL] filePathURL];

            NSData *saveData = [NSData dataWithContentsOfURL:remoteURL];
            
            [saveData writeToURL:destinationURL atomically:YES];
            
            if (shouldReveal)
                [[NSWorkspace sharedWorkspace] activateFileViewerSelectingURLs:[NSArray arrayWithObject:destinationURL.absoluteURL]];
        }
    }];
}

#pragma mark -

- (void)webView:(WebView *)webView decidePolicyForNavigationAction:(NSDictionary *)actionInformation request:(NSURLRequest *)request frame:(WebFrame *)frame decisionListener:(id < WebPolicyDecisionListener >)listener
{
    if ([[request.URL host] isEqualToString:@"localhost"] && [[request.URL pathComponents] containsObject:@"export"] && [[request.URL pathComponents] containsObject:@"download"])
    {
        // offer to save "downloaded" files to disk
        //
        [self promptToSaveRemoteURL:request.URL revealingInFinder:YES];
        
        [listener ignore];
    }    
    else if ( ! [request.URL.scheme isEqualToString:@"http"] || ! [request.URL.host isEqualToString:@"localhost"])
    {
        // open external URLs in the default browser
        //
        [[NSWorkspace sharedWorkspace] openURL:request.URL];
        
        [listener ignore];
    }
    else
    {    
        // handle everything else ourselves as normal
        //
        [listener use];
    }
}

- (void)webView:(WebView *)webView decidePolicyForNewWindowAction:(NSDictionary *)actionInformation request:(NSURLRequest *)request newFrameName:(NSString *)frameName decisionListener:(id < WebPolicyDecisionListener >)listener
{
    if ( ! [request.URL.scheme isEqualToString:@"http"] || ! [request.URL.host isEqualToString:@"localhost"])
    {
        // open "new window" external links in the default browser
        //
        [[NSWorkspace sharedWorkspace] openURL:request.URL];
    }
    else if ([request.URL.pathComponents containsObject:@"api"] && [request.URL.pathComponents containsObject:@"Project"] && [request.URL.pathExtension isEqualToString:@"xml"])
    {
        // save Mapnik XML externally
        //
        [self promptToSaveRemoteURL:request.URL revealingInFinder:YES];
    }
    else
    {    
        // handle everything else ourselves in the main window
        //
        [self.webView.mainFrame loadRequest:request];
    }
    
    [listener ignore];
}

#pragma mark -

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