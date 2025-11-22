# Breaking Changes & Migration Guide

**Date:** November 22, 2024
**Version:** Post-Terminology Standardization
**Scope:** aether-site-exporter + aether-site-exporter-providers

This document outlines all breaking changes introduced during the comprehensive terminology standardization refactor.

---

## Overview

A complete terminology standardization was performed to ensure consistency across the codebase. Since the plugin has not been publicly released, all changes were applied without backwards compatibility considerations.

**Key Principle:** Clean codebase with no legacy terminology traces.

---

## Phase 1: Publish → Export Terminology

### REST API Endpoints (Breaking Change)

**Before:**
```
/aether/v1/publish/jobs
/aether/v1/publish/jobs/{id}
/aether/v1/publish/jobs/{id}/steps/{step}
```

**After:**
```
/aether/v1/export/jobs
/aether/v1/export/jobs/{id}
/aether/v1/export/jobs/{id}/steps/{step}
```

**Migration:** Update all API calls to use `/export` instead of `/publish`.

---

### WordPress Hooks (Breaking Change)

#### PHP Hooks

**Before:**
```php
do_action('aether_publish_before_step', $stepName, $jobId);
do_action('aether_publish_after_step', $stepName, $result, $jobId);
apply_filters('aether_publish_job_status', $status, $jobId);
```

**After:**
```php
do_action('aether_export_before_step', $stepName, $jobId);
do_action('aether_export_after_step', $stepName, $result, $jobId);
apply_filters('aether_export_job_status', $status, $jobId);
```

#### JavaScript Hooks

**Before:**
```javascript
addAction('aether.publish.before', 'my-plugin', callback);
addFilter('aether.publish.config', 'my-plugin', callback);
```

**After:**
```javascript
addAction('aether.export.before', 'my-plugin', callback);
addFilter('aether.export.config', 'my-plugin', callback);
```

**Migration:** Update all hook names from `publish` to `export`.

---

### JavaScript Components & Functions

**Before:**
```javascript
import { PublishButton } from '@aether/components/PublishButton';
import { usePublishContext } from '@aether/hooks/usePublishContext';
import { PublishProgressModal } from '@aether/components/PublishProgressModal';
```

**After:**
```javascript
import { ExportButton } from '@aether/components/ExportButton';
import { useExportContext } from '@aether/hooks/useExportContext';
import { ExportProgressModal } from '@aether/components/ExportProgressModal';
```

**Migration:** Update all imports and component references.

---

### File & Directory Renames

**Directories:**
- `includes/REST/Publish/` → `includes/REST/Export/`
- `assets/src/publish/` → `assets/src/export/`

**Files:**
- `PublishJobController.php` → `ExportJobController.php`
- `PublishStepsController.php` → `ExportStepsController.php`
- `PublishContext.js` → `ExportContext.js`
- `usePublishContext.js` → `useExportContext.js`
- And 80+ additional files...

**Migration:** Update all file paths and imports.

---

## Phase 2: Blueprint-bundle Standardization

### Semantic Clarification

**Terminology Definitions:**
- **blueprint**: JSON file only (`blueprint.json`)
- **blueprint-bundle**: ZIP package containing `blueprint.json` + `wp-content.zip`
- **wp-content archive**: ZIP file containing WordPress files (`wp-content.zip`)

### Step Renames (Breaking Change)

**Before:**
```javascript
// This step created wp-content.zip (confusing name)
const createBlueprintBundleStep = { id: 'createBlueprintBundle' };

// This step created the full bundle (confusing name)
const generateBlueprintStep = { id: 'generateBlueprint' };
```

**After:**
```javascript
// Clearly creates wp-content.zip
const createWpContentArchiveStep = { id: 'createWpContentArchive' };

// Clearly creates blueprint-bundle.zip
const createBlueprintBundleStep = { id: 'createBlueprintBundle' };
```

**Step IDs Changed:**
- `createBlueprintBundle` → `createWpContentArchive`
- `generateBlueprint` → `createBlueprintBundle`

**Migration:** Update all step ID references in custom code.

---

### Hook Renames (Breaking Change)

**Before:**
```javascript
addFilter('aether.export.step.createBlueprintBundle.files', ...);
addFilter('aether.export.step.generateBlueprint.data', ...);
```

**After:**
```javascript
addFilter('aether.export.step.createWpContentArchive.files', ...);
addFilter('aether.export.step.createBlueprintBundle.blueprintData', ...);
```

**Migration:** Update hook names to match new step IDs.

---

### PHP Endpoint Renames

**Before:**
```php
POST /aether/v1/export/steps/createBlueprintBundle
POST /aether/v1/export/steps/generateBlueprint
```

