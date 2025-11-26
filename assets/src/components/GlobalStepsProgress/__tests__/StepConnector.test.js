/**
 * StepConnector Component Tests
 *
 * Tests for the StepConnector component that renders connecting lines
 * between step nodes in the horizontal stepper.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StepConnector } from '../StepConnector';

// Mock styles
jest.mock( '@aether/utils/styles', () => ( {
	colors: {
		success: '#00a32a',
		borderLighter: '#e0e0e0',
	},
} ) );

describe( 'StepConnector', () => {
	describe( 'Rendering', () => {
		test( 'should render a span element', () => {
			const { container } = render( <StepConnector isComplete={ false } /> );

			const connector = container.querySelector( 'span' );
			expect( connector ).toBeInTheDocument();
		} );

		test( 'should have the correct CSS class', () => {
			const { container } = render( <StepConnector isComplete={ false } /> );

			const connector = container.querySelector( 'span' );
			expect( connector ).toHaveClass( 'aether-step-connector' );
		} );
	} );

	describe( 'Accessibility', () => {
		test( 'should be hidden from assistive technology', () => {
			const { container } = render( <StepConnector isComplete={ false } /> );

			const connector = container.querySelector( 'span' );
			expect( connector ).toHaveAttribute( 'aria-hidden', 'true' );
		} );
	} );

	describe( 'Visual States', () => {
		test( 'should use success color when complete', () => {
			const { container } = render( <StepConnector isComplete={ true } /> );

			const connector = container.querySelector( 'span' );
			expect( connector ).toHaveStyle( { backgroundColor: '#00a32a' } );
		} );

		test( 'should use border color when incomplete', () => {
			const { container } = render( <StepConnector isComplete={ false } /> );

			const connector = container.querySelector( 'span' );
			expect( connector ).toHaveStyle( { backgroundColor: '#e0e0e0' } );
		} );
	} );

	describe( 'Styling', () => {
		test( 'should have flex: 1 for proper spacing', () => {
			const { container } = render( <StepConnector isComplete={ false } /> );

			const connector = container.querySelector( 'span' );
			expect( connector ).toHaveStyle( { flex: '1' } );
		} );

		test( 'should have consistent height for line appearance', () => {
			const { container } = render( <StepConnector isComplete={ false } /> );

			const connector = container.querySelector( 'span' );
			expect( connector ).toHaveStyle( { height: '2px' } );
		} );

		test( 'should have minimum width constraint', () => {
			const { container } = render( <StepConnector isComplete={ false } /> );

			const connector = container.querySelector( 'span' );
			expect( connector ).toHaveStyle( { minWidth: '20px' } );
		} );

		test( 'should have maximum width constraint', () => {
			const { container } = render( <StepConnector isComplete={ false } /> );

			const connector = container.querySelector( 'span' );
			expect( connector ).toHaveStyle( { maxWidth: '60px' } );
		} );
	} );

	describe( 'Edge Cases', () => {
		test( 'should handle undefined isComplete as falsy (incomplete)', () => {
			const { container } = render( <StepConnector /> );

			const connector = container.querySelector( 'span' );
			expect( connector ).toHaveStyle( { backgroundColor: '#e0e0e0' } );
		} );
	} );
} );
