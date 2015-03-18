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

#import "CDVInAppBrowser.h"
#import <Cordova/CDVPluginResult.h>
#import <Cordova/CDVUserAgentUtil.h>

#define    kInAppBrowserTargetSelf @"_self"
#define    kInAppBrowserTargetSystem @"_system"
#define    kInAppBrowserTargetBlank @"_blank"

#define    kInAppBrowserToolbarBarPositionBottom @"bottom"
#define    kInAppBrowserToolbarBarPositionTop @"top"

#define    kThemedBrowserAlignLeft @"left"
#define    kThemedBrowserAlignRight @"right"
#define    kThemedBrowserMenuEvent @"event"
#define    kThemedBrowserMenuLabel @"label"

#define    TOOLBAR_HEIGHT 44.0
#define    LOCATIONBAR_HEIGHT 21.0
#define    FOOTER_HEIGHT ((TOOLBAR_HEIGHT) + (LOCATIONBAR_HEIGHT))

#pragma mark CDVInAppBrowser

@interface CDVInAppBrowser () {
    NSInteger _previousStatusBarStyle;
}
@end

@implementation CDVInAppBrowser

- (CDVInAppBrowser*)initWithWebView:(UIWebView*)theWebView
{
    self = [super initWithWebView:theWebView];
    if (self != nil) {
        _previousStatusBarStyle = -1;
        _callbackIdPattern = nil;
    }

    return self;
}

- (void)onReset
{
    [self close:nil];
}

- (void)close:(CDVInvokedUrlCommand*)command
{
    if (self.inAppBrowserViewController == nil) {
        NSLog(@"IAB.close() called but it was already closed.");
        return;
    }
    // Things are cleaned up in browserExit.
    [self.inAppBrowserViewController close];
}

- (BOOL) isSystemUrl:(NSURL*)url
{
	if ([[url host] isEqualToString:@"itunes.apple.com"]) {
		return YES;
	}

	return NO;
}

- (void)open:(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult;

    NSString* url = [command argumentAtIndex:0];
    NSString* target = [command argumentAtIndex:1 withDefault:kInAppBrowserTargetSelf];
    NSString* options = [command argumentAtIndex:2 withDefault:@"" andClass:[NSString class]];

    self.callbackId = command.callbackId;

    if (url != nil) {
        NSURL* baseUrl = [self.webView.request URL];
        NSURL* absoluteUrl = [[NSURL URLWithString:url relativeToURL:baseUrl] absoluteURL];

        if ([self isSystemUrl:absoluteUrl]) {
            target = kInAppBrowserTargetSystem;
        }

        if ([target isEqualToString:kInAppBrowserTargetSelf]) {
            [self openInCordovaWebView:absoluteUrl withOptions:options];
        } else if ([target isEqualToString:kInAppBrowserTargetSystem]) {
            [self openInSystem:absoluteUrl];
        } else { // _blank or anything else
            [self openInInAppBrowser:absoluteUrl withOptions:options];
        }

        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"incorrect number of arguments"];
    }

    [pluginResult setKeepCallback:[NSNumber numberWithBool:YES]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)openInInAppBrowser:(NSURL*)url withOptions:(NSString*)options
{
    CDVInAppBrowserOptions* browserOptions = [CDVInAppBrowserOptions parseOptions:options];
    
    // Among all the options, there are a few that ThemedBrowser would like to
    // disable, since ThemedBrowser's purpose is to provide an integrated look
    // and feel that is consistent across platforms. We'd do this hack to
    // minimize changes from the original InAppBrowser so when merge from the
    // InAppBrowser is needed, it wouldn't be super pain in the ass.
    browserOptions.location = NO;
    browserOptions.toolbarposition = kInAppBrowserToolbarBarPositionTop;

    if (browserOptions.clearcache) {
        NSHTTPCookie *cookie;
        NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
        for (cookie in [storage cookies])
        {
            if (![cookie.domain isEqual: @".^filecookies^"]) {
                [storage deleteCookie:cookie];
            }
        }
    }

    if (browserOptions.clearsessioncache) {
        NSHTTPCookie *cookie;
        NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
        for (cookie in [storage cookies])
        {
            if (![cookie.domain isEqual: @".^filecookies^"] && cookie.isSessionOnly) {
                [storage deleteCookie:cookie];
            }
        }
    }

    if (self.inAppBrowserViewController == nil) {
        NSString* originalUA = [CDVUserAgentUtil originalUserAgent];
        self.inAppBrowserViewController = [[CDVInAppBrowserViewController alloc] initWithUserAgent:originalUA prevUserAgent:[self.commandDelegate userAgent] browserOptions: browserOptions];
        self.inAppBrowserViewController.navigationDelegate = self;

        if ([self.viewController conformsToProtocol:@protocol(CDVScreenOrientationDelegate)]) {
            self.inAppBrowserViewController.orientationDelegate = (UIViewController <CDVScreenOrientationDelegate>*)self.viewController;
        }
    }

    [self.inAppBrowserViewController showLocationBar:browserOptions.location];
    [self.inAppBrowserViewController showToolBar:browserOptions.toolbar :browserOptions.toolbarposition];
    if (browserOptions.closebuttoncaption != nil) {
        // [self.inAppBrowserViewController setCloseButtonTitle:browserOptions.closebuttoncaption];
    }
    // Set Presentation Style
    UIModalPresentationStyle presentationStyle = UIModalPresentationFullScreen; // default
    if (browserOptions.presentationstyle != nil) {
        if ([[browserOptions.presentationstyle lowercaseString] isEqualToString:@"pagesheet"]) {
            presentationStyle = UIModalPresentationPageSheet;
        } else if ([[browserOptions.presentationstyle lowercaseString] isEqualToString:@"formsheet"]) {
            presentationStyle = UIModalPresentationFormSheet;
        }
    }
    self.inAppBrowserViewController.modalPresentationStyle = presentationStyle;

    // Set Transition Style
    UIModalTransitionStyle transitionStyle = UIModalTransitionStyleCoverVertical; // default
    if (browserOptions.transitionstyle != nil) {
        if ([[browserOptions.transitionstyle lowercaseString] isEqualToString:@"fliphorizontal"]) {
            transitionStyle = UIModalTransitionStyleFlipHorizontal;
        } else if ([[browserOptions.transitionstyle lowercaseString] isEqualToString:@"crossdissolve"]) {
            transitionStyle = UIModalTransitionStyleCrossDissolve;
        }
    }
    self.inAppBrowserViewController.modalTransitionStyle = transitionStyle;

    // prevent webView from bouncing
    if (browserOptions.disallowoverscroll) {
        if ([self.inAppBrowserViewController.webView respondsToSelector:@selector(scrollView)]) {
            ((UIScrollView*)[self.inAppBrowserViewController.webView scrollView]).bounces = NO;
        } else {
            for (id subview in self.inAppBrowserViewController.webView.subviews) {
                if ([[subview class] isSubclassOfClass:[UIScrollView class]]) {
                    ((UIScrollView*)subview).bounces = NO;
                }
            }
        }
    }

    // UIWebView options
    self.inAppBrowserViewController.webView.scalesPageToFit = browserOptions.enableviewportscale;
    self.inAppBrowserViewController.webView.mediaPlaybackRequiresUserAction = browserOptions.mediaplaybackrequiresuseraction;
    self.inAppBrowserViewController.webView.allowsInlineMediaPlayback = browserOptions.allowinlinemediaplayback;
    if (IsAtLeastiOSVersion(@"6.0")) {
        self.inAppBrowserViewController.webView.keyboardDisplayRequiresUserAction = browserOptions.keyboarddisplayrequiresuseraction;
        self.inAppBrowserViewController.webView.suppressesIncrementalRendering = browserOptions.suppressesincrementalrendering;
    }

    [self.inAppBrowserViewController navigateTo:url];
    if (!browserOptions.hidden) {
        [self show:nil];
    }
}

