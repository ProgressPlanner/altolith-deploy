/**
 * discoverAssets Step Tests
 *
 * @package
 */

import { discoverAssetsStep } from '../index';

describe( 'discoverAssets', () => {
	test( 'should have correct step definition', () => {
		expect( discoverAssetsStep ).toHaveProperty( 'id', 'discoverAssets' );
		expect( discoverAssetsStep ).toHaveProperty( 'handler' );
		expect( typeof discoverAssetsStep.handler ).toBe( 'function' );
		expect( discoverAssetsStep ).toHaveProperty( 'dependencies' );
		expect( Array.isArray( discoverAssetsStep.dependencies ) ).toBe( true );
	} );
} );
