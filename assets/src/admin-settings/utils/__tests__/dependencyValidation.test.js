/**
 * Dependency Validation Tests
 *
 * @package
 */

import {
	isDependencySatisfied,
	getUnsatisfiedDependencies,
	areAllDependenciesSatisfied,
} from '../dependencyValidation';

describe( 'dependencyValidation', () => {
	const mockProviders = [
		{ id: 'provider-a', name: 'Provider A' },
		{ id: 'provider-b', name: 'Provider B' },
		{ id: 'provider-c', name: 'Provider C' },
	];

	describe( 'isDependencySatisfied()', () => {
		test( 'should return false if dependency provider does not exist', () => {
			const result = isDependencySatisfied( 'non-existent', mockProviders, {} );
			expect( result ).toBe( false );
		} );

		test( 'should return false if dependency provider is disabled', () => {
			const configs = { 'provider-a': { enabled: false, api_key: 'test' } };
			const result = isDependencySatisfied( 'provider-a', mockProviders, configs );
			expect( result ).toBe( false );
		} );

		test( 'should return false if dependency provider has no config', () => {
			const configs = {};
			const result = isDependencySatisfied( 'provider-a', mockProviders, configs );
			expect( result ).toBe( false );
		} );

		test( 'should return false if dependency provider only has enabled flag', () => {
			const configs = { 'provider-a': { enabled: true } };
			const result = isDependencySatisfied( 'provider-a', mockProviders, configs );
			expect( result ).toBe( false );
		} );

		test( 'should return false if dependency provider only has deployment_types', () => {
			const configs = { 'provider-a': { deployment_types: [ 'static' ] } };
			const result = isDependencySatisfied( 'provider-a', mockProviders, configs );
			expect( result ).toBe( false );
		} );

		test( 'should return true when dependency is satisfied', () => {
			const configs = { 'provider-a': { api_key: 'secret', bucket: 'data' } };
			const result = isDependencySatisfied( 'provider-a', mockProviders, configs );
			expect( result ).toBe( true );
		} );

		test( 'should return true when enabled is explicitly true', () => {
			const configs = { 'provider-a': { enabled: true, api_key: 'secret' } };
			const result = isDependencySatisfied( 'provider-a', mockProviders, configs );
			expect( result ).toBe( true );
		} );
	} );

	describe( 'getUnsatisfiedDependencies()', () => {
		test( 'should return empty array when no dependencies', () => {
			const provider = { id: 'test', dependencies: [] };
			const result = getUnsatisfiedDependencies( provider, mockProviders, {} );
			expect( result ).toEqual( [] );
		} );

		test( 'should return empty array when provider has no dependencies property', () => {
			const provider = { id: 'test' };
			const result = getUnsatisfiedDependencies( provider, mockProviders, {} );
			expect( result ).toEqual( [] );
		} );

		test( 'should return unsatisfied dependency IDs', () => {
			const provider = { id: 'test', dependencies: [ 'provider-a', 'provider-b' ] };
			const configs = { 'provider-a': { api_key: 'secret' } };
			const result = getUnsatisfiedDependencies( provider, mockProviders, configs );
			expect( result ).toEqual( [ 'provider-b' ] );
		} );

		test( 'should return all dependencies when none are satisfied', () => {
			const provider = { id: 'test', dependencies: [ 'provider-a', 'provider-b' ] };
			const result = getUnsatisfiedDependencies( provider, mockProviders, {} );
			expect( result ).toEqual( [ 'provider-a', 'provider-b' ] );
		} );
	} );

	describe( 'areAllDependenciesSatisfied()', () => {
		test( 'should return true when no dependencies', () => {
			const provider = { id: 'test', dependencies: [] };
			const result = areAllDependenciesSatisfied( provider, mockProviders, {} );
			expect( result ).toBe( true );
		} );

		test( 'should return true when all dependencies are satisfied', () => {
			const provider = { id: 'test', dependencies: [ 'provider-a' ] };
			const configs = { 'provider-a': { api_key: 'secret' } };
			const result = areAllDependenciesSatisfied( provider, mockProviders, configs );
			expect( result ).toBe( true );
		} );

		test( 'should return false when any dependency is unsatisfied', () => {
			const provider = { id: 'test', dependencies: [ 'provider-a', 'provider-b' ] };
			const configs = { 'provider-a': { api_key: 'secret' } };
			const result = areAllDependenciesSatisfied( provider, mockProviders, configs );
			expect( result ).toBe( false );
		} );
	} );
} );
