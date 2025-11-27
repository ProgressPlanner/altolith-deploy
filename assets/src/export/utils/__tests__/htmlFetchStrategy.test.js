/**
 * HTML Fetch Strategy Tests
 *
 * Tests for HtmlFetchStrategyManager utility that tracks PHP endpoint health
 * and determines when to fall back from PHP to JavaScript fetching.
 */

import {
	STRATEGY,
	ERROR_TYPE,
	HtmlFetchStrategyManager,
	categorizeError,
} from '../htmlFetchStrategy';

describe( 'htmlFetchStrategy', () => {
	describe( 'STRATEGY constants', () => {
		test( 'should export PHP_FIRST strategy', () => {
			expect( STRATEGY.PHP_FIRST ).toBe( 'php_first' );
		} );

		test( 'should export JS_ONLY strategy', () => {
			expect( STRATEGY.JS_ONLY ).toBe( 'js_only' );
		} );
	} );

	describe( 'ERROR_TYPE constants', () => {
		test( 'should export all error types', () => {
			expect( ERROR_TYPE.CORS ).toBe( 'cors' );
			expect( ERROR_TYPE.NETWORK ).toBe( 'network' );
			expect( ERROR_TYPE.TIMEOUT ).toBe( 'timeout' );
			expect( ERROR_TYPE.PHP_ERROR ).toBe( 'php_error' );
			expect( ERROR_TYPE.BATCH_ERROR ).toBe( 'batch_error' );
			expect( ERROR_TYPE.NOT_HTML ).toBe( 'not_html' );
		} );
	} );

	describe( 'HtmlFetchStrategyManager', () => {
		let manager;

		beforeEach( () => {
			manager = new HtmlFetchStrategyManager();
		} );

		describe( 'constructor', () => {
			test( 'should initialize with default config', () => {
				const status = manager.getStatus();

				expect( status.strategy ).toBe( STRATEGY.PHP_FIRST );
				expect( status.totalAttempts ).toBe( 0 );
				expect( status.totalSuccesses ).toBe( 0 );
				expect( status.consecutiveFailures ).toBe( 0 );
				expect( status.failedUrlCount ).toBe( 0 );
				expect( status.isUsingFallback ).toBe( false );
			} );

			test( 'should accept custom config', () => {
				const customManager = new HtmlFetchStrategyManager( {
					minSuccessRate: 0.5,
					minAttemptsForEvaluation: 5,
					maxConsecutiveFailures: 3,
					maxUrlRetries: 1,
				} );

				// Test with custom config values
				// Need 5 attempts before evaluation (custom minAttemptsForEvaluation)
				// 3 consecutive failures should switch (custom maxConsecutiveFailures)
				customManager.recordResult(
					'http://test.com/1',
					false,
					'php_error'
				);
				customManager.recordResult(
					'http://test.com/2',
					false,
					'php_error'
				);
				customManager.recordResult(
					'http://test.com/3',
					false,
					'php_error'
				);

				expect( customManager.getStatus().isUsingFallback ).toBe(
					true
				);
			} );
		} );

		describe( 'recordResult()', () => {
			test( 'should increment totalAttempts on each call', () => {
				manager.recordResult( 'http://test.com/page1', true );
				expect( manager.getStatus().totalAttempts ).toBe( 1 );

				manager.recordResult( 'http://test.com/page2', false );
				expect( manager.getStatus().totalAttempts ).toBe( 2 );
			} );

			test( 'should increment totalSuccesses on success', () => {
				manager.recordResult( 'http://test.com/page1', true );
				manager.recordResult( 'http://test.com/page2', true );

				const status = manager.getStatus();
				expect( status.totalSuccesses ).toBe( 2 );
			} );

			test( 'should reset consecutiveFailures on success', () => {
				manager.recordResult(
					'http://test.com/page1',
					false,
					'php_error'
				);
				manager.recordResult(
					'http://test.com/page2',
					false,
					'php_error'
				);
				expect( manager.getStatus().consecutiveFailures ).toBe( 2 );

				manager.recordResult( 'http://test.com/page3', true );
				expect( manager.getStatus().consecutiveFailures ).toBe( 0 );
			} );

			test( 'should track consecutive failures', () => {
				manager.recordResult(
					'http://test.com/page1',
					false,
					'php_error'
				);
				manager.recordResult(
					'http://test.com/page2',
					false,
					'php_error'
				);
				manager.recordResult(
					'http://test.com/page3',
					false,
					'php_error'
				);

				expect( manager.getStatus().consecutiveFailures ).toBe( 3 );
			} );

			test( 'should track failed URLs', () => {
				manager.recordResult(
					'http://test.com/page1',
					false,
					'php_error'
				);
				manager.recordResult(
					'http://test.com/page1',
					false,
					'network'
				);

				expect( manager.getStatus().failedUrlCount ).toBe( 1 );
			} );

			test( 'should remove URL from failed list on success', () => {
				manager.recordResult(
					'http://test.com/page1',
					false,
					'php_error'
				);
				expect( manager.getStatus().failedUrlCount ).toBe( 1 );

				manager.recordResult( 'http://test.com/page1', true );
				expect( manager.getStatus().failedUrlCount ).toBe( 0 );
			} );
		} );

		describe( 'strategy switching', () => {
			test( 'should switch to JS_ONLY on CORS error immediately', () => {
				manager.recordResult(
					'http://test.com/page1',
					false,
					ERROR_TYPE.CORS
				);

				expect( manager.getStatus().strategy ).toBe( STRATEGY.JS_ONLY );
				expect( manager.getStatus().isUsingFallback ).toBe( true );
			} );

			test( 'should switch to JS_ONLY after max consecutive failures', () => {
				// Default maxConsecutiveFailures is 5
				for ( let i = 0; i < 5; i++ ) {
					manager.recordResult(
						`http://test.com/page${ i }`,
						false,
						'php_error'
					);
				}

				expect( manager.getStatus().strategy ).toBe( STRATEGY.JS_ONLY );
			} );

			test( 'should switch to JS_ONLY when success rate drops below threshold', () => {
				// Need at least 10 attempts (minAttemptsForEvaluation)
				// Success rate must be below 0.7 (minSuccessRate)
				// 3 successes + 7 failures = 30% success rate
				for ( let i = 0; i < 3; i++ ) {
					manager.recordResult(
						`http://test.com/success${ i }`,
						true
					);
				}
				for ( let i = 0; i < 7; i++ ) {
					manager.recordResult(
						`http://test.com/fail${ i }`,
						false,
						'php_error'
					);
				}

				expect( manager.getStatus().strategy ).toBe( STRATEGY.JS_ONLY );
			} );

			test( 'should not switch with high success rate', () => {
				// 8 successes + 2 failures = 80% success rate (above 70% threshold)
				for ( let i = 0; i < 8; i++ ) {
					manager.recordResult(
						`http://test.com/success${ i }`,
						true
					);
				}
				for ( let i = 0; i < 2; i++ ) {
					manager.recordResult(
						`http://test.com/fail${ i }`,
						false,
						'php_error'
					);
				}

				expect( manager.getStatus().strategy ).toBe(
					STRATEGY.PHP_FIRST
				);
			} );

			test( 'should not evaluate success rate before min attempts', () => {
				// Only 5 attempts (below minAttemptsForEvaluation of 10)
				// Even with 0% success rate, shouldn't switch based on rate
				for ( let i = 0; i < 4; i++ ) {
					manager.recordResult(
						`http://test.com/fail${ i }`,
						false,
						'php_error'
					);
				}

				// Not yet at max consecutive failures (5) and not enough attempts for rate evaluation
				expect( manager.getStatus().strategy ).toBe(
					STRATEGY.PHP_FIRST
				);
			} );
		} );

		describe( 'shouldUsePHP()', () => {
			test( 'should return true when strategy is PHP_FIRST', () => {
				expect( manager.shouldUsePHP( 'http://test.com/page1' ) ).toBe(
					true
				);
			} );

			test( 'should return false when strategy is JS_ONLY', () => {
				// Force JS_ONLY via CORS error
				manager.recordResult(
					'http://test.com/page1',
					false,
					ERROR_TYPE.CORS
				);

				expect( manager.shouldUsePHP( 'http://test.com/page2' ) ).toBe(
					false
				);
			} );

			test( 'should return false for URL with too many failures', () => {
				// Default maxUrlRetries is 2
				manager.recordResult(
					'http://test.com/problem',
					false,
					'php_error'
				);
				manager.recordResult(
					'http://test.com/problem',
					false,
					'php_error'
				);

				// URL has 2 failures, which equals maxUrlRetries threshold
				expect(
					manager.shouldUsePHP( 'http://test.com/problem' )
				).toBe( false );
			} );

			test( 'should return true for URL with fewer failures than max', () => {
				manager.recordResult(
					'http://test.com/page1',
					false,
					'php_error'
				);

				// URL has 1 failure, below maxUrlRetries of 2
				expect( manager.shouldUsePHP( 'http://test.com/page1' ) ).toBe(
					true
				);
			} );

			test( 'should return true for never-tried URLs', () => {
				expect(
					manager.shouldUsePHP( 'http://test.com/new-page' )
				).toBe( true );
			} );
		} );

		describe( 'getStatus()', () => {
			test( 'should return success rate as N/A when no attempts', () => {
				const status = manager.getStatus();
				expect( status.successRate ).toBe( 'N/A' );
			} );

			test( 'should calculate success rate percentage', () => {
				manager.recordResult( 'http://test.com/page1', true );
				manager.recordResult( 'http://test.com/page2', true );
				manager.recordResult(
					'http://test.com/page3',
					false,
					'php_error'
				);
				manager.recordResult( 'http://test.com/page4', true );

				const status = manager.getStatus();
				expect( status.successRate ).toBe( '75.0%' );
			} );

			test( 'should include all status properties', () => {
				manager.recordResult( 'http://test.com/page1', true );
				manager.recordResult(
					'http://test.com/page2',
					false,
					'php_error'
				);

				const status = manager.getStatus();

				expect( status ).toHaveProperty( 'strategy' );
				expect( status ).toHaveProperty( 'totalAttempts' );
				expect( status ).toHaveProperty( 'totalSuccesses' );
				expect( status ).toHaveProperty( 'successRate' );
				expect( status ).toHaveProperty( 'consecutiveFailures' );
				expect( status ).toHaveProperty( 'failedUrlCount' );
				expect( status ).toHaveProperty( 'isUsingFallback' );
			} );
		} );

		describe( 'reset()', () => {
			test( 'should reset all state to initial values', () => {
				// Add some state
				manager.recordResult( 'http://test.com/page1', true );
				manager.recordResult(
					'http://test.com/page2',
					false,
					ERROR_TYPE.CORS
				);

				// Verify state changed
				expect( manager.getStatus().totalAttempts ).toBe( 2 );
				expect( manager.getStatus().isUsingFallback ).toBe( true );

				// Reset
				manager.reset();

				// Verify reset
				const status = manager.getStatus();
				expect( status.totalAttempts ).toBe( 0 );
				expect( status.totalSuccesses ).toBe( 0 );
				expect( status.consecutiveFailures ).toBe( 0 );
				expect( status.failedUrlCount ).toBe( 0 );
				expect( status.strategy ).toBe( STRATEGY.PHP_FIRST );
				expect( status.isUsingFallback ).toBe( false );
			} );
		} );
	} );

	describe( 'categorizeError()', () => {
		test( 'should categorize CORS errors', () => {
			const corsError = new Error( 'CORS policy blocked the request' );
			expect( categorizeError( corsError ) ).toBe( ERROR_TYPE.CORS );

			const crossOriginError = new Error(
				'Cross-origin request blocked'
			);
			expect( categorizeError( crossOriginError ) ).toBe(
				ERROR_TYPE.CORS
			);
		} );

		test( 'should categorize TypeError with fetch as CORS', () => {
			const fetchError = new TypeError( 'Failed to fetch' );
			expect( categorizeError( fetchError ) ).toBe( ERROR_TYPE.CORS );
		} );

		test( 'should categorize network errors', () => {
			const networkError = new Error( 'Network request failed' );
			expect( categorizeError( networkError ) ).toBe(
				ERROR_TYPE.NETWORK
			);

			const econnError = new Error( 'ECONNREFUSED' );
			expect( categorizeError( econnError ) ).toBe( ERROR_TYPE.NETWORK );
		} );

		test( 'should categorize timeout errors', () => {
			const timeoutError = new Error( 'Request timeout' );
			expect( categorizeError( timeoutError ) ).toBe(
				ERROR_TYPE.TIMEOUT
			);

			const abortError = new Error( 'Aborted' );
			abortError.name = 'AbortError';
			expect( categorizeError( abortError ) ).toBe( ERROR_TYPE.TIMEOUT );
		} );

		test( 'should categorize PHP errors from response text', () => {
			expect(
				categorizeError( new Error( 'unknown' ), 'Fatal error: ...' )
			).toBe( ERROR_TYPE.PHP_ERROR );

			expect(
				categorizeError(
					new Error( 'unknown' ),
					'Parse error: unexpected'
				)
			).toBe( ERROR_TYPE.PHP_ERROR );

			expect(
				categorizeError(
					new Error( 'unknown' ),
					'<?php echo "test"; ?>'
				)
			).toBe( ERROR_TYPE.PHP_ERROR );
		} );

		test( 'should return PHP_ERROR for unrecognized errors', () => {
			const unknownError = new Error( 'Something went wrong' );
			expect( categorizeError( unknownError ) ).toBe(
				ERROR_TYPE.PHP_ERROR
			);
		} );

		test( 'should handle null/undefined error gracefully', () => {
			expect( categorizeError( null ) ).toBe( ERROR_TYPE.PHP_ERROR );
			expect( categorizeError( undefined ) ).toBe( ERROR_TYPE.PHP_ERROR );
		} );

		test( 'should handle error without message', () => {
			const emptyError = {};
			expect( categorizeError( emptyError ) ).toBe(
				ERROR_TYPE.PHP_ERROR
			);
		} );
	} );

	describe( 'integration scenarios', () => {
		test( 'should handle typical export workflow with mostly successes', () => {
			const manager = new HtmlFetchStrategyManager();

			// Simulate typical export: 95 successes, 5 failures (interleaved)
			// Interleave failures to avoid triggering maxConsecutiveFailures
			for ( let i = 0; i < 100; i++ ) {
				// Fail every 20th request (at positions 19, 39, 59, 79, 99)
				const shouldFail = ( i + 1 ) % 20 === 0;
				if ( shouldFail ) {
					manager.recordResult(
						`http://test.com/fail${ i }`,
						false,
						'php_error'
					);
				} else {
					manager.recordResult( `http://test.com/page${ i }`, true );
				}
			}

			const status = manager.getStatus();
			// 95 successes out of 100 = 95% success rate (above 70% threshold)
			expect( status.strategy ).toBe( STRATEGY.PHP_FIRST );
			expect( status.isUsingFallback ).toBe( false );
		} );

		test( 'should handle WordPress Playground CORS failure scenario', () => {
			const manager = new HtmlFetchStrategyManager();

			// First request hits CORS - should immediately switch
			manager.recordResult(
				'http://test.com/page1',
				false,
				ERROR_TYPE.CORS
			);

			expect( manager.shouldUsePHP( 'http://test.com/page2' ) ).toBe(
				false
			);
			expect( manager.getStatus().isUsingFallback ).toBe( true );
		} );

		test( 'should handle gradual degradation scenario', () => {
			const manager = new HtmlFetchStrategyManager();

			// Start with some successes
			for ( let i = 0; i < 5; i++ ) {
				manager.recordResult( `http://test.com/page${ i }`, true );
			}

			// Then server starts failing
			for ( let i = 5; i < 15; i++ ) {
				manager.recordResult(
					`http://test.com/page${ i }`,
					false,
					'php_error'
				);
			}

			// Should have switched due to low success rate (5/15 = 33%)
			expect( manager.getStatus().isUsingFallback ).toBe( true );
		} );

		test( 'should handle per-URL retry exhaustion', () => {
			const manager = new HtmlFetchStrategyManager();

			// Problematic URL fails twice
			manager.recordResult(
				'http://test.com/problem',
				false,
				'php_error'
			);
			manager.recordResult(
				'http://test.com/problem',
				false,
				'php_error'
			);

			// Good URLs succeed
			for ( let i = 0; i < 10; i++ ) {
				manager.recordResult( `http://test.com/good${ i }`, true );
			}

			// Strategy should still be PHP_FIRST (high success rate)
			expect( manager.getStatus().strategy ).toBe( STRATEGY.PHP_FIRST );

			// But problematic URL should use JS
			expect( manager.shouldUsePHP( 'http://test.com/problem' ) ).toBe(
				false
			);

			// New URLs should still use PHP
			expect( manager.shouldUsePHP( 'http://test.com/new' ) ).toBe(
				true
			);
		} );
	} );
} );
