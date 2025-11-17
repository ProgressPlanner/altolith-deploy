<?php

/**
 * Main Plugin Class
 *
 * @package Aether
 */

namespace Aether\SiteExporter;

\defined('ABSPATH') || exit;
use Aether\SiteExporter\Admin\PluginDependencyManager;
use Aether\SiteExporter\Sync\Blueprint\AssetDiscoveryService;

use function Aether\SiteExporter\getStorageConfig;
/**
 * Main plugin orchestrator class.
 */
class Plugin
{
	/**
	 * WordPress Playground base URL.
	 *
	 * @var string
	 */
	private const PLAYGROUND_URL = 'https://static-wp.s12y.org/index.html';

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
	 * Cached numbered chunks to avoid repeated filesystem scans.
	 *
	 * @var array<string>|null
	 */
	private ?array $cachedNumberedChunks = null;

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

		// Initialize admin.
		if (\is_admin()) {
			new Admin\Settings();
		}

		// Register REST API routes.
		\add_action('rest_api_init', [ $this, 'registerRestRoutes' ]);

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
		?>
		<meta name="aether-rest-url" content="<?php echo \esc_attr(\rest_url('aether/v1/')); ?>">
		<meta name="aether-rest-nonce" content="<?php echo \esc_attr(\wp_create_nonce('wp_rest')); ?>">
		<meta name="aether-plugin-url" content="<?php echo \esc_attr((string) AETHER_SITE_EXPORTER_PLUGIN_URL); ?>">
		<?php
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
	 * Discover numbered webpack chunk files.
	 *
	 * Scans the build directory for numbered chunk files (e.g., 408.js, 983.js).
	 * Results are cached to avoid repeated filesystem scans.
	 *
	 * @param string $pluginDir Plugin directory path.
	 * @return array<string> Array of chunk numbers found (e.g., ['408', '983']).
	 */
	private function discoverNumberedChunks(string $pluginDir): array
	{
		// Return cached result if available
		if ($this->cachedNumberedChunks !== null) {
			return $this->cachedNumberedChunks;
		}

		$buildDir = $pluginDir . 'assets/build/';
		$chunks = [];

		if (! \is_dir($buildDir)) {
			$this->cachedNumberedChunks = $chunks;
			return $chunks;
		}

		$files = \scandir($buildDir);
		if ($files === false) {
			$this->cachedNumberedChunks = $chunks;
			return $chunks;
		}

		foreach ($files as $file) {
			// Match numbered chunk files (e.g., 408.js, 983.js)
			if (\preg_match('/^(\d+)\.js$/', $file, $matches)) {
				$chunks[] = $matches[1];
			}
		}

		// Cache the result
		$this->cachedNumberedChunks = $chunks;
		return $chunks;
	}

	/**
	 * Get chunk handles for a list of chunk names.
	 *
	 * Helper method to convert chunk names to WordPress script handles.
	 *
	 * @param array<string> $namedChunks Named chunks (e.g., ['common', 'vendor']).
	 * @param bool          $includeNumbered Whether to include numbered chunks.
	 * @return array<string> Array of chunk handles.
	 */
	public function getChunkHandles(array $namedChunks, bool $includeNumbered = false): array
	{
		$chunkHandles = [];

		if ($includeNumbered) {
			$numberedChunks = $this->discoverNumberedChunks((string) AETHER_SITE_EXPORTER_PLUGIN_DIR);
			$namedChunks = \array_merge($numberedChunks, $namedChunks);
		}

		foreach ($namedChunks as $chunkName) {
			$chunkHandles[] = "aether-chunk-{$chunkName}";
		}

		return $chunkHandles;
	}

