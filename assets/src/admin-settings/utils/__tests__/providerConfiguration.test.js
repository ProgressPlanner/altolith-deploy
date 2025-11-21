/**
 * Provider Configuration Tests
 *
 * @package
 */

import { isProviderConfigured } from '../providerConfiguration';

describe( 'providerConfiguration', () => {
	describe( 'isProviderConfigured()', () => {
		test( 'should return false for null settings fields', () => {
			expect( isProviderConfigured( null, {} ) ).toBe( false );
		} );

		test( 'should return false for non-array settings fields', () => {
			expect( isProviderConfigured( 'not-array', {} ) ).toBe( false );
		} );

		test( 'should return false for null config', () => {
			expect( isProviderConfigured( [], null ) ).toBe( false );
		} );

		test( 'should return false for non-object config', () => {
			expect( isProviderConfigured( [], 'not-object' ) ).toBe( false );
		} );

		test( 'should return true when no required fields exist', () => {
			const fields = [
				{ name: 'optional_field', required: false },
				{ name: 'another_field' },
			];
			expect( isProviderConfigured( fields, {} ) ).toBe( true );
		} );

		test( 'should return true when all required fields have values', () => {
			const fields = [
				{ name: 'api_key', required: true },
				{ name: 'bucket_name', required: true },
			];
			const config = {
				api_key: 'my-key',
				bucket_name: 'my-bucket',
			};
			expect( isProviderConfigured( fields, config ) ).toBe( true );
		} );

		test( 'should return false when required field is missing', () => {
			const fields = [
				{ name: 'api_key', required: true },
				{ name: 'bucket_name', required: true },
			];
			const config = {
				api_key: 'my-key',
			};
			expect( isProviderConfigured( fields, config ) ).toBe( false );
		} );

		test( 'should return false when required field is empty string', () => {
			const fields = [ { name: 'api_key', required: true } ];
			const config = { api_key: '' };
			expect( isProviderConfigured( fields, config ) ).toBe( false );
		} );

		test( 'should return false when required field is whitespace only', () => {
			const fields = [ { name: 'api_key', required: true } ];
			const config = { api_key: '   ' };
			expect( isProviderConfigured( fields, config ) ).toBe( false );
		} );

		test( 'should return false when required field is null', () => {
			const fields = [ { name: 'api_key', required: true } ];
			const config = { api_key: null };
			expect( isProviderConfigured( fields, config ) ).toBe( false );
		} );

		test( 'should return false when required field is empty array', () => {
			const fields = [ { name: 'urls', required: true } ];
			const config = { urls: [] };
			expect( isProviderConfigured( fields, config ) ).toBe( false );
		} );

		test( 'should return false when required field is empty object', () => {
			const fields = [ { name: 'settings', required: true } ];
			const config = { settings: {} };
			expect( isProviderConfigured( fields, config ) ).toBe( false );
		} );

		test( 'should return true when required field has non-empty array', () => {
			const fields = [ { name: 'urls', required: true } ];
			const config = { urls: [ 'https://example.com' ] };
			expect( isProviderConfigured( fields, config ) ).toBe( true );
		} );

		test( 'should support field.id as alternative to field.name', () => {
			const fields = [ { id: 'api_key', required: true } ];
			const config = { api_key: 'my-key' };
			expect( isProviderConfigured( fields, config ) ).toBe( true );
		} );

		test( 'should skip fields without name or id', () => {
			const fields = [
				{ required: true }, // No name or id
				{ name: 'api_key', required: true },
			];
			const config = { api_key: 'my-key' };
			expect( isProviderConfigured( fields, config ) ).toBe( true );
		} );

		test( 'should accept 0 as valid value for required field', () => {
			const fields = [ { name: 'count', required: true } ];
			const config = { count: 0 };
			expect( isProviderConfigured( fields, config ) ).toBe( true );
		} );

		test( 'should accept false as valid value for required field', () => {
			const fields = [ { name: 'enabled', required: true } ];
			const config = { enabled: false };
			expect( isProviderConfigured( fields, config ) ).toBe( true );
		} );
	} );
} );
