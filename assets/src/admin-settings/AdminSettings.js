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
import {
	colors,
	spacing,
	fontWeight,
	createFlexStyle,
	borderRadius,
} from '../utils/styles';
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

	const headingStyle = {
		marginBottom: spacing.xl,
		fontSize: '1.75rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
	};

	const layoutStyle = {
		display: 'flex',
		gap: spacing.xl,
		alignItems: 'flex-start',
	};

	const mainContentStyle = {
		flex: 1,
		minWidth: 0, // Prevents flex item from overflowing
	};

	const sidebarStyle = {
		width: '300px',
		flexShrink: 0,
	};

	const sidebarContentStyle = {
		...createFlexStyle( 'column', spacing.lg ),
		position: 'sticky',
		top: spacing.lg,
	};

	const sectionsStyle = {
		...createFlexStyle( 'column', spacing.lg ),
	};

	const buttonStyle = {
		width: '100%',
		borderRadius: borderRadius.md,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: fontWeight.semibold,
		fontSize: '1rem',
		color: colors.white,
	};

	return (
		<div className="aether-admin-settings" style={ containerStyle }>
			<h1
				className="aether-admin-settings__heading"
				style={ headingStyle }
			>
				{ __(
					'Aether Site Exporter Settings',
					'aether-site-exporter'
				) }
			</h1>

			<div
				className="aether-admin-settings__layout"
				style={ layoutStyle }
			>
				{ /* Main Content */ }
				<div
					className="aether-admin-settings__main"
					style={ mainContentStyle }
				>
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
				</div>

				{ /* Sidebar */ }
				<div
					className="aether-admin-settings__sidebar"
					style={ sidebarStyle }
				>
					<div
						className="aether-admin-settings__sidebar-content"
						style={ sidebarContentStyle }
					>
						<Button
							className="aether-admin-settings__export-button"
							variant="primary"
							onClick={ () => setIsExportModalOpen( true ) }
							style={ buttonStyle }
						>
							{ __( 'Export Site', 'aether-site-exporter' ) }
						</Button>
					</div>
				</div>
			</div>

			<PublishProgressModal
				isOpen={ isExportModalOpen }
				onClose={ () => setIsExportModalOpen( false ) }
			/>
		</div>
	);
}
