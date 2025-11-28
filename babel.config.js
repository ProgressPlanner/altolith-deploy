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
					'@altolith/utils': './assets/src/utils',
					'@altolith/components': './assets/src/components',
					'@altolith/hooks': './assets/src/hooks',
					'@altolith/constants': './assets/src/constants',
					'@altolith/contexts': './assets/src/contexts',
					'@altolith/services': './assets/src/services',
					'@altolith/providers': './assets/src/providers',
					'@altolith/publish': './assets/src/publish',
					'@altolith/admin': './assets/src/admin-settings',
				},
			},
		],
	],
};
