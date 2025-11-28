const path = require( 'path' );

module.exports = {
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	globals: {
		r2SyncAdmin: 'readonly',
		r2SyncLogger: 'readonly',
		altolithExport: 'readonly',
		localStorage: 'readonly',
		confirm: 'readonly',
		jQuery: 'readonly',
		navigator: 'readonly',
		alert: 'readonly',
		location: 'readonly',
		requestAnimationFrame: 'readonly',
	},
	settings: {
		'import/resolver': {
			alias: {
				map: [
					[
						'@altolith/utils',
						path.resolve( __dirname, 'assets/src/utils' ),
					],
					[
						'@altolith/components',
						path.resolve( __dirname, 'assets/src/components' ),
					],
					[
						'@altolith/hooks',
						path.resolve( __dirname, 'assets/src/hooks' ),
					],
					[
						'@altolith/constants',
						path.resolve( __dirname, 'assets/src/constants' ),
					],
					[
						'@altolith/contexts',
						path.resolve( __dirname, 'assets/src/contexts' ),
					],
					[
						'@altolith/services',
						path.resolve( __dirname, 'assets/src/services' ),
					],
					[
						'@altolith/providers',
						path.resolve( __dirname, 'assets/src/providers' ),
					],
					[
						'@altolith/export',
						path.resolve( __dirname, 'assets/src/export' ),
					],
					[
						'@altolith/admin',
						path.resolve( __dirname, 'assets/src/admin-settings' ),
					],
				],
				extensions: [ '.js', '.jsx', '.json' ],
			},
		},
	},
	rules: {
		'no-console': 'off', // Allow console statements in this project
		'no-alert': 'off', // Allow alerts for confirmations
		'jsdoc/require-param-type': 'off', // Types in JSDoc not required
		'@wordpress/no-unused-vars-before-return': 'off', // Allow early variable assignment
	},
	overrides: [
		{
			// Node.js config files (webpack.config.js, jest.config.js, babel.config.js, etc.)
			files: [
				'webpack.config.js',
				'jest.config.js',
				'babel.config.js',
				'*.config.js',
				'scripts/**/*.js',
				'bin/**/*.js',
			],
			env: {
				node: true,
			},
			rules: {
				'@wordpress/no-unsafe-wp-apis': 'off', // Config files don't use WordPress APIs
				'jsdoc/require-param': 'off', // Relax JSDoc for config files
				'jsdoc/require-returns': 'off',
				'import/no-extraneous-dependencies': 'off', // Config files may use dev dependencies
			},
		},
		{
			// Cloudflare Workers (run in Workers runtime, not browser or Node)
			files: [ 'assets/workers/**/*.js' ],
			env: {
				worker: true,
			},
			globals: {
				Request: 'readonly',
				Response: 'readonly',
				Headers: 'readonly',
				URL: 'readonly',
				URLSearchParams: 'readonly',
				fetch: 'readonly',
				caches: 'readonly',
				crypto: 'readonly',
				atob: 'readonly',
				btoa: 'readonly',
				TextEncoder: 'readonly',
				TextDecoder: 'readonly',
			},
			rules: {
				'@wordpress/no-unsafe-wp-apis': 'off', // Workers don't use WordPress APIs
				'jsdoc/check-tag-names': 'off', // Allow 'returns' instead of 'return' in JSDoc
			},
		},
		{
			// Test files
			files: [
				'tests/**/*.test.js',
				'tests/**/*.spec.js',
				'tests/**/setup.js',
				'tests/**/helpers/**/*.js',
				'tests/**/Helpers/**/*.js',
				'**/__tests__/**/*.js',
				'**/*.test.js',
			],
			env: {
				jest: true,
				node: true,
			},
			globals: {
				Element: 'readonly',
				HTMLElement: 'readonly',
				page: 'readonly',
				browser: 'readonly',
				context: 'readonly',
				playwright: 'readonly',
			},
			rules: {
				'jsdoc/check-tag-names': 'off', // Allow @jest-environment pragma
				'no-console': 'off', // Allow console in tests
				'jsdoc/require-returns-description': 'off', // Relax JSDoc requirements in tests
				'no-unused-vars': 'off', // Allow unused vars in tests (common for test setup)
				'@wordpress/no-unused-vars-before-return': 'off', // Allow unused vars in tests
				'no-shadow': 'warn', // Warn instead of error for shadowed variables in tests
				'no-nested-ternary': 'warn', // Warn instead of error for nested ternaries in tests
			},
		},
	],
};
