# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Behavioral Guidelines

### Collaborative Problem-Solving

**ALWAYS ask for confirmation before implementing fixes.**

- Even if you think you found the solution, **ASK FIRST**
- We are partners working together, not working alone
- Present your findings and proposed solution, then wait for confirmation
- Have a dialogue - discuss the issue and explore solutions together
- Never assume you have the complete picture without user input

### Root Cause Analysis - No Quick Fixes

**Find and fix the ROOT CAUSE, not symptoms.**

- NEVER rush to conclusions when investigating issues
- NEVER make assumptions about what's causing a problem
- ALWAYS do thorough investigation before proposing solutions
- Easy fixes are usually wrong - dig deeper
- Read all relevant code paths before making changes
- Verify assumptions with actual code inspection

### Test-Driven Development (TDD)

**Always write tests BEFORE implementing new features.**

- Write failing tests first, then implement code to make them pass
- Run tests after implementation to verify
- Both JavaScript (Jest) and PHP should follow TDD

### Testing Philosophy - Tests Catch Bugs, Not Pass Blindly

**When tests fail, ALWAYS investigate the implementation first, NOT the tests.**

**Critical Testing Principles:**

1. **Tests exist to catch bugs in the implementation**
   - A failing test is doing its job - it found a problem
   - NEVER change tests to make them pass without understanding WHY they're failing
   - The implementation is guilty until proven innocent

2. **Investigate implementation before changing tests**
   - When a test fails, read the implementation code it's testing
   - Understand what changed in the implementation
   - Check if the implementation has a bug or if the behavior intentionally changed
   - Only update tests if the implementation's NEW behavior is correct

3. **Tests must be thorough, not just happy paths**
   - Happy path tests are necessary but insufficient
   - Test edge cases: empty inputs, null values, errors, boundary conditions
   - Test failure scenarios: network errors, validation failures, missing data
   - Test security: injection attacks, path traversal, unauthorized access
   - Comprehensive tests strengthen the codebase and catch regressions

4. **Bad testing practices to avoid**
   - ❌ Making tests pass by weakening assertions
   - ❌ Removing tests that fail without understanding why
   - ❌ Only testing the happy path
   - ❌ Changing tests to match bugs in implementation
   - ❌ Writing tests that always pass regardless of implementation

5. **Good testing practices**
   - ✅ Read the implementation when tests fail
   - ✅ Verify the implementation is correct before changing tests
   - ✅ Test error handling and edge cases
   - ✅ Use descriptive test names that explain what's being tested
   - ✅ Write tests that would fail if the implementation had bugs

**Example workflow when tests fail:**

```javascript
// ❌ WRONG: Change test to match (potentially buggy) implementation
test('processes data', () => {
  const result = processData(null);
  expect(result).toBeUndefined(); // Changed from expect().toThrow() to make it pass
});

// ✅ RIGHT: Investigate implementation, find it should handle null
test('processes data', () => {
  const result = processData(null);
  expect(() => processData(null)).toThrow('Data cannot be null'); // Test catches the bug
});
// Then fix the implementation to handle null properly
```

### Clean Codebase Philosophy

**We do not care about backwards-compatibility.**

- No backwards-compatibility hacks (no unused parameter renames like `_var`, no `// removed` comments, no re-exports of deleted code)
- Delete unused code completely instead of commenting it out
- Refactor fearlessly - if something is better done differently, change it
- Prioritize code clarity over preserving old patterns

### Code Quality Standards

- Run linters and fix issues before considering work complete
- PHPStan must pass at current level
- All tests must pass before committing

## Core Architectural Principles

### JavaScript-First, Reactive Architecture (CRITICAL)

**This is a JS-first plugin - JavaScript is preferred over PHP whenever possible.**

