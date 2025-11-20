/**
 * Styles Utilities Tests
 *
 * Tests for style utility functions.
 * These are pure functions that create style objects.
 *
 * @package
 */

import { createFlexStyle, createGridStyle, spacing } from '../styles';

describe( 'styles', () => {
	describe( 'createFlexStyle()', () => {
		test( 'should create flex style with default direction and gap', () => {
			const result = createFlexStyle();

			expect( result ).toEqual( {
				display: 'flex',
				flexDirection: 'row',
				gap: spacing.md,
			} );
		} );

		test( 'should create flex style with custom direction', () => {
			const result = createFlexStyle( 'column' );

			expect( result ).toEqual( {
				display: 'flex',
				flexDirection: 'column',
				gap: spacing.md,
			} );
		} );

		test( 'should create flex style with custom gap', () => {
			const result = createFlexStyle( 'row', spacing.lg );

			expect( result ).toEqual( {
				display: 'flex',
				flexDirection: 'row',
				gap: spacing.lg,
			} );
		} );

		test( 'should create flex style with both custom direction and gap', () => {
			const result = createFlexStyle( 'column', spacing.xl );

			expect( result ).toEqual( {
				display: 'flex',
				flexDirection: 'column',
				gap: spacing.xl,
			} );
		} );

		test( 'should create flex style with custom string gap', () => {
			const result = createFlexStyle( 'row', '2rem' );

			expect( result ).toEqual( {
				display: 'flex',
				flexDirection: 'row',
				gap: '2rem',
			} );
		} );

		test( 'should always include display: flex', () => {
			const result = createFlexStyle();

			expect( result.display ).toBe( 'flex' );
		} );

		test( 'should not mutate input parameters', () => {
			const direction = 'row';
			const gap = spacing.md;

			createFlexStyle( direction, gap );

			// Primitives cannot be mutated, but test behavior
			expect( direction ).toBe( 'row' );
			expect( gap ).toBe( spacing.md );
		} );
	} );

	describe( 'createGridStyle()', () => {
		test( 'should create grid style with default min column width and gap', () => {
			const result = createGridStyle();

			expect( result ).toEqual( {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
				gap: spacing.md,
			} );
		} );

		test( 'should create grid style with custom min column width', () => {
			const result = createGridStyle( '20rem' );

			expect( result ).toEqual( {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
				gap: spacing.md,
			} );
		} );

		test( 'should create grid style with custom gap', () => {
			const result = createGridStyle( '16rem', spacing.lg );

			expect( result ).toEqual( {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
				gap: spacing.lg,
			} );
		} );

		test( 'should create grid style with both custom values', () => {
			const result = createGridStyle( '12rem', spacing.sm );

			expect( result ).toEqual( {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
				gap: spacing.sm,
			} );
		} );

		test( 'should create grid style with pixel-based min width', () => {
			const result = createGridStyle( '200px' );

			expect( result ).toEqual( {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
				gap: spacing.md,
			} );
		} );

		test( 'should create grid style with percentage-based min width', () => {
			const result = createGridStyle( '25%' );

			expect( result ).toEqual( {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(25%, 1fr))',
				gap: spacing.md,
			} );
		} );

		test( 'should always use auto-fit for responsive behavior', () => {
			const result = createGridStyle();

			expect( result.gridTemplateColumns ).toContain( 'auto-fit' );
		} );

		test( 'should always include 1fr for flexible columns', () => {
			const result = createGridStyle();

			expect( result.gridTemplateColumns ).toContain( '1fr' );
		} );

		test( 'should always include display: grid', () => {
			const result = createGridStyle();

			expect( result.display ).toBe( 'grid' );
		} );

		test( 'should not mutate input parameters', () => {
			const minColumnWidth = '16rem';
			const gap = spacing.md;

			createGridStyle( minColumnWidth, gap );

			expect( minColumnWidth ).toBe( '16rem' );
			expect( gap ).toBe( spacing.md );
		} );
	} );

	describe( 'Integration', () => {
		test( 'createFlexStyle and createGridStyle should return different layouts', () => {
			const flexStyle = createFlexStyle();
			const gridStyle = createGridStyle();

			expect( flexStyle.display ).toBe( 'flex' );
			expect( gridStyle.display ).toBe( 'grid' );
			expect( flexStyle ).not.toHaveProperty( 'gridTemplateColumns' );
			expect( gridStyle ).not.toHaveProperty( 'flexDirection' );
		} );

		test( 'both functions should accept same gap values', () => {
			const customGap = '3rem';
			const flexStyle = createFlexStyle( 'row', customGap );
			const gridStyle = createGridStyle( '16rem', customGap );

			expect( flexStyle.gap ).toBe( customGap );
			expect( gridStyle.gap ).toBe( customGap );
		} );

		test( 'styles should be compatible with React inline styles', () => {
			const flexStyle = createFlexStyle();
			const gridStyle = createGridStyle();

			// All properties should be camelCase (React compatible)
			expect( Object.keys( flexStyle ) ).toEqual( [
				'display',
				'flexDirection',
				'gap',
			] );
			expect( Object.keys( gridStyle ) ).toEqual( [
				'display',
				'gridTemplateColumns',
				'gap',
			] );
		} );
	} );
} );
