# Export Workflow Refactor Implementation Plan

> **Note:** No backwards compatibility concerns - plugin not yet released. Delete dead code aggressively.

---

## Phase 1: Foundation Changes

### 1.1 Add Global Settings Modal

**Location:** Settings page header with gear icon

**Files to create/modify:**
- `assets/src/admin-settings/components/GlobalSettingsModal.js` (new)
- `assets/src/admin-settings/AdminSettings.js` (add gear icon trigger in header)
- `includes/REST/SettingsController.php` (uses existing endpoint with `global` key)

**Settings:**
```javascript
{
  exportStaticSite: true,      // Enable static site export
  exportBlueprint: true,       // Enable blueprint export
  crawlBatchSize: 10,          // Batch size for URL crawling (1-50)
}
```

### 1.2 Simplify Step `requires` Format

**Current:**
```javascript
requires: {
  api: { from: 'initial', required: true },
  urls: { from: 'discoverAndScanSite', required: true },
}
```

**New:**
```javascript
requires: {
  api: true,                          // From context (no step dependency)
  urls: 'discoverAndScanSite',        // From specific step
  optionalData: { from: 'stepId', optional: true },
}
```

**Files:** `DataValidator.js`, `StepExecutor.js`, all step files

### 1.3 Remove Skip Logic Entirely

**Delete:**
- `shouldSkip` property from all steps
- `skip` property from all steps
- `altolith.export.step.{stepId}.skip` filter
- `altolith.export.step.{stepId}.skipped` action
- All skip-related code in `StepExecutor.js`

### 1.4 Remove Per-Provider Output Type Toggles

**Delete from provider configs:**
- `enable_static_site`
- `enable_blueprint`

Global settings control export types, not providers.

---

## Phase 2: Step Restructuring

### 2.1 Rename Steps

| Current | New |
|---------|-----|
| `createBlueprintBundle` | `prepareBlueprint` |
| `upload` | `deploy` |

Rename directories and update all references.

### 2.2 Create `gatherFilesToDeploy` Step

**File:** `assets/src/export/steps/gatherFilesToDeploy/index.js`

```javascript
{
  id: 'gatherFilesToDeploy',
  label: 'Gather Files',
  dependencies: ['discoverAndScanSite', 'prepareBlueprint'],

  requires: {
    urls: { from: 'discoverAndScanSite', optional: true },
    htmlDataMap: { from: 'discoverAndScanSite', optional: true },
    blueprintFiles: { from: 'prepareBlueprint', optional: true },
    blueprintJson: { from: 'prepareBlueprint', optional: true },
    globalSettings: true,
  },

  provides: {
    filesToDeploy: { type: 'object', scope: 'global' },
  },

  handler: async (context) => {
    const files = { staticSite: {}, blueprint: {}, blueprintJson: null };

    if (globalSettings.exportStaticSite && urls && htmlDataMap) {
      files.staticSite = buildStaticSiteFiles(urls, htmlDataMap);
    }

    if (globalSettings.exportBlueprint && blueprintFiles) {
      files.blueprint = blueprintFiles;
      files.blueprintJson = blueprintJson;
    }

    return {
      filesToDeploy: applyFilters('altolith.export.filesToDeploy', files, context),
    };
  }
}
```

### 2.3 Simplify `prepareBlueprint` Output

**Delete current provides (8 items), replace with 2:**
```javascript
provides: {
  blueprintFiles: {
    'wp-content.zip': { sourcePath: '/tmp/...', type: 'core' },
    'plugins/my-plugin.zip': { sourcePath: '/tmp/...', type: 'plugin' },
    'themes/my-theme.zip': { sourcePath: '/tmp/...', type: 'theme' },
  },
  blueprintJson: {
    // Uses {targetUrl} placeholders - replaced during deploy
    steps: [
      { step: 'importWordPressFiles',
        wordPressFilesZip: { resource: 'url', url: '{targetUrl}/wp-content.zip' } }
    ]
  }
}
```

**Delete "Phase 1: Find Blueprint Provider"** from handler - URL replacement moves to deploy step.

### 2.4 Refactor `deploy` Step

**New dependencies:**
```javascript
dependencies: ['gatherFilesToDeploy'],  // ONLY this
```

**URL replacement via filter:**
```javascript
// Provider registers filter:
addFilter('altolith.blueprint.finalizeUrls', 'altolith/local-filesystem', (json, providerId, config) => {
  if (!providerId.startsWith('local-filesystem')) return json;
  const targetUrl = `${config.public_url}/${config.blueprint_subfolder}`;
  return replaceTargetUrls(json, targetUrl);
});
```

---

## Phase 3: Cleanup

### 3.1 Hook Renaming

| Delete | Replace With |
|--------|--------------|
| `altolith.export.step.createBlueprintBundle.assets` | `altolith.export.blueprint.extensions` |

### 3.2 Terminology Fixes

In `discoverAndScanSite`:
- "pages" → "URLs"
- "pagesScanned" → "urlsScanned"

### 3.3 URL Discovery Fixes

**Delete pagination from seed discovery:**
- Remove `getPaginationUrls()` from `URLDiscoveryController.php`
- Crawler discovers pagination via link extraction

**Use configurable batch size:**
```javascript
const BATCH_SIZE = globalSettings.crawlBatchSize || 10;
```

---

## Phase 4: Optimization

### 4.1 Memory Optimization for Assets

**Store in memory (need URL replacements):**
- HTML, CSS, JavaScript

