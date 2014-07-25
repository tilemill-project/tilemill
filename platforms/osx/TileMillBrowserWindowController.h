//
//  TileMillBrowserWindowController.h
//  TileMill
//
//  Copyright (c) 2011-2014 Mapbox, Inc. All rights reserved.
//

#import <WebKit/WebKit.h>

extern NSString *TileMillBrowserLoadCompleteNotification;

@interface TileMillBrowserWindowController : NSWindowController

@property (nonatomic, strong) IBOutlet WebView *webView;

- (void)loadInitialRequestWithPort:(NSInteger)inPort;
- (void)loadRequestPath:(NSString *)path showingWindow:(BOOL)showWindow;
- (BOOL)shouldDiscardUnsavedWork;
- (NSString *)runJavaScript:(NSString *)code;
- (NSString *)runJavaScript:(NSString *)code inBones:(BOOL)useBones;

@end