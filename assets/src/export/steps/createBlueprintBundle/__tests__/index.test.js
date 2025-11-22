/**
 * createBlueprintBundle Step Tests
 *
 */

import { createBlueprintBundleStep } from '../index';

describe( 'createBlueprintBundle', () => {
	test( 'should have correct step definition', () => {
		expect( createBlueprintBundleStep ).toHaveProperty(
			'id',
			'createBlueprintBundle'
		);
		expect( createBlueprintBundleStep ).toHaveProperty( 'handler' );
		expect( typeof createBlueprintBundleStep.handler ).toBe( 'function' );
		expect( createBlueprintBundleStep ).toHaveProperty( 'dependencies' );
		expect( Array.isArray( createBlueprintBundleStep.dependencies ) ).toBe(
			true
		);
	} );
} );
