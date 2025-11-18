/**
 * Provider Form Component
 *
 * Dynamically renders a form based on provider field definitions.
 * Can be enhanced with react-hook-form once installed.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '../../utils/api';
import { validateConfig } from '../../utils/validation';
import ProviderField from './ProviderField';
import { useSuccessTimeout } from '../../hooks/useSuccessTimeout';
import { colors, spacing, createFlexStyle } from '../../utils/styles';

/**
 * Provider Form Component.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.providerId    Provider ID.
 * @param {Array}    props.fields        Array of field definitions from provider metadata.
 * @param {Object}   props.initialValues Initial form values.
 * @param {Function} props.onSubmit      Optional submit handler.
 * @param {Function} props.onChange      Optional change handler.
 * @return {JSX.Element} Rendered form component.
 */
export default function ProviderForm( {
	providerId,
	fields = [],
	initialValues = {},
	onSubmit,
	onChange,
} ) {
	// Initialize values with field defaults merged with initialValues
	const initializeValues = () => {
		const defaults = {};
		fields.forEach( ( field ) => {
			// Use defaultValue if provided, otherwise use empty defaults based on field type
			if ( field.defaultValue !== undefined ) {
				defaults[ field.id ] = field.defaultValue;
			} else if ( field.type === 'checkbox-group' ) {
				// Ensure checkbox-group fields are always arrays (even if empty)
				defaults[ field.id ] = [];
			} else if ( field.type === 'checkbox' ) {
				defaults[ field.id ] = false;
			}
		} );

		// Merge defaults with initialValues, but treat null/undefined as "not set"
		// This ensures that null values from backend don't override defaults
		const merged = { ...defaults };
		Object.keys( initialValues ).forEach( ( key ) => {
			const value = initialValues[ key ];
			// Only use initialValues if it's not null or undefined
			if ( value !== null && value !== undefined ) {
				merged[ key ] = value;
			}
		} );

		return merged;
	};

	const [ values, setValues ] = useState( initializeValues );
	const [ errors, setErrors ] = useState( {} );
	const [ saving, setSaving ] = useState( false );
	const [ success, setSuccess ] = useState( false );
	const [ error, setError ] = useState( null );
	const { showSuccess, clearSuccess } = useSuccessTimeout();

	// Update values when initialValues change
	useEffect( () => {
		setValues( initializeValues() );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ initialValues ] );

	const handleFieldChange = ( fieldId, value ) => {
		const newValues = {
			...values,
			[ fieldId ]: value,
		};
		setValues( newValues );
		setErrors( {} );
		setError( null );
		clearSuccess();
		setSuccess( false );

		// Call onChange callback if provided
		if ( onChange ) {
			onChange( newValues );
		}
	};

	const handleSubmit = async ( e ) => {
		e.preventDefault();
		setSaving( true );
		setError( null );
		setSuccess( false );

		// Ensure all fields are included in values (even if not touched)
		// This prevents fields from being omitted when saving
		const completeValues = { ...values };
		fields.forEach( ( field ) => {
			// Handle undefined or null values (null shouldn't happen due to initialization, but be defensive)
			if (
				completeValues[ field.id ] === undefined ||
				completeValues[ field.id ] === null
			) {
				// Use defaultValue if available, otherwise use type-specific defaults
				if ( field.defaultValue !== undefined ) {
					completeValues[ field.id ] = field.defaultValue;
				} else if ( field.type === 'checkbox-group' ) {
					completeValues[ field.id ] = [];
				} else if ( field.type === 'checkbox' ) {
					completeValues[ field.id ] = false;
				}
			}

			// Ensure checkbox-group fields are always arrays (defensive check)
			if (
				field.type === 'checkbox-group' &&
				! Array.isArray( completeValues[ field.id ] )
			) {
				completeValues[ field.id ] = [];
			}
		} );

		// Client-side validation
		const validation = validateConfig( completeValues, fields );
		if ( ! validation.valid ) {
			setErrors( validation.errors );
			setSaving( false );
			return;
		}

		try {
			// Call custom onSubmit if provided
			if ( onSubmit ) {
				await onSubmit( completeValues );
			} else {
				// Default: save to settings using /aether/site-exporter/settings endpoint
				// Get current providers settings
				const settingsResponse = await apiFetch( {
					path: '/aether/site-exporter/settings?key=providers',
				} );

				if ( ! settingsResponse.success ) {
					throw new Error( 'Failed to load current settings' );
				}

				// Merge new provider settings with existing providers
				const currentProviders = settingsResponse.value || {};
				const updatedProviders = {
					...currentProviders,
					[ providerId ]: completeValues,
				};

				// Save updated providers object
				const saveResponse = await apiFetch( {
					path: '/aether/site-exporter/settings',
					method: 'POST',
					data: {
						key: 'providers',
						value: updatedProviders,
					},
				} );

				if ( ! saveResponse.success ) {
					throw new Error(
						saveResponse.message || 'Failed to save settings'
					);
				}
			}

			setSuccess( true );
			showSuccess( () => setSuccess( false ) );
		} catch ( err ) {
			setError(
				err.message ||
					__( 'Failed to save settings', 'aether-site-exporter' )
			);
		} finally {
			setSaving( false );
		}
	};

	const formStyle = {
		...createFlexStyle( 'column', spacing.md ),
	};

	const actionsStyle = {
		...createFlexStyle( 'row', spacing.sm ),
		justifyContent: 'flex-end',
		marginTop: spacing.md,
		paddingTop: spacing.md,
		borderTop: `1px solid ${ colors.borderLight }`,
	};

	return (
		<form
			className="aether-provider-form"
			onSubmit={ handleSubmit }
			style={ formStyle }
		>
			{ error && (
				<Notice
					className="aether-provider-form__notice aether-provider-form__notice--error"
					status="error"
					isDismissible
					onRemove={ () => setError( null ) }
				>
					{ error }
				</Notice>
			) }

			{ success && (
				<Notice
					className="aether-provider-form__notice aether-provider-form__notice--success"
					status="success"
					isDismissible
					onRemove={ () => setSuccess( false ) }
				>
					{ __(
						'Settings saved successfully!',
						'aether-site-exporter'
					) }
				</Notice>
			) }

			{ fields.map( ( field ) => (
				<ProviderField
					key={ field.id }
					field={ field }
					value={ values[ field.id ] }
					onChange={ handleFieldChange }
					errors={ errors }
				/>
			) ) }

			<div
				className="aether-provider-form__actions"
				style={ actionsStyle }
			>
				<Button
					className="aether-provider-form__submit-button"
					type="submit"
					variant="primary"
					isBusy={ saving }
					disabled={ saving }
				>
					{ saving
						? __( 'Saving…', 'aether-site-exporter' )
						: __( 'Save Settings', 'aether-site-exporter' ) }
				</Button>
			</div>
		</form>
	);
}
