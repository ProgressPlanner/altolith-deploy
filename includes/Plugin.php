<?php

/**
 * Main Plugin Class
 *
 * @package Altolith
 */

namespace Altolith\Deploy;

\defined('ABSPATH') || exit;
use Altolith\Deploy\Sync\AssetDiscoveryService;
use Altolith\Deploy\Utilities\TempDirectoryManager;
use Altolith\Deploy\Utilities\CorsHandler;
use Altolith\Deploy\Utilities\CookieManager;
use Altolith\Deploy\Utilities\SecurityValidator;
use Altolith\Deploy\Utilities\FileManager;
use Altolith\Deploy\Core\ProfileResolver;

/**
 * Main plugin orchestrator class.
 */
class Plugin
{
	/**
	 * Plugin instance.
	 *
	 * @var Plugin|null
	 */
	private static ?self $instance = null;

	/**
	 * Asset Discovery Service instance.
	 *
	 * @var AssetDiscoveryService
	 */
	private AssetDiscoveryService $assetDiscovery;

	/**
	 * CORS Handler instance.
	 *
	 * @var CorsHandler
	 */
	private CorsHandler $corsHandler;

	/**
	 * Cookie Manager instance.
	 *
	 * @var CookieManager
	 */
	private CookieManager $cookieManager;

	/**
	 * Profile Resolver instance.
	 *
	 * @var ProfileResolver
	 */
	private ProfileResolver $profileResolver;

	/**
	 * Get plugin instance.
	 *
	 * @return Plugin
	 */
	public static function getInstance(): self
	{
		if (null === self::$instance) {
			self::$instance = new self();
		}
		return self::$instance;
	}
	/**
	 * Constructor.
	 */
	private function __construct()
	{
		$this->init();
	}
	/**
	 * Initialize the plugin.
	 *
	 * @return void
	 */
	private function init(): void
	{
		// Initialize cookie manager first (needed for actions below).
		$this->cookieManager = new CookieManager();

		// Enable iframe cookie authentication by setting SameSite=None on WordPress auth cookies.
		// Required for WordPress Playground which runs in an iframe.
		\add_action('set_auth_cookie', [ $this->cookieManager, 'setSameSiteCookies' ], 10, 6);
		\add_action('set_logged_in_cookie', [ $this->cookieManager, 'setSameSiteCookies' ], 10, 6);

		// Force anonymous user context for static site generation requests.
		// This ensures fetched content matches anonymous visitor view, even if cookies/sessions are present.
		// Hook early (priority 1) before WordPress sets current user from cookies.
		\add_action('init', [ $this, 'forceAnonymousUser' ], 1);

		// Load translations at the proper time.
		\add_action('init', [ $this, 'loadTextdomain' ]);

		// Initialize asset discovery service.
		$this->assetDiscovery = new AssetDiscoveryService();

		// Initialize CORS handler.
		$this->corsHandler = new CorsHandler();

		// Initialize profile resolver (resolves profile references in provider configs).
		$this->profileResolver = new ProfileResolver();
		$this->profileResolver->init();

		// Initialize provider registry and register providers.
		$this->initProviders();

		// Initialize admin.
		if (\is_admin()) {
			new Admin\Settings();
		}

		// Initialize admin bar (available on both admin and frontend when admin bar is visible).
		$adminBar = new Admin\AdminBar($this);
		$adminBar->init();

		// Register REST API routes.
		\add_action('rest_api_init', [ $this, 'registerRestRoutes' ]);

		// Cleanup temporary export files daily (uses WordPress scheduled delete event)
		\add_action('wp_scheduled_delete', [ $this, 'cleanupExpiredExports' ]);

		// Fix PHP 8.1+ deprecation: ensure admin page titles are never null.
		\add_filter('admin_title', [ $this, 'ensureAdminTitleIsString' ], 1, 2);

		// Add filter to add data-provider-id attribute to provider script tags
		\add_filter('script_loader_tag', [ $this, 'addProviderScriptAttribute' ], 10, 2);

		// Advertise core provider scripts so they can be lazy-loaded by the
		// admin-bar export flow (via the admin-bar-dependencies endpoint), not
		// just on the settings page. Third-party providers hook the same filter.
		\add_filter('altolith_provider_scripts', [ $this, 'registerCoreProviderScripts' ]);

		// Remove emoji scripts for cleaner static site generation.
		$this->removeEmojiScripts();
	}


