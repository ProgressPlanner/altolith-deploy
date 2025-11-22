/**
 * discoverBlueprintBundleAssets Step Tests
 *
 */

import { discoverBlueprintBundleAssetsStep } from '../index';

describe( 'discoverBlueprintBundleAssets', () => {
	test( 'should have correct step definition', () => {
		expect( discoverBlueprintBundleAssetsStep ).toHaveProperty(
			'id',
			'discoverBlueprintBundleAssets'
		);
		expect( discoverBlueprintBundleAssetsStep ).toHaveProperty( 'handler' );
		expect( typeof discoverBlueprintBundleAssetsStep.handler ).toBe(
			'function'
		);
		expect( discoverBlueprintBundleAssetsStep ).toHaveProperty(
			'dependencies'
		);
		expect(
			Array.isArray( discoverBlueprintBundleAssetsStep.dependencies )
		).toBe( true );
	} );
} );
