# uploadStaticSiteFiles Step - Hook Reference

Hooks follow a hierarchical pattern: `aether.publish.{jobId}.{phaseId}.{stepId}.{action}`. For the complete hook system documentation, see `WORKFLOW_REFACTOR.md`.

This document provides a comprehensive reference for all hooks available in the `uploadStaticSiteFiles` step, which generates static HTML/CSS/JS files and uploads them to storage providers.

## Table of Contents

1. [Step-Level Hooks](#step-level-hooks)
2. [Phase Hooks](#phase-hooks)
3. [Storage Service Hooks](#storage-service-hooks)
4. [HTML Processing Hooks](#html-processing-hooks)
5. [Asset Processing Hooks](#asset-processing-hooks)
6. [Manifest Hooks](#manifest-hooks)
7. [File Upload Hooks](#file-upload-hooks)
8. [Asset Extraction Hooks](#asset-extraction-hooks)

## Step-Level Hooks

These hooks are fired by the workflow executor for the `uploadStaticSiteFiles` step.

### `aether.publish.step.uploadStaticSiteFiles.before`

**Type**: Action  
**Fired**: Before step execution begins  
**Parameters**: 
- `context` (Object) - Full execution context including:
  - `urls` - Array of URLs to process
  - `staticSiteProviders` - Array of provider IDs
  - `blueprintData` - Blueprint data from previous step
  - `siteUrl` - WordPress site URL
  - All previous step results merged into context

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.publish.step.uploadStaticSiteFiles.before', 'my-provider', (context) => {
  console.log('Starting static site upload:', context.staticSiteProviders);
});
```

### `aether.publish.step.uploadStaticSiteFiles.result`

**Type**: Filter  
**Fired**: After step completes, before result is merged into workflow state  
**Parameters**:
- `result` (Object) - Step result object
- `context` (Object) - Execution context

**Returns**: Modified result object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.publish.step.uploadStaticSiteFiles.result', 'my-provider', (result, context) => {
  return {
    ...result,
    customMetadata: 'added by provider'
  };
});
```

### `aether.publish.step.uploadStaticSiteFiles.after`

**Type**: Action  
**Fired**: After step completes successfully  
**Parameters**:
- `result` (Object) - Filtered step result
- `context` (Object) - Execution context

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.publish.step.uploadStaticSiteFiles.after', 'my-provider', (result, context) => {
  console.log('Upload complete:', result.filesUploaded, 'files');
});
```

### `aether.publish.step.uploadStaticSiteFiles.error`

**Type**: Action  
**Fired**: When step fails  
**Parameters**:
- `error` (Error) - Error object
- `context` (Object) - Execution context

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.publish.step.uploadStaticSiteFiles.error', 'my-provider', (error, context) => {
  console.error('Upload failed:', error.message);
});
```

## Step-Specific Hooks

### `aether.publish.step.uploadStaticSiteFiles.urls`

**Type**: Filter  
**Location**: `uploadStaticSiteFilesStep.js:94`  
**Fired**: Before URLs are processed  
**Parameters**:
- `urls` (Array) - Array of URL objects to process
- `providers` (Array) - Array of provider IDs
- `context` (Object) - Enhanced context with `siteUrl`, `blueprintData`, `staticSiteUrl`, `providers`

**Returns**: Modified URLs array

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.publish.step.uploadStaticSiteFiles.urls', 'my-provider', (urls, providers, context) => {
  // Add custom URL
  return [...urls, { url: '/custom-page/', type: 'page' }];
});
```

### `aether.publish.step.uploadStaticSiteFiles.result`

**Type**: Filter  
**Location**: `uploadStaticSiteFilesStep.js:212`  
**Fired**: Before final result is returned  
**Parameters**:
- `result` (Object) - Aggregated upload result
- `providers` (Array) - Array of provider IDs
- `context` (Object) - Enhanced context with `siteUrl`, `blueprintData`, `staticSiteUrl`

**Returns**: Modified result object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.publish.step.uploadStaticSiteFiles.result', 'my-provider', (result, providers, context) => {
  return {
    ...result,
    customMetadata: 'added by provider'
  };
});
```

## Phase Hooks

These hooks are fired during the static site generation phases.

### `aether.publish.step.uploadStaticSiteFiles.pre_scan.before`

**Type**: Action  
**Location**: `preScanPhase.js:43`  
**Fired**: Before pre-scan phase starts  
**Parameters**:
- `urls` (Array) - URLs to scan
- `staticSiteProviderId` (string) - Provider ID
- `providerConfig` (Object) - Provider configuration

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.publish.step.uploadStaticSiteFiles.pre_scan.before', 'my-provider', (urls, providerId, config) => {
  console.log('Starting pre-scan for', urls.length, 'URLs');
});
```

### `aether.publish.step.uploadStaticSiteFiles.pre_scan.after`

**Type**: Action  
**Location**: `preScanPhase.js:155`  
**Fired**: After pre-scan phase completes  
**Parameters**:
- `stats` (Object) - Pre-scan statistics:
  - `urlsScanned` (number) - Total URLs scanned
  - `urlsSuccessful` (number) - URLs successfully cached
  - `uniqueAssets` (number) - Unique assets discovered
  - `totalFiles` (number) - Total files to upload
- `staticSiteProviderId` (string) - Provider ID

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.publish.step.uploadStaticSiteFiles.pre_scan.after', 'my-provider', (stats, providerId) => {
  console.log('Pre-scan complete:', stats);
});
```

