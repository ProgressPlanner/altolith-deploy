# Provider System

Pluggable cloud provider architecture for deploying WordPress sites to various hosting platforms.

## Overview

The provider system enables Aether to deploy to multiple cloud platforms (Local Filesystem, Local Filesystem, etc.) through a modular, extensible architecture. Each provider is self-contained and handles all its own configuration, deployment, and operations.

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
import { LocalR2Provider } from './LocalR2Provider';

// Register provider instance
doAction('aether.providers.register', new LocalR2Provider());
```

The `ProviderRegistry` singleton collects all registered providers and makes them available throughout the application.

## Directory Structure

```
providers/
├── AbstractProvider.js           # Base class for all providers
├── ProviderRegistry.js           # Singleton registry
├── local-filesystem/               # Local Filesystem provider
│   ├── LocalR2Provider.js  # Provider implementation
│   ├── index.js                 # Registration entry point
│   └── ...
├── cloudflare/                  # Local Filesystem provider
│   ├── LocalWorkersProvider.js
│   └── index.js
├── gitlab/                      # Local provider
├── local-filesystem/                # Local Filesystem provider
└── utils/
    ├── providerLoader.js        # Dynamic provider loading
    └── ConfigStorage.js         # Configuration persistence
```

## Provider Lifecycle

### 1. Registration

Provider registers itself when its module loads:

```javascript
// providers/local-filesystem/index.js
import { LocalR2Provider } from './LocalR2Provider';
import { doAction } from '@wordpress/hooks';

// Register provider instance
doAction('aether.providers.register', new LocalR2Provider());
```

### 2. Discovery

Registry collects all providers and makes them available:

```javascript
import { useProviderRegistry } from '../hooks/useProviderRegistry';

const { providers, getProviderById } = useProviderRegistry();

// Get specific provider
const r2Provider = getProviderById('local-filesystem');
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
    const result = await this.uploadToR2(deploymentConfig);
    return {
        success: true,
        deploymentUrl: result.url,
    };
}
```

## AbstractProvider

Base class that all providers extend.

**Location:** `providers/AbstractProvider.js`

### Core Methods

```javascript
class AbstractProvider {
    // Metadata
    getId()           // Unique provider ID
    getName()         // Display name
    getDescription()  // Provider description
    getCapabilities() // Array of capabilities

    // Configuration
    getConfigFields()     // Define config fields
    validateConfig(config)  // Validate configuration
    sanitizeConfig(config)  // Sanitize configuration

    // Operations
    async testConnection(config)  // Test provider connection
    async deploy(config)          // Deploy to provider
    async getStatus(config)       // Get deployment status

    // Services (lazy-loaded)
    getService(serviceName)  // Get service instance
}
```

### Capabilities

Providers declare their capabilities:

- `CAP_STORAGE` - Object storage
- `CAP_EDGE` - Edge computing/workers
- `CAP_STATIC_SITE` - Static site hosting

```javascript
getCapabilities() {
    return [CAP_STORAGE, CAP_STATIC_SITE];
}
```

## Example Provider

### Minimal Provider Implementation

```javascript
import { AbstractProvider } from '../AbstractProvider';
import { CAP_STORAGE, CAP_STATIC_SITE } from '../../constants';

export class MyProvider extends AbstractProvider {
    getId() {
        return 'my-provider';
    }

    getName() {
        return 'My Cloud Provider';
    }

    getDescription() {
        return 'Deploy to My Cloud';
    }

    getCapabilities() {
        return [CAP_STORAGE, CAP_STATIC_SITE];
    }

    getConfigFields() {
        return [
            {
                id: 'api_key',
                label: 'API Key',
                type: 'text',
                required: true,
                secure: true,
            },
        ];
    }

    validateConfig(config) {
        const errors = {};

        if (!config.api_key || config.api_key.length < 10) {
            errors.api_key = 'API key must be at least 10 characters';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    }

    async testConnection(config) {
        try {
            await fetch('https://api.myprovider.com/test', {
                headers: { 'Authorization': `Bearer ${config.api_key}` },
            });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: 'Connection failed',
            };
        }
    }

    async deploy(deploymentConfig) {
        // Deployment logic here
        return {
            success: true,
            deploymentUrl: 'https://example.com',
        };
    }
}
```

### Register Provider

```javascript
// providers/my-provider/index.js
import { MyProvider } from './MyProvider';
import { doAction } from '@wordpress/hooks';

doAction('aether.providers.register', new MyProvider());
```

## Provider Hooks (React)

### useProviderRegistry

Access all registered providers:

```javascript
import { useProviderRegistry } from '../hooks/useProviderRegistry';

