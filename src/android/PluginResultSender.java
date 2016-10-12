import android.util.Log;

import org.apache.cordova.LOG;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;

public class PluginResultSender {

    private CallbackContext callbackContext;

    public PluginResultSender(final CallbackContext foo) {
        callbackContext = foo;
    }

    public void sendClosingUpdate(JSONObject obj) {
        sendUpdate(obj, false, PluginResult.Status.OK);
    }

    public void sendErrorUpdate(JSONObject obj) {
        sendUpdate(obj, true, PluginResult.Status.ERROR);
    }

    public void sendOKUpdate() {
        sendOKUpdate("");
    }

    public void sendOKUpdate(String response) {
        sendUpdate(response, true, PluginResult.Status.OK);
    }

    public void sendUpdate(String response, boolean keepCallback, PluginResult.Status status) {
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
    public void sendOKUpdate(JSONObject obj) {
        sendUpdate(obj, true, PluginResult.Status.OK);
    }

    /**
     * Create a new plugin result and send it back to JavaScript
     *
     * @param obj    a JSONObject contain event payload information
     * @param status the status code to return to the JavaScript environment
     */
    public void sendUpdate(JSONObject obj, boolean keepCallback, PluginResult.Status status) {
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