- If something CAN be done in JavaScript, it SHOULD be done in JavaScript
- PHP should primarily serve as a thin REST API layer
- **Target environment:** WordPress Playground (browser-based WASM environment)
- Everything should be reactive - use React state, contexts, and hooks
- Browser-based processing prevents PHP timeout issues in Playground
- Examples: Static site generation runs in browser, asset processing in JS, HTML parsing with parse5

**When to Use PHP vs JavaScript:**

- **JavaScript**: UI logic, data processing, file operations (via REST), HTML parsing, static site generation, asset tracking, URL discovery
- **PHP**: REST API endpoints, database queries, WordPress hooks/filters, server-side file I/O, authentication/security
- **Rule of thumb**: If it can run in the browser without significant performance penalty, use JavaScript

### Provider Architecture Principles

**Provider Isolation (CRITICAL)**

- Providers MUST be completely isolated to their own files
- NO provider-specific logic in core architecture or abstractions
- Core code should only interact with provider interface via JavaScript ProviderRegistry
- Providers register via `aether.providers.register` JavaScript hook for 3rd-party extensibility
- Each provider is self-contained: all logic, configuration, validation within JavaScript provider class
- 3rd-party plugins can hook in and add their own providers in JavaScript
- Example: `LocalFilesystemProvider` (JavaScript) contains ALL local filesystem logic - nothing in core

**Provider Instances Architecture**

- Multiple instances of the same provider type are supported
- Instance ID format: `{provider_type}:{uuid}` (e.g., `local-filesystem:a3f2c1b0-...`)
- Each instance has its own configuration stored in settings
- `ProviderRegistry` manages both provider types AND instances
- Users can configure multiple instances (e.g., multiple S3 buckets, multiple local paths)
- Instance configs stored in `aether_site_exporter_settings['providers']` array

**Provider Extension Pattern for 3rd-Party Plugins**

- 3rd-party providers extend `AbstractProvider` in JavaScript
- JavaScript providers implement the provider interface and are dynamically loaded
- Register via `aether.providers.register` JavaScript hook or directly with `ProviderRegistry.register()`

### Aether Ecosystem Integration

**This plugin is part of the Aether ecosystem (all plugins with `aether` prefix).**

- Designed to work together with other Aether plugins
- Consider cross-plugin compatibility when making architectural changes
- Shared conventions across Aether plugins should be maintained
- Other Aether plugins may extend or integrate with this plugin's provider system

## Development Commands

### Build Commands

```bash
# Production build (minified)
npm run build

# Development build (unminified for debugging)
npm run build:dev

# Watch mode (auto-rebuild on changes)
npm start
```

### Testing

```bash
# Run JavaScript tests
npm run test:js

# Run JavaScript tests in watch mode
npm run test:js:watch

# Run JavaScript tests with coverage
npm run test:js:coverage

# Run single JavaScript test file
npm run test:js -- path/to/test/file.test.js

# Run PHP tests (PHPUnit)
composer test

# Run specific PHP test suite
composer test:unit        # Unit tests only
composer test:integration # Integration tests only

# Run single PHP test file or method
composer test -- --filter TestClassName
composer test -- --filter testMethodName

# Run PHPStan (static analysis)
composer phpstan
```

### Code Quality

```bash
# Lint JavaScript
npm run lint:js

# Fix JavaScript linting issues
npm run lint:js:fix

# Check PHP code style
composer check-cs

# Fix PHP code style
composer fix-cs

# Run PHPStan
composer phpstan

# Run all checks (CS + PHPStan)
composer check
```

## High-Level Architecture

### Overview

Aether Site Exporter is a WordPress plugin that exports WordPress sites as static HTML or WordPress Playground blueprint bundles. The plugin uses a **universal compatibility** design - it works identically in both traditional hosting environments and WordPress Playground's browser-based WASM environment.

### Universal Compatibility Design

**Target: WordPress Playground (browser-based WASM environment)**

Key principles:

