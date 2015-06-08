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

#import "CDVThemeableBrowser.h"
#import <Cordova/CDVPluginResult.h>
#import <Cordova/CDVUserAgentUtil.h>

#define    kThemeableBrowserTargetSelf @"_self"
#define    kThemeableBrowserTargetSystem @"_system"
#define    kThemeableBrowserTargetBlank @"_blank"

#define    kThemeableBrowserToolbarBarPositionBottom @"bottom"
#define    kThemeableBrowserToolbarBarPositionTop @"top"

#define    kThemeableBrowserAlignLeft @"left"
#define    kThemeableBrowserAlignRight @"right"

#define    kThemeableBrowserPropEvent @"event"
#define    kThemeableBrowserPropLabel @"label"
#define    kThemeableBrowserPropColor @"color"
#define    kThemeableBrowserPropHeight @"height"
#define    kThemeableBrowserPropImage @"image"
#define    kThemeableBrowserPropImagePressed @"imagePressed"
#define    kThemeableBrowserPropStaticText @"staticText"
#define    kThemeableBrowserPropShowPageTitle @"showPageTitle"
#define    kThemeableBrowserPropAlign @"align"
#define    kThemeableBrowserPropTitle @"title"
#define    kThemeableBrowserPropCancel @"cancel"
#define    kThemeableBrowserPropItems @"items"

#define    kThemeableBrowserEmitError @"ThemeableBrowserError"
#define    kThemeableBrowserEmitWarning @"ThemeableBrowserWarning"
#define    kThemeableBrowserEmitCodeCritical @"critical"
#define    kThemeableBrowserEmitCodeLoadFail @"loadfail"
#define    kThemeableBrowserEmitCodeUnexpected @"unexpected"
#define    kThemeableBrowserEmitCodeUndefined @"undefined"

#define    TOOLBAR_DEF_HEIGHT 44.0
#define    LOCATIONBAR_HEIGHT 21.0
#define    FOOTER_HEIGHT ((TOOLBAR_HEIGHT) + (LOCATIONBAR_HEIGHT))

#pragma mark CDVThemeableBrowser

@interface CDVThemeableBrowser () {
    BOOL _isShown;
}
@end

@implementation CDVThemeableBrowser

- (CDVThemeableBrowser*)initWithWebView:(UIWebView*)theWebView
{
    self = [super initWithWebView:theWebView];
    if (self != nil) {
        _isShown = NO;
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
    if (self.themeableBrowserViewController == nil) {
        [self emitWarning:kThemeableBrowserEmitCodeUnexpected
              withMessage:@"Close called but already closed."];
        return;
    }
    // Things are cleaned up in browserExit.
    [self.themeableBrowserViewController close];
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
    NSString* target = [command argumentAtIndex:1 withDefault:kThemeableBrowserTargetSelf];
    NSString* options = [command argumentAtIndex:2 withDefault:@"" andClass:[NSString class]];

    self.callbackId = command.callbackId;

    if (url != nil) {
        NSURL* baseUrl = [self.webView.request URL];
        NSURL* absoluteUrl = [[NSURL URLWithString:url relativeToURL:baseUrl] absoluteURL];

        if ([self isSystemUrl:absoluteUrl]) {
            target = kThemeableBrowserTargetSystem;
        }

        if ([target isEqualToString:kThemeableBrowserTargetSelf]) {
            [self openInCordovaWebView:absoluteUrl withOptions:options];
        } else if ([target isEqualToString:kThemeableBrowserTargetSystem]) {
            [self openInSystem:absoluteUrl];
        } else { // _blank or anything else
            [self openInThemeableBrowser:absoluteUrl withOptions:options];
        }

        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"incorrect number of arguments"];
    }

    [pluginResult setKeepCallback:[NSNumber numberWithBool:YES]];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)reload:(CDVInvokedUrlCommand*)command
{
    if (self.themeableBrowserViewController) {
        [self.themeableBrowserViewController reload];
    }
}

- (CDVThemeableBrowserOptions*)parseOptions:(NSString*)options
{
    CDVThemeableBrowserOptions* obj = [[CDVThemeableBrowserOptions alloc] init];
    
    if (options && [options length] > 0) {
        // Min support, iOS 5. We will use the JSON parser that comes with iOS
        // 5.
        NSError *error = nil;
        NSData *data = [options dataUsingEncoding:NSUTF8StringEncoding];
        id jsonObj = [NSJSONSerialization
                      JSONObjectWithData:data
                      options:0
                      error:&error];
        
        if(error) {
            [self emitError:kThemeableBrowserEmitCodeCritical
                withMessage:[NSString stringWithFormat:@"Invalid JSON %@", error]];
        } else if([jsonObj isKindOfClass:[NSDictionary class]]) {
            NSDictionary *dict = jsonObj;
            for (NSString *key in dict) {
                if ([obj respondsToSelector:NSSelectorFromString(key)]) {
                    [obj setValue:dict[key] forKey:key];
                }
            }
        }
    } else {
        [self emitWarning:kThemeableBrowserEmitCodeUndefined
            withMessage:@"No config was given, defaults will be used, which is quite boring."];
    }
    
    return obj;
}

