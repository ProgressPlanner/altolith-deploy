<?php
/**
 * Settings Page View
 *
 * Template for the main admin settings page.
 *
 * @package Altolith
 */

if (! \defined('ABSPATH')) {
	exit;
}

?>

<div class="wrap altolith-admin-settings-wrap">
	<div id="altolith-admin-settings">
		<!-- React will mount here -->
		<noscript>
			<div class="notice notice-error">
				<p><?php \esc_html_e('JavaScript is required for the Altolith settings page to function.', 'altolith-deploy'); ?></p>
			</div>
		</noscript>
	</div>
</div>

