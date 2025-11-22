/**
 * Unified File Upload Tests
 *
 * Tests for unified file upload system and provider hook integration.
 *
 */

import {
	createFileContext,
	FILE_TYPES,
	uploadFile,
	uploadFiles,
} from '../unifiedFileUpload';
import { addAction, removeAction } from '@wordpress/hooks';

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => {
	const hooks = new Map();
	const actions = new Map();

	return {
		doAction: jest.fn( ( actionName, ...args ) => {
			const handlers = actions.get( actionName ) || [];
			handlers.forEach( ( handler ) => {
				try {
					handler( ...args );
				} catch ( error ) {
					// Ignore errors in handlers for testing
				}
			} );
		} ),
		applyFilters: jest.fn( ( filter, value ) => value ),
		hasAction: jest.fn( ( actionName ) => actions.has( actionName ) ),
		addAction: jest.fn(
			( actionName, namespace, handler, priority = 10 ) => {
				if ( ! actions.has( actionName ) ) {
					actions.set( actionName, [] );
				}
				actions.get( actionName ).push( handler );
			}
		),
		removeAction: jest.fn( ( actionName, namespace ) => {
			if ( actions.has( actionName ) ) {
				const handlers = actions.get( actionName );
				const index = handlers.findIndex(
					( h ) => h.namespace === namespace
				);
				if ( index > -1 ) {
					handlers.splice( index, 1 );
				}
			}
		} ),
	};
} );

