/**
 * How It Works Component
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
	utilityStyles,
} from '../../utils/styles';

export default function HowItWorks() {
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

	const contentStyle = {
		maxWidth: '60rem',
		paddingLeft: spacing.lg,
		paddingRight: spacing.lg,
		paddingTop: spacing.lg,
		paddingBottom: spacing.lg,
	};

	const benefitItemStyle = {
		marginBottom: '2rem',
		padding: '1.5rem',
		background: colors.white,
		border: `1px solid ${ colors.borderLighter }`,
		borderRadius: borderRadius.sm,
	};

	const benefitTitleStyle = {
		margin: '0 0 1rem',
		fontSize: fontSize.xl,
		fontWeight: fontWeight.semibold,
		color: colors.text,
	};

	const benefitParagraphStyle = {
		margin: '0 0 1rem',
		color: colors.textSecondary,
		lineHeight: 1.6,
	};

	const benefitListStyle = {
		margin: '0.5rem 0 0',
		paddingLeft: '1.5rem',
		color: colors.textSecondary,
		lineHeight: 1.8,
	};

	const benefitListItemStyle = {
		marginBottom: '0.5rem',
	};

	return (
		<div className="aether-how-it-works" style={ sectionStyle }>
			<div
				className="aether-how-it-works__header"
				style={ sectionHeaderStyle }
			>
				<h2
					className="aether-how-it-works__title"
					style={ headerTitleStyle }
				>
					{ __( 'How Publishing Works', 'aether-site-exporter' ) }
				</h2>
				<p
					className="aether-how-it-works__description"
					style={ headerDescriptionStyle }
				>
					{ __(
						'Understanding the Aether publish process.',
						'aether'
					) }
				</p>
			</div>

			<div
				className="aether-how-it-works__content"
				style={ contentStyle }
			>
				<div
					className="aether-how-it-works__item"
					style={ benefitItemStyle }
				>
					<h4
						className="aether-how-it-works__item-title"
						style={ benefitTitleStyle }
					>
						{ __(
							'What Happens When You Publish?',
							'aether-site-exporter'
						) }
					</h4>
					<p
						className="aether-how-it-works__item-text"
						style={ benefitParagraphStyle }
					>
						{ __(
							'When you click "Publish Site Now", Aether performs a series of automated steps to sync your WordPress site to your configured providers. The process is designed to be fast, reliable, and error-resistant.',
							'aether'
						) }
					</p>
				</div>

				<div
					className="aether-how-it-works__item"
					style={ benefitItemStyle }
				>
					<h4
						className="aether-how-it-works__item-title"
						style={ benefitTitleStyle }
					>
						{ __( 'Publish Steps', 'aether-site-exporter' ) }
					</h4>
					<ol
						className="aether-how-it-works__steps-list"
						style={ benefitListStyle }
					>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Blueprint Generation:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Creates a WordPress Playground blueprint with your site content, theme, and plugins.',
								'aether'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __( 'Site Export:', 'aether-site-exporter' ) }
							</strong>{ ' ' }
							{ __(
								'Exports your complete WordPress site including database, uploads, and configuration.',
								'aether'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Static Site Generation:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'If enabled, converts your site to static HTML, CSS, and JavaScript files.',
								'aether'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Upload to Storage:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Uploads blueprint and static files to your configured storage provider.',
								'aether'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Atomic Deployment:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Atomically switches to the new version, ensuring zero downtime.',
								'aether'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Verification:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Verifies that all files were uploaded successfully and are accessible.',
								'aether'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __( 'Cleanup:', 'aether-site-exporter' ) }
							</strong>{ ' ' }
							{ __(
								'Removes temporary files and old versions to keep storage clean.',
								'aether'
							) }
						</li>
					</ol>
				</div>

				<div
					className="aether-how-it-works__item"
					style={ benefitItemStyle }
				>
					<h4
						className="aether-how-it-works__item-title"
						style={ benefitTitleStyle }
					>
						{ __( 'Blueprint Storage', 'aether-site-exporter' ) }
					</h4>
					<p
						className="aether-how-it-works__item-text"
						style={ benefitParagraphStyle }
					>
						{ __(
							'Your WordPress site is packaged as a Playground blueprint - a complete, portable version that can run in WordPress Playground. This blueprint is stored in your configured storage provider and can be accessed via the /wp-admin URL of your published site.',
							'aether'
						) }
					</p>
				</div>

				<div
					className="aether-how-it-works__item"
					style={ benefitItemStyle }
				>
					<h4
						className="aether-how-it-works__item-title"
						style={ benefitTitleStyle }
					>
						{ __(
							'Static Site Deployment',
							'aether-site-exporter'
						) }
					</h4>
					<p
						className="aether-how-it-works__item-text"
						style={ benefitParagraphStyle }
					>
						{ __(
							'When static site generation is enabled, Aether crawls your site, generates HTML for all pages, collects assets, and deploys everything to your configured hosting provider. Visitors see the fast, secure static version while you maintain full WordPress editing capabilities.',
							'aether'
						) }
					</p>
				</div>

				<div
					className="aether-how-it-works__item"
					style={ benefitItemStyle }
				>
					<h4
						className="aether-how-it-works__item-title"
						style={ benefitTitleStyle }
					>
						{ __( 'Publish Progress', 'aether-site-exporter' ) }
					</h4>
					<p
						className="aether-how-it-works__item-text"
						style={ benefitParagraphStyle }
					>
						{ __(
							'The publish process shows real-time progress with a task list. Each step is executed independently with automatic retry logic for network errors. You can monitor the progress or close the modal and continue working - the publish will complete in the background.',
							'aether'
						) }
					</p>
				</div>

				<div
					className="aether-how-it-works__item"
					style={ benefitItemStyle }
				>
					<h4
						className="aether-how-it-works__item-title"
						style={ benefitTitleStyle }
					>
						{ __( 'What Gets Published?', 'aether-site-exporter' ) }
					</h4>
					<ul
						className="aether-how-it-works__published-list"
						style={ benefitListStyle }
					>
						<li className="aether-how-it-works__published-item">
							{ __(
								'All published posts and pages',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__published-item">
							{ __(
								'Custom post types',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__published-item">
							{ __(
								'Categories, tags, and taxonomies',
								'aether'
							) }
						</li>
						<li className="aether-how-it-works__published-item">
							{ __(
								'Theme files and customizations',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__published-item">
							{ __( 'Active plugins', 'aether-site-exporter' ) }
						</li>
						<li className="aether-how-it-works__published-item">
							{ __(
								'Media files (images, videos)',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__published-item">
							{ __(
								'WordPress settings and options',
								'aether-site-exporter'
							) }
						</li>
						<li
							className="aether-how-it-works__published-item"
							style={ benefitListItemStyle }
						>
							{ __( 'Database content', 'aether-site-exporter' ) }
						</li>
					</ul>
				</div>

				<div
					className="aether-how-it-works__item aether-how-it-works__item--last"
					style={ {
						...benefitItemStyle,
						...utilityStyles.noMarginBottom,
					} }
				>
					<h4
						className="aether-how-it-works__item-title"
						style={ benefitTitleStyle }
					>
						{ __( 'Troubleshooting', 'aether-site-exporter' ) }
					</h4>
					<p
						className="aether-how-it-works__item-text"
						style={ benefitParagraphStyle }
					>
						{ __(
							'If a publish fails, check the error message in the recent jobs list above. Common issues include missing provider configuration, network errors, or insufficient storage. You can retry the publish after fixing the issue.',
							'aether'
						) }
					</p>
					<p
						className="aether-how-it-works__item-text aether-how-it-works__item-text--last"
						style={ {
							...benefitParagraphStyle,
							...utilityStyles.noMarginBottom,
						} }
					>
						{ __(
							'For detailed debugging information, visit the',
							'aether'
						) }{ ' ' }
						<a
							className="aether-how-it-works__link"
							href="/wp-admin/admin.php?page=aether-logs"
						>
							{ __( 'Logs', 'aether-site-exporter' ) }
						</a>{ ' ' }
						{ __( 'page.', 'aether-site-exporter' ) }
					</p>
				</div>
			</div>
		</div>
	);
}
