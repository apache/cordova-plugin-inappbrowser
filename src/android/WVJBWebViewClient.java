package org.apache.cordova.inappbrowser;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.os.Build;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Copied over from https://github.com/jesse01/WebViewJavascriptBridge (commit: b5a7124)
 * Added support of setting message handler outside of construction with the new method registerDefaultHandler()
 */
@SuppressLint({ "SetJavaScriptEnabled", "NewApi" })
public class WVJBWebViewClient extends WebViewClient {

	private static final String kTag = "WVJB";
	private static final String kInterface = kTag + "Interface";
	private static final String kCustomProtocolScheme = "wvjbscheme";
	private static final String kQueueHasMessage = "__WVJB_QUEUE_MESSAGE__";

	private static boolean logging = false;

	protected WebView webView;

	private ArrayList<WVJBMessage> startupMessageQueue = null;
	private Map<String, WVJBResponseCallback> responseCallbacks = null;
	private Map<String, WVJBHandler> messageHandlers = null;
	private long uniqueId = 0;
	private WVJBHandler messageHandler;
	private MyJavascriptInterface myInterface = new MyJavascriptInterface();

	public interface WVJBResponseCallback {
		public void callback(Object data);
	}

	public interface WVJBHandler {
		public void request(Object data, WVJBResponseCallback callback);
	}

	public WVJBWebViewClient(WebView webView) {
		this(webView, null);
	}

	public WVJBWebViewClient(WebView webView, WVJBHandler messageHandler) {
		this.webView = webView;
		this.webView.getSettings().setJavaScriptEnabled(true);
		this.webView.addJavascriptInterface(myInterface, kInterface);
		this.responseCallbacks = new HashMap<String, WVJBResponseCallback>();
		this.messageHandlers = new HashMap<String, WVJBHandler>();
		this.startupMessageQueue = new ArrayList<WVJBMessage>();
		this.messageHandler = messageHandler;
	}

	public void enableLogging() {
		logging = true;
	}

	public void send(Object data) {
		send(data, null);
	}

	public void send(Object data, WVJBResponseCallback responseCallback) {
		sendData(data, responseCallback, null);
	}

	public void callHandler(String handlerName) {
		callHandler(handlerName, null, null);
	}

	public void callHandler(String handlerName, Object data) {
		callHandler(handlerName, data, null);
	}

	public void callHandler(String handlerName, Object data,
			WVJBResponseCallback responseCallback) {
		sendData(data, responseCallback, handlerName);
	}

	public void registerDefaultHandler(WVJBHandler handler) {
		this.messageHandler = handler;
	}

	public void registerHandler(String handlerName, WVJBHandler handler) {
		if (handlerName == null || handlerName.length() == 0 || handler == null)
			return;
		messageHandlers.put(handlerName, handler);
	}

	private void sendData(Object data, WVJBResponseCallback responseCallback,
			String handlerName) {
		if (data == null && (handlerName == null || handlerName.length() == 0))
			return;
		WVJBMessage message = new WVJBMessage();
		if (data != null) {
			message.data = data;
		}
		if (responseCallback != null) {
			String callbackId = "objc_cb_" + (++uniqueId);
			responseCallbacks.put(callbackId, responseCallback);
			message.callbackId = callbackId;
		}
		if (handlerName != null) {
			message.handlerName = handlerName;
		}
		queueMessage(message);
	}

	private void queueMessage(WVJBMessage message) {
		if (startupMessageQueue != null) {
			startupMessageQueue.add(message);
		} else {
			dispatchMessage(message);
		}
	}

	private void dispatchMessage(WVJBMessage message) {
		String messageJSON = message2JSONObject(message).toString()
				.replaceAll("\\\\", "\\\\\\\\").replaceAll("\"", "\\\\\"")
				.replaceAll("\'", "\\\\\'").replaceAll("\n", "\\\\\n")
				.replaceAll("\r", "\\\\\r").replaceAll("\f", "\\\\\f");

		log("SEND", messageJSON);

		executeJavascript("WebViewJavascriptBridge._handleMessageFromObjC('"
				+ messageJSON + "');");
	}

	private JSONObject message2JSONObject(WVJBMessage message) {
		JSONObject jo = new JSONObject();
		try {
			if (message.callbackId != null) {
				jo.put("callbackId", message.callbackId);
			}
			if (message.data != null) {
				jo.put("data", message.data);
			}
			if (message.handlerName != null) {
				jo.put("handlerName", message.handlerName);
			}
			if (message.responseId != null) {
				jo.put("responseId", message.responseId);
			}
			if (message.responseData != null) {
				jo.put("responseData", message.responseData);
			}
		} catch (JSONException e) {
			e.printStackTrace();
		}
		return jo;
	}

