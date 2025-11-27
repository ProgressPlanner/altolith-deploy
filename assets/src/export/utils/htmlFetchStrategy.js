/**
 * HTML Fetch Strategy Manager
 *
 * Tracks PHP endpoint health and determines whether to use PHP-based
 * fetching or fall back to JavaScript fetch for HTML content.
 *
 * Strategy switches to JS-only when:
 * - CORS error is detected (immediate switch)
 * - Success rate drops below threshold after minimum attempts
 * - Too many consecutive failures occur
 *
 * @since 1.0.0
 */

/**
 * Fetch strategy types
 */
export const STRATEGY = {
	PHP_FIRST: 'php_first',
	JS_ONLY: 'js_only',
};

/**
 * Error types for categorization
 */
export const ERROR_TYPE = {
	CORS: 'cors',
	NETWORK: 'network',
	TIMEOUT: 'timeout',
	PHP_ERROR: 'php_error',
	BATCH_ERROR: 'batch_error',
	NOT_HTML: 'not_html',
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
	minSuccessRate: 0.7,
	minAttemptsForEvaluation: 10,
	maxConsecutiveFailures: 5,
	maxUrlRetries: 2,
};

/**
 * HTML Fetch Strategy Manager
 *
 * Manages the strategy for fetching HTML content, tracking success rates
 * and determining when to fall back from PHP to JavaScript fetching.
 */
export class HtmlFetchStrategyManager {
	/**
	 * Create strategy manager
	 *
	 * @param {Object} config                          Configuration options
	 * @param {number} config.minSuccessRate           Minimum success rate before switching to JS (default: 0.7)
	 * @param {number} config.minAttemptsForEvaluation Minimum attempts before evaluating rate (default: 10)
	 * @param {number} config.maxConsecutiveFailures   Max consecutive failures before switch (default: 5)
	 * @param {number} config.maxUrlRetries            Max retries per URL before using JS (default: 2)
	 */
	constructor( config = {} ) {
		this.stats = {
			totalAttempts: 0,
			totalSuccesses: 0,
			consecutiveFailures: 0,
			failedUrls: new Map(),
		};
		this.strategy = STRATEGY.PHP_FIRST;

		this.config = {
			...DEFAULT_CONFIG,
			...config,
		};
	}

	/**
	 * Record the result of a PHP fetch attempt
	 *
	 * @param {string}      url       URL that was fetched
	 * @param {boolean}     success   Whether the fetch succeeded
	 * @param {string|null} errorType Type of error if failed (from ERROR_TYPE)
	 */
	recordResult( url, success, errorType = null ) {
		this.stats.totalAttempts++;

		if ( success ) {
			this.stats.totalSuccesses++;
			this.stats.consecutiveFailures = 0;
			this.stats.failedUrls.delete( url );
		} else {
			this.stats.consecutiveFailures++;

			const urlData = this.stats.failedUrls.get( url ) || { attempts: 0 };
			urlData.attempts++;
			urlData.lastError = errorType;
			this.stats.failedUrls.set( url, urlData );

			this.evaluateStrategy( errorType );
		}
	}

	/**
	 * Evaluate whether to switch strategy based on error
	 *
	 * @param {string|null} errorType Error type that occurred
	 */
	evaluateStrategy( errorType ) {
		// CORS = immediate switch (environment issue)
		if ( errorType === ERROR_TYPE.CORS ) {
			this.strategy = STRATEGY.JS_ONLY;
			return;
		}

		// Too many consecutive failures
		if ( this.stats.consecutiveFailures >= this.config.maxConsecutiveFailures ) {
			this.strategy = STRATEGY.JS_ONLY;
			return;
		}

		// Check success rate after minimum attempts
		if ( this.stats.totalAttempts >= this.config.minAttemptsForEvaluation ) {
			const rate = this.stats.totalSuccesses / this.stats.totalAttempts;
			if ( rate < this.config.minSuccessRate ) {
				this.strategy = STRATEGY.JS_ONLY;
			}
		}
	}

	/**
	 * Check if PHP should be used for a specific URL
	 *
	 * @param {string} url URL to check
	 * @return {boolean} True if PHP should be used
	 */
	shouldUsePHP( url ) {
		if ( this.strategy === STRATEGY.JS_ONLY ) {
			return false;
		}

		const urlData = this.stats.failedUrls.get( url );
		if ( urlData && urlData.attempts >= this.config.maxUrlRetries ) {
			return false; // Too many failures for this URL
		}

		return true;
	}

	/**
	 * Get current strategy status
	 *
	 * @return {Object} Status object with strategy info
	 */
	getStatus() {
		let successRate;
		if ( this.stats.totalAttempts > 0 ) {
			const rate = (
				( this.stats.totalSuccesses / this.stats.totalAttempts ) *
				100
			).toFixed( 1 );
			successRate = `${ rate }%`;
		} else {
			successRate = 'N/A';
		}

		return {
			strategy: this.strategy,
			totalAttempts: this.stats.totalAttempts,
			totalSuccesses: this.stats.totalSuccesses,
			successRate,
			consecutiveFailures: this.stats.consecutiveFailures,
			failedUrlCount: this.stats.failedUrls.size,
			isUsingFallback: this.strategy === STRATEGY.JS_ONLY,
		};
	}

	/**
	 * Reset the strategy manager to initial state
	 */
	reset() {
		this.stats.totalAttempts = 0;
		this.stats.totalSuccesses = 0;
		this.stats.consecutiveFailures = 0;
		this.stats.failedUrls.clear();
		this.strategy = STRATEGY.PHP_FIRST;
	}
}

/**
 * Categorize an error for strategy evaluation
 *
 * @param {Error}  error        Error object
 * @param {string} responseText Optional response text
 * @return {string} Error type from ERROR_TYPE
 */
export function categorizeError( error, responseText = '' ) {
	const message = error?.message?.toLowerCase() || '';
	const errorName = error?.name || '';

	// CORS errors
	if (
		message.includes( 'cors' ) ||
		message.includes( 'cross-origin' ) ||
		( errorName === 'TypeError' && message.includes( 'fetch' ) )
	) {
		return ERROR_TYPE.CORS;
	}

	// Network errors
	if (
		message.includes( 'network' ) ||
		message.includes( 'failed to fetch' ) ||
		message.includes( 'econnrefused' )
	) {
		return ERROR_TYPE.NETWORK;
	}

	// Timeout
	if ( message.includes( 'timeout' ) || errorName === 'AbortError' ) {
		return ERROR_TYPE.TIMEOUT;
	}

	// PHP errors in response
	if (
		responseText?.includes( 'Fatal error' ) ||
		responseText?.includes( 'Parse error' ) ||
		responseText?.startsWith( '<?php' )
	) {
		return ERROR_TYPE.PHP_ERROR;
	}

	return ERROR_TYPE.PHP_ERROR;
}
