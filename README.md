---
title: Inappbrowser
description: Open an in-app browser window.
---
<!--
# license: Licensed to the Apache Software Foundation (ASF) under one
#         or more contributor license agreements.  See the NOTICE file
#         distributed with this work for additional information
#         regarding copyright ownership.  The ASF licenses this file
#         to you under the Apache License, Version 2.0 (the
#         "License"); you may not use this file except in compliance
#         with the License.  You may obtain a copy of the License at
#
#           http://www.apache.org/licenses/LICENSE-2.0
#
#         Unless required by applicable law or agreed to in writing,
#         software distributed under the License is distributed on an
#         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#         KIND, either express or implied.  See the License for the
#         specific language governing permissions and limitations
#         under the License.
-->


# cordova-plugin-inappbrowser

[![Android Testsuite](https://github.com/apache/cordova-plugin-inappbrowser/actions/workflows/android.yml/badge.svg)](https://github.com/apache/cordova-plugin-inappbrowser/actions/workflows/android.yml) [![Chrome Testsuite](https://github.com/apache/cordova-plugin-inappbrowser/actions/workflows/chrome.yml/badge.svg)](https://github.com/apache/cordova-plugin-inappbrowser/actions/workflows/chrome.yml) [![iOS Testsuite](https://github.com/apache/cordova-plugin-inappbrowser/actions/workflows/ios.yml/badge.svg)](https://github.com/apache/cordova-plugin-inappbrowser/actions/workflows/ios.yml) [![Lint Test](https://github.com/apache/cordova-plugin-inappbrowser/actions/workflows/lint.yml/badge.svg)](https://github.com/apache/cordova-plugin-inappbrowser/actions/workflows/lint.yml)

You can show helpful articles, videos, and web resources inside of your app. Users can view web pages without leaving your app.

> To get a few ideas, check out the [sample](#sample) at the bottom of this page or go straight to the [reference](#reference) content.

This plugin provides a web browser view that displays when calling `cordova.InAppBrowser.open()`.

    var ref = cordova.InAppBrowser.open('https://apache.org', '_blank', 'location=yes');

### `window.open`

The `cordova.InAppBrowser.open()` function is defined to be a drop-in replacement
for the `window.open()` function.  Existing `window.open()` calls can use the
InAppBrowser window, by replacing window.open:

    window.open = cordova.InAppBrowser.open;

If you change the browsers `window.open` function this way, it can have unintended side
effects (especially if this plugin is included only as a dependency of another
plugin).

The InAppBrowser window behaves like a standard web browser,
and can't access Cordova APIs. For this reason, the InAppBrowser is recommended
if you need to load third-party (untrusted) content, instead of loading that
into the main Cordova webview. The InAppBrowser is not subject to the
whitelist, nor is opening links in the system browser.

The InAppBrowser provides by default its own GUI controls for the user (back,
forward, done).

## Installation

    cordova plugin add cordova-plugin-inappbrowser

If you want all page loads in your app to go through the InAppBrowser, you can
simply hook `window.open` during initialization.  For example:

    document.addEventListener("deviceready", onDeviceReady, false);
    function onDeviceReady() {
        window.open = cordova.InAppBrowser.open;
    }

### Preferences

#### <b>config.xml</b>
- <b>InAppBrowserStatusBarStyle [iOS only]</b>: (string, options 'lightcontent', 'darkcontent' or 'default'. Defaults to 'default') set text color style for iOS. 'lightcontent' is intended for use on dark backgrounds. 'darkcontent' is only available since iOS 13 and intended for use on light backgrounds.
```xml
<preference name="InAppBrowserStatusBarStyle" value="lightcontent" />
```

## cordova.InAppBrowser.open

Opens a URL in a new `InAppBrowser` instance, the current browser
instance, or the system browser.

    var ref = cordova.InAppBrowser.open(url, target, options);

- __ref__: Reference to the `InAppBrowser` window when the target is set to `'_blank'`. _(InAppBrowser)_

- __url__: The URL to load _(String)_. Call `encodeURI()` on this if the URL contains Unicode characters.

- __target__: The target in which to load the URL, an optional parameter that defaults to `_self`. _(String)_

    - `_self`: Opens in the Cordova WebView if the URL is in the white list, otherwise it opens in the `InAppBrowser`.
    - `_blank`: Opens in the `InAppBrowser`.
    - `_system`: Opens in the system's web browser.

- __options__: Options for the `InAppBrowser`. Optional, defaulting to: `location=yes`. _(String)_

    The `options` string must not contain any blank space, and each feature's name/value pairs must be separated by a comma. Feature names are case insensitive.

    All platforms support:

    - __location__: Set to `yes` or `no` to turn the `InAppBrowser`'s location bar on or off.

    Android supports these additional options:

    - __hidden__: set to `yes` to create the browser and load the page, but not show it. The loadstop event fires when loading is complete. Omit or set to `no` (default) to have the browser open and load normally.
    - __beforeload__: set to enable the `beforeload` event to modify which pages are actually loaded in the browser. Accepted values are `get` to intercept only GET requests, `post` to intercept on POST requests or `yes` to intercept both GET & POST requests. Note that POST requests are not currently supported and will be ignored (if you set `beforeload=post` it will raise an error).
    - __clearcache__: set to `yes` to have the browser's cookie cache cleared before the new window is opened
    - __clearsessioncache__: set to `yes` to have the session cookie cache cleared before the new window is opened
    - __closebuttoncaption__: set to a string to use as the close button's caption instead of a X. Note that you need to localize this value yourself.
    - __closebuttoncolor__: set to a valid hex color string, for example: `#00ff00`, and it will change the
    close button color from default, regardless of being a text or default X. Only has effect if user has location set to `yes`.
    - __footer__: set to `yes` to show a close button in the footer similar to the iOS __Done__ button. 
    The close button will appear the same as for the header hence use __closebuttoncaption__ and __closebuttoncolor__ to set its properties.
    - __footercolor__: set to a valid hex color string, for example `#00ff00` or `#CC00ff00` (`#aarrggbb`) , and it will change the footer color from default.
    Only has effect if user has __footer__ set to `yes`.
    - __hardwareback__: set to `yes` to use the hardware back button to navigate backwards through the `InAppBrowser`'s history. If there is no previous page, the `InAppBrowser` will close.  The default value is `yes`, so you must set it to `no` if you want the back button to simply close the InAppBrowser.
    - __hidenavigationbuttons__: set to `yes` to hide the navigation buttons on the location toolbar, only has effect if user has location set to `yes`. The default value is `no`.
    - __hideurlbar__: set to `yes` to hide the url bar on the location toolbar, only has effect if user has location set to `yes`. The default value is `no`.
    - __navigationbuttoncolor__: set to a valid hex color string, for example: `#00ff00`, and it will change the color of both navigation buttons from default. Only has effect if user has location set to `yes` and not hidenavigationbuttons set to `yes`.
    - __toolbarcolor__: set to a valid hex color string, for example: `#00ff00`, and it will change the color the toolbar from default. Only has effect if user has location set to `yes`.
    - __lefttoright__: Set to `yes` to swap positions of the navigation buttons and the close button. Specifically, navigation buttons go to the right and close button to the left. Default value is `no`.
    - __zoom__: set to `yes` to enable Android browser's zoom controls, set to `no` to disable them. Default value is `yes`.
    - __zoomcontrols__: set to `yes` to show Android browser's zoom controls, set to `no` to hide them. Default value is `no`.
    - __mediaPlaybackRequiresUserAction__: Set to `yes` to prevent HTML5 audio or video from autoplaying (defaults to `no`).
    - __shouldPauseOnSuspend__: Set to `yes` to make InAppBrowser WebView to pause/resume with the app to stop background audio (this may be required to avoid Google Play issues like described in [CB-11013](https://issues.apache.org/jira/browse/CB-11013)).
    - __useWideViewPort__: Sets whether the WebView should enable support for the "viewport" HTML meta tag or should use a wide viewport. When the value of the setting is `no`, the layout width is always set to the width of the WebView control in device-independent (CSS) pixels. When the value is `yes` and the page contains the viewport meta tag, the value of the width specified in the tag is used. If the page does not contain the tag or does not provide a width, then a wide viewport will be used. (defaults to `yes`).
    - __fullscreen__: Sets whether the InappBrowser WebView is displayed fullscreen or not. In fullscreen mode, the status bar is hidden. Default value is `yes`.

    iOS supports these additional options:

    - __hidden__: set to `yes` to create the browser and load the page, but not show it. The loadstop event fires when loading is complete. Omit or set to `no` (default) to have the browser open and load normally.
    - __beforeload__: set to enable the `beforeload` event to modify which pages are actually loaded in the browser. Accepted values are `get` to intercept only GET requests, `post` to intercept on POST requests or `yes` to intercept both GET & POST requests. Note that POST requests are not currently supported and will be ignored (if you set `beforeload=post` it will raise an error).
    - __clearcache__: set to `yes` to have the browser's cookie cache cleared before the new window is opened
    - __clearsessioncache__: set to `yes` to have the session cookie cache cleared before the new window is opened. For WKWebView, requires iOS 11+ on target device.
    - __cleardata__: set to `yes` to have the browser's entire local storage cleared (cookies, HTML5 local storage, IndexedDB, etc.) before the new window is opened
    - __closebuttoncolor__: set as a valid hex color string, for example: `#00ff00`, to change from the default __Done__ button's color. Only applicable if toolbar is not disabled.
    - __closebuttoncaption__: set to a string to use as the __Done__ button's caption. Note that you need to localize this value yourself.
    - __disallowoverscroll__: Set to `yes` or `no` (default is `no`). Turns on/off the the bounce of the WKWebView's UIScrollView.
    - __hidenavigationbuttons__:  set to `yes` or `no` to turn the toolbar navigation buttons on or off (defaults to `no`). Only applicable if toolbar is not disabled.
    - __navigationbuttoncolor__:  set as a valid hex color string, for example: `#00ff00`, to change from the default color. Only applicable if navigation buttons are visible.
    - __toolbar__:  set to `yes` or `no` to turn the toolbar on or off for the InAppBrowser (defaults to `yes`)
    - __toolbarcolor__: set as a valid hex color string, for example: `#00ff00`, to change from the default color of the toolbar. Only applicable if toolbar is not disabled.
    - __toolbartranslucent__:  set to `yes` or `no` to make the toolbar translucent(semi-transparent)  (defaults to `yes`). Only applicable if toolbar is not disabled.
    - __lefttoright__: Set to `yes` to swap positions of the navigation buttons and the close button. Specifically, close button goes to the right and navigation buttons to the left.
    - __enableViewportScale__:  Set to `yes` or `no` to prevent viewport scaling through a meta tag (defaults to `no`).
    - __mediaPlaybackRequiresUserAction__: Set to `yes` to prevent HTML5 audio or video from autoplaying (defaults to `no`).
    - __allowInlineMediaPlayback__: Set to `yes` or `no` to allow in-line HTML5 media playback, displaying within the browser window rather than a device-specific playback interface. The HTML's `video` element must also include the `webkit-playsinline` attribute (defaults to `no`).
    - __presentationstyle__:  Set to `pagesheet`, `formsheet` or `fullscreen` to set the [presentation style](https://developer.apple.com/documentation/uikit/uimodalpresentationstyle) (defaults to `fullscreen`).
    - __transitionstyle__: Set to `fliphorizontal`, `crossdissolve` or `coververtical` to set the [transition style](https://developer.apple.com/documentation/uikit/uimodaltransitionstyle) (defaults to `coververtical`).
    - __toolbarposition__: Set to `top` or `bottom` (default is `bottom`). Causes the toolbar to be at the top or bottom of the window.
    - __hidespinner__: Set to `yes` or `no` to change the visibility of the loading indicator (defaults to `no`).


### Supported Platforms

- Android
- Browser
- iOS

### Example

    var ref = cordova.InAppBrowser.open('https://apache.org', '_blank', 'location=yes');
    var ref2 = cordova.InAppBrowser.open(encodeURI('http://ja.m.wikipedia.org/wiki/ハングル'), '_blank', 'location=yes');

### OSX Quirks

At the moment the only supported target in OSX is `_system`.

`_blank` and `_self` targets are not yet implemented and are ignored silently. Pull requests and patches to get these to work are greatly appreciated.

### iOS Quirks

Since the introduction of iPadOS 13, iPads try to adapt their content mode / user agent for the optimal browsing experience. This may result in iPads having their user agent set to Macintosh, making it hard to detect them as mobile devices using user agent string sniffing. You can change this with the `PreferredContentMode` preference in `config.xml`.

```xml
<preference name="PreferredContentMode" value="mobile" />
```

The example above forces the user agent to contain `iPad`. The other option is to use the value `desktop` to turn the user agent to `Macintosh`.

### Browser Quirks

- Plugin is implemented via iframe,

- Navigation history (`back` and `forward` buttons in LocationBar) is not implemented.

## InAppBrowser

The object returned from a call to `cordova.InAppBrowser.open` when the target is set to `'_blank'`.

### Methods

- addEventListener
- removeEventListener
- close
- show
- hide
- executeScript
- insertCSS

## InAppBrowser.addEventListener

> Adds a listener for an event from the `InAppBrowser`. (Only available when the target is set to `'_blank'`)

    ref.addEventListener(eventname, callback);

- __ref__: reference to the `InAppBrowser` window _(InAppBrowser)_

- __eventname__: the event to listen for _(String)_

  - __loadstart__: event fires when the `InAppBrowser` starts to load a URL.
  - __loadstop__: event fires when the `InAppBrowser` finishes loading a URL.
  - __loaderror__: event fires when the `InAppBrowser` encounters an error when loading a URL.
  - __exit__: event fires when the `InAppBrowser` window is closed.
  - __beforeload__: event fires when the `InAppBrowser` decides whether to load an URL or not (only with option `beforeload` set).
  - __message__: event fires when the `InAppBrowser` receives a message posted from the page loaded inside the `InAppBrowser` Webview.
  - __download__: _(Android Only)_ event fires when the `InAppBrowser` loads a URL that leads in downloading of a file.

- __callback__: the function that executes when the event fires. The function is passed an `InAppBrowserEvent` object as a parameter.

## Example

```javascript

var inAppBrowserRef;

function showHelp(url) {

    var target = "_blank";

    var options = "location=yes,hidden=yes,beforeload=yes";

    inAppBrowserRef = cordova.InAppBrowser.open(url, target, options);

    inAppBrowserRef.addEventListener('loadstart', loadStartCallBack);

    inAppBrowserRef.addEventListener('loadstop', loadStopCallBack);

    inAppBrowserRef.addEventListener('loaderror', loadErrorCallBack);

    inAppBrowserRef.addEventListener('beforeload', beforeloadCallBack);

    inAppBrowserRef.addEventListener('message', messageCallBack);
}

function loadStartCallBack() {

    $('#status-message').text("loading please wait ...");

}

function loadStopCallBack() {

    if (inAppBrowserRef != undefined) {

        inAppBrowserRef.insertCSS({ code: "body{font-size: 25px;}" });

        inAppBrowserRef.executeScript({ code: "\
            var message = 'this is the message';\
            var messageObj = {my_message: message};\
            var stringifiedMessageObj = JSON.stringify(messageObj);\
            webkit.messageHandlers.cordova_iab.postMessage(stringifiedMessageObj);"
        });

        $('#status-message').text("");

        inAppBrowserRef.show();
    }

}

function loadErrorCallBack(params) {

    $('#status-message').text("");

    var scriptErrorMesssage =
       "alert('Sorry we cannot open that page. Message from the server is : "
       + params.message + "');"

    inAppBrowserRef.executeScript({ code: scriptErrorMesssage }, executeScriptCallBack);

    inAppBrowserRef.close();

    inAppBrowserRef = undefined;

}

function executeScriptCallBack(params) {

    if (params[0] == null) {

        $('#status-message').text(
           "Sorry we couldn't open that page. Message from the server is : '"
           + params.message + "'");
    }

}

function beforeloadCallBack(params, callback) {

    if (params.url.startsWith("http://www.example.com/")) {

        // Load this URL in the inAppBrowser.
        callback(params.url);
    } else {

        // The callback is not invoked, so the page will not be loaded.
        $('#status-message').text("This browser only opens pages on http://www.example.com/");
    }

}

function messageCallBack(params){
    $('#status-message').text("message received: "+params.data.my_message);
}

```
#### Download event Example

Whenever the InAppBrowser receives or locates to a url which leads in downloading a file, the callback assigned to the "download" event is called. The parameter passed to this callback is an object with the the following properties

- **type** _it contains the String value "download" always_
- **url** _The url that leaded to the downloading of file. Basically, the download link of file_
- **userAgent** _User Agent of the webview_
- **contentDisposition** _If the url contains "content-disposition" header, then this property holds the value of that field else this field is empty_
- **contentLength** _If the link of the file allows to obtain file size then this property holds the file size else it contains int value 0_
- **mimetype** _The MIME type of the file_

```

function downloadListener(params){
    var url = params.url;
    var mimetype = params.mimetype;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", params.url);
    xhr.onload = function() {
        var content = xhr.responseText;
    };
    xhr.send();

}

```


### InAppBrowserEvent Properties

- __type__: the eventname, either `loadstart`, `loadstop`, `loaderror`, `message` or `exit`. _(String)_
- __url__: the URL that was loaded. _(String)_
- __code__: the error code, only in the case of `loaderror`. _(Number)_
- __message__: the error message, only in the case of `loaderror`. _(String)_
- __data__: the message contents , only in the case of `message`. A stringified JSON object. _(String)_

### Supported Platforms

- Android
- Browser
- iOS

### Browser Quirks

`loadstart`, `loaderror`, `message` events are not fired.

### Quick Example

    var ref = cordova.InAppBrowser.open('https://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstart', function(event) { alert(event.url); });

## InAppBrowser.removeEventListener

> Removes a listener for an event from the `InAppBrowser`. (Only available when the target is set to `'_blank'`)

    ref.removeEventListener(eventname, callback);

- __ref__: reference to the `InAppBrowser` window. _(InAppBrowser)_

- __eventname__: the event to stop listening for. _(String)_

  - __loadstart__: event fires when the `InAppBrowser` starts to load a URL.
  - __loadstop__: event fires when the `InAppBrowser` finishes loading a URL.
  - __loaderror__: event fires when the `InAppBrowser` encounters an error loading a URL.
  - __exit__: event fires when the `InAppBrowser` window is closed.
  - __message__: event fires when the `InAppBrowser` receives a message posted from the page loaded inside the `InAppBrowser` Webview.
  - __download__: _(Android only)_ event fires when the `InAppBrowser` loads a URL that leads in downloading of a file.

- __callback__: the function to execute when the event fires.
The function is passed an `InAppBrowserEvent` object.

### Supported Platforms

- Android
- Browser
- iOS

### Quick Example

    var ref = cordova.InAppBrowser.open('https://apache.org', '_blank', 'location=yes');
    var myCallback = function(event) { alert(event.url); }
    ref.addEventListener('loadstart', myCallback);
    ref.removeEventListener('loadstart', myCallback);

## InAppBrowser.close

> Closes the `InAppBrowser` window.

    ref.close();

- __ref__: reference to the `InAppBrowser` window _(InAppBrowser)_

### Supported Platforms

- Android
- Browser
- iOS

### Quick Example

    var ref = cordova.InAppBrowser.open('https://apache.org', '_blank', 'location=yes');
    ref.close();

## InAppBrowser.show

> Displays an InAppBrowser window that was opened hidden. Calling this has no effect if the InAppBrowser was already visible.

    ref.show();

- __ref__: reference to the InAppBrowser window (`InAppBrowser`)

### Supported Platforms

- Android
- Browser
- iOS

### Quick Example

    var ref = cordova.InAppBrowser.open('https://apache.org', '_blank', 'hidden=yes');
    // some time later...
    ref.show();

## InAppBrowser.hide

> Hides the InAppBrowser window. Calling this has no effect if the InAppBrowser was already hidden.

    ref.hide();

- __ref__: reference to the InAppBrowser window (`InAppBrowser`)

### Supported Platforms

- Android
- iOS

### Quick Example

    var ref = cordova.InAppBrowser.open('https://apache.org', '_blank');
    // some time later...
    ref.hide();

## InAppBrowser.executeScript

> Injects JavaScript code into the `InAppBrowser` window. (Only available when the target is set to `'_blank'`)

    ref.executeScript(details, callback);

- __ref__: reference to the `InAppBrowser` window. _(InAppBrowser)_

- __injectDetails__: details of the script to run, specifying either a `file` or `code` key. _(Object)_
  - __file__: URL of the script to inject.
  - __code__: Text of the script to inject.

- __callback__: the function that executes after the JavaScript code is injected.
    - If the injected script is of type `code`, the callback executes
      with a single parameter, which is the return value of the
      script, wrapped in an `Array`. For multi-line scripts, this is
      the return value of the last statement, or the last expression
      evaluated.

### Supported Platforms

- Android
- Browser
- iOS

### Quick Example

    var ref = cordova.InAppBrowser.open('https://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.executeScript({file: "myscript.js"});
    });

### Browser Quirks

- only __code__ key is supported.

## InAppBrowser.insertCSS

> Injects CSS into the `InAppBrowser` window. (Only available when the target is set to `'_blank'`)

    ref.insertCSS(details, callback);

- __ref__: reference to the `InAppBrowser` window _(InAppBrowser)_

- __injectDetails__: details of the script to run, specifying either a `file` or `code` key. _(Object)_
  - __file__: URL of the stylesheet to inject.
  - __code__: Text of the stylesheet to inject.

- __callback__: the function that executes after the CSS is injected.

### Supported Platforms

- Android
- iOS

### Quick Example

    var ref = cordova.InAppBrowser.open('https://apache.org', '_blank', 'location=yes');
    ref.addEventListener('loadstop', function() {
        ref.insertCSS({file: "mystyles.css"});
    });
__

## <a id="sample"></a>Sample: Show help pages with an InAppBrowser

You can use this plugin to show helpful documentation pages within your app. Users can view online help documents and then close them without leaving the app.

Here's a few snippets that show how you do this.

* [Give users a way to ask for help](#give).
* [Load a help page](#load).
* [Let users know that you're getting their page ready](#let).
* [Show the help page](#show).
* [Handle page errors](#handle).

### <a id="give"></a>Give users a way to ask for help

There's lots of ways to do this in your app. A drop down list is a simple way to do that.

```html

<select id="help-select">
    <option value="default">Need help?</option>
    <option value="article">Show me a helpful article</option>
    <option value="video">Show me a helpful video</option>
    <option value="search">Search for other topics</option>
</select>

```

Gather the users choice in the ``onDeviceReady`` function of the page and then send an appropriate URL to a helper function in some shared library file. Our helper function is named ``showHelp()`` and we'll write that function next.

```javascript

$('#help-select').on('change', function (e) {

    var url;

    switch (this.value) {

        case "article":
            url = "https://cordova.apache.org/docs/en/latest/"
                        + "reference/cordova-plugin-inappbrowser/index.html";
            break;

        case "video":
            url = "https://youtu.be/F-GlVrTaeH0";
            break;

        case "search":
            url = "https://www.google.com/#q=inAppBrowser+plugin";
            break;
    }

    showHelp(url);

});

```

### <a id="load"></a>Load a help page

We'll use the ``open`` function to load the help page. We're setting the ``hidden`` property to ``yes`` so that we can show the browser only after the page content has loaded. That way, users don't see a blank browser while they wait for content to appear. When the ``loadstop`` event is raised, we'll know when the content has loaded. We'll handle that event shortly.

```javascript

function showHelp(url) {

    var target = "_blank";

    var options = "location=yes,hidden=yes";

    inAppBrowserRef = cordova.InAppBrowser.open(url, target, options);

    inAppBrowserRef.addEventListener('loadstart', loadStartCallBack);

    inAppBrowserRef.addEventListener('loadstop', loadStopCallBack);

    inAppBrowserRef.addEventListener('loaderror', loadErrorCallBack);

}

```

### <a id="let"></a>Let users know that you're getting their page ready

Because the browser doesn't immediately appear, we can use the ``loadstart`` event to show a status message, progress bar, or other indicator. This assures users that content is on the way.

```javascript

function loadStartCallBack() {

    $('#status-message').text("loading please wait ...");

}

```

### <a id="show"></a>Show the help page

When the ``loadstopcallback`` event is raised, we know that the content has loaded and we can make the browser visible. This sort of trick can create the impression of better performance. The truth is that whether you show the browser before content loads or not, the load times are exactly the same.

```javascript

function loadStopCallBack() {

    if (inAppBrowserRef != undefined) {

        inAppBrowserRef.insertCSS({ code: "body{font-size: 25px;}" });

        $('#status-message').text("");

        inAppBrowserRef.show();
    }

}

```
You might have noticed the call to the ``insertCSS`` function. This serves no particular purpose in our scenario. But it gives you an idea of why you might use it. In this case, we're just making sure that the font size of your pages have a certain size. You can use this function to insert any CSS style elements. You can even point to a CSS file in your project.

### <a id="handle"></a>Handle page errors

Sometimes a page no longer exists, a script error occurs, or a user lacks permission to view the resource. How or if you handle that situation is completely up to you and your design. You can let the browser show that message or you can present it in another way.

We'll try to show that error in a message box. We can do that by injecting a script that calls the ``alert`` function. That said, this won't work in browsers on Windows devices so we'll have to look at the parameter of the ``executeScript`` callback function to see if our attempt worked. If it didn't work out for us, we'll just show the error message in a ``<div>`` on the page.

```javascript

function loadErrorCallBack(params) {

    $('#status-message').text("");

    var scriptErrorMesssage =
       "alert('Sorry we cannot open that page. Message from the server is : "
       + params.message + "');"

    inAppBrowserRef.executeScript({ code: scriptErrorMesssage }, executeScriptCallBack);

    inAppBrowserRef.close();

    inAppBrowserRef = undefined;

}

function executeScriptCallBack(params) {

    if (params[0] == null) {

        $('#status-message').text(
           "Sorry we couldn't open that page. Message from the server is : '"
           + params.message + "'");
    }

}

```

## More Usage Info

### Local Urls ( source is in the app package )
```
var iab = cordova.InAppBrowser;

iab.open('local-url.html');                  // loads in the Cordova WebView
iab.open('local-url.html', '_self');         // loads in the Cordova WebView
iab.open('local-url.html', '_system');       // Security error: system browser, but url will not load (iOS)
iab.open('local-url.html', '_blank');        // loads in the InAppBrowser
iab.open('local-url.html', 'random_string'); // loads in the InAppBrowser
iab.open('local-url.html', 'random_string', 'location=no'); // loads in the InAppBrowser, no location bar

```



### Whitelisted Content

```
var iab = cordova.InAppBrowser;

iab.open('https://whitelisted-url.com');                  // loads in the Cordova WebView
iab.open('https://whitelisted-url.com', '_self');         // loads in the Cordova WebView
iab.open('https://whitelisted-url.com', '_system');       // loads in the system browser
iab.open('https://whitelisted-url.com', '_blank');        // loads in the InAppBrowser
iab.open('https://whitelisted-url.com', 'random_string'); // loads in the InAppBrowser

iab.open('https://whitelisted-url.com', 'random_string', 'location=no'); // loads in the InAppBrowser, no location bar

```

### Urls that are not white-listed

```
var iab = cordova.InAppBrowser;

iab.open('https://url-that-fails-whitelist.com');                  // loads in the InAppBrowser
iab.open('https://url-that-fails-whitelist.com', '_self');         // loads in the InAppBrowser
iab.open('https://url-that-fails-whitelist.com', '_system');       // loads in the system browser
iab.open('https://url-that-fails-whitelist.com', '_blank');        // loads in the InAppBrowser
iab.open('https://url-that-fails-whitelist.com', 'random_string'); // loads in the InAppBrowser
iab.open('https://url-that-fails-whitelist.com', 'random_string', 'location=no'); // loads in the InAppBrowser, no location bar

```
