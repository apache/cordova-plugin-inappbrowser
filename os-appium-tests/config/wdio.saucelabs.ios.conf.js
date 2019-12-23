const { config } = require('./wdio.shared.conf');
// ============
// Capabilities
// ============
// For all capabilities please check
// http://appium.io/docs/en/writing-running-appium/caps/#general-capabilities
config.capabilities = [
    {
        // The reference to the app
        testobject_app_id: '', // app version id - find it in saucelabs dashboard app versions
        testobject_api_key: '',
        // You can find more info in the Appium Basic Setup section
        platformName: 'iOS',
        platformVersion: '11',  // e.g. 12
        idleTimeout: 180,
        orientation: 'PORTRAIT',
        newCommandTimeout: 180,
        privateDevicesOnly: false, //use Public or Private Cloud
        enableAnimations: false,
        phoneOnly: true,

    },
];

// =========================
// Sauce RDC specific config
// =========================
// The new version of WebdriverIO will:
// - automatically update the job status in the RDC cloud
// - automatically default to the US RDC cloud
config.services = [ 'sauce' ];
// If you need to connect to the US RDC cloud comment the below line of code
config.region = 'eu';
// and uncomment the below line of code
// config.region = 'us';
config.protocol = 'https';
config.host = 'appium.testobject.com';
config.port = 443;
config.path = '/wd/hub';

// This port was defined in the `wdio.shared.conf.js` for appium
// delete config.port;

exports.config = config;
