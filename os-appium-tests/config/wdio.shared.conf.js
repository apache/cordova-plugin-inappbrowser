exports.config = {
    maxInstances: 1,
    // ============
    // Specs
    // ============
    specs: [
        './tests/specs/**/*.spec.ts'
    ],

    // define specific suites
    suites: {
        home: ['./tests/specs/sample/sample.spec.ts']
    },

    // ====================
    // Appium Configuration
    // ====================
    // Default port for Appium
    port: 4723,

    // ====================
    // Runner and framework
    // Configuration
    // ====================
    runner: 'local',
    framework: 'jasmine',
    jasmineNodeOpts: {
        compiler: ['ts:ts-node/register'],
        // Updated the timeout to 30 seconds due to possible longer appium calls
        // When using XPATH
        defaultTimeoutInterval: 120000

    },
    sync: true,
    logLevel: 'error',
    deprecationWarnings: true,
    bail: 0,
    baseUrl: '',
    waitforTimeout: 10000,
    connectionRetryTimeout: 30000,
    connectionRetryCount: 1,
    reporters: [
        ['allure',
            {
                disableWebdriverScreenshotsReporting: true,
                outputDir: './allure-results'
            }],
        'spec'
    ],

    // ====================
    // Some hooks
    // ====================
    afterTest: function (test) {
        //debugger;
       console.log(test);
       /* if (!test.passed) {
            browser.takeScreenshot();
        } */
    },

    beforeSession: (config, capabilities, specs) => {
        require('ts-node').register({files: true});
    },

    /**
     * hooks help us execute the repetitive and common utilities
     * of the project.
     */
    onPrepare: function () {
        console.log('<<< TESTS STARTED >>>');
    },

    onComplete: function () {
        console.log('<<< TESTING FINISHED >>>');
    }
};
