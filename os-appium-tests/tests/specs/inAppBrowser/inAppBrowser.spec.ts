import 'jasmine';
import * as InAppBrowserScreen from '../../screenobjects/InAppBrowserScreen';
import * as Context from '../../helpers/Context';
import PermissionAlert from '../../helpers/PermissionAlert';
import {DEFAULT_TIMEOUT} from "../../constants";
import {LOCATORS, ANDROID_LOCATORS, IOS_LOCATORS} from "../../utils/locators/LocatorsInAppBrowser";


describe('[TestSuite, Description("Add an URL and open it with right behaviour")]', () => {

    const allowPermissionIfNeeded = (allow: boolean) => {
        Context.switchToContext(Context.CONTEXT_REF.NATIVE);

        if (PermissionAlert.isShown(true, browser)) {
            PermissionAlert.allowPermission(allow, browser);
            PermissionAlert.isShown(false, browser);
        }
        Context.switchToContext(Context.CONTEXT_REF.WEBVIEW);
    };

    const waitForScreen = (title: string) => {
        InAppBrowserScreen.getTitle().waitForDisplayed(DEFAULT_TIMEOUT);
        const screenTitle: string = InAppBrowserScreen.getTitle().getText();
        expect(screenTitle).toContain(title);
    };

    const backToHomeScreen = () => {
        const menuButton = InAppBrowserScreen.getAppMenu();
        menuButton.waitForDisplayed(DEFAULT_TIMEOUT);
        if (!menuButton.isDisplayedInViewport()) {
            menuButton.scrollIntoView();
        }
        menuButton.click();

        const menuList = InAppBrowserScreen.getHomeScreenMenuEntry();
        menuList.waitForDisplayed(DEFAULT_TIMEOUT);
        menuList.click();

        waitForScreen(InAppBrowserScreen.SCREENTITLES.HOME_SCREEN);
    };

    beforeAll(() => {

        // Wait for webview to load
        Context.waitForWebViewContextLoaded();

        // Switch the context to WEBVIEW
        Context.switchToContext(Context.CONTEXT_REF.WEBVIEW);

        // Wait for Home Screen
        waitForScreen(InAppBrowserScreen.SCREENTITLES.HOME_SCREEN);

    });

    beforeEach(() => {
            // Wait for webview to load
            Context.waitForWebViewContextLoaded();

            // Switch the context to WEBVIEW
            Context.switchToContext(Context.CONTEXT_REF.WEBVIEW);

            // Wait for Home Screen
            waitForScreen(InAppBrowserScreen.SCREENTITLES.HOME_SCREEN);
        }
    );





    it('[Test, Description("Open valid url  https with locator:  LOCATORS.HTTPS_VALID_URL ),  Priority="P0"]', () => {

       // const expectedResult: string = 'Registar-se';

        const expectedResultBemVindo: string = 'Bem-vindo ao Portal das Finanças';

        const urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LOCATORS.HTTPS_VALID_URL);
        urlConnection.waitForDisplayed(DEFAULT_TIMEOUT);
        urlConnection.click();
        const openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
        openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
        const requestesBemVindo = $(ANDROID_LOCATORS.BEM_VINDO_MENSAGEM_FINANCAS);
        openInAppBrowserButton.click();
        let nativeAppContext = browser.getContexts()[1];
        Context.switchToContext(nativeAppContext);
        Context.waitForWebsiteLoaded();

       expect(requestesBemVindo.getText()).toEqual(expectedResultBemVindo);
    });

    // xit('[Test, Description("Open valid url http  with locator: HTTP_VALID_URL,  Priority="P0"]', () => {
    //
    //     const expectedAndroidResult: string = 'Cinemas';
    //     const androidResult = $(ANDROID_LOCATORS.REGISTAR_PORTAL_FINANCAS_NOME);
    //     //TODO
    //     //expected_iOS_Result and iOS_Result
    //     let urlConnection: any;
    //     let openInAppBrowserButton: any;
    //     // const locatorCinema = $("/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.RelativeLayout[2]/android.webkit.WebView/android.webkit.WebView/android.view.View/android.view.View[2]/android.view.View[2]/android.view.View[1]/android.view.View[3]/android.view.View/android.view.View[2]");
    //     if (browser.isAndroid) {
    //         urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LOCATORS.HTTP_VALID_URL);
    //         urlConnection.waitForDisplayed();
    //         urlConnection.click();
    //         openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
    //         openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
    //         openInAppBrowserButton.click();
    //         let nativeAppContext = browser.getContexts()[1];
    //         Context.switchToContext(nativeAppContext);
    //         Context.waitForWebsiteLoaded();
    //
    //         expect(androidResult.getText()).toEqual(expectedAndroidResult);
    //     }
    //     else{
    //         urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(IOS_LOCATORS.HTTPS_VALID_URL);
    //         urlConnection.waitForDisplayed();
    //         urlConnection.click();
    //         openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
    //         openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
    //         openInAppBrowserButton.click();
    //         let nativeAppContext = browser.getContexts()[1];
    //
    //         Context.switchToContext(nativeAppContext);
    //         Context.waitForWebsiteLoaded();
    //
    //        // expect(androidResult.getText()).toEqual(expectedAndroidResult);
    //     }
    //
    // });
    afterEach(() => {
        //Do test teardown here
    });
});
