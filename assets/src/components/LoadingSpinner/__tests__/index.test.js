/**
 * LoadingSpinner Component Tests
 *
 * Tests for the reusable loading indicator component.
 * Covers message display, styling, and CSS class handling.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import { render, screen } from '@testing-library/react';

// Mock WordPress components
jest.mock( '@wordpress/components', () => ( {
	Spinner: ( { className } ) => (
		<div data-testid="spinner" className={ className }>
			Loading...
		</div>
	),
} ) );

// Mock styles
jest.mock( '@altolith/utils/styles', () => ( {
	colors: { textSecondary: '#666' },
	spacing: { md: '12px', xl: '24px' },
	fontSize: { base: '14px' },
} ) );

import LoadingSpinner from '../index';

describe( 'LoadingSpinner', () => {
	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should render spinner', () => {
			render( <LoadingSpinner /> );

			expect( screen.getByTestId( 'spinner' ) ).toBeInTheDocument();
		} );

		test( 'should render with correct base class', () => {
			const { container } = render( <LoadingSpinner /> );

			expect(
				container.querySelector( '.altolith-loading-spinner' )
			).toBeInTheDocument();
		} );

		test( 'should render spinner with correct class', () => {
			render( <LoadingSpinner /> );

			const spinner = screen.getByTestId( 'spinner' );
			expect( spinner.className ).toContain(
				'altolith-loading-spinner__spinner'
			);
		} );
	} );

	// ============================================================
	// Message Display
	// ============================================================
	describe( 'message display', () => {
		test( 'should not render message by default', () => {
			const { container } = render( <LoadingSpinner /> );

			expect(
				container.querySelector( '.altolith-loading-spinner__message' )
			).not.toBeInTheDocument();
		} );

		test( 'should render message when provided', () => {
			render( <LoadingSpinner message="Loading data..." /> );

			expect( screen.getByText( 'Loading data...' ) ).toBeInTheDocument();
		} );

		test( 'should render message with correct class', () => {
			const { container } = render(
				<LoadingSpinner message="Loading..." />
			);

			const messageElement = container.querySelector(
				'.altolith-loading-spinner__message'
			);
			expect( messageElement ).toBeInTheDocument();
		} );

		test( 'should not render message when empty string', () => {
			const { container } = render( <LoadingSpinner message="" /> );

			expect(
				container.querySelector( '.altolith-loading-spinner__message' )
			).not.toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Custom Class Name
	// ============================================================
	describe( 'custom className', () => {
		test( 'should append custom className', () => {
			const { container } = render(
				<LoadingSpinner className="my-custom-spinner" />
			);

			const spinnerContainer = container.querySelector(
				'.altolith-loading-spinner'
			);
			expect( spinnerContainer.className ).toContain(
				'my-custom-spinner'
			);
		} );

		test( 'should handle empty className', () => {
			const { container } = render( <LoadingSpinner className="" /> );

			const spinnerContainer = container.querySelector(
				'.altolith-loading-spinner'
			);
			expect( spinnerContainer ).toBeInTheDocument();
		} );

		test( 'should trim className correctly', () => {
			const { container } = render( <LoadingSpinner /> );

			const spinnerContainer = container.querySelector(
				'.altolith-loading-spinner'
			);
			// Should not have trailing spaces
			expect( spinnerContainer.className.trim() ).toBe(
				spinnerContainer.className
			);
		} );
	} );

	// ============================================================
	// Custom Style
	// ============================================================
	describe( 'custom style', () => {
		test( 'should apply custom style', () => {
			const customStyle = { backgroundColor: 'red', minHeight: '100px' };
			const { container } = render(
				<LoadingSpinner style={ customStyle } />
			);

			const spinnerContainer = container.querySelector(
				'.altolith-loading-spinner'
			);
			expect( spinnerContainer ).toHaveStyle( {
				backgroundColor: 'red',
			} );
			expect( spinnerContainer ).toHaveStyle( { minHeight: '100px' } );
		} );

		test( 'should merge custom style with default style', () => {
			const { container } = render(
				<LoadingSpinner style={ { padding: '50px' } } />
			);

			const spinnerContainer = container.querySelector(
				'.altolith-loading-spinner'
			);
			// Should have both custom and default styles
			expect( spinnerContainer ).toHaveStyle( { padding: '50px' } );
			expect( spinnerContainer ).toHaveStyle( { display: 'flex' } );
		} );

		test( 'should allow overriding default styles', () => {
			const { container } = render(
				<LoadingSpinner style={ { display: 'block' } } />
			);

			const spinnerContainer = container.querySelector(
				'.altolith-loading-spinner'
			);
			expect( spinnerContainer ).toHaveStyle( { display: 'block' } );
		} );
	} );

	// ============================================================
	// Edge Cases
	// ============================================================
	describe( 'edge cases', () => {
		test( 'should handle undefined message', () => {
			const { container } = render(
				<LoadingSpinner message={ undefined } />
			);

			expect(
				container.querySelector( '.altolith-loading-spinner__message' )
			).not.toBeInTheDocument();
		} );

		test( 'should handle very long message', () => {
			const longMessage = 'Loading '.repeat( 50 );
			const { container } = render(
				<LoadingSpinner message={ longMessage } />
			);

			const messageEl = container.querySelector(
				'.altolith-loading-spinner__message'
			);
			expect( messageEl ).toBeInTheDocument();
			expect( messageEl.textContent ).toContain( 'Loading' );
		} );

		test( 'should handle empty style object', () => {
			const { container } = render( <LoadingSpinner style={ {} } /> );

			const spinnerContainer = container.querySelector(
				'.altolith-loading-spinner'
			);
			expect( spinnerContainer ).toBeInTheDocument();
			// Should still have default styles
			expect( spinnerContainer ).toHaveStyle( { display: 'flex' } );
		} );

		test( 'should render without any props', () => {
			const { container } = render( <LoadingSpinner /> );

			expect(
				container.querySelector( '.altolith-loading-spinner' )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'spinner' ) ).toBeInTheDocument();
		} );
	} );
} );
