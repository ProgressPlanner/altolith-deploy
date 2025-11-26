/**
 * ModalActions Component Tests
 *
 * Tests for the reusable modal footer actions component.
 * Covers button rendering, disabled states, and click handlers.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import { render, screen, fireEvent } from '@testing-library/react';

// Mock WordPress components
jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick, disabled, isBusy, variant, className } ) => (
		<button
			onClick={ onClick }
			disabled={ disabled }
			data-busy={ isBusy }
			data-variant={ variant }
			className={ className }
		>
			{ children }
		</button>
	),
} ) );

// Mock styles
jest.mock( '@aether/utils/styles', () => ( {
	spacing: { sm: '8px', lg: '16px' },
} ) );

import ModalActions from '../index';

describe( 'ModalActions', () => {
	const defaultProps = {
		onCancel: jest.fn(),
		onSubmit: jest.fn(),
		cancelLabel: 'Cancel',
		submitLabel: 'Submit',
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should render cancel and submit buttons', () => {
			render( <ModalActions { ...defaultProps } /> );

			expect( screen.getByText( 'Cancel' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Submit' ) ).toBeInTheDocument();
		} );

		test( 'should render with correct base class', () => {
			const { container } = render(
				<ModalActions { ...defaultProps } />
			);

			expect(
				container.querySelector( '.aether-modal-actions' )
			).toBeInTheDocument();
		} );

		test( 'should render custom labels', () => {
			render(
				<ModalActions
					{ ...defaultProps }
					cancelLabel="Go Back"
					submitLabel="Confirm"
				/>
			);

			expect( screen.getByText( 'Go Back' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Confirm' ) ).toBeInTheDocument();
		} );

		test( 'should render submit button with primary variant by default', () => {
			render( <ModalActions { ...defaultProps } /> );

			const submitButton = screen.getByText( 'Submit' );
			expect( submitButton ).toHaveAttribute( 'data-variant', 'primary' );
		} );

		test( 'should render cancel button with secondary variant', () => {
			render( <ModalActions { ...defaultProps } /> );

			const cancelButton = screen.getByText( 'Cancel' );
			expect( cancelButton ).toHaveAttribute(
				'data-variant',
				'secondary'
			);
		} );
	} );

	// ============================================================
	// Button Visibility
	// ============================================================
	describe( 'button visibility', () => {
		test( 'should not render cancel button when onCancel is null', () => {
			render( <ModalActions { ...defaultProps } onCancel={ null } /> );

			expect( screen.queryByText( 'Cancel' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Submit' ) ).toBeInTheDocument();
		} );

		test( 'should not render submit button when onSubmit is null', () => {
			render( <ModalActions { ...defaultProps } onSubmit={ null } /> );

			expect( screen.getByText( 'Cancel' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Submit' ) ).not.toBeInTheDocument();
		} );

		test( 'should not render cancel button when onCancel is undefined', () => {
			render(
				<ModalActions
					onSubmit={ defaultProps.onSubmit }
					submitLabel="Submit"
				/>
			);

			expect( screen.queryByText( 'Cancel' ) ).not.toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Click Handlers
	// ============================================================
	describe( 'click handlers', () => {
		test( 'should call onCancel when cancel button is clicked', () => {
			const mockOnCancel = jest.fn();

			render(
				<ModalActions { ...defaultProps } onCancel={ mockOnCancel } />
			);

			fireEvent.click( screen.getByText( 'Cancel' ) );

			expect( mockOnCancel ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should call onSubmit when submit button is clicked', () => {
			const mockOnSubmit = jest.fn();

			render(
				<ModalActions { ...defaultProps } onSubmit={ mockOnSubmit } />
			);

			fireEvent.click( screen.getByText( 'Submit' ) );

			expect( mockOnSubmit ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	// ============================================================
	// Disabled States
	// ============================================================
	describe( 'disabled states', () => {
		test( 'should disable submit button when submitDisabled is true', () => {
			render( <ModalActions { ...defaultProps } submitDisabled /> );

			expect( screen.getByText( 'Submit' ) ).toBeDisabled();
		} );

		test( 'should disable submit button when isSubmitting is true', () => {
			render( <ModalActions { ...defaultProps } isSubmitting /> );

			expect( screen.getByText( 'Submit' ) ).toBeDisabled();
		} );

		test( 'should disable cancel button when isSubmitting is true', () => {
			render( <ModalActions { ...defaultProps } isSubmitting /> );

			expect( screen.getByText( 'Cancel' ) ).toBeDisabled();
		} );

		test( 'should show busy state on submit when isSubmitting is true', () => {
			render( <ModalActions { ...defaultProps } isSubmitting /> );

			const submitButton = screen.getByText( 'Submit' );
			expect( submitButton ).toHaveAttribute( 'data-busy', 'true' );
		} );

		test( 'should disable submit when both submitDisabled and isSubmitting are true', () => {
			render(
				<ModalActions { ...defaultProps } submitDisabled isSubmitting />
			);

			expect( screen.getByText( 'Submit' ) ).toBeDisabled();
		} );
	} );

	// ============================================================
	// Submit Variant
	// ============================================================
	describe( 'submit variant', () => {
		test( 'should use custom submit variant', () => {
			render(
				<ModalActions { ...defaultProps } submitVariant="secondary" />
			);

			const submitButton = screen.getByText( 'Submit' );
			expect( submitButton ).toHaveAttribute(
				'data-variant',
				'secondary'
			);
		} );

		test( 'should support tertiary variant', () => {
			render(
				<ModalActions { ...defaultProps } submitVariant="tertiary" />
			);

			const submitButton = screen.getByText( 'Submit' );
			expect( submitButton ).toHaveAttribute(
				'data-variant',
				'tertiary'
			);
		} );
	} );

	// ============================================================
	// Children
	// ============================================================
	describe( 'children', () => {
		test( 'should render children before buttons', () => {
			const { container } = render(
				<ModalActions { ...defaultProps }>
					<span data-testid="custom-child">Custom Action</span>
				</ModalActions>
			);

			expect( screen.getByTestId( 'custom-child' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Custom Action' ) ).toBeInTheDocument();

			// Verify order: children should come before buttons
			const actionsContainer = container.querySelector(
				'.aether-modal-actions'
			);
			const children = Array.from( actionsContainer.children );
			expect( children[ 0 ].getAttribute( 'data-testid' ) ).toBe(
				'custom-child'
			);
		} );

		test( 'should render multiple children', () => {
			render(
				<ModalActions { ...defaultProps }>
					<button data-testid="extra-1">Extra 1</button>
					<button data-testid="extra-2">Extra 2</button>
				</ModalActions>
			);

			expect( screen.getByTestId( 'extra-1' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'extra-2' ) ).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Custom Class Name
	// ============================================================
	describe( 'custom className', () => {
		test( 'should append custom className', () => {
			const { container } = render(
				<ModalActions
					{ ...defaultProps }
					className="my-custom-actions"
				/>
			);

			const actionsDiv = container.querySelector(
				'.aether-modal-actions'
			);
			expect( actionsDiv.className ).toContain( 'my-custom-actions' );
		} );
	} );

	// ============================================================
	// Default Values
	// ============================================================
	describe( 'default values', () => {
		test( 'should use default cancel label', () => {
			render(
				<ModalActions
					onCancel={ defaultProps.onCancel }
					onSubmit={ defaultProps.onSubmit }
				/>
			);

			expect( screen.getByText( 'Cancel' ) ).toBeInTheDocument();
		} );

		test( 'should use default submit label', () => {
			render(
				<ModalActions
					onCancel={ defaultProps.onCancel }
					onSubmit={ defaultProps.onSubmit }
				/>
			);

			expect( screen.getByText( 'Submit' ) ).toBeInTheDocument();
		} );

		test( 'should default isSubmitting to false', () => {
			render(
				<ModalActions
					onCancel={ defaultProps.onCancel }
					onSubmit={ defaultProps.onSubmit }
				/>
			);

			const submitButton = screen.getByText( 'Submit' );
			expect( submitButton ).not.toBeDisabled();
			expect( submitButton ).toHaveAttribute( 'data-busy', 'false' );
		} );

		test( 'should default submitDisabled to false', () => {
			render(
				<ModalActions
					onCancel={ defaultProps.onCancel }
					onSubmit={ defaultProps.onSubmit }
				/>
			);

			const submitButton = screen.getByText( 'Submit' );
			expect( submitButton ).not.toBeDisabled();
		} );
	} );
} );
