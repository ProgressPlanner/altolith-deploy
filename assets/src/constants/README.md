# Constants

Centralized constants for the Aether plugin. All magic strings, numbers, and configuration values should be defined here.

## Purpose

Constants provide:
- **Single source of truth** for configuration values
- **Type safety** with JSDoc annotations
- **Discoverability** through IDE autocomplete
- **Maintainability** by eliminating magic values scattered throughout code

## Files

### api.js

REST API endpoints and HTTP configuration.

```javascript
import { ENDPOINTS, HTTP_METHODS, HTTP_STATUS } from '../constants';

// API endpoints
const response = await apiFetch({
    path: ENDPOINTS.PUBLISH.START,
    method: HTTP_METHODS.POST,
});

// Status code checking
if (response.status === HTTP_STATUS.OK) {
    // ...
}
```

**Contents:**
- `API_NAMESPACE` - WordPress REST API namespace
- `API_BASE_PATH` - Base path for all endpoints
- `ENDPOINTS` - All REST API endpoints (nested by feature)
- `HTTP_METHODS` - HTTP method constants (GET, POST, PUT, DELETE, PATCH)
- `HTTP_STATUS` - HTTP status codes (200, 404, 500, etc.)
- `API_HEADERS` - Common request headers

### timing.js

Polling intervals, timeouts, delays, and cache durations.

```javascript
import { POLLING_INTERVAL, MAX_RETRIES, RETRY_INITIAL_DELAY, RETRY_MAX_DELAY } from '../constants';

// Use polling interval instead of magic number
const pollInterval = setInterval(checkStatus, POLLING_INTERVAL);

// Use retry configuration for API calls
const response = await fetchWithRetry(url, options, {
    retries: MAX_RETRIES,
    minTimeout: RETRY_INITIAL_DELAY,
    maxTimeout: RETRY_MAX_DELAY,
});
```

**Contents:**
- `POLLING_INTERVAL` - Standard polling rate (500ms)
- `MAX_RETRIES` - Maximum number of retry attempts (3)
- `RETRY_INITIAL_DELAY` - Initial retry delay in milliseconds (1000ms)
- `RETRY_MAX_DELAY` - Maximum retry delay in milliseconds (30000ms)

### providers.js

Provider IDs, types, and categorization functions.

```javascript
import { PROVIDER_IDS, isGitProvider, hasCapability } from '../constants';

// Check provider type
if (isGitProvider(providerId)) {
    // Handle git provider
}

// Check capabilities
if (hasCapability(provider, 'storage')) {
    // Provider supports storage
}
```

**Contents:**
- `PROVIDER_IDS` - All provider ID constants
- `PROVIDER_TYPES` - Provider type constants (storage, static-site)
- `STORAGE_PROVIDERS` - Array of storage provider IDs
- Helper functions:
  - `isStorageProvider(providerId)` - Check if provider is storage
  - `hasCapability(provider, capability)` - Check provider capabilities

### steps.js

Publish workflow step IDs, statuses, and progress calculation.

```javascript
import { PUBLISH_STEPS, STEP_STATUS, calculateOverallProgress } from '../constants';

// Use step constants
const currentStep = PUBLISH_STEPS.GENERATE_BLUEPRINT;

// Check status
if (step.status === STEP_STATUS.COMPLETE) {
    // Step is done
}

// Calculate progress
const progress = calculateOverallProgress(currentStep, stepProgress);
```

**Contents:**
- `PUBLISH_STEPS` - Step ID constants
- `STEP_STATUS` - Status values (pending, active, complete, error, skipped, waiting)
- `PUBLISH_STATUS` - Overall workflow statuses
- `STEP_WEIGHTS` - Relative weights for progress calculation
- Helper functions:
  - `calculateOverallProgress(stepId, stepProgress)` - Weighted progress
  - `getStepIndex(stepId)` - Get step position in workflow
  - `getNextStep(stepId)` - Get next step ID
  - `getPreviousStep(stepId)` - Get previous step ID

**Note:** This file complements `publish/utils/steps.js` which contains step definitions and metadata.

### capabilities.js

Provider capability constants and validation functions.

```javascript
import { CAP_STORAGE, CAP_STATIC_SITE, hasRequiredCapabilities } from '../constants';

// Check if provider meets requirements
const required = [CAP_STORAGE, CAP_STATIC_SITE];
if (hasRequiredCapabilities(provider.capabilities, required)) {
    // Provider supports both storage and static site hosting
}
```

**Contents:**
- `CAP_STORAGE` - Storage capability constant
- `CAP_STATIC_SITE` - Static site hosting capability
- Helper functions:
  - `hasRequiredCapabilities(providerCaps, requiredCaps)` - Validate capabilities
  - `getCapabilityLabel(capability)` - Get human-readable label

### index.js

Central export file. Import constants from here:

```javascript
// ✅ Import from constants directory
import { ENDPOINTS, POLLING_INTERVAL, PROVIDER_IDS } from '../constants';

// ❌ Don't import from individual files
import { ENDPOINTS } from '../constants/api'; // Avoid this
```

## Usage Guidelines

### When to Add Constants

Add a constant when you find yourself:
- Using the same string/number in multiple places
- Hardcoding API endpoints or URLs
- Writing timeout/interval values inline
- Checking provider types with string comparisons
- Defining configuration that might change

### Naming Conventions

- **ALL_CAPS** for simple constants: `POLLING_INTERVAL`, `PROVIDER_IDS`
- **NAMESPACED** objects for grouped constants: `ENDPOINTS.PUBLISH.START`
- **camelCase** for helper functions: `isGitProvider()`, `calculateProgress()`
- **Descriptive names** that explain purpose: `RETRY_INITIAL_DELAY` not `DELAY_1`

### Example: Replacing Magic Values

```javascript
// ❌ Before: Magic values scattered throughout code
setTimeout(checkStatus, 500);
fetch('/wp-json/aether/v1/publish');
if (providerId === 'local-filesystem') { }

// ✅ After: Using constants
import { POLLING_INTERVAL, ENDPOINTS, PROVIDER_IDS } from '../constants';

setTimeout(checkStatus, POLLING_INTERVAL);
fetch(ENDPOINTS.PUBLISH.START);
if (providerId === PROVIDER_IDS.CLOUDFLARE_R2) { }
```

## Benefits

1. **Discoverability**: IDE autocomplete shows all available constants
2. **Type Safety**: JSDoc provides type checking and documentation
3. **Refactoring**: Change value once, updates everywhere
4. **Consistency**: Everyone uses the same values
5. **Testing**: Easy to mock/override constants in tests
6. **Documentation**: Constants serve as API documentation

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Publish README](../publish/README.md) - Workflow steps
- [Providers README](../providers/README.md) - Provider system
