module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					node: 'current',
				},
			},
		],
		[
			'@babel/preset-react',
			{
				runtime: 'automatic',
			},
		],
	],
	plugins: [
		[
			'module-resolver',
			{
				root: [ './assets/src' ],
				alias: {
					'@aether/utils': './assets/src/utils',
					'@aether/components': './assets/src/components',
					'@aether/hooks': './assets/src/hooks',
					'@aether/constants': './assets/src/constants',
					'@aether/contexts': './assets/src/contexts',
					'@aether/services': './assets/src/services',
					'@aether/providers': './assets/src/providers',
					'@aether/publish': './assets/src/publish',
					'@aether/admin': './assets/src/admin-settings',
				},
			},
		],
	],
};
