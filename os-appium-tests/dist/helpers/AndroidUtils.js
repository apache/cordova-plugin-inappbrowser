"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const Context_1 = require("./Context");
function getByTextSelector(val) {
    return 'new UiSelector().text("' + val + '")';
}
exports.getByTextSelector = getByTextSelector;
function getByPartialIdSelector(val) {
    return 'new UiSelector().resourceIdMatches(".*' + val + '")';
}
exports.getByPartialIdSelector = getByPartialIdSelector;
function getByIdSelector(val) {
    return 'new UiSelector().resourceId("' + val + '")';
}
exports.getByIdSelector = getByIdSelector;
function getByClassSelector(val) {
    return 'new UiSelector().classNameMatches("' + val + '")';
}
exports.getByClassSelector = getByClassSelector;
function getElemInScrollSelector(selector) {
    return 'new UiScrollable(new UiSelector().scrollable(true).instance(0)).scrollIntoView(' + selector + ')';
}
exports.getElemInScrollSelector = getElemInScrollSelector;
function getElemByText(text, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    let sel = 'android=' + getByTextSelector(text);
    return Context_1.waitForElement(sel, throwError, waitTime);
}
exports.getElemByText = getElemByText;
function getElemByPartialId(id, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    let sel = 'android=' + getByPartialIdSelector(id);
    return Context_1.waitForElement(sel, throwError, waitTime);
}
exports.getElemByPartialId = getElemByPartialId;
function getElemById(id, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    let sel = 'android=' + getByIdSelector(id);
    return Context_1.waitForElement(sel, throwError, waitTime);
}
exports.getElemById = getElemById;
function getElemByClass(className, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    let sel = 'android=' + getByClassSelector(className);
    return Context_1.waitForElement(sel, throwError, waitTime);
}
exports.getElemByClass = getElemByClass;
function getElemInScroll(selector, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    const sel = 'android=' + getElemInScrollSelector(selector);
    return Context_1.waitForElement(sel, throwError, waitTime);
}
exports.getElemInScroll = getElemInScroll;
function getPermissionAlertAllow(throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    //TODO Review if selector works for other android versions
    const sel = 'android=' + getByPartialIdSelector("permission_allow_button");
    return Context_1.waitForElement(sel, throwError, waitTime);
}
exports.getPermissionAlertAllow = getPermissionAlertAllow;
function getPermissionAlertDeny(throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    //TODO Review if selector works for other android versions
    let sel = 'android=' + getByPartialIdSelector("permission_deny_button");
    return Context_1.waitForElement(sel, throwError, waitTime);
}
exports.getPermissionAlertDeny = getPermissionAlertDeny;
