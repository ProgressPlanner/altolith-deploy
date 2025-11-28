const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const { RawSource } = require( 'webpack-sources' );
const path = require( 'path' );

// Allow disabling minification via environment variable for easier debugging
// By default, minification is disabled for easier debugging
// Set MINIFY=true to enable minification for production builds
const shouldMinify = process.env.MINIFY === 'true';

// Plugin to remove source map references from node_modules
class RemoveSourceMapPlugin {
	apply( compiler ) {
		compiler.hooks.compilation.tap(
			'RemoveSourceMapPlugin',
			( compilation ) => {
				// Use processAssets hook instead of emit to avoid deprecation warning
				// PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE is the appropriate stage for modifying assets
				compilation.hooks.processAssets.tap(
					{
						name: 'RemoveSourceMapPlugin',
						stage: compilation.constructor
							.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
					},
					() => {
						// Process all chunks
						compilation.chunks.forEach( ( chunk ) => {
							chunk.files.forEach( ( filename ) => {
								// Only process JS files
								if ( filename.endsWith( '.js' ) ) {
									const asset =
										compilation.getAsset( filename );
									if ( asset ) {
										// Get source as string (handles both Source objects and strings)
										const sourceObj = asset.source;
										let source =
											typeof sourceObj === 'string'
												? sourceObj
												: sourceObj.source();

										// Remove source map references from node_modules code
										// This regex matches //# sourceMappingURL=...map at the end of lines
										source = source.replace(
											/\/\/# sourceMappingURL=[^\n]*\.map$/gm,
											''
										);

										// Update asset using the new API with proper Source object
										compilation.updateAsset(
											filename,
											new RawSource( source )
										);
									}
								}
							} );
						} );
					}
				);
			}
		);
	}
}

module.exports = {
	...defaultConfig,
	entry: {
		'admin-settings': './assets/src/admin-settings/index.js',
		'admin-bar-export': './assets/src/admin-bar/index.js',
		'export-modal': './assets/src/export-modal/index.js',
		'provider-local-filesystem':
			'./assets/src/providers/local-filesystem/index.js',
	},
	output: {
		...defaultConfig.output,
		path: require( 'path' ).resolve( __dirname, 'assets/build' ),
		publicPath: '', // Will be set dynamically via __webpack_public_path__ in entry points
		// Prevent webpack from creating chunk files - all code goes into entry bundles
		// Setting chunkFilename to undefined ensures no chunk files are created
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
		// Use deterministic module IDs for consistent builds
		moduleIds: 'deterministic',
	},
	performance: {
		// Increase size limits for large bundles (publish.js is a complex feature)
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
		alias: {
			...defaultConfig.resolve?.alias,
			// Path aliases for cleaner imports
			'@altolith/utils': path.resolve( __dirname, 'assets/src/utils' ),
			'@altolith/components': path.resolve(
				__dirname,
				'assets/src/components'
			),
			'@altolith/hooks': path.resolve( __dirname, 'assets/src/hooks' ),
			'@altolith/constants': path.resolve(
				__dirname,
				'assets/src/constants'
			),
			'@altolith/contexts': path.resolve(
				__dirname,
				'assets/src/contexts'
			),
			'@altolith/services': path.resolve(
				__dirname,
				'assets/src/services'
			),
			'@altolith/providers': path.resolve(
				__dirname,
				'assets/src/providers'
			),
			'@altolith/export': path.resolve( __dirname, 'assets/src/export' ),
			'@altolith/admin': path.resolve(
				__dirname,
				'assets/src/admin-settings'
			),
			'@altolith/profiles': path.resolve(
				__dirname,
				'assets/src/profiles'
			),
		},
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
	plugins: [ ...defaultConfig.plugins, new RemoveSourceMapPlugin() ],
};
