/**
 * Provider Actions Component
 *
 * Test connection and deploy worker buttons for providers.
 *
 * @package
 */

import { useState, useEffect } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useConnectionTest } from '../hooks/useConnectionTest';
import apiFetch from '../utils/api';
import { colors, spacing, createFlexStyle } from '../utils/styles';

export default function ProviderActions( {
	providerId,
	currentConfig = null,
} ) {
	const [ config, setConfig ] = useState( {} );
	const [ loadingConfig, setLoadingConfig ] = useState( true );

	// Load provider config for connection testing.
	useEffect( () => {
		const loadConfig = async () => {
			try {
				const response = await apiFetch( {
					path: '/aether/site-exporter/settings',
				} );

				if (
					response?.success &&
					response?.settings?.providers?.[ providerId ]
				) {
					setConfig( response.settings.providers[ providerId ] );
				}
			} catch ( err ) {
				// Silently fail - config will remain empty
			} finally {
				setLoadingConfig( false );
			}
		};

		if ( providerId ) {
			loadConfig();
		}
	}, [ providerId ] );

	// Use currentConfig if provided (from form), otherwise use saved config
	const testConfig =
		currentConfig && Object.keys( currentConfig ).length > 0
			? currentConfig
			: config;

	const {
		test,
		testing,
		result: testResult,
	} = useConnectionTest( providerId, testConfig );

	const handleTestConnection = async () => {
		await test();
	};

	const containerStyle = {
		marginTop: spacing.xl,
		paddingTop: spacing.xl,
		borderTop: `1px solid ${ colors.borderLight }`,
	};

	const buttonsStyle = {
		...createFlexStyle( 'row', spacing.md ),
		marginTop: spacing.md,
	};

	if ( loadingConfig && ! currentConfig ) {
		return null;
	}

	return (
		<div className="aether-provider-actions" style={ containerStyle }>
			{ testResult && (
				<Notice
					className={ `aether-provider-actions__notice aether-provider-actions__notice--${
						testResult.success ? 'success' : 'error'
					}` }
					status={ testResult.success ? 'success' : 'error' }
					isDismissible={ false }
					onRemove={ () => {} }
				>
					{ testResult.message }
				</Notice>
			) }

			<div
				className="aether-provider-actions__buttons"
				style={ buttonsStyle }
			>
				<Button
					className="aether-provider-actions__test-button"
					variant="secondary"
					onClick={ handleTestConnection }
					isBusy={ testing }
					disabled={ testing }
				>
					{ testing
						? __( 'Testing…', 'aether-site-exporter' )
						: __( 'Test Connection', 'aether-site-exporter' ) }
				</Button>
			</div>
		</div>
	);
}
