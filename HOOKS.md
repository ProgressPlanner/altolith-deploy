# Aether Site Exporter - Hooks Reference

This document provides a comprehensive reference for all WordPress hooks (filters and actions) available in the Aether Site Exporter plugin. These hooks allow third-party developers to extend and customize the plugin's behavior.

## Table of Contents

- [JavaScript Hooks](#javascript-hooks)
  - [Provider System](#provider-system)
  - [Configuration Storage](#configuration-storage)
  - [Workflow & Deployment](#workflow--deployment)
  - [Asset Processing](#asset-processing)
  - [URL Rewriting](#url-rewriting)
  - [Blueprint Generation](#blueprint-generation)
- [PHP Hooks](#php-hooks)
  - [Provider Configuration](#provider-configuration)
  - [Publishing & Deployment](#publishing--deployment)
- [Usage Examples](#usage-examples)

---

## JavaScript Hooks

All JavaScript hooks use the `@wordpress/hooks` package. Import `addFilter` or `addAction` to use them:

```javascript
import { addFilter, addAction } from '@wordpress/hooks';
```

### Provider System

#### `aether.provider.config.get`

**Type**: Filter
**Location**: `assets/src/providers/base/AbstractProvider.js`

Filters provider configuration after it's loaded.

**Parameters**:
- `config` (Object): Provider configuration object
- `providerId` (string): Provider identifier

**Example**:
```javascript
addFilter('aether.provider.config.get', 'my-plugin', (config, providerId) => {
    // Add default values
    if (!config.customField) {
        config.customField = 'default-value';
    }
    return config;
});
```

---

#### `aether.provider.config.before_save`

**Type**: Filter
**Location**: `assets/src/providers/base/AbstractProvider.js`

Filters provider configuration before it's saved.

**Parameters**:
- `config` (Object): Configuration to be saved
- `providerId` (string): Provider identifier

**Example**:
```javascript
addFilter('aether.provider.config.before_save', 'my-plugin', (config, providerId) => {
    // Sanitize or transform config before saving
    if (config.apiKey) {
        config.apiKey = config.apiKey.trim();
    }
    return config;
});
```

---

#### `aether.provider.config.saved`

**Type**: Action
**Location**: `assets/src/providers/base/AbstractProvider.js`

Fires after provider configuration is successfully saved.

**Parameters**:
- `config` (Object): Saved configuration
- `providerId` (string): Provider identifier

**Example**:
```javascript
addAction('aether.provider.config.saved', 'my-plugin', (config, providerId) => {
    console.log(`Configuration saved for ${providerId}`);
    // Trigger additional actions, analytics, etc.
});
```

---

#### `aether.provider.config.before_delete`

**Type**: Action
**Location**: `assets/src/providers/base/AbstractProvider.js`

Fires before provider configuration is deleted.

**Parameters**:
- `providerId` (string): Provider identifier

**Example**:
```javascript
addAction('aether.provider.config.before_delete', 'my-plugin', (providerId) => {
    console.log(`About to delete configuration for ${providerId}`);
    // Cleanup related data, show confirmation, etc.
});
```

---

#### `aether.provider.config.deleted`

**Type**: Action
**Location**: `assets/src/providers/base/AbstractProvider.js`

Fires after provider configuration is successfully deleted.

**Parameters**:
- `providerId` (string): Provider identifier

**Example**:
```javascript
addAction('aether.provider.config.deleted', 'my-plugin', (providerId) => {
    console.log(`Configuration deleted for ${providerId}`);
    // Clear caches, update UI, etc.
});
```

---

#### `aether.provider.config.validate`

**Type**: Filter
**Location**: `assets/src/providers/base/AbstractProvider.js`

Filters validation errors for provider configuration.

**Parameters**:
- `errors` (Object): Validation errors object (keys are field names, values are error messages)
- `config` (Object): Configuration being validated
- `providerId` (string): Provider identifier

**Example**:
```javascript
addFilter('aether.provider.config.validate', 'my-plugin', (errors, config, providerId) => {
    // Add custom validation
    if (config.customField && config.customField.length < 10) {
        errors.customField = 'Custom field must be at least 10 characters';
    }
    return errors;
});
```

---

#### `aether.provider.config.sanitize`

**Type**: Filter
**Location**: `assets/src/providers/base/AbstractProvider.js`

Filters sanitized configuration values.

**Parameters**:
- `sanitized` (Object): Sanitized configuration
- `config` (Object): Original configuration
- `providerId` (string): Provider identifier

**Example**:
```javascript
addFilter('aether.provider.config.sanitize', 'my-plugin', (sanitized, config, providerId) => {
    // Apply custom sanitization
    if (sanitized.url) {
        sanitized.url = sanitized.url.replace(/\/$/, ''); // Remove trailing slash
    }
    return sanitized;
});
```

---

#### `aether.provider.metadata`

**Type**: Filter
**Location**: `assets/src/providers/base/AbstractProvider.js`

Filters provider metadata.

**Parameters**:
- `metadata` (Object): Provider metadata (name, description, capabilities, etc.)
- `providerId` (string): Provider identifier

**Example**:
```javascript
addFilter('aether.provider.metadata', 'my-plugin', (metadata, providerId) => {
    // Extend metadata
    metadata.customCapability = true;
    return metadata;
});
```

---

#### `aether.provider.deployment_url`

**Type**: Filter
**Location**: `assets/src/providers/base/AbstractProvider.js`

Filters the deployment URL returned by the provider.

**Parameters**:
- `deploymentUrl` (string): Deployment URL
- `config` (Object): Provider configuration
- `providerId` (string): Provider identifier

**Example**:
```javascript
addFilter('aether.provider.deployment_url', 'my-plugin', (deploymentUrl, config, providerId) => {
    // Modify deployment URL
    if (config.customDomain) {
        return `https://${config.customDomain}`;
    }
    return deploymentUrl;
});
```

---

### Configuration Storage

#### `aether.storage.config.load`

**Type**: Filter
**Location**: `assets/src/providers/utils/configStorage.js`

Filters configuration after loading from REST API.

**Parameters**:
- `config` (Object): Loaded configuration
- `providerId` (string): Provider identifier

**Example**:
```javascript
addFilter('aether.storage.config.load', 'my-plugin', (config, providerId) => {
    // Add metadata when loading
    config.loadedAt = Date.now();
    return config;
});
```

---

#### `aether.storage.config.loaded`

**Type**: Action
**Location**: `assets/src/providers/utils/configStorage.js`

Fires after configuration is loaded from storage.

**Parameters**:
- `config` (Object): Loaded configuration
- `providerId` (string): Provider identifier

**Example**:
```javascript
addAction('aether.storage.config.loaded', 'my-plugin', (config, providerId) => {
    console.log(`Configuration loaded for ${providerId}`);
});
```

---

#### `aether.storage.config.before_save`

**Type**: Filter
**Location**: `assets/src/providers/utils/configStorage.js`

Filters configuration before saving to REST API.

**Parameters**:
- `config` (Object): Configuration to save
- `providerId` (string): Provider identifier

**Example**:
```javascript
addFilter('aether.storage.config.before_save', 'my-plugin', (config, providerId) => {
    // Add save timestamp
    config.lastSaved = Date.now();
    return config;
});
```

---

#### `aether.storage.config.saved`

**Type**: Action
**Location**: `assets/src/providers/utils/configStorage.js`

Fires after configuration is saved to storage.

**Parameters**:
- `config` (Object): Saved configuration
- `providerId` (string): Provider identifier

**Example**:
```javascript
addAction('aether.storage.config.saved', 'my-plugin', (config, providerId) => {
    console.log(`Configuration saved for ${providerId}`);
});
```

---

#### `aether.storage.config.before_delete`

**Type**: Action
**Location**: `assets/src/providers/utils/configStorage.js`

Fires before configuration is deleted from storage.

**Parameters**:
- `providerId` (string): Provider identifier

**Example**:
```javascript
addAction('aether.storage.config.before_delete', 'my-plugin', (providerId) => {
    console.log(`Deleting configuration for ${providerId}`);
});
```

---

#### `aether.storage.config.deleted`

**Type**: Action
**Location**: `assets/src/providers/utils/configStorage.js`

Fires after configuration is deleted from storage.

**Parameters**:
- `providerId` (string): Provider identifier

**Example**:
```javascript
addAction('aether.storage.config.deleted', 'my-plugin', (providerId) => {
    console.log(`Configuration deleted for ${providerId}`);
});
```

---

### Workflow & Deployment

#### `aether.workflow.step.before`

**Type**: Action
**Location**: `assets/src/publish/workflows/publishWorkflow.js`

Fires before a workflow step executes.

**Parameters**:
- `stepConfig` (Object): Step configuration
- `context` (Object): Execution context

**Example**:
```javascript
addAction('aether.workflow.step.before', 'my-plugin', (stepConfig, context) => {
    console.log(`Starting step: ${stepConfig.id}`);
});
```

---

#### `aether.workflow.step.after`

**Type**: Action
**Location**: `assets/src/publish/workflows/publishWorkflow.js`

Fires after a workflow step completes successfully.

**Parameters**:
- `stepConfig` (Object): Step configuration
- `result` (any): Step result
- `context` (Object): Execution context

**Example**:
```javascript
addAction('aether.workflow.step.after', 'my-plugin', (stepConfig, result, context) => {
    console.log(`Completed step: ${stepConfig.id}`);
});
```

---

#### `aether.workflow.step.error`

**Type**: Action
**Location**: `assets/src/publish/workflows/publishWorkflow.js`

Fires when a workflow step fails.

**Parameters**:
- `stepConfig` (Object): Step configuration
- `error` (Error): Error object
- `context` (Object): Execution context

**Example**:
```javascript
addAction('aether.workflow.step.error', 'my-plugin', (stepConfig, error, context) => {
    console.error(`Step ${stepConfig.id} failed:`, error.message);
    // Send error to analytics, show notification, etc.
});
```

---

#### `aether.deployment.url`

**Type**: Filter
**Location**: `assets/src/publish/hooks/usePublishController.js`

Filters the final deployment URL before displaying to user.

**Parameters**:
- `url` (string): Deployment URL
- `result` (Object): Complete deployment result
- `provider` (Object): Provider instance

**Example**:
```javascript
addFilter('aether.deployment.url', 'my-plugin', (url, result, provider) => {
    // Add tracking parameters to deployment URL
    if (url) {
        return `${url}?utm_source=aether&utm_medium=deploy`;
    }
    return url;
});
```

---

### Asset Processing

#### `aether.assets.extracted`

**Type**: Filter
**Location**: `assets/src/publish/utils/assetExtractor.js`

Filters extracted assets before returning from HTML parsing.

**Parameters**:
- `assets` (Array): Array of asset URLs
- `html` (string): Source HTML
- `pageUrl` (string): Page URL
- `siteUrl` (string): Site URL

**Example**:
```javascript
addFilter('aether.assets.extracted', 'my-plugin', (assets, html, pageUrl, siteUrl) => {
    // Add custom assets not detected in HTML
    assets.push('https://cdn.example.com/custom-asset.js');
    return assets;
});
```

---

#### `aether.assets.should_collect`

**Type**: Filter
**Location**: `assets/src/publish/utils/assetExtractor.js`

Filters whether a specific asset should be collected.

**Parameters**:
- `shouldCollect` (boolean): Whether to collect the asset
- `url` (string): Asset URL
- `siteUrl` (string): Site URL
- `source` (string): Source type ('css', 'js', 'img', etc.)
- `extension` (string): File extension

**Example**:
```javascript
addFilter('aether.assets.should_collect', 'my-plugin', (shouldCollect, url, siteUrl, source, extension) => {
    // Exclude specific CDN resources
    if (url.includes('exclude-cdn.com')) {
        return false;
    }
    return shouldCollect;
});
```

---

### URL Rewriting

#### `aether.url.resolve`

**Type**: Filter
**Location**: `assets/src/publish/utils/urlRewriter.js`

Filters resolved URL after relative-to-absolute conversion.

**Parameters**:
- `resolvedUrl` (string): Resolved absolute URL
- `url` (string): Original relative URL
- `baseUrl` (string): Base URL used for resolution

**Example**:
```javascript
addFilter('aether.url.resolve', 'my-plugin', (resolvedUrl, url, baseUrl) => {
    // Custom CDN mapping for assets
    if (url.includes('/uploads/')) {
        return resolvedUrl.replace('example.com', 'cdn.example.com');
    }
    return resolvedUrl;
});
```

---

#### `aether.url.is_external`

**Type**: Filter
**Location**: `assets/src/publish/utils/urlRewriter.js`

Filters external URL detection result.

**Parameters**:
- `isExternalUrl` (boolean): Whether URL is considered external
- `url` (string): URL being checked
- `siteUrl` (string): Site URL for comparison

**Example**:
```javascript
addFilter('aether.url.is_external', 'my-plugin', (isExternal, url, siteUrl) => {
    // Treat CDN subdomain as internal
    if (url.includes('cdn.example.com') && siteUrl.includes('example.com')) {
        return false;
    }
    return isExternal;
});
```

---

#### `aether.url.normalize`

**Type**: Filter
**Location**: `assets/src/publish/utils/urlRewriter.js`

Filters normalized URL.

**Parameters**:
- `url` (string): Normalized URL
- `siteUrl` (string): Site URL used for normalization

**Example**:
```javascript
addFilter('aether.url.normalize', 'my-plugin', (url, siteUrl) => {
    // Custom normalization: remove query parameters
    try {
        const urlObj = new URL(url);
        urlObj.search = '';
        return urlObj.toString();
    } catch {
        return url;
    }
});
```

---

#### `aether.url.rewrite`

**Type**: Filter
**Location**: `assets/src/publish/utils/urlRewriter.js`

Filters rewritten URL after static site conversion.

**Parameters**:
- `rewrittenUrl` (string): Final rewritten URL
- `url` (string): Original URL
- `contextUrl` (string): Context URL for resolution
- `siteUrl` (string): Site URL
- `staticUrl` (string): Static URL (if configured)

**Example**:
```javascript
addFilter('aether.url.rewrite', 'my-plugin', (rewrittenUrl, url, contextUrl, siteUrl, staticUrl) => {
    // Custom URL transformation
    if (rewrittenUrl.includes('/wp-content/uploads/')) {
        return rewrittenUrl.replace('/wp-content/uploads/', '/media/');
    }
    return rewrittenUrl;
});
```

---

#### `aether.url.rewrite_html`

**Type**: Filter
**Location**: `assets/src/publish/utils/urlRewriter.js`

Filters HTML after URL rewriting.

**Parameters**:
- `html` (string): Rewritten HTML content
- `contextUrl` (string): Context URL (current page)
- `siteUrl` (string): Site URL
- `staticUrl` (string): Static URL (if configured)

**Example**:
```javascript
addFilter('aether.url.rewrite_html', 'my-plugin', (html, contextUrl, siteUrl, staticUrl) => {
    // Add custom meta tags
    return html.replace('</head>', '<meta name="generator" content="Aether"></head>');
});
```

---

### Blueprint Generation

#### `aether.blueprint.steps`

**Type**: Filter
**Location**: `assets/src/publish/utils/blueprintStepBuilders.js`

Filters blueprint steps array before final JSON generation.

**Parameters**:
- `steps` (Array): Blueprint steps array
- `config` (Object): Configuration object with wporgPlugins, wporgThemes

**Example**:
```javascript
addFilter('aether.blueprint.steps', 'my-plugin', (steps, config) => {
    // Add custom step at the end
    steps.push({
        step: 'runPHP',
        code: '<?php update_option("my_custom_option", "value"); ?>'
    });
    return steps;
});
```

---

#### `aether.blueprint.json`

**Type**: Filter
**Location**: `assets/src/publish/utils/blueprintStepBuilders.js`

Filters complete blueprint JSON object.

**Parameters**:
- `blueprint` (Object): Complete blueprint JSON object
- `steps` (Array): Blueprint steps array

**Example**:
```javascript
addFilter('aether.blueprint.json', 'my-plugin', (blueprint, steps) => {
    // Customize landing page
    blueprint.landingPage = '/wp-admin/';

    // Change PHP version
    blueprint.preferredVersions.php = '8.3';

    // Add login credentials
    blueprint.login = {
        username: 'admin',
        password: 'password'
    };

    return blueprint;
});
```

---

#### `aether.blueprint.assets`

**Type**: Filter
**Location**: `assets/src/publish/hooks/useBlueprintGenerator.js`

Filters discovered WordPress.org assets before blueprint generation.

**Parameters**:
- `assets` (Object): Discovered assets object
  - `plugins` (Array): WordPress.org plugin slugs
  - `themes` (Array): WordPress.org theme slugs
- `assetsResponse` (Object): Full asset discovery response

**Example**:
```javascript
addFilter('aether.blueprint.assets', 'my-plugin', (assets) => {
    // Exclude specific plugins
    assets.plugins = assets.plugins.filter(slug => slug !== 'unwanted-plugin');

    // Add additional plugins
    assets.plugins.push('my-required-plugin');

    return assets;
});
```

---

#### `aether.blueprint.generated`

**Type**: Filter
**Location**: `assets/src/publish/hooks/useBlueprintGenerator.js`

Filters final generated blueprint before deployment.

**Parameters**:
- `blueprint` (Object): Complete blueprint JSON object
- `wporgPlugins` (Array): WordPress.org plugin slugs
- `wporgThemes` (Array): WordPress.org theme slugs

**Example**:
```javascript
addFilter('aether.blueprint.generated', 'my-plugin', (blueprint) => {
    // Add custom metadata
    blueprint.description = 'My custom WordPress site';
    return blueprint;
});
```

---

## PHP Hooks

All PHP hooks use WordPress's native `add_filter()` and `add_action()` functions.

### Provider Registration

**Note**: Providers are now registered entirely in JavaScript, not PHP. See JavaScript hooks section below for provider registration.

---

#### `aether_blueprint_bundle_upload`

**Type**: Action
**Location**: `includes/Plugin.php`

Fired when a blueprint bundle needs to be uploaded to a provider instance.

**Parameters**:
- `$instanceId` (string): Provider instance ID (e.g., 'local-filesystem:abc-123')
- `$sourcePath` (string): Source path of the generated blueprint bundle
- `$destinationPath` (string): Destination path (instance's export_path)
- `$context` (array): Additional context data

**Example**:
```php
add_action('aether_blueprint_bundle_upload', function($instanceId, $sourcePath, $destinationPath, $context = []) {
    if (strpos($instanceId, 'my-provider:') === 0) {
        // Handle blueprint bundle upload for my provider
        copy($sourcePath, $destinationPath);
    }
}, 10, 4);
```

---

#### `aether_provider_config_load`

**Type**: Filter
**Location**: `includes/REST/ProviderConfigController.php`

Filters provider configuration after loading from database.

**Parameters**:
- `$config` (array): The provider configuration
- `$instanceId` (string): The instance ID

**Example**:
```php
add_filter('aether_provider_config_load', function($config, $instanceId) {
    if (str_starts_with($instanceId, 'my-provider:')) {
        $config['custom_field'] = 'custom value';
    }
    return $config;
}, 10, 2);
```

---

#### `aether_provider_config_save`

**Type**: Filter
**Location**: `includes/REST/ProviderConfigController.php`

Filters provider configuration before saving to database.

**Parameters**:
- `$config` (array): The provider configuration to save
- `$instanceId` (string): The instance ID

**Example**:
```php
add_filter('aether_provider_config_save', function($config, $instanceId) {
    if (str_starts_with($instanceId, 'my-provider:')) {
        $config['custom_field'] = 'processed value';
    }
    return $config;
}, 10, 2);
```

---

#### `aether_provider_config_saved`

**Type**: Action
**Location**: `includes/REST/ProviderConfigController.php`

Fired after provider configuration is saved.

**Parameters**:
- `$instanceId` (string): The instance ID
- `$config` (array): The saved configuration (decrypted for hook access)

**Example**:
```php
add_action('aether_provider_config_saved', function($instanceId, $config) {
    error_log("Instance {$instanceId} configuration updated");
}, 10, 2);
```

---

#### `aether_provider_config_before_delete`

**Type**: Action
**Location**: `includes/REST/ProviderConfigController.php`

Fired before provider configuration is deleted.

**Parameters**:
- `$instanceId` (string): The instance ID being deleted

**Example**:
```php
add_action('aether_provider_config_before_delete', function($instanceId) {
    // Clean up associated resources
    delete_option("my_provider_{$instanceId}_cache");
});
```

---

#### `aether_provider_config_deleted`

**Type**: Action
**Location**: `includes/REST/ProviderConfigController.php`

Fired after provider configuration is deleted.

**Parameters**:
- `$instanceId` (string): The instance ID that was deleted

**Example**:
```php
add_action('aether_provider_config_deleted', function($instanceId) {
    error_log("Instance {$instanceId} configuration removed");
});
```

---

#### `aether_provider_config_loaded`

**Type**: Action
**Location**: `includes/REST/ProviderConfigController.php`

Fired after provider configuration is loaded.

**Parameters**:
- `$instanceId` (string): The instance ID
- `$config` (array): The loaded configuration

**Example**:
```php
add_action('aether_provider_config_loaded', function($instanceId, $config) {
    // Process loaded configuration
}, 10, 2);
```

---

### JavaScript Provider Registration

Providers are registered in JavaScript using the `aether.providers.register` action hook. See the JavaScript hooks section for details.
    return $providerId;
}, 10, 2);
```

---

### Provider Configuration

#### `aether_provider_config_validate`

**Type**: Filter
**Location**: `includes/REST/ProviderConfigController.php`

Filters validation errors for provider configuration.

**Parameters**:
- `$errors` (WP_Error): Validation errors object
- `$config` (array): Configuration being validated
- `$provider_id` (string): Provider identifier
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_filter('aether_provider_config_validate', function($errors, $config, $provider_id, $request) {
    // Add custom validation
    if (isset($config['api_key']) && strlen($config['api_key']) < 32) {
        $errors->add('invalid_api_key', 'API key must be at least 32 characters');
    }
    return $errors;
}, 10, 4);
```

---

#### `aether_provider_config_sanitize`

**Type**: Filter
**Location**: `includes/REST/ProviderConfigController.php`

Filters sanitized configuration before saving.

**Parameters**:
- `$sanitized` (array): Sanitized configuration
- `$config` (array): Original configuration
- `$provider_id` (string): Provider identifier
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_filter('aether_provider_config_sanitize', function($sanitized, $config, $provider_id, $request) {
    // Apply custom sanitization
    if (isset($sanitized['url'])) {
        $sanitized['url'] = rtrim($sanitized['url'], '/');
    }
    return $sanitized;
}, 10, 4);
```

---

#### `aether_provider_config_before_save`

**Type**: Action
**Location**: `includes/REST/ProviderConfigController.php`

Fires before provider configuration is saved.

**Parameters**:
- `$config` (array): Configuration to be saved
- `$provider_id` (string): Provider identifier
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_provider_config_before_save', function($config, $provider_id, $request) {
    // Log configuration changes
    error_log("Saving config for provider: {$provider_id}");
}, 10, 3);
```

---

#### `aether_provider_config_saved`

**Type**: Action
**Location**: `includes/REST/ProviderConfigController.php`

Fires after provider configuration is successfully saved.

**Parameters**:
- `$config` (array): Saved configuration
- `$provider_id` (string): Provider identifier
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_provider_config_saved', function($config, $provider_id, $request) {
    // Clear caches, trigger webhooks, etc.
    wp_cache_delete("provider_config_{$provider_id}");
}, 10, 3);
```

---

#### `aether_provider_config_before_delete`

**Type**: Action
**Location**: `includes/REST/ProviderConfigController.php`

Fires before provider configuration is deleted.

**Parameters**:
- `$provider_id` (string): Provider identifier
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_provider_config_before_delete', function($provider_id, $request) {
    // Cleanup related data
    delete_option("provider_metadata_{$provider_id}");
}, 10, 2);
```

---

#### `aether_provider_config_deleted`

**Type**: Action
**Location**: `includes/REST/ProviderConfigController.php`

Fires after provider configuration is successfully deleted.

**Parameters**:
- `$provider_id` (string): Provider identifier
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_provider_config_deleted', function($provider_id, $request) {
    // Clear all caches
    wp_cache_flush();
}, 10, 2);
```

---

### Publishing & Deployment

#### `aether_publish_validate_config`

**Type**: Filter
**Location**: `includes/REST/Publish/PublishStepsController.php`

Filters validation errors for publish configuration.

**Parameters**:
- `$errors` (WP_Error): Validation errors object
- `$config` (array): Configuration being validated
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_filter('aether_publish_validate_config', function($errors, $config, $request) {
    // Validate custom deployment settings
    if (!isset($config['deployment_type'])) {
        $errors->add('missing_deployment_type', 'Deployment type is required');
    }
    return $errors;
}, 10, 3);
```

---

#### `aether_publish_before_upload`

**Type**: Action
**Location**: `includes/REST/Publish/PublishStepsController.php`

Fires before file upload to deployment target.

**Parameters**:
- `$file_path` (string): Path to file being uploaded
- `$config` (array): Publish configuration
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_publish_before_upload', function($file_path, $config, $request) {
    // Log upload
    error_log("Uploading file: {$file_path}");

    // Trigger pre-upload webhook
    wp_remote_post('https://example.com/webhook', [
        'body' => ['event' => 'upload_start', 'file' => basename($file_path)]
    ]);
}, 10, 3);
```

---

#### `aether_publish_after_upload`

**Type**: Action
**Location**: `includes/REST/Publish/PublishStepsController.php`

Fires after successful file upload.

**Parameters**:
- `$file_path` (string): Path to uploaded file
- `$remote_url` (string): Remote URL of uploaded file
- `$config` (array): Publish configuration
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_publish_after_upload', function($file_path, $remote_url, $config, $request) {
    // Log success
    error_log("Successfully uploaded to: {$remote_url}");

    // Trigger post-upload webhook
    wp_remote_post('https://example.com/webhook', [
        'body' => ['event' => 'upload_complete', 'url' => $remote_url]
    ]);
}, 10, 4);
```

---

#### `aether_publish_upload_error`

**Type**: Action
**Location**: `includes/REST/Publish/PublishStepsController.php`

Fires when file upload fails.

**Parameters**:
- `$error` (WP_Error): Error object
- `$file_path` (string): Path to file that failed to upload
- `$config` (array): Publish configuration
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_publish_upload_error', function($error, $file_path, $config, $request) {
    // Log error
    error_log("Upload failed: {$error->get_error_message()}");

    // Send error notification
    wp_mail(
        get_option('admin_email'),
        'Aether Upload Failed',
        "Failed to upload {$file_path}: {$error->get_error_message()}"
    );
}, 10, 4);
```

---

#### `aether_publish_job_created`

**Type**: Action
**Location**: `includes/REST/Publish/PublishJobController.php`

Fires when a new publish job is created.

**Parameters**:
- `$job_id` (string): Job identifier
- `$config` (array): Job configuration
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_publish_job_created', function($job_id, $config, $request) {
    // Track job creation
    error_log("Created publish job: {$job_id}");

    // Store custom metadata
    update_option("aether_job_{$job_id}_created_at", time());
}, 10, 3);
```

---

#### `aether_publish_job_status_changed`

**Type**: Action
**Location**: `includes/REST/Publish/PublishJobController.php`

Fires when publish job status changes.

**Parameters**:
- `$job_id` (string): Job identifier
- `$new_status` (string): New status (pending, in_progress, completed, failed)
- `$old_status` (string): Previous status
- `$data` (array): Job data

**Example**:
```php
add_action('aether_publish_job_status_changed', function($job_id, $new_status, $old_status, $data) {
    // Send notifications
    if ($new_status === 'completed') {
        wp_mail(
            get_option('admin_email'),
            'Deployment Complete',
            "Your site has been successfully deployed. Job ID: {$job_id}"
        );
    }
}, 10, 4);
```

---

#### `aether_publish_job_completed`

**Type**: Action
**Location**: `includes/REST/Publish/PublishJobController.php`

Fires when publish job completes successfully.

**Parameters**:
- `$job_id` (string): Job identifier
- `$result` (array): Job result data
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_publish_job_completed', function($job_id, $result, $request) {
    // Cleanup temporary files
    // Trigger post-deployment tasks
    // Update analytics
    error_log("Publish job {$job_id} completed successfully");
}, 10, 3);
```

