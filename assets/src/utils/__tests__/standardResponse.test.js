/**
 * Standard Response Tests
 *
 */

import {
	createSuccessResponse,
	createErrorResponse,
} from '../standardResponse';

describe( 'standardResponse', () => {
	describe( 'createSuccessResponse()', () => {
		test( 'should create success response with null data', () => {
			const result = createSuccessResponse();
			expect( result.success ).toBe( true );
			expect( result.data ).toBeNull();
		} );

		test( 'should create success response with data', () => {
			const data = { id: 1, name: 'test' };
			const result = createSuccessResponse( data );
			expect( result.success ).toBe( true );
			expect( result.data ).toEqual( data );
		} );

		test( 'should add message to object data', () => {
			const data = { id: 1 };
			const result = createSuccessResponse( data, 'Operation complete' );
			expect( result.data.id ).toBe( 1 );
			expect( result.data.message ).toBe( 'Operation complete' );
		} );

		test( 'should create data with message when data is null', () => {
			const result = createSuccessResponse( null, 'Success!' );
			expect( result.data ).toEqual( { message: 'Success!' } );
		} );

		test( 'should handle primitive data without message', () => {
			const result = createSuccessResponse( 42 );
			expect( result.data ).toBe( 42 );
		} );

		test( 'should wrap message when data is primitive', () => {
			const result = createSuccessResponse( 'primitive', 'Message' );
			expect( result.data ).toEqual( { message: 'Message' } );
		} );
	} );

	describe( 'createErrorResponse()', () => {
		test( 'should create error response from string', () => {
			const result = createErrorResponse( 'Something went wrong' );
			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Something went wrong' );
		} );

		test( 'should create error response from Error object', () => {
			const error = new Error( 'Network failure' );
			const result = createErrorResponse( error );
			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Network failure' );
		} );

		test( 'should handle null error', () => {
			const result = createErrorResponse( null );
			expect( result.success ).toBe( false );
			expect( result.error ).toBe( 'Unknown error' );
		} );

		test( 'should include errors array when provided', () => {
			const errors = [ 'Error 1', 'Error 2' ];
			const result = createErrorResponse( 'Main error', errors );
			expect( result.error ).toBe( 'Main error' );
			expect( result.errors ).toEqual( errors );
		} );

		test( 'should not include errors for empty array', () => {
			const result = createErrorResponse( 'Error', [] );
			expect( result.errors ).toBeUndefined();
		} );

		test( 'should not include errors when null', () => {
			const result = createErrorResponse( 'Error', null );
			expect( result.errors ).toBeUndefined();
		} );
	} );
} );
