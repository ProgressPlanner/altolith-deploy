/**
 * Upload Static Files Step Tests
 *
 * Tests for generating and uploading static HTML/CSS/JS to storage providers.
 * This is a per-thread step that processes one provider instance at a time.
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
			result = result.replace( /%\d?\$?[sd]/, arg );
		} );
		return result;
	},
} ) );

// Mock staticSiteConfig utilities
const mockFetchProviderConfig = jest.fn();
jest.mock( '@aether/export/utils/staticSiteConfig', () => ( {
	fetchProviderConfig: ( ...args ) => mockFetchProviderConfig( ...args ),
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

describe( 'uploadStaticFiles step', () => {
	beforeAll( () => {
		// Import the module to trigger addAction
		require( '../uploadStaticFiles' );

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
		mockApplyFilters.mockImplementation( ( hookName, value ) => value );
	} );

	// ============================================================
	// Step Registration
	// ============================================================
	describe( 'step registration', () => {
		test( 'should register with correct id', () => {
			expect( stepDefinition.id ).toBe( 'uploadStaticFiles' );
		} );

		test( 'should have descriptive label', () => {
			expect( stepDefinition.label ).toBe( 'Upload Static Files' );
		} );

		test( 'should depend on preScanStaticSite', () => {
			expect( stepDefinition.dependencies ).toContain(
				'preScanStaticSite'
			);
		} );

		test( 'should require currentProviderInstance from thread', () => {
			expect( stepDefinition.requires.currentProviderInstance ).toEqual( {
				from: 'thread',
				required: true,
			} );
		} );

		test( 'should require urls from preScanStaticSite', () => {
			expect( stepDefinition.requires.urls ).toEqual( {
				from: 'preScanStaticSite',
				required: true,
			} );
		} );

		test( 'should require staticSiteUrl from getStaticSiteUrls', () => {
			expect( stepDefinition.requires.staticSiteUrl ).toEqual( {
				from: 'getStaticSiteUrls',
				required: true,
			} );
		} );

		test( 'should require siteUrl from initial context', () => {
			expect( stepDefinition.requires.siteUrl ).toEqual( {
				from: 'initial',
				required: true,
			} );
		} );

		test( 'should require processStaticSiteUrls from initial context', () => {
			expect( stepDefinition.requires.processStaticSiteUrls ).toEqual( {
				from: 'initial',
				required: true,
			} );
		} );

		test( 'should provide staticUploadResults with thread scope', () => {
			expect( stepDefinition.provides.staticUploadResults ).toEqual( {
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

		test( 'should skip for blueprint-bundle deployment type', () => {
			mockProviderRegistry.get.mockReturnValue( {
				DEPLOYMENT_TYPE: 'blueprint-bundle',
			} );

			const context = {
				currentProviderInstance: {
					id: 'blueprint-provider:abc123',
				},
			};
			expect( shouldSkip( context ) ).toBe( true );
		} );

		test( 'should not skip for static-site deployment type', () => {
			mockProviderRegistry.get.mockReturnValue( {
				DEPLOYMENT_TYPE: 'static-site',
			} );

			const context = {
				currentProviderInstance: {
					id: 'local-filesystem:abc123',
				},
			};
			expect( shouldSkip( context ) ).toBe( false );
		} );

		test( 'should use instance deploymentType if present', () => {
			// Provider class says blueprint-bundle, but instance overrides to static-site
			mockProviderRegistry.get.mockReturnValue( {
				DEPLOYMENT_TYPE: 'blueprint-bundle',
			} );

			const context = {
				currentProviderInstance: {
					id: 'mixed-provider:abc123',
					deploymentType: 'static-site',
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
			// Without a deployment type, it's not static-site, so skip
			expect( shouldSkip( context ) ).toBe( true );
		} );
	} );

	// ============================================================
	// Handler - Input Validation
	// ============================================================
	describe( 'handler - input validation', () => {
		test( 'should throw error when currentProviderInstance is missing', async () => {
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: null,
					urls: [],
					staticSiteUrl: 'http://static.example.com',
					siteUrl: 'http://example.com',
					processStaticSiteUrls: jest.fn(),
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Provider instance not found' );
		} );

		test( 'should throw error when urls is missing', async () => {
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: { id: 'test:123' },
					urls: null,
					staticSiteUrl: 'http://static.example.com',
					siteUrl: 'http://example.com',
					processStaticSiteUrls: jest.fn(),
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'URLs not found' );
		} );

		test( 'should throw error when urls is not an array', async () => {
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: { id: 'test:123' },
					urls: 'not-an-array',
					staticSiteUrl: 'http://static.example.com',
					siteUrl: 'http://example.com',
					processStaticSiteUrls: jest.fn(),
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'URLs not found' );
		} );

		test( 'should throw error when processStaticSiteUrls is missing', async () => {
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: { id: 'test:123' },
					urls: [ 'http://example.com/' ],
					staticSiteUrl: 'http://static.example.com',
					siteUrl: 'http://example.com',
					processStaticSiteUrls: null,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Static site generator not available' );
		} );
	} );

	// ============================================================
	// Handler - Success Cases
	// ============================================================
	describe( 'handler - success', () => {
		test( 'should call processStaticSiteUrls with correct arguments', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 5,
			} );
			const mockSetStatusMessage = jest.fn();
			const mockUrls = [
				'http://example.com/',
				'http://example.com/about/',
			];
			const mockHtmlDataMap = new Map();

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test',
				},
				urls: mockUrls,
				htmlDataMap: mockHtmlDataMap,
				staticSiteUrl: 'http://static.example.com',
				siteUrl: 'http://example.com',
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				mockUrls,
				'http://static.example.com',
				'test-provider:123',
				'http://example.com',
				mockSetStatusMessage,
				mockHtmlDataMap
			);
		} );

		test( 'should use provider-specific staticSiteUrl from config', async () => {
			mockFetchProviderConfig.mockResolvedValue( {
				public_url: 'http://custom-static.example.com',
			} );

			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 5,
			} );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test',
				},
				urls: [ 'http://example.com/' ],
				staticSiteUrl: 'http://static.example.com', // Global URL
				siteUrl: 'http://example.com',
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				setStatusMessage: mockSetStatusMessage,
			} );

			// Verify second argument is the provider-specific URL
			expect( mockProcessStaticSiteUrls.mock.calls[ 0 ][ 1 ] ).toBe(
				'http://custom-static.example.com'
			);
		} );

		test( 'should apply URL filter before processing', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 3,
			} );
			const mockSetStatusMessage = jest.fn();
			const originalUrls = [
				'http://example.com/',
				'http://example.com/private/',
				'http://example.com/about/',
			];

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test',
				},
				urls: originalUrls,
				staticSiteUrl: 'http://static.example.com',
				siteUrl: 'http://example.com',
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApplyFilters ).toHaveBeenCalledWith(
				'aether.export.step.uploadStaticSiteFiles.urls',
				originalUrls,
				[ 'test-provider:123' ],
				expect.objectContaining( {
					siteUrl: 'http://example.com',
					providerId: 'test-provider:123',
				} )
			);
		} );

		test( 'should return upload results on success', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 10,
				filesSkipped: 2,
				urlsProcessed: 5,
				urlsSucceeded: 5,
				urlsFailed: 0,
				assetsUploaded: 15,
				assetsFailed: 0,
				failedUrls: [],
				uploadedFiles: [ 'index.html', 'about.html' ],
			} );
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'My Provider',
				},
				urls: [ 'http://example.com/' ],
				staticSiteUrl: 'http://static.example.com',
				siteUrl: 'http://example.com',
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.staticUploadResults ).toEqual( {
				providerId: 'test-provider:123',
				providerLabel: 'My Provider',
				success: true,
				filesUploaded: 10,
				filesSkipped: 2,
				urlsProcessed: 5,
				urlsSucceeded: 5,
				urlsFailed: 0,
				assetsUploaded: 15,
				assetsFailed: 0,
				failedUrls: [],
				uploadedFiles: [ 'index.html', 'about.html' ],
			} );
		} );

		test( 'should set progress and success status messages', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 10,
			} );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Cloud Storage',
				},
				urls: [ 'http://example.com/' ],
				staticSiteUrl: 'http://static.example.com',
				siteUrl: 'http://example.com',
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				setStatusMessage: mockSetStatusMessage,
			} );

			// Check progress message
			expect( mockSetStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Processing static site' ),
				'progress',
				'uploadStaticFiles'
			);

			// Check success message
			const successCall = mockSetStatusMessage.mock.calls.find(
				( call ) => call[ 1 ] === 'success'
			);
			expect( successCall[ 0 ] ).toContain( 'Uploaded' );
			expect( successCall[ 0 ] ).toContain( '10' );
			expect( successCall[ 0 ] ).toContain( 'Cloud Storage' );
		} );

		test( 'should call updateStaticSiteProgressContext if provided', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 5,
			} );
			const mockSetStatusMessage = jest.fn();
			const mockUpdateProgress = jest.fn();

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test',
				},
				urls: [ 'http://example.com/' ],
				staticSiteUrl: 'http://static.example.com',
				siteUrl: 'http://example.com',
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				setStatusMessage: mockSetStatusMessage,
				updateStaticSiteProgressContext: mockUpdateProgress,
			} );

			expect( mockUpdateProgress ).toHaveBeenCalledWith(
				0,
				1,
				'test-provider:123'
			);
		} );

		test( 'should apply result filter', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 5,
			} );
			const mockSetStatusMessage = jest.fn();

			await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test',
				},
				urls: [ 'http://example.com/' ],
				staticSiteUrl: 'http://static.example.com',
				siteUrl: 'http://example.com',
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( mockApplyFilters ).toHaveBeenCalledWith(
				'aether.export.step.uploadStaticSiteFiles.result',
				expect.objectContaining( {
					staticUploadResults: expect.any( Object ),
				} ),
				'test-provider:123',
				expect.objectContaining( {
					siteUrl: 'http://example.com',
				} )
			);
		} );
	} );

	// ============================================================
	// Handler - Error Cases
	// ============================================================
	describe( 'handler - error cases', () => {
		test( 'should throw error when upload fails', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: false,
				error: 'Upload failed',
			} );
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: {
						id: 'test-provider:123',
						label: 'Test',
					},
					urls: [ 'http://example.com/' ],
					staticSiteUrl: 'http://static.example.com',
					siteUrl: 'http://example.com',
					processStaticSiteUrls: mockProcessStaticSiteUrls,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Upload failed' );
		} );

		test( 'should throw error when no files uploaded', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 0, // No files uploaded
			} );
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: {
						id: 'test-provider:123',
						label: 'Test',
					},
					urls: [ 'http://example.com/' ],
					staticSiteUrl: 'http://static.example.com',
					siteUrl: 'http://example.com',
					processStaticSiteUrls: mockProcessStaticSiteUrls,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'No files uploaded' );
		} );

		test( 'should include provider label in error message', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: false,
				error: 'Permission denied',
			} );
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: {
						id: 'test-provider:123',
						label: 'S3 Bucket',
					},
					urls: [ 'http://example.com/' ],
					staticSiteUrl: 'http://static.example.com',
					siteUrl: 'http://example.com',
					processStaticSiteUrls: mockProcessStaticSiteUrls,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( /S3 Bucket/ );
		} );

		test( 'should handle processStaticSiteUrls rejection', async () => {
			const mockProcessStaticSiteUrls = jest
				.fn()
				.mockRejectedValue( new Error( 'Network error' ) );
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: {
						id: 'test-provider:123',
						label: 'Test',
					},
					urls: [ 'http://example.com/' ],
					staticSiteUrl: 'http://static.example.com',
					siteUrl: 'http://example.com',
					processStaticSiteUrls: mockProcessStaticSiteUrls,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'Network error' );
		} );

		test( 'should gracefully handle fetchProviderConfig failure', async () => {
			mockFetchProviderConfig.mockRejectedValue(
				new Error( 'Config error' )
			);

			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 5,
			} );
			const mockSetStatusMessage = jest.fn();

			// Should not throw - falls back to global staticSiteUrl
			await expect(
				handler( {
					currentProviderInstance: {
						id: 'test-provider:123',
						label: 'Test',
					},
					urls: [ 'http://example.com/' ],
					staticSiteUrl: 'http://static.example.com',
					siteUrl: 'http://example.com',
					processStaticSiteUrls: mockProcessStaticSiteUrls,
					setStatusMessage: mockSetStatusMessage,
				} )
			).resolves.toBeDefined();

			// Should use global staticSiteUrl as fallback
			expect( mockProcessStaticSiteUrls.mock.calls[ 0 ][ 1 ] ).toBe(
				'http://static.example.com'
			);
		} );
	} );

	// ============================================================
	// Handler - Edge Cases
	// ============================================================
	describe( 'handler - edge cases', () => {
		test( 'should handle empty urls array', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 0,
			} );
			const mockSetStatusMessage = jest.fn();

			await expect(
				handler( {
					currentProviderInstance: {
						id: 'test-provider:123',
						label: 'Test',
					},
					urls: [],
					staticSiteUrl: 'http://static.example.com',
					siteUrl: 'http://example.com',
					processStaticSiteUrls: mockProcessStaticSiteUrls,
					setStatusMessage: mockSetStatusMessage,
				} )
			).rejects.toThrow( 'No files uploaded' );
		} );

		test( 'should use provider id as label fallback', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 5,
			} );
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				currentProviderInstance: { id: 'test-provider:123' }, // No label
				urls: [ 'http://example.com/' ],
				staticSiteUrl: 'http://static.example.com',
				siteUrl: 'http://example.com',
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				setStatusMessage: mockSetStatusMessage,
			} );

			expect( result.staticUploadResults.providerLabel ).toBe(
				'test-provider:123'
			);
		} );

		test( 'should handle missing optional fields in result', async () => {
			const mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
				success: true,
				filesUploaded: 5,
				// Other fields missing
			} );
			const mockSetStatusMessage = jest.fn();

			const result = await handler( {
				currentProviderInstance: {
					id: 'test-provider:123',
					label: 'Test',
				},
				urls: [ 'http://example.com/' ],
				staticSiteUrl: 'http://static.example.com',
				siteUrl: 'http://example.com',
				processStaticSiteUrls: mockProcessStaticSiteUrls,
				setStatusMessage: mockSetStatusMessage,
			} );

			// Should default missing fields to 0 or empty array
			expect( result.staticUploadResults.filesSkipped ).toBe( 0 );
			expect( result.staticUploadResults.urlsProcessed ).toBe( 0 );
			expect( result.staticUploadResults.failedUrls ).toEqual( [] );
			expect( result.staticUploadResults.uploadedFiles ).toEqual( [] );
		} );
	} );
} );
