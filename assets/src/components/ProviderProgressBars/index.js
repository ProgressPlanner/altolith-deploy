/**
 * Provider Progress Bars Component
 *
 * Displays one progress bar per provider instance with current status.
 * Shows what each provider is currently doing without message history.
 *
 */

import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	colors,
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
	createFlexStyle,
} from '@aether/utils/styles';
import { formatProviderInstanceName } from '@aether/utils/providerDisplayName';

// Styles
const containerStyle = {
	...createFlexStyle( 'column', spacing.lg ),
	marginTop: spacing.lg,
};

const providerCardStyle = {
	padding: spacing.md,
	backgroundColor: colors.backgroundLight,
	borderRadius: borderRadius.sm,
	border: `1px solid ${ colors.borderLighter }`,
};

const providerHeaderStyle = {
	...createFlexStyle( 'row', spacing.sm ),
	alignItems: 'center',
	marginBottom: spacing.sm,
	justifyContent: 'space-between',
};

const providerNameStyle = {
	fontSize: fontSize.sm,
	fontWeight: fontWeight.semibold,
	color: colors.text,
	margin: 0,
};

const providerStatusStyle = {
	fontSize: fontSize.xs,
	color: colors.textMuted,
	fontStyle: 'italic',
};

const progressBarContainerStyle = {
	...createFlexStyle( 'row', spacing.sm ),
	alignItems: 'center',
	width: '100%',
	marginTop: spacing.xs,
};

const progressBarStyle = {
	flexGrow: 1,
	height: '8px',
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
	fontSize: fontSize.xs,
	fontWeight: fontWeight.medium,
	color: colors.textMuted,
	minWidth: '3rem',
	textAlign: 'right',
	flexShrink: 0,
};

const currentMessageStyle = {
	fontSize: fontSize.xs,
	color: colors.text,
	marginTop: spacing.xs,
	padding: `${ spacing.xs } ${ spacing.sm }`,
	backgroundColor: colors.background,
	borderRadius: borderRadius.xs,
	borderLeft: `3px solid ${ colors.primary }`,
};

const getMessageTypeColor = ( type ) => {
	switch ( type ) {
		case 'error':
			return colors.error;
		case 'success':
			return colors.success;
		case 'progress':
			return colors.primary;
		case 'info':
		default:
			return colors.textMuted;
	}
};

/**
 * Extract provider-specific messages from message history.
 *
 * Groups messages by provider instance ID based on message keys.
 * Message keys follow format: `{stepId}-{providerId}`
 *
 * @param {Array} messageHistory Message history array
 * @param {Array} providerIds    Array of provider instance IDs
 * @return {Object} Map of providerId → latest message
 */
function extractProviderMessages( messageHistory, providerIds ) {
	const providerMessages = {};

	// Initialize with null for each provider
	providerIds.forEach( ( providerId ) => {
		providerMessages[ providerId ] = null;
	} );

	// Scan messages and find latest for each provider
	// Messages are prepended (newest first), so we want the first match
	messageHistory.forEach( ( msg ) => {
		if ( ! msg.key ) {
			return;
		}

		// Check if this message belongs to a provider
		providerIds.forEach( ( providerId ) => {
			// Message keys are like: uploadStaticFiles-{providerId}
			if (
				msg.key.includes( providerId ) &&
				! providerMessages[ providerId ]
			) {
				providerMessages[ providerId ] = msg;
			}
		} );
	} );

	return providerMessages;
}

/**
 * Calculate progress percentage for a provider.
 *
 * Based on which steps the provider has completed.
 * Global steps don't count toward provider progress (shared work).
 *
 * @param {string} providerId      Provider instance ID
 * @param {Array}  steps           All workflow steps
 * @param {Object} providerMessage Latest message for this provider
 * @return {number} Progress percentage (0-100)
 */
