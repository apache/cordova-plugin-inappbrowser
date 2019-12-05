import 'jasmine';
import * as InAppBrowserScreen from '../../screenobjects/InAppBrowserScreen';
import * as Context from '../../helpers/Context';
import PermissionAlert from '../../helpers/PermissionAlert';
import {DEFAULT_TIMEOUT} from "../../constants";
import LocatorsInAppBrowser, {
    LOCATORS
} from "../../utils/locators/LocatorsInAppBrowser";

describe('[TestSuite, Description("Add an URL and open it with right behaviour using InAppBrowser")]', () => {

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


    it('[Test, Description("Open valid url https with "In App Browser"  ),  Priority="P0"]', () => {

        const expectedResultWelcomeMessage: string = 'Bem-vindo ao Portal das';

        let requestWelcomeMessage: string = '';
        //const urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LOCATORS.HTTPS_VALID_URL);
        const urlConnection = InAppBrowserScreen.GetHttpsURLConnection();
        // the click
        urlConnection.waitForDisplayed(DEFAULT_TIMEOUT);
        //wait to be displayed to grant the presence of it in the view before
        urlConnection.click();

        //Open InApp browser button
        const openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
        openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);

        openInAppBrowserButton.click();
        let nativeAppContext = browser.getContexts()[0];
        Context.switchToContext(nativeAppContext);
        Context.waitForWebsiteLoaded();

        requestWelcomeMessage = LocatorsInAppBrowser.getUrlTitle(browser);
        expect(requestWelcomeMessage).toContain(expectedResultWelcomeMessage);

    });

    it('[Test, Description("Open valid url http with "In App Browser",  Priority="P0"]', () => {

        const expectedResult: string = 'eunops';
        let urlConnection: any;
        let openInAppBrowserButton: any;

        urlConnection = InAppBrowserScreen.GetHttpURLConnectionWithLocators();
        urlConnection.waitForDisplayed();
        urlConnection.click();

        openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
        openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
        openInAppBrowserButton.click();

        let nativeAppContext = browser.getContexts()[0];
        Context.switchToContext(nativeAppContext);
        Context.waitForWebsiteLoaded();

        const messageFromHttpUrl = LocatorsInAppBrowser.getMessageFromUrl(browser);

        expect(messageFromHttpUrl).toContain(expectedResult);

    });

    // it('[Test, Description(Open valid url https with "System" ),  Priority="P0"]', () => {
    //
    //     //  let openWithSystyemButton: any;
    //     const expectedResultWelcomeMessage: string = 'Bem-vindo ao Portal das Finanças';
    //     let urlConnection: any;
    //     let openWithSystyemButton: any;
    //     let openInAppBrowserButton: any;
    //
    //
    //     //Select Https url to be opened in web browser
    //     urlConnection = InAppBrowserScreen.GetHttpsURLConnection();
    //     //wait to be displayed to grant the presence of it in the view before the click
    //     urlConnection.waitForDisplayed(DEFAULT_TIMEOUT);
    //     urlConnection.click();
    //
    //     openWithSystyemButton = InAppBrowserScreen.getSelectWithSystemButton();
    //     openWithSystyemButton.waitForDisplayed(DEFAULT_TIMEOUT);
    //     openWithSystyemButton.click();
    //
    //     //open InApp browser button
    //     openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
    //     openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
    //     openInAppBrowserButton.click();
    //
    //     let nativeAppContext = browser.getContexts()[1];
    //     Context.switchToContext(nativeAppContext);
    //     Context.waitForWebsiteLoaded();
    //
    //     const requestWelcomeMessage = LocatorsInAppBrowser.getUrlTitle(browser);
    //
    //     expect(requestWelcomeMessage).toContain(expectedResultWelcomeMessage);
    //
    //
    // });
    //
    // it('[Test, Description("Open valid url http with "System",  Priority="P0"]', () => {
    //
    //     const expectedResult: string = 'eunops';
    //     let urlConnection: any;
    //     let openWithSystyemButton: any;
    //     let openInAppBrowserButton: any;
    //
    //
    //     urlConnection = InAppBrowserScreen.GetHttpURLConnectionWithLocators();
    //     urlConnection.waitForDisplayed();
    //     urlConnection.click();
    //
    //     openWithSystyemButton = InAppBrowserScreen.getSelectWithSystemButton();
    //     openWithSystyemButton.waitForDisplayed(DEFAULT_TIMEOUT);
    //     openWithSystyemButton.click();
    //
    //     openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
    //     openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
    //     openInAppBrowserButton.click();
    //
    //     let nativeAppContext = browser.getContexts()[1];
    //     Context.switchToContext(nativeAppContext);
    //     Context.waitForWebsiteLoaded();
    //
    //     const result = LocatorsInAppBrowser.getMessageFromUrl(browser);
    //     expect(result).toContain(expectedResult);
    //
    // });


    afterEach(() => {
        //Do test teardown here
    });

});
