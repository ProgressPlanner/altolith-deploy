module.exports = {
	testEnvironment: 'jsdom',
	roots: [ '<rootDir>/tests/js', '<rootDir>/assets/src' ],
	testMatch: [
		'**/__tests__/**/*.js',
		'**/?(*.)+(spec|test).js',
		'**/__tests__/**/*.jsx',
		'**/?(*.)+(spec|test).jsx',
	],
	collectCoverageFrom: [
		'assets/src/**/*.{js,jsx}',
		'!assets/src/**/*.test.{js,jsx}',
		'!assets/src/**/__tests__/**',
		'!**/node_modules/**',
		'!**/vendor/**',
	],
	coverageDirectory: 'coverage/js',
	coverageReporters: [ 'text', 'lcov', 'html' ],
	setupFilesAfterEnv: [ '<rootDir>/tests/js/setup.js' ],
	moduleNameMapper: {
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
		// Path aliases for cleaner imports (must match webpack.config.js)
		'^@aether/utils/(.*)$': '<rootDir>/assets/src/utils/$1',
		'^@aether/utils$': '<rootDir>/assets/src/utils',
		'^@aether/components/(.*)$': '<rootDir>/assets/src/components/$1',
		'^@aether/components$': '<rootDir>/assets/src/components',
		'^@aether/hooks/(.*)$': '<rootDir>/assets/src/hooks/$1',
		'^@aether/hooks$': '<rootDir>/assets/src/hooks',
		'^@aether/constants/(.*)$': '<rootDir>/assets/src/constants/$1',
		'^@aether/constants$': '<rootDir>/assets/src/constants',
		'^@aether/contexts/(.*)$': '<rootDir>/assets/src/contexts/$1',
		'^@aether/contexts$': '<rootDir>/assets/src/contexts',
		'^@aether/services/(.*)$': '<rootDir>/assets/src/services/$1',
		'^@aether/services$': '<rootDir>/assets/src/services',
		'^@aether/providers/(.*)$': '<rootDir>/assets/src/providers/$1',
		'^@aether/providers$': '<rootDir>/assets/src/providers',
		'^@aether/export/(.*)$': '<rootDir>/assets/src/export/$1',
		'^@aether/export$': '<rootDir>/assets/src/export',
		'^@aether/admin/(.*)$': '<rootDir>/assets/src/admin-settings/$1',
		'^@aether/admin$': '<rootDir>/assets/src/admin-settings',
	},
	transform: {
		'^.+\\.(js|jsx)$': [
			'babel-jest',
			{ configFile: './babel.config.js' },
		],
	},
	transformIgnorePatterns: [
		'node_modules/(?!(p-retry|retry|is-network-error|parse5|uuid)/)',
	],
	globals: {
		wpApiSettings: {
			root: 'http://localhost/wp-json/',
			nonce: 'test-nonce',
		},
	},
	// Memory optimization settings
	maxWorkers: 1,
	workerIdleMemoryLimit: '512MB',
	testTimeout: 10000,
};
