<?php
/**
 * Meta Tags View
 *
 * Template for REST API meta tags output.
 *
 * @package Aether
 */

if (! \defined('ABSPATH')) {
	exit;
}

?>

<meta name="aether-rest-url" content="<?php echo \esc_attr(\rest_url('aether/v1/')); ?>">
<meta name="aether-rest-nonce" content="<?php echo \esc_attr(\wp_create_nonce('wp_rest')); ?>">
<meta name="aether-plugin-url" content="<?php echo \esc_attr((string) AETHER_SITE_EXPORTER_PLUGIN_URL); ?>">