### `aether.publish.step.uploadStaticSiteFiles.upload.before`

**Type**: Action  
**Location**: `useStaticSiteGenerator.js:119`  
**Fired**: Before upload phase starts  
**Parameters**:
- `cachedUrls` (Array) - URLs to upload
- `totalFilesToUpload` (number) - Total files to upload
- `staticSiteProviderId` (string) - Provider ID

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.publish.step.uploadStaticSiteFiles.upload.before', 'my-provider', (urls, totalFiles, providerId) => {
  console.log('Starting upload phase:', totalFiles, 'files');
});
```

### `aether.publish.step.uploadStaticSiteFiles.upload.after`

**Type**: Action  
**Location**: `useStaticSiteGenerator.js:276`  
**Fired**: After upload phase completes  
**Parameters**:
- `result` (Object) - Upload result statistics:
  - `filesUploaded` (number) - Files uploaded
  - `filesSkipped` (number) - Files skipped
  - `urlsSucceeded` (number) - URLs succeeded
  - `urlsFailed` (number) - URLs failed
  - `assetsUploaded` (number) - Assets uploaded
- `staticSiteProviderId` (string) - Provider ID

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.publish.step.uploadStaticSiteFiles.upload.after', 'my-provider', (result, providerId) => {
  console.log('Upload phase complete:', result);
});
```

## Storage Service Hooks

### `aether.storage.service.config`

**Type**: Filter  
**Location**: `useStaticSiteGenerator.js:131`  
**Fired**: Before StorageService is created  
**Parameters**:
- `config` (Object) - Storage service configuration
- `staticPath` (string) - Static files path
- `staticSiteProviderId` (string) - Provider ID
- `providerConfig` (Object) - Provider configuration

**Returns**: Modified configuration object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.storage.service.config', 'my-provider', (config, staticPath, providerId, providerConfig) => {
  return {
    ...config,
    customOption: 'value'
  };
});
```

### `aether.storage.service.create`

**Type**: Filter  
**Location**: `useStaticSiteGenerator.js:159`  
**Fired**: Before StorageService is created  
**Parameters**:
- `storageService` (StorageService|null) - Storage service instance or null
- `staticPath` (string) - Static files path
- `config` (Object) - Storage service configuration
- `providerId` (string) - Provider ID

**Returns**: StorageService instance or null to use default

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.storage.service.create', 'my-provider', (service, staticPath, config, providerId) => {
  if (providerId === 'my-provider') {
    return new CustomStorageService(staticPath, config);
  }
  return service; // Use default
});
```

## HTML Processing Hooks

### `aether.publish.step.uploadStaticSiteFiles.html.process`

**Type**: Filter  
**Location**: `uploadPhase.js:336`, `unifiedFileUpload.js:178`  
**Fired**: Before HTML is processed (URL rewriting, admin bar removal, etc.)  
**Parameters**:
- `html` (string) - Raw HTML content
- `url` (string) - Page URL
- `siteUrl` (string) - Site URL
- `staticSiteUrl` (string) - Static site deployment URL
- `staticSiteProviderId` (string) - Provider ID

**Returns**: Modified HTML string

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.publish.step.uploadStaticSiteFiles.html.process', 'my-provider', (html, url, siteUrl, staticSiteUrl, providerId) => {
  // Add custom meta tag
  return html.replace('</head>', '<meta name="custom" content="value" /></head>');
});
```

## Asset Processing Hooks

### `aether.publish.step.uploadStaticSiteFiles.asset.process`

**Type**: Filter  
**Location**: `uploadPhase.js:167`  
**Fired**: Before asset is added to upload queue  
**Parameters**:
- `assetData` (Object) - Asset data object:
  - `blob` (Blob) - Asset blob
  - `path` (string) - Asset local path
  - `key` (string) - Storage key
  - `contentType` (string) - Content type
  - `url` (string) - Original asset URL
- `staticSiteProviderId` (string) - Provider ID

**Returns**: Modified asset data object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.publish.step.uploadStaticSiteFiles.asset.process', 'my-provider', (assetData, providerId) => {
  // Modify asset blob
  return {
    ...assetData,
    blob: new Blob([assetData.blob], { type: 'image/webp' })
  };
});
```

