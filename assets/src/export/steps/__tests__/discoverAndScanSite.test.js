/**
 * Discover and Scan Site Step Tests
 *
 * Tests for the discoverAndScanSite step handler that discovers URLs from WordPress
 * and scans pages to extract assets (CSS, JS, images).
 */

// Mock WordPress hooks first (must be before imports)
jest.mock( '@wordpress/hooks', () => ( {
	addAction: jest.fn(),
	applyFilters: jest.fn( ( hookName, value ) => value ),
} ) );

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => {
		let result = format;
		// Handle numbered placeholders like %1$d, %2$s, etc.
		args.forEach( ( arg, index ) => {
			const placeholder = new RegExp( `%${ index + 1 }\\$[sd]`, 'g' );
			result = result.replace( placeholder, arg );
		} );
		// Handle simple placeholders like %d, %s
		args.forEach( ( arg ) => {
			result = result.replace( /%[sd]/, arg );
		} );
		return result;
	},
	_n: ( single, plural, count ) => ( count === 1 ? single : plural ),
} ) );

// Mock asset extractor
jest.mock( '@altolith/export/utils/assetExtractor', () => ( {
	extractAssetsFromHtml: jest.fn(),
} ) );

// Mock link extractor (async)
jest.mock( '@altolith/export/utils/linkExtractor', () => ( {
	extractInternalLinks: jest.fn( async () => [] ),
} ) );

// Mock URL utils
jest.mock( '@altolith/export/utils/urlUtils', () => ( {
	normalize: jest.fn( ( url ) => {
		try {
			const urlObj = new URL( url );
			let normalized =
				urlObj.origin + urlObj.pathname.replace( /\/$/, '' );
			if ( urlObj.search ) {
				normalized += urlObj.search;
			}
			return normalized || url;
		} catch {
			return url;
		}
	} ),
} ) );

// Import after mocks
import { extractAssetsFromHtml } from '@altolith/export/utils/assetExtractor';

// We need to access the handler from the module
let stepHandler;
let stepDefinition;

// Capture the step definition when addAction is called
const { addAction } = require( '@wordpress/hooks' );
addAction.mockImplementation( ( hookName, namespace, callback ) => {
	if ( hookName === 'altolith.export.register_steps' ) {
		const mockRegistry = {
			register: ( step ) => {
				stepDefinition = step;
				stepHandler = step.handler;
			},
		};
		callback( mockRegistry );
	}
} );

// Now import the module to trigger registration
require( '../discoverAndScanSite' );

