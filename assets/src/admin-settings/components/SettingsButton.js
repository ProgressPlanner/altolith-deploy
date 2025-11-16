/**
 * Settings Button Component
 *
 * @package
 */

import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cog } from '@wordpress/icons';

export default function SettingsButton( { onClick, disabled = false } ) {
	return (
		<Button
			className="aether-settings-button"
			variant="secondary"
			onClick={ onClick }
			disabled={ disabled }
			icon={ cog }
			aria-label={ __( 'Configure', 'aether-site-exporter' ) }
		/>
	);
}
