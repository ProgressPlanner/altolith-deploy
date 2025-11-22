/**
 * Configuration Summary Component
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import SectionHeader from '../SectionHeader';
import StatusBadge from '../StatusBadge';
import {
	colors,
	spacing,
	borderRadius,
	fontSize,
	fontWeight,
	commonStyles,
	createGridStyle,
	createFlexStyle,
} from '@aether/utils/styles';

// Styles - extracted to module level for performance
const sectionStyle = {
	...commonStyles.section,
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

export default function ConfigurationSummary( {
	usageSummary,
	staticEnabled,
} ) {
	return (
		<div className="aether-config-summary" style={ sectionStyle }>
			<SectionHeader
				title={ __( 'What Will Be Published', 'aether-site-exporter' ) }
				description={ __(
					'Summary of your current export configuration.',
					'aether'
				) }
				className="aether-config-summary__header"
			/>

			<div className="aether-config-summary__grid" style={ gridStyle }>
				<div
					className="aether-config-summary__card aether-config-summary__card--blueprint"
					style={ cardStyle }
				>
					<h4
						className="aether-config-summary__card-title"
						style={ cardTitleStyle }
					>
						{ __( 'Blueprint Storage', 'aether-site-exporter' ) }
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
								{ usageSummary.blueprint.provider && (
									<StatusBadge
										type="success"
										label={ __(
											'Configured',
											'aether-site-exporter'
										) }
										className="aether-config-summary__badge"
									/>
								) }
							</>
						) : (
							<>
								<span className="aether-config-summary__value-label">
									{ __(
										'Not configured',
										'aether-site-exporter'
									) }
								</span>
								<StatusBadge
									type="error"
									label={ __(
										'Required',
										'aether-site-exporter'
									) }
									className="aether-config-summary__badge"
								/>
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
						{ __(
							'Static Site Generation',
							'aether-site-exporter'
						) }
					</h4>
					<div
						className="aether-config-summary__card-value"
						style={ configValueStyle }
					>
						{ staticEnabled ? (
							<>
								<span className="aether-config-summary__value-label">
									{ __( 'Enabled', 'aether-site-exporter' ) }
								</span>
								<StatusBadge
									type="success"
									label={ __(
										'Active',
										'aether-site-exporter'
									) }
									className="aether-config-summary__badge"
								/>
							</>
						) : (
							<>
								<span className="aether-config-summary__value-label">
									{ __( 'Disabled', 'aether-site-exporter' ) }
								</span>
								<StatusBadge
									type="warning"
									label={ __(
										'Optional',
										'aether-site-exporter'
									) }
									className="aether-config-summary__badge"
								/>
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
							{ __( 'Enable in', 'aether-site-exporter' ) }{ ' ' }
							<a
								className="aether-config-summary__link"
								href="/wp-admin/admin.php?page=aether-static"
							>
								{ __(
									'Static Site Settings',
									'aether-site-exporter'
								) }
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
						{ __( 'Media Offloading', 'aether-site-exporter' ) }
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
								<StatusBadge
									type="success"
									label={ __(
										'Active',
										'aether-site-exporter'
									) }
									className="aether-config-summary__badge"
								/>
							</>
						) : (
							<>
								<span className="aether-config-summary__value-label">
									{ __(
										'Not configured',
										'aether-site-exporter'
									) }
								</span>
								<StatusBadge
									type="warning"
									label={ __(
										'Optional',
										'aether-site-exporter'
									) }
									className="aether-config-summary__badge"
								/>
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
								'Media files are being offloaded to external storage.',
								'aether'
							)
						) : (
							<>
								{ __( 'Configure in', 'aether-site-exporter' ) }{ ' ' }
								<a
									className="aether-config-summary__link"
									href="/wp-admin/admin.php?page=aether-media"
								>
									{ __(
										'Media Settings',
										'aether-site-exporter'
									) }
								</a>{ ' ' }
								{ __(
									'to offload images and videos to external storage.',
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
