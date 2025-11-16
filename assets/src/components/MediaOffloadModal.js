/**
 * Media Offload Modal Component
 *
 * Shows progress when offloading media files.
 *
 * @package
 */

import { Modal, ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { spacing, colors, fontSize } from '../utils/styles';

/**
 * Media Offload Modal
 *
 * Displays a non-dismissible modal showing progress of media file offloading.
 *
 * @param {Object}  props                - Component props
 * @param {boolean} props.isOpen         - Whether the modal is open
 * @param {number}  props.totalFiles     - Total number of files to offload
 * @param {number}  props.completedFiles - Number of files completed
 * @return {JSX.Element|null} Modal component or null if closed
 */
export function MediaOffloadModal( { isOpen, totalFiles, completedFiles } ) {
	if ( ! isOpen ) {
		return null;
	}

	const progress = totalFiles > 0 ? ( completedFiles / totalFiles ) * 100 : 0;

	return (
		<Modal
			className="aether-media-offload-modal"
			title={ __( 'Offloading Media Files', 'aether-site-exporter' ) }
			onRequestClose={ () => {} }
			isDismissible={ false }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
		>
			<p className="aether-media-offload-modal__description">
				{ __(
					'Detected media files that need to be offloaded. Offloading media files…',
					'aether'
				) }
			</p>
			<ProgressBar
				className="aether-media-offload-modal__progress"
				value={ progress }
			/>
			<p
				className="aether-media-offload-modal__status"
				style={ {
					marginTop: spacing.sm,
					fontSize: fontSize.sm,
					color: colors.textMuted,
				} }
			>
				{ completedFiles } / { totalFiles }{ ' ' }
				{ __( 'files completed', 'aether-site-exporter' ) }
			</p>
		</Modal>
	);
}
