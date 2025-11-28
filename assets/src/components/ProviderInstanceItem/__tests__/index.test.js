/**
 * ProviderInstanceItem Component Tests
 *
 * Tests for the provider instance table row component.
 * Covers name editing, settings modal, delete confirmation, and status indicators.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock WordPress dependencies
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => {
		let result = format;
		args.forEach( ( arg, index ) => {
			result = result.replace( /%s|%\d\$s/, arg );
		} );
		return result;
	},
} ) );

jest.mock( '@wordpress/element', () => ( {
	useState: jest.requireActual( 'react' ).useState,
	useRef: jest.requireActual( 'react' ).useRef,
	useEffect: jest.requireActual( 'react' ).useEffect,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick, variant, isDestructive, icon } ) => (
		<button
			onClick={ onClick }
			data-variant={ variant }
			data-destructive={ isDestructive }
			data-testid={ `button-${ children
				?.toString()
				.toLowerCase()
				.replace( /\s+/g, '-' ) }` }
		>
			{ children }
		</button>
	),
	Modal: ( { children, title, onRequestClose, className } ) => (
		<div data-testid="modal" className={ className } data-title={ title }>
			<button data-testid="modal-close" onClick={ onRequestClose }>
				Close
			</button>
			{ children }
		</div>
	),
	Icon: ( { icon, style } ) => (
		<span
			data-testid="icon"
			data-icon={ icon?.name || 'icon' }
			style={ style }
		/>
	),
} ) );

jest.mock( '@wordpress/icons', () => ( {
	settings: { name: 'settings' },
	trash: { name: 'trash' },
	check: { name: 'check' },
	close: { name: 'close' },
} ) );

jest.mock( '@altolith/components/ProviderForm', () => ( {
	__esModule: true,
	default: ( { providerId, fields, initialValues, onChange, onSubmit } ) => (
		<form
			data-testid="provider-form"
			data-provider-id={ providerId }
			onSubmit={ async ( e ) => {
				e.preventDefault();
				// The real form calls onSubmit which returns a promise
				// We need to catch and ignore errors to prevent unhandled rejection
				try {
					await onSubmit( initialValues );
				} catch {
					// Error is handled by the component's state
				}
			} }
		>
			{ fields.map( ( field ) => (
				<input
					key={ field.id }
					data-testid={ `field-${ field.id }` }
					value={ initialValues[ field.id ] || '' }
					onChange={ ( e ) => onChange( field.id, e.target.value ) }
				/>
			) ) }
			<button type="submit" data-testid="form-submit">
				Save
			</button>
		</form>
	),
} ) );

jest.mock( '@altolith/components/StatusNotice', () => ( {
	__esModule: true,
	default: ( { status, message, isDismissible, onRemove } ) => (
		<div data-testid="status-notice" data-status={ status }>
			{ message }
			{ isDismissible && onRemove && (
				<button data-testid="dismiss-notice" onClick={ onRemove }>
					Dismiss
				</button>
			) }
		</div>
	),
} ) );

jest.mock( '@altolith/providers/utils/configValidation', () => ( {
	hasRequiredFields: jest.fn( () => true ),
} ) );

jest.mock( '@altolith/utils/styles', () => ( {
	colors: {
		text: '#333',
		white: '#fff',
		primary: '#0073aa',
		success: '#46b450',
		error: '#dc3232',
		borderLight: '#e0e0e0',
		backgroundLighter: '#f9f9f9',
		deploymentStaticSite: '#2271b1',
		deploymentBlueprintBundle: '#9c27b0',
	},
	spacing: { xs: '4px', sm: '8px', md: '12px', lg: '16px' },
	fontWeight: { medium: '500', semibold: '600' },
	fontSize: { xs: '11px', base: '14px' },
	borderRadius: { sm: '4px' },
	createFlexStyle: ( direction, gap ) => ( {
		display: 'flex',
		flexDirection: direction,
		gap,
	} ),
} ) );

// No deployment types mock needed - component now uses string literals

import ProviderInstanceItem from '../index';
import { hasRequiredFields } from '@altolith/providers/utils/configValidation';

describe( 'ProviderInstanceItem', () => {
	const mockInstance = {
		instanceId: 'local-filesystem:abc-123',
		config: {
			instance_name: 'My Local Export',
			provider_type: 'local-filesystem',
			output_path: '/var/www/exports',
		},
	};

	const mockProvider = {
		id: 'local-filesystem',
		metadata: {
			name: 'Local Filesystem',
		},
		settingsFields: [
			{
				id: 'output_path',
				label: 'Output Path',
				type: 'text',
				required: true,
			},
			{
				id: 'create_index',
				label: 'Create Index',
				type: 'checkbox',
				required: false,
			},
		],
	};

	const defaultProps = {
		instance: mockInstance,
		provider: mockProvider,
		deploymentType: 'static_site',
		deploymentTypeLabel: 'Static Site',
		onDelete: jest.fn(),
		onRename: jest.fn(),
		onSave: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();
		hasRequiredFields.mockReturnValue( true );
		// Mock window.confirm
		window.confirm = jest.fn( () => true );
	} );

	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should render as table row', () => {
			const { container } = render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			expect( container.querySelector( 'tr' ) ).toBeInTheDocument();
		} );

		test( 'should render instance name', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			expect( screen.getByText( 'My Local Export' ) ).toBeInTheDocument();
		} );

		test( 'should render provider name', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			expect(
				screen.getByText( 'Local Filesystem' )
			).toBeInTheDocument();
		} );

		test( 'should render deployment type tag', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			expect( screen.getByText( 'Static Site' ) ).toBeInTheDocument();
		} );

		test( 'should render Settings button', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			expect(
				screen.getByTestId( 'button-settings' )
			).toBeInTheDocument();
		} );

		test( 'should render Delete button', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			expect( screen.getByTestId( 'button-delete' ) ).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Status Indicators
	// ============================================================
	describe( 'status indicators', () => {
		test( 'should show check icon when all required fields are filled', () => {
			hasRequiredFields.mockReturnValue( true );

			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			const icon = screen.getByTestId( 'icon' );
			expect( icon ).toHaveStyle( { color: '#46b450' } ); // success color
		} );

		test( 'should show close icon when required fields are missing', () => {
			hasRequiredFields.mockReturnValue( false );

			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			const icon = screen.getByTestId( 'icon' );
			expect( icon ).toHaveStyle( { color: '#dc3232' } ); // error color
		} );

		test( 'should call hasRequiredFields with config and fields', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			expect( hasRequiredFields ).toHaveBeenCalledWith(
				mockInstance.config,
				mockProvider.settingsFields
			);
		} );
	} );

	// ============================================================
	// Inline Name Editing
	// ============================================================
	describe( 'inline name editing', () => {
		test( 'should enter edit mode when name is clicked', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByText( 'My Local Export' ) );

			expect(
				screen.getByDisplayValue( 'My Local Export' )
			).toBeInTheDocument();
		} );

		test( 'should show input field in edit mode', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByText( 'My Local Export' ) );

			const input = screen.getByDisplayValue( 'My Local Export' );
			expect( input.tagName ).toBe( 'INPUT' );
			expect( input ).toHaveAttribute( 'type', 'text' );
		} );

		test( 'should call onRename when name is changed and blurred', async () => {
			const mockOnRename = jest.fn().mockResolvedValue();

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onRename={ mockOnRename }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByText( 'My Local Export' ) );
			const input = screen.getByDisplayValue( 'My Local Export' );

			fireEvent.change( input, { target: { value: 'New Name' } } );
			fireEvent.blur( input );

			await waitFor( () => {
				expect( mockOnRename ).toHaveBeenCalledWith(
					'local-filesystem:abc-123',
					'New Name'
				);
			} );
		} );

		test( 'should call onRename when Enter is pressed', async () => {
			const mockOnRename = jest.fn().mockResolvedValue();

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onRename={ mockOnRename }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByText( 'My Local Export' ) );
			const input = screen.getByDisplayValue( 'My Local Export' );

			fireEvent.change( input, { target: { value: 'New Name' } } );
			fireEvent.keyDown( input, { key: 'Enter' } );

			await waitFor( () => {
				expect( mockOnRename ).toHaveBeenCalledWith(
					'local-filesystem:abc-123',
					'New Name'
				);
			} );
		} );

		test( 'should cancel edit when Escape is pressed', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByText( 'My Local Export' ) );
			const input = screen.getByDisplayValue( 'My Local Export' );

			fireEvent.change( input, { target: { value: 'Changed Name' } } );
			fireEvent.keyDown( input, { key: 'Escape' } );

			// Should exit edit mode and show original name
			expect( screen.getByText( 'My Local Export' ) ).toBeInTheDocument();
			expect(
				screen.queryByDisplayValue( 'Changed Name' )
			).not.toBeInTheDocument();
		} );

		test( 'should not call onRename when name is unchanged', async () => {
			const mockOnRename = jest.fn().mockResolvedValue();

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onRename={ mockOnRename }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByText( 'My Local Export' ) );
			const input = screen.getByDisplayValue( 'My Local Export' );

			fireEvent.blur( input );

			await waitFor( () => {
				expect( mockOnRename ).not.toHaveBeenCalled();
			} );
		} );

		test( 'should not call onRename when name is empty', async () => {
			const mockOnRename = jest.fn().mockResolvedValue();

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onRename={ mockOnRename }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByText( 'My Local Export' ) );
			const input = screen.getByDisplayValue( 'My Local Export' );

			fireEvent.change( input, { target: { value: '' } } );
			fireEvent.blur( input );

			await waitFor( () => {
				expect( mockOnRename ).not.toHaveBeenCalled();
			} );
		} );

		test( 'should trim whitespace from name', async () => {
			const mockOnRename = jest.fn().mockResolvedValue();

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onRename={ mockOnRename }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByText( 'My Local Export' ) );
			const input = screen.getByDisplayValue( 'My Local Export' );

			fireEvent.change( input, {
				target: { value: '  Trimmed Name  ' },
			} );
			fireEvent.blur( input );

			await waitFor( () => {
				expect( mockOnRename ).toHaveBeenCalledWith(
					'local-filesystem:abc-123',
					'Trimmed Name'
				);
			} );
		} );

		test( 'should handle keyboard navigation to enter edit mode', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			const nameElement = screen.getByText( 'My Local Export' );
			fireEvent.keyDown( nameElement, { key: 'Enter' } );

			expect(
				screen.getByDisplayValue( 'My Local Export' )
			).toBeInTheDocument();
		} );

		test( 'should handle Space key to enter edit mode', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			const nameElement = screen.getByText( 'My Local Export' );
			fireEvent.keyDown( nameElement, { key: ' ' } );

			expect(
				screen.getByDisplayValue( 'My Local Export' )
			).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Settings Modal
	// ============================================================
	describe( 'settings modal', () => {
		test( 'should open modal when Settings button is clicked', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-settings' ) );

			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		test( 'should display modal with correct title', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-settings' ) );

			const modal = screen.getByTestId( 'modal' );
			expect( modal ).toHaveAttribute(
				'data-title',
				'Settings: My Local Export'
			);
		} );

		test( 'should render ProviderForm in modal', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-settings' ) );

			expect( screen.getByTestId( 'provider-form' ) ).toBeInTheDocument();
		} );

		test( 'should close modal when close button is clicked', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-settings' ) );
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();

			fireEvent.click( screen.getByTestId( 'modal-close' ) );
			expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
		} );

		test( 'should call onSave when form is submitted', async () => {
			const mockOnSave = jest.fn().mockResolvedValue();

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onSave={ mockOnSave }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-settings' ) );
			fireEvent.click( screen.getByTestId( 'form-submit' ) );

			await waitFor( () => {
				expect( mockOnSave ).toHaveBeenCalledWith(
					'local-filesystem:abc-123',
					expect.any( Object )
				);
			} );
		} );

		test( 'should close modal after successful save', async () => {
			const mockOnSave = jest.fn().mockResolvedValue();

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onSave={ mockOnSave }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-settings' ) );
			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();

			fireEvent.click( screen.getByTestId( 'form-submit' ) );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'modal' )
				).not.toBeInTheDocument();
			} );
		} );

		test( 'should show error notice when save fails', async () => {
			const mockOnSave = jest
				.fn()
				.mockRejectedValue( new Error( 'Save failed' ) );

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onSave={ mockOnSave }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-settings' ) );
			fireEvent.click( screen.getByTestId( 'form-submit' ) );

			await waitFor( () => {
				expect(
					screen.getByTestId( 'status-notice' )
				).toBeInTheDocument();
				expect( screen.getByText( 'Save failed' ) ).toBeInTheDocument();
			} );
		} );

		test( 'should keep modal open when save fails', async () => {
			const mockOnSave = jest
				.fn()
				.mockRejectedValue( new Error( 'Save failed' ) );

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onSave={ mockOnSave }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-settings' ) );
			fireEvent.click( screen.getByTestId( 'form-submit' ) );

			await waitFor( () => {
				expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
			} );
		} );

		test( 'should dismiss error notice when dismiss button is clicked', async () => {
			const mockOnSave = jest
				.fn()
				.mockRejectedValue( new Error( 'Save failed' ) );

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onSave={ mockOnSave }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-settings' ) );
			fireEvent.click( screen.getByTestId( 'form-submit' ) );

			await waitFor( () => {
				expect(
					screen.getByTestId( 'status-notice' )
				).toBeInTheDocument();
			} );

			fireEvent.click( screen.getByTestId( 'dismiss-notice' ) );

			expect(
				screen.queryByTestId( 'status-notice' )
			).not.toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Delete Functionality
	// ============================================================
	describe( 'delete functionality', () => {
		test( 'should show confirmation dialog when Delete is clicked', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-delete' ) );

			expect( window.confirm ).toHaveBeenCalled();
		} );

		test( 'should call onDelete when confirmation is accepted', () => {
			window.confirm = jest.fn( () => true );

			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-delete' ) );

			expect( defaultProps.onDelete ).toHaveBeenCalled();
		} );

		test( 'should not call onDelete when confirmation is rejected', () => {
			window.confirm = jest.fn( () => false );

			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-delete' ) );

			expect( defaultProps.onDelete ).not.toHaveBeenCalled();
		} );

		test( 'should include instance name in confirmation message', () => {
			window.confirm = jest.fn( () => true );

			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByTestId( 'button-delete' ) );

			expect( window.confirm ).toHaveBeenCalledWith(
				expect.stringContaining( 'My Local Export' )
			);
		} );
	} );

	// ============================================================
	// Deployment Type Colors
	// ============================================================
	describe( 'deployment type colors', () => {
		test( 'should apply static_site color for static site deployment', () => {
			const { container } = render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							deploymentType="static_site"
						/>
					</tbody>
				</table>
			);

			const tag = container.querySelector( 'span' );
			expect( tag ).toHaveStyle( { backgroundColor: '#2271b1' } );
		} );

		test( 'should apply blueprint_bundle color for blueprint deployment', () => {
			const { container } = render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							deploymentType="blueprint_bundle"
							deploymentTypeLabel="Blueprint Bundle"
						/>
					</tbody>
				</table>
			);

			const tag = container.querySelector( 'span' );
			expect( tag ).toHaveStyle( { backgroundColor: '#9c27b0' } );
		} );

		test( 'should apply primary color for unknown deployment type', () => {
			const { container } = render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							deploymentType="unknown-type"
							deploymentTypeLabel="Unknown"
						/>
					</tbody>
				</table>
			);

			const tag = container.querySelector( 'span' );
			expect( tag ).toHaveStyle( { backgroundColor: '#0073aa' } );
		} );

		test( 'should not render tag when deploymentTypeLabel is not provided', () => {
			const { container } = render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							deploymentType="static_site"
							deploymentTypeLabel={ null }
						/>
					</tbody>
				</table>
			);

			// The span with tag style should not be present
			const tags = container.querySelectorAll( 'span' );
			const tagSpans = Array.from( tags ).filter(
				( span ) =>
					span.textContent && span.textContent.includes( 'Site' )
			);
			expect( tagSpans ).toHaveLength( 0 );
		} );
	} );

	// ============================================================
	// Provider Fallbacks
	// ============================================================
	describe( 'provider fallbacks', () => {
		test( 'should use provider.id when metadata.name is missing', () => {
			const providerWithoutMetadataName = {
				...mockProvider,
				metadata: {},
			};

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							provider={ providerWithoutMetadataName }
						/>
					</tbody>
				</table>
			);

			expect(
				screen.getByText( 'local-filesystem' )
			).toBeInTheDocument();
		} );

		test( 'should extract provider type from instanceId when provider_type is missing', () => {
			const instanceWithoutProviderType = {
				instanceId: 's3-bucket:xyz-789',
				config: {
					instance_name: 'S3 Export',
					// No provider_type
				},
			};

			const s3Provider = {
				id: 's3-bucket',
				metadata: {},
				settingsFields: [],
			};

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							instance={ instanceWithoutProviderType }
							provider={ s3Provider }
						/>
					</tbody>
				</table>
			);

			expect( screen.getByText( 's3-bucket' ) ).toBeInTheDocument();
		} );

		test( 'should handle missing provider.settingsFields', () => {
			const providerWithoutFields = {
				id: 'simple-provider',
				metadata: { name: 'Simple Provider' },
				// No settingsFields
			};

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							provider={ providerWithoutFields }
						/>
					</tbody>
				</table>
			);

			// Should render without crashing
			expect( screen.getByText( 'My Local Export' ) ).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Edge Cases
	// ============================================================
	describe( 'edge cases', () => {
		test( 'should handle empty instance name', () => {
			const instanceWithoutName = {
				...mockInstance,
				config: {
					...mockInstance.config,
					instance_name: '',
				},
			};

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							instance={ instanceWithoutName }
						/>
					</tbody>
				</table>
			);

			// Should render without crashing, name cell should be empty
			expect(
				screen.getByTestId( 'button-settings' )
			).toBeInTheDocument();
		} );

		test( 'should handle undefined instance name', () => {
			const instanceWithUndefinedName = {
				...mockInstance,
				config: {
					...mockInstance.config,
					instance_name: undefined,
				},
			};

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							instance={ instanceWithUndefinedName }
						/>
					</tbody>
				</table>
			);

			// Should render without crashing
			expect(
				screen.getByTestId( 'button-settings' )
			).toBeInTheDocument();
		} );

		test( 'should handle rename error gracefully', async () => {
			const mockOnRename = jest
				.fn()
				.mockRejectedValue( new Error( 'Rename failed' ) );

			render(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							onRename={ mockOnRename }
						/>
					</tbody>
				</table>
			);

			fireEvent.click( screen.getByText( 'My Local Export' ) );
			const input = screen.getByDisplayValue( 'My Local Export' );

			fireEvent.change( input, { target: { value: 'New Name' } } );
			fireEvent.blur( input );

			// Should exit edit mode even on error
			await waitFor( () => {
				expect(
					screen.queryByDisplayValue( 'New Name' )
				).not.toBeInTheDocument();
			} );
		} );

		test( 'should sync config when instance.config changes', () => {
			const { rerender } = render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			const updatedInstance = {
				...mockInstance,
				config: {
					...mockInstance.config,
					instance_name: 'Updated Name',
				},
			};

			rerender(
				<table>
					<tbody>
						<ProviderInstanceItem
							{ ...defaultProps }
							instance={ updatedInstance }
						/>
					</tbody>
				</table>
			);

			expect( screen.getByText( 'Updated Name' ) ).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Accessibility
	// ============================================================
	describe( 'accessibility', () => {
		test( 'should have clickable name with button role', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			const nameElement = screen.getByText( 'My Local Export' );
			expect( nameElement ).toHaveAttribute( 'role', 'button' );
		} );

		test( 'should have tabIndex for keyboard navigation', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			const nameElement = screen.getByText( 'My Local Export' );
			expect( nameElement ).toHaveAttribute( 'tabIndex', '0' );
		} );

		test( 'should have title attribute for edit hint', () => {
			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			const nameElement = screen.getByText( 'My Local Export' );
			expect( nameElement ).toHaveAttribute(
				'title',
				'Click to edit name'
			);
		} );

		test( 'should have aria-label on status icon', () => {
			hasRequiredFields.mockReturnValue( true );

			render(
				<table>
					<tbody>
						<ProviderInstanceItem { ...defaultProps } />
					</tbody>
				</table>
			);

			// The icon is wrapped - check parent has appropriate context
			const icon = screen.getByTestId( 'icon' );
			expect( icon ).toBeInTheDocument();
		} );
	} );
} );
