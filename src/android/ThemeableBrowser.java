/*
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
*/
package com.initialxy.cordova.themeablebrowser;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Browser;
import android.text.InputType;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.view.WindowManager.LayoutParams;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.Spinner;
import android.widget.TextView;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.Config;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.LOG;
import org.apache.cordova.PluginManager;
import org.apache.cordova.PluginResult;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.List;

@SuppressLint("SetJavaScriptEnabled")
public class ThemeableBrowser extends CordovaPlugin {

    private static final String NULL = "null";
    protected static final String LOG_TAG = "ThemeableBrowser";
    private static final String SELF = "_self";
    private static final String SYSTEM = "_system";
    // private static final String BLANK = "_blank";
    private static final String EXIT_EVENT = "exit";
    private static final String LOAD_START_EVENT = "loadstart";
    private static final String LOAD_STOP_EVENT = "loadstop";
    private static final String LOAD_ERROR_EVENT = "loaderror";

    private static final String ALIGN_LEFT = "left";
    private static final String ALIGN_RIGHT = "right";

    private static final int DISABLED_ALPHA = 127;  // 50% AKA 127/255.

    private ThemeableBrowserDialog dialog;
    private WebView inAppWebView;
    private EditText edittext;
    private CallbackContext callbackContext;

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action          The action to execute.
     * @param args            The exec() arguments, wrapped with some Cordova helpers.
     * @param callbackContext The callback context used when calling back into JavaScript.
     * @return
     * @throws JSONException
     */
    public boolean execute(String action, CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("open")) {
            this.callbackContext = callbackContext;
            final String url = args.getString(0);
            String t = args.optString(1);
            if (t == null || t.equals("") || t.equals(NULL)) {
                t = SELF;
            }
            final String target = t;
            final Options features = parseFeature(args.optString(2));

            Log.d(LOG_TAG, "target = " + target);

            this.cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    String result = "";
                    // SELF
                    if (SELF.equals(target)) {
                        Log.d(LOG_TAG, "in self");
                        /* This code exists for compatibility between 3.x and 4.x versions of Cordova.
                         * Previously the Config class had a static method, isUrlWhitelisted(). That
                         * responsibility has been moved to the plugins, with an aggregating method in
                         * PluginManager.
                         */
                        Boolean shouldAllowNavigation = null;
                        if (url.startsWith("javascript:")) {
                            shouldAllowNavigation = true;
                        }
                        if (shouldAllowNavigation == null) {
                            try {
                                Method iuw = Config.class.getMethod("isUrlWhiteListed", String.class);
                                shouldAllowNavigation = (Boolean)iuw.invoke(null, url);
                            } catch (NoSuchMethodException e) {
                            } catch (IllegalAccessException e) {
                            } catch (InvocationTargetException e) {
                            }
                        }
                        if (shouldAllowNavigation == null) {
                            try {
                                Method gpm = webView.getClass().getMethod("getPluginManager");
                                PluginManager pm = (PluginManager)gpm.invoke(webView);
                                Method san = pm.getClass().getMethod("shouldAllowNavigation", String.class);
                                shouldAllowNavigation = (Boolean)san.invoke(pm, url);
                            } catch (NoSuchMethodException e) {
                            } catch (IllegalAccessException e) {
                            } catch (InvocationTargetException e) {
                            }
                        }
                        // load in webview
                        if (Boolean.TRUE.equals(shouldAllowNavigation)) {
                            Log.d(LOG_TAG, "loading in webview");
                            webView.loadUrl(url);
                        }
                        //Load the dialer
                        else if (url.startsWith(WebView.SCHEME_TEL))
                        {
                            try {
                                Log.d(LOG_TAG, "loading in dialer");
                                Intent intent = new Intent(Intent.ACTION_DIAL);
                                intent.setData(Uri.parse(url));
                                cordova.getActivity().startActivity(intent);
                            } catch (android.content.ActivityNotFoundException e) {
                                LOG.e(LOG_TAG, "Error dialing " + url + ": " + e.toString());
                            }
                        }
                        // load in ThemeableBrowser
                        else {
                            Log.d(LOG_TAG, "loading in ThemeableBrowser");
                            result = showWebPage(url, features);
                        }
                    }
                    // SYSTEM
                    else if (SYSTEM.equals(target)) {
                        Log.d(LOG_TAG, "in system");
                        result = openExternal(url);
                    }
                    // BLANK - or anything else
                    else {
                        Log.d(LOG_TAG, "in blank");
                        result = showWebPage(url, features);
                    }

                    PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, result);
                    pluginResult.setKeepCallback(true);
                    callbackContext.sendPluginResult(pluginResult);
                }
            });
        }
        else if (action.equals("close")) {
            closeDialog();
        }
        else if (action.equals("injectScriptCode")) {
            String jsWrapper = null;
            if (args.getBoolean(1)) {
                jsWrapper = String.format("prompt(JSON.stringify([eval(%%s)]), 'gap-iab://%s')", callbackContext.getCallbackId());
            }
            injectDeferredObject(args.getString(0), jsWrapper);
        }
        else if (action.equals("injectScriptFile")) {
            String jsWrapper;
            if (args.getBoolean(1)) {
                jsWrapper = String.format("(function(d) { var c = d.createElement('script'); c.src = %%s; c.onload = function() { prompt('', 'gap-iab://%s'); }; d.body.appendChild(c); })(document)", callbackContext.getCallbackId());
            } else {
                jsWrapper = "(function(d) { var c = d.createElement('script'); c.src = %s; d.body.appendChild(c); })(document)";
            }
            injectDeferredObject(args.getString(0), jsWrapper);
        }
        else if (action.equals("injectStyleCode")) {
            String jsWrapper;
            if (args.getBoolean(1)) {
                jsWrapper = String.format("(function(d) { var c = d.createElement('style'); c.innerHTML = %%s; d.body.appendChild(c); prompt('', 'gap-iab://%s');})(document)", callbackContext.getCallbackId());
            } else {
                jsWrapper = "(function(d) { var c = d.createElement('style'); c.innerHTML = %s; d.body.appendChild(c); })(document)";
            }
            injectDeferredObject(args.getString(0), jsWrapper);
        }
        else if (action.equals("injectStyleFile")) {
            String jsWrapper;
            if (args.getBoolean(1)) {
                jsWrapper = String.format("(function(d) { var c = d.createElement('link'); c.rel='stylesheet'; c.type='text/css'; c.href = %%s; d.head.appendChild(c); prompt('', 'gap-iab://%s');})(document)", callbackContext.getCallbackId());
            } else {
                jsWrapper = "(function(d) { var c = d.createElement('link'); c.rel='stylesheet'; c.type='text/css'; c.href = %s; d.head.appendChild(c); })(document)";
            }
            injectDeferredObject(args.getString(0), jsWrapper);
        }
        else if (action.equals("show")) {
            this.cordova.getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    dialog.show();
                }
            });
            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK);
            pluginResult.setKeepCallback(true);
            this.callbackContext.sendPluginResult(pluginResult);
        }
        else {
            return false;
        }
        return true;
    }

    /**
     * Called when the view navigates.
     */
    @Override
    public void onReset() {
        closeDialog();
    }

    /**
     * Called by AccelBroker when listener is to be shut down.
     * Stop listener.
     */
    public void onDestroy() {
        closeDialog();
    }

    /**
     * Inject an object (script or style) into the ThemeableBrowser WebView.
     *
     * This is a helper method for the inject{Script|Style}{Code|File} API calls, which
     * provides a consistent method for injecting JavaScript code into the document.
     *
     * If a wrapper string is supplied, then the source string will be JSON-encoded (adding
     * quotes) and wrapped using string formatting. (The wrapper string should have a single
     * '%s' marker)
     *
     * @param source      The source object (filename or script/style text) to inject into
     *                    the document.
     * @param jsWrapper   A JavaScript string to wrap the source string in, so that the object
     *                    is properly injected, or null if the source string is JavaScript text
     *                    which should be executed directly.
     */
    private void injectDeferredObject(String source, String jsWrapper) {
        String scriptToInject;
        if (jsWrapper != null) {
            org.json.JSONArray jsonEsc = new org.json.JSONArray();
            jsonEsc.put(source);
            String jsonRepr = jsonEsc.toString();
            String jsonSourceString = jsonRepr.substring(1, jsonRepr.length()-1);
            scriptToInject = String.format(jsWrapper, jsonSourceString);
        } else {
            scriptToInject = source;
        }
        final String finalScriptToInject = scriptToInject;
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @SuppressLint("NewApi")
            @Override
            public void run() {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
                    // This action will have the side-effect of blurring the currently focused element
                    inAppWebView.loadUrl("javascript:" + finalScriptToInject);
                } else {
                    inAppWebView.evaluateJavascript(finalScriptToInject, null);
                }
            }
        });
    }

    /**
     * Put the list of features into a hash map
     *
     * @param optString
     * @return
     */
    private Options parseFeature(String optString) {
        Options result = ThemeableBrowserUnmarshaller.JSONToObj(
                optString, Options.class);

        if (result == null) {
            result = new Options();
        }

        // Always show location, this property is overwritten.
        result.location = true;

        return result;
    }

    /**
     * Display a new browser with the specified URL.
     *
     * @param url
     * @return
     */
    public String openExternal(String url) {
        try {
            Intent intent = null;
            intent = new Intent(Intent.ACTION_VIEW);
            // Omitting the MIME type for file: URLs causes "No Activity found to handle Intent".
            // Adding the MIME type to http: URLs causes them to not be handled by the downloader.
            Uri uri = Uri.parse(url);
            if ("file".equals(uri.getScheme())) {
                intent.setDataAndType(uri, webView.getResourceApi().getMimeType(uri));
            } else {
                intent.setData(uri);
            }
			intent.putExtra(Browser.EXTRA_APPLICATION_ID, cordova.getActivity().getPackageName());
            this.cordova.getActivity().startActivity(intent);
            return "";
        } catch (android.content.ActivityNotFoundException e) {
            Log.d(LOG_TAG, "ThemeableBrowser: Error loading url "+url+":"+ e.toString());
            return e.toString();
        }
    }

    /**
     * Closes the dialog
     */
    public void closeDialog() {
        final WebView childView = this.inAppWebView;
        // The JS protects against multiple calls, so this should happen only when
        // closeDialog() is called by other native code.
        if (childView == null) {
            return;
        }
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                childView.setWebViewClient(new WebViewClient() {
                    // NB: wait for about:blank before dismissing
                    public void onPageFinished(WebView view, String url) {
                if (dialog != null) {
                    dialog.dismiss();
                }
            }
        });
                // NB: From SDK 19: "If you call methods on WebView from any thread
                // other than your app's UI thread, it can cause unexpected results."
                // http://developer.android.com/guide/webapps/migrating.html#Threads
                childView.loadUrl("about:blank");
            }
        });

        try {
            JSONObject obj = new JSONObject();
            obj.put("type", EXIT_EVENT);
            sendUpdate(obj, false);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Should never happen");
        }
    }

    private void menuSelected(String event, String url, int menuIndex) {
        if (event != null) {
            try {
                JSONObject obj = new JSONObject();
                obj.put("type", event);
                obj.put("url", url);
                obj.put("menuIndex", menuIndex);
                sendUpdate(obj, true);
            } catch (JSONException e) {
                // Ignore, should never happen.
                Log.d(LOG_TAG, e.toString());
            }
        }
    }

    /**
     * Checks to see if it is possible to go back one page in history, then does so.
     */
    private void goBack() {
        if (this.inAppWebView.canGoBack()) {
            this.inAppWebView.goBack();
        }
    }

    /**
     * Checks to see if it is possible to go forward one page in history, then does so.
     */
    private void goForward() {
        if (this.inAppWebView.canGoForward()) {
            this.inAppWebView.goForward();
        }
    }

    /**
     * Navigate to the new page
     *
     * @param url to load
     */
    private void navigate(String url) {
        InputMethodManager imm = (InputMethodManager)this.cordova.getActivity().getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(edittext.getWindowToken(), 0);

        if (!url.startsWith("http") && !url.startsWith("file:")) {
            this.inAppWebView.loadUrl("http://" + url);
        } else {
            this.inAppWebView.loadUrl(url);
        }
        this.inAppWebView.requestFocus();
    }

    private ThemeableBrowser getThemeableBrowser(){
        return this;
    }

    /**
     * Display a new browser with the specified URL.
     *
     * @param url
     * @param features
     * @return
     */
    public String showWebPage(final String url, final Options features) {
        final CordovaWebView thatWebView = this.webView;

        // Create dialog in new thread
        Runnable runnable = new Runnable() {
            @SuppressLint("NewApi")
            public void run() {
                // Let's create the main dialog
                dialog = new ThemeableBrowserDialog(cordova.getActivity(), android.R.style.Theme_Black_NoTitleBar);
                dialog.getWindow().getAttributes().windowAnimations = android.R.style.Animation_Dialog;
                dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
                dialog.setCancelable(true);
                dialog.setInAppBroswer(getThemeableBrowser());

                // Main container layout
                LinearLayout main = new LinearLayout(cordova.getActivity());
                main.setOrientation(LinearLayout.VERTICAL);

                // Toolbar layout
                FrameLayout toolbar = new FrameLayout(cordova.getActivity());
                toolbar.setBackgroundColor(hexStringToColor(features.toolbarColor));
                toolbar.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, dpToPixels(features.toolbarHeight)));

                if (features.toolbarImage != null) {
                    setBackground(toolbar, features.toolbarImage);
                }

                // Left Button Container layout
                LinearLayout leftButtonContainer = new LinearLayout(cordova.getActivity());
                FrameLayout.LayoutParams leftButtonContainerParams = new FrameLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
                leftButtonContainerParams.gravity = Gravity.LEFT | Gravity.CENTER_VERTICAL;
                leftButtonContainer.setLayoutParams(leftButtonContainerParams);
                leftButtonContainer.setVerticalGravity(Gravity.CENTER_VERTICAL);

                // Right Button Container layout
                LinearLayout rightButtonContainer = new LinearLayout(cordova.getActivity());
                FrameLayout.LayoutParams rightButtonContainerParams = new FrameLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
                rightButtonContainerParams.gravity = Gravity.RIGHT | Gravity.CENTER_VERTICAL;
                rightButtonContainer.setLayoutParams(rightButtonContainerParams);
                rightButtonContainer.setVerticalGravity(Gravity.CENTER_VERTICAL);

                // Back button
                final Button back = new Button(cordova.getActivity());
                back.setLayoutParams(new LinearLayout.LayoutParams(
                        LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT));
                back.setContentDescription("Back Button");
                setBackgroundStates(back,
                        features.backButtonImage,
                        features.backButtonPressedImage, DISABLED_ALPHA);
                back.setEnabled(features.backButtonCanClose);
                back.setVisibility(
                        features.hideBackButton ? View.GONE : View.VISIBLE);
                back.setOnClickListener(new View.OnClickListener() {
                    public void onClick(View v) {
                        if (features.backButtonCanClose
                                && !inAppWebView.canGoBack()) {
                            closeDialog();
                        } else {
                            goBack();
                        }
                    }
                });

                // Forward button
                final Button forward = new Button(cordova.getActivity());
                forward.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT));
                forward.setContentDescription("Forward Button");
                setBackgroundStates(forward, features.forwardButtonImage, features.forwardButtonPressedImage, DISABLED_ALPHA);
                forward.setEnabled(false);
                forward.setVisibility(
                        features.hideForwardButton ? View.GONE : View.VISIBLE);
                forward.setOnClickListener(new View.OnClickListener() {
                    public void onClick(View v) {
                        goForward();
                    }
                });

                // Edit Text Box
                edittext = new EditText(cordova.getActivity());
                RelativeLayout.LayoutParams textLayoutParams = new RelativeLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
                textLayoutParams.addRule(RelativeLayout.RIGHT_OF, 1);
                textLayoutParams.addRule(RelativeLayout.LEFT_OF, 5);
                edittext.setLayoutParams(textLayoutParams);
                edittext.setSingleLine(true);
                edittext.setText(url);
                edittext.setInputType(InputType.TYPE_TEXT_VARIATION_URI);
                edittext.setImeOptions(EditorInfo.IME_ACTION_GO);
                edittext.setInputType(InputType.TYPE_NULL); // Will not except input... Makes the text NON-EDITABLE
                edittext.setOnKeyListener(new View.OnKeyListener() {
                    public boolean onKey(View v, int keyCode, KeyEvent event) {
                        // If the event is a key-down event on the "enter" button
                        if ((event.getAction() == KeyEvent.ACTION_DOWN) && (keyCode == KeyEvent.KEYCODE_ENTER)) {
                            navigate(edittext.getText().toString());
                            return true;
                        }
                        return false;
                    }
                });

                // Close/Done button
                Button close = new Button(cordova.getActivity());
                close.setLayoutParams(new LinearLayout.LayoutParams(
                        LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT));
                close.setContentDescription("Close Button");
                setBackgroundStates(close,
                        features.closeButtonImage,
                        features.closeButtonPressedImage, DISABLED_ALPHA);
                close.setVisibility(
                        features.hideCloseButton ? View.GONE : View.VISIBLE);
                close.setOnClickListener(new View.OnClickListener() {
                    public void onClick(View v) {
                        closeDialog();
                    }
                });

                final TextView title = new TextView(cordova.getActivity());
                FrameLayout.LayoutParams titleParams
                        = new FrameLayout.LayoutParams(
                        LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT);
                titleParams.gravity = Gravity.CENTER;
                title.setLayoutParams(titleParams);
                title.setSingleLine();
                title.setGravity(Gravity.CENTER);
                title.setTextColor(hexStringToColor(features.titleColor));
                title.setVisibility(
                        features.hideTitle ? View.GONE : View.VISIBLE);
                if (features.titleStaticText != null) {
                    title.setText(features.titleStaticText);
                }

                // Menu button
                Spinner menu = new Spinner(cordova.getActivity());
                menu.setLayoutParams(new LinearLayout.LayoutParams(
                        LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT));
                menu.setContentDescription("Menu Button");
                setBackgroundStates(menu,
                        features.menuButtonImage,
                        features.menuButtonPressedImage, DISABLED_ALPHA);
                menu.setVisibility(
                        features.menuItems != null ? View.VISIBLE : View.GONE);
                if (features.menuItems != null) {
                    HideSelectedAdapter<EventLabelPair> adapter
                            = new HideSelectedAdapter<EventLabelPair>(
                            cordova.getActivity(),
                            android.R.layout.simple_spinner_item,
                            features.menuItems);
                    adapter.setDropDownViewResource(
                            android.R.layout.simple_spinner_dropdown_item);
                    menu.setAdapter(adapter);
                    menu.setOnItemSelectedListener(
                            new AdapterView.OnItemSelectedListener() {
                                @Override
                                public void onItemSelected(
                                        AdapterView<?> adapterView,
                                        View view, int i, long l) {
                                    if (features.menuItems != null
                                            && i < features.menuItems.length) {
                                        menuSelected(
                                                features.menuItems[i].event,
                                                inAppWebView.getUrl(), i);
                                    }
                                }

                                @Override
                                public void onNothingSelected(
                                        AdapterView<?> adapterView) {
                                }
                            }
                    );
                }

                // WebView
                inAppWebView = new WebView(cordova.getActivity());
                final LinearLayout.LayoutParams inAppWebViewPrams = new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, 0);
                inAppWebViewPrams.weight = 1;
                inAppWebView.setLayoutParams(inAppWebViewPrams);
                inAppWebView.setWebChromeClient(new InAppChromeClient(thatWebView));
                WebViewClient client = new ThemeableBrowserClient(thatWebView, new PageLoadListener() {
                    @Override
                    public void onPageFinished(String url, boolean canGoBack, boolean canGoForward) {
                        if (features.titleStaticText == null && !features.hideTitle) {
                            title.setText(inAppWebView.getTitle());
                        }

                        back.setEnabled(canGoBack || features.backButtonCanClose);
                        forward.setEnabled(canGoForward);
                    }
                });
                inAppWebView.setWebViewClient(client);
                WebSettings settings = inAppWebView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
                // settings.setBuiltInZoomControls(true);
                settings.setPluginState(android.webkit.WebSettings.PluginState.ON);

                //Toggle whether this is enabled or not!
                Bundle appSettings = cordova.getActivity().getIntent().getExtras();
                boolean enableDatabase = appSettings == null || appSettings.getBoolean("ThemeableBrowserStorageEnabled", true);
                if (enableDatabase) {
                    String databasePath = cordova.getActivity().getApplicationContext().getDir("themeableBrowserDB", Context.MODE_PRIVATE).getPath();
                    settings.setDatabasePath(databasePath);
                    settings.setDatabaseEnabled(true);
                }
                settings.setDomStorageEnabled(true);

                if (features.clearcache) {
                    CookieManager.getInstance().removeAllCookie();
                } else if (features.clearsessioncache) {
                    CookieManager.getInstance().removeSessionCookie();
                }

                inAppWebView.loadUrl(url);
                inAppWebView.getSettings().setLoadWithOverviewMode(true);
                inAppWebView.getSettings().setUseWideViewPort(true);
                inAppWebView.requestFocus();
                inAppWebView.requestFocusFromTouch();

                // Add buttons to either leftButtonsContainer or
                // rightButtonsContainer according to user's alignment
                // configuration.
                int leftContainerWidth = 0;
                int rightContainerWidth = 0;

                if (ALIGN_LEFT.equals(features.navButtonAlign)) {
                    leftButtonContainer.addView(back);
                    leftButtonContainer.addView(forward);
                    leftContainerWidth
                            += back.getVisibility() == View.VISIBLE
                            ? back.getLayoutParams().width : 0;
                    leftContainerWidth
                            += forward.getVisibility() == View.VISIBLE
                            ? forward.getLayoutParams().width : 0;
                } else {
                    rightButtonContainer.addView(forward);
                    rightButtonContainer.addView(back);
                    rightContainerWidth
                            += back.getVisibility() == View.VISIBLE
                            ? back.getLayoutParams().width : 0;
                    rightContainerWidth
                            += forward.getVisibility() == View.VISIBLE
                            ? forward.getLayoutParams().width : 0;
                }

                if (ALIGN_LEFT.equals(features.menuButtonAlign)) {
                    leftButtonContainer.addView(menu, 0);
                    leftContainerWidth
                            += menu.getVisibility() == View.VISIBLE
                            ? menu.getLayoutParams().width : 0;
                } else {
                    rightButtonContainer.addView(menu);
                    rightContainerWidth
                            += menu.getVisibility() == View.VISIBLE
                            ? menu.getLayoutParams().width : 0;
                }

                if (ALIGN_LEFT.equals(features.closeButtonAlign)) {
                    leftButtonContainer.addView(close, 0);
                    leftContainerWidth
                            += close.getVisibility() == View.VISIBLE
                            ? close.getLayoutParams().width : 0;
                } else {
                    rightButtonContainer.addView(close);
                    rightContainerWidth
                            += close.getVisibility() == View.VISIBLE
                            ? close.getLayoutParams().width : 0;
                }

                int titleMargin = Math.max(
                        leftContainerWidth, rightContainerWidth);

                titleParams.setMargins(titleMargin, 0, titleMargin, 0);

                // Add the views to our toolbar
                toolbar.addView(leftButtonContainer);
                // Don't show address bar.
                // toolbar.addView(edittext);
                toolbar.addView(rightButtonContainer);
                toolbar.addView(title);

                // Don't add the toolbar if its been disabled
                if (features.location) {
                    // Add our toolbar to our main view/layout
                    main.addView(toolbar);
                }

                // Add our webview to our main view/layout
                main.addView(inAppWebView);

                WindowManager.LayoutParams lp = new WindowManager.LayoutParams();
                lp.copyFrom(dialog.getWindow().getAttributes());
                lp.width = WindowManager.LayoutParams.MATCH_PARENT;
                lp.height = WindowManager.LayoutParams.MATCH_PARENT;

                dialog.setContentView(main);
                dialog.show();
                dialog.getWindow().setAttributes(lp);
                // the goal of openhidden is to load the url and not display it
                // Show() needs to be called to cause the URL to be loaded
                if(features.hidden) {
                    dialog.hide();
                }
            }
        };
        this.cordova.getActivity().runOnUiThread(runnable);
        return "";
    }

    /**
     * Convert our DIP units to Pixels
     *
     * @return int
     */
    private int dpToPixels(int dipValue) {
        int value = (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                (float) dipValue,
                cordova.getActivity().getResources().getDisplayMetrics()
        );

        return value;
    }

    private int hexStringToColor(String hex) {
        int result = 0;

        if (hex != null && !hex.isEmpty()) {
            if (hex.charAt(0) == '#') {
                hex = hex.substring(1);
            }

            result = (int) Long.parseLong(hex, 16);

            // Almost done, but Android color code is in form of ARGB instead of
            // RGBA, so we gotta shift it a bit.
            int alpha = (result & 0xff) << 24;
            result = result >> 8 & 0xffffff | alpha;
        }

        return result;
    }

    private void setBackgroundStates(View view, String normal, String pressed,
            int disabledAlpha) {
        Resources activityRes = cordova.getActivity().getResources();
        Drawable normalDrawable = null;
        Drawable disabledDrawable = null;
        Drawable pressedDrawable = null;

        try {
            int normalId = activityRes.getIdentifier(
                    normal, "drawable", cordova.getActivity().getPackageName());
            normalDrawable = activityRes.getDrawable(normalId);
            ViewGroup.LayoutParams params = view.getLayoutParams();
            params.width = normalDrawable.getIntrinsicWidth();
            params.height = normalDrawable.getIntrinsicHeight();
        } catch (Resources.NotFoundException e) {
            Log.e(LOG_TAG, String.format(
                    "%s not found as a drawable", normal));
        }

        try {
            int pressedId = activityRes.getIdentifier(
                    pressed, "drawable", cordova.getActivity().getPackageName());
            pressedDrawable = activityRes.getDrawable(pressedId);
        } catch (Resources.NotFoundException e) {
            Log.e(LOG_TAG, String.format(
                    "%s not found as a drawable", pressed));
        }

        if (normalDrawable != null) {
            // Create the disabled state drawable by fading the normal state
            // drawable. Drawable.setAlpha() stopped working above Android 4.4
            // so we gotta bring out some bitmap magic. Credit goes to:
            // http://stackoverflow.com/a/7477572
            Bitmap enabledBitmap = ((BitmapDrawable) normalDrawable).getBitmap();
            Bitmap disabledBitmap = Bitmap.createBitmap(
                    normalDrawable.getIntrinsicWidth(),
                    normalDrawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(disabledBitmap);

            Paint paint = new Paint();
            paint.setAlpha(disabledAlpha);
            canvas.drawBitmap(enabledBitmap, 0, 0, paint);

            disabledDrawable = new BitmapDrawable(activityRes, disabledBitmap);
        }

        StateListDrawable states = new StateListDrawable();
        if (pressedDrawable != null) {
            states.addState(
                    new int[]{
                            android.R.attr.state_pressed
                    },
                    pressedDrawable);
        }
        if (normalDrawable != null) {
            states.addState(
                    new int[]{
                            android.R.attr.state_enabled
                    },
                    normalDrawable);
        }
        if (disabledDrawable != null) {
            states.addState(
                    new int[]{},
                    disabledDrawable);
        }

        setBackground(view, states);
    }

    private void setBackground(View view, String image) {
        Resources activityRes = cordova.getActivity().getResources();

        try {
            int imageId = activityRes.getIdentifier(
                    image, "drawable", cordova.getActivity().getPackageName());
            setBackground(view, activityRes.getDrawable(imageId));
        } catch (Resources.NotFoundException e) {
            Log.e(LOG_TAG, String.format(
                    "%s not found as a drawable", image));
        }
    }

    private void setBackground(View view, Drawable drawable) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN) {
            view.setBackgroundDrawable(drawable);
        } else {
            view.setBackground(drawable);
        }
    }

    /**
     * Create a new plugin success result and send it back to JavaScript
     *
     * @param obj a JSONObject contain event payload information
     */
    private void sendUpdate(JSONObject obj, boolean keepCallback) {
        sendUpdate(obj, keepCallback, PluginResult.Status.OK);
    }

    /**
     * Create a new plugin result and send it back to JavaScript
     *
     * @param obj a JSONObject contain event payload information
     * @param status the status code to return to the JavaScript environment
     */
    private void sendUpdate(JSONObject obj, boolean keepCallback, PluginResult.Status status) {
        if (callbackContext != null) {
            PluginResult result = new PluginResult(status, obj);
            result.setKeepCallback(keepCallback);
            callbackContext.sendPluginResult(result);
            if (!keepCallback) {
                callbackContext = null;
            }
        }
    }

    public static interface PageLoadListener {
        public void onPageFinished(String url, boolean canGoBack,
                boolean canGoForward);
    }

    /**
     * The webview client receives notifications about appView
     */
    public class ThemeableBrowserClient extends WebViewClient {
        PageLoadListener callback;
        CordovaWebView webView;

        /**
         * Constructor.
         *
         * @param webView
         * @param callback
         */
        public ThemeableBrowserClient(CordovaWebView webView,
                PageLoadListener callback) {
            this.webView = webView;
            this.callback = callback;
        }

        /**
         * Notify the host application that a page has started loading.
         *
         * @param view          The webview initiating the callback.
         * @param url           The url of the page.
         */
        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            String newloc = "";
            if (url.startsWith("http:") || url.startsWith("https:") || url.startsWith("file:")) {
                newloc = url;
            }
            // If dialing phone (tel:5551212)
            else if (url.startsWith(WebView.SCHEME_TEL)) {
                try {
                    Intent intent = new Intent(Intent.ACTION_DIAL);
                    intent.setData(Uri.parse(url));
                    cordova.getActivity().startActivity(intent);
                } catch (android.content.ActivityNotFoundException e) {
                    LOG.e(LOG_TAG, "Error dialing " + url + ": " + e.toString());
                }
            }

            else if (url.startsWith("geo:") || url.startsWith(WebView.SCHEME_MAILTO) || url.startsWith("market:")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(Uri.parse(url));
                    cordova.getActivity().startActivity(intent);
                } catch (android.content.ActivityNotFoundException e) {
                    LOG.e(LOG_TAG, "Error with " + url + ": " + e.toString());
                }
            }
            // If sms:5551212?body=This is the message
            else if (url.startsWith("sms:")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);

                    // Get address
                    String address = null;
                    int parmIndex = url.indexOf('?');
                    if (parmIndex == -1) {
                        address = url.substring(4);
                    }
                    else {
                        address = url.substring(4, parmIndex);

                        // If body, then set sms body
                        Uri uri = Uri.parse(url);
                        String query = uri.getQuery();
                        if (query != null) {
                            if (query.startsWith("body=")) {
                                intent.putExtra("sms_body", query.substring(5));
                            }
                        }
                    }
                    intent.setData(Uri.parse("sms:" + address));
                    intent.putExtra("address", address);
                    intent.setType("vnd.android-dir/mms-sms");
                    cordova.getActivity().startActivity(intent);
                } catch (android.content.ActivityNotFoundException e) {
                    LOG.e(LOG_TAG, "Error sending sms " + url + ":" + e.toString());
                }
            }
            else {
                newloc = "http://" + url;
            }

            if (!newloc.equals(edittext.getText().toString())) {
                edittext.setText(newloc);
            }

            try {
                JSONObject obj = new JSONObject();
                obj.put("type", LOAD_START_EVENT);
                obj.put("url", newloc);

                sendUpdate(obj, true);
            } catch (JSONException ex) {
                Log.d(LOG_TAG, "Should never happen");
            }
        }

        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);

            try {
                JSONObject obj = new JSONObject();
                obj.put("type", LOAD_STOP_EVENT);
                obj.put("url", url);

                sendUpdate(obj, true);

                if (this.callback != null) {
                    this.callback.onPageFinished(url, view.canGoBack(),
                            view.canGoForward());
                }
            } catch (JSONException ex) {
                Log.d(LOG_TAG, "Should never happen");
            }
        }

        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            super.onReceivedError(view, errorCode, description, failingUrl);

            try {
                JSONObject obj = new JSONObject();
                obj.put("type", LOAD_ERROR_EVENT);
                obj.put("url", failingUrl);
                obj.put("code", errorCode);
                obj.put("message", description);

                sendUpdate(obj, true, PluginResult.Status.ERROR);
            } catch (JSONException ex) {
                Log.d(LOG_TAG, "Should never happen");
            }
        }
    }

    /**
     * Extension of ArrayAdapter. The only difference is that it hides the
     * selected text that's shown inside spinner.
     * @param <T>
     */
    private static class HideSelectedAdapter<T> extends ArrayAdapter {
        public HideSelectedAdapter(Context context, int resource) {
            super(context, resource);
        }

        public HideSelectedAdapter(Context context, int resource,
                                   int textViewResourceId) {
            super(context, resource, textViewResourceId);
        }

        public HideSelectedAdapter(Context context, int resource, T[] objects) {
            super(context, resource, objects);
        }

        public HideSelectedAdapter(Context context, int resource,
                                   int textViewResourceId, T[] objects) {
            super(context, resource, textViewResourceId, objects);
        }

        public HideSelectedAdapter(Context context, int resource, List<T> objects) {
            super(context, resource, objects);
        }

        public HideSelectedAdapter(Context context, int resource,
                                   int textViewResourceId, List<T> objects) {
            super(context, resource, textViewResourceId, objects);
        }

        public View getView (int position, View convertView, ViewGroup parent) {
            View v = super.getView(position, convertView, parent);
            v.setVisibility(View.GONE);
            return v;
        }
    }


    /**
     * A class to hold parsed option properties.
     */
    private static class Options {
        public boolean location = true;
        public boolean hidden = false;
        public boolean clearcache = false;
        public boolean clearsessioncache = false;

        public int toolbarHeight = 44;
        public String toolbarColor = "#ffffffff";
        public String toolbarImage = null;
        public String backButtonImage = "themeablebrowser_stub_back";
        public String backButtonPressedImage = "themeablebrowser_stub_back_highlight";
        public String forwardButtonImage = "themeablebrowser_stub_forward";
        public String forwardButtonPressedImage = "themeablebrowser_stub_forward_highlight";
        public String closeButtonImage = "themeablebrowser_stub_close";
        public String closeButtonPressedImage = "themeablebrowser_stub_close_highlight";
        public String menuButtonImage = "themeablebrowser_stub_menu";
        public String menuButtonPressedImage = "themeablebrowser_stub_menu_highlight";
        public String titleColor = "#000000ff";
        public String titleStaticText = null;
        public EventLabelPair[] menuItems = null;
        public String closeButtonAlign = ALIGN_LEFT;
        public String navButtonAlign = ALIGN_LEFT;
        public String menuButtonAlign = ALIGN_RIGHT;
        public boolean hideTitle = false;
        public boolean hideCloseButton = false;
        public boolean hideBackButton = false;
        public boolean hideForwardButton = false;
        public boolean backButtonCanClose = false;

    }

    private static class EventLabelPair {
        public String event;
        public String label;

        public String toString() {
            return label;
        }
    }
}
