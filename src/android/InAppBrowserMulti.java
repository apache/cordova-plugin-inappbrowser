package org.apache.cordova.inappbrowsermulti;

import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.UUID;

// IAB Multi-Instance support
public class InAppBrowserMulti extends CordovaPlugin {
    private static final String ACTION_OPEN = "open";
    private static final String ACTION_CLOSE = "close";
    private static final String ACTION_HIDE = "hide";
    private static final String ACTION_SHOW = "show";
    private static final String ACTION_INJECT_SCRIPT_CODE = "injectScriptCode";
    private static final String ACTION_INJECT_SCRIPT_FILE = "injectScriptFile";
    private static final String ACTION_INJECT_STYLE_CODE = "injectStyleCode";
    private static final String ACTION_INJECT_STYLE_FILE = "injectStyleFile";
    private static final String ACTION_LOAD_AFTER_BEFORELOAD = "loadAfterBeforeload";
    private static final String ACTION_OBSERVE_EVENTS = "observeEvents";

    private CallbackContext observeEventsCallback;

    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
        switch (action) {
            case ACTION_OPEN: {
                this.browserOpenAction(args, callbackContext);
                return true;
            }
            case ACTION_CLOSE:
            case ACTION_HIDE:
            case ACTION_SHOW:
            case ACTION_INJECT_SCRIPT_CODE:
            case ACTION_INJECT_SCRIPT_FILE:
            case ACTION_INJECT_STYLE_CODE:
            case ACTION_INJECT_STYLE_FILE:
            case ACTION_LOAD_AFTER_BEFORELOAD: {
                this.browserAction(action, args, callbackContext);
                return true;
            }
            case ACTION_OBSERVE_EVENTS: {
                this.browserObserveEventsAction(callbackContext);
                return true;
            }
            default:
                return false;
        }
    }

    private void browserOpenAction(JSONArray args, CallbackContext callbackContext) {
        InAppBrowserWindowManager manager = InAppBrowserWindowManager.getInstance();

        cordova.getThreadPool().execute(() -> {
            String url = args.optString(0);
            String target = args.optString(1, "_blank");
            String options = args.optString(2, "");
            String providedWindowId = args.length() > 3 ? args.optString(3, null) : null;
            String windowId;

            if (url == null || url.isEmpty()) {
                PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR, "URL is undefined");
                pluginResult.setKeepCallback(false);
                callbackContext.sendPluginResult(pluginResult);
                return;
            }

            if (providedWindowId != null && !providedWindowId.isEmpty()) {
                windowId = providedWindowId;
            } else {
                windowId = UUID.randomUUID().toString();
            }

            InAppBrowserMultiInstance instance = new InAppBrowserMultiInstance(this);

            instance.setWindowId(windowId);
            instance.setObserveEventsCallback(this.observeEventsCallback);

            manager.register(windowId, instance);

            JSONObject result = new JSONObject();
            try {
                result.put("windowId", windowId);
            } catch (JSONException e) {
                PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR, "Cannot provide result");
                pluginResult.setKeepCallback(false);
                callbackContext.sendPluginResult(pluginResult);
                return;
            }

            instance.open(url, target, options, callbackContext);

            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK, result);
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);
        });
    }

    private void browserAction(String action, JSONArray args, CallbackContext callbackContext) {
        InAppBrowserWindowManager manager = InAppBrowserWindowManager.getInstance();

        cordova.getThreadPool().execute(() -> {
            String windowId = args.optString(0);
            InAppBrowserMultiInstance browser = manager.get(windowId);

            if (browser == null) {
                callbackContext.error("Browser not found: " + windowId);
                return;
            }

            if (windowId == null || windowId.isEmpty()) {
                callbackContext.error("Window id is undefined");
                return;
            }

            JSONArray subArgs = new JSONArray();
            for (int i = 1; i < args.length(); i++) {
                try {
                    subArgs.put(args.get(i));
                } catch (JSONException e) {
                    PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR, "Cannot get arguments");
                    pluginResult.setKeepCallback(false);
                    callbackContext.sendPluginResult(pluginResult);
                    return;
                }
            }

            switch (action) {
                case ACTION_CLOSE:
                    browser.close(callbackContext);
                    manager.unregister(windowId);
                    break;
                case ACTION_HIDE:
                    browser.hide(callbackContext);
                    break;
                case ACTION_SHOW:
                    browser.show(callbackContext);
                    break;
                case ACTION_INJECT_SCRIPT_CODE:
                    browser.injectScriptCode(subArgs, callbackContext);
                    break;
                case ACTION_INJECT_SCRIPT_FILE:
                    browser.injectScriptFile(subArgs, callbackContext);
                    break;
                case ACTION_INJECT_STYLE_CODE:
                    browser.injectStyleCode(subArgs, callbackContext);
                    break;
                case ACTION_INJECT_STYLE_FILE:
                    browser.injectStyleFile(subArgs, callbackContext);
                    break;
                case ACTION_LOAD_AFTER_BEFORELOAD:
                    browser.loadAfterBeforload(subArgs, callbackContext);
                    break;
            }
        });
    }

    private void browserObserveEventsAction(CallbackContext callbackContext) {
        this.observeEventsCallback = callbackContext;
        PluginResult result = new PluginResult(PluginResult.Status.OK, "observing events for all browsers");
        result.setKeepCallback(true);
        callbackContext.sendPluginResult(result);
    }
}
