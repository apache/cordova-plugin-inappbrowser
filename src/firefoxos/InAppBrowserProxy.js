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

// https://developer.mozilla.org/en-US/docs/WebAPI/Browser

var cordova = require('cordova'),
    channel = require('cordova/channel'),
    modulemapper = require('cordova/modulemapper');

var origOpenFunc = modulemapper.getOriginalSymbol(window, 'window.open');
var browserWrap;

var IABExecs = {

    close: function (win, lose) {
        if (browserWrap) {
            browserWrap.parentNode.removeChild(browserWrap);
            browserWrap = null;
        }
    },

    /*
     * Reveal browser if opened hidden
     */
    show: function (win, lose) {
        console.error('[FirefoxOS] show not implemented');
    },

    open: function (win, lose, args) {
        var strUrl = args[0],
            target = args[1],
            features = args[2],
            url,
            elem;

        if (target === '_system') {
            origOpenFunc.apply(window, [strUrl, '_blank']);
        } else if (target === '_blank') {
            var browserElem = document.createElement('iframe');
            browserElem.setAttribute('mozbrowser', true);
            // make this loaded in its own child process
            browserElem.setAttribute('remote', true);
            browserElem.setAttribute('src', strUrl);
            if (browserWrap) {
                document.body.removeChild(browserWrap);
            }
            browserWrap = document.createElement('div');
            browserWrap.style.position = 'absolute';
            browserWrap.style.backgroundColor = 'rgba(0,0,0,0.75)';
            browserWrap.style.color = 'rgba(235,235,235,1.0)';
            browserWrap.style.width = window.innerWidth + 'px';
            browserWrap.style.height = window.innerHeight + 'px';
            browserWrap.style.padding = '10px,0,0,0';
            browserElem.style.position = 'absolute';
            browserElem.style.top = '60px';
            browserElem.style.left = '0px';
            browserElem.style.height = (window.innerHeight - 60) + 'px';
            browserElem.style.width = browserWrap.style.width;

            browserWrap.addEventListener('click', function () {
                setTimeout(function () {
                    IABExecs.close();
                }, 0);
            }, false);
            var p = document.createElement('p');
            p.appendChild(document.createTextNode('close'));
            // TODO: make all buttons - ← → ×
            p.style.paddingTop = '10px';
            p.style.textAlign = 'center';
            browserWrap.appendChild(p);
            browserWrap.appendChild(browserElem);
            document.body.appendChild(browserWrap);
            // assign browser element to browserWrap for future
            // reference
            browserWrap.browser = browserElem;
        } else {
            window.location = strUrl;
        }
    },
    injectScriptCode: function (code, bCB) {
        console.error('[FirefoxOS] injectScriptCode not implemented');
    },
    injectScriptFile: function (file, bCB) {
        console.error('[FirefoxOS] injectScriptFile not implemented');
    }
};

module.exports = IABExecs;

require('cordova/firefoxos/commandProxy').add('InAppBrowser', module.exports);
