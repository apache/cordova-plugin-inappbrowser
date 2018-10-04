/**
 * Created by SinceTV on 13.02.17.
 */
var InAppBrowser = require('cordova-plugin-inappbrowser.inappbrowser');
module.exports = {
    setDefaultOptions: function (options) {
        InAppBrowser.setDefaultOptions(options);
        return InAppBrowser.getDefaultOptions();
    },
    getDefaultOptions: function () {
        return InAppBrowser.getDefaultOptions();
    }
};
