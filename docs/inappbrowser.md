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

InAppBrowser
============

> The InAppBrowser is a web-browser that is shown in your app when you use the `window.open` call.

    var ref = window.open('http://apache.org', '_blank', 'location=yes');

Description
-----------

The object returned from a call to `window.open`.

Methods
----------

- addEventListener
- removeEventListener
- close

Permissions
-----------

### Android

#### app/res/xml/config.xml

    <plugin name="InAppBrowser" value="org.apache.cordova.InAppBrowser" />

### iOS

#### config.xml

    <plugin name="InAppBrowser" value="CDVInAppBrowser" />


### Windows Phone 7 + 8

#### config.xml

    <plugin name="InAppBrowser" />



addEventListener
================

> Adds a listener for an event from the InAppBrowser.

    ref.addEventListener(eventname, callback);

- __ref:__ reference to the InAppBrowser window (`InAppBrowser`)
- __eventname:__ the event to listen for (`String`)

        loadstart - event fired when the InAppBrowser starts to load a URL
        loadstop - event fired when the InAppBrowser finished loading a URL
        loaderror - event fired when the InAppBrowser encounters an error loading a URL
        exit - event fired when the InAppBrowser window is closed

- __callback:__ the function that is called when the event is fired.
The function is passed an `InAppBrowserEvent` object.

Supported Platforms
-------------------

- Android
- iOS
- Windows Phone 7 + 8

Quick Example
-------------

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function() { alert(event.url); });

Full Example
------------

    <!DOCTYPE html>
    <html>
      <head>
        <title>InAppBrowser.addEventListener Example</title>

        <script type="text/javascript" charset="utf-8" src="cordova-x.x.x.js"></script>
        <script type="text/javascript" charset="utf-8">

        // Wait for Cordova to load
        //
        document.addEventListener("deviceready", onDeviceReady, false);

        // Cordova is ready
        //
        function onDeviceReady() {
             var ref = window.open('http://apache.org', '_blank', 'location=yes');
             ref.addEventListener('loadstart', function(event) { alert('start: ' + event.url); });
             ref.addEventListener('loadstop', function(event) { alert('stop: ' + event.url); });
             ref.addEventListener('loaderror', function(event) { alert('error: ' + event.message); });
             ref.addEventListener('exit', function(event) { alert(event.type); });
        }

        </script>
      </head>
      <body>
      </body>
    </html>

removeEventListener
===================

> Removes a listener for an event from the InAppBrowser.

    ref.removeEventListener(eventname, callback);

- __ref:__ reference to the InAppBrowser window (`InAppBrowser`)
- __eventname:__ the event to stop listening for (`String`)

        loadstart - event fired when the InAppBrowser starts to load a URL
        loadstop - event fired when the InAppBrowser finished loading a URL
        loaderror - event fired when the InAppBrowser encounters an error loading a URL
        exit - event fired when the InAppBrowser window is closed

- __callback:__ the function that was to be called when the event is fired.
The function is passed an `InAppBrowserEvent` object.

Supported Platforms
-------------------

- Android
- iOS
- Windows Phone 7 + 8

Quick Example
-------------

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    var myCallback = function() { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);

Full Example
------------

    <!DOCTYPE html>
    <html>
      <head>
        <title>InAppBrowser.removeEventListener Example</title>

        <script type="text/javascript" charset="utf-8" src="cordova-x.x.x.js"></script>
        <script type="text/javascript" charset="utf-8">

        // Wait for Cordova to load
        //
        document.addEventListener("deviceready", onDeviceReady, false);

        // Global InAppBrowser reference
        var iabRef = null;

        function iabLoadStart(event) {
            alert(event.type + ' - ' + event.url);
        }

        function iabLoadStop(event) {
            alert(event.type + ' - ' + event.url);
        }

        function iabLoadError(event) {
            alert(event.type + ' - ' + event.message);
        }

        function iabClose(event) {
             alert(event.type);
             iabRef.removeEventListener('loadstart', iabLoadStart);
             iabRef.removeEventListener('loadstop', iabLoadStop);
             iabRef.removeEventListener('loaderror', iabLoadError);
             iabRef.removeEventListener('exit', iabClose);
        }

        // Cordova is ready
        //
        function onDeviceReady() {
             iabRef = window.open('http://apache.org', '_blank', 'location=yes');
             iabRef.addEventListener('loadstart', iabLoadStart);
             iabRef.addEventListener('loadstop', iabLoadStop);
             iabRef.removeEventListener('loaderror', iabLoadError);
             iabRef.addEventListener('exit', iabClose);
        }

        </script>
      </head>
      <body>
      </body>
    </html>

close
=====

> Closes the InAppBrowser window.

    ref.close();

- __ref:__ reference to the InAppBrowser window (`InAppBrowser`)

Supported Platforms
-------------------

- Android
- iOS
- Windows Phone 7 + 8
- BlackBerry 10

Quick Example
-------------

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.close();

