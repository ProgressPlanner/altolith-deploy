/**
 * Provider Settings Component
 *
 * Displays configuration forms for all registered providers.
 * Each provider shows checkboxes for supported deployment types
 * and provider-specific configuration fields.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, CardBody, Spinner } from '@wordpress/components';
import ProviderForm from '../providers/components/ProviderForm';
import apiFetch from '../utils/api';
import { colors, spacing, fontWeight } from '../utils/styles';
import { DEPLOYMENT_TYPE_LABELS } from '../constants/deploymentTypes';

/**
 * Provider Settings Component.
 *
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderSettings() {
	const [ providers, setProviders ] = useState( [] );
	const [ configs, setConfigs ] = useState( {} );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		// Fetch providers from REST API (PHP registry is source of truth)
		const loadProviders = async () => {
			try {
				// Fetch provider metadata from REST API
				const providersResponse = await apiFetch( {
					path: '/aether/site-exporter/providers',
				} );

				if ( providersResponse.success && providersResponse.providers ) {
					// Transform REST API response to match component expectations
					const providerMetadata = providersResponse.providers.map(
						( provider ) => ( {
							id: provider.id,
							metadata: {
								name: provider.name,
								description: provider.description,
								supportedDeploymentTypes: provider.deployment_types || [],
								type: provider.type,
								icon: '', // Icon not provided by PHP, can be added later if needed
							},
							// Transform settings_fields: map 'name' to 'id' for ProviderForm compatibility
							settingsFields: ( provider.settings_fields || [] ).map(
								( field ) => ( {
									...field,
									id: field.name, // ProviderForm expects 'id' field
								} )
							),
						} )
					);

					setProviders( providerMetadata );
				}

				// Load existing configurations
				const configsResponse = await apiFetch( {
					path: '/aether/site-exporter/settings?key=providers',
				} );

				if ( configsResponse.success && configsResponse.value ) {
					setConfigs( configsResponse.value );
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
	}, [] );

	if ( loading ) {
		return (
			<Card>
				<CardBody>
					<div style={ { textAlign: 'center', padding: spacing.lg } }>
						<Spinner />
					</div>
				</CardBody>
			</Card>
		);
	}

	if ( providers.length === 0 ) {
		return (
			<Card>
				<CardBody>
					<p style={ { color: colors.textSecondary } }>
						{ __(
							'No providers available. Install a provider plugin to enable deployment options.',
							'aether-site-exporter'
						) }
					</p>
				</CardBody>
			</Card>
		);
	}

	const cardHeaderStyle = {
		marginBottom: spacing.md,
		fontSize: '1.25rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
	};

	const pageHeaderStyle = {
		marginBottom: spacing.lg,
		fontSize: '1.5rem',
		fontWeight: fontWeight.bold,
		color: colors.text,
	};

	const pageDescriptionStyle = {
		marginBottom: spacing.xl,
		color: colors.textSecondary,
		fontSize: '0.875rem',
	};

	const descriptionStyle = {
		marginBottom: spacing.lg,
		color: colors.textSecondary,
		fontSize: '0.875rem',
	};

	const providerIconStyle = {
		marginRight: spacing.sm,
		fontSize: '1.25rem',
	};

	const deploymentTypesStyle = {
		display: 'flex',
		flexWrap: 'wrap',
		gap: spacing.sm,
		marginBottom: spacing.md,
	};

	const badgeStyle = {
		display: 'inline-block',
		padding: `${ spacing.xs } ${ spacing.sm }`,
		backgroundColor: '#d7edff',
		color: '#135e96',
		borderRadius: '4px',
		fontSize: '0.75rem',
		fontWeight: fontWeight.medium,
	};

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

			{ providers.map( ( { id, metadata, settingsFields } ) => (
				<Card key={ id } style={ { marginBottom: spacing.lg } }>
					<CardBody>
						<div
							style={ {
								display: 'flex',
								alignItems: 'center',
								marginBottom: spacing.sm,
							} }
						>
							{ metadata.icon && (
								<span style={ providerIconStyle }>
									{ metadata.icon }
								</span>
							) }
							<h3 style={ cardHeaderStyle }>{ metadata.name }</h3>
						</div>

						{ metadata.description && (
							<p style={ descriptionStyle }>
								{ metadata.description }
							</p>
						) }

						{ /* Display supported deployment types as badges */ }
						{ metadata.supportedDeploymentTypes &&
							metadata.supportedDeploymentTypes.length > 0 && (
								<div style={ deploymentTypesStyle }>
									<strong
										style={ {
											marginRight: spacing.sm,
											color: colors.textSecondary,
										} }
									>
										{ __(
											'Supports:',
											'aether-site-exporter'
										) }
									</strong>
									{ metadata.supportedDeploymentTypes.map(
										( type ) => (
											<span
												key={ type }
												style={ badgeStyle }
											>
												{ DEPLOYMENT_TYPE_LABELS[
													type
												] || type }
											</span>
										)
									) }
								</div>
							) }

						{ /* Provider configuration form */ }
						<ProviderForm
							providerId={ id }
							fields={ settingsFields }
							initialValues={ configs[ id ] || {} }
						/>
					</CardBody>
				</Card>
			) ) }
		</div>
	);
}
