/**
 * Upload Statistics Component
 *
 * Displays upload statistics including provider count, files uploaded, and total size.
 * Calculates stats from message history and remains visible throughout export workflow.
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
} from '@aether/utils/styles';
import { formatFileSize } from '@aether/utils/helpers';
import UploadStatistic from '../UploadStatistic';

/**
 * Upload Statistics Component
 *
 * @param {Object} props                          Component props
 * @param {Array}  props.messageHistory           Array of status messages
 * @param {Array}  props.staticSiteProviders      Array of provider IDs for static site deployment
 * @param {Array}  props.blueprintBundleProviders Array of provider IDs for blueprint bundle deployment
 * @return {JSX.Element|null} Upload statistics section or null if no stats available
 */
export default function UploadStatistics( {
	messageHistory,
	staticSiteProviders = [],
	blueprintBundleProviders = [],
} ) {
	// Calculate upload statistics from message history
	const uploadStats = useMemo( () => {
		// Get provider count from actual provider arrays (more accurate than parsing messages)
		// Use the largest count between static and blueprint providers
		const providerCount = Math.max(
			staticSiteProviders.length,
			blueprintBundleProviders.length,
			1
		);

		// Count static site files uploaded across all providers
		// Parse provider summary messages like "Completed Production: 100 files uploaded"
		// to get actual total (e.g., 100 files × 3 providers = 300 total uploads)
		const providerSummaryMessages = messageHistory.filter(
			( msg ) =>
				msg.key?.startsWith( 'upload-provider-' ) &&
				msg.key?.endsWith( '-summary' )
		);

		// Count static site files
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
		const blueprintFileCount = blueprintBundleProviders.length;

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
		const blueprintMessages = messageHistory.filter(
			( msg ) =>
				msg.key === 'uploadSiteArchive' &&
				msg.type === 'success' &&
				msg.metadata?.isBlueprint
		);
		const blueprintSize = blueprintMessages[ 0 ]?.metadata?.bundleSize || 0;

		// Total size = static files + blueprint
		const totalSize = staticFilesSize + blueprintSize;

		return {
			providerCount,
			fileCount,
			totalSize: formatFileSize( totalSize ),
		};
	}, [ messageHistory, staticSiteProviders, blueprintBundleProviders ] );

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

	const detailValueStyle = {
		fontSize: fontSize.lg,
		color: colors.text,
		fontWeight: fontWeight.semibold,
	};

	return (
		<div
			className="aether-export-progress-modal__details"
			style={ detailsSectionStyle }
		>
			<UploadStatistic
				label={ __( 'Providers', 'aether-site-exporter' ) }
			>
				<span style={ detailValueStyle }>
					{ uploadStats.providerCount }
				</span>
			</UploadStatistic>
			<UploadStatistic
				label={ __( 'Files Uploaded', 'aether-site-exporter' ) }
			>
				<span style={ detailValueStyle }>
					{ uploadStats.fileCount }
				</span>
			</UploadStatistic>
			<UploadStatistic
				label={ __( 'Total Size', 'aether-site-exporter' ) }
			>
				<span style={ detailValueStyle }>
					{ uploadStats.totalSize }
				</span>
			</UploadStatistic>
		</div>
	);
}
