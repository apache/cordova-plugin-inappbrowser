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

const cordova = require('cordova');
const isIos = cordova.platformId === 'ios';
const isAndroid = cordova.platformId === 'android';
const isBrowser = cordova.platformId === 'browser';

window.alert = window.alert || navigator.notification.alert;

exports.defineAutoTests = function () {
    const createTests = function (platformOpts) {
        platformOpts = platformOpts || '';

        describe('cordova.InAppBrowser', function () {
            it('inappbrowser.spec.1 should exist', function () {
                expect(cordova.InAppBrowser).toBeDefined();
            });

            it('inappbrowser.spec.2 should contain open function', function () {
                expect(cordova.InAppBrowser.open).toBeDefined();
                expect(cordova.InAppBrowser.open).toEqual(jasmine.any(Function));
            });
        });

        describe('open method', function () {
            if (cordova.platformId === 'osx') {
                pending('Open method not fully supported on OSX.');
                return;
            }

            let iabInstance;
            let originalTimeout;
            const url = 'https://dist.apache.org/repos/dist/dev/cordova/';
            const badUrl = 'http://bad-uri/';

            beforeEach(function () {
                // increase timeout to ensure test url could be loaded within test time
                originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
                jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

                iabInstance = null;
            });

            afterEach(function (done) {
                // restore original timeout
                jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;

                if (iabInstance !== null && iabInstance.close) {
                    iabInstance.close();
                }
                iabInstance = null;
                // add some extra time so that iab dialog is closed
                setTimeout(done, 2000);
            });

            function verifyEvent (evt, type) {
                expect(evt).toBeDefined();
                expect(evt.type).toEqual(type);
                // `exit` event does not have url field, browser returns null url for CORS requests
                if (type !== 'exit' && !isBrowser) {
                    expect(evt.url).toEqual(url);
                }
            }

            function verifyLoadErrorEvent (evt) {
                expect(evt).toBeDefined();
                expect(evt.type).toEqual('loaderror');
                expect(evt.url).toEqual(badUrl);
                expect(evt.code).toEqual(jasmine.any(Number));
                expect(evt.message).toEqual(jasmine.any(String));
            }

            it('inappbrowser.spec.3 should return InAppBrowser instance with required methods', function () {
                iabInstance = cordova.InAppBrowser.open(url, '_blank', platformOpts);

                expect(iabInstance).toBeDefined();

                expect(iabInstance.addEventListener).toEqual(jasmine.any(Function));
                expect(iabInstance.removeEventListener).toEqual(jasmine.any(Function));
                expect(iabInstance.close).toEqual(jasmine.any(Function));
                expect(iabInstance.show).toEqual(jasmine.any(Function));
                expect(iabInstance.hide).toEqual(jasmine.any(Function));
                expect(iabInstance.executeScript).toEqual(jasmine.any(Function));
                expect(iabInstance.insertCSS).toEqual(jasmine.any(Function));
            });

            it('inappbrowser.spec.4 should support loadstart and loadstop events', function (done) {
                const onLoadStart = jasmine.createSpy('loadstart event callback').and.callFake(function (evt) {
                    verifyEvent(evt, 'loadstart');
                });

                iabInstance = cordova.InAppBrowser.open(url, '_blank', platformOpts);
                iabInstance.addEventListener('loadstart', onLoadStart);
                iabInstance.addEventListener('loadstop', function (evt) {
                    verifyEvent(evt, 'loadstop');
                    if (!isBrowser) {
                        // according to documentation, "loadstart" event is not supported on browser
                        // https://github.com/apache/cordova-plugin-inappbrowser#browser-quirks-1
                        expect(onLoadStart).toHaveBeenCalled();
                    }
                    done();
                });
            });

            it('inappbrowser.spec.5 should support exit event', function (done) {
                iabInstance = cordova.InAppBrowser.open(url, '_blank', platformOpts);
                iabInstance.addEventListener('exit', function (evt) {
                    verifyEvent(evt, 'exit');
                    done();
                });
                iabInstance.addEventListener('loadstop', function (evt) {
                    iabInstance.close();
                    iabInstance = null;
                });
            });

            it('inappbrowser.spec.6 should support loaderror event', function (done) {
                if (isBrowser) {
                    // according to documentation, "loaderror" event is not supported on browser
                    // https://github.com/apache/cordova-plugin-inappbrowser#browser-quirks-1
                    pending("Browser platform doesn't support loaderror event");
                }
                iabInstance = cordova.InAppBrowser.open(badUrl, '_blank', platformOpts);
                iabInstance.addEventListener('loaderror', function (evt) {
                    verifyLoadErrorEvent(evt);
                    done();
                });
            });

            it('inappbrowser.spec.7 should support message event', function (done) {
                if (!isAndroid && !isIos) {
                    return pending(cordova.platformId + " platform doesn't support message event");
                }
                const messageKey = 'my_message';
                const messageValue = 'is_this';
                iabInstance = cordova.InAppBrowser.open(url, '_blank', platformOpts);
                iabInstance.addEventListener('message', function (evt) {
                    // Verify message event
                    expect(evt).toBeDefined();
                    expect(evt.type).toEqual('message');
                    expect(evt.data).toBeDefined();
                    expect(evt.data[messageKey]).toBeDefined();
                    expect(evt.data[messageKey]).toEqual(messageValue);
                    done();
                });
                iabInstance.addEventListener('loadstop', function (evt) {
                    const code =
                        '(function(){\n' +
                        '    var message = {' +
                        messageKey +
                        ': "' +
                        messageValue +
                        '"};\n' +
                        '    webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(message));\n' +
                        '})()';
                    iabInstance.executeScript({ code });
                });
            });
        });
    };
    createTests();
};

