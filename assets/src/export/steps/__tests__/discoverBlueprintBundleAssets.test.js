/**
 * Discover Blueprint Bundle Assets Step Tests
 *
 * Tests for discovering custom plugins and themes that need to be included
 * in the blueprint bundle (not available on WordPress.org).
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

// Mock WordPress hooks
const mockAddAction = jest.fn();
jest.mock( '@wordpress/hooks', () => ( {
	addAction: ( ...args ) => mockAddAction( ...args ),
} ) );

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => {
		let result = format;
		args.forEach( ( arg, index ) => {
			result = result.replace(
				new RegExp( `%${ index + 1 }\\$[sd]`, 'g' ),
				arg
			);
			result = result.replace( /%[sd]/, arg );
		} );
		return result;
	},
	_n: ( singular, plural, count ) => ( count === 1 ? singular : plural ),
} ) );

// Import after mocks are set up
let stepDefinition;
let handler;

describe( 'discoverBlueprintBundleAssets step', () => {
	beforeAll( () => {
		// Import the module to trigger addAction
		require( '../discoverBlueprintBundleAssets' );

		// Extract the step definition from the mock call
		const registerCall = mockAddAction.mock.calls.find(
			( call ) => call[ 0 ] === 'aether.export.register_steps'
		);
		expect( registerCall ).toBeDefined();

		// Call the callback with a mock registry to get the step definition
		const mockRegistry = {
			register: jest.fn(),
		};
		registerCall[ 2 ]( mockRegistry );
		stepDefinition = mockRegistry.register.mock.calls[ 0 ][ 0 ];
		handler = stepDefinition.handler;
	} );

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	// ============================================================
	// Step Registration
	// ============================================================
	describe( 'step registration', () => {
		test( 'should register with correct id', () => {
			expect( stepDefinition.id ).toBe( 'discoverBlueprintBundleAssets' );
		} );

		test( 'should have descriptive label', () => {
			expect( stepDefinition.label ).toBe( 'Discover Assets' );
		} );

		test( 'should have no dependencies', () => {
			expect( stepDefinition.dependencies ).toEqual( [] );
		} );

		test( 'should require api from initial context', () => {
			expect( stepDefinition.requires.api ).toEqual( {
				from: 'initial',
				required: true,
			} );
		} );

		test( 'should require setStatusMessage from initial context', () => {
			expect( stepDefinition.requires.setStatusMessage ).toEqual( {
				from: 'initial',
				required: true,
			} );
		} );

		test( 'should provide discoveredAssets with global scope', () => {
			expect( stepDefinition.provides.discoveredAssets ).toEqual( {
				type: 'array',
				scope: 'global',
			} );
		} );

		test( 'should not support progress tracking', () => {
			expect( stepDefinition.supportsProgress ).toBe( false );
		} );
	} );

	// ============================================================
	// Handler - Success Cases
	// ============================================================
	describe( 'handler - success cases', () => {
		test( 'should call api.discoverBlueprintBundleAssets', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [],
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.discoverBlueprintBundleAssets ).toHaveBeenCalled();
		} );

		test( 'should return discovered assets', async () => {
			const mockAssets = [
				{ type: 'plugin', slug: 'my-custom-plugin' },
				{ type: 'theme', slug: 'my-custom-theme' },
			];
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: mockAssets,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.discoveredAssets ).toEqual( mockAssets );
		} );

		test( 'should set progress status while discovering', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [],
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Discovering plugins and themes…',
				'progress',
				'discoverBlueprintBundleAssets'
			);
		} );

		test( 'should set success status with zero assets message', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [],
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Discovered 0 active custom plugins/themes',
				'success',
				'discoverBlueprintBundleAssets'
			);
		} );

		test( 'should format message for single plugin', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [ { type: 'plugin', slug: 'my-plugin' } ],
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			} );

			// Find the success message call
			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( '1 active custom plugin' );
			expect( successCall[ 0 ] ).toContain( 'my-plugin' );
		} );

		test( 'should format message for multiple plugins', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [
						{ type: 'plugin', slug: 'plugin-a' },
						{ type: 'plugin', slug: 'plugin-b' },
					],
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			} );

			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( 'active custom plugins' );
			expect( successCall[ 0 ] ).toContain( 'plugin-a' );
			expect( successCall[ 0 ] ).toContain( 'plugin-b' );
		} );

		test( 'should format message for single theme', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [ { type: 'theme', slug: 'my-theme' } ],
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			} );

			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( '1 active custom theme' );
			expect( successCall[ 0 ] ).toContain( 'my-theme' );
		} );

		test( 'should format message for plugins and themes combined', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [
						{ type: 'plugin', slug: 'my-plugin' },
						{ type: 'theme', slug: 'my-theme' },
					],
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			} );

			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( 'plugin' );
			expect( successCall[ 0 ] ).toContain( 'theme' );
			expect( successCall[ 0 ] ).toContain( ' and ' );
		} );

		test( 'should handle response with undefined assets', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					// assets is undefined
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
			} );

			// Should default to empty array
			expect( result.discoveredAssets ).toEqual( [] );
		} );
	} );

	// ============================================================
	// Handler - Error Cases
	// ============================================================
	describe( 'handler - error cases', () => {
		test( 'should throw error when API returns success: false', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Discovery failed',
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Discovery failed' );
		} );

		test( 'should throw default error when no message provided', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: false,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Failed to discover assets' );
		} );

		test( 'should propagate API errors', async () => {
			const mockApi = {
				discoverBlueprintBundleAssets: jest
					.fn()
					.mockRejectedValue( new Error( 'Network error' ) ),
			};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Network error' );
		} );
	} );
} );
