/**
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
#ifndef __CORDOVA_8_0_0
#import <Cordova/NSDictionary+CordovaPreferences.h>
// cordova-ios 8 introduced CDVSettingsDictionary, which should be used
// instead of NSDictionary+CordovaPreferences
// For cordova-ios 7 and earlier, we create a type alias for NSDictionary to CDVSettingsDictionary,
// so that a symbolic "CDVSettingsDictionary" can be used in these older cordova-ios versions.
typedef NSDictionary CDVSettingsDictionary;
#endif
#import "CDVWKInAppBrowserUIDelegate.h"
#import "CDVInAppBrowserOptions.h"
#import "CDVInAppBrowserNavigationController.h"

@class CDVWKInAppBrowserViewController;

@interface CDVWKInAppBrowser : CDVPlugin
{
    UIWindow * tmpWindow;

    @private
    NSString *_beforeload;
    BOOL _waitForBeforeload;
}

@property (nonatomic, retain) CDVWKInAppBrowserViewController *inAppBrowserViewController;
@property (nonatomic, copy) NSString *callbackId;

- (void)open:(CDVInvokedUrlCommand *)command;
- (void)close:(CDVInvokedUrlCommand *)command;
- (void)injectScriptCode:(CDVInvokedUrlCommand *)command;
- (void)show:(CDVInvokedUrlCommand *)command;
- (void)hide:(CDVInvokedUrlCommand *)command;
- (void)loadAfterBeforeload:(CDVInvokedUrlCommand *)command;

@end

@interface CDVWKInAppBrowserViewController : UIViewController <WKNavigationDelegate,
                                                               WKUIDelegate,
                                                               WKScriptMessageHandler,
                                                               UIAdaptivePresentationControllerDelegate>
{
    @private
    CDVInAppBrowserOptions *_browserOptions;
    CDVSettingsDictionary *_settings;
}

@property (nonatomic, strong) IBOutlet WKWebView *webView;
@property (nonatomic, strong) IBOutlet WKWebViewConfiguration *configuration;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *closeButton;
@property (nonatomic, strong) IBOutlet UILabel *addressLabel;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *backButton;
@property (nonatomic, strong) IBOutlet UIBarButtonItem *forwardButton;
@property (nonatomic, strong) IBOutlet UIActivityIndicatorView *spinner;
@property (nonatomic, strong) IBOutlet UIToolbar *toolbar;
@property (nonatomic, strong) IBOutlet CDVWKInAppBrowserUIDelegate *webViewUIDelegate;

@property (nonatomic, weak) CDVWKInAppBrowser *navigationDelegate;
@property (nonatomic) NSURL *currentURL;

- (void)close;
- (void)navigateTo:(NSURL *)url;
- (void)showLocationBar:(BOOL)show;
- (void)showToolBar:(BOOL)show atPosition:(NSString *)toolbarPosition;
- (void)setCloseButtonTitle:(NSString *)title withColor:(NSString *)colorString atIndex:(int)buttonIndex;
- (id)initWithBrowserOptions:(CDVInAppBrowserOptions *)browserOptions andSettings:(CDVSettingsDictionary *)settings;

@end
