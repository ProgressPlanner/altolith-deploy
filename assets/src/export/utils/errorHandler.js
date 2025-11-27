/**
 * Error Handler Utility
 *
 * Provides error categorization, retry logic, and error recovery strategies
 * for the export workflow.
 *
 */

import { __, sprintf } from '@wordpress/i18n';
import { doAction } from '@wordpress/hooks';

/**
 * Error categories for error handling strategies.
 *
 * @type {Object<string, string>}
 */
export const ERROR_CATEGORIES = {
	NETWORK: 'network',
	TIMEOUT: 'timeout',
	VALIDATION: 'validation',
	PERMISSION: 'permission',
	NOT_FOUND: 'not_found',
	RATE_LIMIT: 'rate_limit',
	QUOTA_EXCEEDED: 'quota_exceeded',
	UNKNOWN: 'unknown',
};

/**
 * Error severity levels.
 *
 * @type {Object<string, string>}
 */
export const ERROR_SEVERITY = {
	CRITICAL: 'critical',
	HIGH: 'high',
	MEDIUM: 'medium',
	LOW: 'low',
};

/**
 * Default retry configuration.
 *
 * @type {Object}
 */
const DEFAULT_RETRY_CONFIG = {
	maxRetries: 3,
	initialDelay: 1000, // 1 second
	maxDelay: 10000, // 10 seconds
	backoffMultiplier: 2,
	retryableCategories: [
		ERROR_CATEGORIES.NETWORK,
		ERROR_CATEGORIES.TIMEOUT,
		ERROR_CATEGORIES.RATE_LIMIT,
	],
};

/**
 * Categorize an error based on its properties.
 *
 * @param {Error} error Error object to categorize.
 * @return {string} Error category.
 */
export function categorizeError( error ) {
	if ( ! error ) {
		return ERROR_CATEGORIES.UNKNOWN;
	}

	const message = error.message?.toLowerCase() || '';
	const code = error.code?.toLowerCase() || '';
	const status = error.status || error.statusCode;

	// Network errors
	if (
		message.includes( 'network' ) ||
		message.includes( 'fetch' ) ||
		message.includes( 'connection' ) ||
		code === 'network_error' ||
		code === 'econnrefused' ||
		code === 'enotfound'
	) {
		return ERROR_CATEGORIES.NETWORK;
	}

	// Timeout errors
	if (
		message.includes( 'timeout' ) ||
		code === 'timeout' ||
		status === 408
	) {
		return ERROR_CATEGORIES.TIMEOUT;
	}

	// Rate limit errors
	if (
		message.includes( 'rate limit' ) ||
		message.includes( 'too many requests' ) ||
		code === 'rate_limit' ||
		status === 429
	) {
		return ERROR_CATEGORIES.RATE_LIMIT;
	}

	// Quota exceeded errors
	if (
		message.includes( 'quota' ) ||
		message.includes( 'storage' ) ||
		code === 'quota_exceeded' ||
		status === 507
	) {
		return ERROR_CATEGORIES.QUOTA_EXCEEDED;
	}

	// Permission errors
	if (
		message.includes( 'permission' ) ||
		message.includes( 'unauthorized' ) ||
		message.includes( 'forbidden' ) ||
		code === 'permission_denied' ||
		status === 401 ||
		status === 403
	) {
		return ERROR_CATEGORIES.PERMISSION;
	}

	// Not found errors
	if (
		message.includes( 'not found' ) ||
		code === 'not_found' ||
		status === 404
	) {
		return ERROR_CATEGORIES.NOT_FOUND;
	}

	// Validation errors
	if (
		message.includes( 'validation' ) ||
		message.includes( 'invalid' ) ||
		code === 'validation_error' ||
		status === 400 ||
		status === 422
	) {
		return ERROR_CATEGORIES.VALIDATION;
	}

	return ERROR_CATEGORIES.UNKNOWN;
}

/**
 * Determine error severity based on category and context.
 *
 * @param {string} category Error category.
 * @return {string} Error severity level.
 */
