"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Context = require("../helpers/Context");
function getSelectWithSystemButton() {
    return Context.getElemBySelector('#ButtonGroupItem12');
}
exports.getSelectWithSystemButton = getSelectWithSystemButton;
function getTextOnWebPage() {
    return Context.getElemBySelector('#Joker-(2019)');
}
exports.getTextOnWebPage = getTextOnWebPage;
function goBackButton() {
    return Context.getElemBySelector('#Oh-yeah-close!');
}
exports.goBackButton = goBackButton;
function getElementByTagName(locator) {
    return Context.getElemBySelector(locator);
}
exports.getElementByTagName = getElementByTagName;
function getHomeScreenMenuEntry() {
    return Context.getElemBySelector('#b1-b1-HomeScreen');
}
exports.getHomeScreenMenuEntry = getHomeScreenMenuEntry;
function getAppMenu() {
    return Context.getElemBySelector('#b2-Menu');
}
exports.getAppMenu = getAppMenu;
function GetURLConnectionWithLocators(string) {
    return Context.getElemBySelector("#" + string);
}
exports.GetURLConnectionWithLocators = GetURLConnectionWithLocators;
function getSelectInAppBrowserButton() {
    return Context.getElemBySelector('#OpenBrowserBtn');
}
exports.getSelectInAppBrowserButton = getSelectInAppBrowserButton;
// SCREEN ELEMENTS
function getTitle() {
    return Context.getElemBySelector('#b1-Title');
}
exports.getTitle = getTitle;
function GetURLConnection() {
    return Context.getElemBySelector('#button_https_valid_url');
}
exports.GetURLConnection = GetURLConnection;
exports.SCREENTITLES = {
    HOME_SCREEN: 'In App Browser plugin'
};
