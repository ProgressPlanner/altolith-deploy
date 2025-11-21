<?php
/**
 * Settings Page View
 *
 * Template for the main admin settings page.
 *
 * @package Aether
 */

if (! \defined('ABSPATH')) {
	exit;
}

?>

<div class="wrap aether-admin-settings-wrap">
	<div id="aether-admin-settings">
		<!-- React will mount here -->
		<noscript>
			<div class="notice notice-error">
				<p><?php \esc_html_e('JavaScript is required for the Aether settings page to function.', 'aether-site-exporter'); ?></p>
			</div>
		</noscript>
	</div>
</div>

