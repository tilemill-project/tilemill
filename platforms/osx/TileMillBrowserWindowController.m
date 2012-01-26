//
//  TileMillBrowserWindowController.m
//  TileMill
//
//  Created by Justin Miller on 10/12/11.
//  Copyright (c) 2011 Development Seed. All rights reserved.
//

#import "TileMillBrowserWindowController.h"

#define kTileMillRequestTimeout 300

NSString *TileMillBrowserLoadCompleteNotification = @"TileMillBrowserLoadCompleteNotification";

@interface TileMillBrowserWindowController ()

- (void)promptToSaveRemoteURL:(NSURL *)remoteURL revealingInFinder:(BOOL)shouldReveal;

@property (nonatomic, assign) BOOL initialRequestComplete;
@property (nonatomic, assign) NSInteger port;

@end

#pragma mark -

@implementation TileMillBrowserWindowController

@synthesize webView;
@synthesize initialRequestComplete;
@synthesize port;

- (void)awakeFromNib
{
    if ( ! [[NSUserDefaults standardUserDefaults] stringForKey:[NSString stringWithFormat:@"NSWindow Frame %@", [[self window] frameAutosaveName]]])
        [[self window] center];
    
    // setup app-oriented caching
    //
    WebPreferences *prefs = [[WebPreferences alloc] initWithIdentifier:self.webView.preferencesIdentifier];
    
    [prefs setCacheModel:WebCacheModelDocumentViewer];
    [prefs setUsesPageCache:NO];
}

- (void)dealloc
{
    [webView release];
}

#pragma mark -

