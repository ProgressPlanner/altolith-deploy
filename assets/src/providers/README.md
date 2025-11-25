# Provider System

Pluggable cloud provider architecture for deploying WordPress sites to various hosting platforms.

## Overview

The provider system enables Aether Site Exporter to export to local filesystem through a modular, extensible architecture. Each provider is self-contained and handles all its own configuration, deployment, and operations.

## Architecture

### Self-Contained Providers

Each provider is a **complete module** that handles:

- Configuration field definitions
- Settings validation and sanitization
- Connection testing
- Deployment operations
- Status checks
- Error handling

**External classes delegate to providers** rather than implementing provider-specific logic.

### Provider Registration

Providers register themselves via WordPress hooks:

```javascript
// In provider index.js
import { doAction } from '@wordpress/hooks';
import ProviderRegistry from '../registry/ProviderRegistry';
import { LocalFilesystemStaticSiteProvider } from './LocalFilesystemStaticSiteProvider';

// Register provider class in JavaScript registry
ProviderRegistry.register(LocalFilesystemStaticSiteProvider.ID, LocalFilesystemStaticSiteProvider);

// Also trigger the hook for any listeners
doAction('aether.providers.register', LocalFilesystemStaticSiteProvider);
```

The `ProviderRegistry` singleton collects all registered providers and makes them available throughout the application.

## Directory Structure

```
providers/
├── registry/
│   └── ProviderRegistry.js        # Singleton registry
├── local-filesystem-static-site/  # Local Filesystem static site provider
│   ├── LocalFilesystemStaticSiteProvider.js
│   └── index.js                   # Registration entry point
├── local-filesystem-blueprint-bundle/ # Local Filesystem blueprint bundle provider
│   ├── LocalFilesystemBlueprintBundleProvider.js
│   └── index.js                   # Registration entry point
└── utils/
    ├── configStorage.js           # Configuration persistence
    ├── configFieldBuilder.js      # Configuration field builder
    ├── configValidation.js         # Configuration validation
    └── configSanitization.js      # Configuration sanitization
```

## Provider Lifecycle

### 1. Registration

Provider registers itself when its module loads:

```javascript
// providers/local-filesystem-static-site/index.js
import { doAction } from '@wordpress/hooks';
import ProviderRegistry from '../registry/ProviderRegistry';
import { LocalFilesystemStaticSiteProvider } from './LocalFilesystemStaticSiteProvider';

// Register provider class in JavaScript registry
ProviderRegistry.register(LocalFilesystemStaticSiteProvider.ID, LocalFilesystemStaticSiteProvider);

// Also trigger the hook for any listeners
doAction('aether.providers.register', LocalFilesystemStaticSiteProvider);
```

### 2. Discovery

Registry collects all providers and makes them available:

```javascript
import { useProviderRegistry } from '@aether/providers/hooks/useProviderRegistry';

const { providerIds, isLoading } = useProviderRegistry();

// Or use useProviderMetadata for full provider objects
import { useProviderMetadata } from '@aether/providers/hooks/useProviderRegistry';

const { providers, isLoading } = useProviderMetadata();
const localProvider = providers.find(p => p.id === 'local-filesystem');
```

### 3. Configuration

Provider defines its configuration fields:

```javascript
getConfigFields() {
    return [
        {
            id: 'account_id',
            label: 'Account ID',
            type: 'text',
            required: true,
            secure: false,
        },
        {
            id: 'access_key_id',
            label: 'Access Key ID',
            type: 'text',
            required: true,
            secure: true,  // Server-side encryption
        },
        // ... more fields
    ];
}
```

### 4. Deployment

Provider handles deployment for its platform:

```javascript
async deploy(deploymentConfig) {
    // Provider-specific deployment logic
    const result = await this.uploadToLocalFilesystem(deploymentConfig);
    return {
        success: true,
        deploymentUrl: result.url,
    };
}
```

## Provider Structure

Providers are classes with static constants for metadata and static methods for operations.

### Static Constants

All providers define static constants for metadata:

```javascript
export class MyProvider {
    static ID = 'my-provider';
    static NAME = __( 'My Provider', 'aether-site-exporter' );
    static TYPE = 'storage';
    static DESCRIPTION = __( 'Provider description', 'aether-site-exporter' );
    static ICON = '📦';
    static DEPLOYMENT_TYPE = DEPLOYMENT_TYPES.STATIC_SITE;
    static CONFIG_FIELDS = [
        { id: 'api_key', label: 'API Key', type: 'text', required: true }
    ];
}
```

### Static Methods

Providers are pure static classes with no instance methods. All operations are handled via WordPress hooks and REST API endpoints.

## Example Provider

### Minimal Provider Implementation

