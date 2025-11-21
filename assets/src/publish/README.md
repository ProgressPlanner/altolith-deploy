# Publish Workflow

Static site generation and deployment orchestration for the Aether plugin.

## Overview

The publish workflow converts a WordPress site running in WordPress Playground into a static site and deploys it to a cloud provider. It uses a **hook-based job orchestration** model (`@wordpress/hooks`) with React and PHP coordination via REST API.

## Architecture

### Hybrid React + PHP

The workflow is split between React (client-side) and PHP (server-side):

**React handles:**
- `generateStaticSite` step - Fetch URLs, process HTML, extract assets, upload to provider
- Direct production upload (no staging for static files)
- Asset extraction BEFORE HTML processing (prevents CORS/404 errors)
- Upload manifest processing (skips already-uploaded files)

**PHP handles:**
- All other steps via REST endpoints (`PublishStepsController.php`)
- `generateBlueprint` - Create WordPress Playground blueprint (98% storage reduction)
- `prepare_upload_manifest` - List files for upload
- Job status management and persistence

### Job Orchestration

The workflow uses a three-level hierarchy (Jobs → Phases → Steps) with automatic dependency resolution:

**Jobs:**
1. **buildBlueprintBundle** - Create WordPress Playground blueprint bundle
   - discover phase → discoverAssets step
   - prepare phase → createSiteArchive step
   - generate phase → generateBlueprint step

2. **publishStaticSite** - Generate static HTML site
   - discover phase → getStaticSiteUrls step

3. **uploadAssets** - Upload generated assets to providers
   - blueprintBundle phase → uploadBundle step (depends on buildBlueprintBundle)
   - staticSite phase → uploadStaticFiles step (depends on publishStaticSite)

Jobs register via `@wordpress/hooks` and can be extended by third-party plugins. See `WORKFLOW_REFACTOR.md` for details.

## Directory Structure

```
publish/
├── components/          # React components for publish UI
│   ├── PublishProgressModal.js  # Main publish modal with progress
│   ├── PublishPage.js           # Full-page publish interface
│   └── ...
├── hooks/               # Custom hooks for publish logic
│   ├── usePublishController.js  # Main orchestration using job system
│   ├── useStaticSiteGenerator.js  # Static site generation (React)
│   ├── usePublishAPI.js         # REST API calls
│   ├── useBlueprintGenerator.js # Blueprint generation
│   └── ...
├── jobs/                # Job-based workflow system
│   ├── buildBlueprintBundle/  # Blueprint bundle job
│   ├── publishStaticSite/     # Static site job
│   ├── uploadAssets/          # Upload job
│   └── index.js         # Job registry entry point
├── registry/            # Workflow orchestration
│   ├── JobRegistry.js   # Job registration system
│   ├── DependencyResolver.js  # Dependency resolution
│   └── HookManager.js   # Hook utilities
├── workflows/           # Workflow execution
│   └── jobExecutor.js   # Job executor with hooks
└── utils/               # Utility functions
    ├── steps.js         # Step definitions and metadata
    ├── progressManager.js  # Progress calculation
    ├── assetExtractor.js  # Extract assets from HTML
    ├── urlRewriter.js     # Rewrite URLs in HTML
    └── ...
```

## Key Components

### PublishProgressModal

Main publish modal component that shows workflow progress.

**Location:** `components/PublishProgressModal.js`

**Features:**
- Step-by-step progress display
- Real-time status updates
- Cancel/close handling
- Error display with retry
- Completion callback with deployment URL

**Usage:**
```javascript
import PublishProgressModal from '../components/PublishProgressModal';

<PublishProgressModal
    isOpen={isOpen}
    onClose={handleClose}
    onComplete={handleComplete}
/>
```

### usePublishController

Main orchestration hook using the job-based workflow system.

**Location:** `hooks/usePublishController.js`

**Responsibilities:**
- Job execution via `executeJobs()` from `workflows/jobExecutor.js`
- Status polling and updates
- Error handling and recovery
- Progress calculation via `progressManager.js`
- Job lifecycle management

**Implementation:**
- Uses `@wordpress/hooks` for job orchestration
- Three-level hierarchy: Jobs → Phases → Steps
- Automatic dependency resolution
- Extensible via third-party plugins

### useStaticSiteGenerator

React-based static site generation (this is the correct approach).

**Location:** `hooks/useStaticSiteGenerator.js`

**Process:**
1. Fetch list of URLs to export
2. Fetch each URL's HTML
3. Extract assets (CSS, JS, images) from HTML
4. Process and rewrite URLs in HTML
5. Upload assets to provider (direct to production)
6. Upload processed HTML files

