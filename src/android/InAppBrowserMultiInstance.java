package org.apache.cordova.inappbrowsermulti;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.inappbrowser.InAppBrowser;
import org.json.JSONArray;

// IAB Multi-Instance support
public class InAppBrowserMultiInstance {
    private final InAppBrowser browser;

    public InAppBrowserMultiInstance(CordovaPlugin plugin) {
        this.browser = new InAppBrowser();
        this.browser.setPluginData(plugin.cordova, plugin.webView, plugin.webView.getPreferences());
    }

    public void setWindowId(String windowId) {
        this.browser.setWindowId(windowId);
    }

    public void setObserveEventsCallback(CallbackContext observeEventsCallback) {
        this.browser.setObserveEventsCallback(observeEventsCallback);
    }

    public void open(String url, String target, String options, CallbackContext callbackContext) {
        try {
            JSONArray args = new JSONArray();
            args.put(url);
            args.put(target);
            args.put(options);
            browser.execute("open", args, callbackContext);
        } catch (Exception e) {
            callbackContext.error("Error opening browser: " + e.getMessage());
        }
    }

    public void close(CallbackContext callbackContext) {
        JSONArray args = new JSONArray();
        try {
            browser.execute("close", args, callbackContext);
        } catch (Exception e) {
            callbackContext.error("Error closing browser: " + e.getMessage());
        }
    }

    public void show(CallbackContext callbackContext) {
        JSONArray args = new JSONArray();
        try {
            browser.execute("show", args, callbackContext);
        } catch (Exception e) {
            callbackContext.error("Error showing browser: " + e.getMessage());
        }
    }

    public void hide(CallbackContext callbackContext) {
        JSONArray args = new JSONArray();
        try {
            browser.execute("hide", args, callbackContext);
        } catch (Exception e) {
            callbackContext.error("Error hiding browser: " + e.getMessage());
        }
    }

    public void injectStyleCode(JSONArray args, CallbackContext callbackContext) {
        try {
            browser.execute("injectStyleCode", args, callbackContext);
        } catch (Exception e) {
            callbackContext.error("Error injecting style code: " + e.getMessage());
        }
    }

    public void injectStyleFile(JSONArray args, CallbackContext callbackContext) {
        try {
            browser.execute("injectStyleFile", args, callbackContext);
        } catch (Exception e) {
            callbackContext.error("Error injecting style file: " + e.getMessage());
        }
    }

    public void injectScriptCode(JSONArray args, CallbackContext callbackContext) {
        try {
            browser.execute("injectScriptCode", args, callbackContext);
        } catch (Exception e) {
            callbackContext.error("Error injecting script code: " + e.getMessage());
        }
    }

    public void injectScriptFile(JSONArray args, CallbackContext callbackContext) {
        try {
            browser.execute("injectScriptFile", args, callbackContext);
        } catch (Exception e) {
            callbackContext.error("Error injecting script file: " + e.getMessage());
        }
    }

    public void loadAfterBeforload(JSONArray args, CallbackContext callbackContext) {
        try {
            browser.execute("loadAfterBeforeload", args, callbackContext);
        } catch (Exception e) {
            callbackContext.error("Error loading after beforeload: " + e.getMessage());
        }
    }
}
