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

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions.Callback;
import android.webkit.JsPromptResult;
import android.webkit.WebChromeClient;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.widget.FrameLayout;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.LOG;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

public class InAppVideoChromeClient extends InAppChromeClient {

    InAppVideoFullScreenHelper helper;
    public InAppVideoChromeClient(CordovaWebView webView ,InAppVideoFullScreenHelper helper) {
        super(webView);
        this.helper = helper;
    }

    @Override
    public void onShowCustomView(View view, CustomViewCallback callback) {
       helper.onShowCustomView(view,callback);
    }

    @Override
    public void onShowCustomView(View view, int requestedOrientation, CustomViewCallback callback) {
        super.onShowCustomView(view,callback);
    }

    @Override
    public void onHideCustomView() {
       helper.onHideCustomView();
    }

    public static class InAppVideoFullScreenHelper {
        Activity activity;
        FrameLayout holder;

        private int originalOrientation;
        private View customView;
        private WebChromeClient.CustomViewCallback customViewCallback;

        public InAppVideoFullScreenHelper(Activity activity, FrameLayout holder) {
            this.activity = activity;
            this.holder = holder;
        }

        public void onShowCustomView(View view, WebChromeClient.CustomViewCallback callback) {
            holder.addView(view, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            customView = view;
            customViewCallback = callback;
            originalOrientation = activity.getRequestedOrientation();
            activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
            holder.setVisibility(View.VISIBLE);
        }

        private void resetValues() {
            activity.setRequestedOrientation(originalOrientation);
            holder.removeView(customView);
            customViewCallback.onCustomViewHidden();
            customView = null;
            customViewCallback = null;
            holder.setVisibility(View.INVISIBLE);
        }

        public void onHideCustomView() {
            if (customView == null) {
                return;
            }
            resetValues();
        }

        public boolean goBack() {
            if (customView == null) {
                return false;
            }
            resetValues();
            return true;
        }
    }

}
