/**
 * IProvider Interface
 *
 * This file documents the interface contract that all providers must implement.
 * JavaScript doesn't have native interfaces, so this serves as documentation
 * and a reference for implementing new providers.
 *
 * All providers should extend AbstractProvider, which provides base implementations
 * for common functionality. Override methods as needed to provide provider-specific behavior.
 *
 * @package
 * @interface
 */

/**
 * Provider Interface
 *
 * Defines the contract that all cloud providers must follow.
 * Providers handle deployment to specific cloud platforms (Cloudflare R2, GitLab Pages, etc.).
 *
 * @interface IProvider
 *
 * @example
 * import { AbstractProvider } from './AbstractProvider';
 * import { CAP_STORAGE, CAP_STATIC_SITE } from '../constants';
 *
 * export class MyProvider extends AbstractProvider {
 *     getId() { return 'my-provider'; }
 *     getName() { return 'My Cloud Provider'; }
 *     getDescription() { return 'Deploy to My Cloud'; }
 *     getCapabilities() { return [CAP_STORAGE, CAP_STATIC_SITE]; }
 *
 *     getConfigFields() {
 *         return [
 *             { id: 'api_key', label: 'API Key', type: 'text', required: true, secure: true }
 *         ];
 *     }
 *
 *     async deploy(config) {
 *         // Provider-specific deployment logic
 *         return { success: true, deploymentUrl: 'https://example.com' };
 *     }
 * }
 */

/**
 * Provider interface type definition.
 * See individual @memberof IProvider documentation below for all interface methods.
 *
 * This is a documentation-only interface. All methods are documented with @memberof IProvider below.
 * Properties are not listed here as they are methods, not data properties.
 *
 * @typedef {Object} IProvider
 * @property {Function} getId           - Get provider ID
 * @property {Function} getName         - Get provider name
 * @property {Function} getDescription  - Get provider description
 * @property {Function} getCapabilities - Get provider capabilities
 * @property {Function} getConfigFields - Get configuration field definitions
 * @property {Function} validateConfig  - Validate configuration
 * @property {Function} sanitizeConfig  - Sanitize configuration
 * @property {Function} testConnection  - Test connection to provider
 * @property {Function} deploy          - Deploy to provider
 * @property {Function} getStatus       - Get deployment status
 */

// ============================================================================
// REQUIRED METADATA METHODS
// ============================================================================

/**
 * Get unique provider identifier.
 *
 * Must be unique across all providers. Use kebab-case naming.
 * This ID is used in configuration, API endpoints, and internal routing.
 *
 * @memberof IProvider
 * @function getId
 * @return {string} Unique provider ID (e.g., 'cloudflare-r2', 'gitlab-pages')
 *
 * @example
 * getId() {
 *     return 'my-provider';
 * }
 */

/**
 * Get human-readable provider name.
 *
 * Displayed in UI (settings page, provider lists, etc.).
 * Should be short and descriptive.
 *
 * @memberof IProvider
 * @function getName
 * @return {string} Provider display name (e.g., 'Cloudflare R2', 'GitLab Pages')
 *
 * @example
 * getName() {
 *     return 'My Cloud Provider';
 * }
 */

/**
 * Get provider description.
 *
 * Brief description of what this provider does.
 * Displayed in settings page and provider selection.
 *
 * @memberof IProvider
 * @function getDescription
 * @return {string} Provider description (1-2 sentences)
 *
 * @example
 * getDescription() {
 *     return 'Deploy static sites to My Cloud hosting platform with automatic SSL.';
 * }
 */

/**
 * Get provider capabilities.
 *
 * Array of capability constants indicating what this provider supports.
 * Used to filter providers for specific use cases.
 *
 * @memberof IProvider
 * @function getCapabilities
 * @return {string[]} Array of capability constants (CAP_STORAGE, CAP_EDGE, CAP_MEDIA, CAP_STATIC_SITE)
 *
 * @example
 * import { CAP_STORAGE, CAP_STATIC_SITE, CAP_MEDIA } from '../constants';
 *
 * getCapabilities() {
 *     return [CAP_STORAGE, CAP_STATIC_SITE, CAP_MEDIA];
 * }
 */

