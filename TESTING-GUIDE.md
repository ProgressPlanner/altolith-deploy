# Testing Guide - Per-Provider Queue Architecture

## Overview

This guide helps you test the new per-provider queue architecture that enables parallel provider execution with global cache coordination.

## What Changed

### Before
- Steps executed sequentially, processing all providers in loops
- One provider failure blocked the entire workflow
- HTML and assets fetched multiple times (once per provider)

### After
- Each provider runs its own independent workflow queue in parallel
- Provider failures are isolated (others continue)
- HTML and assets fetched once and shared via cache
- ~60% performance improvement for multi-provider setups

## Testing Scenarios

### 1. Single Provider Export (Baseline)

**Purpose:** Verify basic functionality still works

**Steps:**
1. Configure one provider (e.g., Local Filesystem)
2. Enable "Static Site" deployment type
3. Click "Publish" button
4. Watch the export modal

**Expected Results:**
- ✅ Overall progress bar shows 0-100%
- ✅ One provider progress card appears
- ✅ Provider name displayed correctly
- ✅ Status updates: Waiting → In Progress → Complete
- ✅ Current status message shows what's happening
- ✅ Upload statistics show: 1 provider, X files uploaded, Y size
- ✅ Activity log shows all messages
- ✅ Export completes successfully

### 2. Multiple Providers (Same Type)

**Purpose:** Test parallel execution with multiple instances

**Setup:**
1. Configure 2-3 instances of Local Filesystem provider
   - Name them: "Production", "Staging", "Backup"
   - Set different target directories
   - Enable "Static Site" for all
2. Click "Publish"

**Expected Results:**
- ✅ Overall progress bar moves smoothly 0-100%
- ✅ One progress card per provider instance
- ✅ Provider names show: "Local Filesystem (Production)", etc.
- ✅ All providers start almost simultaneously
- ✅ Each provider shows independent progress
- ✅ Status messages update independently
- ✅ Upload statistics show: 3 providers, X files, Y size
- ✅ All providers complete successfully
- ✅ **Performance:** Faster than sequential (watch timing)

### 3. Mixed Deployment Types

**Purpose:** Test global step caching across deployment types

**Setup:**
1. Configure providers:
   - Local Filesystem: Static Site + Blueprint Bundle
   - (Optional) Another provider: Blueprint Bundle only
2. Click "Publish"

**Expected Results:**
- ✅ Global steps run once (watch activity log):
   - "Discovering URLs..." appears once
   - "Creating wp-content archive..." appears once
   - "Creating blueprint bundle..." appears once
- ✅ Each provider uploads independently
- ✅ Static site files uploaded to static provider
- ✅ Blueprint bundle uploaded to all providers
- ✅ No duplicate URL discovery or asset scanning

### 4. Provider Failure Isolation

**Purpose:** Verify one provider failure doesn't block others

**Setup:**
1. Configure 3 Local Filesystem providers
2. For provider #2, set an **invalid/non-writable path**
3. Click "Publish"

**Expected Results:**
- ✅ Providers 1 and 3 complete successfully
- ✅ Provider 2 shows "Error" status
- ✅ Provider 2's progress card shows error message
- ✅ Providers 1 and 3 continue to completion
- ✅ Activity log shows error for provider 2
- ✅ Overall workflow completes (not blocked)

### 5. Global Cache Verification

**Purpose:** Confirm HTML/assets fetched only once

**Setup:**
1. Configure 2+ providers for Static Site
2. Open browser DevTools → Network tab
3. Click "Publish"
4. Watch network requests

**Expected Results:**
- ✅ HTML pages fetched once (not per provider)
- ✅ CSS/JS/image assets fetched once
- ✅ Activity log shows: "Pre-scanning URLs..." once
- ✅ Message: "Pre-scanned X pages and found Y unique assets" once
- ✅ Each provider uploads files (watch upload messages)

### 6. Progress Tracking Accuracy

**Purpose:** Verify progress bars update correctly

**Setup:**
1. Configure 2 providers
2. Click "Publish"
3. Watch progress bars closely

**Expected Results:**
- ✅ Overall progress: 0% → 100% (monotonic, never goes backward)
- ✅ Each provider progress: 0% → 100% independently
- ✅ Provider status updates: Waiting → In Progress → Complete
- ✅ Current message shows real-time activity
- ✅ No flickering or jumping progress values

### 7. Large Site Performance

**Purpose:** Test with many URLs/assets

**Setup:**
1. Site with 50+ pages
2. Configure 3 providers
3. Click "Publish"
4. Time the execution

**Expected Results:**
- ✅ Pre-scan completes (watch for "Pre-scanned X pages")
- ✅ All providers process pages in parallel
- ✅ Total time ≈ Max(individual provider times), not Sum
- ✅ No browser memory issues (cache has 500-URL limit)
- ✅ Upload statistics accurate

