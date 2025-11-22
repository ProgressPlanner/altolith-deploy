# Aether Site Exporter - Complete Hooks Analysis

## Executive Summary

This document provides a comprehensive analysis of all JavaScript hooks in the Aether Site Exporter plugin, comparing the codebase with the documentation and providing a detailed workflow analysis.

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

## Missing Hooks in Documentation

The following hooks exist in the codebase but are **NOT documented** in HOOKS.md:

1. **`aether.providers.registered`** (Action)
   - Location: `ProviderRegistry.js:66`
   - Fires after a provider is registered
   - Parameters: `providerId`, `provider`

2. **`aether.provider_ids`** (Filter)
   - Location: `providerLoader.js:439`
   - Filters the list of provider IDs
   - Parameters: `providerIds` (Array)

3. **`aether.provider.getDefault`** (Filter)
   - Location: `providerDiscovery.js:22`
   - Filters the default provider
   - Parameters: `provider` (Object|null)

4. **`aether.provider.getForDeploymentType`** (Filter)
   - Location: `providerDiscovery.js:41`
   - Filters provider for specific deployment type
   - Parameters: `provider` (Object|null), `deploymentType` (string)

5. **`aether.provider.test`** (Filter)
   - Location: `local-filesystem/index.js:336`, `ProviderSettings/index.js:443`
   - Providers register test handlers via this filter
   - Parameters: `testHandler` (Function|null), `providerId` (string)

6. **`aether.provider.upload_strategy`** (Filter)
   - Location: `local-filesystem/index.js:358`
   - Providers can override upload strategy
   - Parameters: `strategy` (string|null), `providerId` (string)

7. **`aether.provider.form.actions`** (Action)
   - Location: `ProviderForm/index.js:153`
   - Fires in provider form actions area
   - Parameters: `hookContext` (Object)

8. **`aether.provider.form.before_fields`** (Action)
   - Location: `ProviderForm/index.js:143`
   - Fires before provider form fields
   - Parameters: `hookContext` (Object)

9. **`aether.provider.form.after_fields`** (Action)
   - Location: `ProviderForm/index.js:148`
   - Fires after provider form fields
   - Parameters: `hookContext` (Object)

10. **`aether.provider.panel.before_form`** (Action)
    - Location: `ProviderInstancePanel/index.js:427`
    - Fires before provider panel form
    - Parameters: `hookContext` (Object)

11. **`aether.provider.panel.after_form`** (Action)
    - Location: `ProviderInstancePanel/index.js:432`
    - Fires after provider panel form
    - Parameters: `hookContext` (Object)

12. **`aether.admin.provider.settings.saved`** (Action)
    - Location: `useProviderSettingsForm.js:doAction`
    - Fires after provider settings are saved
    - Parameters: `providerId` (string)

13. **`aether.file.upload`** (Action)
    - Location: `unifiedFileUpload.js:228`
    - Unified action for all file uploads
    - Parameters: `fileContext` (Object)

14. **`aether.file.upload.context`** (Filter)
    - Location: `unifiedFileUpload.js:221`
    - Filters file context before upload
    - Parameters: `fileContext` (Object), `providerId` (string)

15. **`aether.publish.workflow.after`** (Action)
    - Location: `StepExecutor.js:165`
    - Fires after workflow completes
    - Parameters: `state` (Object), `executionContext` (Object)

16. **`aether.publish.step.{stepId}.skip`** (Filter)
    - Location: `StepExecutor.js:107`
    - Determines if step should be skipped
    - Parameters: `shouldSkip` (boolean), `executionContext` (Object)

17. **`aether.publish.step.{stepId}.skipped`** (Action)
    - Location: `StepExecutor.js:124`
    - Fires when step is skipped
    - Parameters: `executionContext` (Object)

18. **`aether.publish.step.{stepId}.retry`** (Action)
    - Location: `StepExecutor.js:221`
    - Fires when step retries after error
    - Parameters: `error` (Error), `attempt` (number), `delay` (number), `executionContext` (Object)

19. **`aether.publish.step.generateBlueprint.data`** (Filter)
    - Location: `generateBlueprint/index.js:78`
    - Filters blueprint data before bundle creation
    - Parameters: `blueprintData` (Object), `context` (Object)

20. **`aether.publish.step.createBlueprintBundle.files`** (Filter)
    - Location: `createBlueprintBundle/index.js:40`
    - Filters files to include in blueprint bundle
    - Parameters: `files` (Array), `context` (Object)

21. **`aether.upload.result`** (Filter)
    - Location: `uploadStaticFiles/index.js:288`
    - Filters final upload result
    - Parameters: `result` (Object), `providers` (Array), `context` (Object)

22. **`aether.upload.urls`** (Filter)
    - Location: `uploadStaticFiles/index.js:87`
    - Filters URLs before processing
    - Parameters: `urls` (Array), `providers` (Array), `context` (Object)

23. **`aether.storage.service.config`** (Filter)
    - Location: `staticSiteConfig.js:143`
    - Filters storage service configuration
    - Parameters: `config` (Object), `staticPath` (string), `providerId` (string), `providerConfig` (Object)

24. **`aether.storage.service.create`** (Filter)
    - Location: `staticSiteConfig.js:152`
    - Filters storage service instance creation
    - Parameters: `storageService` (Object|null), `staticPath` (string), `config` (Object), `providerId` (string)

25. **`aether.manifest.fetch`** (Filter)
    - Location: `useStaticSiteGenerator.js:410` (referenced in HOOKS.md but not in main HOOKS.md)
    - Filters manifest fetching
    - Parameters: `manifest` (Object|null), `storageService` (Object), `providerId` (string)

26. **`aether.manifest.update`** (Filter)
    - Location: `useStaticSiteGenerator.js:878, 676` (referenced in HOOKS.md but not in main HOOKS.md)
    - Filters manifest updates
    - Parameters: `manifest` (Object), `storageKey` (string), `providerId` (string)

27. **`aether.manifest.cleanup`** (Filter)
    - Location: `useStaticSiteGenerator.js:1051` (referenced in HOOKS.md but not in main HOOKS.md)
    - Filters manifest cleanup
    - Parameters: `manifest` (Object), `currentFileKeys` (Set), `providerId` (string)

## Hooks That No Longer Exist

The following hooks are documented in HOOKS.md but are **NOT found** in the codebase:

1. **`aether.workflow.step.before`** - Replaced by `aether.publish.step.{stepId}.before`
2. **`aether.workflow.step.after`** - Replaced by `aether.publish.step.{stepId}.after`
3. **`aether.workflow.step.error`** - Replaced by `aether.publish.step.{stepId}.error`
4. **`aether.deployment.url`** - This appears to be replaced by `aether.provider.deployment_url`

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

## Recommendations

1. **Update HOOKS.md** with all missing hooks documented above
2. **Remove deprecated hooks** from documentation:
   - `aether.workflow.step.before` → Use `aether.publish.step.{stepId}.before`
   - `aether.workflow.step.after` → Use `aether.publish.step.{stepId}.after`
   - `aether.workflow.step.error` → Use `aether.publish.step.{stepId}.error`
   - `aether.deployment.url` → Use `aether.provider.deployment_url`
3. **Add workflow diagrams** showing hook execution order
4. **Document hook priorities** where relevant
5. **Add examples** for all new hooks
6. **Cross-reference** between main HOOKS.md and publish/HOOKS.md