- (void)openInThemeableBrowser:(NSURL*)url withOptions:(NSString*)options
{
    CDVThemeableBrowserOptions* browserOptions = [self parseOptions:options];
    
    // Among all the options, there are a few that ThemedBrowser would like to
    // disable, since ThemedBrowser's purpose is to provide an integrated look
    // and feel that is consistent across platforms. We'd do this hack to
    // minimize changes from the original ThemeableBrowser so when merge from the
    // ThemeableBrowser is needed, it wouldn't be super pain in the ass.
    browserOptions.toolbarposition = kThemeableBrowserToolbarBarPositionTop;

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

    if (self.themeableBrowserViewController == nil) {
        NSString* originalUA = [CDVUserAgentUtil originalUserAgent];
        self.themeableBrowserViewController = [[CDVThemeableBrowserViewController alloc]
                                               initWithUserAgent:originalUA prevUserAgent:[self.commandDelegate userAgent]
                                               browserOptions: browserOptions
                                               navigationDelete:self
                                               statusBarStyle:[UIApplication sharedApplication].statusBarStyle];

        if ([self.viewController conformsToProtocol:@protocol(CDVScreenOrientationDelegate)]) {
            self.themeableBrowserViewController.orientationDelegate = (UIViewController <CDVScreenOrientationDelegate>*)self.viewController;
        }
    }

    [self.themeableBrowserViewController showLocationBar:browserOptions.location];
    [self.themeableBrowserViewController showToolBar:YES:browserOptions.toolbarposition];
    if (browserOptions.closebuttoncaption != nil) {
        // [self.themeableBrowserViewController setCloseButtonTitle:browserOptions.closebuttoncaption];
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
    self.themeableBrowserViewController.modalPresentationStyle = presentationStyle;

    // Set Transition Style
    UIModalTransitionStyle transitionStyle = UIModalTransitionStyleCoverVertical; // default
    if (browserOptions.transitionstyle != nil) {
        if ([[browserOptions.transitionstyle lowercaseString] isEqualToString:@"fliphorizontal"]) {
            transitionStyle = UIModalTransitionStyleFlipHorizontal;
        } else if ([[browserOptions.transitionstyle lowercaseString] isEqualToString:@"crossdissolve"]) {
            transitionStyle = UIModalTransitionStyleCrossDissolve;
        }
    }
    self.themeableBrowserViewController.modalTransitionStyle = transitionStyle;

    // prevent webView from bouncing
    if (browserOptions.disallowoverscroll) {
        if ([self.themeableBrowserViewController.webView respondsToSelector:@selector(scrollView)]) {
            ((UIScrollView*)[self.themeableBrowserViewController.webView scrollView]).bounces = NO;
        } else {
            for (id subview in self.themeableBrowserViewController.webView.subviews) {
                if ([[subview class] isSubclassOfClass:[UIScrollView class]]) {
                    ((UIScrollView*)subview).bounces = NO;
                }
            }
        }
    }

    // UIWebView options
    self.themeableBrowserViewController.webView.scalesPageToFit = browserOptions.enableviewportscale;
    self.themeableBrowserViewController.webView.mediaPlaybackRequiresUserAction = browserOptions.mediaplaybackrequiresuseraction;
    self.themeableBrowserViewController.webView.allowsInlineMediaPlayback = browserOptions.allowinlinemediaplayback;
    if (IsAtLeastiOSVersion(@"6.0")) {
        self.themeableBrowserViewController.webView.keyboardDisplayRequiresUserAction = browserOptions.keyboarddisplayrequiresuseraction;
        self.themeableBrowserViewController.webView.suppressesIncrementalRendering = browserOptions.suppressesincrementalrendering;
    }

    [self.themeableBrowserViewController navigateTo:url];
    if (!browserOptions.hidden) {
        [self show:nil withAnimation:!browserOptions.disableAnimation];
    }
}

- (void)show:(CDVInvokedUrlCommand*)command withAnimation:(BOOL)animated
{
    if (self.themeableBrowserViewController == nil) {
        [self emitWarning:kThemeableBrowserEmitCodeUnexpected
              withMessage:@"Show called but already closed."];
        return;
    }
    if (_isShown) {
        [self emitWarning:kThemeableBrowserEmitCodeUnexpected
              withMessage:@"Show called but already shown"];
        return;
    }

    _isShown = YES;

    CDVThemeableBrowserNavigationController* nav = [[CDVThemeableBrowserNavigationController alloc]
                                   initWithRootViewController:self.themeableBrowserViewController];
    nav.orientationDelegate = self.themeableBrowserViewController;
    nav.navigationBarHidden = YES;
    // Run later to avoid the "took a long time" log message.
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self.themeableBrowserViewController != nil) {
            [self.viewController presentViewController:nav animated:animated completion:nil];
        }
    });
}

