package org.apache.cordova.inappbrowser;


import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import org.apache.cordova.LOG;

public final class IntentHandler {
    private static final String LOG_TAG = "InAppBrowser.IntentHandler";
    private  IntentHandler (){ }

    public static Boolean dial(String url, Activity parentActivity){
        try {
            Log.d(LOG_TAG, "loading in dialer");
            Intent intent = new Intent(Intent.ACTION_DIAL);
            intent.setData(Uri.parse(url));
            parentActivity.startActivity(intent);
            return true;
        } catch (android.content.ActivityNotFoundException e) {
            LOG.e(LOG_TAG, "Error dialing " + url + ": " + e.toString());
            return false;
        }
    }

    public static Boolean sms(String url, Activity parentActivity) {
        // If sms:5551212?body=This is the message
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);

            // Get address
            String address = null;
            int parmIndex = url.indexOf('?');
            if (parmIndex == -1) {
                address = url.substring(4);
            } else {
                address = url.substring(4, parmIndex);

                // If body, then set sms body
                Uri uri = Uri.parse(url);
                String query = uri.getQuery();
                if (query != null) {
                    if (query.startsWith("body=")) {
                        intent.putExtra("sms_body", query.substring(5));
                    }
                }
            }
            intent.setData(Uri.parse("sms:" + address));
            intent.putExtra("address", address);
            intent.setType("vnd.android-dir/mms-sms");
            cordova.getActivity().startActivity(intent);
            return true;
        } catch (android.content.ActivityNotFoundException e) {
            LOG.e(LOG_TAG, "Error sending sms " + url + ":" + e.toString());
            return false;
        }
    }

    public static Boolean openDefault(String url, Activity parentActivity) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(Uri.parse(url));
            cordova.getActivity().startActivity(intent);
            return true;
        } catch (android.content.ActivityNotFoundException e) {
            LOG.e(LOG_TAG, "Error with " + url + ": " + e.toString());
            return false;
        }
    }
}