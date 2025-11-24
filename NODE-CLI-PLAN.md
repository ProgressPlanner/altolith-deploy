# Node.js CLI Export Tool - Implementation Plan

This plan outlines the creation of a Node.js CLI tool that reuses the existing JavaScript export logic to enable headless, automated site exports.

## Phase 1: Extract Core Export Logic (Universal Modules)

**Goal:** Refactor existing browser-specific code into universal modules that work in both browser and Node.js

### Steps:

1. **Create `assets/src/core/` directory** for universal modules
   - Move pure logic from export utilities
   - Remove React/browser dependencies
   - Add Node.js compatibility checks

2. **Extract and adapt these modules:**
   - `core/htmlProcessor.js` - Already uses parse5 (Node-compatible!)
   - `core/urlRewriter.js` - Pure string manipulation
   - `core/assetExtractor.js` - Pattern matching
   - `core/blueprintGenerator.js` - JSON generation
   - `core/exportOrchestrator.js` - Workflow logic
   - `core/providerAdapter.js` - Provider system interface

3. **Create abstraction layer for platform-specific operations:**
   ```javascript
   // core/platform.js
   export const platform = {
     fetch: (url, options) => { /* browser: fetch, node: node-fetch */ },
     storage: { /* browser: localStorage, node: fs */ },
     progress: { /* browser: callbacks, node: progress bars */ }
   };
   ```

4. **Update existing browser code to use core modules**
   - Keep React hooks/components
   - Import from `core/` instead of local utils
   - Verify builds still work

## Phase 2: Create Node.js Package Structure

**Goal:** Set up a separate npm package for the CLI tool

### Steps:

1. **Create new directory structure:**
   ```
   packages/
   └── cli/
       ├── package.json
       ├── bin/
       │   └── aether-export.js (CLI entry point)
       ├── src/
       │   ├── commands/
       │   │   ├── static-site.js
       │   │   └── blueprint.js
       │   ├── api/
       │   │   └── wordpress-client.js (REST API wrapper)
       │   ├── auth/
       │   │   └── application-password.js (WordPress Application Password handling)
       │   ├── output/
       │   │   └── progress.js (terminal UI)
       │   └── config/
       │       └── loader.js (config file handling)
       └── README.md
   ```

2. **Create package.json with dependencies:**
   ```json
   {
     "name": "@aether/cli-exporter",
     "version": "1.0.0",
     "description": "CLI tool for exporting WordPress sites",
     "bin": {
       "aether-export": "./bin/aether-export.js"
     },
     "dependencies": {
       "commander": "^11.0.0",
       "node-fetch": "^3.3.0",
       "parse5": "^7.1.0",
       "chalk": "^5.3.0",
       "ora": "^7.0.0",
       "conf": "^12.0.0",
       "inquirer": "^9.2.0"
     }
   }
   ```

3. **Set up build system:**
   - Add webpack/esbuild config for CLI bundle
   - Link to core modules from main plugin
   - Handle dual CJS/ESM exports

## Phase 3: Implement WordPress Application Password Authentication

**Goal:** Create secure authentication using WordPress Application Passwords (available since WP 5.6)

### Steps:

1. **Create `packages/cli/src/auth/application-password.js`:**
   ```javascript
   /**
    * WordPress Application Password Authentication
    *
    * Uses native WordPress Application Passwords feature.
    * No plugins required - built into WordPress 5.6+
    *
    * Format: Basic Auth with base64(username:app_password)
    */

   class ApplicationPasswordAuth {
     constructor(username, appPassword) {
       this.username = username;
       this.appPassword = appPassword.replace(/\s/g, ''); // Remove spaces
       this.authHeader = this.generateAuthHeader();
     }

     generateAuthHeader() {
       const credentials = `${this.username}:${this.appPassword}`;
       const base64 = Buffer.from(credentials).toString('base64');
       return `Basic ${base64}`;
     }

     getHeaders() {
       return {
         'Authorization': this.authHeader,
         'Content-Type': 'application/json'
       };
     }

     // Test authentication
     async verify(wpUrl) {
       const response = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
         headers: this.getHeaders()
       });

       if (!response.ok) {
         throw new Error('Authentication failed. Check username and application password.');
       }

       return await response.json();
     }
   }
   ```