- (void)show:(CDVInvokedUrlCommand*)command
{
    if (self.inAppBrowserViewController == nil) {
        NSLog(@"Tried to show IAB after it was closed.");
        return;
    }
    if (_previousStatusBarStyle != -1) {
        NSLog(@"Tried to show IAB while already shown");
        return;
    }

    _previousStatusBarStyle = [UIApplication sharedApplication].statusBarStyle;

    CDVInAppBrowserNavigationController* nav = [[CDVInAppBrowserNavigationController alloc]
                                   initWithRootViewController:self.inAppBrowserViewController];
    nav.orientationDelegate = self.inAppBrowserViewController;
    nav.navigationBarHidden = YES;
    // Run later to avoid the "took a long time" log message.
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self.inAppBrowserViewController != nil) {
            [self.viewController presentViewController:nav animated:YES completion:nil];
        }
    });
}

- (void)openInCordovaWebView:(NSURL*)url withOptions:(NSString*)options
{
    if ([self.commandDelegate URLIsWhitelisted:url]) {
        NSURLRequest* request = [NSURLRequest requestWithURL:url];
        [self.webView loadRequest:request];
    } else { // this assumes the InAppBrowser can be excepted from the white-list
        [self openInInAppBrowser:url withOptions:options];
    }
}

- (void)openInSystem:(NSURL*)url
{
    if ([[UIApplication sharedApplication] canOpenURL:url]) {
        [[UIApplication sharedApplication] openURL:url];
    } else { // handle any custom schemes to plugins
        [[NSNotificationCenter defaultCenter] postNotification:[NSNotification notificationWithName:CDVPluginHandleOpenURLNotification object:url]];
    }
}

// This is a helper method for the inject{Script|Style}{Code|File} API calls, which
// provides a consistent method for injecting JavaScript code into the document.
//
// If a wrapper string is supplied, then the source string will be JSON-encoded (adding
// quotes) and wrapped using string formatting. (The wrapper string should have a single
// '%@' marker).
//
// If no wrapper is supplied, then the source string is executed directly.

- (void)injectDeferredObject:(NSString*)source withWrapper:(NSString*)jsWrapper
{
    if (!_injectedIframeBridge) {
        _injectedIframeBridge = YES;
        // Create an iframe bridge in the new document to communicate with the CDVInAppBrowserViewController
        [self.inAppBrowserViewController.webView stringByEvaluatingJavaScriptFromString:@"(function(d){var e = _cdvIframeBridge = d.createElement('iframe');e.style.display='none';d.body.appendChild(e);})(document)"];
    }

    if (jsWrapper != nil) {
        NSData* jsonData = [NSJSONSerialization dataWithJSONObject:@[source] options:0 error:nil];
        NSString* sourceArrayString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        if (sourceArrayString) {
            NSString* sourceString = [sourceArrayString substringWithRange:NSMakeRange(1, [sourceArrayString length] - 2)];
            NSString* jsToInject = [NSString stringWithFormat:jsWrapper, sourceString];
            [self.inAppBrowserViewController.webView stringByEvaluatingJavaScriptFromString:jsToInject];
        }
    } else {
        [self.inAppBrowserViewController.webView stringByEvaluatingJavaScriptFromString:source];
    }
}

- (void)injectScriptCode:(CDVInvokedUrlCommand*)command
{
    NSString* jsWrapper = nil;

    if ((command.callbackId != nil) && ![command.callbackId isEqualToString:@"INVALID"]) {
        jsWrapper = [NSString stringWithFormat:@"_cdvIframeBridge.src='gap-iab://%@/'+encodeURIComponent(JSON.stringify([eval(%%@)]));", command.callbackId];
    }
    [self injectDeferredObject:[command argumentAtIndex:0] withWrapper:jsWrapper];
}

- (void)injectScriptFile:(CDVInvokedUrlCommand*)command
{
    NSString* jsWrapper;

    if ((command.callbackId != nil) && ![command.callbackId isEqualToString:@"INVALID"]) {
        jsWrapper = [NSString stringWithFormat:@"(function(d) { var c = d.createElement('script'); c.src = %%@; c.onload = function() { _cdvIframeBridge.src='gap-iab://%@'; }; d.body.appendChild(c); })(document)", command.callbackId];
    } else {
        jsWrapper = @"(function(d) { var c = d.createElement('script'); c.src = %@; d.body.appendChild(c); })(document)";
    }
    [self injectDeferredObject:[command argumentAtIndex:0] withWrapper:jsWrapper];
}

- (void)injectStyleCode:(CDVInvokedUrlCommand*)command
{
    NSString* jsWrapper;

    if ((command.callbackId != nil) && ![command.callbackId isEqualToString:@"INVALID"]) {
        jsWrapper = [NSString stringWithFormat:@"(function(d) { var c = d.createElement('style'); c.innerHTML = %%@; c.onload = function() { _cdvIframeBridge.src='gap-iab://%@'; }; d.body.appendChild(c); })(document)", command.callbackId];
    } else {
        jsWrapper = @"(function(d) { var c = d.createElement('style'); c.innerHTML = %@; d.body.appendChild(c); })(document)";
    }
    [self injectDeferredObject:[command argumentAtIndex:0] withWrapper:jsWrapper];
}

- (void)injectStyleFile:(CDVInvokedUrlCommand*)command
{
    NSString* jsWrapper;

    if ((command.callbackId != nil) && ![command.callbackId isEqualToString:@"INVALID"]) {
        jsWrapper = [NSString stringWithFormat:@"(function(d) { var c = d.createElement('link'); c.rel='stylesheet'; c.type='text/css'; c.href = %%@; c.onload = function() { _cdvIframeBridge.src='gap-iab://%@'; }; d.body.appendChild(c); })(document)", command.callbackId];
    } else {
        jsWrapper = @"(function(d) { var c = d.createElement('link'); c.rel='stylesheet', c.type='text/css'; c.href = %@; d.body.appendChild(c); })(document)";
    }
    [self injectDeferredObject:[command argumentAtIndex:0] withWrapper:jsWrapper];
}

