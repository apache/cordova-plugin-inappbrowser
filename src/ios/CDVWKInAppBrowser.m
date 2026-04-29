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

#import "CDVWKInAppBrowser.h"

#if __has_include(<Cordova/CDVWebViewProcessPoolFactory.h>)
/*
    CDVWebViewProcessPoolFactory is deprecated since cordova-ios 8.0.0
    and will be removed in a future release.
*/
#import <Cordova/CDVWebViewProcessPoolFactory.h>
#endif

#import <Cordova/CDVPluginResult.h>

#define    kInAppBrowserTargetSelf @"_self"
#define    kInAppBrowserTargetSystem @"_system"
#define    kInAppBrowserTargetBlank @"_blank"

#define    kInAppBrowserToolbarBarPositionBottom @"bottom"
#define    kInAppBrowserToolbarBarPositionTop @"top"

#define    IAB_BRIDGE_NAME @"cordova_iab"

#pragma mark CDVWKInAppBrowser

@implementation CDVWKInAppBrowser

- (void)pluginInitialize
{
    _beforeload = @"";
    _waitForBeforeload = NO;
}

- (void)onReset
{
    [self close:nil];
}

- (void)close:(CDVInvokedUrlCommand *)command
{
    if (self.inAppBrowserViewController == nil) {
        NSLog(@"IAB.close() called but it was already closed.");
        return;
    }

    // Things are cleaned up in browserExit.
    [self.inAppBrowserViewController close];
}

- (BOOL)isSystemUrl:(NSURL *)url
{
    if ([url.host isEqualToString:@"itunes.apple.com"]) {
        return YES;
    }

    return NO;
}

- (void)open:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult *pluginResult;

    NSString *url = [command argumentAtIndex:0];
    NSString *target = [command argumentAtIndex:1 withDefault:kInAppBrowserTargetSelf];
    NSString *options = [command argumentAtIndex:2 withDefault:@"" andClass:[NSString class]];

    self.callbackId = command.callbackId;

    if (url != nil) {
        NSURL *baseUrl = [self.webViewEngine URL];
        NSURL *absoluteUrl = [[NSURL URLWithString:url relativeToURL:baseUrl] absoluteURL];

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

    [pluginResult setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)openInInAppBrowser:(NSURL *)url withOptions:(NSString *)options
{
    CDVInAppBrowserOptions *browserOptions = [CDVInAppBrowserOptions parseOptions:options];
    WKWebsiteDataStore *dataStore = [WKWebsiteDataStore defaultDataStore];

    if (browserOptions.cleardata) {
        NSDate *dateFrom = [NSDate dateWithTimeIntervalSince1970:0];
        [dataStore removeDataOfTypes:[WKWebsiteDataStore allWebsiteDataTypes] modifiedSince:dateFrom completionHandler:^{
            NSLog(@"Removed all WKWebView data");
            if (@available(iOS 15.0, *)) {
                // Since iOS 15 WKProcessPool is deprecated and has no effect
            } else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
                // Set for iOS 14 and below a new process pool
                self.inAppBrowserViewController.webView.configuration.processPool = [[WKProcessPool alloc] init]; // create new process pool to flush all data
#pragma clang diagnostic pop
            }
        }];
    }

    if (browserOptions.clearcache) {
        // Deletes all cookies
        WKHTTPCookieStore *cookieStore = dataStore.httpCookieStore;
        [cookieStore getAllCookies:^(NSArray *cookies) {
            NSHTTPCookie *cookie;
            for (cookie in cookies) {
                [cookieStore deleteCookie:cookie completionHandler:nil];
            }
        }];
    }

    if (browserOptions.clearsessioncache) {
        // Deletes session cookies
        WKHTTPCookieStore *cookieStore = dataStore.httpCookieStore;
        [cookieStore getAllCookies:^(NSArray *cookies) {
            NSHTTPCookie *cookie;
            for (cookie in cookies) {
                if (cookie.sessionOnly) {
                    [cookieStore deleteCookie:cookie completionHandler:nil];
                }
            }
        }];
    }

    if (self.inAppBrowserViewController == nil) {
        self.inAppBrowserViewController = [[CDVWKInAppBrowserViewController alloc] initWithBrowserOptions: browserOptions andSettings:self.commandDelegate.settings];
        self.inAppBrowserViewController.navigationDelegate = self;
    }

    [self.inAppBrowserViewController showLocationBar:browserOptions.location];
    [self.inAppBrowserViewController showToolBar:browserOptions.toolbar atPosition:browserOptions.toolbarposition];
    if (browserOptions.closebuttoncaption != nil || browserOptions.closebuttoncolor != nil) {
        int closeButtonIndex = browserOptions.lefttoright ? (browserOptions.hidenavigationbuttons ? 1 : 4) : 0;
        [self.inAppBrowserViewController setCloseButtonTitle:browserOptions.closebuttoncaption withColor:browserOptions.closebuttoncolor atIndex:closeButtonIndex];
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

    // Prevent WebView from bouncing
    if (browserOptions.disallowoverscroll) {
        if ([self.inAppBrowserViewController.webView respondsToSelector:@selector(scrollView)]) {
            ((UIScrollView *)[self.inAppBrowserViewController.webView scrollView]).bounces = NO;
        } else {
            for (id subview in self.inAppBrowserViewController.webView.subviews) {
                if ([[subview class] isSubclassOfClass:[UIScrollView class]]) {
                    ((UIScrollView *)subview).bounces = NO;
                }
            }
        }
    }

    // Use of beforeload event
    if ([browserOptions.beforeload isKindOfClass:[NSString class]]) {
        _beforeload = browserOptions.beforeload;
    } else {
        _beforeload = @"yes";
    }
    _waitForBeforeload = ![_beforeload isEqualToString:@""];

    [self.inAppBrowserViewController navigateTo:url];
    if (!browserOptions.hidden) {
        [self show:nil withNoAnimate:browserOptions.hidden];
    }
}

- (void)show:(CDVInvokedUrlCommand *)command
{
    [self show:command withNoAnimate:NO];
}

- (void)show:(CDVInvokedUrlCommand *)command withNoAnimate:(BOOL)noAnimate
{
    BOOL initHidden = NO;
    if (command == nil && noAnimate == YES) {
        initHidden = YES;
    }

    if (self.inAppBrowserViewController == nil) {
        NSLog(@"Tried to show IAB after it was closed.");
        return;
    }

    __block CDVInAppBrowserNavigationController *nav = [[CDVInAppBrowserNavigationController alloc]
                                                        initWithRootViewController:self.inAppBrowserViewController];
    nav.navigationBarHidden = YES;
    nav.modalPresentationStyle = self.inAppBrowserViewController.modalPresentationStyle;
    nav.presentationController.delegate = self.inAppBrowserViewController;

    __weak CDVWKInAppBrowser *weakSelf = self;

    // Run later to avoid the "took a long time" log message.
    dispatch_async(dispatch_get_main_queue(), ^{
        if (weakSelf.inAppBrowserViewController != nil) {
            __strong __typeof(weakSelf) strongSelf = weakSelf;
            if (!strongSelf->tmpWindow) {
                if (@available(iOS 13.0, *)) {
                    UIWindowScene *windowScene = strongSelf.viewController.view.window.windowScene;
                    // The main Cordova window's scene reference isn't always available at the time the InAppBrowser
                    // creates its temporary UIWindow. Fallback to iterate through UIApplication.connectedScenes
                    // to get an UIWindowScene.
                    if (!windowScene) {
                        for (UIScene *connectedScene in [UIApplication sharedApplication].connectedScenes) {
                            if (connectedScene.activationState == UISceneActivationStateForegroundActive &&
                                [connectedScene isKindOfClass:[UIWindowScene class]]) {
                                windowScene = (UIWindowScene *)connectedScene;
                                break;
                            }
                        }
                    }
                    if (windowScene) {
                        strongSelf->tmpWindow = [[UIWindow alloc] initWithWindowScene:windowScene];
                    }
                }

                // This code should only be executed on pre iOS 13.
                // On scene-based iOS 13+ versions, initializing a window with initWithFrame:
                // would produce a window with no scene association, which results that the
                // window would never be displayed, which results in a white/blank screen.
                if (!strongSelf->tmpWindow) {
                    CGRect frame = [[UIScreen mainScreen] bounds];
                    strongSelf->tmpWindow = [[UIWindow alloc] initWithFrame:frame];
                }
            }
            UIViewController *tmpController = [[UIViewController alloc] init];
            [strongSelf->tmpWindow setRootViewController:tmpController];
            [strongSelf->tmpWindow setWindowLevel:UIWindowLevelNormal];

            if (!initHidden) {
                [self->tmpWindow makeKeyAndVisible];
            }
            [tmpController presentViewController:nav animated:!noAnimate completion:nil];
        }
    });
}

- (void)hide:(CDVInvokedUrlCommand *)command
{
    // Set tmpWindow to hidden to make main WebView responsive to touch again
    // https://stackoverflow.com/questions/4544489/how-to-remove-a-uiwindow
    self->tmpWindow.hidden = YES;
    self->tmpWindow = nil;

    if (self.inAppBrowserViewController == nil) {
        NSLog(@"Tried to hide IAB after it was closed.");
        return;
    }

    // Run later to avoid the "took a long time" log message.
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self.inAppBrowserViewController != nil) {
            [self.inAppBrowserViewController.presentingViewController dismissViewControllerAnimated:YES completion:nil];
        }
    });
}