	/**
	 * Load plugin textdomain for translations.
	 *
	 * @return void
	 */
	public function loadTextdomain(): void
	{
		\load_plugin_textdomain(
			'altolith',
			false,
			\dirname(\plugin_basename(ALTOLITH_DEPLOY_PLUGIN_FILE)) . '/languages'
		);
	}

	/**
	 * Remove WordPress emoji scripts and styles.
	 *
	 * Emojis are not needed for static site generation and add unnecessary bloat.
	 *
	 * @return void
	 */
	private function removeEmojiScripts(): void
	{
		// Remove emoji detection script from frontend and admin.
		\remove_action('wp_head', 'print_emoji_detection_script', 7);
		\remove_action('admin_print_scripts', 'print_emoji_detection_script');

		// Remove emoji styles.
		\remove_action('wp_print_styles', 'print_emoji_styles');
		\remove_action('admin_print_styles', 'print_emoji_styles');

		// Remove emoji from TinyMCE.
		\remove_filter('the_content_feed', 'wp_staticize_emoji');
		\remove_filter('comment_text_rss', 'wp_staticize_emoji');
		\remove_filter('wp_mail', 'wp_staticize_emoji_for_email');

		// Remove TinyMCE emoji plugin.
		\add_filter(
			'tiny_mce_plugins',
			function ($plugins) {
				return \is_array($plugins) ? \array_diff($plugins, [ 'wpemoji' ]) : [];
			}
		);

		// Remove emoji DNS prefetch.
		\add_filter(
			'wp_resource_hints',
			function ($urls, $relationType) {
				if ('dns-prefetch' === $relationType) {
					$urls = \array_filter(
						$urls,
						function ($url) {
							return ! \str_contains($url, 's.w.org');
						}
					);
				}
				return $urls;
			},
			10,
			2
		);
	}



	/**
	 * Add inline script with REST API configuration data.
	 *
	 * Shared helper method used by multiple classes.
	 * Adds configuration data to window.altolithData for JavaScript access.
	 *
	 * @param string $scriptHandle Script handle to attach inline script to.
	 * @return void
	 */
	public function addAPIConfigScript(string $scriptHandle): void
	{
		// Base REST API URL (without namespace) - paths will include full namespace.
		$restUrl = \rest_url();
		$namespace = 'altolith/deploy/';
		$nonce   = \wp_create_nonce('wp_rest');
		$pluginUrl = (string) ALTOLITH_DEPLOY_PLUGIN_URL;
		$publicUrl = \home_url();
		$adminUrl = \admin_url();

		// Get global settings from database for JavaScript access.
		// This enables getEnabledOutputTypes() to work correctly.
		$settings = \get_option('altolith_deploy_settings', []);
		$globalSettings = $settings['global'] ?? [
			'exportStaticSite' => true,
			'exportBlueprint' => true,
			'crawlBatchSize' => 10,
		];

		$script = \sprintf(
			'window.altolithData = window.altolithData || {}; window.altolithData.restUrl = %s; window.altolithData.restNamespace = %s; window.altolithData.nonce = %s; window.altolithData.pluginUrl = %s; window.altolithData.publicUrl = %s; window.altolithData.adminUrl = %s; window.altolithData.globalSettings = %s;',
			\wp_json_encode($restUrl),
			\wp_json_encode($namespace),
			\wp_json_encode($nonce),
			\wp_json_encode($pluginUrl),
			\wp_json_encode($publicUrl),
			\wp_json_encode($adminUrl),
			\wp_json_encode($globalSettings)
		);

		\wp_add_inline_script($scriptHandle, $script, 'before');
	}

	/**
	 * Ensure admin page title is always a string (fixes PHP 8.1+ deprecation).
	 *
	 * WordPress Core's admin-header.php calls strip_tags() on the admin title,
	 * which triggers a deprecation warning if the title is null. This filter
	 * ensures the title is always a string.
	 *
	 * @param mixed $adminTitle The admin page title (may be null).
	 * @param mixed $title      The page title (may be null).
	 * @return string Always returns a string, never null.
	 */
	public function ensureAdminTitleIsString($adminTitle, $title): string
	{
		// Ensure both parameters are strings (convert null to empty string).
		$adminTitle = \is_string($adminTitle) ? $adminTitle : '';
		$title      = \is_string($title) ? $title : '';

		// Return the admin title if it's not empty, otherwise return the title.
		return !empty($adminTitle) ? $adminTitle : $title;
	}