2. **Add interactive password generation wizard:**
   ```javascript
   // Guides users through creating Application Password in WordPress
   async function setupApplicationPassword() {
     console.log(chalk.cyan('\n📝 WordPress Application Password Setup\n'));
     console.log('1. Log into your WordPress admin dashboard');
     console.log('2. Go to Users → Profile');
     console.log('3. Scroll to "Application Passwords" section');
     console.log('4. Enter a name (e.g., "CLI Exporter")');
     console.log('5. Click "Add New Application Password"');
     console.log('6. Copy the generated password\n');

     const { username, appPassword } = await inquirer.prompt([
       {
         type: 'input',
         name: 'username',
         message: 'WordPress username:'
       },
       {
         type: 'password',
         name: 'appPassword',
         message: 'Application password (from WordPress):',
         mask: '*'
       }
     ]);

     return { username, appPassword };
   }
   ```

3. **Add secure credential storage:**
   ```javascript
   // Store credentials securely using conf package
   import Conf from 'conf';

   const config = new Conf({
     projectName: 'aether-exporter',
     encryptionKey: 'user-specific-key' // Uses OS keychain when available
   });

   // Save credentials
   config.set('credentials', { username, appPassword });

   // Retrieve credentials
   const creds = config.get('credentials');
   ```

## Phase 4: Implement WordPress REST API Client

**Goal:** Create Node.js client with Application Password authentication

### Steps:

1. **Create `packages/cli/src/api/wordpress-client.js`:**
   ```javascript
   import { ApplicationPasswordAuth } from '../auth/application-password.js';

   class WordPressClient {
     constructor(wpUrl, username, appPassword) {
       this.wpUrl = wpUrl.replace(/\/$/, ''); // Remove trailing slash
       this.auth = new ApplicationPasswordAuth(username, appPassword);
       this.restBase = `${this.wpUrl}/wp-json`;
     }

     // Verify authentication on initialization
     async authenticate() {
       const user = await this.auth.verify(this.wpUrl);
       console.log(chalk.green(`✓ Authenticated as ${user.name}`));
       return user;
     }

     // Aether REST API endpoints
     async getUrls(type) {
       return this.request(`/aether/site-exporter/urls/${type}`);
     }

     async getHtmlContent(url) {
       return this.request('/aether/site-exporter/export/steps/getHtmlContent', {
         method: 'GET',
         params: { url }
       });
     }

     async getSettings() {
       return this.request('/aether/site-exporter/settings');
     }

     async getProviderConfig(instanceId) {
       return this.request(`/aether/site-exporter/providers/${instanceId}/config`);
     }

     async uploadFile(instanceId, path, content) {
       return this.request('/aether/site-exporter/local-storage/upload', {
         method: 'POST',
         body: { path, content, provider_instance_id: instanceId }
       });
     }

     // Generic request handler with retry logic
     async request(endpoint, options = {}) {
       const url = `${this.restBase}${endpoint}`;
       const headers = this.auth.getHeaders();

       const response = await fetch(url, {
         ...options,
         headers: { ...headers, ...options.headers }
       });

       if (!response.ok) {
         throw new Error(`API request failed: ${response.statusText}`);
       }

       return await response.json();
     }
   }
   ```

2. **Add authentication error handling:**
   - Detect expired application passwords
   - Clear error messages for common issues
   - Guide users to regenerate passwords

