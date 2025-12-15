#import <Cordova/CDVPluginResult.h>

#import "CDVMultiInAppBrowser.h"
#import "CDVWKInAppBrowser+Expose.h"
#import "CDVWKInAppBrowser+Events.h"
#import "CDVInAppBrowserWindowManager.h"
#import <objc/runtime.h>

@implementation CDVMultiInAppBrowser

static CDVMultiInAppBrowser* _sharedInstance = nil;

+ (instancetype)sharedInstance {
    return _sharedInstance;
}

- (void)pluginInitialize {
    [super pluginInitialize];
    _sharedInstance = self;
}

#pragma mark - Helpers

- (CDVWKInAppBrowser*)browserForId:(NSString*)windowId {
    return [[CDVInAppBrowserWindowManager sharedManager] browserForId:windowId];
}

#pragma mark - Open new instance

- (void)open:(CDVInvokedUrlCommand*)command {
    NSString* url = [command argumentAtIndex:0];
    NSString* target = [command argumentAtIndex:1 withDefault:@"_blank"];
    NSString* options = [command argumentAtIndex:2 withDefault:@"" andClass:[NSString class]];
    NSString* providedWindowId = [command argumentAtIndex:3 withDefault:nil];
    NSString* windowId = providedWindowId ?: [[NSUUID UUID] UUIDString];

    if (url == nil) {
        CDVPluginResult* errorResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"URL is undefined"];
        [self.commandDelegate sendPluginResult:errorResult callbackId:command.callbackId];
        return;
    }

    NSLog(@"[IABMultiInstance] Creating browser with ID %@", windowId);

    CDVWKInAppBrowser* browser = [[CDVWKInAppBrowser alloc]
                                  initStandaloneWithDelegate:self.commandDelegate
                                  viewController:self.viewController];

    objc_setAssociatedObject(browser, "windowId", windowId, OBJC_ASSOCIATION_RETAIN_NONATOMIC);

    [[CDVInAppBrowserWindowManager sharedManager] registerBrowser:browser forId:windowId];

    NSString* fakeCallbackId = [NSString stringWithFormat:@"InAppBrowser_%@", windowId];
    CDVInvokedUrlCommand* innerCmd = [[CDVInvokedUrlCommand alloc]
                                      initWithArguments:@[url, target, options]
                                      callbackId:fakeCallbackId
                                      className:@"InAppBrowser"
                                      methodName:@"open"];

    [browser open:innerCmd];

    NSDictionary* payload = @{@"windowId": windowId};
    CDVPluginResult* okResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                              messageAsDictionary:payload];
    [self.commandDelegate sendPluginResult:okResult callbackId:command.callbackId];

    NSLog(@"[IABMultiInstance] Returning windowId=%@", windowId);
}

#pragma mark - Proxy commands

- (void)close:(CDVInvokedUrlCommand*)command {
    NSString* windowId = [command argumentAtIndex:0];

    CDVWKInAppBrowser* browser = [self browserForId:windowId];

    if (browser) {
        [browser safeClose];
    }
}

- (void)show:(CDVInvokedUrlCommand*)command {
    NSString* windowId = [command argumentAtIndex:0];

    CDVWKInAppBrowser* browser = [self browserForId:windowId];

    if (browser) {
        [browser show:nil];
    }
}

- (void)hide:(CDVInvokedUrlCommand*)command {
    NSString* windowId = [command argumentAtIndex:0];

    CDVWKInAppBrowser* browser = [self browserForId:windowId];
    
    if (browser) {
        [browser hide:nil];
    }
}

- (void)loadAfterBeforeload:(CDVInvokedUrlCommand*)command {
    NSString* windowId = [command argumentAtIndex:0];
    NSString* urlStr = [command argumentAtIndex:1];

    if (urlStr == nil || [urlStr length] == 0) return;

    CDVWKInAppBrowser* browser = [[CDVInAppBrowserWindowManager sharedManager] browserForId:windowId];

    if (browser) {
        CDVInvokedUrlCommand* subcmd =
            [[CDVInvokedUrlCommand alloc] initWithArguments:@[urlStr]
                                                    callbackId:command.callbackId
                                                    className:@"CDVWKInAppBrowser"
                                                    methodName:@"loadAfterBeforeload"];
        [browser loadAfterBeforeload:subcmd];
    }
}


