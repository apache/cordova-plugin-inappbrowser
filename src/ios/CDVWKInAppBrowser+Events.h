#import "CDVWKInAppBrowser.h"

// IAB Multi-Instance support
@interface CDVWKInAppBrowser (Events)

- (void)notifyEvent:(NSString*)type;
- (void)notifyEvent:(NSString*)type url:(NSString*)url;
- (void)notifyEvent:(NSString*)type data:(NSDictionary*)data;

- (void)notifyEvent:(NSString*)type url:(NSString*)url data:(NSDictionary*)data;

@end