- **No environment detection** - code works identically everywhere
- **Never use `sys_get_temp_dir()`** - ALWAYS use `TempDirectoryManager::getTempFilePath()` which uses `wp-content/uploads/aether-temp`
- **Never use `realpath()` directly** - ALWAYS use `PathValidator` which has WASM-compatible fallbacks
- **Never make external HTTP calls from PHP** - use filter-based architecture for WordPress.org API checks
- **Browser-based static site generation** - prevents PHP timeouts

### PHP Architecture (Thin REST API Layer)

**Namespace:** `Aether\SiteExporter`

**Entry Point:** `aether-site-exporter.php` → `Plugin::getInstance()`

**Core Components:**

1. **`Plugin.php`** - Main orchestrator (singleton pattern)
   - Initializes all subsystems
   - Registers REST API routes via controller classes
   - Handles CORS for WordPress Playground compatibility
   - Manages provider registry

2. **Provider System** (Extensible architecture)
   - `ProviderRegistry` (JavaScript) - Singleton registry managing all provider types and instances
   - `AbstractProvider` (JavaScript) - Abstract base class for storage providers
   - `LocalFilesystemProvider` (JavaScript) - Stores exports locally
   - Providers register via `aether.providers.register` JavaScript hook
   - Instance IDs format: `{provider_type}:{uuid}`

3. **REST API Controllers** (`includes/REST/`)
   - Each controller is a dedicated class (separation of concerns)
   - Publish controllers handle multi-step export workflow
   - All endpoints use namespace `aether/site-exporter`
   - CORS headers automatically added for Playground compatibility
   - **No provider-specific logic in controllers**

4. **Services** (`includes/Services/`)
   - `ExportService` - Complete site export (database + wp-content)
   - `BlueprintBundleGenerator` - WordPress Playground blueprint creation
   - **Provider-agnostic** - work with any provider via interface

5. **Utilities** (`includes/Utilities/`)
   - `TempDirectoryManager` - Universal temp file handling (critical for Playground)
   - `PathValidator` - Universal path validation (WASM-compatible)
   - `FileManager` - File operations with persistence tracking
   - `CredentialEncryption` - Secure credential storage

**What PHP Handles:**
- Authentication and security
- Database queries
- WordPress hooks/filters integration
- Server-side file I/O (when absolutely necessary)
- REST API endpoints (thin layer)

### JavaScript/React Architecture (Primary Logic Layer)

**Build System:** Webpack via `@wordpress/scripts`

**Entry Points:**
- `admin-settings` → Settings page UI (`assets/src/admin-settings/`)

**Key Patterns:**

1. **Context-based Reactive State Management**
   - `PublishContext` - Publish workflow state
   - `ConfigContext` - Plugin configuration
   - Custom hooks consume contexts
   - State flows reactively through component tree

2. **Multi-Step Workflow System** (`assets/src/export/`)
   - Steps defined in `constants/steps.js`
   - Each step is an async function returning standard response format
   - `usePublishController.js` orchestrates step execution
   - Progress tracking via `progressManager.js`
   - State persisted in IndexedDB (Playground-compatible)

3. **Browser-Based Asset Management**
   - Static site generation runs entirely in browser
   - HTML parsing with `parse5` library (pure JavaScript)
   - URL rewriting for static sites
   - Asset tracking and deduplication

4. **Provider Integration**
   - Providers dynamically loaded via `window.aether.providerScriptsBaseUrl`
   - `IProvider` interface defines provider contract
   - Config fields built via `ConfigFieldBuilder`
   - Each provider is isolated in its own file

**What JavaScript Handles:**
- All UI logic and rendering
- Data processing and transformation
- HTML parsing and manipulation
- Static site generation workflow
- Asset tracking and management
- URL discovery and processing
- State management (React + IndexedDB)

### REST API Endpoints

**Settings:**
- `GET /aether/site-exporter/settings` - Get plugin settings
- `POST /aether/site-exporter/settings` - Update settings