- (void)openInCordovaWebView:(NSURL *)url withOptions:(NSString *)options
{
    NSURLRequest *request = [NSURLRequest requestWithURL:url];
    // The WebView engine itself will filter for this according to <allow-navigation> policy
    // in config.xml
    [self.webViewEngine loadRequest:request];
}

- (void)openInSystem:(NSURL *)url
{
    [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:^(BOOL success) {
        if (!success) {
            [[NSNotificationCenter defaultCenter] postNotification:[NSNotification notificationWithName:CDVPluginHandleOpenURLNotification object:url]];
        }
    }];
}

- (void)loadAfterBeforeload:(CDVInvokedUrlCommand *)command
{
    NSString *urlStr = [command argumentAtIndex:0];

    if ([_beforeload isEqualToString:@""]) {
        NSLog(@"unexpected loadAfterBeforeload called without feature beforeload=get|post");
    }
    if (self.inAppBrowserViewController == nil) {
        NSLog(@"Tried to invoke loadAfterBeforeload on IAB after it was closed.");
        return;
    }
    if (urlStr == nil) {
        NSLog(@"loadAfterBeforeload called with nil argument, ignoring.");
        return;
    }

    NSURL *url = [NSURL URLWithString:urlStr];
    _waitForBeforeload = NO;
    [self.inAppBrowserViewController navigateTo:url];
}

// This is a helper method for the inject{Script|Style}{Code|File} API calls, which
// provides a consistent method for injecting JavaScript code into the document.
//
// If a wrapper string is supplied, then the source string will be JSON-encoded (adding
// quotes) and wrapped using string formatting. (The wrapper string should have a single
// '%@' marker).
//
// If no wrapper is supplied, then the source string is executed directly.

- (void)injectDeferredObject:(NSString *)source withWrapper:(NSString *)jsWrapper
{
    // Ensure a message handler bridge is created to communicate with the CDVWKInAppBrowserViewController
    [self evaluateJavaScript: [NSString stringWithFormat:@"(function(w){if (!w._cdvMessageHandler) {w._cdvMessageHandler = function(id,d){w.webkit.messageHandlers.%@.postMessage({d:d, id:id});}}})(window)", IAB_BRIDGE_NAME]];

    if (jsWrapper != nil) {
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:@[source] options:0 error:nil];
        NSString *sourceArrayString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
        if (sourceArrayString) {
            NSString *sourceString = [sourceArrayString substringWithRange:NSMakeRange(1, [sourceArrayString length] - 2)];
            NSString *jsToInject = [NSString stringWithFormat:jsWrapper, sourceString];
            [self evaluateJavaScript:jsToInject];
        }
    } else {
        [self evaluateJavaScript:source];
    }
}


