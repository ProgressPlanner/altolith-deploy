# Aether Site Exporter - Complete Hooks Analysis

## Executive Summary

This document provides a comprehensive analysis of all JavaScript hooks in the Aether Site Exporter plugin, with detailed workflow analysis showing how hooks are executed in context.

**Total Hooks Found**: 72 unique hooks
- **Actions**: 32 hooks (fire events, no return value)
- **Filters**: 40 hooks (modify values, must return modified value)

## Hook Categories

### 1. Provider System (22 hooks)
- Provider registration and discovery
- Provider configuration management
- Provider form UI hooks
- Provider testing and upload strategies

### 2. Publish Workflow (12 hooks)
- Workflow-level hooks (before/after/error)
- Step-level hooks (dynamic per step ID)
- Blueprint generation hooks

### 3. Static Site Generation (6 hooks)
- Pre-scan phase hooks
- Upload phase hooks
- HTML and asset processing hooks

### 4. File Upload System (8 hooks)
- Unified file upload action
- File-level upload hooks
- Hash calculation hooks
- Upload result filtering

### 5. Storage System (8 hooks)
- Configuration storage hooks
- Storage service creation hooks

### 6. URL Processing (5 hooks)
- URL resolution and normalization
- URL rewriting hooks
- External URL detection

### 7. Asset Processing (2 hooks)
- Asset extraction hooks
- Asset collection filtering

### 8. Blueprint Generation (4 hooks)
- Blueprint steps filtering
- Blueprint JSON filtering
- Asset discovery filtering

### 9. Manifest System (3 hooks)
- Manifest fetching
- Manifest updates
- Manifest cleanup


## Complete Workflow Analysis

### Provider Registration Workflow

```
1. Provider script loads
   ↓
2. Provider creates instance: `new MyProvider()`
   ↓
3. Provider calls: `doAction('aether.providers.register', provider)`
   ↓
4. ProviderRegistry.addAction('aether.providers.register') handler fires
   ↓
5. ProviderRegistry.register(providerId, provider) called
   ↓
6. doAction('aether.providers.registered', providerId, provider) fires
   ↓
7. Provider is now available via ProviderRegistry.getAll()
```

**Hooks in this workflow:**
- `aether.providers.register` (Action) - Provider registration trigger
- `aether.providers.registered` (Action) - After registration complete

### Provider Configuration Workflow

```
1. User opens provider settings form
   ↓
2. doAction('aether.provider.panel.before_form', hookContext)
   ↓
3. Provider form renders
   ↓
4. doAction('aether.provider.form.before_fields', hookContext)
   ↓
5. Form fields render (filtered by aether.provider.config_fields)
   ↓
6. doAction('aether.provider.form.after_fields', hookContext)
   ↓
7. doAction('aether.provider.form.actions', hookContext)
   ↓
8. User submits form
   ↓
9. Config validated (aether.provider.config.validate)
   ↓
10. Config sanitized (aether.provider.config.sanitize)
   ↓
11. doAction('aether.provider.config.before_save', providerId)
   ↓
12. Config saved to storage (aether.storage.config.before_save)
   ↓
13. doAction('aether.storage.config.saved', config, providerId)
   ↓
14. doAction('aether.provider.config.saved', config, providerId)
   ↓
15. doAction('aether.admin.provider.settings.saved', providerId)
```

**Hooks in this workflow:**
- `aether.provider.panel.before_form` (Action)
- `aether.provider.panel.after_form` (Action)
- `aether.provider.form.before_fields` (Action)
- `aether.provider.form.after_fields` (Action)
- `aether.provider.form.actions` (Action)
- `aether.provider.config_fields` (Filter)
- `aether.provider.config.validate` (Filter)
- `aether.provider.config.sanitize` (Filter)
- `aether.provider.config.before_save` (Filter)
- `aether.storage.config.before_save` (Filter)
- `aether.storage.config.saved` (Action)
- `aether.provider.config.saved` (Action)
- `aether.admin.provider.settings.saved` (Action)

### Publish Workflow Execution

```
1. User initiates publish
   ↓
2. doAction('aether.publish.workflow.before', executionContext, steps)
   ↓
3. For each step in execution plan:
   ↓
   a. applyFilters('aether.publish.step.{stepId}.skip', shouldSkip, context)
      ↓
   b. If skipped:
      - doAction('aether.publish.step.{stepId}.skipped', context)
      ↓
   c. If not skipped:
      - doAction('aether.publish.step.{stepId}.before', context)
      ↓
      - Step handler executes
      ↓
      - If error occurs:
        * doAction('aether.publish.step.{stepId}.retry', error, attempt, delay, context)
        * doAction('aether.publish.step.{stepId}.error', error, context)
      ↓
      - applyFilters('aether.publish.step.{stepId}.result', result, context)
      ↓
      - doAction('aether.publish.step.{stepId}.after', result, context)
   ↓
4. doAction('aether.publish.workflow.after', state, executionContext)
   OR
   doAction('aether.publish.workflow.error', error, executionContext)
```

