# Export Workflow

Static site generation and deployment orchestration for the Altolith plugin.

## Overview

The export workflow converts a WordPress site running in WordPress Playground into a static site and deploys it to a cloud provider. It uses a **hook-based step orchestration** model (`@wordpress/hooks`) with React and PHP coordination via REST API.

## Architecture

### Hybrid React + PHP

The workflow is split between React (client-side) and PHP (server-side):

**React handles:**
- `generateStaticSite` step - Fetch URLs, process HTML, extract assets, upload to provider
- Direct production upload (no staging for static files)
- Asset extraction BEFORE HTML processing (prevents CORS/404 errors)
- Upload manifest processing (skips already-uploaded files)

**PHP handles:**
- All other steps via REST endpoints (`ExportStepsController.php`)
- `generateBlueprint` - Create WordPress Playground blueprint (98% storage reduction)
- `prepare_upload_manifest` - List files for upload
- Job status management and persistence

### Step-Based Workflow

Steps are defined in `steps/index.js` and registered via `@wordpress/hooks`. Each step:
- Has a unique ID, label, and description
- Declares dependencies on other steps
- Declares what data it provides to subsequent steps
- Optionally supports progress tracking

**Steps:**
1. **discoverBlueprintBundleAssets** - Find plugins, themes, and uploads to include
2. **createWpContentArchive** - Package wp-content.zip archive
3. **createBlueprintBundle** - Create blueprint-bundle.zip with blueprint.json
4. **uploadBlueprintBundle** - Upload blueprint bundle to providers
5. **getStaticSiteUrls** - Discover all URLs for static site generation
6. **preScanStaticSite** - Pre-scan URLs to extract assets before upload
7. **uploadStaticFiles** - Generate and upload static HTML/CSS/JS

Steps register via the `altolith.export.register_steps` action hook. Each step declares its data dependencies (`requires`) and outputs (`provides`), allowing the StepExecutor to automatically resolve dependencies and execute steps in parallel when possible.

## Directory Structure

```
export/
├── executor/            # Step executor system
│   ├── StepExecutor.js  # Main executor with dependency resolution
│   ├── DependencyResolver.js  # Dependency resolution and parallel execution
│   ├── DataValidator.js  # Validates step data requirements
│   └── ThreadOrchestrator.js  # Thread-based step execution
├── hooks/               # Custom hooks for export logic
│   ├── useExportController.js  # Main orchestration using step system
│   ├── useStaticSiteGenerator.js  # Static site generation (React)
│   ├── useExportAPI.js         # REST API calls
│   ├── useBlueprintGenerator.js # Blueprint generation
│   └── ...
├── registry/            # Step registry
│   └── StepRegistry.js  # Singleton registry for step definitions
├── steps/               # Step definitions
│   ├── index.js         # Step registry and getRegisteredSteps()
│   ├── discoverBlueprintBundleAssets/
│   ├── createWpContentArchive/
│   ├── createBlueprintBundle/
│   ├── uploadBlueprintBundle/
│   ├── getStaticSiteUrls/
│   ├── preScanStaticSite/
│   └── uploadStaticFiles/
└── utils/               # Utility functions
    ├── progressTracker.js  # Progress tracking
    ├── stateManager.js  # State management
    ├── assetExtractor.js  # Extract assets from HTML
    ├── urlRewriter.js     # Rewrite URLs in HTML
    └── ...
```

## Key Components

### ExportProgressModal

Main export modal component that shows workflow progress.

**Location:** `../components/ExportProgressModal/index.js`

**Features:**
- Step-by-step progress display
- Real-time status updates
- Cancel/close handling
- Error display with retry
- Completion callback with deployment URL

**Usage:**
```javascript
import ExportProgressModal from '../components/ExportProgressModal';

<ExportProgressModal
    isOpen={isOpen}
    onClose={handleClose}
    onComplete={handleComplete}
/>
```

### useExportController

Main orchestration hook using the step-based workflow system.

**Location:** `hooks/useExportController.js`

**Responsibilities:**
- Step execution via `executeJobs()` from `workflows/jobExecutor.js`
- Status polling and updates
- Error handling and recovery
- Progress calculation via `progressManager.js`
- Step lifecycle management

**Implementation:**
- Uses `@wordpress/hooks` for step orchestration
- Steps declare dependencies and provided data
- Automatic dependency resolution
- Extensible via `altolith.export.steps` filter

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

### steps/index.js - Source of Truth

All step definitions are in `steps/*/index.js` files and exported via `steps/index.js`:

```javascript
import { getRegisteredSteps } from './steps';

const steps = getRegisteredSteps();
// Returns array of step definitions with:
// - id: unique identifier
// - label: internationalized display name
// - description: internationalized description
// - supportsProgress: boolean for progress tracking
// - dependencies: array of step IDs this depends on
// - provides: array of data keys this step provides
// - handler: async function that executes the step
```

Steps can be extended via the `altolith.export.steps` filter:

```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('altolith.export.steps', 'my-plugin/custom-step', (steps) => {
    return [...steps, myCustomStep];
});
```

## API Integration

### REST Endpoints

All export endpoints are defined in `constants/api.js`:

```javascript
import { ENDPOINTS } from '../../constants';

// Start export job
apiFetch({
    path: ENDPOINTS.EXPORT_WORKFLOW.START,
    method: 'POST',
    data: { changedAssets, discoveredAssets },
});

// Get job status
apiFetch({
    path: ENDPOINTS.EXPORT_WORKFLOW.JOB_STATUS(jobId),
});

// Execute step
apiFetch({
    path: ENDPOINTS.EXPORT_WORKFLOW.STEP(stepId),
    method: 'POST',
    data: { jobId },
});
```

### useExportAPI Hook

Centralizes all export-related API calls:

```javascript
import { useExportAPI } from '../hooks/useExportAPI';

const {
    startExport,
    getJobStatus,
    executeStep,
    markUploadsComplete,
} = useExportAPI();
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
# Run all export tests
npm run test:js -- assets/src/export

# Watch mode
npm run test:js -- --watch assets/src/export
```

## Performance Considerations

### Chunking

Large operations are chunked to avoid timeouts:

- Process URLs in batches (10-20 at a time)
- Upload files in chunks (5-10 concurrent)
- Report progress after each chunk

### Cancellation

Users can cancel long-running exportes:

```javascript
const abortController = new AbortController();

// Pass to fetch calls
fetch(url, { signal: abortController.signal });

// Cancel when needed
abortController.abort();
```

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Providers README](../providers/README.md) - Cloud provider integration