// Synchronous helper for javascript evaluation
- (void)evaluateJavaScript:(NSString *)script
{
    __block NSString *_script = script;
    [self.inAppBrowserViewController.webView evaluateJavaScript:script completionHandler:^(id result, NSError *error) {
        if (error == nil) {
            if (result != nil) {
                NSLog(@"%@", result);
            }
        } else {
            NSLog(@"evaluateJavaScript error : %@ : %@", error.localizedDescription, _script);
        }
    }];
}

- (void)injectScriptCode:(CDVInvokedUrlCommand *)command
{
    NSString *jsWrapper = nil;

    if ((command.callbackId != nil) && ![command.callbackId isEqualToString:@"INVALID"]) {
        jsWrapper = [NSString stringWithFormat:@"_cdvMessageHandler('%@',JSON.stringify([eval(%%@)]));", command.callbackId];
    }
    [self injectDeferredObject:[command argumentAtIndex:0] withWrapper:jsWrapper];
}

- (void)injectScriptFile:(CDVInvokedUrlCommand *)command
{
    NSString *jsWrapper;

    if ((command.callbackId != nil) && ![command.callbackId isEqualToString:@"INVALID"]) {
        jsWrapper = [NSString stringWithFormat:@"(function(d) { var c = d.createElement('script'); c.src = %%@; c.onload = function() { _cdvMessageHandler('%@'); }; d.body.appendChild(c); })(document)", command.callbackId];
    } else {
        jsWrapper = @"(function(d) { var c = d.createElement('script'); c.src = %@; d.body.appendChild(c); })(document)";
    }
    [self injectDeferredObject:[command argumentAtIndex:0] withWrapper:jsWrapper];
}

- (void)injectStyleCode:(CDVInvokedUrlCommand *)command
{
    NSString *jsWrapper;

    if ((command.callbackId != nil) && ![command.callbackId isEqualToString:@"INVALID"]) {
        jsWrapper = [NSString stringWithFormat:@"(function(d) { var c = d.createElement('style'); c.innerHTML = %%@; c.onload = function() { _cdvMessageHandler('%@'); }; d.body.appendChild(c); })(document)", command.callbackId];
    } else {
        jsWrapper = @"(function(d) { var c = d.createElement('style'); c.innerHTML = %@; d.body.appendChild(c); })(document)";
    }
    [self injectDeferredObject:[command argumentAtIndex:0] withWrapper:jsWrapper];
}

- (void)injectStyleFile:(CDVInvokedUrlCommand *)command
{
    NSString *jsWrapper;

    if ((command.callbackId != nil) && ![command.callbackId isEqualToString:@"INVALID"]) {
        jsWrapper = [NSString stringWithFormat:@"(function(d) { var c = d.createElement('link'); c.rel='stylesheet'; c.type='text/css'; c.href = %%@; c.onload = function() { _cdvMessageHandler('%@'); }; d.body.appendChild(c); })(document)", command.callbackId];
    } else {
        jsWrapper = @"(function(d) { var c = d.createElement('link'); c.rel='stylesheet'; c.type='text/css'; c.href = %@; d.body.appendChild(c); })(document)";
    }
    [self injectDeferredObject:[command argumentAtIndex:0] withWrapper:jsWrapper];
}

- (BOOL)isAllowedScheme:(NSString *)scheme
{
    NSString *allowedSchemesPreference = [self.commandDelegate.settings cordovaSettingForKey:@"AllowedSchemes"];
    if (allowedSchemesPreference == nil || [allowedSchemesPreference isEqualToString:@""]) {
        // Preference missing.
        return NO;
    }
    for (NSString *allowedScheme in [allowedSchemesPreference componentsSeparatedByString:@","]) {
        if ([allowedScheme isEqualToString:scheme]) {
            return YES;
        }
    }
    return NO;
}

/**
 * The message handler bridge provided for the InAppBrowser is capable of executing any oustanding callback belonging
 * to the InAppBrowser plugin. Care has been taken that other callbacks cannot be triggered, and that no
 * other code execution is possible.
 */
- (void)webView:(WKWebView *)theWebView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler
{
    NSURL *url = navigationAction.request.URL;
    NSURL *mainDocumentURL = navigationAction.request.mainDocumentURL;
    BOOL isTopLevelNavigation = [url isEqual:mainDocumentURL];
    BOOL shouldStart = YES;
    BOOL useBeforeLoad = NO;
    NSString *httpMethod = navigationAction.request.HTTPMethod;
    NSString *errorMessage = nil;

    if ([_beforeload isEqualToString:@"post"]) {
        // TODO: Handle POST requests by preserving POST data then remove this condition.
        errorMessage = @"beforeload doesn't yet support POST requests";
    } else if (isTopLevelNavigation && (
        [_beforeload isEqualToString:@"yes"]
        || ([_beforeload isEqualToString:@"get"] && [httpMethod isEqualToString:@"GET"])
        // TODO: Comment in when POST requests are handled.
        // || ([_beforeload isEqualToString:@"post"] && [httpMethod isEqualToString:@"POST"])
    )) {
        useBeforeLoad = YES;
    }

    // When beforeload, on first URL change, initiate JS callback. Only after the beforeload event, continue.
    if (_waitForBeforeload && useBeforeLoad) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:@{@"type":@"beforeload", @"url":url.absoluteString}];
        [pluginResult setKeepCallbackAsBool:YES];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
        decisionHandler(WKNavigationActionPolicyCancel);
        return;
    }

    if (errorMessage != nil) {
        NSLog(@"%@", errorMessage);
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                      messageAsDictionary:@{@"type":@"loaderror", @"url":url.absoluteString, @"code": @"-1", @"message": errorMessage}];
        [pluginResult setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    }

    // If the URL is an app store, tel, sms, mailto or geo link, let the system handle it, otherwise it fails to load it.
    NSArray *allowedSchemes = @[@"itms-appss", @"itms-apps", @"tel", @"sms", @"mailto", @"geo"];
    if ([allowedSchemes containsObject:url.scheme]) {
        [theWebView stopLoading];
        [self openInSystem:url];
        shouldStart = NO;
    } else if (self.callbackId != nil && ![url.scheme isEqualToString:@"http"] && ![url.scheme isEqualToString:@"https"] && [self isAllowedScheme:url.scheme]) {
        // Send a customscheme event for allowed schemes that are not http/https.
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:@{@"type":@"customscheme", @"url":url.absoluteString}];
        [pluginResult setKeepCallbackAsBool:YES];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];

        shouldStart = NO;
    } else if (self.callbackId != nil && isTopLevelNavigation) {
        // Send a loadstart event for each top-level navigation (includes redirects).
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:@{@"type":@"loadstart", @"url":url.absoluteString}];
        [pluginResult setKeepCallbackAsBool:YES];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    }

    if (useBeforeLoad) {
        _waitForBeforeload = YES;
    }

    if (shouldStart) {
        // Fix GH-417 & GH-424: Handle non-default target attribute
        // Based on https://stackoverflow.com/a/25713070/777265
        if (!navigationAction.targetFrame) {
            [theWebView loadRequest:navigationAction.request];
            decisionHandler(WKNavigationActionPolicyCancel);
        } else {
            decisionHandler(WKNavigationActionPolicyAllow);
        }
    } else {
        decisionHandler(WKNavigationActionPolicyCancel);
    }
}

