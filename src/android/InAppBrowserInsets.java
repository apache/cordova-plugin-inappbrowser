/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

package org.apache.cordova.inappbrowser;

import android.annotation.SuppressLint;
import android.app.Dialog;
import android.graphics.Color;
import android.graphics.Insets;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;

/**
 * Makes the Android In-App-Browser behave like the iOS one.
 *
 * A Cordova Dialog window is laid out inside the system bar insets, which boxes the browser
 * into the safe area on every edge. This lays the dialog out across the whole display and
 * turns only the top inset (status bar / display cutout) into padding. The toolbar therefore
 * sits below the status bar while the web view reaches the bottom edge of the screen,
 * mirroring CDVWKInAppBrowser.m, where the toolbar is pinned to safeAreaLayoutGuide.topAnchor
 * and the web view to the bottom edge of the view.
 *
 * The horizontal insets a display cutout adds in landscape are likewise kept off the browser as
 * a whole and applied to the toolbar alone: the browser fills the display edge to edge, and only
 * the toolbar's buttons and url stay clear of the cutout.
 */
final class InAppBrowserInsets {

    private InAppBrowserInsets() {
    }

    /**
     * @param dialog   the dialog the In-App-Browser is shown in, already visible
     * @param content  the browser's root layout, holding the toolbar and the web view
     * @param toolbar  the toolbar, whose buttons have to stay clear of a display cutout, or null
     * @param barColor the toolbar colour, also used for the strip behind the status bar
     */
    @SuppressLint("NewApi")
    static void apply(final Dialog dialog, final View content, final View toolbar, final int barColor) {
        if (dialog == null || content == null) {
            return;
        }

        final Window window = dialog.getWindow();
        if (window == null) {
            return;
        }

        // The status bar has to stay visible, otherwise there is no top inset to margin into.
        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        // Cordova shows the browser in a Dialog, and a dialog window is laid out inside the
        // system bar insets, which is what boxes the browser into the safe area on every edge
        // ("dumpsys window" reports fitTypes=statusBars navigationBars ... and an inset frame).
        // From targetSdk 35 on, Activities are opted into edge-to-edge by the framework, but
        // dialogs are not, so the window has to be opted in by hand. setDecorFitsSystemWindows
        // alone is not enough: it only stops the decor from padding its content, it neither
        // clears the fitted inset types nor lets the window span the display.
        window.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
            | WindowManager.LayoutParams.FLAG_LAYOUT_INSET_DECOR
            | WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // A window left on the default cutout mode may only extend into the display cutout
            // while the cutout is fully covered by a system bar. In portrait the cutout sits
            // behind the status bar and the dialog spans the display, but in landscape the
            // cutout moves to a side where nothing covers it, and the framework letterboxes the
            // window away from that edge: "dumpsys window" then reports frame=[142,0][2424,1080]
            // instead of [0,0][2424,1080], and the app behind shows through the gap that leaves.
            // The Cordova activity window is already laid out with
            // layoutInDisplayCutoutMode=always, so the dialog has to ask for the same to reach
            // the edge of the screen in every orientation.
            final WindowManager.LayoutParams cutoutAttributes = window.getAttributes();
            cutoutAttributes.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(cutoutAttributes);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Fit no inset type at all, so the frame becomes the full display and the insets
            // are reported to the content, where only the top one is turned into padding.
            final WindowManager.LayoutParams attributes = window.getAttributes();
            attributes.setFitInsetsTypes(0);
            window.setAttributes(attributes);
            window.setDecorFitsSystemWindows(false);
        } else {
            window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }

        // No-ops on Android 15+, but they keep the bars transparent on older devices.
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        // The strip behind the status bar takes the toolbar colour so both read as one bar.
        content.setBackgroundColor(barColor);
        content.setFitsSystemWindows(false);
        applyStatusBarIconContrast(window, barColor);

        // The toolbar lays its buttons out inside a padding of its own, which the cutout inset
        // is added to rather than replacing.
        final int toolbarPaddingLeft = toolbar == null ? 0 : toolbar.getPaddingLeft();
        final int toolbarPaddingTop = toolbar == null ? 0 : toolbar.getPaddingTop();
        final int toolbarPaddingRight = toolbar == null ? 0 : toolbar.getPaddingRight();
        final int toolbarPaddingBottom = toolbar == null ? 0 : toolbar.getPaddingBottom();

        content.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override
            @SuppressLint("NewApi")
            public WindowInsets onApplyWindowInsets(View view, WindowInsets insets) {
                int top;
                int left = 0;
                int right = 0;
                int keyboard;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    final Insets bars = insets.getInsets(
                        WindowInsets.Type.statusBars() | WindowInsets.Type.displayCutout());
                    top = bars.top;
                    // In landscape the display cutout sits on one of the sides, so the
                    // toolbar buttons have to stay clear of it there as well.
                    left = bars.left;
                    right = bars.right;
                    keyboard = insets.getInsets(WindowInsets.Type.ime()).bottom;
                } else {
                    top = insets.getSystemWindowInsetTop();
                    // Before API 30 the keyboard is not a separate inset type: whatever the
                    // system window inset adds on top of the stable navigation bar is the keyboard.
                    keyboard = Math.max(0, insets.getSystemWindowInsetBottom() - insets.getStableInsetBottom());
                }
                // The browser keeps both side edges of the screen, and keeps the bottom one
                // unless the keyboard would cover the content. Only the toolbar moves out of the
                // way of a cutout, so the web view stays full screen in landscape too.
                view.setPadding(0, top, 0, keyboard);
                if (toolbar != null) {
                    toolbar.setPadding(
                        toolbarPaddingLeft + left,
                        toolbarPaddingTop,
                        toolbarPaddingRight + right,
                        toolbarPaddingBottom);
                }
                return insets;
            }
        });

        // The dialog is already showing at this point, so the first inset dispatch is gone.
        content.requestApplyInsets();
    }

    /**
     * Picks light or dark status bar icons, whichever stays legible on the toolbar colour.
     */
    @SuppressLint("NewApi")
    private static void applyStatusBarIconContrast(final Window window, final int barColor) {
        final double luminance = (0.299d * Color.red(barColor)
            + 0.587d * Color.green(barColor)
            + 0.114d * Color.blue(barColor)) / 255d;
        final boolean darkIconsNeeded = luminance > 0.5d;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            final WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.setSystemBarsAppearance(
                    darkIconsNeeded ? WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS : 0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS);
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            final View decorView = window.getDecorView();
            int flags = decorView.getSystemUiVisibility();
            if (darkIconsNeeded) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            } else {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            }
            decorView.setSystemUiVisibility(flags);
        }
    }
}
