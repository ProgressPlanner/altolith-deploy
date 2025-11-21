/**
 * HTML Rewriting Tests
 *
 * @package
 */

import {
	protectScriptContent,
	restoreScriptContent,
	collectSiteUrlMatches,
	replaceSiteUrlMatches,
	rewriteAbsolutePaths,
	rewriteSrcsetUrls,
	rewriteImportMaps,
} from '../htmlRewriting';

// Mock debug
jest.mock( '@aether/utils/debug', () => ( {
	debug: jest.fn(),
} ) );

describe( 'htmlRewriting', () => {
	describe( 'protectScriptContent()', () => {
		test( 'should protect inline script content', () => {
			const html = '<script>const x = 1;</script>';
			const { html: protectedHtml, placeholders } = protectScriptContent( html );

			expect( protectedHtml ).toContain( '___SCRIPT_CONTENT_0___' );
			expect( placeholders[ '___SCRIPT_CONTENT_0___' ] ).toBe( 'const x = 1;' );
		} );

		test( 'should handle multiple scripts', () => {
			const html = '<script>a();</script><script>b();</script>';
			const { html: protectedHtml, placeholders } = protectScriptContent( html );

			expect( protectedHtml ).toContain( '___SCRIPT_CONTENT_0___' );
			expect( protectedHtml ).toContain( '___SCRIPT_CONTENT_1___' );
			expect( Object.keys( placeholders ) ).toHaveLength( 2 );
		} );

		test( 'should not protect empty scripts', () => {
			const html = '<script src="app.js"></script>';
			const { html: protectedHtml, placeholders } = protectScriptContent( html );

			expect( protectedHtml ).toBe( html );
			expect( Object.keys( placeholders ) ).toHaveLength( 0 );
		} );

		test( 'should not protect importmap scripts', () => {
			const html = '<script type="importmap">{"imports":{}}</script>';
			const { html: protectedHtml, placeholders } = protectScriptContent( html );

			expect( protectedHtml ).toBe( html );
			expect( Object.keys( placeholders ) ).toHaveLength( 0 );
		} );

		test( 'should preserve script attributes', () => {
			const html = '<script type="text/javascript" defer>code();</script>';
			const { html: protectedHtml } = protectScriptContent( html );

			expect( protectedHtml ).toContain( 'type="text/javascript"' );
			expect( protectedHtml ).toContain( 'defer' );
		} );
	} );

	describe( 'restoreScriptContent()', () => {
		test( 'should restore placeholders', () => {
			const html = '<script>___SCRIPT_CONTENT_0___</script>';
			const placeholders = { '___SCRIPT_CONTENT_0___': 'restored()' };

			const result = restoreScriptContent( html, placeholders );

			expect( result ).toBe( '<script>restored()</script>' );
		} );

		test( 'should restore multiple placeholders', () => {
			const html = '___SCRIPT_CONTENT_0___ and ___SCRIPT_CONTENT_1___';
			const placeholders = {
				'___SCRIPT_CONTENT_0___': 'first',
				'___SCRIPT_CONTENT_1___': 'second',
			};

			const result = restoreScriptContent( html, placeholders );

			expect( result ).toBe( 'first and second' );
		} );

		test( 'should handle empty placeholders', () => {
			const html = '<p>Test</p>';
			const result = restoreScriptContent( html, {} );

			expect( result ).toBe( html );
		} );
	} );

	describe( 'collectSiteUrlMatches()', () => {
		test( 'should find http URLs', () => {
			const html = '<a href="http://example.com/page">Link</a>';
			const matches = collectSiteUrlMatches( html, 'example.com' );

			// Also finds //example.com as substring
			expect( matches.length ).toBeGreaterThanOrEqual( 1 );
			expect( matches[ 0 ].type ).toBe( 'http' );
			expect( matches[ 0 ].match ).toBe( 'http://example.com/page' );
		} );

		test( 'should find https URLs', () => {
			const html = '<img src="https://example.com/img.png">';
			const matches = collectSiteUrlMatches( html, 'example.com' );

			expect( matches.length ).toBeGreaterThanOrEqual( 1 );
			expect( matches[ 0 ].type ).toBe( 'https' );
		} );

		test( 'should find protocol-relative URLs', () => {
			const html = '<script src="//example.com/script.js"></script>';
			const matches = collectSiteUrlMatches( html, 'example.com' );

			expect( matches ).toHaveLength( 1 );
			expect( matches[ 0 ].type ).toBe( 'protocol-relative' );
		} );

		test( 'should find multiple distinct URLs', () => {
			// Using only protocol-relative to avoid overlap detection
			const html = '//example.com/a //example.com/b //example.com/c';
			const matches = collectSiteUrlMatches( html, 'example.com' );

			expect( matches ).toHaveLength( 3 );
		} );

		test( 'should sort by index', () => {
			const html = 'https://example.com/z http://example.com/a';
			const matches = collectSiteUrlMatches( html, 'example.com' );

			expect( matches[ 0 ].index ).toBeLessThan( matches[ 1 ].index );
		} );

		test( 'should not match different hosts', () => {
			const html = '<a href="https://other.com/page">Link</a>';
			const matches = collectSiteUrlMatches( html, 'example.com' );

			expect( matches ).toHaveLength( 0 );
		} );
	} );

	describe( 'replaceSiteUrlMatches()', () => {
		const mockRewrite = jest.fn( ( url ) => url.replace( 'https://example.com', '' ) );

		beforeEach( () => {
			mockRewrite.mockClear();
		} );

		test( 'should replace URLs with rewritten versions', () => {
			const html = '<a href="https://example.com/page">Link</a>';
			const matches = [
				{ index: 9, length: 24, match: 'https://example.com/page', type: 'https' },
			];

			const result = replaceSiteUrlMatches( html, matches, mockRewrite, '' );

			expect( result ).toBe( '<a href="/page">Link</a>' );
		} );

		test( 'should skip overlapping matches', () => {
			const matches = [
				{ index: 0, length: 10, match: 'first', type: 'https' },
				{ index: 5, length: 10, match: 'overlap', type: 'https' },
			];

			const result = replaceSiteUrlMatches( 'first-test', matches, mockRewrite, '' );

			// Second match should be skipped
			expect( mockRewrite ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should skip CF Images URLs', () => {
			const matches = [
				{ index: 0, length: 30, match: 'https://imagedelivery.net/abc', type: 'https' },
			];

			const result = replaceSiteUrlMatches( 'https://imagedelivery.net/abc', matches, mockRewrite, '' );

			expect( mockRewrite ).not.toHaveBeenCalled();
		} );

		test( 'should add https to protocol-relative URLs', () => {
			const matches = [
				{ index: 0, length: 15, match: '//example.com/a', type: 'protocol-relative' },
			];

			replaceSiteUrlMatches( '//example.com/a', matches, mockRewrite, '' );

			expect( mockRewrite ).toHaveBeenCalledWith( 'https://example.com/a', '' );
		} );
	} );

	describe( 'rewriteAbsolutePaths()', () => {
		test( 'should prepend base path to absolute paths', () => {
			const html = '<a href="/page">Link</a>';
			const result = rewriteAbsolutePaths( html, '/blog' );

			expect( result ).toBe( '<a href="/blog/page">Link</a>' );
		} );

		test( 'should handle multiple attributes', () => {
			const html = '<img src="/img.png"><a href="/link">Go</a>';
			const result = rewriteAbsolutePaths( html, '/base' );

			expect( result ).toContain( 'src="/base/img.png"' );
			expect( result ).toContain( 'href="/base/link"' );
		} );

		test( 'should skip if base path is empty', () => {
			const html = '<a href="/page">Link</a>';

			expect( rewriteAbsolutePaths( html, '' ) ).toBe( html );
			expect( rewriteAbsolutePaths( html, '/' ) ).toBe( html );
			expect( rewriteAbsolutePaths( html, null ) ).toBe( html );
		} );

		test( 'should skip paths already with base', () => {
			const html = '<a href="/blog/page">Link</a>';
			const result = rewriteAbsolutePaths( html, '/blog' );

			expect( result ).toBe( html );
		} );

		test( 'should skip root path', () => {
			const html = '<a href="/">Home</a>';
			const result = rewriteAbsolutePaths( html, '/blog' );

			expect( result ).toBe( html );
		} );

		test( 'should skip anchor paths', () => {
			const html = '<a href="/#section">Section</a>';
			const result = rewriteAbsolutePaths( html, '/blog' );

			expect( result ).toBe( html );
		} );

		test( 'should skip protocol-relative URLs', () => {
			const html = '<script src="//cdn.example.com/lib.js"></script>';
			const result = rewriteAbsolutePaths( html, '/blog' );

			expect( result ).toBe( html );
		} );
	} );

	describe( 'rewriteSrcsetUrls()', () => {
		const mockRewrite = jest.fn( ( url ) => url.replace( 'https://example.com', '' ) );

		beforeEach( () => {
			mockRewrite.mockClear();
		} );

		test( 'should rewrite srcset URLs', () => {
			const html = '<img srcset="https://example.com/small.jpg 300w, https://example.com/large.jpg 600w">';
			const result = rewriteSrcsetUrls( html, mockRewrite, '' );

			expect( result ).toContain( '/small.jpg 300w' );
			expect( result ).toContain( '/large.jpg 600w' );
		} );

		test( 'should handle srcset without descriptor', () => {
			const html = '<img srcset="https://example.com/img.jpg">';
			const result = rewriteSrcsetUrls( html, mockRewrite, '' );

			expect( result ).toContain( '/img.jpg' );
		} );

		test( 'should skip CF Images URLs in srcset', () => {
			const html = '<img srcset="https://imagedelivery.net/abc 1x">';
			const result = rewriteSrcsetUrls( html, mockRewrite, '' );

			expect( result ).toContain( 'imagedelivery.net' );
		} );

		test( 'should handle source elements', () => {
			const html = '<source srcset="https://example.com/video.webm">';
			const result = rewriteSrcsetUrls( html, mockRewrite, '' );

			expect( result ).toContain( '/video.webm' );
		} );
	} );

	describe( 'rewriteImportMaps()', () => {
		const mockRewrite = jest.fn( ( url ) => url.replace( 'https://example.com', '' ) );

		beforeEach( () => {
			mockRewrite.mockClear();
		} );

		test( 'should rewrite import map URLs', () => {
			const html = '<script type="importmap">{"imports":{"module":"https://example.com/mod.js"}}</script>';
			const result = rewriteImportMaps( html, mockRewrite, '' );

			expect( result ).toContain( '"/mod.js"' );
		} );

		test( 'should handle multiple imports', () => {
			const importmap = {
				imports: {
					a: 'https://example.com/a.js',
					b: 'https://example.com/b.js',
				},
			};
			const html = `<script type="importmap">${ JSON.stringify( importmap ) }</script>`;
			const result = rewriteImportMaps( html, mockRewrite, '' );

			expect( mockRewrite ).toHaveBeenCalledTimes( 2 );
		} );

		test( 'should handle invalid JSON', () => {
			const html = '<script type="importmap">not json</script>';
			const result = rewriteImportMaps( html, mockRewrite, '' );

			expect( result ).toBe( html );
		} );

		test( 'should handle empty imports', () => {
			const html = '<script type="importmap">{}</script>';
			const result = rewriteImportMaps( html, mockRewrite, '' );

			expect( result ).toBe( html );
		} );

		test( 'should preserve non-importmap scripts', () => {
			const html = '<script type="text/javascript">code();</script>';
			const result = rewriteImportMaps( html, mockRewrite, '' );

			expect( result ).toBe( html );
		} );
	} );
} );
