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

var exec = require('cordova/exec');
var channel = require('cordova/channel');
var modulemapper = require('cordova/modulemapper');
var urlutil = require('cordova/urlutil');

function ThemeableBrowser() {
   this.channels = {};
}

ThemeableBrowser.prototype = {
    _eventHandler: function (event) {
        if (event && (event.type in this.channels)) {
            this.channels[event.type].fire(event);
        }
    },
    close: function (eventname) {
        exec(null, null, 'ThemeableBrowser', 'close', []);
        return this;
    },
    show: function (eventname) {
        exec(null, null, 'ThemeableBrowser', 'show', []);
        return this;
    },
    reload: function (eventname) {
        exec(null, null, 'ThemeableBrowser', 'reload', []);
        return this;
    },
    addEventListener: function (eventname,f) {
        if (!(eventname in this.channels)) {
            this.channels[eventname] = channel.create(eventname);
        }
        this.channels[eventname].subscribe(f);
        return this;
    },
    removeEventListener: function(eventname, f) {
        if (eventname in this.channels) {
            this.channels[eventname].unsubscribe(f);
        }
        return this;
    },

    executeScript: function(injectDetails, cb) {
        if (injectDetails.code) {
            exec(cb, null, 'ThemeableBrowser', 'injectScriptCode', [injectDetails.code, !!cb]);
        } else if (injectDetails.file) {
            exec(cb, null, 'ThemeableBrowser', 'injectScriptFile', [injectDetails.file, !!cb]);
        } else {
            throw new Error('executeScript requires exactly one of code or file to be specified');
        }
        return this;
    },

    insertCSS: function(injectDetails, cb) {
        if (injectDetails.code) {
            exec(cb, null, 'ThemeableBrowser', 'injectStyleCode', [injectDetails.code, !!cb]);
        } else if (injectDetails.file) {
            exec(cb, null, 'ThemeableBrowser', 'injectStyleFile', [injectDetails.file, !!cb]);
        } else {
            throw new Error('insertCSS requires exactly one of code or file to be specified');
        }
        return this;
    }
};

exports.open = function(strUrl, strWindowName, strWindowFeatures, callbacks) {
    // Don't catch calls that write to existing frames (e.g. named iframes).
    if (window.frames && window.frames[strWindowName]) {
        var origOpenFunc = modulemapper.getOriginalSymbol(window, 'open');
        return origOpenFunc.apply(window, arguments);
    }

    strUrl = urlutil.makeAbsolute(strUrl);
    var iab = new ThemeableBrowser();

    callbacks = callbacks || {};
    for (var callbackName in callbacks) {
        iab.addEventListener(callbackName, callbacks[callbackName]);
    }

    var cb = function(eventname) {
       iab._eventHandler(eventname);
    };

    strWindowFeatures = strWindowFeatures && JSON.stringify(strWindowFeatures);
    // Slightly delay the actual native call to give the user a chance to
    // register event listeners first, otherwise some warnings or errors may be missed.
    setTimeout(function() {
        exec(cb, cb, 'ThemeableBrowser', 'open', [strUrl, strWindowName, strWindowFeatures || '']);
    }, 0);
    return iab;
};

exports.EVT_ERR = 'ThemeableBrowserError';
exports.EVT_WRN = 'ThemeableBrowserWarning';
exports.ERR_CRITICAL = 'critical';
exports.ERR_LOADFAIL = 'loadfail';
exports.WRN_UNEXPECTED = 'unexpected';
exports.WRN_UNDEFINED = 'undefined';