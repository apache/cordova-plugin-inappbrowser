/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/*jslint sloppy:true */
/*global Windows:true, require, document, setTimeout, window, module */



var cordova = require('cordova'),
    channel = require('cordova/channel'),
    urlutil = require('cordova/urlutil');

var browserWrap,
    popup,
    navigationButtonsDiv,
    navigationButtonsDivInner,
    backButton,
    forwardButton,
    closeButton,
    bodyOverflowStyle;

// x-ms-webview is available starting from Windows 8.1 (platformId is 'windows')
// http://msdn.microsoft.com/en-us/library/windows/apps/dn301831.aspx
var isWebViewAvailable = cordova.platformId == 'windows';

function attachNavigationEvents(element, callback) {
    if (isWebViewAvailable) {
        element.addEventListener("MSWebViewNavigationStarting", function (e) {
            callback({ type: "loadstart", url: e.uri}, {keepCallback: true} );
        });

        element.addEventListener("MSWebViewNavigationCompleted", function (e) {
            callback({ type: e.isSuccess ? "loadstop" : "loaderror", url: e.uri}, {keepCallback: true});
        });

        element.addEventListener("MSWebViewUnviewableContentIdentified", function (e) {
            // WebView found the content to be not HTML.
            // http://msdn.microsoft.com/en-us/library/windows/apps/dn609716.aspx
            callback({ type: "loaderror", url: e.uri}, {keepCallback: true});
        });

        element.addEventListener("MSWebViewContentLoading", function (e) {
            if (navigationButtonsDiv) {
                backButton.disabled = !popup.canGoBack;
                forwardButton.disabled = !popup.canGoForward;
            }
        });
    } else {
        var onError = function () {
            callback({ type: "loaderror", url: this.contentWindow.location}, {keepCallback: true});
        };

        element.addEventListener("unload", function () {
            callback({ type: "loadstart", url: this.contentWindow.location}, {keepCallback: true});
        });

        element.addEventListener("load", function () {
            callback({ type: "loadstop", url: this.contentWindow.location}, {keepCallback: true});
        });

        element.addEventListener("error", onError);
        element.addEventListener("abort", onError);
    }
}

