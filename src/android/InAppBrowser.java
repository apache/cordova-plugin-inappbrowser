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
package org.apache.cordova.inappbrowser;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.provider.Browser;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.WindowManager.LayoutParams;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;
import android.webkit.HttpAuthHandler;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.Config;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaHttpAuthHandler;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.LOG;
import org.apache.cordova.PluginManager;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;


import java.util.HashMap;
import java.util.StringTokenizer;
import java.util.Timer;
import java.util.TimerTask;

//Note to future devs - if you have any c# experience
//This looks weird. Java doesn't have the equivalent
//of delegates, this is the way to do it.
//default is like internal in c#
interface NativeScriptResultHandler {
    public boolean handle(String scriptResult);
}

@SuppressLint("SetJavaScriptEnabled")
public class InAppBrowser extends CordovaPlugin {

    private static final String NULL = "null";
    protected static final String LOG_TAG = "InAppBrowser";
    private static final String SELF = "_self";
    private static final String SYSTEM = "_system";

    private static final String BLANK_PAGE_URL = "about:blank";

    private boolean showLocationBar = true;
    private boolean showZoomControls = true;
    private boolean openWindowHidden = false;
    private boolean clearAllCache = false;
    private boolean clearSessionCache = false;
    private boolean hadwareBackButton = true;
    private boolean mediaPlaybackRequiresUserGesture = false;
    private boolean destroyHistoryOnNextPageFinished = false;
    private boolean reOpenOnNextPageFinished = false;
    private boolean hidden = false;
    private boolean hideGoToBlank = false;
    private boolean canOpen = true;

    private InAppBrowserDialog dialog;
    private WebView inAppWebView;
    private EditText edittext;
    private PluginResultSender pluginResultSender;
    private BrowserEventSender browserEventSender;

    private NativeScriptResultHandler nativeScriptResultHandler = new NativeScriptResultHandler() {

        public boolean handle(String scriptResult) {
            try {
                JSONArray returnedArray = new JSONArray(scriptResult);
                JSONObject commandObject = returnedArray.optJSONObject(0);

                if (commandObject == null) {
                    browserEventSender.bridgeResponse(scriptResult);
                    return true;
                }

                String action = commandObject.optString("InAppBrowserAction");

                if (action == null) {
                    browserEventSender.bridgeResponse(scriptResult);
                    return true;
                }

                if (action.equalsIgnoreCase("close")) {
                    closeDialog();
                    return true;
                }
                if (action.equalsIgnoreCase("hide")) {
                    hideGoToBlank = true;
                    hideDialog(false);
                    return true;
                }

                Log.d(LOG_TAG, "The poll script return value looked like it shoud be handled natively, but was not formed correctly (unhandled action) - returning json directly to JS");
                browserEventSender.bridgeResponse(scriptResult);

                return true;
            } catch (JSONException ex) {
                Log.d(LOG_TAG, "Parse Error = " + ex.getMessage());
                try {
                    JSONObject error = new JSONObject();
                    error.put("message", ex.getMessage());
                    pluginResultSender.error(error);
                    return false;
                } catch (JSONException ex2) {
                    Log.d(LOG_TAG, "Should never happen");
                }
            }

            return false;
        }
    };

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action          the action to execute.
     * @param args            JSONArry of arguments for the plugin.
     * @param callbackContext the callbackContext used when calling back into JavaScript.
     * @return A PluginResult object with a status and message.
     */
    public boolean execute(String action, CordovaArgs args, final CallbackContext callbackContext) throws JSONException {
        if (action.equals("open")) {
            if(!canOpen){
                return true;
            }
            canOpen = false;
            pluginResultSender = new PluginResultSender(callbackContext);
            browserEventSender = new BrowserEventSender(pluginResultSender);
            final String url = args.getString(0);
            String t = args.optString(1);
            if (t == null || t.equals("") || t.equals(NULL)) {
                t = SELF;
            }
            final String target = t;
            final HashMap<String, Boolean> features = parseFeature(args.optString(2));

            Log.d(LOG_TAG, "target = " + target);

            OpenOnNewThread(url, target, features);
            return true;
        }
        if (action.equals("close")) {
            closeDialog();
            return true;
        }
        if (action.equals("injectScriptCode")) {
            ResourceInjector.injectScriptCode(inAppWebView,
                    cordova.getActivity(),
                    args.getString(0),
                    args.getBoolean(1),
                    callbackContext.getCallbackId());
            return true;
        }
        if (action.equals("injectScriptFile")) {
            ResourceInjector.injectScriptFile(inAppWebView,
                    cordova.getActivity(),
                    args.getString(0),
                    args.getBoolean(1),
                    callbackContext.getCallbackId());
            return true;
        }

        if (action.equals("injectStyleCode")) {
            ResourceInjector.injectStyleCode(inAppWebView,
                    cordova.getActivity(),
                    args.getString(0),
                    args.getBoolean(1),
                    callbackContext.getCallbackId());
            return true;
        }
        if (action.equals("injectStyleFile")) {
            final String callbackContextId = callbackContext.getCallbackId();
            ResourceInjector.injectStyleFile(inAppWebView,
                    cordova.getActivity(),
                    args.getString(0),
                    args.getBoolean(1),
                    callbackContext.getCallbackId());
            return true;
        }
        if (action.equals("show")) {
            showDialogue();
            return true;
        }

        if (action.equals("hide")) {
            final boolean releaseResources = args.isNull(0) ? false : args.getBoolean(0);
            hideGoToBlank = args.isNull(1) ? false : args.getBoolean(1);
            hideDialog(releaseResources);
            return true;
        }

        if (action.equals("unHide")) {
            if(!canOpen){
                return true;
            }
            canOpen = false;
            final String url = args.isNull(0) ? null : args.getString(0);
            unHideDialog(url);
            return true;
        }

        if (action.equals("update")) {
            if (!canOpen) {
                return true;
            }

            canOpen = false;

            final String url = args.isNull(0) ? null : args.getString(0);
            final boolean show = args.isNull(1) ? true : args.getBoolean(1);

            updateDialog(url, show);

            return true;
        }

        return false;
    }