function calculateProviderProgress( providerId, steps, providerMessage ) {
	// Simple heuristic: if we have a progress message, use it
	if ( providerMessage?.progress?.percent !== undefined ) {
		return Math.round( providerMessage.progress.percent );
	}

	// Count provider-specific steps (globalCache: false)
	const providerSteps = steps.filter( ( step ) => ! step.globalCache );
	if ( providerSteps.length === 0 ) {
		return 0;
	}

	// Determine current step from message key
	const currentStepId = providerMessage?.key?.split( '-' )[ 0 ];
	if ( ! currentStepId ) {
		return 0;
	}

	// Find index of current step
	const currentStepIndex = providerSteps.findIndex(
		( step ) => step.id === currentStepId
	);
	if ( currentStepIndex === -1 ) {
		return 0;
	}

	// Progress = (completed steps / total steps) * 100
	// Current step is in progress, so it counts as half complete
	const completedSteps = currentStepIndex;
	const progress = ( ( completedSteps + 0.5 ) / providerSteps.length ) * 100;

	return Math.min( 100, Math.round( progress ) );
}

/**
 * Provider Progress Bars Component
 *
 * @param {Object} props                Component props
 * @param {Array}  props.providerIds    Array of provider instance IDs
 * @param {Array}  props.messageHistory Message history array
 * @param {Array}  props.steps          Workflow steps array
 * @return {JSX.Element|null} Provider progress bars or null if no providers
 */
export default function ProviderProgressBars( {
	providerIds = [],
	messageHistory = [],
	steps = [],
} ) {
	// Extract provider-specific messages
	const providerMessages = useMemo(
		() => extractProviderMessages( messageHistory, providerIds ),
		[ messageHistory, providerIds ]
	);

	// Calculate progress for each provider
	const providerProgress = useMemo( () => {
		const progress = {};
		providerIds.forEach( ( providerId ) => {
			const message = providerMessages[ providerId ];
			progress[ providerId ] = calculateProviderProgress(
				providerId,
				steps,
				message
			);
		} );
		return progress;
	}, [ providerIds, providerMessages, steps ] );

	// Don't render if no providers
	if ( providerIds.length === 0 ) {
		return null;
	}

	return (
		<div className="aether-provider-progress-bars" style={ containerStyle }>
			{ providerIds.map( ( providerId ) => {
				const message = providerMessages[ providerId ];
				const progress = providerProgress[ providerId ];
				const displayName = formatProviderInstanceName(
					providerId,
					providerIds
				);

				// Determine status text
				let statusText = __( 'Waiting…', 'aether-site-exporter' );
				if ( progress === 100 ) {
					statusText = __( 'Complete', 'aether-site-exporter' );
				} else if ( message?.type === 'error' ) {
					statusText = __( 'Error', 'aether-site-exporter' );
				} else if ( message?.type === 'progress' ) {
					statusText = __( 'In Progress', 'aether-site-exporter' );
				}

				return (
					<div
						key={ providerId }
						className="aether-provider-progress-card"
						style={ providerCardStyle }
					>
						<div
							className="aether-provider-progress-header"
							style={ providerHeaderStyle }
						>
							<h4
								className="aether-provider-progress-name"
								style={ providerNameStyle }
							>
								{ displayName }
							</h4>
							<span
								className="aether-provider-progress-status"
								style={ providerStatusStyle }
							>
								{ statusText }
							</span>
						</div>

						<div
							className="aether-provider-progress-bar-container"
							style={ progressBarContainerStyle }
						>
							<div
								className="aether-provider-progress-bar"
								style={ progressBarStyle }
							>
								<div
									className="aether-provider-progress-fill"
									style={ {
										...progressBarFillStyle,
										width: `${ progress }%`,
									} }
								/>
							</div>
							<span
								className="aether-provider-progress-percentage"
								style={ progressPercentageStyle }
							>
								{ progress }%
							</span>
						</div>

						{ message && message.message && (
							<div
								className="aether-provider-current-message"
								style={ {
									...currentMessageStyle,
									borderLeftColor: getMessageTypeColor(
										message.type
									),
								} }
							>
								{ message.message }
							</div>
						) }
					</div>
				);
			} ) }
		</div>
	);
}
