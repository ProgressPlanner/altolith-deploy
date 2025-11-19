/**
 * Provider Settings Component
 *
 * Displays providers in a responsive grid layout with cards.
 * Each card shows provider summary with enable/disable toggle
 * and opens configuration in a modal.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner, SearchControl } from '@wordpress/components';
import ProviderCard from './components/ProviderCard';
import ProviderConfigModal from './components/ProviderConfigModal';
import apiFetch from '../utils/api';
import { colors, spacing, fontWeight, createGridStyle } from '../utils/styles';

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

	// Reload providers when deployment types change (to get updated settings fields)
	// Extract deployment types from configs to watch for changes
	const deploymentTypesByProvider = Object.keys( configs ).reduce(
		( acc, providerId ) => {
			const deploymentTypes = configs[ providerId ]?.deployment_types;
			if ( Array.isArray( deploymentTypes ) ) {
				acc[ providerId ] = deploymentTypes.sort().join( ',' );
			}
			return acc;
		},
		{}
	);

	useEffect( () => {
		const reloadProviders = async () => {
			try {
				const providersResponse = await apiFetch( {
					path: '/aether/site-exporter/providers',
				} );

				if (
					providersResponse.success &&
					providersResponse.providers
				) {
					const providerMetadata = providersResponse.providers.map(
						( provider ) => ( {
							id: provider.id,
							metadata: {
								name: provider.name,
								description: provider.description,
								supportedDeploymentTypes:
									provider.deployment_types || [],
								type: provider.type,
								icon: '',
							},
							settingsFields: (
								provider.settings_fields || []
							).map( ( field ) => ( {
								...field,
								id: field.name,
							} ) ),
						} )
					);

					setProviders( providerMetadata );

					// If a provider modal is open, update the selected provider with latest metadata
					if ( selectedProvider ) {
						const updatedProvider = providerMetadata.find(
							( p ) => p.id === selectedProvider.id
						);
						if ( updatedProvider ) {
							setSelectedProvider( updatedProvider );
						}
					}
				}
			} catch ( error ) {
				console.error( 'Failed to reload providers:', error );
			}
		};

		// Only reload if we have configs (not on initial mount)
		if ( Object.keys( configs ).length > 0 ) {
			reloadProviders();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ JSON.stringify( deploymentTypesByProvider ) ] );

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
	const configuredCount = providers.filter( ( p ) => {
		const config = configs[ p.id ];
		return config && Object.keys( config ).length > 0;
	} ).length;

	const handleToggleProvider = async ( providerId, enabled ) => {
		try {
			// Get current config for this provider
			const currentConfig = configs[ providerId ] || {};

			// Update enabled state
			const updatedConfig = {
				...currentConfig,
				enabled,
			};

			// Get current providers settings
			const settingsResponse = await apiFetch( {
				path: '/aether/site-exporter/settings?key=providers',
			} );

			if ( ! settingsResponse.success ) {
				throw new Error( 'Failed to load current settings' );
			}

			// Merge updated provider config
			const currentProviders = settingsResponse.value || {};
			const updatedProviders = {
				...currentProviders,
				[ providerId ]: updatedConfig,
			};

			// Save updated providers object
			const saveResponse = await apiFetch( {
				path: '/aether/site-exporter/settings',
				method: 'POST',
				data: {
					key: 'providers',
					value: updatedProviders,
				},
			} );

			if ( ! saveResponse.success ) {
				throw new Error(
					saveResponse.message || 'Failed to save settings'
				);
			}

			// Update parent configs state
			if ( onConfigsUpdate ) {
				onConfigsUpdate( updatedProviders );
			}
		} catch ( error ) {
			console.error( 'Failed to toggle provider:', error );
		}
	};

	const handleConfigureProvider = async ( provider ) => {
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
	};

	const handleModalClose = () => {
		setIsModalOpen( false );
		// Clear selected provider to unmount the modal immediately
		setSelectedProvider( null );
		// Reload configs to get latest values after a short delay
		// This ensures the modal is fully closed before reloading
		setTimeout( () => {
			apiFetch( {
				path: '/aether/site-exporter/settings?key=providers',
			} ).then( ( response ) => {
				if ( response.success && response.value && onConfigsUpdate ) {
					onConfigsUpdate( response.value );
				}
			} );
		}, 100 );
	};

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
