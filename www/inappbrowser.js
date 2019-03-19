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

(function () {
    // special patch to correctly work on Ripple emulator (CB-9760)
    if (window.parent && !!window.parent.ripple) { // https://gist.github.com/triceam/4658021
        module.exports = window.open.bind(window); // fallback to default window.open behaviour
        return;
    }

    var exec = require('cordova/exec');
    var channel = require('cordova/channel');
    var modulemapper = require('cordova/modulemapper');
    var urlutil = require('cordova/urlutil');

    function InAppBrowser () {
        this.channels = {};
    }

    InAppBrowser.prototype = {
        _eventHandler: function (event) {
            alert(event.type);
            if (event && (event.type in this.channels)) {
                this.channels[event.type].fire(event);
            }
        },
        _loadAfterBeforeload: function (strUrl) {
            strUrl = urlutil.makeAbsolute(strUrl);
            exec(null, null, 'InAppBrowser', 'loadAfterBeforeload', [strUrl]);
        },
        close: function (eventname) {
            exec(null, null, 'InAppBrowser', 'close', []);
            return this;
        },
        show: function (eventname) {
            exec(null, null, 'InAppBrowser', 'show', []);
            return this;
        },
        hide: function (eventname) {
            exec(null, null, 'InAppBrowser', 'hide', []);
            return this;
        },
        reload: function (eventname) {
            exec(null, null, 'InAppBrowser', 'reload', []);
            return this;
        },
        addEventListener: function (eventname, f) {
            if (!(eventname in this.channels)) {
                this.channels[eventname] = channel.create(eventname);
            }
            this.channels[eventname].subscribe(f);
            return this;
        },
        removeEventListener: function (eventname, f) {
            if (eventname in this.channels) {
                this.channels[eventname].unsubscribe(f);
            }
            return this;
        },

        executeScript: function (injectDetails, cb) {
            if (injectDetails.code) {
                exec(cb, null, 'InAppBrowser', 'injectScriptCode', [injectDetails.code, !!cb]);
            } else if (injectDetails.file) {
                exec(cb, null, 'InAppBrowser', 'injectScriptFile', [injectDetails.file, !!cb]);
            } else {
                throw new Error('executeScript requires exactly one of code or file to be specified');
            }
            return this;
        },

        insertCSS: function (injectDetails, cb) {
            if (injectDetails.code) {
                exec(cb, null, 'InAppBrowser', 'injectStyleCode', [injectDetails.code, !!cb]);
            } else if (injectDetails.file) {
                exec(cb, null, 'InAppBrowser', 'injectStyleFile', [injectDetails.file, !!cb]);
            } else {
                throw new Error('insertCSS requires exactly one of code or file to be specified');
            }
            return this;
        }
    };

    exports.open = function (strUrl, strWindowName, strWindowFeatures, callbacks) {
        alert('open');
        // Don't catch calls that write to existing frames (e.g. named iframes).
        if (window.frames && window.frames[strWindowName]) {
            var origOpenFunc = modulemapper.getOriginalSymbol(window, 'open');
            return origOpenFunc.apply(window, arguments);
        }

        strUrl = urlutil.makeAbsolute(strUrl);
        var iab = new InAppBrowser();

        callbacks = callbacks || {};
        for (var callbackName in callbacks) {
            iab.addEventListener(callbackName, callbacks[callbackName]);
        }

        var cb = function (eventname) {
            iab._eventHandler(eventname);
        };

        strWindowFeatures = strWindowFeatures && JSON.stringify(strWindowFeatures);
        // Slightly delay the actual native call to give the user a chance to
        // register event listeners first, otherwise some warnings or errors may be missed.
        setTimeout(function() {
            exec(cb, cb, 'InAppBrowser', 'open', [strUrl, strWindowName, strWindowFeatures || '']);
        }, 0);
        return iab;
    };
})();