3. **Support for .env files:**
   ```bash
   # .env
   WP_URL=https://example.com
   WP_USERNAME=admin
   WP_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

## Phase 5: Implement CLI Commands

**Goal:** Create command-line interface with Application Password authentication

### Steps:

1. **Create main CLI entry point (`bin/aether-export.js`):**
   ```bash
   #!/usr/bin/env node

   import { Command } from 'commander';
   import { staticSiteCommand } from './commands/static-site.js';
   import { blueprintCommand } from './commands/blueprint.js';
   import { configCommand } from './commands/config.js';

   const program = new Command();
   program
     .name('aether-export')
     .description('Export WordPress sites as static HTML or blueprints')
     .version('1.0.0');

   program.addCommand(staticSiteCommand);
   program.addCommand(blueprintCommand);
   program.addCommand(configCommand); // Setup wizard
   program.parse();
   ```

2. **Implement `config` command for setup:**
   ```bash
   # Interactive setup wizard
   aether-export config

   # Set credentials directly
   aether-export config \
     --wp-url https://example.com \
     --username admin \
     --app-password "xxxx xxxx xxxx xxxx"
   ```

3. **Implement `static-site` command:**
   ```bash
   # Using saved credentials
   aether-export static-site \
     --provider local-filesystem \
     --output ./dist

   # Or specify credentials inline
   aether-export static-site \
     --wp-url https://example.com \
     --username admin \
     --app-password "xxxx xxxx xxxx xxxx" \
     --provider local-filesystem \
     --output ./dist

   # From .env file
   aether-export static-site --env-file .env --output ./dist
   ```

4. **Implement `blueprint` command:**
   ```bash
   aether-export blueprint \
     --output ./blueprint-bundle.zip
   ```

5. **Add credential precedence:**
   - CLI arguments (highest priority)
   - Environment variables
   - Saved config file
   - Interactive prompts (if nothing provided)

## Phase 6: Adapt Export Workflow for Node

**Goal:** Port browser export workflow to Node.js

### Steps:

1. **Create Node.js workflow orchestrator:**
   - Import core modules from Phase 1
   - Replace browser APIs with Node equivalents
   - Add terminal progress indicators (ora, chalk)

2. **Implement export steps:**
   - URL discovery (via REST API with Application Password auth)
   - HTML fetching (node-fetch with auth headers)
   - HTML processing (core modules)
   - Asset extraction (core modules)
   - File writing (fs/promises)
   - Blueprint generation (core modules)

3. **Handle state management:**
   - Replace IndexedDB with file-based state
   - Save progress to `.aether-export-state.json`
   - Support resume on failure

4. **Add progress reporting:**
   ```javascript
   ✓ Authenticated as Admin (Application Password)
   ✓ Discovered 150 URLs
   ⠋ Processing URLs... 45/150 (30%)
   ⠋ Extracting assets... 234 unique assets found
   ```

## Phase 7: Testing & Documentation

**Goal:** Ensure reliability and provide clear documentation

### Steps:

1. **Write tests:**
   - Unit tests for core modules
   - Integration tests for CLI commands
   - Application Password authentication tests
   - E2E tests with test WordPress site

2. **Create comprehensive documentation:**

   **README.md sections:**
   - Installation: `npm install -g @aether/cli-exporter`
   - Authentication setup with Application Passwords
   - Basic usage examples
   - Advanced configuration
   - Troubleshooting

   **Authentication Guide:**
   ```markdown
   ## Setting Up WordPress Application Passwords

   1. Log into WordPress admin dashboard
   2. Navigate to Users → Your Profile
   3. Scroll to "Application Passwords" section
   4. Enter a name: "Aether CLI Exporter"
   5. Click "Add New Application Password"
   6. Copy the generated password (format: xxxx xxxx xxxx xxxx)
   7. Use with CLI:

      aether-export config \
        --username YOUR_USERNAME \
        --app-password "PASTE_PASSWORD_HERE"

   ## Security Notes

   - Application Passwords can be revoked individually
   - They don't expose your main WordPress password
   - Store securely - don't commit to version control
   - Use environment variables in CI/CD
   ```

3. **Add example configurations:**

   **GitHub Actions:**
   ```yaml
   # .github/workflows/export-site.yml
   name: Export Site
   on:
     schedule:
       - cron: '0 2 * * *' # Daily at 2 AM

   jobs:
     export:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm install -g @aether/cli-exporter
         - run: |
             aether-export static-site \
               --wp-url ${{ secrets.WP_URL }} \
               --username ${{ secrets.WP_USERNAME }} \
               --app-password ${{ secrets.WP_APP_PASSWORD }} \
               --output ./dist
         - uses: actions/upload-artifact@v3
           with:
             name: static-site
             path: ./dist
   ```

   **GitLab CI:**
   ```yaml
   # .gitlab-ci.yml
   export-site:
     image: node:18
     script:
       - npm install -g @aether/cli-exporter
       - aether-export static-site \
           --wp-url $WP_URL \
           --username $WP_USERNAME \
           --app-password $WP_APP_PASSWORD \
           --output ./dist
     artifacts:
       paths:
         - dist/
   ```

   **Docker:**
   ```dockerfile
   FROM node:18-alpine
   RUN npm install -g @aether/cli-exporter

   # Use environment variables for credentials
   ENV WP_URL=""
   ENV WP_USERNAME=""
   ENV WP_APP_PASSWORD=""

   CMD ["aether-export", "static-site", "--output", "/export"]
   ```

## Phase 8: Polish & Release

**Goal:** Prepare for production use

### Steps:

1. **Add quality-of-life features:**
   - Config file support (`.aetherrc`)
   - Environment variable support
   - Verbose/debug logging modes
   - Dry-run mode (preview without export)
   - Credential validation command

2. **Security hardening:**
   - Never log application passwords
   - Secure credential storage
   - Warning when credentials in CLI args (visible in process list)
   - Recommend environment variables for CI/CD

3. **Performance optimizations:**
   - Concurrent URL processing
   - Caching of API responses
   - Streaming file writes for large exports
   - Connection pooling

4. **Error handling:**
   - Detect invalid application passwords
   - Graceful degradation
   - Clear error messages
   - Retry logic for transient failures
   - Guide users to WordPress Application Password setup

5. **Prepare for npm publish:**
   - Add LICENSE
   - Polish README with Application Password focus
   - Add CHANGELOG
   - Set up semantic versioning
   - Publish to npm as `@aether/cli-exporter`

---

## Deliverables

1. ✅ **Universal core modules** - Reusable in both browser and Node
2. ✅ **Node.js CLI package** - `@aether/cli-exporter`
3. ✅ **WordPress REST API client** - With Application Password authentication
4. ✅ **CLI commands** - `config`, `static-site`, and `blueprint` commands
5. ✅ **Complete documentation** - Application Password setup, usage, CI/CD examples
6. ✅ **Tests** - Unit, integration, and E2E tests
7. ✅ **npm package** - Published and ready to use

---

## Authentication Flow

```
User creates Application Password in WordPress
           ↓
