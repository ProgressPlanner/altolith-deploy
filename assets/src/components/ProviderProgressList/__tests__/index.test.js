/**
 * ProviderProgressList Component Tests
 *
 * Tests for multi-provider progress display.
 * Covers rendering, provider instance handling, and progress state mapping.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import { render, screen } from '@testing-library/react';

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

// Mock ProviderProgressBar component
jest.mock( '../../ProviderProgressBar', () => ( {
	__esModule: true,
	default: ( { providerId, providerLabel, stepLabel, progress, status, error } ) => (
		<div
			data-testid={ `provider-progress-${ providerId }` }
			data-provider-label={ providerLabel }
			data-step-label={ stepLabel || '' }
			data-current={ progress?.current ?? 0 }
			data-total={ progress?.total ?? 0 }
			data-status={ status || 'pending' }
			data-error={ error || '' }
		>
			{ providerLabel }
		</div>
	),
	ProviderProgressBar: ( { providerId, providerLabel, stepLabel, progress, status, error } ) => (
		<div
			data-testid={ `provider-progress-${ providerId }` }
			data-provider-label={ providerLabel }
			data-step-label={ stepLabel || '' }
			data-current={ progress?.current ?? 0 }
			data-total={ progress?.total ?? 0 }
			data-status={ status || 'pending' }
			data-error={ error || '' }
		>
			{ providerLabel }
		</div>
	),
} ) );

// Mock styles
jest.mock( '@aether/utils/styles', () => ( {
	colors: {
		text: '#333',
		textMuted: '#666',
		borderLighter: '#ddd',
		background: '#f9f9f9',
	},
	spacing: { md: '12px', lg: '16px' },
	fontSize: { sm: '12px' },
	fontWeight: { medium: 500, semibold: 600 },
} ) );

import { ProviderProgressList } from '../index';

describe( 'ProviderProgressList', () => {
	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should render nothing when no provider instances', () => {
			const { container } = render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ [] }
				/>
			);

			expect( container.firstChild ).toBeNull();
		} );

		test( 'should render when provider instances exist', () => {
			const instances = [
				{ id: 'provider1:uuid1', label: 'Provider 1' },
			];

			const { container } = render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ instances }
				/>
			);

			expect(
				container.querySelector( '.aether-provider-progress-list' )
			).toBeInTheDocument();
		} );

		test( 'should render header', () => {
			const instances = [
				{ id: 'provider1:uuid1', label: 'Provider 1' },
			];

			render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ instances }
				/>
			);

			expect(
				screen.getByText( 'Provider Progress' )
			).toBeInTheDocument();
		} );

		test( 'should render provider count', () => {
			const instances = [
				{ id: 'provider1:uuid1', label: 'Alpha Provider' },
				{ id: 'provider2:uuid2', label: 'Beta Provider' },
				{ id: 'provider3:uuid3', label: 'Gamma Provider' },
			];

			const { container } = render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ instances }
				/>
			);

			// Check the count badge directly to avoid matching provider labels
			const countBadge = container.querySelector(
				'.aether-provider-progress-list__count'
			);
			expect( countBadge ).toBeInTheDocument();
			expect( countBadge.textContent ).toContain( '3' );
			expect( countBadge.textContent ).toContain( 'providers' );
		} );

		test( 'should render single provider count', () => {
			const instances = [ { id: 'provider1:uuid1', label: 'Single Provider' } ];

			const { container } = render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ instances }
				/>
			);

			// Check the count badge directly
			const countBadge = container.querySelector(
				'.aether-provider-progress-list__count'
			);
			expect( countBadge ).toBeInTheDocument();
			expect( countBadge.textContent ).toContain( '1' );
		} );
	} );

	// ============================================================
	// Provider Instance Rendering
	// ============================================================
	describe( 'provider instances', () => {
		test( 'should render ProviderProgressBar for each instance', () => {
			const instances = [
				{ id: 'provider1:uuid1', label: 'Provider 1' },
				{ id: 'provider2:uuid2', label: 'Provider 2' },
			];

			render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ instances }
				/>
			);

			expect(
				screen.getByTestId( 'provider-progress-provider1:uuid1' )
			).toBeInTheDocument();
			expect(
				screen.getByTestId( 'provider-progress-provider2:uuid2' )
			).toBeInTheDocument();
		} );

		test( 'should pass provider label to ProviderProgressBar', () => {
			const instances = [
				{ id: 'provider1:uuid1', label: 'My Custom Provider' },
			];

			render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ instances }
				/>
			);

			expect( screen.getByText( 'My Custom Provider' ) ).toBeInTheDocument();
		} );

		test( 'should use instance id as label if label is missing', () => {
			const instances = [
				{ id: 'provider1:uuid1' }, // No label
			];

			render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ instances }
				/>
			);

			const progressBar = screen.getByTestId(
				'provider-progress-provider1:uuid1'
			);
			expect( progressBar ).toHaveAttribute(
				'data-provider-label',
				'provider1:uuid1'
			);
		} );
	} );

	// ============================================================
	// Progress State Mapping
	// ============================================================
	describe( 'progress state mapping', () => {
		test( 'should pass progress data to ProviderProgressBar', () => {
			const instances = [ { id: 'provider1:uuid1', label: 'Provider 1' } ];
			const progress = {
				'provider1:uuid1': {
					stepId: 'uploadFiles',
					stepLabel: 'Uploading files...',
					progress: { current: 50, total: 100 },
					status: 'active',
				},
			};

			render(
				<ProviderProgressList
					providerProgress={ progress }
					providerInstances={ instances }
				/>
			);

			const progressBar = screen.getByTestId(
				'provider-progress-provider1:uuid1'
			);
			expect( progressBar ).toHaveAttribute( 'data-current', '50' );
			expect( progressBar ).toHaveAttribute( 'data-total', '100' );
			expect( progressBar ).toHaveAttribute( 'data-status', 'active' );
			expect( progressBar ).toHaveAttribute(
				'data-step-label',
				'Uploading files...'
			);
		} );

		test( 'should use default values when progress is missing', () => {
			const instances = [ { id: 'provider1:uuid1', label: 'Provider 1' } ];
			const progress = {}; // No progress for this provider

			render(
				<ProviderProgressList
					providerProgress={ progress }
					providerInstances={ instances }
				/>
			);

			const progressBar = screen.getByTestId(
				'provider-progress-provider1:uuid1'
			);
			expect( progressBar ).toHaveAttribute( 'data-current', '0' );
			expect( progressBar ).toHaveAttribute( 'data-total', '0' );
			expect( progressBar ).toHaveAttribute( 'data-status', 'pending' );
			expect( progressBar ).toHaveAttribute( 'data-step-label', 'Pending' );
		} );

		test( 'should pass error to ProviderProgressBar', () => {
			const instances = [ { id: 'provider1:uuid1', label: 'Provider 1' } ];
			const progress = {
				'provider1:uuid1': {
					stepId: 'uploadFiles',
					stepLabel: 'Upload failed',
					progress: { current: 50, total: 100 },
					status: 'error',
					error: 'Connection timeout',
				},
			};

			render(
				<ProviderProgressList
					providerProgress={ progress }
					providerInstances={ instances }
				/>
			);

			const progressBar = screen.getByTestId(
				'provider-progress-provider1:uuid1'
			);
			expect( progressBar ).toHaveAttribute(
				'data-error',
				'Connection timeout'
			);
		} );

		test( 'should handle multiple providers with different states', () => {
			const instances = [
				{ id: 'provider1:uuid1', label: 'Provider 1' },
				{ id: 'provider2:uuid2', label: 'Provider 2' },
				{ id: 'provider3:uuid3', label: 'Provider 3' },
			];
			const progress = {
				'provider1:uuid1': {
					stepId: 'complete',
					stepLabel: 'Done',
					progress: { current: 100, total: 100 },
					status: 'complete',
				},
				'provider2:uuid2': {
					stepId: 'uploadFiles',
					stepLabel: 'Uploading...',
					progress: { current: 25, total: 100 },
					status: 'active',
				},
				// provider3 has no progress (pending)
			};

			render(
				<ProviderProgressList
					providerProgress={ progress }
					providerInstances={ instances }
				/>
			);

			const progress1 = screen.getByTestId(
				'provider-progress-provider1:uuid1'
			);
			const progress2 = screen.getByTestId(
				'provider-progress-provider2:uuid2'
			);
			const progress3 = screen.getByTestId(
				'provider-progress-provider3:uuid3'
			);

			expect( progress1 ).toHaveAttribute( 'data-status', 'complete' );
			expect( progress2 ).toHaveAttribute( 'data-status', 'active' );
			expect( progress3 ).toHaveAttribute( 'data-status', 'pending' );
		} );
	} );

	// ============================================================
	// Edge Cases
	// ============================================================
	describe( 'edge cases', () => {
		test( 'should handle undefined providerProgress', () => {
			const instances = [ { id: 'provider1:uuid1', label: 'Provider 1' } ];

			// This should not throw
			const { container } = render(
				<ProviderProgressList providerInstances={ instances } />
			);

			expect(
				container.querySelector( '.aether-provider-progress-list' )
			).toBeInTheDocument();
		} );

		test( 'should handle undefined providerInstances', () => {
			const { container } = render(
				<ProviderProgressList providerProgress={ {} } />
			);

			// Should render nothing when instances is undefined (defaults to [])
			expect( container.firstChild ).toBeNull();
		} );

		test( 'should handle empty progress object for a provider', () => {
			const instances = [ { id: 'provider1:uuid1', label: 'Provider 1' } ];
			const progress = {
				'provider1:uuid1': {}, // Empty object
			};

			render(
				<ProviderProgressList
					providerProgress={ progress }
					providerInstances={ instances }
				/>
			);

			// Should use defaults when progress object is empty
			const progressBar = screen.getByTestId(
				'provider-progress-provider1:uuid1'
			);
			expect( progressBar ).toBeInTheDocument();
		} );

		test( 'should preserve instance order', () => {
			const instances = [
				{ id: 'provider-z', label: 'Z Provider' },
				{ id: 'provider-a', label: 'A Provider' },
				{ id: 'provider-m', label: 'M Provider' },
			];

			render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ instances }
				/>
			);

			const items = screen.getAllByTestId( /provider-progress-/ );
			expect( items[ 0 ] ).toHaveAttribute(
				'data-provider-label',
				'Z Provider'
			);
			expect( items[ 1 ] ).toHaveAttribute(
				'data-provider-label',
				'A Provider'
			);
			expect( items[ 2 ] ).toHaveAttribute(
				'data-provider-label',
				'M Provider'
			);
		} );

		test( 'should handle provider ID with special characters', () => {
			const instances = [
				{ id: 'my-provider:uuid-with-dashes', label: 'My Provider' },
			];

			render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ instances }
				/>
			);

			expect(
				screen.getByTestId( 'provider-progress-my-provider:uuid-with-dashes' )
			).toBeInTheDocument();
		} );

		test( 'should handle large number of providers', () => {
			const instances = Array.from( { length: 50 }, ( _, i ) => ( {
				id: `provider${ i }:uuid${ i }`,
				label: `Provider ${ i }`,
			} ) );

			render(
				<ProviderProgressList
					providerProgress={ {} }
					providerInstances={ instances }
				/>
			);

			expect( screen.getByText( /50/ ) ).toBeInTheDocument();
			expect( screen.getAllByTestId( /provider-progress-/ ) ).toHaveLength(
				50
			);
		} );
	} );
} );
