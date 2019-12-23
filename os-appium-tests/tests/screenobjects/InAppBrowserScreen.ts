import * as Context from '../helpers/Context';

export function GetHttpURLConnectionWithLocators(): WebdriverIO.Element {
    return Context.getElemBySelector('#button_http_valid_url')
}

export function getSelectWithSystemButton(): WebdriverIO.Element {
    return Context.getElemBySelector('#ButtonGroupItem12')
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

export function GetHttpsURLConnection(): WebdriverIO.Element {
    return Context.getElemBySelector('#button_https_valid_url');
}

export const SCREENTITLES = {
    HOME_SCREEN: 'In App Browser plugin'
};