- (BOOL)isValidCallbackId:(NSString *)callbackId
{
    NSError *err = nil;
    // Initialize on first use
    if (self.callbackIdPattern == nil) {
        self.callbackIdPattern = [NSRegularExpression regularExpressionWithPattern:@"^InAppBrowser[0-9]{1,10}$" options:0 error:&err];
        if (err != nil) {
            // Couldn't initialize Regex; No is safer than Yes.
            return NO;
        }
    }
    if ([self.callbackIdPattern firstMatchInString:callbackId options:0 range:NSMakeRange(0, [callbackId length])]) {
        return YES;
    }
    return NO;
}

/**
 * The iframe bridge provided for the InAppBrowser is capable of executing any oustanding callback belonging
 * to the InAppBrowser plugin. Care has been taken that other callbacks cannot be triggered, and that no
 * other code execution is possible.
 *
 * To trigger the bridge, the iframe (or any other resource) should attempt to load a url of the form:
 *
 * gap-iab://<callbackId>/<arguments>
 *
 * where <callbackId> is the string id of the callback to trigger (something like "InAppBrowser0123456789")
 *
 * If present, the path component of the special gap-iab:// url is expected to be a URL-escaped JSON-encoded
 * value to pass to the callback. [NSURL path] should take care of the URL-unescaping, and a JSON_EXCEPTION
 * is returned if the JSON is invalid.
 */
- (BOOL)webView:(UIWebView*)theWebView shouldStartLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType
{
    NSURL* url = request.URL;
    BOOL isTopLevelNavigation = [request.URL isEqual:[request mainDocumentURL]];

    // See if the url uses the 'gap-iab' protocol. If so, the host should be the id of a callback to execute,
    // and the path, if present, should be a JSON-encoded value to pass to the callback.
    if ([[url scheme] isEqualToString:@"gap-iab"]) {
        NSString* scriptCallbackId = [url host];
        CDVPluginResult* pluginResult = nil;

        if ([self isValidCallbackId:scriptCallbackId]) {
            NSString* scriptResult = [url path];
            NSError* __autoreleasing error = nil;

            // The message should be a JSON-encoded array of the result of the script which executed.
            if ((scriptResult != nil) && ([scriptResult length] > 1)) {
                scriptResult = [scriptResult substringFromIndex:1];
                NSData* decodedResult = [NSJSONSerialization JSONObjectWithData:[scriptResult dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&error];
                if ((error == nil) && [decodedResult isKindOfClass:[NSArray class]]) {
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:(NSArray*)decodedResult];
                } else {
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_JSON_EXCEPTION];
                }
            } else {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:@[]];
            }
            [self.commandDelegate sendPluginResult:pluginResult callbackId:scriptCallbackId];
            return NO;
        }
    } else if ((self.callbackId != nil) && isTopLevelNavigation) {
        // Send a loadstart event for each top-level navigation (includes redirects).
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:@{@"type":@"loadstart", @"url":[url absoluteString]}];
        [pluginResult setKeepCallback:[NSNumber numberWithBool:YES]];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    }

    return YES;
}

- (void)webViewDidStartLoad:(UIWebView*)theWebView
{
    _injectedIframeBridge = NO;
}

- (void)webViewDidFinishLoad:(UIWebView*)theWebView
{
    if (self.callbackId != nil) {
        // TODO: It would be more useful to return the URL the page is actually on (e.g. if it's been redirected).
        NSString* url = [self.inAppBrowserViewController.currentURL absoluteString];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:@{@"type":@"loadstop", @"url":url}];
        [pluginResult setKeepCallback:[NSNumber numberWithBool:YES]];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    }
}

- (void)webView:(UIWebView*)theWebView didFailLoadWithError:(NSError*)error
{
    if (self.callbackId != nil) {
        NSString* url = [self.inAppBrowserViewController.currentURL absoluteString];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                      messageAsDictionary:@{@"type":@"loaderror", @"url":url, @"code": [NSNumber numberWithInteger:error.code], @"message": error.localizedDescription}];
        [pluginResult setKeepCallback:[NSNumber numberWithBool:YES]];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    }
}

- (void)browserExit
{
    if (self.callbackId != nil) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:@{@"type":@"exit"}];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
        self.callbackId = nil;
    }
    // Set navigationDelegate to nil to ensure no callbacks are received from it.
    self.inAppBrowserViewController.navigationDelegate = nil;
    // Don't recycle the ViewController since it may be consuming a lot of memory.
    // Also - this is required for the PDF/User-Agent bug work-around.
    self.inAppBrowserViewController = nil;

    /*
    if (IsAtLeastiOSVersion(@"7.0")) {
        [[UIApplication sharedApplication] setStatusBarStyle:_previousStatusBarStyle];
    }
    */

    _previousStatusBarStyle = -1; // this value was reset before reapplying it. caused statusbar to stay black on ios7
}

- (void)emitEvent:(NSDictionary*)event
{
    if (self.callbackId != nil) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:event];
        [pluginResult setKeepCallback:[NSNumber numberWithBool:YES]];
        
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    }
}

@end

#pragma mark CDVInAppBrowserViewController

@implementation CDVInAppBrowserViewController

@synthesize currentURL;

- (id)initWithUserAgent:(NSString*)userAgent prevUserAgent:(NSString*)prevUserAgent browserOptions: (CDVInAppBrowserOptions*) browserOptions
{
    self = [super init];
    if (self != nil) {
        _userAgent = userAgent;
        _prevUserAgent = prevUserAgent;
        _browserOptions = browserOptions;
        _webViewDelegate = [[CDVWebViewDelegate alloc] initWithDelegate:self];
        [self createViews];
    }

    return self;
}

