/**
 * URL Utils Tests
 *
 * @package
 */

import {
	resolveRelative,
	isExternal,
	forceHttps,
	stripPlaygroundScope,
	normalize,
	escapeRegex,
	extractHost,
	shouldSkipUrl,
} from '../urlUtils';

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( filter, value ) => value ),
} ) );

describe( 'urlUtils', () => {
	describe( 'resolveRelative()', () => {
		test( 'should return data URLs as-is', () => {
			const dataUrl = 'data:image/png;base64,abc123';
			expect( resolveRelative( dataUrl, 'https://example.com' ) ).toBe(
				dataUrl
			);
		} );

		test( 'should return absolute URLs as-is', () => {
			expect(
				resolveRelative(
					'https://other.com/page',
					'https://example.com'
				)
			).toBe( 'https://other.com/page' );
		} );

		test( 'should add https to protocol-relative URLs', () => {
			expect(
				resolveRelative(
					'//cdn.example.com/file.js',
					'https://example.com'
				)
			).toBe( 'https://cdn.example.com/file.js' );
		} );

		test( 'should resolve absolute paths', () => {
			expect(
				resolveRelative(
					'/assets/style.css',
					'https://example.com/page'
				)
			).toBe( 'https://example.com/assets/style.css' );
		} );

		test( 'should resolve relative paths', () => {
			expect(
				resolveRelative(
					'image.png',
					'https://example.com/page/index.html'
				)
			).toBe( 'https://example.com/page/image.png' );
		} );
	} );

	describe( 'isExternal()', () => {
		test( 'should return false for relative paths', () => {
			expect( isExternal( '/page', 'https://example.com' ) ).toBe(
				false
			);
		} );

		test( 'should return false for same host', () => {
			expect(
				isExternal( 'https://example.com/page', 'https://example.com' )
			).toBe( false );
		} );

		test( 'should return true for different host', () => {
			expect(
				isExternal( 'https://other.com/page', 'https://example.com' )
			).toBe( true );
		} );

		test( 'should handle protocol-relative URLs', () => {
			expect(
				isExternal( '//other.com/file', 'https://example.com' )
			).toBe( true );
			expect(
				isExternal( '//example.com/file', 'https://example.com' )
			).toBe( false );
		} );

		test( 'should treat non-standard URLs as external', () => {
			expect(
				isExternal( 'mailto:test@example.com', 'https://example.com' )
			).toBe( true );
		} );
	} );

	describe( 'forceHttps()', () => {
		test( 'should convert http to https', () => {
			expect( forceHttps( 'http://example.com' ) ).toBe(
				'https://example.com'
			);
		} );

		test( 'should leave https unchanged', () => {
			expect( forceHttps( 'https://example.com' ) ).toBe(
				'https://example.com'
			);
		} );

		test( 'should skip data URLs', () => {
			const dataUrl = 'data:image/png;base64,abc';
			expect( forceHttps( dataUrl ) ).toBe( dataUrl );
		} );

		test( 'should skip anchors', () => {
			expect( forceHttps( '#section' ) ).toBe( '#section' );
		} );

		test( 'should skip protocol-relative URLs', () => {
			expect( forceHttps( '//cdn.example.com' ) ).toBe(
				'//cdn.example.com'
			);
		} );
	} );

	describe( 'stripPlaygroundScope()', () => {
		test( 'should remove leading scope', () => {
			expect(
				stripPlaygroundScope( '/scope:happy-classic-town/page' )
			).toBe( 'page' );
		} );

		test( 'should remove scope in middle of path', () => {
			expect(
				stripPlaygroundScope( '/wp-content/scope:abc123/uploads' )
			).toBe( '/wp-content/uploads' );
		} );

		test( 'should handle path with only scope', () => {
			expect( stripPlaygroundScope( '/scope:test123' ) ).toBe( '' );
		} );

		test( 'should leave paths without scope unchanged', () => {
			expect(
				stripPlaygroundScope( '/wp-content/uploads/image.png' )
			).toBe( '/wp-content/uploads/image.png' );
		} );
	} );

	describe( 'normalize()', () => {
		test( 'should resolve relative URLs against site URL', () => {
			expect( normalize( '/page', 'https://example.com' ) ).toBe(
				'https://example.com/page'
			);
		} );

		test( 'should remove URL fragments', () => {
			expect(
				normalize(
					'https://example.com/page#section',
					'https://example.com'
				)
			).toBe( 'https://example.com/page' );
		} );

		test( 'should remove trailing slash', () => {
			expect(
				normalize( 'https://example.com/page/', 'https://example.com' )
			).toBe( 'https://example.com/page' );
		} );

		test( 'should strip Playground scope', () => {
			expect(
				normalize(
					'https://playground.test/scope:abc/page',
					'https://playground.test'
				)
			).toBe( 'https://playground.test/page' );
		} );
	} );

	describe( 'escapeRegex()', () => {
		test( 'should escape special characters', () => {
			expect( escapeRegex( 'hello.world' ) ).toBe( 'hello\\.world' );
			expect( escapeRegex( 'test*pattern' ) ).toBe( 'test\\*pattern' );
		} );

		test( 'should escape all regex special chars', () => {
			expect( escapeRegex( '.*+?^${}()|[]\\' ) ).toBe(
				'\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\'
			);
		} );
	} );

	describe( 'extractHost()', () => {
		test( 'should extract host from URL', () => {
			expect( extractHost( 'https://example.com/path' ) ).toBe(
				'example.com'
			);
		} );

		test( 'should include port', () => {
			expect( extractHost( 'https://example.com:8080/path' ) ).toBe(
				'example.com:8080'
			);
		} );

		test( 'should return empty for invalid URL', () => {
			expect( extractHost( 'not-a-url' ) ).toBe( '' );
		} );
	} );

	describe( 'shouldSkipUrl()', () => {
		test( 'should skip anchors', () => {
			expect( shouldSkipUrl( '#section' ) ).toBe( true );
		} );

		test( 'should skip data URLs', () => {
			expect( shouldSkipUrl( 'data:image/png;base64,abc' ) ).toBe( true );
		} );

		test( 'should skip Cloudflare Images URLs', () => {
			expect( shouldSkipUrl( 'https://imagedelivery.net/abc/123' ) ).toBe(
				true
			);
		} );

		test( 'should not skip regular URLs', () => {
			expect( shouldSkipUrl( 'https://example.com/image.png' ) ).toBe(
				false
			);
		} );
	} );
} );