exports.defineManualTests = function (contentEl, createActionButton) {
    const platformOpts = '';
    const platform_info = '';

    function doOpen (url, target, params, numExpectedRedirects, useWindowOpen) {
        numExpectedRedirects = numExpectedRedirects || 0;
        useWindowOpen = useWindowOpen || false;
        console.log('Opening ' + url);

        let counts;
        let lastLoadStartURL;
        let wasReset = false;
        function reset () {
            counts = {
                loaderror: 0,
                loadstart: 0,
                loadstop: 0,
                exit: 0
            };
            lastLoadStartURL = '';
        }
        reset();

        let iab;
        const callbacks = {
            loaderror: logEvent,
            loadstart: logEvent,
            loadstop: logEvent,
            exit: logEvent
        };
        if (useWindowOpen) {
            console.log('Use window.open() for url');
            iab = window.open(url, target, params, callbacks);
        } else {
            if (platformOpts) {
                params += (params ? ',' : '') + platformOpts;
            }
            iab = cordova.InAppBrowser.open(url, target, params, callbacks);
        }
        if (!iab) {
            alert('open returned ' + iab); // eslint-disable-line no-undef
            return;
        }

        function logEvent (e) {
            console.log('IAB event=' + JSON.stringify(e));
            counts[e.type]++;
            // Verify that event.url gets updated on redirects.
            if (e.type === 'loadstart') {
                if (e.url === lastLoadStartURL) {
                    alert('Unexpected: loadstart fired multiple times for the same URL.'); // eslint-disable-line no-undef
                }
                lastLoadStartURL = e.url;
            }
            // Verify the right number of loadstart events were fired.
            if (e.type === 'loadstop' || e.type === 'loaderror') {
                if (e.url !== lastLoadStartURL) {
                    alert('Unexpected: ' + e.type + " event.url != loadstart's event.url"); // eslint-disable-line no-undef
                }
                if (numExpectedRedirects === 0 && counts.loadstart !== 1) {
                    // Do allow a loaderror without a loadstart (e.g. in the case of an invalid URL).
                    if (!(e.type === 'loaderror' && counts.loadstart === 0)) {
                        alert('Unexpected: got multiple loadstart events. (' + counts.loadstart + ')'); // eslint-disable-line no-undef
                    }
                } else if (numExpectedRedirects > 0 && counts.loadstart < numExpectedRedirects + 1) {
                    alert(
                        'Unexpected: should have got at least ' +
                            (numExpectedRedirects + 1) +
                            ' loadstart events, but got ' +
                            counts.loadstart
                    ); // eslint-disable-line no-undef
                }
                wasReset = true;
                numExpectedRedirects = 0;
                reset();
            }
            // Verify that loadend / loaderror was called.
            if (e.type === 'exit') {
                const numStopEvents = counts.loadstop + counts.loaderror;
                if (numStopEvents === 0 && !wasReset) {
                    alert('Unexpected: browser closed without a loadstop or loaderror.'); // eslint-disable-line no-undef
                } else if (numStopEvents > 1) {
                    alert('Unexpected: got multiple loadstop/loaderror events.'); // eslint-disable-line no-undef
                }
            }
        }

        return iab;
    }

    function doHookOpen (url, target, params, numExpectedRedirects) {
        const originalFunc = window.open;
        const wasClobbered = Object.prototype.hasOwnProperty.call(window, 'open');
        window.open = cordova.InAppBrowser.open;

        try {
            doOpen(url, target, params, numExpectedRedirects, true);
        } finally {
            if (wasClobbered) {
                window.open = originalFunc;
            } else {
                console.log('just delete, to restore open from prototype');
                delete window.open;
            }
        }
    }

    function openWithStyle (url, cssUrl, useCallback) {
        const iab = doOpen(url, '_blank', 'location=yes');
        const callback = function (results) {
            if (results && results.length === 0) {
                alert('Results verified'); // eslint-disable-line no-undef
            } else {
                console.log(results);
                alert('Got: ' + typeof results + '\n' + JSON.stringify(results)); // eslint-disable-line no-undef
            }
        };
        if (cssUrl) {
            iab.addEventListener('loadstop', function (event) {
                iab.insertCSS({ file: cssUrl }, useCallback && callback);
            });
        } else {
            iab.addEventListener('loadstop', function (event) {
                iab.insertCSS({ code: '#style-update-literal { \ndisplay: block !important; \n}' }, useCallback && callback);
            });
        }
    }

    function openWithScript (url, jsUrl, useCallback) {
        const iab = doOpen(url, '_blank', 'location=yes');
        if (jsUrl) {
            iab.addEventListener('loadstop', function (event) {
                iab.executeScript(
                    { file: jsUrl },
                    useCallback &&
                        function (results) {
                            if (results && results.length === 0) {
                                alert('Results verified'); // eslint-disable-line no-undef
                            } else {
                                console.log(results);
                                alert('Got: ' + typeof results + '\n' + JSON.stringify(results)); // eslint-disable-line no-undef
                            }
                        }
                );
            });
        } else {
            iab.addEventListener('loadstop', function (event) {
                const code =
                    '(function(){\n' +
                    '    var header = document.getElementById("header");\n' +
                    '    header.innerHTML = "Script literal successfully injected";\n' +
                    '    return "abc";\n' +
                    '})()';
                iab.executeScript(
                    { code },
                    useCallback &&
                        function (results) {
                            if (results && results.length === 1 && results[0] === 'abc') {
                                alert('Results verified'); // eslint-disable-line no-undef
                            } else {
                                console.log(results);
                                alert('Got: ' + typeof results + '\n' + JSON.stringify(results)); // eslint-disable-line no-undef
                            }
                        }
                );
            });
        }
    }
    let hiddenwnd = null;
    const loadlistener = function (event) {
        alert('background window loaded ');
    }; // eslint-disable-line no-undef
    function openHidden (url, startHidden) {
        let shopt = startHidden ? 'hidden=yes' : '';
        if (platformOpts) {
            shopt += (shopt ? ',' : '') + platformOpts;
        }
        hiddenwnd = cordova.InAppBrowser.open(url, 'random_string', shopt);
        if (!hiddenwnd) {
            alert('cordova.InAppBrowser.open returned ' + hiddenwnd); // eslint-disable-line no-undef
            return;
        }
        if (startHidden) hiddenwnd.addEventListener('loadstop', loadlistener);
    }
    function showHidden () {
        if (hiddenwnd) {
            hiddenwnd.show();
        }
    }
    function closeHidden () {
        if (hiddenwnd) {
            hiddenwnd.removeEventListener('loadstop', loadlistener);
            hiddenwnd.close();
            hiddenwnd = null;
        }
    }

    const info_div =
        '<h1>InAppBrowser</h1>' +
        '<div id="info">' +
        'Make sure http://cordova.apache.org and http://google.co.uk and https://www.google.co.uk are white listed. </br>' +
        'Make sure http://www.apple.com is not in the white list.</br>' +
        'In iOS, starred <span style="vertical-align:super">*</span> tests will put the app in a state with no way to return. </br>' +
        '<h4>User-Agent: <span id="user-agent"> </span></hr>' +
        '</div>';

    const local_tests =
        '<h1>Local URL</h1>' +
        '<div id="openLocal"></div>' +
        'Expected result: opens successfully in CordovaWebView.' +
        '<p/> <div id="openLocalHook"></div>' +
        'Expected result: opens successfully in CordovaWebView (using hook of window.open()).' +
        '<p/> <div id="openLocalSelf"></div>' +
        'Expected result: opens successfully in CordovaWebView.' +
        '<p/> <div id="openLocalSystem"></div>' +
        'Expected result: fails to open' +
        '<p/> <div id="openLocalBlank"></div>' +
        'Expected result: opens successfully in InAppBrowser with locationBar at top.' +
        '<p/> <div id="openLocalRandomNoLocation"></div>' +
        'Expected result: opens successfully in InAppBrowser without locationBar.' +
        '<p/> <div id="openLocalRandomToolBarBottom"></div>' +
        'Expected result: opens successfully in InAppBrowser with locationBar. On iOS the toolbar is at the bottom.' +
        '<p/> <div id="openLocalRandomToolBarTop"></div>' +
        'Expected result: opens successfully in InAppBrowser with locationBar. On iOS the toolbar is at the top.' +
        '<p/><div id="openLocalRandomToolBarTopNoLocation"></div>' +
        'Expected result: open successfully in InAppBrowser with no locationBar. On iOS the toolbar is at the top.';

    const white_listed_tests =
        '<h1>White Listed URL</h1>' +
        '<div id="openWhiteListed"></div>' +
        'Expected result: open successfully in CordovaWebView to cordova.apache.org' +
        '<p/> <div id="openWhiteListedHook"></div>' +
        'Expected result: open successfully in CordovaWebView to cordova.apache.org (using hook of window.open())' +
        '<p/> <div id="openWhiteListedSelf"></div>' +
        'Expected result: open successfully in CordovaWebView to cordova.apache.org' +
        '<p/> <div id="openWhiteListedSystem"></div>' +
        'Expected result: open successfully in system browser to cordova.apache.org' +
        '<p/> <div id="openWhiteListedBlank"></div>' +
        'Expected result: open successfully in InAppBrowser to cordova.apache.org' +
        '<p/> <div id="openWhiteListedRandom"></div>' +
        'Expected result: open successfully in InAppBrowser to cordova.apache.org' +
        '<p/> <div id="openWhiteListedRandomNoLocation"></div>' +
        'Expected result: open successfully in InAppBrowser to cordova.apache.org with no location bar.';

    const non_white_listed_tests =
        '<h1>Non White Listed URL</h1>' +
        '<div id="openNonWhiteListed"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com.' +
        '<p/> <div id="openNonWhiteListedHook"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com (using hook of window.open()).' +
        '<p/> <div id="openNonWhiteListedSelf"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com (_self enforces whitelist).' +
        '<p/> <div id="openNonWhiteListedSystem"></div>' +
        'Expected result: open successfully in system browser to apple.com.' +
        '<p/> <div id="openNonWhiteListedBlank"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com.' +
        '<p/> <div id="openNonWhiteListedRandom"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com.' +
        '<p/> <div id="openNonWhiteListedRandomNoLocation"></div>' +
        'Expected result: open successfully in InAppBrowser to apple.com without locationBar.';

    const page_with_redirects_tests =
        '<h1>Page with redirect</h1>' +
        '<div id="openRedirect301"></div>' +
        'Expected result: should 301 and open successfully in InAppBrowser to https://www.google.co.uk.' +
        '<p/> <div id="openRedirect302"></div>' +
        'Expected result: should 302 and open successfully in InAppBrowser to www.zhihu.com/answer/16714076.';

    const pdf_url_tests =
        '<h1>PDF URL</h1>' +
        '<div id="openPDF"></div>' +
        'Expected result: InAppBrowser opens. PDF should render on iOS.' +
        '<p/> <div id="openPDFBlank"></div>' +
        'Expected result: InAppBrowser opens. PDF should render on iOS.';

    const invalid_url_tests =
        '<h1>Invalid URL</h1>' +
        '<div id="openInvalidScheme"></div>' +
        'Expected result: fail to load in InAppBrowser.' +
        '<p/> <div id="openInvalidHost"></div>' +
        'Expected result: fail to load in InAppBrowser.' +
        '<p/> <div id="openInvalidMissing"></div>' +
        'Expected result: fail to load in InAppBrowser (404).';

    const css_js_injection_tests =
        '<h1>CSS / JS Injection</h1>' +
        '<div id="openOriginalDocument"></div>' +
        'Expected result: open successfully in InAppBrowser without text "Style updated from..."' +
        '<p/> <div id="openCSSInjection"></div>' +
        'Expected result: open successfully in InAppBrowser with "Style updated from file".' +
        '<p/> <div id="openCSSInjectionCallback"></div>' +
        'Expected result: open successfully in InAppBrowser with "Style updated from file", and alert dialog with text "Results verified".' +
        '<p/> <div id="openCSSLiteralInjection"></div>' +
        'Expected result: open successfully in InAppBrowser with "Style updated from literal".' +
        '<p/> <div id="openCSSLiteralInjectionCallback"></div>' +
        'Expected result: open successfully in InAppBrowser with "Style updated from literal", and alert dialog with text "Results verified".' +
        '<p/> <div id="openScriptInjection"></div>' +
        'Expected result: open successfully in InAppBrowser with text "Script file successfully injected".' +
        '<p/> <div id="openScriptInjectionCallback"></div>' +
        'Expected result: open successfully in InAppBrowser with text "Script file successfully injected" and alert dialog with the text "Results verified".' +
        '<p/> <div id="openScriptLiteralInjection"></div>' +
        'Expected result: open successfully in InAppBrowser with the text "Script literal successfully injected" .' +
        '<p/> <div id="openScriptLiteralInjectionCallback"></div>' +
        'Expected result: open successfully in InAppBrowser with the text "Script literal successfully injected" and alert dialog with the text "Results verified".';

    const open_hidden_tests =
        '<h1>Open Hidden </h1>' +
        '<div id="openHidden"></div>' +
        'Expected result: no additional browser window. Alert appears with the text "background window loaded".' +
        '<p/> <div id="showHidden"></div>' +
        'Expected result: after first clicking on previous test "create hidden", open successfully in InAppBrowser to https://www.google.co.uk.' +
        '<p/> <div id="closeHidden"></div>' +
        'Expected result: no output. But click on "show hidden" again and nothing should be shown.' +
        '<p/> <div id="openHiddenShow"></div>' +
        'Expected result: open successfully in InAppBrowser to https://www.google.co.uk' +
        '<p/> <div id="openVisibleAndHide"></div>' +
        'Expected result: open successfully in InAppBrowser to https://www.google.co.uk. Hide after 2 seconds';

    const clearing_cache_tests =
        '<h1>Clearing Cache</h1>' +
        '<div id="openClearCache"></div>' +
        'Expected result: ?' +
        '<p/> <div id="openClearSessionCache"></div>' +
        'Expected result: ?';

    const video_tag_tests =
        '<h1>Video tag</h1>' +
        '<div id="openRemoteVideo"></div>' +
        'Expected result: open successfully in InAppBrowser with an embedded video plays automatically on iOS and Android.' +
        '<div id="openRemoteNeedUserNoVideo"></div>' +
        'Expected result: open successfully in InAppBrowser with an embedded video plays automatically on iOS and Android.' +
        '<div id="openRemoteNeedUserYesVideo"></div>' +
        'Expected result: open successfully in InAppBrowser with an embedded video does not play automatically on iOS and Android but rather works after clicking the "play" button.';

    const local_with_anchor_tag_tests =
        '<h1>Local with anchor tag</h1>' +
        '<div id="openAnchor1"></div>' +
        'Expected result: open successfully in InAppBrowser to the local page, scrolled to the top as normal.' +
        '<p/> <div id="openAnchor2"></div>' +
        'Expected result: open successfully in InAppBrowser to the local page, scrolled to the beginning of the tall div with border.';

    const hardwareback_tests =
        '<h1>HardwareBack</h1>' +
        '<p/> <div id="openHardwareBackDefault"></div>' +
        'Expected result: By default hardwareback is yes so pressing back button should navigate backwards in history then close InAppBrowser' +
        '<p/> <div id="openHardwareBackYes"></div>' +
        'Expected result: hardwareback=yes pressing back button should navigate backwards in history then close InAppBrowser' +
        '<p/> <div id="openHardwareBackNo"></div>' +
        'Expected result: hardwareback=no pressing back button should close InAppBrowser regardless history' +
        '<p/> <div id="openHardwareBackDefaultAfterNo"></div>' +
        'Expected result: consistently open browsers with with the appropriate option: hardwareback=defaults to yes then hardwareback=no then hardwareback=defaults to yes. By default hardwareback is yes so pressing back button should navigate backwards in history then close InAppBrowser';

    contentEl.innerHTML =
        info_div +
        platform_info +
        local_tests +
        white_listed_tests +
        non_white_listed_tests +
        page_with_redirects_tests +
        pdf_url_tests +
        invalid_url_tests +
        css_js_injection_tests +
        open_hidden_tests +
        clearing_cache_tests +
        video_tag_tests +
        local_with_anchor_tag_tests +
        hardwareback_tests;

    document.getElementById('user-agent').textContent = navigator.userAgent;

    // we are already in cdvtests directory
    const basePath = 'iab-resources/';
    const localhtml = basePath + 'local.html';
    const localpdf = basePath + 'local.pdf';
    const injecthtml = basePath + 'inject.html';
    const injectjs = 'inject.js';
    const injectcss = 'inject.css';
    const videohtml = basePath + 'video.html';

    // Local
    createActionButton(
        'target=Default',
        function () {
            doOpen(localhtml);
        },
        'openLocal'
    );
    createActionButton(
        'target=Default (window.open)',
        function () {
            doHookOpen(localhtml);
        },
        'openLocalHook'
    );
    createActionButton(
        'target=_self',
        function () {
            doOpen(localhtml, '_self');
        },
        'openLocalSelf'
    );
    createActionButton(
        'target=_system',
        function () {
            doOpen(localhtml, '_system');
        },
        'openLocalSystem'
    );
    createActionButton(
        'target=_blank',
        function () {
            doOpen(localhtml, '_blank');
        },
        'openLocalBlank'
    );
    createActionButton(
        'target=Random, location=no, disallowoverscroll=yes',
        function () {
            doOpen(localhtml, 'random_string', 'location=no, disallowoverscroll=yes');
        },
        'openLocalRandomNoLocation'
    );
    createActionButton(
        'target=Random, toolbarposition=bottom',
        function () {
            doOpen(localhtml, 'random_string', 'toolbarposition=bottom');
        },
        'openLocalRandomToolBarBottom'
    );
    createActionButton(
        'target=Random, toolbarposition=top',
        function () {
            doOpen(localhtml, 'random_string', 'toolbarposition=top');
        },
        'openLocalRandomToolBarTop'
    );
    createActionButton(
        'target=Random, toolbarposition=top, location=no',
        function () {
            doOpen(localhtml, 'random_string', 'toolbarposition=top,location=no');
        },
        'openLocalRandomToolBarTopNoLocation'
    );

    // White Listed
    createActionButton(
        '* target=Default',
        function () {
            doOpen('https://cordova.apache.org');
        },
        'openWhiteListed'
    );
    createActionButton(
        '* target=Default (window.open)',
        function () {
            doHookOpen('https://cordova.apache.org');
        },
        'openWhiteListedHook'
    );
    createActionButton(
        '* target=_self',
        function () {
            doOpen('https://cordova.apache.org', '_self');
        },
        'openWhiteListedSelf'
    );
    createActionButton(
        'target=_system',
        function () {
            doOpen('https://cordova.apache.org', '_system');
        },
        'openWhiteListedSystem'
    );
    createActionButton(
        'target=_blank',
        function () {
            doOpen('https://cordova.apache.org', '_blank');
        },
        'openWhiteListedBlank'
    );
    createActionButton(
        'target=Random',
        function () {
            doOpen('https://cordova.apache.org', 'random_string');
        },
        'openWhiteListedRandom'
    );
    createActionButton(
        '* target=Random, no location bar',
        function () {
            doOpen('https://cordova.apache.org', 'random_string', 'location=no');
        },
        'openWhiteListedRandomNoLocation'
    );

    // Non White Listed
    createActionButton(
        'target=Default',
        function () {
            doOpen('https://www.apple.com');
        },
        'openNonWhiteListed'
    );
    createActionButton(
        'target=Default (window.open)',
        function () {
            doHookOpen('https://www.apple.com');
        },
        'openNonWhiteListedHook'
    );
    createActionButton(
        'target=_self',
        function () {
            doOpen('https://www.apple.com', '_self');
        },
        'openNonWhiteListedSelf'
    );
    createActionButton(
        'target=_system',
        function () {
            doOpen('https://www.apple.com', '_system');
        },
        'openNonWhiteListedSystem'
    );
    createActionButton(
        'target=_blank',
        function () {
            doOpen('https://www.apple.com', '_blank');
        },
        'openNonWhiteListedBlank'
    );
    createActionButton(
        'target=Random',
        function () {
            doOpen('https://www.apple.com', 'random_string');
        },
        'openNonWhiteListedRandom'
    );
    createActionButton(
        '* target=Random, no location bar',
        function () {
            doOpen('https://www.apple.com', 'random_string', 'location=no');
        },
        'openNonWhiteListedRandomNoLocation'
    );

    // Page with redirect
    createActionButton(
        'http://google.co.uk',
        function () {
            doOpen('https://google.co.uk', 'random_string', '', 1);
        },
        'openRedirect301'
    );
    createActionButton(
        'http://goo.gl/pUFqg',
        function () {
            doOpen('https://goo.gl/pUFqg', 'random_string', '', 2);
        },
        'openRedirect302'
    );

    // PDF URL
    createActionButton(
        'Remote URL',
        function () {
            doOpen('https://www.stluciadance.com/prospectus_file/sample.pdf');
        },
        'openPDF'
    );
    createActionButton(
        'Local URL',
        function () {
            doOpen(localpdf, '_blank');
        },
        'openPDFBlank'
    );

    // Invalid URL
    createActionButton(
        'Invalid Scheme',
        function () {
            doOpen('x-ttp://www.invalid.com/', '_blank');
        },
        'openInvalidScheme'
    );
    createActionButton(
        'Invalid Host',
        function () {
            doOpen('https://www.inv;alid.com/', '_blank');
        },
        'openInvalidHost'
    );
    createActionButton(
        'Missing Local File',
        function () {
            doOpen('nonexistent.html', '_blank');
        },
        'openInvalidMissing'
    );

    // CSS / JS injection
    createActionButton(
        'Original Document',
        function () {
            doOpen(injecthtml, '_blank');
        },
        'openOriginalDocument'
    );
    createActionButton(
        'CSS File Injection',
        function () {
            openWithStyle(injecthtml, injectcss);
        },
        'openCSSInjection'
    );
    createActionButton(
        'CSS File Injection (callback)',
        function () {
            openWithStyle(injecthtml, injectcss, true);
        },
        'openCSSInjectionCallback'
    );
    createActionButton(
        'CSS Literal Injection',
        function () {
            openWithStyle(injecthtml);
        },
        'openCSSLiteralInjection'
    );
    createActionButton(
        'CSS Literal Injection (callback)',
        function () {
            openWithStyle(injecthtml, null, true);
        },
        'openCSSLiteralInjectionCallback'
    );
    createActionButton(
        'Script File Injection',
        function () {
            openWithScript(injecthtml, injectjs);
        },
        'openScriptInjection'
    );
    createActionButton(
        'Script File Injection (callback)',
        function () {
            openWithScript(injecthtml, injectjs, true);
        },
        'openScriptInjectionCallback'
    );
    createActionButton(
        'Script Literal Injection',
        function () {
            openWithScript(injecthtml);
        },
        'openScriptLiteralInjection'
    );
    createActionButton(
        'Script Literal Injection (callback)',
        function () {
            openWithScript(injecthtml, null, true);
        },
        'openScriptLiteralInjectionCallback'
    );

    // Open hidden
    createActionButton(
        'Create Hidden',
        function () {
            openHidden('https://www.google.co.uk', true);
        },
        'openHidden'
    );
    createActionButton(
        'Show Hidden',
        function () {
            showHidden();
        },
        'showHidden'
    );
    createActionButton(
        'Close Hidden',
        function () {
            closeHidden();
        },
        'closeHidden'
    );
    createActionButton(
        'google.co.uk Not Hidden',
        function () {
            openHidden('https://www.google.co.uk', false);
        },
        'openHiddenShow'
    );
    createActionButton(
        'google.co.uk shown for 2 seconds than hidden',
        function () {
            const iab = doOpen('https://www.google.co.uk/', 'random_sting');
            setTimeout(function () {
                iab.hide();
            }, 2000);
        },
        'openVisibleAndHide'
    );

    // Clearing cache
    createActionButton(
        'Clear Browser Cache',
        function () {
            doOpen('https://www.google.co.uk', '_blank', 'clearcache=yes');
        },
        'openClearCache'
    );
    createActionButton(
        'Clear Session Cache',
        function () {
            doOpen('https://www.google.co.uk', '_blank', 'clearsessioncache=yes');
        },
        'openClearSessionCache'
    );

    // Video tag
    createActionButton(
        'Remote Video',
        function () {
            doOpen(videohtml, '_blank');
        },
        'openRemoteVideo'
    );
    createActionButton(
        'Remote Need User No Video',
        function () {
            doOpen(videohtml, '_blank', 'mediaPlaybackRequiresUserAction=no');
        },
        'openRemoteNeedUserNoVideo'
    );
    createActionButton(
        'Remote Need User Yes Video',
        function () {
            doOpen(videohtml, '_blank', 'mediaPlaybackRequiresUserAction=yes');
        },
        'openRemoteNeedUserYesVideo'
    );

    // Local With Anchor Tag
    createActionButton(
        'Anchor1',
        function () {
            doOpen(localhtml + '#bogusanchor', '_blank');
        },
        'openAnchor1'
    );
    createActionButton(
        'Anchor2',
        function () {
            doOpen(localhtml + '#anchor2', '_blank');
        },
        'openAnchor2'
    );

    // Hardwareback
    createActionButton(
        'no hardwareback (defaults to yes)',
        function () {
            doOpen('https://cordova.apache.org', '_blank');
        },
        'openHardwareBackDefault'
    );
    createActionButton(
        'hardwareback=yes',
        function () {
            doOpen('https://cordova.apache.org', '_blank', 'hardwareback=yes');
        },
        'openHardwareBackYes'
    );
    createActionButton(
        'hardwareback=no',
        function () {
            doOpen('https://cordova.apache.org', '_blank', 'hardwareback=no');
        },
        'openHardwareBackNo'
    );
    createActionButton(
        'no hardwareback -> hardwareback=no -> no hardwareback',
        function () {
            const ref = cordova.InAppBrowser.open('https://google.com', '_blank', 'location=yes' + (platformOpts ? ',' + platformOpts : ''));
            ref.addEventListener('loadstop', function () {
                ref.close();
            });
            ref.addEventListener('exit', function () {
                const ref2 = cordova.InAppBrowser.open(
                    'https://google.com',
                    '_blank',
                    'location=yes,hardwareback=no' + (platformOpts ? ',' + platformOpts : '')
                );
                ref2.addEventListener('loadstop', function () {
                    ref2.close();
                });
                ref2.addEventListener('exit', function () {
                    cordova.InAppBrowser.open('https://google.com', '_blank', 'location=yes' + (platformOpts ? ',' + platformOpts : ''));
                });
            });
        },
        'openHardwareBackDefaultAfterNo'
    );
};