## Manifest Hooks

### `aether.publish.step.uploadStaticSiteFiles.manifest.fetch`

**Type**: Filter  
**Location**: `uploadPhase.js:48`  
**Fired**: Before manifest is fetched from storage  
**Parameters**:
- `manifest` (Object|null) - Manifest object or null to fetch from storage
- `storageService` (Object) - Storage service instance
- `staticSiteProviderId` (string) - Provider ID

**Returns**: Manifest object or null to use default fetching

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.publish.step.uploadStaticSiteFiles.manifest.fetch', 'my-provider', (manifest, storageService, providerId) => {
  // Return custom manifest or null to use default fetching
  if (providerId === 'my-provider') {
    return { custom: 'manifest' };
  }
  return manifest; // Use default
});
```

### `aether.publish.step.uploadStaticSiteFiles.manifest.update`

**Type**: Filter  
**Location**: `uploadPhase.js:287`, `useStaticSiteGenerator.js:185`  
**Fired**: After manifest entry is updated  
**Parameters**:
- `manifest` (Object) - Manifest object
- `storageKey` (string) - Storage key that was updated
- `staticSiteProviderId` (string) - Provider ID

**Returns**: Modified manifest object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.publish.step.uploadStaticSiteFiles.manifest.update', 'my-provider', (manifest, storageKey, providerId) => {
  // Add custom metadata to manifest entry
  if (manifest[storageKey]) {
    manifest[storageKey].customMetadata = 'value';
  }
  return manifest;
});
```

### `aether.publish.step.uploadStaticSiteFiles.manifest.cleanup`

**Type**: Filter  
**Location**: `uploadPhase.js:471`  
**Fired**: Before final manifest cleanup and upload  
**Parameters**:
- `manifest` (Object) - Cleaned manifest object
- `currentFileKeys` (Set) - Set of current file keys
- `staticSiteProviderId` (string) - Provider ID

**Returns**: Modified manifest object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.publish.step.uploadStaticSiteFiles.manifest.cleanup', 'my-provider', (manifest, currentFileKeys, providerId) => {
  // Keep additional entries
  return { ...manifest, 'custom-file.html': { size: 100, hash: 'abc' } };
});
```

## File Upload Hooks

### `aether.upload.file.before`

**Type**: Action  
**Location**: `fileUploadManager.js:116`  
**Fired**: Before each file upload  
**Parameters**:
- `fileData` (Object) - File data object:
  - `key` (string) - Storage key
  - `blob` (Blob) - File blob
  - `contentType` (string) - Content type
  - `displayName` (string) - Display name

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.upload.file.before', 'my-provider', (fileData) => {
  console.log('About to upload:', fileData.key);
});
```

### `aether.upload.file.options`

**Type**: Filter  
**Location**: `fileUploadManager.js:302`  
**Fired**: Before file upload, after options are prepared  
**Parameters**:
- `uploadOptions` (Object) - Upload options object
- `key` (string) - Storage key
- `blob` (Blob) - File blob
- `contentType` (string) - Content type
- `metadata` (Object) - File metadata

**Returns**: Modified upload options object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.upload.file.options', 'my-provider', (options, key, blob, contentType, metadata) => {
  return {
    ...options,
    cacheControl: 'public, max-age=86400',
    customHeader: 'value'
  };
});
```

### `aether.upload.file.after`

**Type**: Action  
**Location**: `fileUploadManager.js:359`  
**Fired**: After each file upload succeeds  
**Parameters**:
- `result` (Object) - Upload result object:
  - `key` (string) - Storage key
  - `url` (string) - Uploaded file URL
  - `hash` (string) - File hash
  - `size` (number) - File size
- `displayName` (string) - Display name

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('aether.upload.file.after', 'my-provider', (result, displayName) => {
  console.log('File uploaded:', result.key, result.url);
});
```

### `aether.upload.hash.calculate`

**Type**: Filter  
**Location**: `fileUploadManager.js:152` (during skip check), `fileUploadManager.js:227` (for manifest)  
**Fired**: Before hash is calculated  
**Parameters**:
- `hash` (string|null) - Pre-calculated hash or null to use default calculation
- `blob` (Blob) - File blob
- `key` (string) - Storage key
- `manifest` (Object) - Manifest object

