package org.apache.cordova.inappbrowsermulti;

import java.util.HashMap;
import java.util.Map;

// IAB Multi-Instance support
public class InAppBrowserWindowManager {
    private static InAppBrowserWindowManager instance;
    private final Map<String, InAppBrowserMultiInstance> browsers = new HashMap<>();

    private InAppBrowserWindowManager() {}

    public static synchronized InAppBrowserWindowManager getInstance() {
        if (instance == null) instance = new InAppBrowserWindowManager();
        return instance;
    }

    public synchronized void register(String windowId, InAppBrowserMultiInstance browser) {
        browsers.put(windowId, browser);
    }

    public synchronized InAppBrowserMultiInstance get(String windowId) {
        return browsers.get(windowId);
    }

    public synchronized void unregister(String windowId) {
       browsers.remove(windowId);
    }
}
