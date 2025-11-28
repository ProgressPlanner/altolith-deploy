# Altolith Plugin - Source Code

This directory contains all JavaScript/React source code for the Altolith WordPress plugin.

## Directory Structure

```
assets/src/
├── admin-bar/           # Admin bar export button
├── admin-settings/      # Plugin settings page
├── components/          # Shared React components
├── constants/           # Centralized constants (API, timing, providers, etc.)
├── contexts/            # React contexts (ExportContext)
├── export/              # Export workflow (step-based executor system)
├── export-modal/        # Export workflow modal
├── hooks/               # Custom React hooks
├── providers/           # Provider implementations
├── services/            # Service classes (AssetDiscoveryService, etc.)
└── utils/               # Utility functions and helpers
```

## Architecture Overview

### React + WordPress

The plugin uses **React 18** via `@wordpress/element` for all UI components. The architecture follows modern React patterns with hooks, functional components, and explicit state management.

### Key Principles

1. **Component Extraction**: Components should be in separate files, not inline definitions
2. **Hook Reusability**: Custom hooks encapsulate reusable logic
3. **Explicit Dependencies**: Pass dependencies as parameters, avoid implicit closures
4. **Constants Over Magic**: Use constants from `constants/` instead of hardcoded strings/numbers
5. **Comprehensive JSDoc**: All functions, hooks, and components should have JSDoc

### Provider System

The plugin uses a **pluggable provider architecture** for cloud deployment targets:

- Each provider is self-contained in `providers/<provider-name>/`
- Providers register themselves via WordPress hooks
- Provider system is modular and extensible
- See [providers/README.md](providers/README.md) for details

### Export Workflow

Static site generation uses a **step-based executor system** with dependency resolution:

- Steps register themselves via WordPress hooks
- Each step declares data dependencies (`requires`) and outputs (`provides`)
- StepExecutor automatically resolves dependencies and executes steps in parallel when possible
- React handles asset extraction, HTML processing, and direct upload
- PHP handles blueprint generation and other server-side operations
- REST API coordinates between React and PHP
- See [export/README.md](export/README.md) for details

## Build System

### Commands

```bash
# Development build with watch mode
npm run start

# Production build (minified)
npm run build

# Lint JavaScript
npm run lint:js
npm run lint:js:fix

# Run JavaScript unit tests
npm run test:js
```

### Entry Points

Webpack builds multiple entry points from `assets/src/`:

- **admin-settings.js** - Settings page UI
- **admin-bar-export.js** - Admin bar export button
- **export-modal.js** - Export workflow modal
- **provider-local-filesystem-static-site.js** - Local Filesystem static site provider
- **provider-local-filesystem-blueprint-bundle.js** - Local Filesystem blueprint bundle provider

### Code Bundling

The build bundles all code into single entry files (no code splitting):

- All code is bundled into entry files
- No chunk files are created
- Dynamic imports are set to `eager` mode
- This ensures all code is available immediately

## Path Aliases

The codebase uses path aliases for cleaner imports. Instead of deep relative paths, use the `@altolith/*` aliases:

### Available Aliases

- `@altolith/utils` → `assets/src/utils`
- `@altolith/components` → `assets/src/components`
- `@altolith/hooks` → `assets/src/hooks`
- `@altolith/constants` → `assets/src/constants`
- `@altolith/contexts` → `assets/src/contexts`
- `@altolith/services` → `assets/src/services`
- `@altolith/providers` → `assets/src/providers`
- `@altolith/export` → `assets/src/export`
- `@altolith/admin` → `assets/src/admin-settings`

### Usage Examples

```javascript
// ✅ Use path aliases
import StaticSiteCache from '@altolith/utils/staticSiteCache';
import { executePreScan } from '@altolith/export/utils/preScanPhase';
```

### Benefits

- **Cleaner imports**: No more counting `../` levels
- **Easier refactoring**: Moving files doesn't break imports
- **Better IDE support**: Autocomplete and go-to-definition work better
- **Self-documenting**: Aliases make codebase structure clearer

## Development Guidelines

### Component Structure

```javascript
/**
 * Component Name
 *
 * Brief description of what this component does.
 *
 * @param {Object} props - Component props
 * @param {string} props.propName - Description of prop
 * @returns {JSX.Element} Rendered component
 */
export function ComponentName( { propName } ) {
    // Component implementation
}
```

### Hook Structure

```javascript
/**
 * Custom Hook Name
 *
 * Brief description of what this hook does.
 *
 * @param {string} param - Description of parameter
 * @returns {Object} Object with hook values and functions
 */
export function useCustomHook( param ) {
    // Hook implementation
    return {
        value,
        doSomething,
    };
}
```

### Using Constants

```javascript
// ❌ Don't use magic strings/numbers
path: '/wp-json/altolith/deploy/export/createArchive'
setTimeout( callback, 500 )

// ✅ Use constants
import { ENDPOINTS, POLLING_INTERVAL } from '../constants';
path: ENDPOINTS.EXPORT_WORKFLOW.START
setTimeout( callback, POLLING_INTERVAL )
```

## Testing

### Unit Tests (Jest)

JavaScript unit tests are in `tests/js/` and mirror the source structure:

```bash
npm run test:js
npm run test:js -- --watch
```

### E2E Tests (Playwright)

End-to-end tests run in WordPress Playground:

```bash
npm run test:e2e
npm run test:e2e:headed  # With visible browser
```

## Related Documentation

- [Export Workflow](export/README.md) - Static site generation process
- [Provider System](providers/README.md) - Provider architecture
- [Components](components/README.md) - Shared React components
- [Hooks](hooks/README.md) - Custom React hooks
- [Constants](constants/README.md) - Centralized constants

## Support & Contributing

For bugs and feature requests, please use the GitHub issue tracker.

When contributing code:
1. Follow existing code patterns and conventions
2. Add JSDoc documentation for all new code
3. Write tests for new functionality
4. Run linters before committing (`npm run lint:js:fix`)
5. Update relevant README files
