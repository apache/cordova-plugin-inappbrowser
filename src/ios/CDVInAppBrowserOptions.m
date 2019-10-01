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

#import "CDVInAppBrowserOptions.h"

#import <objc/runtime.h>

@implementation CDVInAppBrowserOptions

- (id)init
{
    if (self = [super init]) {
        // default values
        self.usewkwebview = NO;
        self.location = YES;
        self.toolbar = YES;
        self.closebuttoncaption = nil;
        self.toolbarposition = @"bottom";
        self.cleardata = NO;
        self.clearcache = NO;
        self.clearsessioncache = NO;
        self.hidespinner = NO;

        self.enableviewportscale = NO;
        self.mediaplaybackrequiresuseraction = NO;
        self.allowinlinemediaplayback = NO;
        self.keyboarddisplayrequiresuseraction = YES;
        self.suppressesincrementalrendering = NO;
        self.hidden = NO;
        self.disallowoverscroll = NO;
        self.hidenavigationbuttons = NO;
        self.closebuttoncolor = nil;
        self.lefttoright = false;
        self.toolbarcolor = nil;
        self.toolbartranslucent = YES;
        self.beforeload = @"";
    }

    return self;
}

+ (CDVInAppBrowserOptions*)parseOptions:(NSString*)options
{
    CDVInAppBrowserOptions* obj = [[CDVInAppBrowserOptions alloc] init];

    // NOTE: this parsing does not handle quotes within values
    NSArray* pairs = [options componentsSeparatedByString:@","];

    // parse keys and values, set the properties
    for (NSString* pair in pairs) {
        NSArray* keyvalue = [pair componentsSeparatedByString:@"="];

        if ([keyvalue count] == 2) {
            NSString* key = [[keyvalue objectAtIndex:0] lowercaseString];
            NSString* value = [keyvalue objectAtIndex:1];
            NSString* value_lc = [value lowercaseString];

            // set the property according to the key name
            if ([obj respondsToSelector:NSSelectorFromString(key)]) {
                NSString *attributes = [self attributesOfPropertyNamed:key];
                if (attributes) {

                    if ([attributes hasPrefix:@"TB,"]) {
                        [obj setValue:[NSNumber numberWithBool:[value_lc isEqualToString:@"yes"]] forKey:key];

                    } else if ([attributes hasPrefix:@"T@\"NSNumber\","]) {
                        NSNumberFormatter* numberFormatter = [[NSNumberFormatter alloc] init];
                        [numberFormatter setAllowsFloats:YES];
                        [obj setValue:[numberFormatter numberFromString:value_lc] forKey:key];

                    } else if ([attributes hasPrefix:@"T@\"NSString\","]) {
                        [obj setValue:value forKey:key];
                    }
                }
            }
        }
    }

    return obj;
}

+ (NSString*)attributesOfPropertyNamed:(NSString*)propertyName {
    objc_property_t property = class_getProperty([self class], [propertyName UTF8String]);
    return property ? [NSString stringWithCString:property_getAttributes(property) encoding:NSUTF8StringEncoding] : nil;
}

@end
