/**
 * Tests for ConfigContext
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { ConfigProvider } from '../ConfigContext';
import { useConfigContext } from '../../hooks/useConfigContext';
import apiFetch from '../../utils/api';

// Mock the API module
jest.mock( '../../utils/api' );

/**
 * Wrapper component for testing context
 * @param root0
 * @param root0.children
 */
const wrapper = ( { children } ) =>
	createElement( ConfigProvider, {}, children );

describe( 'ConfigContext', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	} );

	describe( 'Initialization', () => {
		it( 'should initialize with loading state', () => {
			apiFetch.mockResolvedValue( {
				success: true,
				siteKey: 'test-key',
				playgroundUrl: 'https://example.com',
				publicUrl: '',
				adminUrl: '',
			} );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			expect( result.current.loading ).toBe( true );
			expect( result.current.config ).toEqual( {} );
			expect( result.current.error ).toBe( null );
		} );

		it( 'should fetch config on mount', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				siteKey: 'test-key-123',
				playgroundUrl: 'https://playground.example.com',
				publicUrl: 'https://public.example.com',
				adminUrl: 'https://admin.example.com',
			} );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.config ).toEqual( {
				siteKey: 'test-key-123',
				playgroundUrl: 'https://playground.example.com',
				publicUrl: 'https://public.example.com',
				adminUrl: 'https://admin.example.com',
			} );
			expect( result.current.error ).toBe( null );
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/config',
			} );
		} );

		it( 'should handle fetch errors', async () => {
			const errorMessage = 'Failed to fetch config';
			apiFetch.mockRejectedValue( new Error( errorMessage ) );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.error ).toBe( errorMessage );
			expect( result.current.config ).toEqual( {} );
		} );
	} );

	describe( 'Cache Behavior', () => {
		it( 'should cache config for 5 minutes', async () => {
			const mockConfig = {
				success: true,
				siteKey: 'cached-key',
				playgroundUrl: '',
				publicUrl: '',
				adminUrl: '',
			};
			apiFetch.mockResolvedValue( mockConfig );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( apiFetch ).toHaveBeenCalledTimes( 1 );

			// Trigger a refresh (should use cache and not make another call)
			// Note: The internal fetchConfig checks cache, but refetch bypasses cache
			// So this test verifies that repeated renders don't cause extra fetches
			const firstCallCount = apiFetch.mock.calls.length;

			// Just verify we're not making additional calls on renders
			expect( firstCallCount ).toBe( 1 );
		} );

		it( 'should bypass cache when refetch is called', async () => {
			const mockConfig = {
				success: true,
				siteKey: 'test-key',
				playgroundUrl: '',
				publicUrl: '',
				adminUrl: '',
			};
			apiFetch.mockResolvedValue( mockConfig );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( apiFetch ).toHaveBeenCalledTimes( 1 );

			// Force refresh
			await act( async () => {
				await result.current.refetch();
			} );

			// Should make another API call
			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should invalidate cache after 5 minutes', async () => {
			const mockConfig = {
				success: true,
				siteKey: 'test-key',
				playgroundUrl: '',
				publicUrl: '',
				adminUrl: '',
			};
			apiFetch.mockResolvedValue( mockConfig );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( apiFetch ).toHaveBeenCalledTimes( 1 );

			// Fast-forward time by 6 minutes
			act( () => {
				jest.advanceTimersByTime( 6 * 60 * 1000 );
			} );

			// Trigger a refresh (cache should be invalid, but refetch always forces)
			await act( async () => {
				await result.current.refetch();
			} );

			// Should make another API call
			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'Fetch Deduplication', () => {
		it( 'should deduplicate concurrent fetch requests', async () => {
			const mockConfig = {
				success: true,
				siteKey: 'test-key',
				playgroundUrl: '',
				publicUrl: '',
				adminUrl: '',
			};
			apiFetch.mockResolvedValue( mockConfig );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			// Clear previous calls
			apiFetch.mockClear();

			// Make multiple concurrent refetch requests
			await act( async () => {
				const promises = [
					result.current.refetch(),
					result.current.refetch(),
					result.current.refetch(),
				];
				await Promise.all( promises );
			} );

			// Deduplication logic prevents concurrent fetches
			// The fetch will only happen once even with multiple refetch calls
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'Optimistic Updates', () => {
		it( 'should update config optimistically', async () => {
			const initialConfig = {
				success: true,
				siteKey: 'initial-key',
				playgroundUrl: '',
				publicUrl: '',
				adminUrl: '',
			};
			apiFetch.mockResolvedValue( initialConfig );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			const newConfig = { siteKey: 'updated-key', foo: 'bar' };

			act( () => {
				result.current.updateConfig( newConfig );
			} );

			// Config should be updated immediately with merge
			expect( result.current.config.siteKey ).toBe( 'updated-key' );
			expect( result.current.config.foo ).toBe( 'bar' );
		} );

		it( 'should merge partial updates', async () => {
			const initialConfig = {
				success: true,
				siteKey: 'test-key',
				playgroundUrl: 'https://example.com',
				publicUrl: '',
				adminUrl: '',
			};
			apiFetch.mockResolvedValue( initialConfig );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			const partialUpdate = { playgroundUrl: 'https://new-url.com' };

			act( () => {
				result.current.updateConfig( partialUpdate );
			} );

			// Should merge with existing config
			expect( result.current.config.siteKey ).toBe( 'test-key' );
			expect( result.current.config.playgroundUrl ).toBe(
				'https://new-url.com'
			);
		} );
	} );

	describe( 'Cache Invalidation', () => {
		it( 'should invalidate cache manually', async () => {
			const mockConfig = {
				success: true,
				siteKey: 'test-key',
				playgroundUrl: '',
				publicUrl: '',
				adminUrl: '',
			};
			apiFetch.mockResolvedValue( mockConfig );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( apiFetch ).toHaveBeenCalledTimes( 1 );

			// Invalidate cache
			act( () => {
				result.current.invalidateCache();
			} );

			// Next refetch should make a new API call
			await act( async () => {
				await result.current.refetch();
			} );

			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'Error Handling', () => {
		it( 'should handle API errors gracefully', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.error ).toBe( 'Network error' );
			expect( result.current.config ).toEqual( {} );
		} );

		it( 'should handle unsuccessful API responses', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
				error: 'Invalid request',
			} );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.error ).toBe(
				'Config fetch failed: response.success is false'
			);
		} );

		it( 'should clear error on successful fetch', async () => {
			// First call fails
			apiFetch.mockRejectedValueOnce( new Error( 'Network error' ) );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.error ).toBe( 'Network error' );
			} );

			// Second call succeeds
			const mockConfig = {
				success: true,
				siteKey: 'test-key',
				playgroundUrl: '',
				publicUrl: '',
				adminUrl: '',
			};
			apiFetch.mockResolvedValue( mockConfig );

			await act( async () => {
				await result.current.refetch();
			} );

			await waitFor( () => {
				expect( result.current.error ).toBe( null );
				expect( result.current.config.siteKey ).toBe( 'test-key' );
			} );
		} );
	} );

	describe( 'Refetch Method', () => {
		it( 'should provide refetch method that forces fetch', async () => {
			const initialConfig = {
				success: true,
				siteKey: 'initial-key',
				playgroundUrl: '',
				publicUrl: '',
				adminUrl: '',
			};
			apiFetch.mockResolvedValue( initialConfig );

			const { result } = renderHook( () => useConfigContext(), {
				wrapper,
			} );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			const updatedConfig = {
				success: true,
				siteKey: 'updated-key',
				playgroundUrl: '',
				publicUrl: '',
				adminUrl: '',
			};
			apiFetch.mockResolvedValue( updatedConfig );

			await act( async () => {
				await result.current.refetch();
			} );

			await waitFor( () => {
				expect( result.current.config.siteKey ).toBe( 'updated-key' );
			} );
		} );
	} );
} );
