const { join } = require('path');
const { config } = require('./wdio.shared.conf');
const waitforTimeout = 30 * 60000;
const commandTimeout = 30 * 60000;

// ============
// Capabilities
// ============
// For all capabilities please check
// http://appium.io/docs/en/writing-running-appium/caps/#general-capabilities
config.capabilities = [
    {
        //automationName: 'UiAutomator2',
        platformName: 'Android',
        deviceName: 'Nexus',
        app: join(process.cwd(), './apps/InAppBrowser_Sample_App.apk'), // Path to your native app
       //  chromedriver: join(process.cwd(), 'chromedriver/chromedriver_75.exe'),
        waitforTimeout: waitforTimeout,
        commandTimeout: commandTimeout,
        newCommandTimeout: 30 * 60000,
        locationServicesEnabled: true,
        locationServicesAuthorized: true,
        noReset: true
    },
];

exports.config = config;
