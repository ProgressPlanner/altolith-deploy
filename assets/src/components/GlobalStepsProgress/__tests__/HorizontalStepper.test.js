/**
 * HorizontalStepper Component Tests
 *
 * Tests for the HorizontalStepper component that displays export progress
 * in a compact horizontal layout.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { HorizontalStepper } from '../HorizontalStepper';

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

// Mock child components to simplify testing
jest.mock( '../StepNode', () => ( {
	StepNode: ( { stepNumber, label, status } ) => (
		<span
			data-testid={ `step-node-${ stepNumber }` }
			data-status={ status }
			data-label={ label }
		>
			Step { stepNumber }
		</span>
	),
} ) );

jest.mock( '../StepConnector', () => ( {
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

const defaultStepLabels = {
	step1: 'Scanning Pages',
	step2: 'Processing Assets',
	step3: 'Finalizing',
};

describe( 'HorizontalStepper', () => {
	describe( 'Rendering', () => {
		test( 'should render all steps', () => {
			render(
				<HorizontalStepper
					steps={ defaultSteps }
					stepLabels={ defaultStepLabels }
				/>
			);

			expect( screen.getByTestId( 'step-node-1' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'step-node-2' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'step-node-3' ) ).toBeInTheDocument();
		} );

		test( 'should render connectors between steps (not after last)', () => {
			render(
				<HorizontalStepper
					steps={ defaultSteps }
					stepLabels={ defaultStepLabels }
				/>
			);

			const connectors = screen.getAllByTestId( 'step-connector' );
			// 3 steps = 2 connectors
			expect( connectors ).toHaveLength( 2 );
		} );

		test( 'should not render connector after last step', () => {
			const singleStep = [
				{ id: 'only', label: 'Only', status: 'active' },
			];

			render(
				<HorizontalStepper
					steps={ singleStep }
					stepLabels={ { only: 'Only Step' } }
				/>
			);

			expect(
				screen.queryByTestId( 'step-connector' )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'Accessibility', () => {
		test( 'should have list role with aria-label', () => {
			render(
				<HorizontalStepper
					steps={ defaultSteps }
					stepLabels={ defaultStepLabels }
				/>
			);

			const container = screen.getByRole( 'list' );
			expect( container ).toHaveAttribute(
				'aria-label',
				'Export progress'
			);
		} );

		test( 'should have appropriate CSS class', () => {
			render(
				<HorizontalStepper
					steps={ defaultSteps }
					stepLabels={ defaultStepLabels }
				/>
			);

			const container = screen.getByRole( 'list' );
			expect( container ).toHaveClass( 'aether-horizontal-stepper' );
		} );
	} );

	describe( 'Progress Display', () => {
		test( 'should show correct completion count', () => {
			render(
				<HorizontalStepper
					steps={ defaultSteps }
					stepLabels={ defaultStepLabels }
				/>
			);

			expect( screen.getByText( '(1/3)' ) ).toBeInTheDocument();
		} );

		test( 'should show 0 completed when none complete', () => {
			const allPending = [
				{ id: 'step1', label: 'Step 1', status: 'pending' },
				{ id: 'step2', label: 'Step 2', status: 'pending' },
			];

			render(
				<HorizontalStepper
					steps={ allPending }
					stepLabels={ defaultStepLabels }
				/>
			);

			expect( screen.getByText( '(0/2)' ) ).toBeInTheDocument();
		} );

		test( 'should show all completed count', () => {
			const allComplete = [
				{ id: 'step1', label: 'Step 1', status: 'complete' },
				{ id: 'step2', label: 'Step 2', status: 'complete' },
				{ id: 'step3', label: 'Step 3', status: 'complete' },
			];

			render(
				<HorizontalStepper
					steps={ allComplete }
					stepLabels={ defaultStepLabels }
				/>
			);

			expect( screen.getByText( '(3/3)' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Active Step Label', () => {
		test( 'should display active step label', () => {
			render(
				<HorizontalStepper
					steps={ defaultSteps }
					stepLabels={ defaultStepLabels }
				/>
			);

			expect(
				screen.getByText( 'Processing Assets' )
			).toBeInTheDocument();
		} );

		test( 'should show "Preparing..." when no active step', () => {
			const allComplete = [
				{ id: 'step1', label: 'Step 1', status: 'complete' },
				{ id: 'step2', label: 'Step 2', status: 'complete' },
			];

			render(
				<HorizontalStepper
					steps={ allComplete }
					stepLabels={ defaultStepLabels }
				/>
			);

			expect( screen.getByText( 'Preparing…' ) ).toBeInTheDocument();
		} );

		test( 'should fallback to step.label if not in stepLabels', () => {
			const steps = [
				{ id: 'unknown', label: 'Fallback Label', status: 'active' },
			];

			render( <HorizontalStepper steps={ steps } stepLabels={ {} } /> );

			expect( screen.getByText( 'Fallback Label' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Step Props', () => {
		test( 'should pass correct status to each StepNode', () => {
			render(
				<HorizontalStepper
					steps={ defaultSteps }
					stepLabels={ defaultStepLabels }
				/>
			);

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

		test( 'should pass correct labels from stepLabels to StepNode', () => {
			render(
				<HorizontalStepper
					steps={ defaultSteps }
					stepLabels={ defaultStepLabels }
				/>
			);

			expect( screen.getByTestId( 'step-node-1' ) ).toHaveAttribute(
				'data-label',
				'Scanning Pages'
			);
			expect( screen.getByTestId( 'step-node-2' ) ).toHaveAttribute(
				'data-label',
				'Processing Assets'
			);
			expect( screen.getByTestId( 'step-node-3' ) ).toHaveAttribute(
				'data-label',
				'Finalizing'
			);
		} );
	} );

	describe( 'Connector States', () => {
		test( 'should mark connector as complete when preceding step is complete', () => {
			render(
				<HorizontalStepper
					steps={ defaultSteps }
					stepLabels={ defaultStepLabels }
				/>
			);

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

			render(
				<HorizontalStepper
					steps={ allPending }
					stepLabels={ defaultStepLabels }
				/>
			);

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

			render(
				<HorizontalStepper
					steps={ allComplete }
					stepLabels={ defaultStepLabels }
				/>
			);

			const connectors = screen.getAllByTestId( 'step-connector' );
			connectors.forEach( ( connector ) => {
				expect( connector ).toHaveAttribute( 'data-complete', 'true' );
			} );
		} );
	} );

	describe( 'Edge Cases', () => {
		test( 'should handle empty steps array', () => {
			render( <HorizontalStepper steps={ [] } stepLabels={ {} } /> );

			expect(
				screen.queryByTestId( 'step-node-1' )
			).not.toBeInTheDocument();
			expect( screen.getByText( '(0/0)' ) ).toBeInTheDocument();
		} );

		test( 'should handle single step', () => {
			const singleStep = [
				{ id: 'only', label: 'Only', status: 'active' },
			];

			render(
				<HorizontalStepper
					steps={ singleStep }
					stepLabels={ { only: 'Only Step' } }
				/>
			);

			expect( screen.getByTestId( 'step-node-1' ) ).toBeInTheDocument();
			expect( screen.getByText( '(0/1)' ) ).toBeInTheDocument();
		} );

		test( 'should handle error status in steps', () => {
			const stepsWithError = [
				{ id: 'step1', label: 'Step 1', status: 'complete' },
				{ id: 'step2', label: 'Step 2', status: 'error' },
				{ id: 'step3', label: 'Step 3', status: 'pending' },
			];

			render(
				<HorizontalStepper
					steps={ stepsWithError }
					stepLabels={ defaultStepLabels }
				/>
			);

			expect( screen.getByTestId( 'step-node-2' ) ).toHaveAttribute(
				'data-status',
				'error'
			);
		} );
	} );
} );
