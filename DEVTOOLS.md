# Aether DevTools

Development tools for debugging context state, monitoring API calls, and analyzing performance.

## Features

- **Context Inspector**: View real-time state of all React contexts (ConfigContext, ProviderContext, PublishContext, SettingsContext)
- **API Monitor**: Track all API calls with timing, status, and error information
- **Performance Metrics**: Monitor API call statistics, memory usage, and performance data
- **Non-intrusive**: Only loads in development mode, zero impact on production

## Enabling DevTools

### Method 1: Browser Console

Open browser console and run:

```javascript
window.aetherDebug = true;
```

Then reload the page. The DevTools button will appear in the bottom-right corner.

### Method 2: WordPress wp-config.php

Add this constant to your `wp-config.php`:

```php
define( 'AETHER_DEBUG', true );
```

Then add this to your theme's `functions.php` or a custom plugin:

```php
add_action( 'admin_footer', function() {
    if ( defined( 'AETHER_DEBUG' ) && AETHER_DEBUG ) {
        echo '<script>window.aetherDebug = true;</script>';
    }
} );
```

### Method 3: Browser Extension (Recommended)

Install a browser extension like "Custom JavaScript for websites" and add:

```javascript
// For Aether admin pages only
if (window.location.href.includes('aether')) {
    window.aetherDebug = true;
}
```

## Using DevTools

### Opening DevTools

1. Click the **🔧 DevTools** button in the bottom-right corner
2. A panel will slide up from the bottom

### Tabs

#### 1. Contexts Tab

View the current state of all React contexts:

- **ConfigContext**: Configuration state, loading status, errors
- **ProviderContext**: Provider count, loaded providers, errors

```
ConfigContext
  Loading: false
  Error: null
  Config: {
    "siteKey": "abc123",
    "playgroundUrl": "https://playground.wordpress.net"
  }

ProviderContext
  Loading: false
  Error: null
  Provider Count: 4
  Provider IDs: cloudflare-r2, cloudflare, gitlab-pages, gitlab
```

#### 2. API Tab

Monitor all API calls in real-time:

- Request method (GET, POST, PUT, DELETE)
- Request path
- Duration in milliseconds
- Success/error status
- Error messages

Each API call is color-coded:
- **Green border**: Successful request
- **Red border**: Failed request

```
GET /aether/v1/config (150ms) ✓
POST /aether/v1/settings (200ms) ✓
GET /aether/v1/providers/status (500ms) ✗
  Error: Network timeout
```

#### 3. Performance Tab

Analyze API and memory performance:

**API Performance**:
- Total API calls made
- Successful vs failed calls
- Average request duration
- Total request time

**Memory Usage** (Chrome only):
- Used JavaScript heap size
- Total JavaScript heap size
- Heap size limit

```
API Performance
  Total Calls: 15
  Successful: 14
  Failed: 1
  Average Duration: 175ms
  Total Duration: 2625ms

Memory Usage
  Used JS Heap: 45 MB
  Total JS Heap: 72 MB
  Heap Limit: 2048 MB
```

## Use Cases

### Debugging Context State

When a component isn't receiving the expected data:

1. Open DevTools → Contexts tab
2. Check if the context is loading
3. Verify the data structure
4. Check for errors

**Example**:
```
Problem: Provider dropdown shows no options

DevTools shows:
  ProviderContext
    Loading: false
    Provider Count: 0
    Provider IDs: (empty)

Solution: Providers failed to load, check browser console
```

### Monitoring API Performance

When pages are slow to load:

1. Open DevTools → API tab
2. Observe which requests are slow
3. Check for failed requests
4. Look for duplicate requests

**Example**:
```
Observation: Multiple identical /config requests
  GET /aether/v1/config (200ms)
  GET /aether/v1/config (195ms)
  GET /aether/v1/config (203ms)

Problem: Request deduplication middleware not working
```

### Tracking Memory Leaks

When the application becomes sluggish over time:

1. Open DevTools → Performance tab
2. Note the "Used JS Heap" value
3. Perform actions in the app
4. Check if heap size keeps growing

**Example**:
```
Initial: Used JS Heap: 45 MB
After 10 publishes: Used JS Heap: 450 MB

Problem: Memory leak in publish workflow
```

### Verifying Cache Behavior

When testing cache invalidation:

1. Open DevTools → API tab
2. Trigger an API call
3. Trigger the same call again
4. Verify second call is cached (0ms or very fast)

**Example**:
```
First call:  GET /aether/v1/config (180ms)
Second call: GET /aether/v1/config (2ms) [CACHED]

Result: Caching is working correctly
```

## API Call Interceptor

DevTools automatically intercepts `wp.apiFetch` calls to log them. This happens transparently and doesn't affect application behavior.

**Logged Information**:
- Timestamp (ISO 8601 format)
- HTTP method
- Request path
- Duration (milliseconds)
- Status (success/error)
- Error message (if failed)

**Example Log Entry**:
```javascript
{
    timestamp: "2025-11-10T15:30:45.123Z",
    method: "POST",
    path: "/aether/v1/settings",
    duration: 234,
    status: "success"
}
```

