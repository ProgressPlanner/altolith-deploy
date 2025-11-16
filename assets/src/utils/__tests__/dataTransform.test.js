/**
 * Data Transform Utilities Tests
 *
 * Comprehensive tests for data transformation utilities.
 *
 * @package
 */

import { flattenSettings, unflattenSettings } from '../dataTransform';

describe( 'flattenSettings', () => {
	test( 'should flatten edge provider configuration', () => {
		const settings = {
			provider_types: {
				edge: 'cloudflare',
			},
			providers: {
				cloudflare: {
					account_id: 'test-account',
					api_token: 'test-token',
				},
			},
		};

		const flattened = flattenSettings( settings );

		expect( flattened.edgeProvider ).toBe( 'cloudflare' );
		expect( flattened.account_id ).toBe( 'test-account' );
		expect( flattened.api_token ).toBe( 'test-token' );
	} );

	test( 'should skip encrypted values', () => {
		const settings = {
			provider_types: {
				edge: 'cloudflare',
			},
			providers: {
				cloudflare: {
					api_token: 'encrypted:secret-value',
				},
			},
		};

		const flattened = flattenSettings( settings );

		expect( flattened.api_token ).toBeUndefined();
	} );

	test( 'should flatten storage provider configuration', () => {
		const settings = {
			activeProvider: 'cloudflare-r2',
			providers: {
				'cloudflare-r2': {
					bucket_name: 'test-bucket',
					access_key_id: 'test-key',
					secret_access_key: 'test-secret',
				},
			},
		};

		const flattened = flattenSettings( settings );

		expect( flattened.storageProvider ).toBe( 'cloudflare-r2' );
		expect( flattened.bucket_name ).toBe( 'test-bucket' );
		expect( flattened.access_key_id ).toBe( 'test-key' );
		expect( flattened.secret_access_key ).toBe( 'test-secret' );
	} );

	test( 'should flatten media configuration with prefix', () => {
		const settings = {
			media: {
				enabled: true,
				provider: 'cloudflare-r2',
			},
		};

		const flattened = flattenSettings( settings );

		expect( flattened.mediaEnabled ).toBe( true );
		expect( flattened.mediaProvider ).toBe( 'cloudflare-r2' );
	} );

	test( 'should handle empty settings', () => {
		const flattened = flattenSettings( {} );
		expect( flattened ).toEqual( {} );
	} );

	test( 'should handle nested empty objects', () => {
		const settings = {
			provider_types: {},
			providers: {},
			media: {},
		};

		const flattened = flattenSettings( settings );
		expect( flattened ).toEqual( {} );
	} );
} );

describe( 'unflattenSettings', () => {
	test( 'should unflatten edge provider configuration', () => {
		const flattened = {
			edgeProvider: 'cloudflare',
			account_id: 'test-account',
			api_token: 'test-token',
		};

		const settings = unflattenSettings( flattened );

		expect( settings.provider_types.edge ).toBe( 'cloudflare' );
		expect( settings.providers.cloudflare.account_id ).toBe(
			'test-account'
		);
		expect( settings.providers.cloudflare.api_token ).toBe( 'test-token' );
	} );

	test( 'should unflatten storage provider configuration', () => {
		const flattened = {
			storageProvider: 'cloudflare-r2',
			bucket_name: 'test-bucket',
			access_key_id: 'test-key',
		};

		const settings = unflattenSettings( flattened );

		expect( settings.activeProvider ).toBe( 'cloudflare-r2' );
		expect( settings.usage.blueprintProvider ).toBe( 'cloudflare-r2' );
		expect( settings.providers[ 'cloudflare-r2' ].bucket_name ).toBe(
			'test-bucket'
		);
		expect( settings.providers[ 'cloudflare-r2' ].access_key_id ).toBe(
			'test-key'
		);
	} );

	test( 'should unflatten media configuration', () => {
		const flattened = {
			mediaEnabled: true,
			mediaProvider: 'cloudflare-r2',
		};

		const settings = unflattenSettings( flattened );

		expect( settings.media.enabled ).toBe( true );
		expect( settings.media.provider ).toBe( 'cloudflare-r2' );
	} );

	test( 'should exclude edge provider keys from storage provider', () => {
		const flattened = {
			storageProvider: 'cloudflare-r2',
			bucket_name: 'test-bucket',
			account_id: 'edge-account', // Should not be in storage provider
			api_token: 'edge-token', // Should not be in storage provider
		};

		const settings = unflattenSettings( flattened );

		expect( settings.providers[ 'cloudflare-r2' ].bucket_name ).toBe(
			'test-bucket'
		);
		expect(
			settings.providers[ 'cloudflare-r2' ].account_id
		).toBeUndefined();
		expect(
			settings.providers[ 'cloudflare-r2' ].api_token
		).toBeUndefined();
	} );

	test( 'should handle empty flattened settings', () => {
		const settings = unflattenSettings( {} );

		expect( settings ).toEqual( {
			providers: {},
			media: {},
			usage: {},
			provider_types: {},
		} );
	} );

	test( 'should round-trip flatten and unflatten', () => {
		const original = {
			provider_types: {
				edge: 'cloudflare',
			},
			providers: {
				cloudflare: {
					account_id: 'test-account',
				},
				'cloudflare-r2': {
					bucket_name: 'test-bucket',
				},
			},
			activeProvider: 'cloudflare-r2',
			media: {
				enabled: true,
			},
		};

		const flattened = flattenSettings( original );
		const unflattened = unflattenSettings( flattened );

		expect( unflattened.provider_types.edge ).toBe(
			original.provider_types.edge
		);
		expect( unflattened.providers.cloudflare.account_id ).toBe(
			original.providers.cloudflare.account_id
		);
		expect( unflattened.activeProvider ).toBe( original.activeProvider );
		expect( unflattened.providers[ 'cloudflare-r2' ].bucket_name ).toBe(
			original.providers[ 'cloudflare-r2' ].bucket_name
		);
		expect( unflattened.media.enabled ).toBe( original.media.enabled );
	} );
} );
