import * as AndroidUtils from '../helpers/AndroidUtils';
import * as IOSUtils from '../helpers/IOSUtils';
import * as Context from '../helpers/Context';

export function getTextOnWebPage() {
    return  Context.getElemBySelector('#Joker-(2019)')
}


export function goBackButton(): WebdriverIO.Element {
    return Context.getElemBySelector('#Oh-yeah-close!');
}

export function getElementByTagName(locator: string) {
    return Context.getElemBySelector(locator);
}

export function getHomeScreenMenuEntry() {
    return Context.getElemBySelector('#b1-b1-HomeScreen');
}

export function getAppMenu(): WebdriverIO.Element {
    return Context.getElemBySelector('#b2-Menu');
}

export function GetURLConnectionWithLocators(string: any) {
    return Context.getElemBySelector("#" + string)
}

export function getSelectInAppBrowserButton() {
    return Context.getElemBySelector('#OpenBrowserBtn')
}

// SCREEN ELEMENTS
export function getTitle(): WebdriverIO.Element {
    return Context.getElemBySelector('#b1-Title');
}

export function GetURLConnection() {
    return Context.getElemBySelector('#button_https_valid_url');
}

export const SCREENTITLES = {
    HOME_SCREEN: 'In App Browser plugin'
};
