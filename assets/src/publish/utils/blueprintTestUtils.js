/**
 * Test Utilities for Blueprint Generation
 *
 * Provides fixtures, mocks, and validation helpers for testing blueprint generation.
 *
 * @package
 */

/**
 * Default credentials fixture for testing.
 */
export const mockCredentials = {
	localStorage: {
		public_url: 'https://example.com',
		worker_endpoint: '',
		custom_domain: '',
		bucket_name: '',
	},
	localStorageWithCustomDomain: {
		public_url: '',
		worker_endpoint: '',
		custom_domain: 'https://s12y.org',
		bucket_name: '',
	},
	localStorageWithPublicUrl: {
		public_url: 'https://local.s12y.org',
		worker_endpoint: '',
		custom_domain: '',
		bucket_name: '',
	},
};

/**
 * Default asset discovery fixtures for testing.
 */
export const mockAssetDiscovery = {
	// Scenario: Site with WordPress.org plugins and themes
	withWporgAssets: {
		plugins: [ 'akismet', 'jetpack', 'woocommerce' ],
		themes: [ 'twentytwentyfour' ],
		siteName: 'Test Site',
	},
	// Scenario: Site with no WordPress.org assets (all custom)
	withNoWporgAssets: {
		plugins: [],
		themes: [],
		siteName: 'Custom Site',
	},
	// Scenario: Site with built-in plugins that should be excluded
	// NOTE: getBlueprintAssets() already filters out built-in plugins,
	// so they should NOT appear in the returned data
	withBuiltInPlugins: {
		plugins: [ 'akismet' ], // Only akismet (built-ins already filtered)
		themes: [],
		siteName: 'Test Site',
	},
	// Scenario: Site with inactive WordPress.org plugins (should not appear)
	// Note: getBlueprintAssets() only returns ACTIVE assets, so this represents that
	withOnlyActivePlugins: {
		plugins: [ 'akismet' ], // Only active plugin
		themes: [],
		siteName: 'Test Site',
	},
	// Scenario: Site with child theme (parent should be in blueprint)
	withChildTheme: {
		plugins: [],
		themes: [ 'twentytwentyfour', 'child-theme' ], // Parent first, then child
		siteName: 'Test Site',
	},
};

/**
 * Expected blueprint schema structure.
 */
export const expectedBlueprintSchema = {
	$schema: 'https://playground.wordpress.net/blueprint-schema.json',
	landingPage: '/wp-login.php',
	preferredVersions: {
		php: '8.4',
		wp: 'latest',
	},
	features: {
		networking: true,
	},
	steps: [],
};

/**
 * Validate blueprint structure matches expected schema.
 *
 * @param {Object} blueprint Blueprint object to validate.
 * @return {Object} Validation result with isValid and errors.
 */
