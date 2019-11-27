import {DEFAULT_TIMEOUT, DEFAULT_TIMEOUT_INTERVAL} from "../constants"

const SELECTORS = {
    ANDROID: {
        ALERT_BUTTON: '*//android.widget.Button[@text="{BUTTON_TEXT}"]',
        ALERT_TITLE: '*//android.widget.TextView[@resource-id="android:id/alertTitle"]',
        PERMISSION_DIALOG: '*//android.widget.LinearLayout[@resource-id="com.android.packageinstaller:id/dialog_container"]'
    },
    IOS: {
        ALERT: '*//XCUIElementTypeAlert',
    },
};

class NativeAlert {
    /**
     * Wait for the alert to exist
     */
    public static waitForIsShown (isShown = true, driver): void {
        if (driver.isAndroid) {
            try {
                $(SELECTORS.ANDROID.ALERT_TITLE).waitForExist(DEFAULT_TIMEOUT, !isShown);
            } catch (err) {
                $(SELECTORS.ANDROID.PERMISSION_DIALOG).waitForExist(DEFAULT_TIMEOUT, !isShown);
            }
        }
        else {
            $(SELECTORS.IOS.ALERT).waitForExist(DEFAULT_TIMEOUT, !isShown);
        }
    }

    /**
     * Check if exists the alert
     */
    public static isShown (isShown = true, driver): boolean {
        if (driver.isAndroid) {
            return $(SELECTORS.ANDROID.ALERT_TITLE).isDisplayed() || $(SELECTORS.ANDROID.PERMISSION_DIALOG).isDisplayed();
        }
        else {
            return $(SELECTORS.IOS.ALERT).isDisplayed();
        }
    }

    /**
     * Press a button in a cross-platform way.
     *
     * IOS:
     *  iOS always has an accessibilityID so use the `~` in combination
     *  with the name of the button as shown on the screen
     * ANDROID:
     *  Use the text of the button, provide a string and it will automatically transform it to uppercase
     *  and click on the button
     *
     * @param {string} selector
     */
    public static pressButton (selector, driver): void {
        const buttonSelector = driver.isAndroid
            ? SELECTORS.ANDROID.ALERT_BUTTON.replace(/{BUTTON_TEXT}/, selector.toUpperCase())
            : `~${selector}`;
        $(buttonSelector).click();
    }

    /**
     * Get the alert text
     *
     * @return {string}
     */
    public static text (driver): string {
        return driver.getAlertText();
    }
}

export default NativeAlert;
