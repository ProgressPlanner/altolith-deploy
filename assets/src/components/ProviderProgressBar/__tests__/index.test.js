/**
 * ProviderProgressBar Component Tests
 *
 * Tests for single provider progress display with status indicators.
 * Covers active, complete, error states and visual rendering.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import { render, screen } from '@testing-library/react';

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

// Mock ProgressBar component
jest.mock( '@aether/components/ProgressBar', () => ( {
	__esModule: true,
	default: ( { progress, height } ) => (
		<div
			data-testid="mock-progress-bar"
			data-current={ progress.current }
			data-total={ progress.total }
			data-height={ height }
		>
			Mock ProgressBar
		</div>
	),
	ProgressBar: ( { progress, height } ) => (
		<div
			data-testid="mock-progress-bar"
			data-current={ progress.current }
			data-total={ progress.total }
			data-height={ height }
		>
			Mock ProgressBar
		</div>
	),
} ) );

// Mock styles
jest.mock( '@aether/utils/styles', () => ( {
	colors: {
		text: '#333',
		textMuted: '#666',
		white: '#fff',
		error: '#d00',
		success: '#0a0',
		borderLighter: '#ddd',
		borderActive: '#007cba',
		shadowActive: 'rgba(0,124,186,0.2)',
		background: '#f9f9f9',
		backgroundError: '#fdd',
	},
	spacing: {
		xs: '4px',
		sm: '8px',
		md: '12px',
		lg: '16px',
	},
	borderRadius: { sm: '4px' },
	fontSize: { xs: '11px', sm: '12px' },
	fontWeight: { medium: 500, semibold: 600, bold: 700 },
} ) );

import { ProviderProgressBar } from '../index';

describe( 'ProviderProgressBar', () => {
	const defaultProps = {
		providerId: 'test-provider:uuid-123',
		providerLabel: 'Test Provider',
		stepLabel: 'Uploading files...',
		progress: { current: 50, total: 100 },
		status: 'active',
	};

	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should render provider label', () => {
			render( <ProviderProgressBar { ...defaultProps } /> );

			expect( screen.getByText( 'Test Provider' ) ).toBeInTheDocument();
		} );

		test( 'should render percentage', () => {
			render( <ProviderProgressBar { ...defaultProps } /> );

			expect( screen.getByText( '50%' ) ).toBeInTheDocument();
		} );

		test( 'should render step label when status is active', () => {
			render( <ProviderProgressBar { ...defaultProps } status="active" /> );

			expect( screen.getByText( 'Uploading files...' ) ).toBeInTheDocument();
		} );

		test( 'should not render step label when status is complete', () => {
			render( <ProviderProgressBar { ...defaultProps } status="complete" /> );

			expect(
				screen.queryByText( 'Uploading files...' )
			).not.toBeInTheDocument();
		} );

		test( 'should not render step label when status is error', () => {
			render( <ProviderProgressBar { ...defaultProps } status="error" /> );

			expect(
				screen.queryByText( 'Uploading files...' )
			).not.toBeInTheDocument();
		} );

		test( 'should render container with correct class', () => {
			const { container } = render(
				<ProviderProgressBar { ...defaultProps } />
			);

			expect(
				container.querySelector( '.aether-provider-progress-bar' )
			).toBeInTheDocument();
		} );

		test( 'should set data-provider-id attribute', () => {
			const { container } = render(
				<ProviderProgressBar { ...defaultProps } />
			);

			expect(
				container.querySelector(
					'[data-provider-id="test-provider:uuid-123"]'
				)
			).toBeInTheDocument();
		} );

		test( 'should render ProgressBar component', () => {
			render( <ProviderProgressBar { ...defaultProps } /> );

			const progressBar = screen.getByTestId( 'mock-progress-bar' );
			expect( progressBar ).toBeInTheDocument();
			expect( progressBar ).toHaveAttribute( 'data-current', '50' );
			expect( progressBar ).toHaveAttribute( 'data-total', '100' );
			expect( progressBar ).toHaveAttribute( 'data-height', '8' );
		} );
	} );

	// ============================================================
	// Status Rendering
	// ============================================================
	describe( 'status rendering', () => {
		test( 'should add active modifier class when active', () => {
			const { container } = render(
				<ProviderProgressBar { ...defaultProps } status="active" />
			);

			expect(
				container.querySelector( '.aether-provider-progress-bar--active' )
			).toBeInTheDocument();
		} );

		test( 'should add complete modifier class when complete', () => {
			const { container } = render(
				<ProviderProgressBar { ...defaultProps } status="complete" />
			);

			expect(
				container.querySelector( '.aether-provider-progress-bar--complete' )
			).toBeInTheDocument();
		} );

		test( 'should add error modifier class when error', () => {
			const { container } = render(
				<ProviderProgressBar { ...defaultProps } status="error" />
			);

			expect(
				container.querySelector( '.aether-provider-progress-bar--error' )
			).toBeInTheDocument();
		} );

		test( 'should show checkmark icon when complete', () => {
			render(
				<ProviderProgressBar { ...defaultProps } status="complete" />
			);

			expect(
				screen.getByText( '✓' )
			).toBeInTheDocument();
		} );

		test( 'should show X icon when error', () => {
			render( <ProviderProgressBar { ...defaultProps } status="error" /> );

			expect(
				screen.getByText( '✗' )
			).toBeInTheDocument();
		} );

		test( 'should not show status icon when active', () => {
			const { container } = render(
				<ProviderProgressBar { ...defaultProps } status="active" />
			);

			expect(
				container.querySelector(
					'.aether-provider-progress-bar__status-icon'
				)
			).not.toBeInTheDocument();
		} );

		test( 'should show "Complete" message when status is complete', () => {
			render(
				<ProviderProgressBar { ...defaultProps } status="complete" />
			);

			expect( screen.getByText( 'Complete' ) ).toBeInTheDocument();
		} );

		test( 'should not show "Complete" message when status is active', () => {
			render( <ProviderProgressBar { ...defaultProps } status="active" /> );

			expect( screen.queryByText( 'Complete' ) ).not.toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Error Handling
	// ============================================================
	describe( 'error handling', () => {
		test( 'should display error message when status is error', () => {
			render(
				<ProviderProgressBar
					{ ...defaultProps }
					status="error"
					error="Upload failed: Connection timeout"
				/>
			);

			expect(
				screen.getByText( 'Upload failed: Connection timeout' )
			).toBeInTheDocument();
		} );

		test( 'should not display error message when status is not error', () => {
			render(
				<ProviderProgressBar
					{ ...defaultProps }
					status="active"
					error="Should not show"
				/>
			);

			expect(
				screen.queryByText( 'Should not show' )
			).not.toBeInTheDocument();
		} );

		test( 'should not display error container when error is null', () => {
			const { container } = render(
				<ProviderProgressBar
					{ ...defaultProps }
					status="error"
					error={ null }
				/>
			);

			expect(
				container.querySelector( '.aether-provider-progress-bar__error' )
			).not.toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Percentage Calculation
	// ============================================================
	describe( 'percentage calculation', () => {
		test( 'should calculate 0% when total is 0', () => {
			render(
				<ProviderProgressBar
					{ ...defaultProps }
					progress={ { current: 0, total: 0 } }
				/>
			);

			expect( screen.getByText( '0%' ) ).toBeInTheDocument();
		} );

		test( 'should calculate correct percentage', () => {
			render(
				<ProviderProgressBar
					{ ...defaultProps }
					progress={ { current: 75, total: 100 } }
				/>
			);

			expect( screen.getByText( '75%' ) ).toBeInTheDocument();
		} );

		test( 'should round percentage', () => {
			render(
				<ProviderProgressBar
					{ ...defaultProps }
					progress={ { current: 1, total: 3 } }
				/>
			);

			// 1/3 = 33.33... rounds to 33
			expect( screen.getByText( '33%' ) ).toBeInTheDocument();
		} );

		test( 'should show 100% when complete', () => {
			render(
				<ProviderProgressBar
					{ ...defaultProps }
					progress={ { current: 100, total: 100 } }
				/>
			);

			expect( screen.getByText( '100%' ) ).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Edge Cases
	// ============================================================
	describe( 'edge cases', () => {
		test( 'should handle missing stepLabel', () => {
			render(
				<ProviderProgressBar
					providerId="provider:uuid"
					providerLabel="Provider"
					progress={ { current: 50, total: 100 } }
					status="active"
				/>
			);

			expect( screen.getByText( 'Provider' ) ).toBeInTheDocument();
		} );

		test( 'should handle undefined status', () => {
			const { container } = render(
				<ProviderProgressBar
					{ ...defaultProps }
					status={ undefined }
				/>
			);

			// Should render without throwing
			expect(
				container.querySelector( '.aether-provider-progress-bar' )
			).toBeInTheDocument();
		} );

		test( 'should handle null status', () => {
			const { container } = render(
				<ProviderProgressBar { ...defaultProps } status={ null } />
			);

			// Should render without throwing
			expect(
				container.querySelector( '.aether-provider-progress-bar' )
			).toBeInTheDocument();
		} );

		test( 'should handle very long provider label', () => {
			const longLabel = 'A'.repeat( 200 );
			render(
				<ProviderProgressBar
					{ ...defaultProps }
					providerLabel={ longLabel }
				/>
			);

			expect( screen.getByText( longLabel ) ).toBeInTheDocument();
		} );

		test( 'should handle very long error message', () => {
			const longError = 'Error: '.repeat( 50 );
			const { container } = render(
				<ProviderProgressBar
					{ ...defaultProps }
					status="error"
					error={ longError }
				/>
			);

			// Check that error container exists and contains the error text
			const errorEl = container.querySelector(
				'.aether-provider-progress-bar__error'
			);
			expect( errorEl ).toBeInTheDocument();
			expect( errorEl.textContent ).toContain( 'Error:' );
		} );
	} );
} );
