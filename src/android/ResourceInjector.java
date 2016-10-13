package org.apache.cordova.inappbrowser;

import android.app.Activity;
import android.os.Build;
import org.json.JSONArray;

public final class ResourceInjector {
    /**
     * Inject an object (script or style) into the InAppBrowser WebView.
     * <p>
     * This is a helper method for the inject{Script|Style}{Code|File} API calls, which
     * provides a consistent method for injecting JavaScript code into the document.
     * <p>
     * If a wrapper string is supplied, then the source string will be JSON-encoded (adding
     * quotes) and wrapped using string formatting. (The wrapper string should have a single
     * '%s' marker)
     *
     * @param source    The source object (filename or script/style text) to inject into
     *                  the document.
     * @param jsWrapper A JavaScript string to wrap the source string in, so that the object
     *                  is properly injected, or null if the source string is JavaScript text
     *                  which should be executed directly.
     */
    private static void injectDeferredObject(WebView webView, Activity parentActivity, String source, String jsWrapper) {
        String scriptToInject;
        if (jsWrapper != null) {
            org.json.JSONArray jsonEsc = new org.json.JSONArray();
            jsonEsc.put(source);
            String jsonRepr = jsonEsc.toString();
            String jsonSourceString = jsonRepr.substring(1, jsonRepr.length() - 1);
            scriptToInject = String.format(jsWrapper, jsonSourceString);

        } else {
            scriptToInject = source;
        }
        final String finalScriptToInject = scriptToInject;
        parentActivity.runOnUiThread(new Runnable() {
            @SuppressLint("NewApi")
            @Override
            public void run() {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
                    // This action will have the side-effect of blurring the currently focused element
                    webView.loadUrl("javascript:" + finalScriptToInject);
                } else {
                    webView.evaluateJavascript(finalScriptToInject, null);
                }
            }
        });
    }

    public static void injectStyleFile(WebView webView, Activity parentActivity, String sourceFile, boolean hasCallBack, String callbackContextId) {
        String jsWrapper;
        if (hasCallBack) {
            jsWrapper = String.format("(function(d) { var c = d.createElement('link'); c.rel='stylesheet'; c.type='text/css'; c.href = %%s; d.head.appendChild(c); prompt('', 'gap-iab://%s');})(document)", callbackContextId);
        } else {
            jsWrapper = "(function(d) { var c = d.createElement('link'); c.rel='stylesheet'; c.type='text/css'; c.href = %s; d.head.appendChild(c); })(document)";
        }
        injectDeferredObject(webView, parentActivity, sourceFile, jsWrapper);
    }

    public static void injectStyleCode(WebView webView, Activity parentActivity, String cssCode, boolean hasCallBack, String callbackContextId) {
        String jsWrapper;
        if (hasCallBack) {
            jsWrapper = String.format("(function(d) { var c = d.createElement('style'); c.innerHTML = %%s; d.body.appendChild(c); prompt('', 'gap-iab://%s');})(document)", callbackContextId);
        } else {
            jsWrapper = "(function(d) { var c = d.createElement('style'); c.innerHTML = %s; d.body.appendChild(c); })(document)";
        }
        injectDeferredObject(webView, parentActivity, cssCode, jsWrapper);
    }

    public static void injectScriptFile(WebView webView, Activity parentActivity, String sourceFile, boolean hasCallBack, String callbackContextId) {
        String jsWrapper;
        if (hasCallBack) {
            jsWrapper = String.format("(function(d) { var c = d.createElement('script'); c.src = %%s; c.onload = function() { prompt('', 'gap-iab://%s'); }; d.body.appendChild(c); })(document)", callbackContextId);
        } else {
            jsWrapper = "(function(d) { var c = d.createElement('script'); c.src = %s; d.body.appendChild(c); })(document)";
        }
        injectDeferredObject(webView, parentActivity, sourceFile, jsWrapper);
    }

    public static void injectScriptCode(WebView webView, Activity parentActivity, String jsCode, boolean hasCallBack, String callbackContextId) {

        String jsWrapper = hasCallBack ? String.format("(function(){prompt(JSON.stringify([eval(%%s)]), 'gap-iab://%s')})()", callbackContextId) : null;
        injectDeferredObject(webView, parentActivity, jsCode, jsWrapper);
    }
}