/**
 * Pre-Scan Static Site Step Tests
 *
 * Tests for the preScanStaticSite step handler that fetches HTML pages
 * and extracts assets (CSS, JS, images).
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
		args.forEach( ( arg ) => {
			result = result.replace( /%[sd]/, arg );
		} );
		return result;
	},
} ) );

// Mock asset extractor
jest.mock( '@aether/export/utils/assetExtractor', () => ( {
	extractAssetsFromHtml: jest.fn(),
} ) );

// Mock link extractor (now async)
jest.mock( '@aether/export/utils/linkExtractor', () => ( {
	extractInternalLinks: jest.fn( async () => [] ),
} ) );

// Mock URL utils
jest.mock( '@aether/export/utils/urlUtils', () => ( {
	normalize: jest.fn( ( url ) => {
		// Simple normalization: remove trailing slash
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
import { extractAssetsFromHtml } from '@aether/export/utils/assetExtractor';

// We need to access the handler from the module
// Since the step registers via addAction, we'll import and capture the handler
let stepHandler;
let stepDefinition;

// Capture the step definition when addAction is called
const { addAction } = require( '@wordpress/hooks' );
addAction.mockImplementation( ( hookName, namespace, callback ) => {
	if ( hookName === 'aether.export.register_steps' ) {
		// Create a mock registry to capture the step
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
require( '../preScanStaticSite' );

describe( 'preScanStaticSite step', () => {
	let mockContext;
	let mockFetch;

	beforeEach( () => {
		jest.clearAllMocks();

		mockContext = {
			urls: [ 'https://example.com/', 'https://example.com/page/' ],
			siteUrl: 'https://example.com',
			setStatusMessage: jest.fn(),
			setStepProgress: jest.fn(),
		};

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
			expect( stepDefinition.id ).toBe( 'preScanStaticSite' );
		} );

		test( 'should have a label', () => {
			expect( stepDefinition.label ).toBeTruthy();
		} );

		test( 'should support progress', () => {
			expect( stepDefinition.supportsProgress ).toBe( true );
		} );

		test( 'should depend on getStaticSiteUrls', () => {
			expect( stepDefinition.dependencies ).toContain(
				'getStaticSiteUrls'
			);
		} );

		test( 'should require urls from getStaticSiteUrls', () => {
			expect( stepDefinition.requires.urls.from ).toBe(
				'getStaticSiteUrls'
			);
			expect( stepDefinition.requires.urls.required ).toBe( true );
		} );

		test( 'should provide expanded urls', () => {
			expect( stepDefinition.provides.urls.type ).toBe( 'array' );
		} );

		test( 'should provide sharedHtmlData', () => {
			expect( stepDefinition.provides.sharedHtmlData.type ).toBe( 'Map' );
		} );
	} );

	describe( 'Handler - Input Validation', () => {
		test( 'should throw error when urls is missing', async () => {
			const context = { ...mockContext, urls: undefined };

			await expect( stepHandler( context ) ).rejects.toThrow(
				'URLs not found'
			);
		} );

		test( 'should throw error when urls is not an array', async () => {
			const context = { ...mockContext, urls: 'not-an-array' };

			await expect( stepHandler( context ) ).rejects.toThrow(
				'URLs not found'
			);
		} );

		test( 'should handle empty urls array', async () => {
			const context = { ...mockContext, urls: [] };

			const result = await stepHandler( context );

			expect( result.urls ).toEqual( [] );
			expect( result.htmlCount ).toBe( 0 );
			expect( result.assetCount ).toBe( 0 );
		} );
	} );

	describe( 'Handler - Fetching Pages', () => {
		test( 'should fetch each URL', async () => {
			await stepHandler( mockContext );

			expect( mockFetch ).toHaveBeenCalledTimes( 2 );
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

			// Both URLs are processed, but failed one doesn't add to sharedHtmlData
			// htmlCount tracks processedUrls.size (all attempted URLs)
			expect( result.htmlCount ).toBe( 2 );
		} );

		test( 'should skip non-HTML content types', async () => {
			mockFetch.mockResolvedValueOnce( {
				ok: true,
				headers: {
					get: () => 'application/json',
				},
			} );

			const result = await stepHandler( mockContext );

			// Both URLs processed
			expect( result.htmlCount ).toBe( 2 );
		} );

		test( 'should handle fetch errors gracefully', async () => {
			mockFetch.mockRejectedValueOnce( new Error( 'Network error' ) );

			const result = await stepHandler( mockContext );

			// Both URLs are processed (one errored, one succeeded)
			expect( result.htmlCount ).toBe( 2 );
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
			// Both pages return the same asset
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

			// Should have 2 HTML pages + 2 assets (deduplicated)
			// Note: URLs are normalized (trailing slashes removed)
			expect( result.urls ).toContain( 'https://example.com' );
			expect( result.urls ).toContain( 'https://example.com/page' );
			expect( result.urls ).toContain( 'https://example.com/style.css' );
			expect( result.urls ).toContain( 'https://example.com/script.js' );
		} );
	} );

	describe( 'Handler - Progress Reporting', () => {
		test( 'should update status message at start', async () => {
			await stepHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Scanning' ),
				'progress',
				'preScanStaticSite'
			);
		} );

		test( 'should update step progress for each URL', async () => {
			await stepHandler( mockContext );

			// New implementation includes pending count in progress
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'preScanStaticSite',
				expect.objectContaining( { current: 1, total: 2 } )
			);
			expect( mockContext.setStepProgress ).toHaveBeenCalledWith(
				'preScanStaticSite',
				expect.objectContaining( { current: 2, total: 2 } )
			);
		} );

		test( 'should update status message on completion', async () => {
			await stepHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Found' ),
				'success',
				'preScanStaticSite'
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

			expect( result.htmlCount ).toBe( 2 );
		} );

		test( 'should return assetCount', async () => {
			const result = await stepHandler( mockContext );

			expect( result.assetCount ).toBe( 2 );
		} );

		test( 'should return sharedHtmlData Map', async () => {
			const result = await stepHandler( mockContext );

			expect( result.sharedHtmlData ).toBeInstanceOf( Map );
		} );

		test( 'should store HTML content in sharedHtmlData', async () => {
			const result = await stepHandler( mockContext );

			// URLs are normalized (trailing slash removed)
			const cachedData = result.sharedHtmlData.get(
				'https://example.com'
			);
			expect( cachedData ).toBeDefined();
			expect( cachedData.rawHtml ).toBe(
				'<html><body>Test</body></html>'
			);
		} );

		test( 'should store asset URLs in sharedHtmlData', async () => {
			const result = await stepHandler( mockContext );

			// URLs are normalized (trailing slash removed)
			const cachedData = result.sharedHtmlData.get(
				'https://example.com'
			);
			expect( cachedData.assetUrls ).toEqual( [
				'https://example.com/style.css',
				'https://example.com/script.js',
			] );
		} );
	} );
} );
