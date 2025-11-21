/**
 * getStaticSiteUrls Step Tests
 *
 * @package
 */

import { getStaticSiteUrlsStep } from '../index';

describe( 'getStaticSiteUrls', () => {
	test( 'should have correct step definition', () => {
		expect( getStaticSiteUrlsStep ).toHaveProperty(
			'id',
			'getStaticSiteUrls'
		);
		expect( getStaticSiteUrlsStep ).toHaveProperty( 'handler' );
		expect( typeof getStaticSiteUrlsStep.handler ).toBe( 'function' );
		expect( getStaticSiteUrlsStep ).toHaveProperty( 'dependencies' );
		expect( Array.isArray( getStaticSiteUrlsStep.dependencies ) ).toBe(
			true
		);
	} );
} );
