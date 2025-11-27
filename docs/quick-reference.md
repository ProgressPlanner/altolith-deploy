# Multi-Provider Isolation - Quick Reference

Quick reference guide for deploying to multiple storage providers simultaneously.

---

## For Users

### How to Deploy to Multiple Providers

1. **Configure Providers**
   - Go to Aether Settings → Providers
   - Create and configure multiple provider instances (e.g., Local Filesystem for static site + Local Filesystem for blueprint)
   - Configure each provider separately

2. **Configure Deployment URLs**
   - Set `public_url` for each provider
   - Each provider will use its configured URL for URL rewriting

3. **Export**
   - Click "Export Site"
   - Providers will deploy based on their type (static_site or blueprint_bundle)
   - Check logs to verify success

4. **Verify Results**
   - Check storage directories in `wp-content/uploads/aether/`
   - Each provider has its own directory with files
   - Each has its own `file-manifest.json`

---

## For Developers

### Quick Start

```javascript
import { createStorageService } from '@aether/export/utils/staticSiteConfig';

// Create StorageService with provider isolation
const config = {
    public_url: 'https://static.example.com',
    provider_id: 'my-provider',  // Enable isolation
};

const storageService = await createStorageService(
    'static/',
    config,
    'my-provider',
    providerConfig
);

// All operations are automatically prefixed
await storageService.upload('index.html', htmlBlob);
// → Uploads to: static/index.html (with provider context)

// Manifest is provider-specific
await storageService.downloadManifest();
```

### Provider Configuration

**Required Fields for Static Site:**
```javascript
{
    id: 'my-provider',
    deploymentType: 'static_site',
    public_url: 'https://example.com',
}
```

### Adding Provider-Specific Logic

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

**Filter: Customize Storage Config**
```javascript
import { addFilter } from '@wordpress/hooks';

addFilter('aether.storage.service.config', 'my-plugin',
    (config, staticPath, providerId, providerConfig) => {
        if (providerId === 'my-provider') {
            return {
                ...config,
                customOption: 'value',
            };
        }
        return config;
    }
);
```

### Creating a Custom Provider

**Step 1: Create Provider Class (JavaScript)**
```javascript
import { __ } from '@wordpress/i18n';

export class MyCustomProvider {
    static ID = 'my-custom-provider';
    static NAME = __( 'My Custom Provider', 'aether-site-exporter' );
    static TYPE = 'storage';
    static DESCRIPTION = __( 'Provider description', 'aether-site-exporter' );
    static ICON = '📦';
    static DEPLOYMENT_TYPE = 'static_site'; // or 'blueprint_bundle'
    static CONFIG_FIELDS = [
        {
            id: 'api_key',
            label: __( 'API Key', 'aether-site-exporter' ),
            type: 'text',
            required: true,
            secure: true,
        },
        {
            id: 'public_url',
            label: __( 'Public URL', 'aether-site-exporter' ),
            type: 'text',
            required: true,
            help: __( 'Public URL where files will be accessible', 'aether-site-exporter' ),
        },
    ];
}
```

**Step 2: Register Provider in JavaScript**
```javascript
import { doAction } from '@wordpress/hooks';

// Trigger hook for auto-discovery (ProviderRegistry listens for this)
doAction('aether.providers.register', MyCustomProvider);
```

**Step 3: Add StorageService Filter (for static site providers)**
```javascript
import { addFilter } from '@wordpress/hooks';
import { StorageService } from '@aether/providers/services/storageService';

addFilter('aether.storage.service.create', 'my-provider',
    (storageService, staticPath, config, providerId) => {
        if (providerId.startsWith('my-custom-provider')) {
            // Return custom storage service or adapter
            return new StorageService(staticPath, config, myCustomUploadAdapter);
        }
        return storageService;
    }
);
```

---

## Storage Paths Reference

### Storage Structure with Provider Isolation

Files are stored in `wp-content/uploads/aether/`:

```
aether/
├── provider-instance-a/
│   ├── static/
│   │   ├── index.html (URLs → provider A's public_url)
│   │   └── about/index.html
│   └── file-manifest.json
│
└── provider-instance-b/
    ├── static/
    │   ├── index.html (URLs → provider B's public_url)
    │   └── about/index.html
    └── file-manifest.json
```

---

## Troubleshooting

### Issue: Providers Getting Same URLs

**Symptom:** Both providers have HTML with the same deployment URL

