/**
 * Get Static Site URLs Step Tests
 *
 * Tests for the getStaticSiteUrls step handler that discovers
 * all URLs for static site generation.
 */

// Mock WordPress hooks first (must be before imports)
jest.mock( '@wordpress/hooks', () => ( {
	addAction: jest.fn(),
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

// We need to access the handler from the module
let stepHandler;
let stepDefinition;

// Capture the step definition when addAction is called
const { addAction } = require( '@wordpress/hooks' );
addAction.mockImplementation( ( hookName, namespace, callback ) => {
	if ( hookName === 'aether.export.register_steps' ) {
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
require( '../getStaticSiteUrls' );

describe( 'getStaticSiteUrls step', () => {
	let mockContext;
	let mockApi;

	beforeEach( () => {
		jest.clearAllMocks();

		mockApi = {
			discoverUrls: jest.fn(),
		};

		mockContext = {
			api: mockApi,
			siteUrl: 'https://example.com',
			setStatusMessage: jest.fn(),
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
	} );

	describe( 'Step Definition', () => {
		test( 'should have correct id', () => {
			expect( stepDefinition.id ).toBe( 'getStaticSiteUrls' );
		} );

		test( 'should have a label', () => {
			expect( stepDefinition.label ).toBeTruthy();
		} );

		test( 'should not support progress', () => {
			expect( stepDefinition.supportsProgress ).toBe( false );
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

		test( 'should provide urlsCount', () => {
			expect( stepDefinition.provides.urlsCount.type ).toBe( 'number' );
		} );
	} );

	describe( 'Handler - URL Discovery', () => {
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

		test( 'should update status message during fetching', async () => {
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
				'getStaticSiteUrls'
			);
		} );

		test( 'should return discovered URLs', async () => {
			const result = await stepHandler( mockContext );

			expect( result.urls ).toEqual( [
				'https://example.com/',
				'https://example.com/about/',
				'https://example.com/contact/',
			] );
		} );

		test( 'should return urls count', async () => {
			const result = await stepHandler( mockContext );

			expect( result.urlsCount ).toBe( 3 );
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

	describe( 'Handler - Error Handling', () => {
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

		test( 'should handle empty urls array in response', async () => {
			mockApi.discoverUrls.mockResolvedValue( {
				success: true,
				urls: [],
			} );

			const result = await stepHandler( mockContext );

			expect( result.urls ).toEqual( [] );
			expect( result.urlsCount ).toBe( 0 );
		} );

		test( 'should handle missing urls in response', async () => {
			mockApi.discoverUrls.mockResolvedValue( {
				success: true,
			} );

			const result = await stepHandler( mockContext );

			expect( result.urls ).toEqual( [] );
			expect( result.urlsCount ).toBe( 0 );
		} );
	} );

	describe( 'Handler - Status Messages', () => {
		test( 'should set initial status message', async () => {
			await stepHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( 'Discovering URLs' ),
				'progress',
				'getStaticSiteUrls'
			);
		} );

		test( 'should set success message with URL count', async () => {
			await stepHandler( mockContext );

			expect( mockContext.setStatusMessage ).toHaveBeenCalledWith(
				expect.stringContaining( '3' ),
				'success',
				'getStaticSiteUrls'
			);
		} );
	} );
} );