---

#### `aether_publish_job_failed`

**Type**: Action
**Location**: `includes/REST/Publish/PublishJobController.php`

Fires when publish job fails.

**Parameters**:
- `$job_id` (string): Job identifier
- `$error` (WP_Error|string): Error information
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_publish_job_failed', function($job_id, $error, $request) {
    $error_message = is_wp_error($error) ? $error->get_error_message() : $error;

    // Send failure notification
    wp_mail(
        get_option('admin_email'),
        'Deployment Failed',
        "Deployment failed for job {$job_id}: {$error_message}"
    );
}, 10, 3);
```

---

#### `aether_publish_job_deleted`

**Type**: Action
**Location**: `includes/REST/Publish/PublishJobController.php`

Fires when publish job is deleted.

**Parameters**:
- `$job_id` (string): Job identifier
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_publish_job_deleted', function($job_id, $request) {
    // Cleanup related resources
    delete_option("aether_job_{$job_id}_created_at");

    // Log deletion
    error_log("Deleted publish job: {$job_id}");
}, 10, 2);
```

---

## Usage Examples

### Creating a Custom Provider

Providers require both PHP and JavaScript components:

**JavaScript Only** (`my-provider.js`):

Providers are now registered entirely in JavaScript. PHP is only used for REST API endpoints if your provider needs custom server-side operations.

