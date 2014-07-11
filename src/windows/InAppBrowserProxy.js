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
    channel = require('cordova/channel');

var browserWrap,
    popup,
    cb;

var IAB = {
    close: function (win, lose) {
        if (browserWrap) {
            if (cb) cb({ type: "exit" });

            browserWrap.parentNode.removeChild(browserWrap);
            browserWrap = null;
            popup = null;
            cb = null;
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
        }
        else if (target === "_blank") {
            cb = win;
            if (!browserWrap) {
                browserWrap = document.createElement("div");
                browserWrap.style.position = "absolute";
                browserWrap.style.width = (window.innerWidth - 80) + "px";
                browserWrap.style.height = (window.innerHeight - 80) + "px";
                browserWrap.style.borderWidth = "40px";
                browserWrap.style.borderStyle = "solid";
                browserWrap.style.borderColor = "rgba(0,0,0,0.25)";

                browserWrap.onclick = function () {
                    setTimeout(function () {
                        IAB.close();
                    }, 0);
                };

                document.body.appendChild(browserWrap);
            }

            if (features.indexOf("hidden=yes") !== -1) {
                browserWrap.style.display = "none";
            }

            popup = document.createElement("x-ms-webview");
            popup.style.width = (window.innerWidth - 80) + "px";
            popup.style.height = (window.innerHeight - 80) + "px";
            popup.src = strUrl;

            popup.addEventListener("MSWebViewNavigationStarting", function (e) {
                win({ type: "loadstart", url: e.uri });
            });
            popup.addEventListener("MSWebViewNavigationCompleted", function (e) {
                if (e.isSuccess) {
                    win({ type: "loadstop", url: e.uri });
                }
                else {
                    win({ type: "loaderror", url: e.uri });
                }
            });
            popup.addEventListener("MSWebViewUnviewableContentIdentified", function (e) {
                win({ type: "loaderror", url: e.uri });
            });

            window.addEventListener("resize", function () {
                if (browserWrap && popup) {
                    browserWrap.style.width = (window.innerWidth - 80) + "px";
                    browserWrap.style.height = (window.innerHeight - 80) + "px";

                    popup.style.width = (window.innerWidth - 80) + "px";
                    popup.style.height = (window.innerHeight - 80) + "px";
                }
            });

            browserWrap.appendChild(popup);
        }
        else {
            window.location = strUrl;
        }
    },

    injectScriptCode: function (win, fail, args) {
        var code = args[0],
            hasCallback = args[1];

        if (browserWrap && popup) {
            var op = popup.invokeScriptAsync("eval", code);
            op.oncomplete = function () { hasCallback && win([]); };
            op.onerror = function () { };
            op.start();
        }
        // "(function(d) { var c = d.createElement('script'); c.src = %@; d.body.appendChild(c); })(document)"
    },
    injectScriptFile: function (win, fail, args) {
        var file = args[0],
            hasCallback = args[1];

        if (browserWrap && popup) {
            Windows.Storage.FileIO.readTextAsync(file).done(function (code) {
                var op = popup.invokeScriptAsync("eval", code);
                op.oncomplete = function () { hasCallback && win([]); };
                op.onerror = function () { };
                op.start();
            });
        }
    }
};

module.exports = IAB;


require("cordova/windows8/commandProxy").add("InAppBrowser", module.exports);
