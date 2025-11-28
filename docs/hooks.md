# Altolith Deploy - Hooks Reference

This document provides a comprehensive reference for all WordPress hooks (filters and actions) available in the Altolith Deploy plugin. These hooks allow third-party developers to extend and customize the plugin's behavior.

## Table of Contents

- [JavaScript Hooks](#javascript-hooks)
  - [Provider System](#provider-system)
  - [Configuration Storage](#configuration-storage)
  - [Admin UI](#admin-ui)
  - [Workflow Execution](#workflow-execution)
  - [Step Registration](#step-registration)
  - [Static Site Generation](#static-site-generation)
  - [Blueprint Generation](#blueprint-generation)
  - [Asset Processing](#asset-processing)
  - [URL Processing](#url-processing)
  - [File Upload](#file-upload)
  - [Utility Filters](#utility-filters)
- [PHP Hooks](#php-hooks)
  - [Provider Configuration](#provider-configuration)
  - [Archive Creation](#archive-creation)
  - [Blueprint Generation](#blueprint-generation-php)
  - [Export Service](#export-service)
  - [CORS Configuration](#cors-configuration)
- [Usage Examples](#usage-examples)

---

## JavaScript Hooks

All JavaScript hooks use the `@wordpress/hooks` package. Import `addFilter` or `addAction` to use them:

```javascript
import { addFilter, addAction } from '@wordpress/hooks';
```

### Provider System

#### `altolith.providers.register`

**Type**: Action
**Location**: `assets/src/providers/registry/ProviderRegistry.js`

Fires when a provider registers itself with the system. Providers call this action to register.

**Parameters**:
- `provider` (Object): Provider class/instance

**Example**:
```javascript
import { doAction } from '@wordpress/hooks';
import ProviderRegistry from '@altolith/providers/registry/ProviderRegistry';

// Register provider in JavaScript registry
ProviderRegistry.register(MyProvider.ID, MyProvider);

// Trigger the registration hook
doAction('altolith.providers.register', MyProvider);
```

---

### Configuration Storage

These hooks are in `assets/src/providers/utils/configStorage.js` and fire during provider configuration CRUD operations.

#### `altolith.storage.config.load`

**Type**: Filter
**Location**: `configStorage.js:67`

Filters configuration after loading from REST API.

**Parameters**:
- `config` (Object): Loaded configuration
- `providerId` (string): Provider identifier

**Returns**: Modified configuration object

---

#### `altolith.storage.config.loaded`

**Type**: Action
**Location**: `configStorage.js:86`

Fires after configuration is loaded from storage.

**Parameters**:
- `config` (Object): Loaded configuration
- `providerId` (string): Provider identifier

---

#### `altolith.storage.config.before_save`

**Type**: Filter
**Location**: `configStorage.js:128`

Filters configuration before saving to REST API.

**Parameters**:
- `config` (Object): Configuration to save
- `providerId` (string): Provider identifier

**Returns**: Modified configuration object

---

#### `altolith.storage.config.saved`

**Type**: Action
**Location**: `configStorage.js:154`

Fires after configuration is saved to storage.

**Parameters**:
- `config` (Object): Saved configuration
- `providerId` (string): Provider identifier

---

#### `altolith.storage.config.before_delete`

**Type**: Action
**Location**: `configStorage.js:180`

Fires before configuration is deleted from storage.

**Parameters**:
- `providerId` (string): Provider identifier

---

#### `altolith.storage.config.deleted`

**Type**: Action
**Location**: `configStorage.js:200`

Fires after configuration is deleted from storage.

**Parameters**:
- `providerId` (string): Provider identifier

---

### Admin UI

#### `altolith.admin.provider.field.before`

**Type**: Action
**Location**: `assets/src/components/ProviderField/index.js:87`

Fires before a provider configuration field is rendered.

**Parameters**:
- `context` (Object): Field context with `field`, `fieldId`, `value`, `providerId`, `formValues`, `onFormChange`

---

#### `altolith.admin.provider.field.after`

**Type**: Filter
**Location**: `assets/src/components/ProviderField/index.js:78`

Filter to inject content after a provider configuration field.

**Parameters**:
- `content` (any): Current content (null by default)
- `context` (Object): Field context with `field`, `fieldId`, `value`, `providerId`, `formValues`, `onFormChange`

**Returns**: React component or null

**Example**:
```javascript
addFilter('altolith.admin.provider.field.after', 'my-plugin', (content, context) => {
    if (context.fieldId === 'api_key') {
        return <MyCustomButton config={context.formValues} />;
    }
    return content;
});
```

---

#### `altolith.admin.provider.modal.header`

**Type**: Filter
**Location**: `assets/src/components/ProviderForm/index.js:276`

Filter to inject content into the provider modal header.

**Parameters**:
- `content` (any): Current content (null by default)
- `context` (Object): Modal context

**Returns**: React component or null

---

### Workflow Execution

These hooks are in `assets/src/export/executor/StepExecutor.js` and fire during workflow execution.

#### `altolith.export.workflow.before`

**Type**: Action
**Location**: `StepExecutor.js:67`

Fires before the export workflow execution begins.

**Parameters**:
- `executionContext` (Object): Full execution context
- `steps` (Array): Array of step definitions
- `providerInstance` (Object|null): Current provider instance

---

#### `altolith.export.workflow.after`

**Type**: Action
**Location**: `StepExecutor.js:99`

Fires after the export workflow completes successfully.

**Parameters**:
- `state` (Object): Final workflow state
- `executionContext` (Object): Execution context
- `providerInstance` (Object|null): Current provider instance

---

#### `altolith.export.workflow.error`

**Type**: Action
**Location**: `StepExecutor.js:111`

Fires when the export workflow encounters an error.

**Parameters**:
- `error` (Error): Error object
- `executionContext` (Object): Execution context
- `providerInstance` (Object|null): Current provider instance

---

#### `altolith.export.step.{stepId}.before`

**Type**: Action
**Location**: `StepExecutor.js:221`

Fires before a specific workflow step executes. Replace `{stepId}` with the actual step ID.

**Parameters**:
- `executionContext` (Object): Execution context
- `providerInstance` (Object|null): Current provider instance

---

#### `altolith.export.step.{stepId}.after`

**Type**: Action
**Location**: `StepExecutor.js:283`

Fires after a specific workflow step completes successfully.

**Parameters**:
- `result` (Object): Step result
- `executionContext` (Object): Execution context
- `providerInstance` (Object|null): Current provider instance

---

#### `altolith.export.step.{stepId}.error`

**Type**: Action
**Location**: `assets/src/export/utils/errorHandler.js:459`

Fires when a specific workflow step fails.

**Parameters**:
- `error` (Error): Enhanced error object
- `executionContext` (Object): Execution context
- `providerInstance` (Object|null): Current provider instance

---

#### `altolith.export.step.{stepId}.skip`

**Type**: Filter
**Location**: `StepExecutor.js:162`

Determines whether a specific workflow step should be skipped.

**Parameters**:
- `shouldSkip` (boolean): Whether step should be skipped
- `executionContext` (Object): Execution context
- `providerInstance` (Object|null): Current provider instance

**Returns**: Boolean

---

#### `altolith.export.step.{stepId}.skipped`

**Type**: Action
**Location**: `StepExecutor.js:172`

Fires when a specific workflow step is skipped.

**Parameters**:
- `executionContext` (Object): Execution context
- `providerInstance` (Object|null): Current provider instance

---

#### `altolith.export.step.{stepId}.retry`

**Type**: Action
**Location**: `StepExecutor.js:252`

Fires when a specific workflow step retries after an error.

**Parameters**:
- `error` (Error): Error that triggered retry
- `attempt` (number): Retry attempt number
- `delay` (number): Delay in milliseconds before retry
- `executionContext` (Object): Execution context
- `providerInstance` (Object|null): Current provider instance

---

#### `altolith.export.step.{stepId}.result`

**Type**: Filter
**Location**: `StepExecutor.js:268`

Filters the result of a specific workflow step before it's merged into the workflow state.

**Parameters**:
- `result` (Object): Step result
- `executionContext` (Object): Execution context
- `providerInstance` (Object|null): Current provider instance

**Returns**: Modified result object

---

### Step Registration

#### `altolith.export.register_steps`

**Type**: Action
**Location**: `assets/src/export/steps/index.js:33`

Fires when the workflow is collecting step registrations.

**Parameters**:
- `registry` (StepRegistry): The step registry instance

**Example**:
```javascript
addAction('altolith.export.register_steps', 'my-plugin', (registry) => {
    registry.register({
        id: 'myCustomStep',
        label: 'My Custom Step',
        description: 'Does something custom',
        supportsProgress: true,
        dependencies: ['someOtherStep'],
        requires: {
            someData: { from: 'someOtherStep', required: true },
        },
        provides: {
            myStepResult: 'object',
        },
        handler: async (context) => {
            return { myStepResult: { success: true } };
        },
    });
});
```

---

### Static Site Generation

#### `altolith.export.step.uploadStaticSiteFiles.urls`

**Type**: Filter
**Location**: `assets/src/export/steps/uploadStaticFiles/index.js:161`

Filters the URLs array before static site upload processing.

**Parameters**:
- `urls` (Array): Array of URL objects to process
- `providers` (Array): Array of provider IDs
- `context` (Object): Enhanced context

**Returns**: Modified URLs array

---

#### `altolith.export.step.uploadStaticSiteFiles.result`

**Type**: Filter
**Location**: `assets/src/export/steps/uploadStaticFiles/index.js:232`

Filters the final upload result.

**Parameters**:
- `result` (Object): Aggregated upload result
- `providers` (Array): Array of provider IDs
- `context` (Object): Enhanced context

**Returns**: Modified result object

---

#### `altolith.export.step.uploadStaticSiteFiles.pre_scan.before`

**Type**: Action
**Location**: `assets/src/export/utils/preScanPhase.js:42`

Fires before pre-scan phase starts.

**Parameters**:
- `urls` (Array): URLs to scan
- `staticSiteProviderId` (string): Provider ID
- `providerConfig` (Object): Provider configuration

---

#### `altolith.export.step.uploadStaticSiteFiles.pre_scan.after`

**Type**: Action
**Location**: `assets/src/export/utils/preScanPhase.js:144`

Fires after pre-scan phase completes.

**Parameters**:
- `stats` (Object): Pre-scan statistics
- `staticSiteProviderId` (string): Provider ID

---

#### `altolith.export.step.uploadStaticSiteFiles.upload.before`

**Type**: Action
**Location**: `assets/src/export/hooks/useStaticSiteGenerator.js:131`

Fires before upload phase starts.

**Parameters**:
- `cachedUrls` (Array): URLs to upload
- `totalFilesToUpload` (number): Total files to upload
- `staticSiteProviderId` (string): Provider ID

---

#### `altolith.export.step.uploadStaticSiteFiles.upload.after`

**Type**: Action
**Location**: `assets/src/export/hooks/useStaticSiteGenerator.js:277`

Fires after upload phase completes.

**Parameters**:
- `result` (Object): Upload result statistics
- `staticSiteProviderId` (string): Provider ID

---

#### `altolith.export.step.uploadStaticSiteFiles.html.process`

**Type**: Filter
**Location**: `assets/src/export/utils/uploadPhase.js:318`

Filters HTML before processing (URL rewriting, admin bar removal).

**Parameters**:
- `html` (string): Raw HTML content
- `url` (string): Page URL
- `siteUrl` (string): Site URL
- `staticSiteUrl` (string): Static site deployment URL
- `staticSiteProviderId` (string): Provider ID

**Returns**: Modified HTML string

---

#### `altolith.export.step.uploadStaticSiteFiles.asset.process`

**Type**: Filter
**Location**: `assets/src/export/utils/uploadPhase.js:157`

Filters asset data before upload.

**Parameters**:
- `assetData` (Object): Asset data with `blob`, `path`, `key`, `contentType`, `url`
- `staticSiteProviderId` (string): Provider ID

**Returns**: Modified asset data object

---

#### `altolith.export.step.uploadStaticSiteFiles.manifest.fetch`

**Type**: Filter
**Location**: `assets/src/export/utils/uploadPhase.js:47`

Filters manifest fetching.

**Parameters**:
- `manifest` (Object|null): Manifest object or null
- `storageService` (Object): Storage service instance
- `providerId` (string): Provider ID

**Returns**: Manifest object or null

---

#### `altolith.export.step.uploadStaticSiteFiles.manifest.update`

**Type**: Filter
**Location**: `assets/src/export/utils/uploadPhase.js:269`, `useStaticSiteGenerator.js:210`

Filters manifest updates after a file is uploaded.

**Parameters**:
- `manifest` (Object): Manifest object
- `storageKey` (string): Storage key that was updated
- `providerId` (string): Provider ID

**Returns**: Modified manifest object

---

#### `altolith.export.step.uploadStaticSiteFiles.manifest.cleanup`

**Type**: Filter
**Location**: `assets/src/export/utils/uploadPhase.js:509`

Filters manifest cleanup before final upload.

**Parameters**:
- `manifest` (Object): Cleaned manifest object
- `currentFileKeys` (Set): Set of current file keys
- `providerId` (string): Provider ID

**Returns**: Modified manifest object

---

#### `altolith.storage.service.config`

**Type**: Filter
**Location**: `assets/src/export/utils/staticSiteConfig.js:142`

Filters storage service configuration before creation.

**Parameters**:
- `config` (Object): Storage configuration
- `staticPath` (string): Static files path
- `providerId` (string): Provider ID
- `providerConfig` (Object): Provider configuration

**Returns**: Modified configuration object

---

#### `altolith.storage.service.create`

**Type**: Filter
**Location**: `assets/src/export/utils/staticSiteConfig.js:153`

Allows providing a custom StorageService instance.

**Parameters**:
- `storageService` (Object|null): Storage service or null
- `staticPath` (string): Static files path
- `config` (Object): Storage configuration
- `providerId` (string): Provider ID
- `providerConfig` (Object): Provider configuration

**Returns**: StorageService instance or null

---

### Blueprint Generation

#### `altolith.export.step.createBlueprintBundle.assets`

**Type**: Filter
**Location**: `assets/src/export/hooks/useBlueprintGenerator.js:76`

Filters discovered WordPress.org assets before blueprint generation.

**Parameters**:
- `assets` (Object): Discovered assets with `plugins` and `themes` arrays
- `assetsResponse` (Object): Full asset discovery response

**Returns**: Modified assets object

---

#### `altolith.export.step.createBlueprintBundle.generated`

**Type**: Filter
**Location**: `assets/src/export/hooks/useBlueprintGenerator.js:174`

Filters final generated blueprint before deployment.

**Parameters**:
- `blueprint` (Object): Complete blueprint JSON object
- `wporgPlugins` (Array): WordPress.org plugin slugs
- `wporgThemes` (Array): WordPress.org theme slugs

**Returns**: Modified blueprint object

---

#### `altolith.export.step.createBlueprintBundle.steps`

**Type**: Filter
**Location**: `assets/src/export/utils/blueprintStepBuilders.js:116`

Filters blueprint steps array before final JSON generation.

**Parameters**:
- `steps` (Array): Blueprint steps array
- `config` (Object): Configuration object

**Returns**: Modified steps array

---

#### `altolith.export.step.createBlueprintBundle.json`

**Type**: Filter
**Location**: `assets/src/export/utils/blueprintStepBuilders.js:170`

Filters complete blueprint JSON object.

**Parameters**:
- `blueprint` (Object): Complete blueprint JSON
- `steps` (Array): Blueprint steps array

**Returns**: Modified blueprint object

---

#### `altolith.export.step.createBlueprintBundle.blueprintData`

**Type**: Filter
**Location**: `assets/src/export/steps/createBlueprintBundle/index.js:213`

Filters blueprint data before returning from step.

**Parameters**:
- `blueprintData` (Object): Blueprint data object

**Returns**: Modified blueprint data

---

### Asset Processing

#### `altolith.assets.extracted`

**Type**: Filter
**Location**: `assets/src/export/utils/assetExtractor.js:117`

Filters extracted assets from HTML.

**Parameters**:
- `assets` (Array): Array of asset URLs
- `html` (string): Source HTML
- `pageUrl` (string): Page URL
- `siteUrl` (string): Site URL

**Returns**: Modified assets array

---

#### `altolith.assets.should_collect`

**Type**: Filter
**Location**: `assets/src/export/utils/assetFilters.js:108`

Filters whether a specific asset should be collected.

**Parameters**:
- `shouldCollect` (boolean): Whether to collect
- `url` (string): Asset URL
- `siteUrl` (string): Site URL
- `source` (string): Source type ('css', 'js', 'img', etc.)
- `extension` (string): File extension

**Returns**: Boolean

---

#### `altolith.links.extracted`

**Type**: Filter
**Location**: `assets/src/export/utils/linkExtractor.js:158`

Filters extracted links from HTML.

**Parameters**:
- `links` (Array): Array of link URLs
- `html` (string): Source HTML
- `pageUrl` (string): Page URL
- `siteUrl` (string): Site URL

**Returns**: Modified links array

---

### URL Processing

#### `altolith.url.resolve`

**Type**: Filter
**Location**: `assets/src/export/utils/urlUtils.js:50`

Filters resolved URL after relative-to-absolute conversion.

**Parameters**:
- `resolvedUrl` (string): Resolved absolute URL
- `url` (string): Original relative URL
- `baseUrl` (string): Base URL used for resolution

**Returns**: Modified URL string

---

#### `altolith.url.is_external`

**Type**: Filter
**Location**: `assets/src/export/utils/urlUtils.js:93`

Filters external URL detection result.

**Parameters**:
- `isExternalUrl` (boolean): Whether URL is external
- `url` (string): URL being checked
- `siteUrl` (string): Site URL for comparison

**Returns**: Boolean

---

#### `altolith.url.normalize`

**Type**: Filter
**Location**: `assets/src/export/utils/urlUtils.js:183`

Filters normalized URL.

**Parameters**:
- `url` (string): Normalized URL
- `siteUrl` (string): Site URL

**Returns**: Modified URL string

---

#### `altolith.url.rewrite`

**Type**: Filter
**Location**: `assets/src/export/utils/urlRewriter.js:202`

Filters rewritten URL after static site conversion.

**Parameters**:
- `rewrittenUrl` (string): Final rewritten URL
- `url` (string): Original URL
- `contextUrl` (string): Context URL
- `siteUrl` (string): Site URL
- `staticUrl` (string): Static URL

**Returns**: Modified URL string

---

#### `altolith.url.rewrite_html`

**Type**: Filter
**Location**: `assets/src/export/utils/urlRewriter.js:256`

Filters HTML after URL rewriting.

**Parameters**:
- `html` (string): Rewritten HTML content
- `contextUrl` (string): Context URL
- `siteUrl` (string): Site URL
- `staticUrl` (string): Static URL

**Returns**: Modified HTML string

---

### File Upload

These hooks are in `assets/src/export/utils/fileUploadManager.js`.

#### `altolith.upload.file.before`

**Type**: Action
**Location**: `fileUploadManager.js:117`

Fires before each file upload.

**Parameters**:
- `fileData` (Object): File data with `key`, `blob`, `contentType`, `displayName`

---

#### `altolith.upload.file.after`

**Type**: Action
**Location**: `fileUploadManager.js:454`

Fires after each file upload succeeds.

**Parameters**:
- `result` (Object): Upload result with `key`, `url`, `hash`, `size`
- `displayName` (string): Display name

---

#### `altolith.upload.file.options`

**Type**: Filter
**Location**: `fileUploadManager.js:333`

Filters upload options before file upload.

**Parameters**:
- `uploadOptions` (Object): Upload options
- `key` (string): Storage key
- `blob` (Blob): File blob
- `contentType` (string): Content type
- `metadata` (Object): File metadata

**Returns**: Modified upload options

---

#### `altolith.upload.hash.calculate`

**Type**: Filter
**Location**: `fileUploadManager.js:153`, `fileUploadManager.js:239`

Filters hash calculation for skip checking and manifest.

**Parameters**:
- `hash` (string|null): Pre-calculated hash or null
- `blob` (Blob): File blob
- `key` (string): Storage key
- `manifest` (Object): Manifest object

**Returns**: Hash string or null

---

### Utility Filters

#### `altolith.deploymentTypes`

**Type**: Filter
**Location**: `assets/src/utils/deploymentTypes.js:20`

Filters available deployment types.

**Parameters**:
- `deploymentTypes` (Object): Deployment types object

**Returns**: Modified deployment types

---

## PHP Hooks

All PHP hooks use WordPress's native `add_filter()` and `add_action()` functions.

### Provider Configuration

These hooks are in `includes/REST/ProviderConfigController.php`.

#### `altolith_provider_config_load`

**Type**: Filter
**Location**: `ProviderConfigController.php:140`

Filters provider configuration after loading from database.

**Parameters**:
- `$config` (array): The provider configuration
- `$instanceId` (string): The instance ID

**Returns**: Modified configuration array

---

#### `altolith_provider_config_loaded`

**Type**: Action
**Location**: `ProviderConfigController.php:148`

Fires after provider configuration is loaded.

**Parameters**:
- `$instanceId` (string): The instance ID
- `$config` (array): The loaded configuration

---

#### `altolith_provider_config_save`

**Type**: Filter
**Location**: `ProviderConfigController.php:204`

Filters provider configuration before saving.

**Parameters**:
- `$config` (array): Configuration to save
- `$instanceId` (string): The instance ID

**Returns**: Modified configuration array

---

#### `altolith_provider_config_saved`

**Type**: Action
**Location**: `ProviderConfigController.php:229`

Fires after provider configuration is saved.

**Parameters**:
- `$instanceId` (string): The instance ID
- `$config` (array): The saved configuration

---

#### `altolith_provider_config_before_delete`

**Type**: Action
**Location**: `ProviderConfigController.php:263`

Fires before provider configuration is deleted.

**Parameters**:
- `$instanceId` (string): The instance ID

---

#### `altolith_provider_config_deleted`

**Type**: Action
**Location**: `ProviderConfigController.php:282`

Fires after provider configuration is deleted.

**Parameters**:
- `$instanceId` (string): The instance ID

---

#### `altolith_provider_config_sanitize`

**Type**: Filter
**Location**: `includes/REST/RESTHelpersTrait.php:378`

Filters sanitized configuration values.

**Parameters**:
- `$sanitized` (array): Sanitized configuration
- `$config` (array): Original configuration
- `$depth` (int): Recursion depth

**Returns**: Modified sanitized array

---

### Archive Creation

These hooks are in `includes/REST/Export/ExportStepsController.php`.

#### `altolith_archive_before_create`

**Type**: Action
**Location**: `ExportStepsController.php:117`

Fires before wp-content archive creation.

**Parameters**:
- `$progressId` (string): Progress tracking ID
- `$customAssets` (array): Custom assets to include

---

#### `altolith_archive_result`

**Type**: Filter
**Location**: `ExportStepsController.php:144`

Filters archive creation result.

**Parameters**:
- `$result` (array): Archive result with path, URL, size
- `$progressId` (string): Progress tracking ID

**Returns**: Modified result array

---

#### `altolith_archive_created`

**Type**: Action
**Location**: `ExportStepsController.php:157`

Fires after archive is created.

**Parameters**:
- `$result` (array): Archive result
- `$progressId` (string): Progress tracking ID

---

### Blueprint Generation (PHP)

#### `altolith_blueprint_data`

**Type**: Filter
**Location**: `ExportStepsController.php:249`

Filters blueprint data before generation.

**Parameters**:
- `$blueprintData` (array): Blueprint data
- `$archiveResult` (array): Archive creation result

**Returns**: Modified blueprint data

---

#### `altolith_blueprint_before_generate`

**Type**: Action
**Location**: `ExportStepsController.php:267`

Fires before blueprint bundle generation.

**Parameters**:
- `$blueprintData` (array): Blueprint data
- `$zipPath` (string): Path to wp-content.zip
- `$outputDir` (string): Output directory

---

#### `altolith_blueprint_bundle_result`

**Type**: Filter
**Location**: `ExportStepsController.php:304`

Filters blueprint bundle result.

**Parameters**:
- `$bundleResult` (array): Bundle result with path, URL, size

**Returns**: Modified result array

---

#### `altolith_blueprint_generated`

**Type**: Action
**Location**: `ExportStepsController.php:316`

Fires after blueprint bundle is generated.

**Parameters**:
- `$bundleResult` (array): Bundle result

---

#### `altolith_blueprint_bundle_upload`

**Type**: Action
**Location**: `includes/REST/LocalStorageController.php:705`

Fires when a blueprint bundle needs to be uploaded.

**Parameters**:
- `$instanceId` (string): Provider instance ID
- `$sourcePath` (string): Source path of bundle
- `$destinationPath` (string): Destination path
- `$context` (array): Additional context

---

### Export Service

#### `altolith_deploy_export_complete_site`

**Type**: Filter
**Location**: `includes/Services/ExportService.php:178`

Filters complete site export result.

**Parameters**:
- `$result` (array): Export result

**Returns**: Modified result array

---

### CORS Configuration

#### `altolith_deploy_cors_allowed_origins`

**Type**: Filter
**Location**: `includes/Utilities/CorsHandler.php:182`

Filters allowed CORS origins.

**Parameters**:
- `$allowedOrigins` (array): Array of allowed origin URLs

**Returns**: Modified origins array

**Example**:
```php
add_filter('altolith_deploy_cors_allowed_origins', function($origins) {
    $origins[] = 'https://my-custom-playground.com';
    return $origins;
});
```

---

## Usage Examples

### Creating a Custom Provider

```javascript
import { doAction } from '@wordpress/hooks';
import ProviderRegistry from '@altolith/providers/registry/ProviderRegistry';

class MyCustomProvider {
    static ID = 'my-custom-provider';
    static NAME = 'My Custom Provider';
    static DEPLOYMENT_TYPE = 'static_site';
    static CONFIG_FIELDS = [
        { id: 'api_key', label: 'API Key', type: 'text', required: true, secure: true },
    ];
}

ProviderRegistry.register(MyCustomProvider.ID, MyCustomProvider);
doAction('altolith.providers.register', MyCustomProvider);
```

### Custom Asset Handling

```javascript
import { addFilter } from '@wordpress/hooks';

// Exclude analytics scripts
addFilter('altolith.assets.should_collect', 'my-plugin', (shouldCollect, url) => {
    if (url.includes('google-analytics.com')) {
        return false;
    }
    return shouldCollect;
});

// Add custom assets
addFilter('altolith.assets.extracted', 'my-plugin', (assets) => {
    assets.push('https://fonts.googleapis.com/css2?family=Roboto');
    return assets;
});
```

### Customizing Blueprint

```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.export.step.createBlueprintBundle.json', 'my-plugin', (blueprint) => {
    blueprint.landingPage = '/wp-admin/';
    blueprint.preferredVersions.php = '8.2';
    return blueprint;
});
```

### Custom HTML Processing

```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.export.step.uploadStaticSiteFiles.html.process', 'my-plugin',
    (html, url, siteUrl, staticSiteUrl, providerId) => {
        // Add custom meta tag
        return html.replace('</head>', '<meta name="generator" content="Altolith" /></head>');
    }
);
```

---

## Hook Naming Conventions

- **JavaScript hooks**: `altolith.{category}.{action}` (dot-separated)
- **PHP hooks**: `altolith_{category}_{action}` (underscore-separated)

## Best Practices

1. **Always return the filtered value** in filters
2. **Use appropriate priority** (default 10, lower = earlier)
3. **Namespace your hook callbacks** to avoid conflicts
4. **Validate inputs** before using them
5. **Handle errors gracefully**
