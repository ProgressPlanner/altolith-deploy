/**
 * Global Steps Progress Component
 *
 * Displays progress for global export steps (those that run once before
 * per-provider thread steps). Shows visual feedback during the initial
 * export phases like URL discovery, asset extraction, and archive creation.
 *
 * @since 1.0.0
 */

import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	colors,
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
} from '@aether/utils/styles';

/**
 * IDs of global steps (steps that run once, not per-provider)
 * These are the steps that need visual feedback at the start of export.
 */
export const GLOBAL_STEP_IDS = [
	'discoverBlueprintBundleAssets',
	'getStaticSiteUrls',
	'preScanStaticSite',
	'createWpContentArchive',
	'createBlueprintBundle',
];

/**
 * Check if all global steps are complete
 *
 * @param {Array} steps - Array of step objects with id and status
 * @return {boolean} True if all global steps are complete
 */
export function areGlobalStepsComplete( steps ) {
	if ( ! steps || steps.length === 0 ) {
		return false;
	}
	const globalSteps = steps.filter( ( step ) =>
		GLOBAL_STEP_IDS.includes( step.id )
	);
	if ( globalSteps.length === 0 ) {
		return false;
	}
	return globalSteps.every( ( step ) => step.status === 'complete' );
}

/**
 * Human-readable labels for global steps
 */
const STEP_LABELS = {
	discoverBlueprintBundleAssets: __(
		'Discovering assets',
		'aether-site-exporter'
	),
	getStaticSiteUrls: __( 'Discovering URLs', 'aether-site-exporter' ),
	preScanStaticSite: __( 'Scanning pages', 'aether-site-exporter' ),
	createWpContentArchive: __( 'Creating archive', 'aether-site-exporter' ),
	createBlueprintBundle: __( 'Building blueprint', 'aether-site-exporter' ),
};

// Styles
const containerStyle = {
	marginBottom: spacing.xl,
};

const headerStyle = {
	display: 'flex',
	alignItems: 'center',
	gap: spacing.sm,
	marginBottom: spacing.md,
	fontSize: fontSize.sm,
	fontWeight: fontWeight.semibold,
	color: colors.text,
};

const stepsListStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: spacing.xs,
};

const stepItemStyle = {
	display: 'flex',
	alignItems: 'center',
	gap: spacing.sm,
	padding: `${ spacing.xs } ${ spacing.sm }`,
	borderRadius: borderRadius.sm,
	fontSize: fontSize.sm,
	transition: 'all 0.2s ease',
};

const stepIconStyle = {
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '18px',
	height: '18px',
	borderRadius: '50%',
	fontSize: '10px',
	fontWeight: fontWeight.bold,
	flexShrink: 0,
};

const spinnerWrapperStyle = {
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '18px',
	height: '18px',
};

/**
 * Get status-specific styles for step item
 *
 * @param {string} status Step status
 * @return {Object} Style object
 */
function getStepItemStatusStyle( status ) {
	switch ( status ) {
		case 'active':
			return {
				background: colors.backgroundInfo,
				color: colors.primary,
				fontWeight: fontWeight.medium,
			};
		case 'complete':
			return {
				color: colors.success,
			};
		case 'error':
			return {
				background: colors.backgroundError,
				color: colors.error,
			};
		default:
			return {
				color: colors.textMuted,
			};
	}
}

/**
 * Get status-specific styles for step icon
 *
 * @param {string} status Step status
 * @return {Object} Style object
 */
function getStepIconStatusStyle( status ) {
	switch ( status ) {
		case 'complete':
			return {
				background: colors.success,
				color: colors.white,
			};
		case 'error':
			return {
				background: colors.error,
				color: colors.white,
			};
		case 'pending':
			return {
				background: colors.borderLighter,
				color: colors.textMuted,
			};
		default:
			return {};
	}
}

/**
 * Global Steps Progress Component
 *
 * @param {Object} props       - Component props
 * @param {Array}  props.steps - Array of step objects with id, label, status
 * @return {JSX.Element|null} Global steps progress component or null if no global steps
 */
export function GlobalStepsProgress( { steps } ) {
	// Filter to only show global steps that exist in the steps array
	const globalSteps = steps.filter( ( step ) =>
		GLOBAL_STEP_IDS.includes( step.id )
	);

	// Don't render if no global steps or all are complete
	if ( globalSteps.length === 0 ) {
		return null;
	}

	// Check if all global steps are complete
	const allComplete = globalSteps.every(
		( step ) => step.status === 'complete'
	);

	// Don't show if all global steps are done (thread steps are running)
	if ( allComplete ) {
		return null;
	}

	// Count completed steps for progress indicator
	const completedCount = globalSteps.filter(
		( step ) => step.status === 'complete'
	).length;

	return (
		<div className="aether-global-steps-progress" style={ containerStyle }>
			<div
				className="aether-global-steps-progress__header"
				style={ headerStyle }
			>
				<span>
					{ __( 'Preparing export', 'aether-site-exporter' ) }
				</span>
				<span
					style={ {
						color: colors.textMuted,
						fontWeight: fontWeight.normal,
					} }
				>
					({ completedCount }/{ globalSteps.length })
				</span>
			</div>

			<div
				className="aether-global-steps-progress__list"
				style={ stepsListStyle }
			>
				{ globalSteps.map( ( step ) => {
					const stepLabel = STEP_LABELS[ step.id ] || step.label;
					const itemStatusStyle = getStepItemStatusStyle(
						step.status
					);
					const iconStatusStyle = getStepIconStatusStyle(
						step.status
					);

					return (
						<div
							key={ step.id }
							className={ `aether-global-steps-progress__step aether-global-steps-progress__step--${ step.status }` }
							style={ { ...stepItemStyle, ...itemStatusStyle } }
						>
							{ step.status === 'active' ? (
								<span style={ spinnerWrapperStyle }>
									<Spinner
										style={ {
											width: '16px',
											height: '16px',
											margin: 0,
										} }
									/>
								</span>
							) : (
								<span
									className="aether-global-steps-progress__icon"
									style={ {
										...stepIconStyle,
										...iconStatusStyle,
									} }
								>
									{ step.status === 'complete' && '✓' }
									{ step.status === 'error' && '✗' }
									{ step.status === 'pending' && '○' }
								</span>
							) }
							<span className="aether-global-steps-progress__label">
								{ stepLabel }
							</span>
						</div>
					);
				} ) }
			</div>
		</div>
	);
}

export default GlobalStepsProgress;
