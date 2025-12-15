@class CDVWKInAppBrowser;

// IAB Multi-Instance support
@interface CDVInAppBrowserWindowManager : NSObject

@property(nonatomic,strong) NSMutableDictionary<NSString*,CDVWKInAppBrowser*> *browsers;

+ (instancetype)sharedManager;

- (void)registerBrowser:(CDVWKInAppBrowser*)browser forId:(NSString*)windowId;
- (void)unregisterBrowser:(NSString*)windowId;

- (CDVWKInAppBrowser*)browserForId:(NSString*)windowId;

@end
