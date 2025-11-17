/**
 * Admin Settings Main Component
 *
 * Main admin settings page container.
 *
 * @package
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Button } from '@wordpress/components';
import PublishProgressModal from '../publish/components/PublishProgressModal';
import ProviderSettings from './ProviderSettings';
import { colors, spacing, fontWeight, createFlexStyle } from '../utils/styles';

export default function AdminSettings() {
	const [ isExportModalOpen, setIsExportModalOpen ] = useState( false );

	const containerStyle = {
		padding: '1.25rem',
		maxWidth: '60rem',
	};

	const headingStyle = {
		marginBottom: spacing.xl,
		fontSize: '1.75rem',
		fontWeight: fontWeight.semibold,
		color: colors.text,
	};

	const sectionsStyle = {
		...createFlexStyle( 'column', spacing.lg ),
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
				className="aether-admin-settings__sections"
				style={ sectionsStyle }
			>
				<Notice status="info" isDismissible={ false }>
					{ __(
						'Aether Site Exporter allows you to export your WordPress site as a complete package.',
						'aether-site-exporter'
					) }
				</Notice>

				<Button
					variant="primary"
					onClick={ () => setIsExportModalOpen( true ) }
					style={ { marginTop: spacing.md } }
				>
					{ __( 'Export Site', 'aether-site-exporter' ) }
				</Button>

				<ProviderSettings />
			</div>

			<PublishProgressModal
				isOpen={ isExportModalOpen }
				onClose={ () => setIsExportModalOpen( false ) }
			/>
		</div>
	);
}
