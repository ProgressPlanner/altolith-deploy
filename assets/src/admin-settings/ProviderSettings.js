/**
 * Provider Settings Component
 *
 * Displays providers in a responsive grid layout with cards.
 * Each card shows provider summary with enable/disable toggle
 * and opens configuration in a modal.
 *
 * @package
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner, SearchControl } from '@wordpress/components';
import ProviderCard from './components/ProviderCard';
import ProviderConfigModal from './components/ProviderConfigModal';
import apiFetch from '../utils/api';
import { colors, spacing, fontWeight, createGridStyle } from '../utils/styles';
import {
	areAllDependenciesSatisfied,
	getUnsatisfiedDependencies,
} from './utils/dependencyValidation';
import { isProviderConfigured } from './utils/providerConfiguration';
import { useDependencyValidation } from './hooks/useDependencyValidation';
import { useProviderMetadataReload } from './hooks/useProviderMetadataReload';
import { useProviderSettings } from '../hooks/useProviderSettings';

/**
 * Provider Settings Component.
 *
 * @param {Object}   props                 Component props.
 * @param {Object}   props.providerConfigs Provider configurations from parent.
 * @param {Function} props.onConfigsUpdate Callback to update parent configs.
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderSettings( {
	providerConfigs = {},
	onConfigsUpdate,
} ) {
	const [ providers, setProviders ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ selectedProvider, setSelectedProvider ] = useState( null );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ searchQuery, setSearchQuery ] = useState( '' );
	const [ filterType, setFilterType ] = useState( 'all' );
	const configs = providerConfigs;

	// Initialize provider settings hook
	const { toggleProviderEnabled } = useProviderSettings();

	// Auto-disable providers when dependencies become unsatisfied
	useDependencyValidation( providers, configs, onConfigsUpdate );

	// Reload provider metadata when deployment types change
	useProviderMetadataReload(
		configs,
		isModalOpen,
		selectedProvider,
		setProviders,
		setSelectedProvider
	);

	useEffect( () => {
		// Fetch providers from REST API (PHP registry is source of truth)
		const loadProviders = async () => {
			try {
				// Fetch provider metadata from REST API
				const providersResponse = await apiFetch( {
					path: '/aether/site-exporter/providers',
				} );

				if (
					providersResponse.success &&
					providersResponse.providers
				) {
					// Transform REST API response to match component expectations
					const providerMetadata = providersResponse.providers.map(
						( provider ) => ( {
							id: provider.id,
							metadata: {
								name: provider.name,
								description: provider.description,
								supportedDeploymentTypes:
									provider.deployment_types || [],
								type: provider.type,
								icon: '', // Icon not provided by PHP, can be added later if needed
							},
							// Transform settings_fields: map 'name' to 'id' for ProviderForm compatibility
							settingsFields: (
								provider.settings_fields || []
							).map( ( field ) => ( {
								...field,
								id: field.name, // ProviderForm expects 'id' field
							} ) ),
						} )
					);

					setProviders( providerMetadata );
				}

				// Configs are now managed by parent component
				// If parent hasn't loaded them yet, trigger initial load
				if ( onConfigsUpdate && Object.keys( configs ).length === 0 ) {
					const configsResponse = await apiFetch( {
						path: '/aether/site-exporter/settings?key=providers',
					} );

					if ( configsResponse.success && configsResponse.value ) {
						onConfigsUpdate( configsResponse.value );
					}
				}
			} catch ( error ) {
				console.error(
					'Failed to load providers or configurations:',
					error
				);
			} finally {
				setLoading( false );
			}
		};

		loadProviders();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Filter providers based on search and type filter
	const filteredProviders = providers.filter( ( provider ) => {
		const matchesSearch =
			! searchQuery ||
			provider.metadata.name
				.toLowerCase()
				.includes( searchQuery.toLowerCase() ) ||
			provider.metadata.description
				?.toLowerCase()
				.includes( searchQuery.toLowerCase() );

		const matchesType =
			filterType === 'all' || provider.metadata.type === filterType;

		return matchesSearch && matchesType;
	} );

	// Get unique provider types for filter
	const providerTypes = [
		...new Set( providers.map( ( p ) => p.metadata.type ) ),
	];

	// Count enabled and configured providers
	const enabledCount = providers.filter(
		( p ) => configs[ p.id ]?.enabled !== false
	).length;
	// Calculate configured count using JS logic based on required fields
	const configuredCount = providers.filter( ( p ) => {
		const providerConfig = configs[ p.id ] || {};
		return isProviderConfigured( p.settingsFields || [], providerConfig );
	} ).length;

	const handleToggleProvider = useCallback(
		async ( providerId, enabled ) => {
			try {
				// If enabling, check dependencies first
				if ( enabled ) {
					const provider = providers.find(
						( p ) => p.id === providerId
					);
					if ( provider ) {
						// Check dependencies before toggling
						const allDependenciesSatisfied =
							areAllDependenciesSatisfied(
								provider,
								providers,
								configs
							);

						if ( ! allDependenciesSatisfied ) {
							const unsatisfied = getUnsatisfiedDependencies(
								provider,
								providers,
								configs
							);
							const dependencyNames = unsatisfied
								.map( ( depId ) => {
									const depProvider = providers.find(
										( p ) => p.id === depId
									);
									return depProvider?.metadata?.name || depId;
								} )
								.join( ', ' );

							// eslint-disable-next-line no-alert
							alert(
								// eslint-disable-next-line @wordpress/i18n-no-variables
								__(
									'Cannot enable provider: Missing required dependencies: ' +
										dependencyNames,
									'aether-site-exporter'
								)
							);
							return;
						}
					}
				}

				// Use the hook to toggle provider enabled state
				const updatedProviders = await toggleProviderEnabled(
					providerId,
					enabled
				);

				// Update parent configs state
				if ( onConfigsUpdate ) {
					onConfigsUpdate( updatedProviders );
				}
			} catch ( error ) {
				console.error( 'Failed to toggle provider:', error );
			}
		},
		[ providers, configs, toggleProviderEnabled, onConfigsUpdate ]
	);

	const handleConfigureProvider = useCallback( async ( provider ) => {
		// Reload provider metadata to get updated settings fields based on current deployment types
		try {
			const providerResponse = await apiFetch( {
				path: `/aether/site-exporter/providers/${ provider.id }`,
			} );

			if ( providerResponse.success && providerResponse.provider ) {
				// Update the provider with latest metadata (including filtered settings fields)
				const updatedProvider = {
					...provider,
					settingsFields: (
						providerResponse.provider.settings_fields || []
					).map( ( field ) => ( {
						...field,
						id: field.name, // ProviderForm expects 'id' field
					} ) ),
				};
				setSelectedProvider( updatedProvider );
				setIsModalOpen( true );
			} else {
				// Fallback to original provider if fetch fails
				setSelectedProvider( provider );
				setIsModalOpen( true );
			}
		} catch ( error ) {
			console.error( 'Failed to reload provider metadata:', error );
			// Fallback to original provider if fetch fails
			setSelectedProvider( provider );
			setIsModalOpen( true );
		}
	}, [] );

	const handleModalClose = useCallback( () => {
		setIsModalOpen( false );
		// Clear selected provider to unmount the modal immediately
		setSelectedProvider( null );
		// No need to reload configs since the modal doesn't modify them
		// The configs are already current from sidebar changes
	}, [] );

	if ( loading ) {
		return (
			<div style={ { textAlign: 'center', padding: spacing.xl } }>
				<Spinner />
			</div>
		);
	}

	if ( providers.length === 0 ) {
		return (
			<div>
				<p style={ { color: colors.textSecondary } }>
					{ __(
						'No providers available. Install a provider plugin to enable deployment options.',
						'aether-site-exporter'
					) }
				</p>
			</div>
		);
	}

	const pageHeaderStyle = {
		marginBottom: spacing.lg,
		fontSize: '1.5rem',
		fontWeight: fontWeight.bold,
		color: colors.text,
	};

	const pageDescriptionStyle = {
		marginBottom: spacing.lg,
		color: colors.textSecondary,
		fontSize: '0.875rem',
	};

	const controlsStyle = {
		display: 'flex',
		gap: spacing.md,
		marginBottom: spacing.lg,
		flexWrap: 'wrap',
		alignItems: 'center',
	};

	const statsStyle = {
		display: 'flex',
		gap: spacing.md,
		marginBottom: spacing.md,
		fontSize: '0.875rem',
		color: colors.textSecondary,
	};

	const gridStyle = createGridStyle( '280px', spacing.lg );

	return (
		<div>
			<h2 style={ pageHeaderStyle }>
				{ __( 'Provider Settings', 'aether-site-exporter' ) }
			</h2>
			<p style={ pageDescriptionStyle }>
				{ __(
					'Configure deployment providers. Each provider can handle different deployment types (static sites, blueprint bundles, edge functions).',
					'aether-site-exporter'
				) }
			</p>

			{ /* Stats */ }
			<div style={ statsStyle }>
				<span>
					{ __( 'Total:', 'aether-site-exporter' ) }{ ' ' }
					<strong>{ providers.length }</strong>
				</span>
				<span>
					{ __( 'Enabled:', 'aether-site-exporter' ) }{ ' ' }
					<strong>{ enabledCount }</strong>
				</span>
				<span>
					{ __( 'Configured:', 'aether-site-exporter' ) }{ ' ' }
					<strong>{ configuredCount }</strong>
				</span>
			</div>

			{ /* Search and Filter Controls */ }
			<div style={ controlsStyle }>
				<SearchControl
					value={ searchQuery }
					onChange={ setSearchQuery }
					placeholder={ __(
						'Search providers…',
						'aether-site-exporter'
					) }
					style={ { maxWidth: '300px' } }
				/>
				{ providerTypes.length > 0 && (
					<select
						value={ filterType }
						onChange={ ( e ) => setFilterType( e.target.value ) }
						style={ {
							padding: `${ spacing.sm } ${ spacing.md }`,
							border: `1px solid ${ colors.borderLight }`,
							borderRadius: '4px',
						} }
					>
						<option value="all">
							{ __( 'All Types', 'aether-site-exporter' ) }
						</option>
						{ providerTypes.map( ( type ) => (
							<option key={ type } value={ type }>
								{ type }
							</option>
						) ) }
					</select>
				) }
			</div>

			{ /* Provider Grid */ }
			{ filteredProviders.length > 0 ? (
				<div style={ gridStyle }>
					{ filteredProviders.map( ( provider ) => {
						const providerConfig = configs[ provider.id ] || {};
						const enabled = providerConfig.enabled !== false; // Default to enabled

						return (
							<ProviderCard
								key={ provider.id }
								provider={ provider }
								config={ providerConfig }
								enabled={ enabled }
								onToggle={ ( newEnabled ) =>
									handleToggleProvider(
										provider.id,
										newEnabled
									)
								}
								onConfigure={ () =>
									handleConfigureProvider( provider )
								}
								allProviders={ providers }
								allProviderConfigs={ configs }
							/>
						);
					} ) }
				</div>
			) : (
				<p style={ { color: colors.textSecondary } }>
					{ __(
						'No providers match your search criteria.',
						'aether-site-exporter'
					) }
				</p>
			) }

			{ /* Configuration Modal */ }
			{ selectedProvider && (
				<ProviderConfigModal
					isOpen={ isModalOpen }
					onClose={ handleModalClose }
					provider={ selectedProvider }
					initialConfig={ configs[ selectedProvider.id ] || {} }
				/>
			) }
		</div>
	);
}
