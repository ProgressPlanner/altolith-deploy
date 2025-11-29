/**
 * Blueprint Step Builders
 *
 * Utility functions for constructing individual WordPress Playground blueprint steps.
 * Each function is responsible for creating a single step or group of related steps.
 *
 * Supports two resource modes:
 * - 'bundled': Resources are bundled inside a blueprint-bundle.zip file
 * - 'url': Resources are hosted at a public URL (e.g., CDN, S3, R2)
 *
 */

import { applyFilters } from '@wordpress/hooks';

/**
 * Build the importWordPressFiles step for importing wp-content.zip.
 *
 * @param {Object} options           Options object.
 * @param {string} options.baseUrl   Base URL for URL-based resources (optional).
 * @param {string} options.subfolder Subfolder path for blueprint files (optional, e.g., 'playground').
 * @return {Object} Blueprint step object.
 */
export function buildImportFilesStep( options = {} ) {
	const { baseUrl, subfolder = '' } = options;

	// Build the path/URL to wp-content.zip
	if ( baseUrl ) {
		// URL-based resource
		const subfolderPath = subfolder ? `${ subfolder }/` : '';
		return {
			step: 'importWordPressFiles',
			wordPressFilesZip: {
				resource: 'url',
				url: `${ baseUrl }/${ subfolderPath }wp-content.zip`,
			},
		};
	}

	// Bundled resource (legacy mode)
	return {
		step: 'importWordPressFiles',
		wordPressFilesZip: {
			resource: 'bundled',
			path: '/wp-content.zip',
		},
	};
}

/**
 * Build installPlugin steps for WordPress.org plugins.
 *
 * @param {Array<string>} pluginSlugs Array of WordPress.org plugin slugs.
 * @return {Array<Object>} Array of blueprint step objects.
 */
export function buildPluginInstallSteps( pluginSlugs ) {
	if ( ! Array.isArray( pluginSlugs ) ) {
		return [];
	}

	return pluginSlugs.map( ( slug ) => ( {
		step: 'installPlugin',
		pluginData: {
			resource: 'wordpress.org/plugins',
			slug,
		},
		options: {
			activate: false,
		},
	} ) );
}

/**
 * Build installTheme steps for WordPress.org themes.
 *
 * @param {Array<string>} themeSlugs Array of WordPress.org theme slugs.
 * @return {Array<Object>} Array of blueprint step objects.
 */
export function buildThemeInstallSteps( themeSlugs ) {
	if ( ! Array.isArray( themeSlugs ) ) {
		return [];
	}

	return themeSlugs.map( ( slug ) => ( {
		step: 'installTheme',
		themeData: {
			resource: 'wordpress.org/themes',
			slug,
		},
		options: {
			activate: false,
		},
	} ) );
}

/**
 * Build installPlugin step for a custom plugin.
 *
 * Supports both bundled and URL-based resources.
 *
 * @param {string} slug              Plugin slug (directory name).
 * @param {Object} options           Options object.
 * @param {string} options.baseUrl   Base URL for URL-based resources (optional).
 * @param {string} options.subfolder Subfolder path for blueprint files (optional).
 * @return {Object} Blueprint step object.
 */
export function buildCustomPluginStep( slug, options = {} ) {
	const { baseUrl, subfolder = '' } = options;

	if ( baseUrl ) {
		// URL-based resource
		const subfolderPath = subfolder ? `${ subfolder }/` : '';
		return {
			step: 'installPlugin',
			pluginData: {
				resource: 'url',
				url: `${ baseUrl }/${ subfolderPath }plugins/${ slug }.zip`,
			},
			options: {
				activate: false,
			},
		};
	}

	// Bundled resource (legacy mode)
	return {
		step: 'installPlugin',
		pluginData: {
			resource: 'bundled',
			path: `/plugins/${ slug }.zip`,
		},
		options: {
			activate: false,
		},
	};
}

/**
 * Build installTheme step for a custom theme.
 *
 * Supports both bundled and URL-based resources.
 *
 * @param {string} slug              Theme slug (directory name).
 * @param {Object} options           Options object.
 * @param {string} options.baseUrl   Base URL for URL-based resources (optional).
 * @param {string} options.subfolder Subfolder path for blueprint files (optional).
 * @return {Object} Blueprint step object.
 */
export function buildCustomThemeStep( slug, options = {} ) {
	const { baseUrl, subfolder = '' } = options;

	if ( baseUrl ) {
		// URL-based resource
		const subfolderPath = subfolder ? `${ subfolder }/` : '';
		return {
			step: 'installTheme',
			themeData: {
				resource: 'url',
				url: `${ baseUrl }/${ subfolderPath }themes/${ slug }.zip`,
			},
			options: {
				activate: false,
			},
		};
	}

	// Bundled resource (legacy mode)
	return {
		step: 'installTheme',
		themeData: {
			resource: 'bundled',
			path: `/themes/${ slug }.zip`,
		},
		options: {
			activate: false,
		},
	};
}

