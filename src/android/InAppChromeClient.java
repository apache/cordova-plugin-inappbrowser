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

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.LOG;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import android.annotation.TargetApi;
import android.os.Build;
import android.os.Message;
import android.webkit.JsPromptResult;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.GeolocationPermissions.Callback;
import android.webkit.PermissionRequest;

public class InAppChromeClient extends WebChromeClient {

    private CordovaWebView webView;
    private String LOG_TAG = "InAppChromeClient";
    private long MAX_QUOTA = 100 * 1024 * 1024;

    public InAppChromeClient(CordovaWebView webView) {
        super();
        this.webView = webView;
    }
    
    public void onPermissionRequest(final PermissionRequest request) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            request.grant(request.getResources());
        }
    }

    /**
     * Handle database quota exceeded notification.
     *
     * @param url
     * @param databaseIdentifier
     * @param currentQuota
     * @param estimatedSize
     * @param totalUsedQuota
     * @param quotaUpdater
     */
    @Override
    public void onExceededDatabaseQuota(String url, String databaseIdentifier, long currentQuota, long estimatedSize,
            long totalUsedQuota, WebStorage.QuotaUpdater quotaUpdater)
    {
        LOG.d(LOG_TAG, "onExceededDatabaseQuota estimatedSize: %d  currentQuota: %d  totalUsedQuota: %d", estimatedSize, currentQuota, totalUsedQuota);
        quotaUpdater.updateQuota(MAX_QUOTA);
    }

    /**
     * Instructs the client to show a prompt to ask the user to set the Geolocation permission state for the specified origin.
     *
     * @param origin
     * @param callback
     */
    @Override
    public void onGeolocationPermissionsShowPrompt(String origin, Callback callback) {
        super.onGeolocationPermissionsShowPrompt(origin, callback);
        callback.invoke(origin, true, false);
    }

    /**
     * Tell the client to display a prompt dialog to the user.
     * If the client returns true, WebView will assume that the client will
     * handle the prompt dialog and call the appropriate JsPromptResult method.
     *
     * The prompt bridge provided for the InAppBrowser is capable of executing any
     * oustanding callback belonging to the InAppBrowser plugin. Care has been
     * taken that other callbacks cannot be triggered, and that no other code
     * execution is possible.
     *
     * To trigger the bridge, the prompt default value should be of the form:
     *
     * gap-iab://<callbackId>
     *
     * where <callbackId> is the string id of the callback to trigger (something
     * like "InAppBrowser0123456789")
     *
     * If present, the prompt message is expected to be a JSON-encoded value to
     * pass to the callback. A JSON_EXCEPTION is returned if the JSON is invalid.
     *
     * @param view
     * @param url
     * @param message
     * @param defaultValue
     * @param result
     */
    @Override
    public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, JsPromptResult result) {
        // See if the prompt string uses the 'gap-iab' protocol. If so, the remainder should be the id of a callback to execute.
        if (defaultValue != null && defaultValue.startsWith("gap")) {
            if(defaultValue.startsWith("gap-iab://")) {
                PluginResult scriptResult;
                String scriptCallbackId = defaultValue.substring(10);
                if (scriptCallbackId.matches("^InAppBrowser[0-9]{1,10}$")) {
                    if(message == null || message.length() == 0) {
                        scriptResult = new PluginResult(PluginResult.Status.OK, new JSONArray());
                    } else {
                        try {
                            scriptResult = new PluginResult(PluginResult.Status.OK, new JSONArray(message));
                        } catch(JSONException e) {
                            scriptResult = new PluginResult(PluginResult.Status.JSON_EXCEPTION, e.getMessage());
                        }
                    }
                    this.webView.sendPluginResult(scriptResult, scriptCallbackId);
                    result.confirm("");
                    return true;
                }
                else {
                    // Anything else that doesn't look like InAppBrowser0123456789 should end up here
                    LOG.w(LOG_TAG, "InAppBrowser callback called with invalid callbackId : "+ scriptCallbackId);
                    result.cancel();
                    return true;
                }
            }
            else {
                // Anything else with a gap: prefix should get this message
                LOG.w(LOG_TAG, "InAppBrowser does not support Cordova API calls: " + url + " " + defaultValue); 
                result.cancel();
                return true;
            }
        }
        return false;
    }

    /**
     * The InAppWebBrowser WebView is configured to MultipleWindow mode to mitigate a security
     * bug found in Chromium prior to version 83.0.4103.106.
     * See https://bugs.chromium.org/p/chromium/issues/detail?id=1083819
     *
     * Valid Urls set to open in new window will be routed back to load in the original WebView.
     *
     * @param view
     * @param isDialog
     * @param isUserGesture
     * @param resultMsg
     * @return
     */
    @Override
    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
        WebView inAppWebView = view;
        final WebViewClient webViewClient =
                new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        inAppWebView.loadUrl(request.getUrl().toString());
                        return true;
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        inAppWebView.loadUrl(url);
                        return true;
                    }
                };

        final WebView newWebView = new WebView(view.getContext());
        newWebView.setWebViewClient(webViewClient);

        final WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
        transport.setWebView(newWebView);
        resultMsg.sendToTarget();

        return true;
    }
}
