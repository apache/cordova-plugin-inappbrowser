package org.apache.cordova.inappbrowser;

import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.webkit.JavascriptInterface;
import org.apache.cordova.LOG;


public class JavaScriptBridgeInterface {
    protected static final String LOG_TAG = "InAppBrowser.JavaScriptBridgeInterface";
    public static final String JAVASCRIPT_OBJECT_NAME = "JavaScriptBridgeInterfaceObject";

    private Activity _parentActivity;
    private NativeScriptResultHandler _nativeScriptResultHandler;

    public JavaScriptBridgeInterface(Activity parentActivity,
                                          NativeScriptResultHandler nativeScriptResultHandler) {
        _parentActivity = parentActivity;
        _nativeScriptResultHandler = nativeScriptResultHandler;
    }

    @JavascriptInterface
    public String respond(final String response, NativeScriptResultHandler _nativeScriptResultHandler) {
        //TODO: get response back to the client...
        Log.d(LOG_TAG, "respond called *************************************************************************");
        Log.d(LOG_TAG, response);
        Log.d(LOG_TAG, "respond called *************************************************************************");
        _parentActivity.runOnUiThread(new Runnable(){
            @Override
            public void run(){
                _nativeScriptResultHandler.handle(response);
            }
        });

        return response;
    }
}