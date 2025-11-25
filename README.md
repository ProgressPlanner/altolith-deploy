# Aether Site Exporter

[![Tests](https://github.com/aristath/aether/workflows/Tests/badge.svg)](https://github.com/aristath/aether/actions)
[![PHP Version](https://img.shields.io/badge/php-7.4%2B-blue.svg)](https://php.net)
[![WordPress Version](https://img.shields.io/badge/wordpress-6.4%2B-blue.svg)](https://wordpress.org)
[![License](https://img.shields.io/badge/license-GPL--2.0%2B-green.svg)](LICENSE)

**Export WordPress sites as static HTML or WordPress Playground blueprint bundles**

Aether Site Exporter enables you to export WordPress sites to static HTML files or create WordPress Playground blueprints, all stored locally on your server's filesystem.

## ✨ Key Features

### 📦 Static Site Export
- Convert dynamic WordPress to static HTML
- Export to local filesystem
- Complete site archiving with all assets
- Cache-optimized static pages

### 🚀 WordPress Playground Integration
- Create Playground blueprint bundles
- Blueprint-based site export (98% storage reduction)
- SQLite database support
- No cloud hosting required

### 🔄 Export Formats
- **Static HTML** - Complete static website export
- **Blueprint Bundle** - WordPress Playground blueprint format
- **Archive** - ZIP files for easy transfer

## 🎯 Quick Start

### Requirements

- WordPress 6.4+
- PHP 7.4+ (PHP 8.1+ recommended)
- Writable `wp-content/aether-exports` directory

### Installation

1. **Install the Plugin**
   ```bash
   cd wp-content/plugins
   git clone https://github.com/aristath/aether-site-exporter.git
   ```

2. **Install Dependencies**
   ```bash
   cd aether-site-exporter
   composer install
   npm install
   npm run build
   ```

3. **Activate the Plugin**
   - Go to WordPress Admin → Plugins
   - Activate "Aether Site Exporter"

4. **Configure Export Settings**
   - Go to Settings → Aether Export
   - Configure export options as needed

## 📖 Usage

### Creating an Export

1. Navigate to **Aether Export** in the WordPress admin
2. Click **Create New Export**
3. Select export type (Static HTML or Blueprint)
4. Configure export options
5. Click **Start Export**

### Accessing Exports

Exports are stored in `wp-content/aether-exports/` directory. Each export is contained in its own subdirectory with:
- Static HTML files
- Assets (images, CSS, JS)
- Database exports (if applicable)
- Blueprint files (for Playground exports)

### Downloading Exports

Exports can be downloaded as ZIP archives directly from the WordPress admin interface.

## 🌐 WordPress Playground Compatibility

This plugin is designed to work universally across all WordPress environments, including **WordPress Playground** (browser-based WASM environment).

### Universal Architecture

The plugin uses a universal implementation approach - no environment detection, no conditional code paths. All features work identically in traditional hosting and WordPress Playground.

### Key Compatibility Features

- **Universal Temp Directory**: Uses `wp-content/uploads/aether-temp` instead of system temp directory
- **Universal Path Validation**: Works without `realpath()` in WASM environments
- **Configurable Post Limits**: Prevents timeouts on large sites (default: 10,000 posts)
- **Browser-Based Generation**: Static site generation runs in browser to avoid PHP timeouts
- **WordPress.org API**: Browser-based asset detection using CORS proxy
- **Memory Protection**: IndexedDB caching prevents browser memory exhaustion

### Limitations

- **Temporary Storage**: Files in `wp-content/uploads/aether-temp` are cleaned up after 1 hour
- **Post Limits**: Default limit of 10,000 posts/pages for URL discovery
- **WordPress.org API**: Detection happens browser-side using CORS proxy or direct API calls

### Technical Details

See [PLAYGROUND_COMPATIBILITY.md](PLAYGROUND_COMPATIBILITY.md) for comprehensive technical documentation.

## 🛠 Development

### Build Commands

```bash
# Development build
npm run build:dev

# Production build
npm run build

# Watch mode
npm start

# Run tests
npm run test:js
composer test

# Linting
npm run lint:js
composer lint
```

### File Structure

```
aether-site-exporter/
├── assets/
│   ├── src/          # Source JavaScript/React files
│   │   ├── export/   # Export workflow (step-based executor system)
│   │   ├── providers/# Provider implementations
│   │   ├── components/# Shared React components
│   │   ├── hooks/    # Custom React hooks
│   │   └── utils/    # Utility functions
│   └── build/        # Compiled assets
├── includes/
│   ├── REST/         # REST API controllers
│   ├── Services/     # Core services
│   └── Utilities/    # Helper utilities
├── tests/            # PHP and JavaScript tests
└── webpack.config.js # Build configuration
```

## 🔧 REST API

The plugin provides REST API endpoints (namespace: `aether/site-exporter`):

### Settings

- `GET /wp-json/aether/site-exporter/settings` - Get plugin settings
- `POST /wp-json/aether/site-exporter/settings` - Update settings

### Export Operations

- `POST /wp-json/aether/site-exporter/export` - Start export workflow
- `GET /wp-json/aether/site-exporter/export/status` - Get export status
- `POST /wp-json/aether/site-exporter/export/steps/{stepId}` - Execute workflow step
- `POST /wp-json/aether/site-exporter/export/cancel` - Cancel running export
- `POST /wp-json/aether/site-exporter/export/createArchive` - Create WordPress archive
- `POST /wp-json/aether/site-exporter/export/generateBlueprintBundle` - Generate blueprint bundle

### Provider Configuration

- `GET/POST/DELETE /wp-json/aether/site-exporter/providers/{providerId}/config` - Manage provider config
- `POST /wp-json/aether/site-exporter/providers/{providerId}/test` - Test provider connection

### URL Discovery

- `POST /wp-json/aether/site-exporter/url-discovery/discover` - Discover site URLs
- `GET /wp-json/aether/site-exporter/url-discovery/posts` - Get posts for URL discovery
- `GET /wp-json/aether/site-exporter/url-discovery/terms` - Get terms for URL discovery
- `GET /wp-json/aether/site-exporter/url-discovery/authors` - Get authors for URL discovery

### Assets

- `GET /wp-json/aether/site-exporter/assets/manifest` - Get assets manifest

### Local Storage

- `POST /wp-json/aether/site-exporter/local-storage/upload` - Upload file to local storage
- `GET /wp-json/aether/site-exporter/local-storage/download` - Download file from local storage
- `DELETE /wp-json/aether/site-exporter/local-storage/delete` - Delete file from local storage
- `GET /wp-json/aether/site-exporter/local-storage/list` - List files in local storage

**Note**: The export workflow uses a step-based executor system with dependency resolution. Steps register themselves via WordPress hooks and declare their data dependencies. All workflow state is stored client-side in IndexedDB, not on the server.

## 🧪 Testing

### PHP Tests

```bash
composer test
```

### JavaScript Tests

```bash
npm run test:js

# With coverage
npm run test:js:coverage

# Watch mode
npm run test:js:watch
```

## 🔍 Troubleshooting

### Export Directory Not Writable

Ensure the export directory has proper permissions:

```bash
chmod 755 wp-content/aether-exports
```

### Memory Limit Issues

For large sites, increase PHP memory limit in `wp-config.php`:

```php
define( 'WP_MEMORY_LIMIT', '512M' );
```

### Timeout Issues

Increase PHP max execution time in `php.ini` or `.htaccess`:

```ini
max_execution_time = 300
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GPL-2.0+ License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

Built with:
- [WordPress](https://wordpress.org/)
- [React](https://reactjs.org/)
- [@wordpress/scripts](https://www.npmjs.com/package/@wordpress/scripts)
- [WordPress Playground](https://wordpress.github.io/wordpress-playground/)

## 📧 Support

For issues and questions:
- [GitHub Issues](https://github.com/aristath/aether-site-exporter/issues)
- [Documentation](https://github.com/aristath/aether-site-exporter/wiki)
