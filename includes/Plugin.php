<?php

/**
 * Main Plugin Class
 *
 * @package Aether
 */

namespace Aether\SiteExporter;

\defined('ABSPATH') || exit;
use Aether\SiteExporter\Admin\PluginDependencyManager;
use Aether\SiteExporter\Sync\AssetDiscoveryService;
use Aether\SiteExporter\Utilities\TempDirectoryManager;
use Aether\SiteExporter\Providers\ProviderRegistry;
use Aether\SiteExporter\Providers\LocalFilesystemProvider;

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
		// Enable iframe cookie authentication by setting SameSite=None on WordPress auth cookies.
		// Required for WordPress Playground which runs in an iframe.
		\add_action('set_auth_cookie', [ $this, 'setSameSiteCookies' ], 10, 6);
		\add_action('set_logged_in_cookie', [ $this, 'setSameSiteCookies' ], 10, 6);

		// Force anonymous user context for static site generation requests.
		// This ensures fetched content matches anonymous visitor view, even if cookies/sessions are present.
		// Hook early (priority 1) before WordPress sets current user from cookies.
		\add_action('init', [ $this, 'forceAnonymousUser' ], 1);

		// Load translations at the proper time.
		\add_action('init', [ $this, 'loadTextdomain' ]);

		// Initialize plugin dependency manager.
		new PluginDependencyManager();

		// Initialize asset discovery service.
		$this->assetDiscovery = new AssetDiscoveryService();

		// Initialize provider registry and register providers.
		$this->initProviders();

		// Initialize admin.
		if (\is_admin()) {
			new Admin\Settings();
		}

		// Register REST API routes.
		\add_action('rest_api_init', [ $this, 'registerRestRoutes' ]);

		// Add provider discovery filters.
		\add_filter('aether_get_default_provider', [ $this, 'getDefaultProvider' ]);
		\add_filter('aether_get_provider_for_deployment_type', [ $this, 'getProviderForDeploymentType' ], 10, 2);

		// Cleanup temporary export files daily (uses WordPress scheduled delete event)
		\add_action('wp_scheduled_delete', [ $this, 'cleanupExpiredExports' ]);

		// Fix PHP 8.1+ deprecation: ensure admin page titles are never null.
		\add_filter('admin_title', [ $this, 'ensureAdminTitleIsString' ], 1, 2);

		// Always enqueue admin-common to ensure global variables are available
		\add_action('admin_enqueue_scripts', [ $this, 'enqueueAdminCommon' ]);
		\add_action('wp_enqueue_scripts', [ $this, 'enqueueAdminCommon' ]);

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
			'aether',
			false,
			\dirname(\plugin_basename(AETHER_SITE_EXPORTER_PLUGIN_FILE)) . '/languages'
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
	 * Output meta tags for REST API configuration.
	 *
	 * Shared helper method used by multiple classes.
	 *
	 * @return void
	 */
	public function outputMetaTags(): void
	{
		$viewPath = AETHER_SITE_EXPORTER_PLUGIN_DIR . 'views/admin/meta-tags.php';
		if (\file_exists($viewPath)) {
			include $viewPath;
		}
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
	 * Enqueue admin common script with global variables.
	 *
	 * Ensures global variables are always available for JavaScript.
	 *
	 * @return void
	 */
	public function enqueueAdminCommon(): void
	{
		// Only enqueue if not already enqueued
		if (\wp_script_is('aether-admin-common', 'enqueued')) {
			return;
		}

		$pluginUrl = AETHER_SITE_EXPORTER_PLUGIN_URL;

		// Load dependencies from asset file
		$assetFile = AETHER_SITE_EXPORTER_PLUGIN_DIR . 'assets/build/admin-common.asset.php';
		$asset = \file_exists($assetFile) ? require $assetFile : [
			'dependencies' => [],
			'version' => \time(),
		];

		\wp_enqueue_script(
			'aether-admin-common',
			$pluginUrl . 'assets/build/admin-common.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		// Set global variables
		\wp_add_inline_script(
			'aether-admin-common',
			\sprintf(
				'window.aether = window.aether || {}; window.aether.providerScriptsBaseUrl = %s; window.aether.pluginUrl = %s;',
				\wp_json_encode($pluginUrl . 'assets/build/'),
				\wp_json_encode($pluginUrl)
			),
			'before'
		);
	}



	/**
	 * Register REST API routes.
	 *
	 * Delegates to dedicated REST controller classes for better separation of concerns.
	 *
	 * @return void
	 */
	public function registerRestRoutes(): void
	{
		// Add CORS headers for all REST API requests (required for WordPress Playground).
		// Use multiple hooks to ensure headers are sent for both preflight and actual requests.
		\add_filter('rest_pre_dispatch', [ $this, 'handleCorsPreflight' ], 10, 3);
		\add_filter('rest_pre_serve_request', [ $this, 'addCorsHeadersFilter' ], 0, 4);
		\add_action('rest_send_cors_headers', [ $this, 'addCorsHeadersAction' ]);

		// Initialize REST controllers.
		$settingsController = new REST\SettingsController();
		$exportController  = new REST\ExportController($this);
		$providerConfigController = new REST\ProviderConfigController();
		$providersController = new REST\ProvidersController();
		$configController = new REST\ConfigController();
		$assetsController = new REST\AssetsController();
		$wporgCheckController = new REST\WPOrgCheckController();
		$localStorageController = new REST\LocalStorageController();
		$urlDiscoveryController = new REST\URLDiscoveryController();

		// Initialize publish controllers.
		$publishJobController = new REST\Publish\PublishJobController($this);
		$publishStepsController = new REST\Publish\PublishStepsController($this);

		// Register routes from each controller.
		$settingsController->registerRoutes();
		$exportController->registerRoutes();
		$providerConfigController->registerRoutes();
		$providersController->registerRoutes();
		$configController->registerRoutes();
		$assetsController->registerRoutes();
		$wporgCheckController->registerRoutes();
		$localStorageController->registerRoutes();
		$urlDiscoveryController->registerRoutes();

		// Register publish routes.
		$publishJobController->registerRoutes();
		$publishStepsController->registerRoutes();
	}

	/**
	 * Handle CORS preflight requests (OPTIONS).
	 *
	 * WordPress REST API doesn't automatically handle OPTIONS requests for CORS.
	 * This method intercepts OPTIONS requests and sends appropriate CORS headers.
	 *
	 * @param mixed           $result  Response to replace the requested value with.
	 * @param \WP_REST_Server $server  Server instance.
	 * @param \WP_REST_Request $request Request used to generate the response.
	 * @return mixed Response or null to continue with normal processing.
	 */
	public function handleCorsPreflight($result, $server, $request)
	{
		// Only handle OPTIONS requests for Aether endpoints.
		if ($request->get_method() !== 'OPTIONS') {
			return $result;
		}

		$route = $request->get_route();
		if (! \str_starts_with($route, '/aether/')) {
			return $result;
		}

		// Send CORS headers for preflight request.
		$this->sendCorsHeaders();

		// Return empty response for OPTIONS request.
		return new \WP_REST_Response(null, 204);
	}

	/**
	 * Add CORS headers via filter (rest_pre_serve_request).
	 *
	 * @param bool              $served Whether the request has already been served.
	 * @param \WP_REST_Response $result Response data.
	 * @param mixed             $request Request object (may be WP_REST_Request or other types).
	 * @param \WP_REST_Server   $server Server instance.
	 * @return bool Unchanged served status.
	 */
	public function addCorsHeadersFilter($served, $result, $request, $server) // phpcs:ignore VariableAnalysis.CodeAnalysis
	{
		// Only add headers for Aether endpoints
		if ($request instanceof \WP_REST_Request) {
			$route = $request->get_route();
			if (! \str_starts_with($route, '/aether/')) {
				return $served;
			}
		}

		$this->sendCorsHeaders();

		return $served;
	}

	/**
	 * Add CORS headers via action (rest_send_cors_headers).
	 *
	 * @return void
	 */
	public function addCorsHeadersAction(): void
	{
		// Get current request from global REST server
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- WordPress global variable
		global $wp_rest_server; // phpcs:ignore Squiz.NamingConventions.ValidVariableName.NotCamelCaps
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- WordPress global variable
		if (! $wp_rest_server) { // phpcs:ignore Squiz.NamingConventions.ValidVariableName.NotCamelCaps
			return;
		}

		// Check if this is an Aether endpoint by checking the request URI
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- CORS headers don't need nonce
		$requestUri = \sanitize_text_field(\wp_unslash($_SERVER['REQUEST_URI'] ?? ''));
		if (! \str_contains($requestUri, '/wp-json/aether/')) {
			return;
		}

		$this->sendCorsHeaders();
	}

	/**
	 * Send CORS headers.
	 *
	 * Internal method to actually send the headers with origin whitelisting.
	 *
	 * @return void
	 */
	private function sendCorsHeaders(): void
	{
		// Prevent duplicate headers.
		if (\headers_sent()) {
			return;
		}

		// Get the origin from the request
		$origin = isset($_SERVER['HTTP_ORIGIN']) ? \esc_url_raw(\wp_unslash($_SERVER['HTTP_ORIGIN'])) : '';

		// Define allowed origins (WordPress Playground and local development)
		$allowedOrigins = [
			'https://playground.wordpress.net',
			'https://wasm.wordpress.net',
		];

		// Allow same-origin requests (current site)
		$siteUrl = \get_site_url();
		if ($siteUrl) {
			$allowedOrigins[] = $siteUrl;
		}

		// Allow local development origins (requires explicit opt-in for security)
		// Define AETHER_ALLOW_LOCAL_CORS in wp-config.php to enable
		if (\defined('WP_DEBUG') && WP_DEBUG && \defined('AETHER_ALLOW_LOCAL_CORS') && constant('AETHER_ALLOW_LOCAL_CORS')) {
			// Security: Only allow common development ports to reduce attack surface
			$commonDevPorts = ['3000', '3001', '8000', '8080', '8888'];

			// Allow localhost with common dev ports
			if ($origin && \preg_match('/^https?:\/\/localhost:(\d+)$/', $origin, $matches)) {
				if (\in_array($matches[1], $commonDevPorts, true)) {
					$allowedOrigins[] = $origin;
				}
			}

			// Allow 127.0.0.1 with common dev ports
			if ($origin && \preg_match('/^https?:\/\/127\.0\.0\.1:(\d+)$/', $origin, $matches)) {
				if (\in_array($matches[1], $commonDevPorts, true)) {
					$allowedOrigins[] = $origin;
				}
			}
		}

		// Allow WordPress Playground dynamic subdomains (e.g., https://playground.wordpress.net/*)
		// These are safe because they're official WordPress infrastructure
		$isPlaygroundOrigin = $origin && (
			\str_starts_with($origin, 'https://playground.wordpress.net') ||
			\str_starts_with($origin, 'https://wasm.wordpress.net')
		);
		if ($isPlaygroundOrigin) {
			$allowedOrigins[] = $origin;
		}

		// Apply filter to allow developers to add custom allowed origins
		$allowedOrigins = \apply_filters('aether_site_exporter_cors_allowed_origins', $allowedOrigins);

		// Check if the request origin is in the allowed list
		if ($origin && \in_array($origin, $allowedOrigins, true)) {
			\header('Access-Control-Allow-Origin: ' . $origin);
			\header('Access-Control-Allow-Credentials: true');
		} elseif (!$origin) {
			// No origin header (same-origin request or non-browser client)
			// Allow it but don't send CORS headers
			return;
		} else {
			// Origin not allowed - don't send CORS headers
			// The browser will block the request
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Blocked CORS request from disallowed origin: %s',
					$origin
				));
			}
			return;
		}

		\header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
		\header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce');
		\header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours.
	}

	/**
	 * Force anonymous user context for static site generation requests.
	 *
	 * Detects requests from the Aether Static Site Generator (via User-Agent header)
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
		// Check User-Agent header for Aether Static Site Generator identifier.
		$userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? \sanitize_text_field(\wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '';

		// Also check for custom header as alternative detection method.
		$customHeader = isset($_SERVER['HTTP_X_AETHER_SITE_EXPORTER_ANONYMOUS']) ? \sanitize_text_field(\wp_unslash($_SERVER['HTTP_X_AETHER_SITE_EXPORTER_ANONYMOUS'])) : '';

		// Check for query parameter as another alternative.
		$queryParam = isset($_GET['aether_site_exporter_anonymous']) ? \sanitize_text_field(\wp_unslash($_GET['aether_site_exporter_anonymous'])) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		// If any indicator is present, force anonymous user context.
		if (
			'Aether Static Site Generator' === $userAgent ||
			'true' === $customHeader ||
			'1' === $queryParam
		) {
			// Force WordPress to treat this request as anonymous.
			// This overrides any cookie-based or session-based authentication.
			\wp_set_current_user(0);
		}
	}

	/**
	 * Set SameSite=None on WordPress authentication cookies.
	 *
	 * Required for WordPress Playground which runs in an iframe.
	 * Modern browsers block third-party cookies by default unless SameSite=None is set.
	 *
	 * @param string $authCookie    Authentication cookie value.
	 * @param int    $expire        Cookie expiration time.
	 * @param int    $expiration    Session expiration timestamp.
	 * @param int    $userId        User ID.
	 * @param string $scheme        Authentication scheme.
	 * @param string $token         Session token.
	 * @return void
	 */
	public function setSameSiteCookies($authCookie, $expire, $expiration, $userId, $scheme, $token): void // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	{
		// Determine which cookies to set based on the action hook.
		$action = \current_action();

		// Check if site is using HTTPS or if this is a secure auth scheme
		// SameSite=None requires Secure flag, but Secure flag requires HTTPS
		$isSecure = \is_ssl() || ('secure_auth' === $scheme);

		// Use SameSite=None for HTTPS (allows cross-site/iframe usage)
		// Fall back to SameSite=Lax for HTTP sites (still reasonably secure)
		$sameSite = $isSecure ? 'None' : 'Lax';

		if ('set_auth_cookie' === $action) {
			// Set the auth cookie (can be AUTH_COOKIE or SECURE_AUTH_COOKIE based on scheme).
			$authCookieName = $isSecure ? SECURE_AUTH_COOKIE : AUTH_COOKIE;

			\setcookie(
				$authCookieName,
				$authCookie,
				[
					'expires'  => $expire,
					'path'     => PLUGINS_COOKIE_PATH,
					'domain'   => COOKIE_DOMAIN,
					'secure'   => $isSecure,
					'httponly' => true,
					'samesite' => $sameSite,
				]
			);

			\setcookie(
				$authCookieName,
				$authCookie,
				[
					'expires'  => $expire,
					'path'     => ADMIN_COOKIE_PATH,
					'domain'   => COOKIE_DOMAIN,
					'secure'   => $isSecure,
					'httponly' => true,
					'samesite' => $sameSite,
				]
			);
		} elseif ('set_logged_in_cookie' === $action) {
			// Set the logged-in cookie.
			\setcookie(
				LOGGED_IN_COOKIE,
				$authCookie,
				[
					'expires'  => $expire,
					'path'     => COOKIEPATH,
					'domain'   => COOKIE_DOMAIN,
					'secure'   => $isSecure,
					'httponly' => true,
					'samesite' => $sameSite,
				]
			);

			\setcookie(
				LOGGED_IN_COOKIE,
				$authCookie,
				[
					'expires'  => $expire,
					'path'     => SITECOOKIEPATH,
					'domain'   => COOKIE_DOMAIN,
					'secure'   => $isSecure,
					'httponly' => true,
					'samesite' => $sameSite,
				]
			);
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
	 * Initialize provider registry and register providers.
	 *
	 * @return void
	 */
	private function initProviders(): void
	{
		// Register local filesystem provider via filter.
		\add_filter('aether_providers', function ($providers) {
			$providers[] = new LocalFilesystemProvider();
			return $providers;
		});

		// Initialize registry (will discover providers via filter).
		ProviderRegistry::getInstance();

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
		 * @param string $instanceId      Provider instance ID (e.g., 'local-filesystem:abc-123').
		 * @param string $sourcePath      Source path of the generated blueprint bundle.
		 * @param string $destinationPath Destination path (instance's export_path).
		 * @param array  $context         Additional context data.
		 */
		\add_action('aether_blueprint_bundle_upload', function ($instanceId, $sourcePath, $destinationPath) {
			// Only handle local-filesystem provider instances.
			if (!\is_string($instanceId) || \strpos($instanceId, 'local-filesystem:') !== 0) {
				return;
			}

			// Validate instance exists and is enabled.
			$settings = \get_option('aether_site_exporter_settings', []);
			$instanceConfig = $settings['providers'][$instanceId] ?? null;

			if (!$instanceConfig) {
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Aether: Local-filesystem instance not found: %s',
						$instanceId
					));
				}
				return;
			}

			// Check if instance is enabled.
			if (isset($instanceConfig['enabled']) && $instanceConfig['enabled'] === false) {
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Aether: Local-filesystem instance is disabled: %s',
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
						'Aether: No export_path configured for instance: %s',
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
						'Aether: Failed to copy blueprint bundle for instance %s from %s to %s',
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
		// Security: Validate paths.
		// Note: Source paths can be absolute (from blueprint bundle generation) or relative
		// PathValidator will ensure absolute paths are within ABSPATH
		// Destination paths must always be relative (from instance config)
		if (
			\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $sourcePath) ||
			\strpos($sourcePath, "\0") !== false ||
			\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $destinationPath) ||
			\preg_match('#^[/\\\\]#', $destinationPath) ||
			\strpos($destinationPath, "\0") !== false
		) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log('Aether: Invalid path for blueprint bundle copy');
			}
			return false;
		}

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
		$destinationDir = \dirname($destinationFullPath);

		// Validate paths using PathValidator.
		$sourceValidation = \Aether\SiteExporter\Utilities\PathValidator::validatePath($sourceFullPath, ABSPATH, false);
		if (!$sourceValidation['valid']) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf('Aether: Invalid source path: %s', $sourceValidation['error']));
			}
			return false;
		}

		$destinationValidation = \Aether\SiteExporter\Utilities\PathValidator::validatePath($destinationFullPath, ABSPATH, false);
		if (!$destinationValidation['valid']) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf('Aether: Invalid destination path: %s', $destinationValidation['error']));
			}
			return false;
		}

		// Verify source file exists.
		if (!\file_exists($sourceFullPath) || !\is_file($sourceFullPath)) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf('Aether: Source file not found: %s', $sourcePath));
			}
			return false;
		}

		// Create destination directory if needed.
		if (!\is_dir($destinationDir)) {
			if (!\wp_mkdir_p($destinationDir)) {
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf('Aether: Failed to create destination directory: %s', $destinationDir));
				}
				return false;
			}
		}

		// Copy file.
		if (!\copy($sourceFullPath, $destinationFullPath)) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Failed to copy blueprint bundle from %s to %s',
					$sourcePath,
					$destinationPath
				));
			}
			return false;
		}

		// Track file for persistence monitoring.
		\Aether\SiteExporter\Utilities\FileManager::trackFile(
			$destinationFullPath,
			'copy',
			[
				'source_path'      => $sourcePath,
				'destination_path' => $destinationPath,
				'size'             => \filesize($destinationFullPath),
			]
		);

		return true;
	}

	/**
	 * Get default provider ID.
	 *
	 * Filter hook for getting the default provider.
	 *
	 * @param string|null $providerId Default provider ID (null if not set).
	 * @return string Provider ID
	 */
	public function getDefaultProvider(?string $providerId = null): string
	{
		$registry = ProviderRegistry::getInstance();
		$default = $registry->getDefault();
		return $default ? $default->getId() : ($providerId ?? '');
	}

	/**
	 * Get provider ID for a deployment type.
	 *
	 * Filter hook for getting provider by deployment type.
	 *
	 * @param string|null $providerId Provider ID (null if not set).
	 * @param string      $deploymentType Deployment type.
	 * @return string Provider ID
	 */
	public function getProviderForDeploymentType(?string $providerId = null, string $deploymentType = ''): string
	{
		$registry = ProviderRegistry::getInstance();
		$provider = $registry->getForDeploymentType($deploymentType);
		return $provider ? $provider->getId() : ($providerId ?? '');
	}
}
