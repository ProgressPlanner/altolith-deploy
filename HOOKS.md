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

#### `aether.providers.register`

**Type**: Action
**Location**: `assets/src/providers/registry/ProviderRegistry.js`

Fires when a provider wants to register itself with the system. Providers should call `doAction('aether.providers.register', provider)` to register.

**Parameters**:
- `provider` (Object): Provider instance (must have `getId()` and `getName()` methods)

**Example**:
```javascript
import { doAction } from '@wordpress/hooks';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

const provider = new MyProvider();

// Register with registry
ProviderRegistry.register(provider.getId(), provider);

// Also trigger the hook for any listeners
doAction('aether.providers.register', provider);
```

---

#### `aether.providers.registered`

**Type**: Action
**Location**: `assets/src/providers/registry/ProviderRegistry.js`

Fires after a provider is successfully registered in the ProviderRegistry.

**Parameters**:
- `providerId` (string): Provider identifier
- `provider` (Object): Provider instance

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.providers.registered', 'my-plugin', (providerId, provider) => {
    console.log(`Provider ${providerId} registered successfully`);
    // Initialize provider-specific features
});
```

---

#### `aether.provider_ids`

**Type**: Filter
**Location**: `assets/src/providers/utils/providerLoader.js`

Filters the list of all provider IDs. Allows adding or removing provider IDs from the list.

**Parameters**:
- `providerIds` (Array): Array of provider ID strings

**Returns**: Modified array of provider IDs

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.provider_ids', 'my-plugin', (providerIds) => {
    // Add custom provider ID
    return [...providerIds, 'my-custom-provider'];
});
```

---

#### `aether.provider.getDefault`

**Type**: Filter
**Location**: `assets/src/providers/utils/providerDiscovery.js`

Filters the default provider returned by the discovery system.

**Parameters**:
- `provider` (Object|null): Default provider instance or null

**Returns**: Provider instance or null

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.provider.getDefault', 'my-plugin', (provider) => {
    // Override default provider
    return ProviderRegistry.get('my-preferred-provider');
});
```

---

#### `aether.provider.getForDeploymentType`

**Type**: Filter
**Location**: `assets/src/providers/utils/providerDiscovery.js`

Filters the provider returned for a specific deployment type.

**Parameters**:
- `provider` (Object|null): Provider instance or null
- `deploymentType` (string): Deployment type (e.g., 'static_site', 'blueprint_bundle')

**Returns**: Provider instance or null

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.provider.getForDeploymentType', 'my-plugin', (provider, deploymentType) => {
    if (deploymentType === 'static_site' && !provider) {
        // Provide fallback provider for static sites
        return ProviderRegistry.get('my-static-provider');
    }
    return provider;
});
```

---

#### `aether.provider.test`

**Type**: Filter
**Location**: `assets/src/providers/local-filesystem/index.js`, `assets/src/components/ProviderSettings/index.js`

Allows providers to register test connection handlers. When a provider test is requested, handlers registered via this filter are called.

**Parameters**:
- `testHandler` (Function|null): Test handler function or null
- `providerId` (string): Provider instance ID

**Returns**: Test handler function or null

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.provider.test', 'my-provider', (testHandler, providerId) => {
    if (providerId.startsWith('my-provider:')) {
        return async (config) => {
            // Test provider connection
            try {
                await testConnection(config);
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        };
    }
    return testHandler; // Use default handler
});
```

---

#### `aether.provider.upload_strategy`

**Type**: Filter
**Location**: `assets/src/providers/local-filesystem/index.js`

Allows providers to override the upload strategy used for file uploads.

**Parameters**:
- `strategy` (string|null): Upload strategy string or null
- `providerId` (string): Provider instance ID

**Returns**: Strategy string or null

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.provider.upload_strategy', 'my-provider', (strategy, providerId) => {
    if (providerId.startsWith('my-provider:')) {
        return 'direct'; // Use direct upload strategy
    }
    return strategy; // Use default strategy
});
```

---

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

#### `aether.provider.form.before_fields`

**Type**: Action
**Location**: `assets/src/components/ProviderForm/index.js`

Fires before provider form fields are rendered. Allows adding content before the form fields.

