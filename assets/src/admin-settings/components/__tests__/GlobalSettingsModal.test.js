/**
 * GlobalSettingsModal Component Tests
 *
 * Tests for the global export settings modal component.
 * Covers rendering, loading state, settings changes, save functionality,
 * and unsaved changes confirmation.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
} from '@testing-library/react';

// Mock WordPress dependencies
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

jest.mock( '@wordpress/element', () => ( {
	useState: jest.requireActual( 'react' ).useState,
	useEffect: jest.requireActual( 'react' ).useEffect,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Modal: ( { children, title, onRequestClose, className } ) => (
		<div data-testid="modal" data-title={ title } className={ className }>
			<button data-testid="modal-close" onClick={ onRequestClose }>
				X
			</button>
			{ children }
		</div>
	),
	ToggleControl: ( { label, help, checked, onChange } ) => (
		<div
			data-testid={ `toggle-${ label
				.toLowerCase()
				.replace( /\s+/g, '-' ) }` }
		>
			{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
			<label>
				<input
					type="checkbox"
					checked={ checked }
					onChange={ ( e ) => onChange( e.target.checked ) }
					data-testid={ `toggle-input-${ label
						.toLowerCase()
						.replace( /\s+/g, '-' ) }` }
				/>
				{ label }
			</label>
			{ help && <span data-testid="help">{ help }</span> }
		</div>
	),
	RangeControl: ( { label, help, value, onChange, min, max } ) => (
		<div data-testid="range-control">
			{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
			<label>{ label }</label>
			<input
				type="range"
				value={ value }
				onChange={ ( e ) => onChange( parseInt( e.target.value, 10 ) ) }
				min={ min }
				max={ max }
				data-testid="batch-size-input"
			/>
			<span data-testid="batch-size-value">{ value }</span>
			{ help && <span data-testid="range-help">{ help }</span> }
		</div>
	),
	Button: ( { children, onClick, disabled, isBusy, variant } ) => (
		<button
			onClick={ onClick }
			disabled={ disabled }
			data-busy={ isBusy }
			data-variant={ variant }
		>
			{ children }
		</button>
	),
	Spinner: () => <div data-testid="spinner">Loading...</div>,
} ) );

// Mock apiFetch
jest.mock( '../../../utils/api', () => jest.fn() );

// Mock styles
jest.mock( '../../../utils/styles', () => ( {
	colors: {
		background: '#f0f0f0',
		text: '#333',
		textMuted: '#666',
		borderLight: '#ddd',
	},
	spacing: {
		md: '12px',
		lg: '16px',
		'2xl': '24px',
	},
	createFlexStyle: () => ( {
		display: 'flex',
	} ),
} ) );

import GlobalSettingsModal from '../GlobalSettingsModal';
import apiFetch from '../../../utils/api';

describe( 'GlobalSettingsModal', () => {
	const defaultProps = {
		isOpen: true,
		onClose: jest.fn(),
	};

	const mockSettings = {
		exportStaticSite: true,
		exportBlueprint: false,
		crawlBatchSize: 15,
	};

	beforeEach( () => {
		jest.clearAllMocks();
		// Default mock implementation for apiFetch - resolves with settings
		apiFetch.mockResolvedValue( {
			success: true,
			value: mockSettings,
		} );
		// Mock window.confirm
		window.confirm = jest.fn( () => true );
	} );

	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should not render when isOpen is false', () => {
			const { container } = render(
				<GlobalSettingsModal { ...defaultProps } isOpen={ false } />
			);

			expect( container.firstChild ).toBeNull();
		} );

		test( 'should render modal when isOpen is true', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
			} );
		} );

		test( 'should display correct modal title', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect( screen.getByTestId( 'modal' ) ).toHaveAttribute(
					'data-title',
					'Export Settings'
				);
			} );
		} );

		test( 'should render with correct class name', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect( screen.getByTestId( 'modal' ) ).toHaveClass(
					'altolith-global-settings-modal'
				);
			} );
		} );
	} );

	// ============================================================
	// Loading State
	// ============================================================
	describe( 'loading state', () => {
		test( 'should show loading spinner while fetching settings', async () => {
			// Make apiFetch never resolve to keep loading state
			apiFetch.mockImplementation( () => new Promise( () => {} ) );

			render( <GlobalSettingsModal { ...defaultProps } /> );

			expect( screen.getByTestId( 'spinner' ) ).toBeInTheDocument();
			expect(
				screen.getByText( 'Loading settings\u2026' )
			).toBeInTheDocument();
		} );

		test( 'should hide loading spinner after settings load', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );
		} );

		test( 'should fetch settings on modal open', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/altolith/deploy/settings?key=global',
				} );
			} );
		} );
	} );

	// ============================================================
	// Settings Display
	// ============================================================
	describe( 'settings display', () => {
		test( 'should display Static Site toggle with correct state', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				const toggle = screen.getByTestId( 'toggle-input-static-site' );
				expect( toggle ).toBeChecked();
			} );
		} );

		test( 'should display Blueprint toggle with correct state', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				const toggle = screen.getByTestId(
					'toggle-input-wordpress-playground-blueprint'
				);
				expect( toggle ).not.toBeChecked();
			} );
		} );

		test( 'should display batch size with correct value', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.getByTestId( 'batch-size-value' )
				).toHaveTextContent( '15' );
			} );
		} );

		test( 'should use default values when API returns no value', async () => {
			apiFetch.mockResolvedValue( { success: true, value: null } );

			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				const staticSiteToggle = screen.getByTestId(
					'toggle-input-static-site'
				);
				const blueprintToggle = screen.getByTestId(
					'toggle-input-wordpress-playground-blueprint'
				);
				expect( staticSiteToggle ).toBeChecked();
				expect( blueprintToggle ).toBeChecked();
				expect(
					screen.getByTestId( 'batch-size-value' )
				).toHaveTextContent( '10' );
			} );
		} );
	} );

	// ============================================================
	// Settings Changes
	// ============================================================
	describe( 'settings changes', () => {
		test( 'should update Static Site toggle when clicked', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			expect( toggle ).not.toBeChecked();
		} );

		test( 'should update Blueprint toggle when clicked', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			const toggle = screen.getByTestId(
				'toggle-input-wordpress-playground-blueprint'
			);
			fireEvent.click( toggle );

			expect( toggle ).toBeChecked();
		} );

		test( 'should update batch size when changed', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			const rangeInput = screen.getByTestId( 'batch-size-input' );
			fireEvent.change( rangeInput, { target: { value: '25' } } );

			expect(
				screen.getByTestId( 'batch-size-value' )
			).toHaveTextContent( '25' );
		} );

		test( 'should enable Save button after making changes', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Initially disabled
			expect( screen.getByText( 'Save Settings' ) ).toBeDisabled();

			// Make a change
			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			// Now enabled
			expect( screen.getByText( 'Save Settings' ) ).not.toBeDisabled();
		} );
	} );

	// ============================================================
	// Save Functionality
	// ============================================================
	describe( 'save functionality', () => {
		test( 'should call API with updated settings on save', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Make a change
			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			// Click save
			fireEvent.click( screen.getByText( 'Save Settings' ) );

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledWith( {
					path: '/altolith/deploy/settings',
					method: 'POST',
					data: {
						key: 'global',
						value: {
							exportStaticSite: false,
							exportBlueprint: false,
							crawlBatchSize: 15,
						},
					},
				} );
			} );
		} );

		test( 'should call onClose after successful save', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Make a change
			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			// Click save
			fireEvent.click( screen.getByText( 'Save Settings' ) );

			await waitFor( () => {
				expect( defaultProps.onClose ).toHaveBeenCalled();
			} );
		} );

		test( 'should show busy state on Save button while saving', async () => {
			// Make save take a while
			apiFetch.mockImplementation( ( options ) => {
				if ( options.method === 'POST' ) {
					return new Promise( ( resolve ) => {
						setTimeout( () => resolve( { success: true } ), 100 );
					} );
				}
				return Promise.resolve( {
					success: true,
					value: mockSettings,
				} );
			} );

			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Make a change
			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			// Click save
			fireEvent.click( screen.getByText( 'Save Settings' ) );

			// Check for saving state
			expect( screen.getByText( 'Saving\u2026' ) ).toBeInTheDocument();
		} );

		test( 'should not call onClose on save failure', async () => {
			apiFetch.mockImplementation( ( options ) => {
				if ( options.method === 'POST' ) {
					return Promise.reject( new Error( 'Save failed' ) );
				}
				return Promise.resolve( {
					success: true,
					value: mockSettings,
				} );
			} );

			// Suppress console.error for this test
			const consoleSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Make a change
			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			// Click save
			fireEvent.click( screen.getByText( 'Save Settings' ) );

			await waitFor( () => {
				expect( consoleSpy ).toHaveBeenCalledWith(
					'Failed to save global settings:',
					expect.any( Error )
				);
			} );

			expect( defaultProps.onClose ).not.toHaveBeenCalled();

			consoleSpy.mockRestore();
		} );
	} );

	// ============================================================
	// Unsaved Changes
	// ============================================================
	describe( 'unsaved changes', () => {
		test( 'should show confirmation when closing with unsaved changes', async () => {
			window.confirm = jest.fn( () => false );

			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Make a change
			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			// Try to close
			fireEvent.click( screen.getByText( 'Cancel' ) );

			expect( window.confirm ).toHaveBeenCalledWith(
				'You have unsaved changes. Are you sure you want to close?'
			);
		} );

		test( 'should not close when user cancels confirmation', async () => {
			window.confirm = jest.fn( () => false );

			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Make a change
			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			// Try to close
			fireEvent.click( screen.getByText( 'Cancel' ) );

			expect( defaultProps.onClose ).not.toHaveBeenCalled();
		} );

		test( 'should close when user confirms', async () => {
			window.confirm = jest.fn( () => true );

			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Make a change
			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			// Try to close
			fireEvent.click( screen.getByText( 'Cancel' ) );

			expect( defaultProps.onClose ).toHaveBeenCalled();
		} );

		test( 'should close without confirmation when no changes made', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Close without making changes
			fireEvent.click( screen.getByText( 'Cancel' ) );

			expect( window.confirm ).not.toHaveBeenCalled();
			expect( defaultProps.onClose ).toHaveBeenCalled();
		} );

		test( 'should show confirmation when closing via modal X button', async () => {
			window.confirm = jest.fn( () => true );

			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Make a change
			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			// Close via X button
			fireEvent.click( screen.getByTestId( 'modal-close' ) );

			expect( window.confirm ).toHaveBeenCalled();
		} );
	} );

	// ============================================================
	// Batch Size Constraints
	// ============================================================
	describe( 'batch size constraints', () => {
		test( 'should render batch size range with min 1', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			const rangeInput = screen.getByTestId( 'batch-size-input' );
			expect( rangeInput ).toHaveAttribute( 'min', '1' );
		} );

		test( 'should render batch size range with max 50', async () => {
			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			const rangeInput = screen.getByTestId( 'batch-size-input' );
			expect( rangeInput ).toHaveAttribute( 'max', '50' );
		} );
	} );

	// ============================================================
	// API Error Handling
	// ============================================================
	describe( 'api error handling', () => {
		test( 'should handle load settings failure gracefully', async () => {
			apiFetch.mockRejectedValue( new Error( 'Network error' ) );

			// Suppress console.error for this test
			const consoleSpy = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );

			render( <GlobalSettingsModal { ...defaultProps } /> );

			await waitFor( () => {
				expect( consoleSpy ).toHaveBeenCalledWith(
					'Failed to load global settings:',
					expect.any( Error )
				);
			} );

			// Should still render with default settings after error
			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			consoleSpy.mockRestore();
		} );
	} );

	// ============================================================
	// Modal Reopening
	// ============================================================
	describe( 'modal reopening', () => {
		test( 'should reload settings when modal reopens', async () => {
			const { rerender } = render(
				<GlobalSettingsModal { ...defaultProps } />
			);

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledTimes( 1 );
			} );

			// Close modal
			rerender(
				<GlobalSettingsModal { ...defaultProps } isOpen={ false } />
			);

			// Reopen modal
			rerender(
				<GlobalSettingsModal { ...defaultProps } isOpen={ true } />
			);

			await waitFor( () => {
				expect( apiFetch ).toHaveBeenCalledTimes( 2 );
			} );
		} );

		test( 'should reset hasChanges when modal reopens', async () => {
			const onClose = jest.fn();
			const { rerender } = render(
				<GlobalSettingsModal isOpen={ true } onClose={ onClose } />
			);

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Make a change
			const toggle = screen.getByTestId( 'toggle-input-static-site' );
			fireEvent.click( toggle );

			// Save should be enabled
			expect( screen.getByText( 'Save Settings' ) ).not.toBeDisabled();

			// Close modal via prop change (simulating parent handling onClose)
			rerender(
				<GlobalSettingsModal isOpen={ false } onClose={ onClose } />
			);

			// Reopen modal
			rerender(
				<GlobalSettingsModal isOpen={ true } onClose={ onClose } />
			);

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );

			// Save should be disabled again (no changes - settings were reloaded fresh)
			expect( screen.getByText( 'Save Settings' ) ).toBeDisabled();
		} );
	} );
} );
