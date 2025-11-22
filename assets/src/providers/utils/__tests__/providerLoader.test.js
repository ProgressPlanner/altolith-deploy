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
	beforeEach( () => {
		jest.clearAllMocks();
		jest.useFakeTimers();

		// Clear DOM
		document.head.innerHTML = '';
		document.body.innerHTML = '';

		// Reset provider registry mock
		ProviderRegistry.getAllIds.mockReturnValue( [] );

		// Mock window.aether
		window.aether = {
			providerScriptsBaseUrl: 'https://example.com/providers/',
		};
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
		delete window.aether;
	} );

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
			// Start loading (will timeout since script doesn't exist)
			const loadPromise = loadProvider( 'test-provider', {
				throwOnError: false,
			} );

			// Check loading state
			expect( isProviderLoading( 'test-provider' ) ).toBe( true );

			// Clean up
			jest.runAllTimers();
			await loadPromise;
		} );
	} );

	describe( 'isProviderLoaded', () => {
		it( 'should return false for unloaded provider', () => {
			expect( isProviderLoaded( 'test-provider' ) ).toBe( false );
		} );

		it( 'should return true for loaded provider', async () => {
			// Mock successful script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					// Simulate successful load
					setTimeout( () => {
						element.onload();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			await loadProvider( 'test-provider' );

			expect( isProviderLoaded( 'test-provider' ) ).toBe( true );

			// Restore
			document.head.appendChild = originalAppendChild;
		} );
	} );

	describe( 'getAllLoadingStates', () => {
		it( 'should return empty map initially', () => {
			const states = getAllLoadingStates();

			expect( states.size ).toBe( 0 );
		} );

		it( 'should return all loading states', async () => {
			// Start loading provider
			const loadPromise = loadProvider( 'test-provider', {
				throwOnError: false,
			} );

			const states = getAllLoadingStates();
			expect( states.has( 'test-provider' ) ).toBe( true );

			// Clean up
			jest.runAllTimers();
			await loadPromise;
		} );
	} );

	describe( 'loadProvider', () => {
		it( 'should load provider successfully', async () => {
			// Mock successful script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onload();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			const result = await loadProvider( 'test-provider' );

			expect( result ).toBe( true );
			expect( isProviderLoaded( 'test-provider' ) ).toBe( true );

			document.head.appendChild = originalAppendChild;
		} );

		it( 'should return true if provider already loaded', async () => {
			// Mock successful script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onload();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			// Load once
			await loadProvider( 'test-provider' );

			// Load again - should return immediately
			const result = await loadProvider( 'test-provider' );

			expect( result ).toBe( true );

			document.head.appendChild = originalAppendChild;
		} );

		it( 'should throw on error when throwOnError is true', async () => {
			// Mock failed script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onerror();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			await expect(
				loadProvider( 'test-provider', { throwOnError: true } )
			).rejects.toThrow();

			document.head.appendChild = originalAppendChild;
		} );

		it( 'should return false on error when throwOnError is false', async () => {
			// Mock failed script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onerror();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			const result = await loadProvider( 'test-provider', {
				throwOnError: false,
			} );

			expect( result ).toBe( false );

			document.head.appendChild = originalAppendChild;
		} );

		it( 'should retry on failure with exponential backoff', async () => {
			let attemptCount = 0;

			// Mock failed script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						attemptCount++;
						element.onerror();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			const loadPromise = loadProvider( 'test-provider', {
				throwOnError: false,
				maxAttempts: 3,
			} );

			// Fast-forward all timers
			jest.runAllTimers();

			await loadPromise;

			// Should have attempted 3 times
			expect( attemptCount ).toBe( 3 );

			document.head.appendChild = originalAppendChild;
		} );

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
			} );

			const loadPromise = loadProvider( 'test-provider' );

			// Fast-forward timers
			jest.runAllTimers();

			await loadPromise;

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
			} );

			const loadPromise = loadProvider( 'test-provider' );

			// Fast-forward timers
			jest.runAllTimers();

			await loadPromise;

			expect( isProviderLoaded( 'test-provider' ) ).toBe( true );
		} );

		it( 'should use baseUrl fallback for script URL', async () => {
			window.aether.providerScriptsBaseUrl =
				'https://example.com/providers/';

			// Mock successful script load
			const originalAppendChild = document.head.appendChild;
			let scriptSrc = '';
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					scriptSrc = element.src;
					setTimeout( () => {
						element.onload();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			await loadProvider( 'test-provider' );

			expect( scriptSrc ).toBe(
				'https://example.com/providers/provider-test-provider.js'
			);

			document.head.appendChild = originalAppendChild;
		} );

		it( 'should emit custom event on state change', async () => {
			const events = [];
			document.addEventListener( 'aether:provider-load-state', ( e ) => {
				events.push( e.detail );
			} );

			// Mock successful script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onload();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			await loadProvider( 'test-provider' );

			// Should have emitted loading and loaded events
			expect( events.length ).toBeGreaterThan( 0 );
			expect(
				events.some( ( e ) => e.state === LOAD_STATE.LOADING )
			).toBe( true );
			expect(
				events.some( ( e ) => e.state === LOAD_STATE.LOADED )
			).toBe( true );

			document.head.appendChild = originalAppendChild;
		} );
	} );

	describe( 'loadProviders', () => {
		it( 'should load multiple providers concurrently', async () => {
			// Mock successful script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onload();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

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

			document.head.appendChild = originalAppendChild;
		} );

		it( 'should handle partial failures', async () => {
			let loadCount = 0;

			// Mock mixed success/failure
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					loadCount++;
					setTimeout( () => {
						// Fail provider2, succeed others
						if ( element.src.includes( 'provider2' ) ) {
							element.onerror();
						} else {
							element.onload();
						}
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			const results = await loadProviders(
				[ 'provider1', 'provider2', 'provider3' ],
				{ throwOnError: false }
			);

			expect( results.loaded ).toHaveLength( 2 );
			expect( results.failed ).toHaveLength( 1 );
			expect( results.failed ).toContain( 'provider2' );
			expect( results.errors.provider2 ).toBeDefined();

			document.head.appendChild = originalAppendChild;
		} );

		it( 'should throw on failure when throwOnError is true', async () => {
			// Mock failed script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onerror();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			await expect(
				loadProviders( [ 'provider1' ], { throwOnError: true } )
			).rejects.toThrow();

			document.head.appendChild = originalAppendChild;
		} );

		it( 'should return errors for failed providers', async () => {
			// Mock failed script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onerror();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			const results = await loadProviders( [ 'provider1' ], {
				throwOnError: false,
			} );

			expect( results.errors.provider1 ).toBeInstanceOf( Error );

			document.head.appendChild = originalAppendChild;
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

			// Mock successful script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onload();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			const results = await loadAllProviders();

			expect( results.loaded ).toHaveLength( 2 );
			expect( results.loaded ).toContain( 'provider1' );
			expect( results.loaded ).toContain( 'provider2' );

			document.head.appendChild = originalAppendChild;
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

			// Mock successful script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onload();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			const results = await loadAllProviders();

			expect( results.loaded ).toContain( 'custom-provider' );

			document.head.appendChild = originalAppendChild;
		} );

		it( 'should handle empty registry', async () => {
			ProviderRegistry.getAllIds.mockReturnValue( [] );

			const results = await loadAllProviders();

			expect( results.loaded ).toHaveLength( 0 );
			expect( results.failed ).toHaveLength( 0 );
		} );
	} );

	describe( 'concurrent loading', () => {
		it( 'should handle concurrent loads of same provider', async () => {
			// Mock successful script load with delay
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onload();
					}, 100 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			// Start two concurrent loads of same provider
			const load1 = loadProvider( 'test-provider' );
			const load2 = loadProvider( 'test-provider' );

			// Fast-forward timers
			jest.runAllTimers();

			await Promise.all( [ load1, load2 ] );

			// Both should succeed
			expect( isProviderLoaded( 'test-provider' ) ).toBe( true );

			// Should only create one script element
			const scripts = document.querySelectorAll(
				'script[id="aether-provider-test-provider"]'
			);
			expect( scripts.length ).toBe( 1 );

			document.head.appendChild = originalAppendChild;
		} );
	} );

	describe( 'error recovery', () => {
		it( 'should clean up failed script elements', async () => {
			// Mock failed script load
			const originalAppendChild = document.head.appendChild;
			document.head.appendChild = jest.fn( ( element ) => {
				if ( element.tagName === 'SCRIPT' ) {
					setTimeout( () => {
						element.onerror();
					}, 0 );
				}
				return originalAppendChild.call( document.head, element );
			} );

			await loadProvider( 'test-provider', {
				throwOnError: false,
				maxAttempts: 1,
			} );

			// Should not have script element in DOM (cleaned up after error)
			const scripts = document.querySelectorAll(
				'script[id="aether-provider-test-provider"]'
			);
			expect( scripts.length ).toBe( 0 );

			document.head.appendChild = originalAppendChild;
		} );
	} );
} );
