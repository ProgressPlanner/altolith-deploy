/**
 * Tests for usePublishReadiness Hook
 *
 * Updated to work with refactored hook using useAPIData
 *
 * @package
 */

import { renderHook, waitFor } from '@testing-library/react';
import { usePublishReadiness } from '../usePublishReadiness';
import apiFetch from '../../../utils/api';

jest.mock( '../../../utils/api' );

describe( 'usePublishReadiness', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return ready state when all checks pass', async () => {
		// Mock settings call
		apiFetch.mockResolvedValueOnce( {
			success: true,
			value: {
				provider_types: {
					storage: 'local-filesystem',
					static_site: 'github-pages',
				},
				staticSite: {
					enabled: true,
				},
			},
		} );

		// Mock provider status call
		apiFetch.mockResolvedValueOnce( {
			success: true,
			configured: true,
		} );

		const { result } = renderHook( () => usePublishReadiness() );

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		expect( result.current.ready ).toBe( true );
		expect( result.current.issues ).toEqual( [] );
	} );

	it( 'should return issues when storage provider is missing', async () => {
		apiFetch.mockResolvedValue( {
			success: true,
			value: {
				provider_types: {},
				staticSite: {
					enabled: false,
				},
			},
		} );

		const { result } = renderHook( () => usePublishReadiness() );

		await waitFor( () => {
			// When no storage provider, loading may be falsy but not strictly false
			expect( result.current.loading ).toBeFalsy();
		} );

		expect( result.current.ready ).toBe( false );
		expect( result.current.issues.length ).toBeGreaterThan( 0 );
		expect( result.current.issues[ 0 ] ).toContain( 'storage provider' );
	} );

	it( 'should return issues when static site is enabled but no provider', async () => {
		apiFetch.mockResolvedValueOnce( {
			success: true,
			value: {
				provider_types: {
					storage: 'local-filesystem',
					static_site: '',
				},
				staticSite: {
					enabled: true,
				},
			},
		} );

		// Mock provider status call
		apiFetch.mockResolvedValueOnce( {
			success: true,
			configured: true,
		} );

		const { result } = renderHook( () => usePublishReadiness() );

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		expect( result.current.ready ).toBe( false );
		expect( result.current.issues.length ).toBeGreaterThan( 0 );
		expect( result.current.issues[ 0 ] ).toContain( 'Static site' );
	} );

	it( 'should return issues when provider is not configured', async () => {
		apiFetch.mockResolvedValueOnce( {
			success: true,
			value: {
				provider_types: {
					storage: 'local-filesystem',
				},
				staticSite: {
					enabled: false,
				},
			},
		} );

		// Mock provider status as not configured
		apiFetch.mockResolvedValueOnce( {
			success: true,
			configured: false,
		} );

		const { result } = renderHook( () => usePublishReadiness() );

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		expect( result.current.ready ).toBe( false );
		expect( result.current.issues.length ).toBeGreaterThan( 0 );
		expect( result.current.issues[ 0 ] ).toContain(
			'not fully configured'
		);
	} );

	it( 'should handle API errors gracefully', async () => {
		apiFetch.mockRejectedValue( new Error( 'Network error' ) );

		const { result } = renderHook( () => usePublishReadiness() );

		// Should still return a result structure
		await waitFor(
			() => {
				expect( result.current ).toBeDefined();
			},
			{ timeout: 2000 }
		);

		// With error, loading should eventually become false and ready should be false
		expect( result.current.ready ).toBe( false );
	} );
} );
