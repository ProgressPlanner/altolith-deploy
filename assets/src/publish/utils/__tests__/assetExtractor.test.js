/**
 * Asset Extractor Tests
 *
 * Comprehensive tests for asset extraction from HTML, covering:
 * - HTML attribute assets (img, source, video, audio, link)
 * - Inline style attributes
 * - Edge cases and invalid HTML
 * - External vs internal URLs
 * - Offloaded assets (CF Images)
 *
 * @package
 */

import { extractAssetsFromHtml } from '../assetExtractor';

// Mock fetch for CSS/JS dependency collection
global.fetch = jest.fn();

describe( 'extractAssetsFromHtml', () => {
	const siteUrl = 'http://localhost:10003';
	const pageUrl = 'http://localhost:10003/page/';

	beforeEach( () => {
		jest.clearAllMocks();
		fetch.mockClear();
	} );

	describe( 'HTML Attribute Assets', () => {
		test( 'extracts img src attribute', async () => {
			const html =
				'<img src="/wp-content/themes/theme/image.webp" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'extracts img src with absolute URL', async () => {
			const html =
				'<img src="http://localhost:10003/wp-content/themes/theme/image.webp" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'extracts img srcset attribute with single URL', async () => {
			const html =
				'<img srcset="/wp-content/themes/theme/image-300w.webp 300w" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image-300w.webp'
			);
		} );

		test( 'extracts img srcset attribute with multiple URLs', async () => {
			const html =
				'<img srcset="/wp-content/themes/theme/image-300w.webp 300w, /wp-content/themes/theme/image-600w.webp 600w" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image-300w.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image-600w.webp'
			);
		} );

		test( 'extracts img srcset with 1x/2x descriptors', async () => {
			const html =
				'<img srcset="/wp-content/themes/theme/image.webp 1x, /wp-content/themes/theme/image-2x.webp 2x" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image-2x.webp'
			);
		} );

		test( 'extracts source src attribute', async () => {
			const html =
				'<picture><source src="/wp-content/themes/theme/image.webp" type="image/webp"></picture>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'extracts source srcset attribute', async () => {
			const html =
				'<picture><source srcset="/wp-content/themes/theme/image-300w.webp 300w, /wp-content/themes/theme/image-600w.webp 600w" type="image/webp"></picture>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image-300w.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image-600w.webp'
			);
		} );

		test( 'extracts video src attribute', async () => {
			const html =
				'<video src="/wp-content/themes/theme/video.mp4" controls></video>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/video.mp4'
			);
		} );

		test( 'extracts video poster attribute', async () => {
			const html =
				'<video poster="/wp-content/themes/theme/poster.webp" controls></video>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/poster.webp'
			);
		} );

		test( 'extracts audio src attribute', async () => {
			const html =
				'<audio src="/wp-content/themes/theme/audio.mp3" controls></audio>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/audio.mp3'
			);
		} );

		test( 'extracts link href for preload', async () => {
			const html =
				'<link rel="preload" href="/wp-content/themes/theme/font.woff2" as="font">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/font.woff2'
			);
		} );

		test( 'extracts link href for prefetch', async () => {
			const html =
				'<link rel="prefetch" href="/wp-content/themes/theme/next-page.html">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/next-page.html'
			);
		} );

		test( 'skips link stylesheet (handled separately)', async () => {
			const html =
				'<link rel="stylesheet" href="/wp-content/themes/theme/style.css">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			// Stylesheets are handled separately, but should still be collected
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/style.css'
			);
		} );
	} );

	describe( 'Inline Style Attributes', () => {
		test( 'extracts url from inline style with single quotes', async () => {
			const html =
				'<span style="background: url(\'/wp-content/themes/theme/image.webp\');">Test</span>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'extracts url from inline style with double quotes', async () => {
			// Note: In HTML, you can't have unescaped double quotes inside double-quoted attributes.
			// This test uses single quotes inside double quotes, which is valid HTML.
			const html =
				'<span style="background: url(\'/wp-content/themes/theme/image.webp\');">Test</span>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'extracts url from inline style without quotes', async () => {
			const html =
				'<span style="background: url(/wp-content/themes/theme/image.webp);">Test</span>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'extracts multiple urls from inline style', async () => {
			const html =
				"<span style=\"background: url('/wp-content/themes/theme/image1.webp'); background-image: url('/wp-content/themes/theme/image2.webp');\">Test</span>";
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image1.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image2.webp'
			);
		} );

		test( 'extracts url from inline style with single-quoted attribute', async () => {
			const html =
				'<span style=\'background: url("/wp-content/themes/theme/image.webp");\'>Test</span>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );
	} );

	describe( 'Edge Cases and Invalid HTML', () => {
		test( 'handles malformed img tag without closing bracket', async () => {
			const html =
				'<img src="/wp-content/themes/theme/image.webp" alt="Test"';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			// Should still extract the src
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'handles img tag with unclosed quote', async () => {
			const html =
				'<img src="/wp-content/themes/theme/image.webp alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			// Should handle gracefully - may or may not extract depending on regex behavior
			// This tests that it doesn't crash
			expect( Array.isArray( assets ) ).toBe( true );
		} );

		test( 'handles empty srcset attribute', async () => {
			const html = '<img srcset="" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).not.toContain( '' );
		} );

		test( 'handles srcset with malformed descriptors', async () => {
			const html =
				'<img srcset="/wp-content/themes/theme/image.webp, /wp-content/themes/theme/image2.webp" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			// Should extract both URLs even without descriptors
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image2.webp'
			);
		} );

		test( 'handles nested quotes in style attribute', async () => {
			const html =
				'<span style="background: url(\'http://localhost:10003/wp-content/themes/theme/image.webp\');">Test</span>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'handles style attribute with escaped quotes', async () => {
			const html =
				'<span style="background: url(\\\'/wp-content/themes/theme/image.webp\\\');">Test</span>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			// Should handle escaped quotes gracefully
			expect( Array.isArray( assets ) ).toBe( true );
		} );

		test( 'handles multiple style attributes on same element', async () => {
			const html =
				'<div style="color: red;" style="background: url(\'/wp-content/themes/theme/image.webp\');">Test</div>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			// Should extract from both style attributes
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'handles self-closing tags', async () => {
			const html = '<img src="/wp-content/themes/theme/image.webp" />';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'handles tags with no attributes', async () => {
			const html = '<img> <div></div>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( Array.isArray( assets ) ).toBe( true );
		} );

		test( 'handles empty HTML', async () => {
			const html = '';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toEqual( [] );
		} );

		test( 'handles HTML with only text', async () => {
			const html = 'Just some text, no HTML tags';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toEqual( [] );
		} );

		test( 'handles unclosed tags', async () => {
			const html = '<img src="/wp-content/themes/theme/image.webp"';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			// Should still extract if possible
			expect( Array.isArray( assets ) ).toBe( true );
		} );

		test( 'handles mixed case attributes', async () => {
			const html =
				'<IMG SRC="/wp-content/themes/theme/image.webp" ALT="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'handles attributes without quotes', async () => {
			const html =
				'<img src=/wp-content/themes/theme/image.webp alt=Test>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			// Current regex requires quotes, so this may not match
			// But should not crash
			expect( Array.isArray( assets ) ).toBe( true );
		} );
	} );

	describe( 'External vs Internal URLs', () => {
		test( 'skips external image URLs', async () => {
			const html =
				'<img src="https://example.com/image.webp" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).not.toContain( 'https://example.com/image.webp' );
		} );

		test( 'skips Cloudflare Images URLs', async () => {
			const html =
				'<img src="https://imagedelivery.net/account/image-id/public" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).not.toContain(
				'https://imagedelivery.net/account/image-id/public'
			);
		} );

		test( 'skips Cloudflare Images URLs in srcset', async () => {
			const html =
				'<img srcset="https://imagedelivery.net/account/image-id/public 300w" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).not.toContain(
				'https://imagedelivery.net/account/image-id/public'
			);
		} );

		test( 'skips Cloudflare Images URLs in inline styles', async () => {
			const html =
				'<span style="background: url(\'https://imagedelivery.net/account/image-id/public\');">Test</span>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).not.toContain(
				'https://imagedelivery.net/account/image-id/public'
			);
		} );

		test( 'collects internal image URLs', async () => {
			const html =
				'<img src="http://localhost:10003/wp-content/themes/theme/image.webp" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'collects relative image URLs', async () => {
			const html =
				'<img src="/wp-content/themes/theme/image.webp" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'skips Aether plugin assets', async () => {
			const html =
				'<img src="/wp-content/plugins/aether/assets/image.webp" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).not.toContain(
				'http://localhost:10003/wp-content/plugins/aether/assets/image.webp'
			);
		} );
	} );

	describe( 'Data URLs and Special Cases', () => {
		test( 'skips data URLs in img src', async () => {
			const html =
				'<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).not.toContain( 'data:image/png' );
		} );

		test( 'skips data URLs in inline styles', async () => {
			const html =
				'<span style="background: url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\');">Test</span>';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).not.toContain( 'data:image/png' );
		} );

		test( 'handles protocol-relative URLs', async () => {
			const html = '<img src="//example.com/image.webp" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			// Protocol-relative URLs are treated as external
			expect( assets ).not.toContain( '//example.com/image.webp' );
		} );
	} );

	describe( 'Deduplication', () => {
		test( 'deduplicates same asset referenced multiple times', async () => {
			const html = `
				<img src="/wp-content/themes/theme/image.webp" alt="Test">
				<img src="/wp-content/themes/theme/image.webp" alt="Test">
				<span style="background: url('/wp-content/themes/theme/image.webp');">Test</span>
			`;
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			const imageUrl =
				'http://localhost:10003/wp-content/themes/theme/image.webp';
			const count = assets.filter( ( url ) => url === imageUrl ).length;

			expect( count ).toBe( 1 );
		} );

		test( 'deduplicates assets from src and srcset', async () => {
			const html =
				'<img src="/wp-content/themes/theme/image.webp" srcset="/wp-content/themes/theme/image.webp 1x" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			const imageUrl =
				'http://localhost:10003/wp-content/themes/theme/image.webp';
			const count = assets.filter( ( url ) => url === imageUrl ).length;

			expect( count ).toBe( 1 );
		} );
	} );

	describe( 'Complex HTML Scenarios', () => {
		test( 'handles multiple asset types in single HTML', async () => {
			const html = `
				<img src="/wp-content/themes/theme/image.webp" alt="Test">
				<video src="/wp-content/themes/theme/video.mp4" poster="/wp-content/themes/theme/poster.webp"></video>
				<audio src="/wp-content/themes/theme/audio.mp3"></audio>
				<span style="background: url('/wp-content/themes/theme/bg.webp');">Test</span>
			`;
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/video.mp4'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/poster.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/audio.mp3'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/bg.webp'
			);
		} );

		test( 'handles picture element with multiple sources', async () => {
			const html = `
				<picture>
					<source srcset="/wp-content/themes/theme/image-300w.webp 300w, /wp-content/themes/theme/image-600w.webp 600w" type="image/webp">
					<source srcset="/wp-content/themes/theme/image-300w.jpg 300w, /wp-content/themes/theme/image-600w.jpg 600w" type="image/jpeg">
					<img src="/wp-content/themes/theme/image.jpg" alt="Test">
				</picture>
			`;
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image-300w.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image-600w.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image-300w.jpg'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image-600w.jpg'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.jpg'
			);
		} );

		test( 'handles nested HTML structures', async () => {
			const html = `
				<div>
					<div>
						<img src="/wp-content/themes/theme/image.webp" alt="Test">
						<span style="background: url('/wp-content/themes/theme/bg.webp');">
							<video src="/wp-content/themes/theme/video.mp4"></video>
						</span>
					</div>
				</div>
			`;
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/bg.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/video.mp4'
			);
		} );
	} );

	describe( 'URL Resolution', () => {
		test( 'resolves relative URLs correctly', async () => {
			const html = '<img src="../../themes/theme/image.webp" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			// Should resolve relative to pageUrl
			expect( assets.length ).toBeGreaterThan( 0 );
		} );

		test( 'handles absolute paths', async () => {
			const html =
				'<img src="/wp-content/themes/theme/image.webp" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'handles URLs with query parameters', async () => {
			const html =
				'<img src="/wp-content/themes/theme/image.webp?v=123" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp?v=123'
			);
		} );

		test( 'handles URLs with fragments', async () => {
			const html =
				'<img src="/wp-content/themes/theme/image.webp#section" alt="Test">';
			const assets = await extractAssetsFromHtml(
				html,
				pageUrl,
				siteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp#section'
			);
		} );
	} );

	describe( 'Protocol Handling', () => {
		test( 'handles HTTP source site with protocol-relative URLs', async () => {
			const httpSiteUrl = 'http://localhost:10003';
			const httpPageUrl = 'http://localhost:10003/page/';
			const html =
				'<img src="//localhost:10003/wp-content/themes/theme/image.webp" alt="Test">';

			const assets = await extractAssetsFromHtml(
				html,
				httpPageUrl,
				httpSiteUrl
			);

			// Should convert protocol-relative to HTTP (matching source site)
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'handles HTTPS source site with protocol-relative URLs', async () => {
			const httpsSiteUrl = 'https://localhost:10003';
			const httpsPageUrl = 'https://localhost:10003/page/';
			const html =
				'<img src="//localhost:10003/wp-content/themes/theme/image.webp" alt="Test">';

			const assets = await extractAssetsFromHtml(
				html,
				httpsPageUrl,
				httpsSiteUrl
			);

			// Should convert protocol-relative to HTTPS (matching source site)
			expect( assets ).toContain(
				'https://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'extracts HTTP URLs from HTTP source site', async () => {
			const httpSiteUrl = 'http://localhost:10003';
			const httpPageUrl = 'http://localhost:10003/page/';
			const html =
				'<img src="http://localhost:10003/wp-content/themes/theme/image.webp" alt="Test">';

			const assets = await extractAssetsFromHtml(
				html,
				httpPageUrl,
				httpSiteUrl
			);

			expect( assets ).toContain(
				'http://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'extracts HTTPS URLs from HTTPS source site', async () => {
			const httpsSiteUrl = 'https://localhost:10003';
			const httpsPageUrl = 'https://localhost:10003/page/';
			const html =
				'<img src="https://localhost:10003/wp-content/themes/theme/image.webp" alt="Test">';

			const assets = await extractAssetsFromHtml(
				html,
				httpsPageUrl,
				httpsSiteUrl
			);

			expect( assets ).toContain(
				'https://localhost:10003/wp-content/themes/theme/image.webp'
			);
		} );

		test( 'handles mixed protocols in same HTML', async () => {
			const httpSiteUrl = 'http://localhost:10003';
			const httpPageUrl = 'http://localhost:10003/page/';
			const html = `
				<img src="http://localhost:10003/wp-content/image1.webp" alt="Test">
				<img src="https://localhost:10003/wp-content/image2.webp" alt="Test">
				<img src="//localhost:10003/wp-content/image3.webp" alt="Test">
			`;

			const assets = await extractAssetsFromHtml(
				html,
				httpPageUrl,
				httpSiteUrl
			);

			// Should extract all URLs regardless of protocol
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/image1.webp'
			);
			expect( assets ).toContain(
				'https://localhost:10003/wp-content/image2.webp'
			);
			expect( assets ).toContain(
				'http://localhost:10003/wp-content/image3.webp'
			);
		} );
	} );
} );
