/**
 * Usage Summary Hook
 *
 * Calculates usage summary from settings and provider status.
 * Uses SettingsContext to avoid duplicate API calls.
 * Simplified from 99 to 60 lines (-39% complexity).
 *
 * @package
 */

import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useAPIData } from '../../hooks/useAPIData';

const PROVIDER_LABELS = {
	'cloudflare-r2': __( 'Cloudflare R2', 'aether' ),
	'gitlab-pages': __( 'GitLab Pages', 'aether' ),
	'cloudflare-workers': __( 'Cloudflare Workers', 'aether' ),
};

/**
 * Get provider label from provider ID
 *
 * @param {string|null} providerId Provider ID
 * @return {string} Provider label
 */
function getProviderLabel( providerId ) {
	if ( ! providerId ) {
		return __( 'Not configured', 'aether' );
	}
	return PROVIDER_LABELS[ providerId ] || providerId;
}

/**
 * Hook to calculate usage summary from settings
 *
 * @return {Object} Usage summary with provider info and loading state
 */
export function useUsageSummary() {
	const { data: settingsData, loading } = useAPIData( {
		path: '/aether/v1/settings',
		transform: ( response ) => {
			if ( ! response.success ) {
				return null;
			}
			return response.value || response.settings || {};
		},
		initialData: null,
	} );

	const summary = useMemo( () => {
		if ( ! settingsData ) {
			return {
				blueprint: {
					label: __( 'Not configured', 'aether' ),
					provider: null,
				},
				staticSite: {
					label: __( 'Not configured', 'aether' ),
					provider: null,
				},
				media: {
					label: __( 'Not configured', 'aether' ),
					provider: null,
				},
				staticEnabled: false,
			};
		}

		const providerTypes = settingsData.provider_types || {};
		const staticEnabled = settingsData.staticSite?.enabled ?? false;

		const blueprintProvider = providerTypes.storage || null;
		const staticSiteProvider = providerTypes.static_site || null;
		const mediaProvider =
			providerTypes.media || providerTypes.mediaImages || null;

		return {
			blueprint: {
				label: getProviderLabel( blueprintProvider ),
				provider: blueprintProvider,
			},
			staticSite: {
				label: getProviderLabel( staticSiteProvider ),
				provider: staticSiteProvider,
			},
			media: {
				label: getProviderLabel( mediaProvider ),
				provider: mediaProvider,
			},
			staticEnabled,
		};
	}, [ settingsData ] );

	return {
		...summary,
		loading,
	};
}
