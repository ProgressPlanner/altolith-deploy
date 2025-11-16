<?php

/**
 * Publish Git Controller
 *
 * Handles git configuration endpoint for browser-side uploads.
 *
 * @package Aether\REST\Publish
 */

namespace Aether\SiteExporter\REST\Publish;

use Aether\REST\RESTHelpersTrait;
use Aether\Plugin;
use Aether\Utilities\EncryptionHelper;
use WP_REST_Request;
use WP_Error;

/**
 * Handles git configuration endpoint.
 */
class PublishGitController
{
	use RESTHelpersTrait;
	use PublishHelpersTrait;
	use EncryptionHelper;

	/**
	 * Constructor.
	 *
	 * @param Plugin $plugin Plugin instance.
	 */
	public function __construct(Plugin $plugin)
	{
		$this->initPublishHelpers($plugin);
	}
	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Get git configuration for browser-side upload (GitHub/GitLab).
		\register_rest_route(
			$this->getNamespace(),
			'/git-config',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getGitConfig' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);
	}

	/**
	 * Get git configuration for browser-side upload.
	 *
	 * Returns git repository configuration (URL, branch, token, CORS proxy)
	 * for GitHub/GitLab providers using isomorphic-git.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function getGitConfig()
	{
		// Get provider configuration from WordPress options.
		$settings = \get_option('aether_site_exporter_settings', []);
		$providerTypes = $settings['provider_types'] ?? [];
		$storageProviderId = $providerTypes['storage'] ?? '';

		// Check if storage provider is configured.
		if (empty($storageProviderId)) {
			return new WP_Error(
				'no_provider',
				\__('Storage provider is not configured.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Git-based providers that support browser upload.
		$gitProviders = [ 'github', 'gitlab', 'gitlab-pages' ];

		// Check if the storage provider supports git.
		if (! \in_array($storageProviderId, $gitProviders, true)) {
			return new WP_Error(
				'not_git_provider',
				\sprintf(
					/* translators: %s: provider ID */
					\__('Provider "%s" does not support git-based uploads. Use storage provider upload instead.', 'aether-site-exporter'),
					$storageProviderId
				),
				[ 'status' => 400 ]
			);
		}

		// Get provider-specific configuration.
		$providers = $settings['providers'] ?? [];
		$providerConfig = $providers[$storageProviderId] ?? [];

		if (empty($providerConfig)) {
			return new WP_Error(
				'no_config',
				\__('Provider configuration not found.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Decrypt provider config if needed
		$providerConfig = $this->decryptSensitiveFields($providerConfig);

		// Build git configuration from provider settings.
		// Different providers may store these fields under different names.
		$gitUrl = $providerConfig['repositoryUrl'] ?? $providerConfig['gitUrl'] ?? '';
		$branch = $providerConfig['branch'] ?? 'main';
		$personalAccessToken = $providerConfig['personal_access_token'] ?? $providerConfig['accessToken'] ?? '';

		// Security: validate and sanitize Git URL to prevent SSRF attacks.
		if (empty($gitUrl)) {
			return new WP_Error(
				'incomplete_config',
				\__('Git configuration is incomplete. Please configure repository URL and access token.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Sanitize Git URL.
		$gitUrl = \esc_url_raw($gitUrl);
		if (empty($gitUrl)) {
			return new WP_Error(
				'invalid_url',
				\__('Invalid Git repository URL.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Security: validate URL scheme (only allow https://).
		$parsedUrl = \wp_parse_url($gitUrl);
		if (false === $parsedUrl || ! isset($parsedUrl['scheme']) || 'https' !== \strtolower($parsedUrl['scheme'])) {
			return new WP_Error(
				'invalid_url_scheme',
				\__('Git repository URL must use HTTPS protocol.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Security: validate hostname to prevent SSRF attacks.
		// Only allow known Git hosting providers.
		$allowedHosts = [
			'github.com',
			'www.github.com',
			'gitlab.com',
			'www.gitlab.com',
			'bitbucket.org',
			'www.bitbucket.org',
		];

		$hostname = \strtolower($parsedUrl['host'] ?? '');
		$isAllowedHost = false;
		foreach ($allowedHosts as $allowedHost) {
			if ($hostname === $allowedHost || \substr($hostname, -\strlen($allowedHost) - 1) === '.' . $allowedHost) {
				$isAllowedHost = true;
				break;
			}
		}

		if (! $isAllowedHost) {
			return new WP_Error(
				'invalid_host',
				\__('Git repository hostname is not allowed. Only GitHub, GitLab, and Bitbucket are supported.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Security: sanitize branch name (alphanumeric, hyphens, underscores, slashes only).
		$branch = \sanitize_text_field($branch);
		if (empty($branch) || ! \preg_match('/^[a-zA-Z0-9_\/\-]+$/', $branch)) {
			return new WP_Error(
				'invalid_branch',
				\__('Invalid branch name. Only alphanumeric characters, hyphens, underscores, and slashes are allowed.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Validate required fields.
		if (empty($personalAccessToken)) {
			return new WP_Error(
				'incomplete_config',
				\__('Git configuration is incomplete. Please configure repository URL and access token.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		$gitConfig = [
			'gitUrl' => $gitUrl,
			'branch' => $branch,
			'personalAccessToken' => $personalAccessToken,
		];

		return \rest_ensure_response([
			'success' => true,
			'config' => $gitConfig
		]);
	}
}
