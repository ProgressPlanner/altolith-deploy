/**
 * Tests for Playground redirect utilities.
 */

import { addFilter, removeFilter } from '@wordpress/hooks';
import {
	DEFAULT_PLAYGROUND_EDITOR_URL,
	getPlaygroundEditorUrl,
	buildPlaygroundRedirectUrl,
	buildPlaygroundRedirectHtml,
} from '../playgroundRedirect';

const blueprint = JSON.stringify( {
	landingPage: '/wp-admin/',
	steps: [ { step: 'login' } ],
} );

describe( 'playgroundRedirect', () => {
	describe( 'getPlaygroundEditorUrl', () => {
		it( 'defaults to the s12y Playground loader', () => {
			expect( DEFAULT_PLAYGROUND_EDITOR_URL ).toBe(
				'https://static-wp.s12y.org/index.html'
			);
			expect( getPlaygroundEditorUrl() ).toBe(
				DEFAULT_PLAYGROUND_EDITOR_URL
			);
		} );

		it( 'is overridable via the altolith.playground.editorUrl filter', () => {
			addFilter(
				'altolith.playground.editorUrl',
				'test/override',
				() => 'https://playground.example.com/'
			);
			expect( getPlaygroundEditorUrl() ).toBe(
				'https://playground.example.com/'
			);
			removeFilter( 'altolith.playground.editorUrl', 'test/override' );
		} );
	} );

	describe( 'buildPlaygroundRedirectUrl', () => {
		it( 'encodes the blueprint as base64 in the hash, decodable via atob (loader contract)', () => {
			const url = buildPlaygroundRedirectUrl( blueprint );
			const [ base, hash ] = url.split( '#' );
			expect( base ).toBe( 'https://static-wp.s12y.org/index.html' );
			expect( hash ).toBeTruthy();
			// The loader does JSON.parse( atob( hash ) ); round-trip must hold.
			expect( atob( hash ) ).toBe( blueprint );
			expect( JSON.parse( atob( hash ) ).landingPage ).toBe(
				'/wp-admin/'
			);
		} );

		it( 'honors an explicit editor URL override', () => {
			const url = buildPlaygroundRedirectUrl(
				blueprint,
				'https://custom.test/loader.html'
			);
			expect( url.startsWith( 'https://custom.test/loader.html#' ) ).toBe(
				true
			);
		} );
	} );

	describe( 'buildPlaygroundRedirectHtml', () => {
		it( 'redirects via both meta-refresh and JS to the base64 blueprint URL', () => {
			const html = buildPlaygroundRedirectHtml( blueprint );
			const expectedUrl = buildPlaygroundRedirectUrl( blueprint );

			expect( html ).toContain( '<!DOCTYPE html>' );
			expect( html ).toContain(
				`<meta http-equiv="refresh" content="0; url=${ expectedUrl }">`
			);
			expect( html ).toContain( 'window.location.href' );
			expect( html ).toContain( expectedUrl );

			// Encoded blueprint inside the emitted HTML round-trips.
			const hash = expectedUrl.split( '#' )[ 1 ];
			expect( atob( hash ) ).toBe( blueprint );
		} );

		it( 'uses the filtered editor URL', () => {
			addFilter(
				'altolith.playground.editorUrl',
				'test/override',
				() => 'https://playground.example.com/'
			);
			const html = buildPlaygroundRedirectHtml( blueprint );
			expect( html ).toContain( 'https://playground.example.com/#' );
			removeFilter( 'altolith.playground.editorUrl', 'test/override' );
		} );
	} );
} );
