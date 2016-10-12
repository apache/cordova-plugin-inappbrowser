package org.apache.cordova.inappbrowser;

import android.util.Log;
import org.apache.cordova.LOG;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

public class BrowserEventSender {

    protected static final String LOG_TAG = "InAppBrowser.BrowserEventSender";

    private static final String LOAD_START_EVENT = "loadstart";
    private static final String LOAD_STOP_EVENT = "loadstop";
    private static final String LOAD_ERROR_EVENT = "loaderror";
    private static final String EXIT_EVENT = "exit";
    private static final String HIDDEN_EVENT = "hidden";
    private static final String UNHIDDEN_EVENT = "unhidden";
    private static final String POLL_RESULT_EVENT = "pollresult";

    private PluginResultSender pluginResultSender;

    public BrowserEventSender(final PluginResultSender foo) {
        pluginResultSender = foo;
    }

    public void loadStart(String newLocation){
        try {
            JSONObject response = CreateResponse(LOAD_START_EVENT);
            response.put("url", newLocation);
            pluginResultSender.ok(response);
        } catch (JSONException ex) {
            LOG.e(LOG_TAG, "URI passed in has caused a JSON error.");
        }
    }

    public void loadStop(String url){
        try {
            JSONObject response = CreateResponse(LOAD_STOP_EVENT);
            response.put("url", url);
            pluginResultSender.ok(response);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build loadstop response object");
        }
    }

    public void pollResult(String scriptResult) {
        try {
            JSONObject responseObject = CreateResponse(POLL_RESULT_EVENT);
            responseObject.put("data", scriptResult);
            pluginResultSender.ok(responseObject);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build poll result response object");
        }
    }

    public void error(String failingUrl, String errorCode, String description){
        try {
            JSONObject response = CreateResponse(LOAD_ERROR_EVENT);
            response.put("url", failingUrl);
            response.put("code", errorCode);
            response.put("message", description);
            pluginResultSender.error(response);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build error response object");
        }
    }

    public void hidden(){
        try {
            JSONObject response = CreateResponse(HIDDEN_EVENT);
            pluginResultSender.ok(response);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build Hidden event object");
        }
    }

    public void unhidden() {
        try {
            JSONObject response = CreateResponse(UNHIDDEN_EVENT);
            pluginResultSender.ok(response);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Failed to build Unhidden event object");
        }
    }

    public void exit() {
        try {
            JSONObject response = CreateResponse(EXIT_EVENT);
            pluginResultSender.closing(response);
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