- (void)createViews
{
    // We create the views in code for primarily for ease of upgrades and not requiring an external .xib to be included

    CGRect webViewBounds = self.view.bounds;
    BOOL toolbarIsAtBottom = ![_browserOptions.toolbarposition isEqualToString:kInAppBrowserToolbarBarPositionTop];
    webViewBounds.size.height -= _browserOptions.location ? FOOTER_HEIGHT : TOOLBAR_HEIGHT;
    self.webView = [[UIWebView alloc] initWithFrame:webViewBounds];

    self.webView.autoresizingMask = (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);

    [self.view addSubview:self.webView];
    [self.view sendSubviewToBack:self.webView];

    self.webView.delegate = _webViewDelegate;
    self.webView.backgroundColor = [UIColor whiteColor];

    self.webView.clearsContextBeforeDrawing = YES;
    self.webView.clipsToBounds = YES;
    self.webView.contentMode = UIViewContentModeScaleToFill;
    self.webView.multipleTouchEnabled = YES;
    self.webView.opaque = YES;
    self.webView.scalesPageToFit = NO;
    self.webView.userInteractionEnabled = YES;

    self.spinner = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhite];
    self.spinner.alpha = 1.000;
    self.spinner.autoresizesSubviews = YES;
    self.spinner.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleTopMargin;
    self.spinner.clearsContextBeforeDrawing = NO;
    self.spinner.clipsToBounds = NO;
    self.spinner.contentMode = UIViewContentModeScaleToFill;
    self.spinner.frame = CGRectMake(454.0, 231.0, 20.0, 20.0);
    self.spinner.hidden = YES;
    self.spinner.hidesWhenStopped = YES;
    self.spinner.multipleTouchEnabled = NO;
    self.spinner.opaque = NO;
    self.spinner.userInteractionEnabled = NO;
    [self.spinner stopAnimating];

    UIImage *buttonImage = [UIImage imageNamed:_browserOptions.closeButtonImage];
    UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
    button.bounds = CGRectMake(0, 0, buttonImage.size.width, buttonImage.size.height);
    CGFloat closeButtonWidth = buttonImage.size.width;
    
    [button setImage:[UIImage imageNamed:_browserOptions.closeButtonPressedImage] forState:UIControlStateHighlighted];
    [button setImage:buttonImage forState:UIControlStateNormal];
    [button addTarget:self action:@selector(close) forControlEvents:UIControlEventTouchUpInside];
    button.hidden = _browserOptions.hideCloseButton;
    
    self.closeButton = [[UIBarButtonItem alloc] initWithCustomView:button];

    UIBarButtonItem* flexibleSpaceButton = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace target:nil action:nil];

    float toolbarY = toolbarIsAtBottom ? self.view.bounds.size.height - TOOLBAR_HEIGHT : 0.0;
    CGRect toolbarFrame = CGRectMake(0.0, toolbarY, self.view.bounds.size.width, TOOLBAR_HEIGHT);

    self.toolbar = [[UIToolbar alloc] initWithFrame:toolbarFrame];
    self.toolbar.alpha = 1.000;
    self.toolbar.autoresizesSubviews = YES;
    self.toolbar.autoresizingMask = toolbarIsAtBottom ? (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin) : UIViewAutoresizingFlexibleWidth;
    self.toolbar.barStyle = UIBarStyleBlackOpaque;
    self.toolbar.clearsContextBeforeDrawing = NO;
    self.toolbar.clipsToBounds = NO;
    self.toolbar.contentMode = UIViewContentModeScaleToFill;
    self.toolbar.hidden = NO;
    self.toolbar.multipleTouchEnabled = NO;
    self.toolbar.opaque = NO;
    self.toolbar.userInteractionEnabled = YES;
    self.toolbar.barTintColor = [CDVInAppBrowserViewController colorFromRGBA:_browserOptions.toolbarColor];
    
    if (_browserOptions.toolbarImage) {
        UIImage *image = [UIImage imageNamed:_browserOptions.toolbarImage];
        [self.toolbar setBackgroundImage:image forToolbarPosition:UIToolbarPositionAny barMetrics:UIBarMetricsDefault];
        [self.toolbar setBackgroundImage:image forToolbarPosition:UIToolbarPositionAny barMetrics:UIBarMetricsLandscapePhone];
    } else if (_browserOptions.toolbarImagePortrait || _browserOptions.toolbarImageLandscape) {
        if (_browserOptions.toolbarImagePortrait) {
            UIImage *image = [UIImage imageNamed:_browserOptions.toolbarImagePortrait];
            [self.toolbar setBackgroundImage:image forToolbarPosition:UIToolbarPositionAny barMetrics:UIBarMetricsDefault];
        }
        if (_browserOptions.toolbarImageLandscape) {
            UIImage *image = [UIImage imageNamed:_browserOptions.toolbarImageLandscape];
            [self.toolbar setBackgroundImage:image forToolbarPosition:UIToolbarPositionAny barMetrics:UIBarMetricsLandscapePhone];
        }
    }

    CGFloat labelInset = 5.0;
    float locationBarY = toolbarIsAtBottom ? self.view.bounds.size.height - FOOTER_HEIGHT : self.view.bounds.size.height - LOCATIONBAR_HEIGHT;

    self.addressLabel = [[UILabel alloc] initWithFrame:CGRectMake(labelInset, locationBarY, self.view.bounds.size.width - labelInset, LOCATIONBAR_HEIGHT)];
    self.addressLabel.adjustsFontSizeToFitWidth = NO;
    self.addressLabel.alpha = 1.000;
    self.addressLabel.autoresizesSubviews = YES;
    self.addressLabel.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleTopMargin;
    self.addressLabel.backgroundColor = [UIColor clearColor];
    self.addressLabel.baselineAdjustment = UIBaselineAdjustmentAlignCenters;
    self.addressLabel.clearsContextBeforeDrawing = YES;
    self.addressLabel.clipsToBounds = YES;
    self.addressLabel.contentMode = UIViewContentModeScaleToFill;
    self.addressLabel.enabled = YES;
    self.addressLabel.hidden = NO;
    self.addressLabel.lineBreakMode = NSLineBreakByTruncatingTail;

    if ([self.addressLabel respondsToSelector:NSSelectorFromString(@"setMinimumScaleFactor:")]) {
        [self.addressLabel setValue:@(10.0/[UIFont labelFontSize]) forKey:@"minimumScaleFactor"];
    } else if ([self.addressLabel respondsToSelector:NSSelectorFromString(@"setMinimumFontSize:")]) {
        [self.addressLabel setValue:@(10.0) forKey:@"minimumFontSize"];
    }

    self.addressLabel.multipleTouchEnabled = NO;
    self.addressLabel.numberOfLines = 1;
    self.addressLabel.opaque = NO;
    self.addressLabel.shadowOffset = CGSizeMake(0.0, -1.0);
    self.addressLabel.text = NSLocalizedString(@"Loading...", nil);
    self.addressLabel.textAlignment = NSTextAlignmentLeft;
    self.addressLabel.textColor = [UIColor colorWithWhite:1.000 alpha:1.000];
    self.addressLabel.userInteractionEnabled = NO;
    
    buttonImage = [UIImage imageNamed:_browserOptions.forwardButtonImage];
    button = [UIButton buttonWithType:UIButtonTypeCustom];
    button.bounds = CGRectMake(0, 0, buttonImage.size.width, buttonImage.size.height);
    CGFloat forwardButtonWidth = buttonImage.size.width;
    
    [button setImage:[UIImage imageNamed:_browserOptions.forwardButtonPressedImage] forState:UIControlStateHighlighted];
    [button setImage:buttonImage forState:UIControlStateNormal];
    [button addTarget:self action:@selector(goForward:) forControlEvents:UIControlEventTouchUpInside];
    button.hidden = _browserOptions.hideForwardButton;

    self.forwardButton = [[UIBarButtonItem alloc] initWithCustomView:button];
    
    buttonImage = [UIImage imageNamed:_browserOptions.backButtonImage];
    button = [UIButton buttonWithType:UIButtonTypeCustom];
    button.bounds = CGRectMake(0, 0, buttonImage.size.width, buttonImage.size.height);
    CGFloat backButtonWidth = buttonImage.size.width;
    
    [button setImage:[UIImage imageNamed:_browserOptions.backButtonPressedImage] forState:UIControlStateHighlighted];
    [button setImage:buttonImage forState:UIControlStateNormal];
    [button addTarget:self action:@selector(goBack:) forControlEvents:UIControlEventTouchUpInside];
    button.hidden = _browserOptions.hideBackButton;

    self.backButton = [[UIBarButtonItem alloc] initWithCustomView:button];
    
    buttonImage = [UIImage imageNamed:_browserOptions.menuButtonImage];
    button = [UIButton buttonWithType:UIButtonTypeCustom];
    button.bounds = CGRectMake(0, 0, buttonImage.size.width, buttonImage.size.height);
    CGFloat menuButtonWidth = buttonImage.size.width;
    
    [button setImage:[UIImage imageNamed:_browserOptions.menuButtonPressedImage] forState:UIControlStateHighlighted];
    [button setImage:buttonImage forState:UIControlStateNormal];
    [button addTarget:self action:@selector(goMenu:) forControlEvents:UIControlEventTouchUpInside];
    if (_browserOptions.menuItems) {
        button.hidden = NO;
    } else {
        button.hidden = YES;
    }
    
    self.menuButton = [[UIBarButtonItem alloc] initWithCustomView:button];
    
    // This is a hack to remove the mandatory padding from toolbar using a
    // negative width. Note that width is different depending on iPad or iPhone.
    UIBarButtonItem *paddingRemover = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFixedSpace target:nil action:nil];
    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
        paddingRemover.width = -20;
    } else {
        paddingRemover.width = -16;
    }
    
    UIBarButtonItem *divider = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFixedSpace target:nil action:nil];
    divider.width = -10;
    
    // Arramge toolbar buttons with respect to user configuration.
    CGFloat leftWidth = 0;
    CGFloat rightWidth = 0;
    BOOL isLeftPrestine = YES;
    BOOL isRightPrestine = YES;
    NSMutableArray *toolbarItems = [NSMutableArray new];
    [toolbarItems addObject:flexibleSpaceButton];
    if ([kThemedBrowserAlignLeft isEqualToString:_browserOptions.navButtonAlign]) {
        if (!_browserOptions.hideForwardButton) {
            [toolbarItems insertObject:self.forwardButton atIndex:0];
            leftWidth += forwardButtonWidth;
            isLeftPrestine = NO;
        }
        if (!_browserOptions.hideBackButton) {
            if (!isLeftPrestine) {
                [toolbarItems insertObject:divider atIndex:0];
            }
            [toolbarItems insertObject:self.backButton atIndex:0];
            leftWidth += backButtonWidth;
            isLeftPrestine = NO;
        }
    } else {
        if (!_browserOptions.hideBackButton) {
            [toolbarItems addObject:self.backButton];
            rightWidth += backButtonWidth;
            isRightPrestine = NO;
        }
        if (!_browserOptions.hideForwardButton) {
            if (!isRightPrestine) {
                [toolbarItems addObject:divider];
            }
            [toolbarItems addObject:self.forwardButton];
            rightWidth += forwardButtonWidth;
            isRightPrestine = NO;
        }
    }
    
    if (_browserOptions.menuItems) {
        if ([kThemedBrowserAlignLeft isEqualToString:_browserOptions.menuButtonAlign]) {
            if (!isLeftPrestine) {
                [toolbarItems insertObject:divider atIndex:0];
            }
            [toolbarItems insertObject:self.menuButton atIndex:0];
            leftWidth += menuButtonWidth;
            isLeftPrestine = NO;
        } else {
            if (!isRightPrestine) {
                [toolbarItems addObject:divider];
            }
            [toolbarItems addObject:self.menuButton];
            rightWidth += menuButtonWidth;
            isRightPrestine = NO;
        }
    }
    
    if (!_browserOptions.hideCloseButton) {
        if ([kThemedBrowserAlignLeft isEqualToString:_browserOptions.closeButtonAlign]) {
            if (!isLeftPrestine) {
                [toolbarItems insertObject:divider atIndex:0];
            }
            [toolbarItems insertObject:self.closeButton atIndex:0];
            leftWidth += closeButtonWidth;
            isLeftPrestine = NO;
        } else {
            if (!isRightPrestine) {
                [toolbarItems addObject:divider];
            }
            [toolbarItems addObject:self.closeButton];
            rightWidth += closeButtonWidth;
            isRightPrestine = NO;
        }
    }
    
    if (!isLeftPrestine) {
        [toolbarItems insertObject:paddingRemover atIndex:0];
    }
    
    if (!isRightPrestine) {
        [toolbarItems addObject:paddingRemover];
    }
    
    [self.toolbar setItems:toolbarItems];
    
    self.titleOffset = fmaxf(leftWidth, rightWidth);
    // The correct positioning of title is not that important right now, since
    // rePositionViews will take care of it a bit later.
    self.titleLabel = [[UILabel alloc] initWithFrame:CGRectMake(10, 0, 10, TOOLBAR_HEIGHT)];
    self.titleLabel.textAlignment = NSTextAlignmentCenter;
    self.titleLabel.numberOfLines = 1;
    self.titleLabel.lineBreakMode = NSLineBreakByTruncatingTail;
    self.titleLabel.textColor = [CDVInAppBrowserViewController colorFromRGBA:_browserOptions.titleColor];
    self.titleLabel.hidden = _browserOptions.hideTitle;
    
    if (_browserOptions.titleStaticText) {
        self.titleLabel.text = _browserOptions.titleStaticText;
    }

    self.view.backgroundColor = [CDVInAppBrowserViewController colorFromRGBA:_browserOptions.statusBarColor];
    [self.view addSubview:self.toolbar];
    [self.toolbar addSubview:self.titleLabel];
    [self.view addSubview:self.addressLabel];
    // [self.view addSubview:self.spinner];
}