**Parameters**:
- `hookContext` (Object): Hook context object containing:
  - `providerId` (string): Provider ID
  - `values` (Object): Current form values
  - `handleFieldChange` (Function): Field change handler
  - `errors` (Object): Validation errors
  - `saving` (boolean): Whether form is saving

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.provider.form.before_fields', 'my-plugin', (hookContext) => {
    // Add custom content before form fields
    console.log('Rendering form for:', hookContext.providerId);
});
```

---

#### `aether.provider.form.after_fields`

**Type**: Action
**Location**: `assets/src/components/ProviderForm/index.js`

Fires after provider form fields are rendered. Allows adding content after the form fields.

**Parameters**:
- `hookContext` (Object): Hook context object (same as `before_fields`)

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.provider.form.after_fields', 'my-plugin', (hookContext) => {
    // Add custom content after form fields
});
```

---

#### `aether.provider.form.actions`

**Type**: Action
**Location**: `assets/src/components/ProviderForm/index.js`

Fires in the provider form actions area. Allows adding custom action buttons or controls.

**Parameters**:
- `hookContext` (Object): Hook context object (same as `before_fields`)

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.provider.form.actions', 'my-plugin', (hookContext) => {
    // Add custom action buttons
});
```

---

#### `aether.provider.panel.before_form`

**Type**: Action
**Location**: `assets/src/components/ProviderInstancePanel/index.js`

Fires before the provider instance panel form is rendered.

**Parameters**:
- `hookContext` (Object): Hook context object containing provider instance information

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.provider.panel.before_form', 'my-plugin', (hookContext) => {
    // Add content before provider panel form
});
```

---

#### `aether.provider.panel.after_form`

**Type**: Action
**Location**: `assets/src/components/ProviderInstancePanel/index.js`

Fires after the provider instance panel form is rendered.

**Parameters**:
- `hookContext` (Object): Hook context object containing provider instance information

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.provider.panel.after_form', 'my-plugin', (hookContext) => {
    // Add content after provider panel form
});
```

---

#### `aether.admin.provider.settings.saved`

**Type**: Action
**Location**: `assets/src/hooks/useProviderSettingsForm.js`

Fires after provider settings are successfully saved in the admin interface.

**Parameters**:
- `providerId` (string): Provider instance ID

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.admin.provider.settings.saved', 'my-plugin', (providerId) => {
    console.log(`Settings saved for provider: ${providerId}`);
    // Clear caches, update UI, etc.
});
```

---

### Workflow & Deployment

#### `aether.publish.workflow.before`

**Type**: Action
**Location**: `assets/src/export/executor/StepExecutor.js`

Fires before the publish workflow execution begins.

**Parameters**:
- `executionContext` (Object): Full execution context
- `steps` (Array): Array of step definitions

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.export.workflow.before', 'my-plugin', (executionContext, steps) => {
    console.log('Starting publish workflow with', steps.length, 'steps');
});
```

---

#### `aether.publish.workflow.after`

**Type**: Action
**Location**: `assets/src/export/executor/StepExecutor.js`

Fires after the publish workflow completes successfully.

**Parameters**:
- `state` (Object): Final workflow state
- `executionContext` (Object): Execution context

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.export.workflow.after', 'my-plugin', (state, executionContext) => {
    console.log('Workflow completed successfully');
});
```

---

#### `aether.publish.workflow.error`

**Type**: Action
**Location**: `assets/src/export/executor/StepExecutor.js`

Fires when the publish workflow encounters an error.

**Parameters**:
- `error` (Error): Error object
- `executionContext` (Object): Execution context

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.export.workflow.error', 'my-plugin', (error, executionContext) => {
    console.error('Workflow error:', error.message);
});
```

---

#### `aether.publish.step.{stepId}.before`

**Type**: Action
**Location**: `assets/src/export/executor/StepExecutor.js`

Fires before a specific workflow step executes. Replace `{stepId}` with the actual step ID (e.g., `createWpContentArchive`, `uploadStaticSiteFiles`).

**Parameters**:
- `executionContext` (Object): Execution context

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.export.step.generateBlueprint.before', 'my-plugin', (executionContext) => {
    console.log('Starting createWpContentArchive step');
});
```

---

#### `aether.publish.step.{stepId}.after`

**Type**: Action
**Location**: `assets/src/export/executor/StepExecutor.js`

Fires after a specific workflow step completes successfully.

**Parameters**:
- `result` (Object): Step result
- `executionContext` (Object): Execution context

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.export.step.generateBlueprint.after', 'my-plugin', (result, executionContext) => {
    console.log('Completed createWpContentArchive step');
});
```

---

#### `aether.publish.step.{stepId}.error`

**Type**: Action
**Location**: `assets/src/export/executor/StepExecutor.js`

Fires when a specific workflow step fails.

**Parameters**:
- `error` (Error): Enhanced error object with category, severity, stepId, etc.
- `executionContext` (Object): Execution context

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.export.step.generateBlueprint.error', 'my-plugin', (error, executionContext) => {
    console.error('Step failed:', error.formattedMessage);
});
```

