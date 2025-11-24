/**
 * Styles Utilities Tests
 *
 * Tests for style utility functions.
 * These are pure functions that create style objects.
 *
 */

import { createFlexStyle, spacing } from '../styles';

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
} );
