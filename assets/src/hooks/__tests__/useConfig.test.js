/**
 * useConfig Hook Tests
 *
 * @package
 */

import { renderHook } from '@testing-library/react';
import { useConfig } from '../useConfig';

// Mock useConfigContext
jest.mock( '../useConfigContext', () => ( {
	useConfigContext: jest.fn(),
} ) );

import { useConfigContext } from '../useConfigContext';

describe( 'useConfig', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'should return loading state from context', () => {
		useConfigContext.mockReturnValue( {
			config: {},
			loading: true,
		} );

		const { result } = renderHook( () => useConfig() );

		expect( result.current.loading ).toBe( true );
	} );

	test( 'should return publicUrl from config', () => {
		useConfigContext.mockReturnValue( {
			config: { publicUrl: 'https://example.com' },
			loading: false,
		} );

		const { result } = renderHook( () => useConfig() );

		expect( result.current.publicUrl ).toBe( 'https://example.com' );
	} );

	test( 'should return adminUrl from config', () => {
		useConfigContext.mockReturnValue( {
			config: { adminUrl: 'https://example.com/wp-admin' },
			loading: false,
		} );

		const { result } = renderHook( () => useConfig() );

		expect( result.current.adminUrl ).toBe(
			'https://example.com/wp-admin'
		);
	} );

	test( 'should return empty strings when config values missing', () => {
		useConfigContext.mockReturnValue( {
			config: {},
			loading: false,
		} );

		const { result } = renderHook( () => useConfig() );

		expect( result.current.publicUrl ).toBe( '' );
		expect( result.current.adminUrl ).toBe( '' );
	} );

	test( 'should spread additional config fields', () => {
		useConfigContext.mockReturnValue( {
			config: {
				publicUrl: 'https://example.com',
				siteTitle: 'My Site',
				customField: 'custom value',
			},
			loading: false,
		} );

		const { result } = renderHook( () => useConfig() );

		expect( result.current.siteTitle ).toBe( 'My Site' );
		expect( result.current.customField ).toBe( 'custom value' );
	} );
} );
