package org.apache.cordova.inappbrowser;

import android.content.Context;
import android.util.Log;
import android.webkit.JavascriptInterface;
import org.apache.cordova.LOG;


public class JavaScriptBridgeInterface {
    protected static final String LOG_TAG = "InAppBrowser.JavaScriptBridgeInterface";
    public static final String JAVASCRIPT_OBJECT_NAME = "JavaScriptBridgeInterfaceObject";

    private NativeScriptResultHandler _nativeScriptResultHandler;

    public void JavaScriptBridgeInterface(NativeScriptResultHandler nativeScriptResultHandler) {
        _nativeScriptResultHandler = nativeScriptResultHandler;
    }

    @JavascriptInterface
    public String respond(String response, NativeScriptResultHandler _nativeScriptResultHandler) {
        //TODO: get response back to the client...
        Log.d(LOG_TAG, "respond called *************************************************************************");
        Log.d(LOG_TAG, response);
        Log.d(LOG_TAG, "respond called *************************************************************************");
        Activity.runOnUiThread(new Runnable(){
            @Override
            public void run(){
                _nativeScriptResultHandler.handle(response);
            }
        })

        return response;
    }
}