---

#### `aether.publish.step.{stepId}.skip`

**Type**: Filter
**Location**: `assets/src/export/executor/StepExecutor.js`

Determines whether a specific workflow step should be skipped.

**Parameters**:
- `shouldSkip` (boolean): Whether step should be skipped
- `executionContext` (Object): Execution context

**Returns**: Boolean indicating if step should be skipped

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.export.step.generateBlueprint.skip', 'my-plugin', (shouldSkip, executionContext) => {
    // Skip if blueprint already exists
    if (executionContext.state.blueprintData) {
        return true;
    }
    return shouldSkip;
});
```

---

#### `aether.publish.step.{stepId}.skipped`

**Type**: Action
**Location**: `assets/src/export/executor/StepExecutor.js`

Fires when a specific workflow step is skipped.

**Parameters**:
- `executionContext` (Object): Execution context

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.export.step.generateBlueprint.skipped', 'my-plugin', (executionContext) => {
    console.log('createWpContentArchive step was skipped');
});
```

---

#### `aether.publish.step.{stepId}.retry`

**Type**: Action
**Location**: `assets/src/export/executor/StepExecutor.js`

Fires when a specific workflow step retries after an error.

**Parameters**:
- `error` (Error): Error that triggered retry
- `attempt` (number): Retry attempt number
- `delay` (number): Delay in milliseconds before retry
- `executionContext` (Object): Execution context

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.export.step.generateBlueprint.retry', 'my-plugin', (error, attempt, delay, executionContext) => {
    console.log(`Retrying step (attempt ${attempt}) after ${delay}ms`);
});
```

---

#### `aether.publish.step.{stepId}.result`

**Type**: Filter
**Location**: `assets/src/export/executor/StepExecutor.js`

Filters the result of a specific workflow step before it's merged into the workflow state.

**Parameters**:
- `result` (Object): Step result
- `executionContext` (Object): Execution context

**Returns**: Modified result object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.export.step.generateBlueprint.result', 'my-plugin', (result, executionContext) => {
    return {
        ...result,
        customMetadata: 'added by plugin'
    };
});
```

---

#### `aether.publish.step.generateBlueprint.data`

**Type**: Filter
**Location**: `assets/src/export/steps/generateBlueprint/index.js`

Filters blueprint data before the blueprint bundle is created.

**Parameters**:
- `blueprintData` (Object): Blueprint JSON object
- `context` (Object): Execution context

**Returns**: Modified blueprint data

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.export.step.generateBlueprint.data', 'my-plugin', (blueprintData, context) => {
    // Add custom metadata
    blueprintData.description = 'My custom blueprint';
    return blueprintData;
});
```

---

#### `aether.publish.step.createBlueprintBundle.files`

**Type**: Filter
**Location**: `assets/src/export/steps/createBlueprintBundle/index.js`

Filters the list of files to include in the blueprint bundle.

**Parameters**:
- `files` (Array): Array of file paths/assets
- `context` (Object): Execution context

**Returns**: Modified files array

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.export.step.createBlueprintBundle.files', 'my-plugin', (files, context) => {
    // Exclude specific files
    return files.filter(file => !file.includes('exclude-me'));
});
```

---

### File Upload System

#### `aether.file.upload`

**Type**: Action
**Location**: `assets/src/export/utils/unifiedFileUpload.js`

Unified action for all file uploads (blueprint bundles, static HTML, static assets). Providers should hook into this action to handle uploads.

**Parameters**:
- `fileContext` (Object): File context object containing:
  - `fileType` (string): File type (blueprint-bundle, static-html, static-asset)
  - `filePath` (string): File path or URL
  - `fileContent` (Blob|string): File content
  - `contentType` (string): MIME type
  - `storageKey` (string): Storage key/path
  - `providerId` (string): Provider instance ID
  - `metadata` (Object): Additional metadata (siteUrl, staticSiteUrl, etc.)
  - `_uploadPromises` (Array): Array for handlers to register promises

