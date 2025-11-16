/**
 * Error Parser Test Suite
 *
 * Tests for error response parsing utility.
 *
 * @package
 */

import {
	parseErrorResponse,
	parseErrorResponseWithStatus,
	parseMultipleErrors,
} from '../errorParser';

describe( 'parseErrorResponse', () => {
	it( 'should parse Cloudflare API error format', () => {
		const response = JSON.stringify( {
			errors: [ { message: 'Worker deployment failed' } ],
		} );

		const result = parseErrorResponse( response, 'Default message' );

		expect( result ).toBe( 'Worker deployment failed' );
	} );

	it( 'should parse generic error format', () => {
		const response = JSON.stringify( {
			error: 'Invalid credentials',
		} );

		const result = parseErrorResponse( response, 'Default message' );

		expect( result ).toBe( 'Invalid credentials' );
	} );

	it( 'should parse message format', () => {
		const response = JSON.stringify( {
			message: 'Connection timeout',
		} );

		const result = parseErrorResponse( response, 'Default message' );

		expect( result ).toBe( 'Connection timeout' );
	} );

	it( 'should handle plain text responses', () => {
		const response = 'Internal server error';

		const result = parseErrorResponse( response, 'Default message' );

		expect( result ).toBe( 'Internal server error' );
	} );

	it( 'should return default message for empty response', () => {
		const result = parseErrorResponse( '', 'Default message' );

		expect( result ).toBe( 'Default message' );
	} );

	it( 'should return default message for null response', () => {
		const result = parseErrorResponse( null, 'Default message' );

		expect( result ).toBe( 'Default message' );
	} );

	it( 'should handle empty Cloudflare errors array', () => {
		const response = JSON.stringify( {
			errors: [],
		} );

		const result = parseErrorResponse( response, 'Default message' );

		expect( result ).toBe( 'Default message' );
	} );

	it( 'should handle Cloudflare errors without message', () => {
		const response = JSON.stringify( {
			errors: [ { code: 1234 } ],
		} );

		const result = parseErrorResponse( response, 'Default message' );

		expect( result ).toBe( 'Default message' );
	} );

	it( 'should handle object error format', () => {
		const response = JSON.stringify( {
			error: { detail: 'Complex error object' },
		} );

		const result = parseErrorResponse( response, 'Default message' );

		expect( result ).toBe( '{"detail":"Complex error object"}' );
	} );

	it( 'should handle invalid JSON gracefully', () => {
		const response = '{ invalid json }';

		const result = parseErrorResponse( response, 'Default message' );

		expect( result ).toBe( '{ invalid json }' );
	} );
} );

describe( 'parseErrorResponseWithStatus', () => {
	it( 'should include status code in error message', () => {
		const response = JSON.stringify( {
			error: 'Not found',
		} );

		const result = parseErrorResponseWithStatus(
			response,
			404,
			'Resource fetch'
		);

		expect( result ).toBe( 'Not found (HTTP 404)' );
	} );

	it( 'should not duplicate status code if already in message', () => {
		const response = JSON.stringify( {
			error: 'Not found (404)',
		} );

		const result = parseErrorResponseWithStatus(
			response,
			404,
			'Resource fetch'
		);

		expect( result ).toBe( 'Not found (404)' );
	} );

	it( 'should use operation name when no specific error', () => {
		const response = '';

		const result = parseErrorResponseWithStatus(
			response,
			500,
			'Worker deployment'
		);

		expect( result ).toBe( 'Worker deployment failed (HTTP 500)' );
	} );

	it( 'should handle missing status code', () => {
		const response = JSON.stringify( {
			error: 'Something went wrong',
		} );

		const result = parseErrorResponseWithStatus(
			response,
			null,
			'Operation'
		);

		expect( result ).toBe( 'Something went wrong' );
	} );
} );

describe( 'parseMultipleErrors', () => {
	it( 'should extract multiple Cloudflare errors', () => {
		const response = JSON.stringify( {
			errors: [
				{ message: 'Error 1' },
				{ message: 'Error 2' },
				{ message: 'Error 3' },
			],
		} );

		const result = parseMultipleErrors( response );

		expect( result ).toEqual( [ 'Error 1', 'Error 2', 'Error 3' ] );
	} );

	it( 'should handle single error format', () => {
		const response = JSON.stringify( {
			error: 'Single error',
		} );

		const result = parseMultipleErrors( response );

		expect( result ).toEqual( [ 'Single error' ] );
	} );

	it( 'should handle message format', () => {
		const response = JSON.stringify( {
			message: 'Error message',
		} );

		const result = parseMultipleErrors( response );

		expect( result ).toEqual( [ 'Error message' ] );
	} );

	it( 'should handle plain text response', () => {
		const response = 'Plain text error';

		const result = parseMultipleErrors( response );

		expect( result ).toEqual( [ 'Plain text error' ] );
	} );

	it( 'should return empty array for empty response', () => {
		const result = parseMultipleErrors( '' );

		expect( result ).toEqual( [] );
	} );

	it( 'should filter out empty error messages', () => {
		const response = JSON.stringify( {
			errors: [
				{ message: 'Valid error' },
				{ message: '' },
				{ message: 'Another error' },
			],
		} );

		const result = parseMultipleErrors( response );

		expect( result ).toEqual( [ 'Valid error', 'Another error' ] );
	} );

	it( 'should stringify errors without message property', () => {
		const response = JSON.stringify( {
			errors: [ { code: 1234, detail: 'Error detail' } ],
		} );

		const result = parseMultipleErrors( response );

		expect( result ).toEqual( [ '{"code":1234,"detail":"Error detail"}' ] );
	} );
} );