**Returns**: Hash string or null to use default calculation

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.upload.hash.calculate', 'my-provider', (hash, blob, key, manifest) => {
  // Return pre-calculated hash or null to use default
  if (key.startsWith('custom/')) {
    return 'pre-calculated-hash';
  }
  return hash; // Use default calculation
});
```

## Asset Extraction Hooks

These hooks are in `assetExtractor.js` and allow customization of asset extraction from HTML.

### `aether.assets.extracted`

**Type**: Filter  
**Location**: `assetExtractor.js:149`  
**Fired**: After assets are extracted from HTML  
**Parameters**:
- `assets` (Array) - Extracted asset URLs
- `html` (string) - HTML content
- `pageUrl` (string) - Page URL
- `siteUrl` (string) - Site URL

**Returns**: Modified assets array

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.assets.extracted', 'my-plugin', (assets, html, pageUrl, siteUrl) => {
  // Add custom asset
  assets.push('https://example.com/custom-asset.js');
  return assets;
});
```

### `aether.assets.should_collect`

**Type**: Filter  
**Location**: `assetExtractor.js:803`  
**Fired**: When determining if asset should be collected  
**Parameters**:
- `shouldCollect` (boolean) - Whether asset should be collected
- `url` (string) - Asset URL
- `siteUrl` (string) - Site URL
- `source` (string) - Source of asset (e.g., 'css', 'js', 'html')
- `extension` (string) - File extension

**Returns**: Boolean

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.assets.should_collect', 'my-plugin', (shouldCollect, url, siteUrl, source, extension) => {
  // Always collect .webp images
  if (extension === 'webp') {
    return true;
  }
  return shouldCollect;
});
```

## Provider-Specific Deployment URLs

**IMPORTANT**: Each provider now receives its own deployment URL for HTML rewriting. The step handler automatically fetches each provider's deployment URL from its configuration before processing.

The deployment URL is determined by checking (in order):
1. `pages_url` - For providers with hosted pages
2. `worker_endpoint` - For R2, Spaces, etc.
3. `public_url` - For R2 custom domains

The deployment URL can be customized via the `aether.provider.deployment_url` filter.

## Complete Example: Cloudflare R2 Provider

```javascript
import { addFilter, addAction } from '@wordpress/hooks';

// Customize storage service config
addFilter('aether.storage.service.config', 'cloudflare-r2', (config, staticPath, providerId, providerConfig) => {
  if (providerId !== 'cloudflare-r2') return config;
  
  return {
    ...config,
    // R2-specific config
  };
});

// Customize HTML processing
addFilter('aether.publish.step.uploadStaticSiteFiles.html.process', 'cloudflare-r2', (html, url, siteUrl, staticSiteUrl, providerId) => {
  if (providerId !== 'cloudflare-r2') return html;
  
  // Add R2-specific meta tags or modifications
  return html;
});

// Customize file upload options
addFilter('aether.upload.file.options', 'cloudflare-r2', (options, key, blob, contentType, metadata) => {
  return {
    ...options,
    cacheControl: 'public, max-age=31536000, immutable',
  };
});

// Monitor upload progress
addAction('aether.upload.file.after', 'cloudflare-r2', (result, displayName) => {
  console.log('R2 upload complete:', result.key);
});
```

## Hook Execution Order

1. `aether.publish.step.uploadStaticSiteFiles.before` - Step starts
2. `aether.publish.step.uploadStaticSiteFiles.urls` - URLs filtered
3. For each provider (in parallel):
   - `aether.publish.step.uploadStaticSiteFiles.pre_scan.before` - Pre-scan starts
   - `aether.publish.step.uploadStaticSiteFiles.html.process` - HTML processed (per URL)
   - `aether.publish.step.uploadStaticSiteFiles.asset.process` - Assets processed (per asset)
   - `aether.publish.step.uploadStaticSiteFiles.pre_scan.after` - Pre-scan completes
   - `aether.publish.step.uploadStaticSiteFiles.manifest.fetch` - Manifest fetched
   - `aether.publish.step.uploadStaticSiteFiles.upload.before` - Upload phase starts
   - `aether.upload.file.before` - File upload starts (per file)
   - `aether.upload.file.options` - Upload options filtered (per file)
   - `aether.upload.hash.calculate` - Hash calculated (per file)
   - `aether.upload.file.after` - File upload completes (per file)
   - `aether.publish.step.uploadStaticSiteFiles.manifest.update` - Manifest updated (per file)
   - `aether.publish.step.uploadStaticSiteFiles.manifest.cleanup` - Manifest cleaned
   - `aether.publish.step.uploadStaticSiteFiles.upload.after` - Upload phase completes
4. `aether.publish.step.uploadStaticSiteFiles.result` - Result filtered
5. `aether.publish.step.uploadStaticSiteFiles.after` - Step completes

## Notes

- All hooks receive provider-specific context where applicable
- Each provider processes files independently with its own manifest
- Each provider uses its own deployment URL for HTML rewriting
- Hooks are executed in the order listed above
- Filters should return modified values, actions are for side effects only
