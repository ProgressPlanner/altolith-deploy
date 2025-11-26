/**
 * Create WP Content Archive Step Tests
 *
 * Tests for creating wp-content.zip containing custom plugins, themes, and uploads.
 * This archive is used in blueprint bundle generation.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

// Mock WordPress hooks
const mockAddAction = jest.fn();
const mockApplyFilters = jest.fn( ( hookName, value ) => value );
jest.mock( '@wordpress/hooks', () => ( {
	addAction: ( ...args ) => mockAddAction( ...args ),
	applyFilters: ( ...args ) => mockApplyFilters( ...args ),
} ) );

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => {
		let result = format;
		args.forEach( ( arg ) => {
			result = result.replace( /%[sd]/, arg );
		} );
		return result;
	},
} ) );

// Mock helpers
jest.mock( '../../utils/helpers', () => ( {
	formatFileSize: jest.fn( ( bytes ) => {
		if ( bytes === 0 ) {
			return '0 B';
		}
		if ( bytes < 1024 ) {
			return `${ bytes } B`;
		}
		if ( bytes < 1024 * 1024 ) {
			return `${ ( bytes / 1024 ).toFixed( 1 ) } KB`;
		}
		return `${ ( bytes / ( 1024 * 1024 ) ).toFixed( 1 ) } MB`;
	} ),
} ) );

// Import after mocks are set up
let stepDefinition;
let handler;

describe( 'createWpContentArchive step', () => {
	beforeAll( () => {
		// Import the module to trigger addAction
		require( '../createWpContentArchive' );

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
		// Reset applyFilters to pass through by default
		mockApplyFilters.mockImplementation( ( hookName, value ) => value );
	} );

	// ============================================================
	// Step Registration
	// ============================================================
	describe( 'step registration', () => {
		test( 'should register with correct id', () => {
			expect( stepDefinition.id ).toBe( 'createWpContentArchive' );
		} );

		test( 'should have descriptive label', () => {
			expect( stepDefinition.label ).toBe( 'Create WP Content Archive' );
		} );

		test( 'should depend on discoverBlueprintBundleAssets', () => {
			expect( stepDefinition.dependencies ).toContain(
				'discoverBlueprintBundleAssets'
			);
		} );

		test( 'should require api from initial context', () => {
			expect( stepDefinition.requires.api ).toEqual( {
				from: 'initial',
				required: true,
			} );
		} );

		test( 'should require discoveredAssets from discoverBlueprintBundleAssets', () => {
			expect( stepDefinition.requires.discoveredAssets ).toEqual( {
				from: 'discoverBlueprintBundleAssets',
				required: true,
			} );
		} );

		test( 'should optionally use assetManager', () => {
			expect( stepDefinition.requires.assetManager ).toEqual( {
				from: 'initial',
				required: false,
			} );
		} );

		test( 'should provide zipPath with global scope', () => {
			expect( stepDefinition.provides.zipPath ).toEqual( {
				type: 'string',
				scope: 'global',
			} );
		} );

		test( 'should provide zipUrl with global scope', () => {
			expect( stepDefinition.provides.zipUrl ).toEqual( {
				type: 'string',
				scope: 'global',
			} );
		} );

		test( 'should provide zipSize with global scope', () => {
			expect( stepDefinition.provides.zipSize ).toEqual( {
				type: 'number',
				scope: 'global',
			} );
		} );

		test( 'should support progress tracking', () => {
			expect( stepDefinition.supportsProgress ).toBe( true );
		} );
	} );

	// ============================================================
	// Handler - Success Cases
	// ============================================================
	describe( 'handler - success cases', () => {
		test( 'should call api.createArchive with assets', async () => {
			const mockAssets = [
				{ type: 'plugin', slug: 'my-plugin' },
				{ type: 'theme', slug: 'my-theme' },
			];
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				discoveredAssets: mockAssets,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.createArchive ).toHaveBeenCalledWith( {
				assets: mockAssets,
				includeUploads: true,
			} );
		} );

		test( 'should return archive info', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 2048,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				api: mockApi,
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.zipPath ).toBe( '/tmp/wp-content.zip' );
			expect( result.zipUrl ).toBe( 'http://example.com/wp-content.zip' );
			expect( result.zipSize ).toBe( 2048 );
		} );

		test( 'should set progress status while creating', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Creating wp-content archive…',
				'progress',
				'createWpContentArchive'
			);
		} );

		test( 'should set success status with file size', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 1048576, // 1 MB
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain(
				'Created wp-content archive'
			);
			expect( successCall[ 0 ] ).toContain( 'MB' );
		} );

		test( 'should apply filter for files to include', async () => {
			const mockAssets = [ { type: 'plugin', slug: 'my-plugin' } ];
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();
			const context = {
				api: mockApi,
				discoveredAssets: mockAssets,
				setStatusMessage: mockSetStatusMessage,
			};

			await handler( context );

			expect( mockApplyFilters ).toHaveBeenCalledWith(
				'aether.export.step.createWpContentArchive.files',
				mockAssets,
				context
			);
		} );

		test( 'should use filtered assets for archive creation', async () => {
			const originalAssets = [ { type: 'plugin', slug: 'plugin-a' } ];
			const filteredAssets = [
				{ type: 'plugin', slug: 'plugin-a' },
				{ type: 'plugin', slug: 'plugin-b' },
			];

			mockApplyFilters.mockImplementation( ( hookName, value ) => {
				if (
					hookName ===
					'aether.export.step.createWpContentArchive.files'
				) {
					return filteredAssets;
				}
				return value;
			} );

			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				discoveredAssets: originalAssets,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.createArchive ).toHaveBeenCalledWith( {
				assets: filteredAssets,
				includeUploads: true,
			} );
		} );

		test( 'should update assetManager when provided', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 1024,
				} ),
			};
			const mockAssetManager = {
				setArchivePath: jest.fn(),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				discoveredAssets: [],
				assetManager: mockAssetManager,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockAssetManager.setArchivePath ).toHaveBeenCalledWith(
				'/tmp/wp-content.zip'
			);
		} );

		test( 'should not fail when assetManager lacks setArchivePath', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 1024,
				} ),
			};
			const mockAssetManager = {};
			const mockSetStatusMessage = jest.fn();

			// Should not throw
			await expect(
				handler( {
					api: mockApi,
					discoveredAssets: [],
					assetManager: mockAssetManager,
					setStatusMessage: mockSetStatusMessage,
				} )
			).resolves.toBeDefined();
		} );

		test( 'should handle missing discoveredAssets by defaulting to empty array', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				// discoveredAssets is undefined
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.createArchive ).toHaveBeenCalledWith( {
				assets: [],
				includeUploads: true,
			} );
		} );

		test( 'should handle zero zipSize', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 0,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				api: mockApi,
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.zipSize ).toBe( 0 );
			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( '0 B' );
		} );

		test( 'should handle undefined zipSize', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					// zipSize is undefined
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				api: mockApi,
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			// Should use 0 as default
			expect( result.zipSize ).toBeUndefined();
			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( '0 B' );
		} );
	} );

	// ============================================================
	// Handler - Error Cases
	// ============================================================
	describe( 'handler - error cases', () => {
		test( 'should throw error when API returns success: false', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Archive creation failed',
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					discoveredAssets: [],
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Archive creation failed' );
		} );

		test( 'should throw default error when no message provided', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: false,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					discoveredAssets: [],
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Failed to create wp-content archive' );
		} );

		test( 'should propagate API errors', async () => {
			const mockApi = {
				createArchive: jest
					.fn()
					.mockRejectedValue( new Error( 'Network error' ) ),
			};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					discoveredAssets: [],
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Network error' );
		} );
	} );
} );
