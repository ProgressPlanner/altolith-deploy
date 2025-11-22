/**
 * generateBlueprint Step Tests
 *
 * @package
 */

import { generateBlueprintStep } from '../index';

describe( 'createBlueprintBundle', () => {
	test( 'should have correct step definition', () => {
		expect( generateBlueprintStep ).toHaveProperty(
			'id',
			'createBlueprintBundle'
		);
		expect( generateBlueprintStep ).toHaveProperty( 'handler' );
		expect( typeof generateBlueprintStep.handler ).toBe( 'function' );
		expect( generateBlueprintStep ).toHaveProperty( 'dependencies' );
		expect( Array.isArray( generateBlueprintStep.dependencies ) ).toBe(
			true
		);
	} );
} );