**Export Operations:**
- `POST /aether/site-exporter/export/createArchive` - Create WordPress archive
- `POST /aether/site-exporter/export/initArchive` - Initialize archive
- `POST /aether/site-exporter/export/finalizeArchive` - Finalize archive
- `POST /aether/site-exporter/export/generateBlueprintBundle` - Generate blueprint
- `GET /aether/site-exporter/export/steps/getHtmlContent` - Get HTML for URL

**Provider Management:**
- `GET/POST/DELETE /aether/site-exporter/providers/{providerId}/config` - Manage provider config
- `POST /aether/site-exporter/providers/{providerId}/test` - Test provider

**URL Discovery & Assets:**
- `POST /aether/site-exporter/url-discovery/discover` - Discover site URLs
- `GET /aether/site-exporter/assets/manifest` - Get assets manifest

**Local Storage:**
- `POST /aether/site-exporter/local-storage/upload` - Upload file
- `DELETE /aether/site-exporter/local-storage/delete` - Delete file
- `GET /aether/site-exporter/local-storage/download` - Download file

### State Management

**PHP:**
- Settings stored in `aether_site_exporter_settings` option
- Provider instance configs stored in settings array under `providers` key

**JavaScript:**
- Workflow state tracked in React state + IndexedDB (for resume-after-failure)
- Reactive updates via React contexts and hooks
- **Caching:** Only `wporgCache` remains (WordPress.org plugin/theme existence checks, 7-day TTL)

## Important Implementation Details

### WordPress Playground Compatibility

**Critical Files:**
- `PLAYGROUND_COMPATIBILITY.md` - Comprehensive compatibility analysis
- `TempDirectoryManager.php` - Universal temp directory solution
- `PathValidator.php` - Universal path validation
- `FileManager.php` - Persistent file operations

### Security Considerations

**Path Traversal Prevention:**
- All user-provided paths validated via `PathValidator`
- Reject `..` sequences, absolute paths, null bytes
- Validation occurs BEFORE filesystem operations

**Credential Encryption:**
- Provider credentials encrypted with `wp_salt('auth')`
- Hash-based integrity verification
- Stored in WordPress options (database)

**CORS Security:**
- Whitelisted origins only (Playground domains + same-origin)
- Local development requires `AETHER_ALLOW_LOCAL_CORS` constant
- Custom origins via `aether_site_exporter_cors_allowed_origins` filter

### Testing Practices

**JavaScript Tests:**
- Jest + React Testing Library
- Mock WordPress dependencies (`@wordpress/api-fetch`, etc.)
- Test files colocated with source in `__tests__` directories
- Follow TDD - write tests before implementation

**PHP Tests:**
- **Framework**: PHPUnit 9.6 with wp-phpunit integration
- **Test Organization**:
  - `tests/Unit/` - Unit tests for isolated components
  - `tests/Integration/` - Integration tests for REST API and workflows
  - `tests/Helpers/TestCase.php` - Base test case with helper methods
- **Coverage**: Tests cover security, business logic, and integration scenarios
- **Key Test Suites**:
  - **Security Tests**: PathValidator (path traversal, injection), CredentialEncryption
  - **Business Logic**: ProviderRegistry, FileManager, TempDirectoryManager
  - **Integration Tests**: ProviderConfigController (REST API with encryption)
- **Testing Philosophy**:
  - Tests catch bugs in implementation, not written just for coverage
  - Test edge cases, error conditions, and security boundaries
  - Test actual behavior, not implementation details
  - Mock providers for isolation, real WordPress functions for integration
- **Running Tests**:
  - `composer test` - Run all tests
  - `composer test:unit` - Unit tests only
  - `composer test:integration` - Integration tests only
  - `composer test -- --filter TestName` - Run specific test
- **Static Analysis**:
  - PHPStan (level 9) for type safety
  - PHP_CodeSniffer (WordPress Coding Standards)
  - PHP-CS-Fixer for auto-fixing
- **TDD Workflow**: Write tests before implementation

## Common Development Patterns

### Adding a New Provider (TDD Approach)

