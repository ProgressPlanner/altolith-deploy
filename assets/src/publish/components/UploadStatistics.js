/**
 * Upload Statistics Component
 *
 * Displays upload statistics including provider count, files uploaded, and total size.
 * Calculates stats from message history and remains visible throughout publish workflow.
 *
 * @package
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
} from '../../utils/styles';
import { formatFileSize } from '../../utils/helpers';

/**
 * Upload Statistics Component
 *
 * @param {Object} props                Component props
 * @param {Array}  props.messageHistory Array of status messages
 * @return {JSX.Element|null} Upload statistics section or null if no stats available
 */
export default function UploadStatistics( { messageHistory } ) {
	// Calculate upload statistics from message history
	const uploadStats = useMemo( () => {
		// Count unique providers from summary messages (static site)
		const providerSummaryMessages = messageHistory.filter( ( msg ) =>
			msg.key?.startsWith( 'upload-provider-' )
		);

		// Check for blueprint bundle uploads
		const blueprintMessages = messageHistory.filter(
			( msg ) =>
				msg.key === 'uploadSiteArchive' &&
				msg.type === 'success' &&
				msg.metadata?.isBlueprint
		);
		const hasBlueprintUpload = blueprintMessages.length > 0;
		const blueprintProviderCount =
			blueprintMessages[ 0 ]?.metadata?.providerCount || 0;

		// Determine provider count
		let providerCount = Math.max( 1, providerSummaryMessages.length || 1 );
		// If only blueprint upload (no static site), use blueprint provider count
		if ( hasBlueprintUpload && providerSummaryMessages.length === 0 ) {
			providerCount = blueprintProviderCount;
		}

		// Count static site files uploaded across all providers
		// Parse provider summary messages like "Completed Production: 100 files uploaded"
		// to get actual total (e.g., 100 files × 3 providers = 300 total uploads)
		let staticFileCount = 0;
		if ( providerSummaryMessages.length > 0 ) {
			// Multi-provider: sum file counts from each provider summary
			providerSummaryMessages.forEach( ( msg ) => {
				const match = msg.message?.match(
					/(\d+)\s+files?\s+uploaded/i
				);
				if ( match ) {
					staticFileCount += parseInt( match[ 1 ], 10 );
				}
			} );
		} else {
			// Single provider or no summaries yet: count unique file messages
			const uploadedFileMessages = messageHistory.filter(
				( msg ) =>
					msg.type === 'success' &&
					msg.metadata?.fileSize &&
					msg.key?.startsWith( 'upload-' )
			);
			staticFileCount = uploadedFileMessages.length;
		}

		// Count blueprint bundle uploads (1 file per provider)
		const blueprintFileCount = hasBlueprintUpload
			? blueprintProviderCount
			: 0;

		// Total files = static files + blueprint bundles
		const fileCount = staticFileCount + blueprintFileCount;

		// Calculate total size from metadata
		// Static site files size
		const uploadedFileMessages = messageHistory.filter(
			( msg ) =>
				msg.type === 'success' &&
				msg.metadata?.fileSize &&
				msg.key?.startsWith( 'upload-' )
		);
		const staticFilesSize = uploadedFileMessages.reduce( ( sum, msg ) => {
			return sum + ( msg.metadata?.fileSize || 0 );
		}, 0 );

		// Blueprint bundle size (only count once, not per provider)
		const blueprintSize = hasBlueprintUpload
			? blueprintMessages[ 0 ]?.metadata?.bundleSize || 0
			: 0;

		// Total size = static files + blueprint
		const totalSize = staticFilesSize + blueprintSize;

		return {
			providerCount,
			fileCount,
			totalSize: formatFileSize( totalSize ),
		};
	}, [ messageHistory ] );

	// Don't render if no uploads at all
	if ( uploadStats.fileCount === 0 ) {
		return null;
	}

	// Styles
	const detailsSectionStyle = {
		marginTop: spacing.lg,
		padding: spacing.md,
		backgroundColor: colors.backgroundLight,
		borderRadius: borderRadius.sm,
		border: `1px solid ${ colors.borderLighter }`,
		...createFlexStyle( 'row', spacing.xl ),
		justifyContent: 'space-around',
		flexWrap: 'wrap',
	};

	const detailItemStyle = {
		...createFlexStyle( 'column', spacing.xs ),
		alignItems: 'center',
		minWidth: '120px',
	};

	const detailLabelStyle = {
		fontSize: fontSize.xs,
		color: colors.textMuted,
		fontWeight: fontWeight.medium,
		textTransform: 'uppercase',
		letterSpacing: '0.5px',
	};

	const detailValueStyle = {
		fontSize: fontSize.lg,
		color: colors.text,
		fontWeight: fontWeight.semibold,
	};

	return (
		<div
			className="aether-publish-progress-modal__details"
			style={ detailsSectionStyle }
		>
			<div
				className="aether-publish-progress-modal__detail-item"
				style={ detailItemStyle }
			>
				<span
					className="aether-publish-progress-modal__detail-label"
					style={ detailLabelStyle }
				>
					{ __( 'Providers', 'aether-site-exporter' ) }
				</span>
				<span
					className="aether-publish-progress-modal__detail-value"
					style={ detailValueStyle }
				>
					{ uploadStats.providerCount }
				</span>
			</div>
			<div
				className="aether-publish-progress-modal__detail-item"
				style={ detailItemStyle }
			>
				<span
					className="aether-publish-progress-modal__detail-label"
					style={ detailLabelStyle }
				>
					{ __( 'Files Uploaded', 'aether-site-exporter' ) }
				</span>
				<span
					className="aether-publish-progress-modal__detail-value"
					style={ detailValueStyle }
				>
					{ uploadStats.fileCount }
				</span>
			</div>
			<div
				className="aether-publish-progress-modal__detail-item"
				style={ detailItemStyle }
			>
				<span
					className="aether-publish-progress-modal__detail-label"
					style={ detailLabelStyle }
				>
					{ __( 'Total Size', 'aether-site-exporter' ) }
				</span>
				<span
					className="aether-publish-progress-modal__detail-value"
					style={ detailValueStyle }
				>
					{ uploadStats.totalSize }
				</span>
			</div>
		</div>
	);
}
