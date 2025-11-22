# Parallel Provider Upload Jobs with Step Architecture

## Problem

Currently, the export process uploads files sequentially per provider:

- Upload all files to Provider 1 → then Provider 2 → then Provider 3
- If Provider 1 fails, it still tries Provider 2, but they run sequentially
- Single progress bar aggregates progress across all providers
- Sequential progress calculation complicates code
- Activity list display adds unnecessary UI complexity
- No clear distinction between provider-agnostic steps (run once) and provider-specific steps (run per provider)

## Solution

Refactor with two key improvements:

1. **Step Architecture**: Add `providerSpecific: boolean` property to step definitions

   - Provider-agnostic steps (e.g., createBlueprintBundle, preScanStaticSite) run ONCE
   - Provider-specific steps (e.g., uploadBlueprintBundle, uploadStaticFiles) run in parallel per provider
   - StepExecutor automatically handles parallelization for provider-specific steps

2. **Parallel Processing**: Provider-specific steps automatically create parallel jobs

   - Each provider gets its own step instance with modified step ID (e.g., `uploadStaticFiles-provider-1`)
   - Each instance runs independently with its own progress bar
   - If one provider fails, others continue

3. **UI Simplification**: Remove activity list, show only progress bars

## Implementation

### 1. Add Provider-Specific Property to Step Definitions

**File:** `assets/src/export/steps/createBlueprintBundle/index.js`

**Changes:**

- Add `providerSpecific: false` to step definition (provider-agnostic)

**File:** `assets/src/export/steps/createWpContentArchive/index.js`

**Changes:**

- Add `providerSpecific: false` to step definition (provider-agnostic)

**File:** `assets/src/export/steps/getStaticSiteUrls/index.js`

**Changes:**

- Add `providerSpecific: false` to step definition (provider-agnostic)

**File:** `assets/src/export/steps/preScanStaticSite/index.js`

**Changes:**

- Add `providerSpecific: false` to step definition (provider-agnostic)

**File:** `assets/src/export/steps/uploadBlueprintBundle/index.js`

**Changes:**

- Add `providerSpecific: true` to step definition (provider-specific)
- Remove manual provider loop - StepExecutor will handle parallelization

**File:** `assets/src/export/steps/uploadStaticFiles/index.js`

**Changes:**

- Add `providerSpecific: true` to step definition (provider-specific)
- Remove manual provider loop - StepExecutor will handle parallelization
- Handler should expect single provider ID in context (not array)

### 2. Update Step Executor for Provider-Specific Steps

**File:** `assets/src/export/executor/StepExecutor.js`

**Changes:**

- Before executing steps, expand provider-specific steps into multiple step instances
- For each provider-specific step, create one instance per provider instance:
  ```javascript
  // Provider instances format: 'local-filesystem:uuid-123', 's3:uuid-456'
  // Original: { id: 'uploadStaticFiles', providerSpecific: true }
  // Expanded: [
  //   { id: 'uploadStaticFiles:local-filesystem:uuid-123', providerInstanceId: 'local-filesystem:uuid-123', ... },
  //   { id: 'uploadStaticFiles:s3:uuid-456', providerInstanceId: 's3:uuid-456', ... }
  // ]
  ```

- Step ID format: `{stepId}:{providerType}:{uuid}`

