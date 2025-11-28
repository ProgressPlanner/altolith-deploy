/**
 * StatusNotice Component Tests
 *
 * Tests for the reusable notice/alert component.
 * Covers status types, dismissibility, and CSS class generation.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import { render, screen, fireEvent } from '@testing-library/react';

// Mock WordPress components
jest.mock( '@wordpress/components', () => ( {
	Notice: ( { children, className, status, isDismissible, onRemove } ) => (
		<div
			data-testid="notice"
			className={ className }
			data-status={ status }
			data-dismissible={ isDismissible }
		>
			{ children }
			{ isDismissible && onRemove && (
				<button onClick={ onRemove } data-testid="dismiss-button">
					Dismiss
				</button>
			) }
		</div>
	),
} ) );

import StatusNotice from '../index';

describe( 'StatusNotice', () => {
	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should render notice with message', () => {
			render( <StatusNotice message="Test message" /> );

			expect( screen.getByText( 'Test message' ) ).toBeInTheDocument();
		} );

		test( 'should render with correct base class', () => {
			render( <StatusNotice message="Test" /> );

			const notice = screen.getByTestId( 'notice' );
			expect( notice.className ).toContain( 'altolith-status-notice' );
		} );

		test( 'should pass status to Notice component', () => {
			render( <StatusNotice message="Test" status="success" /> );

			const notice = screen.getByTestId( 'notice' );
			expect( notice ).toHaveAttribute( 'data-status', 'success' );
		} );
	} );

	// ============================================================
	// Status Types
	// ============================================================
	describe( 'status types', () => {
		test( 'should default to info status', () => {
			render( <StatusNotice message="Test" /> );

			const notice = screen.getByTestId( 'notice' );
			expect( notice ).toHaveAttribute( 'data-status', 'info' );
			expect( notice.className ).toContain(
				'altolith-status-notice--info'
			);
		} );

		test( 'should render success status', () => {
			render( <StatusNotice message="Success!" status="success" /> );

			const notice = screen.getByTestId( 'notice' );
			expect( notice ).toHaveAttribute( 'data-status', 'success' );
			expect( notice.className ).toContain(
				'altolith-status-notice--success'
			);
		} );

		test( 'should render error status', () => {
			render( <StatusNotice message="Error!" status="error" /> );

			const notice = screen.getByTestId( 'notice' );
			expect( notice ).toHaveAttribute( 'data-status', 'error' );
			expect( notice.className ).toContain(
				'altolith-status-notice--error'
			);
		} );

		test( 'should render warning status', () => {
			render( <StatusNotice message="Warning!" status="warning" /> );

			const notice = screen.getByTestId( 'notice' );
			expect( notice ).toHaveAttribute( 'data-status', 'warning' );
			expect( notice.className ).toContain(
				'altolith-status-notice--warning'
			);
		} );
	} );

	// ============================================================
	// Dismissibility
	// ============================================================
	describe( 'dismissibility', () => {
		test( 'should be dismissible by default', () => {
			render( <StatusNotice message="Test" /> );

			const notice = screen.getByTestId( 'notice' );
			expect( notice ).toHaveAttribute( 'data-dismissible', 'true' );
		} );

		test( 'should not be dismissible when isDismissible is false', () => {
			render( <StatusNotice message="Test" isDismissible={ false } /> );

			const notice = screen.getByTestId( 'notice' );
			expect( notice ).toHaveAttribute( 'data-dismissible', 'false' );
		} );

		test( 'should call onDismiss when dismissed', () => {
			const mockOnDismiss = jest.fn();

			render(
				<StatusNotice
					message="Test"
					isDismissible
					onDismiss={ mockOnDismiss }
				/>
			);

			fireEvent.click( screen.getByTestId( 'dismiss-button' ) );

			expect( mockOnDismiss ).toHaveBeenCalled();
		} );

		test( 'should render dismiss button when dismissible with handler', () => {
			const mockOnDismiss = jest.fn();

			render(
				<StatusNotice
					message="Test"
					isDismissible
					onDismiss={ mockOnDismiss }
				/>
			);

			expect(
				screen.getByTestId( 'dismiss-button' )
			).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Custom Class Name
	// ============================================================
	describe( 'custom className', () => {
		test( 'should append custom className', () => {
			render(
				<StatusNotice message="Test" className="my-custom-class" />
			);

			const notice = screen.getByTestId( 'notice' );
			expect( notice.className ).toContain( 'altolith-status-notice' );
			expect( notice.className ).toContain( 'my-custom-class' );
		} );

		test( 'should handle empty className', () => {
			render( <StatusNotice message="Test" className="" /> );

			const notice = screen.getByTestId( 'notice' );
			expect( notice.className ).toContain( 'altolith-status-notice' );
		} );

		test( 'should trim className correctly', () => {
			render( <StatusNotice message="Test" /> );

			const notice = screen.getByTestId( 'notice' );
			// Should not have trailing spaces
			expect( notice.className.trim() ).toBe( notice.className );
		} );
	} );

	// ============================================================
	// Edge Cases
	// ============================================================
	describe( 'edge cases', () => {
		test( 'should handle empty message', () => {
			render( <StatusNotice message="" /> );

			// Should render without throwing
			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
		} );

		test( 'should handle undefined message', () => {
			render( <StatusNotice /> );

			// Should render without throwing
			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
		} );

		test( 'should handle very long message', () => {
			const longMessage = 'A'.repeat( 500 );
			render( <StatusNotice message={ longMessage } /> );

			expect( screen.getByText( longMessage ) ).toBeInTheDocument();
		} );

		test( 'should handle HTML entities in message', () => {
			render( <StatusNotice message="Test &amp; message" /> );

			expect( screen.getByText( 'Test & message' ) ).toBeInTheDocument();
		} );

		test( 'should handle null onDismiss gracefully', () => {
			// Should not throw when onDismiss is null
			render( <StatusNotice message="Test" onDismiss={ null } /> );

			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
		} );
	} );
} );
