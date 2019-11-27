import {DEFAULT_TIMEOUT, DEFAULT_TIMEOUT_INTERVAL} from "../constants"

export const CONTEXT_REF = {
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
export function waitForWebViewContextLoaded (): void {
    browser.waitUntil(
        () => {
            const currentContexts = this.getCurrentContexts();
            const result = currentContexts.length > 1 &&
                currentContexts.find((context) => context.toLowerCase().includes(CONTEXT_REF.WEBVIEW)) != null;
            return result;
        },
        DEFAULT_TIMEOUT,
        'Webview context not loaded',
        DEFAULT_TIMEOUT_INTERVAL
    );
}

/**
 * Switch to native or webview context
 *
 * @param {string} context should be native of webview
 */
export function switchToContext (context): void {
    browser.switchContext(this.getCurrentContexts()[context === CONTEXT_REF.WEBVIEW ? 1 : 0]);
}

/**
 * Returns an object with the list of all available contexts
 *
 * @return {object} An object containing the list of all available contexts
 */
export function getCurrentContexts () {
    return browser.getContexts();
}

/**
 * Wait for the document to be fully loaded
 */
export function waitForDocumentFullyLoaded (): void {
    browser.waitUntil(
        () => browser.execute(() => document.readyState) === DOCUMENT_READY_STATE.COMPLETE,
        DEFAULT_TIMEOUT,
        'Website not loaded',
        DEFAULT_TIMEOUT_INTERVAL
    );
}

/**
 * Wait for the website in the webview to be loaded
 */
export function waitForWebsiteLoaded (): void {
    this.waitForWebViewContextLoaded();
    this.switchToContext(CONTEXT_REF.WEBVIEW);
    this.waitForDocumentFullyLoaded();
    this.switchToContext(CONTEXT_REF.NATIVE);
}

export function getElemBySelector (selector: string, throwError: boolean = true, waitTime: number = DEFAULT_TIMEOUT): WebdriverIO.Element | undefined {
    return waitForElement(selector, throwError, waitTime);
}

export function waitForElement (selector: string, throwError: boolean = true, waitTime: number = DEFAULT_TIMEOUT): WebdriverIO.Element | undefined {
    let elem = $$(selector);
    let it = 0;
    while (elem.length < 1 && it < waitTime / DEFAULT_TIMEOUT_INTERVAL) {
        browser.pause(DEFAULT_TIMEOUT_INTERVAL);
        it++;
        elem = $$(selector);
    }
    if (elem.length > 0) {
        return elem[0]
    } else if (throwError) {
        throw new Error('Element not found: ' + selector);
    } else {
        return undefined;
    }
}