var IAB = {
    close: function (win, lose) {
        if (browserWrap) {
            if (win) win({ type: "exit" });

            browserWrap.parentNode.removeChild(browserWrap);
            // Reset body overflow style to initial value
            document.body.style.msOverflowStyle = bodyOverflowStyle;
            browserWrap = null;
            popup = null;
        }
    },
    show: function (win, lose) {
        if (browserWrap) {
            browserWrap.style.display = "block";
        }
    },
    open: function (win, lose, args) {
        var strUrl = args[0],
            target = args[1],
            features = args[2],
            url;

        if (target === "_system") {
            url = new Windows.Foundation.Uri(strUrl);
            Windows.System.Launcher.launchUriAsync(url);
        } else if (target === "_self" || !target) {
            window.location = strUrl;
        } else {
            // "_blank" or anything else
            if (!browserWrap) {
                var browserWrapStyle = document.createElement('link');
                browserWrapStyle.rel = "stylesheet";
                browserWrapStyle.type = "text/css";
                browserWrapStyle.href = urlutil.makeAbsolute("/www/css/inappbrowser.css");

                document.head.appendChild(browserWrapStyle);

                browserWrap = document.createElement("div");
                browserWrap.className = "inAppBrowserWrap";

                if (features.indexOf("fullscreen=yes") > -1) {
                    browserWrap.classList.add("inAppBrowserWrapFullscreen");
                }

                // Save body overflow style to be able to reset it back later
                bodyOverflowStyle = document.body.style.msOverflowStyle;

                browserWrap.onclick = function () {
                    setTimeout(function () {
                        IAB.close(win);
                    }, 0);
                };

                document.body.appendChild(browserWrap);
                // Hide scrollbars for the whole body while inappbrowser's window is open
                document.body.style.msOverflowStyle = "none";
            }

            if (features.indexOf("hidden=yes") !== -1) {
                browserWrap.style.display = "none";
            }

            popup = document.createElement(isWebViewAvailable ? "x-ms-webview" : "iframe");
            if (popup instanceof HTMLIFrameElement) {
                // For iframe we need to override bacground color of parent element here
                // otherwise pages without background color set will have transparent background
                popup.style.backgroundColor = "white";
            }
            popup.style.borderWidth = "0px";
            popup.style.width = "100%";

            browserWrap.appendChild(popup);

            if (features.indexOf("location=yes") !== -1 || features.indexOf("location") === -1) {
                popup.style.height = "calc(100% - 60px)";

                navigationButtonsDiv = document.createElement("div");
                navigationButtonsDiv.style.height = "60px";
                navigationButtonsDiv.style.backgroundColor = "#404040";
                navigationButtonsDiv.style.zIndex = "999";
                navigationButtonsDiv.onclick = function (e) {
                    e.cancelBubble = true;
                };

                navigationButtonsDivInner = document.createElement("div");
                navigationButtonsDivInner.style.paddingTop = "10px";
                navigationButtonsDivInner.style.height = "50px";
                navigationButtonsDivInner.style.width = "160px";
                navigationButtonsDivInner.style.margin = "0 auto";
                navigationButtonsDivInner.style.backgroundColor = "#404040";
                navigationButtonsDivInner.style.zIndex = "999";
                navigationButtonsDivInner.onclick = function (e) {
                    e.cancelBubble = true;
                };


                backButton = document.createElement("button");
                backButton.style.width = "40px";
                backButton.style.height = "40px";
                backButton.style.borderRadius = "40px";

                backButton.innerText = "<-";
                backButton.addEventListener("click", function (e) {
                    if (popup.canGoBack)
                        popup.goBack();
                });

                forwardButton = document.createElement("button");
                forwardButton.style.marginLeft = "20px";
                forwardButton.style.width = "40px";
                forwardButton.style.height = "40px";
                forwardButton.style.borderRadius = "40px";

                forwardButton.innerText = "->";
                forwardButton.addEventListener("click", function (e) {
                    if (popup.canGoForward)
                        popup.goForward();
                });

                closeButton = document.createElement("button");
                closeButton.style.marginLeft = "20px";
                closeButton.style.width = "40px";
                closeButton.style.height = "40px";
                closeButton.style.borderRadius = "40px";

                closeButton.innerText = "x";
                closeButton.addEventListener("click", function (e) {
                    setTimeout(function () {
                        IAB.close(win);
                    }, 0);
                });

                if (!isWebViewAvailable) {
                    // iframe navigation is not yet supported
                    backButton.disabled = true;
                    forwardButton.disabled = true;
                }

                navigationButtonsDivInner.appendChild(backButton);
                navigationButtonsDivInner.appendChild(forwardButton);
                navigationButtonsDivInner.appendChild(closeButton);
                navigationButtonsDiv.appendChild(navigationButtonsDivInner);

                browserWrap.appendChild(navigationButtonsDiv);
            } else {
                popup.style.height = "100%";
            }

            // start listening for navigation events
            attachNavigationEvents(popup, win);

            if (isWebViewAvailable) {
                strUrl = strUrl.replace("ms-appx://", "ms-appx-web://");
            }
            popup.src = strUrl;
        }
    },

    injectScriptCode: function (win, fail, args) {
        var code = args[0],
            hasCallback = args[1];

        if (isWebViewAvailable && browserWrap && popup) {
            var op = popup.invokeScriptAsync("eval", code);
            op.oncomplete = function (e) {
                // return null if event target is unavailable by some reason
                var result = (e && e.target) ? [e.target.result] : [null];
                hasCallback && win(result);
            };
            op.onerror = function () { };
            op.start();
        }
    },

    injectScriptFile: function (win, fail, args) {
        var filePath = args[0],
            hasCallback = args[1];

        if (!!filePath) {
            filePath = urlutil.makeAbsolute(filePath);
        }

        if (isWebViewAvailable && browserWrap && popup) {
            var uri = new Windows.Foundation.Uri(filePath);
            Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).done(function (file) {
                Windows.Storage.FileIO.readTextAsync(file).done(function (code) {
                    var op = popup.invokeScriptAsync("eval", code);
                    op.oncomplete = function(e) {
                        var result = [e.target.result];
                        hasCallback && win(result);
                    };
                    op.onerror = function () { };
                    op.start();
                });
            });
        }
    },

    injectStyleCode: function (win, fail, args) {
        var code = args[0],
            hasCallback = args[1];

        if (isWebViewAvailable && browserWrap && popup) {
            injectCSS(popup, code, hasCallback && win);
        }
    },

    injectStyleFile: function (win, fail, args) {
        var filePath = args[0],
            hasCallback = args[1];

        filePath = filePath && urlutil.makeAbsolute(filePath);

        if (isWebViewAvailable && browserWrap && popup) {
            var uri = new Windows.Foundation.Uri(filePath);
            Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).then(function (file) {
                return Windows.Storage.FileIO.readTextAsync(file);
            }).done(function (code) {
                injectCSS(popup, code, hasCallback && win);
            }, function () {
                // no-op, just catch an error
            });
        }
    }
};

function injectCSS (webView, cssCode, callback) {
    // This will automatically escape all thing that we need (quotes, slashes, etc.)
    var escapedCode = JSON.stringify(cssCode);
    var evalWrapper = "(function(d){var c=d.createElement('style');c.innerHTML=%s;d.head.appendChild(c);})(document)"
        .replace('%s', escapedCode);

    var op = webView.invokeScriptAsync("eval", evalWrapper);
    op.oncomplete = function() {
        callback && callback([]);
    };
    op.onerror = function () { };
    op.start();
}

module.exports = IAB;

require("cordova/exec/proxy").add("InAppBrowser", module.exports);