    private void OpenOnNewThread(final String url, final String target, final HashMap<String, Boolean> features) {
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                String result = "";
                // SELF
                if (SELF.equals(target)) {
                    LOG.d(LOG_TAG, "in self");
                    /* This code exists for compatibility between 3.x and 4.x versions of Cordova.
                     * Previously the Config class had a static method, isUrlWhitelisted(). That
                     * responsibility has been moved to the plugins, with an aggregating method in
                     * PluginManager.
                     */
                    Boolean shouldAllowNavigation = UrlSecurityValidation.shouldAllowNavigation(webView, url);
                    // load in webview
                    if (Boolean.TRUE.equals(shouldAllowNavigation)) {
                        Log.d(LOG_TAG, "loading in webview");
                        webView.loadUrl(url);
                    }
                    //Load the dialer
                    else if (url.startsWith(WebView.SCHEME_TEL)) {
                        IntentHandler.dial(url, cordova.getActivity());
                    }
                    // load in InAppBrowser
                    else {
                        Log.d(LOG_TAG, "loading in InAppBrowser");
                        result = showWebPage(url, features);
                    }
                }
                // BLANK - or anything else
                else {
                    Log.d(LOG_TAG, "in blank");
                    result = showWebPage(url, features);
                }

                pluginResultSender.ok(result);
            }
        });
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
     * Put the list of features into a hash map
     *
     * @param optString
     * @return
     */
    private HashMap<String, Boolean> parseFeature(String optString) {
        if (optString.equals(NULL)) {
            return null;
        } else {
            HashMap<String, Boolean> map = new HashMap<String, Boolean>();
            StringTokenizer features = new StringTokenizer(optString, ",");
            StringTokenizer option;
            while (features.hasMoreElements()) {
                option = new StringTokenizer(features.nextToken(), "=");
                if (option.hasMoreElements()) {
                    String key = option.nextToken();
                    Boolean value = option.nextToken().equals("no") ? Boolean.FALSE : Boolean.TRUE;
                    map.put(key, value);
                }
            }
            return map;
        }
    }

    /**
     * hides the dialog without destroying the instance if goToBlank is true
     * the browser is navigated to about blank, this can be used to preserve
     * system resources
     *
     * @param goToBlank
     * @return
     */
    private void hideDialog(final boolean releaseResources) {
        if(hidden){
            return;
        }

        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {

                if (null == inAppWebView || null == dialog) {
                    return;
                }
                hidden = true;
                if (releaseResources) {
                    destroyHistoryOnNextPageFinished = true;
                }

                dialog.hide();
                if (hideGoToBlank) {
                    inAppWebView.loadUrl(BLANK_PAGE_URL);
                }

                browserEventSender.hidden();
            }
        });
    }

    /**
     * un-hides the dialog - will work if the dialog has been started hidden
     * and not show. Passing a URL will navigate to that page and, when the
     * on loaded event is raised show it.
     * system resources
     *
     * @param url
     * @return
     */
    private void unHideDialog(final String url) {
        if (url == null || url.equals("") || url.equals(NULL)) {
            addBridgeInterface();
            showDialogue();
            return;
        }

        if (!UrlSecurityValidation.shouldAllowRequest(webView, url)) {
            return;
        }

        addBridgeInterface();

        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {

                if (null == inAppWebView || null == inAppWebView.getUrl()) {
                    return;
                }

                if (inAppWebView.getUrl().equals(url)) {
                    //unhidden event & reset of hidden flag done in this method ...
                    showDialogue();
                } else {
                    //unhidden event & reset of hidden flag done in onPageFinished which results from this navigate ...
                    reOpenOnNextPageFinished = true;
                    navigate(url);
                }
            }
        });
    }

    private void updateDialog(final String url, final boolean show) {
        if (null == url || url.trim().isEmpty()) {
            addBridgeInterface();

            if (show) {
                showDialogue();
            }

            return;
        }

        if (!UrlSecurityValidation.shouldAllowRequest(webView, url)) {
            return;
        }

        addBridgeInterface();

        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (null == inAppWebView || null == inAppWebView.getUrl()) {
                    return;
                }

                if (inAppWebView.getUrl().equals(url)) {
                    if (show) {
                        showDialogue();
                    } else {
                        browserEventSender.loadStop(url);
                        canOpen = true;
                    }
                } else {
                    if (show) {
                        reOpenOnNextPageFinished = true;
                    }

                    navigate(url);
                }
            }
        });
    }


    /**
     * Shows the dialog in the standard way
     *
     * @param
     * @return
     */
    private void showDialogue() {
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (dialog != null) {
                    dialog.show();
                }
                if(hidden) {
                    browserEventSender.unhidden();
                    hidden = false;
                }
            }
        });
    }

    /**
     * Determines whether the dialog can navigate to the URL
     *
     * @param url
     * @return true if navigable, otherwise false or null
     */
    public Boolean shouldAllowNavigation(String url) {
        return UrlSecurityValidation.shouldAllowNavigation(webView, url);
    }

    /**
     * Closes the dialog
     */
    public void closeDialog() {
        this.cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                final WebView childView = inAppWebView;
                // The JS protects against multiple calls, so this should happen only when
                // closeDialog() is called by other native code.
                if (childView == null) {
                    return;
                }

                childView.setWebViewClient(new WebViewClient() {
                    // NB: wait for about:blank before dismissing
                    public void onPageFinished(WebView view, String url) {
                        if (dialog != null) {
                            dialog.dismiss();
                            dialog = null;
                            childView.destroy();
                        }
                    }
                });
                // NB: From SDK 19: "If you call methods on WebView from any thread
                // other than your app's UI thread, it can cause unexpected results."
                // http://developer.android.com/guide/webapps/migrating.html#Threads
                childView.loadUrl(BLANK_PAGE_URL);
                browserEventSender.exit();
            }
        });
    }

    /**
     * Checks to see if it is possible to go back one page in history, then does so.
     */
    public void goBack() {
        if (this.inAppWebView.canGoBack()) {
            this.inAppWebView.goBack();
        }
    }

    /**
     * Can the web browser go back?
     *
     * @return boolean
     */
    public boolean canGoBack() {
        return this.inAppWebView.canGoBack();
    }

    /**
     * Has the user set the hardware back button to go back
     *
     * @return boolean
     */
    public boolean hardwareBack() {
        return hadwareBackButton;
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
        InputMethodManager imm = (InputMethodManager) this.cordova.getActivity().getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(edittext.getWindowToken(), 0);

        if (!url.startsWith("http") && !url.startsWith("file:")) {
            this.inAppWebView.loadUrl("http://" + url);
        } else {
            this.inAppWebView.loadUrl(url);
        }
        this.inAppWebView.requestLayout();
        this.inAppWebView.requestFocus();
    }

    /**
     * Should we show the location bar?
     *
     * @return boolean
     */
    private boolean getShowLocationBar() {
        return this.showLocationBar;
    }

    private InAppBrowser getInAppBrowser() {
        return this;
    }

    /**
     * Display a new browser with the specified URL.
     *
     * @param url      the url to load.
     * @param features jsonObject
     */
    public String showWebPage(final String url, HashMap<String, Boolean> features) {
        // Determine if we should hide the location bar.
        showLocationBar = true;
        showZoomControls = true;
        openWindowHidden = false;
        mediaPlaybackRequiresUserGesture = false;

        final String LOCATION = "location";
        final String ZOOM = "zoom";
        final String HIDDEN = "hidden";
        final String HARDWARE_BACK_BUTTON = "hardwareback";
        final String MEDIA_PLAYBACK_REQUIRES_USER_ACTION = "mediaPlaybackRequiresUserAction";
        final String CLEAR_ALL_CACHE = "clearcache";
        final String CLEAR_SESSION_CACHE = "clearsessioncache";

        if (features != null) {
            Boolean show = features.get(LOCATION);
            if (show != null) {
                showLocationBar = show.booleanValue();
            }
            Boolean zoom = features.get(ZOOM);
            if (zoom != null) {
                showZoomControls = zoom.booleanValue();
            }
            Boolean hidden = features.get(HIDDEN);
            if (hidden != null) {
                openWindowHidden = hidden.booleanValue();
            }
            Boolean hardwareBack = features.get(HARDWARE_BACK_BUTTON);
            if (hardwareBack != null) {
                hadwareBackButton = hardwareBack.booleanValue();
            }
            Boolean mediaPlayback = features.get(MEDIA_PLAYBACK_REQUIRES_USER_ACTION);
            if (mediaPlayback != null) {
                mediaPlaybackRequiresUserGesture = mediaPlayback.booleanValue();
            }
            Boolean cache = features.get(CLEAR_ALL_CACHE);
            if (cache != null) {
                clearAllCache = cache.booleanValue();
            } else {
                cache = features.get(CLEAR_SESSION_CACHE);
                if (cache != null) {
                    clearSessionCache = cache.booleanValue();
                }
            }
        }

        final CordovaWebView thatWebView = this.webView;

        // Create dialog in new thread
        Runnable runnable = new Runnable() {
            /**
             * Convert our DIP units to Pixels
             *
             * @return int
             */
            private int dpToPixels(int dipValue) {
                int value = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP,
                        (float) dipValue,
                        cordova.getActivity().getResources().getDisplayMetrics()
                );

                return value;
            }

            @SuppressLint("NewApi")
            public void run() {

                // CB-6702 InAppBrowser hangs when opening more than one instance
                if (dialog != null) {
                    dialog.dismiss();
                }
                ;

                // Let's create the main dialog
                dialog = new InAppBrowserDialog(cordova.getActivity(), android.R.style.Theme_NoTitleBar);
                dialog.getWindow().getAttributes().windowAnimations = android.R.style.Animation_Dialog;
                dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
                dialog.setCancelable(true);
                dialog.setInAppBroswer(getInAppBrowser());

                // Main container layout
                LinearLayout main = new LinearLayout(cordova.getActivity());
                main.setOrientation(LinearLayout.VERTICAL);

                // Toolbar layout
                RelativeLayout toolbar = new RelativeLayout(cordova.getActivity());
                //Please, no more black!
                toolbar.setBackgroundColor(android.graphics.Color.LTGRAY);
                toolbar.setLayoutParams(new RelativeLayout.LayoutParams(LayoutParams.MATCH_PARENT, this.dpToPixels(44)));
                toolbar.setPadding(this.dpToPixels(2), this.dpToPixels(2), this.dpToPixels(2), this.dpToPixels(2));
                toolbar.setHorizontalGravity(Gravity.LEFT);
                toolbar.setVerticalGravity(Gravity.TOP);

                // Action Button Container layout
                RelativeLayout actionButtonContainer = new RelativeLayout(cordova.getActivity());
                actionButtonContainer.setLayoutParams(new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT));
                actionButtonContainer.setHorizontalGravity(Gravity.LEFT);
                actionButtonContainer.setVerticalGravity(Gravity.CENTER_VERTICAL);
                actionButtonContainer.setId(Integer.valueOf(1));

                // Back button
                ImageButton back = new ImageButton(cordova.getActivity());
                RelativeLayout.LayoutParams backLayoutParams = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT);
                backLayoutParams.addRule(RelativeLayout.ALIGN_LEFT);
                back.setLayoutParams(backLayoutParams);
                back.setContentDescription("Back Button");
                back.setId(Integer.valueOf(2));
                Resources activityRes = cordova.getActivity().getResources();
                int backResId = activityRes.getIdentifier("ic_action_previous_item", "drawable", cordova.getActivity().getPackageName());
                Drawable backIcon = activityRes.getDrawable(backResId);
                back.setBackground(null);
                back.setImageDrawable(backIcon);
                back.setScaleType(ImageView.ScaleType.FIT_CENTER);
                back.setPadding(0, this.dpToPixels(10), 0, this.dpToPixels(10));
                back.getAdjustViewBounds();

                back.setOnClickListener(new View.OnClickListener() {
                    public void onClick(View v) {
                        goBack();
                    }
                });

                // Forward button
                ImageButton forward = new ImageButton(cordova.getActivity());
                RelativeLayout.LayoutParams forwardLayoutParams = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT);
                forwardLayoutParams.addRule(RelativeLayout.RIGHT_OF, 2);
                forward.setLayoutParams(forwardLayoutParams);
                forward.setContentDescription("Forward Button");
                forward.setId(Integer.valueOf(3));
                int fwdResId = activityRes.getIdentifier("ic_action_next_item", "drawable", cordova.getActivity().getPackageName());
                Drawable fwdIcon = activityRes.getDrawable(fwdResId);
                forward.setBackground(null);
                forward.setImageDrawable(fwdIcon);
                forward.setScaleType(ImageView.ScaleType.FIT_CENTER);
                forward.setPadding(0, this.dpToPixels(10), 0, this.dpToPixels(10));
                forward.getAdjustViewBounds();

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
                edittext.setId(Integer.valueOf(4));
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
                ImageButton close = new ImageButton(cordova.getActivity());
                RelativeLayout.LayoutParams closeLayoutParams = new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.MATCH_PARENT);
                closeLayoutParams.addRule(RelativeLayout.ALIGN_PARENT_RIGHT);
                close.setLayoutParams(closeLayoutParams);
                forward.setContentDescription("Close Button");
                close.setId(Integer.valueOf(5));
                int closeResId = activityRes.getIdentifier("ic_action_remove", "drawable", cordova.getActivity().getPackageName());
                Drawable closeIcon = activityRes.getDrawable(closeResId);
                close.setBackground(null);
                close.setImageDrawable(closeIcon);
                close.setScaleType(ImageView.ScaleType.FIT_CENTER);
                back.setPadding(0, this.dpToPixels(10), 0, this.dpToPixels(10));
                close.getAdjustViewBounds();

                close.setOnClickListener(new View.OnClickListener() {
                    public void onClick(View v) {
                        closeDialog();
                    }
                });

                // WebView
                inAppWebView = new WebView(cordova.getActivity());
                inAppWebView.setLayoutParams(new LinearLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
                inAppWebView.setId(Integer.valueOf(6));
                //TODO
                inAppWebView.setWebChromeClient(new InAppChromeClient(nativeScriptResultHandler, thatWebView));
                WebViewClient client = new InAppBrowserClient(thatWebView, edittext);
                inAppWebView.setWebViewClient(client);
                WebSettings settings = inAppWebView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setJavaScriptCanOpenWindowsAutomatically(true);
                settings.setBuiltInZoomControls(showZoomControls);
                settings.setPluginState(android.webkit.WebSettings.PluginState.ON);

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.JELLY_BEAN_MR1) {
                    settings.setMediaPlaybackRequiresUserGesture(mediaPlaybackRequiresUserGesture);
                }

                String overrideUserAgent = preferences.getString("OverrideUserAgent", null);
                String appendUserAgent = preferences.getString("AppendUserAgent", null);

                if (overrideUserAgent != null) {
                    settings.setUserAgentString(overrideUserAgent);
                }
                if (appendUserAgent != null) {
                    settings.setUserAgentString(settings.getUserAgentString() + appendUserAgent);
                }

                //Toggle whether this is enabled or not!
                Bundle appSettings = cordova.getActivity().getIntent().getExtras();
                boolean enableDatabase = appSettings == null ? true : appSettings.getBoolean("InAppBrowserStorageEnabled", true);
                if (enableDatabase) {
                    String databasePath = cordova.getActivity()
                            .getApplicationContext()
                            .getDir("inAppBrowserDB", Context.MODE_PRIVATE).getPath();
                    settings.setDatabasePath(databasePath);
                    settings.setDatabaseEnabled(true);
                }
                settings.setDomStorageEnabled(true);

                if (clearAllCache) {
                    CookieManager.getInstance().removeAllCookie();
                } else if (clearSessionCache) {
                    CookieManager.getInstance().removeSessionCookie();
                }

                addBridgeInterface();

                inAppWebView.loadUrl(url);
                inAppWebView.setId(Integer.valueOf(6));
                inAppWebView.getSettings().setLoadWithOverviewMode(true);
                inAppWebView.getSettings().setUseWideViewPort(true);
                inAppWebView.requestFocus();
                inAppWebView.requestFocusFromTouch();


                // Add the back and forward buttons to our action button container layout
                actionButtonContainer.addView(back);
                actionButtonContainer.addView(forward);

                // Add the views to our toolbar
                toolbar.addView(actionButtonContainer);
                toolbar.addView(edittext);
                toolbar.addView(close);

                // Don't add the toolbar if its been disabled
                if (getShowLocationBar()) {
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
                if (openWindowHidden) {
                    dialog.hide();
                }
            }
        };
        this.cordova.getActivity().runOnUiThread(runnable);
        return "";
    }

    private void addBridgeInterface() {
        cordova.getActivity().runOnUiThread(new Runnable(){
            @Override
            public void run(){
                inAppWebView.addJavascriptInterface(new JavaScriptBridgeInterface(cordova.getActivity(),
                                nativeScriptResultHandler),
                        JavaScriptBridgeInterface.JAVASCRIPT_OBJECT_NAME);
            }
        });
    }

    /**
     * The webview client receives notifications about appView
     */
    public class InAppBrowserClient extends WebViewClient {
        EditText edittext;
        CordovaWebView webView;

        /**
         * Constructor.
         *
         * @param webView
         * @param mEditText
         */
        public InAppBrowserClient(CordovaWebView webView, EditText mEditText) {
            this.webView = webView;
            this.edittext = mEditText;
        }

        /**
         * Override the URL that should be loaded
         * <p>
         * This handles a small subset of all the URIs that would be encountered.
         *
         * @param webView
         * @param url
         */
        @Override
        public boolean shouldOverrideUrlLoading(WebView webView, String url) {
            if (url.startsWith(WebView.SCHEME_TEL)) {
                return IntentHandler.dial(url, cordova.getActivity());
            }
            if (url.startsWith("geo:") || url.startsWith(WebView.SCHEME_MAILTO) || url.startsWith("market:")) {
                return IntentHandler.openDefault(url, cordova.getActivity());
            }
            if (url.startsWith("sms:")) {
                return IntentHandler.sms(url, cordova.getActivity());
            }
            return false;
        }


        /*
         * onPageStarted fires the LOAD_START_EVENT
         *
         * @param view
         * @param url
         * @param favicon
         */
        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            String newloc = "";
            if (url.equals(BLANK_PAGE_URL)
                    || url.startsWith("http:")
                    || url.startsWith("https:")
                    || url.startsWith("file:")) {
                newloc = url;
            } else {
                // Assume that everything is HTTP at this point, because if we don't specify,
                // it really should be.  Complain loudly about this!!!
                LOG.e(LOG_TAG, "Possible Uncaught/Unknown URI");
                newloc = "http://" + url;
            }

            // Update the UI if we haven't already
            if (!newloc.equals(edittext.getText().toString())) {
                edittext.setText(newloc);
            }

            browserEventSender.loadStart(newloc);
        }

        public void onPageFinished(WebView view, String url) {


            // CB-10395 InAppBrowser's WebView not storing cookies reliable to local device storage
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                CookieManager.getInstance().flush();
            } else {
                CookieSyncManager.getInstance().sync();
            }

            if (destroyHistoryOnNextPageFinished) {
                destroyHistoryOnNextPageFinished = false;
                view.clearHistory();
            }

            if (reOpenOnNextPageFinished) {
                reOpenOnNextPageFinished = false;
                showDialogue();
            }

            if(url == BLANK_PAGE_URL) {
                destroyHistoryOnNextPageFinished = false;
            }

            super.onPageFinished(view, url);

            if(url.equals(BLANK_PAGE_URL)) {
                destroyHistoryOnNextPageFinished = true;
            }

            if(!hideGoToBlank) {
                //Don't notify about loading blank page or being unhidden
                browserEventSender.loadStop(url);
                if (hidden) {
                    browserEventSender.unhidden();
                    hidden = false;
                }
            }

            hideGoToBlank = false;
            canOpen = true;
        }

        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            super.onReceivedError(view, errorCode, description, failingUrl);
            browserEventSender.error(failingUrl, errorCode, description);
            canOpen = true;
        }

        /**
         * On received http auth request.
         */
        @Override
        public void onReceivedHttpAuthRequest(WebView view, HttpAuthHandler handler, String host, String realm) {

            // Check if there is some plugin which can resolve this auth challenge
            PluginManager pluginManager = null;
            try {
                Method gpm = webView.getClass().getMethod("getPluginManager");
                pluginManager = (PluginManager) gpm.invoke(webView);
            } catch (NoSuchMethodException e) {
            } catch (IllegalAccessException e) {
            } catch (InvocationTargetException e) {
            }

            if (pluginManager == null) {
                try {
                    Field pmf = webView.getClass().getField("pluginManager");
                    pluginManager = (PluginManager) pmf.get(webView);
                } catch (NoSuchFieldException e) {
                } catch (IllegalAccessException e) {
                }
            }

            if (pluginManager != null && pluginManager.onReceivedHttpAuthRequest(webView, new CordovaHttpAuthHandler(handler), host, realm)) {
                return;
            }

            // By default handle 401 like we'd normally do!
            super.onReceivedHttpAuthRequest(view, handler, host, realm);
        }
    }
}
