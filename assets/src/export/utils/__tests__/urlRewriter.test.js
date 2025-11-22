/**
 * URL Rewriter Tests
 *
 * Tests for URL rewriting logic, covering:
 * - Protocol handling (HTTP → HTTPS)
 * - URL normalization
 * - Static site URL rewriting
 * - Protocol-agnostic comparison
 *
 * @package
 */

import {
	createUrlRewriter,
	normalize,
	isExternal,
	forceHttps,
} from '../urlRewriter';

// Mock @wordpress/hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );

describe( 'normalize', () => {
	test( 'preserves HTTP protocol for internal URLs', () => {
		const siteUrl = 'http://localhost:10003';
		const url = 'http://localhost:10003/page/';
		const normalized = normalize( url, siteUrl );

		// Should NOT force HTTPS - preserve original protocol
		expect( normalized ).toBe( 'http://localhost:10003/page' );
	} );

	test( 'preserves HTTPS protocol for internal URLs', () => {
		const siteUrl = 'https://example.com';
		const url = 'https://example.com/page/';
		const normalized = normalize( url, siteUrl );

		expect( normalized ).toBe( 'https://example.com/page' );
	} );

	test( 'removes trailing slashes', () => {
		const siteUrl = 'http://localhost:10003';
		const url = 'http://localhost:10003/page/';
		const normalized = normalize( url, siteUrl );

		expect( normalized ).toBe( 'http://localhost:10003/page' );
	} );

	test( 'removes URL fragments', () => {
		const siteUrl = 'http://localhost:10003';
		const url = 'http://localhost:10003/page/#section';
		const normalized = normalize( url, siteUrl );

		expect( normalized ).toBe( 'http://localhost:10003/page' );
	} );

	test( 'handles relative URLs', () => {
		const siteUrl = 'http://localhost:10003';
		const url = '/page/';
		const normalized = normalize( url, siteUrl );

		expect( normalized ).toBe( 'http://localhost:10003/page' );
	} );
} );

describe( 'isExternal', () => {
	test( 'identifies internal HTTP URLs', () => {
		const siteUrl = 'http://localhost:10003';
		const url = 'http://localhost:10003/page/';

		expect( isExternal( url, siteUrl ) ).toBe( false );
	} );

	test( 'identifies internal HTTPS URLs', () => {
		const siteUrl = 'https://example.com';
		const url = 'https://example.com/page/';

		expect( isExternal( url, siteUrl ) ).toBe( false );
	} );

	test( 'identifies external URLs', () => {
		const siteUrl = 'http://localhost:10003';
		const url = 'https://example.com/page/';

		expect( isExternal( url, siteUrl ) ).toBe( true );
	} );

	test( 'treats relative URLs as internal', () => {
		const siteUrl = 'http://localhost:10003';
		const url = '/page/';

		expect( isExternal( url, siteUrl ) ).toBe( false );
	} );

	test( 'treats protocol-relative URLs as internal if same host', () => {
		const siteUrl = 'http://localhost:10003';
		const url = '//localhost:10003/page/';

		expect( isExternal( url, siteUrl ) ).toBe( false );
	} );

	test( 'treats protocol-relative URLs as external if different host', () => {
		const siteUrl = 'http://localhost:10003';
		const url = '//example.com/page/';

		expect( isExternal( url, siteUrl ) ).toBe( true );
	} );
} );

describe( 'forceHttps', () => {
	test( 'converts HTTP to HTTPS', () => {
		const url = 'http://example.com/page/';
		const httpsUrl = forceHttps( url );

		expect( httpsUrl ).toBe( 'https://example.com/page/' );
	} );

	test( 'preserves HTTPS URLs', () => {
		const url = 'https://example.com/page/';
		const httpsUrl = forceHttps( url );

		expect( httpsUrl ).toBe( 'https://example.com/page/' );
	} );

	test( 'preserves protocol-relative URLs', () => {
		const url = '//example.com/page/';
		const result = forceHttps( url );

		expect( result ).toBe( '//example.com/page/' );
	} );

	test( 'preserves data URLs', () => {
		const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAA=';
		const result = forceHttps( url );

		expect( result ).toBe( url );
	} );
} );

