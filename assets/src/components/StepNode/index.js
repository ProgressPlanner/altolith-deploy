/**
 * StepNode Component
 *
 * Renders an individual step in the vertical stepper.
 * Shows status via icon/number and color, with dynamic label based on status.
 * For thread steps (upload steps), shows inline provider progress pills.
 *
 * @since 1.0.0
 */

import { Spinner } from '@wordpress/components';
import { colors, fontSize, fontWeight, spacing } from '@altolith/utils/styles';
import { ProviderPill } from '@altolith/components/ProviderPill';

const NODE_SIZE = 28;

const stepRowStyle = {
	display: 'flex',
	alignItems: 'center',
	gap: spacing.sm,
};

const nodeBaseStyle = {
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: `${ NODE_SIZE }px`,
	height: `${ NODE_SIZE }px`,
	borderRadius: '50%',
	fontSize: fontSize.xs,
	fontWeight: fontWeight.bold,
	flexShrink: 0,
	transition: 'all 0.2s ease',
	border: '2px solid transparent',
};

const labelBaseStyle = {
	fontSize: fontSize.sm,
	transition: 'color 0.2s ease',
};

const spinnerStyle = {
	width: '16px',
	height: '16px',
	margin: 0,
};

/**
 * Get status-specific styles for the node
 *
 * @param {string} status Step status
 * @return {Object} Style object
 */
function getNodeStatusStyle( status ) {
	switch ( status ) {
		case 'active':
			return {
				borderColor: colors.primary,
				color: colors.primary,
			};
		case 'complete':
			return {
				background: colors.success,
				borderColor: colors.success,
				color: colors.white,
			};
		case 'error':
			return {
				background: colors.error,
				borderColor: colors.error,
				color: colors.white,
			};
		default: // pending
			return {
				background: colors.white,
				borderColor: colors.borderLighter,
				color: colors.textMuted,
			};
	}
}

/**
 * Get status-specific styles for the label
 *
 * @param {string} status Step status
 * @return {Object} Style object
 */
function getLabelStatusStyle( status ) {
	switch ( status ) {
		case 'active':
			return {
				color: colors.primary,
				fontWeight: fontWeight.medium,
			};
		case 'complete':
			return {
				color: colors.success,
			};
		case 'error':
			return {
				color: colors.error,
			};
		default: // pending
			return {
				color: colors.textMuted,
			};
	}
}

/**
 * Get the content to display inside the node
 *
 * @param {string} status     Step status
 * @param {number} stepNumber Step number (1-indexed)
 * @return {JSX.Element|string} Node content
 */
function getNodeContent( status, stepNumber ) {
	switch ( status ) {
		case 'active':
			return <Spinner style={ spinnerStyle } />;
		case 'complete':
			return '✓';
		case 'error':
			return '✗';
		default:
			return stepNumber;
	}
}

/**
 * Get the display label based on status and statusLabels
 *
 * @param {string}      status       Step status ('pending', 'active', 'complete', 'error')
 * @param {string}      fallback     Fallback label if no statusLabels defined
 * @param {Object|null} statusLabels Status label definitions { pending, running, complete }
 * @param {Object}      statusData   Dynamic data for interpolation
 * @return {string} Display label
 */
function getDisplayLabel( status, fallback, statusLabels, statusData ) {
	// If no statusLabels defined, use fallback
	if ( ! statusLabels ) {
		return fallback;
	}

	const data = statusData || {};

	switch ( status ) {
		case 'pending':
			if ( typeof statusLabels.pending === 'function' ) {
				return statusLabels.pending( data );
			}
			return statusLabels.pending || fallback;

		case 'active':
			if ( typeof statusLabels.running === 'function' ) {
				return statusLabels.running( data );
			}
			return statusLabels.running || fallback;

		case 'complete':
			if ( typeof statusLabels.complete === 'function' ) {
				return statusLabels.complete( data );
			}
			return statusLabels.complete || fallback;

		case 'error':
			// For errors, show the fallback label (step name)
			return fallback;

		default:
			return fallback;
	}
}

/**
 * Thread step IDs that support per-provider progress
 */
const THREAD_STEP_IDS = [ 'uploadBlueprintBundle', 'uploadStaticFiles' ];

/**
 * Get providers for a specific step
 *
 * @param {string} stepId            Step ID
 * @param {Object} providerProgress  Provider progress object
 * @param {Array}  providerInstances Provider instances array
 * @return {Array} Array of { id, label, status, progress }
 */
function getProvidersForStep( stepId, providerProgress, providerInstances ) {
	if ( ! providerProgress || ! providerInstances ) {
		return [];
	}

	return providerInstances
		.map( ( instance ) => {
			const progress = providerProgress[ instance.id ];
			if ( ! progress || progress.stepId !== stepId ) {
				return null;
			}

			// Calculate percentage
			const percent =
				progress.progress?.total > 0
					? Math.round(
							( progress.progress.current /
								progress.progress.total ) *
								100
					  )
					: 0;

			return {
				id: instance.id,
				label: instance.label || instance.id,
				status: progress.status || 'pending',
				progress: percent,
			};
		} )
		.filter( Boolean );
}

/**
 * StepNode Component
 *
 * @param {Object}      props                   Component props
 * @param {number}      props.stepNumber        Step number (1-indexed)
 * @param {string}      props.label             Fallback step label
 * @param {string}      props.status            Step status ('pending', 'active', 'complete', 'error')
 * @param {Object|null} props.statusLabels      Status label definitions { pending, running, complete }
 * @param {Object}      props.statusData        Dynamic data for label interpolation
 * @param {string}      props.stepId            Step ID for provider filtering
 * @param {Object}      props.providerProgress  Provider progress object from context
 * @param {Array}       props.providerInstances Provider instances array from context
 * @return {JSX.Element} StepNode component
 */
export function StepNode( {
	stepNumber,
	label,
	status,
	statusLabels,
	statusData,
	stepId,
	providerProgress,
	providerInstances,
} ) {
	const nodeStatusStyle = getNodeStatusStyle( status );
	const labelStatusStyle = getLabelStatusStyle( status );
	const content = getNodeContent( status, stepNumber );
	const displayLabel = getDisplayLabel(
		status,
		label,
		statusLabels,
		statusData
	);

	// Get providers for this step (only for thread steps)
	const isThreadStep = THREAD_STEP_IDS.includes( stepId );
	const stepProviders = isThreadStep
		? getProvidersForStep( stepId, providerProgress, providerInstances )
		: [];

	return (
		<div
			className={ `altolith-step-node altolith-step-node--${ status }` }
			style={ stepRowStyle }
			role="listitem"
			aria-label={ `Step ${ stepNumber }: ${ displayLabel } - ${ status }` }
		>
			<span
				className="altolith-step-node__circle"
				style={ { ...nodeBaseStyle, ...nodeStatusStyle } }
			>
				{ content }
			</span>
			<span
				className="altolith-step-node__label"
				style={ { ...labelBaseStyle, ...labelStatusStyle } }
			>
				{ displayLabel }
			</span>
			{ stepProviders.length > 0 && (
				<span
					className="altolith-step-node__providers"
					style={ {
						display: 'inline-flex',
						flexWrap: 'wrap',
						gap: '4px',
						marginLeft: spacing.sm,
					} }
				>
					{ stepProviders.map( ( provider ) => (
						<ProviderPill
							key={ provider.id }
							label={ provider.label }
							status={ provider.status }
							progress={ provider.progress }
						/>
					) ) }
				</span>
			) }
		</div>
	);
}

export default StepNode;
