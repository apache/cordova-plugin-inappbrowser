import * as AndroidUtils from '../helpers/AndroidUtils';
import * as IOSUtils from '../helpers/IOSUtils';
import * as Context  from "../helpers/Context";

export function getNativeElementX (driver): WebdriverIO.Element {
    if (driver.isAndroid) {
        return AndroidUtils.getElemByPartialId('viewIdX');
    } else {
        return IOSUtils.getElemByXPath('//UIAApplication[1]/UIAWindow[1]/UIAStaticText[2]');
    }
}

export function getNativeElementWithTextY (driver): WebdriverIO.Element {
    if (driver.isAndroid) {
        return AndroidUtils.getElemByText('Y');
    } else {
        return IOSUtils.getElemByValue('Y');
    }
}

export function getWebViewElementX (): WebdriverIO.Element {
    return Context.getElemBySelector("#x");
}
