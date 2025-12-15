#import "CDVWKInAppBrowser+Events.h"
#import "CDVMultiInAppBrowser.h"
#import <objc/runtime.h>

// IAB Multi-Instance support
@implementation CDVWKInAppBrowser (Events)

- (void)notifyEvent:(NSString*)type {
    [self notifyEvent:type url:nil data:nil];
}

- (void)notifyEvent:(NSString*)type url:(NSString*)url {
    [self notifyEvent:type url:url data:nil];
}

- (void)notifyEvent:(NSString*)type data:(NSDictionary*)data {
    [self notifyEvent:type url:nil data:data];
}

- (void)notifyEvent:(NSString*)type url:(NSString*)url data:(NSDictionary*)data {
    NSString* windowId = objc_getAssociatedObject(self, "windowId");
    if (!windowId) return;

    CDVMultiInAppBrowser* plugin = [CDVMultiInAppBrowser sharedInstance];
    if (!plugin) return;
    
    NSMutableDictionary* payload = [@{
        @"type": type ?: @"unknown",
        @"windowId": windowId
    } mutableCopy];
    
    if (data) [payload addEntriesFromDictionary:data];
    if (url) payload[@"url"] = url;

    [plugin distributeEvent:payload];
}

@end
