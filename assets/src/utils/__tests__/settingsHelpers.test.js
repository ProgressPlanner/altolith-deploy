/**
 * Settings Helper Utilities Tests
 *
 * @package
 */

import {
	getProviderSettings,
	updateProviderSettings,
} from '../settingsHelpers';

describe( 'settingsHelpers', () => {
	describe( 'getProviderSettings', () => {
		test( 'returns provider settings from full settings object', () => {
			const settings = {
				providers: {
					'cloudflare-r2': {
						bucket_name: 'my-bucket',
						access_key_id: 'key123',
					},
					gitlab: {
						project_id: '123',
					},
				},
			};

			const result = getProviderSettings( settings, 'cloudflare-r2' );

			expect( result ).toEqual( {
				bucket_name: 'my-bucket',
				access_key_id: 'key123',
			} );
		} );

		test( 'returns empty object when provider not found', () => {
			const settings = {
				providers: {
					'cloudflare-r2': {
						bucket_name: 'my-bucket',
					},
				},
			};

			const result = getProviderSettings( settings, 'gitlab' );

			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object when providers object missing', () => {
			const settings = {};

			const result = getProviderSettings( settings, 'cloudflare-r2' );

			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object when settings is null', () => {
			const result = getProviderSettings( null, 'cloudflare-r2' );

			expect( result ).toEqual( {} );
		} );

		test( 'returns empty object when settings is undefined', () => {
			const result = getProviderSettings( undefined, 'cloudflare-r2' );

			expect( result ).toEqual( {} );
		} );
	} );

	describe( 'updateProviderSettings', () => {
		test( 'updates provider settings in full settings object', () => {
			const allSettings = {
				providers: {
					'cloudflare-r2': {
						bucket_name: 'old-bucket',
					},
					gitlab: {
						project_id: '123',
					},
				},
			};

			const providerSettings = {
				bucket_name: 'new-bucket',
				access_key_id: 'key123',
			};

			const result = updateProviderSettings(
				allSettings,
				'cloudflare-r2',
				providerSettings
			);

			expect( result.providers[ 'cloudflare-r2' ] ).toEqual(
				providerSettings
			);
			expect( result.providers.gitlab ).toEqual( { project_id: '123' } );
			expect( result._saveKey ).toBe( 'providers' );
			expect( result._saveValue ).toEqual( result.providers );
		} );

		test( 'creates providers object if it does not exist', () => {
			const allSettings = {};

			const providerSettings = {
				bucket_name: 'my-bucket',
			};

			const result = updateProviderSettings(
				allSettings,
				'cloudflare-r2',
				providerSettings
			);

			expect( result.providers ).toEqual( {
				'cloudflare-r2': providerSettings,
			} );
			expect( result._saveKey ).toBe( 'providers' );
			expect( result._saveValue ).toEqual( result.providers );
		} );

		test( 'preserves other settings in allSettings', () => {
			const allSettings = {
				otherSetting: 'value',
				providers: {
					gitlab: { project_id: '123' },
				},
			};

			const providerSettings = {
				bucket_name: 'my-bucket',
			};

			const result = updateProviderSettings(
				allSettings,
				'cloudflare-r2',
				providerSettings
			);

			expect( result.otherSetting ).toBe( 'value' );
			expect( result.providers.gitlab ).toEqual( { project_id: '123' } );
		} );

		test( 'sets _saveKey and _saveValue correctly', () => {
			const allSettings = {
				providers: {},
			};

			const providerSettings = {
				bucket_name: 'my-bucket',
			};

			const result = updateProviderSettings(
				allSettings,
				'cloudflare-r2',
				providerSettings
			);

			expect( result._saveKey ).toBe( 'providers' );
			expect( result._saveValue ).toEqual( {
				'cloudflare-r2': providerSettings,
			} );
		} );
	} );
} );
