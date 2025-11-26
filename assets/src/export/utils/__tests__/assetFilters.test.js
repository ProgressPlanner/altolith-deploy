/**
 * Asset Filters Tests
 *
 */

import { shouldCollectAsset } from '../assetFilters';

// Mock dependencies
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hookName, value ) => value ),
} ) );

jest.mock( '../urlRewriter', () => ( {
	isExternal: jest.fn( ( url, siteUrl ) => {
		try {
			const urlHost = new URL( url ).host;
			const siteHost = new URL( siteUrl ).host;
			return urlHost !== siteHost;
		} catch {
			return false;
		}
	} ),
} ) );

jest.mock( '../assetExclusions', () => ( {
	isExcludedUrl: jest.fn( ( url ) => {
		return url.includes( 'analytics' ) || url.includes( 'tracking' );
	} ),
	isSkippedExtension: jest.fn( ( ext ) => {
		return [ 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico' ].includes(
			ext
		);
	} ),
	isEssentialExtension: jest.fn( ( ext ) => {
		return [ 'css', 'js', 'woff', 'woff2', 'ttf', 'eot' ].includes( ext );
	} ),
	isWebpackModuleId: jest.fn( ( id ) => {
		return /^\d+$/.test( id );
	} ),
} ) );

jest.mock( '../assetPatterns', () => ( {
	getExtensionFromUrl: jest.fn( ( url ) => {
		const match = url.match( /\.([a-z0-9]+)(?:\?|$)/i );
		return match ? match[ 1 ].toLowerCase() : '';
	} ),
} ) );

describe( 'assetFilters', () => {
	const siteUrl = 'https://example.com';

	describe( 'shouldCollectAsset()', () => {
		describe( 'essential assets', () => {
			test( 'should always collect CSS files', () => {
				expect(
					shouldCollectAsset(
						'https://example.com/style.css',
						siteUrl
					)
				).toBe( true );
			} );

			test( 'should always collect JS files', () => {
				expect(
					shouldCollectAsset( 'https://example.com/app.js', siteUrl )
				).toBe( true );
			} );

			test( 'should always collect font files', () => {
				expect(
					shouldCollectAsset(
						'https://example.com/font.woff2',
						siteUrl
					)
				).toBe( true );
				expect(
					shouldCollectAsset(
						'https://example.com/font.woff',
						siteUrl
					)
				).toBe( true );
				expect(
					shouldCollectAsset(
						'https://example.com/font.ttf',
						siteUrl
					)
				).toBe( true );
			} );

			test( 'should skip external essential assets (CORS prevents fetching)', () => {
				// External assets cannot be fetched due to CORS restrictions
				// They should keep their original URLs in the HTML
				expect(
					shouldCollectAsset(
						'https://cdn.example.org/lib.js',
						siteUrl
					)
				).toBe( false );
				expect(
					shouldCollectAsset(
						'https://fonts.googleapis.com/font.woff2',
						siteUrl
					)
				).toBe( false );
			} );
		} );

		describe( 'excluded URLs', () => {
			test( 'should skip analytics scripts', () => {
				expect(
					shouldCollectAsset(
						'https://example.com/analytics.php',
						siteUrl
					)
				).toBe( false );
			} );

			test( 'should skip tracking pixels', () => {
				expect(
					shouldCollectAsset(
						'https://example.com/tracking.gif',
						siteUrl
					)
				).toBe( false );
			} );
		} );

		describe( 'image handling', () => {
			test( 'should collect images from HTML source', () => {
				expect(
					shouldCollectAsset(
						'https://example.com/image.jpg',
						siteUrl,
						'html'
					)
				).toBe( true );
				expect(
					shouldCollectAsset(
						'https://example.com/photo.png',
						siteUrl,
						'html'
					)
				).toBe( true );
			} );

			test( 'should skip images from CSS source', () => {
				expect(
					shouldCollectAsset(
						'https://example.com/bg.jpg',
						siteUrl,
						'css'
					)
				).toBe( false );
			} );

			test( 'should skip images from JS source', () => {
				expect(
					shouldCollectAsset(
						'https://example.com/icon.png',
						siteUrl,
						'js'
					)
				).toBe( false );
			} );

			test( 'should skip external images in HTML', () => {
				expect(
					shouldCollectAsset(
						'https://other-site.com/image.jpg',
						siteUrl,
						'html'
					)
				).toBe( false );
			} );
		} );

		describe( 'external assets', () => {
			test( 'should skip non-essential external assets', () => {
				expect(
					shouldCollectAsset( 'https://other.com/data.json', siteUrl )
				).toBe( false );
			} );

			test( 'should collect internal non-essential assets', () => {
				expect(
					shouldCollectAsset(
						'https://example.com/data.json',
						siteUrl
					)
				).toBe( true );
			} );
		} );

		describe( 'webpack module IDs', () => {
			test( 'should skip webpack numeric module IDs', () => {
				expect(
					shouldCollectAsset( 'https://example.com/123.js', siteUrl )
				).toBe( false );
				expect(
					shouldCollectAsset( 'https://example.com/456.css', siteUrl )
				).toBe( false );
			} );

			test( 'should collect normal named files', () => {
				expect(
					shouldCollectAsset( 'https://example.com/main.js', siteUrl )
				).toBe( true );
			} );
		} );

		describe( 'default source', () => {
			test( 'should default to css source', () => {
				// Images should be skipped when source defaults to 'css'
				expect(
					shouldCollectAsset(
						'https://example.com/image.png',
						siteUrl
					)
				).toBe( false );
			} );
		} );
	} );
} );
