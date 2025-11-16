const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const { RawSource } = require('webpack-sources');

// Allow disabling minification via environment variable for easier debugging
// By default, minification is disabled for easier debugging
// Set MINIFY=true to enable minification for production builds
const shouldMinify = process.env.MINIFY === 'true';

// Plugin to remove source map references from node_modules
class RemoveSourceMapPlugin {
	apply(compiler) {
		compiler.hooks.compilation.tap('RemoveSourceMapPlugin', (compilation) => {
			// Use processAssets hook instead of emit to avoid deprecation warning
			// PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE is the appropriate stage for modifying assets
			compilation.hooks.processAssets.tap(
				{
					name: 'RemoveSourceMapPlugin',
					stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
				},
				() => {
					// Process all chunks
					compilation.chunks.forEach((chunk) => {
						chunk.files.forEach((filename) => {
							// Only process JS files
							if (filename.endsWith('.js')) {
								const asset = compilation.getAsset(filename);
								if (asset) {
									// Get source as string (handles both Source objects and strings)
									const sourceObj = asset.source;
									let source = typeof sourceObj === 'string' 
										? sourceObj 
										: sourceObj.source();

									// Remove source map references from node_modules code
									// This regex matches //# sourceMappingURL=...map at the end of lines
									source = source.replace(
										/\/\/# sourceMappingURL=[^\n]*\.map$/gm,
										''
									);

									// Update asset using the new API with proper Source object
									compilation.updateAsset(filename, new RawSource(source));
								}
							}
						});
					});
				}
			);
		});
	}
}

module.exports = {
	...defaultConfig,
	entry: {
		'admin-settings': './assets/src/admin-settings/index.js',
		'admin-common': './assets/src/admin-common/index.js',
		'export': './assets/src/publish/index.js',
		'admin-bar': './assets/src/admin-bar/AdminBarPublish.js',
	},
	output: {
		...defaultConfig.output,
		path: require('path').resolve(__dirname, 'assets/build'),
		publicPath: '', // Will be set dynamically via __webpack_public_path__ in entry points
		// Prevent webpack from creating chunk files - all code goes into entry bundles
		chunkFilename: undefined,
	},
	optimization: {
		...defaultConfig.optimization,
		minimize: shouldMinify,
		// Completely disable code splitting - bundle everything into single files
		// Setting splitChunks to false prevents webpack from creating any chunks
		splitChunks: false,
		// Disable runtime chunk (prevents webpack runtime from being split)
		runtimeChunk: false,
	},
	performance: {
		// Increase size limits for large bundles (publish.js and admin-bar.js are complex features)
		// These bundles are acceptable for admin-only functionality
		maxAssetSize: 500000, // 500 KiB
		maxEntrypointSize: 500000, // 500 KiB
		hints: 'warning', // Keep as warning to be aware of bundle sizes
	},
	module: {
		...defaultConfig.module,
		parser: {
			...defaultConfig.module?.parser,
			javascript: {
				...defaultConfig.module?.parser?.javascript,
				// Inline dynamic imports instead of creating separate chunk files
				// This ensures ALL code is bundled into the entry file, no chunks created
				dynamicImportMode: 'eager',
			},
		},
	},
	resolve: {
		...defaultConfig.resolve,
		fallback: {
			...defaultConfig.resolve?.fallback,
			// html-minifier-terser uses clean-css which requires Node.js modules
			// Since we're not using CSS minification in html-minifier-terser (minifyCSS: false),
			// we can safely ignore these modules
			fs: false,
			path: false,
			url: false,
			http: false,
			https: false,
			os: false,
		},
	},
	plugins: [
		...defaultConfig.plugins,
		new RemoveSourceMapPlugin(),
	],
};
