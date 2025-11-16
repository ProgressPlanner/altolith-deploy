/**
 * Webpack configuration for Aether Site Exporter
 *
 * Extends @wordpress/scripts default webpack config.
 */

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		// Main admin interface
		admin: path.resolve( process.cwd(), 'assets/src', 'admin.js' ),
	},
	output: {
		path: path.resolve( process.cwd(), 'assets/build' ),
		filename: '[name].js',
	},
};