Stores in CLI via: aether-export config
           ↓
CLI encrypts and saves to local config
           ↓
On export: CLI sends Basic Auth header
           ↓
WordPress validates Application Password
           ↓
CLI accesses REST API endpoints
```

---

## Timeline Estimate

- **Phase 1-2:** 3-4 days (setup and extraction)
- **Phase 3:** 2 days (Application Password authentication)
- **Phase 4:** 2-3 days (API client)
- **Phase 5:** 2-3 days (CLI commands)
- **Phase 6:** 4-5 days (workflow adaptation)
- **Phase 7:** 3-4 days (testing and docs with auth guide)
- **Phase 8:** 2-3 days (polish, security, release)

**Total:** ~3 weeks for full implementation

---

## Success Criteria

- ✅ Can export static site from command line
- ✅ Works with both local and remote WordPress
- ✅ **Authentication via WordPress Application Passwords (no custom auth)**
- ✅ Secure credential storage with OS keychain integration
- ✅ Progress reporting in terminal
- ✅ Error handling and recovery
- ✅ ~70% code reuse from existing JavaScript
- ✅ Published to npm
- ✅ CI/CD examples working with secrets management
- ✅ Clear Application Password setup documentation

---

**This plan uses WordPress's built-in Application Password feature (available since WP 5.6) - no plugins or custom authentication required!**