Full Example
------------

    <!DOCTYPE html>
    <html>
      <head>
        <title>InAppBrowser.close Example</title>

        <script type="text/javascript" charset="utf-8" src="cordova-x.x.x.js"></script>
        <script type="text/javascript" charset="utf-8">

        // Wait for Cordova to load
        //
        document.addEventListener("deviceready", onDeviceReady, false);

        // Cordova is ready
        //
        function onDeviceReady() {
             var ref = window.open('http://apache.org', '_blank', 'location=yes');
             // close InAppBrowser after 5 seconds
             setTimeout(function() {
                 ref.close();
             }, 5000);
        }

        </script>
      </head>
      <body>
      </body>
    </html>

executeScript
=============

> Injects JavaScript code into the InAppBrowser window

    ref.executeScript(details, callback);

- __ref:__ reference to the InAppBrowser window (`InAppBrowser`)
- __injectDetails:__ details of the script ot run (`Object`)
    - Supported keys:  (exactly one of "file" or "code" should be present)

            "file" - URL of the script to inject
            "code" - Text of the script to inject

- __callback:__ the function that is to be called in the Cordova application after the JavaScript code is injected.
    - If the injected script is of type "code", then the callback will be called with a single argument, which is
      the return value of the script, wrapped in an Array. (For multi-line scripts, this is the return value of the
      last statement, or the last expression evaluated.)

Supported Platforms
-------------------

- Android
- iOS

Quick Example
-------------

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeSript({file: "myscript.js"});
    });

Full Example
------------

    <!DOCTYPE html>
    <html>
      <head>
        <title>InAppBrowser.executeScript Example</title>

        <script type="text/javascript" charset="utf-8" src="cordova-2.5.0.js"></script>
        <script type="text/javascript" charset="utf-8">

        // Wait for Cordova to load
        //
        document.addEventListener("deviceready", onDeviceReady, false);

        // Global InAppBrowser reference
        var iabRef = null;

        // Inject our custom JavaScript into the InAppBrowser window
        //
        function replaceHeaderImage() {
            iabRef.executeScript({
                code: "var img=document.querySelector('#header img'); img.src='http://cordova.apache.org/images/cordova_bot.png';"
            }, function() {
                alert("Image Element Successfully Hijacked");
            }
        }

        function iabClose(event) {
             iabRef.removeEventListener('loadstop', replaceHeaderImage);
             iabRef.removeEventListener('exit', iabClose);
        }

        // Cordova is ready
        //
        function onDeviceReady() {
             iabRef = window.open('http://apache.org', '_blank', 'location=yes');
             iabRef.addEventListener('loadstop', replaceHeaderImage);
             iabRef.addEventListener('exit', iabClose);
        }

        </script>
      </head>
      <body>
      </body>
    </html>

insertCSS
=========

> Injects CSS into the InAppBrowser window

    ref.insertCSS(details, callback);

- __ref:__ reference to the InAppBrowser window (`InAppBrowser`)
- __injectDetails:__ details of the script ot run (`Object`)
    - Supported keys:  (exactly one of "file" or "code" should be present)

            "file" - URL of the stylesheet to inject
            "code" - Text of the stylesheet to inject

- __callback:__ the function that is to be called in the Cordova application after the CSS is injected.

Supported Platforms
-------------------

- Android
- iOS

Quick Example
-------------

    var ref = window.open('http://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });

Full Example
------------

    <!DOCTYPE html>
    <html>
      <head>
        <title>InAppBrowser.executeScript Example</title>

        <script type="text/javascript" charset="utf-8" src="cordova-2.5.0.js"></script>
        <script type="text/javascript" charset="utf-8">

        // Wait for Cordova to load
        //
        document.addEventListener("deviceready", onDeviceReady, false);

        // Global InAppBrowser reference
        var iabRef = null;

        // Inject our custom CSS into the InAppBrowser window
        //
        function changeBackgroundColor() {
            iabRef.executeScript({
                code: "body { background: #ffff00"
            }, function() {
                alert("Styles Altered");
            }
        }

        function iabClose(event) {
             iabRef.removeEventListener('loadstop', changeBackgroundColor);
             iabRef.removeEventListener('exit', iabClose);
        }

        // Cordova is ready
        //
        function onDeviceReady() {
             iabRef = window.open('http://apache.org', '_blank', 'location=yes');
             iabRef.addEventListener('loadstop', changeBackgroundColor);
             iabRef.addEventListener('exit', iabClose);
        }

        </script>
      </head>
      <body>
      </body>
    </html>

InAppBrowserEvent
=================

The object that is passed to the callback function from an addEventListener call on an InAppBrowser object.

Properties
----------

- __type:__ the eventname (`String`) - one of loadstart, loadstop, loaderror or exit
- __url:__ the URL that was loaded (`String`)
- __code:__ the error code (`Number`) - only in the case of loaderror
- __message:__ the error message (`String`) - only in the case of loaderror
