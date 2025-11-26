/**
 * StepNode Component Tests
 *
 * Tests for the StepNode component that renders individual step circles
 * in the horizontal stepper.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StepNode } from '../StepNode';

// Mock WordPress components
jest.mock( '@wordpress/components', () => ( {
	Spinner: () => <span data-testid="spinner">Loading...</span>,
	Tooltip: ( { children, text } ) => (
		<div data-testid="tooltip" data-tooltip-text={ text }>
			{ children }
		</div>
	),
} ) );

// Mock styles
jest.mock( '@aether/utils/styles', () => ( {
	colors: {
		primary: '#0073aa',
		success: '#00a32a',
		error: '#d63638',
		white: '#ffffff',
		textMuted: '#757575',
		borderLighter: '#e0e0e0',
		backgroundInfo: '#f0f6fc',
	},
	fontSize: {
		xs: '11px',
	},
	fontWeight: {
		bold: 700,
	},
} ) );

describe( 'StepNode', () => {
	describe( 'Rendering', () => {
		test( 'should render with pending status and show step number', () => {
			render(
				<StepNode stepNumber={ 1 } label="Test Step" status="pending" />
			);

			const node = screen.getByRole( 'listitem' );
			expect( node ).toBeInTheDocument();
			expect( node ).toHaveTextContent( '1' );
		} );

		test( 'should render with active status and show spinner', () => {
			render(
				<StepNode
					stepNumber={ 2 }
					label="Active Step"
					status="active"
				/>
			);

			expect( screen.getByTestId( 'spinner' ) ).toBeInTheDocument();
		} );

		test( 'should render with complete status and show checkmark', () => {
			render(
				<StepNode
					stepNumber={ 3 }
					label="Complete Step"
					status="complete"
				/>
			);

			const node = screen.getByRole( 'listitem' );
			expect( node ).toHaveTextContent( '✓' );
		} );

		test( 'should render with error status and show X', () => {
			render(
				<StepNode stepNumber={ 4 } label="Error Step" status="error" />
			);

			const node = screen.getByRole( 'listitem' );
			expect( node ).toHaveTextContent( '✗' );
		} );
	} );

	describe( 'Accessibility', () => {
		test( 'should have appropriate aria-label', () => {
			render(
				<StepNode
					stepNumber={ 1 }
					label="Scanning Pages"
					status="active"
				/>
			);

			const node = screen.getByRole( 'listitem' );
			expect( node ).toHaveAttribute(
				'aria-label',
				'Step 1: Scanning Pages - active'
			);
		} );

		test( 'should wrap in tooltip with step label', () => {
			render(
				<StepNode
					stepNumber={ 1 }
					label="Processing Assets"
					status="pending"
				/>
			);

			const tooltip = screen.getByTestId( 'tooltip' );
			expect( tooltip ).toHaveAttribute(
				'data-tooltip-text',
				'Processing Assets'
			);
		} );
	} );

	describe( 'CSS Classes', () => {
		test( 'should have base class and status-specific class for pending', () => {
			render(
				<StepNode stepNumber={ 1 } label="Test" status="pending" />
			);

			const node = screen.getByRole( 'listitem' );
			expect( node ).toHaveClass( 'aether-step-node' );
			expect( node ).toHaveClass( 'aether-step-node--pending' );
		} );

		test( 'should have base class and status-specific class for active', () => {
			render(
				<StepNode stepNumber={ 1 } label="Test" status="active" />
			);

			const node = screen.getByRole( 'listitem' );
			expect( node ).toHaveClass( 'aether-step-node' );
			expect( node ).toHaveClass( 'aether-step-node--active' );
		} );

		test( 'should have base class and status-specific class for complete', () => {
			render(
				<StepNode stepNumber={ 1 } label="Test" status="complete" />
			);

			const node = screen.getByRole( 'listitem' );
			expect( node ).toHaveClass( 'aether-step-node' );
			expect( node ).toHaveClass( 'aether-step-node--complete' );
		} );

		test( 'should have base class and status-specific class for error', () => {
			render( <StepNode stepNumber={ 1 } label="Test" status="error" /> );

			const node = screen.getByRole( 'listitem' );
			expect( node ).toHaveClass( 'aether-step-node' );
			expect( node ).toHaveClass( 'aether-step-node--error' );
		} );
	} );

	describe( 'Step Numbers', () => {
		test( 'should display correct step number', () => {
			render(
				<StepNode stepNumber={ 5 } label="Step Five" status="pending" />
			);

			const node = screen.getByRole( 'listitem' );
			expect( node ).toHaveTextContent( '5' );
		} );

		test( 'should handle double-digit step numbers', () => {
			render(
				<StepNode stepNumber={ 10 } label="Step Ten" status="pending" />
			);

			const node = screen.getByRole( 'listitem' );
			expect( node ).toHaveTextContent( '10' );
		} );
	} );

	describe( 'Edge Cases', () => {
		test( 'should handle empty label', () => {
			render( <StepNode stepNumber={ 1 } label="" status="pending" /> );

			const tooltip = screen.getByTestId( 'tooltip' );
			expect( tooltip ).toHaveAttribute( 'data-tooltip-text', '' );
		} );

		test( 'should handle unknown status as pending (default)', () => {
			render(
				<StepNode
					stepNumber={ 1 }
					label="Test"
					status="unknown-status"
				/>
			);

			const node = screen.getByRole( 'listitem' );
			// Should show step number (pending behavior)
			expect( node ).toHaveTextContent( '1' );
		} );
	} );
} );
