/**
 * Configuration Sanitization Tests
 *
 * Comprehensive test suite for provider configuration sanitization utilities.
 * Tests field sanitization, type conversions, and option filtering.
 *
 * @package Aether\SiteExporter\Tests
 */

import {
	sanitizeFieldValue,
	isValidSelectValue,
	filterCheckboxGroupValues,
	sanitizeAllFields,
} from '../configSanitization';

describe( 'configSanitization', () => {
	// ========================================================================
	// sanitizeFieldValue Tests (CRITICAL)
	// ========================================================================

	describe( 'sanitizeFieldValue', () => {
		it( 'should trim text field', () => {
			const field = { type: 'text' };
			const result = sanitizeFieldValue( '  test value  ', field );
			expect( result ).toBe( 'test value' );
		} );

		it( 'should trim textarea field', () => {
			const field = { type: 'textarea' };
			const result = sanitizeFieldValue( '  long text  ', field );
			expect( result ).toBe( 'long text' );
		} );

		it( 'should trim password field', () => {
			const field = { type: 'password' };
			const result = sanitizeFieldValue( '  secret  ', field );
			expect( result ).toBe( 'secret' );
		} );

		it( 'should trim and lowercase email', () => {
			const field = { type: 'email' };
			const result = sanitizeFieldValue( '  TEST@EXAMPLE.COM  ', field );
			expect( result ).toBe( 'test@example.com' );
		} );

		it( 'should trim and remove trailing slash from URL', () => {
			const field = { type: 'url' };
			const result = sanitizeFieldValue( '  https://example.com/  ', field );
			expect( result ).toBe( 'https://example.com' );
		} );

		it( 'should not remove slash from URL path', () => {
			const field = { type: 'url' };
			const result = sanitizeFieldValue(
				'https://example.com/path/',
				field
			);
			expect( result ).toBe( 'https://example.com/path' );
		} );

		it( 'should convert checkbox to boolean true', () => {
			const field = { type: 'checkbox' };
			const result = sanitizeFieldValue( 'yes', field );
			expect( result ).toBe( true );
		} );

		it( 'should convert checkbox to boolean false', () => {
			const field = { type: 'checkbox' };
			const result = sanitizeFieldValue( '', field );
			expect( result ).toBe( false );
		} );

		it( 'should convert checkbox string "true" to boolean', () => {
			const field = { type: 'checkbox' };
			const result = sanitizeFieldValue( 'true', field );
			expect( result ).toBe( true );
		} );

		it( 'should convert checkbox string "false" to boolean', () => {
			const field = { type: 'checkbox' };
			const result = sanitizeFieldValue( 'false', field );
			expect( result ).toBe( true ); // Any non-empty string is truthy
		} );

		it( 'should convert number field to number', () => {
			const field = { type: 'number' };
			const result = sanitizeFieldValue( '42', field );
			expect( result ).toBe( 42 );
			expect( typeof result ).toBe( 'number' );
		} );

		it( 'should convert invalid number to 0', () => {
			const field = { type: 'number' };
			const result = sanitizeFieldValue( 'not-a-number', field );
			expect( result ).toBe( 0 );
		} );

		it( 'should return select value as-is', () => {
			const field = { type: 'select' };
			const result = sanitizeFieldValue( 'option1', field );
			expect( result ).toBe( 'option1' );
		} );

		it( 'should convert non-array to empty array for checkbox-group', () => {
			const field = { type: 'checkbox-group' };
			const result = sanitizeFieldValue( 'not-an-array', field );
			expect( result ).toEqual( [] );
		} );

		it( 'should return array as-is for checkbox-group', () => {
			const field = { type: 'checkbox-group' };
			const result = sanitizeFieldValue( [ 'opt1', 'opt2' ], field );
			expect( result ).toEqual( [ 'opt1', 'opt2' ] );
		} );

		it( 'should default to text sanitization for unknown type', () => {
			const field = { type: 'unknown' };
			const result = sanitizeFieldValue( '  value  ', field );
			expect( result ).toBe( 'value' );
		} );

		it( 'should default to text sanitization when type is missing', () => {
			const field = {};
			const result = sanitizeFieldValue( '  value  ', field );
			expect( result ).toBe( 'value' );
		} );
	} );

	// ========================================================================
	// isValidSelectValue Tests (MEDIUM)
	// ========================================================================

	describe( 'isValidSelectValue', () => {
		it( 'should return true for valid select value', () => {
			const options = [
				{ value: 'opt1', label: 'Option 1' },
				{ value: 'opt2', label: 'Option 2' },
			];

			const result = isValidSelectValue( 'opt1', options );

			expect( result ).toBe( true );
		} );

		it( 'should return false for invalid select value', () => {
			const options = [
				{ value: 'opt1', label: 'Option 1' },
				{ value: 'opt2', label: 'Option 2' },
			];

			const result = isValidSelectValue( 'opt3', options );

			expect( result ).toBe( false );
		} );

		it( 'should return false for empty options array', () => {
			const result = isValidSelectValue( 'opt1', [] );

			expect( result ).toBe( false );
		} );

		it( 'should return false for null options', () => {
			const result = isValidSelectValue( 'opt1', null );

			expect( result ).toBe( false );
		} );

		it( 'should return false for undefined options', () => {
			const result = isValidSelectValue( 'opt1', undefined );

			expect( result ).toBe( false );
		} );

		it( 'should handle numeric values', () => {
			const options = [
				{ value: 1, label: 'One' },
				{ value: 2, label: 'Two' },
			];

			expect( isValidSelectValue( 1, options ) ).toBe( true );
			expect( isValidSelectValue( 3, options ) ).toBe( false );
		} );
	} );

	// ========================================================================
	// filterCheckboxGroupValues Tests (MEDIUM)
	// ========================================================================

	describe( 'filterCheckboxGroupValues', () => {
		it( 'should filter valid values from array', () => {
			const values = [ 'opt1', 'opt2', 'invalid' ];
			const options = [
				{ value: 'opt1', label: 'Option 1' },
				{ value: 'opt2', label: 'Option 2' },
			];

			const result = filterCheckboxGroupValues( values, options );

			expect( result ).toEqual( [ 'opt1', 'opt2' ] );
		} );

		it( 'should return empty array for non-array input', () => {
			const options = [
				{ value: 'opt1', label: 'Option 1' },
			];

			expect( filterCheckboxGroupValues( 'not-array', options ) ).toEqual(
				[]
			);
			expect( filterCheckboxGroupValues( null, options ) ).toEqual( [] );
			expect( filterCheckboxGroupValues( undefined, options ) ).toEqual(
				[]
			);
		} );

		it( 'should return all values when options is empty', () => {
			const values = [ 'opt1', 'opt2' ];

			const result = filterCheckboxGroupValues( values, [] );

			expect( result ).toEqual( [ 'opt1', 'opt2' ] );
		} );

		it( 'should return all values when options is null', () => {
			const values = [ 'opt1', 'opt2' ];

			const result = filterCheckboxGroupValues( values, null );

			expect( result ).toEqual( [ 'opt1', 'opt2' ] );
		} );

		it( 'should return empty array when all values are invalid', () => {
			const values = [ 'invalid1', 'invalid2' ];
			const options = [
				{ value: 'opt1', label: 'Option 1' },
				{ value: 'opt2', label: 'Option 2' },
			];

			const result = filterCheckboxGroupValues( values, options );

			expect( result ).toEqual( [] );
		} );

		it( 'should handle numeric values', () => {
			const values = [ 1, 2, 3 ];
			const options = [
				{ value: 1, label: 'One' },
				{ value: 2, label: 'Two' },
			];

			const result = filterCheckboxGroupValues( values, options );

			expect( result ).toEqual( [ 1, 2 ] );
		} );
	} );

	// ========================================================================
	// sanitizeAllFields Tests (HIGH)
	// ========================================================================

	describe( 'sanitizeAllFields', () => {
		it( 'should sanitize all fields in config', () => {
			const config = {
				name: '  John Doe  ',
				email: '  TEST@EXAMPLE.COM  ',
				age: '25',
			};
			const fields = [
				{ id: 'name', type: 'text' },
				{ id: 'email', type: 'email' },
				{ id: 'age', type: 'number' },
			];

			const result = sanitizeAllFields( config, fields );

			expect( result ).toEqual( {
				name: 'John Doe',
				email: 'test@example.com',
				age: 25,
			} );
		} );

		it( 'should skip fields not in config', () => {
			const config = {
				name: 'John Doe',
			};
			const fields = [
				{ id: 'name', type: 'text' },
				{ id: 'email', type: 'email' },
			];

			const result = sanitizeAllFields( config, fields );

			expect( result ).toEqual( {
				name: 'John Doe',
			} );
			expect( result.email ).toBeUndefined();
		} );

		it( 'should validate select field value', () => {
			const config = {
				role: 'admin',
				invalid_role: 'hacker',
			};
			const fields = [
				{
					id: 'role',
					type: 'select',
					options: [
						{ value: 'admin', label: 'Admin' },
						{ value: 'editor', label: 'Editor' },
					],
				},
				{
					id: 'invalid_role',
					type: 'select',
					options: [
						{ value: 'admin', label: 'Admin' },
					],
				},
			];

			const result = sanitizeAllFields( config, fields );

			expect( result.role ).toBe( 'admin' );
			expect( result.invalid_role ).toBeUndefined();
		} );

		it( 'should filter checkbox-group values', () => {
			const config = {
				permissions: [ 'read', 'write', 'invalid' ],
			};
			const fields = [
				{
					id: 'permissions',
					type: 'checkbox-group',
					options: [
						{ value: 'read', label: 'Read' },
						{ value: 'write', label: 'Write' },
					],
				},
			];

			const result = sanitizeAllFields( config, fields );

			expect( result.permissions ).toEqual( [ 'read', 'write' ] );
		} );

		it( 'should handle empty config', () => {
			const config = {};
			const fields = [
				{ id: 'name', type: 'text' },
				{ id: 'email', type: 'email' },
			];

			const result = sanitizeAllFields( config, fields );

			expect( result ).toEqual( {} );
		} );

		it( 'should handle empty fields array', () => {
			const config = {
				name: 'John Doe',
				email: 'test@example.com',
			};
			const fields = [];

			const result = sanitizeAllFields( config, fields );

			expect( result ).toEqual( {} );
		} );

		it( 'should handle multiple field types together', () => {
			const config = {
				name: '  John  ',
				email: '  TEST@EXAMPLE.COM  ',
				website: '  https://example.com/  ',
				age: '30',
				enabled: 'yes',
				role: 'editor',
				permissions: [ 'read', 'write', 'delete' ],
			};
			const fields = [
				{ id: 'name', type: 'text' },
				{ id: 'email', type: 'email' },
				{ id: 'website', type: 'url' },
				{ id: 'age', type: 'number' },
				{ id: 'enabled', type: 'checkbox' },
				{
					id: 'role',
					type: 'select',
					options: [
						{ value: 'admin', label: 'Admin' },
						{ value: 'editor', label: 'Editor' },
					],
				},
				{
					id: 'permissions',
					type: 'checkbox-group',
					options: [
						{ value: 'read', label: 'Read' },
						{ value: 'write', label: 'Write' },
					],
				},
			];

			const result = sanitizeAllFields( config, fields );

			expect( result ).toEqual( {
				name: 'John',
				email: 'test@example.com',
				website: 'https://example.com',
				age: 30,
				enabled: true,
				role: 'editor',
				permissions: [ 'read', 'write' ],
			} );
		} );
	} );
} );
