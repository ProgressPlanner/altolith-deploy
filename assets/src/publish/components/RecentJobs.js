/**
 * Recent Jobs Component
 *
 * @package
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
	statusBadgeStyles,
	noticeStyles,
	createFlexStyle,
	utilityStyles,
} from '../../utils/styles';

export default function RecentJobs( { jobs = [], loading = false } ) {
	const formatJobTime = ( timestamp ) => {
		if ( ! timestamp ) {
			return __( 'Unknown', 'aether' );
		}

		const now = Math.floor( Date.now() / 1000 ); // Current time in seconds
		const diff = now - timestamp;
		const minutes = Math.floor( diff / 60 );
		const hours = Math.floor( diff / 3600 );
		const days = Math.floor( diff / 86400 );

		if ( days > 0 ) {
			return `${ days } ${
				days === 1 ? __( 'day', 'aether' ) : __( 'days', 'aether' )
			} ${ __( 'ago', 'aether' ) }`;
		}
		if ( hours > 0 ) {
			return `${ hours } ${
				hours === 1 ? __( 'hour', 'aether' ) : __( 'hours', 'aether' )
			} ${ __( 'ago', 'aether' ) }`;
		}
		if ( minutes > 0 ) {
			return `${ minutes } ${
				minutes === 1
					? __( 'minute', 'aether' )
					: __( 'minutes', 'aether' )
			} ${ __( 'ago', 'aether' ) }`;
		}
		return __( 'Just now', 'aether' );
	};

	const getStatusDisplay = ( status ) => {
		const displays = {
			complete: {
				label: __( 'Completed', 'aether' ),
				class: 'success',
			},
			failed: {
				label: __( 'Failed', 'aether' ),
				class: 'error',
			},
			running: {
				label: __( 'Running', 'aether' ),
				class: 'info',
			},
		};

		return (
			displays[ status ] || {
				label: status.charAt( 0 ).toUpperCase() + status.slice( 1 ),
				class: 'warning',
			}
		);
	};

	const sectionStyle = {
		...commonStyles.section,
	};

	const sectionHeaderStyle = {
		...commonStyles.sectionHeader,
	};

	const headerTitleStyle = {
		margin: 0,
		fontSize: '1.3em',
		lineHeight: 1.4,
		color: colors.text,
	};

	const headerDescriptionStyle = {
		margin: '0.5rem 0 0',
		color: colors.textMuted,
		fontSize: fontSize.base,
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

	const badgeStyle = ( type ) => ( {
		...statusBadgeStyles.base,
		...( statusBadgeStyles[ type ] || statusBadgeStyles.info ),
	} );

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

	return (
		<div className="aether-recent-jobs" style={ sectionStyle }>
			<div
				className="aether-recent-jobs__header"
				style={ sectionHeaderStyle }
			>
				<h2
					className="aether-recent-jobs__title"
					style={ headerTitleStyle }
				>
					{ __( 'Recent Publish Jobs', 'aether' ) }
				</h2>
				<p
					className="aether-recent-jobs__description"
					style={ headerDescriptionStyle }
				>
					{ __(
						'History of your recent publish operations.',
						'aether'
					) }
				</p>
			</div>

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
						{ __( 'Loading recent jobs…', 'aether' ) }
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
							'No publish jobs yet. Click the "Publish Site Now" button above to get started.',
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
											{ __( 'Job ID:', 'aether' ) }
										</strong>
										<code
											className="aether-recent-jobs__job-id-value"
											style={ codeStyle }
										>
											{ jobId }
										</code>
									</div>
									<div className="aether-recent-jobs__job-status">
										<span
											className={ `aether-recent-jobs__badge aether-recent-jobs__badge--${ statusDisplay.class }` }
											style={ badgeStyle(
												statusDisplay.class
											) }
										>
											{ statusDisplay.label }
										</span>
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