- (void)openInCordovaWebView:(NSURL*)url withOptions:(NSString*)options
{
    if ([self.commandDelegate URLIsWhitelisted:url]) {
        NSURLRequest* request = [NSURLRequest requestWithURL:url];
        [self.webView loadRequest:request];
    } else { // this assumes the ThemeableBrowser can be excepted from the white-list
        [self openInThemeableBrowser:url withOptions:options];
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
        // Create an iframe bridge in the new document to communicate with the CDVThemeableBrowserViewController
        [self.themeableBrowserViewController.webView stringByEvaluatingJavaScriptFromString:@"(function(d){var e = _cdvIframeBridge = d.createElement('iframe');e.style.display='none';d.body.appendChild(e);})(document)"];
    }

    if (jsWrapper != nil) {
        NSData* jsonData = [NSJSONSerialization dataWithJSONObject:@[source] options:0 error:nil];
        NSString* sourceArrayString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        if (sourceArrayString) {
            NSString* sourceString = [sourceArrayString substringWithRange:NSMakeRange(1, [sourceArrayString length] - 2)];
            NSString* jsToInject = [NSString stringWithFormat:jsWrapper, sourceString];
            [self.themeableBrowserViewController.webView stringByEvaluatingJavaScriptFromString:jsToInject];
        }
    } else {
        [self.themeableBrowserViewController.webView stringByEvaluatingJavaScriptFromString:source];
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
        self.callbackIdPattern = [NSRegularExpression regularExpressionWithPattern:@"^ThemeableBrowser[0-9]{1,10}$" options:0 error:&err];
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
 * The iframe bridge provided for the ThemeableBrowser is capable of executing any oustanding callback belonging
 * to the ThemeableBrowser plugin. Care has been taken that other callbacks cannot be triggered, and that no
 * other code execution is possible.
 *
 * To trigger the bridge, the iframe (or any other resource) should attempt to load a url of the form:
 *
 * gap-iab://<callbackId>/<arguments>
 *
 * where <callbackId> is the string id of the callback to trigger (something like "ThemeableBrowser0123456789")
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
        NSString* url = [self.themeableBrowserViewController.currentURL absoluteString];
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:@{@"type":@"loadstop", @"url":url}];
        [pluginResult setKeepCallback:[NSNumber numberWithBool:YES]];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    }
}

