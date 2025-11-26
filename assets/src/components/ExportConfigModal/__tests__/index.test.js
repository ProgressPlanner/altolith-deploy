/**
 * ExportConfigModal Component Tests
 *
 * Tests for the export configuration modal component.
 * Covers rendering, instance selection, JSON generation, and copy/download.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock WordPress dependencies
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

jest.mock( '@wordpress/element', () => ( {
	useState: jest.requireActual( 'react' ).useState,
	useEffect: jest.requireActual( 'react' ).useEffect,
	useMemo: jest.requireActual( 'react' ).useMemo,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Modal: ( { children, title, onRequestClose } ) => (
		<div data-testid="modal" data-title={ title }>
			<button data-testid="modal-close" onClick={ onRequestClose }>
				Close
			</button>
			{ children }
		</div>
	),
	CheckboxControl: ( { label, checked, onChange, indeterminate } ) => (
		// eslint-disable-next-line jsx-a11y/label-has-associated-control
		<label>
			<input
				type="checkbox"
				data-testid={ `checkbox-${ label
					.replace( /\s+/g, '-' )
					.toLowerCase() }` }
				checked={ checked }
				onChange={ () => onChange( ! checked ) }
				data-indeterminate={ indeterminate }
			/>
			{ label }
		</label>
	),
	TextareaControl: ( { value, readOnly, rows } ) => (
		<textarea
			data-testid="json-output"
			value={ value }
			readOnly={ readOnly }
			rows={ rows }
		/>
	),
	Button: ( { children, onClick, disabled, variant } ) => (
		<button
			onClick={ onClick }
			disabled={ disabled }
			data-variant={ variant }
		>
			{ children }
		</button>
	),
	Notice: ( { children, status } ) => (
		<div data-testid="notice" data-status={ status }>
			{ children }
		</div>
	),
} ) );

jest.mock( '../../ModalActions', () => ( { onCancel, cancelLabel } ) => (
	<div data-testid="modal-actions">
		<button onClick={ onCancel }>{ cancelLabel }</button>
	</div>
) );

jest.mock( '@aether/utils/styles', () => ( {
	colors: { success: 'green', error: 'red' },
	spacing: { xs: '4px', sm: '8px', md: '12px', lg: '16px' },
	fontSize: { sm: '12px' },
	borderRadius: { md: '4px' },
} ) );

import ExportConfigModal from '../index';

describe( 'ExportConfigModal', () => {
	const mockProviderConfigs = {
		'local-filesystem-static-site:uuid-1': {
			instance_name: 'Production',
			provider_type: 'local-filesystem-static-site',
			output_directory: '/var/www/static',
		},
		'cloudflare-r2-static-site:uuid-2': {
			instance_name: 'Staging',
			provider_type: 'cloudflare-r2-static-site',
			account_id: 'abc123',
			api_token: 'secret-token',
		},
	};

	const mockProviders = [
		{ id: 'local-filesystem-static-site', name: 'Local Filesystem' },
		{ id: 'cloudflare-r2-static-site', name: 'Cloudflare R2' },
	];

	const defaultProps = {
		isOpen: true,
		onClose: jest.fn(),
		providerConfigs: mockProviderConfigs,
		providers: mockProviders,
	};

	beforeEach( () => {
		jest.clearAllMocks();
		// Mock clipboard API
		Object.assign( navigator, {
			clipboard: {
				writeText: jest.fn().mockResolvedValue( undefined ),
			},
		} );
		// Mock URL.createObjectURL
		global.URL.createObjectURL = jest.fn( () => 'blob:test-url' );
		global.URL.revokeObjectURL = jest.fn();
	} );

	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should not render when isOpen is false', () => {
			const { container } = render(
				<ExportConfigModal { ...defaultProps } isOpen={ false } />
			);

			expect( container.firstChild ).toBeNull();
		} );

		test( 'should render modal when isOpen is true', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		test( 'should display warning about credentials', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			expect(
				screen.getByText( /credentials in plaintext/i )
			).toBeInTheDocument();
		} );

		test( 'should display all instances as checkboxes', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			expect(
				screen.getByText( /Production \(Local Filesystem\)/ )
			).toBeInTheDocument();
			expect(
				screen.getByText( /Staging \(Cloudflare R2\)/ )
			).toBeInTheDocument();
		} );

		test( 'should show notice when no instances exist', () => {
			render(
				<ExportConfigModal { ...defaultProps } providerConfigs={ {} } />
			);

			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			expect(
				screen.getByText( /No provider instances configured/i )
			).toBeInTheDocument();
		} );

		test( 'should have all instances selected by default', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			const selectAllCheckbox = screen.getByTestId(
				'checkbox-select-all'
			);
			expect( selectAllCheckbox ).toBeChecked();
		} );
	} );

	// ============================================================
	// Selection
	// ============================================================
	describe( 'selection', () => {
		test( 'should toggle individual instance selection', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			const productionCheckbox = screen.getByTestId(
				'checkbox-production-(local-filesystem)'
			);

			// Initially checked
			expect( productionCheckbox ).toBeChecked();

			// Uncheck
			fireEvent.click( productionCheckbox );
			expect( productionCheckbox ).not.toBeChecked();

			// Check again
			fireEvent.click( productionCheckbox );
			expect( productionCheckbox ).toBeChecked();
		} );

		test( 'should toggle all instances with Select All', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			const selectAllCheckbox = screen.getByTestId(
				'checkbox-select-all'
			);

			// Uncheck all
			fireEvent.click( selectAllCheckbox );

			const productionCheckbox = screen.getByTestId(
				'checkbox-production-(local-filesystem)'
			);
			const stagingCheckbox = screen.getByTestId(
				'checkbox-staging-(cloudflare-r2)'
			);

			expect( productionCheckbox ).not.toBeChecked();
			expect( stagingCheckbox ).not.toBeChecked();

			// Check all again
			fireEvent.click( selectAllCheckbox );

			expect( productionCheckbox ).toBeChecked();
			expect( stagingCheckbox ).toBeChecked();
		} );
	} );

	// ============================================================
	// JSON Generation
	// ============================================================
	describe( 'json generation', () => {
		test( 'should generate JSON when Generate button is clicked', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			const generateButton = screen.getByText( 'Generate JSON' );
			fireEvent.click( generateButton );

			const jsonOutput = screen.getByTestId( 'json-output' );
			expect( jsonOutput ).toBeInTheDocument();

			const jsonData = JSON.parse( jsonOutput.value );
			expect( jsonData.version ).toBe( '1.0' );
			expect( jsonData.exportedAt ).toBeDefined();
			expect( jsonData.instances ).toBeDefined();
			expect( Object.keys( jsonData.instances ) ).toHaveLength( 2 );
		} );

		test( 'should only include selected instances in JSON', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			// Uncheck Production
			const productionCheckbox = screen.getByTestId(
				'checkbox-production-(local-filesystem)'
			);
			fireEvent.click( productionCheckbox );

			// Generate JSON
			const generateButton = screen.getByText( 'Generate JSON' );
			fireEvent.click( generateButton );

			const jsonOutput = screen.getByTestId( 'json-output' );
			const jsonData = JSON.parse( jsonOutput.value );

			expect( Object.keys( jsonData.instances ) ).toHaveLength( 1 );
			expect(
				jsonData.instances[ 'cloudflare-r2-static-site:uuid-2' ]
			).toBeDefined();
			expect(
				jsonData.instances[ 'local-filesystem-static-site:uuid-1' ]
			).toBeUndefined();
		} );

		test( 'should disable Generate button when nothing selected', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			// Uncheck all
			const selectAllCheckbox = screen.getByTestId(
				'checkbox-select-all'
			);
			fireEvent.click( selectAllCheckbox );

			const generateButton = screen.getByText( 'Generate JSON' );
			expect( generateButton ).toBeDisabled();
		} );

		test( 'should include credentials in exported JSON', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			const generateButton = screen.getByText( 'Generate JSON' );
			fireEvent.click( generateButton );

			const jsonOutput = screen.getByTestId( 'json-output' );
			const jsonData = JSON.parse( jsonOutput.value );

			const stagingConfig =
				jsonData.instances[ 'cloudflare-r2-static-site:uuid-2' ];
			expect( stagingConfig.api_token ).toBe( 'secret-token' );
			expect( stagingConfig.account_id ).toBe( 'abc123' );
		} );
	} );

	// ============================================================
	// Copy and Download
	// ============================================================
	describe( 'copy and download', () => {
		test( 'should copy JSON to clipboard', async () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			// Generate JSON first
			fireEvent.click( screen.getByText( 'Generate JSON' ) );

			// Click copy
			fireEvent.click( screen.getByText( 'Copy to Clipboard' ) );

			await waitFor( () => {
				expect( navigator.clipboard.writeText ).toHaveBeenCalled();
			} );

			expect( screen.getByText( /Copied!/i ) ).toBeInTheDocument();
		} );

		test( 'should trigger download when Download button is clicked', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			// Generate JSON first
			fireEvent.click( screen.getByText( 'Generate JSON' ) );

			// Click download
			fireEvent.click( screen.getByText( 'Download .json' ) );

			expect( global.URL.createObjectURL ).toHaveBeenCalled();
			expect( global.URL.revokeObjectURL ).toHaveBeenCalled();
		} );

		test( 'should not show copy/download buttons before generating', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			expect(
				screen.queryByText( 'Copy to Clipboard' )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText( 'Download .json' )
			).not.toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Modal Actions
	// ============================================================
	describe( 'modal actions', () => {
		test( 'should call onClose when Close button is clicked', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			// Use the modal actions Close button (from ModalActions mock)
			const closeButtons = screen.getAllByText( 'Close' );
			// The ModalActions "Close" button is the one we want to test
			fireEvent.click( closeButtons[ closeButtons.length - 1 ] );

			expect( defaultProps.onClose ).toHaveBeenCalled();
		} );

		test( 'should call onClose when modal X button is clicked', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			fireEvent.click( screen.getByTestId( 'modal-close' ) );

			expect( defaultProps.onClose ).toHaveBeenCalled();
		} );
	} );

	// ============================================================
	// Edge Cases
	// ============================================================
	describe( 'edge cases', () => {
		test( 'should handle missing instance_name gracefully', () => {
			const configsWithMissingName = {
				'test-provider:uuid-1': {
					provider_type: 'test-provider',
					some_field: 'value',
				},
			};

			render(
				<ExportConfigModal
					{ ...defaultProps }
					providerConfigs={ configsWithMissingName }
					providers={ [] }
				/>
			);

			// Should use instanceId as fallback
			expect(
				screen.getByText( /test-provider:uuid-1/ )
			).toBeInTheDocument();
		} );

		test( 'should handle missing provider in providers array', () => {
			const configsWithUnknownProvider = {
				'unknown-provider:uuid-1': {
					instance_name: 'Unknown',
					provider_type: 'unknown-provider',
				},
			};

			render(
				<ExportConfigModal
					{ ...defaultProps }
					providerConfigs={ configsWithUnknownProvider }
					providers={ [] }
				/>
			);

			// Should use provider_type as fallback name
			expect(
				screen.getByText( /Unknown \(unknown-provider\)/ )
			).toBeInTheDocument();
		} );

		test( 'should clear JSON when selection changes', () => {
			render( <ExportConfigModal { ...defaultProps } /> );

			// Generate JSON
			fireEvent.click( screen.getByText( 'Generate JSON' ) );
			expect( screen.getByTestId( 'json-output' ) ).toBeInTheDocument();

			// Change selection
			const productionCheckbox = screen.getByTestId(
				'checkbox-production-(local-filesystem)'
			);
			fireEvent.click( productionCheckbox );

			// JSON should be cleared
			expect(
				screen.queryByTestId( 'json-output' )
			).not.toBeInTheDocument();
		} );
	} );
} );
