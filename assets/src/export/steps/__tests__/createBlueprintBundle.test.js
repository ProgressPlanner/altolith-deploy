/**
 * Create Blueprint Bundle Step Tests
 *
 * Tests for creating blueprint-bundle.zip containing blueprint.json and wp-content.zip.
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

describe( 'createBlueprintBundle step', () => {
	beforeAll( () => {
		// Import the module to trigger addAction
		require( '../createBlueprintBundle' );

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
			expect( stepDefinition.id ).toBe( 'createBlueprintBundle' );
		} );

		test( 'should have descriptive label', () => {
			expect( stepDefinition.label ).toBe( 'Create Blueprint Bundle' );
		} );

		test( 'should depend on createWpContentArchive', () => {
			expect( stepDefinition.dependencies ).toContain(
				'createWpContentArchive'
			);
		} );

		test( 'should require api from initial context', () => {
			expect( stepDefinition.requires.api ).toEqual( {
				from: 'initial',
				required: true,
			} );
		} );

		test( 'should require generateBlueprintJson from initial context', () => {
			expect( stepDefinition.requires.generateBlueprintJson ).toEqual( {
				from: 'initial',
				required: true,
			} );
		} );

		test( 'should require zipPath from createWpContentArchive', () => {
			expect( stepDefinition.requires.zipPath ).toEqual( {
				from: 'createWpContentArchive',
				required: true,
			} );
		} );

		test( 'should require zipUrl from createWpContentArchive', () => {
			expect( stepDefinition.requires.zipUrl ).toEqual( {
				from: 'createWpContentArchive',
				required: true,
			} );
		} );

		test( 'should require discoveredAssets from discoverBlueprintBundleAssets', () => {
			expect( stepDefinition.requires.discoveredAssets ).toEqual( {
				from: 'discoverBlueprintBundleAssets',
				required: true,
			} );
		} );

		test( 'should provide blueprintData with global scope', () => {
			expect( stepDefinition.provides.blueprintData ).toEqual( {
				type: 'object',
				scope: 'global',
			} );
		} );

		test( 'should provide blueprintBundle with global scope', () => {
			expect( stepDefinition.provides.blueprintBundle ).toEqual( {
				type: 'object',
				scope: 'global',
			} );
		} );

		test( 'should not support progress tracking', () => {
			expect( stepDefinition.supportsProgress ).toBe( false );
		} );
	} );

	// ============================================================
	// Handler - Success Cases with generateBlueprintJson
	// ============================================================
	describe( 'handler - with generateBlueprintJson', () => {
		test( 'should call generateBlueprintJson when provided', async () => {
			const mockBlueprintData = { steps: [] };
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( mockBlueprintData );
			const mockApi = {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: true,
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				zipPath: '/tmp/wp-content.zip',
				zipUrl: 'http://example.com/wp-content.zip',
				discoveredAssets: [ { type: 'plugin', slug: 'my-plugin' } ],
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockGenerateBlueprintJson ).toHaveBeenCalledWith(
				{
					assets: [ { type: 'plugin', slug: 'my-plugin' } ],
					wpContentZipUrl: 'http://example.com/wp-content.zip',
				},
				mockSetStatusMessage
			);
		} );

		test( 'should use generateBlueprintJson result for bundle creation', async () => {
			const mockBlueprintData = { steps: [ { step: 'writeFile' } ] };
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( mockBlueprintData );
			const mockApi = {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: true,
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				zipPath: '/tmp/wp-content.zip',
				zipUrl: 'http://example.com/wp-content.zip',
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.createBlueprintBundle ).toHaveBeenCalledWith( {
				blueprint: mockBlueprintData,
				wpContentZipPath: '/tmp/wp-content.zip',
			} );
		} );
	} );

	// ============================================================
	// Handler - Fallback to API
	// ============================================================
	describe( 'handler - API fallback', () => {
		test( 'should use API when generateBlueprintJson is not a function', async () => {
			const mockBlueprintData = { steps: [] };
			const mockApi = {
				generateBlueprint: jest.fn().mockResolvedValue( {
					success: true,
					blueprint: mockBlueprintData,
				} ),
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: true,
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: undefined, // Not provided
				zipPath: '/tmp/wp-content.zip',
				zipUrl: 'http://example.com/wp-content.zip',
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.generateBlueprint ).toHaveBeenCalledWith( {
				assets: [],
				wpContentZipUrl: 'http://example.com/wp-content.zip',
			} );
		} );

		test( 'should throw error when API generateBlueprint fails', async () => {
			const mockApi = {
				generateBlueprint: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Blueprint generation failed',
				} ),
				createBlueprintBundle: jest.fn(),
			};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: null,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					discoveredAssets: [],
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Blueprint generation failed' );
		} );
	} );

	// ============================================================
	// Handler - Success Cases
	// ============================================================
	describe( 'handler - success', () => {
		test( 'should return blueprint data and bundle info', async () => {
			const mockBlueprintData = { steps: [] };
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( mockBlueprintData );
			const mockApi = {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: true,
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 2048,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				zipPath: '/tmp/wp-content.zip',
				zipUrl: 'http://example.com/wp-content.zip',
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.blueprintData ).toEqual( mockBlueprintData );
			expect( result.blueprintBundle ).toEqual( {
				bundlePath: '/tmp/bundle.zip',
				bundleUrl: 'http://example.com/bundle.zip',
				bundleSize: 2048,
			} );
		} );

		test( 'should set progress status while creating', async () => {
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockApi = {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: true,
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				zipPath: '/tmp/wp-content.zip',
				zipUrl: 'http://example.com/wp-content.zip',
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Creating blueprint bundle…',
				'progress',
				'createBlueprintBundle'
			);
		} );

		test( 'should set success status with file size', async () => {
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockApi = {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: true,
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1048576, // 1 MB
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				zipPath: '/tmp/wp-content.zip',
				zipUrl: 'http://example.com/wp-content.zip',
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( 'Created blueprint bundle' );
			expect( successCall[ 0 ] ).toContain( 'MB' );
		} );

		test( 'should apply filter for blueprint data', async () => {
			const mockBlueprintData = { steps: [] };
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( mockBlueprintData );
			const mockApi = {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: true,
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();
			const context = {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				zipPath: '/tmp/wp-content.zip',
				zipUrl: 'http://example.com/wp-content.zip',
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			};

			await handler( context );

			expect( mockApplyFilters ).toHaveBeenCalledWith(
				'aether.export.step.createBlueprintBundle.blueprintData',
				mockBlueprintData,
				context
			);
		} );

		test( 'should use filtered blueprint data', async () => {
			const originalBlueprint = { steps: [] };
			const filteredBlueprint = { steps: [ { step: 'customStep' } ] };

			mockApplyFilters.mockImplementation( ( hookName, value ) => {
				if (
					hookName ===
					'aether.export.step.createBlueprintBundle.blueprintData'
				) {
					return filteredBlueprint;
				}
				return value;
			} );

			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( originalBlueprint );
			const mockApi = {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: true,
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				zipPath: '/tmp/wp-content.zip',
				zipUrl: 'http://example.com/wp-content.zip',
				discoveredAssets: [],
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.createBlueprintBundle ).toHaveBeenCalledWith( {
				blueprint: filteredBlueprint,
				wpContentZipPath: '/tmp/wp-content.zip',
			} );
			expect( result.blueprintData ).toEqual( filteredBlueprint );
		} );
	} );

	// ============================================================
	// Handler - Error Cases
	// ============================================================
	describe( 'handler - error cases', () => {
		test( 'should throw error when zipPath is missing', async () => {
			const mockGenerateBlueprintJson = jest.fn();
			const mockApi = {};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: mockGenerateBlueprintJson,
					zipPath: null, // Missing
					zipUrl: 'http://example.com/wp-content.zip',
					discoveredAssets: [],
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Site archive not found' );
		} );

		test( 'should throw error when createBlueprintBundle fails', async () => {
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockApi = {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Bundle creation failed',
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: mockGenerateBlueprintJson,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					discoveredAssets: [],
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Bundle creation failed' );
		} );

		test( 'should throw default error when no message provided', async () => {
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockApi = {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: false,
				} ),
			};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: mockGenerateBlueprintJson,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					discoveredAssets: [],
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Failed to create blueprint bundle' );
		} );

		test( 'should propagate API errors', async () => {
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockApi = {
				createBlueprintBundle: jest
					.fn()
					.mockRejectedValue( new Error( 'Network error' ) ),
			};
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: mockGenerateBlueprintJson,
					zipPath: '/tmp/wp-content.zip',
					zipUrl: 'http://example.com/wp-content.zip',
					discoveredAssets: [],
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Network error' );
		} );
	} );
} );