**1. Write Tests First**
```javascript
// assets/src/providers/my-provider/__tests__/index.test.js
describe('MyProvider', () => {
    it('should implement IProvider interface', () => {
        // Test all required methods exist
    });
});
```

**2. Create Provider Class (JavaScript)**
```javascript
// assets/src/providers/my-provider/MyProvider.js
import { AbstractProvider } from '@aether/providers/base/AbstractProvider';

class MyProvider extends AbstractProvider {
    getId() {
        return 'my-provider';
    }
    
    getName() {
        return 'My Provider';
    }
    
    // Implement ALL provider logic here - nothing in core
    getProviderSpecificConfigFields() {
        // Configuration fields
    }
    
    async uploadFile(sourcePath, destinationPath, options = {}) {
        // Upload implementation
    }
}
```

**3. Register Provider**
```javascript
// assets/src/providers/my-provider/index.js
import { MyProvider } from './MyProvider';
import ProviderRegistry from '@aether/providers/registry/ProviderRegistry';
import { doAction } from '@wordpress/hooks';

// Create and register provider
const provider = new MyProvider();
ProviderRegistry.register(provider.getId(), provider);
doAction('aether.providers.register', provider);
```

**Key Rules:**
- ALL provider logic stays in provider files
- NO provider-specific code in core architecture
- Each provider is completely self-contained
- Test first, then implement

### Adding a New Publish Step (TDD Approach)

**1. Write Tests First**
```javascript
// assets/src/export/steps/__tests__/myStep.test.js
describe('myStep', () => {
    it('should return standard response format', async () => {
        // Test implementation
    });
});
```

**2. Define Step Constant**
```javascript
// assets/src/constants/steps.js
export const STEP_MY_STEP = 'my_step';
```

**3. Create Step Function (Prefer JavaScript)**
```javascript
// assets/src/export/steps/myStep.js
export async function myStep(config) {
    // Implementation in JavaScript (preferred)
    // Workflow is stateless - no jobId needed
    // Returns standard response format
}
```

**4. Add to Workflow**
```javascript
// assets/src/export/utils/steps.js
// Add step to appropriate workflow
```

**5. Create REST Endpoint (If Needed)**
```php
// includes/REST/Export/ExportStepsController.php
// Add endpoint ONLY if server-side processing required
// Keep it thin - delegate to JavaScript when possible
```

### Adding New Settings (TDD Approach)

**1. Write Tests First**
```javascript
// Test settings UI and validation
```

**2. Add Setting to UI**
```javascript
// assets/src/admin-settings/
// Add field to settings form
```

**3. Register in REST Controller**
```php
// includes/REST/SettingsController.php
// Add validation and sanitization
```

**4. Add to Defaults**
```php
// Core/SettingsRepository.php
// Add default value
```

## Code Testability Guidelines

### General Principles

**Make code testable by design, not as an afterthought.**

1. **Prefer pure functions** - Functions that:
   - Take inputs as parameters (no hidden dependencies)
   - Return outputs (no side effects)
   - Always produce same output for same input
   - Example: `sanitizeKeyForStatus(key)`, `isExcludedUrl(url)`

2. **Use dependency injection** - Pass dependencies as parameters:
   ```javascript
   // Bad: Hard-coded dependency
   function processData() {
       const data = localStorage.getItem('key');
       return JSON.parse(data);
   }

   // Good: Dependency injected
   function processData(storage) {
       const data = storage.get('key');
       return data;
   }
   ```

3. **Abstract browser APIs** - Create thin wrappers:
   - `storage.js` - Wraps localStorage
   - `apiFetch` - Already abstracted via utils/api.js
   - Makes mocking easy in tests

4. **Separate pure logic from side effects**:
   ```javascript
   // Bad: Mixed concerns
   function processAndSave(html) {
       const processed = html.replace(...);
       localStorage.setItem('result', processed);
       return processed;
   }

   // Good: Separated
   function processHtml(html) {  // Pure, testable
       return html.replace(...);
   }

   function saveResult(processed, storage) {  // Side effect isolated
       storage.set('result', processed);
   }
   ```

