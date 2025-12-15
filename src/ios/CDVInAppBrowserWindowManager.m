#import "CDVInAppBrowserWindowManager.h"

// IAB Multi-Instance support
@implementation CDVInAppBrowserWindowManager

- (instancetype)init {
    if (self = [super init]) {
        _browsers = [NSMutableDictionary new];
    }
    return self;
}

+ (instancetype)sharedManager {
    static CDVInAppBrowserWindowManager *mgr;
    static dispatch_once_t once;
    dispatch_once(&once, ^{
        mgr = [CDVInAppBrowserWindowManager new];
        mgr.browsers = [NSMutableDictionary dictionary];
    });
    return mgr;
}

- (void)registerBrowser:(CDVWKInAppBrowser*)browser forId:(NSString*)windowId {
    if (browser && windowId) self.browsers[windowId] = browser;
}

- (void)unregisterBrowser:(NSString*)windowId {
    [self.browsers removeObjectForKey:windowId];
}

- (CDVWKInAppBrowser*)browserForId:(NSString*)windowId {
    @synchronized (self.browsers) {
        return self.browsers[windowId];
    }
}

@end