- (void)loadInitialRequestWithPort:(NSInteger)inPort
{
    self.port = inPort;
    
    NSURL *initialURL = [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%ld/#", self.port]];
    
    [self.webView.mainFrame loadRequest:[NSURLRequest requestWithURL:initialURL 
                                                         cachePolicy:NSURLRequestUseProtocolCachePolicy
                                                     timeoutInterval:kTileMillRequestTimeout]];
}

- (void)loadRequestPath:(NSString *)path showingWindow:(BOOL)showWindow
{
    NSString *currentURLString = [self.webView stringByEvaluatingJavaScriptFromString:@"location.href"];
    
    NSURL *requestURL = [NSURL URLWithString:[NSString stringWithFormat:@"%@?goto=%@", currentURLString, path]];
    
    [self.webView.mainFrame loadRequest:[NSURLRequest requestWithURL:requestURL 
                                                         cachePolicy:NSURLRequestUseProtocolCachePolicy
                                                     timeoutInterval:kTileMillRequestTimeout]];
    
    if (showWindow)
        [self performSelector:@selector(showWindow:) withObject:self afterDelay:0.25];
}

- (BOOL)shouldDiscardUnsavedWork
{
    // check for unsaved work
    //
    [self runJavaScript:@"var loseUnsavedWork;"];
    [self runJavaScript:@"var getLoseUnsavedWork = function() { return loseUnsavedWork; }"];
    [self runJavaScript:@"loseUnsavedWork = views.Project.prototype.unload({type: 'unload'})" inBones:YES];
    
    if ([[self runJavaScript:@"getLoseUnsavedWork();"] isEqualToString:@"false"])
    {
        // show window, i.e., unsaved work, if needed
        //
        [self showWindow:self];
        
        return NO;
    }
    
    return YES;
}

- (void)promptToSaveRemoteURL:(NSURL *)remoteURL revealingInFinder:(BOOL)shouldReveal
{
    NSSavePanel *savePanel = [NSSavePanel savePanel];
    
    savePanel.nameFieldStringValue = remoteURL.lastPathComponent;
    
    [savePanel beginSheetModalForWindow:self.webView.window completionHandler:^(NSInteger result)
    {
        if (result == NSFileHandlingPanelOKButton)
        {
            NSString *destinationName = savePanel.nameFieldStringValue;
            
            if ([destinationName.pathExtension isNotEqualTo:remoteURL.pathExtension])
                destinationName = [NSString stringWithFormat:@"%@.%@", destinationName, remoteURL.pathExtension];
            
            NSURL *destinationURL = [[NSURL URLWithString:destinationName relativeToURL:savePanel.directoryURL] filePathURL];

            NSData *saveData = [NSData dataWithContentsOfURL:remoteURL];
            
            [saveData writeToURL:destinationURL atomically:YES];
            
            if (shouldReveal)
                [[NSWorkspace sharedWorkspace] activateFileViewerSelectingURLs:[NSArray arrayWithObject:destinationURL.absoluteURL]];
        }
    }];
}

- (NSString *)runJavaScript:(NSString *)code
{
    return [self runJavaScript:code inBones:NO];
}

- (NSString *)runJavaScript:(NSString *)code inBones:(BOOL)useBones
{
    if (useBones)
        code = [NSString stringWithFormat:@"window.Bones.initialize(function(models, views, controllers) { %@ });", code];
        
    return [self.webView stringByEvaluatingJavaScriptFromString:code];
}

#pragma mark -
#pragma mark WebPolicyDelegate

- (void)webView:(WebView *)webView decidePolicyForMIMEType:(NSString *)type request:(NSURLRequest *)request frame:(WebFrame *)frame decisionListener:(id <WebPolicyDecisionListener>)listener
{
    // handle any non-HTML (MBTiles, PNG, Mapnik XML) as downloads
    //
    if ( ! [type isEqualToString:@"text/html"])
    {
        [self promptToSaveRemoteURL:request.URL revealingInFinder:YES];
        
        [listener ignore];
    }
    else
    {
        [listener use];
    }
}

- (void)webView:(WebView *)webView decidePolicyForNewWindowAction:(NSDictionary *)actionInformation request:(NSURLRequest *)request newFrameName:(NSString *)frameName decisionListener:(id <WebPolicyDecisionListener>)listener
{
    // open all "new window" links in default browser, not in-app
    //
    [[NSWorkspace sharedWorkspace] openURL:request.URL];

    [listener ignore];
}

#pragma mark -
#pragma mark WebFrameLoadDelegate

- (void)webView:(WebView *)sender didCommitLoadForFrame:(WebFrame *)frame
{
    if ( ! self.initialRequestComplete)
        self.initialRequestComplete = YES;
}

- (void)webView:(WebView *)sender didFinishLoadForFrame:(WebFrame *)frame
{
    [[NSNotificationCenter defaultCenter] postNotificationName:TileMillBrowserLoadCompleteNotification object:nil];
}

#pragma mark -
#pragma mark WebResourceLoadDelegate

- (NSURLRequest *)webView:(WebView *)sender resource:(id)identifier willSendRequest:(NSURLRequest *)request redirectResponse:(NSURLResponse *)redirectResponse fromDataSource:(WebDataSource *)dataSource
{
    if ([request timeoutInterval] < kTileMillRequestTimeout)
    {
        NSMutableURLRequest *newRequest = [[request copy] autorelease];
        
        [newRequest setTimeoutInterval:kTileMillRequestTimeout];
        
        return newRequest;
    }

    return request;
}

#pragma mark -
#pragma mark WebUIDelegate

- (void)webView:(WebView *)sender runJavaScriptAlertPanelWithMessage:(NSString *)message initiatedByFrame:(WebFrame *)frame
{
    NSAlert *alert = [NSAlert alertWithMessageText:@"TileMill" 
                                     defaultButton:@"OK" 
                                   alternateButton:nil 
                                       otherButton:nil 
                         informativeTextWithFormat:message];
    
    [alert runModal];
}

- (BOOL)webView:(WebView *)sender runJavaScriptConfirmPanelWithMessage:(NSString *)message initiatedByFrame:(WebFrame *)frame
{
    NSAlert *alert = [NSAlert alertWithMessageText:@"TileMill" 
                                     defaultButton:@"OK" 
                                   alternateButton:@"Cancel" 
                                       otherButton:nil 
                         informativeTextWithFormat:message];
    
    return ([alert runModal] == NSAlertDefaultReturn ? YES : NO);
}

- (NSArray *)webView:(WebView *)sender contextMenuItemsForElement:(NSDictionary *)element defaultMenuItems:(NSArray *)defaultMenuItems
{
    // don't show a contextual menu
    //
    return [NSArray array];
}

- (void)webView:(WebView *)sender mouseDidMoveOverElement:(NSDictionary *)elementInformation modifierFlags:(NSUInteger)modifierFlags
{
    // continually ensure bounce scrolling is disabled on Lion
    //
    self.webView.mainFrame.frameView.documentView.enclosingScrollView.horizontalScrollElasticity = NSScrollElasticityNone;
    self.webView.mainFrame.frameView.documentView.enclosingScrollView.verticalScrollElasticity   = NSScrollElasticityNone;
}

@end