/**
 * useRecentJobs Hook Tests
 *
 * @package
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useRecentJobs } from '../useRecentJobs';
import { useAPIData } from '../../../hooks/useAPIData';

jest.mock( '../../../hooks/useAPIData' );

describe( 'useRecentJobs', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'fetches recent jobs with default limit', () => {
		const mockReturnValue = {
			data: [
				{ id: 1, status: 'completed' },
				{ id: 2, status: 'pending' },
			],
			loading: false,
			error: null,
			refresh: jest.fn(),
		};

		useAPIData.mockReturnValue( mockReturnValue );

		const { result } = renderHook( () => useRecentJobs() );

		expect( useAPIData ).toHaveBeenCalledWith( {
			path: '/aether/site-exporter/export/jobs?limit=5',
			transform: expect.any( Function ),
			initialData: [],
			dependencies: [ 5 ],
		} );

		expect( result.current ).toEqual( {
			jobs: mockReturnValue.data,
			loading: false,
			error: null,
			refresh: mockReturnValue.refresh,
		} );
	} );

	test( 'fetches recent jobs with custom limit', () => {
		const mockReturnValue = {
			data: [ { id: 1, status: 'completed' } ],
			loading: false,
			error: null,
			refresh: jest.fn(),
		};

		useAPIData.mockReturnValue( mockReturnValue );

		const { result } = renderHook( () => useRecentJobs( 10 ) );

		expect( useAPIData ).toHaveBeenCalledWith( {
			path: '/aether/site-exporter/export/jobs?limit=10',
			transform: expect.any( Function ),
			initialData: [],
			dependencies: [ 10 ],
		} );

		expect( result.current.jobs ).toEqual( mockReturnValue.data );
	} );

	test( 'transform function extracts jobs from response', () => {
		const mockResponse = {
			success: true,
			value: {
				jobs: [
					{ id: 1, status: 'completed' },
					{ id: 2, status: 'pending' },
				],
			},
		};

		useAPIData.mockImplementation( ( { transform } ) => {
			const data = transform( mockResponse );
			return {
				data,
				loading: false,
				error: null,
				refresh: jest.fn(),
			};
		} );

		const { result } = renderHook( () => useRecentJobs() );

		expect( result.current.jobs ).toEqual( mockResponse.value.jobs );
	} );

	test( 'transform function throws error on failed response', () => {
		const mockResponse = {
			success: false,
			value: null,
		};

		useAPIData.mockImplementation( ( { transform } ) => {
			try {
				transform( mockResponse );
				return {
					data: [],
					loading: false,
					error: null,
					refresh: jest.fn(),
				};
			} catch ( error ) {
				return {
					data: [],
					loading: false,
					error: error.message,
					refresh: jest.fn(),
				};
			}
		} );

		const { result } = renderHook( () => useRecentJobs() );

		expect( result.current.error ).toBe( 'Failed to fetch jobs' );
	} );

	test( 'transform function throws error when jobs are missing', () => {
		const mockResponse = {
			success: true,
			value: {},
		};

		useAPIData.mockImplementation( ( { transform } ) => {
			try {
				transform( mockResponse );
				return {
					data: [],
					loading: false,
					error: null,
					refresh: jest.fn(),
				};
			} catch ( error ) {
				return {
					data: [],
					loading: false,
					error: error.message,
					refresh: jest.fn(),
				};
			}
		} );

		const { result } = renderHook( () => useRecentJobs() );

		expect( result.current.error ).toBe( 'Failed to fetch jobs' );
	} );

	test( 'returns loading state', () => {
		useAPIData.mockReturnValue( {
			data: [],
			loading: true,
			error: null,
			refresh: jest.fn(),
		} );

		const { result } = renderHook( () => useRecentJobs() );

		expect( result.current.loading ).toBe( true );
	} );

	test( 'returns error state', () => {
		useAPIData.mockReturnValue( {
			data: [],
			loading: false,
			error: 'Network error',
			refresh: jest.fn(),
		} );

		const { result } = renderHook( () => useRecentJobs() );

		expect( result.current.error ).toBe( 'Network error' );
	} );

	test( 'provides refresh function', () => {
		const mockRefresh = jest.fn();
		useAPIData.mockReturnValue( {
			data: [],
			loading: false,
			error: null,
			refresh: mockRefresh,
		} );

		const { result } = renderHook( () => useRecentJobs() );

		expect( result.current.refresh ).toBe( mockRefresh );
		result.current.refresh();
		expect( mockRefresh ).toHaveBeenCalled();
	} );
} );
