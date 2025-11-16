/**
 * Get ZIP URL Utility Tests
 *
 * @package
 */

import { getZipUrl } from '../getZipUrl';

// Mock window.location
const mockLocation = {
	origin: 'https://example.com',
};

Object.defineProperty( window, 'location', {
	value: mockLocation,
	writable: true,
} );

describe( 'getZipUrl', () => {
	beforeEach( () => {
		// Reset to default
		Object.defineProperty( window, 'location', {
			value: { origin: 'https://example.com' },
			writable: true,
		} );
	} );

	test( 'returns correct ZIP URL', () => {
		const url = getZipUrl();
		expect( url ).toBe( 'https://example.com/wp-content/wp-content.zip' );
	} );

	test( 'handles origin without trailing slash', () => {
		Object.defineProperty( window, 'location', {
			value: { origin: 'https://example.com' },
			writable: true,
		} );
		const url = getZipUrl();
		expect( url ).toBe( 'https://example.com/wp-content/wp-content.zip' );
	} );

	test( 'handles different origins', () => {
		Object.defineProperty( window, 'location', {
			value: { origin: 'http://localhost:8080' },
			writable: true,
		} );
		const url = getZipUrl();
		expect( url ).toBe( 'http://localhost:8080/wp-content/wp-content.zip' );
	} );

	test( 'handles origin with port', () => {
		Object.defineProperty( window, 'location', {
			value: { origin: 'https://example.com:443' },
			writable: true,
		} );
		const url = getZipUrl();
		expect( url ).toBe(
			'https://example.com:443/wp-content/wp-content.zip'
		);
	} );
} );
