var fs = require('fs'),
    xml2js = require('xml2js');

/**
 * Reads a config.xml file and returns an object with its contents
 * @param {object} configPath path to a config.xml file
 * @returns {object} config object with the contents of the file
 */
function getConfig(configPath) {
    var scope;
    var fileData = fs.readFileSync(configPath, 'ascii');
    var parser = new xml2js.Parser();
    parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
        scope = result;
    });
    return scope;
}

/**
 * Gets the widget scope of a config object
 * @param {object} config config object
 * @returns {object} scope object with the widget scope
 */
function getWidgetScope(config) {
    return config ? config.widget : undefined;
}

/**
 * Gets a platform scope of a config object by platform name
 * @param {object} config config object
 * @param {string} platform platform name
 * @returns {object} scope object with the requested platform scope
 */
function getPlatformScope(config, platform) {
    var widget = getWidgetScope(config);
    var platforms = widget ? widget.platform : undefined;
    return platforms ? platforms.find(element => element.$.name === platform) : undefined;
}

/**
 * Gets the Android platform scope of a config object
 * Alias for getPlatformScope(config, 'android')
 * @param {object} config config object
 * @returns {object} scope object with the Android platform scope
 */
function getAndroidPlatformScope(config) {
    return getPlatformScope(config, 'android');
}

/**
 * Gets the preference value of a scope by preference name
 * @param {object} scope scope object (such as widget or platform scope)
 * @param {string} name preference name
 * @returns {string} value of the requested preference
 */
function getPreferenceValue(scope, name) {
    var preferences = scope ? scope.preference : undefined;
    var requested = preferences ? preferences.find(element => element.$.name === name) : undefined;
    return requested ? requested.$.value : undefined;
}


module.exports = {
    getConfig: getConfig,
    getWidgetScope: getWidgetScope,
    getPlatformScope: getPlatformScope,
    getAndroidPlatformScope: getAndroidPlatformScope,
    getPreferenceValue: getPreferenceValue,
};
