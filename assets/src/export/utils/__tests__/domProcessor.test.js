/**
 * Tests for domProcessor utility.
 *
 * @package
 */

import {
	removeElementsByAttribute,
	addBodyClass,
	removeBodyClass,
	replaceText,
	injectBeforeClosingTag,
	querySelector,
	querySelectorAll,
	getAttribute,
	setAttribute,
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

	describe( 'replaceText()', () => {
		it( 'should replace text using string search', async () => {
			const html = '<html><body><p>Hello World</p></body></html>';
			const result = await replaceText( html, 'World', 'Universe' );
			expect( result ).toContain( 'Hello Universe' );
			expect( result ).not.toContain( 'Hello World' );
		} );

		it( 'should replace text using regex search', async () => {
			const html = '<html><body><p>test123</p></body></html>';
			const result = await replaceText( html, /\d+/g, 'NUMBER' );
			expect( result ).toContain( 'testNUMBER' );
		} );

		it( 'should replace all occurrences of text', async () => {
			const html = '<html><body><p>foo foo foo</p></body></html>';
			const result = await replaceText( html, 'foo', 'bar' );
			expect( result ).toContain( 'bar bar bar' );
		} );

		it( 'should not replace text in attributes', async () => {
			const html =
				'<html><body><a href="http://example.com">Example</a></body></html>';
			const result = await replaceText( html, 'example', 'test' );
			// Text node should be replaced, but href should remain.
			expect( result ).toContain( 'http://example.com' );
		} );
	} );

	describe( 'injectBeforeClosingTag()', () => {
		it( 'should inject content before closing head tag', async () => {
			const html = '<html><head></head><body></body></html>';
			const result = await injectBeforeClosingTag(
				html,
				'head',
				'<meta name="test" />'
			);
			expect( result ).toContain( '<meta name="test"' );
		} );

		it( 'should inject content before closing body tag', async () => {
			const html = '<html><head></head><body></body></html>';
			const result = await injectBeforeClosingTag(
				html,
				'body',
				'<script>alert("test")</script>'
			);
			expect( result ).toContain( 'alert("test")' );
		} );

		it( 'should handle non-existent tag', async () => {
			const html = '<html><head></head><body></body></html>';
			const result = await injectBeforeClosingTag(
				html,
				'footer',
				'<div>Footer</div>'
			);
			expect( result ).toBe( html );
		} );
	} );

	describe( 'querySelector()', () => {
		it( 'should find first matching element', async () => {
			const html =
				'<html><head></head><body><p>First</p><p>Second</p></body></html>';
			const node = await querySelector( html, 'p' );
			expect( node ).not.toBeNull();
			expect( node.nodeName ).toBe( 'p' );
		} );

		it( 'should return null if no match found', async () => {
			const html = '<html><head></head><body></body></html>';
			const node = await querySelector( html, 'article' );
			expect( node ).toBeNull();
		} );
	} );

	describe( 'querySelectorAll()', () => {
		it( 'should find all matching elements', async () => {
			const html =
				'<html><head><link /><link /></head><body></body></html>';
			const nodes = await querySelectorAll( html, 'link' );
			expect( nodes ).toHaveLength( 2 );
		} );

		it( 'should return empty array if no matches found', async () => {
			const html = '<html><head></head><body></body></html>';
			const nodes = await querySelectorAll( html, 'article' );
			expect( nodes ).toHaveLength( 0 );
		} );
	} );

	describe( 'getAttribute()', () => {
		it( 'should get attribute value', async () => {
			const html =
				'<html><head></head><body><a href="http://example.com">Link</a></body></html>';
			const node = await querySelector( html, 'a' );
			const href = getAttribute( node, 'href' );
			expect( href ).toBe( 'http://example.com' );
		} );

		it( 'should return null for non-existent attribute', async () => {
			const html =
				'<html><head></head><body><a href="test">Link</a></body></html>';
			const node = await querySelector( html, 'a' );
			const title = getAttribute( node, 'title' );
			expect( title ).toBeNull();
		} );
	} );

	describe( 'setAttribute()', () => {
		it( 'should set attribute value', async () => {
			const html = '<html><head></head><body><a>Link</a></body></html>';
			const node = await querySelector( html, 'a' );
			setAttribute( node, 'href', 'http://example.com' );
			const href = getAttribute( node, 'href' );
			expect( href ).toBe( 'http://example.com' );
		} );

		it( 'should update existing attribute value', async () => {
			const html =
				'<html><head></head><body><a href="old">Link</a></body></html>';
			const node = await querySelector( html, 'a' );
			setAttribute( node, 'href', 'new' );
			const href = getAttribute( node, 'href' );
			expect( href ).toBe( 'new' );
		} );
	} );
} );
