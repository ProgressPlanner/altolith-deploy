/**
 * Upload Static Site Files Step Tests
 *
 * Tests for uploadStaticSiteFilesHandler step.
 * Validates static site generation and multi-provider upload workflow.
 *
 * @package
 */

import { uploadStaticSiteFilesHandler } from '../uploadStaticSiteFilesStep';
import apiFetch from '../../../utils/api';
import { calculateOverallProgress } from '../../utils/progressManager';
import { applyFilters } from '@wordpress/hooks';

// Mock dependencies
jest.mock( '../../../utils/api' );
jest.mock( '../../utils/progressManager' );
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
} ) );

describe( 'uploadStaticSiteFilesHandler', () => {
	let mockContext;
	let mockProcessStaticSiteUrls;

	beforeEach( () => {
		jest.clearAllMocks();

		// Mock calculateOverallProgress
		calculateOverallProgress.mockImplementation(
			( { progress } ) => progress
		);

		// Mock apiFetch to return provider config
		apiFetch.mockResolvedValue( {
			success: true,
			config: {
				public_url: 'https://example.com',
			},
		} );

		// Mock processStaticSiteUrls function
		mockProcessStaticSiteUrls = jest.fn().mockResolvedValue( {
			success: true,
			filesUploaded: 100,
			uploadedFiles: [
				{ storageKey: 'index.html', contentType: 'text/html' },
			],
		} );

		// Default context
		mockContext = {
			processStaticSiteUrls: mockProcessStaticSiteUrls,
			urls: [
				{ url: 'https://example.com/', type: 'front-page' },
				{ url: 'https://example.com/about/', type: 'page' },
			],
			staticSiteUrl: 'https://static.example.com',
			blueprintData: { content: '{}' },
			siteUrl: 'https://example.com',
			staticSiteProviders: [ 'provider-1' ],
			setStatusMessage: jest.fn(),
			setStepProgress: jest.fn(),
			setOverallProgressValue: jest.fn(),
			updateStaticSiteProgressContext: jest.fn(),
			removeMessage: jest.fn(),
		};

		// Suppress console.error in tests
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		console.error.mockRestore();
	} );

	describe( 'Single provider upload', () => {
		test( 'should upload static site to single provider', async () => {
			const result = await uploadStaticSiteFilesHandler( mockContext );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				mockContext.urls,
				'https://example.com', // Provider deployment URL from config
				'provider-1',
				'https://example.com',
				mockContext.setStatusMessage,
				{ content: '{}' },
				mockContext.removeMessage
			);

			expect( result ).toMatchObject( {
				providers: [ 'provider-1' ],
				successCount: 1,
				failureCount: 0,
				filesUploaded: 100,
			} );
		} );

		test( 'should fetch provider deployment URL', async () => {
			await uploadStaticSiteFilesHandler( mockContext );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/providers/provider-1',
			} );
		} );

		test( 'should use pages_url from provider config if available', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				config: {
					pages_url: 'https://pages.example.com',
					public_url: 'https://public.example.com',
				},
			} );

			await uploadStaticSiteFilesHandler( mockContext );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				expect.anything(),
				'https://pages.example.com', // pages_url has priority
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything()
			);
		} );

		test( 'should use worker_endpoint from provider config as fallback', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				config: {
					worker_endpoint: 'https://worker.example.com',
					public_url: 'https://public.example.com',
				},
			} );

			await uploadStaticSiteFilesHandler( mockContext );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				expect.anything(),
				'https://worker.example.com', // worker_endpoint is second priority
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything()
			);
		} );

		test( 'should fallback to staticSiteUrl if provider config fetch fails', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			await uploadStaticSiteFilesHandler( mockContext );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				expect.anything(),
				'https://static.example.com', // Falls back to context staticSiteUrl
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything()
			);
		} );

		test( 'should set success status message', async () => {
			await uploadStaticSiteFilesHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'Uploaded static site to 1/1 provider(s) (100 files)',
				'success',
				'uploadStaticSiteFiles'
			);
		} );
	} );

	describe( 'Multiple provider uploads', () => {
		beforeEach( () => {
			mockContext.staticSiteProviders = [
				'provider-1',
				'provider-2',
				'provider-3',
			];

			// Mock different configs for different providers
			apiFetch.mockImplementation( async ( { path } ) => {
				if ( path.includes( 'provider-1' ) ) {
					return {
						success: true,
						config: { public_url: 'https://provider1.com' },
					};
				}
				if ( path.includes( 'provider-2' ) ) {
					return {
						success: true,
						config: { public_url: 'https://provider2.com' },
					};
				}
				if ( path.includes( 'provider-3' ) ) {
					return {
						success: true,
						config: { public_url: 'https://provider3.com' },
					};
				}
				return { success: false };
			} );

			// Mock different upload results
			mockProcessStaticSiteUrls.mockImplementation(
				async ( urls, deploymentUrl, providerId ) => {
					const fileCount =
						providerId === 'provider-1'
							? 100
							: providerId === 'provider-2'
							? 50
							: 75;
					return {
						success: true,
						filesUploaded: fileCount,
						uploadedFiles: [
							{
								storageKey: 'index.html',
								contentType: 'text/html',
							},
						],
					};
				}
			);
		} );

		test( 'should upload to all providers sequentially', async () => {
			const result = await uploadStaticSiteFilesHandler( mockContext );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledTimes( 3 );
			expect( result.providers ).toEqual( [
				'provider-1',
				'provider-2',
				'provider-3',
			] );
			expect( result.successCount ).toBe( 3 );
			expect( result.failureCount ).toBe( 0 );
		} );

		test( 'should update progress context for each provider', async () => {
			await uploadStaticSiteFilesHandler( mockContext );

			// Before processing provider-1
			expect(
				mockContext.updateStaticSiteProgressContext
			).toHaveBeenCalledWith( 0, 3 );
			// Before processing provider-2
			expect(
				mockContext.updateStaticSiteProgressContext
			).toHaveBeenCalledWith( 1, 3 );
			// Before processing provider-3
			expect(
				mockContext.updateStaticSiteProgressContext
			).toHaveBeenCalledWith( 2, 3 );
		} );

		test( 'should update step progress after each provider completes', async () => {
			await uploadStaticSiteFilesHandler( mockContext );

			// After provider-1 (1/3 = 33%)
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadStaticSiteFiles',
				33
			);
			// After provider-2 (2/3 = 67%)
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadStaticSiteFiles',
				67
			);
			// After provider-3 (3/3 = 100%)
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadStaticSiteFiles',
				100
			);
		} );

		test( 'should pass correct deployment URL to each provider', async () => {
			await uploadStaticSiteFilesHandler( mockContext );

			const calls = mockProcessStaticSiteUrls.mock.calls;
			expect( calls[ 0 ][ 1 ] ).toBe( 'https://provider1.com' );
			expect( calls[ 1 ][ 1 ] ).toBe( 'https://provider2.com' );
			expect( calls[ 2 ][ 1 ] ).toBe( 'https://provider3.com' );
		} );

		test( 'should handle partial failures gracefully', async () => {
			// Make provider-2 fail
			mockProcessStaticSiteUrls.mockImplementation(
				async ( urls, deploymentUrl, providerId ) => {
					if ( providerId === 'provider-2' ) {
						throw new Error( 'Upload failed for provider-2' );
					}
					return {
						success: true,
						filesUploaded: 100,
						uploadedFiles: [],
					};
				}
			);

			const result = await uploadStaticSiteFilesHandler( mockContext );

			expect( result.successCount ).toBe( 2 );
			expect( result.failureCount ).toBe( 1 );
			// Check that the failed upload is in results
			// The results array maps r.value for both fulfilled and rejected statuses
			// but rejected stores value, not reason, so it will be undefined after the map
			// We check that there's a failed upload recorded
			const hasFailure = result.results.some(
				( r ) => r === undefined || ( r && ! r.success )
			);
			expect( hasFailure ).toBe( true );
		} );

		test( 'should set warning status when some providers fail', async () => {
			// Make one provider fail
			mockProcessStaticSiteUrls.mockImplementation(
				async ( urls, deploymentUrl, providerId ) => {
					if ( providerId === 'provider-3' ) {
						throw new Error( 'Upload failed' );
					}
					return {
						success: true,
						filesUploaded: 100,
						uploadedFiles: [],
					};
				}
			);

			await uploadStaticSiteFilesHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Uploaded static site to 2/3 provider(s)' ),
				'warning',
				'uploadStaticSiteFiles'
			);
		} );

		test( 'should throw error if all providers fail', async () => {
			mockProcessStaticSiteUrls.mockRejectedValue(
				new Error( 'All providers failed' )
			);

			await expect(
				uploadStaticSiteFilesHandler( mockContext )
			).rejects.toThrow( 'Failed to upload static site to any provider' );
		} );
	} );

	describe( 'Backwards compatibility', () => {
		test( 'should support providerId for single provider (legacy)', async () => {
			const legacyContext = {
				...mockContext,
				staticSiteProviders: [],
				providerId: 'legacy-provider',
			};

			await uploadStaticSiteFilesHandler( legacyContext );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				'legacy-provider',
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything()
			);
		} );

		test( 'should support currentStatus.urls (legacy test format)', async () => {
			const legacyContext = {
				...mockContext,
				urls: undefined,
				currentStatus: {
					urls: [
						{ url: 'https://example.com/', type: 'front-page' },
					],
				},
			};

			await uploadStaticSiteFilesHandler( legacyContext );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				legacyContext.currentStatus.urls,
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything()
			);
		} );

		test( 'should support currentStatus.blueprintData (legacy test format)', async () => {
			const legacyContext = {
				...mockContext,
				blueprintData: undefined,
				currentStatus: {
					urls: mockContext.urls,
					blueprintData: { content: '{"legacy":true}' },
				},
			};

			await uploadStaticSiteFilesHandler( legacyContext );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				{ content: '{"legacy":true}' },
				expect.anything()
			);
		} );
	} );

	describe( 'WordPress filters', () => {
		test( 'should apply aether.upload.urls filter', async () => {
			const filteredUrls = [
				...mockContext.urls,
				{ url: 'https://example.com/custom/', type: 'custom' },
			];

			applyFilters.mockImplementation( ( hook, value ) => {
				if ( hook === 'aether.upload.urls' ) {
					return filteredUrls;
				}
				return value;
			} );

			await uploadStaticSiteFilesHandler( mockContext );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				filteredUrls,
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything()
			);
		} );

		test( 'should apply aether.provider.deployment_url filter', async () => {
			applyFilters.mockImplementation( ( hook, value ) => {
				if ( hook === 'aether.provider.deployment_url' ) {
					return 'https://custom.deployment.url';
				}
				return value;
			} );

			await uploadStaticSiteFilesHandler( mockContext );

			expect( mockProcessStaticSiteUrls ).toHaveBeenCalledWith(
				expect.anything(),
				'https://custom.deployment.url',
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything(),
				expect.anything()
			);
		} );

		test( 'should apply aether.upload.result filter', async () => {
			const customResult = { custom: 'metadata' };

			applyFilters.mockImplementation( ( hook, value ) => {
				if ( hook === 'aether.upload.result' ) {
					return { ...value, ...customResult };
				}
				return value;
			} );

			const result = await uploadStaticSiteFilesHandler( mockContext );

			expect( result ).toMatchObject( customResult );
		} );
	} );

	describe( 'Error handling', () => {
		test( 'should throw error when URLs are missing', async () => {
			const contextWithoutUrls = {
				...mockContext,
				urls: undefined,
				currentStatus: {},
			};

			await expect(
				uploadStaticSiteFilesHandler( contextWithoutUrls )
			).rejects.toThrow( 'URLs not found. Please run getStaticSiteUrls first.' );
		} );

		test( 'should throw error when URLs is not an array', async () => {
			const contextWithInvalidUrls = {
				...mockContext,
				urls: 'not-an-array',
			};

			await expect(
				uploadStaticSiteFilesHandler( contextWithInvalidUrls )
			).rejects.toThrow( 'URLs not found. Please run getStaticSiteUrls first.' );
		} );

		test( 'should return skipped status when no providers configured', async () => {
			const contextWithoutProviders = {
				...mockContext,
				staticSiteProviders: [],
				providerId: undefined,
			};

			const result = await uploadStaticSiteFilesHandler(
				contextWithoutProviders
			);

			expect( result ).toEqual( {
				skipped: true,
				reason: 'no_providers',
			} );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'No providers enabled for static site deployment',
				'warning',
				'uploadStaticSiteFiles'
			);
		} );
	} );

	describe( 'Progress tracking', () => {
		test( 'should not update progress for single provider', async () => {
			// Single provider should not trigger progress updates
			// Progress is handled by the processStaticSiteUrls callback
			await uploadStaticSiteFilesHandler( mockContext );

			// Progress context updated before processing
			expect(
				mockContext.updateStaticSiteProgressContext
			).toHaveBeenCalledWith( 0, 1 );

			// But step progress should NOT be updated after (only for multiple providers)
			const stepProgressCalls = mockContext.setStepProgress.mock.calls;
			const uploadStepCalls = stepProgressCalls.filter(
				( call ) => call[ 0 ] === 'uploadStaticSiteFiles'
			);
			expect( uploadStepCalls ).toHaveLength( 0 );
		} );

		test( 'should update progress for multiple providers', async () => {
			mockContext.staticSiteProviders = [ 'provider-1', 'provider-2' ];

			await uploadStaticSiteFilesHandler( mockContext );

			// Should update step progress after each provider
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadStaticSiteFiles',
				50
			); // After provider-1
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadStaticSiteFiles',
				100
			); // After provider-2
		} );

		test( 'should not update progress if callbacks are missing', async () => {
			const contextWithoutCallbacks = {
				...mockContext,
				staticSiteProviders: [ 'provider-1', 'provider-2' ],
				setStepProgress: undefined,
				setOverallProgressValue: undefined,
				updateStaticSiteProgressContext: undefined,
			};

			// Should not throw error
			await expect(
				uploadStaticSiteFilesHandler( contextWithoutCallbacks )
			).resolves.toBeDefined();
		} );
	} );

	describe( 'Result aggregation', () => {
		test( 'should aggregate file counts from all successful providers', async () => {
			mockContext.staticSiteProviders = [ 'provider-1', 'provider-2' ];

			mockProcessStaticSiteUrls.mockImplementation(
				async ( urls, deploymentUrl, providerId ) => {
					return {
						success: true,
						filesUploaded:
							providerId === 'provider-1' ? 100 : 50,
						uploadedFiles: [],
					};
				}
			);

			await uploadStaticSiteFilesHandler( mockContext );

			// Should show total from all providers (100 + 50)
			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'Uploaded static site to 2/2 provider(s) (150 files)',
				'success',
				'uploadStaticSiteFiles'
			);
		} );

		test( 'should include legacy fields for backwards compatibility', async () => {
			const result = await uploadStaticSiteFilesHandler( mockContext );

			expect( result ).toMatchObject( {
				staticFiles: expect.any( Array ),
				filesUploaded: expect.any( Number ),
			} );
		} );

		test( 'should use first successful provider for legacy fields', async () => {
			const result = await uploadStaticSiteFilesHandler( mockContext );

			expect( result.staticFiles ).toEqual( [
				{ storageKey: 'index.html', contentType: 'text/html' },
			] );
			expect( result.filesUploaded ).toBe( 100 );
		} );
	} );
} );
