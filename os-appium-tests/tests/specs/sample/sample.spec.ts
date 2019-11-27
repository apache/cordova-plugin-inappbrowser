import 'jasmine';
import * as SampleScreen from '../../screenobjects/SampleScreen';
import * as Context from '../../helpers/Context';
import {DEFAULT_TIMEOUT, DEFAULT_TIMEOUT_INTERVAL} from "../../constants"

describe('[TestSuite, Description("Description of Sample Test Suit")]', () => {
    beforeEach(() => {
        //do test setup here, for instance:
        //browser.reset();
    });

    it('[Test, Description("find native element with text Y is in sample screen"), Priority="P0"]', () => {
        // To be able to use the site in the webview webdriver.io first needs
        // change the context to native
        Context.switchToContext(Context.CONTEXT_REF.NATIVE);
        expect(SampleScreen.getNativeElementWithTextY(WebDriver).getText()).toEqual('Y');
    });

    it('[Test, Description("check webview element with id X is in sample screen"), Priority="P0"]', () => {
        // To be able to use the site in the webview webdriver.io first needs
        // change the context from native to webview
        Context.switchToContext(Context.CONTEXT_REF.WEBVIEW);
        SampleScreen.getWebViewElementX().waitForDisplayed(DEFAULT_TIMEOUT);
        expect(SampleScreen.getWebViewElementX().isDisplayed).toBeTruthy('Element Y not displayed');
    });

    afterEach(() => {
        //Do test teardown here
    });

});
