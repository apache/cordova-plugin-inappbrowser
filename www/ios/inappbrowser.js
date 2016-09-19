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

    var InAppBrowser = function(url, windowName, windowFeatures, callbacks) {
        var me = this,
            hidden = false,
            backChannels = {
                preventexitonhide : channel.create('preventexitonhide')
            }
            polling = false,
            lastUrl = url,
            lastWindowName = windowName,
            lastWindowFeatures = windowFeatures
            lastPollIntervalToRestore = null,
            lastPollFunctionToRestore = null;

        function clearPolling () {
            lastPollIntervalToRestore = null;
            lastPollFunctionToRestore = null;
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

        function eventCallback (event) {
            if (event && (event.type in backChannels)) {
                backChannels[event.type].fire(event);
            }
            if (event && (event.type in me.channels)) {
                me.channels[event.type].fire(event);
            }
        }

        backChannels['preventexitonhide'].subscribe(function(){
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

                // Need to set this here as it is possible to hide via native code "directly" by calling hide via the
                // command infrastructure and not the hide method
                hidden = true;
                if(exitChannel.numHandlers >0){
                    for(var exitCallbackObserverId in exitChannel.handlers) {
                        var eventHandler = exitChannel.handlers[exitCallbackObserverId];
                        exitHandlersToRestore[exitCallbackObserverId] = exitChannel.handlers[exitCallbackObserverId];
                        me.removeEventListener('exit', eventHandler);
                    }
                    me.addEventListener('exit', exitRestoreCallBack);
                }
        });

        me.channels = {
            'loadstart': channel.create('loadstart'),
            'loadstop' : channel.create('loadstop'),
            'loaderror' : channel.create('loaderror'),
            'hidden' : channel.create('hidden'),
            'unhidden' : channel.create('unhidden'),
            'pollresult' : channel.create('pollresult'),
            'exit' : channel.create('exit')
        }



        me.isHidden = function(){
            return hidden;
        }

        me.isPolling = function(){
            return polling;
        }

        me.close = function(eventname) {
            exec(null, null, "InAppBrowser", "close", []);
            me.stopPoll();
            if(hidden){
                me.channels['exit'].fire();
            }
            hidden = false;
        }

        me.show = function(eventname) {
            exec(null, null, "InAppBrowser", "show", []);
            hidden = false;
        }

        me.hide = function(releaseResources, blankPage){
            
            if(releaseResources){
                me.stopPoll();
                releaseListeners();
            }

            // Release resources has no effect in native iOS - the IAB 
            // Is fully closed & the JS pretends it isn't
            exec(null,null,"InAppBrowser", "hide", [releaseResources]);
            hidden = true;
        }

        me.unHide = function(strUrl, eventname){

            if(strUrl){
                lastUrl = urlutil.makeAbsolute(strUrl) || lastUrl || 'about:blank';
            }

            me.startPoll(lastPollFunctionToRestore, lastPollIntervalToRestore);
            exec(eventCallback, eventCallback, "InAppBrowser", "unHide", [lastUrl, lastWindowName, lastWindowFeatures]);
            hidden = false;
        }

        me.startPoll = function(pollFunction, pollInterval){
            if(pollFunction && pollInterval){
               lastPollIntervalToRestore = pollInterval;
               lastPollFunctionToRestore = pollFunction;
               exec(null, null, "InAppBrowser", "startPoll", [pollFunction, pollInterval])
               polling = true;
            }
        }

        me.stopPoll = function() {
           exec(null, null, "InAppBrowser", "stopPoll", []);
           clearPolling();
           polling = false;
        }

        me.addEventListener = function (eventname,f) {
            if (eventname in me.channels) {
                me.channels[eventname].subscribe(f);
            }
        }

        me.removeEventListener = function (eventname, f) {
            if (eventname in me.channels) {
                me.channels[eventname].unsubscribe(f);
            }
        }

        me.executeScript = function (injectDetails, cb) {
            if (injectDetails.code) {
                exec(cb, null, "InAppBrowser", "injectScriptCode", [injectDetails.code, !!cb]);
            } else if (injectDetails.file) {
                exec(cb, null, "InAppBrowser", "injectScriptFile", [injectDetails.file, !!cb]);
            } else {
                throw new Error('executeScript requires exactly one of code or file to be specified');
            }
        }

        me.insertCSS = function (injectDetails, cb) {
            if (injectDetails.code) {
                exec(cb, null, "InAppBrowser", "injectStyleCode", [injectDetails.code, !!cb]);
            } else if (injectDetails.file) {
                exec(cb, null, "InAppBrowser", "injectStyleFile", [injectDetails.file, !!cb]);
            } else {
                throw new Error('insertCSS requires exactly one of code or file to be specified');
            }
        }

        for (var callbackName in callbacks) {
            me.addEventListener(callbackName, callbacks[callbackName]);
        }

        exec(eventCallback, eventCallback, "InAppBrowser", "open", [lastUrl, lastWindowName, lastWindowFeatures]);
    }

    module.exports = function(strUrl, strWindowName, strWindowFeatures, callbacks) {
        // Don't catch calls that write to existing frames (e.g. named iframes).
        if (window.frames && window.frames[strWindowName]) {
            var origOpenFunc = modulemapper.getOriginalSymbol(window, 'open');
            return origOpenFunc.apply(window, arguments);
        }

        strUrl = urlutil.makeAbsolute(strUrl);
        strWindowFeatures = strWindowFeatures || "";

        if(strWindowName === '_system') {
            // This is now separate as more-or-less fire and forget system browser was re-utilising 
            // Code for blank/self. This caused problems with browser crashes etc.
            exec(null, null, "SystemBrowser", "open", [strUrl, strWindowName, strWindowFeatures]);
        } else {
            return new InAppBrowser(strUrl, strWindowName, strWindowFeatures, callbacks || {});
        }
    };
})();