### What to Test

**Always write tests for:**
- Pure utility functions (htmlProcessor, assetExclusions, etc.)
- Business logic functions
- Data transformations
- Configuration validation
- Edge cases and error conditions

**Don't worry about testing:**
- React hooks with complex dependencies (usePublishController)
- High-level orchestration functions (uploadFilesWithProgress)
- Simple pass-through wrappers

### Testing Utilities Already Available

**Storage abstraction** (`assets/src/utils/storage.js`):
```javascript
import { storage } from '../../utils/storage';

// In production code
storage.set('key', value);
const data = storage.get('key', defaultValue);

// In tests
jest.mock('../../utils/storage', () => ({
    storage: {
        get: jest.fn(),
        set: jest.fn(),
        // ... other methods
    }
}));
```

### Test File Organization

- Co-locate tests with source code
- Tests go in `__tests__/` subdirectory
- Test file naming: `filename.test.js` for `filename.js`
- Example: `assets/src/utils/__tests__/storage.test.js`

### Example: Making Code Testable

**Before (Hard to test):**
```javascript
function processAndUpload() {
    const html = fetch('/page').then(r => r.text());
    const processed = processHtml(html);
    localStorage.setItem('result', processed);
    return uploadToServer(processed);
}
```

**After (Easy to test):**
```javascript
// Pure function - easy to test
export function processHtml(html, siteUrl) {
    // ... processing logic
    return processed;
}

// Composition with injected dependencies
async function processAndUpload(fetcher, storage, uploader) {
    const html = await fetcher('/page');
    const processed = processHtml(html);
    storage.set('result', processed);
    return uploader(processed);
}
```

## WP-CLI Commands

```bash
# Convert provider configurations (migration utility)
wp aether convert-provider-configs
```

## File Organization

```
aether-site-exporter/
├── includes/              # PHP backend (thin REST API layer)
│   ├── Admin/            # WordPress admin integration
│   ├── CLI/              # WP-CLI commands
│   ├── Core/             # Core utilities (settings, etc.)
│   ├── (Providers directory removed - providers are JavaScript-only)
│   ├── REST/             # REST API controllers (provider-agnostic)
│   │   └── Publish/      # Publish workflow controllers
│   ├── Services/         # Business logic services (provider-agnostic)
│   ├── Sync/             # Sync/export logic
│   │   └── Blueprint/    # Blueprint generation
│   └── Utilities/        # Helper utilities (Playground-compatible)
│
├── assets/
│   ├── src/              # JavaScript source (primary logic layer)
│   │   ├── admin-settings/ # Settings page
│   │   ├── publish/      # Main publish feature
│   │   │   ├── components/ # React components
│   │   │   ├── hooks/    # Custom React hooks
│   │   │   ├── steps/    # Workflow step functions
│   │   │   ├── utils/    # Utilities (DOM, assets, etc.)
│   │   │   └── workflows/ # Workflow orchestration
│   │   ├── providers/    # Provider implementations (isolated)
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Shared hooks
│   │   ├── utils/        # Shared utilities
│   │   └── components/   # Shared components
│   └── build/            # Compiled assets (generated)
│
└── tests/                # Test files
```

## Dependencies

**PHP:**
- WordPress 6.4+
- PHP 7.4+ (8.1+ recommended)

**JavaScript:**
- React 18
- WordPress Components
- parse5 (HTML parsing - critical for browser-based generation)
- p-retry (retry logic)
- idb (IndexedDB wrapper - Playground-compatible storage)
- uuid (UUID generation)

## Build Configuration

**Webpack:**
- Disables code splitting (all code in single bundles)
- Dynamic imports set to `eager` mode
- No chunk files created
- Source maps removed from node_modules code
- Minification controlled via `MINIFY` env var (default: false for easier debugging)