	/**
	 * Enqueue webpack chunks for a script.
	 *
	 * Automatically enqueues required webpack chunks based on the script handle.
	 *
	 * @param string $scriptHandle The script handle to enqueue chunks for.
	 * @return void
	 */
	public function enqueueWebpackChunks(string $scriptHandle): void
	{
		$pluginUrl = AETHER_SITE_EXPORTER_PLUGIN_URL;
		$pluginDir = AETHER_SITE_EXPORTER_PLUGIN_DIR;

		// Discover numbered chunks dynamically (uses cached result)
		$numberedChunks = $this->discoverNumberedChunks((string) $pluginDir);

		// Map of script handles to their required chunks
		// Named chunks (common, vendor, etc.) are stable, numbered chunks need discovery
		$chunkMap = [
			'aether-export' => [ 'common', 'vendor' ],
			'aether-admin-settings' => [ 'common', 'vendor' ],
		];

		if (! isset($chunkMap[ $scriptHandle ])) {
			return;
		}

		$chunks = $chunkMap[ $scriptHandle ];
		$dependencies = [];

		// Add numbered chunks (typically the PublishProgressModal chunk)
		// Scripts that need PublishProgressModal should include numbered chunks
		if ($scriptHandle === 'aether-export') {
			$chunks = \array_merge($numberedChunks, $chunks);
		}

		foreach ($chunks as $chunkName) {
			$chunkHandle = "aether-chunk-{$chunkName}";

			// Skip if already enqueued
			if (\wp_script_is($chunkHandle, 'enqueued')) {
				$dependencies[] = $chunkHandle;
				continue;
			}

			// Check if chunk file exists
			$chunkFile = $pluginDir . "assets/build/{$chunkName}.js";
			if (! \file_exists($chunkFile)) {
				continue;
			}

			// Enqueue chunk
			\wp_enqueue_script(
				$chunkHandle,
				$pluginUrl . "assets/build/{$chunkName}.js",
				[], // Chunks don't have dependencies, they're loaded by webpack runtime
				AETHER_SITE_EXPORTER_VERSION,
				true
			);

			$dependencies[] = $chunkHandle;
		}

		// Update the main script's dependencies to include chunks
		// Note: This is a fallback - chunks should be enqueued before the main script
		// phpcs:ignore Squiz.NamingConventions.ValidVariableName.NotCamelCaps -- WordPress core global
		global $wp_scripts;
		// phpcs:ignore Squiz.NamingConventions.ValidVariableName.NotCamelCaps -- WordPress core global
		if (isset($wp_scripts->registered[ $scriptHandle ])) {
			// phpcs:ignore Squiz.NamingConventions.ValidVariableName.NotCamelCaps -- WordPress core global
			$existingDeps = $wp_scripts->registered[ $scriptHandle ]->deps;
			// phpcs:ignore Squiz.NamingConventions.ValidVariableName.NotCamelCaps -- WordPress core global
			$wp_scripts->registered[ $scriptHandle ]->deps = \array_unique(\array_merge($existingDeps, $dependencies));
		}
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
			'version' => AETHER_SITE_EXPORTER_VERSION,
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
		$configController = new REST\ConfigController();
		$assetsController = new REST\AssetsController();
		$wporgCheckController = new REST\WPOrgCheckController();
		$localStorageController = new REST\LocalStorageController();

		// Initialize publish controllers.
		$publishJobController = new REST\Publish\PublishJobController($this);
		$publishStepsController = new REST\Publish\PublishStepsController($this);

		// Register routes from each controller.
		$settingsController->registerRoutes();
		$exportController->registerRoutes();
		$providerConfigController->registerRoutes();
		$configController->registerRoutes();
		$assetsController->registerRoutes();
		$wporgCheckController->registerRoutes();
		$localStorageController->registerRoutes();

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
	public function addCorsHeadersFilter($served, $result, $request, $server)
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

		// Allow local development origins
		if (\defined('WP_DEBUG') && WP_DEBUG) {
			// Allow localhost with any port
			if ($origin && \preg_match('/^https?:\/\/localhost(:\d+)?$/', $origin)) {
				$allowedOrigins[] = $origin;
			}
			// Allow 127.0.0.1 with any port
			if ($origin && \preg_match('/^https?:\/\/127\.0\.0\.1(:\d+)?$/', $origin)) {
				$allowedOrigins[] = $origin;
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
		$queryParam = isset($_GET['aether_site_exporter_anonymous']) ? \sanitize_text_field(\wp_unslash($_GET['aether_site_exporter_anonymous'])) : '';

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
	public function setSameSiteCookies($authCookie, $expire, $expiration, $userId, $scheme, $token): void
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
	 * Get WordPress Playground base URL.
	 *
	 * @return string Playground URL.
	 */
	public static function getPlaygroundUrl(): string
	{
		return self::PLAYGROUND_URL;
	}

	/**
	 * Get all custom assets (plugins and themes).
	 *
	 * @return array<int, array<string, string>> Custom assets array.
	 */
	public function getAllCustomAssets(): array
	{
		return $this->assetDiscovery->getAllCustomAssets();
	}
}