// ============================================================================
// CONFIGURATION METHODS
// ============================================================================

/**
 * Get configuration field definitions.
 *
 * Defines the fields needed to configure this provider.
 * Settings UI dynamically renders these fields.
 *
 * @memberof IProvider
 * @function getConfigFields
 * @return {ConfigField[]} Array of configuration field definitions
 *
 * @typedef {Object} ConfigField
 * @property {string}  id                     - Unique field identifier (used as object key)
 * @property {string}  label                  - Human-readable field label
 * @property {string}  type                   - Field type: 'text', 'password', 'select', 'checkbox', 'textarea'
 * @property {boolean} required               - Whether field is required
 * @property {boolean} [secure=false]         - Whether to encrypt server-side (for API keys, tokens, secrets)
 * @property {string}  [placeholder]          - Placeholder text
 * @property {string}  [help]                 - Help text displayed below field
 * @property {Object}  [validation]           - Validation rules
 * @property {RegExp}  [validation.pattern]   - Regex pattern for validation
 * @property {string}  [validation.message]   - Error message if validation fails
 * @property {number}  [validation.minLength] - Minimum length
 * @property {number}  [validation.maxLength] - Maximum length
 * @property {Array}   [options]              - Options for select fields [{value: '', label: ''}]
 *
 * @example
 * getConfigFields() {
 *     return [
 *         {
 *             id: 'account_id',
 *             label: 'Account ID',
 *             type: 'text',
 *             required: true,
 *             secure: false,
 *             placeholder: 'Enter your account ID',
 *             help: 'Found in your provider dashboard',
 *             validation: {
 *                 pattern: /^[a-z0-9]{32}$/,
 *                 message: 'Account ID must be 32 alphanumeric characters'
 *             }
 *         },
 *         {
 *             id: 'api_key',
 *             label: 'API Key',
 *             type: 'password',
 *             required: true,
 *             secure: true, // Server-side encryption
 *             validation: {
 *                 minLength: 20,
 *                 message: 'API key must be at least 20 characters'
 *             }
 *         },
 *         {
 *             id: 'region',
 *             label: 'Region',
 *             type: 'select',
 *             required: true,
 *             options: [
 *                 { value: 'us-east', label: 'US East' },
 *                 { value: 'eu-west', label: 'EU West' }
 *             ]
 *         }
 *     ];
 * }
 */

/**
 * Validate provider configuration.
 *
 * Validates configuration values before saving.
 * Return validation errors keyed by field ID.
 *
 * @memberof IProvider
 * @function validateConfig
 * @param    {Object}                  config - Configuration object to validate
 * @return {ValidationResult} Validation result with errors
 *
 * @typedef {Object} ValidationResult
 * @property {boolean}                 valid  - Whether configuration is valid
 * @property {Object.<string, string>} errors - Validation errors keyed by field ID
 *
 * @example
 * validateConfig(config) {
 *     const errors = {};
 *
 *     if (!config.account_id || !/^[a-z0-9]{32}$/.test(config.account_id)) {
 *         errors.account_id = 'Account ID must be 32 alphanumeric characters';
 *     }
 *
 *     if (!config.api_key || config.api_key.length < 20) {
 *         errors.api_key = 'API key must be at least 20 characters';
 *     }
 *
 *     return {
 *         valid: Object.keys(errors).length === 0,
 *         errors
 *     };
 * }
 */

/**
 * Sanitize provider configuration.
 *
 * Sanitize configuration values before saving.
 * Remove whitespace, validate formats, etc.
 * Preserves snake_case key naming convention.
 *
 * @memberof IProvider
 * @function sanitizeConfig
 * @param {Object} config - Configuration object to sanitize
 * @return {Object} Sanitized configuration object
 *
 * @example
 * sanitizeConfig(config) {
 *     return {
 *         ...config,
 *         account_id: config.account_id?.trim().toLowerCase(),
 *         api_token: config.api_token?.trim(),
 *         region: config.region?.toLowerCase()
 *     };
 * }
 */

