/**
 * Static Site Config Tests
 *
 */

import {
	buildStorageConfig,
	calculateTotalFiles,
	buildUploadResult,
	createFailureTracker,
} from '../staticSiteConfig';

describe( 'staticSiteConfig', () => {
	describe( 'buildStorageConfig()', () => {
		test( 'should build config with all parameters', () => {
			const config = buildStorageConfig(
				'https://wordpress.local',
				'https://static.example.com',
				'cloudflare-r2'
			);

			expect( config.public_url ).toBe( 'https://wordpress.local' );
			expect( config.base_url ).toBe( 'https://static.example.com' );
			expect( config.provider_id ).toBe( 'cloudflare-r2' );
		} );

		test( 'should use siteUrl as base_url when staticSiteUrl is null', () => {
			const config = buildStorageConfig(
				'https://wordpress.local',
				null,
				'local-filesystem'
			);

			expect( config.base_url ).toBe( 'https://wordpress.local' );
		} );

		test( 'should use siteUrl as base_url when staticSiteUrl is empty', () => {
			const config = buildStorageConfig(
				'https://wordpress.local',
				'',
				'local-filesystem'
			);

			expect( config.base_url ).toBe( 'https://wordpress.local' );
		} );
	} );

	describe( 'calculateTotalFiles()', () => {
		test( 'should sum HTML and asset counts', () => {
			expect( calculateTotalFiles( 50, 200 ) ).toBe( 250 );
		} );

		test( 'should handle zero values', () => {
			expect( calculateTotalFiles( 0, 0 ) ).toBe( 0 );
			expect( calculateTotalFiles( 10, 0 ) ).toBe( 10 );
			expect( calculateTotalFiles( 0, 25 ) ).toBe( 25 );
		} );
	} );

	describe( 'createFailureTracker()', () => {
		test( 'should create tracker with default values', () => {
			const tracker = createFailureTracker();

			expect( tracker.urlsFailed ).toBe( 0 );
			expect( tracker.urlsSucceeded ).toBe( 0 );
			expect( tracker.assetsFailed ).toBe( 0 );
			expect( tracker.failedUrls ).toEqual( [] );
		} );

		test( 'should be mutable', () => {
			const tracker = createFailureTracker();

			tracker.urlsFailed = 5;
			tracker.urlsSucceeded = 95;
			tracker.failedUrls.push( '/error-page' );

			expect( tracker.urlsFailed ).toBe( 5 );
			expect( tracker.urlsSucceeded ).toBe( 95 );
			expect( tracker.failedUrls ).toContain( '/error-page' );
		} );
	} );

	describe( 'buildUploadResult()', () => {
		test( 'should build successful result when no failures', () => {
			const failures = {
				urlsFailed: 0,
				urlsSucceeded: 100,
				assetsFailed: 0,
				failedUrls: [],
			};

			const mockAssetTracker = { getCount: () => 250 };

			const result = buildUploadResult(
				failures,
				mockAssetTracker,
				350,
				10,
				360,
				[ { path: '/index.html' } ],
				100
			);

			expect( result.success ).toBe( true );
			expect( result.urlsProcessed ).toBe( 100 );
			expect( result.urlsSucceeded ).toBe( 100 );
			expect( result.urlsFailed ).toBe( 0 );
			expect( result.assetsUploaded ).toBe( 250 );
			expect( result.assetsFailed ).toBe( 0 );
			expect( result.filesUploaded ).toBe( 350 );
			expect( result.filesSkipped ).toBe( 10 );
			expect( result.totalFilesToUpload ).toBe( 360 );
		} );

		test( 'should build failed result when there are failures', () => {
			const failures = {
				urlsFailed: 3,
				urlsSucceeded: 97,
				assetsFailed: 2,
				failedUrls: [ '/error1', '/error2', '/error3' ],
			};

			const mockAssetTracker = { getCount: () => 198 };

			const result = buildUploadResult(
				failures,
				mockAssetTracker,
				295,
				5,
				300,
				[],
				100
			);

			expect( result.success ).toBe( false );
			expect( result.urlsFailed ).toBe( 3 );
			expect( result.assetsFailed ).toBe( 2 );
			expect( result.failedUrls ).toHaveLength( 3 );
		} );

		test( 'should include uploadedFiles array', () => {
			const failures = createFailureTracker();
			const mockAssetTracker = { getCount: () => 10 };
			const uploadedFiles = [
				{ path: '/index.html', size: 1024 },
				{ path: '/about/index.html', size: 2048 },
			];

			const result = buildUploadResult(
				failures,
				mockAssetTracker,
				12,
				0,
				12,
				uploadedFiles,
				10
			);

			expect( result.uploadedFiles ).toHaveLength( 2 );
			expect( result.uploadedFiles[ 0 ].path ).toBe( '/index.html' );
		} );
	} );
} );
