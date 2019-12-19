import 'jasmine';
import * as InAppBrowserScreen from '../screenobjects/InAppBrowserScreen';
import * as Context from '../helpers/Context';
import {DEFAULT_TIMEOUT} from "../constants";
import LocatorsInAppBrowser, {
    LOCATORS
} from "../utils/locators/LocatorsInAppBrowser";

describe('[TestSuite, Description("Open a HTTP URL with right behaviour, using System")]', () => {

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

        // Enter Screen
        InAppBrowserScreen.getTitle().waitForDisplayed(DEFAULT_TIMEOUT);
    }
);

    beforeEach(() => {

            // Switch the context to WEBVIEW
            Context.switchToContext(Context.CONTEXT_REF.WEBVIEW);

            // Wait for Home Screen
            waitForScreen(InAppBrowserScreen.SCREENTITLES.HOME_SCREEN);

            // Enter Screen
            InAppBrowserScreen.getTitle().waitForDisplayed(DEFAULT_TIMEOUT);
        }
    );

    afterAll(() => {
        browser.closeApp();
    });

    it('[Test, Description("Should open valid url http with "System",  Priority="P0", ID = "IB0002"]', () => {
        const expectedResult: string = 'eunops';
        const expectedResultiOS: string = 'Search';
        let urlConnection: any;
        let openWithSystyemButton: any;
        let openInAppBrowserButton: any;

        urlConnection = InAppBrowserScreen.GetHttpURLConnectionWithLocators();
        urlConnection.waitForDisplayed();
        urlConnection.click();

        openWithSystyemButton = InAppBrowserScreen.getSelectWithSystemButton();
        openWithSystyemButton.waitForDisplayed(DEFAULT_TIMEOUT);
        openWithSystyemButton.click();

        openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();
        openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
        openInAppBrowserButton.click();

        let nativeAppContext = browser.getContexts()[0];
        Context.switchToContext(nativeAppContext);
        const result = LocatorsInAppBrowser.getMessageFromUrl(browser);

        if(browser.isAndroid) {
            expect(result).toContain(expectedResult);
        }
        else {
            expect(result).toContain(expectedResultiOS);
        }

    });

});
