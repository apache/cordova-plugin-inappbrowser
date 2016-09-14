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
    var lastWindowFeatures = '';


    var InAppBrowser = function() {
        var me = this,
            hidden = false,
            backChannels = {
                preventexitonhide : channel.create('preventexitonhide')
            }
            polling = false,
            lastPollIntervalToRestore = null,
            lastPollFunctionToRestore = null;

        function clearPolling () {
            lastPollIntervalToRestore = null;
            lastPollFunctionToRestore = null;
        }

        function clearRestoring(){
            clearPolling();
        }

        function preventExitListenerFireOnHide(){
            var exitHandlersToRestore = {},
                exitChannel = me.channels['exit'],
                exitRestoreCallBack = function(){
                    // This cleans up the current handler
                    if(exitRestoreCallBack.observer_guid){
                        me.removeEventListener('exit', exitChannel.handlers[exitRestoreCallBack.observer_guid]);
                    }

                    for(var exitCallbackObserverId in exitHandlersToRestore) {
                        var eventHandler = exitHandlersToRestore[exitCallbackObserverId];
                        me.addEventListener('exit', eventHandler);
                    }
                };

            if(exitChannel.numHandlers >0){
                for(var exitCallbackObserverId in exitChannel.handlers) {
                    var eventHandler = exitChannel.handlers[exitCallbackObserverId];
                    exitHandlersToRestore[exitCallbackObserverId] = exitChannel.handlers[exitCallbackObserverId];
                    me.removeEventListener('exit', eventHandler);
                }
                me.addEventListener('exit', exitRestoreCallBack);
            }
        }

        function releaseListeners(){
            for(var eventname in me.channels)
            {
                for(var listenerObserverId in me.channels[eventname].handlers)
                {
                    me.removeEventListener(eventname, me.channels[eventname].handlers[listenerObserverId]);
                }
            }
        }

        console.log(backChannels);

        backChannels['preventexitonhide'].subscribe(function(){
            console.log('******************BACK CHANNEL PREVENTION*****************************');
        });

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
            if (event && (event.type in backChannels)) {
                backChannels[event.type].fire(event);
            }
            if (event && (event.type in this.channels)) {
                this.channels[event.type].fire(event);
            }
        }

        this.isHidden = function(){
            return hidden;
        }

        this.isPolling = function(){
            return polling;
        }

        this.close = function(eventname) {
            exec(null, null, "InAppBrowser", "close", []);
            this.stopPoll();
            if(hidden){
                this.channels['exit'].fire();
            }
            hidden = false;
        }

        this.show = function(eventname) {
            exec(null, null, "InAppBrowser", "show", []);
            hidden = false;
        }

        this.startPoll = function(pollFunction, pollInterval){
           console.log('JS Start Polling');
           lastPollInterval = pollInterval;
           lastPollFunction = pollFunction;
           exec(null, null, "InAppBrowser", "startPoll", [pollFunction, pollInterval])
           polling = true;
        }

        this.stopPoll = function() {
           clearPolling();
           exec(null, null, "InAppBrowser", "stopPoll", []);
           polling = true;
        }

        this.hide = function(releaseResources, blankPage){
            //blankPage has no effect in iOS - the view is destroyed
            if(hidden){
                return;
            }

            if(releaseResources){
                me.stopPoll();
                releaseListeners();
            } else {
                //TODO: Polling
                preventExitListenerFireOnHide();
            }

            // Release resources has no effect in native iOS - the IAB 
            // Is fully closed & the JS pretends it isn't
            exec(null,null,"InAppBrowser", "hide", [releaseResources]);
            hidden = true;
        }

        this.unHide = function(strUrl, eventname){
            if(!hidden){
                return;
            }
            lastUrl = strUrl || lastUrl;

            //TODO: Polling
            var cb = function(eventname) {
               me._eventHandler(eventname);
            };
            exec(cb, cb, "InAppBrowser", "unHide", [lastUrl, lastWindowName, lastWindowFeatures]);
            hidden = false;
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
