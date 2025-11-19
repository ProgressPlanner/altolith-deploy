/**
 * Provider Form Component
 *
 * Dynamically renders a form based on provider field definitions.
 * Can be enhanced with react-hook-form once installed.
 *
 * @package
 */

import {
	useState,
	useEffect,
	useRef,
	useCallback,
	memo,
} from '@wordpress/element';
import {
	Button,
	Notice,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanel as ToolsPanel,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { doAction } from '@wordpress/hooks';
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
function ProviderForm( {
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

	// Refs for hook container elements
	const beforeFieldsRef = useRef( null );
	const afterFieldsRef = useRef( null );
	const actionsRef = useRef( null );

	// Update values when initialValues change
	useEffect( () => {
		setValues( initializeValues() );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ initialValues ] );

	const handleFieldChange = useCallback(
		( fieldId, value ) => {
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
		},
		[ values, onChange, clearSuccess ]
	);

	// Trigger hooks when values or other state changes
	useEffect( () => {
		const hookContext = {
			providerId,
			values,
			onChange: handleFieldChange,
			errors,
			saving,
		};

		// Trigger before_fields hook
		if ( beforeFieldsRef.current ) {
			doAction( 'aether.provider.form.before_fields', hookContext );
		}

		// Trigger after_fields hook
		if ( afterFieldsRef.current ) {
			doAction( 'aether.provider.form.after_fields', hookContext );
		}

		// Trigger actions hook
		if ( actionsRef.current ) {
			doAction( 'aether.provider.form.actions', hookContext );
		}
	}, [ providerId, values, handleFieldChange, errors, saving ] );

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

			{ /* Hook: before_fields */ }
			<div
				ref={ beforeFieldsRef }
				className="aether-provider-form__before-fields"
				data-provider-id={ providerId }
			/>

			{ ( () => {
				// Helper function to determine if field should be hidden
				const isFieldHidden = ( field ) => {
					// Always hide deployment_types field (managed in modal)
					if ( field.name === 'deployment_types' ) {
						return true;
					}
					if ( field.hidden === true ) {
						// Hide fields marked as hidden in provider settings
						return true;
					}
					if ( field.deploymentType ) {
						// Hide fields with deploymentType if that type is not in current deployment_types
						// Check both values.deployment_types and initialValues.deployment_types
						// to handle real-time updates when deployment types change in modal
						const currentDeploymentTypes =
							values.deployment_types ||
							initialValues.deployment_types ||
							[];
						return ! currentDeploymentTypes.includes(
							field.deploymentType
						);
					}
					return false;
				};

				// Separate fields into regular and advanced
				const regularFields = fields.filter(
					( field ) => ! field.is_advanced
				);
				const advancedFields = fields.filter(
					( field ) => field.is_advanced === true
				);

				// Render field component
				const renderField = ( field ) => {
					const isHidden = isFieldHidden( field );
					return (
						<ProviderField
							key={ field.id }
							field={ field }
							value={ values[ field.id ] }
							onChange={ handleFieldChange }
							errors={ errors }
							isHidden={ isHidden }
						/>
					);
				};

				// Helper function to get default value for a field
				const getFieldDefault = ( field ) => {
					if ( field.defaultValue !== undefined ) {
						return field.defaultValue;
					}
					if ( field.type === 'checkbox-group' ) {
						return [];
					}
					if ( field.type === 'checkbox' ) {
						return false;
					}
					return '';
				};

				// Helper function to check if a field has a value
				const hasFieldValue = ( field ) => {
					const value = values[ field.id ];
					const defaultValue = getFieldDefault( field );

					// If value is undefined or null, it doesn't have a value
					if ( value === undefined || value === null ) {
						return false;
					}

					// For arrays, check if it's not empty and different from default
					if ( Array.isArray( value ) ) {
						return (
							value.length > 0 &&
							JSON.stringify( value ) !==
								JSON.stringify( defaultValue )
						);
					}

					// For checkboxes, check if value is different from default (true vs false)
					if ( field.type === 'checkbox' ) {
						return value !== defaultValue;
					}

					// For other types, check if value is not empty and different from default
					return value !== '' && value !== defaultValue;
				};

				// Helper function to reset a field to its default
				const resetField = ( fieldId ) => {
					const field = fields.find( ( f ) => f.id === fieldId );
					if ( ! field ) {
						return;
					}
					const defaultValue = getFieldDefault( field );
					handleFieldChange( fieldId, defaultValue );
				};

				return (
					<>
						{ /* Render regular fields */ }
						{ regularFields.map( renderField ) }

						{ /* Render advanced fields in ToolsPanel */ }
						{ advancedFields.length > 0 && (
							<ToolsPanel
								className="aether-provider-form__tools-panel"
								label={ __(
									'Advanced settings',
									'aether-site-exporter'
								) }
								resetAll={ null }
							>
								{ advancedFields.map( ( field ) => {
									const isHidden = isFieldHidden( field );
									return (
										<ToolsPanelItem
											key={ field.id }
											className="aether-provider-form__tools-panel-item"
											hasValue={ () =>
												hasFieldValue( field )
											}
											label={ field.label || field.name }
											onDeselect={ () =>
												resetField( field.id )
											}
										>
											<ProviderField
												field={ field }
												value={ values[ field.id ] }
												onChange={ handleFieldChange }
												errors={ errors }
												isHidden={ isHidden }
											/>
										</ToolsPanelItem>
									);
								} ) }
							</ToolsPanel>
						) }
					</>
				);
			} )() }

			{ /* Hook: after_fields */ }
			<div
				ref={ afterFieldsRef }
				className="aether-provider-form__after-fields"
				data-provider-id={ providerId }
			/>

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

				{ /* Hook: actions */ }
				<div
					ref={ actionsRef }
					className="aether-provider-form__actions-hook"
					data-provider-id={ providerId }
				/>
			</div>
		</form>
	);
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if providerId, fields array length, or initialValues change
export default memo( ProviderForm, ( prevProps, nextProps ) => {
	return (
		prevProps.providerId === nextProps.providerId &&
		prevProps.fields.length === nextProps.fields.length &&
		JSON.stringify( prevProps.initialValues ) ===
			JSON.stringify( nextProps.initialValues )
	);
} );
