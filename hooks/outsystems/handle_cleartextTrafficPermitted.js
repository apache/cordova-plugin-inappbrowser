var fs = require('fs'),
    path = require('path'),
    configXmlParser = require('./config_xml_parser');

const CORDOVA_PREFERENCE_NAME = 'InAppBrowserCleartextTrafficPermitted';
const ANDROID_PREFERENCE_NAME = 'cleartextTrafficPermitted';

/**
 * Validates if the platform is Android
 * @param {object} context Cordova context
 * @returns {boolean} true if the platform is Android
 */
function isPlatformAndroid(context) {
    var platform = context.opts.plugin.platform;
    return platform === 'android';
}

/**
 * Validates if the cleartextTrafficPermitted option should be enabled
 * @param {object} context Cordova context
 * @returns {boolean} true if the option should be enabled
 */
function shouldEnableCleartextTrafficPermitted(context) {
    var projectRoot = context.opts.projectRoot;
    var configPath = path.join(projectRoot, 'config.xml');
    var config = configXmlParser.getConfig(configPath);
    var scope = configXmlParser.getAndroidPlatformScope(config);
    var enable = configXmlParser.getPreferenceValue(scope, CORDOVA_PREFERENCE_NAME);
    return enable === 'true' || enable === 'True';
}

/**
 * Enables the cleartextTrafficPermitted option
 * @param {object} context Cordova context
 */
function enableCleartextTrafficPermitted(context) {
    console.log('Enabling ' + ANDROID_PREFERENCE_NAME + ' option');

    var projectRoot = context.opts.projectRoot;
    var config = path.join(projectRoot, 'res', 'android', 'xml', 'network_security_config.xml');

    if (fs.existsSync(config)) {
        fs.readFile(config, 'utf8', function (err, data) {
            if (err) {
                throw new Error('Unable to find network_security_config.xml: ' + err);
            }

            if (data.indexOf(ANDROID_PREFERENCE_NAME) == -1) {
                var result = data.replace(/<base-config/g, '<base-config ' + ANDROID_PREFERENCE_NAME + '="true"');

                fs.writeFile(config, result, 'utf8', function (err) {
                    if (err) {
                        throw new Error('Unable to write into network_security_config.xml: ' + err);
                    }
                })
            }
        });
    }
}


module.exports = function(context) {
    return new Promise(function(resolve) {

        if (isPlatformAndroid(context) && shouldEnableCleartextTrafficPermitted(context)) {
            enableCleartextTrafficPermitted(context);
        }

        return resolve();
    });
};