export function determineSeverity( category ) {
	// Critical errors that should stop the workflow
	if (
		category === ERROR_CATEGORIES.PERMISSION ||
		category === ERROR_CATEGORIES.QUOTA_EXCEEDED ||
		category === ERROR_CATEGORIES.VALIDATION
	) {
		return ERROR_SEVERITY.CRITICAL;
	}

	// High severity errors that may require user intervention
	if ( category === ERROR_CATEGORIES.NOT_FOUND ) {
		return ERROR_SEVERITY.HIGH;
	}

	// Medium severity errors that can be retried
	if (
		category === ERROR_CATEGORIES.NETWORK ||
		category === ERROR_CATEGORIES.TIMEOUT ||
		category === ERROR_CATEGORIES.RATE_LIMIT
	) {
		return ERROR_SEVERITY.MEDIUM;
	}

	// Low severity for unknown errors (may be recoverable)
	return ERROR_SEVERITY.LOW;
}

/**
 * Check if an error is retryable.
 *
 * @param {Error}  error  Error to check.
 * @param {Object} config Retry configuration.
 * @return {boolean} True if error is retryable.
 */
export function isRetryable( error, config = {} ) {
	const category = categorizeError( error );
	const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

	return retryConfig.retryableCategories.includes( category );
}

/**
 * Calculate delay for retry attempt using exponential backoff.
 *
 * @param {number} attemptNumber Current attempt number (0-indexed).
 * @param {Object} config        Retry configuration.
 * @return {number} Delay in milliseconds.
 */
export function calculateRetryDelay( attemptNumber, config = {} ) {
	const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
	const { initialDelay, maxDelay, backoffMultiplier } = retryConfig;

	const delay = initialDelay * Math.pow( backoffMultiplier, attemptNumber );
	return Math.min( delay, maxDelay );
}

/**
 * Execute a function with retry logic.
 *
 * @param {Function} fn                  Function to execute.
 * @param {Object}   options             Retry options.
 * @param {number}   options.maxRetries  Maximum number of retries.
 * @param {Function} options.onRetry     Callback called before each retry.
 * @param {Function} options.shouldRetry Function to determine if error is retryable.
 * @return {Promise<any>} Result of function execution.
 */
export async function withRetry( fn, options = {} ) {
	const config = { ...DEFAULT_RETRY_CONFIG, ...options };
	const { maxRetries, onRetry, shouldRetry } = config;

	let lastError = null;

	for ( let attempt = 0; attempt <= maxRetries; attempt++ ) {
		try {
			return await fn();
		} catch ( error ) {
			lastError = error;

			// Check if we should retry
			const canRetry =
				attempt < maxRetries &&
				( shouldRetry
					? shouldRetry( error, attempt )
					: isRetryable( error, config ) );

			if ( ! canRetry ) {
				throw error;
			}

			// Calculate delay and wait
			const delay = calculateRetryDelay( attempt, config );

			if ( onRetry ) {
				onRetry( error, attempt + 1, delay );
			}

			await new Promise( ( resolve ) => setTimeout( resolve, delay ) );
		}
	}

	// All retries exhausted
	throw lastError;
}

/**
 * Format error message for user display.
 *
 * @param {Error}  error   Error object.
 * @param {Object} context Error context.
 * @return {string} Formatted error message.
 */
export function formatErrorMessage( error, context = {} ) {
	const category = categorizeError( error );
	const { stepId, operation } = context;

	let message =
		error.message ||
		__( 'An unknown error occurred', 'aether-site-exporter' );

	// Add context information
	if ( stepId ) {
		message = sprintf(
			/* translators: 1: Step ID, 2: Error message */
			__( 'Error in step "%1$s": %2$s', 'aether-site-exporter' ),
			stepId,
			message
		);
	}

	if ( operation ) {
		message = sprintf(
			/* translators: 1: Operation name, 2: Error message */
			__( 'Error during %1$s: %2$s', 'aether-site-exporter' ),
			operation,
			message
		);
	}

	// Add category-specific guidance
	switch ( category ) {
		case ERROR_CATEGORIES.NETWORK:
			message +=
				' ' +
				__(
					'Please check your internet connection and try again.',
					'aether-site-exporter'
				);
			break;
		case ERROR_CATEGORIES.TIMEOUT:
			message +=
				' ' +
				__(
					'The operation took too long. Please try again.',
					'aether-site-exporter'
				);
			break;
		case ERROR_CATEGORIES.RATE_LIMIT:
			message +=
				' ' +
				__(
					'Too many requests. Please wait a moment and try again.',
					'aether-site-exporter'
				);
			break;
		case ERROR_CATEGORIES.QUOTA_EXCEEDED:
			message +=
				' ' +
				__(
					'Storage quota exceeded. Please free up space and try again.',
					'aether-site-exporter'
				);
			break;
		case ERROR_CATEGORIES.PERMISSION:
			message +=
				' ' +
				__(
					'Permission denied. Please check your access rights.',
					'aether-site-exporter'
				);
			break;
	}

	return message;
}

