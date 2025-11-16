/**
 * Provider Config Isolation Integration Tests
 *
 * Tests to ensure that saving one provider's config doesn't affect other providers.
 *
 * @package
 */

import { CloudflareR2Provider } from '../cloudflare-r2/CloudflareR2Provider';
import { CloudflareWorkersProvider } from '../cloudflare/CloudflareWorkersProvider';

describe( 'Provider Config Isolation Integration', () => {
	let r2Provider;
	let edgeProvider;
	let mockR2Storage;
	let mockEdgeStorage;

	beforeEach( () => {
		r2Provider = new CloudflareR2Provider();
		edgeProvider = new CloudflareWorkersProvider();

		// Mock ConfigStorage for R2 provider
		mockR2Storage = {
			load: jest.fn(),
			save: jest.fn().mockResolvedValue( true ),
		};
		r2Provider.getConfigStorage = jest
			.fn()
			.mockResolvedValue( mockR2Storage );

		// Mock ConfigStorage for Edge provider
		mockEdgeStorage = {
			load: jest.fn(),
			save: jest.fn().mockResolvedValue( true ),
		};
		edgeProvider.getConfigStorage = jest
			.fn()
			.mockResolvedValue( mockEdgeStorage );

		jest.clearAllMocks();
	} );

	test( 'saving Cloudflare R2 config does not include edge provider fields', async () => {
		// Set up edge provider with credentials
		mockEdgeStorage.load.mockResolvedValue( {
			account_id: '12345678901234567890123456789012',
			api_token: 'edge-api-token-secret-1234567890',
		} );

		// Load edge provider config
		const edgeConfig = await edgeProvider.getConfig();
		expect( edgeConfig.account_id ).toBe(
			'12345678901234567890123456789012'
		);
		expect( edgeConfig.api_token ).toBe(
			'edge-api-token-secret-1234567890'
		);

		// Set up R2 provider config (with edge fields accidentally included)
		mockR2Storage.load.mockResolvedValue( {
			cloudflare_account_id: '12345678901234567890123456789012',
			bucket_name: 'my-bucket',
			access_key_id: 'r2-access-key-1234567890123456',
			secret_access_key: 'r2-secret-key-12345678901234567890123456789012',
			// These should NOT be in R2 config
			account_id: '12345678901234567890123456789012',
			api_token: 'edge-api-token-secret-1234567890',
		} );

		// Load R2 config
		const r2Config = await r2Provider.getConfig();

		// Save R2 config (should filter out edge fields)
		await r2Provider.saveConfig( r2Config );

		// Verify saved config only contains R2 fields
		expect( mockR2Storage.save ).toHaveBeenCalled();
		const savedConfig = mockR2Storage.save.mock.calls[ 0 ][ 0 ];
		expect( savedConfig ).toHaveProperty( 'cloudflare_account_id' );
		expect( savedConfig ).toHaveProperty( 'bucket_name' );
		expect( savedConfig ).toHaveProperty( 'access_key_id' );
		expect( savedConfig ).toHaveProperty( 'secret_access_key' );
		expect( savedConfig ).not.toHaveProperty( 'account_id' );
		expect( savedConfig ).not.toHaveProperty( 'api_token' );
	} );

	test( 'edge provider config remains intact after saving R2 config', async () => {
		// Set up edge provider with credentials
		const edgeCredentials = {
			account_id: '12345678901234567890123456789012',
			api_token: 'edge-api-token-secret-1234567890',
		};
		mockEdgeStorage.load.mockResolvedValue( edgeCredentials );

		// Load edge provider config
		const edgeConfigBefore = await edgeProvider.getConfig();
		expect( edgeConfigBefore.account_id ).toBe(
			edgeCredentials.account_id
		);
		expect( edgeConfigBefore.api_token ).toBe( edgeCredentials.api_token );

		// Save R2 provider config
		const r2Config = {
			cloudflare_account_id: '12345678901234567890123456789012',
			bucket_name: 'my-bucket',
			access_key_id: 'r2-access-key-1234567890123456',
			secret_access_key: 'r2-secret-key-12345678901234567890123456789012',
		};
		mockR2Storage.load.mockResolvedValue( r2Config );
		await r2Provider.saveConfig( r2Config );

		// Verify edge provider config is still intact
		const edgeConfigAfter = await edgeProvider.getConfig();
		expect( edgeConfigAfter.account_id ).toBe( edgeCredentials.account_id );
		expect( edgeConfigAfter.api_token ).toBe( edgeCredentials.api_token );
	} );

	test( 'R2 provider getConfigFields() does not include edge provider fields', () => {
		const r2Fields = r2Provider.getConfigFields();
		const fieldIds = r2Fields.map( ( field ) => field.id );

		expect( fieldIds ).toContain( 'cloudflare_account_id' );
		expect( fieldIds ).toContain( 'bucket_name' );
		expect( fieldIds ).toContain( 'access_key_id' );
		expect( fieldIds ).toContain( 'secret_access_key' );
		expect( fieldIds ).not.toContain( 'account_id' );
		expect( fieldIds ).not.toContain( 'api_token' );
	} );

	test( 'Edge provider getConfigFields() does not include R2 provider fields', () => {
		const edgeFields = edgeProvider.getConfigFields();
		const fieldIds = edgeFields.map( ( field ) => field.id );

		expect( fieldIds ).toContain( 'account_id' );
		expect( fieldIds ).toContain( 'api_token' );
		expect( fieldIds ).not.toContain( 'cloudflare_account_id' );
		expect( fieldIds ).not.toContain( 'bucket_name' );
		expect( fieldIds ).not.toContain( 'access_key_id' );
		expect( fieldIds ).not.toContain( 'secret_access_key' );
	} );
} );
