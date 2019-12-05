import {DEFAULT_TIMEOUT} from "../../constants";

export const LOCATORS = {

    HTTPS_VALID_URL: 'button_https_valid_url',
    HTTP_VALID_URL: 'button_http_valid_url',
    CLOSE_BUTTON: 'Input_Closebuttoncaption'
};


export const ANDROID_LOCATORS = {

    IN_APP_BROWSER_PLUGIN: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.webkit.WebView/android.webkit.WebView/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View[2]/android.view.View[1]/android.view.View[2]',
    SYSTEM_BUTTON: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.webkit.WebView/android.webkit.WebView/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View[2]/android.view.View[2]/android.view.View/android.view.View[2]/android.view.View[2]/android.view.View/android.view.View[2]/android.widget.Button[2]',
    REGISTAR_PORTAL_FINANCAS_XPATH: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[1]/android.widget.FrameLayout[2]/android.webkit.WebView/android.view.View[2]/android.view.View[1]/android.view.View[2]/android.view.View/android.view.View[2]/android.view.View[1]',
    REGISTAR_PORTAL_FINANCAS_NOME: 'Registar-se',
    BEM_VINDO_MENSAGEM_FINANCAS: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.RelativeLayout[2]/android.webkit.WebView/android.webkit.WebView/android.view.View[2]/android.view.View[1]/android.view.View[3]/android.view.View[3]/android.view.View[2]/android.view.View[1]/android.view.View/android.view.View[1]',
    //BEM_VINDO_MENSAGEM_FINANCAS: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.RelativeLayout[2]/android.webkit.WebView/android.webkit.WebView/android.view.View[2]/android.view.View[1]/android.view.View[3]/android.view.View[3]/android.view.View[2]/android.view.View[1]/android.view.View/android.view.View[1]',

    FINANCAS_BROWSER: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[1]/android.widget.FrameLayout[2]/android.webkit.WebView/android.view.View[2]/android.view.View[1]/android.view.View[3]/android.view.View[3]/android.view.View[2]/android.view.View[1]/android.view.View/android.view.View[1]',
    YEAH_CLOSE_BUTTON: "//android.widget.TextView[@content-desc='Close Button']",
    MESSAGE_IN_WEBPAGE: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.RelativeLayout[2]/android.webkit.WebView/android.webkit.WebView/android.view.View/android.view.View[2]/android.view.View[2]/android.view.View/android.view.View[2]/android.view.View[3]/android.view.View[1]/android.view.View[3]',
    LOCATORCINEMA: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.RelativeLayout[2]/android.webkit.WebView/android.webkit.WebView/android.view.View/android.view.View[2]/android.view.View[2]/android.view.View[1]/android.view.View[3]/android.view.View/android.view.View[2]',
    CERN_TEXT: 'What is HyperText',
    EUNOPS: '*=eunops',
    // EUNOPS_XPATH : '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.RelativeLayout[2]/android.webkit.WebView/android.webkit.WebView/android.view.View[4]/android.view.View[1]/android.view.View[2]/android.view.View/android.view.View[4]/android.view.View/android.widget.ListView/android.view.View[2]/android.view.View',
    EUNOPS_XPATH: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.RelativeLayout[2]/android.webkit.WebView/android.webkit.WebView/android.view.View[4]/android.view.View[1]/android.view.View[2]/android.view.View/android.view.View[2]/android.view.View/android.view.View',

    EUNOPS_BROWSER: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.view.ViewGroup/android.widget.FrameLayout[1]/android.widget.FrameLayout[2]/android.webkit.WebView/android.view.View[4]/android.view.View[1]/android.view.View[2]/android.view.View/android.view.View[2]/android.view.View/android.view.View'

//https://kobiton.com/book/chapter-4-appium-locator-finding-strategies/
};

export const IOS_LOCATORS = {
//     YEAH_CLOSE_BUTTON: "",
    REGISTAR_PORTAL_FINANCAS_NOME: 'Registar-se',
    HTTPS_VALID_URL: '//XCUIElementTypeButton[@name="HTTPS(IMDB Trailer)"]',
    JOKER_TEXT: '(//XCUIElementTypeStaticText[@name="Joker (2019)"])[1]'
};

const SELECTORS = {
    ANDROID: {
        //BEM_VINDO_MENSAGEM_FINANCAS: '(td:contains("A AT no Youtube"))',
        BEM_VINDO_MENSAGEM_FINANCAS: '//*[contains(@text, "Bem-vindo ao Portal das")]'
        //BEM_VINDO_MENSAGEM_FINANCAS: '/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.RelativeLayout[2]/android.webkit.WebView/android.webkit.WebView/android.view.View[2]/android.view.View[1]/android.view.View[3]/android.view.View[3]/android.view.View[2]/android.view.View[1]/android.view.View/android.view.View[1]'
    },
    IOS: {
        // BEM_VINDO_MENSAGEM_FINANCAS: '/XCUIElementTypeOther[@name="Portal das Finanças"]/XCUIElementTypeOther[101]',
        BEM_VINDO_MENSAGEM_FINANCAS: '(td:contains("Bem-vindo ao Portal"))',

    },
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


}



export default LocatorsInAppBrowser;
