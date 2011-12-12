//
//  TileMillBrowserWindowController.h
//  TileMill
//
//  Created by Justin Miller on 10/12/11.
//  Copyright (c) 2011 Development Seed. All rights reserved.
//

#import <WebKit/WebKit.h>

@interface TileMillBrowserWindowController : NSWindowController
{
    WebView *webView;
    BOOL initialRequestComplete;
}

@property (nonatomic, retain) IBOutlet WebView *webView;

- (void)loadInitialRequestWithPort:(NSInteger)port;
- (void)loadRequestURL:(NSURL *)loadURL;
- (BOOL)browserShouldQuit;

@end