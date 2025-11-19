/**
 * Per-Provider Deployment Types Component
 *
 * Allows setting deployment types for each provider individually.
 * All providers are displayed in a non-collapsible list.
 *
 * @package
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, CardBody, Notice, CheckboxControl } from '@wordpress/components';
import apiFetch from '../../utils/api';
import { colors, spacing, fontWeight } from '../../utils/styles';
import { DEPLOYMENT_TYPE_LABELS } from '../../constants/deploymentTypes';

/**
 * Per-Provider Deployment Types Component.
 *
 * @param {Object}   props                 Component props.
 * @param {Object}   props.providerConfigs Provider configurations from parent.
 * @param {Function} props.onConfigsUpdate Callback to update parent configs.
 * @return {JSX.Element} Rendered component.
 */
export default function GlobalDeploymentTypes( {
	providerConfigs = {},
	onConfigsUpdate,
} ) {
	const [ providers, setProviders ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( {} );
	const [ errors, setErrors ] = useState( {} );
	const configs = providerConfigs;

	useEffect( () => {
		// Load providers and configs
		const loadData = async () => {
			try {
				// Fetch providers from REST API
				const providersResponse = await apiFetch( {
					path: '/aether/site-exporter/providers',
				} );

				if (
					providersResponse.success &&
					providersResponse.providers
				) {
					setProviders( providersResponse.providers );
				}

				// Configs are now passed as props from parent
			} catch ( err ) {
				console.error(
					'Failed to load providers or configurations:',
					err
				);
			} finally {
				setLoading( false );
			}
		};

		loadData();
	}, [] );

	// Debounced save function
	const saveProviderDeploymentTypes = useCallback(
		async ( providerId, deploymentTypes ) => {
			// Clear any previous error
			setErrors( ( prev ) => {
				const newErrors = { ...prev };
				delete newErrors[ providerId ];
				return newErrors;
			} );

			setSaving( ( prev ) => ( { ...prev, [ providerId ]: true } ) );

			try {
				// Get current provider configs
				const configResponse = await apiFetch( {
					path: '/aether/site-exporter/settings?key=providers',
				} );

				if ( ! configResponse.success ) {
					throw new Error( 'Failed to load current settings' );
				}

				const currentProviderConfigs = configResponse.value || {};
				const currentConfig =
					currentProviderConfigs[ providerId ] || {};

				// Update deployment types
				const updatedConfig = {
					...currentConfig,
					deployment_types: deploymentTypes,
				};

				// Save with enabled state preserved
				const updatedProviders = {
					...currentProviderConfigs,
					[ providerId ]: updatedConfig,
				};

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
			} catch ( err ) {
				console.error(
					`Failed to save deployment types for ${ providerId }:`,
					err
				);
				setErrors( ( prev ) => ( {
					...prev,
					[ providerId ]:
						err.message ||
						__( 'Failed to save settings', 'aether-site-exporter' ),
				} ) );
			} finally {
				setSaving( ( prev ) => {
					const newSaving = { ...prev };
					delete newSaving[ providerId ];
					return newSaving;
				} );
			}
		},
		[ onConfigsUpdate ]
	);

	const handleDeploymentTypeChange = (
		providerId,
		deploymentType,
		checked
	) => {
		const currentConfig = configs[ providerId ] || {};
		// Get supported types for this provider
		const provider = providers.find( ( p ) => p.id === providerId );
		const supportedTypes = provider?.deployment_types || [];
		// Determine current types: if explicitly set (even if empty array), use it; otherwise default to all supported types
		const hasExplicitDeploymentTypes = 'deployment_types' in currentConfig;
		const currentTypes = hasExplicitDeploymentTypes
			? currentConfig.deployment_types || []
			: supportedTypes; // Default to all supported types if not explicitly set
		let newTypes;

		if ( checked ) {
			// Add deployment type if not already present
			if ( ! currentTypes.includes( deploymentType ) ) {
				newTypes = [ ...currentTypes, deploymentType ];
			} else {
				return; // Already in array
			}
		} else {
			// Remove deployment type
			newTypes = currentTypes.filter(
				( type ) => type !== deploymentType
			);
		}

		// Save to server (parent will receive updated configs via callback)
		saveProviderDeploymentTypes( providerId, newTypes );
	};

	if ( loading ) {
		return null;
	}

	const headerStyle = {
		marginBottom: spacing.md,
		fontSize: '1.25rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
	};

	const descriptionStyle = {
		marginBottom: spacing.lg,
		color: colors.textSecondary,
		fontSize: '0.875rem',
	};

	const providerItemStyle = {
		padding: spacing.md,
		borderBottom: `1px solid ${ colors.borderLight }`,
	};

	const providerItemLastStyle = {
		...providerItemStyle,
		borderBottom: 'none',
	};

	const providerNameStyle = {
		fontSize: '1rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
		marginBottom: spacing.xs,
	};

	const providerDescriptionStyle = {
		fontSize: '0.875rem',
		color: colors.textSecondary,
		marginBottom: spacing.sm,
	};

	const checkboxesContainerStyle = {
		display: 'flex',
		flexDirection: 'column',
		gap: spacing.xs,
	};

	if ( providers.length === 0 ) {
		return (
			<Card style={ { marginBottom: 0 } }>
				<CardBody>
					<p style={ { color: colors.textSecondary } }>
						{ __(
							'No providers available.',
							'aether-site-exporter'
						) }
					</p>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card style={ { marginBottom: 0 } }>
			<CardBody style={ { padding: 0 } }>
				<div style={ { padding: spacing.lg } }>
					<h3 style={ headerStyle }>
						{ __( 'Deployment Types', 'aether-site-exporter' ) }
					</h3>
					<p style={ descriptionStyle }>
						{ __(
							'Configure which deployment types each provider should handle.',
							'aether-site-exporter'
						) }
					</p>
				</div>

				{ providers
					.filter( ( provider ) => {
						// Only show enabled providers
						const providerConfig = configs[ provider.id ] || {};
						return providerConfig.enabled !== false;
					} )
					.map( ( provider, index, filteredProviders ) => {
						const providerConfig = configs[ provider.id ] || {};
						const supportedTypes = provider.deployment_types || [];
						// Determine deployment types: if explicitly set (even if empty array), use it; otherwise default to all supported types
						const hasExplicitDeploymentTypes =
							'deployment_types' in providerConfig;
						const deploymentTypes = hasExplicitDeploymentTypes
							? providerConfig.deployment_types || []
							: supportedTypes; // Default to all supported types if not explicitly set
						const isLast = index === filteredProviders.length - 1;
						const isSaving = saving[ provider.id ] || false;
						const error = errors[ provider.id ];

						return (
							<div
								key={ provider.id }
								style={
									isLast
										? providerItemLastStyle
										: providerItemStyle
								}
							>
								<div style={ providerNameStyle }>
									{ provider.name }
									{ isSaving && (
										<span
											style={ {
												marginLeft: spacing.sm,
												color: colors.textSecondary,
												fontSize: '0.875rem',
												fontWeight: fontWeight.normal,
											} }
										>
											{ __(
												'Saving…',
												'aether-site-exporter'
											) }
										</span>
									) }
								</div>
								{ provider.description && (
									<p style={ providerDescriptionStyle }>
										{ provider.description }
									</p>
								) }

								{ error && (
									<Notice
										status="error"
										isDismissible
										onRemove={ () =>
											setErrors( ( prev ) => {
												const newErrors = { ...prev };
												delete newErrors[ provider.id ];
												return newErrors;
											} )
										}
										style={ { marginBottom: spacing.sm } }
									>
										{ error }
									</Notice>
								) }

								{ supportedTypes.length > 0 ? (
									<div style={ checkboxesContainerStyle }>
										{ supportedTypes.map( ( type ) => (
											<CheckboxControl
												key={ type }
												label={
													DEPLOYMENT_TYPE_LABELS[
														type
													] || type
												}
												checked={ deploymentTypes.includes(
													type
												) }
												onChange={ ( checked ) =>
													handleDeploymentTypeChange(
														provider.id,
														type,
														checked
													)
												}
												disabled={ isSaving }
												__nextHasNoMarginBottom={ true }
											/>
										) ) }
									</div>
								) : (
									<p
										style={ {
											color: colors.textSecondary,
											fontSize: '0.875rem',
											fontStyle: 'italic',
										} }
									>
										{ __(
											'No deployment types supported.',
											'aether-site-exporter'
										) }
									</p>
								) }
							</div>
						);
					} ) }
			</CardBody>
		</Card>
	);
}
