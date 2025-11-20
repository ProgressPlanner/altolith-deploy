/**
 * Playground Notice Hook Tests
 *
 * Tests for usePlaygroundNotice hook.
 * Validates API fetching, state management, and dismiss functionality.
 *
 * @package
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePlaygroundNotice } from '../usePlaygroundNotice';
import apiFetch from '../../utils/api';

// Mock the API module
jest.mock( '../../utils/api' );

describe( 'usePlaygroundNotice', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Initial state', () => {
		test( 'should start with loading state', () => {
			apiFetch.mockResolvedValue( {
				success: true,
				shouldShow: false,
				isPlayground: false,
				isDismissed: false,
			} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			expect( result.current.loading ).toBe( true );
			expect( result.current.shouldShow ).toBe( false );
			expect( result.current.isPlayground ).toBe( false );
			expect( result.current.isDismissed ).toBe( false );
		} );

		test( 'should provide dismiss function', () => {
			apiFetch.mockResolvedValue( {
				success: true,
				shouldShow: false,
				isPlayground: false,
				isDismissed: false,
			} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			expect( typeof result.current.dismiss ).toBe( 'function' );
		} );

		test( 'should provide refresh function', () => {
			apiFetch.mockResolvedValue( {
				success: true,
				shouldShow: false,
				isPlayground: false,
				isDismissed: false,
			} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			expect( typeof result.current.refresh ).toBe( 'function' );
		} );
	} );

	describe( 'Fetching state', () => {
		test( 'should fetch playground notice state on mount', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				shouldShow: true,
				isPlayground: true,
				isDismissed: false,
			} );

			renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/notices/playground',
				} );
			} );
		} );

		test( 'should update state when fetch succeeds', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				shouldShow: true,
				isPlayground: true,
				isDismissed: false,
			} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.shouldShow ).toBe( true );
			expect( result.current.isPlayground ).toBe( true );
			expect( result.current.isDismissed ).toBe( false );
		} );

		test( 'should handle successful response with false values', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				shouldShow: false,
				isPlayground: false,
				isDismissed: true,
			} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.shouldShow ).toBe( false );
			expect( result.current.isPlayground ).toBe( false );
			expect( result.current.isDismissed ).toBe( true );
		} );

		test( 'should handle missing optional fields in response', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				// No shouldShow, isPlayground, or isDismissed
			} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.shouldShow ).toBe( false );
			expect( result.current.isPlayground ).toBe( false );
			expect( result.current.isDismissed ).toBe( false );
		} );

		test( 'should handle unsuccessful response', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
			} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			// State should not be updated except loading
			expect( result.current.shouldShow ).toBe( false );
			expect( result.current.isPlayground ).toBe( false );
		} );

		test( 'should handle fetch error gracefully', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			// State should remain at defaults
			expect( result.current.shouldShow ).toBe( false );
			expect( result.current.isPlayground ).toBe( false );
			expect( result.current.isDismissed ).toBe( false );
		} );
	} );

	describe( 'dismiss()', () => {
		test( 'should call dismiss endpoint', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					shouldShow: true,
					isPlayground: true,
					isDismissed: false,
				} )
				.mockResolvedValueOnce( {
					success: true,
				} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			await act( async () => {
				await result.current.dismiss();
			} );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/notices/playground/dismiss',
				method: 'POST',
			} );
		} );

		test( 'should update state when dismiss succeeds', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					shouldShow: true,
					isPlayground: true,
					isDismissed: false,
				} )
				.mockResolvedValueOnce( {
					success: true,
				} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			await act( async () => {
				await result.current.dismiss();
			} );

			expect( result.current.shouldShow ).toBe( false );
			expect( result.current.isDismissed ).toBe( true );
			// isPlayground should remain unchanged
			expect( result.current.isPlayground ).toBe( true );
		} );

		test( 'should not update state when dismiss fails', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					shouldShow: true,
					isPlayground: true,
					isDismissed: false,
				} )
				.mockResolvedValueOnce( {
					success: false,
				} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			await act( async () => {
				await result.current.dismiss();
			} );

			// State should remain unchanged
			expect( result.current.shouldShow ).toBe( true );
			expect( result.current.isDismissed ).toBe( false );
		} );

		test( 'should handle dismiss error gracefully', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					shouldShow: true,
					isPlayground: true,
					isDismissed: false,
				} )
				.mockRejectedValueOnce( new Error( 'Network error' ) );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			// Should not throw
			await expect(
				act( async () => {
					await result.current.dismiss();
				} )
			).resolves.not.toThrow();

			// State should remain unchanged
			expect( result.current.shouldShow ).toBe( true );
			expect( result.current.isDismissed ).toBe( false );
		} );
	} );

	describe( 'refresh()', () => {
		test( 'should refetch state when called', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					shouldShow: false,
					isPlayground: false,
					isDismissed: false,
				} )
				.mockResolvedValueOnce( {
					success: true,
					shouldShow: true,
					isPlayground: true,
					isDismissed: false,
				} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.shouldShow ).toBe( false );

			await act( async () => {
				await result.current.refresh();
			} );

			expect( result.current.shouldShow ).toBe( true );
			expect( result.current.isPlayground ).toBe( true );
		} );

		test( 'should handle refresh error gracefully', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					shouldShow: true,
					isPlayground: true,
					isDismissed: false,
				} )
				.mockRejectedValueOnce( new Error( 'Network error' ) );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			// Should not throw
			await expect(
				act( async () => {
					await result.current.refresh();
				} )
			).resolves.not.toThrow();
		} );
	} );

	describe( 'Integration scenarios', () => {
		test( 'should handle dismiss then refresh workflow', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					shouldShow: true,
					isPlayground: true,
					isDismissed: false,
				} )
				.mockResolvedValueOnce( {
					success: true,
				} )
				.mockResolvedValueOnce( {
					success: true,
					shouldShow: false,
					isPlayground: true,
					isDismissed: true,
				} );

			const { result } = renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.shouldShow ).toBe( true );

			// Dismiss
			await act( async () => {
				await result.current.dismiss();
			} );

			expect( result.current.shouldShow ).toBe( false );
			expect( result.current.isDismissed ).toBe( true );

			// Refresh
			await act( async () => {
				await result.current.refresh();
			} );

			expect( result.current.shouldShow ).toBe( false );
			expect( result.current.isDismissed ).toBe( true );
		} );

		test( 'should only fetch once on mount', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				shouldShow: false,
				isPlayground: false,
				isDismissed: false,
			} );

			renderHook( () => usePlaygroundNotice() );

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledTimes( 1 );
			} );

			// Wait a bit more to ensure no additional calls
			await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
