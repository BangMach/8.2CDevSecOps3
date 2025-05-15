module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover', 'junit'],
    testMatch: ['**/tests/**/*.test.js'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
        '/coverage/'
    ],
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: 'coverage',
            outputName: 'junit.xml',
            classNameTemplate: '{classname}',
            titleTemplate: '{title}'
        }]
    ]
}; 