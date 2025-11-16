/**
 * Manifest Manager Tests
 *
 * Comprehensive tests for manifest management functionality, covering:
 * - Fetching existing manifests from remote storage
 * - Checking if files should be skipped (size + hash comparison)
 * - Updating manifest entries with size and hash
 * - Uploading manifests to remote storage
 * - Error handling and graceful degradation
 * - Manifest format and structure
 *
 * @package
 */

import {
	fetchManifest,
	shouldSkipUpload,
	updateManifestEntry,
	uploadManifest,
	cleanupManifest,
} from '../manifestManager';

describe( 'manifestManager', () => {
	// Mock storage service
	let mockStorageService;

	beforeEach( () => {
		mockStorageService = {
			downloadManifest: jest.fn(),
			uploadManifest: jest.fn(),
		};
		jest.clearAllMocks();
	} );

	describe( 'fetchManifest', () => {
		test( 'fetches and parses valid manifest', async () => {
			const manifestData = {
				'site-key/static/index.html': {
					size: 1024,
					hash: 'abc123',
				},
				'site-key/static/style.css': {
					size: 512,
					hash: 'def456',
				},
			};

			const manifestBlob = new Blob( [ JSON.stringify( manifestData ) ], {
				type: 'application/json',
			} );
			mockStorageService.downloadManifest.mockResolvedValue(
				manifestBlob
			);

			const result = await fetchManifest(
				mockStorageService,
				'site-key'
			);

			expect( mockStorageService.downloadManifest ).toHaveBeenCalledWith(
				'site-key'
			);
			expect( result ).toEqual( manifestData );
		} );

		test( 'returns empty object when manifest not found', async () => {
			mockStorageService.downloadManifest.mockResolvedValue( null );

			const result = await fetchManifest(
				mockStorageService,
				'site-key'
			);

			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object on 404 error', async () => {
			mockStorageService.downloadManifest.mockRejectedValue(
				new Error( '404 Not Found' )
			);

			const result = await fetchManifest(
				mockStorageService,
				'site-key'
			);

			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object on network error', async () => {
			mockStorageService.downloadManifest.mockRejectedValue(
				new Error( 'Network error' )
			);

			const result = await fetchManifest(
				mockStorageService,
				'site-key'
			);

			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object on invalid JSON', async () => {
			const invalidBlob = new Blob( [ 'not valid JSON' ], {
				type: 'application/json',
			} );
			mockStorageService.downloadManifest.mockResolvedValue(
				invalidBlob
			);

			const result = await fetchManifest(
				mockStorageService,
				'site-key'
			);

			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object when manifest is null after parsing', async () => {
			const nullBlob = new Blob( [ 'null' ], {
				type: 'application/json',
			} );
			mockStorageService.downloadManifest.mockResolvedValue( nullBlob );

			const result = await fetchManifest(
				mockStorageService,
				'site-key'
			);

			expect( result ).toEqual( {} );
		} );

		test( 'handles empty manifest object', async () => {
			const emptyBlob = new Blob( [ '{}' ], {
				type: 'application/json',
			} );
			mockStorageService.downloadManifest.mockResolvedValue( emptyBlob );

			const result = await fetchManifest(
				mockStorageService,
				'site-key'
			);

			expect( result ).toEqual( {} );
		} );

		test( 'handles manifest with many entries', async () => {
			const largeManifest = {};
			for ( let i = 0; i < 1000; i++ ) {
				largeManifest[ `site-key/file${ i }.html` ] = {
					size: i * 100,
					hash: `hash${ i }`,
				};
			}

			const manifestBlob = new Blob(
				[ JSON.stringify( largeManifest ) ],
				{ type: 'application/json' }
			);
			mockStorageService.downloadManifest.mockResolvedValue(
				manifestBlob
			);

			const result = await fetchManifest(
				mockStorageService,
				'site-key'
			);

			expect( Object.keys( result ) ).toHaveLength( 1000 );
		} );
	} );

	describe( 'shouldSkipUpload', () => {
		let manifest;

		beforeEach( () => {
			manifest = {
				'site-key/static/index.html': {
					size: 1024,
					hash: 'abc123def456',
				},
				'site-key/static/style.css': {
					size: 512,
					hash: '789ghi012jkl',
				},
			};
		} );

		describe( 'File Should Be Skipped', () => {
			test( 'returns true when size and hash match', () => {
				const result = shouldSkipUpload(
					manifest,
					'site-key/static/index.html',
					1024,
					'abc123def456'
				);

				expect( result ).toBe( true );
			} );

			test( 'returns true for second file with matching size and hash', () => {
				const result = shouldSkipUpload(
					manifest,
					'site-key/static/style.css',
					512,
					'789ghi012jkl'
				);

				expect( result ).toBe( true );
			} );
		} );

		describe( 'File Should Be Uploaded', () => {
			test( 'returns false when file not in manifest', () => {
				const result = shouldSkipUpload(
					manifest,
					'site-key/static/new-file.html',
					2048,
					'newfilehash'
				);

				expect( result ).toBe( false );
			} );

			test( 'returns false when size differs', () => {
				const result = shouldSkipUpload(
					manifest,
					'site-key/static/index.html',
					2048, // Different size
					'abc123def456'
				);

				expect( result ).toBe( false );
			} );

			test( 'returns false when hash differs but size matches', () => {
				const result = shouldSkipUpload(
					manifest,
					'site-key/static/index.html',
					1024, // Same size
					'differenthash' // Different hash
				);

				expect( result ).toBe( false );
			} );

			test( 'returns false when both size and hash differ', () => {
				const result = shouldSkipUpload(
					manifest,
					'site-key/static/index.html',
					2048, // Different size
					'differenthash' // Different hash
				);

				expect( result ).toBe( false );
			} );

			test( 'returns false when manifest is null', () => {
				const result = shouldSkipUpload(
					null,
					'site-key/static/index.html',
					1024,
					'abc123def456'
				);

				expect( result ).toBe( false );
			} );

			test( 'returns false when manifest is undefined', () => {
				const result = shouldSkipUpload(
					undefined,
					'site-key/static/index.html',
					1024,
					'abc123def456'
				);

				expect( result ).toBe( false );
			} );

			test( 'returns false when manifest is empty object', () => {
				const result = shouldSkipUpload(
					{},
					'site-key/static/index.html',
					1024,
					'abc123def456'
				);

				expect( result ).toBe( false );
			} );
		} );

		describe( 'Two-Stage Comparison', () => {
			test( 'checks size first (Stage 1)', () => {
				// Size differs - should return false immediately
				const result = shouldSkipUpload(
					manifest,
					'site-key/static/index.html',
					999, // Different size
					'abc123def456' // Same hash (shouldn't matter)
				);

				expect( result ).toBe( false );
			} );

			test( 'checks hash only if size matches (Stage 2)', () => {
				// Size matches - should check hash
				const result = shouldSkipUpload(
					manifest,
					'site-key/static/index.html',
					1024, // Same size
					'differenthash' // Different hash
				);

				expect( result ).toBe( false );
			} );
		} );

		describe( 'Edge Cases', () => {
			test( 'handles size of 0', () => {
				const emptyManifest = {
					'site-key/static/empty.txt': {
						size: 0,
						hash: 'emptyhash',
					},
				};

				const result = shouldSkipUpload(
					emptyManifest,
					'site-key/static/empty.txt',
					0,
					'emptyhash'
				);

				expect( result ).toBe( true );
			} );

			test( 'handles very large size', () => {
				const largeManifest = {
					'site-key/static/large.zip': {
						size: 100 * 1024 * 1024, // 100MB
						hash: 'largehash',
					},
				};

				const result = shouldSkipUpload(
					largeManifest,
					'site-key/static/large.zip',
					100 * 1024 * 1024,
					'largehash'
				);

				expect( result ).toBe( true );
			} );

			test( 'handles long hash string (64 chars for SHA-256)', () => {
				const longHashManifest = {
					'site-key/static/file.txt': {
						size: 100,
						hash: 'a'.repeat( 64 ),
					},
				};

				const result = shouldSkipUpload(
					longHashManifest,
					'site-key/static/file.txt',
					100,
					'a'.repeat( 64 )
				);

				expect( result ).toBe( true );
			} );

			test( 'handles special characters in storage key', () => {
				const specialManifest = {
					'site-key/static/file with spaces.html': {
						size: 100,
						hash: 'specialhash',
					},
				};

				const result = shouldSkipUpload(
					specialManifest,
					'site-key/static/file with spaces.html',
					100,
					'specialhash'
				);

				expect( result ).toBe( true );
			} );

			test( 'is case-sensitive for hash comparison', () => {
				const result = shouldSkipUpload(
					manifest,
					'site-key/static/index.html',
					1024,
					'ABC123DEF456' // Uppercase, original is lowercase
				);

				expect( result ).toBe( false );
			} );
		} );
	} );

	describe( 'updateManifestEntry', () => {
		test( 'adds new entry to manifest', () => {
			const manifest = {};

			const result = updateManifestEntry(
				manifest,
				'site-key/static/index.html',
				1024,
				'abc123'
			);

			expect( result[ 'site-key/static/index.html' ] ).toBeDefined();
			expect( result[ 'site-key/static/index.html' ] ).toEqual( {
				size: 1024,
				hash: 'abc123',
			} );
		} );

		test( 'updates existing entry in manifest', () => {
			const manifest = {
				'site-key/static/index.html': {
					size: 1024,
					hash: 'oldhas',
				},
			};

			const result = updateManifestEntry(
				manifest,
				'site-key/static/index.html',
				2048,
				'newhash'
			);

			expect( result[ 'site-key/static/index.html' ] ).toEqual( {
				size: 2048,
				hash: 'newhash',
			} );
		} );

		test( 'preserves other entries when adding new entry', () => {
			const manifest = {
				'site-key/static/index.html': {
					size: 1024,
					hash: 'abc123',
				},
			};

			const result = updateManifestEntry(
				manifest,
				'site-key/static/style.css',
				512,
				'def456'
			);

			expect( Object.keys( result ) ).toHaveLength( 2 );
			expect( result[ 'site-key/static/index.html' ] ).toEqual( {
				size: 1024,
				hash: 'abc123',
			} );
			expect( result[ 'site-key/static/style.css' ] ).toEqual( {
				size: 512,
				hash: 'def456',
			} );
		} );

		test( 'handles null manifest parameter', () => {
			const result = updateManifestEntry(
				null,
				'site-key/static/index.html',
				1024,
				'abc123'
			);

			expect( result[ 'site-key/static/index.html' ] ).toBeDefined();
			expect( result[ 'site-key/static/index.html' ] ).toEqual( {
				size: 1024,
				hash: 'abc123',
			} );
		} );

		test( 'handles undefined manifest parameter', () => {
			const result = updateManifestEntry(
				undefined,
				'site-key/static/index.html',
				1024,
				'abc123'
			);

			expect( result[ 'site-key/static/index.html' ] ).toBeDefined();
			expect( result[ 'site-key/static/index.html' ] ).toEqual( {
				size: 1024,
				hash: 'abc123',
			} );
		} );

		test( 'handles size of 0', () => {
			const result = updateManifestEntry(
				{},
				'site-key/static/empty.txt',
				0,
				'emptyhash'
			);

			expect( result[ 'site-key/static/empty.txt' ] ).toEqual( {
				size: 0,
				hash: 'emptyhash',
			} );
		} );

		test( 'handles very large size', () => {
			const result = updateManifestEntry(
				{},
				'site-key/static/large.zip',
				100 * 1024 * 1024,
				'largehash'
			);

			expect( result[ 'site-key/static/large.zip' ] ).toEqual( {
				size: 100 * 1024 * 1024,
				hash: 'largehash',
			} );
		} );

		test( 'handles long hash (64 chars)', () => {
			const longHash = 'a'.repeat( 64 );
			const result = updateManifestEntry(
				{},
				'site-key/static/file.txt',
				100,
				longHash
			);

			expect( result[ 'site-key/static/file.txt' ] ).toEqual( {
				size: 100,
				hash: longHash,
			} );
		} );

		test( 'returns the same manifest object (mutation)', () => {
			const manifest = {};

			const result = updateManifestEntry(
				manifest,
				'site-key/static/index.html',
				1024,
				'abc123'
			);

			expect( result ).toBe( manifest );
		} );
	} );

	describe( 'uploadManifest', () => {
		test( 'uploads manifest successfully', async () => {
			const manifest = {
				'site-key/static/index.html': {
					size: 1024,
					hash: 'abc123',
				},
			};

			mockStorageService.uploadManifest.mockResolvedValue( {
				success: true,
			} );

			const result = await uploadManifest(
				mockStorageService,
				'site-key',
				manifest
			);

			expect( mockStorageService.uploadManifest ).toHaveBeenCalledWith(
				'site-key',
				expect.any( Blob )
			);
			expect( result ).toBe( true );
		} );

		test( 'uploads manifest as JSON blob', async () => {
			const manifest = {
				'site-key/static/index.html': {
					size: 1024,
					hash: 'abc123',
				},
			};

			mockStorageService.uploadManifest.mockResolvedValue( {
				success: true,
			} );

			await uploadManifest( mockStorageService, 'site-key', manifest );

			const callArgs = mockStorageService.uploadManifest.mock.calls[ 0 ];
			const blob = callArgs[ 1 ];

			expect( blob ).toBeInstanceOf( Blob );
			expect( blob.type ).toBe( 'application/json' );

			// Verify blob content
			const text = await blob.text();
			const parsed = JSON.parse( text );
			expect( parsed ).toEqual( manifest );
		} );

		test( 'formats JSON as minified (compact)', async () => {
			const manifest = {
				'site-key/static/index.html': {
					size: 1024,
					hash: 'abc123',
				},
			};

			mockStorageService.uploadManifest.mockResolvedValue( {
				success: true,
			} );

			await uploadManifest( mockStorageService, 'site-key', manifest );

			const callArgs = mockStorageService.uploadManifest.mock.calls[ 0 ];
			const blob = callArgs[ 1 ];
			const text = await blob.text();

			// Should be minified (no extra whitespace)
			expect( text ).not.toMatch( /\n\s+/ ); // No newlines with indentation
			// Should still be valid JSON
			expect( () => JSON.parse( text ) ).not.toThrow();
		} );

		test( 'returns false on upload failure', async () => {
			const manifest = {
				'site-key/static/index.html': {
					size: 1024,
					hash: 'abc123',
				},
			};

			mockStorageService.uploadManifest.mockResolvedValue( {
				success: false,
				error: 'Upload failed',
			} );

			const result = await uploadManifest(
				mockStorageService,
				'site-key',
				manifest
			);

			expect( result ).toBe( false );
		} );

		test( 'returns false on exception', async () => {
			const manifest = {
				'site-key/static/index.html': {
					size: 1024,
					hash: 'abc123',
				},
			};

			mockStorageService.uploadManifest.mockRejectedValue(
				new Error( 'Network error' )
			);

			const result = await uploadManifest(
				mockStorageService,
				'site-key',
				manifest
			);

			expect( result ).toBe( false );
		} );

		test( 'handles empty manifest', async () => {
			const manifest = {};

			mockStorageService.uploadManifest.mockResolvedValue( {
				success: true,
			} );

			const result = await uploadManifest(
				mockStorageService,
				'site-key',
				manifest
			);

			expect( result ).toBe( true );
		} );

		test( 'handles large manifest with many entries', async () => {
			const largeManifest = {};
			for ( let i = 0; i < 1000; i++ ) {
				largeManifest[ `site-key/file${ i }.html` ] = {
					size: i * 100,
					hash: `hash${ i }`,
				};
			}

			mockStorageService.uploadManifest.mockResolvedValue( {
				success: true,
			} );

			const result = await uploadManifest(
				mockStorageService,
				'site-key',
				largeManifest
			);

			expect( result ).toBe( true );
		} );
	} );

	describe( 'Integration Scenarios', () => {
		test( 'full workflow: fetch, update, check, upload', async () => {
			// Step 1: Fetch existing manifest
			const existingManifest = {
				'site-key/static/index.html': {
					size: 1024,
					hash: 'oldhash',
				},
			};
			const manifestBlob = new Blob(
				[ JSON.stringify( existingManifest ) ],
				{ type: 'application/json' }
			);
			mockStorageService.downloadManifest.mockResolvedValue(
				manifestBlob
			);

			let manifest = await fetchManifest(
				mockStorageService,
				'site-key'
			);

			// Step 2: Check if file should be skipped (hash changed)
			const shouldSkip = shouldSkipUpload(
				manifest,
				'site-key/static/index.html',
				1024,
				'newhash'
			);
			expect( shouldSkip ).toBe( false );

			// Step 3: Update manifest with new hash
			manifest = updateManifestEntry(
				manifest,
				'site-key/static/index.html',
				1024,
				'newhash'
			);

			// Step 4: Upload updated manifest
			mockStorageService.uploadManifest.mockResolvedValue( {
				success: true,
			} );
			const uploaded = await uploadManifest(
				mockStorageService,
				'site-key',
				manifest
			);

			expect( uploaded ).toBe( true );
			expect( manifest[ 'site-key/static/index.html' ].hash ).toBe(
				'newhash'
			);
		} );

		test( 'handles new site with no existing manifest', async () => {
			// Fetch returns empty manifest
			mockStorageService.downloadManifest.mockResolvedValue( null );
			let manifest = await fetchManifest(
				mockStorageService,
				'new-site'
			);

			expect( manifest ).toEqual( {} );

			// Add first file
			manifest = updateManifestEntry(
				manifest,
				'new-site/static/index.html',
				1024,
				'firsthash'
			);

			// Upload new manifest
			mockStorageService.uploadManifest.mockResolvedValue( {
				success: true,
			} );
			const uploaded = await uploadManifest(
				mockStorageService,
				'new-site',
				manifest
			);

			expect( uploaded ).toBe( true );
			expect( Object.keys( manifest ) ).toHaveLength( 1 );
		} );

		test( 'handles manifest update with multiple files', async () => {
			mockStorageService.downloadManifest.mockResolvedValue( null );
			let manifest = await fetchManifest(
				mockStorageService,
				'site-key'
			);

			// Add multiple files
			manifest = updateManifestEntry(
				manifest,
				'site-key/static/index.html',
				1024,
				'hash1'
			);
			manifest = updateManifestEntry(
				manifest,
				'site-key/static/about.html',
				2048,
				'hash2'
			);
			manifest = updateManifestEntry(
				manifest,
				'site-key/static/style.css',
				512,
				'hash3'
			);

			expect( Object.keys( manifest ) ).toHaveLength( 3 );

			// Check which files should be skipped
			expect(
				shouldSkipUpload(
					manifest,
					'site-key/static/index.html',
					1024,
					'hash1'
				)
			).toBe( true );
			expect(
				shouldSkipUpload(
					manifest,
					'site-key/static/about.html',
					2048,
					'differenthash'
				)
			).toBe( false );
		} );
	} );

	describe( 'cleanupManifest', () => {
		test( 'removes entries not in current files set', () => {
			const manifest = {
				'site-key/static/index.html': { size: 1024, hash: 'hash1' },
				'site-key/static/about.html': { size: 2048, hash: 'hash2' },
				'site-key/static/old-page.html': { size: 512, hash: 'hash3' },
			};

			const currentFiles = new Set( [
				'site-key/static/index.html',
				'site-key/static/about.html',
			] );

			const result = cleanupManifest( manifest, currentFiles );

			expect( Object.keys( result ) ).toHaveLength( 2 );
			expect( result[ 'site-key/static/index.html' ] ).toBeDefined();
			expect( result[ 'site-key/static/about.html' ] ).toBeDefined();
			expect( result[ 'site-key/static/old-page.html' ] ).toBeUndefined();
		} );

		test( 'keeps all entries if all files are current', () => {
			const manifest = {
				'site-key/static/index.html': { size: 1024, hash: 'hash1' },
				'site-key/static/about.html': { size: 2048, hash: 'hash2' },
			};

			const currentFiles = new Set( [
				'site-key/static/index.html',
				'site-key/static/about.html',
			] );

			const result = cleanupManifest( manifest, currentFiles );

			expect( Object.keys( result ) ).toHaveLength( 2 );
			expect( result ).toEqual( manifest );
		} );

		test( 'removes all entries if no current files', () => {
			const manifest = {
				'site-key/static/index.html': { size: 1024, hash: 'hash1' },
				'site-key/static/about.html': { size: 2048, hash: 'hash2' },
			};

			const currentFiles = new Set();

			const result = cleanupManifest( manifest, currentFiles );

			expect( Object.keys( result ) ).toHaveLength( 0 );
		} );

		test( 'handles empty manifest', () => {
			const manifest = {};
			const currentFiles = new Set( [ 'site-key/static/index.html' ] );

			const result = cleanupManifest( manifest, currentFiles );

			expect( Object.keys( result ) ).toHaveLength( 0 );
		} );

		test( 'handles null manifest', () => {
			const manifest = null;
			const currentFiles = new Set( [ 'site-key/static/index.html' ] );

			const result = cleanupManifest( manifest, currentFiles );

			expect( result ).toEqual( {} );
		} );

		test( 'handles null currentFiles', () => {
			const manifest = {
				'site-key/static/index.html': { size: 1024, hash: 'hash1' },
			};
			const currentFiles = null;

			const result = cleanupManifest( manifest, currentFiles );

			expect( result ).toEqual( manifest );
		} );

		test( 'handles large manifest with many removals', () => {
			const manifest = {};
			for ( let i = 0; i < 1000; i++ ) {
				manifest[ `site-key/file${ i }.html` ] = {
					size: i * 100,
					hash: `hash${ i }`,
				};
			}

			// Keep only every 10th file
			const currentFiles = new Set();
			for ( let i = 0; i < 1000; i += 10 ) {
				currentFiles.add( `site-key/file${ i }.html` );
			}

			const result = cleanupManifest( manifest, currentFiles );

			expect( Object.keys( result ) ).toHaveLength( 100 );
			expect( result[ 'site-key/file0.html' ] ).toBeDefined();
			expect( result[ 'site-key/file10.html' ] ).toBeDefined();
			expect( result[ 'site-key/file1.html' ] ).toBeUndefined();
		} );

		test( 'preserves entry data for kept files', () => {
			const manifest = {
				'site-key/static/index.html': { size: 1024, hash: 'hash1' },
				'site-key/static/old.html': { size: 512, hash: 'hash2' },
			};

			const currentFiles = new Set( [ 'site-key/static/index.html' ] );

			const result = cleanupManifest( manifest, currentFiles );

			expect( result[ 'site-key/static/index.html' ] ).toEqual( {
				size: 1024,
				hash: 'hash1',
			} );
		} );

		test( 'returns new object, does not mutate original', () => {
			const manifest = {
				'site-key/static/index.html': { size: 1024, hash: 'hash1' },
				'site-key/static/old.html': { size: 512, hash: 'hash2' },
			};

			const currentFiles = new Set( [ 'site-key/static/index.html' ] );

			const result = cleanupManifest( manifest, currentFiles );

			// Original should still have both entries
			expect( Object.keys( manifest ) ).toHaveLength( 2 );
			expect( Object.keys( result ) ).toHaveLength( 1 );
		} );
	} );
} );
