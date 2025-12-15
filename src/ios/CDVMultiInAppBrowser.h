#import <Cordova/CDVPlugin.h>

// IAB Multi-Instance support
@interface CDVMultiInAppBrowser : CDVPlugin

@property (nonatomic, strong) NSString* observeEventsCallbackId;

+ (instancetype)sharedInstance;

// defined via CDVWKInAppBrowser+Expose.h
//- (void)open:(CDVInvokedUrlCommand*)command;
//- (void)close:(CDVInvokedUrlCommand*)command;
//- (void)show:(CDVInvokedUrlCommand*)command;
//- (void)hide:(CDVInvokedUrlCommand*)command;
//- (void)loadAfterBeforeload:(CDVInvokedUrlCommand*)command;
//- (void)injectScriptCode:(CDVInvokedUrlCommand*)command;
//- (void)injectScriptFile:(CDVInvokedUrlCommand*)command;
//- (void)injectStyleCode:(CDVInvokedUrlCommand*)command;
//- (void)injectStyleFile:(CDVInvokedUrlCommand*)command;

// all events are routed through observeEvents & distributeEvent
// the correct callback for the corresponding event and browser is called on the js side
//- (void)addEventListener:(CDVInvokedUrlCommand*)command
//- (void)removeEventListener:(CDVInvokedUrlCommand*)command

- (void)observeEvents:(CDVInvokedUrlCommand*)command;
- (void)distributeEvent:(NSDictionary*)payload;

@end
