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

    var InAppBrowser = function() {

        var eventHandlers = {},
            lastPollInterval = null,
            lastPollFunction = null,
            clearPolling = function {
                polling.pollInterval = null;
                polling.pollFunction = null;
            },
            clear = function(){
                this.clearPolling();
                unhideState.eventHandlers = {};
            };

        this.channels = {
            'loadstart': channel.create('loadstart'),
            'loadstop' : channel.create('loadstop'),
            'loaderror' : channel.create('loaderror'),
            'hidden' : channel.create('hidden'),
            'unhidden' : channel.create('unhidden'),
            'pollresult' : channel.create('pollresult'),
            'exit' : channel.create('exit')
        }

        this._eventHandler = function (event) {
            if (event && (event.type in this.channels)) {
               this.channels[event.type].fire(event);
            }
        }

        this.close = function (eventname) {
           clear();
           exec(null, null, "InAppBrowser", "close", []);
        }

        this.show = function (eventname) {
            exec(null, null, "InAppBrowser", "show", []);
        }

        this.startPoll(pollFunction, pollInterval){
           lastPollInterval = pollInterval;
           lastPollFunction = pollFunction;
           exec(null, null, "InAppBrowser", "startPoll", [pollFunction, pollInterval])
        }

        this.stopPoll(){
           clearPolling();
           exec(null, null, "InAppBrowser", "stopPoll", [])
        }

        this.hide = function(releaseResources, eventname){
            //TODO: intercept exit
            //TODO: hide.
            // if(boolGoToBlank){
            //     unhideState.clear();
            // }
            exec(null,null,"InAppBrowser", "hide", [boolGoToBlank]);
        }

        this.unHide = function(strUrl, eventname){
            console.log('+++++++++++++++++++++++++++++++++++++++++');
            console.log('TODO!!!!');
            console.log('+++++++++++++++++++++++++++++++++++++++++');
            //exec(null,null,"InAppBrowser", "unHide", [strUrl]);
        }

        this.addEventListener = function (eventname,f) {
            if (eventname in this.channels) {
                this.channels[eventname].subscribe(f);
                console.log(f);
                console.log('TODO: Add Event Handler');
            }
        }

        this.removeEventListener = function(eventname, f) {
            if (eventname in this.channels) {
                this.channels[eventname].unsubscribe(f);
                console.log('TODO: Add Remove Handler');

            }
        }

        this.executeScript = function(injectDetails, cb) {
            if (injectDetails.code) {
                exec(cb, null, "InAppBrowser", "injectScriptCode", [injectDetails.code, !!cb]);
            } else if (injectDetails.file) {
                exec(cb, null, "InAppBrowser", "injectScriptFile", [injectDetails.file, !!cb]);
            } else {
                throw new Error('executeScript requires exactly one of code or file to be specified');
            }
        }

        this.insertCSS = function(injectDetails, cb) {
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
        var iab = new InAppBrowser();

        callbacks = callbacks || {};
        for (var callbackName in callbacks) {
            iab.addEventListener(callbackName, callbacks[callbackName]);
        }

        var cb = function(eventname) {
           iab._eventHandler(eventname);
        };

        strWindowFeatures = strWindowFeatures || "";

        exec(cb, cb, "InAppBrowser", "open", [strUrl, strWindowName, strWindowFeatures]);
        return iab;
    };
})();
