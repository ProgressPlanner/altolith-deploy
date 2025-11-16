/**
 * Publish Button Component
 *
 * @package
 */

import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useConfig } from '../../hooks/useConfig';
import {
	colors,
	spacing,
	fontSize,
	commonStyles,
	noticeStyles,
	utilityStyles,
} from '../../utils/styles';

export default function PublishButton( {
	readiness,
	onPublishClick,
	isPublishing,
} ) {
	const config = useConfig();
	const isReady = readiness?.ready ?? false;
	const issues = readiness?.issues ?? [];

	const adminUrl = config.loading
		? '/wp-admin/admin.php?page=aether'
		: config.adminUrl || '/wp-admin/admin.php?page=aether';

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

	const noticeErrorStyle = {
		...noticeStyles.error,
		padding: spacing.md,
		marginLeft: spacing.lg,
		marginRight: spacing.lg,
		marginTop: spacing.lg,
		marginBottom: spacing.lg,
	};

	const noticeSuccessStyle = {
		...noticeStyles.success,
		padding: spacing.md,
		marginLeft: spacing.lg,
		marginRight: spacing.lg,
		marginTop: spacing.lg,
		marginBottom: spacing.lg,
	};

	const noticeParagraphStyle = {
		margin: '0 0 0.5rem',
	};

	const noticeListStyle = {
		margin: '0.5rem 0',
		paddingLeft: '1.5rem',
	};

	const containerStyle = {
		padding: spacing.lg,
		display: 'flex',
		justifyContent: 'center',
	};

	return (
		<div className="aether-publish-button" style={ sectionStyle }>
			<div
				className="aether-publish-button__header"
				style={ sectionHeaderStyle }
			>
				<h2
					className="aether-publish-button__title"
					style={ headerTitleStyle }
				>
					{ __( 'Publish Your Site', 'aether-site-exporter' ) }
				</h2>
				<p
					className="aether-publish-button__description"
					style={ headerDescriptionStyle }
				>
					{ __(
						'Deploy your WordPress site to your configured providers.',
						'aether'
					) }
				</p>
			</div>

			{ ! isReady && (
				<div
					className="aether-publish-button__notice aether-publish-button__notice--error"
					style={ noticeErrorStyle }
				>
					<p
						className="aether-publish-button__notice-text"
						style={ noticeParagraphStyle }
					>
						<strong>
							{ __(
								'Cannot publish - please fix the following issues:',
								'aether'
							) }
						</strong>
					</p>
					<ul
						className="aether-publish-button__issues-list"
						style={ noticeListStyle }
					>
						{ issues.map( ( issue, index ) => (
							<li
								key={ index }
								className="aether-publish-button__issue"
							>
								{ issue }
							</li>
						) ) }
					</ul>
					<p
						className="aether-publish-button__notice-link"
						style={ utilityStyles.noMargin }
					>
						{ __( 'Visit the', 'aether-site-exporter' ) }{ ' ' }
						<a
							className="aether-publish-button__link"
							href={ adminUrl }
						>
							{ __( 'Dashboard', 'aether-site-exporter' ) }
						</a>{ ' ' }
						{ __( 'to configure your providers.', 'aether-site-exporter' ) }
					</p>
				</div>
			) }

			{ isReady && (
				<div
					className="aether-publish-button__notice aether-publish-button__notice--success"
					style={ noticeSuccessStyle }
				>
					<p
						className="aether-publish-button__notice-text"
						style={ utilityStyles.noMargin }
					>
						{ __( 'Your site is ready to publish!', 'aether-site-exporter' ) }
					</p>
				</div>
			) }

			<div
				className="aether-publish-button__actions"
				style={ containerStyle }
			>
				<Button
					id="aether-PublishButton"
					className="aether-publish-button__button"
					variant="primary"
					isLarge
					onClick={ onPublishClick }
					disabled={ ! isReady || isPublishing }
					isBusy={ isPublishing }
				>
					<span className="dashicons dashicons-upload aether-publish-button__icon" />
					{ isPublishing
						? __( 'Publishing…', 'aether-site-exporter' )
						: __( 'Publish Site Now', 'aether-site-exporter' ) }
				</Button>
			</div>
		</div>
	);
}
