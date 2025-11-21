/**
 * useAPIData Hook Tests
 *
 * @package
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAPIData, usePaginatedData } from '../useAPIData';
import apiFetch from '../../utils/api';

// Mock API fetch
jest.mock( '../../utils/api' );

describe( 'useAPIData', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'basic functionality', () => {
		test( 'should return initial data before fetch', () => {
			apiFetch.mockResolvedValue( { items: [] } );

			const { result } = renderHook( () =>
				useAPIData( {
					path: '/test',
					initialData: [],
					fetchOnMount: false,
				} )
			);

			expect( result.current.data ).toEqual( [] );
			expect( result.current.loading ).toBe( false );
			expect( result.current.error ).toBeNull();
		} );

		test( 'should fetch data on mount', async () => {
			const mockData = { items: [ 1, 2, 3 ] };
			apiFetch.mockResolvedValue( mockData );

			const { result } = renderHook( () =>
				useAPIData( {
					path: '/test',
					initialData: null,
				} )
			);

			expect( result.current.loading ).toBe( true );

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.data ).toEqual( mockData );
			expect( result.current.error ).toBeNull();
		} );

		test( 'should handle fetch error', async () => {
			const mockError = new Error( 'Network error' );
			apiFetch.mockRejectedValue( mockError );

			const { result } = renderHook( () =>
				useAPIData( {
					path: '/test',
					initialData: null,
				} )
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.error ).toBe( 'Network error' );
			expect( result.current.data ).toBeNull();
		} );

		test( 'should transform data when transform function provided', async () => {
			apiFetch.mockResolvedValue( { value: { items: [ 'a', 'b' ] } } );

			const { result } = renderHook( () =>
				useAPIData( {
					path: '/test',
					transform: ( response ) => response.value.items,
					initialData: [],
				} )
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			expect( result.current.data ).toEqual( [ 'a', 'b' ] );
		} );

		test( 'should not fetch when fetchOnMount is false', async () => {
			apiFetch.mockResolvedValue( {} );

			renderHook( () =>
				useAPIData( {
					path: '/test',
					fetchOnMount: false,
				} )
			);

			// Wait a bit to ensure no fetch happens
			await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

			expect( apiFetch ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'refresh functionality', () => {
		test( 'should refetch when refresh is called', async () => {
			apiFetch
				.mockResolvedValueOnce( { count: 1 } )
				.mockResolvedValueOnce( { count: 2 } );

			const { result } = renderHook( () =>
				useAPIData( {
					path: '/test',
					initialData: { count: 0 },
				} )
			);

			await waitFor( () => {
				expect( result.current.data ).toEqual( { count: 1 } );
			} );

			await act( async () => {
				result.current.refresh();
			} );

			await waitFor( () => {
				expect( result.current.data ).toEqual( { count: 2 } );
			} );

			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'callbacks', () => {
		test( 'should call onSuccess callback', async () => {
			const mockData = { success: true };
			apiFetch.mockResolvedValue( mockData );
			const onSuccess = jest.fn();

			renderHook( () =>
				useAPIData( {
					path: '/test',
					onSuccess,
				} )
			);

			await waitFor( () => {
				expect( onSuccess ).toHaveBeenCalledWith( mockData );
			} );
		} );

		test( 'should call onError callback', async () => {
			const mockError = new Error( 'Failed' );
			apiFetch.mockRejectedValue( mockError );
			const onError = jest.fn();

			renderHook( () =>
				useAPIData( {
					path: '/test',
					onError,
				} )
			);

			await waitFor( () => {
				expect( onError ).toHaveBeenCalledWith( mockError );
			} );
		} );
	} );

	describe( 'setData', () => {
		test( 'should allow manual data updates', async () => {
			apiFetch.mockResolvedValue( { value: 'original' } );

			const { result } = renderHook( () =>
				useAPIData( {
					path: '/test',
					initialData: null,
				} )
			);

			await waitFor( () => {
				expect( result.current.loading ).toBe( false );
			} );

			act( () => {
				result.current.setData( { value: 'updated' } );
			} );

			expect( result.current.data ).toEqual( { value: 'updated' } );
		} );
	} );
} );

describe( 'usePaginatedData', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'should build paginated path', async () => {
		apiFetch.mockResolvedValue( { items: [], total: 0 } );

		renderHook( () =>
			usePaginatedData( {
				path: '/items',
				perPage: 5,
			} )
		);

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: '/items?page=1&per_page=5',
				} )
			);
		} );
	} );

	test( 'should calculate total pages', async () => {
		apiFetch.mockResolvedValue( { items: [], total: 25 } );

		const { result } = renderHook( () =>
			usePaginatedData( {
				path: '/items',
				perPage: 10,
			} )
		);

		await waitFor( () => {
			expect( result.current.totalPages ).toBe( 3 );
		} );
	} );

	test( 'should provide pagination controls', async () => {
		apiFetch.mockResolvedValue( { items: [], total: 30 } );

		const { result } = renderHook( () =>
			usePaginatedData( {
				path: '/items',
				perPage: 10,
			} )
		);

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		expect( result.current.page ).toBe( 1 );
		expect( result.current.hasNextPage ).toBe( true );
		expect( result.current.hasPrevPage ).toBe( false );
		expect( typeof result.current.nextPage ).toBe( 'function' );
		expect( typeof result.current.prevPage ).toBe( 'function' );
		expect( typeof result.current.goToPage ).toBe( 'function' );
	} );

	test( 'should navigate to next page', async () => {
		apiFetch.mockResolvedValue( { items: [], total: 30 } );

		const { result } = renderHook( () =>
			usePaginatedData( {
				path: '/items',
				perPage: 10,
			} )
		);

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		act( () => {
			result.current.nextPage();
		} );

		expect( result.current.page ).toBe( 2 );
	} );

	test( 'should navigate to previous page', async () => {
		apiFetch.mockResolvedValue( { items: [], total: 30 } );

		const { result } = renderHook( () =>
			usePaginatedData( {
				path: '/items',
				perPage: 10,
				initialPage: 2,
			} )
		);

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		act( () => {
			result.current.prevPage();
		} );

		expect( result.current.page ).toBe( 1 );
	} );

	test( 'should go to specific page', async () => {
		apiFetch.mockResolvedValue( { items: [], total: 50 } );

		const { result } = renderHook( () =>
			usePaginatedData( {
				path: '/items',
				perPage: 10,
			} )
		);

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		act( () => {
			result.current.goToPage( 3 );
		} );

		expect( result.current.page ).toBe( 3 );
	} );

	test( 'should not go beyond page bounds', async () => {
		apiFetch.mockResolvedValue( { items: [], total: 20 } );

		const { result } = renderHook( () =>
			usePaginatedData( {
				path: '/items',
				perPage: 10,
				initialPage: 2,
			} )
		);

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		act( () => {
			result.current.nextPage();
		} );

		// Should stay at page 2 since totalPages is 2
		expect( result.current.page ).toBe( 2 );

		act( () => {
			result.current.goToPage( 5 );
		} );

		// Should stay at page 2
		expect( result.current.page ).toBe( 2 );
	} );
} );
