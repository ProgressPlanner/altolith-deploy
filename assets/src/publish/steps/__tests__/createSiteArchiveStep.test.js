/**
 * Create Site Archive Step Tests
 *
 * Tests for createSiteArchiveHandler step.
 * Validates modular archive creation workflow with progress tracking.
 *
 * @package
 */

import { createSiteArchiveHandler } from '../createSiteArchiveStep';
import apiFetch from '../../../utils/api';
import { getArchiveProgressCache } from '../../../utils/archiveProgressCache';

// Mock dependencies
jest.mock( '../../../utils/api' );
jest.mock( '../../../utils/archiveProgressCache' );

describe( 'createSiteArchiveHandler', () => {
	let mockContext;
	let mockProgressCache;

	beforeEach( () => {
		jest.clearAllMocks();

		// Mock progress cache
		mockProgressCache = {
			set: jest.fn(),
			update: jest.fn(),
			clear: jest.fn(),
		};
		getArchiveProgressCache.mockReturnValue( mockProgressCache );

		// Default context
		mockContext = {
			discoveredAssets: [
				{ slug: 'plugin-1' },
				{ slug: 'plugin-2' },
			],
			setStatusMessage: jest.fn(),
			setStepProgress: jest.fn(),
		};

		// Suppress console.error in tests
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		console.error.mockRestore();
	} );

	describe( 'Successful archive creation', () => {
		beforeEach( () => {
			// Mock successful API responses for all phases
			apiFetch.mockImplementation( async ( { path } ) => {
				if ( path === '/aether/site-exporter/publish/createArchive/init' ) {
					return {
						success: true,
						data: {
							zipPath: '/tmp/archive.zip',
							progressId: 'progress-123',
						},
						progress: { overall: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/database' ) {
					return {
						success: true,
						progress: { overall: 20 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/uploads/batches' ) {
					return {
						success: true,
						data: { batches: 2 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/uploads/batch' ) {
					return {
						success: true,
						progress: { overall: 40 },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/plugins/list' ) ) {
					return {
						success: true,
						data: { plugins: [ 'plugin-1', 'plugin-2' ] },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/plugins/add' ) {
					return {
						success: true,
						progress: { overall: 60 },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/themes/list' ) ) {
					return {
						success: true,
						data: { themes: [ 'theme-1' ] },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/themes/add' ) {
					return {
						success: true,
						progress: { overall: 80 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/mu-plugins/batches' ) {
					return {
						success: true,
						data: { batches: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/finalize' ) {
					return {
						success: true,
						data: { archivePath: '/tmp/archive.zip' },
					};
				}

				return { success: false, message: 'Unknown endpoint' };
			} );
		} );

		test( 'should complete full archive creation workflow', async () => {
			const result = await createSiteArchiveHandler( mockContext );

			expect( result ).toEqual( { archivePath: '/tmp/archive.zip' } );
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'createSiteArchive',
				100
			);
			expect( mockProgressCache.clear ).toHaveBeenCalledWith( 'progress-123' );
		} );

		test( 'should initialize archive with custom assets', async () => {
			await createSiteArchiveHandler( mockContext );

			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/aether/site-exporter/publish/createArchive/init',
					method: 'POST',
					data: {
						custom_assets: [ 'plugin-1', 'plugin-2' ],
					},
				} )
			);
		} );

		test( 'should initialize archive without custom assets if not provided', async () => {
			const contextWithoutAssets = {
				...mockContext,
				discoveredAssets: null,
			};

			await createSiteArchiveHandler( contextWithoutAssets );

			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/aether/site-exporter/publish/createArchive/init',
					method: 'POST',
					data: undefined,
				} )
			);
		} );

		test( 'should store initial progress in cache', async () => {
			await createSiteArchiveHandler( mockContext );

			expect( mockProgressCache.set ).toHaveBeenCalledWith(
				'progress-123',
				{ overall: 0 }
			);
		} );

		test( 'should update progress after database phase', async () => {
			await createSiteArchiveHandler( mockContext );

			expect( mockProgressCache.update ).toHaveBeenCalledWith(
				'progress-123',
				{ overall: 20 }
			);
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'createSiteArchive',
				20
			);
		} );

		test( 'should process uploads in batches', async () => {
			await createSiteArchiveHandler( mockContext );

			// Should call batch endpoint twice (2 batches)
			const batchCalls = apiFetch.mock.calls.filter(
				( call ) =>
					call[ 0 ].path ===
					'/aether/site-exporter/publish/createArchive/phase/uploads/batch'
			);
			expect( batchCalls ).toHaveLength( 2 );

			// Should pass correct batch numbers
			expect( batchCalls[ 0 ][ 0 ].data.batch ).toBe( 0 );
			expect( batchCalls[ 1 ][ 0 ].data.batch ).toBe( 1 );
		} );

		test( 'should process plugins one by one', async () => {
			await createSiteArchiveHandler( mockContext );

			const pluginAddCalls = apiFetch.mock.calls.filter(
				( call ) =>
					call[ 0 ].path ===
					'/aether/site-exporter/publish/createArchive/phase/plugins/add'
			);
			expect( pluginAddCalls ).toHaveLength( 2 );

			// Should pass correct plugin slugs
			expect( pluginAddCalls[ 0 ][ 0 ].data.slug ).toBe( 'plugin-1' );
			expect( pluginAddCalls[ 1 ][ 0 ].data.slug ).toBe( 'plugin-2' );
		} );

		test( 'should process themes one by one', async () => {
			await createSiteArchiveHandler( mockContext );

			const themeAddCalls = apiFetch.mock.calls.filter(
				( call ) =>
					call[ 0 ].path ===
					'/aether/site-exporter/publish/createArchive/phase/themes/add'
			);
			expect( themeAddCalls ).toHaveLength( 1 );

			expect( themeAddCalls[ 0 ][ 0 ].data.slug ).toBe( 'theme-1' );
		} );

		test( 'should update status message during each phase', async () => {
			await createSiteArchiveHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'Initializing archive...',
				'progress',
				'createSiteArchive'
			);
			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'Adding database...',
				'progress',
				'createSiteArchive'
			);
			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'Finalizing archive...',
				'progress',
				'createSiteArchive'
			);
			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'Zipped the wp-content.zip file',
				'success',
				'createSiteArchive'
			);
		} );
	} );

	describe( 'Empty content scenarios', () => {
		beforeEach( () => {
			apiFetch.mockImplementation( async ( { path } ) => {
				if ( path === '/aether/site-exporter/publish/createArchive/init' ) {
					return {
						success: true,
						data: {
							zipPath: '/tmp/archive.zip',
							progressId: 'progress-123',
						},
						progress: { overall: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/database' ) {
					return {
						success: true,
						progress: { overall: 50 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/uploads/batches' ) {
					return {
						success: true,
						data: { batches: 0 },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/plugins/list' ) ) {
					return {
						success: true,
						data: { plugins: [] },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/themes/list' ) ) {
					return {
						success: true,
						data: { themes: [] },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/mu-plugins/batches' ) {
					return {
						success: true,
						data: { batches: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/finalize' ) {
					return {
						success: true,
						data: { archivePath: '/tmp/archive.zip' },
					};
				}

				return { success: false, message: 'Unknown endpoint' };
			} );
		} );

		test( 'should handle site with no uploads', async () => {
			const result = await createSiteArchiveHandler( mockContext );

			expect( result ).toEqual( { archivePath: '/tmp/archive.zip' } );
			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'No uploads to add',
				'progress',
				'createSiteArchive'
			);
		} );

		test( 'should handle site with no plugins', async () => {
			const result = await createSiteArchiveHandler( mockContext );

			expect( result ).toEqual( { archivePath: '/tmp/archive.zip' } );
			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'No plugins to add',
				'progress',
				'createSiteArchive'
			);
		} );

		test( 'should handle site with no themes', async () => {
			const result = await createSiteArchiveHandler( mockContext );

			expect( result ).toEqual( { archivePath: '/tmp/archive.zip' } );
			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'No themes to add',
				'progress',
				'createSiteArchive'
			);
		} );

		test( 'should handle site with no mu-plugins', async () => {
			const result = await createSiteArchiveHandler( mockContext );

			expect( result ).toEqual( { archivePath: '/tmp/archive.zip' } );
			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				'No mu-plugins to add',
				'progress',
				'createSiteArchive'
			);
		} );
	} );

	describe( 'Error handling', () => {
		test( 'should throw error on init failure', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
				message: 'Init failed',
			} );

			await expect(
				createSiteArchiveHandler( mockContext )
			).rejects.toThrow( 'Init failed' );
		} );

		test( 'should throw error on missing zipPath', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				data: {
					progressId: 'progress-123',
					// Missing zipPath
				},
			} );

			await expect(
				createSiteArchiveHandler( mockContext )
			).rejects.toThrow( 'Invalid response from server' );
		} );

		test( 'should throw error on missing progressId', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				data: {
					zipPath: '/tmp/archive.zip',
					// Missing progressId
				},
			} );

			await expect(
				createSiteArchiveHandler( mockContext )
			).rejects.toThrow( 'Invalid response from server' );
		} );

		test( 'should clear progress cache on database phase failure', async () => {
			apiFetch.mockImplementation( async ( { path } ) => {
				if ( path === '/aether/site-exporter/publish/createArchive/init' ) {
					return {
						success: true,
						data: {
							zipPath: '/tmp/archive.zip',
							progressId: 'progress-123',
						},
						progress: { overall: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/database' ) {
					return {
						success: false,
						message: 'Database phase failed',
					};
				}

				return { success: false };
			} );

			await expect(
				createSiteArchiveHandler( mockContext )
			).rejects.toThrow( 'Database phase failed' );

			expect( mockProgressCache.clear ).toHaveBeenCalledWith( 'progress-123' );
		} );

		test( 'should clear progress cache on uploads batch failure', async () => {
			apiFetch.mockImplementation( async ( { path } ) => {
				if ( path === '/aether/site-exporter/publish/createArchive/init' ) {
					return {
						success: true,
						data: {
							zipPath: '/tmp/archive.zip',
							progressId: 'progress-123',
						},
						progress: { overall: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/database' ) {
					return {
						success: true,
						progress: { overall: 20 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/uploads/batches' ) {
					return {
						success: false,
						message: 'Uploads batches failed',
					};
				}

				return { success: false };
			} );

			await expect(
				createSiteArchiveHandler( mockContext )
			).rejects.toThrow( 'Uploads batches failed' );

			expect( mockProgressCache.clear ).toHaveBeenCalledWith( 'progress-123' );
		} );

		test( 'should clear progress cache on plugin add failure', async () => {
			apiFetch.mockImplementation( async ( { path } ) => {
				if ( path === '/aether/site-exporter/publish/createArchive/init' ) {
					return {
						success: true,
						data: {
							zipPath: '/tmp/archive.zip',
							progressId: 'progress-123',
						},
						progress: { overall: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/database' ) {
					return {
						success: true,
						progress: { overall: 20 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/uploads/batches' ) {
					return {
						success: true,
						data: { batches: 0 },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/plugins/list' ) ) {
					return {
						success: true,
						data: { plugins: [ 'plugin-1' ] },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/plugins/add' ) {
					return {
						success: false,
						message: 'Failed to add plugin: plugin-1',
					};
				}

				return { success: false };
			} );

			await expect(
				createSiteArchiveHandler( mockContext )
			).rejects.toThrow( 'Failed to add plugin: plugin-1' );

			expect( mockProgressCache.clear ).toHaveBeenCalledWith( 'progress-123' );
		} );

		test( 'should clear progress cache on finalize failure', async () => {
			apiFetch.mockImplementation( async ( { path } ) => {
				if ( path === '/aether/site-exporter/publish/createArchive/init' ) {
					return {
						success: true,
						data: {
							zipPath: '/tmp/archive.zip',
							progressId: 'progress-123',
						},
						progress: { overall: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/database' ) {
					return {
						success: true,
						progress: { overall: 50 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/uploads/batches' ) {
					return {
						success: true,
						data: { batches: 0 },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/plugins/list' ) ) {
					return {
						success: true,
						data: { plugins: [] },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/themes/list' ) ) {
					return {
						success: true,
						data: { themes: [] },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/mu-plugins/batches' ) {
					return {
						success: true,
						data: { batches: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/finalize' ) {
					return {
						success: false,
						message: 'Finalize failed',
					};
				}

				return { success: false };
			} );

			await expect(
				createSiteArchiveHandler( mockContext )
			).rejects.toThrow( 'Finalize failed' );

			expect( mockProgressCache.clear ).toHaveBeenCalledWith( 'progress-123' );
		} );
	} );

	describe( 'Progress tracking', () => {
		beforeEach( () => {
			// Mock full workflow with different progress values
			apiFetch.mockImplementation( async ( { path } ) => {
				if ( path === '/aether/site-exporter/publish/createArchive/init' ) {
					return {
						success: true,
						data: {
							zipPath: '/tmp/archive.zip',
							progressId: 'progress-123',
						},
						progress: { overall: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/database' ) {
					return {
						success: true,
						progress: { overall: 10 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/uploads/batches' ) {
					return {
						success: true,
						data: { batches: 1 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/uploads/batch' ) {
					return {
						success: true,
						progress: { overall: 30 },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/plugins/list' ) ) {
					return {
						success: true,
						data: { plugins: [ 'plugin-1' ] },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/plugins/add' ) {
					return {
						success: true,
						progress: { overall: 60 },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/themes/list' ) ) {
					return {
						success: true,
						data: { themes: [] },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/mu-plugins/batches' ) {
					return {
						success: true,
						data: { batches: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/finalize' ) {
					return {
						success: true,
						data: { archivePath: '/tmp/archive.zip' },
					};
				}

				return { success: false };
			} );
		} );

		test( 'should update progress cache throughout workflow', async () => {
			await createSiteArchiveHandler( mockContext );

			// Should update after database, uploads, and plugins
			expect( mockProgressCache.update ).toHaveBeenCalledWith(
				'progress-123',
				{ overall: 10 }
			);
			expect( mockProgressCache.update ).toHaveBeenCalledWith(
				'progress-123',
				{ overall: 30 }
			);
			expect( mockProgressCache.update ).toHaveBeenCalledWith(
				'progress-123',
				{ overall: 60 }
			);
		} );

		test( 'should update step progress with overall progress values', async () => {
			await createSiteArchiveHandler( mockContext );

			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'createSiteArchive',
				10
			);
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'createSiteArchive',
				30
			);
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'createSiteArchive',
				60
			);
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'createSiteArchive',
				100
			);
		} );

		test( 'should handle progress update with missing overall value', async () => {
			apiFetch.mockImplementation( async ( { path } ) => {
				if ( path === '/aether/site-exporter/publish/createArchive/init' ) {
					return {
						success: true,
						data: {
							zipPath: '/tmp/archive.zip',
							progressId: 'progress-123',
						},
						progress: {},
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/database' ) {
					return {
						success: true,
						progress: {}, // No overall value
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/uploads/batches' ) {
					return {
						success: true,
						data: { batches: 0 },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/plugins/list' ) ) {
					return {
						success: true,
						data: { plugins: [] },
					};
				}

				if ( path.includes( '/aether/site-exporter/publish/createArchive/phase/themes/list' ) ) {
					return {
						success: true,
						data: { themes: [] },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/phase/mu-plugins/batches' ) {
					return {
						success: true,
						data: { batches: 0 },
					};
				}

				if ( path === '/aether/site-exporter/publish/createArchive/finalize' ) {
					return {
						success: true,
						data: {},
					};
				}

				return { success: false };
			} );

			const result = await createSiteArchiveHandler( mockContext );

			expect( result ).toEqual( {} );
			// Should call with 0 when overall is missing
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'createSiteArchive',
				0
			);
		} );
	} );
} );