**Note**: Handlers should set `fileContext.result = { success: true/false, error?: string }` to communicate the upload result.

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.file.upload', 'my-provider', async (fileContext) => {
    if (!fileContext.providerId.startsWith('my-provider:')) {
        return; // Not for this provider
    }

    // Register upload promise
    if (!fileContext._uploadPromises) {
        fileContext._uploadPromises = [];
    }

    const uploadPromise = uploadToMyProvider(fileContext);
    fileContext._uploadPromises.push(uploadPromise);

    try {
        const result = await uploadPromise;
        fileContext.result = { success: true, url: result.url };
    } catch (error) {
        fileContext.result = { success: false, error: error.message };
    }
});
```

---

#### `aether.file.upload.context`

**Type**: Filter
**Location**: `assets/src/export/utils/unifiedFileUpload.js`

Filters the file context before the upload action is fired. Allows modifying the context or file content before upload.

**Parameters**:
- `fileContext` (Object): File context object
- `providerId` (string): Provider instance ID

**Returns**: Modified file context

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.file.upload.context', 'my-plugin', (fileContext, providerId) => {
    // Add custom metadata
    fileContext.metadata.customField = 'value';
    return fileContext;
});
```

---

#### `aether.publish.step.uploadStaticSiteFiles.urls`

**Type**: Filter
**Location**: `assets/src/export/steps/uploadStaticFiles/index.js`

Filters the URLs array before static site upload processing begins.

**Parameters**:
- `urls` (Array): Array of URL objects to process
- `providers` (Array): Array of provider IDs
- `context` (Object): Enhanced context with siteUrl, blueprintData, staticSiteUrl, providers

**Returns**: Modified URLs array

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.export.step.uploadStaticSiteFiles.urls', 'my-plugin', (urls, providers, context) => {
    // Add custom URL
    return [...urls, { url: '/custom-page/', type: 'page' }];
});
```

---

#### `aether.publish.step.uploadStaticSiteFiles.result`

**Type**: Filter
**Location**: `assets/src/export/steps/uploadStaticFiles/index.js`

Filters the final upload result before it's returned from the upload step.

**Parameters**:
- `result` (Object): Aggregated upload result
- `providers` (Array): Array of provider IDs
- `context` (Object): Enhanced context

**Returns**: Modified result object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.export.step.uploadStaticSiteFiles.result', 'my-plugin', (result, providers, context) => {
    return {
        ...result,
        customMetadata: 'added by plugin'
    };
});
```

---

### Asset Processing

#### `aether.assets.extracted`

**Type**: Filter
**Location**: `assets/src/export/utils/assetExtractor.js`

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
**Location**: `assets/src/export/utils/assetExtractor.js`

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
**Location**: `assets/src/export/utils/urlRewriter.js`

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
**Location**: `assets/src/export/utils/urlRewriter.js`

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
**Location**: `assets/src/export/utils/urlRewriter.js`

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
**Location**: `assets/src/export/utils/urlRewriter.js`

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
**Location**: `assets/src/export/utils/urlRewriter.js`

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

### Storage Service

#### `aether.storage.service.config`

**Type**: Filter
**Location**: `assets/src/export/utils/staticSiteConfig.js`

Filters the storage service configuration before the service is created.

**Parameters**:
- `config` (Object): Storage service configuration
- `staticPath` (string): Static files path
- `providerId` (string): Provider ID
- `providerConfig` (Object): Provider configuration

**Returns**: Modified configuration object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.storage.service.config', 'my-plugin', (config, staticPath, providerId, providerConfig) => {
    return {
        ...config,
        customOption: 'value'
    };
});
```

---

#### `aether.storage.service.create`

**Type**: Filter
**Location**: `assets/src/export/utils/staticSiteConfig.js`

Filters the storage service instance creation. Allows providing a custom storage service implementation.

**Parameters**:
- `storageService` (Object|null): Storage service instance or null
- `staticPath` (string): Static files path
- `config` (Object): Storage service configuration
- `providerId` (string): Provider ID

**Returns**: StorageService instance or null to use default

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.storage.service.create', 'my-plugin', (service, staticPath, config, providerId) => {
    if (providerId === 'my-provider') {
        return new CustomStorageService(staticPath, config);
    }
    return service; // Use default
});
```

---

### Manifest System

#### `aether.publish.step.uploadStaticSiteFiles.manifest.fetch`

**Type**: Filter
**Location**: `assets/src/export/utils/uploadPhase.js`

Filters manifest fetching. Allows providing a custom manifest or modifying the fetch behavior.

**Parameters**:
- `manifest` (Object|null): Manifest object or null to fetch from storage
- `storageService` (Object): Storage service instance
- `providerId` (string): Provider ID