	/**
	 * Enqueue provider script separately.
	 *
	 * Providers are compiled as separate bundles and loaded dynamically.
	 * This method enqueues the local-filesystem provider script with the
	 * data-provider-id attribute for providerLoader detection.
	 *
	 * @param string $providerId Provider ID (e.g., 'local-filesystem').
	 * @return void
	 */
	/**
	 * Register core provider scripts on the `altolith_provider_scripts` filter.
	 *
	 * This list is consumed by the admin-bar dependencies endpoint so the export
	 * modal triggered from the admin bar (on any page) loads the provider scripts
	 * that register providers into the shared ProviderRegistry. Without this the
	 * admin-bar export has no providers to deploy to.
	 *
	 * @param array<int, array<string, mixed>> $scripts Provider scripts collected so far.
	 * @return array<int, array<string, mixed>> Provider scripts including core providers.
	 */
	public function registerCoreProviderScripts(array $scripts): array
	{
		$scripts[] = $this->buildProviderScriptEntry(
			'altolith-provider-local-filesystem',
			ALTOLITH_DEPLOY_PLUGIN_URL,
			ALTOLITH_DEPLOY_PLUGIN_DIR,
			'provider-local-filesystem'
		);

		return $scripts;
	}

	/**
	 * Build a provider-script descriptor (handle, src, deps, version) from its
	 * compiled bundle + asset file. Shared shape for the provider-scripts filter.
	 *
	 * @param string $handle    Script handle.
	 * @param string $pluginUrl Plugin URL base.
	 * @param string $pluginDir Plugin directory base.
	 * @param string $bundle    Build bundle name (without extension).
	 * @return array{handle: string, src: string, dependencies: array<string>, version: string}
	 */
	public function buildProviderScriptEntry(string $handle, string $pluginUrl, string $pluginDir, string $bundle): array
	{
		$assetFile = $pluginDir . 'assets/build/' . $bundle . '.asset.php';
		$asset = \file_exists($assetFile) ? require $assetFile : [
			'dependencies' => [ 'wp-hooks', 'wp-i18n' ],
			'version'      => false,
		];

		return [
			'handle'       => $handle,
			'src'          => $pluginUrl . 'assets/build/' . $bundle . '.js',
			'dependencies' => $asset['dependencies'] ?? [],
			'version'      => $asset['version'] ?? '',
		];
	}