## Performance Impact

**Development Mode**:
- DevTools adds ~15KB to bundle size
- Minimal runtime overhead (< 1ms per API call)
- Memory usage: ~2-5MB for log storage

**Production Mode**:
- DevTools doesn't load at all
- Zero bundle size impact
- Zero runtime overhead

## Limitations

### Memory API

The Performance tab's memory usage feature requires Chrome/Edge and only works when DevTools are open:

```javascript
if (performance.memory) {
    // Available in Chrome/Edge
} else {
    // Not available in Firefox/Safari
}
```

### Log Retention

API logs are kept in memory (max 50 calls). Logs are cleared when:
- DevTools panel is closed
- Page is refreshed
- 51st API call is made (oldest is removed)

### Context Visibility

Only contexts that wrap the current component tree are visible:
- Admin Settings: ConfigContext, ProviderContext, SettingsContext
- Publish Page: ConfigContext, ProviderContext, PublishContext

## Troubleshooting

### DevTools button doesn't appear

**Check**:
1. Is `window.aetherDebug` set to `true`? (Check browser console)
2. Are you on an Aether admin page?
3. Did you reload after enabling debug mode?

**Solution**:
```javascript
// In browser console
window.aetherDebug = true;
window.location.reload();
```

### API calls not showing up

**Check**:
1. Is the API tab active?
2. Are requests using `wp.apiFetch`? (DevTools only intercepts this)
3. Did the request happen before DevTools loaded?

**Solution**:
- Make requests after opening DevTools
- Check browser Network tab for raw requests

### Memory usage shows "Not available"

**Reason**: Memory API is Chrome/Edge only and requires DevTools to be open

**Solution**:
- Use Chrome or Edge
- Open browser DevTools (F12)
- Refresh the page

## Best Practices

### During Development

✅ **Do**:
- Enable DevTools for all development work
- Monitor API calls when implementing new features
- Check context state when debugging
- Use Performance tab to identify slow requests

❌ **Don't**:
- Leave DevTools enabled in production
- Rely solely on DevTools (also check browser DevTools)
- Keep DevTools panel open all the time (use as needed)

### During Testing

✅ **Do**:
- Use API tab to verify request deduplication
- Use Performance tab to check memory usage
- Use Contexts tab to verify state updates

❌ **Don't**:
- Test performance with DevTools open (overhead)
- Assume all contexts are visible (only wrapped ones)

## Examples

### Example 1: Debug Provider Loading

**Scenario**: Provider dropdown is empty

```javascript
// 1. Open DevTools → Contexts tab
// 2. Check ProviderContext state

ProviderContext
  Loading: false
  Error: null
  Provider Count: 0
  Provider IDs: (empty)

// 3. Switch to API tab
// 4. Look for provider-related requests

No requests to /aether/v1/providers/

// Conclusion: Providers aren't being fetched at all
// Solution: Check ProviderContext's useEffect hook
```

### Example 2: Optimize Slow Page Load

**Scenario**: Admin settings page loads slowly

```javascript
// 1. Open DevTools → API tab
// 2. Load the page
// 3. Check request durations

GET /aether/v1/config (45ms)
GET /aether/v1/settings (1200ms) ← SLOW!
GET /aether/v1/providers/cloudflare-r2/status (300ms)

// 4. Switch to Performance tab

API Performance
  Average Duration: 515ms
  Total Duration: 1545ms

// Conclusion: Settings endpoint is slow
// Solution: Add caching to settings endpoint or optimize query
```

### Example 3: Verify Cache Invalidation

**Scenario**: Settings not updating after save

```javascript
// 1. Open DevTools → API tab
// 2. Save settings
// 3. Check if config is refetched

POST /aether/v1/settings (200ms)
// Expected: GET /aether/v1/config
// Actual: (nothing)

// Conclusion: Cache not being invalidated
// Solution: Add invalidateCache('/aether/v1/config') after save
```

## Technical Details

### Component Structure

```javascript
<DevTools>
  ├─ Header (title, close button)
  ├─ Tabs (contexts, api, performance)
  └─ Content
      ├─ ContextsTab (shows context state)
      ├─ ApiTab (shows API logs)
      └─ PerformanceTab (shows metrics)
```

### State Management

DevTools uses local component state (no contexts):
- `isOpen`: Boolean for panel visibility
- `activeTab`: Currently selected tab
- `apiLogs`: Array of API call logs (max 50)

### Styling

All styles are inline to avoid CSS conflicts. Uses:
- Dark theme (#1e1e1e background, #d4d4d4 text)
- Monospace font for code
- Color-coded status (green/red borders)
- Fixed positioning (bottom-right)

---

## Summary

Aether DevTools provides essential debugging capabilities for development:

✅ Real-time context state inspection
✅ Automatic API call logging
✅ Performance monitoring
✅ Memory usage tracking
✅ Zero production impact

Enable it with `window.aetherDebug = true` and start debugging!
