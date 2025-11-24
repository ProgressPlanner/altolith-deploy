/**
 * Provider Settings Component (Instance-Based)
 *
 * Displays provider types with their instances grouped together.
 * Each provider type section can have multiple named instances.
 *
 */

import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, ButtonGroup } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import ProviderInstancesContainer from '@aether/components/ProviderInstancesContainer';
import AddProviderInstanceModal from '@aether/components/AddProviderInstanceModal';
import LoadingSpinner from '@aether/components/LoadingSpinner';
import SectionHeader from '@aether/components/SectionHeader';
import { colors, spacing } from '@aether/utils/styles';
import { useProviderSettings } from '@aether/hooks/useProviderSettings';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';
import { DEPLOYMENT_TYPE_LABELS } from '@aether/constants/deploymentTypes';

// Styles - extracted to module level for performance
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
	const [ selectedDeploymentType, setSelectedDeploymentType ] =
		useState( null );

	// Local state for optimistic updates
	const [ localConfigs, setLocalConfigs ] = useState( providerConfigs );

	// Sync local state when parent prop changes
	useEffect( () => {
		setLocalConfigs( providerConfigs );
	}, [ providerConfigs ] );

	const configs = localConfigs;

	// Initialize provider settings hook
	const {
		createProviderInstance,
		deleteProviderInstance,
		renameProviderInstance,
	} = useProviderSettings();

	useEffect( () => {
		// Get providers from JavaScript registry
		const loadProviders = () => {
			try {
				// Get provider metadata from JavaScript registry
				const allProviders = ProviderRegistry.getAll();

				// If no providers, wait a bit for them to register
				if ( allProviders.length === 0 ) {
					let attempts = 0;
					const maxAttempts = 20;
					const interval = setInterval( () => {
						attempts++;
						const foundProviders = ProviderRegistry.getAll();
						if (
							foundProviders.length > 0 ||
							attempts >= maxAttempts
						) {
							clearInterval( interval );
							if ( foundProviders.length > 0 ) {
								processProviders( foundProviders );
							} else {
								setProviders( [] );
							}
						}
					}, 100 );
					return;
				}

				processProviders( allProviders );
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.error(
					'ProviderSettings: Failed to load providers:',
					error
				);
			}
		};

		const processProviders = ( allProviders ) => {
			const providerMetadata = allProviders.map( ( ProviderClass ) => {
				return {
					id: ProviderClass.ID,
					name: ProviderClass.NAME || '',
					description: ProviderClass.DESCRIPTION || '',
					type: ProviderClass.TYPE || 'generic',
					settings_fields: ProviderClass.CONFIG_FIELDS || [],
				};
			} );

			setProviders( providerMetadata );
		};

		loadProviders();

		// Configs are now managed by parent component
		// If parent hasn't loaded them yet, trigger initial load
		if ( onConfigsUpdate && Object.keys( configs ).length === 0 ) {
			apiFetch( {
				path: '/aether/site-exporter/settings?key=providers',
			} )
				.then( ( configsResponse ) => {
					if ( configsResponse.success && configsResponse.value ) {
						onConfigsUpdate( configsResponse.value );
					}
				} )
				.catch( ( error ) => {
					console.error(
						'Failed to load provider configurations:',
						error
					);
				} );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ onConfigsUpdate, configs ] );

	// Group providers by deployment type
	const providersByDeploymentType = useMemo( () => {
		const allProviderClasses = ProviderRegistry.getAll();
		const grouped = {};

		allProviderClasses.forEach( ( ProviderClass ) => {
			const deploymentType = ProviderClass.DEPLOYMENT_TYPE;
			if ( deploymentType ) {
				if ( ! grouped[ deploymentType ] ) {
					grouped[ deploymentType ] = [];
				}
				// Add provider metadata (matching the structure in providers state)
				const providerMetadata = providers.find(
					( p ) => p.id === ProviderClass.ID
				);
				if ( providerMetadata ) {
					grouped[ deploymentType ].push( providerMetadata );
				}
			}
		} );

		return grouped;
	}, [ providers ] );

	// Get unique deployment types that have at least one provider
	const availableDeploymentTypes = useMemo( () => {
		return Object.keys( providersByDeploymentType ).filter(
			( type ) => providersByDeploymentType[ type ].length > 0
		);
	}, [ providersByDeploymentType ] );

	// Create flat list of all instances with provider metadata
	// Filter out instances whose provider type is not registered (e.g., removed providers)
	const allInstances = useMemo(
		() =>
			Object.entries( configs )
				.map( ( [ instanceId, config ] ) => {
					const providerType =
						config.provider_type || instanceId.split( ':' )[ 0 ];
					const provider = providers.find(
						( p ) => p.id === providerType
					);

					// Skip instances whose provider type is not registered
					if ( ! provider ) {
						return null;
					}

					return {
						instanceId,
						config,
						provider,
					};
				} )
				.filter( ( instance ) => instance !== null ),
		[ configs, providers ]
	);

	const handleCreateInstanceConfirm = useCallback(
		async ( instanceId, providerType, instanceName ) => {
			// Optimistically add the new instance to local state
			const newInstance = {
				provider_type: providerType,
				instance_name: instanceName,
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
		[ createProviderInstance, onConfigsUpdate, localConfigs ]
	);

	const handleDeleteInstance = useCallback(
		async ( instanceId ) => {
			// Store previous state for rollback using functional update
			let previousConfigs;
			setLocalConfigs( ( prevConfigs ) => {
				previousConfigs = prevConfigs;
				// Optimistically remove from local state
				const { [ instanceId ]: removed, ...remainingConfigs } =
					prevConfigs;
				return remainingConfigs;
			} );

			try {
				// Delete from backend
				const updatedProviders =
					await deleteProviderInstance( instanceId );

				// Merge API response with remaining configs to preserve all instances
				// This ensures no instances are lost if API response is incomplete
				setLocalConfigs( ( prevConfigs ) => {
					const mergedConfigs = {
						...prevConfigs,
						...updatedProviders,
					};

					// Update parent state with merged result
					if ( onConfigsUpdate ) {
						onConfigsUpdate( mergedConfigs );
					}

					return mergedConfigs;
				} );
			} catch ( error ) {
				console.error( 'Failed to delete instance:', error );

				// Rollback optimistic update on error
				setLocalConfigs( previousConfigs );

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
		[ deleteProviderInstance, onConfigsUpdate, onNotice ]
	);

	const handleRenameInstance = useCallback(
		async ( instanceId, newName ) => {
			// Store previous state for rollback using functional update
			let previousConfigs;
			setLocalConfigs( ( prevConfigs ) => {
				previousConfigs = prevConfigs;
				// Optimistic update: update local state immediately before API call
				return {
					...prevConfigs,
					[ instanceId ]: {
						...prevConfigs[ instanceId ],
						instance_name: newName,
					},
				};
			} );

			try {
				const updatedProviders = await renameProviderInstance(
					instanceId,
					newName
				);

				// Merge API response with current local state to preserve all instances
				// This ensures no instances are lost if API response is incomplete
				setLocalConfigs( ( prevConfigs ) => {
					const mergedConfigs = {
						...prevConfigs,
						...updatedProviders,
					};

					// Update parent configs state with merged result
					if ( onConfigsUpdate ) {
						onConfigsUpdate( mergedConfigs );
					}

					return mergedConfigs;
				} );
			} catch ( error ) {
				console.error( 'Failed to rename instance:', error );

				// Rollback optimistic update on error
				setLocalConfigs( previousConfigs );

				// Re-throw to show error in UI
				throw error;
			}
		},
		[ renameProviderInstance, onConfigsUpdate ]
	);

	const handleConfigSave = useCallback(
		async ( instanceId, updatedConfig ) => {
			// Merge with existing config to preserve fields not in the form (like 'enabled')
			const mergedConfig = {
				...( localConfigs[ instanceId ] || {} ),
				...updatedConfig,
			};

			// Update local state immediately for reactivity (optimistic update)
			const updatedConfigs = {
				...localConfigs,
				[ instanceId ]: mergedConfig,
			};
			setLocalConfigs( updatedConfigs );

			try {
				// Save to API
				const saveResponse = await apiFetch( {
					path: '/aether/site-exporter/settings',
					method: 'POST',
					data: {
						key: 'providers',
						value: updatedConfigs,
					},
				} );

				if ( ! saveResponse.success ) {
					throw new Error(
						saveResponse.message || 'Failed to save settings'
					);
				}

				// Update parent state after successful save
				if ( onConfigsUpdate ) {
					onConfigsUpdate( updatedConfigs );
				}
			} catch ( error ) {
				// Rollback optimistic update on error
				setLocalConfigs( localConfigs );

				// Show error notification
				if ( onNotice ) {
					onNotice(
						`Failed to save settings: ${
							error.message || 'Unknown error'
						}`,
						'error'
					);
				}

				// Re-throw so child component can show error
				throw error;
			}
		},
		[ localConfigs, onConfigsUpdate, onNotice ]
	);

	if ( providers.length === 0 ) {
		return (
			<div className="aether-provider-settings aether-provider-settings--loading">
				<LoadingSpinner />
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
					<ButtonGroup>
						{ availableDeploymentTypes.map( ( deploymentType ) => (
							<Button
								key={ deploymentType }
								className="aether-provider-settings__add-button"
								variant="tertiary"
								onClick={ () =>
									setSelectedDeploymentType( deploymentType )
								}
							>
								{ sprintf(
									/* translators: %s: deployment type label */
									__(
										'Add %s Provider',
										'aether-site-exporter'
									),
									DEPLOYMENT_TYPE_LABELS[ deploymentType ] ||
										deploymentType
								) }
							</Button>
						) ) }
					</ButtonGroup>
				}
			/>

			{ /* Provider Instances Table */ }
			{ allInstances.length > 0 ? (
				<ProviderInstancesContainer
					instances={ allInstances }
					providers={ providers }
					onDelete={ handleDeleteInstance }
					onRename={ handleRenameInstance }
					onSave={ handleConfigSave }
				/>
			) : (
				<div
					className="aether-provider-settings__empty-state"
					style={ emptyStateStyle }
				>
					{ __(
						'No provider instances configured. Use the buttons above to create one.',
						'aether-site-exporter'
					) }
				</div>
			) }

			{ /* Add Instance Modal */ }
			<AddProviderInstanceModal
				isOpen={ selectedDeploymentType !== null }
				onClose={ () => setSelectedDeploymentType( null ) }
				providers={
					selectedDeploymentType
						? providersByDeploymentType[ selectedDeploymentType ] ||
						  []
						: providers
				}
				deploymentType={ selectedDeploymentType }
				onCreate={ handleCreateInstanceConfirm }
			/>
		</div>
	);
}
