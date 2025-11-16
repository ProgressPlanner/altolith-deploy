<?php

/**
 * Blueprint Step Factory
 *
 * Creates WordPress Playground blueprint steps for plugins, themes, and system components.
 * Handles step generation for various installation and configuration tasks.
 *
 * @package Aether\Sync\Blueprint
 */

namespace Aether\SiteExporter\Sync\Blueprint;

/**
 * Factory class for creating WordPress Playground blueprint steps.
 */
class BlueprintStepFactory
{
	/**
	 * Create a WordPress.org plugin installation step for the blueprint.
	 *
	 * Note: Custom plugins are included in wp-content.zip, not installed separately.
	 *
	 * @param array<string, mixed> $pluginData Plugin data (must be from wordpress.org).
	 * @return array<string, mixed> Blueprint step.
	 */
	public function createPluginStep(array $pluginData)
	{
		// WordPress.org plugins - install from repository using installPlugin step.
		// Note: activate=false - activation state will be restored from database import.
		$step = [
			'step'       => 'installPlugin',
			'pluginData' => [
				'resource' => 'wordpress.org/plugins',
				'slug'     => $pluginData['slug'],
			],
			'options'    => [
				'activate' => false,
			],
		];
		return $step;
	}

	/**
	 * Create a WordPress.org theme installation step for the blueprint.
	 *
	 * Note: Custom themes are included in wp-content.zip, not installed separately.
	 *
	 * @param array<string, mixed> $themeData Theme data (must be from wordpress.org).
	 * @return array<string, mixed> Blueprint step.
	 */
	public function createThemeStep(array $themeData)
	{
		// WordPress.org themes - install from repository using installTheme step.
		// Note: activate=false - activation state will be restored from database import.
		$step = [
			'step'      => 'installTheme',
			'themeData' => [
				'resource' => 'wordpress.org/themes',
				'slug'     => $themeData['slug'],
			],
			'options'   => [
				'activate' => false,
			],
		];
		return $step;
	}
}