```javascript
import { AbstractProvider } from '../providers/base/AbstractProvider';
import { addAction } from '@wordpress/hooks';
import ProviderRegistry from '../providers/registry/ProviderRegistry';

class MyCustomProvider extends AbstractProvider {
    getId() {
        return 'my-custom-provider';
    }

    getName() {
        return 'My Custom Provider';
    }

    // Implement required methods for upload/deployment...
    async uploadFile(file, path) {
        // Custom upload logic
    }
}

// Create provider instance
const provider = new MyCustomProvider();

// Register provider in JavaScript registry
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';
ProviderRegistry.register(provider.getId(), provider);

// Also trigger the hook for any listeners
import { doAction } from '@wordpress/hooks';
doAction('aether.providers.register', provider);
    registry.register('my-custom-provider', MyCustomProvider);
});
```

**Enqueue JavaScript** (`my-provider-plugin.php`):

```php
add_action('admin_enqueue_scripts', function() {
    // Enqueue your provider's JavaScript file
    wp_enqueue_script(
        'my-custom-provider',
        plugin_dir_url(__FILE__) . 'assets/my-provider.js',
        ['aether-admin-common'], // Dependencies
        '1.0.0',
        true
    );
});
```

---

### Customizing Blueprint Generation

```javascript
import { addFilter } from '@wordpress/hooks';

// Exclude specific plugins from blueprint
addFilter('aether.blueprint.assets', 'my-customizations', (assets) => {
    assets.plugins = assets.plugins.filter(slug => {
        return !['jetpack', 'akismet'].includes(slug);
    });
    return assets;
});

// Customize blueprint settings
addFilter('aether.blueprint.json', 'my-customizations', (blueprint) => {
    // Use different PHP version
    blueprint.preferredVersions.php = '8.2';

    // Change landing page
    blueprint.landingPage = '/';

    // Add custom step
    blueprint.steps.push({
        step: 'writeFile',
        path: '/wordpress/wp-content/custom-config.php',
        data: '<?php define("MY_CONSTANT", true); ?>'
    });

    return blueprint;
});
```

