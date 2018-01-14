/*
     File: WebViewController.m
 Abstract: Main web view controller.
  Version: 1.1
 
 Disclaimer: IMPORTANT:  This Apple software is supplied to you by Apple
 Inc. ("Apple") in consideration of your agreement to the following
 terms, and your use, installation, modification or redistribution of
 this Apple software constitutes acceptance of these terms.  If you do
 not agree with these terms, please do not use, install, modify or
 redistribute this Apple software.
 
 In consideration of your agreement to abide by the following terms, and
 subject to these terms, Apple grants you a personal, non-exclusive
 license, under Apple's copyrights in this original Apple software (the
 "Apple Software"), to use, reproduce, modify and redistribute the Apple
 Software, with or without modifications, in source and/or binary forms;
 provided that if you redistribute the Apple Software in its entirety and
 without modifications, you must retain this notice and the following
 text and disclaimers in all such redistributions of the Apple Software.
 Neither the name, trademarks, service marks or logos of Apple Inc. may
 be used to endorse or promote products derived from the Apple Software
 without specific prior written permission from Apple.  Except as
 expressly stated in this notice, no other rights or licenses, express or
 implied, are granted by Apple herein, including but not limited to any
 patent rights that may be infringed by your derivative works or by other
 works in which the Apple Software may be incorporated.
 
 The Apple Software is provided by Apple on an "AS IS" basis.  APPLE
 MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION
 THE IMPLIED WARRANTIES OF NON-INFRINGEMENT, MERCHANTABILITY AND FITNESS
 FOR A PARTICULAR PURPOSE, REGARDING THE APPLE SOFTWARE OR ITS USE AND
 OPERATION ALONE OR IN COMBINATION WITH YOUR PRODUCTS.
 
 IN NO EVENT SHALL APPLE BE LIABLE FOR ANY SPECIAL, INDIRECT, INCIDENTAL
 OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 INTERRUPTION) ARISING IN ANY WAY OUT OF THE USE, REPRODUCTION,
 MODIFICATION AND/OR DISTRIBUTION OF THE APPLE SOFTWARE, HOWEVER CAUSED
 AND WHETHER UNDER THEORY OF CONTRACT, TORT (INCLUDING NEGLIGENCE),
 STRICT LIABILITY OR OTHERWISE, EVEN IF APPLE HAS BEEN ADVISED OF THE
 POSSIBILITY OF SUCH DAMAGE.
 
 Copyright (C) 2014 Apple Inc. All Rights Reserved.
 
 */

#import "WebViewController.h"

@import Security;

@interface WebViewController () <UIWebViewDelegate>

// stuff for IB

@property (nonatomic, strong, readwrite) IBOutlet UIWebView *   webView;

// private properties

@property (nonatomic, strong, readwrite) NSURLSessionDataTask * installDataTask;

@end

@implementation WebViewController

- (void)dealloc
{
    // All of these should be nil because the connection retains its delegate (that is, us) 
    // until it completes, and we clean these up when the connection completes.
    
    assert(self->_installDataTask == nil);
}

/*! Called to log various bits of information.  Will be called on the main thread.
 *  \param format A standard NSString-style format string; will not be nil.
 */

- (void)logWithFormat:(NSString *)format, ... NS_FORMAT_FUNCTION(1, 2)
{
    id<WebViewControllerDelegate>   strongDelegate;

    assert(format != nil);
    
    strongDelegate = self.delegate;
    if ([strongDelegate respondsToSelector:@selector(webViewController:logWithFormat:arguments:)]) {
        va_list     arguments;
        
        va_start(arguments, format);
        [strongDelegate webViewController:self logWithFormat:format arguments:arguments];
        va_end(arguments);
    }
}

/*! The error domain used by our installation error codes.
 */

static NSString * WebViewControllerInstallErrorDomain = @"WebViewControllerInstallErrorDomain";

/*! Our installation error codes.  Note that (positive) HTTP status codes are also possible.
 */

enum WebViewControllerInstallErrorCode {
    // positive numbers are HTTP status codes
    WebViewControllerInstallErrorUnsupportedMIMEType   = -1, 
    WebViewControllerInstallErrorCertificateDataTooBig = -2,
    WebViewControllerInstallErrorCertificateDataBad    = -3, 
    WebViewControllerInstallErrorNowhereToInstall      = -4
};

/*! Returns an error object in the domain WebViewControllerInstallErrorDomain with 
 *  the specified error code
 *  \param code The code to use for the error.
 */

- (NSError *)constructInstallErrorWithCode:(NSInteger)code
{
    assert(code != 0);

    return [NSError errorWithDomain:WebViewControllerInstallErrorDomain code:code userInfo:nil];
}

/*! Create and installs a certificate from the data returned by the install data task.
 *  \param data The data returned by the install data task; must not be nil.
 *  \param errorPtr If not NULL then, on error, *errorPtr will be the actual error.
 *  \returns Returns YES on success, NO on failure.
 */

- (BOOL)parseAndInstallCertificateData:(NSData *)data error:(__autoreleasing NSError **)errorPtr
{
    NSError *           error;
    SecCertificateRef   anchor;

    assert(data != nil);
    // errorPtr may be NULL
    assert([NSThread isMainThread]);
    
    // Try to create a certificate from the data we downloaded.  If that 
    // succeeds, tell our delegate.
    
    error = nil;
    anchor = SecCertificateCreateWithData(NULL, (__bridge CFDataRef) data);
    if (anchor == nil) {
        error = [self constructInstallErrorWithCode:WebViewControllerInstallErrorCertificateDataBad];
    }
    if (error == nil) {
        id<WebViewControllerDelegate>   strongDelegate;
        
        strongDelegate = self.delegate;
        if ( ! [strongDelegate respondsToSelector:@selector(webViewController:addTrustedAnchor:error:)] ) {
            error = [self constructInstallErrorWithCode:WebViewControllerInstallErrorNowhereToInstall];
        } else {
            BOOL                            success;
            NSError *                       delegateError;

            success = [strongDelegate webViewController:self addTrustedAnchor:anchor error:&delegateError];
            if ( ! success ) {
                error = delegateError;
            }
        }
    }

    // Clean up.
    
    if (anchor != NULL) {
        CFRelease(anchor);
    }
    if ( (error != nil) && (errorPtr != NULL) ) {
        *errorPtr = error;
    }
    
    return (error == nil);
}

@end
