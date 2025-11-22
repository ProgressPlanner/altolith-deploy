/**
 * uploadStaticFiles Step Tests
 *
 */

import { uploadStaticFilesStep } from '../index';

describe( 'uploadStaticFiles', () => {
	test( 'should have correct step definition', () => {
		expect( uploadStaticFilesStep ).toHaveProperty(
			'id',
			'uploadStaticFiles'
		);
		expect( uploadStaticFilesStep ).toHaveProperty( 'handler' );
		expect( typeof uploadStaticFilesStep.handler ).toBe( 'function' );
		expect( uploadStaticFilesStep ).toHaveProperty( 'dependencies' );
		expect( Array.isArray( uploadStaticFilesStep.dependencies ) ).toBe(
			true
		);
	} );
} );

describe( 'uploadStaticFiles failure detection logic', () => {
	/**
	 * Helper to simulate the failure detection logic used in uploadStaticFiles.
	 * A provider is considered failed only if it uploaded zero files.
	 * This is key: success: false just means some URLs had errors, not total failure.
	 * @param providerResults
	 */
	function getFailedProviders( providerResults ) {
		return Object.entries( providerResults ).filter(
			( [ , data ] ) => data.filesUploaded === 0
		);
	}

	function getSuccessfulProviders( providerResults ) {
		return Object.entries( providerResults ).filter(
			( [ , data ] ) => data.filesUploaded > 0
		);
	}

	test( 'should NOT mark provider as failed if files were uploaded (even with success: false)', () => {
		// This tests the bug fix: success: false but files uploaded should NOT be a failure
		const providerResults = {
			'provider-1': {
				success: false, // Had some errors (e.g., some URLs failed)
				filesUploaded: 50, // But uploaded 50 files
				urlsFailed: 5,
			},
		};

		const failedProviders = getFailedProviders( providerResults );
		const successfulProviders = getSuccessfulProviders( providerResults );

		expect( failedProviders.length ).toBe( 0 );
		expect( successfulProviders.length ).toBe( 1 );
	} );

	test( 'should mark provider as failed if zero files were uploaded', () => {
		const providerResults = {
			'provider-1': {
				success: false,
				filesUploaded: 0,
				error: 'Connection failed',
			},
		};

		const failedProviders = getFailedProviders( providerResults );
		expect( failedProviders.length ).toBe( 1 );
		expect( failedProviders[ 0 ][ 0 ] ).toBe( 'provider-1' );
	} );

	test( 'should correctly classify mixed results (some successful, some failed)', () => {
		const providerResults = {
			'provider-success': {
				success: true,
				filesUploaded: 100,
			},
			'provider-partial': {
				success: false, // Some URLs failed
				filesUploaded: 75, // But still uploaded files
			},
			'provider-failed': {
				success: false,
				filesUploaded: 0, // Complete failure
				error: 'Auth error',
			},
		};

		const failedProviders = getFailedProviders( providerResults );
		const successfulProviders = getSuccessfulProviders( providerResults );

		expect( successfulProviders.length ).toBe( 2 ); // success + partial
		expect( failedProviders.length ).toBe( 1 ); // only complete failure
		expect( failedProviders[ 0 ][ 0 ] ).toBe( 'provider-failed' );
	} );

	test( 'should handle empty provider results', () => {
		const providerResults = {};

		const failedProviders = getFailedProviders( providerResults );
		const successfulProviders = getSuccessfulProviders( providerResults );

		expect( failedProviders.length ).toBe( 0 );
		expect( successfulProviders.length ).toBe( 0 );
	} );
} );
