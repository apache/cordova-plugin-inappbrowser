---
license: Licensed to the Apache Software Foundation (ASF) under one
         or more contributor license agreements.  See the NOTICE file
         distributed with this work for additional information
         regarding copyright ownership.  The ASF licenses this file
         to you under the Apache License, Version 2.0 (the
         "License"); you may not use this file except in compliance
         with the License.  You may obtain a copy of the License at

           http://www.apache.org/licenses/LICENSE-2.0

         Unless required by applicable law or agreed to in writing,
         software distributed under the License is distributed on an
         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
         KIND, either express or implied.  See the License for the
         specific language governing permissions and limitations
         under the License.
---

window.open
===========

Opens a URL in a new `InAppBrowser` instance, the current browser
instance, or the system browser.

    var ref = window.open(url, target, options);

- __ref__: Reference to the `InAppBrowser` window. _(InAppBrowser)_
- __url__: The URL to load _(String)_. Call `encodeURI()` on this if the URL contains Unicode characters.
- __target__: The target in which to load the URL, an optional parameter that defaults to `_self`. _(String)_

    - `_self`: Opens in the Cordova WebView if the URL is in the white list, otherwise it opens in the `InAppBrowser`.
    - `_blank`: Opens in the `InAppBrowser`.
    - `_system`: Opens in the system's web browser.

- __options__: Options for the `InAppBrowser`. Optional, defaulting to: `location=yes`. _(String)_

    The `options` string must not contain any blank space, and each feature's name/value pairs must be separated by a comma. Feature names are case insensitive. All platforms support the value below:

    - __location__: Set to `yes` or `no` to turn the `InAppBrowser`'s location bar on or off.
    
    Android only
    ------------
    - __closebuttoncaption__ - set to a string that will be the caption for the "Done" button.

    iOS only
    --------
    - __closebuttoncaption__ - set to a string that will be the caption for the "Done" button. Note that you will have to localize this value yourself.
    - __toolbar__ -  set to 'yes' or 'no' to turn the toolbar on or off for the InAppBrowser (defaults to 'yes')
    - __enableViewportScale__:  Set to `yes` or `no` to prevent viewport scaling through a meta tag (defaults to `no`).
    - __mediaPlaybackRequiresUserAction__: Set to `yes` or `no` to prevent HTML5 audio or video from autoplaying (defaults to `no`).
    - __allowInlineMediaPlayback__: Set to `yes` or `no` to allow inline HTML5 media playback, displaying within the browser window rather than a device-specific playback interface. The HTML's `video` element must also include the `webkit-playsinline` attribute (defaults to `no`)
    - __keyboardDisplayRequiresUserAction__: Set to `yes` or `no` to open the keyboard when form elements receive focus via JavaScript's `focus()` call (defaults to `yes`).
    - __suppressesIncrementalRendering__: Set to `yes` or `no` to wait until all new view content is received before being rendered (defaults to `no`).
    - __presentationstyle__:  Set to `pagesheet`, `formsheet` or `fullscreen` to set the [presentation style](http://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalPresentationStyle) (defaults to `fullscreen`).
    - __transitionstyle__: Set to `fliphorizontal`, `crossdissolve` or `coververtical` to set the [transition style](http://developer.apple.com/library/ios/#documentation/UIKit/Reference/UIViewController_Class/Reference/Reference.html#//apple_ref/occ/instp/UIViewController/modalTransitionStyle) (defaults to `coververtical`).

Supported Platforms
-------------------

- Android
- iOS
- BlackBerry 10
- Windows Phone 7 + 8

Quick Example
-------------

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    var ref2 = window.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');

Full Example
------------

    <!DOCTYPE html>
    <html>
      <head>
        <title>window.open Example</title>

        <script type="text/javascript" charset="utf-8" src="cordova-x.x.x.js"></script>
        <script type="text/javascript" charset="utf-8">

        // Wait for device API libraries to load
        //
        document.addEventListener("deviceready", onDeviceReady, false);

        // device APIs are available
        //
        function onDeviceReady() {
            // external url
            var ref = window.open(encodeURI('http://apache.org'), '_blank', 'location=yes');
            // relative document
            ref = window.open('next.html', '_self');
        }

        </script>
      </head>
      <body>
      </body>
    </html>