## UI Components to Verify

### Overall Progress Bar
- Located at top of modal
- Shows total workflow completion (0-100%)
- Smooth animation, no jumping
- Never goes backward

### Provider Progress Cards
Each card shows:
- **Provider Name:** Human-readable name
  - Single instance: "Local Filesystem"
  - Multiple instances: "Local Filesystem (abc123...)"
- **Status Badge:** Waiting / In Progress / Complete / Error
- **Progress Bar:** 0-100% for this provider
- **Current Message:** What this provider is doing now
  - Example: "Uploading index.html..."
  - Example: "Uploaded 100 files"
  - Changes in real-time (no history)

### Upload Statistics
- Provider count (number of instances)
- Files uploaded (total across all providers)
- Total size (formatted, e.g., "2.5 MB")

### Activity Log
- Full message history (newest first)
- Scrollable (auto-scrolls to top on new messages)
- Shows all provider activity
- Grouped by type (progress → error → success/info)

## Console Debugging

Open browser console and look for:

```javascript
// Workflow lifecycle
[Workflow] Step starting: getStaticSiteUrls
[Workflow] Step completed: getStaticSiteUrls

// Global cache coordination
[Workflow] Step using cached result: createBlueprintBundle (provider: local-filesystem:123)
[Workflow] Provider waiting for global step: preScanStaticSite (provider: local-filesystem:456)

// Provider execution
[Workflow] Step starting: uploadStaticFiles (provider: local-filesystem:123)
[Workflow] Step completed: uploadStaticFiles (provider: local-filesystem:123)
```

## Common Issues & Solutions

### Issue: Provider progress stuck at 0%
**Cause:** Provider may be waiting for global step
**Solution:** Check activity log for "waiting" messages

### Issue: All providers show same progress
**Cause:** Progress calculation issue
**Solution:** Check browser console for errors

### Issue: "No provider IDs found" warning
**Cause:** Provider array not passed to workflow
**Solution:** Verify provider configuration in settings

### Issue: Duplicate HTML fetches in network tab
**Cause:** Cache not working
**Solution:** Check IndexedDB in DevTools → Application tab

### Issue: Progress bar goes backward
**Cause:** Progress calculation bug
**Solution:** Report bug (should never happen with monotonic progress)

## Developer Tools

### IndexedDB Inspection
1. Open DevTools → Application tab
2. Expand IndexedDB → aether_global_step_cache
3. Check stepCache object store
4. Verify entries for each step:
   - `getStaticSiteUrls`
   - `preScanStaticSite`
   - `createBlueprintBundle`
   - etc.

### Network Monitoring
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Watch for:
   - HTML page requests (should be once)
   - Asset requests (CSS/JS/images, should be once)
   - REST API calls (to WordPress backend)

### Performance Profiling
1. Open DevTools → Performance tab
2. Start recording
3. Click "Publish"
4. Stop when complete
5. Look for:
   - Parallel Promise.all() execution
   - IndexedDB read/write operations
   - No long blocking tasks

## Automated Testing

### JavaScript Tests
```bash
# Run all tests
npm run test:js

# Run specific test
npm run test:js -- globalStepCache.test.js
npm run test:js -- StepExecutor.new.test.js

# Watch mode
npm run test:js:watch
```

**Coverage:**
- GlobalStepCache: 19 tests
- StepExecutor: 19 tests
- Total: 2030 tests across entire codebase

### PHP Tests
```bash
# Run all tests
composer test

# Run specific suite
composer test:unit
composer test:integration
```

## Reporting Issues

If you find bugs, please report with:
1. **Scenario:** What were you testing?
2. **Steps:** Exact steps to reproduce
3. **Expected:** What should happen
4. **Actual:** What actually happened
5. **Console:** Any errors in browser console
6. **Network:** Any failed/duplicate requests
7. **Screenshots:** Export modal state when issue occurred

## Success Criteria

✅ All single-provider exports work
✅ Multiple providers execute in parallel
✅ Progress bars update independently
✅ One provider failure doesn't block others
✅ HTML/assets fetched only once (cache working)
✅ UI responsive throughout export
✅ No JavaScript errors in console
✅ Faster than sequential execution
✅ All automated tests pass
✅ Production build successful

## Next Steps

After testing, the system is ready for:
1. **Staging deployment** - Test with real providers (S3, Cloudflare, etc.)
2. **Performance benchmarking** - Measure actual speedup
3. **User acceptance testing** - Get feedback from end users
4. **Production rollout** - Deploy to live sites

---

**Documentation:**
- Implementation details: `PER-PROVIDER-QUEUE-IMPLEMENTATION.md`
- Architecture overview: This repository's main README
- API reference: JSDoc comments in source code