- Update dependency resolution to handle expanded step IDs
- Execute provider-specific step instances in parallel (they're in the same parallel group)
- Pass provider ID to step handler context

**File:** `assets/src/export/executor/DependencyResolver.js`

**Changes:**

- Update dependency validation to handle expanded provider-specific step IDs
- When a step depends on a provider-specific step, it depends on ALL provider instances
- Or: provider-agnostic steps can depend on provider-specific steps (they wait for all to complete)

### 3. Add Sub-Step Progress Tracking

**File:** `assets/src/export/utils/progressTracker.js`

**Changes:**

- Add `subStepProgress: { stepId: { subStepId: progress } }` to progress state
- Add `updateSubStepProgress(stepId, subStepId, progress)` method
- For provider-specific steps, use provider ID as sub-step ID

**File:** `assets/src/contexts/ExportContext.js`

**Changes:**

- Add `setSubStepProgress(stepId, subStepId, progress)` method to context
- Expose sub-step progress in progress state

### 4. Update Step Handlers for Provider-Specific Architecture

**File:** `assets/src/export/steps/uploadBlueprintBundle/index.js`

**Changes:**

- **BREAKING CHANGE**: Handler now receives single `providerId` in context (not array)
- Remove provider loop - handler processes one provider
- Update to use `setSubStepProgress` for progress tracking
- StepExecutor will call handler once per provider in parallel

**File:** `assets/src/export/steps/uploadStaticFiles/index.js`

**Changes:**

- **BREAKING CHANGE**: Handler now receives single `providerId` in context (not array)
- Remove provider loop entirely - handler processes one provider
- Update to use `setSubStepProgress` for progress tracking
- StepExecutor will call handler once per provider in parallel

**File:** `assets/src/export/hooks/useStaticSiteGenerator.js`

**Changes:**

- **BREAKING CHANGE**: Remove generic `onProgress` callback parameter
- **ADD**: `setSubStepProgress(subStepId, progress)` callback parameter
- Update all progress reporting to use `setSubStepProgress(subStepId, progress)`

**File:** `assets/src/export/hooks/useExportController.js`

**Changes:**

- **DELETE** sequential provider progress calculation code (lines 86-101)
- **DELETE** `onProgress` callback wrapper
- Update `useStaticSiteGenerator` initialization to pass `setSubStepProgress` directly

### 5. Update UI Components - Remove Activity List

**File:** `assets/src/components/ExportProgressModal/index.js`

**Changes:**

- Display multiple progress bars for provider-specific steps (one per provider)
- Each progress bar labeled with provider ID/name
- Show status (success/error/in-progress) per provider
- **DELETE** activity list (`aether-export-progress-modal__activity-list`) entirely
- Remove all status message rendering code

**File:** `assets/src/components/ActivityLogMessage/index.js`

**Changes:**

- **DELETE** this file entirely if no dependencies exist

## Technical Details

### Step Definition Structure

```javascript
{
  id: 'uploadStaticFiles',
  label: 'Upload Static Files',
  providerSpecific: true,  // NEW: indicates step runs per provider
  dependencies: ['preScanStaticSite'],
  provides: [],
  handler: async (context) => {
    // context.providerId contains the provider ID
    // StepExecutor calls this once per provider in parallel
  }
}
```

### Step Expansion Logic

```javascript
// Before expansion:
[
  { id: 'createBlueprintBundle', providerSpecific: false },
  { id: 'uploadBlueprintBundle', providerSpecific: true }
]

// After expansion (with provider instances):
// Provider instances format: { type: 'local-filesystem', instanceId: 'uuid-123' }
[
  { id: 'createBlueprintBundle', providerSpecific: false },
  { id: 'uploadBlueprintBundle:local-filesystem:uuid-123', providerType: 'local-filesystem', providerInstanceId: 'uuid-123', providerSpecific: true },
  { id: 'uploadBlueprintBundle:s3:uuid-456', providerType: 's3', providerInstanceId: 'uuid-456', providerSpecific: true }
]
```

**Step ID Format:** `{stepId}:{providerType}:{providerInstanceId}`

### Progress Tracking Structure

```javascript
{
  stepProgress: {
    'uploadStaticFiles-provider-1': 100,
    'uploadStaticFiles-provider-2': 50
  },
  subStepProgress: {
    'uploadStaticFiles-provider-1': {
      'provider-1': 100  // Redundant but consistent
    }
  }
}
```

### Dependency Handling

- Provider-agnostic step depends on provider-specific step: waits for ALL provider instances to complete
- Provider-specific step depends on provider-agnostic step: normal dependency
- Provider-specific step depends on another provider-specific step: depends on same provider instance

## Files to Modify

1. **Step Definitions:**

   - All step files - Add `providerSpecific: boolean` property
   - `uploadBlueprintBundle/index.js` - Remove provider loop, expect single providerId
   - `uploadStaticFiles/index.js` - Remove provider loop, expect single providerId

2. **Step Executor:**

   - `assets/src/export/executor/StepExecutor.js` - Expand provider-specific steps, handle parallel execution
   - `assets/src/export/executor/DependencyResolver.js` - Handle expanded step IDs in dependencies

3. **Progress Tracking:**

   - `assets/src/export/utils/progressTracker.js` - Add sub-step progress support
   - `assets/src/contexts/ExportContext.js` - Add sub-step progress API

4. **Step Handlers:**

   - `assets/src/export/hooks/useStaticSiteGenerator.js` - Breaking API change
   - `assets/src/export/hooks/useExportController.js` - Remove sequential progress calculation

5. **UI Components:**

   - `assets/src/components/ExportProgressModal/index.js` - Multiple progress bars, remove activity list
   - `assets/src/components/ActivityLogMessage/index.js` - DELETE if no dependencies

6. **Tests:**

   - Update all step tests to include `providerSpecific` property
   - Test step expansion logic
   - Test parallel execution of provider-specific steps
   - Test dependency resolution with expanded steps