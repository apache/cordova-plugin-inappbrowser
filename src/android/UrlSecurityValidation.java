package org.apache.cordova.inappbrowser;

import java.lang.reflect.Method;
import org.apache.cordova.Config;
import org.apache.cordova.PluginManager;
import org.apache.cordova.CordovaWebView;

public final class UrlSecurityValidation {
    /**
     * Determines whether the dialog can navigate to the URL
     * This allows us to specifiy the type of navgation
     *
     * @param url
     * @return true if navigable, otherwise false or null
     */
    private static Boolean shouldAllowNavigation(final webView, final String url, final String pluginManagerMethod) {
        Boolean shouldAllowNavigation = null;

        if (url.startsWith("javascript:")) {
            shouldAllowNavigation = true;
        }
        if (shouldAllowNavigation == null) {
            try {
                Method iuw = Config.class.getMethod("isUrlWhiteListed", String.class);
                shouldAllowNavigation = (Boolean) iuw.invoke(null, url);
            } catch (NoSuchMethodException e) {
            } catch (IllegalAccessException e) {
            } catch (InvocationTargetException e) {
            }
        }
        if (shouldAllowNavigation == null) {
            try {
                Method gpm = webView.getClass().getMethod("getPluginManager");
                PluginManager pm = (PluginManager) gpm.invoke(webView);
                Method san = pm.getClass().getMethod(pluginManagerMethod, String.class);
                shouldAllowNavigation = (Boolean) san.invoke(pm, url);
            } catch (NoSuchMethodException e) {
            } catch (IllegalAccessException e) {
            } catch (InvocationTargetException e) {
            }
        }
        return shouldAllowNavigation;
    }

    private UrlSecurityValidation(){
        //This declaring the class as final, then making the ctor private is as close
        //to static as you can get for a non-nested class in Java.
    }

    public static Boolean shouldAllowRequest(CordovaWebView webView, String url) {
        return shouldAllowNavigation(webView, url, "shouldAllowRequest");
    }

    public static Boolean shouldNavigation(CordovaWebView webView, String url) {
        return shouldAllowNavigation(webView, url, "shouldAllowRequest");
    }
}