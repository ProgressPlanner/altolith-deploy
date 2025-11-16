/**
 * Tests for useUsageSummary Hook
 *
 * Updated to work with refactored hook using useAPIData
 *
 * @package
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useUsageSummary } from '../useUsageSummary';
import apiFetch from '../../../utils/api';

jest.mock( '../../../utils/api' );

describe( 'useUsageSummary', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return usage summary with provider labels', async () => {
		apiFetch.mockResolvedValue( {
			success: true,
			value: {
				provider_types: {
					storage: 'cloudflare-r2',
					static_site: 'gitlab-pages',
					mediaImages: 'cloudflare-images',
				},
				staticSite: {
					enabled: true,
				},
			},
		} );

		const { result } = renderHook( () => useUsageSummary() );

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		expect( result.current.blueprint.provider ).toBe( 'cloudflare-r2' );
		expect( result.current.blueprint.label ).toBe( 'Cloudflare R2' );
		expect( result.current.staticSite.provider ).toBe( 'gitlab-pages' );
		expect( result.current.staticSite.label ).toBe( 'GitLab Pages' );
		expect( result.current.media.provider ).toBe( 'cloudflare-images' );
		expect( result.current.staticEnabled ).toBe( true );
	} );

	it( 'should return "Not configured" when providers are missing', async () => {
		apiFetch.mockResolvedValue( {
			success: true,
			value: {
				provider_types: {},
			},
		} );

		const { result } = renderHook( () => useUsageSummary() );

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		expect( result.current.blueprint.provider ).toBeNull();
		expect( result.current.blueprint.label ).toBe( 'Not configured' );
		expect( result.current.staticSite.provider ).toBeNull();
		expect( result.current.staticSite.label ).toBe( 'Not configured' );
		expect( result.current.media.provider ).toBeNull();
		expect( result.current.media.label ).toBe( 'Not configured' );
	} );

	it( 'should handle API errors gracefully', async () => {
		apiFetch.mockRejectedValue( new Error( 'Network error' ) );

		const { result } = renderHook( () => useUsageSummary() );

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		// Should have default values
		expect( result.current.blueprint ).toBeDefined();
		expect( result.current.blueprint.provider ).toBeNull();
		expect( result.current.blueprint.label ).toBe( 'Not configured' );
		expect( result.current.staticSite ).toBeDefined();
		expect( result.current.staticSite.provider ).toBeNull();
		expect( result.current.media ).toBeDefined();
		expect( result.current.media.provider ).toBeNull();
	} );

	it( 'should support alternative media provider keys', async () => {
		apiFetch.mockResolvedValue( {
			success: true,
			value: {
				provider_types: {
					storage: 'cloudflare-r2',
					media: 'cloudflare-images',
				},
			},
		} );

		const { result } = renderHook( () => useUsageSummary() );

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		expect( result.current.media.provider ).toBe( 'cloudflare-images' );
	} );

	it( 'should handle static site disabled state', async () => {
		apiFetch.mockResolvedValue( {
			success: true,
			value: {
				provider_types: {
					storage: 'cloudflare-r2',
				},
				staticSite: {
					enabled: false,
				},
			},
		} );

		const { result } = renderHook( () => useUsageSummary() );

		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );

		expect( result.current.staticEnabled ).toBe( false );
	} );
} );
