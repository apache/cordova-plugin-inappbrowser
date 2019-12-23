import 'jasmine';
import * as InAppBrowserScreen from '../screenobjects/InAppBrowserScreen';
import * as Context from '../helpers/Context';
import {DEFAULT_TIMEOUT} from "../constants";
import LocatorsInAppBrowser, {
    LOCATORS
} from "../utils/locators/LocatorsInAppBrowser";

describe('[TestSuite, Description("Open a HTTPS URL with right behaviour, using System")]', () => {

    const waitForScreen = (title: string) => {
        InAppBrowserScreen.getTitle().waitForDisplayed(DEFAULT_TIMEOUT);
        const screenTitle: string = InAppBrowserScreen.getTitle().getText();
        expect(screenTitle).toContain(title);
    };

    beforeAll(() => {

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


    it('[Test, Description(Should open valid url https with "System" ),  Priority="P0", ID="IB0002"]', () => {

        //  let openWithSystyemButton: any;
        const expectedResultWelcomeMessage: string = 'elcome';
        let urlConnection: any;
        let openWithSystyemButton: any;
        let openInAppBrowserButton: any;

        //Select Https url to be opened in web browser
        urlConnection = InAppBrowserScreen.GetHttpsURLConnection();
        //wait to be displayed to grant the presence of it in the view before the click
        urlConnection.waitForDisplayed(DEFAULT_TIMEOUT);
        urlConnection.click();
        openWithSystyemButton = InAppBrowserScreen.getSelectWithSystemButton();

        openWithSystyemButton.waitForDisplayed(DEFAULT_TIMEOUT);
        openWithSystyemButton.click();

        //open InApp browser button
        openInAppBrowserButton = InAppBrowserScreen.getSelectInAppBrowserButton();

        openInAppBrowserButton.waitForDisplayed(DEFAULT_TIMEOUT);
        openInAppBrowserButton.click();
        let nativeAppContext = browser.getContexts()[0];

        Context.switchToContext(nativeAppContext);

        const requestWelcomeMessage = LocatorsInAppBrowser.getUrlTitle(browser);

        expect(requestWelcomeMessage).toContain(expectedResultWelcomeMessage);
    });
});
