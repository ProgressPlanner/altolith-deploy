/**
 * Admin Settings Main Component
 *
 * Main admin settings page container with provider sections.
 * Uses SettingsContext for centralized state management.
 *
 * @package
 */

import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import ProviderSection from './components/ProviderSection';
import LoadingState from '../components/LoadingState';
import PlaygroundNotice from '../components/PlaygroundNotice';
import ErrorBoundary from '../components/ErrorBoundary';
import { useSettingsContext } from '../hooks/useSettingsContext';
import { colors, spacing, fontWeight, createFlexStyle } from '../utils/styles';

function AdminSettingsContent() {
	// eslint-disable-next-line camelcase
	const { provider_types, setProviderType, loading, error } =
		useSettingsContext();

	/**
	 * Map internal component keys to provider type keys
	 *
	 * @param {string} componentKey Component key (edgeProvider, storageProvider, etc.)
	 * @return {string} Provider type key (edge, storage, etc.)
	 */
	const getProviderTypeKey = ( componentKey ) => {
		const mapping = {
			edgeProvider: 'edge',
			storageProvider: 'storage',
			staticSiteProvider: 'static_site',
			mediaProvider: 'media',
		};
		return mapping[ componentKey ] || componentKey;
	};

	/**
	 * Handle provider selection change
	 *
	 * @param {string} componentKey Component key (edgeProvider, storageProvider, etc.)
	 * @param {string} value        Provider ID to set
	 */
	const handleProviderChange = ( componentKey, value ) => {
		const providerTypeKey = getProviderTypeKey( componentKey );
		setProviderType( providerTypeKey, value );
	};

	/**
	 * Get provider settings object for component state
	 */
	const settings = useMemo( () => {
		// eslint-disable-next-line camelcase
		return {
			// eslint-disable-next-line camelcase
			edgeProvider: provider_types.edge || '',
			// eslint-disable-next-line camelcase
			storageProvider: provider_types.storage || '',
			// eslint-disable-next-line camelcase
			staticSiteProvider: provider_types.static_site || '',
			// eslint-disable-next-line camelcase
			mediaProvider: provider_types.media || '',
		};
		// eslint-disable-next-line camelcase
	}, [ provider_types ] );

	/**
	 * Determine if settings button should be shown for a provider.
	 * Only show the button for the first provider-type that uses this provider.
	 *
	 * @param {string} providerId  Provider ID to check.
	 * @param {string} currentType Current provider type (edge, storage, media, staticSite).
	 * @return {boolean} True if settings button should be shown.
	 */
	const shouldShowSettingsButton = ( providerId, currentType ) => {
		if ( ! providerId ) {
			return false;
		}

		// Define the order of provider types (first occurrence shows the button)
		const providerTypeOrder = [
			'edgeProvider',
			'storageProvider',
			'mediaProvider',
			'staticSiteProvider',
		];

		// Find the first provider-type that uses this provider
		for ( const type of providerTypeOrder ) {
			if ( settings[ type ] === providerId ) {
				// If this is the first occurrence, show the button
				return type === currentType;
			}
		}

		// If provider not found in any type, show button for current type
		return true;
	};

	const containerStyle = {
		padding: '1.25rem',
	};

	const headingStyle = {
		marginBottom: spacing.xl,
		fontSize: '1.75rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
	};

	const sectionsStyle = {
		...createFlexStyle( 'column', spacing.lg ),
	};

	if ( loading ) {
		return <LoadingState message={ __( 'Loading settings…', 'aether-site-exporter' ) } />;
	}

	return (
		<div className="aether-admin-settings" style={ containerStyle }>
			<PlaygroundNotice />
			<h1
				className="aether-admin-settings__heading"
				style={ headingStyle }
			>
				{ __( 'Aether Settings', 'aether-site-exporter' ) }
			</h1>

			{ error && (
				<Notice
					className="aether-admin-settings__error"
					status="error"
					isDismissible={ false }
				>
					{ error }
				</Notice>
			) }

			<div
				className="aether-admin-settings__sections"
				style={ sectionsStyle }
			>
				<ProviderSection
					type="edge"
					label={ __( 'Edge Provider', 'aether-site-exporter' ) }
					description={ __(
						'Edge providers deploy workers that enable browser-based operations like Git commits and media uploads. These workers act as secure proxies, allowing your site to work seamlessly in WordPress Playground and other browser environments.',
						'aether'
					) }
					value={ settings.edgeProvider }
					onChange={ ( value ) =>
						handleProviderChange( 'edgeProvider', value )
					}
					hideSettingsButton={
						! shouldShowSettingsButton(
							settings.edgeProvider,
							'edgeProvider'
						)
					}
				/>

				<ProviderSection
					type="storage"
					label={ __( 'Storage Provider', 'aether-site-exporter' ) }
					description={ __(
						'Storage providers store your wp-content.zip file, which contains your site database and any custom plugins or themes you have installed. This allows you to restore your site configuration, share it with others, or deploy it to different environments without losing your setup.',
						'aether'
					) }
					value={ settings.storageProvider }
					onChange={ ( value ) =>
						handleProviderChange( 'storageProvider', value )
					}
					hideSettingsButton={
						! shouldShowSettingsButton(
							settings.storageProvider,
							'storageProvider'
						)
					}
				/>

				<ProviderSection
					type="media"
					label={ __( 'Media Provider', 'aether-site-exporter' ) }
					description={ __(
						'Media providers store your images, videos, and other media files in cloud storage instead of on your server. This reduces server storage usage, improves site performance, and can lower hosting costs.',
						'aether'
					) }
					value={ settings.mediaProvider }
					onChange={ ( value ) =>
						handleProviderChange( 'mediaProvider', value )
					}
					hideSettingsButton={
						! shouldShowSettingsButton(
							settings.mediaProvider,
							'mediaProvider'
						)
					}
				/>

				<ProviderSection
					type="staticSite"
					label={ __( 'Static Site Provider', 'aether-site-exporter' ) }
					description={ __(
						'Static site providers host a fully static version of your WordPress site. This creates a fast, secure, and cost-effective version of your site that can be served from a CDN without requiring a database or PHP server.',
						'aether'
					) }
					value={ settings.staticSiteProvider }
					onChange={ ( value ) =>
						handleProviderChange( 'staticSiteProvider', value )
					}
					hideSettingsButton={
						! shouldShowSettingsButton(
							settings.staticSiteProvider,
							'staticSiteProvider'
						)
					}
				/>
			</div>
		</div>
	);
}

export default function AdminSettings() {
	return (
		<ErrorBoundary>
			<AdminSettingsContent />
		</ErrorBoundary>
	);
}
