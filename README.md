<!---
    Licensed to the Apache Software Foundation (ASF) under one
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
-->

com.initialxy.cordova.themeablebrowser
======================================

This plugin is a fork of [org.apache.cordova.inappbrowser](https://github.com/apache/cordova-plugin-inappbrowser). It attempts to retain most of the features of the InAppBrowser. In fact, for the full list of features inherited from InAppBrowser, please refer to [InAppBrowser's documentation](https://github.com/apache/cordova-plugin-inappbrowser/blob/master/README.md).

The purpose of this plugin is to provide an in-app-browser that can also be configured to match the theme of your app, in order to give it a more immersive look and feel for your app, as well as provide a more consistent look and feel across platforms.

This plugin launches an in-app web view on top the existing [CordovaWebView](https://github.com/apache/cordova-android/blob/master/framework/src/org/apache/cordova/CordovaWebView.java) by calling `cordova.ThemeableBrowser.open()`.

    // Keep in mind that you must add your own images to native resource.
    // Images below are for sample only. They are not imported by this plugin.
    cordova.ThemeableBrowser.open('http://apache.org', '_blank', {
        statusbar: {
            color: '#ffffffff'
        },
        toolbar: {
            height: 44,
            color: '#f0f0f0ff'
        },
        title: {
            color: '#003264ff',
            showPageTitle: true
        },
        backButton: {
            image: 'back',
            imagePressed: 'back_pressed',
            align: 'left',
            event: 'backPressed'
        },
        forwardButton: {
            image: 'forward',
            imagePressed: 'forward_pressed',
            align: 'left',
            event: 'forwardPressed'
        },
        closeButton: {
            image: 'close',
            imagePressed: 'close_pressed',
            align: 'left',
            event: 'closePressed'
        },
        customButtons: [
            {
                image: 'share',
                imagePressed: 'share_pressed',
                align: 'right',
                event: 'sharePressed'
            }
        ],
        menu: {
            image: 'menu',
            imagePressed: 'menu_pressed',
            title: 'Test',
            cancel: 'Cancel',
            align: 'right',
            items: [
                {
                    event: 'helloPressed',
                    label: 'Hello World!'
                },
                {
                    event: 'testPressed',
                    label: 'Test!'
                }
            ]
        },
        backButtonCanClose: true
    }).addEventListener('backPressed', function(e) {
        alert('back pressed');
    }).addEventListener('helloPressed', function(e) {
        alert('hello pressed');
    }).addEventListener('sharePressed', function(e) {
        alert(e.url);
    });

![iOS Sample](doc/images/ios_sample_01.png)
![iOS Menu Sample](doc/images/ios_menu_sample_01.png)

![Android Sample](doc/images/android_sample_01.png)
![Android Menu Sample](doc/images/android_menu_sample_01.png)

Installation
------------

    cordova plugin add com.initialxy.cordova.themeablebrowser

Additional Properties
---------------------

In addition to InAppBrowser's properties, following properties were added to fulfill this plugin's purpose in a nested JSON object.

+ `statusbar` applicable to only iOS 7+.
    + `color` sets status bar color for iOS 7+ in RGBA web hex format. eg. `#fff0f0ff`. Default to white. Applicable to only iOS 7+.
+ `toolbar`
    + `height` sets height of toolbar. Default to 44.
    + `color` sets browser toolbar color in RGBA web hex format. eg. `#fff0f0ff`. Default to white. Also see `image`.
    + `image` sets an image as browser toolbar background in titled mode. This property references to a **native** image resource, therefore it is platform dependent.
    + `imagePortrait` sets an image for browser toolbar background but only in portrait mode. This property will be overridden by `image` if given. This is an iOS only property and references to **native** image resource.
    + `imageLandscape` sets an image for browser toolbar background but only in landscape mode. This property will be overridden by `image` if given. This is an iOS only property and references to **native** image resource.
+ `title`
    + `color` sets title text color in RGBA web hex format. eg. `#fff0f0ff`. Default to black.
    + `staticText` sets static text for title. This property overrides `showPageTitle` (see below).
    + `showPageTitle` when set to true, title of the current web page will be shown.
+ `backButton`
    + `image` sets image for back button. This property references to a **native** image resource, therefore it is platform dependent.
    + `imagePressed` sets image for back button in its pressed state. This property references to a **native** image resource, therefore it is platform dependent.
    + `align` aligns back button to either `left` or `right`. Default to `left`.
    + `event` raises an custom event with given text as event name when back button is pressed. Optional.
+ `forwardButton`
    + `image` sets image for forward button. This property references to a **native** image resource, therefore it is platform dependent.
    + `imagePressed` sets image for forward button in its pressed state. This property references to a **native** image resource, therefore it is platform dependent.
    + `align` aligns forward button to either `left` or `right`. Default to `left`.
    + `event` raises an custom event with given text as event name when forward button is pressed. Optional.
+ `closeButton`
    + `image` sets image for close button. This property references to a **native** image resource, therefore it is platform dependent.
    + `imagePressed` sets image for close button in its pressed state. This property references to a **native** image resource, therefore it is platform dependent.
    + `align` aligns close button to either `left` or `right`. Default to `left`.
    + `event` raises an custom event with given text as event name when close button is pressed. Optional.
+ `menu`
    + `title` sets menu title when menu button is clicked. iOS only.
    + `cancel` sets menu cancel button text. iOS only.
    + `image` sets image for menu button. This property references to a **native** image resource, therefore it is platform dependent.
    + `imagePressed` sets image for menu button in its pressed state. This property references to a **native** image resource, therefore it is platform dependent.
    + `event` raises an custom event with given text as event name when menu button is pressed. Optional.
    + `align` aligns menu button to either `left` or `right`. Default to `left`.
    + `items` is a list of items to be shown when menu is open
        + `event` defines the event name that will be raised when this menu item is clicked. The callbacks to menu events will receive an event object that contains the following properties: `url` is the current URL shown in browser and `index` is the index of the selected item in `items`.
        + `label` defines the menu item label text.
+ `customButtons` is a list of objects that will be inserted into toolbar when given.
    + `image` sets image for custom button. This property references to a **native** image resource, therefore it is platform dependent.
    + `imagePressed` sets image for custom button in its pressed state. This property references to a **native** image resource, therefore it is platform dependent.
    + `align` aligns custom button to either `left` or `right`. Default to `left`.
    + `event` raises an custom event with given text as event name when custom button is pressed. The callbacks to custom button events will receive an event object that contains the following properties: `url` is the current URL shown in browser and `index` is the index of the selected button in `customButtons`.
+ `backButtonCanClose` allows back button to close browser when there's no more to go back. Otherwise, back button will be disabled.

All properties are optional with little default values. If a property is not given, its corresponding UI element will not be shown.

One thing to note is that all image resources reference to **native** resource bundle. So all images need to be imported to native project first. In case of Android, the image name will be looked up under `R.drawable`. eg. If image name is `hello_world`, `R.drawable.hello_world` will be referenced.

You may have noticed that ThemedBrowser added an optional menu as well as custom buttons, which you can utilize to respond to some simple user actions.

FAQ
---

### I just installed this plugin, how come it just shows a blank toolbar?

The purpose of this plugin is to allow **you** to style the in app browser the way you want. Isn't that why you installed this plugin in the first place? Hence, it does not come with any defaults. Every UI element needs to be styled by you, otherwise it's hidden. This also avoids polluting your resouce bundle with default images.

### Why does my menu on Android look ugly?

Android menu is simply a [Spinner](http://developer.android.com/guide/topics/ui/controls/spinner.html), which picks up its style from your Activity's theme. By default Cordova uses the very old [Theme.Black.NoTitleBar](http://developer.android.com/reference/android/R.style.html#Theme_Black_NoTitleBar), which is ugly. Open your AndroidManifest.xml and change your `android:theme` attribute to something more morden, such as [Theme.Holo](http://developer.android.com/reference/android/R.style.html#Theme_Holo) or [Base.Theme.AppCompat](http://developer.android.com/reference/android/support/v7/appcompat/R.style.html#Base_Theme_AppCompat) from [support library](https://developer.android.com/tools/support-library/features.html#v7-appcompat).

### How do I style Android menu?

Android menu is simply a [Spinner](http://developer.android.com/guide/topics/ui/controls/spinner.html) with default layout resources, which picks up its style from your Activity's theme. You can style it by making a theme of your app and apply it to your activity. See `android:dropDownListViewStyle`.

### How do I add margings and paddings?

There is no margins or paddings. However notice that you can assign images to each of the buttons. So take advantage of PNG's transparency to create margins/paddings around your buttons.

### How do I add shadow to the toolbar?

First, notice that you can use an image as well as color for toolbar background. Use PNG for background image and create shadow inside this image. Next, you will probably be concerned about how buttons will slightly misaligned due since they always middle align. Again create some transparent borders in your button images to offset the misalignment. eg. Say your shadow is 5px tall, which causes buttons to allear lower than they shoud. Create a 10px transparent bottom border for each of your button icons and you are set.

Supported Platforms
-------------------

+ iOS 5.0+
+ Android 2.0+

Currently there is no plan to support other platforms, though source code from InAppBrowser is kept for merge purposes, they are inactive, since they are removed from `plugin.xml`.

Migration
---------

This plugin is **not** a drop-in replacement for InAppBrowser. The biggest change that was made from InAppBrowser, which caused it to be no longer compatible with InAppBrowser's API is that `options` parameter now accepts a JavaScript object instead of string.

    cordova.ThemeableBrowser.open('http://apache.org', '_blank', {
        customButtons: [
            {
                image: 'share',
                imagePressed: 'share_pressed',
                align: 'right',
                event: 'sharePressed'
            }
        ],
        menu: {
            image: 'menu',
            imagePressed: 'menu_pressed',
            items: [
                {
                    event: 'helloPressed',
                    label: 'Hello World!'
                },
                {
                    event: 'testPressed',
                    label: 'Test!'
                }
            ]
        }
    });

As you can see from above, this allows `menu` to have more robust and readable definition.

Furthermore, the object returned by `open` always returns its own instance allowing chaining of methods. Obviously, this breaks the immitation of the `window.open()`, however it's an optional feature that you can choose not to use if you want to stay loyal to the original.

    cordova.ThemeableBrowser.open('http://apache.org', '_blank', {
        customButtons: [
            {
                image: 'share',
                imagePressed: 'share_pressed',
                align: 'right',
                event: 'sharePressed'
            }
        ],
        menu: {
            image: 'menu',
            imagePressed: 'menu_pressed',
            items: [
                {
                    event: 'helloPressed',
                    label: 'Hello World!'
                },
                {
                    event: 'testPressed',
                    label: 'Test!'
                }
            ]
        }
    }).addEventListener('sharePressed', function(event) {
        alert(event.url);
    }).addEventListener('helloPressed', function(event) {
        alert(event.url);
    }).addEventListener('testPressed', function(event) {
        alert(event.url);
    });

Two properties from InAppBrowser are disabled.
+ `location` is always `false` because address bar is not needed for an immersive experience of an integrated browser.
+ `toolbarposition` is always `top` to remain consistent across platforms.

One is redefined.
+ `toolbar` is redefined to contain toolbar settings and toolbar is always shown, because the whole point why you are using this plugin is to style toolbar right?

License
-------

This project is licensed under Aapache License 2.0. See [LICENSE](LICENSE) file.
