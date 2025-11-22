/**
 * Dependency Resolver Tests
 *
 */

import {
	buildParallelPlan,
	validateDependencies,
	getExecutionOrder,
} from '../DependencyResolver';

describe( 'DependencyResolver', () => {
	describe( 'buildParallelPlan()', () => {
		test( 'should return steps with no dependencies in first group', () => {
			const steps = [
				{ id: 'step1', dependencies: [] },
				{ id: 'step2', dependencies: [] },
				{ id: 'step3', dependencies: [] },
			];

			const plan = buildParallelPlan( steps );

			expect( plan ).toHaveLength( 1 );
			expect( plan[ 0 ] ).toContain( 'step1' );
			expect( plan[ 0 ] ).toContain( 'step2' );
			expect( plan[ 0 ] ).toContain( 'step3' );
		} );

		test( 'should order steps based on dependencies', () => {
			const steps = [
				{ id: 'step1', dependencies: [] },
				{ id: 'step2', dependencies: [ 'step1' ] },
				{ id: 'step3', dependencies: [ 'step2' ] },
			];

			const plan = buildParallelPlan( steps );

			expect( plan ).toHaveLength( 3 );
			expect( plan[ 0 ] ).toEqual( [ 'step1' ] );
			expect( plan[ 1 ] ).toEqual( [ 'step2' ] );
			expect( plan[ 2 ] ).toEqual( [ 'step3' ] );
		} );

		test( 'should group independent steps for parallel execution', () => {
			const steps = [
				{ id: 'discover', dependencies: [] },
				{ id: 'getUrls', dependencies: [] },
				{ id: 'createArchive', dependencies: [ 'discover' ] },
				{ id: 'uploadStatic', dependencies: [ 'getUrls' ] },
				{
					id: 'createBlueprintBundle',
					dependencies: [ 'createArchive' ],
				},
			];

			const plan = buildParallelPlan( steps );

			// Group 1: discover, getUrls (no dependencies)
			expect( plan[ 0 ] ).toContain( 'discover' );
			expect( plan[ 0 ] ).toContain( 'getUrls' );
			expect( plan[ 0 ] ).toHaveLength( 2 );

			// Group 2: createArchive, uploadStatic (depend on group 1)
			expect( plan[ 1 ] ).toContain( 'createArchive' );
			expect( plan[ 1 ] ).toContain( 'uploadStatic' );
			expect( plan[ 1 ] ).toHaveLength( 2 );

			// Group 3: generateBlueprint (depends on createArchive)
			expect( plan[ 2 ] ).toEqual( [ 'createBlueprintBundle' ] );
		} );

		test( 'should detect circular dependencies', () => {
			const steps = [
				{ id: 'step1', dependencies: [ 'step2' ] },
				{ id: 'step2', dependencies: [ 'step1' ] },
			];

			expect( () => buildParallelPlan( steps ) ).toThrow(
				'Circular dependency detected'
			);
		} );

		test( 'should handle steps with missing dependencies field', () => {
			const steps = [
				{ id: 'step1' },
				{ id: 'step2', dependencies: [ 'step1' ] },
			];

			const plan = buildParallelPlan( steps );

			expect( plan ).toHaveLength( 2 );
			expect( plan[ 0 ] ).toEqual( [ 'step1' ] );
			expect( plan[ 1 ] ).toEqual( [ 'step2' ] );
		} );

		test( 'should handle empty steps array', () => {
			const plan = buildParallelPlan( [] );
			expect( plan ).toEqual( [] );
		} );
	} );

	describe( 'validateDependencies()', () => {
		test( 'should return empty array for valid dependencies', () => {
			const steps = [
				{ id: 'step1', dependencies: [] },
				{ id: 'step2', dependencies: [ 'step1' ] },
			];

			const errors = validateDependencies( steps );
			expect( errors ).toEqual( [] );
		} );

		test( 'should return errors for unknown dependencies', () => {
			const steps = [
				{ id: 'step1', dependencies: [] },
				{ id: 'step2', dependencies: [ 'unknownStep' ] },
			];

			const errors = validateDependencies( steps );

			expect( errors ).toHaveLength( 1 );
			expect( errors[ 0 ] ).toContain( 'step2' );
			expect( errors[ 0 ] ).toContain( 'unknownStep' );
		} );

		test( 'should return multiple errors for multiple invalid dependencies', () => {
			const steps = [
				{ id: 'step1', dependencies: [ 'missing1' ] },
				{ id: 'step2', dependencies: [ 'missing2' ] },
			];

			const errors = validateDependencies( steps );
			expect( errors ).toHaveLength( 2 );
		} );

		test( 'should handle steps without dependencies field', () => {
			const steps = [ { id: 'step1' } ];

			const errors = validateDependencies( steps );
			expect( errors ).toEqual( [] );
		} );
	} );

	describe( 'getExecutionOrder()', () => {
		test( 'should return flat array of step IDs in order', () => {
			const steps = [
				{ id: 'step1', dependencies: [] },
				{ id: 'step2', dependencies: [ 'step1' ] },
				{ id: 'step3', dependencies: [ 'step2' ] },
			];

			const order = getExecutionOrder( steps );

			expect( order ).toEqual( [ 'step1', 'step2', 'step3' ] );
		} );

		test( 'should include parallel steps in same position', () => {
			const steps = [
				{ id: 'a', dependencies: [] },
				{ id: 'b', dependencies: [] },
				{ id: 'c', dependencies: [ 'a', 'b' ] },
			];

			const order = getExecutionOrder( steps );

			// a and b should come before c
			expect( order.indexOf( 'c' ) ).toBeGreaterThan(
				order.indexOf( 'a' )
			);
			expect( order.indexOf( 'c' ) ).toBeGreaterThan(
				order.indexOf( 'b' )
			);
		} );
	} );
} );
