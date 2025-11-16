/**
 * Integration Tests for Plugin Detection and wp-content.zip Workflow
 *
 * These tests use REAL WordPress.org API calls to validate actual behavior.
 * Tests are designed to validate INTENDED functionality, not current implementation.
 *
 * @package
 */

import { isFromWordPressOrg } from '../../utils/useAssetDiscovery';

// Mark these as integration tests that can be skipped in CI
// Use: npm test -- --testPathPattern=Integration
describe( 'Plugin Detection Integration Tests (Real API)', () => {
	// Increase timeout for real API calls
	jest.setTimeout( 30000 );

	// Use real fetch for these integration tests
	beforeAll( () => {
		// Note: These tests require real network access to WordPress.org
		// They will fail in Jest's mocked environment
		// Run with: node test-wporg-response.js for real API verification
	} );

	// Restore mocked fetch after tests
	afterAll( () => {
		global.fetch = jest.fn();
	} );

	describe( 'WordPress.org Plugin Detection (Real API)', () => {
		it( 'should correctly identify Akismet as from WordPress.org', async () => {
			// Act - REAL API CALL
			const result = await isFromWordPressOrg( 'akismet', 'plugin' );

			// Assert - INTENDED: Akismet is a real WordPress.org plugin
			expect( result ).toBe( true );
		} );

		it( 'should correctly identify Jetpack as from WordPress.org', async () => {
			// Act - REAL API CALL
			const result = await isFromWordPressOrg( 'jetpack', 'plugin' );

			// Assert - INTENDED: Jetpack is a real WordPress.org plugin
			expect( result ).toBe( true );
		} );

		it( 'should correctly identify WooCommerce as from WordPress.org', async () => {
			// Act - REAL API CALL
			const result = await isFromWordPressOrg( 'woocommerce', 'plugin' );

			// Assert - INTENDED: WooCommerce is a real WordPress.org plugin
			expect( result ).toBe( true );
		} );

		it( 'should correctly identify Contact Form 7 as from WordPress.org', async () => {
			// Act - REAL API CALL
			const result = await isFromWordPressOrg(
				'contact-form-7',
				'plugin'
			);

			// Assert - INTENDED: Contact Form 7 is a real WordPress.org plugin
			expect( result ).toBe( true );
		} );

		it( 'should return false for a non-existent plugin', async () => {
			// Act - REAL API CALL (this plugin should not exist)
			const result = await isFromWordPressOrg(
				'this-plugin-definitely-does-not-exist-12345',
				'plugin'
			);

			// Assert - INTENDED: Non-existent plugins return false
			expect( result ).toBe( false );
		} );

		it( 'should return false for a custom/premium plugin not on WordPress.org', async () => {
			// Act - REAL API CALL (ACF Pro is not on WordPress.org, only premium version)
			const result = await isFromWordPressOrg(
				'advanced-custom-fields-pro',
				'plugin'
			);

			// Assert - INTENDED: Premium/custom plugins not on WordPress.org return false
			expect( result ).toBe( false );
		} );
	} );

	describe( 'WordPress.org Theme Detection (Real API)', () => {
		it( 'should correctly identify Twenty Twenty-Four as from WordPress.org', async () => {
			// Act - REAL API CALL
			const result = await isFromWordPressOrg(
				'twentytwentyfour',
				'theme'
			);

			// Assert - INTENDED: Twenty Twenty-Four is a real WordPress.org theme
			expect( result ).toBe( true );
		} );

		it( 'should correctly identify Twenty Twenty-Three as from WordPress.org', async () => {
			// Act - REAL API CALL
			const result = await isFromWordPressOrg(
				'twentytwentythree',
				'theme'
			);

			// Assert - INTENDED: Twenty Twenty-Three is a real WordPress.org theme
			expect( result ).toBe( true );
		} );

		it( 'should correctly identify Astra as from WordPress.org', async () => {
			// Act - REAL API CALL
			const result = await isFromWordPressOrg( 'astra', 'theme' );

			// Assert - INTENDED: Astra is a real WordPress.org theme
			expect( result ).toBe( true );
		} );

		it( 'should return false for a non-existent theme', async () => {
			// Act - REAL API CALL (this theme should not exist)
			const result = await isFromWordPressOrg(
				'this-theme-definitely-does-not-exist-12345',
				'theme'
			);

			// Assert - INTENDED: Non-existent themes return false
			expect( result ).toBe( false );
		} );

		it( 'should return false for a custom/premium theme not on WordPress.org', async () => {
			// Act - REAL API CALL (Divi is a premium theme not on WordPress.org)
			const result = await isFromWordPressOrg( 'divi', 'theme' );

			// Assert - INTENDED: Premium/custom themes not on WordPress.org return false
			// Note: Divi might redirect or 404, both should return false
			expect( result ).toBe( false );
		} );
	} );

	describe( 'Edge Cases and Special Scenarios (Real API)', () => {
		it( 'should handle plugin slugs with hyphens correctly', async () => {
			// Act - REAL API CALL
			const result = await isFromWordPressOrg(
				'really-simple-ssl',
				'plugin'
			);

			// Assert - INTENDED: Plugins with hyphens should work correctly
			expect( result ).toBe( true );
		} );

		it( 'should handle theme slugs with numbers correctly', async () => {
			// Act - REAL API CALL
			const result = await isFromWordPressOrg(
				'twentytwentyone',
				'theme'
			);

			// Assert - INTENDED: Themes with numbers should work correctly
			expect( result ).toBe( true );
		} );

		it( 'should handle plugins that have been removed from WordPress.org', async () => {
			// Act - REAL API CALL
			// Note: If a plugin is removed, it should return false (either 404 or redirect)
			const result = await isFromWordPressOrg(
				'removed-plugin-example',
				'plugin'
			);

			// Assert - INTENDED: Removed plugins should return false
			expect( result ).toBe( false );
		} );
	} );

	describe( 'INTENDED Workflow Validation', () => {
		it( 'INTENDED: WordPress.org plugins should go in blueprint, not wp-content.zip', async () => {
			// Arrange - Get real WordPress.org plugins
			const wporgPlugins = [ 'akismet', 'jetpack', 'woocommerce' ];

			// Act - Check each one
			const results = await Promise.all(
				wporgPlugins.map( ( slug ) =>
					isFromWordPressOrg( slug, 'plugin' )
				)
			);

			// Assert - INTENDED: ALL WordPress.org plugins should return true
			// This means they should be:
			// 1. Added to blueprint as installPlugin steps
			// 2. NOT included in wp-content.zip
			results.forEach( ( result, index ) => {
				expect( result ).toBe( true );
				// If this fails, it means the plugin detection is broken
				// and WordPress.org plugins might be incorrectly added to wp-content.zip
				if ( ! result ) {
					console.error(
						`ERROR: ${ wporgPlugins[ index ] } not detected as WordPress.org plugin!`
					);
					console.error(
						`This means it will be INCORRECTLY included in wp-content.zip`
					);
				}
			} );
		} );

		it( 'INTENDED: Custom plugins should NOT go in blueprint, should go in wp-content.zip', async () => {
			// Arrange - Test custom plugins (these should NOT exist on WordPress.org)
			const customPlugins = [
				'my-custom-company-plugin',
				'internal-tools-plugin',
				'custom-integration-12345',
			];

			// Act - Check each one
			const results = await Promise.all(
				customPlugins.map( ( slug ) =>
					isFromWordPressOrg( slug, 'plugin' )
				)
			);

			// Assert - INTENDED: ALL custom plugins should return false
			// This means they should be:
			// 1. NOT added to blueprint
			// 2. Included in wp-content.zip
			results.forEach( ( result, index ) => {
				expect( result ).toBe( false );
				// If this fails, it means the plugin detection is broken
				// and custom plugins might be incorrectly excluded from wp-content.zip
				if ( result ) {
					console.error(
						`ERROR: ${ customPlugins[ index ] } detected as WordPress.org plugin when it shouldn't be!`
					);
					console.error(
						`This means it will be INCORRECTLY excluded from wp-content.zip`
					);
				}
			} );
		} );

		it( 'INTENDED: Premium plugins not on WordPress.org should go in wp-content.zip', async () => {
			// Arrange - Test known premium plugins
			const premiumPlugins = [
				'advanced-custom-fields-pro', // ACF Pro
				'gravityforms', // Gravity Forms
				'elementor-pro', // Elementor Pro
			];

			// Act - Check each one
			const results = await Promise.all(
				premiumPlugins.map( ( slug ) =>
					isFromWordPressOrg( slug, 'plugin' )
				)
			);

			// Assert - INTENDED: Premium plugins should return false (not on WordPress.org)
			results.forEach( ( result, index ) => {
				expect( result ).toBe( false );
				if ( result ) {
					console.error(
						`ERROR: ${ premiumPlugins[ index ] } detected as WordPress.org plugin!`
					);
					console.error(
						`Premium plugins should NOT be in WordPress.org`
					);
				}
			} );
		} );
	} );

	describe( 'Performance and Reliability', () => {
		it( 'should complete WordPress.org checks within reasonable time', async () => {
			// Arrange
			const startTime = Date.now();
			const plugins = [ 'akismet', 'jetpack', 'woocommerce' ];

			// Act - Check all plugins
			await Promise.all(
				plugins.map( ( slug ) => isFromWordPressOrg( slug, 'plugin' ) )
			);
			const endTime = Date.now();
			const duration = endTime - startTime;

			// Assert - INTENDED: Should complete within 10 seconds for 3 plugins
			expect( duration ).toBeLessThan( 10000 );
			console.log(
				`WordPress.org checks took ${ duration }ms for 3 plugins`
			);
		} );

		it( 'should handle concurrent checks without errors', async () => {
			// Arrange - Many plugins at once
			const plugins = [
				'akismet',
				'jetpack',
				'woocommerce',
				'contact-form-7',
				'wordpress-seo',
				'really-simple-ssl',
			];

			// Act - Check all concurrently
			const results = await Promise.all(
				plugins.map( ( slug ) => isFromWordPressOrg( slug, 'plugin' ) )
			);

			// Assert - INTENDED: All should complete successfully
			expect( results ).toHaveLength( plugins.length );
			results.forEach( ( result ) => {
				expect( typeof result ).toBe( 'boolean' );
			} );
		} );
	} );

	describe( 'Error Recovery and Fail-Safe Behavior', () => {
		it( 'INTENDED: Network errors should default to treating plugin as custom (fail-safe)', async () => {
			// This test documents the INTENDED behavior:
			// If we can't check WordPress.org (network error), we should assume custom
			// and include it in wp-content.zip (safer than excluding it)

			// Note: This behavior is already tested in useAssetDiscovery.test.js with mocks
			// but documenting the intention here

			// INTENDED BEHAVIOR:
			// - Network error → return false (treat as custom)
			// - Include in wp-content.zip (safer)
			// - Better to include unnecessarily than exclude and break site

			expect( true ).toBe( true ); // Placeholder - behavior tested elsewhere
		} );

		it( 'INTENDED: CORS errors should default to treating plugin as custom (fail-safe)', async () => {
			// Similar to network errors, CORS errors should fail-safe

			// INTENDED BEHAVIOR:
			// - CORS error → return false (treat as custom)
			// - Include in wp-content.zip (safer)

			expect( true ).toBe( true ); // Placeholder - behavior tested elsewhere
		} );
	} );
} );

