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
import ProviderInstanceCard from './components/ProviderInstanceCard';
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
 * @param {Function} props.onNotice        Callback to show notices.
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderSettings( {
	providerConfigs = {},
	onConfigsUpdate,
	onNotice,
} ) {
	const [ providers, setProviders ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ selectedInstanceId, setSelectedInstanceId ] = useState( null );
	const [ isConfigModalOpen, setIsConfigModalOpen ] = useState( false );
	const [ isAddModalOpen, setIsAddModalOpen ] = useState( false );

	// Local state for optimistic updates
	const [ localConfigs, setLocalConfigs ] = useState( providerConfigs );

	// Sync local state when parent prop changes
	useEffect( () => {
		setLocalConfigs( providerConfigs );
	}, [ providerConfigs ] );

	const configs = localConfigs;

	// Initialize provider settings hook
	const {
		toggleProviderEnabled,
		createProviderInstance,
		deleteProviderInstance,
		renameProviderInstance,
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

	// Create flat list of all instances with provider metadata
	const allInstances = Object.entries( configs ).map(
		( [ instanceId, config ] ) => {
			const providerType =
				config.provider_type || instanceId.split( ':' )[ 0 ];
			const provider = providers.find( ( p ) => p.id === providerType );

			return {
				instanceId,
				config,
				provider: provider || { name: providerType, id: providerType },
			};
		}
	);

	const handleCreateInstanceConfirm = useCallback(
		async ( instanceId, providerType, instanceName ) => {
			// Get provider metadata for default deployment types
			const provider = providers.find( ( p ) => p.id === providerType );
			const defaultDeploymentTypes = provider?.deployment_types || [];

			// Optimistically add the new instance to local state
			const newInstance = {
				provider_type: providerType,
				instance_name: instanceName,
				enabled: false,
				deployment_types: defaultDeploymentTypes,
			};

			const optimisticConfigs = {
				...localConfigs,
				[ instanceId ]: newInstance,
			};

			setLocalConfigs( optimisticConfigs );

			try {
				// Create instance in backend
				await createProviderInstance(
					instanceId,
					providerType,
					instanceName
				);

				// Update parent state (persists the optimistic update)
				if ( onConfigsUpdate ) {
					onConfigsUpdate( optimisticConfigs );
				}
			} catch ( error ) {
				console.error( 'Failed to create instance:', error );

				// Rollback optimistic update on error
				setLocalConfigs( localConfigs );

				// Re-throw to show error in modal
				throw error;
			}
		},
		[ createProviderInstance, onConfigsUpdate, localConfigs, providers ]
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
			// Optimistically remove from local state
			const { [ instanceId ]: removed, ...remainingConfigs } =
				localConfigs;
			setLocalConfigs( remainingConfigs );

			try {
				// Delete from backend
				await deleteProviderInstance( instanceId );

				// Update parent state (persists the optimistic update)
				if ( onConfigsUpdate ) {
					onConfigsUpdate( remainingConfigs );
				}
			} catch ( error ) {
				console.error( 'Failed to delete instance:', error );

				// Rollback optimistic update on error
				setLocalConfigs( localConfigs );

				// Show error notification
				if ( onNotice ) {
					onNotice(
						`Failed to delete instance: ${
							error.message || 'Unknown error'
						}`,
						'error'
					);
				}
			}
		},
		[ deleteProviderInstance, onConfigsUpdate, localConfigs, onNotice ]
	);

	const handleRenameInstance = useCallback(
		async ( instanceId, newName ) => {
			try {
				const updatedProviders = await renameProviderInstance(
					instanceId,
					newName
				);

				// Update parent configs state
				if ( onConfigsUpdate ) {
					onConfigsUpdate( updatedProviders );
				}
			} catch ( error ) {
				console.error( 'Failed to rename instance:', error );
				throw error;
			}
		},
		[ renameProviderInstance, onConfigsUpdate ]
	);

	const handleModalClose = useCallback( async () => {
		setIsConfigModalOpen( false );
		setSelectedInstanceId( null );

		// Refresh configs from backend after modal closes
		// This ensures the card displays updated deployment_types immediately
		try {
			const configsResponse = await apiFetch( {
				path: '/aether/site-exporter/settings?key=providers',
			} );

			if ( configsResponse.success && configsResponse.value ) {
				onConfigsUpdate( configsResponse.value );
			}
		} catch ( error ) {
			console.error(
				'Failed to refresh configs after modal close:',
				error
			);
		}
	}, [ onConfigsUpdate ] );

	if ( loading ) {
		return (
			<div
				className="aether-provider-settings aether-provider-settings--loading"
				style={ { textAlign: 'center', padding: spacing.xl } }
			>
				<Spinner className="aether-provider-settings__spinner" />
			</div>
		);
	}

	if ( providers.length === 0 ) {
		return (
			<div className="aether-provider-settings aether-provider-settings--empty">
				<p
					className="aether-provider-settings__empty-message"
					style={ { color: colors.textSecondary } }
				>
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
		<div className="aether-provider-settings">
			<div
				className="aether-provider-settings__header"
				style={ pageHeaderStyle }
			>
				<div className="aether-provider-settings__header-content">
					<h2
						className="aether-provider-settings__title"
						style={ { margin: 0 } }
					>
						{ __( 'Provider Instances', 'aether-site-exporter' ) }
					</h2>
				</div>
				<Button
					className="aether-provider-settings__add-button"
					variant="primary"
					onClick={ () => setIsAddModalOpen( true ) }
				>
					{ __( 'Add Provider Instance', 'aether-site-exporter' ) }
				</Button>
			</div>
			<p
				className="aether-provider-settings__description"
				style={ pageDescriptionStyle }
			>
				{ __(
					'Create and manage multiple instances of each provider type. Each instance can have its own configuration and deployment settings.',
					'aether-site-exporter'
				) }
			</p>

			<div
				className="aether-provider-settings__stats"
				style={ {
					fontSize: '0.875rem',
					color: colors.textSecondary,
					marginBottom: spacing.lg,
				} }
			>
				<span className="aether-provider-settings__stat">
					{ __( 'Total Instances:', 'aether-site-exporter' ) }{ ' ' }
					<strong className="aether-provider-settings__stat-value">
						{ totalInstances }
					</strong>
				</span>
				<span className="aether-provider-settings__stat-separator">
					{ ' • ' }
				</span>
				<span className="aether-provider-settings__stat">
					{ __( 'Enabled:', 'aether-site-exporter' ) }{ ' ' }
					<strong className="aether-provider-settings__stat-value">
						{ enabledInstances }
					</strong>
				</span>
			</div>

			{ /* Flat Grid of All Provider Instances */ }
			{ allInstances.length > 0 ? (
				<div
					className="aether-provider-settings__grid"
					style={ {
						display: 'grid',
						gridTemplateColumns:
							'repeat(auto-fill, minmax(300px, 1fr))',
						gap: spacing.md,
					} }
				>
					{ allInstances.map( ( instance ) => (
						<ProviderInstanceCard
							key={ instance.instanceId }
							provider={ instance.provider }
							instance={ {
								instanceId: instance.instanceId,
								config: instance.config,
							} }
							onConfigure={ () =>
								handleConfigureInstance( instance.instanceId )
							}
							onToggle={ ( enabled ) =>
								handleToggleInstance(
									instance.instanceId,
									enabled
								)
							}
							onDelete={ () =>
								handleDeleteInstance( instance.instanceId )
							}
							onRename={ handleRenameInstance }
						/>
					) ) }
				</div>
			) : (
				<div
					className="aether-provider-settings__empty-state"
					style={ {
						padding: spacing.xl,
						textAlign: 'center',
						color: colors.textSecondary,
						fontSize: '0.875rem',
						border: `1px dashed ${ colors.borderLight }`,
						borderRadius: '8px',
					} }
				>
					{ __(
						'No provider instances configured. Click "Add Provider Instance" to create one.',
						'aether-site-exporter'
					) }
				</div>
			) }

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
