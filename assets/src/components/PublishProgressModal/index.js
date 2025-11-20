/**
 * Publish Progress Modal Component
 *
 * Shows publish progress with progress bar and status messages
 *
 * @package
 */

import { useEffect, useMemo, useCallback, useRef } from '@wordpress/element';
import { Modal, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { usePublishState } from '../../publish/hooks/usePublishState';
import { usePublishController } from '../../publish/hooks/usePublishController';
import {
	colors,
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
	noticeStyles,
	createFlexStyle,
	utilityStyles,
} from '../../utils/styles';
import ActivityLogMessage from '../ActivityLogMessage';
import UploadStatistics from '../UploadStatistics';

// Styles - extracted to module level for performance
const modalContentStyle = {
	padding: spacing[ '2xl' ],
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

const progressContainerStyle = {
	...createFlexStyle( 'column', spacing.xl ),
};

const progressBarContainerStyle = {
	...createFlexStyle( 'row', spacing.lg ),
	alignItems: 'center',
	width: '100%',
};

const progressBarStyle = {
	width: '100%',
	height: '20px',
	backgroundColor: colors.borderLighter,
	borderRadius: borderRadius.sm,
	overflow: 'hidden',
	position: 'relative',
};

const progressBarFillStyle = {
	height: '100%',
	backgroundColor: colors.primary,
	transition: 'width 0.3s ease',
	borderRadius: borderRadius.sm,
};

const progressPercentageStyle = {
	fontSize: fontSize.sm,
	fontWeight: fontWeight.semibold,
	color: colors.text,
	minWidth: '3rem',
	textAlign: 'right',
	flexShrink: 0,
};

const activityLogStyle = {
	marginTop: spacing.xl,
	overflowY: 'auto',
	fontSize: fontSize.xs,
	height: '300px',
};

const activityListStyle = {
	listStyle: 'none',
	margin: 0,
	padding: 0,
	...createFlexStyle( 'column', 0 ),
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

export default function PublishProgressModal( {
	isOpen,
	onClose,
	onComplete,
} ) {
	const publishState = usePublishState();
	const { startPublish } = usePublishController( publishState );
	const {
		steps,
		isPublishing,
		jobId,
		finalStatus,
		error,
		reset,
		overallProgress,
		messageHistory,
		staticSiteProviders,
		blueprintBundleProviders,
	} = publishState;

	// Ref for activity log auto-scroll
	const activityLogRef = useRef( null );

	// Keep modal open if finalStatus is set, even if isOpen becomes false
	// This allows the auto-close effect to run and show the success message
	const shouldShowModal = isOpen || finalStatus;

	// Wrapper for onClose that resets state before closing
	// Only allow closing when job is finished (has finalStatus or error)
	const handleClose = useCallback( () => {
		// Prevent closing while job is in progress
		if ( isPublishing && ! finalStatus && ! error ) {
			return;
		}
		reset();
		if ( onClose ) {
			onClose();
		}
	}, [ reset, onClose, isPublishing, finalStatus, error ] );

	// Reset state when modal closes (only when shouldShowModal becomes false)
	useEffect( () => {
		if ( ! shouldShowModal ) {
			reset();
		}
	}, [ shouldShowModal, reset ] );

	// Start publish when modal opens
	useEffect( () => {
		if ( isOpen && ! isPublishing ) {
			// Only start if we haven't started yet (no steps initialized and no job ID)
			if ( steps.length === 0 && ! jobId ) {
				startPublish();
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

	// Auto-scroll activity log to top when new messages arrive
	useEffect( () => {
		if ( activityLogRef.current ) {
			activityLogRef.current.scrollTo( {
				top: 0,
				behavior: 'smooth',
			} );
		}
	}, [ messageHistory.length ] );

	// Calculate overall progress from steps if not explicitly set
	const displayProgress = useMemo( () => {
		if ( overallProgress > 0 ) {
			return overallProgress;
		}
		if ( steps.length === 0 ) {
			return 0;
		}
		const completedSteps = steps.filter(
			( step ) => step.status === 'complete'
		).length;
		const currentActiveStep = steps.find(
			( step ) => step.status === 'active'
		);
		let progress = ( completedSteps / steps.length ) * 100;
		if ( currentActiveStep && currentActiveStep.supportsProgress ) {
			progress += currentActiveStep.progress / steps.length;
		}
		return Math.min( 100, Math.round( progress ) );
	}, [ steps, overallProgress ] );

	// Sort activity log messages by priority: progress → error → success/info
	const sortedMessageHistory = useMemo( () => {
		const getPriority = ( type ) => {
			switch ( type ) {
				case 'progress':
					return 0;
				case 'error':
					return 1;
				case 'success':
				case 'info':
				default:
					return 2;
			}
		};

		return [ ...messageHistory ].sort( ( a, b ) => {
			const priorityA = getPriority( a.type );
			const priorityB = getPriority( b.type );
			// Sort by priority first
			if ( priorityA !== priorityB ) {
				return priorityA - priorityB;
			}
			// Within same priority, maintain existing order (newest first)
			// Since messages are prepended, original index order is preserved
			return 0;
		} );
	}, [ messageHistory ] );

	if ( ! shouldShowModal ) {
		return null;
	}

	const getModalTitle = () => {
		if ( error ) {
			return __( 'Publish Failed', 'aether-site-exporter' );
		}
		if ( finalStatus ) {
			return __( 'Site Published Successfully!', 'aether-site-exporter' );
		}
		return __( 'Publishing Site', 'aether-site-exporter' );
	};

	return (
		<Modal
			className="aether-publish-progress-modal"
			title={ getModalTitle() }
			onRequestClose={ handleClose }
			isFullScreen={ false }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			__experimentalHideHeader={ false }
		>
			<div
				className="aether-publish-progress-modal__content"
				style={ modalContentStyle }
			>
				{ error && (
					<div
						className="aether-publish-progress-modal__notice aether-publish-progress-modal__notice--error"
						style={ noticeErrorStyle }
					>
						<p
							className="aether-publish-progress-modal__notice-text"
							style={ utilityStyles.noMargin }
						>
							{ error }
						</p>
					</div>
				) }

				{ finalStatus && (
					<div
						className="aether-publish-progress-modal__notice aether-publish-progress-modal__notice--success"
						style={ noticeSuccessStyle }
					>
						<p
							className="aether-publish-progress-modal__notice-text"
							style={ noticeParagraphStyle }
						>
							{ __(
								'Your site has been published successfully!',
								'aether'
							) }
						</p>
						{ finalStatus.deploymentUrl && (
							<p
								className="aether-publish-progress-modal__deployment"
								style={ utilityStyles.noMargin }
							>
								<strong className="aether-publish-progress-modal__deployment-label">
									{ __(
										'View your published site:',
										'aether'
									) }
								</strong>{ ' ' }
								<a
									className="aether-publish-progress-modal__deployment-link"
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

				{ ! finalStatus && ! error && steps.length > 0 && (
					<div
						className="aether-publish-progress-modal__progress"
						style={ progressContainerStyle }
					>
						<div
							className="aether-publish-progress-modal__progress-container"
							style={ progressBarContainerStyle }
						>
							<div
								className="aether-publish-progress-modal__progress-bar"
								style={ progressBarStyle }
							>
								<div
									className="aether-publish-progress-modal__progress-fill"
									style={ {
										...progressBarFillStyle,
										width: `${ displayProgress }%`,
									} }
								/>
							</div>
							<span
								className="aether-publish-progress-modal__progress-percentage"
								style={ progressPercentageStyle }
							>
								{ displayProgress }%
							</span>
						</div>
					</div>
				) }

				<UploadStatistics
					messageHistory={ messageHistory }
					staticSiteProviders={ staticSiteProviders }
					blueprintBundleProviders={ blueprintBundleProviders }
				/>

				{ messageHistory.length > 0 && (
					<div
						className="aether-publish-progress-modal__activity-log"
						style={ activityLogStyle }
						ref={ activityLogRef }
					>
						<ul
							className="aether-publish-progress-modal__activity-list"
							style={ activityListStyle }
						>
							{ sortedMessageHistory.map( ( item ) => (
								<ActivityLogMessage
									key={ item.id }
									message={ item.message }
									type={ item.type }
									progress={ item.progress }
								/>
							) ) }
						</ul>
					</div>
				) }

				{ steps.length === 0 && ! error && (
					<div
						className="aether-publish-progress-modal__loading"
						style={ loadingStyle }
					>
						<Spinner className="aether-publish-progress-modal__spinner" />
						<p
							className="aether-publish-progress-modal__loading-text"
							style={ loadingParagraphStyle }
						>
							{ __(
								'Initializing publish process…',
								'aether-site-exporter'
							) }
						</p>
					</div>
				) }
			</div>
		</Modal>
	);
}
