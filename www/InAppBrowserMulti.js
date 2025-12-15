/* global require */
const exec = require('cordova/exec');

const SERVICE = 'InAppBrowserMulti';

const _instances = Object.create(null);

/**
 * Stub to report ignored calls on disposed refs.
 * @private
 */
function _noRef () {
    console.warn('[InAppBrowserMulti] Ref is closed; call ignored.');
}

/**
 * Stub to report ignored calls if no windowId.
 * @private
 */
function _noWindowId () {
    console.warn('[InAppBrowserMulti] No windowId; call ignored.');
}

/**
 * Per-instance wrapper for a single InAppBrowser window.
 * Each instance represents one native browser identified by windowId.
 */
class IABWindow {
    constructor (windowId) {
        this.windowId = windowId;
        this.closed = false;
        this._handlers = {};
        _instances[windowId] = this;
    }

    // Helpers
    _dispose () {
        if (this.closed) return;

        this.closed = true;
        this._handlers = {};

        this.show = _noRef;
        this.hide = _noRef;
        this.close = _noRef;
        this.executeScript = _noRef;
        this.insertCSS = _noRef;
        this.addEventListener = _noRef;
        this.removeEventListener = _noRef;
        this.loadAfterBeforeload = _noRef;
    }

    _dispatch (event) {
        const handlers = this._handlers[event.type] || [];
        handlers.forEach(cb => cb(event));

        if (event.type === 'exit') {
            this._dispose();
        }
    }

    // Browser commands
    show (success, fail) {
        if (this.closed) return _noRef();

        exec(success, fail, SERVICE, 'show', [this.windowId]);
    }

    hide (success, fail) {
        if (this.closed) return _noRef();

        exec(success, fail, SERVICE, 'hide', [this.windowId]);
    }

    close (success, fail) {
        if (this.closed) return _noRef();

        exec(success, fail, SERVICE, 'close', [this.windowId]);
    }

    loadAfterBeforeload (url, success, fail) {
        if (this.closed) return _noRef();

        exec(success, fail, SERVICE, 'loadAfterBeforeload', [
            this.windowId,
            url]);
    }

    // Script injection
    executeScript (details, success, fail) {
        if (this.closed) return _noRef();

        const method = details.code ? 'injectScriptCode' : 'injectScriptFile';
        const arg = details.code || details.file;
        exec(success, fail, SERVICE, method, [this.windowId, arg, !!success]);
    }

    insertCSS (details, success, fail) {
        if (this.closed) return _noRef();

        const method = details.code ? 'injectStyleCode' : 'injectStyleFile';
        const arg = details.code || details.file;
        exec(success, fail, SERVICE, method, [this.windowId, arg, !!success]);
    }

    // Events handling
    addEventListener (event, callback) {
        if (this.closed) return _noRef();

        this._handlers[event] = this._handlers[event] || [];
        this._handlers[event].push(callback);
    }

    removeEventListener (event, callback) {
        if (this.closed) return _noRef();

        if (!this._handlers[event]) return;
        this._handlers[event] = this._handlers[event].filter(cb => cb !== callback);
    }
}

/**
 * Static API for convenience and backward compatibility.
 * You can either use the instance API (recommended) or these static methods.
 */
const InAppBrowserMulti = {
    /**
     * Opens a new InAppBrowser instance asynchronously.
     * @param {string} url
     * @param {string} target
     * @param {string} options
     * @param {boolean} asObject  Return IABWindow instance (true) or just windowId (false)
     */
    openAsync (url, target, options, asObject = true) {
        return new Promise((resolve, reject) => {
            exec(
                (result) => {
                    if (result && result.windowId) {
                        resolve(asObject ? new IABWindow(result.windowId) : result.windowId);
                    } else {
                        reject(new Error('No windowId returned from native side.'));
                    }
                },
                reject,
                SERVICE,
                'open',
                [url, target || '_blank', options || '']
            );
        });
    },

    /**
     * Opens a new InAppBrowser instance synchronously.
     * @param {string} url
     * @param {string} target
     * @param {string} options
     * @param {function} success
     * @param {function} fail
     */
    open (url, target = '_blank', options = '', success, fail) {
        const windowId = crypto.randomUUID?.() || String(Date.now());
        const ref = new IABWindow(windowId);

        exec(success, fail, 'InAppBrowserMulti', 'open', [url, target, options, windowId]);

        return ref;
    },

    // Helpers
    getBrowserInstance (windowId) {
        return _instances[windowId];
    },

    getBrowserInstances () {
        return _instances;
    },

    // Browser commands
    show (windowId, success, fail) {
        if (!windowId) return _noWindowId();
        if (_instances[windowId]?.closed) return _noRef();

        _instances[windowId].show(success, fail);
    },

    hide (windowId, success, fail) {
        if (!windowId) return _noWindowId();
        if (_instances[windowId]?.closed) return _noRef();

        _instances[windowId].hide(success, fail);
    },

    close (windowId, success, fail) {
        if (!windowId) return _noWindowId();
        if (_instances[windowId]?.closed) return _noRef();

        _instances[windowId].close(success, fail);
    },

    loadAfterBeforeload (windowId, url, success, fail) {
        if (!windowId) return _noWindowId();
        if (_instances[windowId]?.closed) return _noRef();

        _instances[windowId].loadAfterBeforeload(url, success, fail);
    },

    // Script injection
    executeScript (windowId, details, success, fail) {
        if (!windowId) return _noWindowId();
        if (_instances[windowId]?.closed) return _noRef();

        _instances[windowId].executeScript(details, success, fail);
    },

    insertCSS (windowId, details, success, fail) {
        if (!windowId) return _noWindowId();
        if (_instances[windowId]?.closed) return _noRef();

        _instances[windowId].insertCSS(details, success, fail);
    },

    // Events handling
    addEventListener (windowId, event, callback) {
        if (!windowId) return _noWindowId();
        if (_instances[windowId]?.closed) return _noRef();

        _instances[windowId].addEventListener(event, callback);
    },

    removeEventListener (windowId, event, callback) {
        if (!windowId) return _noWindowId();
        if (_instances[windowId]?.closed) return _noRef();

        _instances[windowId].removeEventListener(event, callback);
    }
};

// Monitor and coordinate events for all browsers
exec((event) => {
    if (!event?.windowId) {
        console.debug('received in observerEvents callback', event);
        return;
    }

    const ref = _instances[event.windowId];

    if (ref) ref._dispatch(event);
}, null, SERVICE, 'observeEvents', []);

module.exports = InAppBrowserMulti;
module.exports.IABWindow = IABWindow;