describe( 'discoverAndScanSite step', () => {
	let mockContext;
	let mockApi;
	let mockFetch;

	beforeEach( () => {
		jest.clearAllMocks();

		mockApi = {
			discoverUrls: jest.fn(),
		};

		mockContext = {
			api: mockApi,
			siteUrl: 'https://example.com',
			setStatusMessage: jest.fn(),
			setStepProgress: jest.fn(),
		};

		// Default successful API response
		mockApi.discoverUrls.mockResolvedValue( {
			success: true,
			urls: [
				'https://example.com/',
				'https://example.com/about/',
				'https://example.com/contact/',
			],
			staticSiteUrl: 'https://static.example.com',
		} );

		// Mock fetch
		mockFetch = jest.fn();
		global.fetch = mockFetch;

		// Default fetch mock - successful HTML response
		mockFetch.mockResolvedValue( {
			ok: true,
			headers: {
				get: () => 'text/html; charset=utf-8',
			},
			text: () => Promise.resolve( '<html><body>Test</body></html>' ),
		} );

		// Default asset extractor mock
		extractAssetsFromHtml.mockResolvedValue( [
			'https://example.com/style.css',
			'https://example.com/script.js',
		] );
	} );

	afterEach( () => {
		delete global.fetch;
	} );

	describe( 'Step Definition', () => {
		test( 'should have correct id', () => {
			expect( stepDefinition.id ).toBe( 'discoverAndScanSite' );
		} );

		test( 'should have a label', () => {
			expect( stepDefinition.label ).toBeTruthy();
		} );

		test( 'should support progress', () => {
			expect( stepDefinition.supportsProgress ).toBe( true );
		} );

		test( 'should have no dependencies', () => {
			expect( stepDefinition.dependencies ).toEqual( [] );
		} );

		test( 'should require api from initial', () => {
			expect( stepDefinition.requires.api.from ).toBe( 'initial' );
			expect( stepDefinition.requires.api.required ).toBe( true );
		} );

		test( 'should require siteUrl from initial', () => {
			expect( stepDefinition.requires.siteUrl.from ).toBe( 'initial' );
			expect( stepDefinition.requires.siteUrl.required ).toBe( true );
		} );

		test( 'should provide urls', () => {
			expect( stepDefinition.provides.urls.type ).toBe( 'array' );
		} );

		test( 'should provide staticSiteUrl', () => {
			expect( stepDefinition.provides.staticSiteUrl.type ).toBe(
				'string'
			);
		} );

		test( 'should provide htmlDataMap', () => {
			expect( stepDefinition.provides.htmlDataMap.type ).toBe( 'object' );
		} );

		test( 'should provide htmlCount', () => {
			expect( stepDefinition.provides.htmlCount.type ).toBe( 'number' );
		} );

		test( 'should provide assetCount', () => {
			expect( stepDefinition.provides.assetCount.type ).toBe( 'number' );
		} );
	} );

	describe( 'Handler - URL Discovery from API', () => {
		test( 'should call api.discoverUrls', async () => {
			await stepHandler( mockContext );

			expect( mockApi.discoverUrls ).toHaveBeenCalled();
		} );

		test( 'should pass progress callback to discoverUrls', async () => {
			await stepHandler( mockContext );

			expect( mockApi.discoverUrls ).toHaveBeenCalledWith(
				expect.any( Function )
			);
		} );

		test( 'should update status message during API fetching', async () => {
			mockApi.discoverUrls.mockImplementation( ( progressCallback ) => {
				progressCallback( { status: 'fetching', type: 'posts' } );
				return Promise.resolve( {
					success: true,
					urls: [],
				} );
			} );

			await stepHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'posts' ),
				'progress',
				'discoverAndScanSite'
			);
		} );

		test( 'should throw error when API returns failure', async () => {
			mockApi.discoverUrls.mockResolvedValue( {
				success: false,
				message: 'Discovery failed',
			} );

			await expect( stepHandler( mockContext ) ).rejects.toThrow(
				'Discovery failed'
			);
		} );

		test( 'should use default message when API failure has no message', async () => {
			mockApi.discoverUrls.mockResolvedValue( {
				success: false,
			} );

			await expect( stepHandler( mockContext ) ).rejects.toThrow(
				'Failed to discover URLs'
			);
		} );

		test( 'should return static site URL from response', async () => {
			const result = await stepHandler( mockContext );

			expect( result.staticSiteUrl ).toBe( 'https://static.example.com' );
		} );

		test( 'should fallback to siteUrl if staticSiteUrl not in response', async () => {
			mockApi.discoverUrls.mockResolvedValue( {
				success: true,
				urls: [ 'https://example.com/' ],
			} );

			const result = await stepHandler( mockContext );

			expect( result.staticSiteUrl ).toBe( 'https://example.com' );
		} );
	} );

	describe( 'Handler - Page Scanning', () => {
		test( 'should fetch each discovered URL', async () => {
			await stepHandler( mockContext );

			expect( mockFetch ).toHaveBeenCalledTimes( 3 );
			expect( mockFetch ).toHaveBeenCalledWith(
				'https://example.com/',
				expect.objectContaining( {
					method: 'GET',
					credentials: 'omit',
				} )
			);
		} );

		test( 'should skip failed requests gracefully', async () => {
			mockFetch.mockResolvedValueOnce( { ok: false } );

			const result = await stepHandler( mockContext );

			// Should still have 3 processed URLs (all attempted)
			expect( result.htmlCount ).toBe( 3 );
		} );

		test( 'should skip non-HTML content types', async () => {
			mockFetch.mockResolvedValueOnce( {
				ok: true,
				headers: {
					get: () => 'application/json',
				},
			} );

			const result = await stepHandler( mockContext );

			expect( result.htmlCount ).toBe( 3 );
		} );

		test( 'should handle fetch errors gracefully', async () => {
			mockFetch.mockRejectedValueOnce( new Error( 'Network error' ) );

			const result = await stepHandler( mockContext );

			expect( result.htmlCount ).toBe( 3 );
		} );

		test( 'should handle empty urls array from API', async () => {
			mockApi.discoverUrls.mockResolvedValue( {
				success: true,
				urls: [],
			} );

			const result = await stepHandler( mockContext );

			expect( result.urls ).toEqual( [] );
			expect( result.htmlCount ).toBe( 0 );
			expect( result.assetCount ).toBe( 0 );
		} );

		test( 'should handle missing urls in API response', async () => {
			mockApi.discoverUrls.mockResolvedValue( {
				success: true,
			} );

			const result = await stepHandler( mockContext );

			expect( result.urls ).toEqual( [] );
			expect( result.htmlCount ).toBe( 0 );
		} );
	} );

	describe( 'Handler - Asset Extraction', () => {
		test( 'should extract assets from HTML pages', async () => {
			await stepHandler( mockContext );

			expect( extractAssetsFromHtml ).toHaveBeenCalled();
		} );

		test( 'should pass correct arguments to asset extractor', async () => {
			await stepHandler( mockContext );

			expect( extractAssetsFromHtml ).toHaveBeenCalledWith(
				expect.any( String ),
				expect.stringMatching( /^https:\/\/example\.com/ ),
				'https://example.com'
			);
		} );

		test( 'should deduplicate assets across pages', async () => {
			// All pages return the same asset
			extractAssetsFromHtml.mockResolvedValue( [
				'https://example.com/common.css',
			] );

			const result = await stepHandler( mockContext );

			// Asset should only appear once
			const assetUrls = result.urls.filter(
				( url ) => url === 'https://example.com/common.css'
			);
			expect( assetUrls ).toHaveLength( 1 );
		} );

		test( 'should combine HTML URLs with discovered assets', async () => {
			const result = await stepHandler( mockContext );

			// Should have HTML pages + assets
			expect( result.urls ).toContain( 'https://example.com' );
			expect( result.urls ).toContain( 'https://example.com/about' );
			expect( result.urls ).toContain( 'https://example.com/contact' );
			expect( result.urls ).toContain( 'https://example.com/style.css' );
			expect( result.urls ).toContain( 'https://example.com/script.js' );
		} );
	} );

	describe( 'Handler - Progress Reporting', () => {
		test( 'should update status message at start', async () => {
			await stepHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Fetching URLs from WordPress' ),
				'progress',
				'discoverAndScanSite'
			);
		} );

		test( 'should update step progress after each batch', async () => {
			await stepHandler( mockContext );

			// With batch processing, progress is updated per batch (not per URL).
			// Since batch size is 10 and we have 3 URLs, all are processed in one batch.
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'discoverAndScanSite',
				expect.objectContaining( { current: 3, total: 3 } )
			);
		} );

		test( 'should update status message on completion', async () => {
			await stepHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Found' ),
				'success',
				'discoverAndScanSite'
			);
		} );

		test( 'should handle missing setStepProgress gracefully', async () => {
			const context = { ...mockContext, setStepProgress: undefined };

			// Should not throw
			await expect( stepHandler( context ) ).resolves.toBeDefined();
		} );
	} );

	describe( 'Handler - Return Value', () => {
		test( 'should return expanded urls array', async () => {
			const result = await stepHandler( mockContext );

			expect( Array.isArray( result.urls ) ).toBe( true );
			expect( result.urls.length ).toBeGreaterThan( 0 );
		} );

		test( 'should return htmlCount', async () => {
			const result = await stepHandler( mockContext );

			expect( result.htmlCount ).toBe( 3 );
		} );

		test( 'should return assetCount', async () => {
			const result = await stepHandler( mockContext );

			// 2 unique assets per page, but deduplicated
			expect( result.assetCount ).toBe( 2 );
		} );

		test( 'should return staticSiteUrl', async () => {
			const result = await stepHandler( mockContext );

			expect( result.staticSiteUrl ).toBe( 'https://static.example.com' );
		} );

		test( 'should return htmlDataMap as Map', async () => {
			const result = await stepHandler( mockContext );

			expect( result.htmlDataMap ).toBeInstanceOf( Map );
		} );

		test( 'should populate htmlDataMap with HTML content', async () => {
			const result = await stepHandler( mockContext );

			// Check that htmlDataMap has entries for processed URLs
			expect( result.htmlDataMap.size ).toBeGreaterThan( 0 );

			// Check structure of entries
			const firstEntry = result.htmlDataMap.values().next().value;
			expect( firstEntry ).toHaveProperty( 'rawHtml' );
			expect( firstEntry ).toHaveProperty( 'assetUrls' );
		} );
	} );

	describe( 'Status Labels', () => {
		test( 'should have pending label', () => {
			expect( stepDefinition.statusLabels.pending ).toBeTruthy();
		} );

		test( 'should have running function that returns string', () => {
			expect( typeof stepDefinition.statusLabels.running ).toBe(
				'function'
			);
			expect(
				stepDefinition.statusLabels.running( {
					pagesScanned: 5,
					assetsFound: 10,
				} )
			).toBeTruthy();
		} );

		test( 'should have complete function that returns string', () => {
			expect( typeof stepDefinition.statusLabels.complete ).toBe(
				'function'
			);
			expect(
				stepDefinition.statusLabels.complete( {
					htmlCount: 10,
					assetCount: 20,
				} )
			).toBeTruthy();
		} );

		test( 'running label should show initial message when no pages scanned', () => {
			const label = stepDefinition.statusLabels.running( {
				pagesScanned: 0,
			} );
			expect( label ).toContain( 'Fetching URLs from WordPress' );
		} );

		test( 'running label should show progress when pages are being scanned', () => {
			const label = stepDefinition.statusLabels.running( {
				pagesScanned: 5,
				assetsFound: 10,
			} );
			expect( label ).toContain( '5' );
			expect( label ).toContain( '10' );
		} );

		test( 'complete label should show final counts', () => {
			const label = stepDefinition.statusLabels.complete( {
				htmlCount: 50,
				assetCount: 100,
			} );
			expect( label ).toContain( '50' );
			expect( label ).toContain( '100' );
		} );
	} );
} );
