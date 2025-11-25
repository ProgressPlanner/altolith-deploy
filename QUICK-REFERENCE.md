# Multi-Provider Isolation - Quick Reference

**Last Updated:** 2025-11-19

---

## For Users

### How to Deploy to Multiple Providers

1. **Configure Providers**
   - Go to Aether Settings → Providers
   - Create and configure multiple provider instances (e.g., Cloudflare R2 + Local Filesystem)
   - Configure each provider separately

2. **Configure Deployment URLs**
   - **Cloudflare R2:** Set `worker_endpoint` or `custom_domain`
   - **Local Filesystem:** Set `public_url`
   - Each provider will use its configured URL for rewriting

3. **Export**
   - Click "Export Site"
   - Both providers will deploy simultaneously
   - Check logs to verify both succeeded

4. **Verify Results**
   - Check storage directories:
     - `cloudflare-r2/static/...` (with R2 URLs)
     - `local-filesystem-static-site/static/...` (with local URLs)
   - Each has its own `file-manifest.json`

---

## For Developers

### Quick Start

```javascript
// Create StorageService with provider isolation
const config = {
    public_url: 'https://static.example.com',
    base_url: 'https://static.example.com',
    provider_id: 'my-provider',  // Enable isolation
};

const storageService = new StorageService('static/', '', config);

// All operations are automatically prefixed
await storageService.upload('index.html', htmlBlob);
// → Uploads to: my-provider/static/index.html

// Manifest is also prefixed
await storageService.downloadManifest();
// → Downloads from: my-provider/file-manifest.json
```

### Provider Configuration

**Required Fields for Static Site:**
```javascript
{
    id: 'my-provider',
    deployment_types: ['static_site'],

    // ONE OF:
    public_url: 'https://example.com',       // Generic
    worker_endpoint: 'https://x.workers.dev', // Cloudflare
    pages_url: 'https://x.pages.dev',        // Cloudflare Pages
    custom_domain: 'https://custom.com',     // Custom
}
```

### Adding Provider-Specific Logic

**Filter: Modify Raw HTML (Pre-scan Phase)**
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.static.html.raw', 'my-plugin', (html, url, siteUrl) => {
    // Runs once per page (before URL rewriting)
    return html.replace('</head>', '<meta name="custom" content="value" /></head>');
});
```

**Filter: Modify HTML Per Provider (Upload Phase)**
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.export.step.uploadStaticSiteFiles.html.process', 'my-plugin',
    (html, url, siteUrl, staticSiteUrl, providerId) => {
        // Runs once per provider per page
        if (providerId === 'my-provider') {
            return html + '<!-- Deployed via My Provider -->';
        }
        return html;
    }
);
```

**Filter: Override Deployment URL**
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.provider.deployment_url', 'my-plugin',
    (deploymentUrl, providerConfig, providerId) => {
        if (providerId === 'my-provider') {
            return providerConfig.custom_domain || deploymentUrl;
        }
        return deploymentUrl;
    }
);
```

### Creating a Custom Provider

**Step 1: Create Provider Class (JavaScript)**
```javascript
import { __ } from '@wordpress/i18n';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';

export class MyCustomProvider {
    static ID = 'my-custom-provider';
    static NAME = __( 'My Custom Provider', 'aether-site-exporter' );
    static TYPE = 'storage';
    static DESCRIPTION = __( 'Provider description', 'aether-site-exporter' );
    static ICON = '📦';
    static DEPLOYMENT_TYPE = DEPLOYMENT_TYPES.STATIC_SITE;
    static CONFIG_FIELDS = [
        {
            id: 'api_key',
            label: __( 'API Key', 'aether-site-exporter' ),
            type: 'text',
            required: true,
            secure: true,
        },
        {
            id: 'deployment_url',
            label: __( 'Deployment URL', 'aether-site-exporter' ),
            type: 'text',
            required: true,
            help: __( 'Public URL where files will be accessible', 'aether-site-exporter' ),
        },
    ];
}
```

**Step 2: Register Provider in JavaScript**
```javascript
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';
import { doAction } from '@wordpress/hooks';

// Create provider instance
const provider = new MyCustomProvider();

// Register in JavaScript registry (use static ID)
ProviderRegistry.register(MyCustomProvider.ID, provider);

// Also trigger hook for auto-discovery
doAction('aether.providers.register', provider);
```

**Step 3: JavaScript Upload Handler (Optional)**
```javascript
import { addFilter } from '@wordpress/hooks';

// Custom upload handler for blueprint bundles
addFilter('aether.provider.upload', 'my-provider',
    (handler, providerId, options) => {
        if (providerId === 'my-custom-provider') {
            return async (sourcePath, fileName, context) => {
                // Your upload logic here
                const response = await fetch('/my-api/upload', {
                    method: 'POST',
                    body: formData,
                });
                return {
                    success: response.ok,
                    url: response.data.url,
                };
            };
        }
        return handler;
    }
);
```

---

## Storage Paths Reference

### Storage Structure with Provider Isolation
```
static/
├── provider-a/
│   ├── static/
│   │   ├── index.html (URLs → provider A)
│   │   └── about/index.html
│   └── file-manifest.json
│
└── provider-b/
    ├── static/
    │   ├── index.html (URLs → provider B)
    │   └── about/index.html
    └── file-manifest.json
