# Aether - Claude Code Documentation

## 🚨 CRITICAL: NO BACKWARDS COMPATIBILITY

**WE DO NOT CARE ABOUT BACKWARDS COMPATIBILITY.**

All development decisions prioritize:
- Clean, maintainable code
- Zero technical debt
- No legacy support layers
- Modern patterns and practices

If old code conflicts with clean architecture, **delete the old code**. Never add compatibility layers.

## Project Overview

### Purpose
Aether is a WordPress plugin that enables users to **administer their WordPress site in WordPress Playground** (a browser-based WordPress environment) and **deploy the result as a static site** to a provider of their choosing.

**Workflow**: WordPress Playground (Admin) → Generate Static Site → Deploy to Provider

### Key Features
- Blueprint-based Playground persistence (98% storage reduction)
- Multi-provider deployment architecture
- Media offloading to Cloudflare Images/R2
- React-based static site generation with direct production upload
- Browser-based export and upload
- Automatic retry logic for network requests (p-retry)
- DOM-based HTML processing (parse5)

## WordPress Playground Constraints

WordPress Playground runs **exclusively in the browser**, which imposes critical limitations:

| Constraint | Impact | Solution |
|------------|--------|----------|
| **No PHP networking** | `wp_remote_*` functions fail | Browser-based fetch API calls with retry logic |
| **No PUT requests** | Cannot upload files directly to R2/S3 | Cloudflare Workers proxy in `assets/workers/` |
| **Strict time limits** | Operations timeout quickly | Chunked operations, step-based workflow |
| **Browser-only** | No server-side persistence | Client-side export, IndexedDB, REST API orchestration |
| **No CLI** | Cannot run shell commands | REST API endpoints + JavaScript orchestration |
| **Network instability** | Requests may fail intermittently | Automatic retry with exponential backoff (p-retry) |

### PHP vs Browser Split Architecture

To support WordPress Playground, external HTTP requests are split between PHP and browser:

**Browser-Based (JavaScript/React):**
- ✅ WordPress.org API calls (`useAssetDiscovery.js`)
  - Plugin/theme detection via `fetch()` to `wordpress.org/plugins/{slug}/`
  - No PHP HTTP requests needed
- ✅ Cloudflare API management (`EdgeService.js`)
  - Worker deployment, listing, management
  - Zone lookups, subdomain configuration
  - Direct `fetch()` calls to `api.cloudflare.com`
  - **Automatic retry** for network errors and rate limiting (500s, 429s)

**PHP-Based (Server-Side):**
- ✅ Database operations (publish jobs, settings, configuration)
- ✅ Local file operations (ZIP creation, file serving)
- ✅ WordPress API interactions (posts, media queries)

**Key Principle:** If it makes HTTP requests to external APIs, it belongs in the browser with retry logic.

### Cloudflare Workers
Workers act as a proxy for file uploads since Playground blocks PUT requests.

Workers handle:
- File uploads to R2 object storage
- CORS support for browser requests
- Request proxying and authentication

Worker scripts: `assets/workers/CloudflareR2Worker.js`

## Architecture

### Publish Workflow (React + PHP Hybrid)

The publish workflow uses **step-based orchestration** with React and PHP coordination via REST API:

**React handles:**
- `generateStaticSite` step - Fetch URLs, process HTML, extract assets, upload to R2
  - **CRITICAL**: Assets extracted BEFORE HTML processing (prevents CORS/404 errors)
  - Direct production upload (no staging for static files)
  - Upload manifest skips already-uploaded files (`local_path === ''`)
  - HTML processing uses parse5 for DOM manipulation (when needed)
  - Search functionality extracted to separate module (`searchScript.js`)

**PHP handles:**
- All other steps via REST endpoints (`PublishStepsController.php`)
- `generateBlueprint` - Create WordPress Playground blueprint
- `prepare_upload_manifest` - List files for upload

**Key Files:**
- `assets/src/publish/hooks/useStaticSiteGenerator.js` - React static site generation
- `assets/src/publish/hooks/usePublishController.js` - Step orchestration
- `assets/src/publish/utils/htmlProcessor.js` - HTML processing (411 lines, down from 627)
- `assets/src/publish/utils/domProcessor.js` - DOM-based HTML manipulation (parse5, 318 lines)
- `assets/src/publish/utils/searchScript.js` - Client-side search (extracted, 242 lines)
- `includes/Controllers/REST/PublishStepsController.php` - PHP step execution

### Network Request Handling

All external API calls use automatic retry logic to handle WordPress Playground's network instability:

