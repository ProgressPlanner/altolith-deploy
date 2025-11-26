/**
 * Copy Config Dropdown Component
 *
 * Allows users to copy configuration from another provider instance.
 * Displays a dropdown of compatible instances (same provider family).
 */

import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { SelectControl, Notice, Spinner } from '@wordpress/components';
import apiFetch from '@aether/utils/api';
import { getCompatibleInstances } from '@aether/providers/utils/providerFamily';
import { colors, spacing, fontSize, borderRadius } from '@aether/utils/styles';

const containerStyle = {
	marginBottom: spacing.lg,
	padding: spacing.md,
	backgroundColor: colors.backgroundLighter,
	borderRadius: borderRadius.md,
	border: `1px solid ${ colors.borderLight }`,
};

const labelStyle = {
	display: 'block',
	marginBottom: spacing.sm,
	fontSize: fontSize.sm,
	fontWeight: '500',
	color: colors.text,
};

const selectWrapperStyle = {
	display: 'flex',
	alignItems: 'center',
	gap: spacing.sm,
};

const noticeStyle = {
	marginTop: spacing.sm,
};

/**
 * Copy Config Dropdown Component.
 *
 * @param {Object}   props                   Component props.
 * @param {string}   props.currentInstanceId Current instance ID being edited.
 * @param {Array}    props.allInstances      Array of all provider instances.
 * @param {Array}    props.targetFields      Array of field IDs this provider uses.
 * @param {Function} props.onCopy            Callback when config is copied: (copiedValues) => void.
 * @return {JSX.Element|null} Rendered component or null if no compatible instances.
 */
export default function CopyConfigDropdown( {
	currentInstanceId,
	allInstances,
	targetFields,
	onCopy,
} ) {
	const [ selectedSource, setSelectedSource ] = useState( '' );
	const [ isCopying, setIsCopying ] = useState( false );
	const [ copyResult, setCopyResult ] = useState( null );

	// Get compatible instances (same family, excluding current).
	const compatibleInstances = getCompatibleInstances(
		currentInstanceId,
		allInstances
	);

	// Don't render if no compatible instances.
	if ( compatibleInstances.length === 0 ) {
		return null;
	}

	const handleSourceChange = async ( sourceId ) => {
		setSelectedSource( sourceId );
		setCopyResult( null );

		// If no source selected, just clear selection.
		if ( ! sourceId ) {
			return;
		}

		setIsCopying( true );

		try {
			const response = await apiFetch( {
				path: `/aether/site-exporter/providers/${ currentInstanceId }/copy-from/${ sourceId }`,
				method: 'POST',
				data: {
					target_fields: targetFields,
				},
			} );

			if ( response.success && response.copiedFields ) {
				const copiedCount = Object.keys( response.copiedFields ).length;

				if ( copiedCount > 0 ) {
					onCopy( response.copiedFields );
					setCopyResult( {
						type: 'success',
						message: sprintf(
							/* translators: %d: number of fields copied */
							__(
								'Copied %d field(s) successfully.',
								'aether-site-exporter'
							),
							copiedCount
						),
					} );
				} else {
					setCopyResult( {
						type: 'warning',
						message: __(
							'No compatible fields found to copy.',
							'aether-site-exporter'
						),
					} );
				}
			}
		} catch ( error ) {
			setCopyResult( {
				type: 'error',
				message:
					error.message ||
					__(
						'Failed to copy configuration.',
						'aether-site-exporter'
					),
			} );
		} finally {
			setIsCopying( false );
			// Reset selection after copy attempt.
			setSelectedSource( '' );
		}
	};

	// Build dropdown options.
	const options = [
		{
			label: __( 'Copy from…', 'aether-site-exporter' ),
			value: '',
		},
		...compatibleInstances.map( ( inst ) => ( {
			label:
				inst.config?.instance_name || inst.instanceId.split( ':' )[ 0 ],
			value: inst.instanceId,
		} ) ),
	];

	return (
		<div className="aether-copy-config-dropdown" style={ containerStyle }>
			<span style={ labelStyle }>
				{ __(
					'Copy settings from another instance',
					'aether-site-exporter'
				) }
			</span>

			<div style={ selectWrapperStyle }>
				<SelectControl
					className="aether-copy-config-dropdown__select"
					label={ __(
						'Select source instance',
						'aether-site-exporter'
					) }
					hideLabelFromVision
					value={ selectedSource }
					onChange={ handleSourceChange }
					options={ options }
					disabled={ isCopying }
					__nextHasNoMarginBottom
				/>
				{ isCopying && <Spinner /> }
			</div>

			{ copyResult && (
				<Notice
					className="aether-copy-config-dropdown__notice"
					status={ copyResult.type }
					isDismissible={ false }
					style={ noticeStyle }
				>
					{ copyResult.message }
				</Notice>
			) }
		</div>
	);
}