---

### Monitoring Deployments

```php
<?php

// Track deployment metrics
add_action('aether_publish_job_created', function($job_id, $config) {
    update_option("deployment_count", (int) get_option("deployment_count", 0) + 1);
    update_option("last_deployment", time());
}, 10, 2);

// Send notifications on status changes
add_action('aether_publish_job_status_changed', function($job_id, $new_status, $old_status) {
    if ($new_status === 'completed') {
        // Send success notification via webhook
        wp_remote_post('https://api.slack.com/webhooks/...', [
            'body' => json_encode([
                'text' => "✅ Deployment {$job_id} completed successfully"
            ])
        ]);
    } elseif ($new_status === 'failed') {
        // Send failure notification
        wp_remote_post('https://api.slack.com/webhooks/...', [
            'body' => json_encode([
                'text' => "❌ Deployment {$job_id} failed"
            ])
        ]);
    }
}, 10, 3);
```

---

### Custom Asset Handling

```javascript
import { addFilter } from '@wordpress/hooks';

// Exclude specific assets from collection
addFilter('aether.assets.should_collect', 'my-customizations', (shouldCollect, url) => {
    // Skip analytics scripts
    if (url.includes('google-analytics.com') || url.includes('gtag')) {
        return false;
    }
    return shouldCollect;
});

// Add additional assets
addFilter('aether.assets.extracted', 'my-customizations', (assets) => {
    // Always include custom font
    assets.push('https://fonts.googleapis.com/css2?family=Roboto');
    return assets;
});

// Custom URL rewriting
addFilter('aether.url.rewrite', 'my-customizations', (rewrittenUrl, url) => {
    // Map uploads to CDN
    if (url.includes('/wp-content/uploads/')) {
        return rewrittenUrl.replace(
            'example.com/wp-content/uploads',
            'cdn.example.com/media'
        );
    }
    return rewrittenUrl;
});
```

---

## Best Practices

1. **Always return the filtered value**: Filters must return the value (potentially modified)
2. **Use appropriate priority**: Default is 10. Lower = earlier, higher = later
3. **Validate your inputs**: Check that parameters exist before using them
4. **Namespace your hook callbacks**: Use unique names to avoid conflicts
5. **Test error conditions**: Ensure your hooks handle errors gracefully
6. **Document your hooks**: If creating a provider plugin, document which hooks you use

---

## Hook Naming Conventions

- **JavaScript hooks**: `aether.{category}.{action}` (dot-separated)
- **PHP hooks**: `aether_{category}_{action}` (underscore-separated)
- **Categories**: provider, storage, workflow, assets, url, blueprint, publish
- **Actions**: Verbs describing the event (validate, saved, deleted, etc.)

---

## Support

For questions about using these hooks:
- File an issue: https://github.com/your-repo/issues
- Documentation: https://docs.aether-exporter.com

