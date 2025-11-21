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
import { Button } from '@wordpress/components';
import ProviderInstancePanel from '@aether/components/ProviderInstancePanel';
import AddProviderInstanceModal from '@aether/components/AddProviderInstanceModal';
import LoadingSpinner from '@aether/components/LoadingSpinner';
import SectionHeader from '@aether/components/SectionHeader';
import apiFetch from '@aether/utils/api';
import { colors, spacing } from '@aether/utils/styles';
import { useProviderSettings } from '@aether/hooks/useProviderSettings';

// Styles - extracted to module level for performance
const emptyMessageStyle = {
	color: colors.textSecondary,
};

const panelsContainerStyle = {
	display: 'flex',
	flexDirection: 'column',
	backgroundColor: colors.white,
};

const emptyStateStyle = {
	padding: spacing.xl,
	textAlign: 'center',
	color: colors.textSecondary,
	fontSize: '0.875rem',
	border: `1px dashed ${ colors.borderLight }`,
	borderRadius: '8px',
};

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

	const handleToggleInstance = useCallback(
		async ( instanceId, enabled ) => {
			// Capture original state before optimistic update for rollback
			const originalConfigs = localConfigs;

			// Optimistic update: update local state immediately before API call
			const optimisticConfigs = {
				...localConfigs,
				[ instanceId ]: {
					...localConfigs[ instanceId ],
					enabled,
				},
			};
			setLocalConfigs( optimisticConfigs );

			try {
				const updatedProviders = await toggleProviderEnabled(
					instanceId,
					enabled
				);

				// Merge API response with current local state to preserve all instances
				// This ensures no instances are lost if API response is incomplete
				const mergedConfigs = {
					...optimisticConfigs,
					...updatedProviders,
				};

				// Update local state with merged result
				setLocalConfigs( mergedConfigs );

				// Update parent configs state with merged result
				if ( onConfigsUpdate ) {
					onConfigsUpdate( mergedConfigs );
				}
			} catch ( error ) {
				console.error( 'Failed to toggle instance:', error );

				// Rollback optimistic update on error
				setLocalConfigs( originalConfigs );

				// Show error notification
				if ( onNotice ) {
					onNotice(
						`Failed to toggle instance: ${
							error.message || 'Unknown error'
						}`,
						'error'
					);
				}
			}
		},
		[ toggleProviderEnabled, onConfigsUpdate, localConfigs, onNotice ]
	);

	const handleDeleteInstance = useCallback(
		async ( instanceId ) => {
			// Capture original state before optimistic update for rollback
			const originalConfigs = localConfigs;

			// Optimistically remove from local state
			const { [ instanceId ]: removed, ...remainingConfigs } =
				localConfigs;
			setLocalConfigs( remainingConfigs );

			try {
				// Delete from backend
				const updatedProviders =
					await deleteProviderInstance( instanceId );

				// Merge API response with remaining configs to preserve all instances
				// This ensures no instances are lost if API response is incomplete
				const mergedConfigs = {
					...remainingConfigs,
					...updatedProviders,
				};

				// Update local state with merged result
				setLocalConfigs( mergedConfigs );

				// Update parent state with merged result
				if ( onConfigsUpdate ) {
					onConfigsUpdate( mergedConfigs );
				}
			} catch ( error ) {
				console.error( 'Failed to delete instance:', error );

				// Rollback optimistic update on error
				setLocalConfigs( originalConfigs );

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
			// Capture original state before optimistic update for rollback
			const originalConfigs = localConfigs;

			// Optimistic update: update local state immediately before API call
			const optimisticConfigs = {
				...localConfigs,
				[ instanceId ]: {
					...localConfigs[ instanceId ],
					instance_name: newName,
				},
			};
			setLocalConfigs( optimisticConfigs );

			try {
				const updatedProviders = await renameProviderInstance(
					instanceId,
					newName
				);

				// Merge API response with current local state to preserve all instances
				// This ensures no instances are lost if API response is incomplete
				const mergedConfigs = {
					...optimisticConfigs,
					...updatedProviders,
				};

				// Update local state with merged result
				setLocalConfigs( mergedConfigs );

				// Update parent configs state with merged result
				if ( onConfigsUpdate ) {
					onConfigsUpdate( mergedConfigs );
				}
			} catch ( error ) {
				console.error( 'Failed to rename instance:', error );

				// Rollback optimistic update on error
				setLocalConfigs( originalConfigs );

				// Re-throw to show error in UI
				throw error;
			}
		},
		[ renameProviderInstance, onConfigsUpdate, localConfigs ]
	);

	const handleConfigSave = useCallback(
		( instanceId, updatedConfig ) => {
			// Update local state immediately for reactivity
			const updatedConfigs = {
				...localConfigs,
				[ instanceId ]: updatedConfig,
			};
			setLocalConfigs( updatedConfigs );

			// Also update parent state
			if ( onConfigsUpdate ) {
				onConfigsUpdate( updatedConfigs );
			}
		},
		[ localConfigs, onConfigsUpdate ]
	);

	if ( loading ) {
		return (
			<div className="aether-provider-settings aether-provider-settings--loading">
				<LoadingSpinner />
			</div>
		);
	}

	if ( providers.length === 0 ) {
		return (
			<div className="aether-provider-settings aether-provider-settings--empty">
				<p
					className="aether-provider-settings__empty-message"
					style={ emptyMessageStyle }
				>
					{ __(
						'No providers available. Install a provider plugin to enable deployment options.',
						'aether-site-exporter'
					) }
				</p>
			</div>
		);
	}

	return (
		<div className="aether-provider-settings">
			<SectionHeader
				title={ __( 'Provider Instances', 'aether-site-exporter' ) }
				description={ __(
					'Create and manage multiple instances of each provider type. Each instance can have its own configuration and deployment settings.',
					'aether-site-exporter'
				) }
				className="aether-provider-settings__header"
				actions={
					<Button
						className="aether-provider-settings__add-button"
						variant="tertiary"
						onClick={ () => setIsAddModalOpen( true ) }
					>
						{ __(
							'Add Provider Instance',
							'aether-site-exporter'
						) }
					</Button>
				}
			/>

			{ /* Panels of All Provider Instances */ }
			{ allInstances.length > 0 ? (
				<div
					className="aether-provider-settings__panels-container"
					style={ panelsContainerStyle }
				>
					{ allInstances.map( ( instance ) => {
						const providerType =
							instance.config.provider_type ||
							instance.instanceId.split( ':' )[ 0 ];
						const fullProvider = providers.find(
							( p ) => p.id === providerType
						);

						return (
							<ProviderInstancePanel
								key={ instance.instanceId }
								provider={ {
									id: fullProvider?.id || providerType,
									metadata: {
										name:
											fullProvider?.name || providerType,
										description:
											fullProvider?.description || '',
										supportedDeploymentTypes:
											fullProvider?.deployment_types ||
											[],
										type: fullProvider?.type || '',
									},
									settingsFields: (
										fullProvider?.settings_fields || []
									).map( ( field ) => ( {
										...field,
										id: field.name,
									} ) ),
								} }
								instance={ {
									instanceId: instance.instanceId,
									config: instance.config,
								} }
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
								onSave={ handleConfigSave }
							/>
						);
					} ) }
				</div>
			) : (
				<div
					className="aether-provider-settings__empty-state"
					style={ emptyStateStyle }
				>
					{ __(
						'No provider instances configured. Click "Add Provider Instance" to create one.',
						'aether-site-exporter'
					) }
				</div>
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
