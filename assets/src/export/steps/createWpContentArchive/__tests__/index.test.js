/**
 * createBlueprintBundle Step Tests
 *
 * @package
 */

import { createBlueprintBundleStep } from '../index';

describe( 'createWpContentArchive', () => {
	test( 'should have correct step definition', () => {
		expect( createBlueprintBundleStep ).toHaveProperty(
			'id',
			'createWpContentArchive'
		);
		expect( createBlueprintBundleStep ).toHaveProperty( 'handler' );
		expect( typeof createBlueprintBundleStep.handler ).toBe( 'function' );
		expect( createBlueprintBundleStep ).toHaveProperty( 'dependencies' );
		expect( Array.isArray( createBlueprintBundleStep.dependencies ) ).toBe(
			true
		);
	} );
} );
