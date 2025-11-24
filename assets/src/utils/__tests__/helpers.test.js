/**
 * Helpers Tests
 *
 * Tests for general utility helper functions.
 * These are pure functions used throughout the application.
 *
 */

import { parseJSONSafely, deepMerge } from '../helpers';

describe( 'helpers', () => {
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
			expect( parseJSONSafely( undefined, fallback ) ).toEqual(
				fallback
			);
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
} );
