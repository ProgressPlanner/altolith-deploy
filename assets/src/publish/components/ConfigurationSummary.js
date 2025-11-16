/**
 * Configuration Summary Component
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import {
	colors,
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
	commonStyles,
	statusBadgeStyles,
	createGridStyle,
	createFlexStyle,
} from '../../utils/styles';

export default function ConfigurationSummary( {
	usageSummary,
	staticEnabled,
} ) {
	const renderStatus = ( status, label ) => {
		const badgeStyle = {
			...statusBadgeStyles.base,
			...( statusBadgeStyles[ status ] || statusBadgeStyles.info ),
		};
		return (
			<span
				className={ `aether-config-summary__badge aether-config-summary__badge--${ status }` }
				style={ badgeStyle }
			>
				{ label }
			</span>
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

	const gridStyle = {
		...createGridStyle( '20rem', '1.5rem' ),
		marginTop: spacing.lg,
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
		paddingTop: spacing.lg,
		paddingBottom: spacing.lg,
	};

	const cardStyle = {
		padding: '1.5rem',
		background: colors.white,
		border: `1px solid ${ colors.borderLighter }`,
		borderRadius: borderRadius.sm,
	};

	const cardTitleStyle = {
		margin: '0 0 1rem',
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		color: colors.text,
	};

	const configValueStyle = {
		...createFlexStyle( 'row', spacing.sm ),
		alignItems: 'center',
		marginBottom: '0.75rem',
		fontWeight: fontWeight.medium,
		color: colors.text,
	};

	const configDescriptionStyle = {
		margin: 0,
		fontSize: fontSize.base,
		color: colors.textSecondary,
		lineHeight: 1.5,
	};

	return (
		<div className="aether-config-summary" style={ sectionStyle }>
			<div
				className="aether-config-summary__header"
				style={ sectionHeaderStyle }
			>
				<h2
					className="aether-config-summary__title"
					style={ headerTitleStyle }
				>
					{ __( 'What Will Be Published', 'aether' ) }
				</h2>
				<p
					className="aether-config-summary__description"
					style={ headerDescriptionStyle }
				>
					{ __(
						'Summary of your current publish configuration.',
						'aether'
					) }
				</p>
			</div>

			<div className="aether-config-summary__grid" style={ gridStyle }>
				<div
					className="aether-config-summary__card aether-config-summary__card--blueprint"
					style={ cardStyle }
				>
					<h4
						className="aether-config-summary__card-title"
						style={ cardTitleStyle }
					>
						{ __( 'Blueprint Storage', 'aether' ) }
					</h4>
					<div
						className="aether-config-summary__card-value"
						style={ configValueStyle }
					>
						{ usageSummary?.blueprint?.label ? (
							<>
								<span className="aether-config-summary__value-label">
									{ usageSummary.blueprint.label }
								</span>
								{ usageSummary.blueprint.provider &&
									renderStatus(
										'success',
										__( 'Configured', 'aether' )
									) }
							</>
						) : (
							<>
								<span className="aether-config-summary__value-label">
									{ __( 'Not configured', 'aether' ) }
								</span>
								{ renderStatus(
									'error',
									__( 'Required', 'aether' )
								) }
							</>
						) }
					</div>
					<p
						className="aether-config-summary__card-description"
						style={ configDescriptionStyle }
					>
						{ __(
							'Your WordPress site package will be stored here for WordPress Playground access.',
							'aether'
						) }
					</p>
				</div>

				<div
					className="aether-config-summary__card aether-config-summary__card--static"
					style={ cardStyle }
				>
					<h4
						className="aether-config-summary__card-title"
						style={ cardTitleStyle }
					>
						{ __( 'Static Site Generation', 'aether' ) }
					</h4>
					<div
						className="aether-config-summary__card-value"
						style={ configValueStyle }
					>
						{ staticEnabled ? (
							<>
								<span className="aether-config-summary__value-label">
									{ __( 'Enabled', 'aether' ) }
								</span>
								{ renderStatus(
									'success',
									__( 'Active', 'aether' )
								) }
							</>
						) : (
							<>
								<span className="aether-config-summary__value-label">
									{ __( 'Disabled', 'aether' ) }
								</span>
								{ renderStatus(
									'warning',
									__( 'Optional', 'aether' )
								) }
							</>
						) }
					</div>
					{ staticEnabled && usageSummary?.staticSite?.label ? (
						<p
							className="aether-config-summary__card-description"
							style={ configDescriptionStyle }
						>
							{ __(
								'Static site will be deployed to:',
								'aether'
							) }{ ' ' }
							<strong className="aether-config-summary__deployment-url">
								{ usageSummary.staticSite.label }
							</strong>
						</p>
					) : (
						<p
							className="aether-config-summary__card-description"
							style={ configDescriptionStyle }
						>
							{ __( 'Enable in', 'aether' ) }{ ' ' }
							<a
								className="aether-config-summary__link"
								href="/wp-admin/admin.php?page=aether-static"
							>
								{ __( 'Static Site Settings', 'aether' ) }
							</a>{ ' ' }
							{ __(
								'to generate and deploy a static version of your site.',
								'aether'
							) }
						</p>
					) }
				</div>

				<div
					className="aether-config-summary__card aether-config-summary__card--media"
					style={ cardStyle }
				>
					<h4
						className="aether-config-summary__card-title"
						style={ cardTitleStyle }
					>
						{ __( 'Media Offloading', 'aether' ) }
					</h4>
					<div
						className="aether-config-summary__card-value"
						style={ configValueStyle }
					>
						{ usageSummary?.media?.provider &&
						usageSummary.media.provider !== 'none' ? (
							<>
								<span className="aether-config-summary__value-label">
									{ usageSummary.media.label }
								</span>
								{ renderStatus(
									'success',
									__( 'Active', 'aether' )
								) }
							</>
						) : (
							<>
								<span className="aether-config-summary__value-label">
									{ __( 'Not configured', 'aether' ) }
								</span>
								{ renderStatus(
									'warning',
									__( 'Optional', 'aether' )
								) }
							</>
						) }
					</div>
					<p
						className="aether-config-summary__card-description"
						style={ configDescriptionStyle }
					>
						{ usageSummary?.media?.provider &&
						usageSummary.media.provider !== 'none' ? (
							__(
								'Media files are being offloaded to Cloudflare.',
								'aether'
							)
						) : (
							<>
								{ __( 'Configure in', 'aether' ) }{ ' ' }
								<a
									className="aether-config-summary__link"
									href="/wp-admin/admin.php?page=aether-media"
								>
									{ __( 'Media Settings', 'aether' ) }
								</a>{ ' ' }
								{ __(
									'to offload images and videos to Cloudflare.',
									'aether'
								) }
							</>
						) }
					</p>
				</div>
			</div>
		</div>
	);
}
