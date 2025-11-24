/**
 * Provider Instance Panel Component
 *
 * Displays provider instances in a collapsible panel layout using WordPress PanelBody.
 * Each provider instance is displayed as a collapsible panel with basic info in the header
 * and settings form (provider settings) in the body.
 *
 */

import {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, ToggleControl, PanelBody } from '@wordpress/components';
import { trash } from '@wordpress/icons';
import ProviderForm from '@aether/components/ProviderForm';
import StatusNotice from '@aether/components/StatusNotice';
import {
	colors,
	spacing,
	fontWeight,
	fontSize,
	borderRadius,
	createFlexStyle,
} from '@aether/utils/styles';

// Styles for settings form
const sectionTitleStyle = {
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	color: colors.text,
	marginTop: 0,
	marginBottom: spacing.md,
};

const deleteButtonContainerStyle = {
	...createFlexStyle( 'row', spacing.md ),
	justifyContent: 'flex-end',
	marginTop: spacing.lg,
	paddingTop: spacing.lg,
	borderTop: `1px solid ${ colors.borderLight }`,
};

// Styles - extracted to module level for performance
const panelHeaderStyle = {
	...createFlexStyle( 'row', spacing.md ),
	alignItems: 'center',
	flexWrap: 'wrap',
	gap: spacing.md,
	width: '100%',
};

const nameStyle = {
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	color: colors.text,
	cursor: 'pointer',
	padding: `${ spacing.xs } ${ spacing.sm }`,
	borderRadius: borderRadius.sm,
	transition: 'background-color 0.2s ease',
	flex: '0 1 auto',
	minWidth: '150px',
};

const nameInputStyle = {
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	padding: `${ spacing.xs } ${ spacing.sm }`,
	border: `2px solid ${ colors.primary }`,
	borderRadius: borderRadius.sm,
	outline: 'none',
	transition: 'border-color 0.2s ease',
	width: '200px',
	flex: '0 0 auto',
};

const providerTypeTagStyle = {
	fontSize: fontSize.xs,
	fontWeight: fontWeight.medium,
	padding: '4px 8px',
	borderRadius: borderRadius.sm,
	backgroundColor: '#000',
	color: '#fff',
	display: 'inline-block',
	flex: '0 0 auto',
};

const toggleContainerStyle = {
	flex: '0 0 auto',
};

const panelBodyContentStyle = {
	...createFlexStyle( 'column', spacing.lg ),
	paddingTop: spacing.md,
};

