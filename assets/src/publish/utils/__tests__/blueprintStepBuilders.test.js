/**
 * Tests for blueprintStepBuilders utility functions
 *
 * Tests the INTENDED functionality of individual step builders and URL construction.
 *
 * @package
 */

import {
	buildImportFilesStep,
	buildAetherInstallStep,
	buildDefineConstsStep,
	buildPluginInstallSteps,
	buildThemeInstallSteps,
	buildAetherActivationStep,
	buildBlueprintSteps,
	buildBlueprintJson,
} from '../blueprintStepBuilders';

describe( 'blueprintStepBuilders', () => {
	describe( 'buildImportFilesStep', () => {
		it( 'should create importWordPressFiles step with bundled resource', () => {
			// Act
			const step = buildImportFilesStep();

			// Assert - INTENDED: Must have correct step type and bundled resource
			expect( step.step ).toBe( 'importWordPressFiles' );
			expect( step.wordPressFilesZip.resource ).toBe( 'bundled' );
			expect( step.wordPressFilesZip.path ).toBe( '/wp-content.zip' );
		} );
	} );

	describe( 'buildAetherInstallStep', () => {
		it( 'should create installPlugin step for Aether', () => {
			// Act
			const step = buildAetherInstallStep();

			// Assert - INTENDED: Must install Aether plugin
			expect( step.step ).toBe( 'installPlugin' );
			expect( step.pluginData.resource ).toBe( 'url' );
			expect( step.pluginData.url ).toContain(
				'https://r2.s12y.org/aether.zip'
			);
			expect( step.pluginData.caption ).toBe(
				'Installing Aether plugin'
			);
			expect( step.options.activate ).toBe( false );
		} );

		it( 'should include cache-busting parameter', () => {
			// Act
			const step = buildAetherInstallStep();

			// Assert - INTENDED: Must have cache-busting query parameter
			expect( step.pluginData.url ).toMatch( /\?v=\d+/ );
		} );
	} );

	describe( 'buildDefineConstsStep', () => {
		it( 'should create defineWpConfigConsts step', () => {
			// Act
			const step = buildDefineConstsStep();

			// Assert - INTENDED: Must define AETHER_PLAYGROUND_SITE constant
			expect( step.step ).toBe( 'defineWpConfigConsts' );
			expect( step.consts.AETHER_PLAYGROUND_SITE ).toBe( true );
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

	describe( 'buildAetherActivationStep', () => {
		it( 'should create activatePlugin step for Aether', () => {
			// Act
			const step = buildAetherActivationStep();

			// Assert - INTENDED: Must activate Aether plugin
			expect( step.step ).toBe( 'activatePlugin' );
			expect( step.pluginPath ).toBe( 'aether/aether.php' );
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
			// 1. importWordPressFiles (bundled resource)
			expect( steps[ 0 ].step ).toBe( 'importWordPressFiles' );
			expect( steps[ 0 ].wordPressFilesZip.resource ).toBe( 'bundled' );
			expect( steps[ 0 ].wordPressFilesZip.path ).toBe(
				'/wp-content.zip'
			);

			// 2. installPlugin (Aether)
			expect( steps[ 1 ].step ).toBe( 'installPlugin' );
			expect( steps[ 1 ].pluginData.url ).toContain( 'aether.zip' );

			// 3. defineWpConfigConsts
			expect( steps[ 2 ].step ).toBe( 'defineWpConfigConsts' );

			// 4. installPlugin (WordPress.org plugins)
			expect( steps[ 3 ].step ).toBe( 'installPlugin' );
			expect( steps[ 3 ].pluginData.slug ).toBe( 'akismet' );
			expect( steps[ 4 ].step ).toBe( 'installPlugin' );
			expect( steps[ 4 ].pluginData.slug ).toBe( 'jetpack' );

			// 5. installTheme (WordPress.org themes)
			expect( steps[ 5 ].step ).toBe( 'installTheme' );
			expect( steps[ 5 ].themeData.slug ).toBe( 'twentytwentyfour' );

			// 6. activatePlugin (Aether)
			expect( steps[ 6 ].step ).toBe( 'activatePlugin' );
			expect( steps[ 6 ].pluginPath ).toBe( 'aether/aether.php' );
		} );

		it( 'should handle no WordPress.org assets', () => {
			// Arrange
			const config = {
				wporgPlugins: [],
				wporgThemes: [],
			};

			// Act
			const steps = buildBlueprintSteps( config );

			// Assert - INTENDED: Only core steps (no WordPress.org install steps)
			expect( steps ).toHaveLength( 4 ); // import, aether install, define consts, aether activate
			expect( steps[ 0 ].step ).toBe( 'importWordPressFiles' );
			expect( steps[ 1 ].step ).toBe( 'installPlugin' ); // Aether
			expect( steps[ 2 ].step ).toBe( 'defineWpConfigConsts' );
			expect( steps[ 3 ].step ).toBe( 'activatePlugin' ); // Aether
		} );

		it( 'should handle missing wporgPlugins', () => {
			// Arrange
			const config = {
				wporgThemes: [],
			};

			// Act
			const steps = buildBlueprintSteps( config );

			// Assert - INTENDED: Should not fail with undefined plugins
			expect( steps ).toHaveLength( 4 ); // import, aether install, define consts, aether activate
		} );

		it( 'should handle missing wporgThemes', () => {
			// Arrange
			const config = {
				wporgPlugins: [],
			};

			// Act
			const steps = buildBlueprintSteps( config );

			// Assert - INTENDED: Should not fail with undefined themes
			expect( steps ).toHaveLength( 4 ); // import, aether install, define consts, aether activate
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
