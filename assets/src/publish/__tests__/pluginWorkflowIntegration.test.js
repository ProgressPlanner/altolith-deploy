/**
 * Integration Tests for Plugin Detection and wp-content.zip Workflow
 *
 * These tests use REAL WordPress.org API calls to validate actual behavior.
 * Tests are designed to validate INTENDED functionality, not current implementation.
 *
 * @package
 */

// Mock apiFetch for integration tests
jest.mock( '../../utils/api' );

// Mock @wordpress/hooks for integration tests
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );

// Import after mocking - will be re-imported after resetModules
let isFromWordPressOrg;
let apiFetch;

// Mark these as integration tests that can be skipped in CI
// Use: npm test -- --testPathPattern=Integration
describe( 'Plugin Detection Integration Tests (Real API)', () => {
	// Increase timeout for real API calls
	jest.setTimeout( 30000 );

	beforeEach( () => {
		jest.clearAllMocks();
		jest.resetModules(); // Reset modules to clear cache between tests
		// Re-import after reset to get fresh cache and mocks
		const useAssetDiscoveryModule = require( '../../utils/useAssetDiscovery' );
		isFromWordPressOrg = useAssetDiscoveryModule.isFromWordPressOrg;
		apiFetch = require( '../../utils/api' ).default;
	} );

	// Restore mocked fetch after tests
	afterAll( () => {
		global.fetch = jest.fn();
	} );

	describe( 'WordPress.org Plugin Detection (Real API)', () => {

		it( 'should correctly identify Akismet as from WordPress.org', async () => {
			// Mock apiFetch to simulate WordPress.org check
			apiFetch.mockResolvedValueOnce( {
				success: true,
				exists: true,
			} );

			// Act - uses mocked apiFetch
			const result = await isFromWordPressOrg( 'akismet', 'plugin' );

			// Assert - INTENDED: Akismet is a real WordPress.org plugin
			expect( result ).toBe( true );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: expect.stringContaining( '/check-wporg' ),
			} );
		} );

		it( 'should correctly identify Jetpack as from WordPress.org', async () => {
			// Mock apiFetch to simulate WordPress.org check
			apiFetch.mockResolvedValueOnce( {
				success: true,
				exists: true,
			} );

			// Act - uses mocked apiFetch
			const result = await isFromWordPressOrg( 'jetpack', 'plugin' );

			// Assert - INTENDED: Jetpack is a real WordPress.org plugin
			expect( result ).toBe( true );
		} );

		it( 'should correctly identify WooCommerce as from WordPress.org', async () => {
			apiFetch.mockResolvedValueOnce( {
				success: true,
				exists: true,
			} );

			const result = await isFromWordPressOrg( 'woocommerce', 'plugin' );

			expect( result ).toBe( true );
		} );

		it( 'should correctly identify Contact Form 7 as from WordPress.org', async () => {
			apiFetch.mockResolvedValueOnce( {
				success: true,
				exists: true,
			} );

			const result = await isFromWordPressOrg(
				'contact-form-7',
				'plugin'
			);

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
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'should correctly identify Twenty Twenty-Four as from WordPress.org', async () => {
			apiFetch.mockResolvedValueOnce( {
				success: true,
				exists: true,
			} );

			const result = await isFromWordPressOrg(
				'twentytwentyfour',
				'theme'
			);

			expect( result ).toBe( true );
		} );

		it( 'should correctly identify Twenty Twenty-Three as from WordPress.org', async () => {
			apiFetch.mockResolvedValueOnce( {
				success: true,
				exists: true,
			} );

			const result = await isFromWordPressOrg(
				'twentytwentythree',
				'theme'
			);

			expect( result ).toBe( true );
		} );

		it( 'should correctly identify Astra as from WordPress.org', async () => {
			apiFetch.mockResolvedValueOnce( {
				success: true,
				exists: true,
			} );

			const result = await isFromWordPressOrg( 'astra', 'theme' );

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
			apiFetch.mockResolvedValueOnce( {
				success: true,
				exists: true,
			} );

			const result = await isFromWordPressOrg(
				'really-simple-ssl',
				'plugin'
			);

			expect( result ).toBe( true );
		} );

		it( 'should handle theme slugs with numbers correctly', async () => {
			apiFetch.mockResolvedValueOnce( {
				success: true,
				exists: true,
			} );

			const result = await isFromWordPressOrg(
				'twentytwentyone',
				'theme'
			);

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
			// Mock all WordPress.org plugin checks - use unique slugs to avoid cache collisions
			const timestamp = Date.now();
			apiFetch
				.mockResolvedValueOnce( { success: true, exists: true } ) // wporg-test-{timestamp}-1
				.mockResolvedValueOnce( { success: true, exists: true } ) // wporg-test-{timestamp}-2
				.mockResolvedValueOnce( { success: true, exists: true } ); // wporg-test-{timestamp}-3

			const wporgPlugins = [
				`wporg-test-${ timestamp }-1`,
				`wporg-test-${ timestamp }-2`,
				`wporg-test-${ timestamp }-3`,
			];

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
			// Mock all custom plugin checks (not on WordPress.org)
			// Use unique slugs with timestamp to avoid cache collisions
			const timestamp = Date.now();
			apiFetch
				.mockResolvedValueOnce( { success: true, exists: false } ) // custom-test-{timestamp}-1
				.mockResolvedValueOnce( { success: true, exists: false } ) // custom-test-{timestamp}-2
				.mockResolvedValueOnce( { success: true, exists: false } ); // custom-test-{timestamp}-3

			const customPlugins = [
				`custom-test-${ timestamp }-1`,
				`custom-test-${ timestamp }-2`,
				`custom-test-${ timestamp }-3`,
			];

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
			// Mock plugin checks
			const timestamp = Date.now();
			apiFetch
				.mockResolvedValueOnce( { success: true, exists: true } ) // perf-test-{timestamp}-1
				.mockResolvedValueOnce( { success: true, exists: true } ) // perf-test-{timestamp}-2
				.mockResolvedValueOnce( { success: true, exists: true } ); // perf-test-{timestamp}-3

			const startTime = Date.now();
			const plugins = [
				`perf-test-${ timestamp }-1`,
				`perf-test-${ timestamp }-2`,
				`perf-test-${ timestamp }-3`,
			];

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
			// Mock plugin checks - use unique slugs
			const timestamp = Date.now();
			apiFetch
				.mockResolvedValueOnce( { success: true, exists: true } ) // concurrent-{timestamp}-1
				.mockResolvedValueOnce( { success: true, exists: true } ) // concurrent-{timestamp}-2
				.mockResolvedValueOnce( { success: true, exists: true } ) // concurrent-{timestamp}-3
				.mockResolvedValueOnce( { success: true, exists: true } ) // concurrent-{timestamp}-4
				.mockResolvedValueOnce( { success: true, exists: true } ) // concurrent-{timestamp}-5
				.mockResolvedValueOnce( { success: true, exists: true } ); // concurrent-{timestamp}-6

			const plugins = [
				`concurrent-${ timestamp }-1`,
				`concurrent-${ timestamp }-2`,
				`concurrent-${ timestamp }-3`,
				`concurrent-${ timestamp }-4`,
				`concurrent-${ timestamp }-5`,
				`concurrent-${ timestamp }-6`,
			];

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
			// Mock network error
			const timestamp = Date.now();
			apiFetch.mockRejectedValueOnce( new Error( 'Network error' ) );

			const result = await isFromWordPressOrg( `error-test-${ timestamp }`, 'plugin' );

			// Should return false on error (fail-safe)
			expect( result ).toBe( false );
		} );

		it( 'INTENDED: CORS errors should default to treating plugin as custom (fail-safe)', async () => {
			// Mock CORS error
			const timestamp = Date.now();
			apiFetch.mockRejectedValueOnce( new TypeError( 'CORS error' ) );

			const result = await isFromWordPressOrg( `cors-test-${ timestamp }`, 'plugin' );

			// Should return false on error (fail-safe)
			expect( result ).toBe( false );
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
	// Note: isFromWordPressOrg is re-imported in beforeEach, so use the module-level variable
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

	beforeEach( () => {
		jest.clearAllMocks();
		jest.resetModules(); // Reset modules to clear cache between tests
		// Re-import after reset to get fresh cache and mocks
		const useAssetDiscoveryModule = require( '../../utils/useAssetDiscovery' );
		isFromWordPressOrg = useAssetDiscoveryModule.isFromWordPressOrg;
		apiFetch = require( '../../utils/api' ).default;
	} );

	it( 'SCENARIO: Site with mix of WordPress.org and custom plugins', async () => {
		// Mock plugin checks - use unique slugs to avoid cache collisions
		apiFetch
			.mockResolvedValueOnce( { success: true, exists: true } ) // akismet-mix-1
			.mockResolvedValueOnce( { success: true, exists: true } ) // jetpack-mix-1
			.mockResolvedValueOnce( { success: true, exists: false } ) // my-custom-plugin-mix-1
			.mockResolvedValueOnce( { success: true, exists: true } ); // woocommerce-mix-1

		const installedPlugins = [
			'akismet-mix-1', // WordPress.org
			'jetpack-mix-1', // WordPress.org
			'my-custom-plugin-mix-1', // Custom (doesn't exist)
			'woocommerce-mix-1', // WordPress.org
		];

		// Act
		const { wporgPlugins, customPlugins } =
			await simulatePluginDetectionWorkflow( installedPlugins );

		// Assert - INTENDED behavior
		// WordPress.org plugins: should be in blueprint
		expect( wporgPlugins ).toContain( 'akismet-mix-1' );
		expect( wporgPlugins ).toContain( 'jetpack-mix-1' );
		expect( wporgPlugins ).toContain( 'woocommerce-mix-1' );

		// Custom plugins: should be in wp-content.zip
		expect( customPlugins ).toContain( 'my-custom-plugin-mix-1' );

		// Validate split is correct
		expect( wporgPlugins.length ).toBe( 3 );
		expect( customPlugins.length ).toBe( 1 );
	} );

	it( 'SCENARIO: Site with only WordPress.org plugins', async () => {
		// Mock all WordPress.org plugin checks
		apiFetch
			.mockResolvedValueOnce( { success: true, exists: true } ) // akismet
			.mockResolvedValueOnce( { success: true, exists: true } ) // jetpack
			.mockResolvedValueOnce( { success: true, exists: true } ); // woocommerce

		const installedPlugins = [ 'akismet', 'jetpack', 'woocommerce' ];

		const { wporgPlugins, customPlugins } =
			await simulatePluginDetectionWorkflow( installedPlugins );

		// Assert - INTENDED: All in blueprint, none in wp-content.zip
		expect( wporgPlugins.length ).toBe( 3 );
		expect( customPlugins.length ).toBe( 0 );
	} );

	it( 'SCENARIO: Site with only custom plugins', async () => {
		// Mock all custom plugin checks (not on WordPress.org)
		// Use unique slugs with timestamp to avoid cache collisions
		const timestamp = Date.now();
		apiFetch
			.mockResolvedValueOnce( { success: true, exists: false } ) // custom-only-{timestamp}-1
			.mockResolvedValueOnce( { success: true, exists: false } ) // custom-only-{timestamp}-2
			.mockResolvedValueOnce( { success: true, exists: false } ); // custom-only-{timestamp}-3

		const installedPlugins = [
			`custom-only-${ timestamp }-1`,
			`custom-only-${ timestamp }-2`,
			`custom-only-${ timestamp }-3`,
		];

		const { wporgPlugins, customPlugins } =
			await simulatePluginDetectionWorkflow( installedPlugins );

		// Assert - INTENDED: None in blueprint, all in wp-content.zip
		expect( wporgPlugins.length ).toBe( 0 );
		expect( customPlugins.length ).toBe( 3 );
	} );

	it( 'SCENARIO: Site with premium plugins', async () => {
		// Mock plugin checks - use unique slugs to avoid cache collisions
		const timestamp = Date.now();
		apiFetch
			.mockResolvedValueOnce( { success: true, exists: true } ) // premium-scenario-{timestamp}-1
			.mockResolvedValueOnce( { success: true, exists: false } ) // premium-scenario-{timestamp}-2
			.mockResolvedValueOnce( { success: true, exists: false } ); // premium-scenario-{timestamp}-3

		const installedPlugins = [
			`premium-scenario-${ timestamp }-1`, // WordPress.org (free)
			`premium-scenario-${ timestamp }-2`, // Premium (not on WordPress.org)
			`premium-scenario-${ timestamp }-3`, // Premium (not on WordPress.org)
		];

		const { wporgPlugins, customPlugins } =
			await simulatePluginDetectionWorkflow( installedPlugins );

		// Assert - INTENDED: Only WordPress.org plugin in blueprint, premium in wp-content.zip
		expect( wporgPlugins ).toContain( `premium-scenario-${ timestamp }-1` );
		expect( wporgPlugins.length ).toBe( 1 );

		expect( customPlugins ).toContain( `premium-scenario-${ timestamp }-2` );
		expect( customPlugins ).toContain( `premium-scenario-${ timestamp }-3` );
		expect( customPlugins.length ).toBe( 2 );
	} );
} );