**Cause:** Provider `public_url` not configured

**Fix:**
1. Check provider config has `public_url` set
2. Verify each provider has a unique `public_url`
3. Check browser console for the staticSiteUrl being used

### Issue: Files Overwriting Each Other

**Symptom:** One provider's files overwrite another's

**Cause:** Provider ID not properly passed through upload chain

**Fix:**
1. Check `config.provider_id` is set when creating StorageService
2. Verify `aether.storage.service.config` filter includes `provider_id`
3. Check storage paths include provider prefix

### Issue: Manifest Conflicts

**Symptom:** Manifest shows wrong files or hash mismatches

**Cause:** Shared manifest between providers

**Fix:**
1. Verify each provider has its own manifest
2. Check `providerId` parameter passed to `fetchManifest()` and `uploadManifest()`
3. Clear IndexedDB cache if needed

---

## Testing Checklist

### Single Provider Test
- [ ] Configure one provider instance
- [ ] Configure `public_url`
- [ ] Export site
- [ ] Verify files uploaded correctly
- [ ] Verify manifest exists
- [ ] Check HTML has correct URLs

### Multi-Provider Test
- [ ] Configure two provider instances
- [ ] Configure different `public_url` values
- [ ] Export site
- [ ] Verify both provider directories exist
- [ ] Verify each has separate manifest
- [ ] Check HTML differs between providers (different URLs)
- [ ] Verify both uploads completed successfully

### Hash Deduplication Test
- [ ] Export site
- [ ] Make no changes
- [ ] Export again
- [ ] Verify files skipped (hash match in logs)
- [ ] Check manifest timestamps updated
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
import { fetchManifest } from '@aether/utils/manifestManager';

// Manifest is cached in IndexedDB (1-hour TTL)
// No need to manually cache
const manifest = await fetchManifest(storageService, providerId);
```

---

## API Reference

### StorageService

```javascript
import { StorageService } from '@aether/providers/services/storageService';

class StorageService {
    constructor(staticPath, config = {}, uploadAdapter = null)

    async upload(key, file, metadata = {})
    async delete(key)
    async batchDelete(keys)
    async listObjects(prefix = '', limit = 1000)
    async downloadManifest()
    async uploadManifest(blob)

    getUrl(key)  // Returns public URL for key
}
```

### Manifest Manager

```javascript
import {
    fetchManifest,
    updateManifestEntry,
    shouldSkipUpload,
    uploadManifest,
} from '@aether/utils/manifestManager';

// Fetch manifest (cached in IndexedDB)
const manifest = await fetchManifest(storageService, providerId);

// Update manifest entry
const updatedManifest = updateManifestEntry(
    manifest,
    'static/index.html',
    12345,        // size
    'sha256-...', // hash
    'text/html'   // contentType
);

// Check if should skip upload
const skip = shouldSkipUpload(manifest, 'static/index.html', 12345, 'sha256-...');

// Upload manifest
await uploadManifest(storageService, manifest, providerId);
```

---

## Key Filters Reference

| Filter | Phase | Purpose |
|--------|-------|---------|
| `aether.export.step.uploadStaticSiteFiles.html.process` | Upload | Modify HTML before URL rewriting |
| `aether.storage.service.config` | Storage init | Customize storage config |
| `aether.storage.service.create` | Storage init | Override StorageService |
| `aether.export.step.uploadStaticSiteFiles.manifest.fetch` | Upload | Provide custom manifest |
| `aether.export.step.uploadStaticSiteFiles.manifest.update` | Upload | Modify manifest after update |
| `aether.export.step.uploadStaticSiteFiles.manifest.cleanup` | Upload end | Customize manifest cleanup |
| `aether.export.step.uploadStaticSiteFiles.asset.process` | Upload | Modify asset before upload |
| `aether.upload.file.options` | Upload | Customize upload options |
| `aether.assets.extracted` | Pre-scan | Modify extracted asset list |
| `aether.assets.should_collect` | Pre-scan | Filter asset collection |

---

## Resources

- **Hooks Reference:** See [hooks.md](hooks.md)
- **Architecture:** See [architecture.md](architecture.md)
- **Export Hooks:** See [export-hooks.md](export-hooks.md)

---

**Need Help?**
- Check browser console for debug logs
- Review provider configuration in Aether Settings
- Verify REST API endpoints return correct provider metadata
- Check PHP error logs for server-side issues
