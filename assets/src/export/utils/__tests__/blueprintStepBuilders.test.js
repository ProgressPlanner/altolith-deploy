/**
 * Tests for blueprintStepBuilders utility functions
 *
 * Tests the INTENDED functionality of individual step builders and URL construction.
 *
 */

import {
	buildImportFilesStep,
	buildPluginInstallSteps,
	buildThemeInstallSteps,
	buildCustomPluginStep,
	buildCustomThemeStep,
	buildCustomPluginSteps,
	buildCustomThemeSteps,
	buildBlueprintSteps,
	buildBlueprintJson,
} from '../blueprintStepBuilders';

// Mock @wordpress/hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );

describe( 'blueprintStepBuilders', () => {
	describe( 'buildImportFilesStep', () => {
		it( 'should create importWordPressFiles step with bundled resource (default)', () => {
			// Act
			const step = buildImportFilesStep();

			// Assert - INTENDED: Must have correct step type and bundled resource
			expect( step.step ).toBe( 'importWordPressFiles' );
			expect( step.wordPressFilesZip.resource ).toBe( 'bundled' );
			expect( step.wordPressFilesZip.path ).toBe( '/wp-content.zip' );
		} );

		it( 'should create importWordPressFiles step with URL resource when baseUrl provided', () => {
			// Act
			const step = buildImportFilesStep( {
				baseUrl: 'https://cdn.example.com',
			} );

			// Assert - INTENDED: Must use URL resource
			expect( step.step ).toBe( 'importWordPressFiles' );
			expect( step.wordPressFilesZip.resource ).toBe( 'url' );
			expect( step.wordPressFilesZip.url ).toBe(
				'https://cdn.example.com/wp-content.zip'
			);
		} );

		it( 'should include subfolder in URL when provided', () => {
			// Act
			const step = buildImportFilesStep( {
				baseUrl: 'https://cdn.example.com',
				subfolder: 'playground',
			} );

			// Assert - INTENDED: Must include subfolder in URL
			expect( step.wordPressFilesZip.url ).toBe(
				'https://cdn.example.com/playground/wp-content.zip'
			);
		} );
	} );

	describe( 'buildPluginInstallSteps', () => {
		it( 'should create installPlugin steps for WordPress.org plugins', () => {
			// Arrange
			const pluginSlugs = [ 'akismet', 'jetpack', 'woocommerce' ];

			// Act
			const steps = buildPluginInstallSteps( pluginSlugs );

			// Assert - INTENDED: Must create one step per plugin
			expect( steps ).toHaveLength( 3 );
			steps.forEach( ( step, index ) => {
				expect( step.step ).toBe( 'installPlugin' );
				expect( step.pluginData.resource ).toBe(
					'wordpress.org/plugins'
				);
				expect( step.pluginData.slug ).toBe( pluginSlugs[ index ] );
				expect( step.options.activate ).toBe( false );
			} );
		} );

		it( 'should handle empty plugin list', () => {
			// Act
			const steps = buildPluginInstallSteps( [] );

			// Assert - INTENDED: Must return empty array
			expect( steps ).toEqual( [] );
		} );

		it( 'should handle null plugin list', () => {
			// Act
			const steps = buildPluginInstallSteps( null );

			// Assert - INTENDED: Must return empty array for invalid input
			expect( steps ).toEqual( [] );
		} );

		it( 'should handle undefined plugin list', () => {
			// Act
			const steps = buildPluginInstallSteps( undefined );

			// Assert - INTENDED: Must return empty array for invalid input
			expect( steps ).toEqual( [] );
		} );
	} );

	describe( 'buildThemeInstallSteps', () => {
		it( 'should create installTheme steps for WordPress.org themes', () => {
			// Arrange
			const themeSlugs = [ 'twentytwentyfour', 'twentytwentythree' ];

			// Act
			const steps = buildThemeInstallSteps( themeSlugs );

			// Assert - INTENDED: Must create one step per theme
			expect( steps ).toHaveLength( 2 );
			steps.forEach( ( step, index ) => {
				expect( step.step ).toBe( 'installTheme' );
				expect( step.themeData.resource ).toBe(
					'wordpress.org/themes'
				);
				expect( step.themeData.slug ).toBe( themeSlugs[ index ] );
				expect( step.options.activate ).toBe( false );
			} );
		} );

		it( 'should handle empty theme list', () => {
			// Act
			const steps = buildThemeInstallSteps( [] );

			// Assert - INTENDED: Must return empty array
			expect( steps ).toEqual( [] );
		} );

		it( 'should handle null theme list', () => {
			// Act
			const steps = buildThemeInstallSteps( null );

			// Assert - INTENDED: Must return empty array for invalid input
			expect( steps ).toEqual( [] );
		} );

		it( 'should handle undefined theme list', () => {
			// Act
			const steps = buildThemeInstallSteps( undefined );

			// Assert - INTENDED: Must return empty array for invalid input
			expect( steps ).toEqual( [] );
		} );
	} );

	describe( 'buildCustomPluginStep', () => {
		it( 'should create bundled plugin step by default', () => {
			// Act
			const step = buildCustomPluginStep( 'my-custom-plugin' );

			// Assert
			expect( step.step ).toBe( 'installPlugin' );
			expect( step.pluginData.resource ).toBe( 'bundled' );
			expect( step.pluginData.path ).toBe(
				'/plugins/my-custom-plugin.zip'
			);
		} );

		it( 'should create URL plugin step when baseUrl provided', () => {
			// Act
			const step = buildCustomPluginStep( 'my-custom-plugin', {
				baseUrl: 'https://cdn.example.com',
			} );

			// Assert
			expect( step.step ).toBe( 'installPlugin' );
			expect( step.pluginData.resource ).toBe( 'url' );
			expect( step.pluginData.url ).toBe(
				'https://cdn.example.com/plugins/my-custom-plugin.zip'
			);
		} );

		it( 'should include subfolder in plugin URL', () => {
			// Act
			const step = buildCustomPluginStep( 'my-custom-plugin', {
				baseUrl: 'https://cdn.example.com',
				subfolder: 'playground',
			} );

			// Assert
			expect( step.pluginData.url ).toBe(
				'https://cdn.example.com/playground/plugins/my-custom-plugin.zip'
			);
		} );
	} );

	describe( 'buildCustomThemeStep', () => {
		it( 'should create bundled theme step by default', () => {
			// Act
			const step = buildCustomThemeStep( 'my-custom-theme' );

			// Assert
			expect( step.step ).toBe( 'installTheme' );
			expect( step.themeData.resource ).toBe( 'bundled' );
			expect( step.themeData.path ).toBe( '/themes/my-custom-theme.zip' );
		} );

		it( 'should create URL theme step when baseUrl provided', () => {
			// Act
			const step = buildCustomThemeStep( 'my-custom-theme', {
				baseUrl: 'https://cdn.example.com',
			} );

			// Assert
			expect( step.step ).toBe( 'installTheme' );
			expect( step.themeData.resource ).toBe( 'url' );
			expect( step.themeData.url ).toBe(
				'https://cdn.example.com/themes/my-custom-theme.zip'
			);
		} );

		it( 'should include subfolder in theme URL', () => {
			// Act
			const step = buildCustomThemeStep( 'my-custom-theme', {
				baseUrl: 'https://cdn.example.com',
				subfolder: 'playground',
			} );

			// Assert
			expect( step.themeData.url ).toBe(
				'https://cdn.example.com/playground/themes/my-custom-theme.zip'
			);
		} );
	} );

	describe( 'buildCustomPluginSteps', () => {
		it( 'should create steps with URL resources when baseUrl provided', () => {
			// Act
			const steps = buildCustomPluginSteps( [ 'plugin-a', 'plugin-b' ], {
				baseUrl: 'https://cdn.example.com',
				subfolder: 'playground',
			} );

			// Assert
			expect( steps ).toHaveLength( 2 );
			expect( steps[ 0 ].pluginData.resource ).toBe( 'url' );
			expect( steps[ 0 ].pluginData.url ).toBe(
				'https://cdn.example.com/playground/plugins/plugin-a.zip'
			);
			expect( steps[ 1 ].pluginData.url ).toBe(
				'https://cdn.example.com/playground/plugins/plugin-b.zip'
			);
		} );
	} );

	describe( 'buildCustomThemeSteps', () => {
		it( 'should create steps with URL resources when baseUrl provided', () => {
			// Act
			const steps = buildCustomThemeSteps( [ 'theme-a', 'theme-b' ], {
				baseUrl: 'https://cdn.example.com',
				subfolder: 'playground',
			} );

			// Assert
			expect( steps ).toHaveLength( 2 );
			expect( steps[ 0 ].themeData.resource ).toBe( 'url' );
			expect( steps[ 0 ].themeData.url ).toBe(
				'https://cdn.example.com/playground/themes/theme-a.zip'
			);
			expect( steps[ 1 ].themeData.url ).toBe(
				'https://cdn.example.com/playground/themes/theme-b.zip'
			);
		} );
	} );

	describe( 'buildBlueprintSteps', () => {
		it( 'should build complete steps array in correct order', () => {
			// Arrange
			const config = {
				wporgPlugins: [ 'akismet', 'jetpack' ],
				wporgThemes: [ 'twentytwentyfour' ],
			};

			// Act
			const steps = buildBlueprintSteps( config );

			// Assert - INTENDED: Steps must be in correct order
			// buildBlueprintSteps only builds: importWordPressFiles, WordPress.org plugins, WordPress.org themes
			// Altolith install, defineWpConfigConsts, and Altolith activation are added by filters elsewhere

			// 1. importWordPressFiles (bundled resource)
			expect( steps[ 0 ].step ).toBe( 'importWordPressFiles' );
			expect( steps[ 0 ].wordPressFilesZip.resource ).toBe( 'bundled' );
			expect( steps[ 0 ].wordPressFilesZip.path ).toBe(
				'/wp-content.zip'
			);

			// 2. installPlugin (WordPress.org plugins)
			expect( steps[ 1 ].step ).toBe( 'installPlugin' );
			expect( steps[ 1 ].pluginData.resource ).toBe(
				'wordpress.org/plugins'
			);
			expect( steps[ 1 ].pluginData.slug ).toBe( 'akismet' );
			expect( steps[ 2 ].step ).toBe( 'installPlugin' );
			expect( steps[ 2 ].pluginData.slug ).toBe( 'jetpack' );

			// 3. installTheme (WordPress.org themes)
			expect( steps[ 3 ].step ).toBe( 'installTheme' );
			expect( steps[ 3 ].themeData.slug ).toBe( 'twentytwentyfour' );
		} );

		it( 'should handle no WordPress.org assets', () => {
			// Arrange
			const config = {
				wporgPlugins: [],
				wporgThemes: [],
			};

			// Act
			const steps = buildBlueprintSteps( config );

			// Assert - INTENDED: Only importWordPressFiles step (no WordPress.org install steps)
			// Altolith install, defineWpConfigConsts, and Altolith activation are added by filters elsewhere
			expect( steps ).toHaveLength( 1 );
			expect( steps[ 0 ].step ).toBe( 'importWordPressFiles' );
		} );

		it( 'should handle missing wporgPlugins', () => {
			// Arrange
			const config = {
				wporgThemes: [],
			};

			// Act
			const steps = buildBlueprintSteps( config );

			// Assert - INTENDED: Should not fail with undefined plugins
			expect( steps ).toHaveLength( 1 ); // Only importWordPressFiles
			expect( steps[ 0 ].step ).toBe( 'importWordPressFiles' );
		} );

		it( 'should handle missing wporgThemes', () => {
			// Arrange
			const config = {
				wporgPlugins: [],
			};

			// Act
			const steps = buildBlueprintSteps( config );

			// Assert - INTENDED: Should not fail with undefined themes
			expect( steps ).toHaveLength( 1 ); // Only importWordPressFiles
			expect( steps[ 0 ].step ).toBe( 'importWordPressFiles' );
		} );

		it( 'should use URL resources when baseUrl is provided', () => {
			// Arrange
			const config = {
				wporgPlugins: [ 'akismet' ],
				customPlugins: [ 'my-plugin' ],
				customThemes: [ 'my-theme' ],
				baseUrl: 'https://cdn.example.com',
				subfolder: 'playground',
			};

			// Act
			const steps = buildBlueprintSteps( config );

			// Assert - INTENDED: Custom resources should use URL
			// Step 0: importWordPressFiles with URL
			expect( steps[ 0 ].wordPressFilesZip.resource ).toBe( 'url' );
			expect( steps[ 0 ].wordPressFilesZip.url ).toBe(
				'https://cdn.example.com/playground/wp-content.zip'
			);

			// Step 1: WordPress.org plugin (still uses wordpress.org)
			expect( steps[ 1 ].pluginData.resource ).toBe(
				'wordpress.org/plugins'
			);

			// Step 2: Custom plugin with URL
			expect( steps[ 2 ].pluginData.resource ).toBe( 'url' );
			expect( steps[ 2 ].pluginData.url ).toBe(
				'https://cdn.example.com/playground/plugins/my-plugin.zip'
			);

			// Step 3: Custom theme with URL
			expect( steps[ 3 ].themeData.resource ).toBe( 'url' );
			expect( steps[ 3 ].themeData.url ).toBe(
				'https://cdn.example.com/playground/themes/my-theme.zip'
			);
		} );
	} );

	describe( 'buildBlueprintJson', () => {
		it( 'should create complete blueprint JSON structure', () => {
			// Arrange
			const steps = [
				{
					step: 'importWordPressFiles',
					wordPressFilesZip: { url: 'test.zip' },
				},
				{ step: 'installPlugin', pluginData: { slug: 'test-plugin' } },
			];

			// Act
			const blueprint = buildBlueprintJson( steps );

			// Assert - INTENDED: Must have all required fields
			expect( blueprint.$schema ).toBe(
				'https://playground.wordpress.net/blueprint-schema.json'
			);
			expect( blueprint.landingPage ).toBe( '/wp-login.php' );
			expect( blueprint.preferredVersions ).toEqual( {
				php: '8.4',
				wp: 'latest',
			} );
			expect( blueprint.features ).toEqual( {
				networking: true,
			} );
			expect( blueprint.steps ).toEqual( steps );
		} );

		it( 'should handle empty steps array', () => {
			// Arrange
			const steps = [];

			// Act
			const blueprint = buildBlueprintJson( steps );

			// Assert - INTENDED: Should create blueprint with empty steps
			expect( blueprint.steps ).toEqual( [] );
			expect( blueprint.$schema ).toBeDefined();
		} );
	} );
} );