	public function enqueueProviderScript(string $providerId): void
	{
		$handle = 'altolith-provider-' . $providerId;

		// Only enqueue if not already enqueued
		if (\wp_script_is($handle, 'enqueued')) {
			return;
		}

		$pluginUrl = ALTOLITH_DEPLOY_PLUGIN_URL;

		// Load dependencies from asset file if it exists
		$assetFile = ALTOLITH_DEPLOY_PLUGIN_DIR . 'assets/build/provider-' . $providerId . '.asset.php';
		$asset = \file_exists($assetFile) ? require $assetFile : [
			'dependencies' => [],
			'version' => \time(),
		];

		\wp_enqueue_script(
			$handle,
			$pluginUrl . 'assets/build/provider-' . $providerId . '.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);
	}

	/**
	 * Add data-provider-id attribute to provider script tags.
	 *
	 * Filter callback for script_loader_tag to add data-provider-id attribute
	 * to provider script tags for providerLoader detection.
	 *
	 * @param string $tag        The script tag HTML.
	 * @param string $scriptHandle The script handle.
	 * @return string Modified script tag.
	 */
	public function addProviderScriptAttribute(string $tag, string $scriptHandle): string
	{
		// Check if this is a provider script (handle format: altolith-provider-{providerId})
		if (\strpos($scriptHandle, 'altolith-provider-') === 0) {
			// Extract provider ID from handle
			$providerId = \str_replace('altolith-provider-', '', $scriptHandle);

			// Add data-provider-id attribute to script tag
			$tag = \str_replace(
				'<script ',
				\sprintf('<script data-provider-id="%s" ', \esc_attr($providerId)),
				$tag
			);
		}

		return $tag;
	}



	/**
	 * Register REST API routes.
	 *
	 * Delegates to dedicated REST controller classes for better separation of concerns.
	 * @return void
	 */
	public function registerRestRoutes(): void
	{
		// Add CORS headers for all REST API requests (required for WordPress Playground).
		// Use multiple hooks to ensure headers are sent for both preflight and actual requests.
		\add_filter('rest_pre_dispatch', [ $this->corsHandler, 'handlePreflight' ], 10, 3);
		\add_filter('rest_pre_serve_request', [ $this->corsHandler, 'addHeadersFilter' ], 0, 4);
		\add_action('rest_send_cors_headers', [ $this->corsHandler, 'addHeadersAction' ]);

		// Initialize REST controllers.
		$settingsController = new REST\SettingsController();
		$providerConfigController = new REST\ProviderConfigController();
		$profilesController = new REST\ProfilesController();
		$assetsController = new REST\AssetsController();
		$localStorageController = new REST\LocalStorageController();
		$urlDiscoveryController = new REST\URLDiscoveryController();
		$adminBarDependenciesController = new REST\AdminBarDependenciesController();

		// Initialize export controllers.
		$exportStepsController = new REST\Export\ExportStepsController();
		$htmlFetchController = new REST\Export\HtmlFetchController();

		// Register routes from each controller.
		$settingsController->registerRoutes();
		$providerConfigController->registerRoutes();
		$profilesController->registerRoutes();
		$assetsController->registerRoutes();
		$localStorageController->registerRoutes();
		$urlDiscoveryController->registerRoutes();
		$adminBarDependenciesController->registerRoutes();

		// Register export routes.
		$exportStepsController->registerRoutes();
		$htmlFetchController->registerRoutes();
	}


	/**
	 * Force anonymous user context for static site generation requests.
	 *
	 * Detects requests from the Altolith Static Site Generator (via User-Agent header)
	 * and forces anonymous user context, ensuring fetched content matches what
	 * anonymous visitors see, regardless of cookies or PHP sessions.
	 *
	 * This provides a fallback mechanism in case JavaScript's `credentials: 'omit'`
	 * is insufficient (e.g., if WordPress uses server-side PHP sessions).
	 *
	 * @return void
	 */
	public function forceAnonymousUser(): void
	{
		// Check User-Agent header for Altolith Static Site Generator identifier.
		$userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? \sanitize_text_field(\wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '';

		// Also check for custom header as alternative detection method.
		$customHeader = isset($_SERVER['HTTP_X_ALTOLITH_DEPLOY_ANONYMOUS']) ? \sanitize_text_field(\wp_unslash($_SERVER['HTTP_X_ALTOLITH_DEPLOY_ANONYMOUS'])) : '';

		// Check for query parameter as another alternative.
		$queryParam = isset($_GET['altolith_deploy_anonymous']) ? \sanitize_text_field(\wp_unslash($_GET['altolith_deploy_anonymous'])) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		// If any indicator is present, force anonymous user context.
		if (
			'Altolith Static Site Generator' === $userAgent ||
			'true' === $customHeader ||
			'1' === $queryParam
		) {
			// Force WordPress to treat this request as anonymous.
			// This overrides any cookie-based or session-based authentication.
			\wp_set_current_user(0);
		}
	}


	/**
	 * Get the asset discovery service.
	 *
	 * @return AssetDiscoveryService
	 */
	public function getAssetDiscovery(): AssetDiscoveryService
	{
		return $this->assetDiscovery;
	}

	/**
	 * Cleanup expired temporary export files.
	 *
	 * Runs daily via WordPress 'wp_scheduled_delete' action.
	 * Removes temporary export files older than 1 hour to prevent disk exhaustion.
	 *
	 * Security: Prevents attackers from filling disk space with abandoned export files.
	 *
	 * @return void
	 */
	public function cleanupExpiredExports(): void
	{
		// Use TempDirectoryManager for cleanup (works in all environments).
		// Removes files older than 1 hour (3600 seconds).
		// Export jobs expire after 10 minutes, so 1 hour provides safety margin.
		TempDirectoryManager::cleanupExpiredFiles(3600);
	}

	/**
	 * Initialize provider hooks.
	 *
	 * Note: Provider metadata is now registered in JavaScript, not PHP.
	 * This only initializes PHP-side hooks for provider functionality.
	 *
	 * @return void
	 */
	private function initProviders(): void
	{
		// Register local-filesystem provider hooks for blueprint bundle uploads.
		$this->initLocalFilesystemProviderHooks();
	}

	/**
	 * Initialize hooks for local-filesystem provider.
	 *
	 * Registers action hook to handle blueprint bundle uploads for local-filesystem instances.
	 *
	 * @return void
	 */
	private function initLocalFilesystemProviderHooks(): void
	{
		/**
		 * Hook into blueprint bundle upload action.
		 *
		 * This action is fired when a blueprint bundle needs to be uploaded to a provider instance.
		 * Local-filesystem instances will copy the file to their configured export_path.
		 *
		 * @param string $instanceId      Provider instance ID (e.g., 'local-filesystem:abc-123' or 'local-filesystem-blueprint-bundle:abc-123').
		 * @param string $sourcePath      Source path of the generated blueprint bundle.
		 * @param string $destinationPath Destination path (instance's export_path).
		 * @param array  $context         Additional context data.
		 */
		\add_action('altolith_blueprint_bundle_upload', function ($instanceId, $sourcePath, $destinationPath, $context = []) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			// Only handle local-filesystem provider instances (including new split providers).
			if (!\is_string($instanceId) || \strpos($instanceId, 'local-filesystem') !== 0) {
				return;
			}

			// Validate instance exists.
			$settings = \get_option('altolith_deploy_settings', []);
			$instanceConfig = $settings['providers'][$instanceId] ?? null;

			if (!$instanceConfig) {
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Altolith: Local-filesystem instance not found: %s',
						$instanceId
					));
				}
				return;
			}

			// Use destination path from context or instance config.
			$exportPath = $destinationPath;
			if (empty($exportPath) && isset($instanceConfig['export_path'])) {
				$exportPath = $instanceConfig['export_path'];
			}

			if (empty($exportPath)) {
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Altolith: No export_path configured for instance: %s',
						$instanceId
					));
				}
				return;
			}

			// Copy the file directly (internal call to avoid HTTP overhead).
			$copyResult = $this->copyBlueprintBundleFile($sourcePath, $exportPath);

			if (!$copyResult) {
				// Log error if copy failed (the REST endpoint will verify and return error)
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Altolith: Failed to copy blueprint bundle for instance %s from %s to %s',
						$instanceId,
						$sourcePath,
						$exportPath
					));
				}
			}
		}, 10, 4);
	}

	/**
	 * Copy blueprint bundle file to destination path.
	 *
	 * Internal method to copy files without REST overhead.
	 *
	 * @param string $sourcePath      Source path relative to ABSPATH.
	 * @param string $destinationPath Destination path relative to ABSPATH.
	 * @return bool True on success, false on failure.
	 */
	private function copyBlueprintBundleFile(string $sourcePath, string $destinationPath): bool
	{
		// Build full paths - handle both absolute and relative paths.
		// Check if source path is already absolute.
		$isAbsolutePath = \preg_match('#^[/\\\\]#', $sourcePath) || \preg_match('#^[A-Za-z]:[/\\\\]#', $sourcePath);

		if ($isAbsolutePath) {
			// Path is absolute, use as-is (will be validated by PathValidator).
			$sourceFullPath = $sourcePath;
		} else {
			// Path is relative, prepend ABSPATH.
			$sourceFullPath = \rtrim(ABSPATH, '/') . '/' . \ltrim($sourcePath, '/');
		}

		// Destination path is always relative to ABSPATH.
		$destinationFullPath = \rtrim(ABSPATH, '/') . '/' . \ltrim($destinationPath, '/');

		// Validate paths using PathValidator.
		$sourceValidation = \Altolith\Deploy\Utilities\PathValidator::validatePath($sourceFullPath, ABSPATH, false);
		if (!$sourceValidation['valid']) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf('Altolith: Invalid source path: %s', $sourceValidation['error']));
			}
			return false;
		}

		$destinationValidation = \Altolith\Deploy\Utilities\PathValidator::validatePath($destinationFullPath, ABSPATH, false);
		if (!$destinationValidation['valid']) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf('Altolith: Invalid destination path: %s', $destinationValidation['error']));
			}
			return false;
		}

		// Verify source file exists.
		if (!\file_exists($sourceFullPath) || !\is_file($sourceFullPath)) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf('Altolith: Source file not found: %s', $sourcePath));
			}
			return false;
		}

		// Use FileManager to handle the actual copy operation.
		return FileManager::copyFile($sourceFullPath, $destinationFullPath);
	}
}
