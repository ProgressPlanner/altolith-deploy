/**
 * API Constants
 *
 * Centralized API endpoints and configuration for WordPress REST API
 *
 * @package
 */

/**
 * WordPress REST API namespace for Aether plugin
 * @constant {string}
 */
export const API_NAMESPACE = 'aether/site-exporter';

/**
 * Base path for all Aether REST API endpoints
 * Note: Does not include /wp-json/ prefix as that's handled by apiFetch root URL middleware
 * @constant {string}
 */
export const API_BASE_PATH = `/${ API_NAMESPACE }`;

/**
 * REST API Endpoints
 *
 * All WordPress REST API endpoints used throughout the application.
 * Use these constants instead of hardcoded strings.
 */
export const ENDPOINTS = {
	/**
	 * Settings endpoints
	 */
	SETTINGS: `${ API_BASE_PATH }/settings`,
	SETTINGS_GET: `${ API_BASE_PATH }/settings`,
	SETTINGS_UPDATE: `${ API_BASE_PATH }/settings`,

	/**
	 * Export workflow endpoints (formerly publish)
	 */
	EXPORT_WORKFLOW: {
		START: `${ API_BASE_PATH }/export`,
		STATUS: `${ API_BASE_PATH }/export/status`,
		STEPS: `${ API_BASE_PATH }/export/steps`,
		STEP: ( stepId ) => `${ API_BASE_PATH }/export/steps/${ stepId }`,
		CANCEL: `${ API_BASE_PATH }/export/cancel`,
		RECENT_JOBS: `${ API_BASE_PATH }/export/recent-jobs`,
		JOB_STATUS: ( jobId ) => `${ API_BASE_PATH }/export/${ jobId }/status`,
		UPDATE_JOB_STATUS: ( jobId ) =>
			`${ API_BASE_PATH }/export/${ jobId }/status`,
		MARK_UPLOADS_COMPLETE: ( jobId ) =>
			`${ API_BASE_PATH }/export/${ jobId }/mark-uploads-complete`,
		CREATE_ARCHIVE: `${ API_BASE_PATH }/export/createArchive`,
		GENERATE_BLUEPRINT_BUNDLE: `${ API_BASE_PATH }/export/generateBlueprintBundle`,
	},

	/**
	 * Provider endpoints
	 */
	PROVIDERS: {
		CONFIG: ( providerId ) =>
			`${ API_BASE_PATH }/providers/${ providerId }/config`,
		SAVE_CONFIG: ( providerId ) =>
			`${ API_BASE_PATH }/providers/${ providerId }/config`,
		DELETE_CONFIG: ( providerId ) =>
			`${ API_BASE_PATH }/providers/${ providerId }/config`,
		TEST: ( providerId ) =>
			`${ API_BASE_PATH }/providers/${ providerId }/test`,
		STATUS: ( providerId ) =>
			`${ API_BASE_PATH }/providers/${ providerId }/status`,
	},

	/**
	 * Blueprint endpoints
	 * Note: Blueprint generation is now handled client-side via useBlueprintGenerator hook
	 */
	BLUEPRINT: {
		GET: `${ API_BASE_PATH }/blueprint`,
	},

	/**
	 * Export endpoints
	 */
	EXPORT: {
		START: `${ API_BASE_PATH }/export/start`,
		STATUS: `${ API_BASE_PATH }/export/status`,
		DOWNLOAD: `${ API_BASE_PATH }/export/download`,
	},

	/**
	 * Configuration endpoints
	 */
	CONFIG: {
		UPDATE: `${ API_BASE_PATH }/config`,
		RESET: `${ API_BASE_PATH }/config/reset`,
	},

	/**
	 * Static site endpoints
	 */
	STATIC_SITE: {
		URLS: `${ API_BASE_PATH }/static-site/urls`,
		GENERATE: `${ API_BASE_PATH }/static-site/generate`,
	},

	/**
	 * Asset management endpoints
	 * Note: Asset discovery now handled by useAssetDiscovery.js hook (browser-based)
	 * These endpoints have been removed as they made HTTP requests that fail in WordPress Playground
	 */
	ASSETS: {
		// Removed: DISCOVER, STATUS, MARK_CHANGED (now in useAssetDiscovery.js)
		EXTRACT: `${ API_BASE_PATH }/assets/extract`,
	},

	/**
	 * Usage statistics endpoints
	 */
	USAGE: {
		SUMMARY: `${ API_BASE_PATH }/usage/summary`,
		DETAILS: `${ API_BASE_PATH }/usage/details`,
	},
};

/**
 * HTTP Methods
 * @constant {Object}
 */
export const HTTP_METHODS = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	DELETE: 'DELETE',
	PATCH: 'PATCH',
};

/**
 * API Request Headers
 * @constant {Object}
 */
export const API_HEADERS = {
	CONTENT_TYPE_JSON: 'application/json',
	CONTENT_TYPE_FORM: 'application/x-www-form-urlencoded',
};

/**
 * API Response Status Codes
 * @constant {Object}
 */
export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
};
