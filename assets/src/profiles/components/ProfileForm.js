/**
 * Profile Form Component
 *
 * Form for creating/editing profile instances.
 * Dynamically renders fields based on profile type definition.
 */

import { useState, useCallback } from '@wordpress/element';
import {
	TextControl,
	Button,
	Flex,
	FlexItem,
	Notice,
	Card,
	CardBody,
	CardHeader,
	CardFooter,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

import ProviderField from '../../components/ProviderField';

/**
 * Profile Form Component.
 *
 * @param {Object}   props                 Component props.
 * @param {string}   props.category        Profile category.
 * @param {string}   props.profileType     Profile type ID.
 * @param {Array}    props.fields          Field definitions from profile type.
 * @param {string}   props.profileTypeName Human-readable profile type name.
 * @param {Object}   props.initialValues   Initial form values (for edit mode).
 * @param {Function} props.onSubmit        Submit handler (formData) => Promise.
 * @param {Function} props.onCancel        Cancel handler.
 * @param {string}   props.submitLabel     Submit button label.
 * @param {boolean}  props.isEdit          Whether in edit mode.
 * @param {string}   props.profileId       Profile ID (unused, passed by parent).
 * @param {string}   props.testEndpoint    Optional test endpoint from profile type.
 * @return {JSX.Element} Profile form component.
 */
export default function ProfileForm( {
	/* eslint-disable no-unused-vars */
	category,
	profileType,
	isEdit = false,
	profileId = null,
	/* eslint-enable no-unused-vars */
	fields = [],
	profileTypeName,
	initialValues = {},
	onSubmit,
	onCancel,
	submitLabel = __( 'Save', 'altolith-deploy' ),
	testEndpoint = null,
} ) {
	// Form state.
	const [ formValues, setFormValues ] = useState( {
		name: initialValues.name || '',
		...fields.reduce( ( acc, field ) => {
			acc[ field.id ] =
				initialValues[ field.id ] ?? field.defaultValue ?? '';
			return acc;
		}, {} ),
	} );
	const [ errors, setErrors ] = useState( {} );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ submitError, setSubmitError ] = useState( null );
	const [ isTesting, setIsTesting ] = useState( false );
	const [ testResult, setTestResult ] = useState( null );

	/**
	 * Handle field change.
	 *
	 * @param {string} fieldId Field ID.
	 * @param {*}      value   New value.
	 */
	const handleFieldChange = useCallback( ( fieldId, value ) => {
		setFormValues( ( prev ) => ( {
			...prev,
			[ fieldId ]: value,
		} ) );
		// Clear error for this field.
		setErrors( ( prev ) => ( {
			...prev,
			[ fieldId ]: null,
		} ) );
	}, [] );

	/**
	 * Handle name change.
	 *
	 * @param {string} value New name value.
	 */
	const handleNameChange = useCallback( ( value ) => {
		setFormValues( ( prev ) => ( {
			...prev,
			name: value,
		} ) );
		setErrors( ( prev ) => ( {
			...prev,
			name: null,
		} ) );
	}, [] );

	/**
	 * Validate form.
	 *
	 * @return {boolean} True if valid.
	 */
	const validateForm = useCallback( () => {
		const newErrors = {};

		// Validate name.
		if ( ! formValues.name || formValues.name.trim() === '' ) {
			newErrors.name = __(
				'Profile name is required',
				'altolith-deploy'
			);
		}

		// Validate required fields.
		fields.forEach( ( field ) => {
			if ( field.required ) {
				const value = formValues[ field.id ];
				if ( value === undefined || value === null || value === '' ) {
					newErrors[ field.id ] = __(
						'This field is required',
						'altolith-deploy'
					);
				}
			}

			// Validate pattern if specified.
			if ( field.pattern && formValues[ field.id ] ) {
				const regex = new RegExp( field.pattern );
				if ( ! regex.test( formValues[ field.id ] ) ) {
					newErrors[ field.id ] =
						field.patternError ||
						__( 'Invalid format', 'altolith-deploy' );
				}
			}
		} );

		setErrors( newErrors );
		return Object.keys( newErrors ).length === 0;
	}, [ formValues, fields ] );

	/**
	 * Handle form submission.
	 *
	 * @param {Event} event Form event.
	 */
	const handleSubmit = async ( event ) => {
		event.preventDefault();
		setSubmitError( null );

		if ( ! validateForm() ) {
			return;
		}

		setIsSubmitting( true );

		try {
			// Build profile data.
			const profileData = {
				name: formValues.name.trim(),
				fields: {},
			};

			// Extract field values.
			fields.forEach( ( field ) => {
				const value = formValues[ field.id ];
				if ( value !== undefined && value !== '' ) {
					profileData.fields[ field.id ] = value;
				}
			} );

			await onSubmit( profileData );
		} catch ( error ) {
			setSubmitError(
				error.message ||
					__( 'Failed to save profile', 'altolith-deploy' )
			);
		} finally {
			setIsSubmitting( false );
		}
	};

	const cardTitle = isEdit
		? __( 'Edit Profile', 'altolith-deploy' )
		: __( 'Create New Profile', 'altolith-deploy' );

	/**
	 * Handle button click for form submission.
	 * Uses onClick instead of form submit to prevent page navigation issues
	 * in WordPress admin context.
	 */
	const handleButtonClick = () => {
		// Create a synthetic event-like object for handleSubmit.
		handleSubmit( { preventDefault: () => {} } );
	};

	/**
	 * Handle test credentials button click.
	 * Always tests with current form values, not saved values.
	 * This allows users to test credentials before saving.
	 */
	const handleTestCredentials = async () => {
		setIsTesting( true );
		setTestResult( null );

		try {
			if ( ! testEndpoint ) {
				throw new Error(
					__( 'No test endpoint available', 'altolith-deploy' )
				);
			}

			// Always use TEST_ENDPOINT directly with current form values.
			// This tests what the user has entered, not what's saved.
			const fieldValues = {};
			fields.forEach( ( field ) => {
				const value = formValues[ field.id ];
				if ( value !== undefined && value !== '' ) {
					fieldValues[ field.id ] = value;
				}
			} );

			const result = await apiFetch( {
				path: testEndpoint,
				method: 'POST',
				data: fieldValues,
			} );

			setTestResult( result );
		} catch ( error ) {
			setTestResult( {
				success: false,
				message:
					error.message ||
					__( 'Credential test failed', 'altolith-deploy' ),
			} );
		} finally {
			setIsTesting( false );
		}
	};

	return (
		<Card className="altolith-profile-form">
			<CardHeader className="altolith-profile-form__header">
				<h3
					className="altolith-profile-form__title"
					style={ { margin: 0 } }
				>
					{ cardTitle }
				</h3>
				{ profileTypeName && (
					<span className="altolith-profile-form__type-badge">
						{ profileTypeName }
					</span>
				) }
			</CardHeader>

			<CardBody className="altolith-profile-form__body">
				{ submitError && (
					<Notice
						className="altolith-profile-form__error-notice"
						status="error"
						isDismissible={ true }
						onDismiss={ () => setSubmitError( null ) }
					>
						{ submitError }
					</Notice>
				) }

				{ testResult && (
					<Notice
						className="altolith-profile-form__test-notice"
						status={ testResult.success ? 'success' : 'error' }
						isDismissible={ true }
						onDismiss={ () => setTestResult( null ) }
					>
						{ testResult.message }
					</Notice>
				) }

				{ /* Profile Name Field */ }
				<div className="altolith-profile-form__name-field">
					<TextControl
						label={ __( 'Profile Name', 'altolith-deploy' ) }
						help={
							errors.name ||
							__(
								'A friendly name to identify this profile (e.g., "Production Account")',
								'altolith-deploy'
							)
						}
						value={ formValues.name }
						onChange={ handleNameChange }
						__next40pxDefaultSize={ true }
						__nextHasNoMarginBottom={ true }
						className={
							errors.name ? 'altolith-provider-field--error' : ''
						}
					/>
				</div>

				{ /* Profile Type Fields */ }
				<div className="altolith-profile-form__fields">
					{ fields.map( ( field ) => (
						<ProviderField
							key={ field.id }
							field={ field }
							value={ formValues[ field.id ] }
							onChange={ handleFieldChange }
							errors={ errors }
						/>
					) ) }
				</div>
			</CardBody>

			<CardFooter className="altolith-profile-form__footer">
				<Flex
					className="altolith-profile-form__actions"
					justify="space-between"
				>
					<FlexItem className="altolith-profile-form__test-action">
						{ testEndpoint && (
							<Button
								className="altolith-profile-form__test-button"
								variant="secondary"
								onClick={ handleTestCredentials }
								disabled={ isSubmitting || isTesting }
								isBusy={ isTesting }
							>
								{ isTesting
									? __( 'Testing…', 'altolith-deploy' )
									: __(
											'Test Credentials',
											'altolith-deploy'
									  ) }
							</Button>
						) }
					</FlexItem>
					<FlexItem className="altolith-profile-form__cancel-action">
						<Button
							className="altolith-profile-form__cancel-button"
							variant="tertiary"
							onClick={ onCancel }
							disabled={ isSubmitting || isTesting }
						>
							{ __( 'Cancel', 'altolith-deploy' ) }
						</Button>
					</FlexItem>
					<FlexItem className="altolith-profile-form__submit-action">
						<Button
							className="altolith-profile-form__submit-button"
							variant="primary"
							onClick={ handleButtonClick }
							isBusy={ isSubmitting }
							disabled={ isSubmitting || isTesting }
						>
							{ submitLabel }
						</Button>
					</FlexItem>
				</Flex>
			</CardFooter>
		</Card>
	);
}