// ============================================================================
// OPERATION METHODS
// ============================================================================

/**
 * Test connection to provider.
 *
 * Verify that credentials work and provider is accessible.
 * Called when user clicks "Test Connection" in settings.
 *
 * @memberof IProvider
 * @function testConnection
 * @param    {Object}  config  - Provider configuration
 * @return {Promise<ConnectionResult>} Connection test result
 *
 * @typedef {Object} ConnectionResult
 * @property {boolean} success - Whether connection succeeded
 * @property {string}  [error] - Error message if connection failed
 * @property {Object}  [data]  - Additional data (account info, quotas, etc.)
 *
 * @example
 * async testConnection(config) {
 *     try {
 *         const response = await fetch('https://api.provider.com/test', {
 *             headers: {
 *                 'Authorization': `Bearer ${config.api_key}`,
 *                 'X-Account-ID': config.account_id
 *             }
 *         });
 *
 *         if (!response.ok) {
 *             return {
 *                 success: false,
 *                 error: 'Invalid credentials or account not found'
 *             };
 *         }
 *
 *         const data = await response.json();
 *
 *         return {
 *             success: true,
 *             data: {
 *                 accountName: data.name,
 *                 quota: data.quota
 *             }
 *         };
 *     } catch (error) {
 *         return {
 *             success: false,
 *             error: error.message || 'Connection failed'
 *         };
 *     }
 * }
 */

/**
 * Deploy to provider.
 *
 * Main deployment method. Upload files, configure hosting, etc.
 * Called during publish workflow.
 *
 * @memberof IProvider
 * @function deploy
 * @param    {DeploymentConfig} deploymentConfig - Deployment configuration
 * @return {Promise<DeploymentResult>} Deployment result
 *
 * @typedef {Object} DeploymentConfig
 * @property {Object}           providerConfig   - Provider configuration (credentials, etc.)
 * @property {File[]}           files            - Files to deploy
 * @property {Object}           metadata         - Deployment metadata (site name, description, etc.)
 * @property {Object}           [options]        - Additional deployment options
 *
 * @typedef {Object} DeploymentResult
 * @property {boolean}          success          - Whether deployment succeeded
 * @property {string}           [deploymentUrl]  - URL of deployed site
 * @property {string}           [error]          - Error message if deployment failed
 * @property {Object}           [data]           - Additional deployment data
 *
 * @example
 * async deploy(deploymentConfig) {
 *     const { providerConfig, files, metadata } = deploymentConfig;
 *
 *     try {
 *         // Upload files to provider
 *         for (const file of files) {
 *             await this.uploadFile(file, providerConfig);
 *         }
 *
 *         // Configure hosting
 *         const siteUrl = await this.configureSite(metadata, providerConfig);
 *
 *         return {
 *             success: true,
 *             deploymentUrl: siteUrl,
 *             data: {
 *                 filesUploaded: files.length,
 *                 timestamp: new Date().toISOString()
 *             }
 *         };
 *     } catch (error) {
 *         return {
 *             success: false,
 *             error: error.message || 'Deployment failed'
 *         };
 *     }
 * }
 */

/**
 * Get deployment status.
 *
 * Check the status of a deployment (active, inactive, error, etc.).
 * Used to update UI and verify deployments.
 *
 * @memberof IProvider
 * @function getStatus
 * @param    {Object}  config  - Provider configuration
 * @return {Promise<StatusResult>} Deployment status
 *
 * @typedef {Object} StatusResult
 * @property {boolean} success - Whether status check succeeded
 * @property {string}  status  - Status: 'active', 'inactive', 'deploying', 'error'
 * @property {string}  [url]   - Deployment URL if active
 * @property {string}  [error] - Error message if status check failed
 * @property {Object}  [data]  - Additional status data
 *
 * @example
 * async getStatus(config) {
 *     try {
 *         const response = await fetch(
 *             `https://api.provider.com/deployments/${config.deployment_id}`,
 *             {
 *                 headers: {
 *                     'Authorization': `Bearer ${config.api_key}`
 *                 }
 *             }
 *         );
 *
 *         if (!response.ok) {
 *             return {
 *                 success: false,
 *                 status: 'error',
 *                 error: 'Failed to get deployment status'
 *             };
 *         }
 *
 *         const data = await response.json();
 *
 *         return {
 *             success: true,
 *             status: data.status, // 'active', 'inactive', etc.
 *             url: data.url,
 *             data: {
 *                 lastDeployed: data.lastDeployed,
 *                 version: data.version
 *             }
 *         };
 *     } catch (error) {
 *         return {
 *             success: false,
 *             status: 'error',
 *             error: error.message
 *         };
 *     }
 * }
 */

