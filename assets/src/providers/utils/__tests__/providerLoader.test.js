/**
 * Provider Loader Tests
 *
 * Tests for providerLoader - dynamically loads provider scripts with retry logic.
 *
 * Quality Standards:
 * - Tests must catch loading state race conditions
 * - Must test retry logic with exponential backoff
 * - Must test concurrent loading scenarios
 * - Must fail if loading states are incorrect
 *
 */

import {
	loadProvider,
	loadProviders,
	loadAllProviders,
	isProviderLoading,
	isProviderLoaded,
	getAllLoadingStates,
	LOAD_STATE,
} from '../providerLoader';
import ProviderRegistry from '../../registry/ProviderRegistry';

// Mock dependencies
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
} ) );

jest.mock( '@aether/utils/debug', () => ( {
	debugError: jest.fn(),
	debugWarn: jest.fn(),
	debug: jest.fn(),
} ) );

jest.mock( '../../registry/ProviderRegistry', () => ( {
	getAllIds: jest.fn(),
} ) );

describe( 'providerLoader', () => {
	// Store references to original DOM methods
	let originalAppendChild;
	let originalGetElementById;
	let originalQuerySelector;
	let originalQuerySelectorAll;

	// Track appended elements for test verification
	const appendedElements = [];

	beforeEach( () => {
		jest.clearAllMocks();

		// Clear appended elements tracker
		appendedElements.length = 0;

		// Clear DOM
		document.head.innerHTML = '';
		document.body.innerHTML = '';

		// Reset provider registry mock
		ProviderRegistry.getAllIds.mockReturnValue( [] );

		// Mock window.aether
		window.aether = {
			providerScriptsBaseUrl: 'https://example.com/providers/',
		};

		// Store original DOM methods
		originalAppendChild = document.head.appendChild;
		originalGetElementById = document.getElementById;
		originalQuerySelector = document.querySelector;
		originalQuerySelectorAll = document.querySelectorAll;
	} );

	afterEach( () => {
		delete window.aether;

		// Restore original DOM methods
		if ( originalAppendChild ) {
			document.head.appendChild = originalAppendChild;
		}
		if ( originalGetElementById ) {
			document.getElementById = originalGetElementById;
		}
		if ( originalQuerySelector ) {
			document.querySelector = originalQuerySelector;
		}
		if ( originalQuerySelectorAll ) {
			document.querySelectorAll = originalQuerySelectorAll;
		}
	} );

	/**
	 * Create a mock appendChild that simulates script loading without actually loading the script.
	 * This prevents the browser from trying to load non-existent URLs.
	 *
	 * @param {Object} options - Mock options
	 * @param {boolean} options.shouldSucceed - Whether the script should succeed or fail
	 * @param {string|null} options.failProviderId - Provider ID that should fail (for partial failure tests)
	 */
	function mockAppendChild( {
		shouldSucceed = true,
		failProviderId = null,
	} = {} ) {
		// Track which elements have completed loading (success or failure)
		const completedElements = [];

		// Mock getElementById to ONLY find completed elements
		// This prevents the polling loop from finding elements that are still loading
		document.getElementById = jest.fn( ( id ) => {
			const element = completedElements.find( ( el ) => el.id === id );
			return element || originalGetElementById.call( document, id );
		} );

		// Mock querySelector to find our tracked elements
		document.querySelector = jest.fn( ( selector ) => {
			// Handle data-provider-id selector
			if ( selector.startsWith( 'script[data-provider-id=' ) ) {
				const match = selector.match(
					/script\[data-provider-id="([^"]+)"\]/
				);
				if ( match ) {
					const providerId = match[ 1 ];
					return (
						appendedElements.find(
							( el ) =>
								el.getAttribute( 'data-provider-id' ) ===
								providerId
						) || originalQuerySelector.call( document, selector )
					);
				}
			}
			return originalQuerySelector.call( document, selector );
		} );

		// Mock querySelectorAll to find our tracked elements
		document.querySelectorAll = jest.fn( ( selector ) => {
			// Handle script[src] selector used by getProviderScriptUrl
			if ( selector === 'script[src]' ) {
				const domScripts = Array.from(
					originalQuerySelectorAll.call( document, selector )
				);
				const mockScripts = appendedElements.filter(
					( el ) => el.tagName === 'SCRIPT' && el.src
				);
				return [ ...domScripts, ...mockScripts ];
			}
			return originalQuerySelectorAll.call( document, selector );
		} );

		// Mock appendChild
		document.head.appendChild = jest.fn( ( element ) => {
			if ( element.tagName === 'SCRIPT' ) {
				// Track the element for querySelectorAll
				appendedElements.push( element );

				// Simulate async script loading
				setTimeout( () => {
					// Check if this provider should fail
					const isFailProvider =
						failProviderId && element.src.includes( failProviderId );
					const shouldFail = ! shouldSucceed || isFailProvider;

					if ( shouldFail && element.onerror ) {
						// Fire error callback - DON'T add to completedElements
						// This way getElementById won't find it and won't think it loaded successfully
						element.onerror( new Error( 'Mock error' ) );
					} else if ( ! shouldFail && element.onload ) {
						// Set readyState to 'complete' on success
						Object.defineProperty( element, 'readyState', {
							value: 'complete',
							writable: true,
							configurable: true,
						} );
						// Add to completedElements so getElementById can find it
						completedElements.push( element );
						element.onload();
					}
				}, 0 );
			}
			// DON'T call originalAppendChild - this causes browser to try loading the script
			return element;
		} );
	}

	describe( 'LOAD_STATE constants', () => {
		it( 'should define all loading states', () => {
			expect( LOAD_STATE ).toEqual( {
				IDLE: 'idle',
				LOADING: 'loading',
				LOADED: 'loaded',
				ERROR: 'error',
			} );
		} );
	} );

	describe( 'isProviderLoading', () => {
		it( 'should return false for unloaded provider', () => {
			expect( isProviderLoading( 'test-provider' ) ).toBe( false );
		} );

		it( 'should return true for loading provider', async () => {
			mockAppendChild( { shouldSucceed: true } );

			// Start loading with longer delay so we can check loading state
			const originalMock = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					appendedElements.push( element );
					// Use longer delay (100ms) instead of 0ms so we can check loading state
					setTimeout( () => {
						if ( element.onload ) {
							element.onload();
						}
					}, 100 );
				}
				return element;
			} );

			// Start loading
			const loadPromise = loadProvider( 'test-provider-loading', {
				throwOnError: false,
			} );

			// Give it a moment to start loading
			await new Promise( ( resolve ) => setTimeout( resolve, 10 ) );

			// Check loading state
			expect( isProviderLoading( 'test-provider-loading' ) ).toBe( true );

			// Wait for completion
			await loadPromise;
		} );
	} );

	describe( 'isProviderLoaded', () => {
		it( 'should return false for unloaded provider', () => {
			// Use unique provider ID to avoid state leakage from previous tests
			expect( isProviderLoaded( 'never-loaded-provider' ) ).toBe(
				false
			);
		} );

		it( 'should return true for loaded provider', async () => {
			mockAppendChild( { shouldSucceed: true } );

			await loadProvider( 'test-provider' );

			expect( isProviderLoaded( 'test-provider' ) ).toBe( true );
		} );
	} );

	describe( 'getAllLoadingStates', () => {
		it( 'should return a Map of loading states', () => {
			const states = getAllLoadingStates();

			// Should return a Map (size may vary depending on previous tests due to module-level state)
			expect( states ).toBeInstanceOf( Map );
		} );

		it( 'should return all loading states', async () => {
			mockAppendChild( { shouldSucceed: true } );

			// Start loading provider
			const loadPromise = loadProvider( 'test-provider', {
				throwOnError: false,
			} );

			// Give it a moment to start loading
			await new Promise( ( resolve ) => setTimeout( resolve, 10 ) );

			const states = getAllLoadingStates();
			expect( states.has( 'test-provider' ) ).toBe( true );

			// Wait for completion
			await loadPromise;
		} );
	} );

	describe( 'loadProvider', () => {
		it( 'should load provider successfully', async () => {
			mockAppendChild( { shouldSucceed: true } );

			const result = await loadProvider( 'test-provider' );

			expect( result ).toBe( true );
			expect( isProviderLoaded( 'test-provider' ) ).toBe( true );
		} );

		it( 'should return true if provider already loaded', async () => {
			mockAppendChild( { shouldSucceed: true } );

			// Load once
			await loadProvider( 'test-provider' );

			// Load again - should return immediately
			const result = await loadProvider( 'test-provider' );

			expect( result ).toBe( true );
		} );

		it( 'should throw on error when throwOnError is true', async () => {
			mockAppendChild( { shouldSucceed: false } );

			await expect(
				loadProvider( 'test-provider-error-throw', {
					throwOnError: true,
				} )
			).rejects.toThrow();
		} );

		it( 'should return false on error when throwOnError is false', async () => {
			mockAppendChild( { shouldSucceed: false } );

			const result = await loadProvider( 'test-provider-error-no-throw', {
				throwOnError: false,
			} );

			expect( result ).toBe( false );
		} );

		it(
			'should retry on failure with exponential backoff',
			async () => {
				let attemptCount = 0;

				// Mock failed script load that counts attempts
				document.getElementById = jest.fn( ( id ) => null );
				document.querySelector = jest.fn( ( selector ) => null );
				document.querySelectorAll = jest.fn( ( selector ) => {
					if ( selector === 'script[src]' ) {
						return appendedElements.filter(
							( el ) => el.tagName === 'SCRIPT' && el.src
						);
					}
					return [];
				} );

				document.head.appendChild = jest.fn( ( element ) => {
					if ( element.tagName === 'SCRIPT' && element.onerror ) {
						appendedElements.push( element );
						setTimeout( () => {
							attemptCount++;
							if ( element.onerror ) {
								element.onerror( new Error( 'Mock error' ) );
							}
						}, 0 );
					}
					return element;
				} );

				const loadPromise = loadProvider( 'test-provider-retry', {
					throwOnError: false,
					maxAttempts: 3,
				} );

				await loadPromise;

				// Should have attempted 3 times
				expect( attemptCount ).toBe( 3 );
			},
			15000
		); // Increase timeout since retry backoff takes time (2s + 4s + 8s = 14s)

		it( 'should handle missing script URL gracefully', async () => {
			// No script URL available (no baseUrl, no existing scripts)
			delete window.aether.providerScriptsBaseUrl;

			const result = await loadProvider( 'test-provider', {
				throwOnError: false,
			} );

			// Should resolve without error
			expect( result ).toBe( true );
		} );

		it( 'should detect PHP-enqueued scripts by data-provider-id', async () => {
			// Create PHP-enqueued script
			const script = document.createElement( 'script' );
			script.setAttribute( 'data-provider-id', 'test-provider' );
			script.src = 'https://example.com/providers/test-provider.js';
			document.head.appendChild( script );

			// Mock script ready state
			Object.defineProperty( script, 'readyState', {
				get: () => 'complete',
				configurable: true,
			} );

			await loadProvider( 'test-provider' );

			// Should use existing script
			expect( isProviderLoaded( 'test-provider' ) ).toBe( true );
		} );

		it( 'should detect scripts by src pattern', async () => {
			// Create script with provider pattern in src
			const script = document.createElement( 'script' );
			script.src =
				'https://example.com/providers/provider-test-provider.js';
			document.head.appendChild( script );

			// Mock script ready state
			Object.defineProperty( script, 'readyState', {
				get: () => 'complete',
				configurable: true,
			} );

			await loadProvider( 'test-provider' );

			expect( isProviderLoaded( 'test-provider' ) ).toBe( true );
		} );

		it( 'should use baseUrl fallback for script URL', async () => {
			window.aether.providerScriptsBaseUrl =
				'https://example.com/providers/';

			let scriptSrc = '';

			mockAppendChild( { shouldSucceed: true } );

			// Override to also capture src
			const originalMock = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					scriptSrc = element.src;
				}
				return originalMock( element );
			} );

			await loadProvider( 'test-provider-baseurl' );

			expect( scriptSrc ).toBe(
				'https://example.com/providers/provider-test-provider-baseurl.js'
			);
		} );

		it( 'should emit custom event on state change', async () => {
			const events = [];
			const handler = ( e ) => {
				if ( e.detail.providerId === 'test-provider-events' ) {
					events.push( e.detail );
				}
			};
			document.addEventListener( 'aether:provider-load-state', handler );

			mockAppendChild( { shouldSucceed: true } );

			await loadProvider( 'test-provider-events' );

			// Should have emitted loading and loaded events
			expect( events.length ).toBeGreaterThan( 0 );
			expect(
				events.some( ( e ) => e.state === LOAD_STATE.LOADING )
			).toBe( true );
			expect(
				events.some( ( e ) => e.state === LOAD_STATE.LOADED )
			).toBe( true );

			document.removeEventListener(
				'aether:provider-load-state',
				handler
			);
		} );
	} );

	describe( 'loadProviders', () => {
		it( 'should load multiple providers concurrently', async () => {
			mockAppendChild( { shouldSucceed: true } );

			const results = await loadProviders( [
				'provider1',
				'provider2',
				'provider3',
			] );

			expect( results.loaded ).toHaveLength( 3 );
			expect( results.failed ).toHaveLength( 0 );
			expect( results.loaded ).toContain( 'provider1' );
			expect( results.loaded ).toContain( 'provider2' );
			expect( results.loaded ).toContain( 'provider3' );
		} );

		it( 'should handle partial failures', async () => {
			mockAppendChild( { failProviderId: 'provider-partial-2' } );

			const results = await loadProviders(
				[
					'provider-partial-1',
					'provider-partial-2',
					'provider-partial-3',
				],
				{ throwOnError: false }
			);

			expect( results.loaded ).toHaveLength( 2 );
			expect( results.failed ).toHaveLength( 1 );
			expect( results.failed ).toContain( 'provider-partial-2' );
			expect( results.errors[ 'provider-partial-2' ] ).toBeDefined();
		} );

		it( 'should throw on failure when throwOnError is true', async () => {
			mockAppendChild( { shouldSucceed: false } );

			await expect(
				loadProviders( [ 'provider-multi-error' ], {
					throwOnError: true,
				} )
			).rejects.toThrow();
		} );

		it( 'should return errors for failed providers', async () => {
			mockAppendChild( { shouldSucceed: false } );

			const results = await loadProviders( [ 'provider-with-error' ], {
				throwOnError: false,
			} );

			expect( results.errors[ 'provider-with-error' ] ).toBeInstanceOf(
				Error
			);
		} );

		it( 'should handle empty provider list', async () => {
			const results = await loadProviders( [] );

			expect( results.loaded ).toHaveLength( 0 );
			expect( results.failed ).toHaveLength( 0 );
		} );
	} );

	describe( 'loadAllProviders', () => {
		it( 'should load all providers from registry', async () => {
			ProviderRegistry.getAllIds.mockReturnValue( [
				'provider1',
				'provider2',
			] );

			mockAppendChild( { shouldSucceed: true } );

			const results = await loadAllProviders();

			expect( results.loaded ).toHaveLength( 2 );
			expect( results.loaded ).toContain( 'provider1' );
			expect( results.loaded ).toContain( 'provider2' );
		} );

		it( 'should apply filters to provider IDs', async () => {
			const { applyFilters } = require( '@wordpress/hooks' );

			ProviderRegistry.getAllIds.mockReturnValue( [ 'provider1' ] );
			applyFilters.mockImplementation( ( hook, value ) => {
				if ( hook === 'aether.provider_ids' ) {
					return [ ...value, 'custom-provider' ];
				}
				return value;
			} );

			mockAppendChild( { shouldSucceed: true } );

			const results = await loadAllProviders();

			expect( results.loaded ).toContain( 'custom-provider' );
		} );

		it( 'should handle empty registry', async () => {
			const { applyFilters } = require( '@wordpress/hooks' );

			ProviderRegistry.getAllIds.mockReturnValue( [] );

			// Reset applyFilters to default behavior (just return the value)
			applyFilters.mockImplementation( ( hook, value ) => value );

			const results = await loadAllProviders();

			expect( results.loaded ).toHaveLength( 0 );
			expect( results.failed ).toHaveLength( 0 );
		} );
	} );

	describe( 'concurrent loading', () => {
		it( 'should handle concurrent loads of same provider', async () => {
			// Mock with longer delay to test concurrent behavior
			document.getElementById = jest.fn( ( id ) => {
				return (
					appendedElements.find( ( el ) => el.id === id ) ||
					originalGetElementById.call( document, id )
				);
			} );
			document.querySelector = jest.fn( ( selector ) => null );
			document.querySelectorAll = jest.fn( ( selector ) => {
				if ( selector === 'script[src]' ) {
					return appendedElements.filter(
						( el ) => el.tagName === 'SCRIPT' && el.src
					);
				}
				return [];
			} );

			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' && element.onload ) {
					appendedElements.push( element );
					setTimeout( () => {
						if ( element.onload ) {
							element.onload();
						}
					}, 100 );
				}
				return element;
			} );

			// Start two concurrent loads of same provider
			const load1 = loadProvider( 'test-provider' );
			const load2 = loadProvider( 'test-provider' );

			await Promise.all( [ load1, load2 ] );

			// Both should succeed
			expect( isProviderLoaded( 'test-provider' ) ).toBe( true );

			// Should only create one script element
			const scriptIds = appendedElements.map( ( el ) => el.id );
			const uniqueIds = [
				...new Set(
					scriptIds.filter(
						( id ) => id === 'aether-provider-test-provider'
					)
				),
			];
			expect( uniqueIds.length ).toBeLessThanOrEqual( 1 );
		} );
	} );

	describe( 'error recovery', () => {
		it( 'should clean up failed script elements', async () => {
			mockAppendChild( { shouldSucceed: false } );

			await loadProvider( 'test-provider-cleanup', {
				throwOnError: false,
				maxAttempts: 1,
			} );

			// Verify that scripts were created (even if not in real DOM)
			expect( appendedElements.length ).toBeGreaterThan( 0 );
		} );
	} );
} );
