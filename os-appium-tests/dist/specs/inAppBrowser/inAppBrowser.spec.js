"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("jasmine");
const InAppBrowserScreen = require("../../screenobjects/InAppBrowserScreen");
const Context = require("../../helpers/Context");
const PermissionAlert_1 = require("../../helpers/PermissionAlert");
const constants_1 = require("../../constants");
const LocatorsInAppBrowser_1 = require("../../utils/locators/LocatorsInAppBrowser");
describe('[TestSuite, Description("Add an URL and open it with right behaviour")]', () => {
    const allowPermissionIfNeeded = (allow) => {
        Context.switchToContext(Context.CONTEXT_REF.NATIVE);
        if (PermissionAlert_1.default.isShown(true, browser)) {
            PermissionAlert_1.default.allowPermission(allow, browser);
            PermissionAlert_1.default.isShown(false, browser);
        }
        Context.switchToContext(Context.CONTEXT_REF.WEBVIEW);
    };
    const waitForScreen = (title) => {
        InAppBrowserScreen.getTitle().waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
        const screenTitle = InAppBrowserScreen.getTitle().getText();
        expect(screenTitle).toContain(title);
    };
    const backToHomeScreen = () => {
        const menuButton = InAppBrowserScreen.getAppMenu();
        menuButton.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
        if (!menuButton.isDisplayedInViewport()) {
            menuButton.scrollIntoView();
        }
        menuButton.click();
        const menuList = InAppBrowserScreen.getHomeScreenMenuEntry();
        menuList.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
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
    });
    it('[Test, Description("Open valid url https with "In App Browser"  ),  Priority="P0"]', () => {
        const expectedResultWelcomeMessage = 'Bem-vindo ao Portal das Finanças';
        if (browser.isAndroid) {
            //Select Https url to be opened
            const urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LocatorsInAppBrowser_1.LOCATORS.HTTPS_VALID_URL);
            //wait to be displayed to grant the presence of it in the view before the click
            urlConnection.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
            urlConnection.click();
            //open InApp browser button
            const openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
            openInAppBrowserButton.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
            const requesteWelcomeMessage = $(LocatorsInAppBrowser_1.ANDROID_LOCATORS.BEM_VINDO_MENSAGEM_FINANCAS);
            openInAppBrowserButton.click();
            let nativeAppContext = browser.getContexts()[1];
            Context.switchToContext(nativeAppContext);
            Context.waitForWebsiteLoaded();
            console.log("Acabou test 1 Android");
            expect(requesteWelcomeMessage.getText()).toEqual(expectedResultWelcomeMessage);
        }
        else {
        }
    });
    it('[Test, Description("Open valid url http with "In App Browser",  Priority="P0"]', () => {
        const expectedAndroidResult = 'eunops';
        let urlConnection;
        let openInAppBrowserButton;
        //Android app test
        if (browser.isAndroid) {
            urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LocatorsInAppBrowser_1.LOCATORS.HTTP_VALID_URL);
            urlConnection.waitForDisplayed();
            urlConnection.click();
            openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
            openInAppBrowserButton.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
            openInAppBrowserButton.click();
            let nativeAppContext = browser.getContexts()[1];
            Context.switchToContext(nativeAppContext);
            Context.waitForWebsiteLoaded();
            browser.waitUntil(() => {
                return ($(LocatorsInAppBrowser_1.ANDROID_LOCATORS.EUNOPS_XPATH).getText()) === 'eunops';
            });
            const link = $(LocatorsInAppBrowser_1.ANDROID_LOCATORS.EUNOPS_XPATH);
            //console.log("linktext  " + link.getText());
            console.log("Acabou test 2 Android");
            expect(link.getText()).toEqual(expectedAndroidResult);
            //iOS app test
        }
        else {
            urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LocatorsInAppBrowser_1.IOS_LOCATORS.HTTPS_VALID_URL);
            urlConnection.waitForDisplayed();
            urlConnection.click();
            openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
            openInAppBrowserButton.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
            openInAppBrowserButton.click();
            let nativeAppContext = browser.getContexts()[1];
            Context.switchToContext(nativeAppContext);
            Context.waitForWebsiteLoaded();
            // expect(androidResult.getText()).toEqual(expectedAndroidResult);
        }
    });
    it('[Test, Description("Open valid url http with "System",  Priority="P0"]', () => {
        const expectedAndroidResult = 'eunops';
        let urlConnection;
        let openWithSystyemButton;
        let openInAppBrowserButton;
        //Android app test
        if (browser.isAndroid) {
            urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LocatorsInAppBrowser_1.LOCATORS.HTTP_VALID_URL);
            urlConnection.waitForDisplayed();
            urlConnection.click();
            openWithSystyemButton = InAppBrowserScreen.getSelectWithSystemButton();
            openWithSystyemButton.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
            openWithSystyemButton.click();
            openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
            openInAppBrowserButton.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
            openInAppBrowserButton.click();
            let nativeAppContext = browser.getContexts()[0];
            Context.switchToContext(nativeAppContext);
            Context.waitForWebsiteLoaded();
            browser.waitUntil(() => {
                return ($(LocatorsInAppBrowser_1.ANDROID_LOCATORS.EUNOPS_BROWSER).getText()) === 'eunops';
            });
            const link = $(LocatorsInAppBrowser_1.ANDROID_LOCATORS.EUNOPS_BROWSER);
            console.log("Acabou test 3 - http browser Android");
            expect(link.getText()).toEqual(expectedAndroidResult);
            browser.closeWindow();
            //iOS app test
        }
        else {
            urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LocatorsInAppBrowser_1.IOS_LOCATORS.HTTPS_VALID_URL);
            urlConnection.waitForDisplayed();
            urlConnection.click();
            // openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
            // openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
            // openInAppBrowserButton.click();
            let nativeAppContext = browser.getContexts()[0];
            Context.switchToContext(nativeAppContext);
            Context.waitForWebsiteLoaded();
            // expect(androidResult.getText()).toEqual(expectedAndroidResult);
        }
    });
    it('[Test, Description(Open valid url https with "System" ),  Priority="P0"]', () => {
        //  let openWithSystyemButton: any;
        const expectedResultWelcomeMessage = 'Bem-vindo ao Portal das Finanças';
        let urlConnection;
        let openWithSystyemButton;
        let openInAppBrowserButton;
        if (browser.isAndroid) {
            //Select Https url to be opened in web browser
            urlConnection = InAppBrowserScreen.GetURLConnectionWithLocators(LocatorsInAppBrowser_1.LOCATORS.HTTPS_VALID_URL);
            //wait to be displayed to grant the presence of it in the view before the click
            urlConnection.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
            urlConnection.click();
            openWithSystyemButton = InAppBrowserScreen.getSelectWithSystemButton();
            openWithSystyemButton.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
            openWithSystyemButton.click();
            //open InApp browser button
            openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
            openInAppBrowserButton.waitForDisplayed(constants_1.DEFAULT_TIMEOUT);
            openInAppBrowserButton.click();
            let nativeAppContext = browser.getContexts()[0];
            Context.switchToContext(nativeAppContext);
            Context.waitForWebsiteLoaded();
            const requestWelcomeMessage = $(LocatorsInAppBrowser_1.ANDROID_LOCATORS.FINANCAS_BROWSER);
            expect(requestWelcomeMessage.getText()).toEqual(expectedResultWelcomeMessage);
        }
        else {
        }
    });
    afterEach(() => {
        //Do test teardown here
    });
});