/**
 * Create an error handler instance with custom configuration.
 *
 * @param {Object} config Error handler configuration.
 * @return {Object} Error handler instance.
 */
export function createErrorHandler( config = {} ) {
	const handlerConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

	return {
		/**
		 * Execute function with retry logic.
		 *
		 * @param {Function} fn      Function to execute.
		 * @param {Object}   options Additional retry options.
		 * @return {Promise<any>} Result.
		 */
		async executeWithRetry( fn, options = {} ) {
			return withRetry( fn, { ...handlerConfig, ...options } );
		},

		/**
		 * Categorize an error.
		 *
		 * @param {Error} error Error to categorize.
		 * @return {string} Error category.
		 */
		categorize( error ) {
			return categorizeError( error );
		},

		/**
		 * Check if error is retryable.
		 *
		 * @param {Error} error Error to check.
		 * @return {boolean} True if retryable.
		 */
		isRetryable( error ) {
			return isRetryable( error, handlerConfig );
		},

		/**
		 * Format error message.
		 *
		 * @param {Error}  error   Error to format.
		 * @param {Object} context Error context.
		 * @return {string} Formatted message.
		 */
		formatMessage( error, context = {} ) {
			return formatErrorMessage( error, context );
		},
	};
}

/**
 * Handle step execution error with full context.
 *
 * Centralizes error handling logic for step execution, including:
 * - Console logging
 * - Error categorization and enhancement
 * - Callback and action hooks
 * - Severity-based error handling
 *
 * @param {Error}    error            Error that occurred.
 * @param {string}   stepId           Step ID where error occurred.
 * @param {Object}   executionContext Execution context.
 * @param {Object}   options          Error handling options.
 * @param {Function} options.onError  Error callback.
 * @param {Object}   step             Step definition (optional).
 * @return {Error} Enhanced error object.
 */
export function handleStepError(
	error,
	stepId,
	executionContext,
	options = {},
	step = null
) {
	const { onError = () => {} } = options;

	// Log error to console in development
	if ( typeof window !== 'undefined' && window.console ) {
		// eslint-disable-next-line no-console
		console.error(
			`[Aether] StepExecutor - Step "${ stepId }" failed:`,
			error
		);
		// eslint-disable-next-line no-console
		console.error( '[Aether] Error details:', {
			message: error.message,
			stack: error.stack,
			stepId,
			providerInstance:
				executionContext.currentProviderInstance?.id || 'N/A',
		} );
	}

	// Categorize and format error
	const category = categorizeError( error );
	const severity = determineSeverity( category );
	const formattedMessage = formatErrorMessage( error, {
		stepId,
		operation: step?.label || stepId,
	} );

	// Create enhanced error object
	const enhancedError = {
		...error,
		category,
		severity,
		stepId,
		formattedMessage,
		originalMessage: error.message,
	};

	// Call error callback
	onError( stepId, enhancedError );

	// Fire error action hook
	doAction(
		`aether.export.step.${ stepId }.error`,
		enhancedError,
		executionContext,
		executionContext.currentProviderInstance || null
	);

	// For critical errors, create throwable error
	if ( severity === ERROR_SEVERITY.CRITICAL ) {
		return new Error( formattedMessage );
	}

	// For other errors, wrap with step context
	return new Error( formattedMessage );
}

/**
 * Default error handler instance.
 */
export const errorHandler = createErrorHandler();