```javascript
import { __ } from '@wordpress/i18n';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';
import { ConfigStorage } from '../utils/configStorage';
import { validateAllFields, hasRequiredFields } from '../utils/configValidation';
import { sanitizeAllFields } from '../utils/configSanitization';

export class MyProvider {
    static ID = 'my-provider';
    static NAME = __( 'My Provider', 'aether-site-exporter' );
    static TYPE = 'storage';
    static DESCRIPTION = __( 'Provider description', 'aether-site-exporter' );
    static ICON = '📦';
    static DEPLOYMENT_TYPE = DEPLOYMENT_TYPES.STATIC_SITE;
    static CONFIG_FIELDS = [
        { id: 'api_key', label: 'API Key', type: 'text', required: true }
    ];


}
```

### Register Provider

```javascript
// providers/my-provider/index.js
import ProviderRegistry from '../registry/ProviderRegistry';
import { doAction } from '@wordpress/hooks';
import { MyProvider } from './MyProvider';

// Register provider class in JavaScript registry
ProviderRegistry.register(MyProvider.ID, MyProvider);

// Also trigger the hook for any listeners
doAction('aether.providers.register', MyProvider);
```

## Provider Hooks (React)

### Accessing Providers

Providers are accessed via the ProviderRegistry:

```javascript
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';

// Get all providers
const allProviders = ProviderRegistry.getAll();

// Get provider by ID
const provider = ProviderRegistry.get('local-filesystem-static-site');

// Get providers by deployment type
const staticSiteProviders = ProviderRegistry.getByDeploymentType('static_site');
const blueprintProviders = ProviderRegistry.getByDeploymentType('blueprint_bundle');

// Check if provider is registered
if (ProviderRegistry.has('my-provider')) {
    // Provider is available
}
```

```

## Configuration Storage

### ConfigStorage

Manages provider configuration with caching and REST API persistence:

**Features:**
- **localStorage caching** (5 min TTL)
- **REST API persistence** via PHP
- **Server-side encryption** for sensitive fields (API keys, tokens, secrets)
- **Automatic cache invalidation**

**Location:** `providers/utils/ConfigStorage.js`

```javascript
import { ConfigStorage } from '../providers/utils/ConfigStorage';

const storage = new ConfigStorage();

// Load config for a provider instance (instanceId format: providerId:uuid)
const config = await storage.loadConfig('local-filesystem-static-site:abc-123');

// Save config (updates cache and API)
await storage.saveConfig('local-filesystem-static-site:abc-123', {
    public_url: 'https://example.com',
    static_files_path: 'static/',
});

// Delete config
await storage.deleteConfig('local-filesystem-static-site:abc-123');

// Clear cache
storage.clearCache('local-filesystem-static-site:abc-123');
```

### PHP REST Endpoint

Configuration is persisted via REST API:

**Endpoint:** `ProviderConfigController.php`

```
GET    /wp-json/aether/site-exporter/providers/{providerId}/config
POST   /wp-json/aether/site-exporter/providers/{providerId}/config
DELETE /wp-json/aether/site-exporter/providers/{providerId}/config
```

Server-side encryption for sensitive fields (marked with `secure: true`).

## Provider Loading

Providers are loaded via Webpack entry points. Each provider has its own entry point:

- `provider-local-filesystem-static-site.js`
- `provider-local-filesystem-blueprint-bundle.js`

Providers register themselves when their bundle loads.

## Built-in Providers

### Local Filesystem Static Site

- **ID:** `local-filesystem-static-site`
- **Deployment Type:** `static_site`
- **Features:** Local file storage for static HTML exports

### Local Filesystem Blueprint Bundle

- **ID:** `local-filesystem-blueprint-bundle`
- **Deployment Type:** `blueprint_bundle`
- **Features:** Local file storage for WordPress Playground blueprint bundles


## Testing Providers

### Unit Tests

```bash
# Test all providers
npm run test:js -- providers

# Test specific provider
npm run test:js -- providers/local-filesystem-static-site
```

### Manual Testing

1. Configure provider instance in Settings
2. Test connection
3. Run export workflow
4. Verify deployment success

## Creating New Providers

### Step-by-Step Guide

1. **Create provider directory:** `providers/my-provider/`
2. **Define static constants:** ID, NAME, TYPE, DESCRIPTION, ICON, DEPLOYMENT_TYPE, CONFIG_FIELDS
4. **Implement deployment logic:** Handle uploads, status checks
5. **Register provider:** Use WordPress hooks in `index.js`
6. **Add tests:** Create unit tests in `tests/js/providers/`
7. **Update build config:** Add entry point if needed

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Constants README](../constants/README.md) - Provider IDs and capabilities
- [Hooks README](../hooks/README.md) - Provider hooks
- [Export README](../export/README.md) - Integration with export workflow
