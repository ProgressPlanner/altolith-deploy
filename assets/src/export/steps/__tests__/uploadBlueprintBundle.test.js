/**
 * Upload Blueprint Bundle Step Tests
 *
 * Tests for uploading blueprint-bundle.zip to configured provider instances.
 * This is a per-thread step that processes one provider instance at a time.
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
			result = result.replace( /%\d?\$?[sd]/, arg );
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
		return `${ ( bytes / 1024 ).toFixed( 1 ) } KB`;
	} ),
} ) );

// Mock staticSiteConfig utilities
const mockCreateStorageService = jest.fn();
const mockFetchProviderConfig = jest.fn();
const mockBuildStorageConfig = jest.fn();
jest.mock( '../../utils/staticSiteConfig', () => ( {
	createStorageService: ( ...args ) => mockCreateStorageService( ...args ),
	fetchProviderConfig: ( ...args ) => mockFetchProviderConfig( ...args ),
	buildStorageConfig: ( ...args ) => mockBuildStorageConfig( ...args ),
} ) );

// Mock deployment types
jest.mock( '@aether/constants/deploymentTypes', () => ( {
	DEPLOYMENT_TYPES: {
		STATIC_SITE: 'static-site',
		BLUEPRINT_BUNDLE: 'blueprint-bundle',
	},
} ) );

// Mock ProviderRegistry
const mockProviderRegistry = {
	get: jest.fn(),
};
jest.mock(
	'@aether/providers/registry/ProviderRegistry',
	() => mockProviderRegistry
);

// Import after mocks are set up
let stepDefinition;
let handler;
let shouldSkip;

describe( 'uploadBlueprintBundle step', () => {
	beforeAll( () => {
		// Import the module to trigger addAction
		require( '../uploadBlueprintBundle' );

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
		shouldSkip = stepDefinition.skip;
	} );

	beforeEach( () => {
		jest.clearAllMocks();
		mockFetchProviderConfig.mockResolvedValue( {} );
		mockBuildStorageConfig.mockReturnValue( {
			siteUrl: 'http://example.com',
		} );
	} );

	// ============================================================
	// Step Registration
	// ============================================================
	describe( 'step registration', () => {
		test( 'should register with correct id', () => {
			expect( stepDefinition.id ).toBe( 'uploadBlueprintBundle' );
		} );

		test( 'should have descriptive label', () => {
			expect( stepDefinition.label ).toBe( 'Upload Blueprint Bundle' );
		} );

		test( 'should depend on createBlueprintBundle', () => {
			expect( stepDefinition.dependencies ).toContain(
				'createBlueprintBundle'
			);
		} );

		test( 'should require currentProviderInstance from thread', () => {
			expect( stepDefinition.requires.currentProviderInstance ).toEqual( {
				from: 'thread',
				required: true,
			} );
		} );

		test( 'should require blueprintBundle from createBlueprintBundle', () => {
			expect( stepDefinition.requires.blueprintBundle ).toEqual( {
				from: 'createBlueprintBundle',
				required: true,
			} );
		} );

		test( 'should require siteUrl from initial context', () => {
			expect( stepDefinition.requires.siteUrl ).toEqual( {
				from: 'initial',
				required: true,
			} );
		} );

		test( 'should provide bundleUploadResults with thread scope', () => {
			expect( stepDefinition.provides.bundleUploadResults ).toEqual( {
				type: 'object',
				scope: 'thread',
			} );
		} );

		test( 'should support progress tracking', () => {
			expect( stepDefinition.supportsProgress ).toBe( true );
		} );

		test( 'should have skip function', () => {
			expect( typeof stepDefinition.skip ).toBe( 'function' );
		} );
	} );

	// ============================================================
	// shouldSkip Logic
	// ============================================================
	describe( 'shouldSkip', () => {
		test( 'should return false when no currentProviderInstance', () => {
			const context = {};
			expect( shouldSkip( context ) ).toBe( false );
		} );

		test( 'should skip for static-site deployment type', () => {
			mockProviderRegistry.get.mockReturnValue( {
				DEPLOYMENT_TYPE: 'static-site',
			} );

			const context = {
				currentProviderInstance: {
					id: 'local-filesystem:abc123',
				},
			};
			expect( shouldSkip( context ) ).toBe( true );
		} );

		test( 'should not skip for blueprint-bundle deployment type', () => {
			mockProviderRegistry.get.mockReturnValue( {
				DEPLOYMENT_TYPE: 'blueprint-bundle',
			} );

			const context = {
				currentProviderInstance: {
					id: 'blueprint-provider:abc123',
				},
			};
			expect( shouldSkip( context ) ).toBe( false );
		} );

		test( 'should use instance deploymentType if present', () => {
			// Provider class says static-site, but instance overrides to blueprint-bundle
			mockProviderRegistry.get.mockReturnValue( {
				DEPLOYMENT_TYPE: 'static-site',
			} );

			const context = {
				currentProviderInstance: {
					id: 'mixed-provider:abc123',
					deploymentType: 'blueprint-bundle',
				},
			};
			expect( shouldSkip( context ) ).toBe( false );
		} );

		test( 'should handle provider not found in registry', () => {
			mockProviderRegistry.get.mockReturnValue( null );

			const context = {
				currentProviderInstance: {
					id: 'unknown-provider:abc123',
				},
			};
			// Without a deployment type, it's not blueprint-bundle, so skip
			expect( shouldSkip( context ) ).toBe( true );
		} );
	} );

	// ============================================================
	// Handler - Success Cases
	// ============================================================
	describe( 'handler - success', () => {
		test( 'should fetch provider config', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( { success: true } ),
			};
			mockFetchProviderConfig.mockResolvedValue( {
				export_path: 'custom/path.zip',
			} );
			mockCreateStorageService.mockResolvedValue( mockStorageService );

			const mockSetStatusMessage = jest.fn();

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test Provider',
				},
				blueprintBundle: {
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				},
				siteUrl: 'http://example.com',
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockFetchProviderConfig ).toHaveBeenCalledWith(
				'test-provider:123'
			);
		} );

		test( 'should use export_path from provider config', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( { success: true } ),
			};
			mockFetchProviderConfig.mockResolvedValue( {
				export_path: 'my-bundles/custom.zip',
			} );
			mockCreateStorageService.mockResolvedValue( mockStorageService );

			const mockSetStatusMessage = jest.fn();

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test',
				},
				blueprintBundle: {
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				},
				siteUrl: 'http://example.com',
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockCreateStorageService ).toHaveBeenCalledWith(
				'my-bundles/custom.zip',
				expect.any( Object ),
				'test-provider:123',
				expect.objectContaining( {
					export_path: 'my-bundles/custom.zip',
				} )
			);
		} );

		test( 'should use default export_path when not in config', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( { success: true } ),
			};
			mockFetchProviderConfig.mockResolvedValue( {} );
			mockCreateStorageService.mockResolvedValue( mockStorageService );

			const mockSetStatusMessage = jest.fn();

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test',
				},
				blueprintBundle: {
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				},
				siteUrl: 'http://example.com',
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockCreateStorageService ).toHaveBeenCalledWith(
				'blueprint-bundle/bundle.zip',
				expect.any( Object ),
				'test-provider:123',
				expect.any( Object )
			);
		} );

		test( 'should upload with correct options', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( { success: true } ),
			};
			mockFetchProviderConfig.mockResolvedValue( {
				export_path: 'bundle.zip',
			} );
			mockCreateStorageService.mockResolvedValue( mockStorageService );

			const mockSetStatusMessage = jest.fn();

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test',
				},
				blueprintBundle: {
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				},
				siteUrl: 'http://example.com',
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockStorageService.upload ).toHaveBeenCalledWith(
				'bundle.zip',
				expect.any( Blob ),
				expect.objectContaining( {
					contentType: 'application/zip',
					sourcePath: '/tmp/bundle.zip',
					sourceUrl: 'http://example.com/bundle.zip',
					filePath: '/tmp/bundle.zip',
				} )
			);
		} );

		test( 'should return upload results', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( { success: true } ),
			};
			mockFetchProviderConfig.mockResolvedValue( {
				export_path: 'bundle.zip',
			} );
			mockCreateStorageService.mockResolvedValue( mockStorageService );

			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'My Provider',
				},
				blueprintBundle: {
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 2048,
				},
				siteUrl: 'http://example.com',
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.bundleUploadResults ).toEqual( {
				providerId: 'test-provider:123',
				providerLabel: 'My Provider',
				success: true,
				exportPath: 'bundle.zip',
				bundleSize: 2048,
			} );
		} );

		test( 'should set progress and success messages', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( { success: true } ),
			};
			mockFetchProviderConfig.mockResolvedValue( {} );
			mockCreateStorageService.mockResolvedValue( mockStorageService );

			const mockSetStatusMessage = jest.fn();

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Cloud Storage',
				},
				blueprintBundle: {
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				},
				siteUrl: 'http://example.com',
				setStatusMessage: mockSetStatusMessage,
			} );

			// Check progress message
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Uploading blueprint bundle' ),
				'progress',
				'uploadBlueprintBundle'
			);

			// Check success message
			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( 'Uploaded blueprint bundle' );
			expect( successCall[ 0 ] ).toContain( 'Cloud Storage' );
		} );

		test( 'should use provider id as label fallback', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( { success: true } ),
			};
			mockFetchProviderConfig.mockResolvedValue( {} );
			mockCreateStorageService.mockResolvedValue( mockStorageService );

			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				currentProviderInstance: { id: 'test-provider:123' }, // No label
				blueprintBundle: {
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					bundleSize: 1024,
				},
				siteUrl: 'http://example.com',
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.bundleUploadResults.providerLabel ).toBe(
				'test-provider:123'
			);
		} );
	} );

	// ============================================================
	// Handler - Error Cases
	// ============================================================
	describe( 'handler - error cases', () => {
		test( 'should throw error when currentProviderInstance is missing', async () => {
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: null,
					blueprintBundle: {},
					siteUrl: 'http://example.com',
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Provider instance not found' );
		} );

		test( 'should throw error when storage service not available', async () => {
			mockFetchProviderConfig.mockResolvedValue( {} );
			mockCreateStorageService.mockResolvedValue( null );

			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: {
						id: 'test-provider:123',
						label: 'Bad Provider',
					},
					blueprintBundle: {
						bundlePath: '/tmp/bundle.zip',
						bundleUrl: 'http://example.com/bundle.zip',
						bundleSize: 1024,
					},
					siteUrl: 'http://example.com',
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Storage service not available' );
		} );

		test( 'should throw error when upload fails', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( {
					success: false,
					error: 'Permission denied',
				} ),
			};
			mockFetchProviderConfig.mockResolvedValue( {} );
			mockCreateStorageService.mockResolvedValue( mockStorageService );

			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: {
						id: 'test-provider:123',
						label: 'Test',
					},
					blueprintBundle: {
						bundlePath: '/tmp/bundle.zip',
						bundleUrl: 'http://example.com/bundle.zip',
						bundleSize: 1024,
					},
					siteUrl: 'http://example.com',
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Permission denied' );
		} );

		test( 'should throw default error when upload fails with no message', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( { success: false } ),
			};
			mockFetchProviderConfig.mockResolvedValue( {} );
			mockCreateStorageService.mockResolvedValue( mockStorageService );

			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: {
						id: 'test-provider:123',
						label: 'Test',
					},
					blueprintBundle: {
						bundlePath: '/tmp/bundle.zip',
						bundleUrl: 'http://example.com/bundle.zip',
						bundleSize: 1024,
					},
					siteUrl: 'http://example.com',
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Failed to upload blueprint bundle' );
		} );

		test( 'should handle missing bundle size gracefully', async () => {
			const mockStorageService = {
				upload: jest.fn().mockResolvedValue( { success: true } ),
			};
			mockFetchProviderConfig.mockResolvedValue( {} );
			mockCreateStorageService.mockResolvedValue( mockStorageService );

			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test',
				},
				blueprintBundle: {
					bundlePath: '/tmp/bundle.zip',
					bundleUrl: 'http://example.com/bundle.zip',
					// bundleSize is undefined
				},
				siteUrl: 'http://example.com',
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.bundleUploadResults.bundleSize ).toBe( 0 );
		} );
	} );
} );
