/**
 * Tests for ConfigContext
 *
 * ConfigContext provides config from window.aetherData (synchronous, no API calls).
 */

import { renderHook } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { ConfigProvider, ConfigContext } from '../ConfigContext';
import { useContext } from '@wordpress/element';

/**
 * Wrapper component for testing context
 * @param root0
 * @param root0.children
 */
const wrapper = ( { children } ) =>
	createElement( ConfigProvider, {}, children );

describe( 'ConfigContext', () => {
	let originalAetherData;

	beforeEach( () => {
		// Save original window.aetherData
		originalAetherData = global.window.aetherData;
	} );

	afterEach( () => {
		// Restore original window.aetherData
		if ( originalAetherData ) {
			global.window.aetherData = originalAetherData;
		} else {
			delete global.window.aetherData;
		}
	} );

	describe( 'Initialization', () => {
		it( 'should read config from window.aetherData', () => {
			global.window.aetherData = {
				publicUrl: 'https://example.com',
				adminUrl: 'https://example.com/wp-admin',
				pluginUrl: 'https://example.com/wp-content/plugins/aether',
				restUrl: '/wp-json/',
			};

			const { result } = renderHook( () => useContext( ConfigContext ), {
				wrapper,
			} );

			expect( result.current.config ).toEqual( {
				publicUrl: 'https://example.com',
				adminUrl: 'https://example.com/wp-admin',
				pluginUrl:
					'https://example.com/wp-content/plugins/aether',
				restUrl: '/wp-json/',
			} );
		} );

		it( 'should return empty strings when window.aetherData is missing', () => {
			delete global.window.aetherData;

			const { result } = renderHook( () => useContext( ConfigContext ), {
				wrapper,
			} );

			expect( result.current.config ).toEqual( {
				publicUrl: '',
				adminUrl: '',
				pluginUrl: '',
				restUrl: '',
			} );
		} );

		it( 'should handle partial window.aetherData', () => {
			global.window.aetherData = {
				publicUrl: 'https://example.com',
				// Missing other properties
			};

			const { result } = renderHook( () => useContext( ConfigContext ), {
				wrapper,
			} );

			expect( result.current.config ).toEqual( {
				publicUrl: 'https://example.com',
				adminUrl: '',
				pluginUrl: '',
				restUrl: '',
			} );
		} );
	} );

	describe( 'Config Properties', () => {
		it( 'should provide all expected config properties', () => {
			global.window.aetherData = {
				publicUrl: 'https://example.com',
				adminUrl: 'https://example.com/wp-admin',
				pluginUrl: 'https://example.com/wp-content/plugins/aether',
				restUrl: '/wp-json/',
			};

			const { result } = renderHook( () => useContext( ConfigContext ), {
				wrapper,
			} );

			const config = result.current.config;

			expect( config ).toHaveProperty( 'publicUrl' );
			expect( config ).toHaveProperty( 'adminUrl' );
			expect( config ).toHaveProperty( 'pluginUrl' );
			expect( config ).toHaveProperty( 'restUrl' );
		} );

		it( 'should handle empty string values in window.aetherData', () => {
			global.window.aetherData = {
				publicUrl: '',
				adminUrl: '',
				pluginUrl: '',
				restUrl: '',
			};

			const { result } = renderHook( () => useContext( ConfigContext ), {
				wrapper,
			} );

			expect( result.current.config ).toEqual( {
				publicUrl: '',
				adminUrl: '',
				pluginUrl: '',
				restUrl: '',
			} );
		} );
	} );

	describe( 'Edge Cases', () => {
		it( 'should handle undefined window', () => {
			const originalWindow = global.window;
			global.window = undefined;

			const { result } = renderHook( () => useContext( ConfigContext ), {
				wrapper,
			} );

			expect( result.current.config ).toEqual( {
				publicUrl: '',
				adminUrl: '',
				pluginUrl: '',
				restUrl: '',
			} );

			global.window = originalWindow;
		} );

		it( 'should handle window.aetherData with extra properties', () => {
			global.window.aetherData = {
				publicUrl: 'https://example.com',
				adminUrl: 'https://example.com/wp-admin',
				pluginUrl: 'https://example.com/wp-content/plugins/aether',
				restUrl: '/wp-json/',
				extraProperty: 'should be ignored',
			};

			const { result } = renderHook( () => useContext( ConfigContext ), {
				wrapper,
			} );

			// Should only have the expected properties
			expect( Object.keys( result.current.config ) ).toHaveLength( 4 );
			expect( result.current.config ).not.toHaveProperty(
				'extraProperty'
			);
		} );
	} );
} );
