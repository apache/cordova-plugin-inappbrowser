import 'jasmine';
import * as InAppBrowserScreen from '../../screenobjects/InAppBrowserScreen';
import * as Context from '../../helpers/Context';
import PermissionAlert from '../../helpers/PermissionAlert';
import {url} from "inspector";
import {DEFAULT_TIMEOUT} from "../../constants";
import {TIMEOUT} from "dns";
import {LOCATORS} from "../LocatorsInAppBrowser";
import * as assert from "assert";
import * as Assert from "assert";

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


    it('[Test, Description("Open valid url  https with locator:  LOCATORS.HTTPS_VALID_URL ),  Priority="P0"]', () => {

        //Arrange
        const yeahCloseButton = $("//android.widget.TextView[@content-desc='Close Button']");
        const messageInPage = $('/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.RelativeLayout[2]/android.webkit.WebView/android.webkit.WebView/android.view.View/android.view.View[2]/android.view.View[2]/android.view.View/android.view.View[2]/android.view.View[3]/android.view.View[1]/android.view.View[3]');
        //const containingMessage = $("=Theatrical-Trailer");
        const expectedResult: string = 'Joker (2019)';
        const urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LOCATORS.HTTPS_VALID_URL);
        urlConnection.waitForDisplayed(DEFAULT_TIMEOUT);

        urlConnection.click();
        const openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
        openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
        openInAppBrowserButton.click();
        let nativeAppContext = browser.getContexts()[1];
        Context.switchToContext(nativeAppContext);
        Context.waitForWebsiteLoaded();

        //  console.log("message joker:  " + messageInPage.getText());
        //https://medium.com/@AyaAkl/working-with-appium-and-web-views-446400218264

        expect(messageInPage.getText()).toEqual(expectedResult);

        console.log(messageInPage.getText());

    });

    /* it('[Test, Description("Open valid url http  with locator: HTTP_VALID_URL,  Priority="P0"]', () => {

         //Arrange
         backToHomeScreen();

         //Act
         const urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LOCATORS.HTTP_VALID_URL);
         urlConnection.waitForDisplayed();
         urlConnection.click();

         //Assert
         //expect(successMessageText).toEqual((locatorUrlAndExpectedResults.get(locators[1])).toUpperCase());
     });*/

    afterEach(() => {
        //Do test teardown here
    });
});
