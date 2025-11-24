# Migration Guide for 3rd-Party Plugins

**Last Updated:** 2025-11-19
**Plugin Version:** 1.0.0+

This guide helps developers of 3rd-party Aether Site Exporter plugins update their code to work with the latest refactoring changes.

---

## Table of Contents

1. [Breaking Changes](#breaking-changes)
2. [Deprecated Code Removed](#deprecated-code-removed)
3. [New Utilities & Hooks](#new-utilities--hooks)
4. [REST API Changes](#rest-api-changes)
5. [Provider Implementation Updates](#provider-implementation-updates)
6. [JavaScript/React Changes](#javascriptreact-changes)
7. [Migration Examples](#migration-examples)

---

## Breaking Changes

### ❌ Removed: Backwards-Compatibility Code

All backwards-compatibility layers have been removed. If your plugin was relying on deprecated patterns, you must update to the current API.

### ❌ Removed: Unused Constants

The following constants have been removed from `assets/src/constants/providers.js`:

```javascript
// ❌ REMOVED - DO NOT USE
const PROVIDER_INTERNAL_KEYS = [...]; // No longer available
const PROVIDER_CONFIG_KEYS = [...];   // No longer available
```

**Migration:** These constants were unused. If you need similar functionality, define your own constants.

### ❌ Removed: Helper Script

The `scripts/create-provider.js` scaffolding script has been removed.

**Migration:** Use the provider examples in the codebase as templates. See `assets/src/providers/local-filesystem/LocalFilesystemProvider.js` for a complete JavaScript implementation.

---

## Deprecated Code Removed

### Removed Functions

#### JavaScript

```javascript
// ❌ REMOVED from assets/src/export/workflows/publishWorkflow.js
function filterWorkflowByExportTypes(workflow, exportTypes) {
  // This function is no longer available
}
```

**Migration:** Workflow filtering is now handled internally. If you need custom workflow filtering, implement it in your own plugin code.

#### PHP

No PHP functions were removed in this refactoring. The public API remains stable.

---

## New Utilities & Hooks

### New React Hooks (Available for Use)

#### 1. `useProviderSettings()` - Centralized Provider Settings Management

**Location:** `assets/src/hooks/useProviderSettings.js`

**Purpose:** Manage provider settings with a single, centralized hook instead of duplicating fetch/save logic.

**Example:**

```javascript
import { useProviderSettings } from '../hooks/useProviderSettings';

function MyProviderComponent() {
  const {
    loading,
    error,
    fetchProviderSettings,
    updateProviderConfig,
  } = useProviderSettings();

  // Fetch all provider settings
  const loadSettings = async () => {
    const providers = await fetchProviderSettings();
    console.log(providers);
  };

  // Update a specific provider
  const saveProvider = async () => {
    const updated = await updateProviderConfig('my-provider', {
      api_key: 'new-key',
    });
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={loadSettings}>Load Settings</button>
      <button onClick={saveProvider}>Save Provider</button>
    </div>
  );
}
```

**Benefits:**
- Single source of truth for provider settings
- Automatic loading state management
- Error handling built-in
- No need to duplicate REST API calls

---

**When to Use:**
- If your plugin adds providers with dependencies
- If you manage provider configurations in a custom UI

---

#### 3. `useProviderMetadataReload()` - Reload Metadata on Deployment Type Changes

**Location:** `assets/src/admin-settings/hooks/useProviderMetadataReload.js`

**Purpose:** Automatically reload provider metadata when deployment types change.

**Example:**

```javascript
import { useProviderMetadataReload } from './hooks/useProviderMetadataReload';

function MyProviderModal() {
  const [configs, setConfigs] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState([]);

  // Auto-reload metadata when deployment types change
  useProviderMetadataReload(
    configs,
    isModalOpen,
    selectedProvider,
    setProviders,
    setSelectedProvider
  );

  // Your component logic...
}
```

---

### New Utility Functions (Available for Use)

**Location:** `assets/src/utils/helpers.js`

#### `filterNullishValues(obj)`

Remove null/undefined values from an object.

```javascript
import { filterNullishValues } from '../utils/helpers';

const cleaned = filterNullishValues({
  name: 'Test',
  value: null,      // Will be removed
  count: undefined, // Will be removed
  region: 'us-east',   // Will be kept (non-nullish value)
});
// Result: { name: 'Test', region: 'us-east' }
```

#### `parseJSONSafely(jsonString, fallback, validator)`

Parse JSON with fallback and optional validation.

```javascript
import { parseJSONSafely } from '../utils/helpers';

const data = parseJSONSafely(
  localStorage.getItem('myData'),
  { default: 'value' },
  (parsed) => parsed && typeof parsed === 'object'
);
```

#### `parseJSONArray(jsonString, fallback)`

Parse JSON array with type checking.

```javascript
import { parseJSONArray } from '../utils/helpers';

const items = parseJSONArray(localStorage.getItem('items'), []);
// Guaranteed to return an array
```

#### `parseJSONObject(jsonString, fallback)`

Parse JSON object with type checking.

```javascript
import { parseJSONObject } from '../utils/helpers';

const config = parseJSONObject(localStorage.getItem('config'), {});
// Guaranteed to return an object
```

#### `isEncryptedValue(value)`

Check if a value is encrypted.

```javascript
import { isEncryptedValue } from '../utils/helpers';

if (isEncryptedValue(apiKey)) {
  console.log('API key is encrypted');
}
```

#### `deepMerge(target, source)`

Deep merge two objects.

```javascript
import { deepMerge } from '../utils/helpers';

const merged = deepMerge(
  { a: { b: 1 }, c: 2 },
  { a: { d: 3 }, e: 4 }
);
// Result: { a: { b: 1, d: 3 }, c: 2, e: 4 }
```

#### `debounce(func, wait, immediate)`

Debounce function calls.

```javascript
import { debounce } from '../utils/helpers';

const handleSearch = debounce((query) => {
  // Search logic
}, 300);
```

---

### New Error Handler (Global)

**Location:** `assets/src/utils/errorHandler.js`

**Purpose:** Handle unhandled promise rejections and runtime errors globally.

**Usage:** Already initialized in entry points. To enable debug mode:

```javascript
// In browser console
window.aetherDebug = true;

// All debug messages will now appear
```

**For Plugin Developers:**

If you want to use the debug utilities in your own code:

```javascript
import { debug, debugError, debugWarn } from '../utils/debug';

// These only log when window.aetherDebug = true
debug('My debug message');
debugError('My error message');
debugWarn('My warning message');
```

**Replace console.log with debug utilities:**

```javascript
// ❌ OLD - Shows in production
console.log('[MyPlugin] Processing...');

// ✅ NEW - Only shows when debug enabled
import { debug } from '../utils/debug';
debug('[MyPlugin] Processing...');
```

---

## REST API Changes

### REST Controller Pattern Update

**If your plugin extends REST controllers,** you should now use the `RESTHelpersTrait` pattern instead of extending `WP_REST_Controller`.

#### Before (Deprecated Pattern):

```php
use WP_REST_Controller;

class MyController extends WP_REST_Controller {
    protected $namespace = 'my-plugin/v1';
    protected $rest_base = 'my-endpoint';

    public function checkPermissions($request): bool {
        return current_user_can('manage_options');
    }
}
```

#### After (Current Pattern):

```php
namespace MyPlugin\REST;

class MyController {
    use \Aether\SiteExporter\REST\RESTHelpersTrait;

    public function registerRoutes(): void {
        \register_rest_route(
            $this->getNamespace(),
            '/my-endpoint',
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'getEndpoint'],
                'permission_callback' => [$this, 'permissionCheck'],
            ]
        );
    }
}
```

**Benefits:**
- Consistent with core Aether patterns
- Access to rate limiting: `$this->checkRateLimit()`
- Access to validation: `$this->validateArrayComplexity()`
- Access to sanitization: `$this->sanitizeExceptionMessage()`
- Access to namespace: `$this->getNamespace()`
- Access to permissions: `$this->permissionCheck()`

---

## Provider Implementation Updates

### No Breaking Changes to Provider API

Providers are now registered entirely in JavaScript. You can leverage these features:

### 1. Provider Dependencies

If your provider depends on another provider being enabled, declare dependencies:

```javascript
class MyProvider extends AbstractProvider {
    getDependencies() {
        return ['local-filesystem']; // This provider requires local-filesystem
    }
}
```

**Benefit:** Aether will validate that dependencies are configured before allowing exports.

### 2. Deployment Type-Specific Fields

If your provider has fields that only apply to certain deployment types:

```javascript
getProviderSpecificConfigFields() {
    return [
        {
            id: 'api_key',
            type: 'text',
            label: 'API Key',
            required: true,
            deploymentType: 'static_site', // Only show for static_site
        },
        {
            id: 'bundle_path',
            type: 'text',
            label: 'Bundle Path',
            required: true,
            deploymentType: 'blueprint_bundle', // Only show for blueprint_bundle
        },
    ];
}
```

**Benefit:** Fields automatically show/hide based on active deployment types.

---

## JavaScript/React Changes

### Performance: Use React.memo for Provider Components

If you create custom provider UI components, wrap them with `memo` to prevent unnecessary re-renders:

```javascript
import { memo } from '@wordpress/element';

function MyProviderCard({ provider, config, onUpdate }) {
  // Component logic...
}

// Wrap with memo and custom comparison
export default memo(MyProviderCard, (prevProps, nextProps) => {
  return (
    prevProps.provider.id === nextProps.provider.id &&
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config)
  );
});
```

### Performance: Use useCallback for Event Handlers

Wrap event handlers with `useCallback` to ensure stable function references:

```javascript
import { useCallback } from '@wordpress/element';

function MyComponent() {
  const handleSave = useCallback(async (providerId, config) => {
    // Save logic...
  }, []); // Only recreate if dependencies change

  return <button onClick={() => handleSave('my-provider', {})}>Save</button>;
}
```

---

## Migration Examples

### Example 1: Migrating from Manual Settings Fetch to useProviderSettings Hook

#### Before:

```javascript
function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState({});

  const loadProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch({
        path: '/aether/site-exporter/settings?key=providers',
      });
      if (response.success) {
        setProviders(response.value || {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProvider = async (providerId, config) => {
    setLoading(true);
    try {
      const currentProviders = await fetchProviders();
      const updated = {
        ...currentProviders,
        [providerId]: config,
      };
      const response = await apiFetch({
        path: '/aether/site-exporter/settings',
        method: 'POST',
        data: {
          key: 'providers',
          value: updated,
        },
      });
      if (response.success) {
        setProviders(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

#### After:

```javascript
import { useProviderSettings } from '../hooks/useProviderSettings';

function MyComponent() {
  const { loading, error, fetchProviderSettings, updateProviderConfig } = useProviderSettings();
  const [providers, setProviders] = useState({});

  const loadProviders = async () => {
    const data = await fetchProviderSettings();
    setProviders(data);
  };

  const updateProvider = async (providerId, config) => {
    const updated = await updateProviderConfig(providerId, config);
    setProviders(updated);
  };

  // ... rest of component
}
```

**Reduction:** ~40 lines → ~10 lines

---

### Example 2: Migrating console.log to Debug Utilities

#### Before:

```javascript
function myFunction() {
  console.log('[MyPlugin] Starting process...');

  try {
    // Process logic
    console.log('[MyPlugin] Process complete');
  } catch (error) {
    console.error('[MyPlugin] Error:', error);
  }
}
```

#### After:

```javascript
import { debug, debugError } from '../utils/debug';

function myFunction() {
  debug('[MyPlugin] Starting process...');

  try {
    // Process logic
    debug('[MyPlugin] Process complete');
  } catch (error) {
    debugError('[MyPlugin] Error:', error);
  }
}
```

**Benefits:**
- No console noise in production
- Debug messages only appear when `window.aetherDebug = true`
- Consistent logging pattern

---

### Example 3: Migrating REST Controller to RESTHelpersTrait

#### Before:

```php
namespace MyPlugin\REST;

use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;

class MyProviderController extends WP_REST_Controller {
    protected $namespace = 'my-plugin/v1';
    protected $rest_base = 'providers';

    public function register_routes() {
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base,
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'get_items'],
                'permission_callback' => [$this, 'check_permissions'],
            ]
        );
    }

    public function check_permissions($request): bool {
        return current_user_can('manage_options');
    }

    public function get_items($request) {
        // Implementation
    }
}
```

#### After:

```php
namespace MyPlugin\REST;

use Aether\SiteExporter\REST\RESTHelpersTrait;
use WP_REST_Request;
use WP_REST_Response;

class MyProviderController {
    use RESTHelpersTrait;

    public function registerRoutes(): void {
        \register_rest_route(
            $this->getNamespace(),
            '/providers',
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'getItems'],
                'permission_callback' => [$this, 'permissionCheck'],
            ]
        );
    }

    public function getItems($request) {
        // Can now use trait helpers:
        // - $this->checkRateLimit()
        // - $this->validateArrayComplexity()
        // - $this->sanitizeExceptionMessage()

        // Implementation
    }
}
```

**Benefits:**
- No need to define namespace property
- No need to define custom permission check
- Access to security helpers (rate limiting, validation, sanitization)
- Consistent with core Aether patterns

---

## Testing Your Migration

### 1. Check for Removed Constants

Search your codebase for:
```bash
grep -r "PROVIDER_INTERNAL_KEYS" your-plugin/
grep -r "PROVIDER_CONFIG_KEYS" your-plugin/
```

If found, replace with your own constants or remove if unused.

### 2. Check for Removed Functions

Search your codebase for:
```bash
grep -r "filterWorkflowByExportTypes" your-plugin/
```

If found, implement your own filtering logic.

### 3. Update REST Controllers

Search your codebase for:
```bash
grep -r "extends WP_REST_Controller" your-plugin/
```

If found, migrate to `RESTHelpersTrait` pattern.

### 4. Replace console.log with Debug Utilities

Search your codebase for:
```bash
grep -r "console\.log" your-plugin/assets/
```

Replace with `debug()` from `../utils/debug`.

---

## Compatibility Checklist

Use this checklist to ensure your plugin is compatible:

- [ ] No usage of removed constants (`PROVIDER_INTERNAL_KEYS`, `PROVIDER_CONFIG_KEYS`)
- [ ] No usage of removed functions (`filterWorkflowByExportTypes`)
- [ ] REST controllers use `RESTHelpersTrait` instead of extending `WP_REST_Controller`
- [ ] Provider settings managed via `useProviderSettings()` hook (if applicable)
- [ ] `console.log` replaced with debug utilities (if applicable)
- [ ] Components wrapped with `React.memo` for performance (if applicable)
- [ ] Event handlers wrapped with `useCallback` (if applicable)
- [ ] Provider dependencies declared (if applicable)
- [ ] Deployment type-specific fields configured (if applicable)

---

## Getting Help

### Documentation

- **Refactoring Summary:** `.refactoring-summary.md` - Complete technical breakdown
- **Provider Examples:** `assets/src/providers/local-filesystem/LocalFilesystemProvider.js`
- **Hook Examples:** `assets/src/hooks/useProviderSettings.js`
- **REST Examples:** `includes/REST/ProvidersController.php`

### Support

If you encounter migration issues:

1. Check this migration guide
2. Review the refactoring summary (`.refactoring-summary.md`)
3. Examine core provider implementations for patterns
4. Open an issue on GitHub with:
   - Your plugin name and version
   - Code snippet causing the issue
   - Error messages (if any)
   - What you've already tried

---

## Version History

### Version 1.0.0 (2025-11-19)

**Initial migration guide covering:**
- Removal of backwards-compatibility code
- New hooks and utilities
- REST API pattern updates
- Performance optimizations
- Debug utility usage

**Breaking changes:**
- Removed `PROVIDER_INTERNAL_KEYS` constant
- Removed `PROVIDER_CONFIG_KEYS` constant
- Removed `filterWorkflowByExportTypes()` function
- Removed `scripts/create-provider.js`

**New features:**
- `useProviderSettings()` hook
- Utility functions in `helpers.js`
- Global error handler
- Debug utilities

---

**Last Updated:** 2025-11-19
**Aether Version:** 1.0.0+
