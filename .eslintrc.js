module.exports = {
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended',
		'plugin:jest/recommended',
	],
	env: {
		browser: true,
		es2021: true,
		node: true,
		jest: true,
	},
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	rules: {
		'react/react-in-jsx-scope': 'off', // Not needed with React 17+
		'@wordpress/no-unused-vars-before-return': 'off',
		'jsdoc/require-jsdoc': 'off',
		'jsdoc/require-param': 'off',
		'jsdoc/require-returns': 'off',
	},
	globals: {
		wp: 'readonly',
		wpApiSettings: 'readonly',
	},
};
