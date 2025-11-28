/**
 * ProgressBar Component Tests
 *
 * Tests for progress bar rendering, accessibility, and edge cases.
 * ProgressBar displays a native HTML progress element with percentage calculations.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import { render, screen } from '@testing-library/react';

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => {
		let result = format;
		// Replace %% with placeholder, then restore after substitutions
		result = result.replace( /%%/g, '\x00PERCENT\x00' );
		args.forEach( ( arg ) => {
			result = result.replace( /%\d?\$?[sd]/, arg );
		} );
		result = result.replace( /\x00PERCENT\x00/g, '%' );
		return result;
	},
} ) );

// Mock styles
jest.mock( '@altolith/utils/styles', () => ( {
	colors: { textMuted: '#666' },
	spacing: { xs: '4px' },
	fontSize: { sm: '12px' },
} ) );

import { ProgressBar } from '../index';

describe( 'ProgressBar', () => {
	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should render progress element with correct values', () => {
			render(
				<ProgressBar
					progress={ { current: 50, total: 100 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toBeInTheDocument();
			expect( progressElement ).toHaveAttribute( 'max', '100' );
			expect( progressElement ).toHaveAttribute( 'value', '50' );
		} );

		test( 'should render container with correct class', () => {
			const { container } = render(
				<ProgressBar
					progress={ { current: 25, total: 100 } }
					height={ 10 }
				/>
			);

			expect(
				container.querySelector( '.altolith-progress-bar' )
			).toBeInTheDocument();
		} );

		test( 'should render description when provided', () => {
			render(
				<ProgressBar
					progress={ { current: 50, total: 100 } }
					height={ 20 }
					description="Uploading files..."
				/>
			);

			expect(
				screen.getByText( 'Uploading files...' )
			).toBeInTheDocument();
		} );

		test( 'should not render description when not provided', () => {
			const { container } = render(
				<ProgressBar
					progress={ { current: 50, total: 100 } }
					height={ 20 }
				/>
			);

			expect(
				container.querySelector( '.altolith-progress-bar__description' )
			).not.toBeInTheDocument();
		} );

		test( 'should apply height style to progress element', () => {
			render(
				<ProgressBar
					progress={ { current: 50, total: 100 } }
					height={ 15 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveStyle( { height: '15px' } );
		} );
	} );

	// ============================================================
	// Accessibility
	// ============================================================
	describe( 'accessibility', () => {
		test( 'should have aria-valuenow attribute', () => {
			render(
				<ProgressBar
					progress={ { current: 30, total: 100 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute( 'aria-valuenow', '30' );
		} );

		test( 'should have aria-valuemin of 0', () => {
			render(
				<ProgressBar
					progress={ { current: 30, total: 100 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute( 'aria-valuemin', '0' );
		} );

		test( 'should have aria-valuemax matching total', () => {
			render(
				<ProgressBar
					progress={ { current: 30, total: 200 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute( 'aria-valuemax', '200' );
		} );

		test( 'should use description as aria-label when provided', () => {
			render(
				<ProgressBar
					progress={ { current: 50, total: 100 } }
					height={ 20 }
					description="Processing images"
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute(
				'aria-label',
				'Processing images'
			);
		} );

		test( 'should use percentage as aria-label when no description', () => {
			render(
				<ProgressBar
					progress={ { current: 50, total: 100 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute(
				'aria-label',
				'Progress: 50%'
			);
		} );
	} );

	// ============================================================
	// Percentage Calculation Edge Cases
	// ============================================================
	describe( 'percentage calculation', () => {
		test( 'should calculate 0% when current is 0', () => {
			render(
				<ProgressBar
					progress={ { current: 0, total: 100 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute(
				'aria-label',
				'Progress: 0%'
			);
		} );

		test( 'should calculate 100% when current equals total', () => {
			render(
				<ProgressBar
					progress={ { current: 100, total: 100 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute(
				'aria-label',
				'Progress: 100%'
			);
		} );

		test( 'should handle 0 total without division error', () => {
			// This is the critical edge case - division by zero
			render(
				<ProgressBar
					progress={ { current: 0, total: 0 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			// Should show 0% rather than NaN or Infinity
			expect( progressElement ).toHaveAttribute(
				'aria-label',
				'Progress: 0%'
			);
		} );

		test( 'should round percentage to whole number', () => {
			// 33/100 = 33%
			render(
				<ProgressBar
					progress={ { current: 33, total: 100 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute(
				'aria-label',
				'Progress: 33%'
			);
		} );

		test( 'should round up at 0.5', () => {
			// 1/3 = 33.33...% -> rounds to 33%
			render(
				<ProgressBar
					progress={ { current: 1, total: 3 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute(
				'aria-label',
				'Progress: 33%'
			);
		} );

		test( 'should handle current greater than total', () => {
			// Edge case: current > total (shouldn't happen but should handle gracefully)
			render(
				<ProgressBar
					progress={ { current: 150, total: 100 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			// Shows 150% - the component doesn't clamp
			expect( progressElement ).toHaveAttribute(
				'aria-label',
				'Progress: 150%'
			);
		} );

		test( 'should handle negative current gracefully', () => {
			// Edge case: negative values (shouldn't happen)
			render(
				<ProgressBar
					progress={ { current: -10, total: 100 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			// Shows -10%
			expect( progressElement ).toHaveAttribute(
				'aria-label',
				'Progress: -10%'
			);
		} );

		test( 'should handle large numbers', () => {
			render(
				<ProgressBar
					progress={ { current: 5000000, total: 10000000 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute(
				'aria-label',
				'Progress: 50%'
			);
		} );
	} );

	// ============================================================
	// Progress Values
	// ============================================================
	describe( 'progress values', () => {
		test( 'should pass current and total to progress element', () => {
			render(
				<ProgressBar
					progress={ { current: 75, total: 300 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute( 'value', '75' );
			expect( progressElement ).toHaveAttribute( 'max', '300' );
		} );

		test( 'should handle decimal current values', () => {
			render(
				<ProgressBar
					progress={ { current: 33.5, total: 100 } }
					height={ 20 }
				/>
			);

			const progressElement = screen.getByRole( 'progressbar' );
			expect( progressElement ).toHaveAttribute( 'value', '33.5' );
		} );
	} );
} );