- (void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
    [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];

    // Reposition views.
    [self rePositionViews];
}

- (void) setWebViewFrame : (CGRect) frame {
    NSLog(@"Setting the WebView's frame to %@", NSStringFromCGRect(frame));
    [self.webView setFrame:frame];
}

- (void)setCloseButtonTitle:(NSString*)title
{
    // the advantage of using UIBarButtonSystemItemDone is the system will localize it for you automatically
    // but, if you want to set this yourself, knock yourself out (we can't set the title for a system Done button, so we have to create a new one)
    self.closeButton = nil;
    self.closeButton = [[UIBarButtonItem alloc] initWithTitle:title style:UIBarButtonItemStyleBordered target:self action:@selector(close)];
    self.closeButton.enabled = YES;
    // self.closeButton.tintColor = [UIColor colorWithRed:60.0 / 255.0 green:136.0 / 255.0 blue:230.0 / 255.0 alpha:1];

    NSMutableArray* items = [self.toolbar.items mutableCopy];
    [items replaceObjectAtIndex:0 withObject:self.closeButton];
    [self.toolbar setItems:items];
}

- (void)showLocationBar:(BOOL)show
{
    CGRect locationbarFrame = self.addressLabel.frame;

    BOOL toolbarVisible = !self.toolbar.hidden;

    // prevent double show/hide
    if (show == !(self.addressLabel.hidden)) {
        return;
    }

    if (show) {
        self.addressLabel.hidden = NO;

        if (toolbarVisible) {
            // toolBar at the bottom, leave as is
            // put locationBar on top of the toolBar

            CGRect webViewBounds = self.view.bounds;
            webViewBounds.size.height -= FOOTER_HEIGHT;
            [self setWebViewFrame:webViewBounds];

            locationbarFrame.origin.y = webViewBounds.size.height;
            self.addressLabel.frame = locationbarFrame;
        } else {
            // no toolBar, so put locationBar at the bottom

            CGRect webViewBounds = self.view.bounds;
            webViewBounds.size.height -= LOCATIONBAR_HEIGHT;
            [self setWebViewFrame:webViewBounds];

            locationbarFrame.origin.y = webViewBounds.size.height;
            self.addressLabel.frame = locationbarFrame;
        }
    } else {
        self.addressLabel.hidden = YES;

        if (toolbarVisible) {
            // locationBar is on top of toolBar, hide locationBar

            // webView take up whole height less toolBar height
            CGRect webViewBounds = self.view.bounds;
            webViewBounds.size.height -= TOOLBAR_HEIGHT;
            [self setWebViewFrame:webViewBounds];
        } else {
            // no toolBar, expand webView to screen dimensions
            [self setWebViewFrame:self.view.bounds];
        }
    }
}

