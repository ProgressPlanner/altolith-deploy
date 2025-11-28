# Static Site Upload Step - Hook Reference

This document provides a comprehensive reference for all hooks in the `uploadStaticFiles` step, which generates static HTML/CSS/JS files and uploads them to storage providers.

## Table of Contents

1. [Step Executor Hooks](#step-executor-hooks)
2. [URL Processing Hooks](#url-processing-hooks)
3. [Pre-Scan Phase Hooks](#pre-scan-phase-hooks)
4. [Upload Phase Hooks](#upload-phase-hooks)
5. [HTML Processing Hooks](#html-processing-hooks)
6. [Asset Processing Hooks](#asset-processing-hooks)
7. [Manifest Hooks](#manifest-hooks)
8. [File Upload Hooks](#file-upload-hooks)
9. [Asset Extraction Hooks](#asset-extraction-hooks)
10. [Storage Service Hooks](#storage-service-hooks)
11. [Hook Execution Order](#hook-execution-order)

---

## Step Executor Hooks

These hooks are fired by the `StepExecutor` for any step. For the static site upload step, the step ID is `uploadStaticFiles`.

### `altolith.export.step.{stepId}.skip`

**Type**: Filter
**Location**: [StepExecutor.js:162-167](../assets/src/export/executor/StepExecutor.js#L162-L167)
**Fired**: Before step execution to determine if it should be skipped
**Parameters**:
- `shouldSkip` (boolean) - Result of the step's skip function
- `context` (Object) - Execution context
- `providerInstance` (Object|null) - Current provider instance

**Returns**: Boolean indicating whether to skip the step

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.export.step.uploadStaticFiles.skip', 'my-plugin', (shouldSkip, context, provider) => {
    // Force skip for specific provider
    if (provider?.id === 'my-provider') {
        return true;
    }
    return shouldSkip;
});
```

### `altolith.export.step.{stepId}.skipped`

**Type**: Action
**Location**: [StepExecutor.js:172-176](../assets/src/export/executor/StepExecutor.js#L172-L176)
**Fired**: When a step is skipped
**Parameters**:
- `context` (Object) - Execution context
- `providerInstance` (Object|null) - Current provider instance

### `altolith.export.step.{stepId}.before`

**Type**: Action
**Location**: [StepExecutor.js:221-225](../assets/src/export/executor/StepExecutor.js#L221-L225)
**Fired**: Before step execution begins
**Parameters**:
- `context` (Object) - Execution context
- `providerInstance` (Object|null) - Current provider instance

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('altolith.export.step.uploadStaticFiles.before', 'my-plugin', (context, provider) => {
    console.log('Starting upload for provider:', provider?.id);
});
```

### `altolith.export.step.{stepId}.retry`

**Type**: Action
**Location**: [StepExecutor.js:252-259](../assets/src/export/executor/StepExecutor.js#L252-L259)
**Fired**: When a step is retried after an error
**Parameters**:
- `error` (Error) - The error that caused the retry
- `attempt` (number) - Current attempt number
- `delay` (number) - Delay before retry in ms
- `context` (Object) - Execution context
- `providerInstance` (Object|null) - Current provider instance

### `altolith.export.step.{stepId}.result`

**Type**: Filter
**Location**: [StepExecutor.js:268-273](../assets/src/export/executor/StepExecutor.js#L268-L273)
**Fired**: After step completes, before result is merged into workflow state
**Parameters**:
- `result` (Object) - Step result object
- `context` (Object) - Execution context
- `providerInstance` (Object|null) - Current provider instance

**Returns**: Modified result object

### `altolith.export.step.{stepId}.after`

**Type**: Action
**Location**: [StepExecutor.js:283-288](../assets/src/export/executor/StepExecutor.js#L283-L288)
**Fired**: After step completes successfully
**Parameters**:
- `result` (Object) - Filtered step result
- `context` (Object) - Execution context
- `providerInstance` (Object|null) - Current provider instance

### `altolith.export.step.{stepId}.error`

**Type**: Action
**Location**: [errorHandler.js:460](../assets/src/export/utils/errorHandler.js#L460)
**Fired**: When step fails
**Parameters**:
- `error` (Error) - Enhanced error object
- `stepId` (string) - Step ID
- `context` (Object) - Execution context

---

## URL Processing Hooks

### `altolith.export.step.uploadStaticSiteFiles.urls`

**Type**: Filter
**Location**: [uploadStaticFiles/index.js:161-171](../assets/src/export/steps/uploadStaticFiles/index.js#L161-L171)
**Fired**: Before URLs are processed
**Parameters**:
- `urls` (Array) - Array of URLs to process
- `providers` (Array) - Array containing the current provider ID
- `context` (Object) - Context object with `siteUrl`, `blueprintData`, `staticSiteUrl`, `providerId`

**Returns**: Modified URLs array

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.export.step.uploadStaticSiteFiles.urls', 'my-plugin', (urls, providers, context) => {
    // Add a custom URL to the list
    return [...urls, '/custom-page/'];
});
```

### `altolith.export.step.uploadStaticSiteFiles.result`

**Type**: Filter
**Location**: [uploadStaticFiles/index.js:232-252](../assets/src/export/steps/uploadStaticFiles/index.js#L232-L252)
**Fired**: Before final result is returned from step handler
**Parameters**:
- `result` (Object) - Step result with `staticUploadResults`
- `providerId` (string) - Current provider ID
- `context` (Object) - Context object with `siteUrl`, `blueprintData`, `staticSiteUrl`

**Returns**: Modified result object

---

## Pre-Scan Phase Hooks

### `altolith.export.step.uploadStaticSiteFiles.pre_scan.before`

**Type**: Action
**Location**: [preScanPhase.js:42-47](../assets/src/export/utils/preScanPhase.js#L42-L47)
**Fired**: Before pre-scan phase starts
**Parameters**:
- `urls` (Array) - URLs to scan
- `providerId` (string) - Provider ID
- `providerConfig` (Object) - Provider configuration

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('altolith.export.step.uploadStaticSiteFiles.pre_scan.before', 'my-plugin', (urls, providerId, config) => {
    console.log('Pre-scanning', urls.length, 'URLs for provider:', providerId);
});
```

### `altolith.export.step.uploadStaticSiteFiles.pre_scan.after`

**Type**: Action
**Location**: [preScanPhase.js:144-153](../assets/src/export/utils/preScanPhase.js#L144-L153)
**Fired**: After pre-scan phase completes
**Parameters**:
- `stats` (Object) - Pre-scan statistics:
  - `urlsScanned` (number) - Total URLs scanned
  - `urlsSuccessful` (number) - URLs successfully cached
  - `uniqueAssets` (number) - Unique assets discovered
  - `totalFiles` (number) - Total files to upload
- `providerId` (string) - Provider ID

---

## Upload Phase Hooks

### `altolith.export.step.uploadStaticSiteFiles.upload.before`

**Type**: Action
**Location**: [useStaticSiteGenerator.js:131-136](../assets/src/export/hooks/useStaticSiteGenerator.js#L131-L136)
**Fired**: Before upload phase starts
**Parameters**:
- `fetchedUrls` (Array) - URLs to upload
- `totalFilesToUpload` (number) - Total files to upload
- `providerId` (string) - Provider ID

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('altolith.export.step.uploadStaticSiteFiles.upload.before', 'my-plugin', (urls, totalFiles, providerId) => {
    console.log('Starting upload:', totalFiles, 'files for', providerId);
});
```

### `altolith.export.step.uploadStaticSiteFiles.upload.after`

**Type**: Action
**Location**: [useStaticSiteGenerator.js:277-287](../assets/src/export/hooks/useStaticSiteGenerator.js#L277-L287)
**Fired**: After upload phase completes
**Parameters**:
- `result` (Object) - Upload result statistics:
  - `filesUploaded` (number) - Files uploaded
  - `filesSkipped` (number) - Files skipped (unchanged)
  - `urlsSucceeded` (number) - URLs that succeeded
  - `urlsFailed` (number) - URLs that failed
  - `assetsUploaded` (number) - Assets uploaded
- `providerId` (string) - Provider ID

---

## HTML Processing Hooks

### `altolith.export.step.uploadStaticSiteFiles.html.process`

**Type**: Filter
**Location**: [uploadPhase.js:318-325](../assets/src/export/utils/uploadPhase.js#L318-L325)
**Fired**: Before HTML is processed (URL rewriting, admin bar removal, etc.)
**Parameters**:
- `html` (string) - Raw HTML content
- `url` (string) - Page URL
- `siteUrl` (string) - WordPress site URL
- `staticSiteUrl` (string) - Target static site deployment URL
- `providerId` (string) - Provider ID

**Returns**: Modified HTML string

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.export.step.uploadStaticSiteFiles.html.process', 'my-plugin',
    (html, url, siteUrl, staticSiteUrl, providerId) => {
        // Add custom meta tag before processing
        return html.replace('</head>', '<meta name="generator" content="Altolith" /></head>');
    }
);
```

---

## Asset Processing Hooks

### `altolith.export.step.uploadStaticSiteFiles.asset.process`

**Type**: Filter
**Location**: [uploadPhase.js:157-167](../assets/src/export/utils/uploadPhase.js#L157-L167)
**Fired**: Before asset is uploaded
**Parameters**:
- `assetData` (Object) - Asset data object:
  - `blob` (Blob) - Asset content as blob
  - `path` (string) - Local path for the asset
  - `key` (string) - Storage key
  - `contentType` (string) - MIME content type
  - `url` (string) - Original asset URL
- `providerId` (string) - Provider ID

**Returns**: Modified asset data object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.export.step.uploadStaticSiteFiles.asset.process', 'my-plugin', (assetData, providerId) => {
    // Convert images to WebP (example)
    if (assetData.contentType.startsWith('image/')) {
        return {
            ...assetData,
            contentType: 'image/webp',
            path: assetData.path.replace(/\.\w+$/, '.webp'),
            key: assetData.key.replace(/\.\w+$/, '.webp'),
        };
    }
    return assetData;
});
```

---

## Manifest Hooks

### `altolith.export.step.uploadStaticSiteFiles.manifest.fetch`

**Type**: Filter
**Location**: [uploadPhase.js:47-52](../assets/src/export/utils/uploadPhase.js#L47-L52)
**Fired**: Before manifest is fetched from storage
**Parameters**:
- `manifest` (Object|null) - Initial value (null)
- `storageService` (Object) - Storage service instance
- `providerId` (string) - Provider ID

**Returns**: Manifest object or null to use default fetching

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.export.step.uploadStaticSiteFiles.manifest.fetch', 'my-plugin',
    (manifest, storageService, providerId) => {
        // Return custom manifest for specific provider
        if (providerId === 'my-provider') {
            return { /* custom manifest */ };
        }
        return manifest; // null = fetch from storage
    }
);
```

### `altolith.export.step.uploadStaticSiteFiles.manifest.update`

**Type**: Filter
**Location**: [useStaticSiteGenerator.js:210-215](../assets/src/export/hooks/useStaticSiteGenerator.js#L210-L215), [uploadPhase.js:269-274](../assets/src/export/utils/uploadPhase.js#L269-L274)
**Fired**: After each manifest entry is updated
**Parameters**:
- `manifest` (Object) - Current manifest object
- `storageKey` (string) - Storage key that was updated
- `providerId` (string) - Provider ID

**Returns**: Modified manifest object

### `altolith.export.step.uploadStaticSiteFiles.manifest.cleanup`

**Type**: Filter
**Location**: [uploadPhase.js:509-514](../assets/src/export/utils/uploadPhase.js#L509-L514)
**Fired**: Before final manifest cleanup and upload
**Parameters**:
- `manifest` (Object) - Cleaned manifest object
- `currentFileKeys` (Set) - Set of current file keys
- `providerId` (string) - Provider ID

**Returns**: Modified manifest object

---

## File Upload Hooks

These hooks are in `fileUploadManager.js` and apply to all file uploads.

### `altolith.upload.file.before`

**Type**: Action
**Location**: [fileUploadManager.js:117-122](../assets/src/export/utils/fileUploadManager.js#L117-L122)
**Fired**: Before each file upload
**Parameters**:
- `fileData` (Object) - File data object:
  - `key` (string) - Storage key
  - `blob` (Blob) - File blob
  - `contentType` (string) - Content type
  - `displayName` (string) - Display name for progress messages

**Example**:
```javascript
import { addAction } from '@wordpress/hooks';

addAction('altolith.upload.file.before', 'my-plugin', (fileData) => {
    console.log('Uploading:', fileData.key, 'Size:', fileData.blob.size);
});
```

### `altolith.upload.hash.calculate`

**Type**: Filter
**Location**: [fileUploadManager.js:153-159](../assets/src/export/utils/fileUploadManager.js#L153-L159), [fileUploadManager.js:239-245](../assets/src/export/utils/fileUploadManager.js#L239-L245)
**Fired**: Before hash is calculated for skip checking
**Parameters**:
- `hash` (string|null) - Pre-calculated hash or null
- `blob` (Blob) - File blob
- `key` (string) - Storage key
- `manifest` (Object) - Manifest object

**Returns**: Hash string or null to use default calculation

### `altolith.upload.file.options`

**Type**: Filter
**Location**: [fileUploadManager.js:333-340](../assets/src/export/utils/fileUploadManager.js#L333-L340)
**Fired**: Before file upload, after options are prepared
**Parameters**:
- `uploadOptions` (Object) - Upload options with `contentType`, `cacheControl`, `onProgress`
- `key` (string) - Storage key
- `blob` (Blob) - File blob
- `contentType` (string) - Content type
- `metadata` (Object) - File metadata

**Returns**: Modified upload options object

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.upload.file.options', 'my-plugin', (options, key, blob, contentType, metadata) => {
    return {
        ...options,
        cacheControl: 'public, max-age=86400',
    };
});
```

### `altolith.upload.file.after`

**Type**: Action
**Location**: [fileUploadManager.js:454-458](../assets/src/export/utils/fileUploadManager.js#L454-L458)
**Fired**: After each file upload succeeds
**Parameters**:
- `result` (Object) - Upload result:
  - `key` (string) - Storage key
  - `success` (boolean) - Always true for this hook
  - `skipped` (boolean) - Whether file was skipped
  - `url` (string) - Uploaded file URL
  - `hash` (string) - File hash
  - `size` (number) - File size
- `displayName` (string) - Display name

---

## Asset Extraction Hooks

These hooks are in `assetExtractor.js` and `assetFilters.js`.

### `altolith.assets.extracted`

**Type**: Filter
**Location**: [assetExtractor.js:117-124](../assets/src/export/utils/assetExtractor.js#L117-L124)
**Fired**: After assets are extracted from HTML
**Parameters**:
- `assets` (Array) - Array of extracted asset URLs
- `html` (string) - HTML content
- `pageUrl` (string) - Page URL
- `siteUrl` (string) - Site URL

**Returns**: Modified assets array

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.assets.extracted', 'my-plugin', (assets, html, pageUrl, siteUrl) => {
    // Add a required asset that wasn't detected
    assets.push(`${siteUrl}/wp-content/themes/my-theme/required-asset.js`);
    return assets;
});
```

### `altolith.assets.should_collect`

**Type**: Filter
**Location**: [assetFilters.js:108-115](../assets/src/export/utils/assetFilters.js#L108-L115)
**Fired**: When determining if an asset should be collected
**Parameters**:
- `shouldCollect` (boolean) - Default collection decision
- `url` (string) - Asset URL
- `siteUrl` (string) - Site URL
- `source` (string) - Source type: `'html'`, `'css'`, or `'js'`
- `extension` (string) - File extension

**Returns**: Boolean

**Example**:
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.assets.should_collect', 'my-plugin', (shouldCollect, url, siteUrl, source, extension) => {
    // Always collect WebP images
    if (extension === 'webp') {
        return true;
    }
    // Exclude specific CDN assets
    if (url.includes('cdn.example.com')) {
        return false;
    }
    return shouldCollect;
});
```

---

## Storage Service Hooks

### `altolith.storage.service.config`

**Type**: Filter
**Location**: [staticSiteConfig.js:142-148](../assets/src/export/utils/staticSiteConfig.js#L142-L148)
**Fired**: Before StorageService is created
**Parameters**:
- `config` (Object) - Storage service configuration
- `staticPath` (string) - Static files path
- `providerId` (string) - Provider ID
- `providerConfig` (Object) - Provider configuration

**Returns**: Modified configuration object

### `altolith.storage.service.create`

**Type**: Filter
**Location**: [staticSiteConfig.js:153-159](../assets/src/export/utils/staticSiteConfig.js#L153-L159)
**Fired**: After StorageService would be created
**Parameters**:
- `storageService` (StorageService|null) - Initial value (null)
- `staticPath` (string) - Static files path
- `config` (Object) - Storage configuration
- `providerId` (string) - Provider ID

**Returns**: StorageService instance or null to use default

---

## Hook Execution Order

```
1. altolith.export.step.uploadStaticFiles.skip (filter)
   └─ If skip=true: altolith.export.step.uploadStaticFiles.skipped (action)

2. altolith.export.step.uploadStaticFiles.before (action)

3. altolith.export.step.uploadStaticSiteFiles.urls (filter)

4. Storage Service Creation:
   └─ altolith.storage.service.config (filter)
   └─ altolith.storage.service.create (filter)

5. Pre-Scan Phase:
   └─ altolith.export.step.uploadStaticSiteFiles.pre_scan.before (action)
   └─ For each URL:
      └─ altolith.assets.extracted (filter) - during HTML parsing
      └─ altolith.assets.should_collect (filter) - per asset
   └─ altolith.export.step.uploadStaticSiteFiles.pre_scan.after (action)

6. Manifest Fetch:
   └─ altolith.export.step.uploadStaticSiteFiles.manifest.fetch (filter)

7. Upload Phase:
   └─ altolith.export.step.uploadStaticSiteFiles.upload.before (action)
   └─ For each HTML file:
      └─ altolith.export.step.uploadStaticSiteFiles.html.process (filter)
      └─ altolith.upload.file.before (action)
      └─ altolith.upload.hash.calculate (filter)
      └─ altolith.upload.file.options (filter)
      └─ altolith.upload.file.after (action)
      └─ altolith.export.step.uploadStaticSiteFiles.manifest.update (filter)
   └─ For each asset:
      └─ altolith.export.step.uploadStaticSiteFiles.asset.process (filter)
      └─ altolith.upload.file.before (action)
      └─ altolith.upload.hash.calculate (filter)
      └─ altolith.upload.file.options (filter)
      └─ altolith.upload.file.after (action)
      └─ altolith.export.step.uploadStaticSiteFiles.manifest.update (filter)
   └─ altolith.export.step.uploadStaticSiteFiles.upload.after (action)

8. Manifest Cleanup:
   └─ altolith.export.step.uploadStaticSiteFiles.manifest.cleanup (filter)

9. altolith.export.step.uploadStaticFiles.result (filter)

10. altolith.export.step.uploadStaticFiles.after (action)

On Error:
└─ altolith.export.step.uploadStaticFiles.retry (action) - if retryable
└─ altolith.export.step.uploadStaticFiles.error (action) - if failed
```

---

## Complete Example

```javascript
import { addFilter, addAction } from '@wordpress/hooks';

// Monitor upload progress
addAction('altolith.export.step.uploadStaticFiles.before', 'my-monitoring', (context, provider) => {
    console.log('Starting static site upload for:', provider?.id);
});

// Add custom URL to export
addFilter('altolith.export.step.uploadStaticSiteFiles.urls', 'my-plugin', (urls) => {
    return [...urls, '/sitemap.xml'];
});

// Inject analytics into HTML
addFilter('altolith.export.step.uploadStaticSiteFiles.html.process', 'my-analytics',
    (html, url, siteUrl, staticSiteUrl, providerId) => {
        const analyticsScript = '<script src="/analytics.js"></script>';
        return html.replace('</body>', `${analyticsScript}</body>`);
    }
);

// Set custom cache headers
addFilter('altolith.upload.file.options', 'my-caching', (options, key, blob, contentType) => {
    // Long cache for assets, short for HTML
    const isHtml = contentType === 'text/html';
    return {
        ...options,
        cacheControl: isHtml
            ? 'public, max-age=3600'
            : 'public, max-age=31536000, immutable',
    };
});

// Log completion
addAction('altolith.export.step.uploadStaticSiteFiles.upload.after', 'my-monitoring', (result, providerId) => {
    console.log(`Upload complete: ${result.filesUploaded} files to ${providerId}`);
});
```

---

## Notes

- All hooks receive provider-specific context where applicable
- Each provider processes files independently with its own manifest
- Each provider uses its own deployment URL for HTML rewriting
- Filters should return modified values; actions are for side effects only
- The step ID in the StepExecutor is `uploadStaticFiles`, while internal hooks use `uploadStaticSiteFiles` for historical reasons
