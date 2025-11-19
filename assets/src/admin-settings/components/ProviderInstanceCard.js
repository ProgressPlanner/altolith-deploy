/**
 * Provider Instance Card Component
 *
 * Displays a single provider instance with inline name editing,
 * enable/disable toggle, configure button, and delete button.
 *
 * @package
 */

import { useState, useRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	ToggleControl,
	Card,
	CardHeader,
	CardBody,
	CardFooter,
} from '@wordpress/components';
import {
	colors,
	spacing,
	fontWeight,
	fontSize,
	borderRadius,
	statusBadgeStyles,
} from '../../utils/styles';

/**
 * Provider Instance Card Component.
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.provider    Provider metadata.
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

	const headerContentStyle = {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.sm,
	};

	const headerRowStyle = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacing.sm,
	};

	const nameStyle = {
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		color: colors.text,
		cursor: 'pointer',
		flex: 1,
		padding: `${ spacing.xs } ${ spacing.sm }`,
		borderRadius: borderRadius.sm,
		transition: 'background-color 0.2s ease',
	};

	const nameInputStyle = {
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		padding: `${ spacing.xs } ${ spacing.sm }`,
		border: `2px solid ${ colors.primary }`,
		borderRadius: borderRadius.sm,
		flex: 1,
		outline: 'none',
		transition: 'border-color 0.2s ease',
	};

	// Use WordPress statusBadgeStyles utility
	const statusBadgeStyle = {
		...statusBadgeStyles.base,
		...( instance.config.enabled
			? statusBadgeStyles.success
			: {
					background: colors.backgroundLighter,
					color: colors.textSecondary,
			  } ),
		fontSize: fontSize.sm,
		borderRadius: borderRadius.full,
	};

	const actionsStyle = {
		display: 'flex',
		gap: spacing.sm,
	};

	const providerTypeTagStyle = {
		fontSize: fontSize.xs,
		fontWeight: fontWeight.medium,
		padding: '4px 8px',
		borderRadius: borderRadius.sm,
		backgroundColor: colors.backgroundLighter,
		color: colors.textSecondary,
		display: 'inline-block',
		marginBottom: spacing.sm,
	};

	return (
		<Card className="aether-provider-instance-card">
			<CardHeader className="aether-provider-instance-card__header">
				<div
					className="aether-provider-instance-card__header-content"
					style={ headerContentStyle }
				>
					{ /* Provider Type Tag */ }
					<div
						className="aether-provider-instance-card__type-tag"
						style={ providerTypeTagStyle }
					>
						{ provider.name }
					</div>

					<div
						className="aether-provider-instance-card__header-row"
						style={ headerRowStyle }
					>
						{ isEditing ? (
							<>
								<input
									ref={ inputRef }
									className="aether-provider-instance-card__name-input"
									type="text"
									value={ editedName }
									onChange={ ( e ) =>
										setEditedName( e.target.value )
									}
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
									className="aether-provider-instance-card__name"
									style={ nameStyle }
									onClick={ () => setIsEditing( true ) }
									onKeyDown={ ( e ) => {
										if (
											e.key === 'Enter' ||
											e.key === ' '
										) {
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
									{ instance.config.instance_name }
								</div>
								<span
									className={ `aether-provider-instance-card__status aether-provider-instance-card__status--${
										instance.config.enabled
											? 'enabled'
											: 'disabled'
									}` }
									style={ statusBadgeStyle }
								>
									{ instance.config.enabled
										? __(
												'Enabled',
												'aether-site-exporter'
										  )
										: __(
												'Disabled',
												'aether-site-exporter'
										  ) }
								</span>
							</>
						) }
					</div>
				</div>
			</CardHeader>

			<CardBody className="aether-provider-instance-card__body">
				<div className="aether-provider-instance-card__toggle">
					<ToggleControl
						className="aether-provider-instance-card__toggle-control"
						label={ __(
							'Enable this instance',
							'aether-site-exporter'
						) }
						checked={ instance.config.enabled !== false }
						onChange={ onToggle }
					/>
				</div>
			</CardBody>

			<CardFooter className="aether-provider-instance-card__footer">
				<div
					className="aether-provider-instance-card__actions"
					style={ actionsStyle }
				>
					<Button
						className="aether-provider-instance-card__configure-button"
						variant="secondary"
						onClick={ onConfigure }
						style={ { flex: 1 } }
					>
						{ __( 'Configure', 'aether-site-exporter' ) }
					</Button>
					<Button
						className="aether-provider-instance-card__delete-button"
						variant="secondary"
						isDestructive
						onClick={ handleDelete }
						title={ __(
							'Delete this instance',
							'aether-site-exporter'
						) }
					>
						{ __( 'Delete', 'aether-site-exporter' ) }
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
