const { config } = require('./wdio.shared.conf');
// ============
// Capabilities
// ============
// For all capabilities please check
// http://appium.io/docs/en/writing-running-appium/caps/#general-capabilities
config.capabilities = [
    {
        // The defaults you need to have in your config
        automationName: 'XCUITest',
        deviceName: 'OutSystems',
        platformName: 'iOS',
        platformVersion: '12.1',
        orientation: 'PORTRAIT',
        noReset: true,
    },
];

exports.config = config;