describe( 'createUrlRewriter', () => {
	describe( 'HTTP source → HTTPS static site (worker endpoint)', () => {
		test( 'rewrites HTTP URLs to HTTPS worker endpoint', () => {
			const siteUrl = 'http://localhost:10003';
			// Worker endpoints don't get /static/ prefix
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const originalUrl = 'http://localhost:10003/page/';
			const rewritten = rewriter.rewriteUrl( originalUrl );

			// Should rewrite to HTTPS static site URL (no /static/ prefix for workers)
			expect( rewritten ).toBe( 'https://example.workers.dev/page/' );
		} );

		test( 'rewrites relative URLs to HTTPS worker endpoint', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const originalUrl = '/page/';
			const rewritten = rewriter.rewriteUrl(
				originalUrl,
				'http://localhost:10003/'
			);

			expect( rewritten ).toBe( 'https://example.workers.dev/page/' );
		} );

		test( 'rewrites asset URLs to HTTPS worker endpoint', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const originalUrl =
				'http://localhost:10003/wp-content/themes/style.css';
			const rewritten = rewriter.rewriteUrl( originalUrl );

			expect( rewritten ).toBe(
				'https://example.workers.dev/wp-content/themes/style.css'
			);
		} );
	} );

	describe( 'HTTPS source → HTTPS static site (worker)', () => {
		test( 'rewrites HTTPS URLs to HTTPS worker endpoint', () => {
			const siteUrl = 'https://staging.example.com';
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const originalUrl = 'https://staging.example.com/page/';
			const rewritten = rewriter.rewriteUrl( originalUrl );

			expect( rewritten ).toBe( 'https://example.workers.dev/page/' );
		} );
	} );

	describe( 'HTML rewriting', () => {
		test( 'rewrites HTTP URLs in HTML to HTTPS', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const html = '<a href="http://localhost:10003/page/">Link</a>';
			const rewritten = rewriter.rewriteHtml(
				html,
				'http://localhost:10003/'
			);

			expect( rewritten ).toContain(
				'https://example.workers.dev/page/'
			);
		} );

		test( 'rewrites mixed protocol URLs in HTML', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const html = `
				<a href="http://localhost:10003/page1/">Link1</a>
				<a href="https://localhost:10003/page2/">Link2</a>
			`;
			const rewritten = rewriter.rewriteHtml(
				html,
				'http://localhost:10003/'
			);

			expect( rewritten ).toContain(
				'https://example.workers.dev/page1/'
			);
			expect( rewritten ).toContain(
				'https://example.workers.dev/page2/'
			);
		} );

		test( 'does not rewrite external URLs', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const html =
				'<a href="https://external.com/page/">External Link</a>';
			const rewritten = rewriter.rewriteHtml(
				html,
				'http://localhost:10003/'
			);

			expect( rewritten ).toContain( 'https://external.com/page/' );
		} );

		test( 'rewrites asset URLs in HTML attributes', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const html =
				'<img src="http://localhost:10003/wp-content/image.jpg" alt="Test">';
			const rewritten = rewriter.rewriteHtml(
				html,
				'http://localhost:10003/'
			);

			expect( rewritten ).toContain(
				'https://example.workers.dev/wp-content/image.jpg'
			);
		} );

		test( 'handles multiple URLs without corruption', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const html = `
				<a href="http://localhost:10003/feed/">Feed</a>
				<a href="http://localhost:10003/nora/">Nora</a>
				<a href="http://localhost:10003/sample-page/">Sample</a>
			`;
			const rewritten = rewriter.rewriteHtml(
				html,
				'http://localhost:10003/'
			);

			// Verify no URL corruption (no path duplication)
			expect( rewritten ).toContain(
				'https://example.workers.dev/feed/'
			);
			expect( rewritten ).not.toContain( '/feed/tic/feed/' );
			expect( rewritten ).not.toContain( '/feed/feed/' );

			expect( rewritten ).toContain(
				'https://example.workers.dev/nora/'
			);
			expect( rewritten ).not.toContain( '/nora/tic/nora/' );
			expect( rewritten ).not.toContain( '/nora/nora/' );

			expect( rewritten ).toContain(
				'https://example.workers.dev/sample-page/'
			);
			expect( rewritten ).not.toContain( '/sample-page/ple-page/' );
			expect( rewritten ).not.toContain( '/sample-page/sample-page/' );
		} );

		test( 'handles URLs of different lengths', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			// URLs with very different lengths to test offset handling
			const html = `
				<a href="http://localhost:10003/a/">Short</a>
				<a href="http://localhost:10003/very-long-page-name-here/">Long</a>
				<a href="http://localhost:10003/b/">Short2</a>
			`;
			const rewritten = rewriter.rewriteHtml(
				html,
				'http://localhost:10003/'
			);

			// All URLs should be correctly replaced without corruption
			expect( rewritten ).toContain( 'https://example.workers.dev/a/' );
			expect( rewritten ).toContain(
				'https://example.workers.dev/very-long-page-name-here/'
			);
			expect( rewritten ).toContain( 'https://example.workers.dev/b/' );

			// No partial URL corruption
			expect( rewritten ).not.toMatch( /localhost/ );
		} );
	} );

	describe( 'Protocol-relative URLs (deprecated)', () => {
		test( 'outputs HTTPS URLs, not protocol-relative', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.workers.dev';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const originalUrl = 'http://localhost:10003/page/';
			const rewritten = rewriter.rewriteUrl( originalUrl );

			// Should use explicit HTTPS, not protocol-relative
			expect( rewritten ).toBe( 'https://example.workers.dev/page/' );
			expect( rewritten ).not.toMatch( /^\/\// ); // Don't start with //
		} );
	} );

	describe( 'No localhost in output', () => {
		test( 'never outputs localhost URLs when static URL configured', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.com';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const urls = [
				'http://localhost:10003/page/',
				'https://localhost:10003/page/',
				'/page/',
				'http://localhost:10003/wp-content/style.css',
			];

			urls.forEach( ( url ) => {
				const rewritten = rewriter.rewriteUrl(
					url,
					'http://localhost:10003/'
				);
				// With proper logic, should never output localhost
				expect( rewritten ).not.toContain( 'localhost' );
			} );
		} );
	} );

	describe( 'Edge cases', () => {
		test( 'skips CF Images URLs', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.com';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const cfImageUrl =
				'https://imagedelivery.net/account/image-id/public';
			const rewritten = rewriter.rewriteUrl( cfImageUrl );

			// Should not rewrite CF Images URLs
			expect( rewritten ).toBe( cfImageUrl );
		} );

		test( 'skips anchor links', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.com';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const anchor = '#section';
			const rewritten = rewriter.rewriteUrl( anchor );

			expect( rewritten ).toBe( '#section' );
		} );

		test( 'skips data URLs', () => {
			const siteUrl = 'http://localhost:10003';
			const staticUrl = 'https://example.com';
			const rewriter = createUrlRewriter( siteUrl, staticUrl );

			const dataUrl =
				'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAA=';
			const rewritten = rewriter.rewriteUrl( dataUrl );

			expect( rewritten ).toBe( dataUrl );
		} );
	} );
} );
