module.exports = {
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	globals: {
		r2SyncAdmin: 'readonly',
		r2SyncLogger: 'readonly',
		r2SyncPublish: 'readonly',
		localStorage: 'readonly',
		confirm: 'readonly',
		jQuery: 'readonly',
		navigator: 'readonly',
		alert: 'readonly',
		location: 'readonly',
		requestAnimationFrame: 'readonly',
	},
	rules: {
		'no-console': 'off', // Allow console statements in this project
		'no-alert': 'off', // Allow alerts for confirmations
		'jsdoc/require-param-type': 'off', // Types in JSDoc not required
		'@wordpress/no-unused-vars-before-return': 'off', // Allow early variable assignment
	},
	overrides: [
		{
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
