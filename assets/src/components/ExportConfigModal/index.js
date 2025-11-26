/**
 * Export Config Modal Component
 *
 * Modal for exporting provider instance configurations to JSON.
 * Allows selecting which instances to export, then copy or download.
 */

import { useState, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Modal,
	CheckboxControl,
	TextareaControl,
	Button,
	Notice,
} from '@wordpress/components';
import ModalActions from '../ModalActions';
import { colors, spacing, fontSize } from '@aether/utils/styles';

// Styles
const formStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: spacing.lg,
};

const warningStyle = {
	backgroundColor: '#fcf0e3',
	borderLeft: `4px solid #f0b849`,
	padding: spacing.md,
	marginBottom: spacing.md,
	fontSize: fontSize.sm,
};

const checkboxListStyle = {
	marginLeft: spacing.lg,
	marginTop: spacing.sm,
	display: 'flex',
	flexDirection: 'column',
	gap: spacing.xs,
};

const jsonTextareaStyle = {
	fontFamily: 'monospace',
	fontSize: '12px',
};

const buttonRowStyle = {
	display: 'flex',
	gap: spacing.sm,
	marginTop: spacing.sm,
};

const successBadgeStyle = {
	color: colors.success,
	fontSize: fontSize.sm,
	marginLeft: spacing.sm,
};

/**
 * Export Config Modal Component.
 *
 * @param {Object}   props                 Component props.
 * @param {boolean}  props.isOpen          Whether modal is open.
 * @param {Function} props.onClose         Callback to close modal.
 * @param {Object}   props.providerConfigs All provider configs (decrypted).
 * @param {Array}    props.providers       Provider metadata for display names.
 * @return {JSX.Element|null} Rendered component.
 */