#pragma mark - Script injection

- (void)injectScriptCode:(CDVInvokedUrlCommand*)command {
    NSString* windowId = [command argumentAtIndex:0];
    NSString* code = [command argumentAtIndex:1];

    CDVWKInAppBrowser* browser = [self browserForId:windowId];

    if (browser && code) {
        CDVInvokedUrlCommand* inner = [[CDVInvokedUrlCommand alloc]
                                       initWithArguments:@[code]
                                       callbackId:command.callbackId
                                       className:@"InAppBrowser"
                                       methodName:@"injectScriptCode"];
        [browser injectScriptCode:inner];
    }
}

- (void)injectScriptFile:(CDVInvokedUrlCommand*)command {
    NSString* windowId = [command argumentAtIndex:0];
    NSString* file = [command argumentAtIndex:1];

    CDVWKInAppBrowser* browser = [[CDVInAppBrowserWindowManager sharedManager] browserForId:windowId];

    if (browser && file) {
        CDVInvokedUrlCommand* inner = [[CDVInvokedUrlCommand alloc]
                                       initWithArguments:@[file]
                                       callbackId:command.callbackId
                                       className:@"InAppBrowser"
                                       methodName:@"injectScriptFile"];
        [browser injectScriptFile:inner];
    }
}

- (void)injectStyleCode:(CDVInvokedUrlCommand*)command {
    NSString* windowId = [command argumentAtIndex:0];
    NSString* code = [command argumentAtIndex:1];

    CDVWKInAppBrowser* browser = [self browserForId:windowId];

    if (browser && code) {
        CDVInvokedUrlCommand* inner = [[CDVInvokedUrlCommand alloc]
                                       initWithArguments:@[code]
                                       callbackId:command.callbackId
                                       className:@"InAppBrowser"
                                       methodName:@"injectStyleCode"];
        [browser injectStyleCode:inner];
    }
}

- (void)injectStyleFile:(CDVInvokedUrlCommand*)command {
    NSString* windowId = [command argumentAtIndex:0];
    NSString* file = [command argumentAtIndex:1];

    CDVWKInAppBrowser* browser = [self browserForId:windowId];

    if (browser && file) {
        CDVInvokedUrlCommand* inner = [[CDVInvokedUrlCommand alloc]
                                       initWithArguments:@[file]
                                       callbackId:command.callbackId
                                       className:@"InAppBrowser"
                                       methodName:@"injectStyleFile"];
        [browser injectStyleFile:inner];
    }
}

#pragma mark - Events handling

//- (void)addEventListener:(CDVInvokedUrlCommand*)command {
//    // all events are routed through observeEvents & distributeEvent
//    // the correct callback for the corresponding event and browser is called on the js side
//}

//- (void)removeEventListener:(CDVInvokedUrlCommand*)command {
//    // all events are routed through observeEvents & distributeEvent
//    // the correct callback for the corresponding event and browser is called on the js side
//}

- (void)observeEvents:(CDVInvokedUrlCommand*)command {
    self.observeEventsCallbackId = command.callbackId;

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"observing"];
    [result setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:result callbackId:self.observeEventsCallbackId];
}


- (void)distributeEvent:(NSDictionary*)payload {
    if (!self.observeEventsCallbackId) return;

    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:payload];
    [result setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:result callbackId:self.observeEventsCallbackId];

    NSString* type = payload[@"type"];
    if ([type isEqualToString:@"exit"]) {
        NSString* windowId = payload[@"windowId"];
        if (windowId != nil) {
            [[CDVInAppBrowserWindowManager sharedManager] unregisterBrowser:windowId];
        }
    }
}

@end
