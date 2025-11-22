/**
 * Get REST URL Utility Tests
 *
 * @package
 */

import { getRestUrl } from '../getRestUrl';

describe( 'getRestUrl', () => {
	let originalWindow;

	beforeEach( () => {
		originalWindow = global.window;
		global.window = {
			aetherData: undefined,
		};
	} );

	afterEach( () => {
		global.window = originalWindow;
	} );

	test( 'returns URL from window.aetherData when present', () => {
		global.window.aetherData = {
			restUrl: '/custom/rest/url/',
		};

		const url = getRestUrl();

		expect( url ).toBe( '/custom/rest/url/' );
	} );

	test( 'returns default URL when window.aetherData is undefined', () => {
		global.window.aetherData = undefined;

		const url = getRestUrl();

		expect( url ).toBe( '/wp-json/aether/site-exporter/' );
	} );

	test( 'returns default URL when window.aetherData.restUrl is missing', () => {
		global.window.aetherData = {};

		const url = getRestUrl();

		expect( url ).toBe( '/wp-json/aether/site-exporter/' );
	} );

	test( 'returns default URL when window is undefined', () => {
		global.window = undefined;

		const url = getRestUrl();

		expect( url ).toBe( '/wp-json/aether/site-exporter/' );
	} );

	test( 'handles different custom URLs', () => {
		global.window.aetherData = {
			restUrl: 'https://api.example.com/wp-json/',
		};

		const url = getRestUrl();

		expect( url ).toBe( 'https://api.example.com/wp-json/' );
	} );
} );