// ============================================================================
// OPTIONAL METHODS
// ============================================================================

/**
 * Get service instance (lazy-loaded).
 *
 * Providers can use services for specific functionality (storage, edge, media).
 * Services are lazy-loaded only when needed.
 *
 * @memberof IProvider
 * @function getService
 * @param {string} serviceName - Service name (e.g., 'storage', 'edge', 'media')
 * @return {Object|null} Service instance or null if not supported
 *
 * @example
 * getService(serviceName) {
 *     if (serviceName === 'storage' && !this.storageService) {
 *         this.storageService = new StorageService(this.config);
 *     }
 *     return this.storageService || null;
 * }
 */

/**
 * Delete deployment.
 *
 * Remove deployed site and clean up resources.
 * Optional method - not all providers support deletion.
 *
 * @memberof IProvider
 * @function delete
 * @param    {Object}  config  - Provider configuration
 * @return {Promise<DeleteResult>} Deletion result
 *
 * @typedef {Object} DeleteResult
 * @property {boolean} success - Whether deletion succeeded
 * @property {string}  [error] - Error message if deletion failed
 *
 * @example
 * async delete(config) {
 *     try {
 *         await fetch(
 *             `https://api.provider.com/deployments/${config.deployment_id}`,
 *             {
 *                 method: 'DELETE',
 *                 headers: {
 *                     'Authorization': `Bearer ${config.api_key}`
 *                 }
 *             }
 *         );
 *
 *         return { success: true };
 *     } catch (error) {
 *         return {
 *             success: false,
 *             error: error.message || 'Deletion failed'
 *         };
 *     }
 * }
 */

// ============================================================================
// IMPLEMENTATION NOTES
// ============================================================================

/**
 * IMPLEMENTATION CHECKLIST
 *
 * When creating a new provider, ensure you:
 *
 * 1. Extend AbstractProvider
 * 2. Implement all required methods:
 *    - getId()
 *    - getName()
 *    - getDescription()
 *    - getCapabilities()
 *    - getConfigFields()
 *    - validateConfig()
 *    - sanitizeConfig()
 *    - testConnection()
 *    - deploy()
 *    - getStatus()
 *
 * 3. Register provider via WordPress hooks:
 *    doAction('aether.providers.register', new MyProvider())
 *
 * 4. Add provider to webpack build config (if needed)
 *
 * 5. Create unit tests in tests/js/providers/
 *
 * 6. Update provider README documentation
 *
 * 7. Test manually:
 *    - Configuration
 *    - Connection test
 *    - Deployment
 *    - Status check
 */

/**
 * ERROR HANDLING
 *
 * All async methods should:
 * - Catch errors gracefully
 * - Return { success: false, error: 'message' }
 * - Never throw errors to caller
 * - Log detailed errors for debugging
 *
 * Example:
 * try {
 *     // Operation
 *     return { success: true, ... };
 * } catch (error) {
 *     console.error('Provider operation failed:', error);
 *     return {
 *         success: false,
 *         error: error.message || 'Operation failed'
 *     };
 * }
 */

/**
 * SECURITY CONSIDERATIONS
 *
 * - Mark sensitive fields as secure: true
 * - Server encrypts secure fields before storage
 * - Never log sensitive values (API keys, tokens, secrets)
 * - Validate all inputs
 * - Sanitize configuration before use
 * - Use HTTPS for all API calls
 * - Follow provider's security best practices
 */

// This file is documentation-only. No exports needed.
export {};