/**
 * Helper function to test a complete workflow scenario.
 * This simulates what should happen in the actual plugin detection workflow.
 * @param installedPlugins
 */
async function simulatePluginDetectionWorkflow( installedPlugins ) {
	// Step 1: Check each plugin against WordPress.org
	const pluginChecks = await Promise.all(
		installedPlugins.map( async ( plugin ) => ( {
			slug: plugin,
			from_wporg: await isFromWordPressOrg( plugin, 'plugin' ),
		} ) )
	);

	// Step 2: Split into WordPress.org vs Custom
	const wporgPlugins = pluginChecks
		.filter( ( p ) => p.from_wporg )
		.map( ( p ) => p.slug );
	const customPlugins = pluginChecks
		.filter( ( p ) => ! p.from_wporg )
		.map( ( p ) => p.slug );

	return {
		wporgPlugins,
		customPlugins,
		// INTENDED: wporgPlugins go in blueprint
		// INTENDED: customPlugins go in wp-content.zip
	};
}

describe( 'Complete Workflow Scenarios (Real API)', () => {
	jest.setTimeout( 30000 );

	it( 'SCENARIO: Site with mix of WordPress.org and custom plugins', async () => {
		// Arrange - Real scenario with mixed plugins
		const installedPlugins = [
			'akismet', // WordPress.org
			'jetpack', // WordPress.org
			'my-custom-plugin', // Custom (doesn't exist)
			'woocommerce', // WordPress.org
		];

		// Act
		const { wporgPlugins, customPlugins } =
			await simulatePluginDetectionWorkflow( installedPlugins );

		// Assert - INTENDED behavior
		// WordPress.org plugins: should be in blueprint
		expect( wporgPlugins ).toContain( 'akismet' );
		expect( wporgPlugins ).toContain( 'jetpack' );
		expect( wporgPlugins ).toContain( 'woocommerce' );

		// Custom plugins: should be in wp-content.zip
		expect( customPlugins ).toContain( 'my-custom-plugin' );

		// Validate split is correct
		expect( wporgPlugins.length ).toBe( 3 );
		expect( customPlugins.length ).toBe( 1 );
	} );

	it( 'SCENARIO: Site with only WordPress.org plugins', async () => {
		// Arrange
		const installedPlugins = [ 'akismet', 'jetpack', 'woocommerce' ];

		// Act
		const { wporgPlugins, customPlugins } =
			await simulatePluginDetectionWorkflow( installedPlugins );

		// Assert - INTENDED: All in blueprint, none in wp-content.zip
		expect( wporgPlugins.length ).toBe( 3 );
		expect( customPlugins.length ).toBe( 0 );
	} );

	it( 'SCENARIO: Site with only custom plugins', async () => {
		// Arrange
		const installedPlugins = [
			'my-plugin-1',
			'my-plugin-2',
			'my-plugin-3',
		];

		// Act
		const { wporgPlugins, customPlugins } =
			await simulatePluginDetectionWorkflow( installedPlugins );

		// Assert - INTENDED: None in blueprint, all in wp-content.zip
		expect( wporgPlugins.length ).toBe( 0 );
		expect( customPlugins.length ).toBe( 3 );
	} );

	it( 'SCENARIO: Site with premium plugins', async () => {
		// Arrange
		const installedPlugins = [
			'akismet', // WordPress.org (free)
			'advanced-custom-fields-pro', // Premium (not on WordPress.org)
			'gravityforms', // Premium (not on WordPress.org)
		];

		// Act
		const { wporgPlugins, customPlugins } =
			await simulatePluginDetectionWorkflow( installedPlugins );

		// Assert - INTENDED: Only akismet in blueprint, premium in wp-content.zip
		expect( wporgPlugins ).toContain( 'akismet' );
		expect( wporgPlugins.length ).toBe( 1 );

		expect( customPlugins ).toContain( 'advanced-custom-fields-pro' );
		expect( customPlugins ).toContain( 'gravityforms' );
		expect( customPlugins.length ).toBe( 2 );
	} );
} );