**Stream directly (don't store):**
- Images, videos, audio, documents, fonts

```javascript
const STREAMABLE = ['jpg','jpeg','png','gif','webp','svg','ico',
                    'mp4','webm','ogg','mp3','wav',
                    'pdf','woff','woff2','ttf','eot'];

function shouldStoreInMemory(url) {
  return !STREAMABLE.includes(getExtension(url));
}
```

### 4.2 Unified Progress Tracking (Event Emitter Pattern)

**Delete 3 separate systems, replace with event emitter:**

```javascript
// Create progress emitter
const progressEmitter = createProgressEmitter();

// Steps emit progress events
progressEmitter.emit('step', { stepId, current, total });
progressEmitter.emit('file', { stepId, fileName, current, total });
progressEmitter.emit('provider', { providerId, stepId, current, total });

// UI subscribes to events
progressEmitter.on('step', (data) => updateStepUI(data));
progressEmitter.on('file', (data) => updateFileUI(data));
progressEmitter.on('provider', (data) => updateProviderUI(data));

// Cleanup
progressEmitter.off('step', handler);
```

**New file:** `assets/src/export/utils/progressEmitter.js`

### 4.3 Hookable Output Types

```javascript
addFilter('altolith.outputTypes', 'my-plugin', (types) => {
  return [...types, {
    id: 'media_offload',
    label: 'Media Offloading',
    settingsComponent: MediaOffloadSettings,
  }];
});
```

---

## New Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Global Settings                               │
│  - Export Static Site: ✓                                        │
│  - Export Blueprint: ✓                                          │
│  - Batch Size: 10                                                │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               GLOBAL STEPS (run once)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐                                    │
│  │   discoverAndScanSite   │                                    │
│  │   ────────────────────  │                                    │
│  │   Provides:             │                                    │
│  │   - urls (all links)    │                                    │
│  │   - htmlDataMap         │                                    │
│  │   - staticAssets        │                                    │
│  └───────────┬─────────────┘                                    │
│              │                                                   │
│              ▼                                                   │
│  ┌─────────────────────────┐                                    │
│  │    prepareBlueprint     │  (if blueprint enabled)            │
│  │   ────────────────────  │                                    │
│  │   Provides:             │                                    │
│  │   - blueprintFiles      │                                    │
│  │   - blueprintJson       │ (with {targetUrl} placeholders)    │
│  └───────────┬─────────────┘                                    │
│              │                                                   │
│              ▼                                                   │
│  ┌─────────────────────────┐                                    │
│  │  gatherFilesToDeploy    │  (NEW)                             │
│  │   ────────────────────  │                                    │
│  │   Collects from above   │                                    │
│  │   + 3rd-party hooks     │                                    │
│  │   Provides:             │                                    │
│  │   - filesToDeploy       │                                    │
│  └───────────┬─────────────┘                                    │
│              │                                                   │
└──────────────┼──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│               THREAD STEPS (per provider)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  For each provider:                                              │
│  ┌─────────────────────────┐                                    │
│  │        deploy           │                                    │
│  │   ────────────────────  │                                    │
│  │   Requires:             │                                    │
│  │   - filesToDeploy       │                                    │
│  │   - provider instance   │                                    │
│  │                         │                                    │
│  │   Actions:              │                                    │
│  │   - Replace {targetUrl} │                                    │
│  │   - Upload all files    │                                    │
│  └─────────────────────────┘                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Sprint 1: Foundation
- [ ] Add Global Settings Modal
- [ ] Simplify step `requires` format
- [ ] Remove all skip logic and hooks
- [ ] Remove per-provider output type toggles

### Sprint 2: Step Restructuring
- [ ] Create `gatherFilesToDeploy` step
- [ ] Refactor `prepareBlueprint` (simplify output, remove provider lookup)
- [ ] Refactor `deploy` (depend only on gather, add URL replacement filter)
- [ ] Rename steps (createBlueprintBundle → prepareBlueprint, upload → deploy)

### Sprint 3: Cleanup
- [ ] Rename hooks
- [ ] Fix terminology (pages → URLs)
- [ ] Remove pagination from seed discovery
- [ ] Add configurable batch size

### Sprint 4: Optimization
- [ ] Memory optimization (stream binary assets)
- [ ] Unified progress tracking (event emitter)
- [ ] Hookable output types

---

## Files Summary

### New Files
- `assets/src/admin-settings/components/GlobalSettingsModal.js`
- `assets/src/export/steps/gatherFilesToDeploy/index.js`
- `assets/src/export/utils/progressEmitter.js`

### Renamed
- `steps/createBlueprintBundle/` → `steps/prepareBlueprint/`
- `steps/upload/` → `steps/deploy/`

### Delete (dead code)
- All `shouldSkip` logic
- All skip-related hooks
- `enable_static_site` / `enable_blueprint` from provider configs
- `getPaginationUrls()` from URLDiscoveryController
- Unused progress tracking systems

### Modify
- `DataValidator.js` - new requires format
- `StepExecutor.js` - remove skip logic
- `useExportController.js` - unified progress
- `discoverAndScanSite/index.js` - terminology, batch size
- `URLDiscoveryController.php` - remove pagination
- `SettingsController.php` - global settings

---

## Decisions Made

1. **Global settings UI:** Settings page header with gear icon ✓
2. **Progress tracking:** Event emitter pattern ✓
3. **Asset streaming:** Skip memory storage for binary assets, re-fetch during upload
