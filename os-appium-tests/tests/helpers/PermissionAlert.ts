import {DEFAULT_TIMEOUT, DEFAULT_TIMEOUT_INTERVAL} from '../constants';

const SELECTORS = {
    ANDROID: {
        PERMISSION_DIALOG : '*//android.widget.LinearLayout[@resource-id="com.android.packageinstaller:id/dialog_container"]',
        PERMISSION_ALLOW_BUTTON : '*//android.widget.Button[@resource-id="com.android.packageinstaller:id/permission_allow_button"]',
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
    public static waitForIsShown(isShown = true, driver): void {
        const selector = driver.isAndroid ? SELECTORS.ANDROID.PERMISSION_DIALOG : SELECTORS.IOS.PERMISSION_DIALOG;
        $(selector).waitForExist(DEFAULT_TIMEOUT, !isShown); 
    }

    /**
     * Check if exists the alert
     */
    public static isShown(isShown = true, driver): boolean {
        const selector = driver.isAndroid ? SELECTORS.ANDROID.PERMISSION_DIALOG : SELECTORS.IOS.PERMISSION_DIALOG;
        return $(selector).isDisplayed();
    }

 
    /**
     * Allow or deny a permission request
     * 
     * @param {boolean} allow 
     */
    public static allowPermission(allow = true, driver): void {        
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
    public static text(driver): string {
        return driver.getAlertText();
    }
}

export default PermissionAlert;