#pragma mark WKScriptMessageHandler delegate
- (void)userContentController:(nonnull WKUserContentController *)userContentController didReceiveScriptMessage:(nonnull WKScriptMessage *)message
{    
    CDVPluginResult *pluginResult = nil;

    if ([message.body isKindOfClass:[NSDictionary class]]) {
        NSDictionary *messageContent = (NSDictionary *) message.body;
        NSString *scriptCallbackId = messageContent[@"id"];

        if ([messageContent objectForKey:@"d"]) {
            NSString *scriptResult = messageContent[@"d"];
            NSError * __autoreleasing error = nil;
            NSData *decodedResult = [NSJSONSerialization JSONObjectWithData:[scriptResult dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&error];
            if ((error == nil) && [decodedResult isKindOfClass:[NSArray class]]) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:(NSArray *)decodedResult];
            } else {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_JSON_EXCEPTION];
            }
        } else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:@[]];
        }
        [self.commandDelegate sendPluginResult:pluginResult callbackId:scriptCallbackId];
    } else if (self.callbackId != nil) {
        // Send a message event
        NSString *messageContent = (NSString *) message.body;
        NSError * __autoreleasing error = nil;
        NSData *decodedResult = [NSJSONSerialization JSONObjectWithData:[messageContent dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&error];
        if (error == nil) {
            NSMutableDictionary *dResult = [NSMutableDictionary new];
            [dResult setValue:@"message" forKey:@"type"];
            [dResult setObject:decodedResult forKey:@"data"];
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:dResult];
            [pluginResult setKeepCallbackAsBool:YES];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
        }
    }
}

- (void)didStartProvisionalNavigation:(WKWebView *)theWebView
{
    // Do nothing here
}

- (void)didFinishNavigation:(WKWebView *)theWebView
{
    if (self.callbackId != nil) {
        NSString *url = theWebView.URL.absoluteString;
        if (url == nil) {
            if (self.inAppBrowserViewController.currentURL != nil) {
                url = self.inAppBrowserViewController.currentURL.absoluteString;
            } else {
                url = @"";
            }
        }
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:@{@"type":@"loadstop", @"url":url}];
        [pluginResult setKeepCallbackAsBool:YES];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    }
}

- (void)webView:(WKWebView *)theWebView didFailNavigation:(NSError *)error
{
    if (self.callbackId != nil) {
        NSString *url = theWebView.URL.absoluteString;
        if (url == nil) {
            if (self.inAppBrowserViewController.currentURL != nil) {
                url = self.inAppBrowserViewController.currentURL.absoluteString;
            } else {
                url = @"";
            }
        }
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                      messageAsDictionary:@{@"type":@"loaderror", @"url":url, @"code": [NSNumber numberWithInteger:error.code], @"message": error.localizedDescription}];
        [pluginResult setKeepCallbackAsBool:YES];

        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
    }
}

- (void)browserExit
{
    if (self.callbackId != nil) {
        CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsDictionary:@{@"type":@"exit"}];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.callbackId];
        self.callbackId = nil;
    }

    [self.inAppBrowserViewController.configuration.userContentController removeScriptMessageHandlerForName:IAB_BRIDGE_NAME];
    self.inAppBrowserViewController.configuration = nil;

    [self.inAppBrowserViewController.webView stopLoading];
    [self.inAppBrowserViewController.webView removeFromSuperview];
    [self.inAppBrowserViewController.webView setUIDelegate:nil];
    [self.inAppBrowserViewController.webView setNavigationDelegate:nil];
    self.inAppBrowserViewController.webView = nil;

    // Set navigationDelegate to nil to ensure no callbacks are received from it.
    self.inAppBrowserViewController.navigationDelegate = nil;
    self.inAppBrowserViewController = nil;

    // Set tmpWindow to hidden to make main WebView responsive to touch again
    // Based on https://stackoverflow.com/questions/4544489/how-to-remove-a-uiwindow
    self->tmpWindow.hidden = YES;
    self->tmpWindow = nil;
}

@end // CDVWKInAppBrowser

#pragma mark CDVWKInAppBrowserViewController

@implementation CDVWKInAppBrowserViewController

@synthesize currentURL;

CGFloat lastReducedStatusBarHeight = 0.0;
BOOL isExiting = NO;

