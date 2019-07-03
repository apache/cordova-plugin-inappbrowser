package org.apache.cordova.inappbrowser;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import org.apache.cordova.CordovaWebView;
import org.json.JSONException;

//Download Files imports
import android.app.DownloadManager;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.widget.Toast;

import static android.content.Context.DOWNLOAD_SERVICE;

//Permissions
import android.content.pm.PackageManager;

public class InAppBrowserDownloads implements DownloadListener{

    InAppBrowser plugin;

    String url;
    String userAgent;
    String contentDisposition;
    String mimetype;
    long contentLength;

    public InAppBrowserDownloads(InAppBrowser plugin) {
        this.plugin = plugin;
    }


    public void onDownloadStart(String url, String userAgent,
                                String contentDisposition, String mimetype,
                                long contentLength) {

        InAppBrowserDownloads.this.url = url;
        InAppBrowserDownloads.this.userAgent = userAgent;
        InAppBrowserDownloads.this.contentDisposition = contentDisposition;
        InAppBrowserDownloads.this.mimetype = mimetype;
        InAppBrowserDownloads.this.contentLength = contentLength;


        if (Build.VERSION.SDK_INT >= 23) {
            if (plugin.cordova.getActivity().checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) {
                processDownload();
            } else {
                plugin.cordova.requestPermission(InAppBrowserDownloads.this.plugin, 0, android.Manifest.permission.WRITE_EXTERNAL_STORAGE);
            }
        } else { //permission is automatically granted on sdk<23 upon installation
            processDownload();
        }
    }

    public void onRequestPermissionResult(int requestCode, String[] permissions,
         int[] grantResults) throws JSONException
    {
        for(int r:grantResults)
        {
            if(r == PackageManager.PERMISSION_DENIED)
            {
                Toast.makeText(plugin.cordova.getActivity().getApplicationContext(), "Error downloading file, missing storage permissions", Toast.LENGTH_LONG).show();
            } else {
                InAppBrowserDownloads.this.processDownload();
            }
        }
    }

    protected void processDownload() {
        final String url = InAppBrowserDownloads.this.url;
        final String cookie = CookieManager.getInstance().getCookie(url);
        final String filename = URLUtil.guessFileName(url, InAppBrowserDownloads.this.contentDisposition, InAppBrowserDownloads.this.mimetype);

        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));

        try {
            request.allowScanningByMediaScanner();
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED); //Notify client once download is completed!
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
            
            request.addRequestHeader("Cookie", cookie);
            request.addRequestHeader("User-Agent", InAppBrowserDownloads.this.userAgent);
            request.addRequestHeader("Referer", url);

            DownloadManager dm = (DownloadManager) plugin.cordova.getActivity().getSystemService(DOWNLOAD_SERVICE);
            dm.enqueue(request);

            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT); //This is important!
            intent.addCategory(Intent.CATEGORY_OPENABLE); //CATEGORY.OPENABLE
            intent.setType("*/*");//any application,any extension

            Toast.makeText(plugin.cordova.getActivity().getApplicationContext(), "Downloading File '" + filename + "'", Toast.LENGTH_LONG).show();
        } catch (Exception exception) {
            Toast.makeText(plugin.cordova.getActivity().getApplicationContext(), "Error downloading file, missing storage permissions", Toast.LENGTH_LONG).show();
            exception.printStackTrace();
        }
    }
}
