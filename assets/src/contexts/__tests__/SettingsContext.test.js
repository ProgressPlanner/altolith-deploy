/**
 * Settings Context Tests
 *
 * Tests for SettingsContext - centralized settings management.
 *
 * Quality Standards:
 * - Tests must verify API integration works
 * - Must test cache invalidation
 * - Must test error handling
 * - Must fail if loading state is incorrect
 *
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { SettingsProvider, SettingsContext } from '../SettingsContext';
import apiFetch from '../../utils/api';
import { useContext } from '@wordpress/element';

// Mock dependencies
jest.mock( '../../utils/api', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../utils/debug', () => ( {
	debugError: jest.fn(),
} ) );

describe( 'SettingsContext', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'SettingsProvider', () => {
		it( 'should provide default context values', () => {
			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			expect( result.current ).toHaveProperty( 'settings' );
			expect( result.current ).toHaveProperty( 'loading' );
			expect( result.current ).toHaveProperty( 'error' );
			expect( result.current ).toHaveProperty( 'refetch' );
			expect( result.current ).toHaveProperty( 'invalidateCache' );
		} );

		it( 'should fetch settings on mount', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				settings: { test: 'value' },
			} );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/aether/site-exporter/settings',
			} );

			expect( result.current.settings ).toEqual( { test: 'value' } );
		} );

		it( 'should set loading state during fetch', () => {
			apiFetch.mockImplementation(
				() =>
					new Promise( ( resolve ) => {
						setTimeout( () => {
							resolve( { success: true, settings: {} } );
						}, 100 );
					} )
			);

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			expect( result.current.loading ).toBe( true );
		} );

		it( 'should handle successful fetch', async () => {
			const mockSettings = {
				export_format: 'blueprint',
				include_uploads: true,
			};

			apiFetch.mockResolvedValue( {
				success: true,
				settings: mockSettings,
			} );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.settings ).toEqual( mockSettings );
			expect( result.current.error ).toBeNull();
		} );

		it( 'should handle API error', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.error ).toBe( 'Network error' );
			expect( result.current.settings ).toEqual( {} );
		} );

		it( 'should handle failed response', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
				message: 'Settings not found',
			} );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.error ).toBe( 'Settings not found' );
		} );

		it( 'should handle response with value field', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				value: { test: 'value' },
			} );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.settings ).toEqual( { test: 'value' } );
		} );

		it( 'should handle empty settings', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				settings: {},
			} );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.settings ).toEqual( {} );
		} );
	} );

	describe( 'refetch', () => {
		it( 'should refetch settings when called', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					settings: { version: 1 },
				} )
				.mockResolvedValueOnce( {
					success: true,
					settings: { version: 2 },
				} );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.settings.version ).toBe( 1 );

			// Refetch
			act( () => {
				result.current.refetch();
			} );

			await waitFor( () => {
				expect( result.current.settings.version ).toBe( 2 );
			} );

			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should reset error state on refetch', async () => {
			apiFetch
				.mockRejectedValueOnce( new Error( 'First error' ) )
				.mockResolvedValueOnce( {
					success: true,
					settings: { test: 'value' },
				} );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.error ).toBe( 'First error' );
			} );

			// Refetch
			act( () => {
				result.current.refetch();
			} );

			await waitFor( () => {
				expect( result.current.error ).toBeNull();
			} );

			expect( result.current.settings ).toEqual( { test: 'value' } );
		} );
	} );

	describe( 'invalidateCache', () => {
		it( 'should refetch settings', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				settings: {},
			} );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			act( () => {
				result.current.invalidateCache();
			} );

			expect( apiFetch ).toHaveBeenCalledTimes( 2 ); // Initial + refetch
		} );
	} );

	describe( 'error handling', () => {
		it( 'should handle error without message', async () => {
			apiFetch.mockRejectedValue( new Error() );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.error ).toBe( 'Failed to load settings' );
		} );

		it( 'should handle non-Error rejections', async () => {
			apiFetch.mockRejectedValue( 'String error' );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.error ).toBeDefined();
		} );

		it( 'should handle response without message', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
			} );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.error ).toBe( 'Failed to load settings' );
		} );
	} );

	describe( 'loading state', () => {
		it( 'should start with loading true', () => {
			apiFetch.mockImplementation( () => new Promise( () => {} ) );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			expect( result.current.loading ).toBe( true );
		} );

		it( 'should set loading false after success', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				settings: {},
			} );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );
		} );

		it( 'should set loading false after error', async () => {
			apiFetch.mockRejectedValue( new Error( 'Error' ) );

			const { result } = renderHook(
				() => useContext( SettingsContext ),
				{
					wrapper: SettingsProvider,
				}
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );
		} );
	} );
} );
