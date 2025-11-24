/**
 * Error Parser Tests
 *
 */

import { parseErrorResponse } from '../errorParser';

describe( 'errorParser', () => {
	describe( 'parseErrorResponse()', () => {
		test( 'should return default message for empty response', () => {
			expect( parseErrorResponse( '', 'Default error' ) ).toBe(
				'Default error'
			);
			expect( parseErrorResponse( null, 'Default error' ) ).toBe(
				'Default error'
			);
			expect( parseErrorResponse( undefined, 'Default error' ) ).toBe(
				'Default error'
			);
		} );

		test( 'should parse API errors array format', () => {
			const response = JSON.stringify( {
				errors: [ { message: 'First error message' } ],
			} );
			expect( parseErrorResponse( response, 'Default' ) ).toBe(
				'First error message'
			);
		} );

		test( 'should handle empty errors array', () => {
			const response = JSON.stringify( { errors: [] } );
			expect( parseErrorResponse( response, 'Default' ) ).toBe(
				'Default'
			);
		} );

		test( 'should handle errors array without message property', () => {
			const response = JSON.stringify( {
				errors: [ { code: 'ERR_001' } ],
			} );
			expect( parseErrorResponse( response, 'Default' ) ).toBe(
				'Default'
			);
		} );

		test( 'should parse generic error string format', () => {
			const response = JSON.stringify( {
				error: 'Something went wrong',
			} );
			expect( parseErrorResponse( response, 'Default' ) ).toBe(
				'Something went wrong'
			);
		} );

		test( 'should stringify error object', () => {
			const response = JSON.stringify( {
				error: { code: 'ERR', details: 'info' },
			} );
			const result = parseErrorResponse( response, 'Default' );
			expect( result ).toContain( 'ERR' );
			expect( result ).toContain( 'details' );
		} );

		test( 'should parse message format', () => {
			const response = JSON.stringify( {
				message: 'Error message here',
			} );
			expect( parseErrorResponse( response, 'Default' ) ).toBe(
				'Error message here'
			);
		} );

		test( 'should return default for unrecognized JSON format', () => {
			const response = JSON.stringify( { unknown: 'format' } );
			expect( parseErrorResponse( response, 'Default' ) ).toBe(
				'Default'
			);
		} );

		test( 'should return plain text for invalid JSON', () => {
			expect( parseErrorResponse( 'Plain text error', 'Default' ) ).toBe(
				'Plain text error'
			);
		} );

		test( 'should prioritize errors array over other formats', () => {
			const response = JSON.stringify( {
				errors: [ { message: 'Array error' } ],
				error: 'Generic error',
				message: 'Message error',
			} );
			expect( parseErrorResponse( response, 'Default' ) ).toBe(
				'Array error'
			);
		} );

		test( 'should prioritize error over message', () => {
			const response = JSON.stringify( {
				error: 'Generic error',
				message: 'Message error',
			} );
			expect( parseErrorResponse( response, 'Default' ) ).toBe(
				'Generic error'
			);
		} );
	} );
} );