- (void)showToolBar:(BOOL)show : (NSString *) toolbarPosition
{
    CGRect toolbarFrame = self.toolbar.frame;
    CGRect locationbarFrame = self.addressLabel.frame;

    BOOL locationbarVisible = !self.addressLabel.hidden;

    // prevent double show/hide
    if (show == !(self.toolbar.hidden)) {
        return;
    }

    if (show) {
        self.toolbar.hidden = NO;
        CGRect webViewBounds = self.view.bounds;

        if (locationbarVisible) {
            // locationBar at the bottom, move locationBar up
            // put toolBar at the bottom
            webViewBounds.size.height -= FOOTER_HEIGHT;
            locationbarFrame.origin.y = webViewBounds.size.height;
            self.addressLabel.frame = locationbarFrame;
            self.toolbar.frame = toolbarFrame;
        } else {
            // no locationBar, so put toolBar at the bottom
            CGRect webViewBounds = self.view.bounds;
            webViewBounds.size.height -= TOOLBAR_HEIGHT;
            self.toolbar.frame = toolbarFrame;
        }

        if ([toolbarPosition isEqualToString:kInAppBrowserToolbarBarPositionTop]) {
            toolbarFrame.origin.y = 0;
            webViewBounds.origin.y += toolbarFrame.size.height;
            [self setWebViewFrame:webViewBounds];
        } else {
            toolbarFrame.origin.y = (webViewBounds.size.height + LOCATIONBAR_HEIGHT);
        }
        [self setWebViewFrame:webViewBounds];

    } else {
        self.toolbar.hidden = YES;

        if (locationbarVisible) {
            // locationBar is on top of toolBar, hide toolBar
            // put locationBar at the bottom

            // webView take up whole height less locationBar height
            CGRect webViewBounds = self.view.bounds;
            webViewBounds.size.height -= LOCATIONBAR_HEIGHT;
            [self setWebViewFrame:webViewBounds];

            // move locationBar down
            locationbarFrame.origin.y = webViewBounds.size.height;
            self.addressLabel.frame = locationbarFrame;
        } else {
            // no locationBar, expand webView to screen dimensions
            [self setWebViewFrame:self.view.bounds];
        }
    }
}

- (void)viewDidLoad
{
    [super viewDidLoad];
}

- (void)viewDidUnload
{
    [self.webView loadHTMLString:nil baseURL:nil];
    [CDVUserAgentUtil releaseLock:&_userAgentLockToken];
    [super viewDidUnload];
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
    return UIStatusBarStyleDefault;
}

- (void)close
{
    [CDVUserAgentUtil releaseLock:&_userAgentLockToken];
    self.currentURL = nil;

    if ((self.navigationDelegate != nil) && [self.navigationDelegate respondsToSelector:@selector(browserExit)]) {
        [self.navigationDelegate browserExit];
    }

    // Run later to avoid the "took a long time" log message.
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([self respondsToSelector:@selector(presentingViewController)]) {
            [[self presentingViewController] dismissViewControllerAnimated:YES completion:nil];
        } else {
            [[self parentViewController] dismissViewControllerAnimated:YES completion:nil];
        }
    });
}

- (void)navigateTo:(NSURL*)url
{
    NSURLRequest* request = [NSURLRequest requestWithURL:url];

    if (_userAgentLockToken != 0) {
        [self.webView loadRequest:request];
    } else {
        [CDVUserAgentUtil acquireLock:^(NSInteger lockToken) {
            _userAgentLockToken = lockToken;
            [CDVUserAgentUtil setUserAgent:_userAgent lockToken:lockToken];
            [self.webView loadRequest:request];
        }];
    }
}

- (void)goBack:(id)sender
{
    if (self.webView.canGoBack) {
        [self.webView goBack];
    } else if (_browserOptions.backButtonCanClose) {
        [self close];
    }
}

- (void)goMenu:(id)sender
{
    if (IsAtLeastiOSVersion(@"8.0")) {
        // iOS > 8 implementation using UIAlertController, which is the new way
        // to do this going forward.
        UIAlertController *alertController = [UIAlertController
                                              alertControllerWithTitle:_browserOptions.menuTitle
                                              message:nil
                                              preferredStyle:UIAlertControllerStyleActionSheet];
        
        for (NSInteger i = 0; i < _browserOptions.menuItems.count; i++) {
            NSInteger index = i;
            NSDictionary *item = _browserOptions.menuItems[index];
            
            UIAlertAction *a = [UIAlertAction
                                 actionWithTitle:item[@"label"]
                                 style:UIAlertActionStyleDefault
                                 handler:^(UIAlertAction *action) {
                                     [self menuSelected:index];
                                 }];
            [alertController addAction:a];
        }
        
        if (_browserOptions.menuCancel) {
            UIAlertAction *cancelAction = [UIAlertAction
                                           actionWithTitle:@"Cancel"
                                           style:UIAlertActionStyleCancel
                                           handler:nil];
            [alertController addAction:cancelAction];
        }

        [self presentViewController:alertController animated:YES completion:nil];
    } else {
        // iOS < 8 implementation using UIActionSheet, which is deprecated.
        UIActionSheet *popup = [[UIActionSheet alloc] initWithTitle:_browserOptions.menuTitle delegate:self cancelButtonTitle:nil destructiveButtonTitle:nil otherButtonTitles:
                                nil];
        for (NSDictionary *item in _browserOptions.menuItems) {
            [popup addButtonWithTitle:item[@"label"]];
        }
        if (_browserOptions.menuCancel) {
            [popup addButtonWithTitle:_browserOptions.menuCancel];
            popup.cancelButtonIndex = _browserOptions.menuItems.count;
        }
        [popup showInView:[UIApplication sharedApplication].keyWindow];
    }
}

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
    [self menuSelected:buttonIndex];
}

