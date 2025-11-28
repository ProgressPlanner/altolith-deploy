<?php

/**
 * Autoloader for Altolith Deploy classes
 *
 * @package Altolith\Deploy
 */

// Exit if accessed directly.
if (! \defined('ABSPATH')) {
	exit;
}

\spl_autoload_register(
	function ($class) {
		// Only handle Altolith\Deploy namespace.
		if (\strpos($class, 'Altolith\\Deploy\\') !== 0) {
			 return;
		}

		// Remove the namespace prefix.
		$class = \str_replace('Altolith\\Deploy\\', '', $class);

		// Convert namespace separators to directory separators.
		$class = \str_replace('\\', '/', $class);

		// Build the file path.
		$file = ALTOLITH_DEPLOY_PLUGIN_DIR . 'includes/' . $class . '.php';

		// If the file exists, require it.
		if (\file_exists($file)) {
			require_once $file;
		}
	}
);
