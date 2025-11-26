/**
 * ImportConfigModal Component Tests
 *
 * Tests for the import configuration modal component.
 * Covers rendering, JSON validation, conflict detection, and import.
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
	useRef: jest.requireActual( 'react' ).useRef,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Modal: ( { children, title, onRequestClose } ) => (
		<div data-testid="modal" data-title={ title }>
			<button data-testid="modal-close" onClick={ onRequestClose }>
				X
			</button>
			{ children }
		</div>
	),
	TextareaControl: ( { value, onChange, placeholder, label } ) => (
		<div>
			{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
			<label>{ label }</label>
			<textarea
				data-testid="json-input"
				value={ value }
				onChange={ ( e ) => onChange( e.target.value ) }
				placeholder={ placeholder }
			/>
		</div>
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

jest.mock(
	'../../ModalActions',
	() =>
		( {
			onCancel,
			onSubmit,
			cancelLabel,
			submitLabel,
			isSubmitting,
			submitDisabled,
		} ) => (
			<div data-testid="modal-actions">
				<button onClick={ onCancel } disabled={ isSubmitting }>
					{ cancelLabel }
				</button>
				<button
					onClick={ onSubmit }
					disabled={ submitDisabled || isSubmitting }
					data-testid="import-button"
				>
					{ submitLabel }
				</button>
			</div>
		)
);

jest.mock( '@aether/utils/styles', () => ( {
	colors: { success: 'green', error: 'red', textMuted: '#666' },
	spacing: { xs: '4px', sm: '8px', md: '12px', lg: '16px' },
	fontSize: { sm: '12px' },
} ) );

import ImportConfigModal from '../index';

describe( 'ImportConfigModal', () => {
	const mockExistingConfigs = {
		'local-filesystem-static-site:existing-uuid': {
			instance_name: 'Existing Instance',
			provider_type: 'local-filesystem-static-site',
		},
	};

	const validImportJson = JSON.stringify( {
		version: '1.0',
		exportedAt: '2025-11-26T10:00:00.000Z',
		instances: {
			'cloudflare-r2-static-site:new-uuid': {
				instance_name: 'New Instance',
				provider_type: 'cloudflare-r2-static-site',
				api_token: 'secret',
			},
		},
	} );

	const conflictingImportJson = JSON.stringify( {
		version: '1.0',
		instances: {
			'local-filesystem-static-site:existing-uuid': {
				instance_name: 'Updated Instance',
				provider_type: 'local-filesystem-static-site',
			},
		},
	} );

	const defaultProps = {
		isOpen: true,
		onClose: jest.fn(),
		existingConfigs: mockExistingConfigs,
		onImport: jest.fn().mockResolvedValue( undefined ),
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should not render when isOpen is false', () => {
			const { container } = render(
				<ImportConfigModal { ...defaultProps } isOpen={ false } />
			);

			expect( container.firstChild ).toBeNull();
		} );

		test( 'should render modal when isOpen is true', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		} );

		test( 'should display file upload button', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			expect( screen.getByText( 'Choose File…' ) ).toBeInTheDocument();
		} );

		test( 'should display JSON textarea', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			expect( screen.getByTestId( 'json-input' ) ).toBeInTheDocument();
		} );

		test( 'should have Import button disabled initially', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			expect( screen.getByTestId( 'import-button' ) ).toBeDisabled();
		} );
	} );

	// ============================================================
	// JSON Validation
	// ============================================================
	describe( 'json validation', () => {
		test( 'should show error for invalid JSON syntax', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: 'not valid json' },
			} );

			expect(
				screen.getByTestId( 'validation-error' )
			).toHaveTextContent( 'Invalid JSON format' );
		} );

		test( 'should show error for missing version field', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: JSON.stringify( { instances: {} } ) },
			} );

			expect(
				screen.getByTestId( 'validation-error' )
			).toHaveTextContent( 'Missing version field' );
		} );

		test( 'should show error for missing instances field', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: JSON.stringify( { version: '1.0' } ) },
			} );

			expect(
				screen.getByTestId( 'validation-error' )
			).toHaveTextContent( 'Missing or invalid instances field' );
		} );

		test( 'should show error for empty instances', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: {
					value: JSON.stringify( { version: '1.0', instances: {} } ),
				},
			} );

			expect(
				screen.getByTestId( 'validation-error' )
			).toHaveTextContent( 'No instances to import' );
		} );

		test( 'should show error for instance missing provider_type', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: {
					value: JSON.stringify( {
						version: '1.0',
						instances: {
							'test:uuid': { instance_name: 'Test' },
						},
					} ),
				},
			} );

			expect(
				screen.getByTestId( 'validation-error' )
			).toHaveTextContent( 'missing provider_type' );
		} );

		test( 'should show success for valid JSON', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: validImportJson },
			} );

			expect(
				screen.getByTestId( 'validation-success' )
			).toHaveTextContent( 'Valid configuration with 1 instance(s)' );
		} );

		test( 'should enable Import button for valid JSON', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: validImportJson },
			} );

			expect( screen.getByTestId( 'import-button' ) ).not.toBeDisabled();
		} );
	} );

	// ============================================================
	// Conflict Detection
	// ============================================================
	describe( 'conflict detection', () => {
		test( 'should not show conflict warning when no conflicts', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: validImportJson },
			} );

			expect(
				screen.queryByTestId( 'conflict-warning' )
			).not.toBeInTheDocument();
		} );

		test( 'should show conflict warning when conflicts exist', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: conflictingImportJson },
			} );

			expect(
				screen.getByTestId( 'conflict-warning' )
			).toBeInTheDocument();
			expect(
				screen.getByTestId( 'conflict-warning' )
			).toHaveTextContent( '1 existing instance(s) will be overwritten' );
		} );

		test( 'should list conflicting instance names', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: conflictingImportJson },
			} );

			expect(
				screen.getByText( 'Existing Instance' )
			).toBeInTheDocument();
		} );

		test( 'should still enable Import button with conflicts', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: conflictingImportJson },
			} );

			expect( screen.getByTestId( 'import-button' ) ).not.toBeDisabled();
		} );
	} );

	// ============================================================
	// File Upload
	// ============================================================
	describe( 'file upload', () => {
		test( 'should populate textarea from file upload', async () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			const fileInput = screen.getByTestId( 'file-input' );
			const file = new File( [ validImportJson ], 'config.json', {
				type: 'application/json',
			} );

			// Mock FileReader
			const mockFileReader = {
				readAsText: jest.fn(),
				onload: null,
				onerror: null,
				result: validImportJson,
			};
			jest.spyOn( global, 'FileReader' ).mockImplementation(
				() => mockFileReader
			);

			fireEvent.change( fileInput, { target: { files: [ file ] } } );

			// Simulate successful file read
			mockFileReader.onload( { target: { result: validImportJson } } );

			await waitFor( () => {
				expect( screen.getByTestId( 'json-input' ).value ).toBe(
					validImportJson
				);
			} );
		} );
	} );

	// ============================================================
	// Import Action
	// ============================================================
	describe( 'import action', () => {
		test( 'should call onImport with merged configs', async () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: validImportJson },
			} );

			fireEvent.click( screen.getByTestId( 'import-button' ) );

			await waitFor( () => {
				expect( defaultProps.onImport ).toHaveBeenCalled();
			} );

			const importedConfigs = defaultProps.onImport.mock.calls[ 0 ][ 0 ];
			// Should include both existing and new
			expect(
				importedConfigs[ 'local-filesystem-static-site:existing-uuid' ]
			).toBeDefined();
			expect(
				importedConfigs[ 'cloudflare-r2-static-site:new-uuid' ]
			).toBeDefined();
		} );

		test( 'should overwrite existing configs on conflict', async () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: conflictingImportJson },
			} );

			fireEvent.click( screen.getByTestId( 'import-button' ) );

			await waitFor( () => {
				expect( defaultProps.onImport ).toHaveBeenCalled();
			} );

			const importedConfigs = defaultProps.onImport.mock.calls[ 0 ][ 0 ];
			expect(
				importedConfigs[ 'local-filesystem-static-site:existing-uuid' ]
					.instance_name
			).toBe( 'Updated Instance' );
		} );

		test( 'should call onClose after successful import', async () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: validImportJson },
			} );

			fireEvent.click( screen.getByTestId( 'import-button' ) );

			await waitFor( () => {
				expect( defaultProps.onClose ).toHaveBeenCalled();
			} );
		} );

		test( 'should show error notice on import failure', async () => {
			const failingImport = jest
				.fn()
				.mockRejectedValue( new Error( 'API Error' ) );

			render(
				<ImportConfigModal
					{ ...defaultProps }
					onImport={ failingImport }
				/>
			);

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: validImportJson },
			} );

			fireEvent.click( screen.getByTestId( 'import-button' ) );

			await waitFor( () => {
				expect( screen.getByTestId( 'notice' ) ).toHaveTextContent(
					'API Error'
				);
			} );
		} );

		test( 'should not call onClose on import failure', async () => {
			const failingImport = jest
				.fn()
				.mockRejectedValue( new Error( 'API Error' ) );

			render(
				<ImportConfigModal
					{ ...defaultProps }
					onImport={ failingImport }
				/>
			);

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: validImportJson },
			} );

			fireEvent.click( screen.getByTestId( 'import-button' ) );

			await waitFor( () => {
				expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			} );

			expect( defaultProps.onClose ).not.toHaveBeenCalled();
		} );
	} );

	// ============================================================
	// Modal Actions
	// ============================================================
	describe( 'modal actions', () => {
		test( 'should call onClose when Cancel is clicked', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.click( screen.getByText( 'Cancel' ) );

			expect( defaultProps.onClose ).toHaveBeenCalled();
		} );

		test( 'should call onClose when modal X is clicked', () => {
			render( <ImportConfigModal { ...defaultProps } /> );

			fireEvent.click( screen.getByTestId( 'modal-close' ) );

			expect( defaultProps.onClose ).toHaveBeenCalled();
		} );
	} );

	// ============================================================
	// Edge Cases
	// ============================================================
	describe( 'edge cases', () => {
		test( 'should handle null existingConfigs', () => {
			render(
				<ImportConfigModal
					{ ...defaultProps }
					existingConfigs={ null }
				/>
			);

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: validImportJson },
			} );

			// Should not crash and should show success
			expect(
				screen.getByTestId( 'validation-success' )
			).toBeInTheDocument();
		} );

		test( 'should clear state when modal closes', () => {
			const { rerender } = render(
				<ImportConfigModal { ...defaultProps } />
			);

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: validImportJson },
			} );

			expect( screen.getByTestId( 'json-input' ).value ).toBe(
				validImportJson
			);

			// Close and reopen modal
			rerender(
				<ImportConfigModal { ...defaultProps } isOpen={ false } />
			);
			rerender(
				<ImportConfigModal { ...defaultProps } isOpen={ true } />
			);

			expect( screen.getByTestId( 'json-input' ).value ).toBe( '' );
		} );

		test( 'should use instance ID as fallback when name is missing', () => {
			const configsWithoutName = {
				'test-provider:uuid-123': {
					provider_type: 'test-provider',
				},
			};

			const jsonWithConflict = JSON.stringify( {
				version: '1.0',
				instances: {
					'test-provider:uuid-123': {
						provider_type: 'test-provider',
						instance_name: 'New Name',
					},
				},
			} );

			render(
				<ImportConfigModal
					{ ...defaultProps }
					existingConfigs={ configsWithoutName }
				/>
			);

			fireEvent.change( screen.getByTestId( 'json-input' ), {
				target: { value: jsonWithConflict },
			} );

			expect(
				screen.getByText( 'test-provider:uuid-123' )
			).toBeInTheDocument();
		} );
	} );
} );
