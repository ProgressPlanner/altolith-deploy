/**
 * Import Config Modal Component
 *
 * Modal for importing provider instance configurations from JSON.
 * Supports paste or file upload, validates JSON, and shows conflicts.
 */

import { useState, useEffect, useMemo, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Modal, TextareaControl, Button, Notice } from '@wordpress/components';
import ModalActions from '../ModalActions';
import { colors, spacing, fontSize } from '@altolith/utils/styles';

// Styles
const formStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: spacing.lg,
};

const uploadSectionStyle = {
	display: 'flex',
	alignItems: 'center',
	gap: spacing.md,
};

const helpTextStyle = {
	color: colors.textMuted || '#666',
	fontSize: fontSize.sm,
};

const jsonTextareaStyle = {
	fontFamily: 'monospace',
	fontSize: '12px',
};

const validationSuccessStyle = {
	color: colors.success,
	fontSize: fontSize.sm,
};

const validationErrorStyle = {
	color: colors.error,
	fontSize: fontSize.sm,
};

const conflictWarningStyle = {
	backgroundColor: '#fcf0e3',
	borderLeft: `4px solid #f0b849`,
	padding: spacing.md,
	marginTop: spacing.sm,
	fontSize: fontSize.sm,
};

const conflictListStyle = {
	margin: `${ spacing.xs } 0 0 ${ spacing.lg }`,
	paddingLeft: 0,
	listStylePosition: 'inside',
};

/**
 * Validate import JSON structure.
 *
 * @param {string} jsonString JSON string to validate.
 * @return {Object} Validation result with { valid, data, error }.
 */
function validateImportJson( jsonString ) {
	if ( ! jsonString || ! jsonString.trim() ) {
		return { valid: false, data: null, error: null };
	}

	let data;
	try {
		data = JSON.parse( jsonString );
	} catch ( e ) {
		return {
			valid: false,
			data: null,
			error: __( 'Invalid JSON format', 'altolith-deploy' ),
		};
	}

	if ( ! data.version ) {
		return {
			valid: false,
			data: null,
			error: __( 'Missing version field', 'altolith-deploy' ),
		};
	}

	if ( ! data.instances || typeof data.instances !== 'object' ) {
		return {
			valid: false,
			data: null,
			error: __(
				'Missing or invalid instances field',
				'altolith-deploy'
			),
		};
	}

	// Validate each instance has provider_type
	const instanceIds = Object.keys( data.instances );
	for ( const id of instanceIds ) {
		const config = data.instances[ id ];
		if ( ! config.provider_type ) {
			return {
				valid: false,
				data: null,
				error: sprintf(
					/* translators: %s: instance ID */
					__(
						'Instance "%s" is missing provider_type',
						'altolith-deploy'
					),
					id
				),
			};
		}
	}

	if ( instanceIds.length === 0 ) {
		return {
			valid: false,
			data: null,
			error: __( 'No instances to import', 'altolith-deploy' ),
		};
	}

	return { valid: true, data, error: null };
}

/**
 * Import Config Modal Component.
 *
 * @param {Object}   props                 Component props.
 * @param {boolean}  props.isOpen          Whether modal is open.
 * @param {Function} props.onClose         Callback to close modal.
 * @param {Object}   props.existingConfigs Current provider configs.
 * @param {Function} props.onImport        Callback to import (mergedConfigs) => Promise.
 * @return {JSX.Element|null} Rendered component.
 */
