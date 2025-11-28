/**
 * Profile Selector Component
 *
 * Dropdown to select an existing profile or create a new one.
 * Used within provider configuration forms for profile fields.
 */

import { useState, useMemo } from '@wordpress/element';
import {
	SelectControl,
	Button,
	Flex,
	FlexItem,
	FlexBlock,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plus, edit } from '@wordpress/icons';

import { useProfiles } from '../hooks/useProfiles';
import { useProfileTypes } from '../hooks/useProfileTypes';
import ProfileForm from './ProfileForm';

/**
 * Profile Selector Component.
 *
 * @param {Object}   props             Component props.
 * @param {string}   props.category    Profile category (e.g., 'credentials').
 * @param {string}   props.profileType Profile type (e.g., 'cloudflare').
 * @param {string}   props.value       Selected profile ID.
 * @param {Function} props.onChange    Change handler (profileId) => void.
 * @param {string}   props.label       Field label.
 * @param {string}   props.help        Help text.
 * @param {boolean}  props.required    Whether selection is required.
 * @param {boolean}  props.allowCreate Whether to show "Create new" option (default: true).
 * @param {boolean}  props.allowEdit   Whether to show edit button (default: true).
 * @return {JSX.Element} Profile selector component.
 */
export default function ProfileSelector( {
	category,
	profileType,
	value,
	onChange,
	label,
	help,
	required = false,
	allowCreate = true,
	allowEdit = true,
} ) {
	const [ showCreateForm, setShowCreateForm ] = useState( false );
	const [ showEditForm, setShowEditForm ] = useState( false );

	// Load profiles filtered by category and type.
	const { profiles, isLoading, createProfile, updateProfile, refresh } =
		useProfiles( {
			category,
			type: profileType,
		} );

	// Get profile type definition for fields.
	const { getProfileType, getTypeFields } = useProfileTypes();
	const ProfileType = getProfileType( category, profileType );
	const typeFields = getTypeFields( category, profileType );

	// Build select options from profiles.
	const selectOptions = useMemo( () => {
		const options = [
			{
				label: __( '-- Select a profile --', 'altolith-deploy' ),
				value: '',
			},
		];

		profiles.forEach( ( profile ) => {
			options.push( {
				label: profile.name,
				value: profile.id,
			} );
		} );

		if ( allowCreate ) {
			options.push( {
				label: __( '+ Create new profile', 'altolith-deploy' ),
				value: '__create_new__',
			} );
		}

		return options;
	}, [ profiles, allowCreate ] );

	// Get currently selected profile.
	const selectedProfile = useMemo( () => {
		if ( ! value ) {
			return null;
		}
		return profiles.find( ( p ) => p.id === value ) || null;
	}, [ value, profiles ] );

	/**
	 * Handle select change.
	 *
	 * @param {string} newValue Selected value.
	 */
	const handleSelectChange = ( newValue ) => {
		if ( newValue === '__create_new__' ) {
			setShowCreateForm( true );
			return;
		}
		onChange( newValue );
	};

	/**
	 * Handle profile creation.
	 *
	 * @param {Object} profileData Profile data from form.
	 */
	const handleCreate = async ( profileData ) => {
		try {
			const newProfile = await createProfile( {
				...profileData,
				category,
				type: profileType,
			} );
			// Select the new profile.
			onChange( newProfile.id );
			setShowCreateForm( false );
		} catch {
			// Error handled by useProfiles hook.
		}
	};

	/**
	 * Handle profile update.
	 *
	 * @param {Object} profileData Updated profile data.
	 */
	const handleUpdate = async ( profileData ) => {
		if ( ! selectedProfile ) {
			return;
		}
		try {
			await updateProfile( selectedProfile.id, profileData );
			setShowEditForm( false );
			refresh();
		} catch {
			// Error handled by useProfiles hook.
		}
	};

	/**
	 * Handle cancel for create/edit forms.
	 */
	const handleCancel = () => {
		setShowCreateForm( false );
		setShowEditForm( false );
	};

	// Show loading state.
	if ( isLoading ) {
		return (
			<div className="altolith-profile-selector altolith-profile-selector--loading">
				<Flex
					className="altolith-profile-selector__loading-flex"
					align="center"
					gap={ 2 }
				>
					<FlexItem className="altolith-profile-selector__spinner">
						<Spinner />
					</FlexItem>
					<FlexBlock className="altolith-profile-selector__loading-text">
						{ __( 'Loading profiles…', 'altolith-deploy' ) }
					</FlexBlock>
				</Flex>
			</div>
		);
	}

	// Show create form if open.
	if ( showCreateForm ) {
		return (
			<div className="altolith-profile-selector altolith-profile-selector--create">
				<ProfileForm
					category={ category }
					profileType={ profileType }
					fields={ typeFields }
					profileTypeName={ ProfileType?.NAME || profileType }
					onSubmit={ handleCreate }
					onCancel={ handleCancel }
					submitLabel={ __( 'Create', 'altolith-deploy' ) }
					testEndpoint={ ProfileType?.TEST_ENDPOINT }
				/>
			</div>
		);
	}

	// Show edit form if open.
	if ( showEditForm && selectedProfile ) {
		return (
			<div className="altolith-profile-selector altolith-profile-selector--edit">
				<ProfileForm
					category={ category }
					profileType={ profileType }
					fields={ typeFields }
					profileTypeName={ ProfileType?.NAME || profileType }
					initialValues={ {
						name: selectedProfile.name,
						...selectedProfile.fields,
					} }
					onSubmit={ handleUpdate }
					onCancel={ handleCancel }
					submitLabel={ __( 'Update', 'altolith-deploy' ) }
					isEdit={ true }
					profileId={ selectedProfile.id }
					testEndpoint={ ProfileType?.TEST_ENDPOINT }
				/>
			</div>
		);
	}

	// Show normal selector.
	return (
		<div className="altolith-profile-selector">
			<Flex
				className="altolith-profile-selector__controls"
				align="flex-start"
				gap={ 2 }
			>
				<FlexBlock className="altolith-profile-selector__select-wrapper">
					<SelectControl
						className="altolith-profile-selector__select"
						label={ label }
						help={ help }
						value={ value || '' }
						onChange={ handleSelectChange }
						options={ selectOptions }
						required={ required }
						__next40pxDefaultSize={ true }
						__nextHasNoMarginBottom={ true }
					/>
				</FlexBlock>

				{ allowEdit && selectedProfile && (
					<FlexItem className="altolith-profile-selector__edit-action">
						<Button
							className="altolith-profile-selector__edit-button"
							icon={ edit }
							label={ __( 'Edit Profile', 'altolith-deploy' ) }
							onClick={ () => setShowEditForm( true ) }
							variant="secondary"
							size="default"
							style={ { marginTop: '2em' } }
						/>
					</FlexItem>
				) }

				{ allowCreate && ! value && (
					<FlexItem className="altolith-profile-selector__create-action">
						<Button
							className="altolith-profile-selector__create-button"
							icon={ plus }
							label={ __(
								'Create New Profile',
								'altolith-deploy'
							) }
							onClick={ () => setShowCreateForm( true ) }
							variant="secondary"
							size="default"
							style={ { marginTop: '2em' } }
						/>
					</FlexItem>
				) }
			</Flex>

			{ selectedProfile && (
				<p className="altolith-profile-selector__info components-base-control__help">
					{ __( 'Using profile:', 'altolith-deploy' ) }{ ' ' }
					<strong className="altolith-profile-selector__profile-name">
						{ selectedProfile.name }
					</strong>
				</p>
			) }
		</div>
	);
}
