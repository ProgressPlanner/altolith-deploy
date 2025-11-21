/**
 * uploadStaticFiles Step Tests
 *
 * @package
 */

import { uploadStaticFilesStep } from '../index';

describe( 'uploadStaticFiles', () => {
	test( 'should have correct step definition', () => {
		expect( uploadStaticFilesStep ).toHaveProperty(
			'id',
			'uploadStaticFiles'
		);
		expect( uploadStaticFilesStep ).toHaveProperty( 'handler' );
		expect( typeof uploadStaticFilesStep.handler ).toBe( 'function' );
		expect( uploadStaticFilesStep ).toHaveProperty( 'dependencies' );
		expect( Array.isArray( uploadStaticFilesStep.dependencies ) ).toBe(
			true
		);
	} );
} );
