<?php

/**
 * Deactivation Prevented Admin Notice
 *
 * Template for the admin notice shown when plugin deactivation is prevented.
 *
 * @package Aether
 */

if (! \defined('ABSPATH')) {
	exit;
}
?>

<div class="notice notice-error is-dismissible">
	<p>
		<strong><?php \esc_html_e('Plugin Deactivation Prevented', 'aether-site-exporter'); ?></strong>
	</p>
	<p>
		<?php \esc_html_e('The Aether plugin is required for this site to function properly and cannot be deactivated.', 'aether-site-exporter'); ?>
	</p>
</div>
