# Aether Plugin - Source Code

This directory contains all JavaScript/React source code for the Aether WordPress plugin.

## Directory Structure

```
assets/src/
├── admin-bar/           # WordPress admin bar integration
├── admin-common/        # Shared admin UI components
├── admin-settings/      # Plugin settings page
├── components/          # Shared React components
├── constants/           # Centralized constants (API, timing, providers, etc.)
├── hooks/               # Custom React hooks
├── media-offload/       # Automatic media offloading to cloud storage
├── providers/           # Cloud provider integrations (Cloudflare, GitLab, etc.)
├── publish/             # Static site generation and deployment workflow
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

### Publish Workflow

Static site generation uses a **step-based orchestration** approach:

- React handles asset extraction, HTML processing, and direct upload
- PHP handles blueprint generation and other server-side operations
- REST API coordinates between React and PHP
- See [publish/README.md](publish/README.md) for details

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
- **admin-bar.js** - Admin bar publish button
- **publish.js** - Publish workflow modal
- **provider-cloudflare-r2.js** - Cloudflare R2 provider
- **provider-cloudflare.js** - Cloudflare Workers provider
- **provider-gitlab-pages.js** - GitLab Pages provider
- **provider-gitlab.js** - GitLab provider

### Code Splitting

The build uses dynamic imports for code splitting to reduce initial bundle size:

- Provider modules loaded on-demand
- Large dependencies (like zip libraries) loaded when needed
- Webpack automatically creates chunks for split code

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
path: '/aether/v1/publish'
setTimeout( callback, 500 )

// ✅ Use constants
import { ENDPOINTS, POLLING_INTERVAL } from '../constants';
path: ENDPOINTS.PUBLISH.START
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

- [Publish Workflow](publish/README.md) - Static site generation process
- [Provider System](providers/README.md) - Cloud provider architecture
- [Components](components/README.md) - Shared React components
- [Hooks](hooks/README.md) - Custom React hooks
- [Media Offload](media-offload/README.md) - Automatic media offloading
- [Constants](constants/README.md) - Centralized constants

## Support & Contributing

For bugs and feature requests, please use the GitHub issue tracker.

When contributing code:
1. Follow existing code patterns and conventions
2. Add JSDoc documentation for all new code
3. Write tests for new functionality
4. Run linters before committing (`npm run lint:js:fix`)
5. Update relevant README files
