const { config } = require('./wdio.shared.conf');
const { join } = require('path');
// ============
// Capabilities
// ============
// For all capabilities please check
// http://appium.io/docs/en/writing-running-appium/caps/#general-capabilities
config.capabilities = [
    {
        // The defaults you need to have in your config
        automationName: 'XCUITest',
        deviceName: 'iPhone 11 Pro',
        platformName: 'iOS',
       // platformVersion: '13.2',
        orientation: 'PORTRAIT',
        app: join(process.cwd(), 'apps/InAppBrowser_Sample_App.zip'),
        noReset: true,
    },
];

exports.config = config;
