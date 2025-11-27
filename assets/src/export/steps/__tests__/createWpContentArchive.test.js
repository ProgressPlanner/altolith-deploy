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
jest.mock( '@wordpress/hooks', () => ( {
	addAction: ( ...args ) => mockAddAction( ...args ),
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

		test( 'should have no dependencies', () => {
			expect( stepDefinition.dependencies ).toEqual( [] );
		} );

		test( 'should require api from initial context', () => {
			expect( stepDefinition.requires.api ).toEqual( {
				from: 'initial',
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

		test( 'should have blueprint_bundle deployment type', () => {
			expect( stepDefinition.deploymentType ).toBe( 'blueprint_bundle' );
		} );
	} );

	// ============================================================
	// Handler - Success Cases
	// ============================================================
	describe( 'handler - success cases', () => {
		test( 'should call api.createArchive with includeUploads', async () => {
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
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.createArchive ).toHaveBeenCalledWith( {
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
					assetManager: mockAssetManager,
					setStatusMessage: mockSetStatusMessage,
				} )
			).resolves.toBeDefined();
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
				setStatusMessage: mockSetStatusMessage,
			} );

			// Should use 0 as default
			expect( result.zipSize ).toBeUndefined();
			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( '0 B' );
		} );

		test( 'should update step progress when setStepProgress is provided', async () => {
			const mockApi = {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					zipSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();
			const mockSetStepProgress = jest.fn();

			await handler( {
				api: mockApi,
				setStatusMessage: mockSetStatusMessage,
				setStepProgress: mockSetStepProgress,
			} );

			expect( mockSetStepProgress ).toHaveBeenCalledWith(
				'createWpContentArchive',
				expect.objectContaining( {
					current: 1,
					total: 1,
					statusData: expect.objectContaining( {
						zipSizeFormatted: expect.any( String ),
					} ),
				} )
			);
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
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Network error' );
		} );
	} );

	// ============================================================
	// Status Labels
	// ============================================================
	describe( 'status labels', () => {
		test( 'should have pending label', () => {
			expect( stepDefinition.statusLabels.pending ).toBe(
				'Create archive'
			);
		} );

		test( 'should have running label function', () => {
			expect( typeof stepDefinition.statusLabels.running ).toBe(
				'function'
			);
			expect( stepDefinition.statusLabels.running() ).toContain(
				'Creating'
			);
		} );

		test( 'should have complete label function', () => {
			expect( typeof stepDefinition.statusLabels.complete ).toBe(
				'function'
			);
		} );

		test( 'complete label should show size when available', () => {
			const label = stepDefinition.statusLabels.complete( {
				zipSizeFormatted: '1.5 MB',
			} );
			expect( label ).toContain( '1.5 MB' );
		} );

		test( 'complete label should work without size', () => {
			const label = stepDefinition.statusLabels.complete( {} );
			expect( label ).toContain( 'Created' );
		} );
	} );
} );
