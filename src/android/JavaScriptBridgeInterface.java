package org.apache.cordova.inappbrowser;

import android.content.Context;
import android.util.Log;
import android.webkit.JavascriptInterface;
import org.apache.cordova.LOG;

import android.widget.Toast; //****************************************************************


public class JavaScriptBridgeInterface {
    private Context _context;
    protected static final String LOG_TAG = "InAppBrowser.JavaScriptBridgeInterface";

    JavaScriptBridgeInterface (Context context) {
        _context = context;
        Log.d(LOG_TAG, "ctor called");
    }

    @JavascriptInterface
    public String toString() {
        //TODO: get response back to the client...
        Toast toast = Toast.makeText(_context, "It Worked!", Toast.LENGTH_LONG);
        toast.show();
        return "Responded...";
//        Log.d(LOG_TAG, "respond called *************************************************************************");
//        Log.d(LOG_TAG, response);
//        Log.d(LOG_TAG, "respond called *************************************************************************");
    }
}