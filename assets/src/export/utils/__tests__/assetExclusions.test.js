/**
 * Asset Exclusions Tests
 *
 * Tests for asset exclusion configuration and utility functions.
 * These pure functions determine what assets to include/exclude during static site generation.
 *
 */

import {
	SKIP_EXTENSIONS,
	ESSENTIAL_EXTENSIONS,
	WEBPACK_MODULE_IDS,
	EXCLUDED_URL_PATTERNS,
	EXCLUDED_URL_REGEX_PATTERNS,
	isExcludedUrl,
	isSkippedExtension,
	isEssentialExtension,
	isWebpackModuleId,
} from '../assetExclusions';

describe( 'assetExclusions', () => {
	describe( 'Constants', () => {
		test( 'SKIP_EXTENSIONS should contain image formats', () => {
			expect( SKIP_EXTENSIONS ).toContain( 'jpg' );
			expect( SKIP_EXTENSIONS ).toContain( 'png' );
			expect( SKIP_EXTENSIONS ).toContain( 'gif' );
			expect( SKIP_EXTENSIONS ).toContain( 'webp' );
			expect( SKIP_EXTENSIONS ).toContain( 'svg' );
		} );

		test( 'ESSENTIAL_EXTENSIONS should contain critical assets', () => {
			expect( ESSENTIAL_EXTENSIONS ).toContain( 'css' );
			expect( ESSENTIAL_EXTENSIONS ).toContain( 'js' );
			expect( ESSENTIAL_EXTENSIONS ).toContain( 'woff' );
			expect( ESSENTIAL_EXTENSIONS ).toContain( 'woff2' );
		} );

		test( 'WEBPACK_MODULE_IDS should contain known webpack modules', () => {
			expect( WEBPACK_MODULE_IDS ).toContain( 'react' );
			expect( WEBPACK_MODULE_IDS ).toContain( 'react-dom' );
		} );

		test( 'EXCLUDED_URL_PATTERNS should contain WordPress internals', () => {
			expect( EXCLUDED_URL_PATTERNS ).toContain( '/wp-json/' );
			expect( EXCLUDED_URL_PATTERNS ).toContain( '/xmlrpc.php' );
		} );

		test( 'EXCLUDED_URL_REGEX_PATTERNS should contain wp-admin pattern', () => {
			expect( EXCLUDED_URL_REGEX_PATTERNS ).toHaveLength( 1 );
			expect( EXCLUDED_URL_REGEX_PATTERNS[ 0 ] ).toBeInstanceOf( RegExp );
		} );
	} );

	describe( 'isExcludedUrl()', () => {
		describe( 'WordPress Internal URLs', () => {
			test( 'should exclude wp-json REST API URLs', () => {
				expect(
					isExcludedUrl( 'http://example.com/wp-json/wp/v2/posts' )
				).toBe( true );
				expect(
					isExcludedUrl(
						'https://example.com/wp-json/custom/endpoint'
					)
				).toBe( true );
			} );

			test( 'should exclude xmlrpc.php', () => {
				expect( isExcludedUrl( 'http://example.com/xmlrpc.php' ) ).toBe(
					true
				);
			} );

			test( 'should exclude wp-admin PHP files', () => {
				expect(
					isExcludedUrl( 'http://example.com/wp-admin/admin.php' )
				).toBe( true );
				expect(
					isExcludedUrl( 'http://example.com/wp-admin/edit.php' )
				).toBe( true );
				expect(
					isExcludedUrl(
						'http://example.com/wp-admin/includes/plugin.php'
					)
				).toBe( true );
			} );

			test( 'should NOT exclude wp-admin CSS/JS assets', () => {
				// Only .php files in wp-admin should be excluded
				expect(
					isExcludedUrl( 'http://example.com/wp-admin/css/admin.css' )
				).toBe( false );
				expect(
					isExcludedUrl( 'http://example.com/wp-admin/js/admin.js' )
				).toBe( false );
			} );
		} );

		describe( 'External CDN URLs', () => {
			test( 'should exclude imagedelivery.net CDN', () => {
				expect(
					isExcludedUrl(
						'https://imagedelivery.net/abc123/image.jpg'
					)
				).toBe( true );
			} );
		} );

		describe( 'Regular URLs', () => {
			test( 'should NOT exclude regular page URLs', () => {
				expect( isExcludedUrl( 'http://example.com/' ) ).toBe( false );
				expect( isExcludedUrl( 'http://example.com/about' ) ).toBe(
					false
				);
				expect( isExcludedUrl( 'http://example.com/blog/post' ) ).toBe(
					false
				);
			} );

			test( 'should NOT exclude theme assets', () => {
				expect(
					isExcludedUrl(
						'http://example.com/wp-content/themes/my-theme/style.css'
					)
				).toBe( false );
				expect(
					isExcludedUrl(
						'http://example.com/wp-content/themes/my-theme/script.js'
					)
				).toBe( false );
			} );

			test( 'should NOT exclude plugin assets', () => {
				expect(
					isExcludedUrl(
						'http://example.com/wp-content/plugins/my-plugin/style.css'
					)
				).toBe( false );
			} );

			test( 'should NOT exclude upload assets', () => {
				expect(
					isExcludedUrl(
						'http://example.com/wp-content/uploads/2024/01/image.jpg'
					)
				).toBe( false );
			} );
		} );

		describe( 'Edge Cases', () => {
			test( 'should handle URLs with query strings', () => {
				expect(
					isExcludedUrl(
						'http://example.com/wp-json/endpoint?param=value'
					)
				).toBe( true );
			} );

			test( 'should handle URLs with fragments', () => {
				expect(
					isExcludedUrl(
						'http://example.com/wp-json/endpoint#section'
					)
				).toBe( true );
			} );

			test( 'should handle malformed URLs gracefully', () => {
				// Should not throw
				expect( () =>
					isExcludedUrl( 'not-a-valid-url' )
				).not.toThrow();
			} );

			test( 'should handle relative URLs', () => {
				expect( isExcludedUrl( '/wp-json/endpoint' ) ).toBe( true );
				expect( isExcludedUrl( '/xmlrpc.php' ) ).toBe( true );
			} );

			test( 'should handle URLs with ports', () => {
				expect(
					isExcludedUrl( 'http://example.com:8080/wp-json/endpoint' )
				).toBe( true );
			} );

			test( 'should be case-sensitive for pattern matching', () => {
				// Pattern is '/wp-json/', URL has '/WP-JSON/' - should NOT match
				expect(
					isExcludedUrl( 'http://example.com/WP-JSON/endpoint' )
				).toBe( false );
			} );
		} );
	} );

	describe( 'isSkippedExtension()', () => {
		test( 'should return true for image extensions', () => {
			expect( isSkippedExtension( 'jpg' ) ).toBe( true );
			expect( isSkippedExtension( 'jpeg' ) ).toBe( true );
			expect( isSkippedExtension( 'png' ) ).toBe( true );
			expect( isSkippedExtension( 'gif' ) ).toBe( true );
			expect( isSkippedExtension( 'webp' ) ).toBe( true );
			expect( isSkippedExtension( 'svg' ) ).toBe( true );
			expect( isSkippedExtension( 'ico' ) ).toBe( true );
		} );

		test( 'should return false for non-image extensions', () => {
			expect( isSkippedExtension( 'css' ) ).toBe( false );
			expect( isSkippedExtension( 'js' ) ).toBe( false );
			expect( isSkippedExtension( 'html' ) ).toBe( false );
			expect( isSkippedExtension( 'woff' ) ).toBe( false );
		} );

		test( 'should be case-insensitive', () => {
			expect( isSkippedExtension( 'JPG' ) ).toBe( true );
			expect( isSkippedExtension( 'PNG' ) ).toBe( true );
			expect( isSkippedExtension( 'GIF' ) ).toBe( true );
		} );

		test( 'should handle empty string', () => {
			expect( isSkippedExtension( '' ) ).toBe( false );
		} );
	} );

	describe( 'isEssentialExtension()', () => {
		test( 'should return true for CSS files', () => {
			expect( isEssentialExtension( 'css' ) ).toBe( true );
		} );

		test( 'should return true for JavaScript files', () => {
			expect( isEssentialExtension( 'js' ) ).toBe( true );
		} );

		test( 'should return true for font files', () => {
			expect( isEssentialExtension( 'woff' ) ).toBe( true );
			expect( isEssentialExtension( 'woff2' ) ).toBe( true );
			expect( isEssentialExtension( 'ttf' ) ).toBe( true );
			expect( isEssentialExtension( 'eot' ) ).toBe( true );
			expect( isEssentialExtension( 'otf' ) ).toBe( true );
		} );

		test( 'should return false for non-essential extensions', () => {
			expect( isEssentialExtension( 'jpg' ) ).toBe( false );
			expect( isEssentialExtension( 'png' ) ).toBe( false );
			expect( isEssentialExtension( 'html' ) ).toBe( false );
		} );

		test( 'should be case-insensitive', () => {
			expect( isEssentialExtension( 'CSS' ) ).toBe( true );
			expect( isEssentialExtension( 'JS' ) ).toBe( true );
			expect( isEssentialExtension( 'WOFF' ) ).toBe( true );
		} );

		test( 'should handle empty string', () => {
			expect( isEssentialExtension( '' ) ).toBe( false );
		} );
	} );

	describe( 'isWebpackModuleId()', () => {
		test( 'should return true for known webpack modules', () => {
			expect( isWebpackModuleId( 'react' ) ).toBe( true );
			expect( isWebpackModuleId( 'react-dom' ) ).toBe( true );
			expect( isWebpackModuleId( 'react-jsx-runtime' ) ).toBe( true );
			expect( isWebpackModuleId( 'is-prop-valid' ) ).toBe( true );
		} );

		test( 'should return false for unknown modules', () => {
			expect( isWebpackModuleId( 'my-module' ) ).toBe( false );
			expect( isWebpackModuleId( 'custom-library' ) ).toBe( false );
		} );

		test( 'should return false for file paths', () => {
			expect( isWebpackModuleId( './components/Button' ) ).toBe( false );
			expect( isWebpackModuleId( '../utils/helpers' ) ).toBe( false );
		} );

		test( 'should be case-sensitive', () => {
			expect( isWebpackModuleId( 'React' ) ).toBe( false );
			expect( isWebpackModuleId( 'REACT' ) ).toBe( false );
		} );

		test( 'should handle empty string', () => {
			expect( isWebpackModuleId( '' ) ).toBe( false );
		} );
	} );

	describe( 'Integration Tests', () => {
		test( 'essential extensions should not be in skip list', () => {
			const overlap = ESSENTIAL_EXTENSIONS.filter( ( ext ) =>
				SKIP_EXTENSIONS.includes( ext )
			);
			expect( overlap ).toEqual( [] );
		} );

		test( 'should handle complete asset processing workflow', () => {
			// Typical workflow: check if URL is excluded, then check extension
			const assetUrl =
				'http://example.com/wp-content/themes/my-theme/style.css';

			const excluded = isExcludedUrl( assetUrl );
			expect( excluded ).toBe( false );

			const ext = 'css';
			const essential = isEssentialExtension( ext );
			expect( essential ).toBe( true );

			const skipped = isSkippedExtension( ext );
			expect( skipped ).toBe( false );
		} );
	} );
} );
