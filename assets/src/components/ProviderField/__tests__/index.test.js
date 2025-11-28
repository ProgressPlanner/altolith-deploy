/**
 * ProviderField Component Tests
 *
 * Tests for the dynamic form field renderer.
 * Covers all field types: text, checkbox, select, textarea, url, email, number, checkbox-group.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import { render, screen, fireEvent } from '@testing-library/react';

// Mock WordPress components
jest.mock( '@wordpress/components', () => ( {
	TextControl: ( {
		label,
		value,
		onChange,
		help,
		placeholder,
		required,
		type,
		...rest
	} ) => {
		const inputId = `text-control-${ type || 'text' }-${ Math.random()
			.toString( 36 )
			.substr( 2, 9 ) }`;
		return (
			<div data-testid={ `text-control-${ type || 'text' }` }>
				<label htmlFor={ inputId }>
					{ label }
					<input
						id={ inputId }
						type={ type || 'text' }
						value={ value }
						onChange={ ( e ) => onChange( e.target.value ) }
						placeholder={ placeholder }
						required={ required }
						data-testid={ `input-${ type || 'text' }` }
						{ ...rest }
					/>
				</label>
				{ help && <span className="help">{ help }</span> }
			</div>
		);
	},
	TextareaControl: ( {
		label,
		value,
		onChange,
		help,
		placeholder,
		required,
	} ) => {
		const textareaId = `textarea-control-${ Math.random()
			.toString( 36 )
			.substr( 2, 9 ) }`;
		return (
			<div data-testid="textarea-control">
				<label htmlFor={ textareaId }>
					{ label }
					<textarea
						id={ textareaId }
						value={ value }
						onChange={ ( e ) => onChange( e.target.value ) }
						placeholder={ placeholder }
						required={ required }
						data-testid="input-textarea"
					/>
				</label>
				{ help && <span className="help">{ help }</span> }
			</div>
		);
	},
	CheckboxControl: ( { label, checked, onChange, help, className } ) => {
		const checkboxId = `checkbox-control-${ Math.random()
			.toString( 36 )
			.substr( 2, 9 ) }`;
		return (
			<div data-testid="checkbox-control" className={ className }>
				<label htmlFor={ checkboxId }>
					<input
						id={ checkboxId }
						type="checkbox"
						checked={ checked }
						onChange={ ( e ) => onChange( e.target.checked ) }
						data-testid="input-checkbox"
					/>
					{ label }
				</label>
				{ help && <span className="help">{ help }</span> }
			</div>
		);
	},
	SelectControl: ( { label, value, onChange, options, help, required } ) => {
		const selectId = `select-control-${ Math.random()
			.toString( 36 )
			.substr( 2, 9 ) }`;
		return (
			<div data-testid="select-control">
				<label htmlFor={ selectId }>
					{ label }
					<select
						id={ selectId }
						value={ value }
						onChange={ ( e ) => onChange( e.target.value ) }
						required={ required }
						data-testid="input-select"
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
		);
	},
} ) );

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => ( {
	doAction: jest.fn(),
	applyFilters: jest.fn( ( hook, value ) => value ),
} ) );

import ProviderField from '../index';
import { applyFilters } from '@wordpress/hooks';

describe( 'ProviderField', () => {
	const mockOnChange = jest.fn();

	const baseField = {
		id: 'test_field',
		label: 'Test Field',
		description: 'Test description',
		type: 'text',
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	// ============================================================
	// Text Field (Default)
	// ============================================================
	describe( 'text field', () => {
		test( 'should render text input by default', () => {
			render(
				<ProviderField
					field={ baseField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect(
				screen.getByTestId( 'text-control-text' )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'input-text' ) ).toBeInTheDocument();
		} );

		test( 'should render label', () => {
			render(
				<ProviderField
					field={ baseField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect( screen.getByText( 'Test Field' ) ).toBeInTheDocument();
		} );

		test( 'should render description as help', () => {
			render(
				<ProviderField
					field={ baseField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect(
				screen.getByText( 'Test description' )
			).toBeInTheDocument();
		} );

		test( 'should call onChange with field id and value', () => {
			render(
				<ProviderField
					field={ baseField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const input = screen.getByTestId( 'input-text' );
			fireEvent.change( input, { target: { value: 'new value' } } );

			expect( mockOnChange ).toHaveBeenCalledWith(
				'test_field',
				'new value'
			);
		} );

		test( 'should show placeholder', () => {
			const field = { ...baseField, placeholder: 'Enter value...' };

			render(
				<ProviderField
					field={ field }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const input = screen.getByTestId( 'input-text' );
			expect( input ).toHaveAttribute( 'placeholder', 'Enter value...' );
		} );
	} );

	// ============================================================
	// Checkbox Field
	// ============================================================
	describe( 'checkbox field', () => {
		const checkboxField = {
			...baseField,
			type: 'checkbox',
			id: 'enabled',
			label: 'Enable Feature',
		};

		test( 'should render checkbox control', () => {
			render(
				<ProviderField
					field={ checkboxField }
					value={ false }
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect(
				screen.getByTestId( 'checkbox-control' )
			).toBeInTheDocument();
			expect(
				screen.getByTestId( 'input-checkbox' )
			).toBeInTheDocument();
		} );

		test( 'should be unchecked when value is false', () => {
			render(
				<ProviderField
					field={ checkboxField }
					value={ false }
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const checkbox = screen.getByTestId( 'input-checkbox' );
			expect( checkbox ).not.toBeChecked();
		} );

		test( 'should be checked when value is true', () => {
			render(
				<ProviderField
					field={ checkboxField }
					value={ true }
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const checkbox = screen.getByTestId( 'input-checkbox' );
			expect( checkbox ).toBeChecked();
		} );

		test( 'should call onChange with checked value', () => {
			render(
				<ProviderField
					field={ checkboxField }
					value={ false }
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const checkbox = screen.getByTestId( 'input-checkbox' );
			fireEvent.click( checkbox );

			expect( mockOnChange ).toHaveBeenCalledWith( 'enabled', true );
		} );

		test( 'should handle undefined value as false', () => {
			render(
				<ProviderField
					field={ checkboxField }
					value={ undefined }
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const checkbox = screen.getByTestId( 'input-checkbox' );
			expect( checkbox ).not.toBeChecked();
		} );
	} );

	// ============================================================
	// Select Field
	// ============================================================
	describe( 'select field', () => {
		const selectField = {
			...baseField,
			type: 'select',
			id: 'region',
			label: 'Region',
			options: [
				{ value: 'us', label: 'United States' },
				{ value: 'eu', label: 'Europe' },
				{ value: 'asia', label: 'Asia' },
			],
		};

		test( 'should render select control', () => {
			render(
				<ProviderField
					field={ selectField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect(
				screen.getByTestId( 'select-control' )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'input-select' ) ).toBeInTheDocument();
		} );

		test( 'should render all options', () => {
			render(
				<ProviderField
					field={ selectField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect( screen.getByText( 'United States' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Europe' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Asia' ) ).toBeInTheDocument();
		} );

		test( 'should call onChange with selected value', () => {
			render(
				<ProviderField
					field={ selectField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const select = screen.getByTestId( 'input-select' );
			fireEvent.change( select, { target: { value: 'eu' } } );

			expect( mockOnChange ).toHaveBeenCalledWith( 'region', 'eu' );
		} );

		test( 'should use value as label if label is missing', () => {
			const fieldWithValueOnlyOptions = {
				...selectField,
				options: [ { value: 'option1' }, { value: 'option2' } ],
			};

			render(
				<ProviderField
					field={ fieldWithValueOnlyOptions }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect( screen.getByText( 'option1' ) ).toBeInTheDocument();
			expect( screen.getByText( 'option2' ) ).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Textarea Field
	// ============================================================
	describe( 'textarea field', () => {
		const textareaField = {
			...baseField,
			type: 'textarea',
			id: 'description',
			label: 'Description',
		};

		test( 'should render textarea control', () => {
			render(
				<ProviderField
					field={ textareaField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect(
				screen.getByTestId( 'textarea-control' )
			).toBeInTheDocument();
			expect(
				screen.getByTestId( 'input-textarea' )
			).toBeInTheDocument();
		} );

		test( 'should call onChange with textarea value', () => {
			render(
				<ProviderField
					field={ textareaField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const textarea = screen.getByTestId( 'input-textarea' );
			fireEvent.change( textarea, {
				target: { value: 'multi\nline\ntext' },
			} );

			expect( mockOnChange ).toHaveBeenCalledWith(
				'description',
				'multi\nline\ntext'
			);
		} );
	} );

	// ============================================================
	// URL Field
	// ============================================================
	describe( 'url field', () => {
		const urlField = {
			...baseField,
			type: 'url',
			id: 'website',
			label: 'Website URL',
		};

		test( 'should render url input', () => {
			render(
				<ProviderField
					field={ urlField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect(
				screen.getByTestId( 'text-control-url' )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'input-url' ) ).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Email Field
	// ============================================================
	describe( 'email field', () => {
		const emailField = {
			...baseField,
			type: 'email',
			id: 'email',
			label: 'Email Address',
		};

		test( 'should render email input', () => {
			render(
				<ProviderField
					field={ emailField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect(
				screen.getByTestId( 'text-control-email' )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'input-email' ) ).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Number Field
	// ============================================================
	describe( 'number field', () => {
		const numberField = {
			...baseField,
			type: 'number',
			id: 'count',
			label: 'Count',
		};

		test( 'should render number input', () => {
			render(
				<ProviderField
					field={ numberField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect(
				screen.getByTestId( 'text-control-number' )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'input-number' ) ).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Checkbox Group Field
	// ============================================================
	describe( 'checkbox-group field', () => {
		const checkboxGroupField = {
			...baseField,
			type: 'checkbox-group',
			id: 'features',
			label: 'Features',
			options: [
				{ value: 'feature1', label: 'Feature 1' },
				{ value: 'feature2', label: 'Feature 2' },
				{ value: 'feature3', label: 'Feature 3' },
			],
		};

		test( 'should render checkbox for each option', () => {
			render(
				<ProviderField
					field={ checkboxGroupField }
					value={ [] }
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect( screen.getByText( 'Feature 1' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Feature 2' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Feature 3' ) ).toBeInTheDocument();
		} );

		test( 'should check selected options', () => {
			render(
				<ProviderField
					field={ checkboxGroupField }
					value={ [ 'feature1', 'feature3' ] }
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const checkboxes = screen.getAllByTestId( 'input-checkbox' );
			expect( checkboxes[ 0 ] ).toBeChecked();
			expect( checkboxes[ 1 ] ).not.toBeChecked();
			expect( checkboxes[ 2 ] ).toBeChecked();
		} );

		test( 'should add option when checked', () => {
			render(
				<ProviderField
					field={ checkboxGroupField }
					value={ [ 'feature1' ] }
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const checkboxes = screen.getAllByTestId( 'input-checkbox' );
			fireEvent.click( checkboxes[ 1 ] ); // Check feature2

			expect( mockOnChange ).toHaveBeenCalledWith( 'features', [
				'feature1',
				'feature2',
			] );
		} );

		test( 'should remove option when unchecked', () => {
			render(
				<ProviderField
					field={ checkboxGroupField }
					value={ [ 'feature1', 'feature2' ] }
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const checkboxes = screen.getAllByTestId( 'input-checkbox' );
			fireEvent.click( checkboxes[ 0 ] ); // Uncheck feature1

			expect( mockOnChange ).toHaveBeenCalledWith( 'features', [
				'feature2',
			] );
		} );

		test( 'should handle undefined value as empty array', () => {
			render(
				<ProviderField
					field={ checkboxGroupField }
					value={ undefined }
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			const checkboxes = screen.getAllByTestId( 'input-checkbox' );
			checkboxes.forEach( ( checkbox ) => {
				expect( checkbox ).not.toBeChecked();
			} );
		} );
	} );

	// ============================================================
	// Error Handling
	// ============================================================
	describe( 'error handling', () => {
		test( 'should show error message instead of help', () => {
			render(
				<ProviderField
					field={ baseField }
					value=""
					onChange={ mockOnChange }
					errors={ { test_field: 'This field is required' } }
				/>
			);

			expect(
				screen.getByText( 'This field is required' )
			).toBeInTheDocument();
		} );

		test( 'should add error class to container', () => {
			const { container } = render(
				<ProviderField
					field={ baseField }
					value=""
					onChange={ mockOnChange }
					errors={ { test_field: 'Error' } }
				/>
			);

			expect(
				container.querySelector( '.altolith-provider-field--error' )
			).toBeInTheDocument();
		} );
	} );

	// ============================================================
	// Hidden Field
	// ============================================================
	describe( 'hidden field', () => {
		test( 'should apply display:none when isHidden is true', () => {
			const { container } = render(
				<ProviderField
					field={ baseField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
					isHidden
				/>
			);

			const fieldWrapper = container.querySelector(
				'.altolith-provider-field'
			);
			expect( fieldWrapper ).toHaveStyle( { display: 'none' } );
		} );

		test( 'should not apply display:none when isHidden is false', () => {
			const { container } = render(
				<ProviderField
					field={ baseField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
					isHidden={ false }
				/>
			);

			const fieldWrapper = container.querySelector(
				'.altolith-provider-field'
			);
			expect( fieldWrapper ).not.toHaveStyle( { display: 'none' } );
		} );
	} );

	// ============================================================
	// Hooks Integration
	// ============================================================
	describe( 'hooks integration', () => {
		test( 'should apply filter for after content', () => {
			applyFilters.mockImplementation( ( hook, value, context ) => {
				if ( hook === 'altolith.admin.provider.field.after' ) {
					return <span data-testid="after-content">After</span>;
				}
				return value;
			} );

			render(
				<ProviderField
					field={ baseField }
					value=""
					onChange={ mockOnChange }
					errors={ {} }
				/>
			);

			expect( screen.getByTestId( 'after-content' ) ).toBeInTheDocument();
		} );

		test( 'should pass context to filter', () => {
			render(
				<ProviderField
					field={ baseField }
					value="test-value"
					onChange={ mockOnChange }
					errors={ {} }
					providerId="my-provider:123"
					formValues={ { test_field: 'test-value' } }
				/>
			);

			expect( applyFilters ).toHaveBeenCalledWith(
				'altolith.admin.provider.field.after',
				null,
				expect.objectContaining( {
					field: baseField,
					fieldId: 'test_field',
					value: 'test-value',
					providerId: 'my-provider:123',
				} )
			);
		} );
	} );
} );
