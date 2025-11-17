<?php

/**
 * Autoloader for Aether Site Exporter classes
 *
 * @package Aether\SiteExporter
 */

// Exit if accessed directly.
if (! \defined('ABSPATH')) {
	exit;
}

\spl_autoload_register(
	function ($class) {
		// Only handle Aether\SiteExporter namespace.
		if (\strpos($class, 'Aether\\SiteExporter\\') !== 0) {
			 return;
		}

		// Remove the namespace prefix.
		$class = \str_replace('Aether\\SiteExporter\\', '', $class);

		// Convert namespace separators to directory separators.
		$class = \str_replace('\\', '/', $class);

		// Build the file path.
		$file = AETHER_SITE_EXPORTER_PLUGIN_DIR . 'includes/' . $class . '.php';

		// If the file exists, require it.
		if (\file_exists($file)) {
			require_once $file;
		}
	}
);
