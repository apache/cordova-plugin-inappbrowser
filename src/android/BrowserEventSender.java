import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

public class BrowserEventSender {

    private PluginResultSender pluginResultSender;

    public PluginResultSender(final PluginResultSender foo) {
        pluginResultSender = foo;
    }

    public void sendPollResult(String scriptResult) {
        try {
            JSONObject responseObject = new JSONObject();
            responseObject.put("type", "pollresult");
            responseObject.put("data", scriptResult);
            pluginResultSender.sendOKUpdate(responseObject);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Should never happen");
        }
    }

    public void sendHiddenEvent(){
        try {
            JSONObject obj = new JSONObject();
            obj.put("type", HIDDEN_EVENT);
            pluginResultSender.sendOKUpdate(obj);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Should never happen");
        }
    }

    public void sendUnhiddenEvent() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("type", UNHIDDEN_EVENT);
            pluginResultSender.sendOKUpdate(obj);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Should never happen");
        }
    }

    public void sendExitEvent() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("type", EXIT_EVENT);
            pluginResultSender.sendClosingUpdate(obj);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Should never happen");
        }
    }

    public void sendPollResult(String scriptResult) {
        try {
            JSONObject responseObject = new JSONObject();
            responseObject.put("type", "pollresult");
            responseObject.put("data", scriptResult);
            pluginResultSender.sendOKUpdate(responseObject);
        } catch (JSONException ex) {
            Log.d(LOG_TAG, "Should never happen");
        }
    }
}