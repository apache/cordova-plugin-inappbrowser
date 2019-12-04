"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
exports.CONTEXT_REF = {
    NATIVE: 'native',
    WEBVIEW: 'webview',
};
const DOCUMENT_READY_STATE = {
    COMPLETE: 'complete',
    INTERACTIVE: 'interactive',
    LOADING: 'loading',
};
/**
 * Wait for the webview context to be loaded
 *
 * By default you have `NATIVE_APP` as the current context. If a webview is loaded it will be
 * added to the current contexts and will looks something like this
 * `["NATIVE_APP","WEBVIEW_28158.2"]`
 * The number behind `WEBVIEW` can be any string
 */
function waitForWebViewContextLoaded() {
    browser.waitUntil(() => {
        const currentContexts = this.getCurrentContexts();
        const result = currentContexts.length > 1 &&
            currentContexts.find((context) => context.toLowerCase().includes(exports.CONTEXT_REF.WEBVIEW)) != null;
        return result;
    }, constants_1.DEFAULT_TIMEOUT, 'Webview context not loaded', constants_1.DEFAULT_TIMEOUT_INTERVAL);
}
exports.waitForWebViewContextLoaded = waitForWebViewContextLoaded;
/**
 * Switch to native or webview context
 *
 * @param {string} context should be native of webview
 */
function switchToContext(context) {
    browser.switchContext(this.getCurrentContexts()[context === exports.CONTEXT_REF.WEBVIEW ? 1 : 0]);
}
exports.switchToContext = switchToContext;
/**
 * Returns an object with the list of all available contexts
 *
 * @return {object} An object containing the list of all available contexts
 */
function getCurrentContexts() {
    return browser.getContexts();
}
exports.getCurrentContexts = getCurrentContexts;
/**
 * Wait for the document to be fully loaded
 */
function waitForDocumentFullyLoaded() {
    browser.waitUntil(() => browser.execute(() => document.readyState) === DOCUMENT_READY_STATE.COMPLETE, constants_1.DEFAULT_TIMEOUT, 'Website not loaded', constants_1.DEFAULT_TIMEOUT_INTERVAL);
}
exports.waitForDocumentFullyLoaded = waitForDocumentFullyLoaded;
/**
 * Wait for the website in the webview to be loaded
 */
function waitForWebsiteLoaded() {
    this.waitForWebViewContextLoaded();
    this.switchToContext(exports.CONTEXT_REF.WEBVIEW);
    this.waitForDocumentFullyLoaded();
    this.switchToContext(exports.CONTEXT_REF.NATIVE);
}
exports.waitForWebsiteLoaded = waitForWebsiteLoaded;
function getElemBySelector(selector, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    return waitForElement(selector, throwError, waitTime);
}
exports.getElemBySelector = getElemBySelector;
function waitForElement(selector, throwError = true, waitTime = constants_1.DEFAULT_TIMEOUT) {
    let elem = $$(selector);
    let it = 0;
    while (elem.length < 1 && it < waitTime / constants_1.DEFAULT_TIMEOUT_INTERVAL) {
        browser.pause(constants_1.DEFAULT_TIMEOUT_INTERVAL);
        it++;
        elem = $$(selector);
    }
    if (elem.length > 0) {
        return elem[0];
    }
    else if (throwError) {
        throw new Error('Element not found: ' + selector);
    }
    else {
        return undefined;
    }
}
exports.waitForElement = waitForElement;