**Returns**: Manifest object or null to use default fetching

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.export.step.uploadStaticSiteFiles.manifest.fetch', 'my-plugin', (manifest, storageService, providerId) => {
    // Return custom manifest or null to use default fetching
    if (providerId === 'my-provider') {
        return { custom: 'manifest' };
    }
    return manifest; // Use default
});
```

---

#### `aether.publish.step.uploadStaticSiteFiles.manifest.update`

**Type**: Filter
**Location**: `assets/src/export/utils/uploadPhase.js`, `assets/src/export/hooks/useStaticSiteGenerator.js`

Filters manifest updates after a file is uploaded.

**Parameters**:
- `manifest` (Object): Manifest object
- `storageKey` (string): Storage key that was updated
- `providerId` (string): Provider ID

**Returns**: Modified manifest object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.export.step.uploadStaticSiteFiles.manifest.update', 'my-plugin', (manifest, storageKey, providerId) => {
    // Add custom metadata to manifest entry
    if (manifest[storageKey]) {
        manifest[storageKey].customMetadata = 'value';
    }
    return manifest;
});
```

---

#### `aether.publish.step.uploadStaticSiteFiles.manifest.cleanup`

**Type**: Filter
**Location**: `assets/src/export/utils/uploadPhase.js`

Filters manifest cleanup before final manifest upload. Allows keeping additional entries or modifying cleanup behavior.

**Parameters**:
- `manifest` (Object): Cleaned manifest object
- `currentFileKeys` (Set): Set of current file keys
- `providerId` (string): Provider ID

