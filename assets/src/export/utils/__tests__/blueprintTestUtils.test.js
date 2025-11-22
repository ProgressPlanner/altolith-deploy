/**
 * Blueprint Test Utilities Tests
 *
 * Tests for blueprint testing utility functions.
 * These are pure functions used to validate and analyze blueprint structures.
 *
 */

import {
	countStepsByType,
	extractPluginSlugs,
	extractThemeSlugs,
	expectedBlueprintSchema,
} from '../blueprintTestUtils';

describe( 'blueprintTestUtils', () => {
	describe( 'countStepsByType()', () => {
		test( 'should count steps by type correctly', () => {
			const steps = [
				{ step: 'importWordPressFiles' },
				{ step: 'installPlugin' },
				{ step: 'installPlugin' },
				{ step: 'installTheme' },
				{ step: 'activatePlugin' },
			];

			const result = countStepsByType( steps );

			expect( result ).toEqual( {
				importWordPressFiles: 1,
				installPlugin: 2,
				installTheme: 1,
				activatePlugin: 1,
				defineWpConfigConsts: 0,
				other: 0,
			} );
		} );

		test( 'should return zero counts for empty array', () => {
			const result = countStepsByType( [] );

			expect( result ).toEqual( {
				importWordPressFiles: 0,
				installPlugin: 0,
				installTheme: 0,
				activatePlugin: 0,
				defineWpConfigConsts: 0,
				other: 0,
			} );
		} );

		test( 'should count unknown step types as "other"', () => {
			const steps = [
				{ step: 'importWordPressFiles' },
				{ step: 'customStep' },
				{ step: 'anotherCustomStep' },
			];

			const result = countStepsByType( steps );

			expect( result.importWordPressFiles ).toBe( 1 );
			expect( result.other ).toBe( 2 );
		} );

		test( 'should handle multiple instances of the same step type', () => {
			const steps = [
				{ step: 'installPlugin' },
				{ step: 'installPlugin' },
				{ step: 'installPlugin' },
				{ step: 'installPlugin' },
				{ step: 'installPlugin' },
			];

			const result = countStepsByType( steps );

			expect( result.installPlugin ).toBe( 5 );
			expect( result.installTheme ).toBe( 0 );
		} );

		test( 'should count all known step types when present', () => {
			const steps = [
				{ step: 'importWordPressFiles' },
				{ step: 'installPlugin' },
				{ step: 'installTheme' },
				{ step: 'activatePlugin' },
				{ step: 'defineWpConfigConsts' },
			];

			const result = countStepsByType( steps );

			expect( result.importWordPressFiles ).toBe( 1 );
			expect( result.installPlugin ).toBe( 1 );
			expect( result.installTheme ).toBe( 1 );
			expect( result.activatePlugin ).toBe( 1 );
			expect( result.defineWpConfigConsts ).toBe( 1 );
			expect( result.other ).toBe( 0 );
		} );

		test( 'should not mutate input array', () => {
			const steps = [
				{ step: 'importWordPressFiles' },
				{ step: 'installPlugin' },
			];
			const originalLength = steps.length;

			countStepsByType( steps );

			expect( steps ).toHaveLength( originalLength );
			expect( steps[ 0 ].step ).toBe( 'importWordPressFiles' );
		} );
	} );

	describe( 'extractPluginSlugs()', () => {
		test( 'should extract plugin slugs from WordPress.org plugin steps', () => {
			const steps = [
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'akismet',
					},
				},
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'jetpack',
					},
				},
			];

			const result = extractPluginSlugs( steps );

			expect( result ).toEqual( [ 'akismet', 'jetpack' ] );
		} );

		test( 'should return empty array when no plugin steps exist', () => {
			const steps = [
				{ step: 'importWordPressFiles' },
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentyfour',
					},
				},
			];

			const result = extractPluginSlugs( steps );

			expect( result ).toEqual( [] );
		} );

		test( 'should filter out non-WordPress.org plugin steps', () => {
			const steps = [
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'akismet',
					},
				},
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'bundled',
						slug: 'custom-plugin',
					},
				},
			];

			const result = extractPluginSlugs( steps );

			expect( result ).toEqual( [ 'akismet' ] );
		} );

		test( 'should filter out steps without pluginData', () => {
			const steps = [
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'akismet',
					},
				},
				{
					step: 'installPlugin',
				},
			];

			const result = extractPluginSlugs( steps );

			expect( result ).toEqual( [ 'akismet' ] );
		} );

		test( 'should filter out steps without slug', () => {
			const steps = [
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'akismet',
					},
				},
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
					},
				},
			];

			const result = extractPluginSlugs( steps );

			expect( result ).toEqual( [ 'akismet' ] );
		} );

		test( 'should handle empty array', () => {
			const result = extractPluginSlugs( [] );

			expect( result ).toEqual( [] );
		} );

		test( 'should preserve plugin order', () => {
			const steps = [
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'jetpack',
					},
				},
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'akismet',
					},
				},
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'woocommerce',
					},
				},
			];

			const result = extractPluginSlugs( steps );

			expect( result ).toEqual( [ 'jetpack', 'akismet', 'woocommerce' ] );
		} );

		test( 'should not mutate input array', () => {
			const steps = [
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'akismet',
					},
				},
			];
			const originalLength = steps.length;

			extractPluginSlugs( steps );

			expect( steps ).toHaveLength( originalLength );
			expect( steps[ 0 ].pluginData.slug ).toBe( 'akismet' );
		} );
	} );

	describe( 'extractThemeSlugs()', () => {
		test( 'should extract theme slugs from WordPress.org theme steps', () => {
			const steps = [
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentyfour',
					},
				},
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentythree',
					},
				},
			];

			const result = extractThemeSlugs( steps );

			expect( result ).toEqual( [
				'twentytwentyfour',
				'twentytwentythree',
			] );
		} );

		test( 'should return empty array when no theme steps exist', () => {
			const steps = [
				{ step: 'importWordPressFiles' },
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'akismet',
					},
				},
			];

			const result = extractThemeSlugs( steps );

			expect( result ).toEqual( [] );
		} );

		test( 'should filter out non-WordPress.org theme steps', () => {
			const steps = [
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentyfour',
					},
				},
				{
					step: 'installTheme',
					themeData: {
						resource: 'bundled',
						slug: 'custom-theme',
					},
				},
			];

			const result = extractThemeSlugs( steps );

			expect( result ).toEqual( [ 'twentytwentyfour' ] );
		} );

		test( 'should filter out steps without themeData', () => {
			const steps = [
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentyfour',
					},
				},
				{
					step: 'installTheme',
				},
			];

			const result = extractThemeSlugs( steps );

			expect( result ).toEqual( [ 'twentytwentyfour' ] );
		} );

		test( 'should filter out steps without slug', () => {
			const steps = [
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentyfour',
					},
				},
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
					},
				},
			];

			const result = extractThemeSlugs( steps );

			expect( result ).toEqual( [ 'twentytwentyfour' ] );
		} );

		test( 'should handle empty array', () => {
			const result = extractThemeSlugs( [] );

			expect( result ).toEqual( [] );
		} );

		test( 'should preserve theme order', () => {
			const steps = [
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentyone',
					},
				},
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentytwo',
					},
				},
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentythree',
					},
				},
			];

			const result = extractThemeSlugs( steps );

			expect( result ).toEqual( [
				'twentytwentyone',
				'twentytwentytwo',
				'twentytwentythree',
			] );
		} );

		test( 'should not mutate input array', () => {
			const steps = [
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentyfour',
					},
				},
			];
			const originalLength = steps.length;

			extractThemeSlugs( steps );

			expect( steps ).toHaveLength( originalLength );
			expect( steps[ 0 ].themeData.slug ).toBe( 'twentytwentyfour' );
		} );
	} );

	describe( 'Integration Tests', () => {
		test( 'should work together to analyze a complete blueprint', () => {
			const steps = [
				{ step: 'importWordPressFiles' },
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'akismet',
					},
				},
				{
					step: 'installPlugin',
					pluginData: {
						resource: 'wordpress.org/plugins',
						slug: 'jetpack',
					},
				},
				{
					step: 'installTheme',
					themeData: {
						resource: 'wordpress.org/themes',
						slug: 'twentytwentyfour',
					},
				},
				{ step: 'activatePlugin' },
			];

			const counts = countStepsByType( steps );
			const plugins = extractPluginSlugs( steps );
			const themes = extractThemeSlugs( steps );

			expect( counts.installPlugin ).toBe( 2 );
			expect( counts.installTheme ).toBe( 1 );
			expect( plugins ).toHaveLength( 2 );
			expect( themes ).toHaveLength( 1 );
			expect( plugins ).toEqual( [ 'akismet', 'jetpack' ] );
			expect( themes ).toEqual( [ 'twentytwentyfour' ] );
		} );

		test( 'expected blueprint schema should have correct structure', () => {
			expect( expectedBlueprintSchema ).toHaveProperty( '$schema' );
			expect( expectedBlueprintSchema ).toHaveProperty( 'landingPage' );
			expect( expectedBlueprintSchema ).toHaveProperty(
				'preferredVersions'
			);
			expect( expectedBlueprintSchema ).toHaveProperty( 'features' );
			expect( expectedBlueprintSchema ).toHaveProperty( 'steps' );

			expect( expectedBlueprintSchema.$schema ).toContain(
				'playground.wordpress.net'
			);
			expect( expectedBlueprintSchema.landingPage ).toBe(
				'/wp-login.php'
			);
			expect( expectedBlueprintSchema.preferredVersions.php ).toBe(
				'8.4'
			);
			expect( expectedBlueprintSchema.preferredVersions.wp ).toBe(
				'latest'
			);
			expect( expectedBlueprintSchema.features.networking ).toBe( true );
			expect( Array.isArray( expectedBlueprintSchema.steps ) ).toBe(
				true
			);
		} );
	} );
} );
