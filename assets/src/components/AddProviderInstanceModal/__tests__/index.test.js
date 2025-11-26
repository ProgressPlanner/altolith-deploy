/**
 * AddProviderInstanceModal Component Tests
 *
 * Tests for the modal that creates new provider instances.
 * Covers form validation, provider selection, instance creation, and edge cases.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock WordPress element
jest.mock( '@wordpress/element', () => ( {
	useState: jest.requireActual( 'react' ).useState,
	useEffect: jest.requireActual( 'react' ).useEffect,
} ) );

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => {
		let result = format;
		args.forEach( ( arg ) => {
			result = result.replace( /%[sd]/, arg );
		} );
		return result;
	},
} ) );

// Mock uuid
const mockUuid = jest.fn( () => 'mock-uuid-12345' );
jest.mock( 'uuid', () => ( {
	v4: () => mockUuid(),
} ) );

// Mock deployment type constants
jest.mock( '@aether/constants/deploymentTypes', () => ( {
	DEPLOYMENT_TYPE_LABELS: {
		static_site: 'Static Site',
		blueprint_bundle: 'Blueprint Bundle',
	},
} ) );

// Mock styles
jest.mock( '@aether/utils/styles', () => ( {
	spacing: { lg: '16px' },
} ) );

// Mock WordPress components
jest.mock( '@wordpress/components', () => ( {
	Modal: ( { children, title, onRequestClose, className } ) => (
		<div className={ className } data-testid="modal">
			<h1>{ title }</h1>
			<button onClick={ onRequestClose } data-testid="modal-close">
				Close
			</button>
			{ children }
		</div>
	),
	TextControl: ( { label, value, onChange, placeholder, help, className } ) => (
		<div className={ className }>
			<label>
				{ label }
				<input
					type="text"
					value={ value }
					onChange={ ( e ) => onChange( e.target.value ) }
					placeholder={ placeholder }
					data-testid="instance-name-input"
				/>
			</label>
			{ help && <span className="help">{ help }</span> }
		</div>
	),
	SelectControl: ( { label, value, onChange, options, help, className } ) => (
		<div className={ className }>
			<label>
				{ label }
				<select
					value={ value }
					onChange={ ( e ) => onChange( e.target.value ) }
					data-testid="provider-select"
				>
					{ options.map( ( opt ) => (
						<option key={ opt.value } value={ opt.value }>
							{ opt.label }
						</option>
					) ) }
				</select>
			</label>
			{ help && <span className="help">{ help }</span> }
		</div>
	),
} ) );

// Mock ModalActions
jest.mock( '../../ModalActions', () => ( {
	__esModule: true,
	default: ( {
		onCancel,
		onSubmit,
		cancelLabel,
		submitLabel,
		isSubmitting,
		isSubmitDisabled,
	} ) => (
		<div data-testid="modal-actions">
			<button onClick={ onCancel } data-testid="cancel-button">
				{ cancelLabel }
			</button>
			<button
				onClick={ onSubmit }
				disabled={ isSubmitDisabled }
				data-testid="submit-button"
				data-submitting={ isSubmitting }
			>
				{ submitLabel }
			</button>
		</div>
	),
} ) );

import AddProviderInstanceModal from '../index';

describe( 'AddProviderInstanceModal', () => {
	const mockProviders = [
		{
			id: 'local-filesystem',
			name: 'Local Filesystem',
			description: 'Stores files locally',
		},
		{
			id: 's3-bucket',
			name: 'S3 Bucket',
			description: 'Amazon S3 storage',
		},
		{
			id: 'cloudflare-r2',
			name: 'Cloudflare R2',
			description: 'Cloudflare R2 object storage',
		},
	];

	const defaultProps = {
		isOpen: true,
		onClose: jest.fn(),
		providers: mockProviders,
		onCreate: jest.fn().mockResolvedValue( undefined ),
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockUuid.mockReturnValue( 'mock-uuid-12345' );
	} );

	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should render nothing when isOpen is false', () => {
			const { container } = render(
				<AddProviderInstanceModal { ...defaultProps } isOpen={ false } />
			);

			expect( container.firstChild ).toBeNull();
		} );

		test( 'should render modal when isOpen is true', () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		test( 'should show default modal title', () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			expect(
				screen.getByText( 'Add Provider Instance' )
			).toBeInTheDocument();
		} );

		test( 'should show deployment type in title when provided', () => {
			render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					deploymentType="static_site"
				/>
			);

			expect(
				screen.getByText( 'Add Static Site Provider' )
			).toBeInTheDocument();
		} );

		test( 'should render provider select', () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			expect( screen.getByTestId( 'provider-select' ) ).toBeInTheDocument();
		} );

		test( 'should show all provider options', () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			expect( screen.getByText( 'Local Filesystem' ) ).toBeInTheDocument();
			expect( screen.getByText( 'S3 Bucket' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Cloudflare R2' ) ).toBeInTheDocument();
		} );

		test( 'should show "Select a provider" placeholder option', () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			expect(
				screen.getByText( 'Select a provider…' )
			).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Provider Selection
	// ============================================================
	describe( 'provider selection', () => {
		test( 'should not show instance name input before provider is selected', () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			expect(
				screen.queryByTestId( 'instance-name-input' )
			).not.toBeInTheDocument();
		} );

		test( 'should show instance name input after provider is selected', async () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 'local-filesystem' } } );

			expect(
				screen.getByTestId( 'instance-name-input' )
			).toBeInTheDocument();
		} );

		test( 'should auto-select provider when only one is available', () => {
			const singleProvider = [ mockProviders[ 0 ] ];

			render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					providers={ singleProvider }
				/>
			);

			// Should auto-select and show instance name input
			expect(
				screen.getByTestId( 'instance-name-input' )
			).toBeInTheDocument();
		} );

		test( 'should show provider description as help text when selected', async () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 'local-filesystem' } } );

			expect( screen.getByText( 'Stores files locally' ) ).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Form Validation
	// ============================================================
	describe( 'form validation', () => {
		test( 'should disable submit when no provider is selected', () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			const submitButton = screen.getByTestId( 'submit-button' );
			expect( submitButton ).toBeDisabled();
		} );

		test( 'should disable submit when instance name is empty', async () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 'local-filesystem' } } );

			const submitButton = screen.getByTestId( 'submit-button' );
			expect( submitButton ).toBeDisabled();
		} );

		test( 'should disable submit when instance name is whitespace only', async () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 'local-filesystem' } } );

			const input = screen.getByTestId( 'instance-name-input' );
			fireEvent.change( input, { target: { value: '   ' } } );

			const submitButton = screen.getByTestId( 'submit-button' );
			expect( submitButton ).toBeDisabled();
		} );

		test( 'should enable submit when provider and name are valid', async () => {
			render( <AddProviderInstanceModal { ...defaultProps } /> );

			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 'local-filesystem' } } );

			const input = screen.getByTestId( 'instance-name-input' );
			fireEvent.change( input, { target: { value: 'My Instance' } } );

			const submitButton = screen.getByTestId( 'submit-button' );
			expect( submitButton ).not.toBeDisabled();
		} );
	} );

	// ============================================================
	// Instance Creation
	// ============================================================
	describe( 'instance creation', () => {
		test( 'should call onCreate with correct parameters', async () => {
			const mockOnCreate = jest.fn().mockResolvedValue( undefined );

			render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					onCreate={ mockOnCreate }
				/>
			);

			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 'local-filesystem' } } );

			const input = screen.getByTestId( 'instance-name-input' );
			fireEvent.change( input, { target: { value: 'Production' } } );

			const submitButton = screen.getByTestId( 'submit-button' );
			fireEvent.click( submitButton );

			await waitFor( () => {
				expect( mockOnCreate ).toHaveBeenCalledWith(
					'local-filesystem:mock-uuid-12345',
					'local-filesystem',
					'Production'
				);
			} );
		} );

		test( 'should trim whitespace from instance name', async () => {
			const mockOnCreate = jest.fn().mockResolvedValue( undefined );

			render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					onCreate={ mockOnCreate }
				/>
			);

			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 's3-bucket' } } );

			const input = screen.getByTestId( 'instance-name-input' );
			fireEvent.change( input, { target: { value: '  My Instance  ' } } );

			const submitButton = screen.getByTestId( 'submit-button' );
			fireEvent.click( submitButton );

			await waitFor( () => {
				expect( mockOnCreate ).toHaveBeenCalledWith(
					's3-bucket:mock-uuid-12345',
					's3-bucket',
					'My Instance' // Trimmed
				);
			} );
		} );

		test( 'should call onClose after successful creation', async () => {
			const mockOnClose = jest.fn();
			const mockOnCreate = jest.fn().mockResolvedValue( undefined );

			render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					onClose={ mockOnClose }
					onCreate={ mockOnCreate }
				/>
			);

			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 'local-filesystem' } } );

			const input = screen.getByTestId( 'instance-name-input' );
			fireEvent.change( input, { target: { value: 'Test' } } );

			const submitButton = screen.getByTestId( 'submit-button' );
			fireEvent.click( submitButton );

			await waitFor( () => {
				expect( mockOnClose ).toHaveBeenCalled();
			} );
		} );

		test( 'should not call onClose if creation fails', async () => {
			const mockOnClose = jest.fn();
			const mockOnCreate = jest
				.fn()
				.mockRejectedValue( new Error( 'Creation failed' ) );

			// Mock console.error and alert
			const consoleError = jest
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );
			const alertMock = jest.spyOn( window, 'alert' ).mockImplementation( () => {} );

			render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					onClose={ mockOnClose }
					onCreate={ mockOnCreate }
				/>
			);

			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 'local-filesystem' } } );

			const input = screen.getByTestId( 'instance-name-input' );
			fireEvent.change( input, { target: { value: 'Test' } } );

			const submitButton = screen.getByTestId( 'submit-button' );
			fireEvent.click( submitButton );

			await waitFor( () => {
				expect( mockOnCreate ).toHaveBeenCalled();
			} );

			expect( mockOnClose ).not.toHaveBeenCalled();
			expect( alertMock ).toHaveBeenCalled();

			consoleError.mockRestore();
			alertMock.mockRestore();
		} );

		test( 'should generate unique instance IDs', async () => {
			const mockOnCreate = jest.fn().mockResolvedValue( undefined );

			// First creation
			mockUuid.mockReturnValueOnce( 'uuid-1' );
			const { rerender } = render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					onCreate={ mockOnCreate }
				/>
			);

			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 'local-filesystem' } } );

			const input = screen.getByTestId( 'instance-name-input' );
			fireEvent.change( input, { target: { value: 'Instance 1' } } );

			fireEvent.click( screen.getByTestId( 'submit-button' ) );

			await waitFor( () => {
				expect( mockOnCreate ).toHaveBeenCalledWith(
					'local-filesystem:uuid-1',
					'local-filesystem',
					'Instance 1'
				);
			} );

			// Close and reopen for second creation
			rerender(
				<AddProviderInstanceModal
					{ ...defaultProps }
					isOpen={ false }
					onCreate={ mockOnCreate }
				/>
			);
			mockUuid.mockReturnValueOnce( 'uuid-2' );
			rerender(
				<AddProviderInstanceModal
					{ ...defaultProps }
					onCreate={ mockOnCreate }
				/>
			);

			fireEvent.change( screen.getByTestId( 'provider-select' ), {
				target: { value: 'local-filesystem' },
			} );
			fireEvent.change( screen.getByTestId( 'instance-name-input' ), {
				target: { value: 'Instance 2' },
			} );
			fireEvent.click( screen.getByTestId( 'submit-button' ) );

			await waitFor( () => {
				expect( mockOnCreate ).toHaveBeenLastCalledWith(
					'local-filesystem:uuid-2',
					'local-filesystem',
					'Instance 2'
				);
			} );
		} );
	} );

	// ============================================================
	// Modal Closing and Form Reset
	// ============================================================
	describe( 'modal closing', () => {
		test( 'should call onClose when cancel button is clicked', () => {
			const mockOnClose = jest.fn();

			render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					onClose={ mockOnClose }
				/>
			);

			fireEvent.click( screen.getByTestId( 'cancel-button' ) );

			expect( mockOnClose ).toHaveBeenCalled();
		} );

		test( 'should call onClose when modal close button is clicked', () => {
			const mockOnClose = jest.fn();

			render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					onClose={ mockOnClose }
				/>
			);

			fireEvent.click( screen.getByTestId( 'modal-close' ) );

			expect( mockOnClose ).toHaveBeenCalled();
		} );

		test( 'should reset form when modal closes and reopens', async () => {
			const { rerender } = render(
				<AddProviderInstanceModal { ...defaultProps } />
			);

			// Fill in the form
			const select = screen.getByTestId( 'provider-select' );
			fireEvent.change( select, { target: { value: 'local-filesystem' } } );

			const input = screen.getByTestId( 'instance-name-input' );
			fireEvent.change( input, { target: { value: 'My Instance' } } );

			// Close modal
			rerender(
				<AddProviderInstanceModal { ...defaultProps } isOpen={ false } />
			);

			// Reopen modal
			rerender( <AddProviderInstanceModal { ...defaultProps } /> );

			// Form should be reset - no instance name input (provider not selected)
			expect(
				screen.queryByTestId( 'instance-name-input' )
			).not.toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Edge Cases
	// ============================================================
	describe( 'edge cases', () => {
		test( 'should handle empty providers array', () => {
			render(
				<AddProviderInstanceModal { ...defaultProps } providers={ [] } />
			);

			// Should still render modal
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		test( 'should handle provider without description', async () => {
			const providersNoDesc = [
				{ id: 'no-desc-provider', name: 'No Description' },
			];

			render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					providers={ providersNoDesc }
				/>
			);

			// Auto-selects single provider, should not crash
			expect(
				screen.getByTestId( 'instance-name-input' )
			).toBeInTheDocument();
		} );

		test( 'should reset selection if selected provider becomes unavailable and multiple providers remain', async () => {
			const { rerender } = render(
				<AddProviderInstanceModal { ...defaultProps } />
			);

			// Select a provider
			fireEvent.change( screen.getByTestId( 'provider-select' ), {
				target: { value: 'local-filesystem' },
			} );

			expect(
				screen.getByTestId( 'instance-name-input' )
			).toBeInTheDocument();

			// Update providers to not include the selected one (but keep multiple)
			const newProviders = [ mockProviders[ 1 ], mockProviders[ 2 ] ]; // s3-bucket and cloudflare-r2
			rerender(
				<AddProviderInstanceModal
					{ ...defaultProps }
					providers={ newProviders }
				/>
			);

			// Instance name input should be gone (provider reset, no auto-select since > 1)
			await waitFor( () => {
				expect(
					screen.queryByTestId( 'instance-name-input' )
				).not.toBeInTheDocument();
			} );
		} );

		test( 'should auto-select when provider becomes unavailable and only one remains', async () => {
			const { rerender } = render(
				<AddProviderInstanceModal { ...defaultProps } />
			);

			// Select a provider
			fireEvent.change( screen.getByTestId( 'provider-select' ), {
				target: { value: 'local-filesystem' },
			} );

			expect(
				screen.getByTestId( 'instance-name-input' )
			).toBeInTheDocument();

			// Update providers to only s3-bucket (single provider auto-selects)
			const newProviders = [ mockProviders[ 1 ] ]; // Only s3-bucket
			rerender(
				<AddProviderInstanceModal
					{ ...defaultProps }
					providers={ newProviders }
				/>
			);

			// Instance name input should still be there (auto-selected the remaining provider)
			expect(
				screen.getByTestId( 'instance-name-input' )
			).toBeInTheDocument();
		} );

		test( 'should handle deployment type with no label', () => {
			render(
				<AddProviderInstanceModal
					{ ...defaultProps }
					deploymentType="unknown_type"
				/>
			);

			// Should use the raw deployment type as fallback
			expect(
				screen.getByText( 'Add unknown_type Provider' )
			).toBeInTheDocument();
		} );
	} );
} );
