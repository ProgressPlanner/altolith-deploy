/**
 * HTTP Client Tests
 *
 * Tests for HTTPClient abstraction layer.
 * Validates both production and mock implementations.
 *
 * @package
 */

import { HTTPClient, MockHTTPClient, defaultHTTPClient } from '../HTTPClient';

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

describe( 'MockHTTPClient', () => {
	let mockClient;

	beforeEach( () => {
		mockClient = new MockHTTPClient();
	} );

	describe( 'Response configuration', () => {
		test( 'should return configured response for exact URL match', async () => {
			mockClient.setResponse( 'https://example.com/api', {
				status: 200,
				body: JSON.stringify( { data: 'test' } ),
			} );

			const response = await mockClient.get( 'https://example.com/api' );

			expect( response.status ).toBe( 200 );
			const json = await response.json();
			expect( json ).toEqual( { data: 'test' } );
		} );

		test( 'should return configured response for pattern match', async () => {
			mockClient.setResponse( /\/api\/users\/\d+/, {
				status: 200,
				body: JSON.stringify( { id: 1, name: 'John' } ),
			} );

			const response = await mockClient.get(
				'https://example.com/api/users/123'
			);

			expect( response.status ).toBe( 200 );
			const json = await response.json();
			expect( json.name ).toBe( 'John' );
		} );

		test( 'should support response factory functions', async () => {
			mockClient.setResponse( 'https://example.com/api', ( url, options ) => {
				return {
					status: 200,
					body: JSON.stringify( { url, method: options.method } ),
				};
			} );

			const response = await mockClient.get( 'https://example.com/api' );
			const json = await response.json();

			expect( json.url ).toBe( 'https://example.com/api' );
			expect( json.method ).toBe( 'GET' );
		} );

		test( 'should return 404 for unmocked URLs by default', async () => {
			const response = await mockClient.get(
				'https://example.com/unmocked'
			);

			expect( response.status ).toBe( 404 );
			expect( response.ok ).toBe( false );
		} );

		test( 'should throw for unmocked URLs when configured', async () => {
			mockClient = new MockHTTPClient( {}, { throwOnUnmocked: true } );

			await expect(
				mockClient.get( 'https://example.com/unmocked' )
			).rejects.toThrow( 'No mock response configured' );
		} );
	} );

	describe( 'Response methods', () => {
		beforeEach( () => {
			mockClient.setResponse( 'https://example.com/api', {
				status: 200,
				body: 'Hello World',
			} );
		} );

		test( 'should support text() method', async () => {
			const response = await mockClient.get( 'https://example.com/api' );
			const text = await response.text();

			expect( text ).toBe( 'Hello World' );
		} );

		test( 'should support json() method', async () => {
			mockClient.setResponse( 'https://example.com/json', {
				status: 200,
				body: JSON.stringify( { key: 'value' } ),
			} );

			const response = await mockClient.get(
				'https://example.com/json'
			);
			const json = await response.json();

			expect( json ).toEqual( { key: 'value' } );
		} );

		test( 'should support json() with object body', async () => {
			mockClient.setResponse( 'https://example.com/json', {
				status: 200,
				body: { key: 'value' },
			} );

			const response = await mockClient.get(
				'https://example.com/json'
			);
			const json = await response.json();

			expect( json ).toEqual( { key: 'value' } );
		} );

		test( 'should handle invalid JSON', async () => {
			mockClient.setResponse( 'https://example.com/invalid', {
				status: 200,
				body: 'Not JSON',
			} );

			const response = await mockClient.get(
				'https://example.com/invalid'
			);

			await expect( response.json() ).rejects.toThrow( 'Invalid JSON' );
		} );

		test( 'should set ok property based on status', async () => {
			mockClient.setResponse( 'https://example.com/success', {
				status: 200,
			} );
			mockClient.setResponse( 'https://example.com/error', {
				status: 404,
			} );

			const successResponse = await mockClient.get(
				'https://example.com/success'
			);
			const errorResponse = await mockClient.get(
				'https://example.com/error'
			);

			expect( successResponse.ok ).toBe( true );
			expect( errorResponse.ok ).toBe( false );
		} );
	} );

	describe( 'Request tracking', () => {
		test( 'should track GET requests', async () => {
			await mockClient.get( 'https://example.com/api' );

			const requests = mockClient.getRequests();
			expect( requests ).toHaveLength( 1 );
			expect( requests[ 0 ].url ).toBe( 'https://example.com/api' );
			expect( requests[ 0 ].options.method ).toBe( 'GET' );
		} );

		test( 'should track POST requests with data', async () => {
			const data = { name: 'Test' };
			await mockClient.post( 'https://example.com/api', data );

			const requests = mockClient.getRequests();
			expect( requests ).toHaveLength( 1 );
			expect( requests[ 0 ].data ).toEqual( data );
		} );

		test( 'should track multiple requests', async () => {
			await mockClient.get( 'https://example.com/api/1' );
			await mockClient.post( 'https://example.com/api/2', {} );
			await mockClient.delete( 'https://example.com/api/3' );

			const requests = mockClient.getRequests();
			expect( requests ).toHaveLength( 3 );
		} );

		test( 'should clear request history', async () => {
			await mockClient.get( 'https://example.com/api' );
			expect( mockClient.getRequests() ).toHaveLength( 1 );

			mockClient.clearRequests();
			expect( mockClient.getRequests() ).toHaveLength( 0 );
		} );

		test( 'should filter requests by pattern', async () => {
			await mockClient.get( 'https://example.com/api/users/1' );
			await mockClient.get( 'https://example.com/api/posts/1' );
			await mockClient.get( 'https://example.com/api/users/2' );

			const userRequests = mockClient.getRequestsMatching( /\/users\// );

			expect( userRequests ).toHaveLength( 2 );
			expect( userRequests[ 0 ].url ).toContain( 'users' );
			expect( userRequests[ 1 ].url ).toContain( 'users' );
		} );
	} );

	describe( 'HTTP methods', () => {
		test( 'should handle GET requests', async () => {
			mockClient.setResponse( 'https://example.com/api', {
				status: 200,
				body: 'GET response',
			} );

			const response = await mockClient.get( 'https://example.com/api' );
			const text = await response.text();

			expect( text ).toBe( 'GET response' );
		} );

		test( 'should handle POST requests', async () => {
			mockClient.setResponse( 'https://example.com/api', {
				status: 201,
				body: 'POST response',
			} );

			const response = await mockClient.post(
				'https://example.com/api',
				{ data: 'test' }
			);
			const text = await response.text();

			expect( text ).toBe( 'POST response' );
		} );

		test( 'should handle PUT requests', async () => {
			mockClient.setResponse( 'https://example.com/api/1', {
				status: 200,
				body: 'PUT response',
			} );

			const response = await mockClient.put(
				'https://example.com/api/1',
				{ data: 'updated' }
			);
			const text = await response.text();

			expect( text ).toBe( 'PUT response' );
		} );

		test( 'should handle DELETE requests', async () => {
			mockClient.setResponse( 'https://example.com/api/1', {
				status: 204,
				body: '',
			} );

			const response = await mockClient.delete(
				'https://example.com/api/1'
			);

			expect( response.status ).toBe( 204 );
		} );

		test( 'should handle custom fetch requests', async () => {
			mockClient.setResponse( 'https://example.com/api', {
				status: 200,
				body: 'Custom response',
			} );

			const response = await mockClient.fetch(
				'https://example.com/api',
				{
					method: 'PATCH',
				}
			);
			const text = await response.text();

			expect( text ).toBe( 'Custom response' );
		} );
	} );

	describe( 'Constructor configuration', () => {
		test( 'should initialize with responses', () => {
			const responses = {
				'https://example.com/api': { status: 200, body: 'test' },
			};

			mockClient = new MockHTTPClient( responses );

			expect( mockClient.responses.has( 'https://example.com/api' ) ).toBe(
				true
			);
			expect( mockClient.responses.get( 'https://example.com/api' ) ).toEqual(
				{ status: 200, body: 'test' }
			);
		} );

		test( 'should initialize with config', () => {
			mockClient = new MockHTTPClient( {}, { throwOnUnmocked: true } );

			expect( mockClient.config.throwOnUnmocked ).toBe( true );
		} );
	} );
} );
