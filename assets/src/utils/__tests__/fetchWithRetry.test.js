/**
 * Tests for fetchWithRetry utility.
 *
 */

import pRetry from 'p-retry';
import { fetchWithRetry } from '../fetchWithRetry';
import {
	MAX_RETRIES,
	RETRY_INITIAL_DELAY,
	RETRY_MAX_DELAY,
} from '../../constants/timing';

// Mock p-retry to control retry behavior in tests.
jest.mock( 'p-retry', () => {
	const actualModule = jest.requireActual( 'p-retry' );
	const actualPRetry = actualModule.default || actualModule;
	const mockPRetry = jest.fn( async ( fn, options ) => {
		return actualPRetry( fn, options );
	} );
	mockPRetry.AbortError = actualPRetry.AbortError;
	return mockPRetry;
} );

describe( 'fetchWithRetry', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		global.fetch = jest.fn();
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	describe( 'fetchWithRetry()', () => {
		it( 'should successfully fetch on first attempt', async () => {
			const mockResponse = {
				ok: true,
				status: 200,
				statusText: 'OK',
			};
			global.fetch.mockResolvedValueOnce( mockResponse );

			const result = await fetchWithRetry( 'https://example.com/api' );

			expect( result ).toBe( mockResponse );
			expect( global.fetch ).toHaveBeenCalledTimes( 1 );
			expect( global.fetch ).toHaveBeenCalledWith(
				'https://example.com/api',
				{}
			);
		} );

		it( 'should retry on failed request and eventually succeed', async () => {
			const mockErrorResponse = {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
			};
			const mockSuccessResponse = {
				ok: true,
				status: 200,
				statusText: 'OK',
			};

			global.fetch
				.mockResolvedValueOnce( mockErrorResponse )
				.mockResolvedValueOnce( mockErrorResponse )
				.mockResolvedValueOnce( mockSuccessResponse );

			const result = await fetchWithRetry( 'https://example.com/api' );

			expect( result ).toBe( mockSuccessResponse );
			expect( global.fetch ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'should throw error after max retries exceeded', async () => {
			const mockErrorResponse = {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
			};

			global.fetch.mockResolvedValue( mockErrorResponse );

			await expect(
				fetchWithRetry( 'https://example.com/api' )
			).rejects.toThrow( 'HTTP 500: Internal Server Error' );

			// MAX_RETRIES + 1 initial attempt.
			expect( global.fetch ).toHaveBeenCalledTimes( MAX_RETRIES + 1 );
		} );

		it( 'should use default retry configuration from timing.js', async () => {
			const mockResponse = { ok: true, status: 200 };
			global.fetch.mockResolvedValueOnce( mockResponse );

			await fetchWithRetry( 'https://example.com/api' );

			expect( pRetry ).toHaveBeenCalledWith(
				expect.any( Function ),
				expect.objectContaining( {
					retries: MAX_RETRIES,
					minTimeout: RETRY_INITIAL_DELAY,
					maxTimeout: RETRY_MAX_DELAY,
				} )
			);
		} );

		it( 'should allow custom retry configuration', async () => {
			const mockResponse = { ok: true, status: 200 };
			global.fetch.mockResolvedValueOnce( mockResponse );

			const customConfig = {
				retries: 5,
				minTimeout: 500,
				maxTimeout: 10000,
			};

			await fetchWithRetry( 'https://example.com/api', {}, customConfig );

			expect( pRetry ).toHaveBeenCalledWith(
				expect.any( Function ),
				expect.objectContaining( customConfig )
			);
		} );

		it( 'should pass fetch options correctly', async () => {
			const mockResponse = { ok: true, status: 200 };
			global.fetch.mockResolvedValueOnce( mockResponse );

			const options = {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { test: 'data' } ),
			};

			await fetchWithRetry( 'https://example.com/api', options );

			expect( global.fetch ).toHaveBeenCalledWith(
				'https://example.com/api',
				options
			);
		} );

		it( 'should include response and status in error', async () => {
			const mockErrorResponse = {
				ok: false,
				status: 404,
				statusText: 'Not Found',
			};
			global.fetch.mockResolvedValue( mockErrorResponse );

			await expect(
				fetchWithRetry( 'https://example.com/api' )
			).rejects.toThrow( 'HTTP 404: Not Found' );
		} );

		it( 'should call onFailedAttempt callback', async () => {
			const mockErrorResponse = {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
			};
			const mockSuccessResponse = { ok: true, status: 200 };

			global.fetch
				.mockResolvedValueOnce( mockErrorResponse )
				.mockResolvedValueOnce( mockSuccessResponse );

			const onFailedAttempt = jest.fn();

			await fetchWithRetry(
				'https://example.com/api',
				{},
				{
					onFailedAttempt,
				}
			);

			expect( onFailedAttempt ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
