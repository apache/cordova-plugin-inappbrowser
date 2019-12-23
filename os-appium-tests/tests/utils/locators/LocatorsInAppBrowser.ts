export const LOCATORS = {
    HTTPS_VALID_URL: 'button_https_valid_url',
    HTTP_VALID_URL: 'button_http_valid_url',
    CLOSE_BUTTON: 'Input_Closebuttoncaption'
};

const SELECTORS = {
    ANDROID: {
       OUT_SYSTEMS_WEB_PAGE: '//*[contains(@text, "Welcome")]',

        MENSAGEM_EUNOPS_PAGE: '//*[contains(@text, "eunops")]',
    },
    IOS: {
        OUT_SYSTEMS_WEB_PAGE: '//XCUIElementTypeStaticText[@label="Welcome"]',

        MENSAGEM_EUNOPS: '//XCUIElementTypeButton[@name="Search"]',
    }
};

class LocatorsInAppBrowser {

    public static getUrlTitle(driver): string {
        const selector = driver.isAndroid ? SELECTORS.ANDROID.OUT_SYSTEMS_WEB_PAGE : SELECTORS.IOS.OUT_SYSTEMS_WEB_PAGE;
        return $(selector).getText();
    }

    public static getMessageFromUrl(driver): string {
        const selector =(driver.isAndroid ? SELECTORS.ANDROID.MENSAGEM_EUNOPS_PAGE : SELECTORS.IOS.MENSAGEM_EUNOPS);
        return  $(selector).getText();
    }
}

export default LocatorsInAppBrowser;
