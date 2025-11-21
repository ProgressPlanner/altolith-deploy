/**
 * Upload Blueprint Bundle Step
 *
 * Uploads blueprint-bundle.zip to configured provider(s).
 *
 * @package
 */

import { __, sprintf, _n } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';
import { formatFileSize } from '../../../utils/helpers';
import { calculateOverallProgress } from '../../utils/progressManager';

/**
 * Upload blueprint bundle step handler.
 *
 * @param {Object}   context                          Execution context.
 * @param {Function} context.handleSiteArchiveUpload  Archive upload function.
 * @param {Array}    context.blueprintBundleProviders Providers for blueprint bundle.
 * @param {Object}   context.blueprintBundle          Bundle data from generateBlueprint.
 * @param {Function} context.setStatusMessage         Status message updater.
 * @param {Function} context.setStepProgress          Step progress updater.
 * @param {Function} context.setOverallProgressValue  Overall progress updater.
 * @return {Promise<Object>} Step result.
 */
async function handler( context ) {
	const {
		handleSiteArchiveUpload,
		blueprintBundleProviders = [],
		blueprintBundle,
		setStatusMessage,
		setStepProgress,
		setOverallProgressValue,
	} = context;

	const providers = blueprintBundleProviders;

	if ( providers.length === 0 ) {
		setStatusMessage(
			__(
				'No providers enabled for blueprint bundle',
				'aether-site-exporter'
			),
			'warning',
			'uploadBlueprintBundle'
		);
		return { skipped: true, reason: 'no_providers' };
	}

	const bundleSize = blueprintBundle?.bundleSize || 0;
	const bundleSizeFormatted = formatFileSize( bundleSize );

	setStatusMessage(
		sprintf(
			/* translators: %1$s: File size, %2$d: Number of providers */
			_n(
				'Uploading blueprint bundle (%1$s) to %2$d provider…',
				'Uploading blueprint bundle (%1$s) to %2$d providers…',
				providers.length,
				'aether-site-exporter'
			),
			bundleSizeFormatted,
			providers.length
		),
		'progress',
		'uploadBlueprintBundle'
	);

	// Upload to providers sequentially
	const uploadResults = [];
	let successCount = 0;
	let failureCount = 0;

	for ( const providerIdItem of providers ) {
		try {
			// Fetch provider config
			let exportPath = 'blueprint-bundle/bundle.zip';
			try {
				const providerResponse = await apiFetch( {
					path: `/aether/site-exporter/providers/${ providerIdItem }`,
				} );
				if ( providerResponse.success && providerResponse.config ) {
					const providerConfig = providerResponse.config || {};
					if ( providerConfig.export_path ) {
						exportPath = providerConfig.export_path;
					}
				}
			} catch {
				// Use default path on error
			}

			const deploymentConfig = applyFilters(
				'aether.deployment.config',
				{
					...context,
					providerId: providerIdItem,
					exportPath,
				},
				providerIdItem
			);

			await handleSiteArchiveUpload( providerIdItem, deploymentConfig );

			successCount++;
			uploadResults.push( {
				status: 'fulfilled',
				value: {
					providerId: providerIdItem,
					success: true,
					exportPath,
				},
			} );

			// Update progress
			if ( setStepProgress && setOverallProgressValue ) {
				const stepProgress = Math.min(
					100,
					Math.round( ( successCount / providers.length ) * 100 )
				);
				setStepProgress( 'uploadBlueprintBundle', stepProgress );
				setOverallProgressValue(
					calculateOverallProgress( {
						step: 'uploadBlueprintBundle',
						progress: stepProgress,
					} )
				);
			}
		} catch ( error ) {
			failureCount++;
			uploadResults.push( {
				status: 'rejected',
				reason: error,
				providerId: providerIdItem,
				error:
					error?.message ||
					__( 'Unknown error', 'aether-site-exporter' ),
			} );
		}
	}

	// Report results
	if ( successCount > 0 ) {
		setStatusMessage(
			sprintf(
				/* translators: %1$s: File size, %2$d: Success count, %3$d: Total providers */
				_n(
					'Uploaded blueprint bundle (%1$s) to %2$d/%3$d provider',
					'Uploaded blueprint bundle (%1$s) to %2$d/%3$d providers',
					providers.length,
					'aether-site-exporter'
				),
				bundleSizeFormatted,
				successCount,
				providers.length
			),
			failureCount > 0 ? 'warning' : 'success',
			'uploadBlueprintBundle'
		);
	}

	if ( successCount === 0 ) {
		throw new Error(
			__(
				'Failed to upload blueprint bundle to any provider',
				'aether-site-exporter'
			)
		);
	}

	return {
		providers,
		results: uploadResults.map( ( r ) =>
			r.status === 'fulfilled' ? r.value : r.reason
		),
		successCount,
		failureCount,
	};
}

/**
 * Upload Blueprint Bundle step definition.
 */
export const uploadBlueprintBundleStep = {
	id: 'uploadBlueprintBundle',
	label: __( 'Upload Blueprint Bundle', 'aether-site-exporter' ),
	description: __(
		'Upload blueprint-bundle.zip to providers',
		'aether-site-exporter'
	),
	supportsProgress: true,
	dependencies: [ 'generateBlueprint' ],
	provides: [],
	handler,
};