export default function ImportConfigModal( {
	isOpen,
	onClose,
	existingConfigs,
	onImport,
} ) {
	const [ jsonInput, setJsonInput ] = useState( '' );
	const [ isImporting, setIsImporting ] = useState( false );
	const [ importError, setImportError ] = useState( null );
	const fileInputRef = useRef( null );

	// Reset state when modal closes
	useEffect( () => {
		if ( ! isOpen ) {
			setJsonInput( '' );
			setImportError( null );
		}
	}, [ isOpen ] );

	// Validate JSON and detect conflicts
	const validation = useMemo(
		() => validateImportJson( jsonInput ),
		[ jsonInput ]
	);

	const conflicts = useMemo( () => {
		if ( ! validation.valid || ! validation.data ) {
			return [];
		}

		return Object.keys( validation.data.instances ).filter(
			( id ) => existingConfigs && existingConfigs[ id ] !== undefined
		);
	}, [ validation, existingConfigs ] );

	// Handle file upload
	const handleFileUpload = ( event ) => {
		const file = event.target.files?.[ 0 ];
		if ( ! file ) {
			return;
		}

		// eslint-disable-next-line no-undef
		const reader = new FileReader();
		reader.onload = ( e ) => {
			setJsonInput( e.target.result );
			setImportError( null );
		};
		reader.onerror = () => {
			setImportError( __( 'Failed to read file', 'altolith-deploy' ) );
		};
		reader.readAsText( file );

		// Reset file input so same file can be selected again
		event.target.value = '';
	};

	// Handle import
	const handleImport = async () => {
		if ( ! validation.valid || ! validation.data ) {
			return;
		}

		setIsImporting( true );
		setImportError( null );

		try {
			// Merge: existing configs + imported instances (import overwrites)
			const mergedConfigs = {
				...( existingConfigs || {} ),
				...validation.data.instances,
			};

			await onImport( mergedConfigs );
			onClose();
		} catch ( error ) {
			setImportError(
				error.message || __( 'Import failed', 'altolith-deploy' )
			);
		} finally {
			setIsImporting( false );
		}
	};

	const handleClose = () => {
		if ( ! isImporting ) {
			onClose();
		}
	};

	if ( ! isOpen ) {
		return null;
	}

	const instanceCount = validation.data
		? Object.keys( validation.data.instances ).length
		: 0;

	return (
		<Modal
			className="altolith-import-config-modal"
			title={ __( 'Import Provider Configuration', 'altolith-deploy' ) }
			onRequestClose={ handleClose }
			size="large"
		>
			<div
				className="altolith-import-config-modal__form"
				style={ formStyle }
			>
				{ /* File upload section */ }
				<div
					className="altolith-import-config-modal__upload"
					style={ uploadSectionStyle }
				>
					<input
						ref={ fileInputRef }
						className="altolith-import-config-modal__file-input"
						type="file"
						accept=".json"
						onChange={ handleFileUpload }
						style={ { display: 'none' } }
						data-testid="file-input"
					/>
					<Button
						className="altolith-import-config-modal__upload-button"
						variant="secondary"
						onClick={ () => fileInputRef.current?.click() }
					>
						{ __( 'Choose File…', 'altolith-deploy' ) }
					</Button>
					<span
						className="altolith-import-config-modal__help-text"
						style={ helpTextStyle }
					>
						{ __( 'or paste JSON below', 'altolith-deploy' ) }
					</span>
				</div>

				{ /* JSON textarea */ }
				<TextareaControl
					className="altolith-import-config-modal__json-input"
					label={ __( 'JSON Configuration', 'altolith-deploy' ) }
					value={ jsonInput }
					onChange={ ( value ) => {
						setJsonInput( value );
						setImportError( null );
					} }
					rows={ 12 }
					placeholder={ __(
						'Paste exported JSON here…',
						'altolith-deploy'
					) }
					__nextHasNoMarginBottom
					style={ jsonTextareaStyle }
				/>

				{ /* Validation feedback */ }
				{ validation.error && (
					<div
						className="altolith-import-config-modal__validation-error"
						style={ validationErrorStyle }
						data-testid="validation-error"
					>
						{ validation.error }
					</div>
				) }

				{ validation.valid && (
					<div className="altolith-import-config-modal__validation-success">
						<div
							className="altolith-import-config-modal__validation-success-text"
							style={ validationSuccessStyle }
							data-testid="validation-success"
						>
							{ sprintf(
								/* translators: %d: number of instances */
								__(
									'✓ Valid configuration with %d instance(s)',
									'altolith-deploy'
								),
								instanceCount
							) }
						</div>

						{ conflicts.length > 0 && (
							<div
								className="altolith-import-config-modal__conflicts"
								style={ conflictWarningStyle }
								data-testid="conflict-warning"
							>
								{ sprintf(
									/* translators: %d: number of conflicts */
									__(
										'%d existing instance(s) will be overwritten:',
										'altolith-deploy'
									),
									conflicts.length
								) }
								<ul
									className="altolith-import-config-modal__conflict-list"
									style={ conflictListStyle }
								>
									{ conflicts.map( ( id ) => (
										<li
											key={ id }
											className="altolith-import-config-modal__conflict-item"
										>
											{ existingConfigs[ id ]
												?.instance_name || id }
										</li>
									) ) }
								</ul>
							</div>
						) }
					</div>
				) }

				{ /* Import error */ }
				{ importError && (
					<Notice
						className="altolith-import-config-modal__error"
						status="error"
						isDismissible={ false }
					>
						{ importError }
					</Notice>
				) }

				<ModalActions
					onCancel={ handleClose }
					onSubmit={ handleImport }
					cancelLabel={ __( 'Cancel', 'altolith-deploy' ) }
					submitLabel={ __( 'Import', 'altolith-deploy' ) }
					isSubmitting={ isImporting }
					submitDisabled={ ! validation.valid || isImporting }
					className="altolith-import-config-modal__actions"
				/>
			</div>
		</Modal>
	);
}
