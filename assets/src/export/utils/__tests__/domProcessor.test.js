/**
 * Tests for domProcessor utility.
 *
 */

import {
	removeElementsByAttribute,
	addBodyClass,
	removeBodyClass,
} from '../domProcessor';

describe( 'domProcessor', () => {
	describe( 'removeElementsByAttribute()', () => {
		it( 'should remove elements by exact attribute match', async () => {
			const html =
				'<html><head><link id="test-css" rel="stylesheet" /></head><body></body></html>';
			const result = await removeElementsByAttribute(
				html,
				'link',
				'id',
				'test-css',
				true
			);
			expect( result ).not.toContain( 'id="test-css"' );
		} );

		it( 'should remove elements by partial attribute match', async () => {
			const html =
				'<html><head><script id="admin-bar-js"></script></head><body></body></html>';
			const result = await removeElementsByAttribute(
				html,
				'script',
				'id',
				'admin-bar',
				false
			);
			expect( result ).not.toContain( 'admin-bar' );
		} );

		it( 'should not remove elements that do not match', async () => {
			const html =
				'<html><head><link id="keep-this" /><link id="remove-this" /></head><body></body></html>';
			const result = await removeElementsByAttribute(
				html,
				'link',
				'id',
				'remove-this',
				true
			);
			expect( result ).toContain( 'keep-this' );
			expect( result ).not.toContain( 'remove-this' );
		} );

		it( 'should handle HTML without matching elements', async () => {
			const html = '<html><head></head><body></body></html>';
			const result = await removeElementsByAttribute(
				html,
				'script',
				'id',
				'nonexistent',
				true
			);
			expect( result ).toContain( '<head></head>' );
		} );
	} );

	describe( 'addBodyClass()', () => {
		it( 'should add class to body element', async () => {
			const html =
				'<html><head></head><body class="existing-class"></body></html>';
			const result = await addBodyClass( html, 'new-class' );
			expect( result ).toContain( 'existing-class' );
			expect( result ).toContain( 'new-class' );
		} );

		it( 'should create class attribute if it does not exist', async () => {
			const html = '<html><head></head><body></body></html>';
			const result = await addBodyClass( html, 'test-class' );
			expect( result ).toContain( 'class="test-class"' );
		} );

		it( 'should not duplicate class if it already exists', async () => {
			const html =
				'<html><head></head><body class="test-class"></body></html>';
			const result = await addBodyClass( html, 'test-class' );
			const matches = result.match( /test-class/g );
			expect( matches ).toHaveLength( 1 );
		} );

		it( 'should handle HTML without body element', async () => {
			const html = '<html><head></head></html>';
			const result = await addBodyClass( html, 'test-class' );
			// parse5 automatically adds body element when parsing.
			expect( result ).toContain( 'class="test-class"' );
		} );
	} );

	describe( 'removeBodyClass()', () => {
		it( 'should remove single class from body', async () => {
			const html =
				'<html><head></head><body class="class1 class2 class3"></body></html>';
			const result = await removeBodyClass( html, 'class2' );
			expect( result ).toContain( 'class1' );
			expect( result ).not.toContain( 'class2' );
			expect( result ).toContain( 'class3' );
		} );

		it( 'should remove multiple classes from body', async () => {
			const html =
				'<html><head></head><body class="class1 class2 class3"></body></html>';
			const result = await removeBodyClass( html, [
				'class1',
				'class3',
			] );
			expect( result ).not.toContain( 'class1' );
			expect( result ).toContain( 'class2' );
			expect( result ).not.toContain( 'class3' );
		} );

		it( 'should handle non-existent classes', async () => {
			const html =
				'<html><head></head><body class="class1"></body></html>';
			const result = await removeBodyClass( html, 'nonexistent' );
			expect( result ).toContain( 'class1' );
		} );

		it( 'should handle HTML without body element', async () => {
			const html = '<html><head></head></html>';
			const result = await removeBodyClass( html, 'test' );
			// parse5 automatically adds body element when parsing.
			expect( result ).toContain( '<body>' );
		} );
	} );
} );
