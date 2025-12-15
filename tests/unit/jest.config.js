module.exports = {
    rootDir: '../../',
    testEnvironment: 'node',
    moduleFileExtensions: ['js'],
    moduleNameMapper: {
        '^cordova/(.*)$': '<rootDir>/__mocks__/cordova/$1.js'
    },
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/www/**/*.js',
        '!<rootDir>/node_modules/'
    ]
};
