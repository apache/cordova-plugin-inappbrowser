import android.util.Log;

import org.apache.cordova.LOG;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

public class BrowserEventSender {

    private static final String LOAD_START_EVENT = "loadstart";
    private static final String LOAD_STOP_EVENT = "loadstop";
    private static final String LOAD_ERROR_EVENT = "loaderror";
    private static final String EXIT_EVENT = "exit";
    private static final String HIDDEN_EVENT = "hidden";
    private static final String UNHIDDEN_EVENT = "unhidden";
    private static final String POLL_RESULT_EVENT = "pollresult";

    private PluginResultSender pluginResultSender;

    public PluginResultSender(final PluginResultSender foo) {
        pluginResultSender = foo;
    }

    public void sendLoadStart(string newLocation){
        try {
            JSONObject response = CreateResponse(LOAD_START_EVENT);
            response.put("url", newLocation);
            sendOKUpdate(response);
        } catch (JSONException ex) {
            LOG.e(LOG_TAG, "URI passed in has caused a JSON error.");
        }
    }

    public void sendLoadStop(String url){
        try {
            JSONObject response = CreateResponse(LOAD_STOP_EVENT);
            response.put("url", url);
            sendOKUpdate(response);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build loadstop response object");
        }
    }

    public void sendPollResult(String scriptResult) {
        try {
            JSONObject responseObject = CreateResponse(POLL_RESULT_EVENT);
            responseObject.put("data", scriptResult);
            pluginResultSender.sendOKUpdate(responseObject);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build poll result response object");
        }
    }

    public void sendError(String failingUrl, String errorCode, String description){
        try {
            JSONObject response = CreateResponse(LOAD_ERROR_EVENT);
            response.put("url", failingUrl);
            response.put("code", errorCode);
            response.put("message", description);
            sendErrorUpdate(response);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build error response object");
        }
    }

    public void sendHiddenEvent(){
        try {
            JSONObject response = CreateResponse(HIDDEN_EVENT);
            pluginResultSender.sendOKUpdate(response);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build Hidden event object");
        }
    }

    public void sendUnhiddenEvent() {
        try {
            JSONObject response = CreateResponse(UNHIDDEN_EVENT);
            pluginResultSender.sendOKUpdate(response);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build Unhidden event object");
        }
    }

    public void sendExitEvent() {
        try {
            JSONObject response = CreateResponse(EXIT_EVENT);
            pluginResultSender.sendClosingUpdate(response);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build exit event object");
        }
    }
    
    private JSONObject CreateResponse(String type) throws JSONException{
        JSONObject response = new JSONObject();
        response.put("type", type);
        return response;
    }
}