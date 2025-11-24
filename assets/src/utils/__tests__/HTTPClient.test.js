/**
 * HTTP Client Tests
 *
 * Tests for HTTPClient abstraction layer.
 * Validates both production and mock implementations.
 *
 */

import { HTTPClient, defaultHTTPClient } from '../HTTPClient';

// Mock global fetch for HTTPClient tests
global.fetch = jest.fn();

describe( 'HTTPClient', () => {
	let client;

	beforeEach( () => {
		client = new HTTPClient();
		global.fetch.mockClear();
	} );

	describe( 'GET requests', () => {
		test( 'should make GET request with default options', async () => {
			global.fetch.mockResolvedValue( { status: 200 } );

			await client.get( 'https://example.com/api' );

			expect( global.fetch ).toHaveBeenCalledWith(
				'https://example.com/api',
				{ method: 'GET' }
			);
		} );

		test( 'should merge custom options', async () => {
			global.fetch.mockResolvedValue( { status: 200 } );

			await client.get( 'https://example.com/api', {
				headers: { Authorization: 'Bearer token' },
			} );

			expect( global.fetch ).toHaveBeenCalledWith(
				'https://example.com/api',
				{
					method: 'GET',
					headers: { Authorization: 'Bearer token' },
				}
			);
		} );
	} );

	describe( 'POST requests', () => {
		test( 'should make POST request with JSON body', async () => {
			global.fetch.mockResolvedValue( { status: 201 } );

			const data = { name: 'Test' };
			await client.post( 'https://example.com/api', data );

			expect( global.fetch ).toHaveBeenCalledWith(
				'https://example.com/api',
				{
					method: 'POST',
					body: JSON.stringify( data ),
					headers: { 'Content-Type': 'application/json' },
				}
			);
		} );

		test( 'should merge custom headers', async () => {
			global.fetch.mockResolvedValue( { status: 201 } );

			await client.post(
				'https://example.com/api',
				{ name: 'Test' },
				{
					headers: { Authorization: 'Bearer token' },
				}
			);

			expect( global.fetch ).toHaveBeenCalledWith(
				'https://example.com/api',
				expect.objectContaining( {
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer token',
					},
				} )
			);
		} );
	} );

	describe( 'PUT requests', () => {
		test( 'should make PUT request with JSON body', async () => {
			global.fetch.mockResolvedValue( { status: 200 } );

			const data = { name: 'Updated' };
			await client.put( 'https://example.com/api/1', data );

			expect( global.fetch ).toHaveBeenCalledWith(
				'https://example.com/api/1',
				{
					method: 'PUT',
					body: JSON.stringify( data ),
					headers: { 'Content-Type': 'application/json' },
				}
			);
		} );
	} );

	describe( 'DELETE requests', () => {
		test( 'should make DELETE request', async () => {
			global.fetch.mockResolvedValue( { status: 204 } );

			await client.delete( 'https://example.com/api/1' );

			expect( global.fetch ).toHaveBeenCalledWith(
				'https://example.com/api/1',
				{ method: 'DELETE' }
			);
		} );
	} );

	describe( 'Generic fetch', () => {
		test( 'should make custom request', async () => {
			global.fetch.mockResolvedValue( { status: 200 } );

			await client.fetch( 'https://example.com/api', {
				method: 'PATCH',
				headers: { 'X-Custom': 'value' },
			} );

			expect( global.fetch ).toHaveBeenCalledWith(
				'https://example.com/api',
				{
					method: 'PATCH',
					headers: { 'X-Custom': 'value' },
				}
			);
		} );
	} );

	describe( 'Default instance', () => {
		test( 'should export default client instance', () => {
			expect( defaultHTTPClient ).toBeInstanceOf( HTTPClient );
		} );
	} );
} );
