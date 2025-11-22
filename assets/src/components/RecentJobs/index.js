/**
 * Recent Jobs Component
 *
 */

import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';
import {
	colors,
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
	commonStyles,
	noticeStyles,
	createFlexStyle,
	utilityStyles,
} from '@aether/utils/styles';
import {
	formatJobTime,
	getStatusDisplay,
} from '@aether/export/utils/jobFormatters';
import StatusBadge from '../StatusBadge';
import SectionHeader from '../SectionHeader';

// Styles - extracted to module level for performance
const sectionStyle = {
	...commonStyles.section,
};

const noticeInfoStyle = {
	...noticeStyles.info,
	padding: spacing.md,
	marginLeft: spacing.lg,
	marginRight: spacing.lg,
	marginTop: spacing.lg,
	marginBottom: spacing.lg,
};

const noticeParagraphStyle = {
	margin: 0,
	display: 'flex',
	alignItems: 'center',
	gap: spacing.sm,
};

const jobsListStyle = {
	...createFlexStyle( 'column', spacing.lg ),
	paddingLeft: spacing.lg,
	paddingRight: spacing.lg,
	paddingTop: spacing.lg,
	paddingBottom: spacing.lg,
};

const jobCardStyle = {
	padding: '1.5rem',
	background: colors.white,
	border: `1px solid ${ colors.borderLighter }`,
	borderRadius: borderRadius.sm,
};

const jobHeaderStyle = {
	...createFlexStyle( 'row', spacing.md ),
	justifyContent: 'space-between',
	alignItems: 'center',
	marginBottom: spacing.lg,
	paddingBottom: spacing.lg,
	borderBottom: `1px solid ${ colors.backgroundLighter }`,
};

const jobIdStyle = {
	...createFlexStyle( 'row', spacing.sm ),
	alignItems: 'center',
};

const codeStyle = {
	padding: '0.25rem 0.5rem',
	background: colors.backgroundLighter,
	borderRadius: borderRadius.sm,
	fontSize: fontSize.base,
	fontFamily: 'monospace',
};

const jobDetailsStyle = {
	...createFlexStyle( 'column', '0.75rem' ),
};

const jobTimeStyle = {
	...createFlexStyle( 'row', spacing.sm ),
	alignItems: 'center',
	color: colors.textSecondary,
	fontSize: fontSize.base,
};

const jobProgressStyle = {
	...createFlexStyle( 'column', spacing.sm ),
};

const jobProgressBarStyle = {
	height: '1.25rem',
	background: colors.backgroundLighter,
	borderRadius: borderRadius.sm,
	overflow: 'hidden',
};

const jobProgressFillStyle = {
	height: '100%',
	background: `linear-gradient(90deg, ${ colors.primary }, ${ colors.primaryHover })`,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	paddingRight: spacing.sm,
	color: colors.white,
	fontSize: fontSize.base,
	fontWeight: fontWeight.semibold,
	transition: 'width 0.3s ease',
};

const jobStepStyle = {
	fontSize: fontSize.base,
	color: colors.textSecondary,
};

const jobErrorStyle = {
	...createFlexStyle( 'row', spacing.sm ),
	alignItems: 'flex-start',
	padding: '0.75rem',
	background: colors.backgroundError,
	borderLeft: '3px solid ' + colors.error,
	borderRadius: borderRadius.sm,
	color: colors.textSecondary,
	fontSize: fontSize.base,
};

export default function RecentJobs( { jobs = [], loading = false } ) {
	return (
		<div className="aether-recent-jobs" style={ sectionStyle }>
			<SectionHeader
				title={ __( 'Recent Export Jobs', 'aether-site-exporter' ) }
				description={ __(
					'History of your recent export operations.',
					'aether'
				) }
				className="aether-recent-jobs__header"
			/>

			{ loading && (
				<div
					className="aether-recent-jobs__notice aether-recent-jobs__notice--loading"
					style={ noticeInfoStyle }
				>
					<p
						className="aether-recent-jobs__notice-text"
						style={ noticeParagraphStyle }
					>
						<Spinner className="aether-recent-jobs__spinner" />
						{ __( 'Loading recent jobs…', 'aether-site-exporter' ) }
					</p>
				</div>
			) }

			{ ! loading && jobs.length === 0 && (
				<div
					className="aether-recent-jobs__notice aether-recent-jobs__notice--empty"
					style={ noticeInfoStyle }
				>
					<p
						className="aether-recent-jobs__empty-text"
						style={ utilityStyles.noMargin }
					>
						{ __(
							'No export jobs yet. Click the "Export Site Now" button above to get started.',
							'aether'
						) }
					</p>
				</div>
			) }

			{ ! loading && jobs.length > 0 && (
				<div
					className="aether-recent-jobs__list"
					style={ jobsListStyle }
				>
					{ jobs.map( ( job ) => {
						const jobId = job.jobId || '';
						const jobStatus = job.status || 'unknown';
						const timestamp = job.timestamp || 0;
						const progress = job.progress || 0;
						const step = job.currentStep || '';
						const errorMsg = job.error || '';

						const statusDisplay = getStatusDisplay( jobStatus );

						return (
							<div
								key={ jobId }
								className={ `aether-recent-jobs__job aether-recent-jobs__job--${ jobStatus }` }
								style={ jobCardStyle }
							>
								<div
									className="aether-recent-jobs__job-header"
									style={ jobHeaderStyle }
								>
									<div
										className="aether-recent-jobs__job-id"
										style={ jobIdStyle }
									>
										<strong className="aether-recent-jobs__job-id-label">
											{ __(
												'Job ID:',
												'aether-site-exporter'
											) }
										</strong>
										<code
											className="aether-recent-jobs__job-id-value"
											style={ codeStyle }
										>
											{ jobId }
										</code>
									</div>
									<div className="aether-recent-jobs__job-status">
										<StatusBadge
											type={ statusDisplay.class }
											label={ statusDisplay.label }
											className="aether-recent-jobs__badge"
										/>
									</div>
								</div>

								<div
									className="aether-recent-jobs__job-details"
									style={ jobDetailsStyle }
								>
									<div
										className="aether-recent-jobs__job-time"
										style={ jobTimeStyle }
									>
										<span className="dashicons dashicons-clock aether-recent-jobs__time-icon" />
										{ formatJobTime( timestamp ) }
									</div>

									{ jobStatus === 'running' &&
										progress > 0 && (
											<div
												className="aether-recent-jobs__job-progress"
												style={ jobProgressStyle }
											>
												<div
													className="aether-recent-jobs__progress-bar"
													style={
														jobProgressBarStyle
													}
												>
													<div
														className="aether-recent-jobs__progress-fill"
														style={ {
															...jobProgressFillStyle,
															width: `${ progress }%`,
														} }
													>
														{ progress }%
													</div>
												</div>
												{ step && (
													<div
														className="aether-recent-jobs__job-step"
														style={ jobStepStyle }
													>
														{ __(
															'Current step:',
															'aether'
														) }{ ' ' }
														<code
															className="aether-recent-jobs__step-code"
															style={ codeStyle }
														>
															{ step }
														</code>
													</div>
												) }
											</div>
										) }

									{ jobStatus === 'failed' && errorMsg && (
										<div
											className="aether-recent-jobs__job-error"
											style={ jobErrorStyle }
										>
											<span className="dashicons dashicons-warning aether-recent-jobs__error-icon" />
											<span className="aether-recent-jobs__error-message">
												{ errorMsg }
											</span>
										</div>
									) }
								</div>
							</div>
						);
					} ) }
				</div>
			) }
		</div>
	);
}