	private WVJBMessage JSONObject2WVJBMessage(JSONObject jo) {
		WVJBMessage message = new WVJBMessage();
		try {
			if (jo.has("callbackId")) {
				message.callbackId = jo.getString("callbackId");
			}
			if (jo.has("data")) {
				message.data = jo.get("data");
			}
			if (jo.has("handlerName")) {
				message.handlerName = jo.getString("handlerName");
			}
			if (jo.has("responseId")) {
				message.responseId = jo.getString("responseId");
			}
			if (jo.has("responseData")) {
				message.responseData = jo.get("responseData");
			}
		} catch (JSONException e) {
			e.printStackTrace();
		}
		return message;
	}

	private void flushMessageQueue() {
		String script = "WebViewJavascriptBridge._fetchQueue()";
		executeJavascript(script, new JavascriptCallback() {
			public void onReceiveValue(String messageQueueString) {
				if (messageQueueString == null
						|| messageQueueString.length() == 0)
					return;
				processQueueMessage(messageQueueString);
			}
		});
	}

	private void processQueueMessage(String messageQueueString) {
		try {
			JSONArray messages = new JSONArray(messageQueueString);
			for (int i = 0; i < messages.length(); i++) {
				JSONObject jo = messages.getJSONObject(i);

				log("RCVD", jo);

				WVJBMessage message = JSONObject2WVJBMessage(jo);
				if (message.responseId != null) {
					WVJBResponseCallback responseCallback = responseCallbacks
							.remove(message.responseId);
					if (responseCallback != null) {
						responseCallback.callback(message.responseData);
					}
				} else {
					WVJBResponseCallback responseCallback = null;
					if (message.callbackId != null) {
						final String callbackId = message.callbackId;
						responseCallback = new WVJBResponseCallback() {
							@Override
							public void callback(Object data) {
								WVJBMessage msg = new WVJBMessage();
								msg.responseId = callbackId;
								msg.responseData = data;
								queueMessage(msg);
							}
						};
					}

					WVJBHandler handler;
					if (message.handlerName != null) {
						handler = messageHandlers.get(message.handlerName);
					} else {
						handler = messageHandler;
					}
					if (handler != null) {
						handler.request(message.data, responseCallback);
					}
				}
			}
		} catch (JSONException e) {
			e.printStackTrace();
		}
	}

	void log(String action, Object json) {
		if (!logging)
			return;
		String jsonString = String.valueOf(json);
		if (jsonString.length() > 500) {
			Log.i(kTag, action + ": " + jsonString.substring(0, 500) + " [...]");
		} else {
			Log.i(kTag, action + ": " + jsonString);
		}
	}

	public void executeJavascript(String script) {
		executeJavascript(script, null);
	}

	public void executeJavascript(String script,
			final JavascriptCallback callback) {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
			webView.evaluateJavascript(script, new ValueCallback<String>() {
				@Override
				public void onReceiveValue(String value) {
					if (callback != null) {
						if (value != null && value.startsWith("\"")
								&& value.endsWith("\"")) {
							value = value.substring(1, value.length() - 1)
									.replaceAll("\\\\", "");
						}
						callback.onReceiveValue(value);
					}
				}
			});
		} else {
			if (callback != null) {
				myInterface.addCallback(++uniqueId + "", callback);
				webView.loadUrl("javascript:window." + kInterface
						+ ".onResultForScript(" + uniqueId + "," + script + ")");
			} else {
				webView.loadUrl("javascript:" + script);
			}
		}
	}

	@Override
	public void onPageFinished(WebView view, String url) {
		try {
			InputStream is = webView.getContext().getAssets()
					.open("WebViewJavascriptBridge.js.txt");
			int size = is.available();
			byte[] buffer = new byte[size];
			is.read(buffer);
			is.close();
			String js = new String(buffer);
			executeJavascript(js);
		} catch (IOException e) {
			e.printStackTrace();
		}

		if (startupMessageQueue != null) {
			for (int i = 0; i < startupMessageQueue.size(); i++) {
				dispatchMessage(startupMessageQueue.get(i));
			}
			startupMessageQueue = null;
		}
		super.onPageFinished(view, url);
	}

	@Override
	public boolean shouldOverrideUrlLoading(WebView view, String url) {
		if (url.startsWith(kCustomProtocolScheme)) {
			if (url.indexOf(kQueueHasMessage) > 0) {
				flushMessageQueue();
			}
			return true;
		}
		return super.shouldOverrideUrlLoading(view, url);
	}

	private class WVJBMessage {
		Object data = null;
		String callbackId = null;
		String handlerName = null;
		String responseId = null;
		Object responseData = null;
	}

	private class MyJavascriptInterface {
		Map<String, JavascriptCallback> map = new HashMap<String, JavascriptCallback>();

		public void addCallback(String key, JavascriptCallback callback) {
			map.put(key, callback);
		}

		@JavascriptInterface
		public void onResultForScript(String key, String value) {
			Log.i(kTag, "onResultForScript: " + value);
			JavascriptCallback callback = map.remove(key);
			if (callback != null)
				callback.onReceiveValue(value);
		}
	}

	public interface JavascriptCallback {
		public void onReceiveValue(String value);
	};

}
