/**
 * Error Handler Tests
 *
 * Tests for errorHandler utility with retry logic and error categorization.
 *
 * @package
 */

import {
	categorizeError,
	determineSeverity,
	isRetryable,
	calculateRetryDelay,
	withRetry,
	formatErrorMessage,
	createErrorHandler,
	errorHandler,
	ERROR_CATEGORIES,
	ERROR_SEVERITY,
} from '../errorHandler';

describe( 'errorHandler', () => {
	describe( 'categorizeError()', () => {
		test( 'should categorize network errors', () => {
			const error = new Error( 'Network request failed' );
			expect( categorizeError( error ) ).toBe( ERROR_CATEGORIES.NETWORK );

			const error2 = new Error( 'Failed to fetch' );
			expect( categorizeError( error2 ) ).toBe(
				ERROR_CATEGORIES.NETWORK
			);

			const error3 = { code: 'econnrefused' };
			expect( categorizeError( error3 ) ).toBe(
				ERROR_CATEGORIES.NETWORK
			);
		} );

		test( 'should categorize timeout errors', () => {
			const error = new Error( 'Request timeout' );
			expect( categorizeError( error ) ).toBe( ERROR_CATEGORIES.TIMEOUT );

			const error2 = { status: 408 };
			expect( categorizeError( error2 ) ).toBe(
				ERROR_CATEGORIES.TIMEOUT
			);
		} );

		test( 'should categorize rate limit errors', () => {
			const error = new Error( 'Rate limit exceeded' );
			expect( categorizeError( error ) ).toBe(
				ERROR_CATEGORIES.RATE_LIMIT
			);

			const error2 = { status: 429 };
			expect( categorizeError( error2 ) ).toBe(
				ERROR_CATEGORIES.RATE_LIMIT
			);
		} );

		test( 'should categorize permission errors', () => {
			const error = new Error( 'Permission denied' );
			expect( categorizeError( error ) ).toBe(
				ERROR_CATEGORIES.PERMISSION
			);

			const error2 = { status: 401 };
			expect( categorizeError( error2 ) ).toBe(
				ERROR_CATEGORIES.PERMISSION
			);

			const error3 = { status: 403 };
			expect( categorizeError( error3 ) ).toBe(
				ERROR_CATEGORIES.PERMISSION
			);
		} );

		test( 'should categorize validation errors', () => {
			const error = new Error( 'Invalid input' );
			expect( categorizeError( error ) ).toBe(
				ERROR_CATEGORIES.VALIDATION
			);

			const error2 = { status: 400 };
			expect( categorizeError( error2 ) ).toBe(
				ERROR_CATEGORIES.VALIDATION
			);
		} );

		test( 'should return unknown for unrecognized errors', () => {
			const error = new Error( 'Some random error' );
			expect( categorizeError( error ) ).toBe( ERROR_CATEGORIES.UNKNOWN );
		} );
	} );

	describe( 'determineSeverity()', () => {
		test( 'should return critical for permission errors', () => {
			expect( determineSeverity( ERROR_CATEGORIES.PERMISSION ) ).toBe(
				ERROR_SEVERITY.CRITICAL
			);
		} );

		test( 'should return critical for quota exceeded errors', () => {
			expect( determineSeverity( ERROR_CATEGORIES.QUOTA_EXCEEDED ) ).toBe(
				ERROR_SEVERITY.CRITICAL
			);
		} );

		test( 'should return critical for validation errors', () => {
			expect( determineSeverity( ERROR_CATEGORIES.VALIDATION ) ).toBe(
				ERROR_SEVERITY.CRITICAL
			);
		} );

		test( 'should return high for not found errors', () => {
			expect( determineSeverity( ERROR_CATEGORIES.NOT_FOUND ) ).toBe(
				ERROR_SEVERITY.HIGH
			);
		} );

		test( 'should return medium for retryable errors', () => {
			expect( determineSeverity( ERROR_CATEGORIES.NETWORK ) ).toBe(
				ERROR_SEVERITY.MEDIUM
			);
			expect( determineSeverity( ERROR_CATEGORIES.TIMEOUT ) ).toBe(
				ERROR_SEVERITY.MEDIUM
			);
			expect( determineSeverity( ERROR_CATEGORIES.RATE_LIMIT ) ).toBe(
				ERROR_SEVERITY.MEDIUM
			);
		} );

		test( 'should return low for unknown errors', () => {
			expect( determineSeverity( ERROR_CATEGORIES.UNKNOWN ) ).toBe(
				ERROR_SEVERITY.LOW
			);
		} );
	} );

	describe( 'isRetryable()', () => {
		test( 'should return true for retryable errors', () => {
			const networkError = new Error( 'Network error' );
			expect( isRetryable( networkError ) ).toBe( true );

			const timeoutError = new Error( 'Timeout' );
			expect( isRetryable( timeoutError ) ).toBe( true );

			const rateLimitError = new Error( 'Rate limit' );
			expect( isRetryable( rateLimitError ) ).toBe( true );
		} );

		test( 'should return false for non-retryable errors', () => {
			const permissionError = new Error( 'Permission denied' );
			expect( isRetryable( permissionError ) ).toBe( false );

			const validationError = new Error( 'Invalid input' );
			expect( isRetryable( validationError ) ).toBe( false );
		} );
	} );

	describe( 'calculateRetryDelay()', () => {
		test( 'should calculate exponential backoff delay', () => {
			const delay1 = calculateRetryDelay( 0 ); // First retry
			expect( delay1 ).toBe( 1000 ); // initialDelay

			const delay2 = calculateRetryDelay( 1 ); // Second retry
			expect( delay2 ).toBe( 2000 ); // initialDelay * 2

			const delay3 = calculateRetryDelay( 2 ); // Third retry
			expect( delay3 ).toBe( 4000 ); // initialDelay * 4
		} );

		test( 'should cap delay at maxDelay', () => {
			const delay = calculateRetryDelay( 10 ); // Very high attempt
			expect( delay ).toBeLessThanOrEqual( 10000 ); // maxDelay
		} );
	} );

	describe( 'withRetry()', () => {
		test( 'should succeed on first attempt', async () => {
			const fn = jest.fn().mockResolvedValue( 'success' );
			const result = await withRetry( fn );

			expect( result ).toBe( 'success' );
			expect( fn ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should retry on retryable errors', async () => {
			const fn = jest
				.fn()
				.mockRejectedValueOnce( new Error( 'Network error' ) )
				.mockResolvedValue( 'success' );

			const result = await withRetry( fn, { maxRetries: 3 } );

			expect( result ).toBe( 'success' );
			expect( fn ).toHaveBeenCalledTimes( 2 );
		} );

		test( 'should exhaust retries and throw', async () => {
			const networkError = new Error( 'Network error' );
			const fn = jest.fn().mockRejectedValue( networkError );

			await expect( withRetry( fn, { maxRetries: 2 } ) ).rejects.toThrow(
				'Network error'
			);
			expect( fn ).toHaveBeenCalledTimes( 3 ); // Initial + 2 retries
		} );

		test( 'should not retry non-retryable errors', async () => {
			const permissionError = new Error( 'Permission denied' );
			const fn = jest.fn().mockRejectedValue( permissionError );

			await expect( withRetry( fn, { maxRetries: 3 } ) ).rejects.toThrow(
				'Permission denied'
			);
			expect( fn ).toHaveBeenCalledTimes( 1 ); // No retries
		} );

		test( 'should call onRetry callback', async () => {
			const onRetry = jest.fn();
			const fn = jest
				.fn()
				.mockRejectedValueOnce( new Error( 'Network error' ) )
				.mockResolvedValue( 'success' );

			await withRetry( fn, { maxRetries: 3, onRetry } );

			expect( onRetry ).toHaveBeenCalledTimes( 1 );
			expect( onRetry ).toHaveBeenCalledWith(
				expect.any( Error ),
				1, // attempt number
				expect.any( Number ) // delay
			);
		} );
	} );

	describe( 'formatErrorMessage()', () => {
		test( 'should format error with step context', () => {
			const error = new Error( 'Something went wrong' );
			const message = formatErrorMessage( error, { stepId: 'testStep' } );

			expect( message ).toContain( 'testStep' );
			expect( message ).toContain( 'Something went wrong' );
		} );

		test( 'should add category-specific guidance', () => {
			const networkError = new Error( 'Network request failed' );
			const message = formatErrorMessage( networkError );

			expect( message ).toContain( 'internet connection' );
		} );
	} );

	describe( 'createErrorHandler()', () => {
		test( 'should create error handler instance', () => {
			const handler = createErrorHandler();

			expect( handler ).toHaveProperty( 'executeWithRetry' );
			expect( handler ).toHaveProperty( 'categorize' );
			expect( handler ).toHaveProperty( 'isRetryable' );
			expect( handler ).toHaveProperty( 'formatMessage' );
		} );

		test( 'should use custom configuration', async () => {
			const handler = createErrorHandler( { maxRetries: 5 } );
			const fn = jest
				.fn()
				.mockRejectedValue( new Error( 'Network error' ) );

			await expect( handler.executeWithRetry( fn ) ).rejects.toThrow();
			expect( fn ).toHaveBeenCalledTimes( 6 ); // Initial + 5 retries
		} );
	} );

	describe( 'default errorHandler', () => {
		test( 'should be available as singleton', () => {
			expect( errorHandler ).toBeDefined();
			expect( errorHandler.executeWithRetry ).toBeDefined();
		} );
	} );
} );