- (id)initWithBrowserOptions:(CDVInAppBrowserOptions *)browserOptions andSettings:(CDVSettingsDictionary *)settings
{
    self = [super init];
    if (self != nil) {
        _browserOptions = browserOptions;
        _settings = settings;
        self.webViewUIDelegate = [[CDVWKInAppBrowserUIDelegate alloc] initWithTitle:[[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"]];
        [self.webViewUIDelegate setViewController:self];
        [self createViews];
    }

    return self;
}

- (void)createViews
{
    // We create the views in code for primarily for ease of upgrades and not requiring an external .xib to be included.
    WKUserContentController *userContentController = [[WKUserContentController alloc] init];
    WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];
    NSString *userAgent = configuration.applicationNameForUserAgent;

    if ([_settings cordovaSettingForKey:@"OverrideUserAgent"] == nil &&
        [_settings cordovaSettingForKey:@"AppendUserAgent"] != nil) {
        userAgent = [NSString stringWithFormat:@"%@ %@", userAgent, [_settings cordovaSettingForKey:@"AppendUserAgent"]];
    }

    configuration.applicationNameForUserAgent = userAgent;
    configuration.userContentController = userContentController;
#if __has_include(<Cordova/CDVWebViewProcessPoolFactory.h>)
    if (@available(iOS 15.0, *)) {
        // Since iOS 15 WKProcessPool is deprecated and has no effect
    } else {
        // Set for iOS 14 and 15 a shared process pool
        // CDVWebViewProcessPoolFactory is deprecated since cordova-ios 8.0.0
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        configuration.processPool = [[CDVWebViewProcessPoolFactory sharedFactory] sharedProcessPool];
#pragma clang diagnostic pop
    }
#endif
    [configuration.userContentController addScriptMessageHandler:self name:IAB_BRIDGE_NAME];

    // WKWebView options
    configuration.allowsInlineMediaPlayback = _browserOptions.allowinlinemediaplayback;
    configuration.ignoresViewportScaleLimits = _browserOptions.enableviewportscale;

    if (_browserOptions.mediaplaybackrequiresuseraction == YES) {
        configuration.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeAll;
    } else {
        configuration.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;
    }

    if (@available(iOS 13.0, *)) {
        NSString *contentMode = [_settings cordovaSettingForKey:@"PreferredContentMode"];
        if ([contentMode isEqual: @"mobile"]) {
            configuration.defaultWebpagePreferences.preferredContentMode = WKContentModeMobile;
        } else if ([contentMode  isEqual: @"desktop"]) {
            configuration.defaultWebpagePreferences.preferredContentMode = WKContentModeDesktop;
        }

    }

    self.webView = [[WKWebView alloc] initWithFrame:CGRectZero configuration:configuration];

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 160400
    // With the introduction of iOS 16.4 the WebView is no longer inspectable by default.
    // We'll honor that change for release builds, but will still allow inspection on debug builds by default.
    // We also introduce an override option, so consumers can influence this decision in their own build.
    if (@available(iOS 16.4, *)) {
#ifdef DEBUG
        BOOL allowWebviewInspectionDefault = YES;
#else
        BOOL allowWebviewInspectionDefault = NO;
#endif
        self.webView.inspectable = [_settings cordovaBoolSettingForKey:@"InspectableWebview" defaultValue:allowWebviewInspectionDefault];
    }
#endif

    [self.view addSubview:self.webView];
    // The WebView should be behind the other elements like toolbar, address label, spinner
    // Since the WebView is added first, this is already the case.
    // sendSubviewToBack is normally not necessary.
    [self.view sendSubviewToBack:self.webView];

    // We add our own constraints, they should not be determined from the frame.
    self.webView.translatesAutoresizingMaskIntoConstraints = NO;
    
    self.toolbarBackground = [UIView new];
    // We add our own constraints, they should not be determined from the frame.
    self.toolbarBackground.translatesAutoresizingMaskIntoConstraints = NO;
    
    // Get toolbar background color by options or set default which is white
    UIColor *toolbarBackgroundColor = _browserOptions.toolbarcolor ? [self colorFromHexString:_browserOptions.toolbarcolor] : UIColor.whiteColor;
    
    // Make toolbar semi-transparent by options, default is YES
    if (_browserOptions.toolbartranslucent) {
        // On iOS 18 and older, use a semi-transparent color
        toolbarBackgroundColor = [toolbarBackgroundColor colorWithAlphaComponent:0.6];
    }
    
    self.toolbarBackground.backgroundColor = toolbarBackgroundColor;
    [self.view addSubview:self.toolbarBackground];
    
    // NOTE: Initializing UIToolbar with initWithFrame: instead of `new` prevents
    // constraint warnings on iOS 18 and older, which has no impact, since auto
    // layout is used.
    self.toolbar = [[UIToolbar alloc] initWithFrame:CGRectMake(0.0, 0.0, 100.0, 100.0)];
    // Remove the toolbar background on iOS 18 and older
    if (@available(iOS 26.0, *)) {
        // Don't do anything on iOS 26 and newer, there is no background by default
    } else {
        // iOS 18 and older: Remove default background, since we provide our own backround
        // Remove background
        [self.toolbar setBackgroundImage:[UIImage new]
                      forToolbarPosition:UIToolbarPositionAny
                              barMetrics:UIBarMetricsDefault];
        // barStyle has to be set to UIBarStyleBlack, otherwhise there would be a gray line left,
        // after the background was removed
        self.toolbar.barStyle = UIBarStyleBlack;
    }
    // We add our own constraints, they should not be determined from the frame.
    self.toolbar.translatesAutoresizingMaskIntoConstraints = NO;
    [self.toolbarBackground addSubview:self.toolbar];
    
    // Background view for address label
    self.addressBackgroundView = [UIView new];
    self.addressBackgroundView.backgroundColor = [UIColor colorWithWhite:1.0 alpha:0.6];
    self.addressBackgroundView.layer.cornerRadius = 15.0;
    // We add our own constraints, they should not be determined from the frame.
    self.addressBackgroundView.translatesAutoresizingMaskIntoConstraints = NO;
    [self.view addSubview:self.addressBackgroundView];
    
    self.addressLabel = [UILabel new];
    self.addressLabel.text = NSLocalizedString(@"Loading...", nil);
    self.addressLabel.textColor = UIColor.blackColor;
    self.addressLabel.textAlignment = NSTextAlignmentLeft;
    // Truncate at tail of line: "abcd..."
    self.addressLabel.lineBreakMode = NSLineBreakByTruncatingTail;
    // We add our own constraints, they should not be determined from the frame.
    self.addressLabel.translatesAutoresizingMaskIntoConstraints = NO;
    [self.addressBackgroundView addSubview:self.addressLabel];
    
    self.spinner = [[UIActivityIndicatorView alloc] initWithFrame:CGRectZero];
    self.spinner.clearsContextBeforeDrawing = NO;
    self.spinner.clipsToBounds = NO;
    self.spinner.contentMode = UIViewContentModeScaleToFill;
    self.spinner.hidden = NO;
    self.spinner.hidesWhenStopped = YES;
    self.spinner.multipleTouchEnabled = NO;
    self.spinner.opaque = NO;
    self.spinner.userInteractionEnabled = NO;
    [self.spinner stopAnimating];
    [self.view addSubview:self.spinner];
    // We add our own constraints, they should not be determined from the frame.
    self.spinner.translatesAutoresizingMaskIntoConstraints = NO;

    self.closeButton = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone target:self action:@selector(close)];
    self.closeButton.enabled = YES;

    UIBarButtonItem *flexibleSpaceButton = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace target:nil action:nil];

    UIBarButtonItem *fixedSpaceButton = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFixedSpace target:nil action:nil];
    fixedSpaceButton.width = 20;

    NSString *frontArrowString = NSLocalizedString(@"►", nil); // Create arrow from Unicode char
    self.forwardButton = [[UIBarButtonItem alloc] initWithTitle:frontArrowString style:UIBarButtonItemStylePlain target:self action:@selector(goForward:)];
    self.forwardButton.enabled = YES;
    self.forwardButton.imageInsets = UIEdgeInsetsZero;
    if (_browserOptions.navigationbuttoncolor != nil) { // Set button color if user sets it in options
        self.forwardButton.tintColor = [self colorFromHexString:_browserOptions.navigationbuttoncolor];
    }

    NSString *backArrowString = NSLocalizedString(@"◄", nil); // Create arrow from Unicode char
    self.backButton = [[UIBarButtonItem alloc] initWithTitle:backArrowString style:UIBarButtonItemStylePlain target:self action:@selector(goBack:)];
    self.backButton.enabled = YES;
    self.backButton.imageInsets = UIEdgeInsetsZero;
    if (_browserOptions.navigationbuttoncolor != nil) { // Set button color if user sets it in options
        self.backButton.tintColor = [self colorFromHexString:_browserOptions.navigationbuttoncolor];
    }

    // Add toolbar items
    // Define the close button and flexible space button, they are swapped when lefttoright is set
    NSArray *closeItems = _browserOptions.lefttoright ? @[flexibleSpaceButton, self.closeButton] : @[self.closeButton, flexibleSpaceButton];
    // Navigation items are optional
    NSArray *navigationItems = @[self.backButton, fixedSpaceButton, self.forwardButton];

    // Add close items without navigation items
    if (_browserOptions.hidenavigationbuttons) {
        self.toolbar.items = closeItems;

        // Add close items and navigation items
    } else {
        // left to right is set, first add navigation items, than close items
        if (_browserOptions.lefttoright) {
            self.toolbar.items = [navigationItems arrayByAddingObjectsFromArray:closeItems];

            // Default order, first close items than navigation items
        } else {
            self.toolbar.items = [closeItems arrayByAddingObjectsFromArray:navigationItems];
        }
    }

    self.webView.navigationDelegate = self;
    self.webView.UIDelegate = self.webViewUIDelegate;
    self.webView.backgroundColor = [UIColor whiteColor];
    if ([_settings cordovaSettingForKey:@"OverrideUserAgent"] != nil) {
        self.webView.customUserAgent = [_settings cordovaSettingForKey:@"OverrideUserAgent"];
    }

    self.webView.clearsContextBeforeDrawing = YES;
    self.webView.clipsToBounds = YES;
    self.webView.contentMode = UIViewContentModeScaleToFill;
    self.webView.multipleTouchEnabled = YES;
    self.webView.opaque = YES;
    self.webView.userInteractionEnabled = YES;
    self.webView.allowsLinkPreview = NO;
    self.webView.allowsBackForwardNavigationGestures = NO;

    // Setup Auto Layout constraints
    BOOL toolbarIsAtTop = [_browserOptions.toolbarposition isEqualToString:kInAppBrowserToolbarBarPositionTop];
    BOOL toolbarVisible = _browserOptions.toolbar;
    BOOL addressLabelVisible = _browserOptions.location;

    // Setup horizontal constraints
    // WebView horizontal constraints
    [NSLayoutConstraint activateConstraints:@[
        // Left
        [self.webView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
        // Right
        [self.webView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor]
    ]];

    // Toolbar background horizontal constraints
    [NSLayoutConstraint activateConstraints:@[
        // Left
        [self.toolbarBackground.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
        // Right
        [self.toolbarBackground.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor]
    ]];
    
    // Constrain Toolbar inside Toolbar background view with margin
    [NSLayoutConstraint activateConstraints:@[
        [self.toolbar.topAnchor constraintEqualToAnchor:self.toolbarBackground.layoutMarginsGuide.topAnchor],
        [self.toolbar.bottomAnchor constraintEqualToAnchor:self.toolbarBackground.layoutMarginsGuide.bottomAnchor],
        [self.toolbar.leadingAnchor constraintEqualToAnchor:self.toolbarBackground.layoutMarginsGuide.leadingAnchor],
        [self.toolbar.trailingAnchor constraintEqualToAnchor:self.toolbarBackground.layoutMarginsGuide.trailingAnchor]
    ]];

    // Address background horizontal constraints with margin
    [NSLayoutConstraint activateConstraints:@[
        // Left to safe area for proper layout on landscape
        [self.addressBackgroundView.leadingAnchor constraintEqualToAnchor:self.view.layoutMarginsGuide.leadingAnchor],
        // Right to safe area for proper layout on landscape
        [self.addressBackgroundView.trailingAnchor constraintEqualToAnchor:self.view.layoutMarginsGuide.trailingAnchor]
    ]];

    // Constrain Address label inside Address background view with padding
    [NSLayoutConstraint activateConstraints:@[
        [self.addressLabel.topAnchor constraintEqualToAnchor:self.addressBackgroundView.layoutMarginsGuide.topAnchor],
        [self.addressLabel.bottomAnchor constraintEqualToAnchor:self.addressBackgroundView.layoutMarginsGuide.bottomAnchor],
        [self.addressLabel.leadingAnchor constraintEqualToAnchor:self.addressBackgroundView.layoutMarginsGuide.leadingAnchor],
        [self.addressLabel.trailingAnchor constraintEqualToAnchor:self.addressBackgroundView.layoutMarginsGuide.trailingAnchor]
    ]];

    // Center spinner in WebView
    [self.spinner.centerXAnchor constraintEqualToAnchor:self.webView.centerXAnchor].active = YES;
    [self.spinner.centerYAnchor constraintEqualToAnchor:self.webView.centerYAnchor].active = YES;

    // Define vertical constraints, in order from top to bottom
    // The Address label and Toolbar are optional
    // Constraints for different cases set by options when Toolbar and/or Address label is visible or not
    //
    // Case 1: Toolbar and Address label not visible
    if (!toolbarVisible && !addressLabelVisible) {
        // Webview top to top edge
        [self.webView.topAnchor constraintEqualToAnchor:self.view.topAnchor].active = YES;
        // WebView bottom to bottom edge
        [self.webView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor].active = YES;
    }
    
    // Case 2: Toolbar visible, Address label not visible
    if (toolbarVisible && !addressLabelVisible) {
        // Toolbar is at top
        if (toolbarIsAtTop) {
            [NSLayoutConstraint activateConstraints:@[
                // Toolbar background top to top edge
                [self.toolbarBackground.topAnchor constraintEqualToAnchor:self.view.topAnchor],
                // Webview top to Toolbar background bottom
                [self.webView.topAnchor constraintEqualToAnchor:self.toolbarBackground.bottomAnchor],
                // WebView bottom to bottom edge
                [self.webView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor]
            ]];
            // Toolbar is at bottom (default)
        } else {
            [NSLayoutConstraint activateConstraints:@[
                // WebView top to top edge
                [self.webView.topAnchor constraintEqualToAnchor:self.view.topAnchor],
                // WebView bottom to Toolbar background top
                [self.webView.bottomAnchor constraintEqualToAnchor:self.toolbarBackground.topAnchor],
                // Toolbar background bottom to bottom edge
                [self.toolbarBackground.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor],
            ]];
        }
    }

    // Case 3: Toolbar not visible, Address label visible
    if (!toolbarVisible && addressLabelVisible) {
        [NSLayoutConstraint activateConstraints:@[
            // Webview top to top edge
            [self.webView.topAnchor constraintEqualToAnchor:self.view.topAnchor],
            // Address background top to web view bottom with spacing
            [self.addressBackgroundView.topAnchor constraintEqualToSystemSpacingBelowAnchor:self.webView.bottomAnchor
                                                                                 multiplier:1.0],
            // Address background bottom to safe area bottom
            [self.addressBackgroundView.bottomAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.bottomAnchor]
        ]];
    }

    // Case 4: Toolbar visible and Address label visible (default)
    if (toolbarVisible && addressLabelVisible) {
        // Toolbar is at top
        if (toolbarIsAtTop) {
            [NSLayoutConstraint activateConstraints:@[
                // Toolbar background top to top edge
                [self.toolbarBackground.topAnchor constraintEqualToAnchor:self.view.topAnchor],
                // Webview top to Toolbar background bottom
                [self.webView.topAnchor constraintEqualToAnchor:self.toolbarBackground.bottomAnchor],
                // Address background top to web view bottom with spacing
                [self.addressBackgroundView.topAnchor constraintEqualToSystemSpacingBelowAnchor:self.webView.bottomAnchor
                                                                                     multiplier:1.0],
                // Address background bottom to safe area bottom
                [self.addressBackgroundView.bottomAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.bottomAnchor]
            ]];

            // Toolbar is at bottom (default)
        } else {
            [NSLayoutConstraint activateConstraints:@[
                // WebView top to top edge
                [self.webView.topAnchor constraintEqualToAnchor:self.view.topAnchor],
                // Address background top to web view bottom with spacing
                [self.addressBackgroundView.topAnchor constraintEqualToSystemSpacingBelowAnchor:self.webView.bottomAnchor
                                                                                     multiplier:1.0],
                // Toolbar background top to address background bottom with spacing
                [self.toolbarBackground.topAnchor constraintEqualToSystemSpacingBelowAnchor:self.addressBackgroundView.bottomAnchor multiplier:1.0],
                // Toolbar background bottom to bottom edge
                [self.toolbarBackground.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor],
            ]];
        }
    }
}

- (void)setWebViewFrame:(CGRect)frame
{
    NSLog(@"Setting the WebView's frame to %@", NSStringFromCGRect(frame));
    [self.webView setFrame:frame];
}

- (void)setCloseButtonTitle:(NSString *)title withColor:(NSString *)colorString atIndex:(int)buttonIndex
{
    // The advantage of using UIBarButtonSystemItemDone is the system will localize it for you automatically
    // but, if you want to set this yourself, knock yourself out. (We can't set the title for a system Done button, so we have to create a new one.)
    self.closeButton = nil;
    // Initialize with title if title is set, otherwise the title will be 'Done' localized.
    self.closeButton = title != nil ? [[UIBarButtonItem alloc] initWithTitle:title style:UIBarButtonItemStylePlain target:self action:@selector(close)] : [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone target:self action:@selector(close)];
    self.closeButton.enabled = YES;
    // If color on closebutton is requested then initialize with that that color, otherwise use initialize with default.
    self.closeButton.tintColor = colorString != nil ? [self colorFromHexString:colorString] : [UIColor colorWithRed:60.0 / 255.0 green:136.0 / 255.0 blue:230.0 / 255.0 alpha:1];

    NSMutableArray *items = [self.toolbar.items mutableCopy];
    [items replaceObjectAtIndex:buttonIndex withObject:self.closeButton];
    [self.toolbar setItems:items];
}

- (void)showLocationBar:(BOOL)show
{
    self.addressBackgroundView.hidden = !show;
    [self.view setNeedsLayout];
    [self.view layoutIfNeeded];
}

- (void)showToolBar:(BOOL)show atPosition:(NSString *)toolbarPosition
{
    self.toolbarBackground.hidden = !show;
    _browserOptions.toolbarposition = toolbarPosition; // Keep state consistent if needed
    [self.view setNeedsLayout];
    [self.view layoutIfNeeded];
}

- (void)viewDidLoad
{
    [super viewDidLoad];
}

- (void)viewDidDisappear:(BOOL)animated
{
    [super viewDidDisappear:animated];
    if (isExiting && (self.navigationDelegate != nil) && [self.navigationDelegate respondsToSelector:@selector(browserExit)]) {
        [self.navigationDelegate browserExit];
        isExiting = NO;
    }
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
    NSString *statusBarStylePreference = [_settings cordovaSettingForKey:@"InAppBrowserStatusBarStyle"];
    if (statusBarStylePreference && [statusBarStylePreference isEqualToString:@"lightcontent"]) {
        return UIStatusBarStyleLightContent;
    } else if (statusBarStylePreference && [statusBarStylePreference isEqualToString:@"darkcontent"]) {
        if (@available(iOS 13.0, *)) {
            return UIStatusBarStyleDarkContent;
        } else {
            return UIStatusBarStyleDefault;
        }
    } else {
        return UIStatusBarStyleDefault;
    }
}

- (BOOL)prefersStatusBarHidden
{
    return NO;
}

- (void)close
{
    self.currentURL = nil;

    __weak UIViewController *weakSelf = self;

    // Run later to avoid the "took a long time" log message.
    dispatch_async(dispatch_get_main_queue(), ^{
        isExiting = YES;
        lastReducedStatusBarHeight = 0.0;
        if ([weakSelf respondsToSelector:@selector(presentingViewController)]) {
            [[weakSelf presentingViewController] dismissViewControllerAnimated:YES completion:nil];
        } else {
            [[weakSelf parentViewController] dismissViewControllerAnimated:YES completion:nil];
        }
    });
}

- (void)navigateTo:(NSURL *)url
{
    if ([url.scheme isEqualToString:@"file"]) {
        [self.webView loadFileURL:url allowingReadAccessToURL:url];
    } else {
        NSURLRequest *request = [NSURLRequest requestWithURL:url];
        [self.webView loadRequest:request];
    }
}

- (void)goBack:(id)sender
{
    [self.webView goBack];
}

- (void)goForward:(id)sender
{
    [self.webView goForward];
}

// Helper function to convert hex color string to UIColor
// Assumes input like "#00FF00" (#RRGGBB).
// Taken from https://stackoverflow.com/questions/1560081/how-can-i-create-a-uicolor-from-a-hex-string
- (UIColor *)colorFromHexString:(NSString *)hexString
{
    unsigned rgbValue = 0;
    NSScanner *scanner = [NSScanner scannerWithString:hexString];
    [scanner setScanLocation:1]; // bypass '#' character
    [scanner scanHexInt:&rgbValue];
    return [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16)/255.0 green:((rgbValue & 0xFF00) >> 8)/255.0 blue:(rgbValue & 0xFF)/255.0 alpha:1.0];
}

