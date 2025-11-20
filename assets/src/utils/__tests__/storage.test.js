/**
 * Storage Abstraction Layer Tests
 *
 * Tests for browser storage abstraction that wraps localStorage
 * with error handling, JSON serialization, and testability.
 *
 * @package
 */

import { storage } from '../storage';

describe( 'Storage Abstraction Layer', () => {
	beforeEach( () => {
		// Restore all mocks to original implementations FIRST
		jest.restoreAllMocks();
		jest.clearAllMocks();
		// Clear localStorage after restoring mocks
		localStorage.clear();
	} );

	describe( 'get()', () => {
		test( 'should return parsed value when key exists', () => {
			localStorage.setItem(
				'test-key',
				JSON.stringify( { foo: 'bar' } )
			);

			const result = storage.get( 'test-key' );

			expect( result ).toEqual( { foo: 'bar' } );
		} );

		test( 'should return null when key does not exist', () => {
			const result = storage.get( 'nonexistent-key' );

			expect( result ).toBeNull();
		} );

		test( 'should return null when value cannot be parsed', () => {
			localStorage.setItem( 'invalid-json', '{invalid json}' );

			const result = storage.get( 'invalid-json' );

			expect( result ).toBeNull();
		} );

		test( 'should handle localStorage errors gracefully', () => {
			// Mock localStorage.getItem to throw
			jest.spyOn(
				Object.getPrototypeOf( localStorage ),
				'getItem'
			).mockImplementation( () => {
				throw new Error( 'Storage error' );
			} );

			const result = storage.get( 'test-key' );

			expect( result ).toBeNull();
		} );

		test( 'should return default value when key does not exist', () => {
			const defaultValue = { default: true };

			const result = storage.get( 'nonexistent-key', defaultValue );

			expect( result ).toEqual( defaultValue );
		} );

		test( 'should return default value on parse error', () => {
			localStorage.setItem( 'invalid-json', '{invalid}' );
			const defaultValue = { default: true };

			const result = storage.get( 'invalid-json', defaultValue );

			expect( result ).toEqual( defaultValue );
		} );
	} );

	describe( 'set()', () => {
		test( 'should store serialized value', () => {
			const value = { foo: 'bar', count: 42 };

			const result = storage.set( 'test-key', value );

			expect( result ).toBe( true );
			expect( localStorage.getItem( 'test-key' ) ).toBe(
				JSON.stringify( value )
			);
		} );

		test( 'should handle primitive values', () => {
			storage.set( 'string-key', 'hello' );
			storage.set( 'number-key', 123 );
			storage.set( 'boolean-key', true );
			storage.set( 'null-key', null );

			expect( storage.get( 'string-key' ) ).toBe( 'hello' );
			expect( storage.get( 'number-key' ) ).toBe( 123 );
			expect( storage.get( 'boolean-key' ) ).toBe( true );
			expect( storage.get( 'null-key' ) ).toBe( null );
		} );

		test( 'should handle complex nested objects', () => {
			const value = {
				nested: {
					deep: {
						array: [ 1, 2, { inner: 'value' } ],
					},
				},
			};

			storage.set( 'complex-key', value );

			expect( storage.get( 'complex-key' ) ).toEqual( value );
		} );

		test( 'should return false on quota exceeded error', () => {
			// Mock localStorage.setItem to throw quota error
			jest.spyOn(
				Object.getPrototypeOf( localStorage ),
				'setItem'
			).mockImplementation( () => {
				const error = new Error( 'QuotaExceededError' );
				error.name = 'QuotaExceededError';
				throw error;
			} );

			const result = storage.set( 'test-key', { large: 'data' } );

			expect( result ).toBe( false );
		} );

		test( 'should return false on other localStorage errors', () => {
			jest.spyOn(
				Object.getPrototypeOf( localStorage ),
				'setItem'
			).mockImplementation( () => {
				throw new Error( 'Storage error' );
			} );

			const result = storage.set( 'test-key', { data: 'value' } );

			expect( result ).toBe( false );
		} );

		test( 'should handle undefined values', () => {
			// JSON.stringify(undefined) returns undefined (not a string)
			// localStorage.setItem converts undefined to the string "undefined"
			// JSON.parse("undefined") will fail and return default value (null)
			const result = storage.set( 'undefined-key', undefined );

			expect( result ).toBe( true );
			// When retrieved, parsing fails so it returns null (default)
			expect( storage.get( 'undefined-key' ) ).toBeNull();
		} );
	} );

	describe( 'remove()', () => {
		test( 'should remove existing key', () => {
			localStorage.setItem(
				'test-key',
				JSON.stringify( { foo: 'bar' } )
			);

			const result = storage.remove( 'test-key' );

			expect( result ).toBe( true );
			expect( localStorage.getItem( 'test-key' ) ).toBeNull();
		} );

		test( 'should return true even if key does not exist', () => {
			const result = storage.remove( 'nonexistent-key' );

			expect( result ).toBe( true );
		} );

		test( 'should return false on localStorage error', () => {
			jest.spyOn(
				Object.getPrototypeOf( localStorage ),
				'removeItem'
			).mockImplementation( () => {
				throw new Error( 'Storage error' );
			} );

			const result = storage.remove( 'test-key' );

			expect( result ).toBe( false );
		} );
	} );

	describe( 'clear()', () => {
		test( 'should clear all storage', () => {
			localStorage.setItem( 'key1', 'value1' );
			localStorage.setItem( 'key2', 'value2' );
			localStorage.setItem( 'key3', 'value3' );

			const result = storage.clear();

			expect( result ).toBe( true );
			expect( localStorage.length ).toBe( 0 );
		} );

		test( 'should return true even if storage is already empty', () => {
			const result = storage.clear();

			expect( result ).toBe( true );
			expect( localStorage.length ).toBe( 0 );
		} );

		test( 'should return false on localStorage error', () => {
			jest.spyOn(
				Object.getPrototypeOf( localStorage ),
				'clear'
			).mockImplementation( () => {
				throw new Error( 'Storage error' );
			} );

			const result = storage.clear();

			expect( result ).toBe( false );
		} );
	} );

	describe( 'has()', () => {
		test( 'should return true when key exists', () => {
			localStorage.setItem( 'test-key', JSON.stringify( 'value' ) );

			const result = storage.has( 'test-key' );

			expect( result ).toBe( true );
		} );

		test( 'should return false when key does not exist', () => {
			const result = storage.has( 'nonexistent-key' );

			expect( result ).toBe( false );
		} );

		test( 'should return false on localStorage error', () => {
			jest.spyOn(
				Object.getPrototypeOf( localStorage ),
				'getItem'
			).mockImplementation( () => {
				throw new Error( 'Storage error' );
			} );

			const result = storage.has( 'test-key' );

			expect( result ).toBe( false );
		} );
	} );

	describe( 'keys()', () => {
		test( 'should return all keys in storage', () => {
			localStorage.setItem( 'key1', 'value1' );
			localStorage.setItem( 'key2', 'value2' );
			localStorage.setItem( 'key3', 'value3' );

			const keys = storage.keys();

			expect( keys ).toHaveLength( 3 );
			expect( keys ).toContain( 'key1' );
			expect( keys ).toContain( 'key2' );
			expect( keys ).toContain( 'key3' );
		} );

		test( 'should return empty array when storage is empty', () => {
			const keys = storage.keys();

			expect( keys ).toEqual( [] );
		} );

		test( 'should return empty array on localStorage error', () => {
			jest.spyOn(
				Object.getPrototypeOf( localStorage ),
				'key'
			).mockImplementation( () => {
				throw new Error( 'Storage error' );
			} );

			const keys = storage.keys();

			expect( keys ).toEqual( [] );
		} );
	} );

	describe( 'Error Handling and Edge Cases', () => {
		test( 'should handle circular references gracefully', () => {
			const circular = { foo: 'bar' };
			circular.self = circular;

			const result = storage.set( 'circular-key', circular );

			// JSON.stringify throws on circular references
			expect( result ).toBe( false );
		} );

		test( 'should handle very large keys', () => {
			const largeKey = 'x'.repeat( 10000 );

			const result = storage.set( largeKey, 'value' );

			expect( result ).toBe( true );
			expect( storage.get( largeKey ) ).toBe( 'value' );
		} );

		test( 'should handle special characters in keys', () => {
			const specialKey = 'key-with-!@#$%^&*()_+-={}[]|:";\'<>?,./';

			storage.set( specialKey, 'value' );

			expect( storage.get( specialKey ) ).toBe( 'value' );
		} );

		test( 'should handle empty string as key', () => {
			storage.set( '', 'empty-key-value' );

			expect( storage.get( '' ) ).toBe( 'empty-key-value' );
		} );

		test( 'should handle empty string as value', () => {
			storage.set( 'test-key', '' );

			expect( storage.get( 'test-key' ) ).toBe( '' );
		} );
	} );

	describe( 'Integration Tests', () => {
		test( 'should support multiple operations in sequence', () => {
			// Set multiple values
			storage.set( 'key1', { value: 1 } );
			storage.set( 'key2', { value: 2 } );
			storage.set( 'key3', { value: 3 } );

			// Verify all exist
			expect( storage.has( 'key1' ) ).toBe( true );
			expect( storage.has( 'key2' ) ).toBe( true );
			expect( storage.has( 'key3' ) ).toBe( true );

			// Get values
			expect( storage.get( 'key1' ) ).toEqual( { value: 1 } );
			expect( storage.get( 'key2' ) ).toEqual( { value: 2 } );

			// Remove one
			storage.remove( 'key2' );
			expect( storage.has( 'key2' ) ).toBe( false );
			expect( storage.keys() ).toHaveLength( 2 );

			// Clear all
			storage.clear();
			expect( storage.keys() ).toHaveLength( 0 );
		} );

		test( 'should maintain data integrity across operations', () => {
			const complexData = {
				user: {
					id: 123,
					name: 'Test User',
					preferences: {
						theme: 'dark',
						notifications: true,
					},
				},
				metadata: {
					created: '2024-01-01',
					tags: [ 'tag1', 'tag2', 'tag3' ],
				},
			};

			storage.set( 'complex-data', complexData );

			const retrieved = storage.get( 'complex-data' );

			expect( retrieved ).toEqual( complexData );
			expect( retrieved.user.preferences.theme ).toBe( 'dark' );
			expect( retrieved.metadata.tags ).toHaveLength( 3 );
		} );
	} );
} );
