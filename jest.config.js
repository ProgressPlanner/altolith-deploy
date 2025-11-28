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
		'^@altolith/utils/(.*)$': '<rootDir>/assets/src/utils/$1',
		'^@altolith/utils$': '<rootDir>/assets/src/utils',
		'^@altolith/components/(.*)$': '<rootDir>/assets/src/components/$1',
		'^@altolith/components$': '<rootDir>/assets/src/components',
		'^@altolith/hooks/(.*)$': '<rootDir>/assets/src/hooks/$1',
		'^@altolith/hooks$': '<rootDir>/assets/src/hooks',
		'^@altolith/constants/(.*)$': '<rootDir>/assets/src/constants/$1',
		'^@altolith/constants$': '<rootDir>/assets/src/constants',
		'^@altolith/contexts/(.*)$': '<rootDir>/assets/src/contexts/$1',
		'^@altolith/contexts$': '<rootDir>/assets/src/contexts',
		'^@altolith/services/(.*)$': '<rootDir>/assets/src/services/$1',
		'^@altolith/services$': '<rootDir>/assets/src/services',
		'^@altolith/providers/(.*)$': '<rootDir>/assets/src/providers/$1',
		'^@altolith/providers$': '<rootDir>/assets/src/providers',
		'^@altolith/export/(.*)$': '<rootDir>/assets/src/export/$1',
		'^@altolith/export$': '<rootDir>/assets/src/export',
		'^@altolith/admin/(.*)$': '<rootDir>/assets/src/admin-settings/$1',
		'^@altolith/admin$': '<rootDir>/assets/src/admin-settings',
		'^@altolith/profiles/(.*)$': '<rootDir>/assets/src/profiles/$1',
		'^@altolith/profiles$': '<rootDir>/assets/src/profiles',
	},
	transform: {
		'^.+\\.(js|jsx)$': [
			'babel-jest',
			{ configFile: './babel.config.js' },
		],
	},
	transformIgnorePatterns: [
		'node_modules/(?!(p-retry|retry|is-network-error|parse5)/)',
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