#pragma mark WKNavigationDelegate

- (void)webView:(WKWebView *)theWebView didStartProvisionalNavigation:(WKNavigation *)navigation
{
    NSLog(@"didStartProvisionalNavigation");
    // Loading URL, start spinner, update back/forward
    self.addressLabel.text = NSLocalizedString(@"Loading...", nil);
    self.backButton.enabled = theWebView.canGoBack;
    self.forwardButton.enabled = theWebView.canGoForward;

    if (!_browserOptions.hidespinner) [self.spinner startAnimating];
    return [self.navigationDelegate didStartProvisionalNavigation:theWebView];
}

- (void)webView:(WKWebView *)theWebView
decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction
decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler
{
    NSURL *url = navigationAction.request.URL;
    NSURL *mainDocumentURL = navigationAction.request.mainDocumentURL;

    BOOL isTopLevelNavigation = [url isEqual:mainDocumentURL];

    if (isTopLevelNavigation) {
        self.currentURL = url;
    }

    [self.navigationDelegate webView:theWebView decidePolicyForNavigationAction:navigationAction decisionHandler:decisionHandler];
}

- (void)webView:(WKWebView *)theWebView didFinishNavigation:(WKNavigation *)navigation
{
    NSLog(@"didFinishNavigation");
    // Update URL, stop spinner, update back/forward
    self.addressLabel.text = self.currentURL.absoluteString;
    self.backButton.enabled = theWebView.canGoBack;
    self.forwardButton.enabled = theWebView.canGoForward;
    theWebView.scrollView.contentInset = UIEdgeInsetsZero;
    [self.spinner stopAnimating];
    [self.navigationDelegate didFinishNavigation:theWebView];
}

