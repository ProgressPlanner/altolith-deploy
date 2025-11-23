/**
 * Credential Manager Tests
 *
 */

import { getCredentials } from '../credentialManager';
import apiFetch from '../api';

jest.mock( '../api' );

describe( 'credentialManager', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'getCredentials', () => {
		test( 'fetches credentials from API', async () => {
			const providerId = 'local-filesystem';
			const mockCredentials = {
				access_key_id: 'test-key',
				secret_access_key: 'test-secret',
			};

			apiFetch.mockResolvedValueOnce( {
				success: true,
				config: mockCredentials,
			} );

			const credentials = await getCredentials( providerId );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: `/aether/site-exporter/providers/${ providerId }/config`,
				method: 'GET',
			} );
			expect( credentials ).toEqual( mockCredentials );
		} );

		test( 'throws error on API failure', async () => {
			const providerId = 'local-filesystem';

			apiFetch.mockResolvedValueOnce( {
				success: false,
				error: 'Provider not configured',
			} );

			await expect( getCredentials( providerId ) ).rejects.toThrow(
				'Provider not configured'
			);
		} );

		test( 'throws error when response is missing', async () => {
			const providerId = 'local-filesystem';

			apiFetch.mockResolvedValueOnce( null );

			await expect( getCredentials( providerId ) ).rejects.toThrow(
				'Failed to fetch credentials'
			);
		} );

		test( 'handles empty config', async () => {
			const providerId = 'local-filesystem';

			apiFetch.mockResolvedValueOnce( {
				success: true,
				config: {},
			} );

			const credentials = await getCredentials( providerId );
			expect( credentials ).toEqual( {} );
		} );
	} );
} );
