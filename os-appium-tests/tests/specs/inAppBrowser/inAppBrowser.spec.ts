import 'jasmine';
import * as InAppBrowserScreen from '../../screenobjects/InAppBrowserScreen';
import * as Context from '../../helpers/Context';
import PermissionAlert from '../../helpers/PermissionAlert';
import {url} from "inspector";
import {DEFAULT_TIMEOUT} from "../../constants";
import {TIMEOUT} from "dns";
import {LOCATORS} from "../LocatorsInAppBrowser";
import * as assert from "assert";

describe('[TestSuite, Description("Add and URL and open it")]', () => {

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
        const urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LOCATORS.HTTPS_VALID_URL);
        urlConnection.waitForDisplayed(DEFAULT_TIMEOUT);

        //Act
        urlConnection.click();
        const openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
        openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
        openInAppBrowserButton.click();
        openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
        let context = browser.getContext();
        Context.switchToContext(Context.CONTEXT_REF.NATIVE);
        openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);

        //Assert
        //temporary assert
        assert(context.toUpperCase().toString(), 'WEBVIEW_COM.OUTSYSTEMS.O11.INAPPBROWSERSAMPLEAPP');
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