export default function ExportConfigModal( {
	isOpen,
	onClose,
	providerConfigs,
	providers,
} ) {
	const [ selectedIds, setSelectedIds ] = useState( [] );
	const [ exportJson, setExportJson ] = useState( '' );
	const [ copyStatus, setCopyStatus ] = useState( '' );

	// Get list of instance IDs
	const instanceIds = useMemo(
		() => Object.keys( providerConfigs || {} ),
		[ providerConfigs ]
	);

	// Reset state when modal opens
	useEffect( () => {
		if ( isOpen ) {
			setSelectedIds( instanceIds );
			setExportJson( '' );
			setCopyStatus( '' );
		}
	}, [ isOpen, instanceIds ] );

	// Get provider display name
	const getProviderName = ( providerType ) => {
		const provider = providers?.find( ( p ) => p.id === providerType );
		return provider?.name || providerType;
	};

	// Toggle individual checkbox
	const handleToggle = ( instanceId ) => {
		setSelectedIds( ( prev ) =>
			prev.includes( instanceId )
				? prev.filter( ( id ) => id !== instanceId )
				: [ ...prev, instanceId ]
		);
		// Clear generated JSON when selection changes
		setExportJson( '' );
	};

	// Toggle all
	const handleToggleAll = () => {
		if ( selectedIds.length === instanceIds.length ) {
			setSelectedIds( [] );
		} else {
			setSelectedIds( instanceIds );
		}
		setExportJson( '' );
	};

	// Generate JSON from selected configs
	const handleGenerateJson = () => {
		const selectedConfigs = {};
		selectedIds.forEach( ( id ) => {
			if ( providerConfigs[ id ] ) {
				selectedConfigs[ id ] = providerConfigs[ id ];
			}
		} );

		const exportData = {
			version: '1.0',
			exportedAt: new Date().toISOString(),
			instances: selectedConfigs,
		};

		setExportJson( JSON.stringify( exportData, null, 2 ) );
	};

	// Copy to clipboard
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText( exportJson );
			setCopyStatus( 'copied' );
			setTimeout( () => setCopyStatus( '' ), 2000 );
		} catch {
			setCopyStatus( 'error' );
			setTimeout( () => setCopyStatus( '' ), 2000 );
		}
	};

	// Download as file
	const handleDownload = () => {
		const blob = new Blob( [ exportJson ], { type: 'application/json' } );
		const url = URL.createObjectURL( blob );
		const a = document.createElement( 'a' );
		a.href = url;
		a.download = `aether-provider-config-${
			new Date().toISOString().split( 'T' )[ 0 ]
		}.json`;
		document.body.appendChild( a );
		a.click();
		document.body.removeChild( a );
		URL.revokeObjectURL( url );
	};

	if ( ! isOpen ) {
		return null;
	}

	const isAllSelected = selectedIds.length === instanceIds.length;
	const isIndeterminate =
		selectedIds.length > 0 && selectedIds.length < instanceIds.length;

	return (
		<Modal
			className="aether-export-config-modal"
			title={ __(
				'Export Provider Configuration',
				'aether-site-exporter'
			) }
			onRequestClose={ onClose }
			size="large"
		>
			<div
				className="aether-export-config-modal__form"
				style={ formStyle }
			>
				{ /* Warning about credentials */ }
				<div
					className="aether-export-config-modal__warning"
					style={ warningStyle }
				>
					{ __(
						'Warning: Exported configuration includes credentials in plaintext. Handle with care.',
						'aether-site-exporter'
					) }
				</div>

				{ /* Instance selection */ }
				{ instanceIds.length === 0 ? (
					<Notice status="info" isDismissible={ false }>
						{ __(
							'No provider instances configured.',
							'aether-site-exporter'
						) }
					</Notice>
				) : (
					<div className="aether-export-config-modal__selection">
						<CheckboxControl
							className="aether-export-config-modal__select-all"
							label={ __( 'Select All', 'aether-site-exporter' ) }
							checked={ isAllSelected }
							indeterminate={ isIndeterminate }
							onChange={ handleToggleAll }
						/>
						<div style={ checkboxListStyle }>
							{ instanceIds.map( ( instanceId ) => {
								const config = providerConfigs[ instanceId ];
								const providerType =
									config?.provider_type ||
									instanceId.split( ':' )[ 0 ];
								const instanceName =
									config?.instance_name || instanceId;

								return (
									<CheckboxControl
										key={ instanceId }
										className="aether-export-config-modal__instance-checkbox"
										label={ `${ instanceName } (${ getProviderName(
											providerType
										) })` }
										checked={ selectedIds.includes(
											instanceId
										) }
										onChange={ () =>
											handleToggle( instanceId )
										}
									/>
								);
							} ) }
						</div>
					</div>
				) }

				{ /* Generate button */ }
				{ instanceIds.length > 0 && (
					<Button
						className="aether-export-config-modal__generate-button"
						variant="secondary"
						onClick={ handleGenerateJson }
						disabled={ selectedIds.length === 0 }
					>
						{ __( 'Generate JSON', 'aether-site-exporter' ) }
					</Button>
				) }

				{ /* JSON textarea */ }
				{ exportJson && (
					<>
						<TextareaControl
							className="aether-export-config-modal__json-output"
							value={ exportJson }
							readOnly
							rows={ 12 }
							__nextHasNoMarginBottom
							style={ jsonTextareaStyle }
						/>
						<div style={ buttonRowStyle }>
							<Button
								className="aether-export-config-modal__copy-button"
								variant="secondary"
								onClick={ handleCopy }
							>
								{ __(
									'Copy to Clipboard',
									'aether-site-exporter'
								) }
								{ copyStatus === 'copied' && (
									<span style={ successBadgeStyle }>
										{ __(
											'✓ Copied!',
											'aether-site-exporter'
										) }
									</span>
								) }
								{ copyStatus === 'error' && (
									<span
										style={ {
											...successBadgeStyle,
											color: colors.error,
										} }
									>
										{ __(
											'Failed',
											'aether-site-exporter'
										) }
									</span>
								) }
							</Button>
							<Button
								className="aether-export-config-modal__download-button"
								variant="secondary"
								onClick={ handleDownload }
							>
								{ __(
									'Download .json',
									'aether-site-exporter'
								) }
							</Button>
						</div>
					</>
				) }

				<ModalActions
					onCancel={ onClose }
					cancelLabel={ __( 'Close', 'aether-site-exporter' ) }
					className="aether-export-config-modal__actions"
				/>
			</div>
		</Modal>
	);
}
