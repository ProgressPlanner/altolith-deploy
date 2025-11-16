/**
 * Blueprint Step Builders
 *
 * Utility functions for constructing individual WordPress Playground blueprint steps.
 * Each function is responsible for creating a single step or group of related steps.
 *
 * @package
 */

/**
 * Production zip URL for Aether plugin (matches PHP constant AETHER_PRODUCTION_ZIP_URL).
 */
const AETHER_PRODUCTION_ZIP_URL = 'https://r2.s12y.org/aether.zip';

/**
 * Build the importWordPressFiles step for importing wp-content.zip.
 *
 * @param {string} wpContentUrl URL to the wp-content.zip file.
 * @return {Object} Blueprint step object.
 */
export function buildImportFilesStep( wpContentUrl ) {
	return {
		step: 'importWordPressFiles',
		wordPressFilesZip: {
			resource: 'url',
			url: wpContentUrl,
		},
	};
}

/**
 * Build the installPlugin step for Aether plugin.
 *
 * @return {Object} Blueprint step object.
 */
export function buildAetherInstallStep() {
	// Add cache-busting to ensure fresh download.
	const aetherUrl = `${ AETHER_PRODUCTION_ZIP_URL }?v=${ Date.now() }`;

	return {
		step: 'installPlugin',
		pluginData: {
			resource: 'url',
			url: aetherUrl,
			caption: 'Installing Aether plugin',
		},
		options: {
			activate: false,
		},
	};
}

/**
 * Build the defineWpConfigConsts step to identify Playground environment.
 *
 * @return {Object} Blueprint step object.
 */
export function buildDefineConstsStep() {
	return {
		step: 'defineWpConfigConsts',
		consts: {
			AETHER_PLAYGROUND_SITE: true,
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
 * Build the activatePlugin step for Aether plugin.
 *
 * @return {Object} Blueprint step object.
 */
export function buildAetherActivationStep() {
	return {
		step: 'activatePlugin',
		pluginPath: 'aether/aether.php',
	};
}

/**
 * Build complete blueprint steps array.
 *
 * @param {Object} config              Configuration object.
 * @param {string} config.wpContentUrl URL to wp-content.zip.
 * @param {Array}  config.wporgPlugins WordPress.org plugin slugs.
 * @param {Array}  config.wporgThemes  WordPress.org theme slugs.
 * @return {Array<Object>} Complete array of blueprint steps.
 */
export function buildBlueprintSteps( config ) {
	const { wpContentUrl, wporgPlugins = [], wporgThemes = [] } = config;

	const steps = [];

	// Step 1: Import WordPress files (wp-content.zip).
	steps.push( buildImportFilesStep( wpContentUrl ) );

	// Step 2: Install Aether plugin.
	steps.push( buildAetherInstallStep() );

	// Step 3: Define constant to identify Playground environment.
	steps.push( buildDefineConstsStep() );

	// Step 4: Install WordPress.org plugins.
	steps.push( ...buildPluginInstallSteps( wporgPlugins ) );

	// Step 5: Install WordPress.org themes.
	steps.push( ...buildThemeInstallSteps( wporgThemes ) );

	// Step 6: Activate Aether plugin.
	steps.push( buildAetherActivationStep() );

	return steps;
}

/**
 * Construct wp-content.zip URL from storage configuration.
 *
 * @param {string} siteKey     Site key for storage path.
 * @param {Object} credentials Storage provider credentials.
 * @return {string} wp-content.zip URL.
 */
export function constructWpContentUrl( siteKey, credentials ) {
	const {
		public_url: publicUrl = '',
		worker_endpoint: workerEndpoint = '',
		custom_domain: customDomain = '',
		bucket_name: bucketName = '',
	} = credentials;

	// Priority: publicUrl > workerEndpoint > customDomain.
	const baseUrl = publicUrl || workerEndpoint || customDomain;
	const includeBucket = ! customDomain && ! publicUrl;

	if ( includeBucket ) {
		return `${ baseUrl }/${ bucketName }/${ siteKey }/wp-content.zip`;
	}

	return `${ baseUrl }/${ siteKey }/wp-content.zip`;
}

/**
 * Build complete blueprint JSON object.
 *
 * @param {Array} steps Blueprint steps array.
 * @return {Object} Complete blueprint JSON.
 */
export function buildBlueprintJson( steps ) {
	return {
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
}
