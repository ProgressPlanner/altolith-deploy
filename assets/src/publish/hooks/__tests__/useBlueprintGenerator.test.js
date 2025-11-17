/**
 * Tests for useBlueprintGenerator hook
 *
 * These tests validate the INTENDED functionality of blueprint generation,
 * including correct structure, plugin/theme inclusion, and URL construction.
 *
 * @package
 */

import { renderHook, act } from '@testing-library/react';
import { useBlueprintGenerator } from '../useBlueprintGenerator';
import * as useAssetDiscoveryModule from '../../../utils/useAssetDiscovery';
import {
	mockAssetDiscovery,
	validateBlueprintStructure,
	validateBlueprintSteps,
	extractPluginSlugs,
	extractThemeSlugs,
	countStepsByType,
} from '../../utils/blueprintTestUtils';

// Mock dependencies
jest.mock( '../../../utils/useAssetDiscovery' );
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );

describe( 'useBlueprintGenerator', () => {
	let mockGetBlueprintAssets;

	beforeEach( () => {
		// Reset mocks before each test
		jest.clearAllMocks();

		// Setup default mock for getBlueprintAssets
		mockGetBlueprintAssets = jest.fn();
		useAssetDiscoveryModule.default.mockReturnValue( {
			getBlueprintAssets: mockGetBlueprintAssets,
		} );
	} );

	describe( 'Basic Blueprint Structure', () => {
		it( 'should generate blueprint with correct schema', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Blueprint must have correct schema URL
			expect( blueprint.$schema ).toBe(
				'https://playground.wordpress.net/blueprint-schema.json'
			);
		} );

		it( 'should have correct landingPage', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Landing page must be wp-login.php
			expect( blueprint.landingPage ).toBe( '/wp-login.php' );
		} );

		it( 'should have correct preferredVersions', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: PHP 8.4 and latest WordPress
			expect( blueprint.preferredVersions ).toEqual( {
				php: '8.4',
				wp: 'latest',
			} );
		} );

		it( 'should enable networking feature', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Networking must be enabled
			expect( blueprint.features.networking ).toBe( true );
		} );

		it( 'should validate complete blueprint structure', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: All required fields present and correct
			const validation = validateBlueprintStructure( blueprint );
			expect( validation.isValid ).toBe( true );
			if ( ! validation.isValid ) {
				console.error(
					'Blueprint structure errors:',
					validation.errors
				);
			}
		} );
	} );

	describe( 'WordPress.org Plugin Inclusion', () => {
		it( 'should include WordPress.org plugins in blueprint', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: WordPress.org plugins must be in installPlugin steps
			const pluginSlugs = extractPluginSlugs( blueprint.steps );
			expect( pluginSlugs ).toContain( 'akismet' );
			expect( pluginSlugs ).toContain( 'jetpack' );
			expect( pluginSlugs ).toContain( 'woocommerce' );
		} );

		it( 'should NOT include custom plugins in blueprint', async () => {
			// Arrange - Custom plugins should NOT be in getBlueprintAssets() response
			mockGetBlueprintAssets.mockResolvedValue( {
				plugins: [ 'akismet' ], // Only WordPress.org plugins
				themes: [],
				siteName: 'Test Site',
			} );

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Custom plugins should NOT appear in blueprint
			// They should be in wp-content.zip instead
			const pluginSlugs = extractPluginSlugs( blueprint.steps );
			expect( pluginSlugs ).toEqual( [ 'akismet' ] );
			expect( pluginSlugs ).not.toContain( 'my-custom-plugin' );
		} );

		it( 'should exclude built-in aether plugin from installPlugin steps', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withBuiltInPlugins
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Built-in plugins must NOT be in WordPress.org install steps
			// Note: getBlueprintAssets() should already filter these out
			const pluginSlugs = extractPluginSlugs( blueprint.steps );
			expect( pluginSlugs ).not.toContain( 'aether' );
			expect( pluginSlugs ).not.toContain(
				'sqlite-database-integration'
			);
			// But akismet should be included if it's from WordPress.org
			expect( pluginSlugs ).toContain( 'akismet' );
		} );

		it( 'should only include ACTIVE WordPress.org plugins', async () => {
			// Arrange - getBlueprintAssets() should only return ACTIVE plugins
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withOnlyActivePlugins
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Only active plugins in blueprint
			const pluginSlugs = extractPluginSlugs( blueprint.steps );
			expect( pluginSlugs ).toEqual( [ 'akismet' ] );
		} );

		it( 'should handle empty WordPress.org plugin list', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: No WordPress.org plugin steps
			const pluginSlugs = extractPluginSlugs( blueprint.steps );
			expect( pluginSlugs ).toEqual( [] );
		} );
	} );

	describe( 'WordPress.org Theme Inclusion', () => {
		it( 'should include WordPress.org themes in blueprint', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: WordPress.org themes must be in installTheme steps
			const themeSlugs = extractThemeSlugs( blueprint.steps );
			expect( themeSlugs ).toContain( 'twentytwentyfour' );
		} );

		it( 'should include parent theme for child themes', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withChildTheme
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Parent theme must be in blueprint (if from WordPress.org)
			// Custom child theme should be in wp-content.zip
			const themeSlugs = extractThemeSlugs( blueprint.steps );
			expect( themeSlugs ).toContain( 'twentytwentyfour' );
			// Note: child-theme should NOT be here if it's custom
		} );
	} );

	describe( 'Blueprint Step Order and Structure', () => {
		it( 'should have steps in correct order', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Steps must be in specific order
			// 1. importWordPressFiles
			// 2. installPlugin (Aether)
			// 3. defineWpConfigConsts
			// 4. installPlugin steps (WordPress.org)
			// 5. installTheme steps (WordPress.org)
			// 6. activatePlugin (Aether)
			const validation = validateBlueprintSteps( blueprint.steps, {
				wporgPlugins: mockAssetDiscovery.withWporgAssets.plugins,
				wporgThemes: mockAssetDiscovery.withWporgAssets.themes,
			} );

			expect( validation.isValid ).toBe( true );
			if ( ! validation.isValid ) {
				console.error( 'Blueprint step errors:', validation.errors );
			}
		} );

		it( 'should have correct step counts', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Correct number of each step type
			const counts = countStepsByType( blueprint.steps );
			expect( counts.importWordPressFiles ).toBe( 1 );
			expect( counts.installPlugin ).toBe( 4 ); // 1 Aether + 3 WordPress.org plugins
			expect( counts.installTheme ).toBe( 1 ); // 1 WordPress.org theme
			expect( counts.activatePlugin ).toBe( 1 ); // 1 Aether activation
			expect( counts.defineWpConfigConsts ).toBe( 1 );
		} );

		it( 'should include importWordPressFiles step first', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: First step must import wp-content.zip from bundled resources
			expect( blueprint.steps[ 0 ].step ).toBe( 'importWordPressFiles' );
			expect( blueprint.steps[ 0 ].wordPressFilesZip.resource ).toBe(
				'bundled'
			);
			expect( blueprint.steps[ 0 ].wordPressFilesZip.path ).toBe(
				'/wp-content.zip'
			);
		} );

		it( 'should include Aether activation step last', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Last step must activate Aether
			const lastStep = blueprint.steps[ blueprint.steps.length - 1 ];
			expect( lastStep.step ).toBe( 'activatePlugin' );
			expect( lastStep.pluginPath ).toBe( 'aether/aether.php' );
		} );

		it( 'should include defineWpConfigConsts step', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: defineWpConfigConsts must set AETHER_PLAYGROUND_SITE
			const defineStep = blueprint.steps.find(
				( step ) => step.step === 'defineWpConfigConsts'
			);
			expect( defineStep ).toBeDefined();
			expect( defineStep.consts.AETHER_PLAYGROUND_SITE ).toBe( true );
		} );
	} );

	describe( 'Error Handling', () => {
		it( 'should handle asset discovery errors', async () => {
			// Arrange
			mockGetBlueprintAssets.mockRejectedValue(
				new Error( 'Network error checking WordPress.org' )
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act & Assert - INTENDED: Errors should propagate
			await expect(
				act( async () => {
					await result.current.generateBlueprint();
				} )
			).rejects.toThrow( 'Network error checking WordPress.org' );
		} );
	} );

	describe( 'Aether Plugin Handling', () => {
		it( 'should install Aether from bundled resources', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Aether must be installed as bundled resource
			const aetherInstallStep = blueprint.steps.find(
				( step ) =>
					step.step === 'installPlugin' &&
					step.pluginData?.url?.includes( 'aether.zip' )
			);
			expect( aetherInstallStep ).toBeDefined();
			expect( aetherInstallStep.pluginData.url ).toBeDefined();
		} );

		it( 'should include cache-busting in Aether URL', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Aether URL must have cache-busting parameter
			const aetherInstallStep = blueprint.steps.find(
				( step ) =>
					step.step === 'installPlugin' &&
					step.pluginData?.url?.includes( 'aether.zip' )
			);
			expect( aetherInstallStep.pluginData.url ).toMatch( /\?v=\d+/ );
		} );

		it( 'should activate Aether plugin', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint();
			} );

			// Assert - INTENDED: Aether must be activated
			const aetherActivateStep = blueprint.steps.find(
				( step ) =>
					step.step === 'activatePlugin' &&
					step.pluginPath === 'aether/aether.php'
			);
			expect( aetherActivateStep ).toBeDefined();
		} );
	} );
} );
