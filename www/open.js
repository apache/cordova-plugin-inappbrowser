/**
 * Created by SinceTV on 13.02.17.
 */
var modulemapper = require('cordova/modulemapper');
var exec         = require('cordova/exec');
var urlutil      = require('cordova/urlutil');

var InAppBrowser = require('cordova-plugin-inappbrowser.inappbrowser');

function getOpts (oldOpts, newOpts) {
    var res = '', keys, priorityBasedOpts;

    newOpts = newOpts.match(/([^,]+)/g);

    if (newOpts) {
        priorityBasedOpts = oldOpts.split(',')
            .concat(newOpts)
            .reduce(function (acum, elem) {
                var splitted = elem.split('=');
                if (!acum[splitted[0]] || acum[splitted[0]].indexOf('(required)') === -1) {
                    acum[splitted[0]] = splitted[1];
                }
                return acum;
            }, {});
        keys = Object.keys(priorityBasedOpts);
        res = keys.map(function(key) {
            return key + '=' + priorityBasedOpts[key];
        }).join(',').replace(/\(required\)/g, '');
    } else {
        res = oldOpts;
    }
    return res;
}

module.exports = function(strUrl, strWindowName, strWindowFeatures, callbacks) {
    // Don't catch calls that write to existing frames (e.g. named iframes).
    var instance = new InAppBrowser();

    if (window.frames && window.frames[strWindowName]) {
        var origOpenFunc = modulemapper.getOriginalSymbol(window, 'open');
        return origOpenFunc.apply(window, arguments);
    }

    strUrl = urlutil.makeAbsolute(strUrl);

    callbacks = callbacks || {};
    for (var callbackName in callbacks) {
        instance.addEventListener(callbackName, callbacks[callbackName]);
    }

    var cb = function(eventname) {
        instance._eventHandler(eventname);
    };

    strWindowFeatures = strWindowFeatures || '';

    exec(cb, cb, "InAppBrowser", "open", [strUrl, strWindowName, getOpts(instance.constructor.getDefaultOptions(), strWindowFeatures)]);
    return instance;
};