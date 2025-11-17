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
	 * Local Filesystem Provider
	 * @constant {string}
	 */
	LOCAL_FILESYSTEM: 'local-filesystem',

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
	 * Storage providers (local filesystem, etc.)
	 * @constant {string}
	 */
	STORAGE: 'storage',

	/**
	 * Static site hosting providers
	 * @constant {string}
	 */
	STATIC_SITE: 'static-site',
};

/**
 * Provider Categorizations
 *
 * Arrays of provider IDs grouped by characteristics.
 */

/**
 * Storage-based providers (local filesystem, etc.)
 * These providers use storage for static sites
 * @constant {string[]}
 */
export const STORAGE_PROVIDERS = [ PROVIDER_IDS.LOCAL_FILESYSTEM ];

/**
 * Static site hosting providers
 * These providers support static site hosting
 * @constant {string[]}
 */
export const STATIC_SITE_PROVIDERS = [ PROVIDER_IDS.LOCAL_FILESYSTEM ];

/**
 * Provider Configuration Keys
 *
 * Standard configuration field names for local filesystem provider.
 */
export const PROVIDER_CONFIG_KEYS = {
	// URLs
	ENDPOINT: 'endpoint',
	CUSTOM_DOMAIN: 'custom_domain',
	PUBLIC_URL: 'public_url',
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
	 * Storage provider key
	 * @constant {string}
	 */
	STORAGE_PROVIDER: 'storageProvider',

	/**
	 * Static site provider key
	 * @constant {string}
	 */
	STATIC_SITE_PROVIDER: 'staticSiteProvider',
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
 * Check if provider is a storage provider
 *
 * @param {string} providerId - Provider ID to check
 * @return {boolean} True if provider uses storage
 */
export function isStorageProvider( providerId ) {
	return STORAGE_PROVIDERS.includes( providerId );
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
