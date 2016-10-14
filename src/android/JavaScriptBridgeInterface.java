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
    public String respond(String response) {
        if(response.equals("[]")){
            return response;
        }

        // The handler is designed to take the result of a standard call, need to wrappered in an array to make
        // consistent with that functionality...
        final String finalResponse = String.format("[%s]", response);

        _parentActivity.runOnUiThread(new Runnable(){
            @Override
            public void run(){
                _nativeScriptResultHandler.handle(finalResponse);
            }
        });

        return response;
    }
}