**Returns**: Modified manifest object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.export.step.uploadStaticSiteFiles.manifest.cleanup', 'my-plugin', (manifest, currentFileKeys, providerId) => {
    // Keep additional entries
    return { ...manifest, 'custom-file.html': { size: 100, hash: 'abc' } };
});
```

---

### Blueprint Generation

#### `aether.publish.step.generateBlueprint.steps`

**Type**: Filter
**Location**: `assets/src/export/utils/blueprintStepBuilders.js`

Filters blueprint steps array before final JSON generation.

**Parameters**:
- `steps` (Array): Blueprint steps array
- `config` (Object): Configuration object with wporgPlugins, wporgThemes

**Example**:
```javascript
addFilter('aether.export.step.generateBlueprint.steps', 'my-plugin', (steps, config) => {
    // Add custom step at the end
    steps.push({
        step: 'runPHP',
        code: '<?php update_option("my_custom_option", "value"); ?>'
    });
    return steps;
});
```

---

#### `aether.publish.step.generateBlueprint.json`

**Type**: Filter
**Location**: `assets/src/export/utils/blueprintStepBuilders.js`

Filters complete blueprint JSON object.

**Parameters**:
- `blueprint` (Object): Complete blueprint JSON object
- `steps` (Array): Blueprint steps array

**Example**:
```javascript
addFilter('aether.export.step.generateBlueprint.json', 'my-plugin', (blueprint, steps) => {
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

#### `aether.publish.step.generateBlueprint.assets`

**Type**: Filter
**Location**: `assets/src/export/hooks/useBlueprintGenerator.js`

Filters discovered WordPress.org assets before blueprint generation.

**Parameters**:
- `assets` (Object): Discovered assets object
  - `plugins` (Array): WordPress.org plugin slugs
  - `themes` (Array): WordPress.org theme slugs
- `assetsResponse` (Object): Full asset discovery response

**Example**:
```javascript
addFilter('aether.export.step.generateBlueprint.assets', 'my-plugin', (assets) => {
    // Exclude specific plugins
    assets.plugins = assets.plugins.filter(slug => slug !== 'unwanted-plugin');

    // Add additional plugins
    assets.plugins.push('my-required-plugin');

    return assets;
});
```

---

#### `aether.publish.step.generateBlueprint.generated`

**Type**: Filter
**Location**: `assets/src/export/hooks/useBlueprintGenerator.js`

Filters final generated blueprint before deployment.

**Parameters**:
- `blueprint` (Object): Complete blueprint JSON object
- `wporgPlugins` (Array): WordPress.org plugin slugs
- `wporgThemes` (Array): WordPress.org theme slugs

**Example**:
```javascript
addFilter('aether.export.step.generateBlueprint.generated', 'my-plugin', (blueprint) => {
    // Add custom metadata
    blueprint.description = 'My custom WordPress site';
    return blueprint;
});
```

---

## PHP Hooks

All PHP hooks use WordPress's native `add_filter()` and `add_action()` functions.

### Provider Registration

Providers are registered in JavaScript using the `aether.providers.register` action hook. See the JavaScript hooks section for details.

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

#### `aether_export_validate_config`

**Type**: Filter
**Location**: `includes/REST/Export/ExportStepsController.php`

Filters validation errors for publish configuration.

**Parameters**:
- `$errors` (WP_Error): Validation errors object
- `$config` (array): Configuration being validated
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_filter('aether_export_validate_config', function($errors, $config, $request) {
    // Validate custom deployment settings
    if (!isset($config['deployment_type'])) {
        $errors->add('missing_deployment_type', 'Deployment type is required');
    }
    return $errors;
}, 10, 3);
```

---

#### `aether_export_before_upload`

**Type**: Action
**Location**: `includes/REST/Export/ExportStepsController.php`

Fires before file upload to deployment target.

**Parameters**:
- `$file_path` (string): Path to file being uploaded
- `$config` (array): Publish configuration
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_export_before_upload', function($file_path, $config, $request) {
    // Log upload
    error_log("Uploading file: {$file_path}");

    // Trigger pre-upload webhook
    wp_remote_post('https://example.com/webhook', [
        'body' => ['event' => 'upload_start', 'file' => basename($file_path)]
    ]);
}, 10, 3);
```

---

#### `aether_export_after_upload`

**Type**: Action
**Location**: `includes/REST/Export/ExportStepsController.php`

Fires after successful file upload.

**Parameters**:
- `$file_path` (string): Path to uploaded file
- `$remote_url` (string): Remote URL of uploaded file
- `$config` (array): Publish configuration
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_export_after_upload', function($file_path, $remote_url, $config, $request) {
    // Log success
    error_log("Successfully uploaded to: {$remote_url}");

    // Trigger post-upload webhook
    wp_remote_post('https://example.com/webhook', [
        'body' => ['event' => 'upload_complete', 'url' => $remote_url]
    ]);
}, 10, 4);
```

---

#### `aether_export_upload_error`

**Type**: Action
**Location**: `includes/REST/Export/ExportStepsController.php`

Fires when file upload fails.

**Parameters**:
- `$error` (WP_Error): Error object
- `$file_path` (string): Path to file that failed to upload
- `$config` (array): Publish configuration
- `$request` (WP_REST_Request): REST request object

**Example**:
```php
add_action('aether_export_upload_error', function($error, $file_path, $config, $request) {
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


### Creating a Custom Provider

Providers are implemented in JavaScript and registered via the provider registry system.

**JavaScript Implementation** (`my-provider.js`):

```javascript
import { AbstractProvider } from '@aether/providers/base/AbstractProvider';
import { doAction } from '@wordpress/hooks';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

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
ProviderRegistry.register(provider.getId(), provider);

// Trigger the registration hook
doAction('aether.providers.register', provider);
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
addFilter('aether.export.step.generateBlueprint.assets', 'my-customizations', (assets) => {
    assets.plugins = assets.plugins.filter(slug => {
        return !['jetpack', 'akismet'].includes(slug);
    });
    return assets;
});

// Customize blueprint settings
addFilter('aether.export.step.generateBlueprint.json', 'my-customizations', (blueprint) => {
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
add_action('aether_export_job_created', function($job_id, $config) {
    update_option("deployment_count", (int) get_option("deployment_count", 0) + 1);
    update_option("last_deployment", time());
}, 10, 2);

// Send notifications on status changes
add_action('aether_export_job_status_changed', function($job_id, $new_status, $old_status) {
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


---

## Deprecated Hooks (Removed)

The following hooks have been removed as the job tracking system has been eliminated:

**PHP Hooks:**
- `aether_export_job_data` - Filter initial job data
- `aether_export_job_before_create` - Action before job creation
- `aether_export_job_created` - Action after job creation
- `aether_export_job_status_update` - Filter status updates
- `aether_export_job_status_updated` - Action after status update
- `aether_export_job_before_complete` - Action before completion
- `aether_export_job_complete_status` - Filter completion status
- `aether_export_job_completed` - Action after completion  
- `aether_export_job_failed` - Action on failure
- `aether_export_job_deleted` - Action on deletion
- `aether_export_jobs_list` - Filter jobs list
- `aether_export_step_before` - Action before step execution
- `aether_export_step_result` - Filter step result
- `aether_export_step_after` - Action after step execution
- `aether_export_step_error` - Action on step error

The workflow is now stateless and entirely React-managed without server-side job tracking.
