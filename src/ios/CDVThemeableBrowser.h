/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import <Cordova/CDVPlugin.h>
#import <Cordova/CDVInvokedUrlCommand.h>
#import <Cordova/CDVScreenOrientationDelegate.h>
#import <Cordova/CDVWebViewDelegate.h>

@class CDVThemeableBrowserViewController;

@interface CDVThemeableBrowser : CDVPlugin {
    BOOL _injectedIframeBridge;
}

@property (nonatomic, retain) CDVThemeableBrowserViewController* themeableBrowserViewController;
@property (nonatomic, copy) NSString* callbackId;
@property (nonatomic, copy) NSRegularExpression *callbackIdPattern;

- (void)open:(CDVInvokedUrlCommand*)command;
- (void)close:(CDVInvokedUrlCommand*)command;
- (void)injectScriptCode:(CDVInvokedUrlCommand*)command;
- (void)show:(CDVInvokedUrlCommand*)command;

@end

@interface CDVThemeableBrowserOptions : NSObject {}

@property (nonatomic) BOOL location;
@property (nonatomic) BOOL toolbar;
@property (nonatomic) NSString* closebuttoncaption;
@property (nonatomic) NSString* toolbarposition;
@property (nonatomic) BOOL clearcache;
@property (nonatomic) BOOL clearsessioncache;

@property (nonatomic) NSString* presentationstyle;
@property (nonatomic) NSString* transitionstyle;

@property (nonatomic) BOOL enableviewportscale;
@property (nonatomic) BOOL mediaplaybackrequiresuseraction;
@property (nonatomic) BOOL allowinlinemediaplayback;
@property (nonatomic) BOOL keyboarddisplayrequiresuseraction;
@property (nonatomic) BOOL suppressesincrementalrendering;
@property (nonatomic) BOOL hidden;
@property (nonatomic) BOOL disallowoverscroll;

@property (nonatomic) NSString* statusbarColor;
@property (nonatomic) NSString* toolbarColor;
@property (nonatomic) NSString* toolbarImage;
@property (nonatomic) NSString* toolbarImagePortrait;
@property (nonatomic) NSString* toolbarImageLandscape;
@property (nonatomic) NSString* titleColor;
@property (nonatomic) NSString* backButtonImage;
@property (nonatomic) NSString* backButtonPressedImage;
@property (nonatomic) NSString* forwardButtonImage;
@property (nonatomic) NSString* forwardButtonPressedImage;
@property (nonatomic) NSString* closeButtonImage;
@property (nonatomic) NSString* closeButtonPressedImage;
@property (nonatomic) NSString* menuButtonImage;
@property (nonatomic) NSString* menuButtonPressedImage;

@property (nonatomic) NSString* closeButtonAlign;
@property (nonatomic) NSString* navButtonAlign;
@property (nonatomic) NSString* menuButtonAlign;

@property (nonatomic) NSString* titleStaticText;
@property (nonatomic) NSArray* menuItems;
@property (nonatomic) NSString* menuTitle;
@property (nonatomic) NSString* menuCancel;

@property (nonatomic) BOOL backButtonCanClose;

@property (nonatomic) BOOL hideTitle;
@property (nonatomic) BOOL hideCloseButton;
@property (nonatomic) BOOL hideBackButton;
@property (nonatomic) BOOL hideForwardButton;

+ (CDVThemeableBrowserOptions*)parseOptions:(NSString*)options;

+ (void)validateOptions:(CDVThemeableBrowserOptions*)options;

@end

@interface CDVThemeableBrowserViewController : UIViewController <UIWebViewDelegate, CDVScreenOrientationDelegate, UIActionSheetDelegate>{
    @private
    NSString* _userAgent;
    NSString* _prevUserAgent;
    NSInteger _userAgentLockToken;
    CDVThemeableBrowserOptions *_browserOptions;
    CDVWebViewDelegate* _webViewDelegate;
}

@property (nonatomic, strong) IBOutlet UIWebView* webView;
@property (nonatomic, strong) IBOutlet UIBarButtonItem* closeButton;
@property (nonatomic, strong) IBOutlet UILabel* addressLabel;
@property (nonatomic, strong) IBOutlet UILabel* titleLabel;
@property (nonatomic, strong) IBOutlet UIBarButtonItem* backButton;
@property (nonatomic, strong) IBOutlet UIBarButtonItem* forwardButton;
@property (nonatomic, strong) IBOutlet UIBarButtonItem* menuButton;
@property (nonatomic, strong) IBOutlet UIActivityIndicatorView* spinner;
@property (nonatomic, strong) IBOutlet UIToolbar* toolbar;

@property (nonatomic, weak) id <CDVScreenOrientationDelegate> orientationDelegate;
@property (nonatomic, weak) CDVThemeableBrowser* navigationDelegate;
@property (nonatomic) NSURL* currentURL;
@property (nonatomic) CGFloat titleOffset;

- (void)close;
- (void)navigateTo:(NSURL*)url;
- (void)showLocationBar:(BOOL)show;
- (void)showToolBar:(BOOL)show : (NSString*) toolbarPosition;
- (void)setCloseButtonTitle:(NSString*)title;

- (id)initWithUserAgent:(NSString*)userAgent prevUserAgent:(NSString*)prevUserAgent browserOptions: (CDVThemeableBrowserOptions*) browserOptions;

+ (UIColor *)colorFromRGBA:(NSString *)rgba;

@end

@interface CDVThemeableBrowserNavigationController : UINavigationController

@property (nonatomic, weak) id <CDVScreenOrientationDelegate> orientationDelegate;

@end

