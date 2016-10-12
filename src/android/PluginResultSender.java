import android.util.Log;

import org.apache.cordova.LOG;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;

import org.json.JSONObject;

public class PluginResultSender {

    private CallbackContext callbackContext;

    public PluginResultSender(final CallbackContext foo) {
        callbackContext = foo;
    }

    public void closing(JSONObject obj) {
        update(obj, false, PluginResult.Status.OK);
    }

    public void error(JSONObject obj) {
        update(obj, true, PluginResult.Status.ERROR);
    }

    public void ok() {
        ok("");
    }

    public void ok(String response) {
        update(response, true, PluginResult.Status.OK);
    }

    public void update(String response, boolean keepCallback, PluginResult.Status status) {
        if (callbackContext != null) {
            PluginResult pluginResult = new PluginResult(status, response);
            pluginResult.setKeepCallback(keepCallback);
            this.callbackContext.sendPluginResult(pluginResult);
        }
    }

    /**
     * Create a new plugin success result and send it back to JavaScript
     *
     * @param obj a JSONObject contain event payload information
     */
    public void ok(JSONObject obj) {
        update(obj, true, PluginResult.Status.OK);
    }

    /**
     * Create a new plugin result and send it back to JavaScript
     *
     * @param obj    a JSONObject contain event payload information
     * @param status the status code to return to the JavaScript environment
     */
    public void update(JSONObject obj, boolean keepCallback, PluginResult.Status status) {
        if (callbackContext != null) {
            PluginResult result = new PluginResult(status, obj);
            result.setKeepCallback(keepCallback);
            callbackContext.sendPluginResult(result);
            if (!keepCallback) {
                callbackContext = null;
            }
        }
    }
}