**Why React?**
- Needs browser environment for URL fetching
- WordPress Playground runs in browser
- Direct upload from browser to cloud provider
- Avoids PHP memory/time limits

## Step Definitions

### steps.js - Source of Truth

All step metadata is defined in `utils/steps.js`:

```javascript
export const steps = [
    {
        id: 'discoverAssets',
        label: __('Discovering assets', 'aether'),
        phase: 'preparation',
        supportsProgress: true,
        completionMessage: __('Assets discovered successfully', 'aether'),
        // ... more metadata
    },
    // ... more steps
];

// Helper functions
export function getStep(stepId);
export function getNextStep(stepId);
export function getLabel(stepId);
```

This file provides:
- Internationalized labels
- Phase grouping
- Progress support flags
- Completion messages
- Navigation helpers

## API Integration

### REST Endpoints

All publish endpoints are defined in `constants/api.js`:

```javascript
import { ENDPOINTS } from '../../constants';

// Start publish job
apiFetch({
    path: ENDPOINTS.PUBLISH.START,
    method: 'POST',
    data: { changedAssets, discoveredAssets },
});

// Get job status
apiFetch({
    path: ENDPOINTS.PUBLISH.JOB_STATUS(jobId),
});

// Execute step
apiFetch({
    path: ENDPOINTS.PUBLISH.STEP(stepId),
    method: 'POST',
    data: { jobId },
});
```

### usePublishAPI Hook

Centralizes all publish-related API calls:

```javascript
import { usePublishAPI } from '../hooks/usePublishAPI';

const {
    startPublish,
    getJobStatus,
    executeStep,
    markUploadsComplete,
} = usePublishAPI();
```

## Asset Extraction

### Critical: Extract BEFORE HTML Processing

Assets must be extracted from HTML **before** processing URLs to avoid CORS and 404 errors:

```javascript
// ✅ Correct order
const assets = extractAssets(html);  // Extract first
const processedHtml = rewriteUrls(html, baseUrl);  // Process after

// ❌ Wrong order
const processedHtml = rewriteUrls(html, baseUrl);
const assets = extractAssets(processedHtml);  // Assets now broken!
```

### assetExtractor.js

Extracts all assets from HTML:

- CSS files (`<link rel="stylesheet">`)
- JavaScript files (`<script src="...">`)
- Images (`<img src="...">`)
- Fonts (from CSS `@font-face`)
- Background images (from inline styles and CSS)

**Returns:** Deduplicated list of asset URLs with metadata

### urlRewriter.js

Rewrites URLs in HTML to work with static hosting:

- Converts WordPress URLs to relative paths
- Handles trailing slashes correctly
- Preserves query parameters
- Supports custom domains

## Error Handling

### Retry Strategy

Steps can fail and retry with exponential backoff:

```javascript
const maxRetries = 3;
let attempt = 0;

while (attempt < maxRetries) {
    try {
        await executeStep(stepId);
        break;
    } catch (error) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        await delay(1000 * Math.pow(2, attempt));
    }
}
```

### User Communication

- Clear error messages in modal
- Option to retry failed steps
- Detailed error logs for debugging
- Graceful degradation when possible

## Testing

### Unit Tests

```bash
# Run all publish tests
npm run test:js -- assets/src/publish

# Watch mode
npm run test:js -- --watch assets/src/publish
```

### E2E Tests

End-to-end tests run full publish workflow in WordPress Playground:

```bash
# Run publish E2E tests
npm run test:e2e -- --grep "publish"
```

## Performance Considerations

### Chunking

Large operations are chunked to avoid timeouts:

- Process URLs in batches (10-20 at a time)
- Upload files in chunks (5-10 concurrent)
- Report progress after each chunk

### Cancellation

Users can cancel long-running publishes:

```javascript
const abortController = new AbortController();

// Pass to fetch calls
fetch(url, { signal: abortController.signal });

// Cancel when needed
abortController.abort();
```

## Future Improvements (Planned)

### Phase 4-5 Refactoring

- **Split usePublishController** into smaller hooks
- **Extract business logic** to service classes
- **Improve state management** with Context API
- **Add proper cancellation** support throughout
- **Better error recovery** with partial retry

See `REFACTORING_PLAN.md` for details.

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Providers README](../providers/README.md) - Cloud provider integration
- [Constants README](../constants/README.md) - API endpoints and timing
- [Components README](../components/README.md) - Shared components
- [Hooks README](../hooks/README.md) - Custom hooks
