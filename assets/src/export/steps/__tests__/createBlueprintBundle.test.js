/**
 * Create Blueprint Bundle Step Tests
 *
 * Tests for the consolidated blueprint bundle step that:
 * 1. Creates wp-content archive
 * 2. Discovers custom assets
 * 3. Generates blueprint JSON
 * 4. Creates blueprint-bundle.zip
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
	_n: ( singular, plural, count ) => ( count === 1 ? singular : plural ),
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

/**
 * Helper to create a basic mock API
 */
function createMockApi( overrides = {} ) {
	return {
		createArchive: jest.fn().mockResolvedValue( {
			success: true,
			zipPath: '/tmp/wp-content.zip',
			zipUrl: 'http://example.com/wp-content.zip',
			zipSize: 52428800, // 50 MB
		} ),
		discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
			success: true,
			assets: [],
		} ),
		createBlueprintBundle: jest.fn().mockResolvedValue( {
			success: true,
			bundlePath: '/tmp/bundle.zip',
			bundleUrl: 'http://example.com/bundle.zip',
			bundleSize: 1024,
		} ),
		generateBlueprint: jest.fn().mockResolvedValue( {
			success: true,
			blueprint: { steps: [] },
		} ),
		...overrides,
	};
}

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

		test( 'should have no dependencies (consolidated step)', () => {
			expect( stepDefinition.dependencies ).toEqual( [] );
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

		test( 'should NOT require zipPath externally (created internally)', () => {
			expect( stepDefinition.requires.zipPath ).toBeUndefined();
		} );

		test( 'should NOT require zipUrl externally (created internally)', () => {
			expect( stepDefinition.requires.zipUrl ).toBeUndefined();
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

		test( 'should provide discoveredAssets with global scope', () => {
			expect( stepDefinition.provides.discoveredAssets ).toEqual( {
				type: 'array',
				scope: 'global',
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

		test( 'should have blueprint_bundle deployment type', () => {
			expect( stepDefinition.deploymentType ).toBe( 'blueprint_bundle' );
		} );
	} );

	// ============================================================
	// Handler - Archive Creation Phase
	// ============================================================
	describe( 'handler - archive creation phase', () => {
		test( 'should call api.createArchive first', async () => {
			const mockApi = createMockApi();
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( { steps: [] } );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.createArchive ).toHaveBeenCalledWith( {
				includeUploads: true,
			} );
		} );

		test( 'should throw error when archive creation fails', async () => {
			const mockApi = createMockApi( {
				createArchive: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Archive creation failed',
				} ),
			} );
			const mockGenerateBlueprintJson = jest.fn();
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: mockGenerateBlueprintJson,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Archive creation failed' );
		} );

		test( 'should set progress status during archive creation', async () => {
			const mockApi = createMockApi();
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( { steps: [] } );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Creating wp-content archive…',
				'progress',
				'createBlueprintBundle'
			);
		} );

		test( 'should include archive data in return value', async () => {
			const mockApi = createMockApi( {
				createArchive: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/test-archive.zip',
					zipUrl: 'http://example.com/test-archive.zip',
					zipSize: 12345,
				} ),
			} );
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( { steps: [] } );
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.zipPath ).toBe( '/tmp/test-archive.zip' );
			expect( result.zipUrl ).toBe( 'http://example.com/test-archive.zip' );
			expect( result.zipSize ).toBe( 12345 );
		} );
	} );

	// ============================================================
	// Handler - Discovery Phase
	// ============================================================
	describe( 'handler - discovery phase', () => {
		test( 'should call api.discoverBlueprintBundleAssets after archive', async () => {
			const mockApi = createMockApi();
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( { steps: [] } );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.discoverBlueprintBundleAssets ).toHaveBeenCalled();
			// Verify order: createArchive called before discoverBlueprintBundleAssets
			const createArchiveOrder =
				mockApi.createArchive.mock.invocationCallOrder[ 0 ];
			const discoverOrder =
				mockApi.discoverBlueprintBundleAssets.mock.invocationCallOrder[ 0 ];
			expect( createArchiveOrder ).toBeLessThan( discoverOrder );
		} );

		test( 'should throw error when discovery fails', async () => {
			const mockApi = createMockApi( {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Discovery failed',
				} ),
			} );
			const mockGenerateBlueprintJson = jest.fn();
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: mockGenerateBlueprintJson,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Discovery failed' );
		} );

		test( 'should set progress status during discovery', async () => {
			const mockApi = createMockApi();
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( { steps: [] } );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				'Discovering plugins and themes…',
				'progress',
				'createBlueprintBundle'
			);
		} );

		test( 'should include discoveredAssets in return value', async () => {
			const discoveredAssets = [
				{ type: 'plugin', slug: 'my-plugin' },
				{ type: 'theme', slug: 'my-theme' },
			];
			const mockApi = createMockApi( {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: discoveredAssets,
				} ),
			} );
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( { steps: [] } );
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.discoveredAssets ).toEqual( discoveredAssets );
		} );

		test( 'should show message when no custom assets found', async () => {
			const mockApi = createMockApi( {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [],
				} ),
			} );
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( { steps: [] } );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			} );

			const discoveryCall = mockSetStatusMessage.mock.calls.find(
				( call ) =>
					call[ 0 ].includes( 'No custom plugins or themes' ) &&
					call[ 1 ] === 'progress'
			);
			expect( discoveryCall ).toBeDefined();
		} );
	} );

	// ============================================================
	// Handler - Blueprint Generation Phase
	// ============================================================
	describe( 'handler - with generateBlueprintJson', () => {
		test( 'should call generateBlueprintJson with discovered assets', async () => {
			const discoveredAssets = [ { type: 'plugin', slug: 'my-plugin' } ];
			const mockBlueprintData = { steps: [] };
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( mockBlueprintData );
			const mockApi = createMockApi( {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: discoveredAssets,
				} ),
			} );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockGenerateBlueprintJson ).toHaveBeenCalledWith(
				{
					assets: discoveredAssets,
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
			const mockApi = createMockApi();
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.createBlueprintBundle ).toHaveBeenCalledWith( {
				blueprint: mockBlueprintData,
				wpContentZipPath: '/tmp/wp-content.zip',
			} );
		} );
	} );

	// ============================================================
	// Handler - API Fallback
	// ============================================================
	describe( 'handler - API fallback', () => {
		test( 'should use API when generateBlueprintJson is not a function', async () => {
			const mockBlueprintData = { steps: [] };
			const mockApi = createMockApi( {
				generateBlueprint: jest.fn().mockResolvedValue( {
					success: true,
					blueprint: mockBlueprintData,
				} ),
			} );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: undefined,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApi.generateBlueprint ).toHaveBeenCalledWith( {
				assets: [],
				wpContentZipUrl: 'http://example.com/wp-content.zip',
			} );
		} );

		test( 'should throw error when API generateBlueprint fails', async () => {
			const mockApi = createMockApi( {
				generateBlueprint: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Blueprint generation failed',
				} ),
			} );
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: null,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Blueprint generation failed' );
		} );
	} );

	// ============================================================
	// Handler - Bundle Creation Phase
	// ============================================================
	describe( 'handler - bundle creation', () => {
		test( 'should return blueprint data and bundle info', async () => {
			const mockBlueprintData = { steps: [] };
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( mockBlueprintData );
			const mockApi = createMockApi( {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: true,
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 2048,
				} ),
			} );
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.blueprintData ).toEqual( mockBlueprintData );
			expect( result.blueprintBundle ).toEqual( {
				bundlePath: '/tmp/bundle.zip',
				bundleUrl: 'http://example.com/bundle.zip',
				bundleSize: 2048,
			} );
		} );

		test( 'should set progress status while creating bundle', async () => {
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockApi = createMockApi();
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
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
			const mockApi = createMockApi( {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: true,
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1048576,
				} ),
			} );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
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
			const mockApi = createMockApi();
			const mockSetStatusMessage = jest.fn();
			const context = {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
			};

			await handler( context );

			expect( mockApplyFilters ).toHaveBeenCalledWith(
				'aether.export.step.createBlueprintBundle.blueprintData',
				mockBlueprintData,
				context
			);
		} );

		test( 'should update step progress with asset counts', async () => {
			const mockApi = createMockApi( {
				discoverBlueprintBundleAssets: jest.fn().mockResolvedValue( {
					success: true,
					assets: [
						{ type: 'plugin', slug: 'plugin-1' },
						{ type: 'theme', slug: 'theme-1' },
					],
				} ),
			} );
			const mockGenerateBlueprintJson = jest
				.fn()
				.mockResolvedValue( { steps: [] } );
			const mockSetStatusMessage = jest.fn();
			const mockSetStepProgress = jest.fn();

			await handler( {
				api: mockApi,
				generateBlueprintJson: mockGenerateBlueprintJson,
				setStatusMessage: mockSetStatusMessage,
				setStepProgress: mockSetStepProgress,
			} );

			expect( mockSetStepProgress ).toHaveBeenCalledWith(
				'createBlueprintBundle',
				expect.objectContaining( {
					statusData: expect.objectContaining( {
						customPlugins: 1,
						customThemes: 1,
					} ),
				} )
			);
		} );
	} );

	// ============================================================
	// Handler - Error Cases
	// ============================================================
	describe( 'handler - error cases', () => {
		test( 'should throw error when createBlueprintBundle fails', async () => {
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockApi = createMockApi( {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Bundle creation failed',
				} ),
			} );
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: mockGenerateBlueprintJson,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Bundle creation failed' );
		} );

		test( 'should throw default error when no message provided', async () => {
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockApi = createMockApi( {
				createBlueprintBundle: jest.fn().mockResolvedValue( {
					success: false,
				} ),
			} );
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: mockGenerateBlueprintJson,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Failed to create blueprint bundle' );
		} );

		test( 'should propagate API errors', async () => {
			const mockGenerateBlueprintJson = jest.fn().mockResolvedValue( {} );
			const mockApi = createMockApi( {
				createBlueprintBundle: jest
					.fn()
					.mockRejectedValue( new Error( 'Network error' ) ),
			} );
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					api: mockApi,
					generateBlueprintJson: mockGenerateBlueprintJson,
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
				'Create blueprint'
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
				bundleSizeFormatted: '1.5 MB',
			} );
			expect( label ).toContain( '1.5 MB' );
		} );

		test( 'complete label should show asset info', () => {
			const label = stepDefinition.statusLabels.complete( {
				bundleSizeFormatted: '1.5 MB',
				customPlugins: 2,
				customThemes: 1,
			} );
			expect( label ).toContain( 'plugin' );
			expect( label ).toContain( 'theme' );
		} );

		test( 'complete label should work without size', () => {
			const label = stepDefinition.statusLabels.complete( {} );
			expect( label ).toContain( 'Created' );
		} );
	} );
} );
