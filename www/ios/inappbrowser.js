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

(function() {
    // special patch to correctly work on Ripple emulator (CB-9760)
    if (window.parent && !!window.parent.ripple) { // https://gist.github.com/triceam/4658021
        module.exports = window.open.bind(window); // fallback to default window.open behaviour
        return;
    }

    var exec = require('cordova/exec');
    var channel = require('cordova/channel');
    var modulemapper = require('cordova/modulemapper');
    var urlutil = require('cordova/urlutil');

    var inAppBrowserInstance = null;
    var lastUrl = '';
    var lastWindowName = '';
    var lasrWindowFeatures = '';

    var InAppBrowser = function() {

        var me = this,
            lastPollIntervalToRestore = null,
            lastPollFunctionToRestore = null;

        function clearPolling () {
            lastPollIntervalToRestore = null;
            lastPollFunctionToRestore = null;
        }

        function clearRestoring(){
            clearPolling();
        }

        this.channels = {
            'loadstart': channel.create('loadstart'),
            'loadstop' : channel.create('loadstop'),
            'loaderror' : channel.create('loaderror'),
            'hidden' : channel.create('hidden'),
            'unhidden' : channel.create('unhidden'),
            'pollresult' : channel.create('pollresult'),
            'exit' : channel.create('exit')
        }

        this._eventHandler = function(event) {
            if (event && (event.type in this.channels)) {
                console.log(this.channels);
                this.channels[event.type].fire(event);
            }
        }

        this.close = function(eventname) {
           exec(null, null, "InAppBrowser", "close", []);
           this.stopPoll();
        }

        this.show = function(eventname) {
            exec(null, null, "InAppBrowser", "show", []);
        }

        this.startPoll = function(pollFunction, pollInterval){
           lastPollInterval = pollInterval;
           lastPollFunction = pollFunction;
           exec(null, null, "InAppBrowser", "startPoll", [pollFunction, pollInterval])
        }

        this.stopPoll = function() {
           clearPolling();
           exec(null, null, "InAppBrowser", "stopPoll", []);
        }

        this.hide = function(releaseResources){

            //TODO: suspend and re-establish exit
            //TODO: Polling
            //TODO: If release remove listeners
            console.log(this.channels);

            // Release resources has no effect in native iOS - the IAB 
            // Is fully closed & the JS pretends it isn't
            exec(null,null,"InAppBrowser", "hide", [releaseResources]);
        }

        this.unHide = function(strUrl, eventname){
            lastUrl = strUrl || lastUrl;

            //TODO: Polling


            var cb = function(eventname) {
               me._eventHandler(eventname);
            };
            exec(cb, cb, "InAppBrowser", "unHide", [lastUrl, lastWindowName, lasrWindowFeatures]);
        }

        this.addEventListener = function (eventname,f) {
            if (eventname in this.channels) {
                me.channels[eventname].subscribe(f);
            }
        }

        this.removeEventListener = function (eventname, f) {
            if (eventname in this.channels) {
                this.channels[eventname].unsubscribe(f);
            }
        }

        this.executeScript = function (injectDetails, cb) {
            if (injectDetails.code) {
                exec(cb, null, "InAppBrowser", "injectScriptCode", [injectDetails.code, !!cb]);
            } else if (injectDetails.file) {
                exec(cb, null, "InAppBrowser", "injectScriptFile", [injectDetails.file, !!cb]);
            } else {
                throw new Error('executeScript requires exactly one of code or file to be specified');
            }
        }

        this.insertCSS = function (injectDetails, cb) {
            if (injectDetails.code) {
                exec(cb, null, "InAppBrowser", "injectStyleCode", [injectDetails.code, !!cb]);
            } else if (injectDetails.file) {
                exec(cb, null, "InAppBrowser", "injectStyleFile", [injectDetails.file, !!cb]);
            } else {
                throw new Error('insertCSS requires exactly one of code or file to be specified');
            }
        }
    }

    module.exports = function(strUrl, strWindowName, strWindowFeatures, callbacks) {
        // Don't catch calls that write to existing frames (e.g. named iframes).
        if (window.frames && window.frames[strWindowName]) {
            var origOpenFunc = modulemapper.getOriginalSymbol(window, 'open');
            return origOpenFunc.apply(window, arguments);
        }

        strUrl = urlutil.makeAbsolute(strUrl);
        inAppBrowserInstance = new InAppBrowser();

        callbacks = callbacks || {};
        for (var callbackName in callbacks) {
            inAppBrowserInstance.addEventListener(callbackName, callbacks[callbackName]);
        }

        var cb = function(eventname) {
           inAppBrowserInstance._eventHandler(eventname);
        };

        strWindowFeatures = strWindowFeatures || "";

        lastUrl = strUrl;
        lastWindowName = strWindowName;
        lastWindowFeatures = strWindowFeatures;
        exec(cb, cb, "InAppBrowser", "open", [strUrl, strWindowName, strWindowFeatures]);
        return inAppBrowserInstance;
    };
})();
