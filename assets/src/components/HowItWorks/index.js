/**
 * How It Works Component
 *
 */

import { __ } from '@wordpress/i18n';
import { colors, spacing, commonStyles } from '@aether/utils/styles';
import SectionHeader from '../SectionHeader';
import InfoCard, { InfoParagraph } from '../InfoCard';

// Styles - extracted to module level for performance
const sectionStyle = {
	...commonStyles.section,
};

const contentStyle = {
	// maxWidth: '60rem',
	paddingLeft: spacing.lg,
	paddingRight: spacing.lg,
	paddingTop: spacing.lg,
	paddingBottom: spacing.lg,
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

export default function HowItWorks() {
	return (
		<div className="aether-how-it-works" style={ sectionStyle }>
			<SectionHeader
				title={ __( 'How Exporting Works', 'aether-site-exporter' ) }
				description={ __(
					'Understanding the Aether export process.',
					'aether-site-exporter'
				) }
				className="aether-how-it-works__header"
			/>

			<div
				className="aether-how-it-works__content"
				style={ contentStyle }
			>
				<InfoCard
					title={ __(
						'What Happens When You Publish?',
						'aether-site-exporter'
					) }
					className="aether-how-it-works__item"
				>
					<InfoParagraph isLast>
						{ __(
							'When you click "Export Site", Aether performs a series of automated steps to sync your WordPress site to your configured providers. The process is designed to be fast, reliable, and error-resistant.',
							'aether-site-exporter'
						) }
					</InfoParagraph>
				</InfoCard>

				<InfoCard
					title={ __( 'Publish Steps', 'aether-site-exporter' ) }
					className="aether-how-it-works__item"
				>
					<ol
						className="aether-how-it-works__steps-list"
						style={ benefitListStyle }
					>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Discover Assets:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Finds custom plugins, themes, and uploads to include in blueprint bundle.',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Discover URLs:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Finds all URLs for static site generation.',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Pre-Scan Static Site:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Fetches HTML pages and extracts assets (CSS, JS, images) to add to URL list.',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Create Bundle:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Packages custom plugins, themes, and uploads into wp-content.zip archive.',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Generate Blueprint:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Creates blueprint-bundle.zip with blueprint.json containing your site data.',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Upload Blueprint Bundle:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Uploads blueprint bundle to configured providers (only if blueprint deployment is enabled).',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__step">
							<strong className="aether-how-it-works__step-label">
								{ __(
									'Upload Static Files:',
									'aether-site-exporter'
								) }
							</strong>{ ' ' }
							{ __(
								'Generates and uploads static HTML/CSS/JS files (only if static site deployment is enabled).',
								'aether-site-exporter'
							) }
						</li>
					</ol>
				</InfoCard>

				<InfoCard
					title={ __( 'Blueprint Storage', 'aether-site-exporter' ) }
					className="aether-how-it-works__item"
				>
					<InfoParagraph isLast>
						{ __(
							'Your WordPress site is packaged as a WordPress Playground blueprint - a complete, portable version that can run in any WordPress Playground environment. This blueprint contains your site data as JSON (not a database), along with your custom plugins, themes, and uploads. The blueprint is stored in your configured storage provider and can be loaded into WordPress Playground to recreate your site.',
							'aether-site-exporter'
						) }
					</InfoParagraph>
				</InfoCard>

				<InfoCard
					title={ __(
						'Static Site Deployment',
						'aether-site-exporter'
					) }
					className="aether-how-it-works__item"
				>
					<InfoParagraph isLast>
						{ __(
							'When static site generation is enabled, Aether discovers all URLs, pre-scans pages to extract assets (CSS, JS, images), generates HTML for all pages, rewrites URLs, and uploads everything to your configured hosting provider. Visitors see the fast, secure static version while you maintain full WordPress editing capabilities.',
							'aether-site-exporter'
						) }
					</InfoParagraph>
				</InfoCard>

				<InfoCard
					title={ __( 'Publish Progress', 'aether-site-exporter' ) }
					className="aether-how-it-works__item"
				>
					<InfoParagraph isLast>
						{ __(
							'The export process shows real-time progress with a task list. Each step is executed independently with automatic retry logic for network errors. You can monitor the progress or close the modal and continue working - the export will complete in the background.',
							'aether-site-exporter'
						) }
					</InfoParagraph>
				</InfoCard>

				<InfoCard
					title={ __(
						'What Gets Published?',
						'aether-site-exporter'
					) }
					className="aether-how-it-works__item"
				>
					<ul
						className="aether-how-it-works__exported-list"
						style={ benefitListStyle }
					>
						<li className="aether-how-it-works__exported-item">
							{ __(
								'All published posts and pages',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__exported-item">
							{ __(
								'Custom post types',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__exported-item">
							{ __(
								'Categories, tags, and taxonomies',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__exported-item">
							{ __(
								'Theme files and customizations',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__exported-item">
							{ __( 'Active plugins', 'aether-site-exporter' ) }
						</li>
						<li className="aether-how-it-works__exported-item">
							{ __(
								'Media files (images, videos)',
								'aether-site-exporter'
							) }
						</li>
						<li className="aether-how-it-works__exported-item">
							{ __(
								'WordPress settings and options',
								'aether-site-exporter'
							) }
						</li>
						<li
							className="aether-how-it-works__exported-item"
							style={ benefitListItemStyle }
						>
							{ __(
								'Site data (as JSON in blueprint)',
								'aether-site-exporter'
							) }
						</li>
					</ul>
				</InfoCard>

				<InfoCard
					title={ __( 'Troubleshooting', 'aether-site-exporter' ) }
					className="aether-how-it-works__item aether-how-it-works__item--last"
					isLast
				>
					<InfoParagraph isLast>
						{ __(
							'If an export fails, check the error message in the export progress modal. Common issues include missing provider configuration, network errors, or insufficient storage. You can retry the export after fixing the issue. Each step executes independently with automatic retry logic for network errors.',
							'aether-site-exporter'
						) }
					</InfoParagraph>
				</InfoCard>
			</div>
		</div>
	);
}