- (void) menuSelected:(NSInteger)index
{
    if (index < _browserOptions.menuItems.count) {
        [self.navigationDelegate emitEvent:@{
            @"type": _browserOptions.menuItems[index][kThemedBrowserMenuEvent],
            @"url": [self.navigationDelegate.inAppBrowserViewController.currentURL absoluteString],
            @"menuIndex": [NSNumber numberWithLong:index]
        }];
    }
}

- (void)goForward:(id)sender
{
    [self.webView goForward];
}

- (void)viewWillAppear:(BOOL)animated
{
    /*
    if (IsAtLeastiOSVersion(@"7.0")) {
        [[UIApplication sharedApplication] setStatusBarStyle:[self preferredStatusBarStyle]];
    }
    */
    [self rePositionViews];

    [super viewWillAppear:animated];
}

//
// On iOS 7 the status bar is part of the view's dimensions, therefore it's height has to be taken into account.
// The height of it could be hardcoded as 20 pixels, but that would assume that the upcoming releases of iOS won't
// change that value.
//
- (float) getStatusBarOffset {
    CGRect statusBarFrame = [[UIApplication sharedApplication] statusBarFrame];
    float statusBarOffset = IsAtLeastiOSVersion(@"7.0") ? MIN(statusBarFrame.size.width, statusBarFrame.size.height) : 0.0;
    return statusBarOffset;
}

- (void) rePositionViews {
    if ([_browserOptions.toolbarposition isEqualToString:kInAppBrowserToolbarBarPositionTop]) {
        [self.webView setFrame:CGRectMake(self.webView.frame.origin.x, TOOLBAR_HEIGHT, self.webView.frame.size.width, self.webView.frame.size.height)];
        [self.toolbar setFrame:CGRectMake(self.toolbar.frame.origin.x, [self getStatusBarOffset], self.toolbar.frame.size.width, self.toolbar.frame.size.height)];
    }
    
    CGFloat screenWidth = CGRectGetWidth(self.view.frame);
    NSInteger width = floorf(screenWidth - self.titleOffset * 2.0f);
    self.titleLabel.frame = CGRectMake(floorf((screenWidth - width) / 2.0f), 0, width, TOOLBAR_HEIGHT);
}

#pragma mark UIWebViewDelegate

- (void)webViewDidStartLoad:(UIWebView*)theWebView
{
    // loading url, start spinner, update back/forward

    self.addressLabel.text = NSLocalizedString(@"Loading...", nil);
    if (!_browserOptions.backButtonCanClose) {
        self.backButton.enabled = theWebView.canGoBack;
    }
    self.forwardButton.enabled = theWebView.canGoForward;

    [self.spinner startAnimating];

    return [self.navigationDelegate webViewDidStartLoad:theWebView];
}

- (BOOL)webView:(UIWebView*)theWebView shouldStartLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType
{
    BOOL isTopLevelNavigation = [request.URL isEqual:[request mainDocumentURL]];

    if (isTopLevelNavigation) {
        self.currentURL = request.URL;
    }
    return [self.navigationDelegate webView:theWebView shouldStartLoadWithRequest:request navigationType:navigationType];
}

- (void)webViewDidFinishLoad:(UIWebView*)theWebView
{
    // update url, stop spinner, update back/forward

    self.addressLabel.text = [self.currentURL absoluteString];
    if (!_browserOptions.backButtonCanClose) {
        self.backButton.enabled = theWebView.canGoBack;
    }
    self.forwardButton.enabled = theWebView.canGoForward;
    if (!_browserOptions.hideTitle && !_browserOptions.titleStaticText) {
        // Update title text to page title when title is shown and we are not
        // required to show a static text.
        self.titleLabel.text = [self.webView stringByEvaluatingJavaScriptFromString:@"document.title"];
    }

    [self.spinner stopAnimating];

    // Work around a bug where the first time a PDF is opened, all UIWebViews
    // reload their User-Agent from NSUserDefaults.
    // This work-around makes the following assumptions:
    // 1. The app has only a single Cordova Webview. If not, then the app should
    //    take it upon themselves to load a PDF in the background as a part of
    //    their start-up flow.
    // 2. That the PDF does not require any additional network requests. We change
    //    the user-agent here back to that of the CDVViewController, so requests
    //    from it must pass through its white-list. This *does* break PDFs that
    //    contain links to other remote PDF/websites.
    // More info at https://issues.apache.org/jira/browse/CB-2225
    BOOL isPDF = [@"true" isEqualToString :[theWebView stringByEvaluatingJavaScriptFromString:@"document.body==null"]];
    if (isPDF) {
        [CDVUserAgentUtil setUserAgent:_prevUserAgent lockToken:_userAgentLockToken];
    }

    [self.navigationDelegate webViewDidFinishLoad:theWebView];
}

- (void)webView:(UIWebView*)theWebView didFailLoadWithError:(NSError*)error
{
    // log fail message, stop spinner, update back/forward
    NSLog(@"webView:didFailLoadWithError - %ld: %@", (long)error.code, [error localizedDescription]);

    if (!_browserOptions.backButtonCanClose) {
        self.backButton.enabled = theWebView.canGoBack;
    }
    self.forwardButton.enabled = theWebView.canGoForward;
    [self.spinner stopAnimating];

    self.addressLabel.text = NSLocalizedString(@"Load Error", nil);

    [self.navigationDelegate webView:theWebView didFailLoadWithError:error];
}

#pragma mark CDVScreenOrientationDelegate

- (BOOL)shouldAutorotate
{
    if ((self.orientationDelegate != nil) && [self.orientationDelegate respondsToSelector:@selector(shouldAutorotate)]) {
        return [self.orientationDelegate shouldAutorotate];
    }
    return YES;
}

- (NSUInteger)supportedInterfaceOrientations
{
    if ((self.orientationDelegate != nil) && [self.orientationDelegate respondsToSelector:@selector(supportedInterfaceOrientations)]) {
        return [self.orientationDelegate supportedInterfaceOrientations];
    }

    return 1 << UIInterfaceOrientationPortrait;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    if ((self.orientationDelegate != nil) && [self.orientationDelegate respondsToSelector:@selector(shouldAutorotateToInterfaceOrientation:)]) {
        return [self.orientationDelegate shouldAutorotateToInterfaceOrientation:interfaceOrientation];
    }

    return YES;
}

