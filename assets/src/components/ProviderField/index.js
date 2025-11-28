/**
 * Provider Field Component
 *
 * Dynamically renders a form field based on provider field definition.
 *
 */

import {
	TextControl,
	TextareaControl,
	CheckboxControl,
	SelectControl,
} from '@wordpress/components';
import { doAction, applyFilters } from '@wordpress/hooks';
// eslint-disable-next-line import/no-unresolved
import ProfileSelector from '@altolith/profiles/components/ProfileSelector';

/**
 * Render a provider configuration field.
 *
 * @param {Object}   props              Component props.
 * @param {Object}   props.field        Field definition from provider metadata.
 * @param {*}        props.value        Current field value.
 * @param {Function} props.onChange     Change handler.
 * @param {Object}   props.errors       Validation errors object.
 * @param {boolean}  props.isHidden     Whether field should be hidden via CSS.
 * @param {string}   props.providerId   Provider instance ID for hook context.
 * @param {Object}   props.formValues   All form values (for hooks that need full context).
 * @param {Function} props.onFormChange Function to change any form field (for hooks).
 * @return {JSX.Element} Rendered field component.
 */
export default function ProviderField( {
	field,
	value,
	onChange,
	errors,
	isHidden = false,
	providerId = '',
	formValues = {},
	onFormChange = null,
} ) {
	const {
		id,
		label,
		description,
		help: fieldHelp,
		type = 'text',
		required = false,
		options = [],
		placeholder = '',
	} = field;

	const error = errors?.[ id ];
	const help = error || fieldHelp || description;

	// Password manager prevention attributes for all text inputs
	const passwordManagerPreventionAttrs = {
		autoComplete: 'off',
		'data-lpignore': 'true',
		'data-1p-ignore': 'true',
		'data-form-type': 'other',
	};

	// Base style for field wrapper
	const fieldWrapperStyle = {
		display: isHidden ? 'none' : undefined,
	};

	// Context object passed to hooks
	const fieldContext = {
		field,
		fieldId: id,
		value,
		providerId,
		formValues,
		onFormChange,
	};

	// Get content to render after the field via filter (allows returning React components)
	const afterContent = applyFilters(
		'altolith.admin.provider.field.after',
		null,
		fieldContext
	);

	// Helper to render field with before/after hooks
	const renderWithHooks = ( fieldElement ) => (
		<>
			{ doAction( 'altolith.admin.provider.field.before', fieldContext ) }
			{ fieldElement }
			{ afterContent }
		</>
	);

	// Handle checkbox fields
	if ( type === 'checkbox' ) {
		return renderWithHooks(
			<div
				className={ `altolith-provider-field altolith-provider-field--${ type } ${
					error ? 'altolith-provider-field--error' : ''
				}` }
				style={ fieldWrapperStyle }
			>
				<CheckboxControl
					label={ label }
					help={ help }
					checked={ value || false }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
		);
	}

	// Handle profile fields (profile selector with inline creation)
	if ( type === 'profile' ) {
		const profileCategory = field.profile_category;
		const profileType = field.profile_type;

		return renderWithHooks(
			<div
				className={ `altolith-provider-field altolith-provider-field--${ type } ${
					error ? 'altolith-provider-field--error' : ''
				}` }
				style={ fieldWrapperStyle }
			>
				<ProfileSelector
					label={ label }
					help={ help }
					category={ profileCategory }
					profileType={ profileType }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					required={ required }
					error={ error }
				/>
			</div>
		);
	}

	// Handle toggle group fields (checkbox group with multiple selection)
	if ( type === 'checkbox-group' && options.length > 0 ) {
		// Use defaultValue if value is undefined or null
		let resolvedValue = [];
		if ( value !== undefined && value !== null ) {
			resolvedValue = value;
		} else if ( field.defaultValue !== undefined ) {
			resolvedValue = field.defaultValue;
		}
		const currentValue = Array.isArray( resolvedValue )
			? resolvedValue
			: [];

		return renderWithHooks(
			<div
				className={ `altolith-provider-field altolith-provider-field--${ type } ${
					error ? 'altolith-provider-field--error' : ''
				}` }
				style={ fieldWrapperStyle }
			>
				{ label && (
					<div className="altolith-provider-field__label components-base-control__label">
						<strong className="altolith-provider-field__label-text">
							{ label }
						</strong>
						{ required && (
							<span className="altolith-provider-field__label-required components-base-control__label__required">
								*
							</span>
						) }
					</div>
				) }
				{ help && (
					<p className="altolith-provider-field__help components-base-control__help">
						{ help }
					</p>
				) }
				{ error && (
					<p className="altolith-provider-field__error altolith-provider-field__error--message components-base-control__help components-base-control__help--error">
						{ error }
					</p>
				) }
				<div className="altolith-provider-field__checkbox-group altolith-checkbox-group">
					{ options.map( ( option ) => {
						const optionValue = option.value;
						const optionLabel = option.label || option.value;
						const isSelected = currentValue.includes( optionValue );

						return (
							<CheckboxControl
								key={ optionValue }
								className="altolith-provider-field__checkbox-option"
								label={ optionLabel }
								checked={ isSelected }
								onChange={ ( checked ) => {
									let newValue;
									if ( checked ) {
										// Add to array if not already present (prevent duplicates)
										if (
											! currentValue.includes(
												optionValue
											)
										) {
											newValue = [
												...currentValue,
												optionValue,
											];
										} else {
											// Already in array, no change needed
											return;
										}
									} else {
										// Remove from array
										newValue = currentValue.filter(
											( v ) => v !== optionValue
										);
									}

									onChange( id, newValue );
								} }
								style={ { margin: '0.25rem 0' } }
								__nextHasNoMarginBottom={ true }
							/>
						);
					} ) }
				</div>
			</div>
		);
	}

	// Handle select fields
	if ( type === 'select' && options.length > 0 ) {
		const selectOptions = options.map( ( opt ) => ( {
			label: opt.label || opt.value,
			value: opt.value,
		} ) );

		return renderWithHooks(
			<div
				className={ `altolith-provider-field altolith-provider-field--${ type } ${
					error ? 'altolith-provider-field--error' : ''
				}` }
				style={ fieldWrapperStyle }
			>
				<SelectControl
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					options={ selectOptions }
					required={ required }
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
				/>
			</div>
		);
	}

	// Handle textarea fields
	if ( type === 'textarea' ) {
		return renderWithHooks(
			<div
				className={ `altolith-provider-field altolith-provider-field--${ type } ${
					error ? 'altolith-provider-field--error' : ''
				}` }
				style={ fieldWrapperStyle }
			>
				<TextareaControl
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					placeholder={ placeholder }
					required={ required }
					{ ...passwordManagerPreventionAttrs }
				/>
			</div>
		);
	}

	// Handle URL fields
	if ( type === 'url' ) {
		return renderWithHooks(
			<div
				className={ `altolith-provider-field altolith-provider-field--${ type } ${
					error ? 'altolith-provider-field--error' : ''
				}` }
				style={ fieldWrapperStyle }
			>
				<TextControl
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					type="url"
					placeholder={ placeholder }
					required={ required }
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
					{ ...passwordManagerPreventionAttrs }
				/>
			</div>
		);
	}

	// Handle email fields
	if ( type === 'email' ) {
		return renderWithHooks(
			<div
				className={ `altolith-provider-field altolith-provider-field--${ type } ${
					error ? 'altolith-provider-field--error' : ''
				}` }
				style={ fieldWrapperStyle }
			>
				<TextControl
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					type="email"
					placeholder={ placeholder }
					required={ required }
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
					{ ...passwordManagerPreventionAttrs }
				/>
			</div>
		);
	}

	// Handle number fields
	if ( type === 'number' ) {
		return renderWithHooks(
			<div
				className={ `altolith-provider-field altolith-provider-field--${ type } ${
					error ? 'altolith-provider-field--error' : ''
				}` }
				style={ fieldWrapperStyle }
			>
				<TextControl
					label={ label }
					help={ help }
					value={ value || '' }
					onChange={ ( newValue ) => onChange( id, newValue ) }
					type="number"
					placeholder={ placeholder }
					required={ required }
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
					{ ...passwordManagerPreventionAttrs }
				/>
			</div>
		);
	}

	// Default: text field
	return renderWithHooks(
		<div
			className={ `altolith-provider-field altolith-provider-field--${ type } ${
				error ? 'altolith-provider-field--error' : ''
			}` }
			style={ fieldWrapperStyle }
		>
			<TextControl
				label={ label }
				help={ help }
				value={ value || '' }
				onChange={ ( newValue ) => onChange( id, newValue ) }
				placeholder={ placeholder }
				required={ required }
				__next40pxDefaultSize={ true }
				__nextHasNoMarginBottom={ true }
				{ ...passwordManagerPreventionAttrs }
			/>
		</div>
	);
}
