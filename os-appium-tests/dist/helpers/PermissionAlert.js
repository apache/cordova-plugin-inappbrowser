"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const SELECTORS = {
    ANDROID: {
        PERMISSION_DIALOG: '*//android.widget.LinearLayout[@resource-id="com.android.packageinstaller:id/dialog_container"]',
        PERMISSION_ALLOW_BUTTON: '*//android.widget.Button[@resource-id="com.android.packageinstaller:id/permission_allow_button"]',
        PERMISSION_DENY_BUTTON: '*//android.widget.Button[@resource-id="com.android.packageinstaller:id/permission_deny_button"]'
    },
    IOS: {
        PERMISSION_DIALOG: '*//XCUIElementTypeAlert',
        PERMISSION_ALLOW_BUTTON: '*//XCUIElementTypeButton[@name="OK"]',
        PERMISSION_DENY_BUTTON: '*//XCUIElementTypeButton[@name="Don’t Allow"]'
    },
};
class PermissionAlert {
    /**
     * Wait for the alert to exist
     */
    static waitForIsShown(isShown = true, driver) {
        const selector = driver.isAndroid ? SELECTORS.ANDROID.PERMISSION_DIALOG : SELECTORS.IOS.PERMISSION_DIALOG;
        $(selector).waitForExist(constants_1.DEFAULT_TIMEOUT, !isShown);
    }
    /**
     * Check if exists the alert
     */
    static isShown(isShown = true, driver) {
        const selector = driver.isAndroid ? SELECTORS.ANDROID.PERMISSION_DIALOG : SELECTORS.IOS.PERMISSION_DIALOG;
        return $(selector).isDisplayed();
    }
    /**
     * Allow or deny a permission request
     *
     * @param {boolean} allow
     */
    static allowPermission(allow = true, driver) {
        const selectors = driver.isAndroid ? SELECTORS.ANDROID : SELECTORS.IOS;
        const buttonSelector = allow ? selectors.PERMISSION_ALLOW_BUTTON : selectors.PERMISSION_DENY_BUTTON;
        const permissionButton = $(buttonSelector);
        permissionButton.click();
    }
    /**
     * Get the alert text
     *
     * @return {string}
     */
    static text(driver) {
        return driver.getAlertText();
    }
}
exports.default = PermissionAlert;