/**
 * Provider Instance Panel Component
 *
 * @param {Object}   props          Component props.
 * @param {Object}   props.provider Provider metadata with settingsFields.
 * @param {Object}   props.instance Instance config.
 * @param {Function} props.onToggle Callback to toggle enabled state.
 * @param {Function} props.onDelete Callback to delete instance.
 * @param {Function} props.onRename Callback to rename instance.
 * @param {Function} props.onSave   Callback to save config changes.
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderInstancePanel( {
	provider,
	instance,
	onToggle,
	onDelete,
	onRename,
	onSave,
} ) {
	const [ isEditing, setIsEditing ] = useState( false );
	const [ editedName, setEditedName ] = useState(
		instance.config.instance_name || ''
	);
	const [ config, setConfig ] = useState( instance.config );
	const [ saveError, setSaveError ] = useState( null );
	const inputRef = useRef( null );

	// Update config when instance config changes
	// Use a ref to track if we're in the middle of a local update
	const isLocalUpdateRef = useRef( false );

	useEffect( () => {
		// Only sync from parent if we're not in the middle of a local update
		if ( ! isLocalUpdateRef.current ) {
			setConfig( instance.config );
		}
		// Reset the flag after sync
		isLocalUpdateRef.current = false;
	}, [ instance.config ] );

	// Focus input when editing starts
	useEffect( () => {
		if ( isEditing && inputRef.current ) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [ isEditing ] );

	const handleNameSave = useCallback( async () => {
		if ( editedName.trim() === '' ) {
			setEditedName( instance.config.instance_name || '' );
			setIsEditing( false );
			return;
		}

		// Don't save if name hasn't changed
		if ( editedName === instance.config.instance_name ) {
			setIsEditing( false );
			return;
		}

		// Save the new name via API
		if ( onRename ) {
			try {
				await onRename( instance.instanceId, editedName );
			} catch ( error ) {
				console.error( 'Failed to rename instance:', error );
				// Revert to original name on error
				setEditedName( instance.config.instance_name || '' );
			}
		}
		setIsEditing( false );
	}, [
		editedName,
		instance.config.instance_name,
		instance.instanceId,
		onRename,
	] );

	const handleNameCancel = useCallback( () => {
		setEditedName( instance.config.instance_name || '' );
		setIsEditing( false );
	}, [ instance.config.instance_name ] );

	const handleDelete = () => {
		// eslint-disable-next-line no-alert
		const confirmed = confirm(
			sprintf(
				/* translators: %s: instance name */
				__(
					'Are you sure you want to delete the instance "%s"? This cannot be undone.',
					'aether-site-exporter'
				),
				instance.config.instance_name
			)
		);

		if ( confirmed ) {
			onDelete();
		}
	};

	// Get provider metadata
	const providerMetadata = provider?.metadata || {};
	const settingsFields = provider?.settingsFields || [];

	// Compute initial values for ProviderForm
	const formInitialValues = useMemo( () => {
		// Only include fields that are defined in settingsFields
		// This prevents non-form fields from being passed as initialValues
		const fieldValues = settingsFields.reduce( ( acc, field ) => {
			if (
				config[ field.id ] !== undefined &&
				config[ field.id ] !== null
			) {
				acc[ field.id ] = config[ field.id ];
			}
			return acc;
		}, {} );

		return fieldValues;
	}, [ settingsFields, config ] );

	const handleFormChange = useCallback(
		( fieldId, value ) => {
			// Defensive check: ensure fieldId is provided
			if ( ! fieldId ) {
				return;
			}

			// Get list of valid form field IDs from settingsFields
			const validFieldIds = new Set(
				settingsFields.map( ( field ) => field.id )
			);

			// Only update if this is a valid form field
			if ( ! validFieldIds.has( fieldId ) ) {
				return;
			}

			// Update only the specific field that changed
			setConfig( ( prevConfig ) => ( {
				...prevConfig,
				[ fieldId ]: value,
			} ) );
		},
		[ settingsFields ]
	);

	const handleFormSubmit = async ( values ) => {
		if ( ! instance.instanceId ) {
			return;
		}

		setSaveError( null );

		try {
			// Use current local config state (preserves toggle state)
			const currentEnabled = config.enabled !== false; // Default to enabled

			const updatedConfig = {
				...values,
				enabled: currentEnabled,
			};

			// Notify parent to save (parent has complete provider state)
			if ( onSave ) {
				await onSave( instance.instanceId, updatedConfig );
			}
		} catch ( err ) {
			console.error( 'Failed to save provider config:', err );
			setSaveError(
				err.message ||
					__( 'Failed to save settings', 'aether-site-exporter' )
			);
			throw err;
		}
	};

	// Custom header content - memoized to prevent title disappearing on re-renders
	const headerContent = useMemo(
		() => (
			<div
				className="aether-provider-instance-panel__header-content"
				style={ panelHeaderStyle }
			>
				{ /* Instance Name */ }
				{ isEditing ? (
					<input
						ref={ inputRef }
						className="aether-provider-instance-panel__name-input"
						type="text"
						value={ editedName }
						onChange={ ( e ) => setEditedName( e.target.value ) }
						onBlur={ handleNameSave }
						onKeyDown={ ( e ) => {
							if ( e.key === 'Enter' ) {
								handleNameSave();
							} else if ( e.key === 'Escape' ) {
								handleNameCancel();
							}
						} }
						style={ nameInputStyle }
						onClick={ ( e ) => e.stopPropagation() }
					/>
				) : (
					<div
						className="aether-provider-instance-panel__name"
						style={ nameStyle }
						onClick={ ( e ) => {
							e.stopPropagation();
							setIsEditing( true );
						} }
						onKeyDown={ ( e ) => {
							if ( e.key === 'Enter' || e.key === ' ' ) {
								e.stopPropagation();
								setIsEditing( true );
							}
						} }
						onMouseEnter={ ( e ) => {
							e.currentTarget.style.backgroundColor =
								colors.backgroundLighter;
						} }
						onMouseLeave={ ( e ) => {
							e.currentTarget.style.backgroundColor =
								'transparent';
						} }
						role="button"
						tabIndex={ 0 }
						title={ __(
							'Click to edit name',
							'aether-site-exporter'
						) }
					>
						{ config.instance_name ||
							instance.config.instance_name }
					</div>
				) }

				{ /* Provider Type Tag */ }
				<span
					className="aether-provider-instance-panel__type-tag"
					style={ providerTypeTagStyle }
				>
					{ providerMetadata.name || provider?.id || '' }
				</span>

				{ /* Enabled Toggle */ }
				<div
					className="aether-provider-instance-panel__toggle"
					style={ toggleContainerStyle }
					onClick={ ( e ) => e.stopPropagation() }
					onKeyDown={ ( e ) => {
						if ( e.key === 'Enter' || e.key === ' ' ) {
							e.stopPropagation();
						}
					} }
					role="presentation"
				>
					<ToggleControl
						className="aether-provider-instance-panel__toggle-control"
						label={ __(
							'Enable this instance',
							'aether-site-exporter'
						) }
						checked={ config.enabled !== false }
						onChange={ ( enabled ) => {
							// Mark that we're doing a local update
							isLocalUpdateRef.current = true;
							// Update local state immediately for reactivity
							setConfig( ( prev ) => ( { ...prev, enabled } ) );
							// Then call the parent callback
							onToggle( enabled );
						} }
						__nextHasNoMarginBottom={ true }
					/>
				</div>
			</div>
		),
		[
			isEditing,
			editedName,
			config.instance_name,
			instance.config.instance_name,
			config.enabled,
			providerMetadata.name,
			provider?.id,
			handleNameSave,
			handleNameCancel,
			onToggle,
		]
	);

	return (
		<PanelBody
			className="aether-provider-instance-panel"
			title={ headerContent }
			initialOpen={ false }
		>
			<div
				className="aether-provider-instance-panel__body"
				style={ panelBodyContentStyle }
			>
				{ saveError && (
					<StatusNotice
						status="error"
						message={ saveError }
						isDismissible
						onRemove={ () => setSaveError( null ) }
						className="aether-provider-instance-panel__notice"
					/>
				) }

				{ /* Provider Settings Form */ }
				{ settingsFields.length > 0 && (
					<ProviderForm
						providerId={ provider?.id }
						fields={ settingsFields }
						initialValues={ formInitialValues }
						onChange={ handleFormChange }
						onSubmit={ handleFormSubmit }
					/>
				) }

				{ /* Delete Button */ }
				<div
					className="aether-provider-instance-panel__delete-container"
					style={ deleteButtonContainerStyle }
				>
					<Button
						className="aether-provider-instance-panel__delete-button"
						variant="secondary"
						isDestructive
						onClick={ handleDelete }
						icon={ trash }
					>
						{ __( 'Delete Instance', 'aether-site-exporter' ) }
					</Button>
				</div>
			</div>
		</PanelBody>
	);
}
