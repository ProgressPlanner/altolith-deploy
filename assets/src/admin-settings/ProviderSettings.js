/**
 * Provider Settings Component (Instance-Based)
 *
 * Displays provider types with their instances grouped together.
 * Each provider type section can have multiple named instances.
 *
 * @package
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner, Button } from '@wordpress/components';
import ProviderSection from './components/ProviderSection';
import ProviderConfigModal from './components/ProviderConfigModal';
import AddProviderInstanceModal from './components/AddProviderInstanceModal';
import apiFetch from '../utils/api';
import { colors, spacing, fontWeight } from '../utils/styles';
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
	const [ selectedInstanceId, setSelectedInstanceId ] = useState( null );
	const [ isConfigModalOpen, setIsConfigModalOpen ] = useState( false );
	const [ isAddModalOpen, setIsAddModalOpen ] = useState( false );
	const configs = providerConfigs;

	// Initialize provider settings hook
	const {
		toggleProviderEnabled,
		createProviderInstance,
		deleteProviderInstance,
	} = useProviderSettings();

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
					setProviders( providersResponse.providers );
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

	// Group instances by provider type
	const instancesByProviderType = {};
	Object.entries( configs ).forEach( ( [ instanceId, config ] ) => {
		const providerType = config.provider_type || instanceId.split( ':' )[ 0 ];
		if ( ! instancesByProviderType[ providerType ] ) {
			instancesByProviderType[ providerType ] = [];
		}
		instancesByProviderType[ providerType ].push( {
			instanceId,
			config,
		} );
	} );

	const handleCreateInstance = useCallback(
		async ( providerType ) => {
			setIsAddModalOpen( true );
		},
		[]
	);

	const handleCreateInstanceConfirm = useCallback(
		async ( providerType, instanceName ) => {
			try {
				await createProviderInstance( providerType, instanceName );

				// Reload configs
				const configsResponse = await apiFetch( {
					path: '/aether/site-exporter/settings?key=providers',
				} );

				if ( configsResponse.success && configsResponse.value ) {
					onConfigsUpdate( configsResponse.value );
				}
			} catch ( error ) {
				console.error( 'Failed to create instance:', error );
				throw error;
			}
		},
		[ createProviderInstance, onConfigsUpdate ]
	);

	const handleConfigureInstance = useCallback( async ( instanceId ) => {
		setSelectedInstanceId( instanceId );
		setIsConfigModalOpen( true );
	}, [] );

	const handleToggleInstance = useCallback(
		async ( instanceId, enabled ) => {
			try {
				const updatedProviders = await toggleProviderEnabled(
					instanceId,
					enabled
				);

				// Update parent configs state
				if ( onConfigsUpdate ) {
					onConfigsUpdate( updatedProviders );
				}
			} catch ( error ) {
				console.error( 'Failed to toggle instance:', error );
			}
		},
		[ toggleProviderEnabled, onConfigsUpdate ]
	);

	const handleDeleteInstance = useCallback(
		async ( instanceId ) => {
			try {
				const updatedProviders = await deleteProviderInstance(
					instanceId
				);

				// Update parent configs state
				if ( onConfigsUpdate ) {
					onConfigsUpdate( updatedProviders );
				}
			} catch ( error ) {
				console.error( 'Failed to delete instance:', error );
			}
		},
		[ deleteProviderInstance, onConfigsUpdate ]
	);

	const handleModalClose = useCallback( () => {
		setIsConfigModalOpen( false );
		setSelectedInstanceId( null );
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

	// Get selected instance and provider for config modal
	const selectedInstance = selectedInstanceId
		? {
				instanceId: selectedInstanceId,
				config: configs[ selectedInstanceId ] || {},
		  }
		: null;
	const selectedProvider =
		selectedInstance && selectedInstance.config.provider_type
			? providers.find(
					( p ) => p.id === selectedInstance.config.provider_type
			  )
			: null;

	const pageHeaderStyle = {
		marginBottom: spacing.lg,
		fontSize: '1.5rem',
		fontWeight: fontWeight.bold,
		color: colors.text,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
	};

	const pageDescriptionStyle = {
		marginBottom: spacing.lg,
		color: colors.textSecondary,
		fontSize: '0.875rem',
	};

	// Count total instances
	const totalInstances = Object.keys( configs ).length;
	const enabledInstances = Object.values( configs ).filter(
		( c ) => c.enabled !== false
	).length;

	return (
		<div>
			<div style={ pageHeaderStyle }>
				<div>
					<h2 style={ { margin: 0 } }>
						{ __( 'Provider Instances', 'aether-site-exporter' ) }
					</h2>
				</div>
				<Button
					variant="primary"
					onClick={ () => setIsAddModalOpen( true ) }
				>
					{ __( 'Add Provider Instance', 'aether-site-exporter' ) }
				</Button>
			</div>
			<p style={ pageDescriptionStyle }>
				{ __(
					'Create and manage multiple instances of each provider type. Each instance can have its own configuration and deployment settings.',
					'aether-site-exporter'
				) }
			</p>

			<div
				style={ {
					fontSize: '0.875rem',
					color: colors.textSecondary,
					marginBottom: spacing.lg,
				} }
			>
				<span>
					{ __( 'Total Instances:', 'aether-site-exporter' ) }{ ' ' }
					<strong>{ totalInstances }</strong>
				</span>
				{ ' • ' }
				<span>
					{ __( 'Enabled:', 'aether-site-exporter' ) }{ ' ' }
					<strong>{ enabledInstances }</strong>
				</span>
			</div>

			{ /* Provider Sections */ }
			{ providers.map( ( provider ) => {
				const instances = instancesByProviderType[ provider.id ] || [];

				return (
					<ProviderSection
						key={ provider.id }
						provider={ provider }
						instances={ instances }
						onCreateInstance={ handleCreateInstance }
						onConfigureInstance={ handleConfigureInstance }
						onToggleInstance={ handleToggleInstance }
						onDeleteInstance={ handleDeleteInstance }
					/>
				);
			} ) }

			{ /* Configuration Modal */ }
			{ selectedProvider && selectedInstance && (
				<ProviderConfigModal
					isOpen={ isConfigModalOpen }
					onClose={ handleModalClose }
					provider={ {
						id: selectedProvider.id,
						metadata: {
							name: selectedProvider.name,
							description: selectedProvider.description,
							supportedDeploymentTypes:
								selectedProvider.deployment_types || [],
							type: selectedProvider.type,
						},
						settingsFields: (
							selectedProvider.settings_fields || []
						).map( ( field ) => ( {
							...field,
							id: field.name,
						} ) ),
					} }
					initialConfig={ selectedInstance.config }
					instanceId={ selectedInstanceId }
				/>
			) }

			{ /* Add Instance Modal */ }
			<AddProviderInstanceModal
				isOpen={ isAddModalOpen }
				onClose={ () => setIsAddModalOpen( false ) }
				providers={ providers }
				onCreate={ handleCreateInstanceConfirm }
			/>
		</div>
	);
}
