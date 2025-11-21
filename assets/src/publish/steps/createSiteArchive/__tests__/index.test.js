/**
 * createSiteArchive Step Tests
 *
 * @package
 */

import { createSiteArchiveStep } from '../index';

describe( 'createSiteArchive', () => {
	test( 'should have correct step definition', () => {
		expect( createSiteArchiveStep ).toHaveProperty( 'id', 'createSiteArchive' );
		expect( createSiteArchiveStep ).toHaveProperty( 'handler' );
		expect( typeof createSiteArchiveStep.handler ).toBe( 'function' );
		expect( createSiteArchiveStep ).toHaveProperty( 'dependencies' );
		expect( Array.isArray( createSiteArchiveStep.dependencies ) ).toBe( true );
	} );
} );
