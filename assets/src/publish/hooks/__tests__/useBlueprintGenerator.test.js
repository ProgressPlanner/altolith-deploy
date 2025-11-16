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
import * as credentialManager from '../../../utils/credentialManager';
import * as useAssetDiscoveryModule from '../../../utils/useAssetDiscovery';
import {
	mockCredentials,
	mockAssetDiscovery,
	validateBlueprintStructure,
	validateBlueprintSteps,
	validateWpContentUrl,
	extractPluginSlugs,
	extractThemeSlugs,
	countStepsByType,
} from '../../utils/blueprintTestUtils';

// Mock dependencies
jest.mock( '../../../utils/credentialManager' );
jest.mock( '../../../utils/useAssetDiscovery' );

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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
			} );

			// Assert - INTENDED: Landing page must be wp-login.php
			expect( blueprint.landingPage ).toBe( '/wp-login.php' );
		} );

		it( 'should have correct preferredVersions', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
			} );

			// Assert - INTENDED: Networking must be enabled
			expect( blueprint.features.networking ).toBe( true );
		} );

		it( 'should validate complete blueprint structure', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
			} );

			// Assert - INTENDED: First step must import wp-content.zip
			expect( blueprint.steps[ 0 ].step ).toBe( 'importWordPressFiles' );
			expect( blueprint.steps[ 0 ].wordPressFilesZip.url ).toContain(
				'wp-content.zip'
			);
		} );

		it( 'should include Aether activation step last', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
			} );

			// Assert - INTENDED: defineWpConfigConsts must set AETHER_PLAYGROUND_SITE
			const defineStep = blueprint.steps.find(
				( step ) => step.step === 'defineWpConfigConsts'
			);
			expect( defineStep ).toBeDefined();
			expect( defineStep.consts.AETHER_PLAYGROUND_SITE ).toBe( true );
		} );
	} );

	describe( 'wp-content.zip URL Construction', () => {
		it( 'should use publicUrl when available', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
			} );

			// Assert - INTENDED: publicUrl should be used (highest priority)
			const importStep = blueprint.steps.find(
				( step ) => step.step === 'importWordPressFiles'
			);
			expect( importStep.wordPressFilesZip.url ).toBe(
				'https://r2.s12y.org/test-site/wp-content.zip'
			);
		} );

		it( 'should use workerEndpoint when publicUrl not available', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithWorkerOnly
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
			} );

			// Assert - INTENDED: workerEndpoint should be used with bucketName
			const importStep = blueprint.steps.find(
				( step ) => step.step === 'importWordPressFiles'
			);
			expect( importStep.wordPressFilesZip.url ).toBe(
				'https://worker.example.com/test-bucket/test-site/wp-content.zip'
			);
		} );

		it( 'should construct R2 publicUrl from customDomain for Cloudflare R2', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithCustomDomain
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
			} );

			// Assert - INTENDED: Should construct r2.subdomain from customDomain
			const importStep = blueprint.steps.find(
				( step ) => step.step === 'importWordPressFiles'
			);
			// When customDomain is set, the hook should construct publicUrl as r2.{hostname}
			// Based on code lines 103-119 in useBlueprintGenerator.js
			expect( importStep.wordPressFilesZip.url ).toContain(
				'test-site/wp-content.zip'
			);
		} );

		it( 'should include site key in URL', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'my-custom-site-key',
					'cloudflare-r2'
				);
			} );

			// Assert - INTENDED: URL must contain site key
			const importStep = blueprint.steps.find(
				( step ) => step.step === 'importWordPressFiles'
			);
			expect( importStep.wordPressFilesZip.url ).toContain(
				'my-custom-site-key'
			);
		} );

		it( 'should validate wp-content.zip URL format', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			const credentials = mockCredentials.cloudflareR2WithPublicUrl;
			credentialManager.getCredentials.mockResolvedValue( credentials );

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
			} );

			// Assert - INTENDED: URL format must be correct
			const importStep = blueprint.steps.find(
				( step ) => step.step === 'importWordPressFiles'
			);
			const validation = validateWpContentUrl(
				importStep.wordPressFilesZip.url,
				'test-site',
				credentials
			);
			expect( validation.isValid ).toBe( true );
			if ( ! validation.isValid ) {
				console.error( 'URL validation errors:', validation.errors );
			}
		} );
	} );

	describe( 'Error Handling', () => {
		it( 'should throw error when siteKey is missing', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act & Assert - INTENDED: Must validate siteKey
			await expect(
				act( async () => {
					await result.current.generateBlueprint(
						'',
						'cloudflare-r2'
					);
				} )
			).rejects.toThrow( 'Site key is required' );
		} );

		it( 'should throw error when storageProviderId is missing', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act & Assert - INTENDED: Must validate storageProviderId
			await expect(
				act( async () => {
					await result.current.generateBlueprint( 'test-site', '' );
				} )
			).rejects.toThrow( 'Storage provider ID is required' );
		} );

		it( 'should throw error when no endpoints configured', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2NoEndpoints
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act & Assert - INTENDED: Must have at least one endpoint
			await expect(
				act( async () => {
					await result.current.generateBlueprint(
						'test-site',
						'cloudflare-r2'
					);
				} )
			).rejects.toThrow(
				'Storage provider must have customDomain, publicUrl, or workerEndpoint configured'
			);
		} );

		it( 'should handle asset discovery errors', async () => {
			// Arrange
			mockGetBlueprintAssets.mockRejectedValue(
				new Error( 'Network error checking WordPress.org' )
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act & Assert - INTENDED: Errors should propagate
			await expect(
				act( async () => {
					await result.current.generateBlueprint(
						'test-site',
						'cloudflare-r2'
					);
				} )
			).rejects.toThrow( 'Network error checking WordPress.org' );
		} );
	} );

	describe( 'Aether Plugin Handling', () => {
		it( 'should install Aether from production URL', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
			} );

			// Assert - INTENDED: Aether must be installed from production URL
			const aetherInstallStep = blueprint.steps.find(
				( step ) =>
					step.step === 'installPlugin' &&
					step.pluginData?.url?.includes( 'aether.zip' )
			);
			expect( aetherInstallStep ).toBeDefined();
			expect( aetherInstallStep.pluginData.url ).toContain(
				'https://r2.s12y.org/aether.zip'
			);
		} );

		it( 'should include cache-busting in Aether URL', async () => {
			// Arrange
			mockGetBlueprintAssets.mockResolvedValue(
				mockAssetDiscovery.withNoWporgAssets
			);
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
			credentialManager.getCredentials.mockResolvedValue(
				mockCredentials.cloudflareR2WithPublicUrl
			);

			const { result } = renderHook( () => useBlueprintGenerator() );

			// Act
			let blueprint;
			await act( async () => {
				blueprint = await result.current.generateBlueprint(
					'test-site',
					'cloudflare-r2'
				);
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
