/**
 * Provider Constants
 *
 * Centralized provider IDs, types, and categorizations
 *
 * @package
 */

/**
 * Provider IDs
 *
 * Unique identifiers for all registered providers.
 * Use these constants instead of hardcoded strings.
 */
export const PROVIDER_IDS = {
	/**
	 * Cloudflare R2 Storage Provider
	 * @constant {string}
	 */
	CLOUDFLARE_R2: 'cloudflare-r2',

	/**
	 * Cloudflare Workers Edge Provider
	 * @constant {string}
	 */
	CLOUDFLARE_WORKERS: 'cloudflare',

	/**
	 * GitLab Git Provider
	 * @constant {string}
	 */
	GITLAB: 'gitlab',

	/**
	 * GitLab Pages Static Site Provider
	 * @constant {string}
	 */
	GITLAB_PAGES: 'gitlab-pages',

	/**
	 * None/Disabled Provider
	 * @constant {string}
	 */
	NONE: 'none',
};

/**
 * Provider Types
 *
 * Categories of providers by their primary function.
 */
export const PROVIDER_TYPES = {
	/**
	 * Edge computing providers (Cloudflare Workers, etc.)
	 * @constant {string}
	 */
	EDGE: 'edge',

	/**
	 * Storage providers (R2, S3, etc.)
	 * @constant {string}
	 */
	STORAGE: 'storage',

	/**
	 * Static site hosting providers
	 * @constant {string}
	 */
	STATIC_SITE: 'static-site',

	/**
	 * Media hosting providers
	 * @constant {string}
	 */
	MEDIA: 'media',

	/**
	 * Git-based providers
	 * @constant {string}
	 */
	GIT: 'git',

	/**
	 * Cloud storage providers
	 * @constant {string}
	 */
	CLOUD_STORAGE: 'cloud-storage',
};

/**
 * Provider Categorizations
 *
 * Arrays of provider IDs grouped by characteristics.
 */

/**
 * Git-based providers (GitLab, GitHub, etc.)
 * These providers use Git for deployment
 * @constant {string[]}
 */
export const GIT_PROVIDERS = [ PROVIDER_IDS.GITLAB, PROVIDER_IDS.GITLAB_PAGES ];

/**
 * Storage-based providers (R2, S3, etc.)
 * These providers use object storage
 * @constant {string[]}
 */
export const STORAGE_PROVIDERS = [ PROVIDER_IDS.CLOUDFLARE_R2 ];

/**
 * Edge computing providers
 * These providers support edge computing/workers
 * @constant {string[]}
 */
export const EDGE_PROVIDERS = [ PROVIDER_IDS.CLOUDFLARE_WORKERS ];

/**
 * Static site hosting providers
 * These providers support static site hosting
 * @constant {string[]}
 */
export const STATIC_SITE_PROVIDERS = [
	PROVIDER_IDS.CLOUDFLARE_R2,
	PROVIDER_IDS.GITLAB_PAGES,
];

/**
 * Provider Configuration Keys
 *
 * Standard configuration field names used across providers.
 */
export const PROVIDER_CONFIG_KEYS = {
	// Authentication
	API_KEY: 'api_key',
	API_TOKEN: 'api_token',
	ACCESS_KEY_ID: 'access_key_id',
	SECRET_ACCESS_KEY: 'secret_access_key',
	PERSONAL_ACCESS_TOKEN: 'personal_access_token',

	// Account/Project
	ACCOUNT_ID: 'account_id',
	PROJECT_ID: 'project_id',
	NAMESPACE: 'namespace',
	PROJECT_PATH: 'project_path',

	// Storage
	BUCKET_NAME: 'bucket_name',
	REGION: 'region',
	ENDPOINT: 'endpoint',
	WORKER_ENDPOINT: 'worker_endpoint',

	// URLs
	CUSTOM_DOMAIN: 'custom_domain',
	PUBLIC_URL: 'public_url',
	PAGES_URL: 'pages_url',

	// Git
	BRANCH: 'branch',
	REPOSITORY: 'repository',

	// Features
	PUBLIC_ACCESS: 'public_access',
	PAGES_ENABLED: 'pages_enabled',
};

/**
 * Provider Status Values
 *
 * Standard status values for provider connections.
 */
