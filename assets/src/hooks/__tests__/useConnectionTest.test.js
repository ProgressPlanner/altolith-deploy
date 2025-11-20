/**
 * Connection Test Hook Tests
 *
 * Tests for useConnectionTest hook.
 * Validates connection testing, state management, and error handling.
 *
 * @package
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useConnectionTest } from '../useConnectionTest';
import apiFetch from '../../utils/api';

// Mock the API module
jest.mock( '../../utils/api' );

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

describe( 'useConnectionTest', () => {
	const mockProviderId = 'local-filesystem';
	const mockConfig = {
		directory: '/var/www/html',
		enabled: true,
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Initial state', () => {
		test( 'should start with testing=false and result=null', () => {
			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			expect( result.current.testing ).toBe( false );
			expect( result.current.result ).toBeNull();
		} );

		test( 'should provide test function', () => {
			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			expect( typeof result.current.test ).toBe( 'function' );
		} );
	} );

	describe( 'test() - Successful connection', () => {
		test( 'should call API with correct parameters', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				message: 'Connection successful',
			} );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: `/aether/site-exporter/providers/${ mockProviderId }/test`,
				method: 'POST',
				data: { config: mockConfig },
			} );
		} );

		test( 'should set testing=true during test', async () => {
			let resolveFetch;
			apiFetch.mockReturnValue(
				new Promise( ( resolve ) => {
					resolveFetch = resolve;
				} )
			);

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			act( () => {
				result.current.test();
			} );

			expect( result.current.testing ).toBe( true );

			await act( async () => {
				resolveFetch( { success: true } );
			} );
		} );

		test( 'should set result to success when test passes', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
				message: 'Connection successful',
			} );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result ).toEqual( {
				success: true,
				message: 'Connection successful',
			} );
			expect( result.current.testing ).toBe( false );
		} );

		test( 'should use default success message when not provided', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
			} );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result ).toEqual( {
				success: true,
				message: 'Connection test successful',
			} );
		} );

		test( 'should clear previous result before new test', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					message: 'First test',
				} )
				.mockResolvedValueOnce( {
					success: true,
					message: 'Second test',
				} );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result.message ).toBe( 'First test' );

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result.message ).toBe( 'Second test' );
		} );
	} );

	describe( 'test() - Failed connection', () => {
		test( 'should handle unsuccessful API response', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
				message: 'Invalid credentials',
			} );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result ).toEqual( {
				success: false,
				message: 'Invalid credentials',
			} );
			expect( result.current.testing ).toBe( false );
		} );

		test( 'should handle unsuccessful response with error field', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
				error: 'Permission denied',
			} );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result ).toEqual( {
				success: false,
				message: 'Permission denied',
			} );
		} );

		test( 'should use default error message when not provided', async () => {
			apiFetch.mockResolvedValue( {
				success: false,
			} );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result ).toEqual( {
				success: false,
				message: 'Connection test failed',
			} );
		} );

		test( 'should handle API fetch error', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result ).toEqual( {
				success: false,
				message: 'Network error',
			} );
			expect( result.current.testing ).toBe( false );
		} );

		test( 'should handle error without message', async () => {
			apiFetch.mockRejectedValue( new Error() );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result ).toEqual( {
				success: false,
				message: 'Connection test failed',
			} );
		} );

		test( 'should handle non-Error rejection', async () => {
			apiFetch.mockRejectedValue( 'Something went wrong' );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result ).toEqual( {
				success: false,
				message: 'Connection test failed',
			} );
		} );
	} );

	describe( 'test() function stability', () => {
		test( 'should update test function when providerId changes', () => {
			const { result, rerender } = renderHook(
				( { providerId, config } ) =>
					useConnectionTest( providerId, config ),
				{
					initialProps: {
						providerId: 'provider-1',
						config: mockConfig,
					},
				}
			);

			const firstTest = result.current.test;

			rerender( {
				providerId: 'provider-2',
				config: mockConfig,
			} );

			expect( result.current.test ).not.toBe( firstTest );
		} );

		test( 'should update test function when config changes', () => {
			const { result, rerender } = renderHook(
				( { providerId, config } ) =>
					useConnectionTest( providerId, config ),
				{
					initialProps: {
						providerId: mockProviderId,
						config: { directory: '/path1' },
					},
				}
			);

			const firstTest = result.current.test;

			rerender( {
				providerId: mockProviderId,
				config: { directory: '/path2' },
			} );

			expect( result.current.test ).not.toBe( firstTest );
		} );

		test( 'should use latest providerId when test is called', async () => {
			apiFetch.mockResolvedValue( {
				success: true,
			} );

			const { result, rerender } = renderHook(
				( { providerId, config } ) =>
					useConnectionTest( providerId, config ),
				{
					initialProps: {
						providerId: 'provider-1',
						config: mockConfig,
					},
				}
			);

			rerender( {
				providerId: 'provider-2',
				config: mockConfig,
			} );

			await act( async () => {
				await result.current.test();
			} );

			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/aether/site-exporter/providers/provider-2/test',
				} )
			);
		} );
	} );

	describe( 'Integration scenarios', () => {
		test( 'should handle multiple consecutive tests', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					message: 'Test 1',
				} )
				.mockResolvedValueOnce( {
					success: false,
					message: 'Test 2 failed',
				} )
				.mockResolvedValueOnce( {
					success: true,
					message: 'Test 3',
				} );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			await act( async () => {
				await result.current.test();
			} );
			expect( result.current.result.success ).toBe( true );

			await act( async () => {
				await result.current.test();
			} );
			expect( result.current.result.success ).toBe( false );

			await act( async () => {
				await result.current.test();
			} );
			expect( result.current.result.success ).toBe( true );
		} );

		test( 'should handle rapid successive test calls', async () => {
			apiFetch
				.mockResolvedValueOnce( {
					success: true,
					message: 'First',
				} )
				.mockResolvedValueOnce( {
					success: true,
					message: 'Second',
				} );

			const { result } = renderHook( () =>
				useConnectionTest( mockProviderId, mockConfig )
			);

			// Call test twice in rapid succession
			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result.message ).toBe( 'First' );

			await act( async () => {
				await result.current.test();
			} );

			expect( result.current.result.message ).toBe( 'Second' );
			expect( result.current.testing ).toBe( false );
		} );
	} );
} );