```

---

## Troubleshooting

### Issue: Providers Getting Same URLs

**Symptom:** Both providers have HTML with the same deployment URL

**Cause:** Provider deployment URL not configured

**Fix:**
1. Check provider config has `public_url`, `worker_endpoint`, or `pages_url`
2. Verify filter `aether.provider.deployment_url` returns correct URL
3. Check browser console for deployment URL being used

### Issue: Files Overwriting Each Other

**Symptom:** One provider's files overwrite another's

**Cause:** `provider_id` not passed to StorageService

**Fix:**
1. Check `config.provider_id` is set when creating StorageService
2. Verify filter `aether.storage.service.config` includes `provider_id`
3. Check storage paths include provider prefix

### Issue: Manifest Conflicts

**Symptom:** Manifest shows wrong files or hash mismatches

**Cause:** Shared manifest between providers

**Fix:**
1. Verify each provider has its own manifest: `{providerId}/file-manifest.json`
2. Check `providerId` parameter passed to `fetchManifest()` and `uploadManifest()`
3. Clear manifest cache: `getManifestCache().clearAll()`

---

## Testing Checklist

### Single Provider Test
- [ ] Configure one provider instance (e.g., local-filesystem-static-site)
- [ ] Configure deployment URL
- [ ] Export site
- [ ] Verify files at: `{providerId}/static/...`
- [ ] Verify manifest at: `{providerId}/file-manifest.json`
- [ ] Check HTML has correct URLs

### Multi-Provider Test
- [ ] Configure two provider instances
- [ ] Configure different deployment URLs
- [ ] Export site
- [ ] Verify both provider directories exist
- [ ] Verify each has separate manifest
- [ ] Check HTML differs between providers (different URLs)
- [ ] Verify both uploads completed successfully

### Hash Deduplication Test
- [ ] Export site with multiple providers
- [ ] Make no changes
- [ ] Export again
- [ ] Verify files skipped (hash match)
- [ ] Check both manifests updated
- [ ] Confirm fast publish (no re-upload)

---

## Performance Tips

### Optimize HTML Processing
```javascript
// Cache expensive operations outside the filter
const compiledTemplate = compileTemplate();

addFilter('aether.export.step.uploadStaticSiteFiles.html.process', 'my-plugin', (html) => {
    // Fast operation using pre-compiled template
    return compiledTemplate.apply(html);
});
```

### Batch Operations
```javascript
// Use batch operations when available
await storageService.batchDelete(['file1.html', 'file2.html']);
// Better than: await delete('file1'); await delete('file2');
```

### Manifest Caching
```javascript
// Manifest is cached in IndexedDB (1-hour TTL)
// No need to manually cache
const manifest = await fetchManifest(storageService, providerId);
```

---

## API Reference

### StorageService

```javascript
class StorageService {
    constructor(staticPath, config = {})

    // Automatically prefixes all keys with provider_id
    async upload(key, file, metadata = {})
    async delete(key)
    async copy(sourceKey, destKey)
    async listObjects(prefix = '', limit = 1000)
    async downloadManifest()
    async uploadManifest(blob)

    getUrl(key)  // Returns public URL for key
}
```

### Manifest Manager

```javascript
// Fetch manifest (cached in IndexedDB)
const manifest = await fetchManifest(storageService, providerId);

// Update manifest entry
manifest = updateManifestEntry(
    manifest,
    'static/index.html',
    12345,        // size
    'sha256-...'  // hash
);

// Check if should skip upload
const skip = shouldSkipUpload(manifest, 'static/index.html', 12345, 'sha256-...');

// Upload manifest
await uploadManifest(storageService, manifest, providerId);
```

---

## Filter Reference

| Filter | Phase | Runs | Purpose |
|--------|-------|------|---------|
| `aether.static.html.raw` | Pre-scan | Once per page | Modify raw HTML before caching |
| `aether.export.step.uploadStaticSiteFiles.html.process` | Upload | Per provider per page | Modify HTML before URL rewriting |
| `aether.provider.deployment_url` | Upload init | Once per provider | Override deployment URL |
| `aether.storage.service.config` | Storage init | Once per provider | Customize storage config |
| `aether.storage.service.create` | Storage init | Once per provider | Override StorageService |
| `aether.export.step.uploadStaticSiteFiles.manifest.fetch` | Upload | Once per provider | Provide custom manifest |
| `aether.export.step.uploadStaticSiteFiles.manifest.update` | Upload | Per file | Modify manifest after update |
| `aether.export.step.uploadStaticSiteFiles.manifest.cleanup` | Upload end | Once per provider | Customize manifest cleanup |
| `aether.provider.upload` | Blueprint | Once per provider | Custom blueprint upload |

---

## Resources

- **Full Documentation:** See `PROVIDER-ISOLATION.md`
- **Implementation Details:** See `IMPLEMENTATION-SUMMARY.md`
- **Architecture Diagrams:** See `ARCHITECTURE-DIAGRAM.md`

---

**Need Help?**
- Check browser console for debug logs (enable: `window.aetherDebug = true`)
- Review provider configuration in Aether Settings
- Verify REST API endpoints return correct provider metadata
- Check PHP error logs for server-side issues

---

**Generated:** 2025-11-19
**Version:** 1.0.0
**Status:** Production Ready ✅
