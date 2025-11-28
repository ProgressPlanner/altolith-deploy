/**
 * Provider Settings Component (Instance-Based)
 *
 * Displays provider types with their instances grouped together.
 * Each provider type section can have multiple named instances.
 *
 */

import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, ButtonGroup } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import ProviderInstancesContainer from '@altolith/components/ProviderInstancesContainer';
import AddProviderInstanceModal from '@altolith/components/AddProviderInstanceModal';
import ExportConfigModal from '@altolith/components/ExportConfigModal';
import ImportConfigModal from '@altolith/components/ImportConfigModal';
import LoadingSpinner from '@altolith/components/LoadingSpinner';
import {
	colors,
	spacing,
	fontSize,
	commonStyles,
} from '@altolith/utils/styles';
import { useProviderSettings } from '@altolith/hooks/useProviderSettings';
import ProviderRegistry from '@altolith/providers/registry/ProviderRegistry';

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
	const [ isAddModalOpen, setIsAddModalOpen ] = useState( false );
	const [ isExportModalOpen, setIsExportModalOpen ] = useState( false );
	const [ isImportModalOpen, setIsImportModalOpen ] = useState( false );

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
				// Use getConfigFields() if available (includes output type fields)
				// Fall back to CONFIG_FIELDS for backwards compatibility
				const configFields =
					typeof ProviderClass.getConfigFields === 'function'
						? ProviderClass.getConfigFields()
						: ProviderClass.CONFIG_FIELDS || [];

				return {
					id: ProviderClass.ID,
					name: ProviderClass.NAME || '',
					description: ProviderClass.DESCRIPTION || '',
					type: ProviderClass.TYPE || 'generic',
					settings_fields: configFields,
				};
			} );

			setProviders( providerMetadata );
		};

		loadProviders();

		// Configs are now managed by parent component
		// If parent hasn't loaded them yet, trigger initial load
		if ( onConfigsUpdate && Object.keys( configs ).length === 0 ) {
			apiFetch( {
				path: '/altolith/deploy/settings?key=providers',
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
			// Merge with existing config to preserve fields not in the form
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
					path: '/altolith/deploy/settings',
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

	const handleImportConfigs = useCallback(
		async ( mergedConfigs ) => {
			try {
				const response = await apiFetch( {
					path: '/altolith/deploy/settings',
					method: 'POST',
					data: { key: 'providers', value: mergedConfigs },
				} );

				if ( ! response.success ) {
					throw new Error( response.message || 'Import failed' );
				}

				// Update local and parent state
				setLocalConfigs( mergedConfigs );
				if ( onConfigsUpdate ) {
					onConfigsUpdate( mergedConfigs );
				}

				// Show success notification
				if ( onNotice ) {
					onNotice(
						__(
							'Configuration imported successfully',
							'altolith-deploy'
						),
						'success'
					);
				}
			} catch ( error ) {
				// Re-throw to show error in modal
				throw error;
			}
		},
		[ onConfigsUpdate, onNotice ]
	);

	if ( providers.length === 0 ) {
		return (
			<div className="altolith-provider-settings altolith-provider-settings--loading">
				<LoadingSpinner />
			</div>
		);
	}

	// Section header styles
	const sectionHeaderStyle = {
		...commonStyles.sectionHeader,
		backgroundColor: colors.white,
	};

	const headerTitleStyle = {
		margin: 0,
		fontSize: '1.3em',
		lineHeight: 1.4,
		color: colors.text,
		backgroundColor: colors.white,
	};

	const headerDescriptionStyle = {
		margin: '0.5rem 0 1rem',
		color: colors.textMuted,
		fontSize: fontSize.base,
	};

	return (
		<div className="altolith-provider-settings">
			<div
				className="altolith-section-header altolith-provider-settings__header"
				style={ sectionHeaderStyle }
			>
				<div className="altolith-section-header__content">
					<h2
						className="altolith-section-header__title"
						style={ headerTitleStyle }
					>
						{ __( 'Provider Instances', 'altolith-deploy' ) }
					</h2>
					<p
						className="altolith-section-header__description"
						style={ headerDescriptionStyle }
					>
						{ __(
							'Create and manage multiple instances of each provider type. Each instance can have its own configuration and deployment settings.',
							'altolith-deploy'
						) }
					</p>
				</div>
				<div className="altolith-section-header__actions">
					<ButtonGroup>
						<Button
							className="altolith-provider-settings__add-button"
							variant="tertiary"
							onClick={ () => setIsAddModalOpen( true ) }
						>
							{ __( 'Add Provider', 'altolith-deploy' ) }
						</Button>
					</ButtonGroup>
					<ButtonGroup style={ { marginLeft: spacing.md } }>
						<Button
							className="altolith-provider-settings__export-button"
							variant="tertiary"
							onClick={ () => setIsExportModalOpen( true ) }
							disabled={ Object.keys( configs ).length === 0 }
						>
							{ __( 'Export Config', 'altolith-deploy' ) }
						</Button>
						<Button
							className="altolith-provider-settings__import-button"
							variant="tertiary"
							onClick={ () => setIsImportModalOpen( true ) }
						>
							{ __( 'Import Config', 'altolith-deploy' ) }
						</Button>
					</ButtonGroup>
				</div>
			</div>

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
					className="altolith-provider-settings__empty-state"
					style={ emptyStateStyle }
				>
					{ __(
						'No provider instances configured. Use the buttons above to create one.',
						'altolith-deploy'
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

			{ /* Export Config Modal */ }
			<ExportConfigModal
				isOpen={ isExportModalOpen }
				onClose={ () => setIsExportModalOpen( false ) }
				providerConfigs={ configs }
				providers={ providers }
			/>

			{ /* Import Config Modal */ }
			<ImportConfigModal
				isOpen={ isImportModalOpen }
				onClose={ () => setIsImportModalOpen( false ) }
				existingConfigs={ configs }
				onImport={ handleImportConfigs }
			/>
		</div>
	);
}
