/**
 * Tests for useProviderStatus Hook
 *
 * Verifies proper cleanup of WordPress action handlers to prevent NotFoundError.
 *
 * @package
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { addAction, removeAction } from '@wordpress/hooks';
import useProviderStatus from '../useProviderStatus';

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => ( {
	addAction: jest.fn(),
	removeAction: jest.fn(),
} ) );

// Mock API fetch
jest.mock( '../../../utils/api', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

import apiFetch from '../../../utils/api';

describe( 'useProviderStatus', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Setup default API response
		apiFetch.mockResolvedValue( {
			configured: true,
		} );
	} );

	it( 'should add action handler on mount', () => {
		const { result } = renderHook( () =>
			useProviderStatus( 'cloudflare-r2' )
		);

		// Verify addAction was called with correct parameters
		expect( addAction ).toHaveBeenCalledWith(
			'aether.admin.provider.settings.saved',
			'refresh-status-cloudflare-r2',
			expect.any( Function )
		);
	} );

	it( 'should remove action handler on unmount', () => {
		const { unmount } = renderHook( () =>
			useProviderStatus( 'cloudflare-r2' )
		);

		// Clear initial calls
		removeAction.mockClear();

		// Unmount the hook
		unmount();

		// Verify removeAction was called with correct parameters
		expect( removeAction ).toHaveBeenCalledWith(
			'aether.admin.provider.settings.saved',
			'refresh-status-cloudflare-r2'
		);
	} );

	it( 'should use unique namespace per provider', () => {
		const { rerender } = renderHook(
			( { providerId } ) => useProviderStatus( providerId ),
			{
				initialProps: { providerId: 'cloudflare-r2' },
			}
		);

		// Verify first provider's namespace
		expect( addAction ).toHaveBeenCalledWith(
			'aether.admin.provider.settings.saved',
			'refresh-status-cloudflare-r2',
			expect.any( Function )
		);

		// Change provider
		rerender( { providerId: 'gitlab-pages' } );

		// Verify cleanup of old provider and setup of new
		expect( removeAction ).toHaveBeenCalledWith(
			'aether.admin.provider.settings.saved',
			'refresh-status-cloudflare-r2'
		);
		expect( addAction ).toHaveBeenCalledWith(
			'aether.admin.provider.settings.saved',
			'refresh-status-gitlab-pages',
			expect.any( Function )
		);
	} );

	it( 'should not throw errors after unmount', async () => {
		const { unmount } = renderHook( () =>
			useProviderStatus( 'cloudflare-r2' )
		);

		// Get the handler that was registered
		const [ [ , , handler ] ] = addAction.mock.calls;

		// Unmount the component
		unmount();

		// Call the handler after unmount - should not throw
		expect( () => {
			act( () => {
				handler( 'cloudflare-r2' );
			} );
		} ).not.toThrow();
	} );

	it( 'should check provider status on mount', async () => {
		const { result } = renderHook( () =>
			useProviderStatus( 'cloudflare-r2' )
		);

		// Initially loading
		expect( result.current.loading ).toBe( true );

		// Wait for API call to resolve
		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		// Should have called API
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/aether/site-exporter/providers/cloudflare-r2/status',
		} );

		// Should have correct status
		expect( result.current.status ).toBe( 'configured' );
	} );

	it( 'should handle API errors gracefully', async () => {
		// Setup API to reject
		apiFetch.mockRejectedValueOnce( new Error( 'Network error' ) );

		const { result } = renderHook( () =>
			useProviderStatus( 'cloudflare-r2' )
		);

		// Wait for API call to resolve
		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		// Should have error status
		expect( result.current.status ).toBe( 'error' );
	} );

	it( 'should refresh status when settings are saved', async () => {
		const { result } = renderHook( () =>
			useProviderStatus( 'cloudflare-r2' )
		);

		// Wait for initial load
		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		// Clear previous calls
		apiFetch.mockClear();

		// Get the handler that was registered
		const [ [ , , handler ] ] = addAction.mock.calls;

		// Simulate settings saved
		act( () => {
			handler( 'cloudflare-r2' );
		} );

		// Should trigger a new status check after delay (3.5 seconds)
		await waitFor(
			() => {
				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/aether/site-exporter/providers/cloudflare-r2/status',
				} );
			},
			{ timeout: 4000 }
		);
	} );

	it( 'should not refresh status for different provider', async () => {
		const { result } = renderHook( () =>
			useProviderStatus( 'cloudflare-r2' )
		);

		// Wait for initial load
		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		// Clear previous calls
		apiFetch.mockClear();

		// Get the handler that was registered
		const [ [ , , handler ] ] = addAction.mock.calls;

		// Simulate different provider's settings saved
		act( () => {
			handler( 'gitlab-pages' );
		} );

		// Should NOT trigger a new status check
		await act( async () => {
			await new Promise( ( resolve ) => setTimeout( resolve, 600 ) );
		} );

		expect( apiFetch ).not.toHaveBeenCalled();
	} );
} );
