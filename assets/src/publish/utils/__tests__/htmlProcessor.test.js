/**
 * HTML Processor Tests
 *
 * Tests for HTML processing utilities used in static site generation.
 * These are pure functions that transform HTML without side effects.
 *
 * @package
 */

import { processHtml, getStaticFilePath } from '../htmlProcessor';

// Mock urlRewriter module
jest.mock( '../urlRewriter', () => ( {
	createUrlRewriter: jest.fn( () => ( {
		rewriteHtml: jest.fn( ( html ) => html ), // Pass through by default
	} ) ),
	stripPlaygroundScope: jest.fn( ( path ) => path.replace( /^scope:[^/]+\//, '' ) ),
} ) );

describe( 'htmlProcessor', () => {
	describe( 'processHtml()', () => {
		describe( 'Admin Bar Removal', () => {
			test( 'should remove admin bar CSS link', () => {
				const html = `
					<html>
						<head>
							<link rel="stylesheet" id="admin-bar-css" href="/wp-includes/css/admin-bar.css" />
						</head>
						<body></body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).not.toContain( 'admin-bar-css' );
				expect( result ).not.toContain( 'admin-bar.css' );
			} );

			test( 'should remove dashicons CSS link', () => {
				const html = `
					<html>
						<head>
							<link rel="stylesheet" id="dashicons-css" href="/wp-includes/css/dashicons.css" />
						</head>
						<body></body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).not.toContain( 'dashicons-css' );
				expect( result ).not.toContain( 'dashicons.css' );
			} );

			test( 'should remove wpadminbar div', () => {
				const html = `
					<html>
						<body>
							<div id="wpadminbar">Admin bar content</div>
							<div class="content">Main content</div>
						</body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).not.toContain( 'id="wpadminbar"' );
				expect( result ).not.toContain( 'Admin bar content' );
				expect( result ).toContain( 'Main content' );
			} );

			test( 'should remove admin bar inline styles', () => {
				const html = `
					<html>
						<head>
							<style id="admin-bar-inline-css">
								#wpadminbar { height: 32px; }
							</style>
						</head>
						<body></body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).not.toContain( 'admin-bar-inline-css' );
				expect( result ).not.toContain( '#wpadminbar' );
			} );

			test( 'should remove admin bar scripts', () => {
				const html = `
					<html>
						<head>
							<script id="admin-bar-js" src="/wp-includes/js/admin-bar.js"></script>
						</head>
						<body></body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).not.toContain( 'admin-bar-js' );
				expect( result ).not.toContain( 'admin-bar.js' );
			} );

			test( 'should remove logged-in class from body', () => {
				const html = `
					<html>
						<body class="logged-in home page">
							Content
						</body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).not.toContain( 'logged-in' );
				expect( result ).toContain( 'class="' );
				expect( result ).toContain( 'home' );
				expect( result ).toContain( 'page' );
			} );

			test( 'should remove admin-bar class from body', () => {
				const html = `
					<html>
						<body class="admin-bar home page">
							Content
						</body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				// Check that "admin-bar" class was removed (as standalone class, not part of "no-admin-bar")
				// The class should NOT appear immediately after whitespace or quote
				expect( result ).not.toMatch( /class="[^"]*(\s|")admin-bar(\s|")/ );
				expect( result ).toContain( 'home' );
				expect( result ).toContain( 'page' );
			} );

			test( 'should add no-admin-bar class to body', () => {
				const html = `
					<html>
						<body class="home page">
							Content
						</body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).toContain( 'no-admin-bar' );
			} );

			test( 'should not duplicate no-admin-bar class if already present', () => {
				const html = `
					<html>
						<body class="no-admin-bar home page">
							Content
						</body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				const matches = result.match( /no-admin-bar/g );
				expect( matches ).toHaveLength( 1 );
			} );

			test( 'should perform aggressive cleanup if wp-admin-bar classes remain', () => {
				const html = `
					<html>
						<body>
							<div id="some-admin-bar-element" class="wp-admin-bar-user"></div>
							<div class="wp-site-blocks">Main content</div>
						</body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).not.toContain( 'wp-admin-bar-user' );
				expect( result ).toContain( 'wp-site-blocks' );
			} );
		} );

		describe( 'Dynamic WordPress Links Removal', () => {
			test( 'should remove comments feed link', () => {
				const html = `
					<html>
						<head>
							<link rel="alternate" type="application/rss+xml" title="Comments Feed" href="http://example.com/comments/feed/" />
						</head>
						<body></body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).not.toContain( 'comments/feed' );
			} );

			test( 'should remove REST API discovery link', () => {
				const html = `
					<html>
						<head>
							<link rel="https://api.w.org/" href="http://example.com/wp-json/" />
						</head>
						<body></body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).not.toContain( 'api.w.org' );
			} );

			test( 'should remove XML-RPC/RSD discovery link', () => {
				const html = `
					<html>
						<head>
							<link rel="EditURI" type="application/rsd+xml" title="RSD" href="http://example.com/xmlrpc.php" />
						</head>
						<body></body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				expect( result ).not.toContain( 'EditURI' );
				expect( result ).not.toContain( 'rsd+xml' );
			} );

			test( 'should preserve main RSS feed link', () => {
				const html = `
					<html>
						<head>
							<link rel="alternate" type="application/rss+xml" title="Main Feed" href="http://example.com/feed/" />
						</head>
						<body></body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				// Main feed should be preserved (only comments/feed is removed)
				expect( result ).toContain( 'feed/' );
			} );
		} );

		describe( 'URL Rewriting Integration', () => {
			test( 'should call URL rewriter with correct parameters', () => {
				const { createUrlRewriter } = require( '../urlRewriter' );
				const mockRewriter = {
					rewriteHtml: jest.fn( ( html ) => html ),
				};
				createUrlRewriter.mockReturnValue( mockRewriter );

				const html = '<html><body>Content</body></html>';
				const url = 'http://example.com/page';
				const siteUrl = 'http://example.com';
				const staticSiteUrl = 'http://static.example.com';

				processHtml( html, url, siteUrl, staticSiteUrl );

				expect( createUrlRewriter ).toHaveBeenCalledWith(
					siteUrl,
					staticSiteUrl
				);
				expect( mockRewriter.rewriteHtml ).toHaveBeenCalledWith(
					expect.any( String ),
					url
				);
			} );

			test( 'should pass null staticSiteUrl to URL rewriter when not provided', () => {
				const { createUrlRewriter } = require( '../urlRewriter' );
				const mockRewriter = {
					rewriteHtml: jest.fn( ( html ) => html ),
				};
				createUrlRewriter.mockReturnValue( mockRewriter );

				const html = '<html><body>Content</body></html>';

				processHtml( html, 'http://example.com/page', 'http://example.com' );

				expect( createUrlRewriter ).toHaveBeenCalledWith(
					'http://example.com',
					null
				);
			} );
		} );

		describe( 'Complete HTML Processing', () => {
			test( 'should process complex real-world HTML', () => {
				const html = `
					<!DOCTYPE html>
					<html>
						<head>
							<link rel="stylesheet" id="admin-bar-css" href="/wp-includes/css/admin-bar.css" />
							<link rel="stylesheet" id="dashicons-css" href="/wp-includes/css/dashicons.css" />
							<link rel="alternate" type="application/rss+xml" href="http://example.com/comments/feed/" />
							<link rel="https://api.w.org/" href="http://example.com/wp-json/" />
							<style id="admin-bar-inline-css">#wpadminbar { height: 32px; }</style>
						</head>
						<body class="logged-in admin-bar home">
							<div id="wpadminbar">Admin bar</div>
							<div class="wp-site-blocks">
								<h1>Welcome</h1>
							</div>
						</body>
					</html>
				`;

				const result = processHtml( html, 'http://example.com', 'http://example.com' );

				// Admin bar removed
				expect( result ).not.toContain( 'admin-bar-css' );
				expect( result ).not.toContain( 'dashicons-css' );
				expect( result ).not.toContain( 'wpadminbar' );

				// Dynamic links removed
				expect( result ).not.toContain( 'comments/feed' );
				expect( result ).not.toContain( 'api.w.org' );

				// Body classes updated
				expect( result ).not.toContain( 'logged-in' );
				// Verify "admin-bar" class removed (match as standalone class with space/quote boundaries)
				expect( result ).not.toMatch( /class="[^"]*(\s|^)admin-bar(\s|")/);
				expect( result ).toContain( 'no-admin-bar' );

				// Content preserved
				expect( result ).toContain( 'Welcome' );
				expect( result ).toContain( 'wp-site-blocks' );
			} );
		} );
	} );

	describe( 'getStaticFilePath()', () => {
		describe( 'Basic Path Conversion', () => {
			test( 'should convert root URL to index.html', () => {
				expect( getStaticFilePath( 'http://example.com/' ) ).toBe(
					'index.html'
				);
				expect( getStaticFilePath( 'http://example.com' ) ).toBe(
					'index.html'
				);
			} );

			test( 'should convert page URL to directory with index.html', () => {
				expect( getStaticFilePath( 'http://example.com/about' ) ).toBe(
					'about/index.html'
				);
				expect( getStaticFilePath( 'http://example.com/about/' ) ).toBe(
					'about/index.html'
				);
			} );

			test( 'should convert nested page URL to nested directory', () => {
				expect(
					getStaticFilePath( 'http://example.com/blog/post-title' )
				).toBe( 'blog/post-title/index.html' );
				expect(
					getStaticFilePath( 'http://example.com/blog/post-title/' )
				).toBe( 'blog/post-title/index.html' );
			} );

			test( 'should handle deep nested paths', () => {
				expect(
					getStaticFilePath(
						'http://example.com/section/category/subcategory/page'
					)
				).toBe( 'section/category/subcategory/page/index.html' );
			} );
		} );

		describe( 'WordPress Playground Support', () => {
			test( 'should strip Playground scope from path', () => {
				const { stripPlaygroundScope } = require( '../urlRewriter' );
				stripPlaygroundScope.mockImplementation( ( path ) =>
					path.replace( /^scope:[^/]+\//, '' )
				);

				expect(
					getStaticFilePath(
						'http://example.com/scope:12345/about'
					)
				).toBe( 'about/index.html' );
			} );

			test( 'should handle Playground scope at root', () => {
				const { stripPlaygroundScope } = require( '../urlRewriter' );
				stripPlaygroundScope.mockImplementation( ( path ) =>
					path.replace( /^scope:[^/]+\//, '' )
				);

				expect(
					getStaticFilePath( 'http://example.com/scope:12345/' )
				).toBe( 'index.html' );
			} );
		} );

		describe( 'Edge Cases', () => {
			test( 'should handle URLs with multiple slashes', () => {
				expect( getStaticFilePath( 'http://example.com///about///' ) ).toBe(
					'about/index.html'
				);
			} );

			test( 'should handle URLs with query parameters (ignore them)', () => {
				expect(
					getStaticFilePath( 'http://example.com/about?param=value' )
				).toBe( 'about/index.html' );
			} );

			test( 'should handle URLs with hash fragments (ignore them)', () => {
				expect(
					getStaticFilePath( 'http://example.com/about#section' )
				).toBe( 'about/index.html' );
			} );

			test( 'should handle malformed URLs gracefully', () => {
				// Should not throw
				expect( () => getStaticFilePath( 'not-a-url' ) ).not.toThrow();
			} );

			test( 'should handle URLs with special characters', () => {
				expect(
					getStaticFilePath( 'http://example.com/hello-world' )
				).toBe( 'hello-world/index.html' );
				expect(
					getStaticFilePath( 'http://example.com/hello_world' )
				).toBe( 'hello_world/index.html' );
			} );

			test( 'should handle empty pathname after URL parsing', () => {
				// URL with just domain should return index.html
				const result = getStaticFilePath( 'http://example.com' );
				expect( result ).toBe( 'index.html' );
			} );
		} );
	} );
} );
