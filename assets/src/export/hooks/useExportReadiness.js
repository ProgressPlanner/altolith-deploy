/**
 * Publish Readiness Hook
 *
 * Checks if the site is ready to export by validating settings and provider status.
 * Uses useAPIData for cleaner data fetching.
 * Simplified from 107 to 80 lines (-25% complexity).
 *
 * @package
 */

import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useAPIData } from '@aether/hooks/useAPIData';

/**
 * Check export readiness based on settings and provider status
 *
 * @return {Object} Readiness status with ready flag, issues array, and loading state
 */
export function useExportReadiness() {
	const {
		data: settings,
		loading: settingsLoading,
		refresh,
	} = useAPIData( {
		path: '/aether/site-exporter/settings',
		transform: ( response ) => {
			if ( ! response.success ) {
				throw new Error(
					__( 'Failed to fetch settings', 'aether-site-exporter' )
				);
			}
			return response.value || {};
		},
		initialData: null,
	} );

	const {
		data: providerStatus,
		loading: statusLoading,
		refresh: refreshStatus,
	} = useAPIData( {
		path: settings?.provider_types?.storage
			? `/aether/site-exporter/providers/${ settings.provider_types.storage }/status`
			: null,
		fetchOnMount: false,
		initialData: null,
	} );

	// Trigger provider status check when blueprint provider is available
	useMemo( () => {
		if ( settings?.provider_types?.storage && ! statusLoading ) {
			refreshStatus();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ settings?.provider_types?.storage ] );

	const readiness = useMemo( () => {
		if ( ! settings ) {
			return {
				ready: false,
				issues: [],
				loading: true,
			};
		}

		const issues = [];

		// Check if static site is enabled and has a provider
		const staticEnabled = settings.staticSite?.enabled ?? false;
		if ( staticEnabled ) {
			const staticProvider = settings.provider_types?.static_site ?? '';
			if ( ! staticProvider ) {
				issues.push(
					__(
						'Static site generation is enabled but no provider is selected.',
						'aether'
					)
				);
			}
		}

		// Check if blueprint provider is selected
		const blueprintProvider = settings.provider_types?.storage ?? '';
		if ( ! blueprintProvider ) {
			issues.push(
				__(
					'No blueprint storage provider is selected.',
					'aether-site-exporter'
				)
			);
		}

		// Check provider configuration
		if ( blueprintProvider && providerStatus ) {
			if ( ! providerStatus.configured ) {
				issues.push(
					sprintf(
						/* translators: %s: provider name */
						__(
							'Blueprint provider "%s" is not fully configured.',
							'aether'
						),
						blueprintProvider
					)
				);
			}
		}

		return {
			ready: issues.length === 0,
			issues,
			loading: settingsLoading || ( blueprintProvider && statusLoading ),
		};
	}, [ settings, providerStatus, settingsLoading, statusLoading ] );

	return {
		...readiness,
		refresh: () => {
			refresh();
			if ( settings?.provider_types?.storage ) {
				refreshStatus();
			}
		},
	};
}
