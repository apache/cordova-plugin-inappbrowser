import 'jasmine';
import * as InAppBrowserScreen from '../screenobjects/InAppBrowserScreen';
import * as Context from '../helpers/Context';
import {DEFAULT_TIMEOUT} from "../constants";
import LocatorsInAppBrowser, {
    LOCATORS
} from "../utils/locators/LocatorsInAppBrowser";

describe('[TestSuite, Description("Open a HTTP & HTTPS URL with right behaviour, using InAppBrowser"), ID = "IB0002"]', () => {

    const waitForScreen = (title: string) => {
        InAppBrowserScreen.getTitle().waitForDisplayed(DEFAULT_TIMEOUT);
        const screenTitle: string = InAppBrowserScreen.getTitle().getText();
        expect(screenTitle).toContain(title);
    };

    beforeAll(() => {
            // Wait for webview to load
            Context.waitForWebViewContextLoaded();

            // Switch the context to WEBVIEW
            Context.switchToContext(Context.CONTEXT_REF.WEBVIEW);

            // Wait for Home Screen
            waitForScreen(InAppBrowserScreen.SCREENTITLES.HOME_SCREEN);
        }
    );

    beforeEach(() => {
            // Wait for webview to load
            Context.waitForWebViewContextLoaded();

            // Switch the context to WEBVIEW
            Context.switchToContext(Context.CONTEXT_REF.WEBVIEW);

            // Wait for Home Screen
            waitForScreen(InAppBrowserScreen.SCREENTITLES.HOME_SCREEN);
        }
    );

    afterAll(() => {
        browser.closeApp();
    });

    it('[Test, Description("Should open valid url http with "In App Browser",  Priority="P0"]', () => {

        const expectedResult: string = 'eunops';
        const expectedResultiOS: string = 'Search';
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

        const messageFromHttpUrl = LocatorsInAppBrowser.getMessageFromUrl(browser);
        if(browser.isAndroid) {
            expect(messageFromHttpUrl).toContain(expectedResult);
        }
        else {
            expect(messageFromHttpUrl).toContain(expectedResultiOS);
        }

    });

    it('[Test, Description("Should open valid url https with "In App Browser"  ),  Priority="P0"]', () => {


        const expectedResultWelcomeMessage: string = 'Welcome';

        let requestWelcomeMessage: string = '';
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

        requestWelcomeMessage = LocatorsInAppBrowser.getUrlTitle(browser);
        expect(requestWelcomeMessage).toContain(expectedResultWelcomeMessage);

    });
});