- (void)webView:(UIWebView*)theWebView didFailLoadWithError:(NSError*)error
{
    if (self.callbackId != nil) {
        NSString* url = [self.themeableBrowserViewController.currentURL absoluteString];
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
    self.themeableBrowserViewController.navigationDelegate = nil;
    // Don't recycle the ViewController since it may be consuming a lot of memory.
    // Also - this is required for the PDF/User-Agent bug work-around.
    self.themeableBrowserViewController = nil;
    self.callbackId = nil;
    self.callbackIdPattern = nil;

    _isShown = NO;
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

- (void)emitError:(NSString*)code withMessage:(NSString*)message
{
    NSDictionary *event = @{
        @"type": kThemeableBrowserEmitError,
        @"code": code,
        @"message": message
    };
    
    [self emitEvent:event];
}

- (void)emitWarning:(NSString*)code withMessage:(NSString*)message
{
    NSDictionary *event = @{
       @"type": kThemeableBrowserEmitWarning,
       @"code": code,
       @"message": message
    };
    
    [self emitEvent:event];
}

@end

#pragma mark CDVThemeableBrowserViewController

@implementation CDVThemeableBrowserViewController

@synthesize currentURL;

- (id)initWithUserAgent:(NSString*)userAgent prevUserAgent:(NSString*)prevUserAgent browserOptions: (CDVThemeableBrowserOptions*) browserOptions navigationDelete:(CDVThemeableBrowser*) navigationDelegate statusBarStyle:(UIStatusBarStyle) statusBarStyle
{
    self = [super init];
    if (self != nil) {
        _userAgent = userAgent;
        _prevUserAgent = prevUserAgent;
        _browserOptions = browserOptions;
        _webViewDelegate = [[CDVWebViewDelegate alloc] initWithDelegate:self];
        _navigationDelegate = navigationDelegate;
        _statusBarStyle = statusBarStyle;
        [self createViews];
    }

    return self;
}

- (void)createViews
{
    // We create the views in code for primarily for ease of upgrades and not requiring an external .xib to be included

    CGRect webViewBounds = self.view.bounds;
    BOOL toolbarIsAtBottom = ![_browserOptions.toolbarposition isEqualToString:kThemeableBrowserToolbarBarPositionTop];
    NSDictionary* toolbarProps = _browserOptions.toolbar;
    CGFloat toolbarHeight = [self getFloatFromDict:toolbarProps withKey:kThemeableBrowserPropHeight withDefault:TOOLBAR_DEF_HEIGHT];
    webViewBounds.size.height -= toolbarHeight;
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

    CGFloat toolbarY = toolbarIsAtBottom ? self.view.bounds.size.height - toolbarHeight : 0.0;
    CGRect toolbarFrame = CGRectMake(0.0, toolbarY, self.view.bounds.size.width, toolbarHeight);
    
    self.toolbar = [[UIView alloc] initWithFrame:toolbarFrame];
    self.toolbar.alpha = 1.000;
    self.toolbar.autoresizesSubviews = YES;
    self.toolbar.autoresizingMask = toolbarIsAtBottom ? (UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin) : UIViewAutoresizingFlexibleWidth;
    self.toolbar.clearsContextBeforeDrawing = NO;
    self.toolbar.clipsToBounds = YES;
    self.toolbar.contentMode = UIViewContentModeScaleToFill;
    self.toolbar.hidden = NO;
    self.toolbar.multipleTouchEnabled = NO;
    self.toolbar.opaque = NO;
    self.toolbar.userInteractionEnabled = YES;
    self.toolbar.backgroundColor = [CDVThemeableBrowserViewController colorFromRGBA:[self getStringFromDict:toolbarProps withKey:kThemeableBrowserPropColor withDefault:@"#ffffffff"]];
    
    if (toolbarProps[kThemeableBrowserPropImage]) {
        UIImage *image = [UIImage imageNamed:toolbarProps[kThemeableBrowserPropImage]];
        self.toolbar.backgroundColor = [UIColor colorWithPatternImage:image];
    }
    
    CGFloat labelInset = 5.0;
    float locationBarY = self.view.bounds.size.height - LOCATIONBAR_HEIGHT;

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
    
    self.closeButton = [self createButton:_browserOptions.closeButton action:@selector(close) withDescription:@"close button"];
    self.backButton = [self createButton:_browserOptions.backButton action:@selector(goBack:) withDescription:@"back button"];
    self.forwardButton = [self createButton:_browserOptions.forwardButton action:@selector(goForward:) withDescription:@"forward button"];
    self.menuButton = [self createButton:_browserOptions.menu action:@selector(goMenu:) withDescription:@"menu button"];
    
    // Arramge toolbar buttons with respect to user configuration.
    CGFloat leftWidth = 0;
    CGFloat rightWidth = 0;
    
    // Both left and right side buttons will be ordered from outside to inside.
    NSMutableArray* leftButtons = [NSMutableArray new];
    NSMutableArray* rightButtons = [NSMutableArray new];
    
    if (self.closeButton) {
        CGFloat width = [self getWidthFromButton:self.closeButton];
        
        if ([kThemeableBrowserAlignRight isEqualToString:_browserOptions.closeButton[kThemeableBrowserPropAlign]]) {
            [rightButtons addObject:self.closeButton];
            rightWidth += width;
        } else {
            [leftButtons addObject:self.closeButton];
            leftWidth += width;
        }
    }
    
    if (self.menuButton) {
        CGFloat width = [self getWidthFromButton:self.menuButton];
        
        if ([kThemeableBrowserAlignRight isEqualToString:_browserOptions.menu[kThemeableBrowserPropAlign]]) {
            [rightButtons addObject:self.menuButton];
            rightWidth += width;
        } else {
            [leftButtons addObject:self.menuButton];
            leftWidth += width;
        }
    }
    
    // Back and forward buttons must be added with special ordering logic such
    // that back button is always on the left of forward button if both buttons
    // are on the same side.
    if (self.backButton && ![kThemeableBrowserAlignRight isEqualToString:_browserOptions.backButton[kThemeableBrowserPropAlign]]) {
        CGFloat width = [self getWidthFromButton:self.backButton];
        [leftButtons addObject:self.backButton];
        leftWidth += width;
    }
    
    if (self.forwardButton && [kThemeableBrowserAlignRight isEqualToString:_browserOptions.forwardButton[kThemeableBrowserPropAlign]]) {
        CGFloat width = [self getWidthFromButton:self.forwardButton];
        [rightButtons addObject:self.forwardButton];
        rightWidth += width;
    }
    
    if (self.forwardButton && ![kThemeableBrowserAlignRight isEqualToString:_browserOptions.forwardButton[kThemeableBrowserPropAlign]]) {
        CGFloat width = [self getWidthFromButton:self.forwardButton];
        [leftButtons addObject:self.forwardButton];
        leftWidth += width;
    }
    
    if (self.backButton && [kThemeableBrowserAlignRight isEqualToString:_browserOptions.backButton[kThemeableBrowserPropAlign]]) {
        CGFloat width = [self getWidthFromButton:self.backButton];
        [rightButtons addObject:self.backButton];
        rightWidth += width;
    }
    
    NSArray* customButtons = _browserOptions.customButtons;
    if (customButtons) {
        NSInteger cnt = 0;
        // Reverse loop because we are laying out from outer to inner.
        for (NSDictionary* customButton in [customButtons reverseObjectEnumerator]) {
            UIButton* button = [self createButton:customButton action:@selector(goCustomButton:) withDescription:[NSString stringWithFormat:@"custom button at %ld", (long)cnt]];
            if (button) {
                button.tag = cnt;
                CGFloat width = [self getWidthFromButton:button];
                if ([kThemeableBrowserAlignRight isEqualToString:customButton[kThemeableBrowserPropAlign]]) {
                    [rightButtons addObject:button];
                    rightWidth += width;
                } else {
                    [leftButtons addObject:button];
                    leftWidth += width;
                }
            }
            
            cnt += 1;
        }
    }
    
    self.rightButtons = rightButtons;
    self.leftButtons = leftButtons;
    
    for (UIButton* button in self.leftButtons) {
        [self.toolbar addSubview:button];
    }
    
    for (UIButton* button in self.rightButtons) {
        [self.toolbar addSubview:button];
    }
    
    [self layoutButtons];
    
    self.titleOffset = fmaxf(leftWidth, rightWidth);
    // The correct positioning of title is not that important right now, since
    // rePositionViews will take care of it a bit later.
    self.titleLabel = nil;
    if (_browserOptions.title) {
        self.titleLabel = [[UILabel alloc] initWithFrame:CGRectMake(10, 0, 10, toolbarHeight)];
        self.titleLabel.textAlignment = NSTextAlignmentCenter;
        self.titleLabel.numberOfLines = 1;
        self.titleLabel.lineBreakMode = NSLineBreakByTruncatingTail;
        self.titleLabel.textColor = [CDVThemeableBrowserViewController colorFromRGBA:[self getStringFromDict:_browserOptions.title withKey:kThemeableBrowserPropColor withDefault:@"#000000ff"]];
        
        if (_browserOptions.title[kThemeableBrowserPropStaticText]) {
            self.titleLabel.text = _browserOptions.title[kThemeableBrowserPropStaticText];
        }
        
        [self.toolbar addSubview:self.titleLabel];
    }

    self.view.backgroundColor = [CDVThemeableBrowserViewController colorFromRGBA:[self getStringFromDict:_browserOptions.statusbar withKey:kThemeableBrowserPropColor withDefault:@"#ffffffff"]];
    [self.view addSubview:self.toolbar];
    // [self.view addSubview:self.addressLabel];
    // [self.view addSubview:self.spinner];
}

- (UIButton*) createButton:(NSDictionary*) buttonDef action:(SEL)action withDescription:(NSString*)description
{
    UIButton* result = nil;
    if (buttonDef) {
        UIImage *buttonImage = nil;
        if (buttonDef[kThemeableBrowserPropImage]) {
            buttonImage = [UIImage imageNamed:buttonDef[kThemeableBrowserPropImage]];

            if (!buttonImage) {
                [self.navigationDelegate emitError:kThemeableBrowserEmitCodeLoadFail
                                   withMessage:[NSString stringWithFormat:@"Image for %@, %@, failed to load.", description, buttonDef[kThemeableBrowserPropImage]]];
            }
        } else {
            [self.navigationDelegate emitWarning:kThemeableBrowserEmitCodeUndefined
                                 withMessage:[NSString stringWithFormat:@"Image for %@ is not defined. Button will not be shown.", description]];
        }

        UIImage *buttonImagePressed = nil;
        if (buttonDef[kThemeableBrowserPropImagePressed]) {
            buttonImagePressed = [UIImage imageNamed:buttonDef[kThemeableBrowserPropImagePressed]];
            
            if (!buttonImagePressed) {
                [self.navigationDelegate emitError:kThemeableBrowserEmitCodeLoadFail
                                       withMessage:[NSString stringWithFormat:@"Pressed image for %@, %@, failed to load.", description, buttonDef[kThemeableBrowserPropImagePressed]]];
            }
        } else {
            [self.navigationDelegate emitWarning:kThemeableBrowserEmitCodeUndefined
                             withMessage:[NSString stringWithFormat:@"Pressed image for %@ is not defined.", description]];
        }
        
        if (buttonImage) {
            result = [UIButton buttonWithType:UIButtonTypeCustom];
            result.bounds = CGRectMake(0, 0, buttonImage.size.width, buttonImage.size.height);
            
            if (buttonImagePressed) {
                [result setImage:buttonImagePressed forState:UIControlStateHighlighted];
            }

            [result setImage:buttonImage forState:UIControlStateNormal];
            [result addTarget:self action:action forControlEvents:UIControlEventTouchUpInside];
        }
    } else if (!buttonDef) {
        [self.navigationDelegate emitWarning:kThemeableBrowserEmitCodeUndefined
                                 withMessage:[NSString stringWithFormat:@"%@ is not defined. Button will not be shown.", description]];
    } else if (!buttonDef[kThemeableBrowserPropImage]) {
    }
    
    return result;
}

- (void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
    [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];

    // Reposition views.
    [self rePositionViews];
}

- (void) setWebViewFrame : (CGRect) frame {
    [self.webView setFrame:frame];
}

- (void)layoutButtons
{
    CGFloat screenWidth = CGRectGetWidth(self.view.frame);
    CGFloat toolbarHeight = self.toolbar.frame.size.height;
    
    // Layout leftButtons and rightButtons from outer to inner.
    CGFloat left = 0;
    for (UIButton* button in self.leftButtons) {
        CGSize size = button.frame.size;
        button.frame = CGRectMake(left, floorf((toolbarHeight - size.height) / 2), size.width, size.height);
        left += size.width;
    }
    
    CGFloat right = 0;
    for (UIButton* button in self.rightButtons) {
        CGSize size = button.frame.size;
        button.frame = CGRectMake(screenWidth - right - size.width, floorf((toolbarHeight - size.height) / 2), size.width, size.height);
        right += size.width;
    }
}

- (void)setCloseButtonTitle:(NSString*)title
{
    // This method is not used by ThemeableBrowser. It is inherited from
    // InAppBrowser and is kept for merge purposes.
    
    // the advantage of using UIBarButtonSystemItemDone is the system will localize it for you automatically
    // but, if you want to set this yourself, knock yourself out (we can't set the title for a system Done button, so we have to create a new one)
    // self.closeButton = nil;
    // self.closeButton = [[UIBarButtonItem alloc] initWithTitle:title style:UIBarButtonItemStyleBordered target:self action:@selector(close)];
    // self.closeButton.enabled = YES;
    // self.closeButton.tintColor = [UIColor colorWithRed:60.0 / 255.0 green:136.0 / 255.0 blue:230.0 / 255.0 alpha:1];

    // NSMutableArray* items = [self.toolbar.items mutableCopy];
    // [items replaceObjectAtIndex:0 withObject:self.closeButton];
    // [self.toolbar setItems:items];
}

- (void)showLocationBar:(BOOL)show
{
    CGRect locationbarFrame = self.addressLabel.frame;
    CGFloat toolbarHeight = [self getFloatFromDict:_browserOptions.toolbar withKey:kThemeableBrowserPropHeight withDefault:TOOLBAR_DEF_HEIGHT];

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
            webViewBounds.size.height -= toolbarHeight;
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
            webViewBounds.size.height -= toolbarHeight;
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
    CGFloat toolbarHeight = [self getFloatFromDict:_browserOptions.toolbar withKey:kThemeableBrowserPropHeight withDefault:TOOLBAR_DEF_HEIGHT];

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
            webViewBounds.size.height -= toolbarHeight;
            locationbarFrame.origin.y = webViewBounds.size.height;
            self.addressLabel.frame = locationbarFrame;
            self.toolbar.frame = toolbarFrame;
        } else {
            // no locationBar, so put toolBar at the bottom
            self.toolbar.frame = toolbarFrame;
        }

        if ([toolbarPosition isEqualToString:kThemeableBrowserToolbarBarPositionTop]) {
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
    return _statusBarStyle;
}

- (void)close
{
    [self emitEventForButton:_browserOptions.closeButton];
    
    [CDVUserAgentUtil releaseLock:&_userAgentLockToken];
    self.currentURL = nil;

    if ((self.navigationDelegate != nil) && [self.navigationDelegate respondsToSelector:@selector(browserExit)]) {
        [self.navigationDelegate browserExit];
    }

    // Run later to avoid the "took a long time" log message.
    dispatch_async(dispatch_get_main_queue(), ^{
        if ([self respondsToSelector:@selector(presentingViewController)]) {
            [[self presentingViewController] dismissViewControllerAnimated:!_browserOptions.disableAnimation completion:nil];
        } else {
            [[self parentViewController] dismissViewControllerAnimated:!_browserOptions.disableAnimation completion:nil];
        }
    });
    
}

- (void)reload
{
    [self.webView reload];
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
    [self emitEventForButton:_browserOptions.backButton];
    
    if (self.webView.canGoBack) {
        [self.webView goBack];
        [self updateButtonDelayed:self.webView];
    } else if (_browserOptions.backButtonCanClose) {
        [self close];
    }
}

- (void)goForward:(id)sender
{
    [self emitEventForButton:_browserOptions.forwardButton];
    
    [self.webView goForward];
    [self updateButtonDelayed:self.webView];
}

- (void)goCustomButton:(id)sender
{
    UIButton* button = sender;
    NSInteger index = button.tag;
    [self emitEventForButton:_browserOptions.customButtons[index] withIndex:[NSNumber numberWithLong:index]];
}

- (void)goMenu:(id)sender
{
    [self emitEventForButton:_browserOptions.menu];
    
    if (_browserOptions.menu && _browserOptions.menu[kThemeableBrowserPropItems]) {
        NSArray* menuItems = _browserOptions.menu[kThemeableBrowserPropItems];
        if (IsAtLeastiOSVersion(@"8.0")) {
            // iOS > 8 implementation using UIAlertController, which is the new way
            // to do this going forward.
            UIAlertController *alertController = [UIAlertController
                                                  alertControllerWithTitle:_browserOptions.menu[kThemeableBrowserPropTitle]
                                                  message:nil
                                                  preferredStyle:UIAlertControllerStyleActionSheet];
            
            for (NSInteger i = 0; i < menuItems.count; i++) {
                NSInteger index = i;
                NSDictionary *item = menuItems[index];
                
                UIAlertAction *a = [UIAlertAction
                                     actionWithTitle:item[@"label"]
                                     style:UIAlertActionStyleDefault
                                     handler:^(UIAlertAction *action) {
                                         [self menuSelected:index];
                                     }];
                [alertController addAction:a];
            }
            
            if (_browserOptions.menu[kThemeableBrowserPropCancel]) {
                UIAlertAction *cancelAction = [UIAlertAction
                                               actionWithTitle:_browserOptions.menu[kThemeableBrowserPropCancel]
                                               style:UIAlertActionStyleCancel
                                               handler:nil];
                [alertController addAction:cancelAction];
            }

            [self presentViewController:alertController animated:YES completion:nil];
        } else {
            // iOS < 8 implementation using UIActionSheet, which is deprecated.
            UIActionSheet *popup = [[UIActionSheet alloc]
                                    initWithTitle:_browserOptions.menu[kThemeableBrowserPropTitle]
                                    delegate:self cancelButtonTitle:nil destructiveButtonTitle:nil otherButtonTitles:nil];
            for (NSDictionary *item in menuItems) {
                [popup addButtonWithTitle:item[@"label"]];
            }
            if (_browserOptions.menu[kThemeableBrowserPropCancel]) {
                [popup addButtonWithTitle:_browserOptions.menu[kThemeableBrowserPropCancel]];
                popup.cancelButtonIndex = menuItems.count;
            }
            [popup showInView:[UIApplication sharedApplication].keyWindow];
        }
    } else {
        [self.navigationDelegate emitWarning:kThemeableBrowserEmitCodeUndefined
                                 withMessage:@"Menu items undefined. No menu will be shown."];
    }
}

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
    [self menuSelected:buttonIndex];
}

- (void) menuSelected:(NSInteger)index
{
    NSArray* menuItems = _browserOptions.menu[kThemeableBrowserPropItems];
    if (index < menuItems.count) {
        [self emitEventForButton:menuItems[index] withIndex:[NSNumber numberWithLong:index]];
    }
}

- (void)viewWillAppear:(BOOL)animated
{
    if (IsAtLeastiOSVersion(@"7.0")) {
        [[UIApplication sharedApplication] setStatusBarStyle:[self preferredStatusBarStyle]];
    }
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
    CGFloat toolbarHeight = [self getFloatFromDict:_browserOptions.toolbar withKey:kThemeableBrowserPropHeight withDefault:TOOLBAR_DEF_HEIGHT];
    
    if ([_browserOptions.toolbarposition isEqualToString:kThemeableBrowserToolbarBarPositionTop]) {
        [self.webView setFrame:CGRectMake(self.webView.frame.origin.x, toolbarHeight, self.webView.frame.size.width, self.webView.frame.size.height)];
        [self.toolbar setFrame:CGRectMake(self.toolbar.frame.origin.x, [self getStatusBarOffset], self.toolbar.frame.size.width, self.toolbar.frame.size.height)];
    }
    
    CGFloat screenWidth = CGRectGetWidth(self.view.frame);
    NSInteger width = floorf(screenWidth - self.titleOffset * 2.0f);
    if (self.titleLabel) {
        self.titleLabel.frame = CGRectMake(floorf((screenWidth - width) / 2.0f), 0, width, toolbarHeight);
    }
    
    [self layoutButtons];
}

- (CGFloat) getFloatFromDict:(NSDictionary*)dict withKey:(NSString*)key withDefault:(CGFloat)def
{
    CGFloat result = def;
    if (dict && dict[key]) {
        result = [(NSNumber*) dict[key] floatValue];
    }
    return result;
}

- (NSString*) getStringFromDict:(NSDictionary*)dict withKey:(NSString*)key withDefault:(NSString*)def
{
    NSString* result = def;
    if (dict && dict[key]) {
        result = dict[key];
    }
    return result;
}

- (BOOL) getBoolFromDict:(NSDictionary*)dict withKey:(NSString*)key
{
    BOOL result = NO;
    if (dict && dict[key]) {
        result = [(NSNumber*) dict[key] boolValue];
    }
    return result;
}

- (CGFloat) getWidthFromButton:(UIButton*)button
{
    return button.frame.size.width;
}

- (void)emitEventForButton:(NSDictionary*)buttonDef
{
    [self emitEventForButton:buttonDef withIndex:nil];
}

- (void)emitEventForButton:(NSDictionary*)buttonDef withIndex:(NSNumber*)index
{
    if (buttonDef) {
        NSString* event = buttonDef[kThemeableBrowserPropEvent];
        if (event) {
            NSMutableDictionary* dict = [NSMutableDictionary new];
            [dict setObject:event forKey:@"type"];
            [dict setObject:[self.navigationDelegate.themeableBrowserViewController.currentURL absoluteString] forKey:@"url"];
            
            if (index) {
                [dict setObject:index forKey:@"index"];
            }
            [self.navigationDelegate emitEvent:dict];
        } else {
            [self.navigationDelegate emitWarning:kThemeableBrowserEmitCodeUndefined
                                     withMessage:@"Button clicked, but event property undefined. No event will be raised."];
        }
    }
}

#pragma mark UIWebViewDelegate

- (void)webViewDidStartLoad:(UIWebView*)theWebView
{
    // loading url, start spinner

    self.addressLabel.text = NSLocalizedString(@"Loading...", nil);

    [self.spinner startAnimating];

    return [self.navigationDelegate webViewDidStartLoad:theWebView];
}

- (BOOL)webView:(UIWebView*)theWebView shouldStartLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType
{
    BOOL isTopLevelNavigation = [request.URL isEqual:[request mainDocumentURL]];

    if (isTopLevelNavigation) {
        self.currentURL = request.URL;
    }
    
    [self updateButtonDelayed:theWebView];
    
    return [self.navigationDelegate webView:theWebView shouldStartLoadWithRequest:request navigationType:navigationType];
}

- (void)webViewDidFinishLoad:(UIWebView*)theWebView
{
    // update url, stop spinner, update back/forward

    self.addressLabel.text = [self.currentURL absoluteString];
    [self updateButton:theWebView];
    
    if (self.titleLabel && _browserOptions.title
            && !_browserOptions.title[kThemeableBrowserPropStaticText]
            && [self getBoolFromDict:_browserOptions.title withKey:kThemeableBrowserPropShowPageTitle]) {
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
    [self updateButton:theWebView];

    [self.spinner stopAnimating];

    self.addressLabel.text = NSLocalizedString(@"Load Error", nil);

    [self.navigationDelegate webView:theWebView didFailLoadWithError:error];
}

- (void)updateButton:(UIWebView*)theWebView
{
    if (self.backButton) {
        self.backButton.enabled = _browserOptions.backButtonCanClose || theWebView.canGoBack;
    }
    
    if (self.forwardButton) {
        self.forwardButton.enabled = theWebView.canGoForward;
    }
}

/**
 * The reason why this method exists at all is because UIWebView is quite
 * terrible with dealing this hash change, which IS a history change. However
 * when moving to a new hash, only shouldStartLoadWithRequest will be called.
 * Even then it's being called too early such that canGoback and canGoForward
 * hasn't been updated yet. What makes it worse is that when navigating history
 * involving hash by goBack and goForward, no callback is called at all, so we
 * will have to depend on the back and forward button to give us hints when to
 * change button states.
 */
- (void)updateButtonDelayed:(UIWebView*)theWebView
{
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.1 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
        [self updateButton:theWebView];
    });
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
    unsigned rgbaVal = 0;
    
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
    [scanner scanHexInt:&rgbaVal];
    
    return [UIColor colorWithRed:(rgbaVal >> 24 & 0xFF) / 255.0f
        green:(rgbaVal >> 16 & 0xFF) / 255.0f
        blue:(rgbaVal >> 8 & 0xFF) / 255.0f
        alpha:(rgbaVal & 0xFF) / 255.0f];
}

@end

@implementation CDVThemeableBrowserOptions

- (id)init
{
    if (self = [super init]) {
        // default values
        self.location = YES;
        self.closebuttoncaption = nil;
        self.toolbarposition = kThemeableBrowserToolbarBarPositionBottom;
        self.clearcache = NO;
        self.clearsessioncache = NO;

        self.enableviewportscale = YES;
        self.mediaplaybackrequiresuseraction = NO;
        self.allowinlinemediaplayback = NO;
        self.keyboarddisplayrequiresuseraction = YES;
        self.suppressesincrementalrendering = NO;
        self.hidden = NO;
        self.disallowoverscroll = NO;
        
        self.statusbar = nil;
        self.toolbar = nil;
        self.title = nil;
        self.backButton = nil;
        self.forwardButton = nil;
        self.closeButton = nil;
        self.menu = nil;
        self.backButtonCanClose = NO;
        self.disableAnimation = NO;
    }

    return self;
}

@end

#pragma mark CDVScreenOrientationDelegate

@implementation CDVThemeableBrowserNavigationController : UINavigationController

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