export const PROVIDER_STATUS = {
	/**
	 * Provider is not configured
	 * @constant {string}
	 */
	NOT_CONFIGURED: 'not_configured',

	/**
	 * Provider is configured but not tested
	 * @constant {string}
	 */
	CONFIGURED: 'configured',

	/**
	 * Provider connection test in progress
	 * @constant {string}
	 */
	TESTING: 'testing',

	/**
	 * Provider connection test successful
	 * @constant {string}
	 */
	CONNECTED: 'connected',

	/**
	 * Provider connection test failed
	 * @constant {string}
	 */
	ERROR: 'error',

	/**
	 * Provider is currently deploying
	 * @constant {string}
	 */
	DEPLOYING: 'deploying',

	/**
	 * Provider deployed successfully
	 * @constant {string}
	 */
	DEPLOYED: 'deployed',
};

/**
 * Provider Internal Keys
 *
 * Internal setting keys used to map providers to capabilities.
 */
export const PROVIDER_INTERNAL_KEYS = {
	/**
	 * Edge computing provider key
	 * @constant {string}
	 */
	EDGE_PROVIDER: 'edgeProvider',

	/**
	 * Storage provider key
	 * @constant {string}
	 */
	STORAGE_PROVIDER: 'storageProvider',

	/**
	 * Static site provider key
	 * @constant {string}
	 */
	STATIC_SITE_PROVIDER: 'staticSiteProvider',

	/**
	 * Media provider key
	 * @constant {string}
	 */
	MEDIA_PROVIDER: 'mediaProvider',

	/**
	 * Image provider key (legacy)
	 * @constant {string}
	 */
	IMAGE_PROVIDER: 'imageProvider',

	/**
	 * Video provider key (legacy)
	 * @constant {string}
	 */
	VIDEO_PROVIDER: 'videoProvider',

	/**
	 * Other files provider key (legacy)
	 * @constant {string}
	 */
	OTHER_FILES_PROVIDER: 'otherFilesProvider',
};

/**
 * Provider Error Codes
 *
 * Standard error codes for provider operations.
 */
export const PROVIDER_ERROR_CODES = {
	/**
	 * Provider not found in registry
	 * @constant {string}
	 */
	PROVIDER_NOT_FOUND: 'provider_not_found',

	/**
	 * Provider not configured
	 * @constant {string}
	 */
	NOT_CONFIGURED: 'not_configured',

	/**
	 * Invalid configuration
	 * @constant {string}
	 */
	INVALID_CONFIG: 'invalid_config',

	/**
	 * Authentication failed
	 * @constant {string}
	 */
	AUTH_FAILED: 'auth_failed',

	/**
	 * Connection failed
	 * @constant {string}
	 */
	CONNECTION_FAILED: 'connection_failed',

	/**
	 * Deployment failed
	 * @constant {string}
	 */
	DEPLOYMENT_FAILED: 'deployment_failed',

	/**
	 * Upload failed
	 * @constant {string}
	 */
	UPLOAD_FAILED: 'upload_failed',

	/**
	 * Capability not supported
	 * @constant {string}
	 */
	CAPABILITY_NOT_SUPPORTED: 'capability_not_supported',
};

/**
 * Helper Functions
 */

/**
 * Check if provider is a Git provider
 *
 * @param {string} providerId - Provider ID to check
 * @return {boolean} True if provider uses Git
 */
export function isGitProvider( providerId ) {
	return GIT_PROVIDERS.includes( providerId );
}

/**
 * Check if provider is a storage provider
 *
 * @param {string} providerId - Provider ID to check
 * @return {boolean} True if provider uses storage
 */
export function isStorageProvider( providerId ) {
	return STORAGE_PROVIDERS.includes( providerId );
}

/**
 * Check if provider is an edge provider
 *
 * @param {string} providerId - Provider ID to check
 * @return {boolean} True if provider supports edge computing
 */
export function isEdgeProvider( providerId ) {
	return EDGE_PROVIDERS.includes( providerId );
}

/**
 * Check if provider supports static sites
 *
 * @param {string} providerId - Provider ID to check
 * @return {boolean} True if provider supports static site hosting
 */
export function isStaticSiteProvider( providerId ) {
	return STATIC_SITE_PROVIDERS.includes( providerId );
}
