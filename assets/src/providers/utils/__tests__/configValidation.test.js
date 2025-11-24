/**
 * Configuration Validation Tests
 *
 * Comprehensive test suite for provider configuration validation utilities.
 * Tests field validation, required fields, patterns, lengths, and custom validators.
 *
 */

import { validateFieldValue, validateAllFields } from '../configValidation';

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: jest.fn( ( text ) => text ),
	sprintf: jest.fn( ( format, ...args ) => {
		let result = format;
		// Replace %1$s, %2$d, etc. with positional arguments
		result = result.replace( /%1\$s/g, args[ 0 ] || '' );
		result = result.replace( /%2\$d/g, args[ 1 ] || '' );
		result = result.replace( /%2\$s/g, args[ 1 ] || '' );
		// Also handle simple %s and %d
		args.forEach( ( arg ) => {
			result = result.replace( /%[sd]/, arg );
		} );
		return result;
	} ),
} ) );

describe( 'configValidation', () => {
	// ========================================================================
	// validateFieldValue Tests (CRITICAL)
	// ========================================================================

	describe( 'validateFieldValue', () => {
		it( 'should return error for missing required field', async () => {
			const field = {
				id: 'api_key',
				label: 'API Key',
				required: true,
			};

			const error = await validateFieldValue( '', field, {} );

			expect( error ).toBe( 'API Key is required.' );
		} );

		it( 'should return error for null required field', async () => {
			const field = {
				id: 'api_key',
				label: 'API Key',
				required: true,
			};

			const error = await validateFieldValue( null, field, {} );

			expect( error ).toBe( 'API Key is required.' );
		} );

		it( 'should return error for undefined required field', async () => {
			const field = {
				id: 'api_key',
				label: 'API Key',
				required: true,
			};

			const error = await validateFieldValue( undefined, field, {} );

			expect( error ).toBe( 'API Key is required.' );
		} );

		it( 'should return null for valid required field', async () => {
			const field = {
				id: 'api_key',
				label: 'API Key',
				required: true,
			};

			const error = await validateFieldValue( 'test-key', field, {} );

			expect( error ).toBeNull();
		} );

		it( 'should return null for empty non-required field', async () => {
			const field = {
				id: 'api_key',
				label: 'API Key',
				required: false,
			};

			const error = await validateFieldValue( '', field, {} );

			expect( error ).toBeNull();
		} );

		it( 'should validate pattern - valid value', async () => {
			const field = {
				id: 'email',
				label: 'Email',
				validation: {
					pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
				},
			};

			const error = await validateFieldValue(
				'test@example.com',
				field,
				{}
			);

			expect( error ).toBeNull();
		} );

		it( 'should validate pattern - invalid value', async () => {
			const field = {
				id: 'email',
				label: 'Email',
				validation: {
					pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
				},
			};

			const error = await validateFieldValue(
				'invalid-email',
				field,
				{}
			);

			expect( error ).toBe( 'Email format is invalid.' );
		} );

		it( 'should use custom error message for pattern validation', async () => {
			const field = {
				id: 'url',
				label: 'URL',
				validation: {
					pattern: /^https?:\/\/.+/,
					message: 'Must be a valid HTTP or HTTPS URL',
				},
			};

			const error = await validateFieldValue(
				'ftp://example.com',
				field,
				{}
			);

			expect( error ).toBe( 'Must be a valid HTTP or HTTPS URL' );
		} );

		it( 'should validate minLength - valid', async () => {
			const field = {
				id: 'password',
				label: 'Password',
				validation: {
					minLength: 8,
				},
			};

			const error = await validateFieldValue( '12345678', field, {} );

			expect( error ).toBeNull();
		} );

		it( 'should validate minLength - too short', async () => {
			const field = {
				id: 'password',
				label: 'Password',
				validation: {
					minLength: 8,
				},
			};

			const error = await validateFieldValue( '1234', field, {} );

			expect( error ).toBe( 'Password must be at least 8 characters.' );
		} );

		it( 'should validate maxLength - valid', async () => {
			const field = {
				id: 'username',
				label: 'Username',
				validation: {
					maxLength: 20,
				},
			};

			const error = await validateFieldValue( 'user123', field, {} );

			expect( error ).toBeNull();
		} );

		it( 'should validate maxLength - too long', async () => {
			const field = {
				id: 'username',
				label: 'Username',
				validation: {
					maxLength: 20,
				},
			};

			const error = await validateFieldValue(
				'this-username-is-way-too-long',
				field,
				{}
			);

			expect( error ).toBe(
				'Username must be no more than 20 characters.'
			);
		} );

		it( 'should call custom validator callback', async () => {
			const customValidator = jest.fn().mockResolvedValue( null );
			const field = {
				id: 'custom',
				label: 'Custom Field',
				validation: {
					callback: customValidator,
				},
			};
			const config = { other_field: 'value' };

			await validateFieldValue( 'test', field, config );

			expect( customValidator ).toHaveBeenCalledWith( 'test', config );
		} );

		it( 'should return error from custom validator', async () => {
			const customValidator = jest
				.fn()
				.mockResolvedValue( 'Custom validation failed' );
			const field = {
				id: 'custom',
				label: 'Custom Field',
				validation: {
					callback: customValidator,
				},
			};

			const error = await validateFieldValue( 'test', field, {} );

			expect( error ).toBe( 'Custom validation failed' );
		} );

		it( 'should handle custom validator returning non-string', async () => {
			const customValidator = jest.fn().mockResolvedValue( true );
			const field = {
				id: 'custom',
				label: 'Custom Field',
				validation: {
					callback: customValidator,
				},
			};

			const error = await validateFieldValue( 'test', field, {} );

			expect( error ).toBeNull();
		} );

		it( 'should validate multiple rules together', async () => {
			const field = {
				id: 'api_key',
				label: 'API Key',
				required: true,
				validation: {
					pattern: /^[A-Z0-9]{32}$/,
					minLength: 32,
					maxLength: 32,
				},
			};

			const error = await validateFieldValue(
				'ABCD1234EFGH5678IJKL9012MNOP3456',
				field,
				{}
			);

			expect( error ).toBeNull();
		} );

		it( 'should return first error when multiple rules fail', async () => {
			const field = {
				id: 'api_key',
				label: 'API Key',
				required: true,
				validation: {
					pattern: /^[A-Z0-9]{32}$/,
					minLength: 32,
				},
			};

			const error = await validateFieldValue( 'short', field, {} );

			// Pattern check happens before length check
			expect( error ).toBe( 'API Key format is invalid.' );
		} );
	} );

	// ========================================================================
	// validateAllFields Tests (HIGH)
	// ========================================================================

	describe( 'validateAllFields', () => {
		it( 'should return empty object for valid config', async () => {
			const config = {
				api_key: 'test-key',
				email: 'test@example.com',
			};
			const fields = [
				{ id: 'api_key', label: 'API Key', required: true },
				{ id: 'email', label: 'Email', required: false },
			];

			const errors = await validateAllFields( config, fields );

			expect( errors ).toEqual( {} );
		} );

		it( 'should collect errors for multiple fields', async () => {
			const config = {
				api_key: '',
				email: 'invalid-email',
			};
			const fields = [
				{ id: 'api_key', label: 'API Key', required: true },
				{
					id: 'email',
					label: 'Email',
					validation: {
						pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
					},
				},
			];

			const errors = await validateAllFields( config, fields );

			expect( errors.api_key ).toBe( 'API Key is required.' );
			expect( errors.email ).toBe( 'Email format is invalid.' );
		} );

		it( 'should validate empty config', async () => {
			const config = {};
			const fields = [
				{ id: 'api_key', label: 'API Key', required: true },
				{ id: 'email', label: 'Email', required: true },
			];

			const errors = await validateAllFields( config, fields );

			expect( errors.api_key ).toBe( 'API Key is required.' );
			expect( errors.email ).toBe( 'Email is required.' );
		} );

		it( 'should only return errors for invalid fields', async () => {
			const config = {
				field1: 'valid',
				field2: '',
				field3: 'valid',
			};
			const fields = [
				{ id: 'field1', label: 'Field 1', required: false },
				{ id: 'field2', label: 'Field 2', required: true },
				{ id: 'field3', label: 'Field 3', required: false },
			];

			const errors = await validateAllFields( config, fields );

			expect( Object.keys( errors ) ).toHaveLength( 1 );
			expect( errors.field2 ).toBe( 'Field 2 is required.' );
		} );

		it( 'should handle empty fields array', async () => {
			const config = { api_key: 'test' };
			const fields = [];

			const errors = await validateAllFields( config, fields );

			expect( errors ).toEqual( {} );
		} );
	} );
} );
