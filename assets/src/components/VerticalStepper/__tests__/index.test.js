/**
 * VerticalStepper Component Tests
 *
 * Tests for the stepper component that displays export progress
 * in a vertical layout with step nodes and connectors.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { VerticalStepper } from '..';

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

// Mock child components to simplify testing
jest.mock( '@aether/components/StepNode', () => ( {
	StepNode: ( { stepNumber, label, status, statusLabels, statusData } ) => (
		<span
			data-testid={ `step-node-${ stepNumber }` }
			data-status={ status }
			data-label={ label }
			data-has-status-labels={ statusLabels ? 'true' : 'false' }
			data-status-data={ JSON.stringify( statusData || {} ) }
		>
			Step { stepNumber }
		</span>
	),
} ) );

jest.mock( '@aether/components/StepConnector', () => ( {
	StepConnector: ( { isComplete } ) => (
		<span
			data-testid="step-connector"
			data-complete={ isComplete ? 'true' : 'false' }
		>
			---
		</span>
	),
} ) );

// Mock styles
jest.mock( '@aether/utils/styles', () => ( {
	colors: {
		primary: '#0073aa',
		textMuted: '#757575',
		backgroundInfo: '#f0f6fc',
	},
	spacing: {
		xs: '4px',
		sm: '8px',
		md: '16px',
		lg: '24px',
	},
	borderRadius: {
		md: '6px',
	},
	fontSize: {
		xs: '11px',
		sm: '13px',
	},
	fontWeight: {
		medium: 500,
	},
} ) );

const defaultSteps = [
	{ id: 'step1', label: 'Step 1', status: 'complete' },
	{ id: 'step2', label: 'Step 2', status: 'active' },
	{ id: 'step3', label: 'Step 3', status: 'pending' },
];

describe( 'VerticalStepper', () => {
	describe( 'Rendering', () => {
		test( 'should render all steps', () => {
			render( <VerticalStepper steps={ defaultSteps } /> );

			expect( screen.getByTestId( 'step-node-1' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'step-node-2' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'step-node-3' ) ).toBeInTheDocument();
		} );

		test( 'should render connectors between steps (not after last)', () => {
			render( <VerticalStepper steps={ defaultSteps } /> );

			const connectors = screen.getAllByTestId( 'step-connector' );
			// 3 steps = 2 connectors
			expect( connectors ).toHaveLength( 2 );
		} );

		test( 'should not render connector after last step', () => {
			const singleStep = [
				{ id: 'only', label: 'Only', status: 'active' },
			];

			render( <VerticalStepper steps={ singleStep } /> );

			expect(
				screen.queryByTestId( 'step-connector' )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'Accessibility', () => {
		test( 'should have list role with aria-label', () => {
			render( <VerticalStepper steps={ defaultSteps } /> );

			const container = screen.getByRole( 'list' );
			expect( container ).toHaveAttribute(
				'aria-label',
				'Export progress'
			);
		} );

		test( 'should have appropriate CSS class', () => {
			render( <VerticalStepper steps={ defaultSteps } /> );

			const container = screen.getByRole( 'list' );
			expect( container ).toHaveClass( 'aether-vertical-stepper' );
		} );
	} );

	describe( 'Step Props', () => {
		test( 'should pass correct status to each StepNode', () => {
			render( <VerticalStepper steps={ defaultSteps } /> );

			expect( screen.getByTestId( 'step-node-1' ) ).toHaveAttribute(
				'data-status',
				'complete'
			);
			expect( screen.getByTestId( 'step-node-2' ) ).toHaveAttribute(
				'data-status',
				'active'
			);
			expect( screen.getByTestId( 'step-node-3' ) ).toHaveAttribute(
				'data-status',
				'pending'
			);
		} );

		test( 'should pass step label to StepNode', () => {
			render( <VerticalStepper steps={ defaultSteps } /> );

			expect( screen.getByTestId( 'step-node-1' ) ).toHaveAttribute(
				'data-label',
				'Step 1'
			);
			expect( screen.getByTestId( 'step-node-2' ) ).toHaveAttribute(
				'data-label',
				'Step 2'
			);
			expect( screen.getByTestId( 'step-node-3' ) ).toHaveAttribute(
				'data-label',
				'Step 3'
			);
		} );

		test( 'should pass statusLabels to StepNode when provided', () => {
			const stepsWithLabels = [
				{
					id: 'step1',
					label: 'Step 1',
					status: 'complete',
					statusLabels: { pending: 'Pending', complete: 'Done' },
				},
			];

			render( <VerticalStepper steps={ stepsWithLabels } /> );

			expect( screen.getByTestId( 'step-node-1' ) ).toHaveAttribute(
				'data-has-status-labels',
				'true'
			);
		} );

		test( 'should pass statusData to StepNode when provided', () => {
			const stepsWithData = [
				{
					id: 'step1',
					label: 'Step 1',
					status: 'complete',
					statusData: { count: 5 },
				},
			];

			render( <VerticalStepper steps={ stepsWithData } /> );

			expect( screen.getByTestId( 'step-node-1' ) ).toHaveAttribute(
				'data-status-data',
				JSON.stringify( { count: 5 } )
			);
		} );
	} );

	describe( 'Connector States', () => {
		test( 'should mark connector as complete when preceding step is complete', () => {
			render( <VerticalStepper steps={ defaultSteps } /> );

			const connectors = screen.getAllByTestId( 'step-connector' );
			// First connector (after complete step 1)
			expect( connectors[ 0 ] ).toHaveAttribute(
				'data-complete',
				'true'
			);
			// Second connector (after active step 2)
			expect( connectors[ 1 ] ).toHaveAttribute(
				'data-complete',
				'false'
			);
		} );

		test( 'should mark all connectors incomplete when no steps complete', () => {
			const allPending = [
				{ id: 'step1', label: 'Step 1', status: 'pending' },
				{ id: 'step2', label: 'Step 2', status: 'pending' },
				{ id: 'step3', label: 'Step 3', status: 'pending' },
			];

			render( <VerticalStepper steps={ allPending } /> );

			const connectors = screen.getAllByTestId( 'step-connector' );
			connectors.forEach( ( connector ) => {
				expect( connector ).toHaveAttribute( 'data-complete', 'false' );
			} );
		} );

		test( 'should mark all connectors complete when all steps complete', () => {
			const allComplete = [
				{ id: 'step1', label: 'Step 1', status: 'complete' },
				{ id: 'step2', label: 'Step 2', status: 'complete' },
				{ id: 'step3', label: 'Step 3', status: 'complete' },
			];

			render( <VerticalStepper steps={ allComplete } /> );

			const connectors = screen.getAllByTestId( 'step-connector' );
			connectors.forEach( ( connector ) => {
				expect( connector ).toHaveAttribute( 'data-complete', 'true' );
			} );
		} );
	} );

	describe( 'Edge Cases', () => {
		test( 'should handle empty steps array', () => {
			render( <VerticalStepper steps={ [] } /> );

			expect(
				screen.queryByTestId( 'step-node-1' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByTestId( 'step-connector' )
			).not.toBeInTheDocument();
		} );

		test( 'should handle single step', () => {
			const singleStep = [
				{ id: 'only', label: 'Only', status: 'active' },
			];

			render( <VerticalStepper steps={ singleStep } /> );

			expect( screen.getByTestId( 'step-node-1' ) ).toBeInTheDocument();
			// No connectors for single step
			expect(
				screen.queryByTestId( 'step-connector' )
			).not.toBeInTheDocument();
		} );

		test( 'should handle error status in steps', () => {
			const stepsWithError = [
				{ id: 'step1', label: 'Step 1', status: 'complete' },
				{ id: 'step2', label: 'Step 2', status: 'error' },
				{ id: 'step3', label: 'Step 3', status: 'pending' },
			];

			render( <VerticalStepper steps={ stepsWithError } /> );

			expect( screen.getByTestId( 'step-node-2' ) ).toHaveAttribute(
				'data-status',
				'error'
			);
		} );
	} );
} );
