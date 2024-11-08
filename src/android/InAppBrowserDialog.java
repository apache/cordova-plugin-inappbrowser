package org.apache.cordova.inappbrowser;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

public class InAppBrowserDialog {
    private final Context context;
    private final FrameLayout dialogContainer;
    boolean isVisible = false;

    public InAppBrowserDialog(Context context) {
        this.context = context;

        dialogContainer = new FrameLayout(context);
        dialogContainer.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
    }

    public void setContentView(View contentView) {
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        dialogContainer.removeAllViews();
        dialogContainer.addView(contentView, params);
    }

    public void show(Boolean animated) {
        if (!isVisible) {
            if (dialogContainer.getParent() == null) {
                if (animated) {
                    dialogContainer.setTranslationY(dpToPx(40));
                    dialogContainer.setAlpha(0);

                    dialogContainer.animate()
                            .alpha(1)
                            .translationY(0)
                            .setDuration(150)
                            .setListener(null);
                }

                ViewGroup rootView = ((ViewGroup) ((android.app.Activity) context).getWindow().getDecorView().getRootView());
                rootView.addView(dialogContainer);
            }

            isVisible = true;
            dialogContainer.setVisibility(View.VISIBLE);
        }
    }

    public void hide() {
        if (isVisible) {
            isVisible = false;
            dialogContainer.setVisibility(View.GONE);
        }
    }

    public void dismiss(Boolean animated) {
        if (isVisible && animated) {
            dialogContainer.animate()
                    .alpha(0)
                    .translationY(dpToPx(40))
                    .setDuration(150)
                    .withEndAction(new Runnable() {
                        @Override
                        public void run() {
                            isVisible = false;
                            dismiss(true);
                        }
                    });
            return;
        }
        isVisible = false;
        dialogContainer.removeAllViews();

        ViewGroup rootView = ((ViewGroup) ((android.app.Activity) context).getWindow().getDecorView().getRootView());
        if (rootView != null && dialogContainer.getParent() != null) {
            rootView.removeView(dialogContainer);
        }
    }

    public View getView() {
        return dialogContainer;
    }

    private float dpToPx(int dp) {
        return dp * context.getResources().getDisplayMetrics().density;
    }
}
