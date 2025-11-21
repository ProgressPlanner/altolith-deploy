/**
 * Asset Patterns Tests
 *
 * @package
 */

import {
	getExtensionFromUrl,
	getAssetType,
	parseSrcset,
	escapeRegex,
	extractHost,
	ASSET_TYPE_MAP,
} from '../assetPatterns';

describe( 'assetPatterns', () => {
	describe( 'getExtensionFromUrl()', () => {
		test( 'should extract extension from simple URL', () => {
			expect( getExtensionFromUrl( 'https://example.com/style.css' ) ).toBe( 'css' );
			expect( getExtensionFromUrl( 'https://example.com/script.js' ) ).toBe( 'js' );
			expect( getExtensionFromUrl( 'https://example.com/image.png' ) ).toBe( 'png' );
		} );

		test( 'should handle URLs with query strings', () => {
			expect( getExtensionFromUrl( 'https://example.com/style.css?v=1.0' ) ).toBe( 'css' );
			expect( getExtensionFromUrl( 'https://example.com/script.js?cache=abc' ) ).toBe( 'js' );
		} );

		test( 'should handle URLs with hash fragments', () => {
			expect( getExtensionFromUrl( 'https://example.com/style.css#section' ) ).toBe( 'css' );
		} );

		test( 'should return lowercase extension', () => {
			expect( getExtensionFromUrl( 'https://example.com/style.CSS' ) ).toBe( 'css' );
			expect( getExtensionFromUrl( 'https://example.com/script.JS' ) ).toBe( 'js' );
		} );

		test( 'should handle relative URLs', () => {
			expect( getExtensionFromUrl( '/assets/style.css' ) ).toBe( 'css' );
			expect( getExtensionFromUrl( './script.js' ) ).toBe( 'js' );
		} );

		test( 'should return empty string for URLs without extension', () => {
			expect( getExtensionFromUrl( 'https://example.com/page' ) ).toBe( '' );
			expect( getExtensionFromUrl( 'https://example.com/' ) ).toBe( '' );
		} );

		test( 'should handle complex paths', () => {
			expect( getExtensionFromUrl( 'https://example.com/wp-content/themes/theme/style.min.css' ) ).toBe( 'css' );
		} );
	} );

	describe( 'getAssetType()', () => {
		test( 'should return css for CSS files', () => {
			expect( getAssetType( 'https://example.com/style.css' ) ).toBe( 'css' );
		} );

		test( 'should return js for JavaScript files', () => {
			expect( getAssetType( 'https://example.com/script.js' ) ).toBe( 'js' );
		} );

		test( 'should return font for font files', () => {
			expect( getAssetType( 'https://example.com/font.woff' ) ).toBe( 'font' );
			expect( getAssetType( 'https://example.com/font.woff2' ) ).toBe( 'font' );
			expect( getAssetType( 'https://example.com/font.ttf' ) ).toBe( 'font' );
			expect( getAssetType( 'https://example.com/font.otf' ) ).toBe( 'font' );
			expect( getAssetType( 'https://example.com/font.eot' ) ).toBe( 'font' );
		} );

		test( 'should return other for unknown extensions', () => {
			expect( getAssetType( 'https://example.com/image.png' ) ).toBe( 'other' );
			expect( getAssetType( 'https://example.com/data.json' ) ).toBe( 'other' );
		} );
	} );

	describe( 'parseSrcset()', () => {
		test( 'should parse simple srcset with width descriptors', () => {
			const srcset = 'image-300.jpg 300w, image-600.jpg 600w';
			expect( parseSrcset( srcset ) ).toEqual( [ 'image-300.jpg', 'image-600.jpg' ] );
		} );

		test( 'should parse srcset with pixel density descriptors', () => {
			const srcset = 'image.jpg 1x, image@2x.jpg 2x';
			expect( parseSrcset( srcset ) ).toEqual( [ 'image.jpg', 'image@2x.jpg' ] );
		} );

		test( 'should handle URLs with spaces in srcset', () => {
			const srcset = '  image1.jpg 100w  ,  image2.jpg 200w  ';
			expect( parseSrcset( srcset ) ).toEqual( [ 'image1.jpg', 'image2.jpg' ] );
		} );

		test( 'should handle single entry srcset', () => {
			const srcset = 'image.jpg 100w';
			expect( parseSrcset( srcset ) ).toEqual( [ 'image.jpg' ] );
		} );

		test( 'should handle full URLs in srcset', () => {
			const srcset = 'https://example.com/image-sm.jpg 300w, https://example.com/image-lg.jpg 600w';
			expect( parseSrcset( srcset ) ).toEqual( [
				'https://example.com/image-sm.jpg',
				'https://example.com/image-lg.jpg',
			] );
		} );
	} );

	describe( 'escapeRegex()', () => {
		test( 'should escape special regex characters', () => {
			expect( escapeRegex( 'hello.world' ) ).toBe( 'hello\\.world' );
			expect( escapeRegex( 'test*pattern' ) ).toBe( 'test\\*pattern' );
			expect( escapeRegex( 'value+plus' ) ).toBe( 'value\\+plus' );
		} );

		test( 'should escape all special characters', () => {
			expect( escapeRegex( '.*+?^${}()|[]\\' ) ).toBe( '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\' );
		} );

		test( 'should not modify strings without special characters', () => {
			expect( escapeRegex( 'hello' ) ).toBe( 'hello' );
			expect( escapeRegex( 'simple-string_123' ) ).toBe( 'simple-string_123' );
		} );

		test( 'should handle URLs correctly', () => {
			const url = 'https://example.com/path?query=value';
			const escaped = escapeRegex( url );
			expect( escaped ).toBe( 'https://example\\.com/path\\?query=value' );
		} );
	} );

	describe( 'extractHost()', () => {
		test( 'should extract host from full URL', () => {
			expect( extractHost( 'https://example.com/path' ) ).toBe( 'example.com' );
			expect( extractHost( 'http://sub.example.com/page' ) ).toBe( 'sub.example.com' );
		} );

		test( 'should include port in host', () => {
			expect( extractHost( 'https://example.com:8080/path' ) ).toBe( 'example.com:8080' );
		} );

		test( 'should handle URLs without path', () => {
			expect( extractHost( 'https://example.com' ) ).toBe( 'example.com' );
		} );

		test( 'should return empty string for invalid URLs', () => {
			expect( extractHost( 'not-a-url' ) ).toBe( '' );
			expect( extractHost( '/relative/path' ) ).toBe( '' );
		} );

		test( 'should handle complex subdomains', () => {
			expect( extractHost( 'https://www.sub.domain.example.com/path' ) ).toBe( 'www.sub.domain.example.com' );
		} );
	} );

	describe( 'ASSET_TYPE_MAP', () => {
		test( 'should have correct mappings', () => {
			expect( ASSET_TYPE_MAP.css ).toBe( 'css' );
			expect( ASSET_TYPE_MAP.js ).toBe( 'js' );
			expect( ASSET_TYPE_MAP.woff ).toBe( 'font' );
			expect( ASSET_TYPE_MAP.woff2 ).toBe( 'font' );
		} );
	} );
} );