**Hooks in this workflow:**
- `aether.publish.workflow.before` (Action)
- `aether.publish.step.{stepId}.skip` (Filter)
- `aether.publish.step.{stepId}.skipped` (Action)
- `aether.publish.step.{stepId}.before` (Action)
- `aether.publish.step.{stepId}.retry` (Action)
- `aether.publish.step.{stepId}.result` (Filter)
- `aether.publish.step.{stepId}.after` (Action)
- `aether.publish.step.{stepId}.error` (Action)
- `aether.publish.workflow.after` (Action)
- `aether.publish.workflow.error` (Action)

### Static Site Generation Workflow

```
1. uploadStaticSiteFiles step starts
   ↓
2. applyFilters('aether.upload.urls', urls, providers, context)
   ↓
3. For each provider:
   ↓
   a. Pre-scan phase:
      - doAction('aether.static.pre_scan.before', urls, providerId, config)
      ↓
      - For each URL:
        * applyFilters('aether.static.html.process', html, url, siteUrl, staticSiteUrl, providerId)
        * Assets extracted (aether.assets.extracted, aether.assets.should_collect)
        * applyFilters('aether.static.asset.process', assetData, providerId)
      ↓
      - doAction('aether.static.pre_scan.after', stats, providerId)
   ↓
   b. Upload phase:
      - applyFilters('aether.manifest.fetch', manifest, storageService, providerId)
      ↓
      - doAction('aether.static.upload.before', cachedUrls, totalFiles, providerId)
      ↓
      - For each file:
        * doAction('aether.upload.file.before', fileData)
        * applyFilters('aether.upload.hash.calculate', hash, blob, key, manifest)
        * applyFilters('aether.upload.file.options', options, key, blob, contentType, metadata)
        * File uploaded via aether.file.upload action
        * doAction('aether.upload.file.after', result, displayName)
        * applyFilters('aether.manifest.update', manifest, storageKey, providerId)
      ↓
      - applyFilters('aether.manifest.cleanup', manifest, currentFileKeys, providerId)
      ↓
      - doAction('aether.static.upload.after', result, providerId)
   ↓
4. applyFilters('aether.upload.result', result, providers, context)
```

**Hooks in this workflow:**
- `aether.upload.urls` (Filter)
- `aether.static.pre_scan.before` (Action)
- `aether.static.html.process` (Filter)
- `aether.assets.extracted` (Filter)
- `aether.assets.should_collect` (Filter)
- `aether.static.asset.process` (Filter)
- `aether.static.pre_scan.after` (Action)
- `aether.manifest.fetch` (Filter)
- `aether.static.upload.before` (Action)
- `aether.upload.file.before` (Action)
- `aether.upload.hash.calculate` (Filter)
- `aether.upload.file.options` (Filter)
- `aether.file.upload` (Action)
- `aether.file.upload.context` (Filter)
- `aether.upload.file.after` (Action)
- `aether.manifest.update` (Filter)
- `aether.manifest.cleanup` (Filter)
- `aether.static.upload.after` (Action)
- `aether.upload.result` (Filter)

### Blueprint Generation Workflow

```
1. generateBlueprint step starts
   ↓
2. Asset discovery (WordPress.org plugins/themes)
   ↓
3. applyFilters('aether.blueprint.assets', assets, assetsResponse)
   ↓
4. buildBlueprintSteps() called
   ↓
5. applyFilters('aether.blueprint.steps', steps, config)
   ↓
6. buildBlueprintJson() called
   ↓
7. applyFilters('aether.blueprint.json', blueprint, steps)
   ↓
8. applyFilters('aether.publish.step.generateBlueprint.data', blueprintData, context)
   ↓
9. applyFilters('aether.blueprint.generated', blueprint, wporgPlugins, wporgThemes)
   ↓
10. Blueprint bundle created
```

**Hooks in this workflow:**
- `aether.blueprint.assets` (Filter)
- `aether.blueprint.steps` (Filter)
- `aether.blueprint.json` (Filter)
- `aether.publish.step.generateBlueprint.data` (Filter)
- `aether.blueprint.generated` (Filter)

### Unified File Upload Workflow

```
1. uploadFile() called with fileContext
   ↓
2. If HTML file:
   - Get provider staticSiteUrl
   - applyFilters('aether.static.html.process', html, filePath, siteUrl, staticSiteUrl, providerId)
   - Process HTML with URL rewriting
   ↓
3. applyFilters('aether.file.upload.context', fileContext, providerId)
   ↓
4. doAction('aether.file.upload', filteredContext)
   ↓
5. Provider handlers process upload:
   - Provider checks aether.provider.upload_strategy filter
   - Provider handles upload (sets fileContext.result)
   ↓
6. Return upload result
```

**Hooks in this workflow:**
- `aether.static.html.process` (Filter) - For HTML files
- `aether.file.upload.context` (Filter)
- `aether.file.upload` (Action)
- `aether.provider.upload_strategy` (Filter)

## Hook Execution Order

All hooks are executed in the order shown in the workflow diagrams above. When multiple handlers are registered for the same hook, they execute in priority order (lower priority numbers execute first, default priority is 10).

