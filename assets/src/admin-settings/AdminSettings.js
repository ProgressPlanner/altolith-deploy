/**
 * Admin Settings Main Component
 *
 * Main admin settings page container.
 *
 * @package
 */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Button } from '@wordpress/components';
import PublishProgressModal from '../publish/components/PublishProgressModal';
import ProviderSettings from './ProviderSettings';
import { colors, spacing, fontWeight, createFlexStyle } from '../utils/styles';
import apiFetch from '../utils/api';

export default function AdminSettings() {
	const [ isExportModalOpen, setIsExportModalOpen ] = useState( false );
	const [ providerConfigs, setProviderConfigs ] = useState( {} );
	const [ notices, setNotices ] = useState( [] );

	// Add notice helper
	const addNotice = useCallback( ( message, status = 'error' ) => {
		const id = Date.now();
		setNotices( ( prev ) => [
			...prev,
			{ id, message, status, isDismissible: true },
		] );
		// Auto-dismiss after 5 seconds
		setTimeout( () => {
			setNotices( ( prev ) => prev.filter( ( n ) => n.id !== id ) );
		}, 5000 );
	}, [] );

	// Remove notice helper
	const removeNotice = useCallback( ( id ) => {
		setNotices( ( prev ) => prev.filter( ( n ) => n.id !== id ) );
	}, [] );

	// Load provider configs on mount
	useEffect( () => {
		const loadConfigs = async () => {
			try {
				const configsResponse = await apiFetch( {
					path: '/aether/site-exporter/settings?key=providers',
				} );

				if ( configsResponse.success && configsResponse.value ) {
					setProviderConfigs( configsResponse.value );
				}
			} catch ( err ) {
				console.error( 'Failed to load provider configs:', err );
			}
		};

		loadConfigs();
	}, [] );

	// Callback to update configs when a provider is toggled or configured
	const handleConfigsUpdate = useCallback( ( updatedConfigs ) => {
		setProviderConfigs( updatedConfigs );
	}, [] );

	const containerStyle = {
		padding: '1.25rem',
		maxWidth: '100%',
	};

	const headerStyle = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: spacing.xl,
		gap: spacing.md,
	};

	const headingStyle = {
		margin: 0,
		fontSize: '1.75rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
		flex: 1,
	};

	const sectionsStyle = {
		...createFlexStyle( 'column', spacing.lg ),
	};

	return (
		<div className="aether-admin-settings" style={ containerStyle }>
			<div
				className="aether-admin-settings__header"
				style={ headerStyle }
			>
				<h1
					className="aether-admin-settings__heading"
					style={ headingStyle }
				>
					{ __(
						'Aether Site Exporter Settings',
						'aether-site-exporter'
					) }
				</h1>
				<Button
					className="aether-admin-settings__export-button"
					variant="primary"
					onClick={ () => setIsExportModalOpen( true ) }
				>
					{ __( 'Export Site', 'aether-site-exporter' ) }
				</Button>
			</div>

			<div
				className="aether-admin-settings__sections"
				style={ sectionsStyle }
			>
				<Notice
					className="aether-admin-settings__notice aether-admin-settings__notice--info"
					status="info"
					isDismissible={ false }
				>
					{ __(
						'Aether Site Exporter allows you to export your WordPress site as a complete package.',
						'aether-site-exporter'
					) }
				</Notice>

				{ /* Dynamic notices */ }
				{ notices.map( ( notice ) => (
					<Notice
						key={ notice.id }
						className={ `aether-admin-settings__notice aether-admin-settings__notice--${ notice.status }` }
						status={ notice.status }
						isDismissible={ notice.isDismissible }
						onRemove={ () => removeNotice( notice.id ) }
					>
						{ notice.message }
					</Notice>
				) ) }

				<ProviderSettings
					providerConfigs={ providerConfigs }
					onConfigsUpdate={ handleConfigsUpdate }
					onNotice={ addNotice }
				/>
			</div>

			<PublishProgressModal
				isOpen={ isExportModalOpen }
				onClose={ () => setIsExportModalOpen( false ) }
			/>
		</div>
	);
}