- (void)webView:(WKWebView *)theWebView failedNavigation:(NSString *) delegateName withError:(nonnull NSError *)error
{
    // Log fail message, stop spinner, update back/forward
    NSLog(@"webView:%@ - %ld: %@", delegateName, (long)error.code, [error localizedDescription]);
    self.backButton.enabled = theWebView.canGoBack;
    self.forwardButton.enabled = theWebView.canGoForward;
    [self.spinner stopAnimating];
    self.addressLabel.text = NSLocalizedString(@"Load Error", nil);
    [self.navigationDelegate webView:theWebView didFailNavigation:error];
}

- (void)webView:(WKWebView *)theWebView didFailNavigation:(null_unspecified WKNavigation *)navigation withError:(nonnull NSError *)error
{
    [self webView:theWebView failedNavigation:@"didFailNavigation" withError:error];
}

- (void)webView:(WKWebView *)theWebView didFailProvisionalNavigation:(null_unspecified WKNavigation *)navigation withError:(nonnull NSError *)error
{
    [self webView:theWebView failedNavigation:@"didFailProvisionalNavigation" withError:error];
}

#pragma mark WKScriptMessageHandler delegate
- (void)userContentController:(nonnull WKUserContentController *)userContentController didReceiveScriptMessage:(nonnull WKScriptMessage *)message
{
    if (![message.name isEqualToString:IAB_BRIDGE_NAME]) {
        return;
    }
    [self.navigationDelegate userContentController:userContentController didReceiveScriptMessage:message];
}

#pragma mark UIAdaptivePresentationControllerDelegate

- (void)presentationControllerWillDismiss:(UIPresentationController *)presentationController
{
    isExiting = YES;
}

@end // CDVWKInAppBrowserViewController
