/**
 * Publish Progress Modal Component
 *
 * Shows export progress with progress bar and status messages
 *
 */

import { useEffect, useCallback } from '@wordpress/element';
import { Modal, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useExportState } from '@altolith/export/hooks/useExportState';
import { useExportController } from '@altolith/export/hooks/useExportController';
import { colors, spacing, noticeStyles } from '@altolith/utils/styles';
import GlobalStepsProgress from '../GlobalStepsProgress';

// Styles - extracted to module level for performance
const modalContentStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: spacing[ '2xl' ],
};

const noticeErrorStyle = {
	...noticeStyles.error,
	padding: spacing.md,
	marginBottom: spacing.md,
};

const noticeSuccessStyle = {
	...noticeStyles.success,
	padding: spacing.md,
	marginBottom: spacing.md,
};

const noticeParagraphStyle = {
	margin: '0 0 0.5rem',
};

const loadingStyle = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: spacing.xl,
	padding: spacing[ '2xl' ],
	textAlign: 'center',
};

const loadingParagraphStyle = {
	margin: 0,
	fontSize: '1.125rem',
	color: colors.textMuted,
};

export default function ExportProgressModal( { isOpen, onClose, onComplete } ) {
	const exportState = useExportState();
	const { startExport } = useExportController( exportState );
	const {
		steps,
		isExporting,
		finalStatus,
		error,
		reset,
		providerProgress,
		providerInstances,
	} = exportState;

	// Keep modal open if finalStatus is set, even if isOpen becomes false
	// This allows the auto-close effect to run and show the success message
	const shouldShowModal = isOpen || finalStatus;

	// Wrapper for onClose that resets state before closing
	// Only allow closing when job is finished (has finalStatus or error)
	const handleClose = useCallback( () => {
		// Prevent closing while job is in progress
		if ( isExporting && ! finalStatus && ! error ) {
			return;
		}
		reset();
		if ( onClose ) {
			onClose();
		}
	}, [ reset, onClose, isExporting, finalStatus, error ] );

	// Reset state when modal closes (only when shouldShowModal becomes false)
	useEffect( () => {
		if ( ! shouldShowModal ) {
			reset();
		}
	}, [ shouldShowModal, reset ] );

	// Start export when modal opens
	useEffect( () => {
		if ( isOpen && ! isExporting ) {
			// Only start if we haven't started yet (no steps initialized)
			if ( steps.length === 0 ) {
				startExport();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isOpen ] ); // Only depend on isOpen to avoid re-triggering

	// Handle completion
	useEffect( () => {
		if ( finalStatus && onComplete ) {
			// Call onComplete callback to refresh data
			// Note: Modal no longer auto-closes, user must manually close
			onComplete( finalStatus );
		}
	}, [ finalStatus, onComplete ] );

	if ( ! shouldShowModal ) {
		return null;
	}

	const getModalTitle = () => {
		if ( error ) {
			return __( 'Publish Failed', 'altolith-deploy' );
		}
		if ( finalStatus ) {
			return __( 'Site Published Successfully!', 'altolith-deploy' );
		}
		return __( 'Exporting Site', 'altolith-deploy' );
	};

	return (
		<Modal
			className="altolith-export-progress-modal"
			title={ getModalTitle() }
			onRequestClose={ handleClose }
			isFullScreen={ false }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			__experimentalHideHeader={ false }
			style={ { width: 'min(90vw, 40rem)' } }
		>
			<div
				className="altolith-export-progress-modal__content"
				style={ modalContentStyle }
			>
				{ error && (
					<div
						className="altolith-export-progress-modal__notice altolith-export-progress-modal__notice--error"
						style={ noticeErrorStyle }
					>
						<p
							className="altolith-export-progress-modal__notice-text"
							style={ { margin: 0 } }
						>
							{ error }
						</p>
					</div>
				) }

				{ finalStatus && (
					<div
						className="altolith-export-progress-modal__notice altolith-export-progress-modal__notice--success"
						style={ noticeSuccessStyle }
					>
						<p
							className="altolith-export-progress-modal__notice-text"
							style={ noticeParagraphStyle }
						>
							{ __(
								'Your site has been exported successfully!',
								'altolith'
							) }
						</p>
						{ finalStatus.deploymentUrl && (
							<p
								className="altolith-export-progress-modal__deployment"
								style={ { margin: 0 } }
							>
								<strong className="altolith-export-progress-modal__deployment-label">
									{ __(
										'View your published site:',
										'altolith'
									) }
								</strong>{ ' ' }
								<a
									className="altolith-export-progress-modal__deployment-link"
									href={ finalStatus.deploymentUrl }
									target="_blank"
									rel="noopener noreferrer"
								>
									{ finalStatus.deploymentUrl }
								</a>
							</p>
						) }
					</div>
				) }

				{ ! error && (
					<GlobalStepsProgress
						steps={ steps }
						providerProgress={ providerProgress }
						providerInstances={ providerInstances }
					/>
				) }

				{ steps.length === 0 && ! error && (
					<div
						className="altolith-export-progress-modal__loading"
						style={ loadingStyle }
					>
						<Spinner className="altolith-export-progress-modal__spinner" />
						<p
							className="altolith-export-progress-modal__loading-text"
							style={ loadingParagraphStyle }
						>
							{ __(
								'Initializing export process…',
								'altolith-deploy'
							) }
						</p>
					</div>
				) }
			</div>
		</Modal>
	);
}
