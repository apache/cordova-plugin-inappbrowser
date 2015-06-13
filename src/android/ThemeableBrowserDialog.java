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

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by Oliver on 22/11/2013.
 */
public class ThemeableBrowserDialog extends Dialog {
    Context context;
    ThemeableBrowser themeableBrowser = null;
    boolean hardwareBack;

    public ThemeableBrowserDialog(Context context, int theme,
          boolean hardwareBack) {
        super(context, theme);
        this.context = context;
        this.hardwareBack = hardwareBack;
    }

    public void setThemeableBrowser(ThemeableBrowser browser) {
        this.themeableBrowser = browser;
    }

    public void onBackPressed () {
        if (this.themeableBrowser == null) {
            this.dismiss();
        } else {
            // better to go through in themeableBrowser because it does a clean
            // up
            if (this.hardwareBack && this.themeableBrowser.canGoBack()) {
                this.themeableBrowser.goBack();
            }  else {
                this.themeableBrowser.closeDialog();
            }
        }
    }
}