**Retry Utilities** (`assets/src/utils/fetchWithRetry.js`):
- `fetchWithRetry()` - Retries all failed requests (use for most cases)
- `fetchJsonWithRetry()` - Retries and parses JSON responses
- `fetchWithSelectiveRetry()` - Only retries retryable errors (500s, network errors, 429s)
- `isRetryableError()` - Determines if an error should trigger retry

**Configuration** (`assets/src/constants/timing.js`):
- `MAX_RETRIES` = 3 attempts
- `RETRY_INITIAL_DELAY` = 1000ms
- `RETRY_MAX_DELAY` = 30000ms
- Exponential backoff between retries

**Usage Example:**
```javascript
import { fetchWithRetry } from '../utils/fetchWithRetry';

// Basic retry (retries all failures)
const response = await fetchWithRetry('https://api.example.com/data');

// With custom config
const response = await fetchWithRetry(url, options, {
    retries: 5,
    onFailedAttempt: (error) => {
        console.log(`Retry attempt ${error.attemptNumber}`);
    }
});
```

**Implementation:**
- `EdgeService.js` - Cloudflare API calls use retry for network errors only
- Future: Apply to remaining 48+ fetch() calls across codebase

### HTML Processing

HTML processing has been modularized for better maintainability:

**Regex-Based (Current, Fast):**
- `htmlProcessor.js` - Pattern-based HTML manipulation
- Used for: Admin bar removal, URL rewriting, asset injection
- 411 lines (reduced from 627 by extracting search JS)

**DOM-Based (Available, Precise):**
- `domProcessor.js` - parse5-based HTML manipulation
- Async-loaded to avoid bundle impact (60KB gzipped)
- Used for: Complex HTML transformations when regex isn't sufficient
- Available functions: `removeElementsByAttribute()`, `addBodyClass()`, `removeBodyClass()`, `injectBeforeClosingTag()`, etc.

### Provider Self-Containment

Providers are fully self-contained modules that handle ALL internal routing, configuration, and operations. External classes delegate to providers rather than implementing provider-specific logic.

## Development Workflow

### Code Quality Tools

```bash
# PHP
composer check-cs                # Check coding standards
composer fix-cs                  # Fix coding standards
composer phpstan                 # Static analysis (Level 8)
composer check                   # All checks

# JavaScript
npm run lint:js                  # ESLint check
npm run lint:js:fix              # ESLint auto-fix
```

### Standards
- **PHP**: PSR-12, with some additions from the WordPress Coding Standards (WPCS)
- **JavaScript**: WordPress JavaScript Standards
- **PHPStan**: Level 8 analysis
- **Type Safety**: Typed properties (PHP 7.4+)
- **Styling**: Inline styles only (no CSS files)
- **Class Names**: BEM convention (`aether-block-name__element-name--modifier`)

### Styling Architecture

This project uses **inline styles exclusively** - no CSS files. All styling is done via JavaScript using the `style` prop in React components.

**Design System** (`assets/src/utils/styles.js`):
- **Design Tokens**: Centralized constants for colors, spacing, typography, etc.
  - `colors` - Primary, text, background, status colors
  - `spacing` - Consistent spacing scale (xs, sm, md, lg, xl, 2xl)
  - `borderRadius` - Border radius values (sm, md, lg, full)
  - `fontSize` - Typography scale (xs, sm, base, lg, xl, 2xl)
  - `fontWeight` - Font weight values (normal, medium, semibold, bold)
- **Reusable Style Objects**: Pre-composed style objects for common patterns
  - `commonStyles` - Section, sectionHeader, card styles
  - `statusBadgeStyles` - Badge styles with variants (success, error, warning, info)
  - `noticeStyles` - Notice styles with variants
  - `utilityStyles` - Common utility styles (noMargin, etc.)
- **Style Factory Functions**: Functions that generate style objects
  - `createFlexStyle()` - Generate flexbox styles
  - `createGridStyle()` - Generate grid styles

**Usage Example:**
```javascript
import { colors, spacing, fontSize, fontWeight, commonStyles } from '../utils/styles';

const containerStyle = {
    ...commonStyles.section,
    padding: spacing.lg,
};

return (
    <div className="aether-component" style={ containerStyle }>
        <h2 style={{ fontSize: fontSize.xl, fontWeight: fontWeight.semibold }}>
            Title
        </h2>
    </div>
);
```

**Responsive Design:**
- No media queries - responsive behavior achieved through flexible layouts (flexbox, grid)
- Use relative units (rem, %) and flexible containers
- Components adapt naturally to viewport size without breakpoints

### BEM Naming Convention

All elements use **BEM (Block Element Modifier)** class names via the `className` prop for semantic identification, testing, and potential future CSS styling.

