# Static Site Routing Setup for static-wp.s12y.org

## Overview

The updated `PlaygroundCorsProxy.js` worker now handles two functions:
1. **CORS Proxy** for WordPress Playground networking (cfp.s12y.org)
2. **Static Site Routing** for static-wp.s12y.org with index.html fallback

## Current Status

✅ Worker code updated in `PlaygroundCorsProxy.js`
✅ Worker deployed to Cloudflare (deployment ID: d54a536d25be4c2a83aaafea4a8150e6)
⚠️  **Manual Step Required**: Add worker route in Cloudflare Dashboard (see below)

## Deployment Steps

### Option 1: Via Cloudflare Dashboard (Recommended)

1. **Update the Existing Worker**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages
   - Find your CORS proxy worker (likely named `playground-cors-proxy` or similar)
   - Click **Quick Edit**
   - Replace the code with the contents of `PlaygroundCorsProxy.js`
   - Click **Save and Deploy**

2. **Add Worker Route for static-wp.s12y.org**
   - Go to **Workers & Pages** → Your Worker → **Settings** → **Triggers**
   - Under **Routes**, click **Add Route**
   - Enter: `static-wp.s12y.org/*`
   - Select Zone: `s12y.org`
   - Click **Add Route**

### Option 2: Via Wrangler CLI

```bash
# Deploy the updated worker
cd assets/workers
wrangler deploy PlaygroundCorsProxy.js --name playground-cors-proxy

# Add route (if not configured in wrangler.toml)
wrangler route add "static-wp.s12y.org/*" --name playground-cors-proxy --zone-id d11d0b2e0c02a5ceb0b2cd333dbd8117
```

## How It Works

### Before (Current)
```
User → static-wp.s12y.org/ → R2 Bucket (404)
```

### After (With Worker)
```
User → static-wp.s12y.org/ → Worker → Redirect (301) → static-wp.s12y.org/index.html
User → static-wp.s12y.org/index.html → Worker + Caching → R2 Bucket (200 OK)
User → static-wp.s12y.org/assets/... → Worker + Caching → R2 Bucket (200 OK)
```

## Caching Strategy

The worker applies intelligent caching based on file type:

### Immutable Assets (1 year, immutable)
**Content-hashed files** (e.g., `php_8_4-BwMTnJAB.wasm`, `main-CjBtwb2-.js`)
- `Cache-Control: public, max-age=31536000, immutable`
- `CDN-Cache-Control: public, max-age=31536000`
- **Why**: Filenames include content hashes, so they never change
- **Result**: Cached in browser + Cloudflare edge forever

### Static Assets (1 year)
**Non-hashed files** (`.js`, `.css`, `.wasm`, `.woff2`, `.png`, `.jpg`, `.svg`, `.map`)
- `Cache-Control: public, max-age=31536000`
- `CDN-Cache-Control: public, max-age=31536000`
- **Why**: Static assets rarely change
- **Result**: Aggressive caching in browser + edge

### HTML Files (1 hour, revalidate)
**Entry points** (`index.html`, `remote.html`, etc.)
- `Cache-Control: public, max-age=3600, must-revalidate`
- **Why**: May be updated when Playground is redeployed
- **Result**: Cached for 1 hour, then revalidates

### JSON Files (1 day)
**Configuration files** (`manifest.json`, `blueprint-schema.json`)
- `Cache-Control: public, max-age=86400`
- **Why**: Configuration changes less frequently
- **Result**: Cached for 24 hours

### Performance Impact

**First Visit:**
- `index.html`: 3-5 KB (~10ms from edge)
- PHP 8.4 WASM: 22 MB (~2-3 seconds on fast connection)
- Client JS: ~35 MB (~1-2 seconds)
- **Total**: ~3-5 seconds

**Second Visit (with cache):**
- All assets loaded from browser cache
- **Total**: <100ms (instant load)

**Cloudflare Edge Caching:**
- Static assets cached at Cloudflare edge globally
- Users worldwide get <50ms latency for cached assets
- Only first user in each region pays full download time

## Verification

After deployment, test routing and caching:

```bash
# Should redirect to /index.html (301)
curl -I https://static-wp.s12y.org/

# HTML file - should have short cache (1 hour)
curl -I https://static-wp.s12y.org/index.html
# Look for: Cache-Control: public, max-age=3600, must-revalidate

# WASM file - should have long cache + immutable (1 year)
curl -I https://static-wp.s12y.org/assets/php_8_4-BwMTnJAB.wasm
# Look for: Cache-Control: public, max-age=31536000, immutable
# Look for: CDN-Cache-Control: public, max-age=31536000

# JavaScript - should have long cache + immutable
curl -I https://static-wp.s12y.org/assets/main-CjBtwb2-.js
# Look for: Cache-Control: public, max-age=31536000, immutable

# JSON - should have medium cache (1 day)
curl -I https://static-wp.s12y.org/manifest.json
# Look for: Cache-Control: public, max-age=86400
```

### Browser DevTools Check

1. Open https://static-wp.s12y.org/ in browser
2. Open DevTools → Network tab
3. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
4. Check responses:
   - WASM files should show `from disk cache` on second load
   - Look for `cf-cache-status: HIT` header (Cloudflare edge cache)

## Benefits

### Routing
- ✅ Clean URLs: `https://static-wp.s12y.org/` works without manually adding `/index.html`
- ✅ No plugin code changes needed (URLs already updated)
- ✅ Same worker handles both CORS proxy and routing

### Performance
- ✅ **Instant second loads**: All assets cached in browser (immutable cache)
- ✅ **Global edge caching**: Cloudflare caches at 300+ locations worldwide
- ✅ **<50ms latency**: Cached assets served from nearest edge location
- ✅ **Bandwidth savings**: Repeat visitors load from cache (no R2 egress)

### Cost Optimization
- ✅ **Reduced R2 reads**: Edge cache serves most requests
- ✅ **Reduced R2 egress**: Cached responses don't count against bandwidth
- ✅ **Free Cloudflare cache**: Included with R2 custom domains

## Rollback

If issues occur, simply remove the worker route for `static-wp.s12y.org/*` and traffic will go directly to R2 again.
