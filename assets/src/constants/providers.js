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
 * Note: These are provider "types" (getType()), not capabilities.
 */
export const PROVIDER_TYPES = {
	/**
	 * Local storage type
	 * @constant {string}
	 */
	LOCAL_STORAGE: 'local-storage',

	/**
	 * Cloud storage type
	 * @constant {string}
	 */
	CLOUD_STORAGE: 'cloud-storage',

	/**
	 * Git hosting type
	 * @constant {string}
	 */
	GIT_HOSTING: 'git-hosting',

	/**
	 * Static site hosting type
	 * @constant {string}
	 */
	STATIC_HOSTING: 'static-hosting',

	/**
	 * Edge computing type
	 * @constant {string}
	 */
	EDGE_COMPUTING: 'edge-computing',
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
	 * Deployment type not supported
	 * @constant {string}
	 */
	DEPLOYMENT_TYPE_NOT_SUPPORTED: 'deployment_type_not_supported',
};
