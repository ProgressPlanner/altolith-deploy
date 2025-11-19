/**
 * Provider Instance Card Component
 *
 * Displays a single provider instance with inline name editing,
 * enable/disable toggle, configure button, and delete button.
 *
 * @package
 */

import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, ToggleControl } from '@wordpress/components';
import { colors, spacing, fontWeight } from '../../utils/styles';

/**
 * Provider Instance Card Component.
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.provider    Provider metadata (from PHP).
 * @param {Object}   props.instance    Instance config.
 * @param {Function} props.onConfigure Callback to configure instance.
 * @param {Function} props.onToggle    Callback to toggle enabled state.
 * @param {Function} props.onDelete    Callback to delete instance.
 * @param {Function} props.onRename    Callback to rename instance.
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderInstanceCard( {
	provider,
	instance,
	onConfigure,
	onToggle,
	onDelete,
	onRename,
} ) {
	const [ isEditing, setIsEditing ] = useState( false );
	const [ editedName, setEditedName ] = useState(
		instance.config.instance_name || ''
	);
	const inputRef = useRef( null );

	// Focus input when editing starts
	useEffect( () => {
		if ( isEditing && inputRef.current ) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [ isEditing ] );

	const handleNameSave = async () => {
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
	};

	const handleNameCancel = () => {
		setEditedName( instance.config.instance_name || '' );
		setIsEditing( false );
	};

	const handleDelete = () => {
		// eslint-disable-next-line no-alert
		const confirmed = confirm(
			__(
				`Are you sure you want to delete the instance "${ instance.config.instance_name }"? This cannot be undone.`,
				'aether-site-exporter'
			)
		);

		if ( confirmed ) {
			onDelete();
		}
	};

	const cardStyle = {
		border: `1px solid ${ colors.borderLight }`,
		borderRadius: '6px',
		padding: spacing.md,
		backgroundColor: colors.surface,
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.md,
	};

	const headerStyle = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacing.sm,
	};

	const nameStyle = {
		fontSize: '1rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
		cursor: 'pointer',
		flex: 1,
		padding: `${ spacing.xs } ${ spacing.sm }`,
		borderRadius: '4px',
		':hover': {
			backgroundColor: colors.surfaceAlt,
		},
	};

	const nameInputStyle = {
		fontSize: '1rem',
		fontWeight: fontWeight.semibold,
		padding: `${ spacing.xs } ${ spacing.sm }`,
		border: `2px solid ${ colors.primary }`,
		borderRadius: '4px',
		flex: 1,
		outline: 'none',
	};

	const statusBadgeStyle = {
		fontSize: '0.75rem',
		padding: `${ spacing.xs } ${ spacing.sm }`,
		borderRadius: '12px',
		backgroundColor: instance.config.enabled
			? colors.successLight
			: colors.borderLight,
		color: instance.config.enabled ? colors.success : colors.textSecondary,
		fontWeight: fontWeight.medium,
	};

	const metaStyle = {
		fontSize: '0.75rem',
		color: colors.textTertiary,
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.xs,
	};

	const actionsStyle = {
		display: 'flex',
		gap: spacing.sm,
		paddingTop: spacing.sm,
		borderTop: `1px solid ${ colors.borderLight }`,
	};

	return (
		<div style={ cardStyle }>
			<div style={ headerStyle }>
				{ isEditing ? (
					<>
						<input
							ref={ inputRef }
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
						/>
					</>
				) : (
					<>
						<div
							style={ nameStyle }
							onClick={ () => setIsEditing( true ) }
							onKeyDown={ ( e ) => {
								if ( e.key === 'Enter' || e.key === ' ' ) {
									setIsEditing( true );
								}
							} }
							role="button"
							tabIndex={ 0 }
							title={ __(
								'Click to edit name',
								'aether-site-exporter'
							) }
						>
							{ instance.config.instance_name }
						</div>
						<span style={ statusBadgeStyle }>
							{ instance.config.enabled
								? __( 'Enabled', 'aether-site-exporter' )
								: __( 'Disabled', 'aether-site-exporter' ) }
						</span>
					</>
				) }
			</div>

			<div style={ metaStyle }>
				<div>
					<strong>{ __( 'ID:', 'aether-site-exporter' ) }</strong>{ ' ' }
					<code
						style={ {
							fontSize: '0.7rem',
							backgroundColor: colors.surfaceAlt,
							padding: '2px 4px',
							borderRadius: '3px',
						} }
					>
						{ instance.instanceId }
					</code>
				</div>
			</div>

			<div>
				<ToggleControl
					label={ __( 'Enable this instance', 'aether-site-exporter' ) }
					checked={ instance.config.enabled !== false }
					onChange={ onToggle }
				/>
			</div>

			<div style={ actionsStyle }>
				<Button variant="secondary" onClick={ onConfigure } style={ { flex: 1 } }>
					{ __( 'Configure', 'aether-site-exporter' ) }
				</Button>
				<Button
					variant="secondary"
					isDestructive
					onClick={ handleDelete }
					title={ __( 'Delete this instance', 'aether-site-exporter' ) }
				>
					{ __( 'Delete', 'aether-site-exporter' ) }
				</Button>
			</div>
		</div>
	);
}
