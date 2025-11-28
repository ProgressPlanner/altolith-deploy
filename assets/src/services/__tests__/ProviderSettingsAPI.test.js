/**
 * Provider Settings API Tests
 *
 * Tests for ProviderSettingsAPI service and pure functions.
 * Validates CRUD operations and configuration merging.
 *
 */

import {
	ProviderSettingsAPI,
	mergeProviderConfig,
	mergeMultipleProviders,
} from '../ProviderSettingsAPI';

describe( 'ProviderSettingsAPI', () => {
	describe( 'mergeProviderConfig() - Pure Function', () => {
		test( 'should merge configurations', () => {
			const current = {
				apiKey: 'old-key',
			};

			const updated = {
				apiKey: 'new-key',
				region: 'us-west',
			};

			const result = mergeProviderConfig( current, updated );

			expect( result ).toEqual( {
				apiKey: 'new-key',
				region: 'us-west',
			} );
		} );

		test( 'should handle null/undefined current config', () => {
			const updated = { apiKey: 'new-key' };

			const result1 = mergeProviderConfig( null, updated );
			const result2 = mergeProviderConfig( undefined, updated );

			expect( result1 ).toEqual( { apiKey: 'new-key' } );
			expect( result2 ).toEqual( { apiKey: 'new-key' } );
		} );

		test( 'should handle null/undefined updated config', () => {
			const current = { apiKey: 'old-key' };

			const result1 = mergeProviderConfig( current, null );
			const result2 = mergeProviderConfig( current, undefined );

			expect( result1 ).toEqual( current );
			expect( result2 ).toEqual( current );
		} );
	} );

	describe( 'mergeMultipleProviders() - Pure Function', () => {
		test( 'should merge multiple provider updates', () => {
			const current = {
				'provider-1': { apiKey: 'key1' },
				'provider-2': { apiKey: 'key2' },
			};

			const updates = {
				'provider-1': { apiKey: 'new-key1' },
				'provider-3': { apiKey: 'key3' },
			};

			const result = mergeMultipleProviders( current, updates );

			expect( result ).toEqual( {
				'provider-1': { apiKey: 'new-key1' },
				'provider-2': { apiKey: 'key2' },
				'provider-3': { apiKey: 'key3' },
			} );
		} );

		test( 'should handle null/undefined current providers', () => {
			const updates = {
				'provider-1': { apiKey: 'key1' },
			};

			const result1 = mergeMultipleProviders( null, updates );
			const result2 = mergeMultipleProviders( undefined, updates );

			expect( result1 ).toEqual( {
				'provider-1': { apiKey: 'key1' },
			} );
			expect( result2 ).toEqual( {
				'provider-1': { apiKey: 'key1' },
			} );
		} );

		test( 'should handle null/undefined updates', () => {
			const current = {
				'provider-1': { apiKey: 'key1' },
			};

			const result1 = mergeMultipleProviders( current, null );
			const result2 = mergeMultipleProviders( current, undefined );

			expect( result1 ).toEqual( current );
			expect( result2 ).toEqual( current );
		} );

		test( 'should handle empty updates', () => {
			const current = {
				'provider-1': { apiKey: 'key1' },
			};

			const result = mergeMultipleProviders( current, {} );

			expect( result ).toEqual( current );
		} );

		test( 'should handle non-object updates gracefully', () => {
			const current = {
				'provider-1': { apiKey: 'key1' },
			};

			const result = mergeMultipleProviders( current, 'invalid' );

			expect( result ).toEqual( current );
		} );
	} );

	describe( 'ProviderSettingsAPI - Service Class', () => {
		let api;
		let mockApiFetch;

		beforeEach( () => {
			mockApiFetch = jest.fn();
			api = new ProviderSettingsAPI( mockApiFetch );
		} );

		describe( 'fetchAll()', () => {
			test( 'should fetch all provider settings', async () => {
				const mockProviders = {
					'provider-1': { apiKey: 'key1' },
					'provider-2': { apiKey: 'key2' },
				};

				mockApiFetch.mockResolvedValue( {
					success: true,
					value: mockProviders,
				} );

				const result = await api.fetchAll();

				expect( mockApiFetch ).toHaveBeenCalledWith( {
					path: '/altolith/deploy/settings?key=providers',
				} );
				expect( result ).toEqual( mockProviders );
			} );

			test( 'should return empty object if value is missing', async () => {
				mockApiFetch.mockResolvedValue( {
					success: true,
				} );

				const result = await api.fetchAll();

				expect( result ).toEqual( {} );
			} );

			test( 'should throw error on failure', async () => {
				mockApiFetch.mockResolvedValue( {
					success: false,
				} );

				await expect( api.fetchAll() ).rejects.toThrow(
					'Failed to load provider settings'
				);
			} );
		} );

		describe( 'save()', () => {
			test( 'should save provider settings', async () => {
				const providers = {
					'provider-1': { apiKey: 'key1' },
				};

				mockApiFetch.mockResolvedValue( {
					success: true,
				} );

				const result = await api.save( providers );

				expect( mockApiFetch ).toHaveBeenCalledWith( {
					path: '/altolith/deploy/settings',
					method: 'POST',
					data: {
						key: 'providers',
						value: providers,
					},
				} );
				expect( result ).toEqual( providers );
			} );

			test( 'should throw error on failure', async () => {
				mockApiFetch.mockResolvedValue( {
					success: false,
				} );

				await expect( api.save( {} ) ).rejects.toThrow(
					'Failed to save provider settings'
				);
			} );
		} );

		describe( 'update()', () => {
			test( 'should update single provider configuration', async () => {
				const currentProviders = {
					'provider-1': { apiKey: 'old-key' },
				};

				mockApiFetch
					.mockResolvedValueOnce( {
						success: true,
						value: currentProviders,
					} )
					.mockResolvedValueOnce( {
						success: true,
					} );

				const result = await api.update( 'provider-1', {
					apiKey: 'new-key',
				} );

				expect( result ).toEqual( {
					'provider-1': { apiKey: 'new-key' },
				} );
			} );
		} );

		describe( 'updateMultiple()', () => {
			test( 'should update multiple providers', async () => {
				const currentProviders = {
					'provider-1': { apiKey: 'key1' },
					'provider-2': { apiKey: 'key2' },
				};

				mockApiFetch
					.mockResolvedValueOnce( {
						success: true,
						value: currentProviders,
					} )
					.mockResolvedValueOnce( {
						success: true,
					} );

				const updates = {
					'provider-1': { apiKey: 'new-key1' },
					'provider-3': { apiKey: 'key3' },
				};

				const result = await api.updateMultiple( updates );

				expect( result ).toEqual( {
					'provider-1': { apiKey: 'new-key1' },
					'provider-2': { apiKey: 'key2' },
					'provider-3': { apiKey: 'key3' },
				} );
			} );
		} );

		describe( 'createInstance()', () => {
			test( 'should create provider instance', async () => {
				mockApiFetch.mockResolvedValue( {
					success: true,
					instanceId: 'local-filesystem:123',
				} );

				const result = await api.createInstance(
					'local-filesystem:123',
					'local-filesystem',
					'My Local Instance'
				);

				expect( mockApiFetch ).toHaveBeenCalledWith( {
					path: '/altolith/deploy/providers/local-filesystem/instances',
					method: 'POST',
					data: {
						instance_id: 'local-filesystem:123',
						instance_name: 'My Local Instance',
					},
				} );
				expect( result.success ).toBe( true );
			} );

			test( 'should throw error on failure', async () => {
				mockApiFetch.mockResolvedValue( {
					success: false,
				} );

				await expect(
					api.createInstance( 'id', 'type', 'name' )
				).rejects.toThrow( 'Failed to create provider instance' );
			} );
		} );

		describe( 'renameInstance()', () => {
			test( 'should rename provider instance', async () => {
				const currentProviders = {
					'provider-1': { instance_name: 'Old Name' },
				};

				mockApiFetch
					.mockResolvedValueOnce( {
						success: true,
						value: currentProviders,
					} )
					.mockResolvedValueOnce( {
						success: true,
					} );

				const result = await api.renameInstance(
					'provider-1',
					'New Name'
				);

				expect( result[ 'provider-1' ].instance_name ).toBe(
					'New Name'
				);
			} );
		} );

		describe( 'deleteInstance()', () => {
			test( 'should delete provider instance', async () => {
				const updatedProviders = {
					'provider-2': { apiKey: 'key2' },
				};

				mockApiFetch
					.mockResolvedValueOnce( { success: true } ) // DELETE
					.mockResolvedValueOnce( {
						// fetchAll
						success: true,
						value: updatedProviders,
					} );

				const result = await api.deleteInstance( 'provider-1' );

				expect( mockApiFetch ).toHaveBeenCalledWith( {
					path: '/altolith/deploy/providers/provider-1/config',
					method: 'DELETE',
				} );
				expect( result ).toEqual( updatedProviders );
			} );
		} );
	} );
} );