**Naming Pattern:**
- **Block**: `aether-block-name` (e.g., `aether-publish-button`)
- **Element**: `aether-block-name__element-name` (e.g., `aether-publish-button__header`)
- **Modifier**: `aether-block-name--modifier-name` or `aether-block-name__element-name--modifier-name` (e.g., `aether-publish-button__notice--error`)

**Usage Example:**
```javascript
return (
    <div className="aether-publish-button">
        <div className="aether-publish-button__header">
            <h2 className="aether-publish-button__title">Title</h2>
        </div>
        <div className="aether-publish-button__notice aether-publish-button__notice--error">
            Error message
        </div>
    </div>
);
```

**Benefits:**
- Semantic class names for testing and automation
- Easy debugging and element identification
- Consistent naming across all components
- Ready for future CSS styling if needed (currently all styles are inline)

## Important Patterns & Conventions

### PSR-4 Autoloading
All classes use the `Aether\` namespace and follow PSR-4:
```php
namespace Aether\Providers\CloudflareR2;
// File: includes/Providers/CloudflareR2/CloudflareR2Provider.php
```

### WordPress Integration
- Use WordPress hooks (`add_action`, `add_filter`)
- Nonce verification for all forms and AJAX
- Capability checks (`manage_options`)
- Sanitize inputs, escape outputs
- Use WordPress HTTP API when possible

### Error Handling

**Centralized Error Parsing** (`assets/src/utils/errorParser.js`):
- `parseErrorResponse()` - Handles Cloudflare, generic, and plain text error formats
- `parseErrorResponseWithStatus()` - Adds HTTP status context
- `parseMultipleErrors()` - Extracts multiple error messages

**Standard Response Format** (`assets/src/utils/standardResponse.js`):
```javascript
{
    success: boolean,
    error?: string,           // Error message (if success = false)
    data?: any,              // Success data (if success = true)
    errors?: Array<string>   // Multiple errors (optional)
}
```

### Installed npm Packages

**Production Dependencies:**
- `p-retry` (7KB gzipped) - Automatic retry logic with exponential backoff
- `parse5` (60KB gzipped) - DOM-based HTML parsing (async-loaded)

**Why These Packages:**
- **p-retry**: 48+ fetch() calls across codebase need retry logic for Playground's network instability
- **parse5**: Precise HTML manipulation when regex isn't sufficient, smaller than linkedom (162KB)

**Rejected Packages:**
- **Zod**: Current validation.js (82 lines) is sufficient for simple validation needs
- **XState**: State management complexity doesn't justify 49KB bundle overhead

---

## Summary for AI Assistants

When working with this codebase:

1. **Zero backwards compatibility** - Delete old code, never add compatibility layers
2. **Provider self-containment** - All provider logic belongs in provider classes
3. **Respect Playground constraints** - No PUT, time limits, browser-only
4. **Use retry logic** - All external API calls should use `fetchWithRetry()` utilities
5. **React + PHP hybrid** - React handles `generateStaticSite`, PHP handles other steps
6. **Asset extraction timing** - ALWAYS extract assets BEFORE HTML processing
7. **Run code quality checks** - Before every commit (PHPCS, PHPStan, ESLint)
8. **Modular HTML processing** - Use regex for simple, parse5 for complex transformations
9. **Focus on maintainability** - Clean code over test coverage
10. **Inline styles only** - Use `style` prop with design tokens from `utils/styles.js`, never create CSS files
11. **BEM class names** - All elements must have semantic `className` props following BEM convention
12. **Design tokens** - Always use centralized tokens (colors, spacing, fontSize, etc.) instead of hardcoded values

### Key Implementation Files

**Network/API:**
- `assets/src/utils/fetchWithRetry.js` - Retry logic (19 tests)
- `assets/src/providers/services/edgeService.js` - Cloudflare API with retry
- `assets/src/utils/errorParser.js` - Error response parsing

**HTML Processing:**
- `assets/src/publish/utils/htmlProcessor.js` - Regex-based (411 lines)
- `assets/src/publish/utils/domProcessor.js` - DOM-based with parse5 (27 tests)
- `assets/src/publish/utils/searchScript.js` - Client-side search (extracted)

**Utilities:**
- `assets/src/utils/api.js` - Auth headers, API utilities
- `assets/src/utils/standardResponse.js` - Response format
- `assets/src/constants/timing.js` - Retry configuration
- `assets/src/utils/styles.js` - Design tokens and reusable style objects

**Styling:**
- All styling via inline `style` props using design tokens
- BEM class names via `className` props for semantic identification
- No CSS files - everything is JavaScript-based

The primary goal is to enable WordPress administration in Playground while deploying static sites to production hosting providers, with robust error handling and retry logic for network instability.