export function validateBlueprintStructure( blueprint ) {
	const errors = [];

	// Check required top-level properties
	if ( blueprint.$schema !== expectedBlueprintSchema.$schema ) {
		errors.push(
			`Invalid schema: expected ${ expectedBlueprintSchema.$schema }, got ${ blueprint.$schema }`
		);
	}

	if ( blueprint.landingPage !== expectedBlueprintSchema.landingPage ) {
		errors.push(
			`Invalid landingPage: expected ${ expectedBlueprintSchema.landingPage }, got ${ blueprint.landingPage }`
		);
	}

	if ( ! blueprint.preferredVersions ) {
		errors.push( 'Missing preferredVersions' );
	} else {
		if (
			blueprint.preferredVersions.php !==
			expectedBlueprintSchema.preferredVersions.php
		) {
			errors.push(
				`Invalid PHP version: expected ${ expectedBlueprintSchema.preferredVersions.php }, got ${ blueprint.preferredVersions.php }`
			);
		}
		if (
			blueprint.preferredVersions.wp !==
			expectedBlueprintSchema.preferredVersions.wp
		) {
			errors.push(
				`Invalid WP version: expected ${ expectedBlueprintSchema.preferredVersions.wp }, got ${ blueprint.preferredVersions.wp }`
			);
		}
	}

	if ( ! blueprint.features ) {
		errors.push( 'Missing features' );
	} else if ( ! blueprint.features.networking ) {
		errors.push( 'Networking feature must be enabled' );
	}

	if ( ! Array.isArray( blueprint.steps ) ) {
		errors.push( 'Steps must be an array' );
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Validate blueprint steps are in the correct order and have correct structure.
 *
 * @param {Array}  steps              Array of blueprint steps.
 * @param {Object} expectedStepConfig Expected step configuration.
 * @return {Object} Validation result with isValid and errors.
 */
export function validateBlueprintSteps( steps, expectedStepConfig ) {
	const errors = [];

	// Expected step order:
	// 1. importWordPressFiles (wp-content.zip)
	// 2. installPlugin (Aether)
	// 3. defineWpConfigConsts
	// 4. installPlugin steps (WordPress.org plugins)
	// 5. installTheme steps (WordPress.org themes)
	// 6. activatePlugin (Aether)

	let currentIndex = 0;

	// Step 1: importWordPressFiles
	if (
		! steps[ currentIndex ] ||
		steps[ currentIndex ].step !== 'importWordPressFiles'
	) {
		errors.push(
			`Step ${ currentIndex }: Expected importWordPressFiles, got ${ steps[ currentIndex ]?.step }`
		);
	} else {
		const step = steps[ currentIndex ];
		if ( ! step.wordPressFilesZip ) {
			errors.push(
				`Step ${ currentIndex }: importWordPressFiles missing wordPressFilesZip`
			);
		} else if ( step.wordPressFilesZip.resource === 'bundled' ) {
			// Check for bundled resource (new format)
			if ( ! step.wordPressFilesZip.path ) {
				errors.push(
					`Step ${ currentIndex }: importWordPressFiles bundled resource missing path`
				);
			} else if (
				! step.wordPressFilesZip.path.includes( 'wp-content.zip' )
			) {
				errors.push(
					`Step ${ currentIndex }: wordPressFilesZip.path must contain 'wp-content.zip'`
				);
			}
		} else if ( ! step.wordPressFilesZip.url ) {
			// Fallback for URL-based resources (legacy format)
			errors.push(
				`Step ${ currentIndex }: importWordPressFiles missing wordPressFilesZip.url`
			);
		} else if (
			! step.wordPressFilesZip.url.includes( 'wp-content.zip' )
		) {
			errors.push(
				`Step ${ currentIndex }: wordPressFilesZip.url must contain 'wp-content.zip'`
			);
		}
	}
	currentIndex++;

	// Step 2: installPlugin (Aether)
	if (
		! steps[ currentIndex ] ||
		steps[ currentIndex ].step !== 'installPlugin'
	) {
		errors.push(
			`Step ${ currentIndex }: Expected installPlugin (Aether), got ${ steps[ currentIndex ]?.step }`
		);
	} else {
		const step = steps[ currentIndex ];
		if (
			! step.pluginData ||
			! step.pluginData.url ||
			! step.pluginData.url.includes( 'aether.zip' )
		) {
			errors.push(
				`Step ${ currentIndex }: Aether plugin must have url containing 'aether.zip'`
			);
		}
	}
	currentIndex++;

	// Step 3: defineWpConfigConsts
	if (
		! steps[ currentIndex ] ||
		steps[ currentIndex ].step !== 'defineWpConfigConsts'
	) {
		errors.push(
			`Step ${ currentIndex }: Expected defineWpConfigConsts, got ${ steps[ currentIndex ]?.step }`
		);
	} else {
		const step = steps[ currentIndex ];
		if ( ! step.consts || ! step.consts.AETHER_PLAYGROUND_SITE ) {
			errors.push(
				`Step ${ currentIndex }: defineWpConfigConsts must define AETHER_PLAYGROUND_SITE`
			);
		}
	}
	currentIndex++;

	// Step 4: installPlugin steps (WordPress.org plugins)
	const expectedPluginCount = expectedStepConfig.wporgPlugins?.length || 0;
	for ( let i = 0; i < expectedPluginCount; i++ ) {
		const step = steps[ currentIndex ];
		if ( ! step || step.step !== 'installPlugin' ) {
			errors.push(
				`Step ${ currentIndex }: Expected installPlugin (WordPress.org), got ${ step?.step }`
			);
		} else {
			if (
				! step.pluginData ||
				step.pluginData.resource !== 'wordpress.org/plugins'
			) {
				errors.push(
					`Step ${ currentIndex }: WordPress.org plugin must have resource 'wordpress.org/plugins'`
				);
			}
			if ( ! step.pluginData.slug ) {
				errors.push(
					`Step ${ currentIndex }: WordPress.org plugin must have slug`
				);
			}
			if (
				expectedStepConfig.wporgPlugins &&
				! expectedStepConfig.wporgPlugins.includes(
					step.pluginData.slug
				)
			) {
				errors.push(
					`Step ${ currentIndex }: Unexpected plugin slug '${ step.pluginData.slug }'`
				);
			}
			// Check that built-in plugins are NOT included
			if (
				[ 'aether', 'sqlite-database-integration' ].includes(
					step.pluginData.slug
				)
			) {
				errors.push(
					`Step ${ currentIndex }: Built-in plugin '${ step.pluginData.slug }' should be excluded`
				);
			}
		}
		currentIndex++;
	}

	// Step 5: installTheme steps (WordPress.org themes)
	const expectedThemeCount = expectedStepConfig.wporgThemes?.length || 0;
	for ( let i = 0; i < expectedThemeCount; i++ ) {
		const step = steps[ currentIndex ];
		if ( ! step || step.step !== 'installTheme' ) {
			errors.push(
				`Step ${ currentIndex }: Expected installTheme (WordPress.org), got ${ step?.step }`
			);
		} else {
			if (
				! step.themeData ||
				step.themeData.resource !== 'wordpress.org/themes'
			) {
				errors.push(
					`Step ${ currentIndex }: WordPress.org theme must have resource 'wordpress.org/themes'`
				);
			}
			if ( ! step.themeData.slug ) {
				errors.push(
					`Step ${ currentIndex }: WordPress.org theme must have slug`
				);
			}
			if (
				expectedStepConfig.wporgThemes &&
				! expectedStepConfig.wporgThemes.includes( step.themeData.slug )
			) {
				errors.push(
					`Step ${ currentIndex }: Unexpected theme slug '${ step.themeData.slug }'`
				);
			}
		}
		currentIndex++;
	}

	// Step 6: activatePlugin (Aether)
	if (
		! steps[ currentIndex ] ||
		steps[ currentIndex ].step !== 'activatePlugin'
	) {
		errors.push(
			`Step ${ currentIndex }: Expected activatePlugin (Aether), got ${ steps[ currentIndex ]?.step }`
		);
	} else {
		const step = steps[ currentIndex ];
		if ( step.pluginPath !== 'aether/aether.php' ) {
			errors.push(
				`Step ${ currentIndex }: activatePlugin must have pluginPath 'aether/aether.php'`
			);
		}
	}
	currentIndex++;

	// Check no extra steps
	if ( steps.length > currentIndex ) {
		errors.push(
			`Unexpected extra steps: found ${ steps.length }, expected ${ currentIndex }`
		);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Validate wp-content.zip URL is constructed correctly.
 *
 * @param {string} url         The URL to validate.
 * @param {Object} credentials Storage provider credentials.
 * @return {Object} Validation result with isValid and errors.
 */
export function validateWpContentUrl( url, credentials ) {
	const errors = [];

	if ( ! url ) {
		errors.push( 'wp-content.zip URL is missing' );
		return { isValid: false, errors };
	}

	if ( ! url.includes( 'wp-content.zip' ) ) {
		errors.push( "URL must contain 'wp-content.zip'" );
	}

	// Check URL matches expected pattern based on credentials
	// eslint-disable-next-line camelcase
	const { public_url, worker_endpoint, custom_domain, bucket_name } =
		credentials;
	// eslint-disable-next-line camelcase
	const baseUrl = public_url || worker_endpoint || custom_domain;

	if ( ! baseUrl ) {
		errors.push(
			'Credentials must have publicUrl, workerEndpoint, or customDomain'
		);
		return { isValid: false, errors };
	}

	// eslint-disable-next-line camelcase
	const includeBucket = ! custom_domain && ! public_url;
	const expectedUrl = includeBucket
		? // eslint-disable-next-line camelcase
		  `${ baseUrl }/${ bucket_name }/wp-content.zip`
		: `${ baseUrl }/wp-content.zip`;

	if ( url !== expectedUrl ) {
		errors.push(
			`URL mismatch: expected '${ expectedUrl }', got '${ url }'`
		);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Count steps by type in a blueprint.
 *
 * @param {Array} steps Blueprint steps array.
 * @return {Object} Step counts by type.
 */
export function countStepsByType( steps ) {
	const counts = {
		importWordPressFiles: 0,
		installPlugin: 0,
		installTheme: 0,
		activatePlugin: 0,
		defineWpConfigConsts: 0,
		other: 0,
	};

	steps.forEach( ( step ) => {
		if ( counts[ step.step ] !== undefined ) {
			counts[ step.step ]++;
		} else {
			counts.other++;
		}
	} );

	return counts;
}

/**
 * Extract plugin slugs from blueprint steps.
 *
 * @param {Array} steps Blueprint steps array.
 * @return {Array} Array of plugin slugs from installPlugin steps.
 */
export function extractPluginSlugs( steps ) {
	return steps
		.filter( ( step ) => step.step === 'installPlugin' )
		.filter(
			( step ) => step.pluginData?.resource === 'wordpress.org/plugins'
		)
		.map( ( step ) => step.pluginData.slug )
		.filter( Boolean );
}

/**
 * Extract theme slugs from blueprint steps.
 *
 * @param {Array} steps Blueprint steps array.
 * @return {Array} Array of theme slugs from installTheme steps.
 */
export function extractThemeSlugs( steps ) {
	return steps
		.filter( ( step ) => step.step === 'installTheme' )
		.filter(
			( step ) => step.themeData?.resource === 'wordpress.org/themes'
		)
		.map( ( step ) => step.themeData.slug )
		.filter( Boolean );
}
