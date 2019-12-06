export const LOCATORS = {
    HTTPS_VALID_URL: 'button_https_valid_url',
    HTTP_VALID_URL: 'button_http_valid_url',
    CLOSE_BUTTON: 'Input_Closebuttoncaption'
};

const SELECTORS = {
    ANDROID: {
        BEM_VINDO_MENSAGEM_FINANCAS: '//*[contains(@text, "Bem-vindo ao Portal das")]',
        MENSAGEM_EUNOPS_PAGE: '//*[contains(@text, "eunops")]',
    },
    IOS: {
        BEM_VINDO_MENSAGEM_FINANCAS: '//XCUIElementTypeStaticText[@label="Bem-vindo ao Portal das Finanças"]',
        MENSAGEM_EUNOPS: '//XCUIElementTypeStaticText[@label="eunops"]'
    }
};

class LocatorsInAppBrowser {

    public static getUrlTitle(driver): string {
        const selector = driver.isAndroid ? SELECTORS.ANDROID.BEM_VINDO_MENSAGEM_FINANCAS : SELECTORS.IOS.BEM_VINDO_MENSAGEM_FINANCAS;
        return $(selector).getText();
    }

    public static getText(driver): string {
        const selector = driver.isAndroid ? SELECTORS.ANDROID.BEM_VINDO_MENSAGEM_FINANCAS : SELECTORS.IOS.BEM_VINDO_MENSAGEM_FINANCAS;
        return $(selector).getText();
    }

    static getMessageFromUrl(driver): string {
        return $(driver.isAndroid ? SELECTORS.ANDROID.MENSAGEM_EUNOPS_PAGE : SELECTORS.IOS.MENSAGEM_EUNOPS).getText();
    }
}

export default LocatorsInAppBrowser;