**After:**
```php
POST /aether/v1/export/steps/createWpContentArchive
POST /aether/v1/export/steps/createBlueprintBundle
```

**Migration:** Update endpoint paths in custom API calls.

---

### Function Renames

**Before:**
```javascript
preparePublishConfiguration(settingsResponse)
```

**After:**
```javascript
prepareExportConfiguration(settingsResponse)
```

**Migration:** Update function calls.

---

## Phase 3: Static-site Format Consistency

### Deployment Type Values (Breaking Change)

**Before (Inconsistent):**
```javascript
// Sometimes kebab-case
deployment_types: ['static-site', 'blueprint-bundle']

// Sometimes snake_case
deployment_types: ['static_site', 'blueprint_bundle']
```

**After (Consistent):**
```javascript
// Always snake_case for deployment types
deployment_types: ['static_site', 'blueprint_bundle']
```

**Format Rules:**
- **Deployment types:** snake_case (`'static_site'`, `'blueprint_bundle'`)
- **Capabilities:** kebab-case (`'static-site'`, `'custom-domain'`)
- **REST URLs:** kebab-case (`/static-site/`, `/blueprint-bundle/`)
- **JavaScript variables:** camelCase (`staticSite`, `blueprintBundle`)

**Migration:** Update deployment type arrays to use snake_case values.

---

## Phase 4: Configuration Terminology

### IndexedDB Database Name

**Before:**
```javascript
dbName: 'aether-publish-state'
```

**After:**
```javascript
dbName: 'aether-export-state'
```

**Impact:** Browser storage key changed. Previous state will not be migrated.

---

## Providers Plugin Changes

### File Renames

**Before:**
```javascript
import { usePublishContext } from '../hooks/usePublishContext';
```

**After:**
```javascript
import { useExportContext } from '../hooks/useExportContext';
```

### Terminology Updates

All "publish" references updated to "export" in:
- Documentation comments
- Function names
- API endpoint paths in examples

---

## Non-Breaking Verifications

The following were verified as already correct (no changes needed):

### Phase 5: Deployment/Deploy
- ✅ Nouns use "deployment": `deploymentUrl`, `deploymentConfig`
- ✅ Verbs use "deploy": `deploy()`, `deploying`

### Phase 6: Provider/Instance
- ✅ Clear distinction maintained
- ✅ Instance IDs use format: `{type}:{uuid}`

### Phase 7: Job Terminology
- ✅ Consistent use of "job" (not "task" or "process")

---

## Migration Checklist

For developers extending or integrating with these plugins:

### If You Have Custom Hooks:

- [ ] Update PHP hook names: `aether_publish_*` → `aether_export_*`
- [ ] Update JavaScript hook names: `aether.publish.*` → `aether.export.*`
- [ ] Update step hooks: `generateBlueprint` → `createBlueprintBundle`
- [ ] Update step hooks: `createBlueprintBundle` → `createWpContentArchive`

### If You Make API Calls:

- [ ] Update REST endpoints: `/publish` → `/export`
- [ ] Update step endpoints to use new step IDs

### If You Import Components:

- [ ] Update component imports: `Publish*` → `Export*`
- [ ] Update context imports: `usePublishContext` → `useExportContext`

### If You Have Custom Providers:

- [ ] Update deployment type values to snake_case
- [ ] Verify capability constants use kebab-case (should already be correct)

### If You Use IndexedDB Directly:

- [ ] Note that database name changed from `aether-publish-state` to `aether-export-state`
- [ ] Previous state will not be automatically migrated

---

## Commit History

**Main Plugin (aether-site-exporter):**
- `b485be9` - Phase 1: Publish → Export terminology
- `e63c0fa` - Phase 2: Blueprint-bundle standardization
- `39030e5` - Phase 3: Static-site format consistency
- `c0e2b79` - Phase 4: Config/Settings semantic cleanup

**Providers Plugin (aether-site-exporter-providers):**
- `90acba1` - Publish → Export terminology standardization

---

## Support

For questions or issues related to these breaking changes:
- Review this migration guide
- Check the updated documentation
- Refer to the commit messages for detailed change lists

---

## Summary Statistics

- **Total Files Changed:** 167+ across both plugins
- **REST Endpoints:** All updated consistently
- **WordPress Hooks:** All renamed consistently
- **JavaScript Modules:** All updated and rebuilt
- **Build Status:** ✅ All production builds successful
- **Test Status:** ✅ PHPStan passes
- **Backwards Compatibility:** None (by design - plugin not yet released)

---

**Last Updated:** November 22, 2024
**Document Version:** 1.0
