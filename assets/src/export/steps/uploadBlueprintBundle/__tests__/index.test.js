/**
 * uploadBlueprintBundle Step Tests
 *
 * @package
 */

import { uploadBlueprintBundleStep } from '../index';

describe( 'uploadBlueprintBundle', () => {
	test( 'should have correct step definition', () => {
		expect( uploadBlueprintBundleStep ).toHaveProperty(
			'id',
			'uploadBlueprintBundle'
		);
		expect( uploadBlueprintBundleStep ).toHaveProperty( 'handler' );
		expect( typeof uploadBlueprintBundleStep.handler ).toBe( 'function' );
		expect( uploadBlueprintBundleStep ).toHaveProperty( 'dependencies' );
		expect( Array.isArray( uploadBlueprintBundleStep.dependencies ) ).toBe(
			true
		);
	} );
} );
