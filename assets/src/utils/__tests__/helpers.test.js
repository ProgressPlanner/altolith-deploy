/**
 * Helpers Tests
 *
 * Tests for general utility helper functions.
 * These are pure functions used throughout the application.
 *
 * @package
 */

import {
	filterNullishValues,
	parseJSONSafely,
	parseJSONArray,
	parseJSONObject,
	isEncryptedValue,
	deepMerge,
	debounce,
} from '../helpers';

describe( 'helpers', () => {
	describe( 'filterNullishValues()', () => {
		test( 'should remove null values from object', () => {
			const input = { a: 1, b: null, c: 3 };
			const result = filterNullishValues( input );

			expect( result ).toEqual( { a: 1, c: 3 } );
			expect( result ).not.toHaveProperty( 'b' );
		} );

		test( 'should remove undefined values from object', () => {
			const input = { a: 1, b: undefined, c: 3 };
			const result = filterNullishValues( input );

			expect( result ).toEqual( { a: 1, c: 3 } );
			expect( result ).not.toHaveProperty( 'b' );
		} );

		test( 'should keep falsy values that are not nullish', () => {
			const input = { a: 0, b: false, c: '', d: null };
			const result = filterNullishValues( input );

			expect( result ).toEqual( { a: 0, b: false, c: '' } );
		} );

		test( 'should return empty object for all nullish values', () => {
			const input = { a: null, b: undefined };
			const result = filterNullishValues( input );

			expect( result ).toEqual( {} );
		} );

		test( 'should handle empty object', () => {
			const result = filterNullishValues( {} );

			expect( result ).toEqual( {} );
		} );

		test( 'should return input for non-object types', () => {
			expect( filterNullishValues( null ) ).toBeNull();
			expect( filterNullishValues( undefined ) ).toBeUndefined();
			expect( filterNullishValues( 'string' ) ).toBe( 'string' );
			expect( filterNullishValues( 123 ) ).toBe( 123 );
		} );

		test( 'should not mutate original object', () => {
			const input = { a: 1, b: null, c: 3 };
			const result = filterNullishValues( input );

			expect( input ).toEqual( { a: 1, b: null, c: 3 } );
			expect( result ).not.toBe( input );
		} );
	} );

	describe( 'parseJSONSafely()', () => {
		test( 'should parse valid JSON string', () => {
			const result = parseJSONSafely( '{"foo":"bar"}' );

			expect( result ).toEqual( { foo: 'bar' } );
		} );

		test( 'should return fallback for invalid JSON', () => {
			const fallback = { default: true };
			const result = parseJSONSafely( '{invalid json}', fallback );

			expect( result ).toEqual( fallback );
		} );

		test( 'should return null fallback by default', () => {
			const result = parseJSONSafely( '{invalid}' );

			expect( result ).toBeNull();
		} );

		test( 'should return fallback for non-string input', () => {
			const fallback = { default: true };

			expect( parseJSONSafely( null, fallback ) ).toEqual( fallback );
			expect( parseJSONSafely( undefined, fallback ) ).toEqual( fallback );
			expect( parseJSONSafely( 123, fallback ) ).toEqual( fallback );
		} );

		test( 'should use validator to verify parsed value', () => {
			const validator = ( val ) => val.foo === 'bar';
			const fallback = { default: true };

			// Valid according to validator
			const result1 = parseJSONSafely(
				'{"foo":"bar"}',
				fallback,
				validator
			);
			expect( result1 ).toEqual( { foo: 'bar' } );

			// Invalid according to validator
			const result2 = parseJSONSafely(
				'{"foo":"baz"}',
				fallback,
				validator
			);
			expect( result2 ).toEqual( fallback );
		} );

		test( 'should parse arrays', () => {
			const result = parseJSONSafely( '[1,2,3]' );

			expect( result ).toEqual( [ 1, 2, 3 ] );
		} );

		test( 'should parse primitives', () => {
			expect( parseJSONSafely( '"string"' ) ).toBe( 'string' );
			expect( parseJSONSafely( '123' ) ).toBe( 123 );
			expect( parseJSONSafely( 'true' ) ).toBe( true );
			expect( parseJSONSafely( 'null' ) ).toBeNull();
		} );

		test( 'should return fallback for empty string', () => {
			const fallback = { default: true };
			const result = parseJSONSafely( '', fallback );

			expect( result ).toEqual( fallback );
		} );
	} );

	describe( 'parseJSONArray()', () => {
		test( 'should parse valid JSON array', () => {
			const result = parseJSONArray( '[1,2,3]' );

			expect( result ).toEqual( [ 1, 2, 3 ] );
		} );

		test( 'should return empty array fallback by default', () => {
			const result = parseJSONArray( '{invalid}' );

			expect( result ).toEqual( [] );
		} );

		test( 'should return custom fallback', () => {
			const fallback = [ 'default' ];
			const result = parseJSONArray( '{invalid}', fallback );

			expect( result ).toEqual( fallback );
		} );

		test( 'should reject non-array JSON', () => {
			const fallback = [ 'default' ];

			expect( parseJSONArray( '{"foo":"bar"}', fallback ) ).toEqual(
				fallback
			);
			expect( parseJSONArray( '"string"', fallback ) ).toEqual( fallback );
			expect( parseJSONArray( '123', fallback ) ).toEqual( fallback );
		} );

		test( 'should accept empty array', () => {
			const result = parseJSONArray( '[]' );

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'parseJSONObject()', () => {
		test( 'should parse valid JSON object', () => {
			const result = parseJSONObject( '{"foo":"bar"}' );

			expect( result ).toEqual( { foo: 'bar' } );
		} );

		test( 'should return empty object fallback by default', () => {
			const result = parseJSONObject( '{invalid}' );

			expect( result ).toEqual( {} );
		} );

		test( 'should return custom fallback', () => {
			const fallback = { default: true };
			const result = parseJSONObject( '{invalid}', fallback );

			expect( result ).toEqual( fallback );
		} );

		test( 'should reject non-object JSON', () => {
			const fallback = { default: true };

			expect( parseJSONObject( '[1,2,3]', fallback ) ).toEqual( fallback );
			expect( parseJSONObject( '"string"', fallback ) ).toEqual( fallback );
			expect( parseJSONObject( '123', fallback ) ).toEqual( fallback );
		} );

		test( 'should reject null even though typeof null === "object"', () => {
			const fallback = { default: true };
			const result = parseJSONObject( 'null', fallback );

			expect( result ).toEqual( fallback );
		} );

		test( 'should accept empty object', () => {
			const result = parseJSONObject( '{}' );

			expect( result ).toEqual( {} );
		} );
	} );

	describe( 'isEncryptedValue()', () => {
		test( 'should return true for encrypted values', () => {
			expect( isEncryptedValue( 'encrypted:abc123' ) ).toBe( true );
			expect( isEncryptedValue( 'encrypted:' ) ).toBe( true );
		} );

		test( 'should return false for non-encrypted strings', () => {
			expect( isEncryptedValue( 'plain-text' ) ).toBe( false );
			expect( isEncryptedValue( 'not encrypted' ) ).toBe( false );
			expect( isEncryptedValue( 'ENCRYPTED:uppercase' ) ).toBe( false );
		} );

		test( 'should return false for non-string values', () => {
			expect( isEncryptedValue( null ) ).toBe( false );
			expect( isEncryptedValue( undefined ) ).toBe( false );
			expect( isEncryptedValue( 123 ) ).toBe( false );
			expect( isEncryptedValue( {} ) ).toBe( false );
			expect( isEncryptedValue( [] ) ).toBe( false );
		} );

		test( 'should return false for empty string', () => {
			expect( isEncryptedValue( '' ) ).toBe( false );
		} );
	} );

	describe( 'deepMerge()', () => {
		test( 'should merge simple objects', () => {
			const target = { a: 1, b: 2 };
			const source = { b: 3, c: 4 };
			const result = deepMerge( target, source );

			expect( result ).toEqual( { a: 1, b: 3, c: 4 } );
		} );

		test( 'should deep merge nested objects', () => {
			const target = { a: 1, nested: { x: 1, y: 2 } };
			const source = { nested: { y: 3, z: 4 } };
			const result = deepMerge( target, source );

			expect( result ).toEqual( {
				a: 1,
				nested: { x: 1, y: 3, z: 4 },
			} );
		} );

		test( 'should not mutate target object', () => {
			const target = { a: 1, nested: { x: 1 } };
			const source = { nested: { y: 2 } };
			const result = deepMerge( target, source );

			expect( target ).toEqual( { a: 1, nested: { x: 1 } } );
			expect( result ).not.toBe( target );
			expect( result.nested ).not.toBe( target.nested );
		} );

		test( 'should replace arrays instead of merging', () => {
			const target = { arr: [ 1, 2, 3 ] };
			const source = { arr: [ 4, 5 ] };
			const result = deepMerge( target, source );

			expect( result ).toEqual( { arr: [ 4, 5 ] } );
		} );

		test( 'should handle null and undefined source', () => {
			const target = { a: 1, b: 2 };

			expect( deepMerge( target, null ) ).toEqual( target );
			expect( deepMerge( target, undefined ) ).toEqual( target );
		} );

		test( 'should handle empty objects', () => {
			expect( deepMerge( {}, { a: 1 } ) ).toEqual( { a: 1 } );
			expect( deepMerge( { a: 1 }, {} ) ).toEqual( { a: 1 } );
		} );

		test( 'should handle deeply nested objects', () => {
			const target = {
				level1: {
					level2: {
						level3: {
							a: 1,
						},
					},
				},
			};
			const source = {
				level1: {
					level2: {
						level3: {
							b: 2,
						},
					},
				},
			};
			const result = deepMerge( target, source );

			expect( result ).toEqual( {
				level1: {
					level2: {
						level3: {
							a: 1,
							b: 2,
						},
					},
				},
			} );
		} );

		test( 'should handle source value overwriting target nested object', () => {
			const target = { nested: { x: 1, y: 2 } };
			const source = { nested: 'string' };
			const result = deepMerge( target, source );

			expect( result ).toEqual( { nested: 'string' } );
		} );
	} );

	describe( 'debounce()', () => {
		beforeEach( () => {
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		test( 'should delay function execution', () => {
			const func = jest.fn();
			const debounced = debounce( func, 100 );

			debounced();
			expect( func ).not.toHaveBeenCalled();

			jest.advanceTimersByTime( 99 );
			expect( func ).not.toHaveBeenCalled();

			jest.advanceTimersByTime( 1 );
			expect( func ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should cancel previous call when called again', () => {
			const func = jest.fn();
			const debounced = debounce( func, 100 );

			debounced();
			jest.advanceTimersByTime( 50 );
			debounced(); // Should cancel the first call
			jest.advanceTimersByTime( 50 );

			expect( func ).not.toHaveBeenCalled();

			jest.advanceTimersByTime( 50 );
			expect( func ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should pass arguments to debounced function', () => {
			const func = jest.fn();
			const debounced = debounce( func, 100 );

			debounced( 'arg1', 'arg2' );
			jest.advanceTimersByTime( 100 );

			expect( func ).toHaveBeenCalledWith( 'arg1', 'arg2' );
		} );

		test( 'should use latest arguments when called multiple times', () => {
			const func = jest.fn();
			const debounced = debounce( func, 100 );

			debounced( 'first' );
			jest.advanceTimersByTime( 50 );
			debounced( 'second' );
			jest.advanceTimersByTime( 100 );

			expect( func ).toHaveBeenCalledTimes( 1 );
			expect( func ).toHaveBeenCalledWith( 'second' );
		} );

		test( 'should execute immediately when immediate=true', () => {
			const func = jest.fn();
			const debounced = debounce( func, 100, true );

			debounced();
			expect( func ).toHaveBeenCalledTimes( 1 );

			jest.advanceTimersByTime( 100 );
			expect( func ).toHaveBeenCalledTimes( 1 ); // Should not call again
		} );

		test( 'should not execute again during wait period when immediate=true', () => {
			const func = jest.fn();
			const debounced = debounce( func, 100, true );

			debounced();
			expect( func ).toHaveBeenCalledTimes( 1 );

			debounced(); // Should not execute during wait period
			expect( func ).toHaveBeenCalledTimes( 1 );

			jest.advanceTimersByTime( 100 );
			debounced(); // Should execute after wait period
			expect( func ).toHaveBeenCalledTimes( 2 );
		} );
	} );
} );
