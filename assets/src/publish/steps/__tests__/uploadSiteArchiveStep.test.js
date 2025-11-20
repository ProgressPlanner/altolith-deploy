/**
 * Upload Site Archive Step Tests
 *
 * Tests for uploadSiteArchiveHandler step.
 * Validates blueprint bundle upload to multiple providers.
 *
 * @package
 */

import { uploadSiteArchiveHandler } from '../uploadSiteArchiveStep';
import apiFetch from '@wordpress/api-fetch';
import { calculateOverallProgress } from '../../utils/progressManager';
import { applyFilters } from '@wordpress/hooks';

// Mock dependencies
jest.mock( '@wordpress/api-fetch' );
jest.mock( '../../utils/progressManager' );
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
} ) );

describe( 'uploadSiteArchiveHandler', () => {
	let mockContext;
	let mockHandleSiteArchiveUpload;

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
				export_path: 'custom/path/bundle.zip',
			},
		} );

		// Mock handleSiteArchiveUpload function
		mockHandleSiteArchiveUpload = jest.fn().mockResolvedValue( {
			success: true,
		} );

		// Default context
		mockContext = {
			handleSiteArchiveUpload: mockHandleSiteArchiveUpload,
			blueprintBundleProviders: [ 'provider-1' ],
			blueprintBundle: {
				bundlePath: '/tmp/bundle.zip',
			},
			setStatusMessage: jest.fn(),
			setStepProgress: jest.fn(),
			setOverallProgressValue: jest.fn(),
		};

		// Suppress console.error and console.warn in tests
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		jest.spyOn( console, 'warn' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		console.error.mockRestore();
		console.warn.mockRestore();
	} );

	describe( 'Single provider upload', () => {
		test( 'should upload blueprint bundle to single provider', async () => {
			const result = await uploadSiteArchiveHandler( mockContext );

			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'provider-1',
				expect.objectContaining( {
					providerId: 'provider-1',
					exportPath: 'custom/path/bundle.zip',
				} )
			);

			expect( result ).toMatchObject( {
				providers: [ 'provider-1' ],
				successCount: 1,
				failureCount: 0,
			} );
		} );

		test( 'should fetch provider configuration', async () => {
			await uploadSiteArchiveHandler( mockContext );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/providers/provider-1',
			} );
		} );

		test( 'should use export_path from provider config', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				config: {
					export_path: 'my-custom/export/bundle.zip',
				},
			} );

			await uploadSiteArchiveHandler( mockContext );

			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'provider-1',
				expect.objectContaining( {
					exportPath: 'my-custom/export/bundle.zip',
				} )
			);
		} );

		test( 'should use default export path if config fetch fails', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			await uploadSiteArchiveHandler( mockContext );

			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'provider-1',
				expect.objectContaining( {
					exportPath: 'blueprint-bundle/bundle.zip',
				} )
			);
		} );

		test( 'should use default export path if config.export_path is missing', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				config: {
					// No export_path
				},
			} );

			await uploadSiteArchiveHandler( mockContext );

			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'provider-1',
				expect.objectContaining( {
					exportPath: 'blueprint-bundle/bundle.zip',
				} )
			);
		} );

		test( 'should set success status message', async () => {
			await uploadSiteArchiveHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'Uploaded blueprint bundle to 1/1 provider(s)',
				'success',
				'uploadSiteArchive'
			);
		} );

		test( 'should update step progress to 100%', async () => {
			await uploadSiteArchiveHandler( mockContext );

			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadSiteArchive',
				100
			);
		} );
	} );

	describe( 'Multiple provider uploads', () => {
		beforeEach( () => {
			mockContext.blueprintBundleProviders = [
				'provider-1',
				'provider-2',
				'provider-3',
			];

			// Mock different configs for different providers
			apiFetch.mockImplementation( async ( { path } ) => {
				if ( path.includes( 'provider-1' ) ) {
					return {
						success: true,
						config: { export_path: 'path1/bundle.zip' },
					};
				}
				if ( path.includes( 'provider-2' ) ) {
					return {
						success: true,
						config: { export_path: 'path2/bundle.zip' },
					};
				}
				if ( path.includes( 'provider-3' ) ) {
					return {
						success: true,
						config: { export_path: 'path3/bundle.zip' },
					};
				}
				return { success: false };
			} );
		} );

		test( 'should upload to all providers sequentially', async () => {
			const result = await uploadSiteArchiveHandler( mockContext );

			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledTimes( 3 );
			expect( result.providers ).toEqual( [
				'provider-1',
				'provider-2',
				'provider-3',
			] );
			expect( result.successCount ).toBe( 3 );
			expect( result.failureCount ).toBe( 0 );
		} );

		test( 'should pass correct export path to each provider', async () => {
			await uploadSiteArchiveHandler( mockContext );

			const calls = mockHandleSiteArchiveUpload.mock.calls;
			expect( calls[ 0 ][ 1 ].exportPath ).toBe( 'path1/bundle.zip' );
			expect( calls[ 1 ][ 1 ].exportPath ).toBe( 'path2/bundle.zip' );
			expect( calls[ 2 ][ 1 ].exportPath ).toBe( 'path3/bundle.zip' );
		} );

		test( 'should update step progress incrementally', async () => {
			await uploadSiteArchiveHandler( mockContext );

			// After provider-1 (1/3 = 33%)
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadSiteArchive',
				33
			);
			// After provider-2 (2/3 = 67%)
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadSiteArchive',
				67
			);
			// After provider-3 (3/3 = 100%)
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadSiteArchive',
				100
			);
		} );

		test( 'should update overall progress after each provider', async () => {
			await uploadSiteArchiveHandler( mockContext );

			expect( mockContext.setOverallProgressValue ).toHaveBeenCalledTimes(
				3
			);
		} );

		test( 'should handle partial failures gracefully', async () => {
			// Make provider-2 fail
			mockHandleSiteArchiveUpload.mockImplementation(
				async ( providerId ) => {
					if ( providerId === 'provider-2' ) {
						throw new Error( 'Upload failed for provider-2' );
					}
					return { success: true };
				}
			);

			const result = await uploadSiteArchiveHandler( mockContext );

			expect( result.successCount ).toBe( 2 );
			expect( result.failureCount ).toBe( 1 );
		} );

		test( 'should set warning status when some providers fail', async () => {
			// Make one provider fail
			mockHandleSiteArchiveUpload.mockImplementation(
				async ( providerId ) => {
					if ( providerId === 'provider-3' ) {
						throw new Error( 'Upload failed' );
					}
					return { success: true };
				}
			);

			await uploadSiteArchiveHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'Uploaded blueprint bundle to 2/3 provider(s)',
				'warning',
				'uploadSiteArchive'
			);
		} );

		test( 'should throw error if all providers fail', async () => {
			mockHandleSiteArchiveUpload.mockRejectedValue(
				new Error( 'All providers failed' )
			);

			await expect(
				uploadSiteArchiveHandler( mockContext )
			).rejects.toThrow(
				'Failed to upload blueprint bundle to any provider'
			);
		} );

		test( 'should log errors for failed providers', async () => {
			mockHandleSiteArchiveUpload.mockImplementation(
				async ( providerId ) => {
					if ( providerId === 'provider-2' ) {
						throw new Error( 'Upload failed for provider-2' );
					}
					return { success: true };
				}
			);

			await uploadSiteArchiveHandler( mockContext );

			expect( console.error ).toHaveBeenCalledWith(
				expect.stringContaining( 'Failed to upload blueprint bundle' ),
				expect.any( Error )
			);
		} );
	} );

	describe( 'Backwards compatibility', () => {
		test( 'should support providerId for single provider (legacy)', async () => {
			const legacyContext = {
				...mockContext,
				blueprintBundleProviders: [],
				providerId: 'legacy-provider',
			};

			await uploadSiteArchiveHandler( legacyContext );

			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'legacy-provider',
				expect.objectContaining( {
					providerId: 'legacy-provider',
				} )
			);
		} );

		test( 'should handle provider type ID as fallback', async () => {
			const legacyContext = {
				...mockContext,
				blueprintBundleProviders: [],
				providerId: 'local-filesystem', // Provider type ID without instance
			};

			await uploadSiteArchiveHandler( legacyContext );

			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'local-filesystem',
				expect.any( Object )
			);
		} );
	} );

	describe( 'WordPress filters', () => {
		test( 'should apply aether.deployment.config filter', async () => {
			const customConfig = { customOption: 'value' };

			applyFilters.mockImplementation( ( hook, value ) => {
				if ( hook === 'aether.deployment.config' ) {
					return { ...value, ...customConfig };
				}
				return value;
			} );

			await uploadSiteArchiveHandler( mockContext );

			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'provider-1',
				expect.objectContaining( customConfig )
			);
		} );

		test( 'should pass providerId to filter', async () => {
			await uploadSiteArchiveHandler( mockContext );

			expect( applyFilters ).toHaveBeenCalledWith(
				'aether.deployment.config',
				expect.any( Object ),
				'provider-1'
			);
		} );
	} );

	describe( 'Error handling', () => {
		test( 'should return skipped status when no providers configured', async () => {
			const contextWithoutProviders = {
				...mockContext,
				blueprintBundleProviders: [],
				providerId: undefined,
			};

			const result = await uploadSiteArchiveHandler(
				contextWithoutProviders
			);

			expect( result ).toEqual( {
				skipped: true,
				reason: 'no_providers',
			} );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'No providers enabled for blueprint bundle',
				'warning',
				'uploadSiteArchive'
			);
		} );

		test( 'should handle provider config fetch failure gracefully', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			const result = await uploadSiteArchiveHandler( mockContext );

			// Should still succeed with default export path
			expect( result.successCount ).toBe( 1 );
			expect( console.warn ).toHaveBeenCalledWith(
				expect.stringContaining( 'Error fetching config' ),
				expect.any( Error )
			);
		} );

		test( 'should handle provider config with success=false', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
				message: 'Provider not found',
			} );

			const result = await uploadSiteArchiveHandler( mockContext );

			// Should still succeed with default export path
			expect( result.successCount ).toBe( 1 );
			expect( console.warn ).toHaveBeenCalledWith(
				expect.stringContaining( 'Failed to fetch config' ),
				expect.any( Object )
			);
		} );

		test( 'should handle upload errors with different error formats', async () => {
			const testCases = [
				new Error( 'Standard error' ),
				{ toString: () => 'Object error' },
				null,
			];

			for ( const errorCase of testCases ) {
				jest.clearAllMocks();
				mockHandleSiteArchiveUpload.mockRejectedValue( errorCase );

				await expect(
					uploadSiteArchiveHandler( mockContext )
				).rejects.toThrow(
					'Failed to upload blueprint bundle to any provider'
				);
			}
		} );
	} );

	describe( 'Progress tracking', () => {
		test( 'should not update progress if callbacks are missing', async () => {
			const contextWithoutCallbacks = {
				...mockContext,
				setStepProgress: undefined,
				setOverallProgressValue: undefined,
			};

			// Should not throw error
			await expect(
				uploadSiteArchiveHandler( contextWithoutCallbacks )
			).resolves.toBeDefined();
		} );

		test( 'should update progress only after successful uploads', async () => {
			mockContext.blueprintBundleProviders = [
				'provider-1',
				'provider-2',
				'provider-3',
			];

			// Make provider-2 fail
			mockHandleSiteArchiveUpload.mockImplementation(
				async ( providerId ) => {
					if ( providerId === 'provider-2' ) {
						throw new Error( 'Failed' );
					}
					return { success: true };
				}
			);

			await uploadSiteArchiveHandler( mockContext );

			// Should update progress for provider-1 (1/3 = 33%)
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadSiteArchive',
				33
			);
			// Should update progress for provider-3 (2/3 = 67%)
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'uploadSiteArchive',
				67
			);
			// Should NOT update to 100% because one failed
			const calls = mockContext.setStepProgress.mock.calls;
			const hasHundred = calls.some( ( call ) => call[ 1 ] === 100 );
			expect( hasHundred ).toBe( false );
		} );
	} );

	describe( 'Result structure', () => {
		test( 'should return results with correct structure', async () => {
			mockContext.blueprintBundleProviders = [
				'provider-1',
				'provider-2',
			];

			const result = await uploadSiteArchiveHandler( mockContext );

			expect( result ).toMatchObject( {
				providers: [ 'provider-1', 'provider-2' ],
				results: expect.any( Array ),
				successCount: 2,
				failureCount: 0,
			} );

			expect( result.results ).toHaveLength( 2 );
			expect( result.results[ 0 ] ).toMatchObject( {
				providerId: 'provider-1',
				success: true,
				exportPath: expect.any( String ),
			} );
		} );

		test( 'should include error details for failed uploads', async () => {
			mockContext.blueprintBundleProviders = [
				'provider-1',
				'provider-2',
			];

			mockHandleSiteArchiveUpload.mockImplementation(
				async ( providerId ) => {
					if ( providerId === 'provider-2' ) {
						throw new Error( 'Upload failed for provider-2' );
					}
					return { success: true };
				}
			);

			const result = await uploadSiteArchiveHandler( mockContext );

			// Second result should be the error
			const failedResult = result.results[ 1 ];
			expect( failedResult ).toBeInstanceOf( Error );
			expect( failedResult.message ).toBe(
				'Upload failed for provider-2'
			);
		} );
	} );

	describe( 'Context passing', () => {
		test( 'should pass entire context to upload handler', async () => {
			const customContext = {
				...mockContext,
				customField: 'custom value',
				blueprintBundle: {
					bundlePath: '/tmp/custom-bundle.zip',
				},
			};

			await uploadSiteArchiveHandler( customContext );

			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'provider-1',
				expect.objectContaining( {
					customField: 'custom value',
					blueprintBundle: {
						bundlePath: '/tmp/custom-bundle.zip',
					},
				} )
			);
		} );

		test( 'should include exportPath in deployment config', async () => {
			await uploadSiteArchiveHandler( mockContext );

			expect( mockHandleSiteArchiveUpload ).toHaveBeenCalledWith(
				'provider-1',
				expect.objectContaining( {
					exportPath: expect.any( String ),
				} )
			);
		} );
	} );
} );