+ (UIColor *)colorFromRGBA:(NSString *)rgba {
    unsigned long long rgbaVal = 0;
    
    if ([[rgba substringWithRange:NSMakeRange(0, 1)] isEqualToString:@"#"]) {
        // First char is #, get rid of that.
        rgba = [rgba substringFromIndex:1];
    }
    
    if (rgba.length < 8) {
        // If alpha is not given, just append ff.
        rgba = [NSString stringWithFormat:@"%@ff", rgba];
    }
    
    NSScanner *scanner = [NSScanner scannerWithString:rgba];
    [scanner setScanLocation:0];
    [scanner scanHexLongLong:&rgbaVal];
    
    return [UIColor colorWithRed:((rgbaVal & 0xFF000000) >> 24) / 255.0f
        green:((rgbaVal & 0xFF0000) >>16) / 255.0f
        blue:(rgbaVal & 0xFF00 >> 8) / 255.0f
        alpha:(rgbaVal & 0xFF) / 255.0f];
}

@end

@implementation CDVInAppBrowserOptions

- (id)init
{
    if (self = [super init]) {
        // default values
        self.location = YES;
        self.toolbar = YES;
        self.closebuttoncaption = nil;
        self.toolbarposition = kInAppBrowserToolbarBarPositionBottom;
        self.clearcache = NO;
        self.clearsessioncache = NO;

        self.enableviewportscale = NO;
        self.mediaplaybackrequiresuseraction = NO;
        self.allowinlinemediaplayback = NO;
        self.keyboarddisplayrequiresuseraction = YES;
        self.suppressesincrementalrendering = NO;
        self.hidden = NO;
        self.disallowoverscroll = NO;
        
        self.statusBarColor = @"#FFFFFFFF";
        self.toolbarColor = @"#FFFFFFFF";
        self.toolbarImage = nil;
        self.toolbarImagePortrait = nil;
        self.toolbarImageLandscape = nil;
        self.titleColor = @"#000000FF";
        self.backButtonImage = @"themedbrowser_stub_back";
        self.backButtonPressedImage = @"themedbrowser_stub_back_highlight";
        self.forwardButtonImage = @"themedbrowser_stub_forward";
        self.forwardButtonPressedImage = @"themedbrowser_stub_forward_highlight";
        self.closeButtonImage = @"themedbrowser_stub_close";
        self.closeButtonPressedImage = @"themedbrowser_stub_close_highlight";
        self.menuButtonImage = @"themedbrowser_stub_menu";
        self.menuButtonPressedImage = @"themedbrowser_stub_menu_highlight";
        
        self.closeButtonAlign = kThemedBrowserAlignLeft;
        self.navButtonAlign = kThemedBrowserAlignLeft;
        self.menuButtonAlign = kThemedBrowserAlignRight;
        
        self.titleStaticText = nil;
        self.menuItems = nil;
        self.menuTitle = nil;
        self.menuCancel = nil;
        
        self.backButtonCanClose = NO;
        
        self.hideTitle = NO;
        self.hideCloseButton = NO;
        self.hideBackButton = NO;
        self.hideForwardButton = NO;
    }

    return self;
}

+ (CDVInAppBrowserOptions*)parseOptions:(NSString*)options
{
    CDVInAppBrowserOptions* obj = [[CDVInAppBrowserOptions alloc] init];
    
    // Min support, iOS 5. We will use the JSON parser that comes with iOS 5.
    NSError *error = nil;
    NSData *data = [options dataUsingEncoding:NSUTF8StringEncoding];
    id jsonObj = [NSJSONSerialization
                 JSONObjectWithData:data
                 options:0
                 error:&error];
    
    if(error) {
        NSLog(@"Invalid JSON %@", error);
    } else if([jsonObj isKindOfClass:[NSDictionary class]]) {
        NSDictionary *dict = jsonObj;
        for (NSString *key in dict) {
            if ([obj respondsToSelector:NSSelectorFromString(key)]) {
                [obj setValue:dict[key] forKey:key];
            }
        }
    }
    
    [CDVInAppBrowserOptions validateOptions:obj];

    return obj;
}

+ (void)validateOptions:(CDVInAppBrowserOptions*)options
{
    // Validate menuItems format, which is somewhat complex and make sure that
    // it's valid. Throw exception immediately so that user knows what's up.
    if (options.menuItems) {
        if (![options.menuItems isKindOfClass:[NSArray class]]) {
            @throw([NSException exceptionWithName:@"Invalid format" reason:@"menuItems must a list." userInfo:nil]);
        }
        
        for (id i in options.menuItems) {
            if (![i isKindOfClass:[NSDictionary class]]) {
                @throw([NSException exceptionWithName:@"Invalid format" reason:@"menuItems must be a list of dict." userInfo:nil]);
            }
            
            NSDictionary *dict = i;
            if (![dict objectForKey:kThemedBrowserMenuEvent]) {
                @throw([NSException exceptionWithName:@"Invalid format"
                                               reason:[NSString stringWithFormat:@"menuItems item must contain a key named %@.", kThemedBrowserMenuEvent] userInfo:nil]);
            } else if (![[dict objectForKey:kThemedBrowserMenuEvent] isKindOfClass:[NSString class]]) {
                @throw([NSException exceptionWithName:@"Invalid format"
                                               reason:[NSString stringWithFormat:@"menuItems %@ must be a string", kThemedBrowserMenuEvent] userInfo:nil]);
            }
            
            if (![dict objectForKey:kThemedBrowserMenuLabel]) {
                @throw([NSException exceptionWithName:@"Invalid format"
                                               reason:[NSString stringWithFormat:@"menuItems item must contain a key named %@.", kThemedBrowserMenuLabel] userInfo:nil]);
            } else if (![[dict objectForKey:kThemedBrowserMenuLabel] isKindOfClass:[NSString class]]) {
                @throw([NSException exceptionWithName:@"Invalid format"
                                               reason:[NSString stringWithFormat:@"menuItems %@ must be a string", kThemedBrowserMenuLabel] userInfo:nil]);
            }
        }
    }
}

@end

#pragma mark CDVScreenOrientationDelegate

@implementation CDVInAppBrowserNavigationController : UINavigationController

- (BOOL)shouldAutorotate
{
    if ((self.orientationDelegate != nil) && [self.orientationDelegate respondsToSelector:@selector(shouldAutorotate)]) {
        return [self.orientationDelegate shouldAutorotate];
    }
    return YES;
}

- (NSUInteger)supportedInterfaceOrientations
{
    if ((self.orientationDelegate != nil) && [self.orientationDelegate respondsToSelector:@selector(supportedInterfaceOrientations)]) {
        return [self.orientationDelegate supportedInterfaceOrientations];
    }

    return 1 << UIInterfaceOrientationPortrait;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    if ((self.orientationDelegate != nil) && [self.orientationDelegate respondsToSelector:@selector(shouldAutorotateToInterfaceOrientation:)]) {
        return [self.orientationDelegate shouldAutorotateToInterfaceOrientation:interfaceOrientation];
    }

    return YES;
}


@end
