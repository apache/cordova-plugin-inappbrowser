package org.apache.cordova.inappbrowser;

import android.content.Context;
import android.util.Log;
import android.webkit.JavascriptInterface;

import org.apache.cordova.LOG;



public class JavaScriptBridgeInterface {
    private Context _context;
    protected static final String LOG_TAG = "InAppBrowser.JavaScriptBridgeInterface";

    JavaScriptBridgeInterface (Context context) {
        _context = context;
        Log.d(LOG_TAG, "ctor called");
    }

    @JavascriptInterface
    public void respond(String response) {
        //TODO: get response back to the client...
        Log.d(LOG_TAG, "respond called *************************************************************************");
        Log.d(LOG_TAG, response);
        Log.d(LOG_TAG, "respond called *************************************************************************");
    }
}