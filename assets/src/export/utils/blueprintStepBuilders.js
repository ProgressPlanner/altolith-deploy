/**
 * Blueprint Step Builders
 *
 * Utility functions for constructing individual WordPress Playground blueprint steps.
 * Each function is responsible for creating a single step or group of related steps.
 *
 */

import { applyFilters } from '@wordpress/hooks';

/**
 * Build the importWordPressFiles step for importing wp-content.zip.
 *
 * Uses 'bundled' resource type to reference wp-content.zip inside the blueprint-bundle.zip.
 *
 * @return {Object} Blueprint step object.
 */
export function buildImportFilesStep() {
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
 * Build complete blueprint steps array.
 *
 * @param {Object} config              Configuration object.
 * @param {Array}  config.wporgPlugins WordPress.org plugin slugs.
 * @param {Array}  config.wporgThemes  WordPress.org theme slugs.
 * @return {Array<Object>} Complete array of blueprint steps.
 */
export function buildBlueprintSteps( config ) {
	const { wporgPlugins = [], wporgThemes = [] } = config;

	const steps = [];

	// Step 1: Import WordPress files (wp-content.zip from bundle).
	steps.push( buildImportFilesStep() );

	// Step 2: Install WordPress.org plugins.
	steps.push( ...buildPluginInstallSteps( wporgPlugins ) );

	// Step 3: Install WordPress.org themes.
	steps.push( ...buildThemeInstallSteps( wporgThemes ) );

	/**
	 * Filter blueprint steps array.
	 *
	 * Allows modification of blueprint steps before final JSON generation.
	 *
	 * @param {Array<Object>} steps  Blueprint steps array.
	 * @param {Object}        config Configuration object with wporgPlugins, wporgThemes.
	 *
	 * @example
	 * import { addFilter } from '@wordpress/hooks';
	 *
	 * addFilter('aether.export.step.createBlueprintBundle.steps', 'my-plugin', (steps, config) => {
	 *     // Add custom step at the end
	 *     steps.push({
	 *         step: 'runPHP',
	 *         code: '<?php update_option("my_custom_option", "value"); ?>'
	 *     });
	 *     return steps;
	 * });
	 */
	return applyFilters(
		'aether.export.step.createBlueprintBundle.steps',
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
	 * addFilter('aether.export.step.createBlueprintBundle.json', 'my-plugin', (blueprint, steps) => {
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
		'aether.export.step.createBlueprintBundle.json',
		blueprint,
		steps
	);
}
