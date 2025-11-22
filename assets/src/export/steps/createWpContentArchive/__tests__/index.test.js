/**
 * createWpContentArchive Step Tests
 *
 */

import { createWpContentArchiveStep } from '../index';

describe( 'createWpContentArchive', () => {
	test( 'should have correct step definition', () => {
		expect( createWpContentArchiveStep ).toHaveProperty(
			'id',
			'createWpContentArchive'
		);
		expect( createWpContentArchiveStep ).toHaveProperty( 'handler' );
		expect( typeof createWpContentArchiveStep.handler ).toBe( 'function' );
		expect( createWpContentArchiveStep ).toHaveProperty( 'dependencies' );
		expect( Array.isArray( createWpContentArchiveStep.dependencies ) ).toBe(
			true
		);
	} );
} );
