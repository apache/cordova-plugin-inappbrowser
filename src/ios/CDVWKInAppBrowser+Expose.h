#import "CDVWKInAppBrowser.h"

// IAB Multi-Instance support
@interface CDVWKInAppBrowser (Expose)

// defined via CDVWKInAppBrowser.h
//- (void)open:(CDVInvokedUrlCommand*)command;
//- (void)close:(CDVInvokedUrlCommand*)command;
//- (void)show:(CDVInvokedUrlCommand*)command;
//- (void)hide:(CDVInvokedUrlCommand*)command;
//- (void)loadAfterBeforeload:(CDVInvokedUrlCommand*)command;
//- (void)injectScriptCode:(CDVInvokedUrlCommand*)command;

// needs to be exposed, because in CDVWKInAppBrowser.h these functions are not public
- (void)browserExit;
- (void)injectScriptFile:(CDVInvokedUrlCommand*)command;
- (void)injectStyleCode:(CDVInvokedUrlCommand*)command;
- (void)injectStyleFile:(CDVInvokedUrlCommand*)command;

- (void)safeClose;
- (instancetype)initStandaloneWithDelegate:(id<CDVCommandDelegate>)delegate
                           viewController:(UIViewController*)vc;

@end
