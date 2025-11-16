/**
 * Tests for StatusIndicator Component
 *
 * @package
 */

import { render, screen } from '@testing-library/react';
import StatusIndicator from '../StatusIndicator';

describe( 'StatusIndicator', () => {
	it( 'should render loading state', () => {
		render( <StatusIndicator status={ null } loading={ true } /> );

		const indicator = screen.getByText( '...' );
		expect( indicator ).toBeInTheDocument();
		expect( indicator ).toHaveClass(
			'aether-status-indicator',
			'aether-status-indicator--loading'
		);
	} );

	it( 'should render configured status', () => {
		render( <StatusIndicator status="configured" loading={ false } /> );

		const indicator = screen.getByText( '✓' );
		expect( indicator ).toBeInTheDocument();
		expect( indicator ).toHaveClass(
			'aether-status-indicator',
			'aether-status-indicator--configured'
		);
		expect( indicator ).toHaveAttribute( 'title', 'Configured' );
	} );

	it( 'should render not-configured status', () => {
		render( <StatusIndicator status="not-configured" loading={ false } /> );

		const indicator = screen.getByText( '✗' );
		expect( indicator ).toBeInTheDocument();
		expect( indicator ).toHaveClass(
			'aether-status-indicator',
			'aether-status-indicator--error'
		);
		expect( indicator ).toHaveAttribute( 'title', 'Not configured' );
	} );

	it( 'should render error status', () => {
		render( <StatusIndicator status="error" loading={ false } /> );

		const indicator = screen.getByText( '✗' );
		expect( indicator ).toBeInTheDocument();
		expect( indicator ).toHaveClass(
			'aether-status-indicator',
			'aether-status-indicator--error'
		);
	} );

	it( 'should return null for unknown status', () => {
		const { container } = render(
			<StatusIndicator status="unknown" loading={ false } />
		);

		expect( container.firstChild ).toBeNull();
	} );

	it( 'should prioritize loading over status', () => {
		render( <StatusIndicator status="configured" loading={ true } /> );

		expect( screen.getByText( '...' ) ).toBeInTheDocument();
		expect( screen.queryByText( '✓' ) ).not.toBeInTheDocument();
	} );
} );
