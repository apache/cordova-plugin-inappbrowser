#import "CDVWKInAppBrowser+Expose.h"
#import <objc/runtime.h>

// IAB Multi-Instance support
@implementation CDVWKInAppBrowser (Expose)

- (instancetype)initStandaloneWithDelegate:(id<CDVCommandDelegate>)delegate
                           viewController:(UIViewController*)vc {
    if (self = [super init]) {
        self.commandDelegate = delegate;
        self.viewController = vc;
    }
    return self;
}

// Special closing behaviour is required due to the following issues..
// When the browser is hidden, it cannot be closed.
// https://github.com/apache/cordova-plugin-inappbrowser/issues/649
// https://github.com/apache/cordova-plugin-inappbrowser/issues/423
// https://github.com/apache/cordova-plugin-inappbrowser/issues/290
// https://github.com/apache/cordova-plugin-inappbrowser/issues/844
- (void)safeClose
{
    BOOL wasHidden = [objc_getAssociatedObject(self, "wasHidden") boolValue];
    if (wasHidden) {
        NSLog(@"[CDVWKInAppBrowser] safeClose detected hidden view; performing forced cleanup");
        [self.viewController viewDidDisappear:NO];
        [self browserExit];
    } else {
        [self.inAppBrowserViewController close];
    }
}

@end
