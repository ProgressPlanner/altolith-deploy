/**
 * Provider Settings Component
 *
 * Displays configuration form for the LocalFilesystem provider.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, CardBody, Spinner } from '@wordpress/components';
import ProviderRegistry from '../providers/registry/ProviderRegistry';
import ProviderForm from '../providers/components/ProviderForm';
import apiFetch from '../utils/api';
import { colors, spacing, fontWeight } from '../utils/styles';

/**
 * Provider Settings Component.
 *
 * @return {JSX.Element} Rendered component.
 */
export default function ProviderSettings() {
	const [ provider, setProvider ] = useState( null );
	const [ config, setConfig ] = useState( {} );
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		// Get LocalFilesystem provider from registry
		const localProvider =
			ProviderRegistry.getProvider( 'local-filesystem' );
		setProvider( localProvider );

		// Load existing configuration
		const loadConfig = async () => {
			try {
				const response = await apiFetch( {
					path: '/aether/site-exporter/settings?key=providers',
				} );

				if ( response.success && response.value ) {
					setConfig( response.value[ 'local-filesystem' ] || {} );
				}
			} catch ( error ) {
				console.error(
					'Failed to load provider configuration:',
					error
				);
			} finally {
				setLoading( false );
			}
		};

		loadConfig();
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

	if ( ! provider ) {
		return null;
	}

	const cardHeaderStyle = {
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

	return (
		<Card>
			<CardBody>
				<h2 style={ cardHeaderStyle }>
					{ __( 'Storage Configuration', 'aether-site-exporter' ) }
				</h2>
				<p style={ descriptionStyle }>
					{ __(
						'Configure where static site files will be stored on your server.',
						'aether-site-exporter'
					) }
				</p>

				<ProviderForm
					providerId="local-filesystem"
					fields={ provider.getConfigFields() }
					initialValues={ config }
				/>
			</CardBody>
		</Card>
	);
}
