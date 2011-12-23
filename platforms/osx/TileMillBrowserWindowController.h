//
//  TileMillBrowserWindowController.h
//  TileMill
//
//  Created by Justin Miller on 10/12/11.
//  Copyright (c) 2011 Development Seed. All rights reserved.
//

#import <WebKit/WebKit.h>

extern NSString *TileMillBrowserLoadCompleteNotification;

@interface TileMillBrowserWindowController : NSWindowController
{
    WebView *webView;
    BOOL initialRequestComplete;
    NSInteger port;
}

@property (nonatomic, strong) IBOutlet WebView *webView;

- (void)loadInitialRequestWithPort:(NSInteger)inPort;
- (void)loadRequestURL:(NSURL *)loadURL;
- (BOOL)shouldDiscardUnsavedWork;
- (NSString *)runJavaScript:(NSString *)code;
- (NSString *)runJavaScript:(NSString *)code inBones:(BOOL)useBones;

@end