describe( 'unifiedFileUpload', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'createFileContext()', () => {
		test( 'should create file context for blueprint bundle', () => {
			const context = createFileContext( {
				fileType: FILE_TYPES.BLUEPRINT_BUNDLE,
				filePath: '/path/to/bundle.zip',
				contentType: 'application/zip',
				storageKey: 'blueprint-bundle/bundle.zip',
				providerId: 'local-filesystem:123',
				metadata: { siteUrl: 'https://example.com' },
			} );

			expect( context.fileType ).toBe( FILE_TYPES.BLUEPRINT_BUNDLE );
			expect( context.filePath ).toBe( '/path/to/bundle.zip' );
			expect( context.providerId ).toBe( 'local-filesystem:123' );
			expect( context.metadata.siteUrl ).toBe( 'https://example.com' );
		} );

		test( 'should create file context for static HTML', () => {
			const htmlBlob = new Blob( [ '<html></html>' ], {
				type: 'text/html',
			} );
			const context = createFileContext( {
				fileType: FILE_TYPES.STATIC_HTML,
				fileContent: htmlBlob,
				contentType: 'text/html',
				storageKey: 'index.html',
				providerId: 'local-filesystem:123',
			} );

			expect( context.fileType ).toBe( FILE_TYPES.STATIC_HTML );
			expect( context.fileContent ).toBe( htmlBlob );
			expect( context.storageKey ).toBe( 'index.html' );
		} );

		test( 'should create file context for static asset', () => {
			const assetBlob = new Blob( [ 'asset content' ], {
				type: 'text/css',
			} );
			const context = createFileContext( {
				fileType: FILE_TYPES.STATIC_ASSET,
				fileContent: assetBlob,
				contentType: 'text/css',
				storageKey: 'style.css',
				providerId: 'local-filesystem:123',
			} );

			expect( context.fileType ).toBe( FILE_TYPES.STATIC_ASSET );
			expect( context.contentType ).toBe( 'text/css' );
		} );
	} );

	describe( 'uploadFile()', () => {
		test( 'should fire aether.file.upload action', async () => {
			const { doAction } = require( '@wordpress/hooks' );
			const handler = jest.fn( ( fileContext ) => {
				// Register promise for async handling
				if ( ! fileContext._uploadPromises ) {
					fileContext._uploadPromises = [];
				}
				fileContext._uploadPromises.push( Promise.resolve() );
			} );

			// Register provider hook
			addAction( 'aether.file.upload', 'test-provider', handler );

			const context = createFileContext( {
				fileType: FILE_TYPES.STATIC_HTML,
				fileContent: new Blob( [ 'test' ] ),
				contentType: 'text/html',
				storageKey: 'test.html',
				providerId: 'test-provider',
			} );

			const result = await uploadFile( context );

			expect( doAction ).toHaveBeenCalledWith(
				'aether.file.upload',
				expect.any( Object )
			);
			expect( handler ).toHaveBeenCalled();
			expect( result.success ).toBe( true );
		} );

		test( 'should allow filtering file context', async () => {
			const { applyFilters } = require( '@wordpress/hooks' );
			const handler = jest.fn( ( fileContext ) => {
				if ( ! fileContext._uploadPromises ) {
					fileContext._uploadPromises = [];
				}
				fileContext._uploadPromises.push( Promise.resolve() );
			} );

			addAction( 'aether.file.upload', 'test-provider', handler );

			const context = createFileContext( {
				fileType: FILE_TYPES.STATIC_HTML,
				fileContent: new Blob( [ 'test' ] ),
				contentType: 'text/html',
				storageKey: 'test.html',
				providerId: 'test-provider',
			} );

			await uploadFile( context );

			expect( applyFilters ).toHaveBeenCalledWith(
				'aether.file.upload.context',
				expect.any( Object ),
				'test-provider'
			);
		} );

		test( 'should wait for async provider handlers', async () => {
			let handlerCompleted = false;
			const handler = jest.fn( ( fileContext ) => {
				if ( ! fileContext._uploadPromises ) {
					fileContext._uploadPromises = [];
				}
				// Simulate async operation
				const promise = new Promise( ( resolve ) => {
					setTimeout( () => {
						handlerCompleted = true;
						resolve();
					}, 10 );
				} );
				fileContext._uploadPromises.push( promise );
			} );

			addAction( 'aether.file.upload', 'test-provider', handler );

			const context = createFileContext( {
				fileType: FILE_TYPES.STATIC_HTML,
				fileContent: new Blob( [ 'test' ] ),
				contentType: 'text/html',
				storageKey: 'test.html',
				providerId: 'test-provider',
			} );

			await uploadFile( context );

			expect( handlerCompleted ).toBe( true );
		} );

		test( 'should return provider result when set on fileContext', async () => {
			const handler = jest.fn( ( fileContext ) => {
				if ( ! fileContext._uploadPromises ) {
					fileContext._uploadPromises = [];
				}
				const promise = new Promise( ( resolve ) => {
					// Provider sets result on context
					fileContext.result = {
						success: false,
						error: 'Storage quota exceeded',
					};
					resolve();
				} );
				fileContext._uploadPromises.push( promise );
			} );

			addAction( 'aether.file.upload', 'test-provider', handler );

			const context = createFileContext( {
				fileType: FILE_TYPES.STATIC_HTML,
				fileContent: new Blob( [ 'test' ] ),
				contentType: 'text/html',
				storageKey: 'test.html',
				providerId: 'test-provider',
			} );

			const result = await uploadFile( context );

			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Storage quota exceeded' );
		} );

		test( 'should return success when provider sets success result', async () => {
			const handler = jest.fn( ( fileContext ) => {
				if ( ! fileContext._uploadPromises ) {
					fileContext._uploadPromises = [];
				}
				const promise = new Promise( ( resolve ) => {
					fileContext.result = {
						success: true,
						url: 'https://example.com/file.html',
					};
					resolve();
				} );
				fileContext._uploadPromises.push( promise );
			} );

			addAction( 'aether.file.upload', 'test-provider', handler );

			const context = createFileContext( {
				fileType: FILE_TYPES.STATIC_HTML,
				fileContent: new Blob( [ 'test' ] ),
				contentType: 'text/html',
				storageKey: 'test.html',
				providerId: 'test-provider',
			} );

			const result = await uploadFile( context );

			expect( result.success ).toBe( true );
			expect( result.url ).toBe( 'https://example.com/file.html' );
		} );
	} );

	describe( 'uploadFiles()', () => {
		test( 'should upload files to multiple providers', async () => {
			const uploads = [];
			const handler = jest.fn( ( fileContext ) => {
				uploads.push( {
					providerId: fileContext.providerId,
					storageKey: fileContext.storageKey,
				} );
				if ( ! fileContext._uploadPromises ) {
					fileContext._uploadPromises = [];
				}
				fileContext._uploadPromises.push( Promise.resolve() );
			} );

			addAction( 'aether.file.upload', 'provider1', handler );
			addAction( 'aether.file.upload', 'provider2', handler );

			const contexts = [
				createFileContext( {
					fileType: FILE_TYPES.STATIC_HTML,
					fileContent: new Blob( [ 'html1' ] ),
					contentType: 'text/html',
					storageKey: 'page1.html',
					providerId: 'provider1',
				} ),
				createFileContext( {
					fileType: FILE_TYPES.STATIC_HTML,
					fileContent: new Blob( [ 'html2' ] ),
					contentType: 'text/html',
					storageKey: 'page2.html',
					providerId: 'provider2',
				} ),
			];

			const results = await uploadFiles( contexts, [
				'provider1',
				'provider2',
			] );

			expect( results.length ).toBe( 4 ); // 2 files × 2 providers
			// Both handlers fire for each upload (4 uploads × 2 handlers = 8)
			expect( uploads.length ).toBe( 8 );
		} );

		test( 'should handle upload errors gracefully', async () => {
			const handler = jest.fn( ( fileContext ) => {
				if ( ! fileContext._uploadPromises ) {
					fileContext._uploadPromises = [];
				}
				fileContext._uploadPromises.push(
					Promise.reject( new Error( 'Upload failed' ) )
				);
			} );

			addAction( 'aether.file.upload', 'failing-provider', handler );

			const context = createFileContext( {
				fileType: FILE_TYPES.STATIC_HTML,
				fileContent: new Blob( [ 'test' ] ),
				contentType: 'text/html',
				storageKey: 'test.html',
				providerId: 'failing-provider',
			} );

			const results = await uploadFiles(
				[ context ],
				[ 'failing-provider' ]
			);

			expect( results[ 0 ].success ).toBe( false );
			expect( results[ 0 ].error ).toBe( 'Upload failed' );
		} );
	} );

	describe( 'Provider Hook Integration', () => {
		test( 'should support multiple providers for same file', async () => {
			const provider1Uploads = [];
			const provider2Uploads = [];

			const provider1Handler = jest.fn( ( fileContext ) => {
				provider1Uploads.push( fileContext.storageKey );
				if ( ! fileContext._uploadPromises ) {
					fileContext._uploadPromises = [];
				}
				fileContext._uploadPromises.push( Promise.resolve() );
			} );

			const provider2Handler = jest.fn( ( fileContext ) => {
				provider2Uploads.push( fileContext.storageKey );
				if ( ! fileContext._uploadPromises ) {
					fileContext._uploadPromises = [];
				}
				fileContext._uploadPromises.push( Promise.resolve() );
			} );

			addAction( 'aether.file.upload', 'provider1', provider1Handler );
			addAction( 'aether.file.upload', 'provider2', provider2Handler );

			const context = createFileContext( {
				fileType: FILE_TYPES.STATIC_HTML,
				fileContent: new Blob( [ 'test' ] ),
				contentType: 'text/html',
				storageKey: 'shared.html',
				providerId: 'provider1', // Will be overridden in uploadFiles
			} );

			await uploadFiles( [ context ], [ 'provider1', 'provider2' ] );

			expect( provider1Uploads ).toContain( 'shared.html' );
			expect( provider2Uploads ).toContain( 'shared.html' );
		} );

		test( 'should isolate provider instances', async () => {
			const uploads = [];
			const handler = jest.fn( ( fileContext ) => {
				uploads.push( {
					providerId: fileContext.providerId,
					storageKey: fileContext.storageKey,
				} );
				if ( ! fileContext._uploadPromises ) {
					fileContext._uploadPromises = [];
				}
				fileContext._uploadPromises.push( Promise.resolve() );
			} );

			// Register handler for all local-filesystem providers
			addAction( 'aether.file.upload', 'local-filesystem', handler );

			const contexts = [
				createFileContext( {
					fileType: FILE_TYPES.STATIC_HTML,
					fileContent: new Blob( [ 'test1' ] ),
					contentType: 'text/html',
					storageKey: 'file1.html',
					providerId: 'local-filesystem:instance1',
				} ),
				createFileContext( {
					fileType: FILE_TYPES.STATIC_HTML,
					fileContent: new Blob( [ 'test2' ] ),
					contentType: 'text/html',
					storageKey: 'file2.html',
					providerId: 'local-filesystem:instance2',
				} ),
			];

			await uploadFiles( contexts, [
				'local-filesystem:instance1',
				'local-filesystem:instance2',
			] );

			// Each provider instance should receive its own files
			expect( uploads.length ).toBe( 4 ); // 2 files × 2 instances
			expect(
				uploads.filter(
					( u ) => u.providerId === 'local-filesystem:instance1'
				).length
			).toBe( 2 );
			expect(
				uploads.filter(
					( u ) => u.providerId === 'local-filesystem:instance2'
				).length
			).toBe( 2 );
		} );
	} );
} );