/**
 * Build installPlugin steps for custom plugins.
 *
 * @param {Array<string>} pluginSlugs Array of custom plugin slugs.
 * @param {Object}        options     Options object with baseUrl and subfolder.
 * @return {Array<Object>} Array of blueprint step objects.
 */
export function buildCustomPluginSteps( pluginSlugs, options = {} ) {
	if ( ! Array.isArray( pluginSlugs ) ) {
		return [];
	}

	return pluginSlugs.map( ( slug ) =>
		buildCustomPluginStep( slug, options )
	);
}

/**
 * Build installTheme steps for custom themes.
 *
 * @param {Array<string>} themeSlugs Array of custom theme slugs.
 * @param {Object}        options    Options object with baseUrl and subfolder.
 * @return {Array<Object>} Array of blueprint step objects.
 */
export function buildCustomThemeSteps( themeSlugs, options = {} ) {
	if ( ! Array.isArray( themeSlugs ) ) {
		return [];
	}

	return themeSlugs.map( ( slug ) => buildCustomThemeStep( slug, options ) );
}

/**
 * Build complete blueprint steps array.
 *
 * @param {Object} config               Configuration object.
 * @param {Array}  config.wporgPlugins  WordPress.org plugin slugs.
 * @param {Array}  config.wporgThemes   WordPress.org theme slugs.
 * @param {Array}  config.customPlugins Custom plugin slugs.
 * @param {Array}  config.customThemes  Custom theme slugs.
 * @param {string} config.baseUrl       Base URL for URL-based resources (optional).
 * @param {string} config.subfolder     Subfolder path for blueprint files (optional, e.g., 'playground').
 * @return {Array<Object>} Complete array of blueprint steps.
 */
export function buildBlueprintSteps( config ) {
	const {
		wporgPlugins = [],
		wporgThemes = [],
		customPlugins = [],
		customThemes = [],
		baseUrl,
		subfolder = '',
	} = config;

	const steps = [];

	// Options for URL-based or bundled resources
	const resourceOptions = { baseUrl, subfolder };

	// Step 1: Import WordPress files (wp-content.zip).
	steps.push( buildImportFilesStep( resourceOptions ) );

	// Step 2: Install WordPress.org plugins.
	steps.push( ...buildPluginInstallSteps( wporgPlugins ) );

	// Step 3: Install custom plugins.
	steps.push( ...buildCustomPluginSteps( customPlugins, resourceOptions ) );

	// Step 4: Install WordPress.org themes.
	steps.push( ...buildThemeInstallSteps( wporgThemes ) );

	// Step 5: Install custom themes.
	steps.push( ...buildCustomThemeSteps( customThemes, resourceOptions ) );

	/**
	 * Filter blueprint steps array.
	 *
	 * Allows modification of blueprint steps before final JSON generation.
	 *
	 * @param {Array<Object>} steps  Blueprint steps array.
	 * @param {Object}        config Configuration object with wporgPlugins, wporgThemes, customPlugins, customThemes.
	 *
	 * @example
	 * import { addFilter } from '@wordpress/hooks';
	 *
	 * addFilter('altolith.blueprint.steps', 'my-plugin', (steps, config) => {
	 *     // Add custom step at the end
	 *     steps.push({
	 *         step: 'runPHP',
	 *         code: '<?php update_option("my_custom_option", "value"); ?>'
	 *     });
	 *     return steps;
	 * });
	 */
	return applyFilters(
		'altolith.blueprint.steps',
		steps,
		config
	);
}

/**
 * Build complete blueprint JSON object.
 *
 * @param {Array} steps Blueprint steps array.
 * @return {Object} Complete blueprint JSON.
 */
export function buildBlueprintJson( steps ) {
	const blueprint = {
		$schema: 'https://playground.wordpress.net/blueprint-schema.json',
		landingPage: '/wp-login.php',
		preferredVersions: {
			php: '8.4',
			wp: 'latest',
		},
		features: {
			networking: true,
		},
		steps,
	};

	/**
	 * Filter complete blueprint JSON object.
	 *
	 * Allows modification of the final blueprint configuration.
	 *
	 * @param {Object} blueprint Complete blueprint JSON object.
	 * @param {Array}  steps     Blueprint steps array.
	 *
	 * @example
	 * import { addFilter } from '@wordpress/hooks';
	 *
	 * addFilter('altolith.blueprint.json', 'my-plugin', (blueprint, steps) => {
	 *     // Customize landing page
	 *     blueprint.landingPage = '/wp-admin/';
	 *
	 *     // Change PHP version
	 *     blueprint.preferredVersions.php = '8.3';
	 *
	 *     // Add login credentials
	 *     blueprint.login = {
	 *         username: 'admin',
	 *         password: 'password'
	 *     };
	 *
	 *     return blueprint;
	 * });
	 */
	return applyFilters(
		'altolith.blueprint.json',
		blueprint,
		steps
	);
}