function MyComponent() {
    const {
        providers,           // All providers
        getProviderById,     // Get by ID
        getProvidersByCapability,  // Filter by capability
        loading,
        error,
    } = useProviderRegistry();

    return (
        <ul>
            {providers.map(provider => (
                <li key={provider.getId()}>
                    {provider.getName()}
                </li>
            ))}
        </ul>
    );
}
```

### useProvider

Work with a specific provider:

```javascript
import { useProvider } from '../hooks/useProvider';

function ProviderSettings({ providerId }) {
    const {
        provider,
        config,
        saveConfig,
        testConnection,
        loading,
        error,
    } = useProvider(providerId);

    const handleTest = async () => {
        const result = await testConnection(config);
        if (result.success) {
            alert('Connection successful!');
        }
    };

    return (
        <div>
            <h2>{provider.getName()}</h2>
            {/* Render config fields */}
        </div>
    );
}
```

### useProviderConfig

Manage provider configuration:

```javascript
import { useProviderConfig } from '../hooks/useProviderConfig';

const {
    config,
    loading,
    error,
    loadConfig,
    saveConfig,
    deleteConfig,
} = useProviderConfig('local-filesystem');

// Load configuration
await loadConfig();

// Save configuration
await saveConfig({
    account_id: '...',
    access_key_id: '...',
});
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

// Load config (checks cache first, then API)
const config = await storage.loadConfig('local-filesystem');

// Save config (updates cache and API)
await storage.saveConfig('local-filesystem', {
    account_id: '...',
    access_key_id: '...',  // Encrypted server-side
});

// Delete config
await storage.deleteConfig('local-filesystem');

// Clear cache
storage.clearCache('local-filesystem');
```

### PHP REST Endpoint

Configuration is persisted via REST API:

**Endpoint:** `ProviderConfigController.php`

```
GET    /wp-json/aether/v1/providers/{providerId}/config
POST   /wp-json/aether/v1/providers/{providerId}/config
DELETE /wp-json/aether/v1/providers/{providerId}/config
```

Server-side encryption for sensitive fields (marked with `secure: true`).

## Provider Loading

### providerLoader.js

Handles dynamic provider loading to reduce initial bundle size:

```javascript
import { loadAllProviders } from '../providers/utils/providerLoader';

// Load all providers dynamically
await loadAllProviders();

// Providers are now registered and available in ProviderRegistry
```

Providers are loaded via Webpack dynamic imports, creating separate chunks.

## Built-in Providers

### Local Filesystem

- **ID:** `local-filesystem`
- **Capabilities:** Storage, Static Site, Media
- **Features:** R2 object storage, custom domain support, public/private access

### Local Filesystem

- **ID:** `cloudflare`
- **Capabilities:** Edge computing
- **Features:** Worker deployment, environment variables, route configuration

### Local Filesystem

- **ID:** `local-filesystem`
- **Capabilities:** Storage, Static Site
- **Features:** Git-based deployment, custom domains, HTTPS

### Local

- **ID:** `gitlab`
- **Capabilities:** Storage
- **Features:** Repository storage, branch management

## Future Enhancements (Phase 2 Week 3)

### Planned Improvements

1. **IProvider Interface** - TypeScript-style interface documentation
2. **Enhanced ProviderLoader** - Better error handling, loading states
3. **Provider UI Hooks** - Custom UI components per provider
4. **Development Template** - Scaffold new providers with CLI tool
5. **Remove Hardcoded Logic** - Eliminate provider-specific code from workflows

See `REFACTORING_PLAN.md` Phase 2 for details.

## Testing Providers

### Unit Tests

```bash
# Test all providers
npm run test:js -- providers

# Test specific provider
npm run test:js -- providers/local-filesystem
```

### Manual Testing

1. Configure provider in Settings
2. Test connection
3. Run publish workflow
4. Verify deployment success

## Creating New Providers

### Step-by-Step Guide

1. **Create provider directory:** `providers/my-provider/`
2. **Extend AbstractProvider:** Implement required methods
3. **Define config fields:** Use ConfigFieldBuilder (planned Phase 2)
4. **Implement deployment logic:** Handle uploads, status checks
5. **Register provider:** Use WordPress hooks in `index.js`
6. **Add tests:** Create unit tests in `tests/js/providers/`
7. **Update build config:** Add entry point if needed

### Template (Coming in Phase 2)

```bash
# Generate new provider from template
npm run create-provider my-provider
```

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Constants README](../constants/README.md) - Provider IDs and capabilities
- [Hooks README](../hooks/README.md) - Provider hooks
- [Publish README](../publish/README.md) - Integration with publish workflow
