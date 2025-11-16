# Aether

[![Tests](https://github.com/aristath/aether/workflows/Tests/badge.svg)](https://github.com/aristath/aether/actions)
[![PHP Version](https://img.shields.io/badge/php-7.4%2B-blue.svg)](https://php.net)
[![WordPress Version](https://img.shields.io/badge/wordpress-6.4%2B-blue.svg)](https://wordpress.org)
[![License](https://img.shields.io/badge/license-GPL--2.0%2B-green.svg)](LICENSE)

**Run WordPress serverless in the cloud and deploy as static sites - powered by Cloudflare**

Aether enables you to administer WordPress sites in WordPress Playground (browser-based WordPress) and deploy them as production-ready static sites to multiple cloud providers.

## ✨ Key Features

### 🌐 Multi-Provider Architecture
- **Cloudflare R2** - Object storage with static site hosting
- **Cloudflare Pages** - JAMstack deployment platform
- **GitHub Pages** - Static site hosting via GitHub
- **GitLab Pages** - Static site hosting via GitLab
- **DigitalOcean Spaces** - S3-compatible object storage

### 🚀 WordPress Playground Integration
- Administer sites in browser-based WordPress Playground
- Blueprint-based persistence (98% storage reduction)
- No traditional hosting required
- SQLite database support

### 📦 Media Offloading
- **Cloudflare Images** - Image optimization and delivery
- **Cloudflare Stream** - Video hosting and streaming
- **Cloudflare R2** - General media storage
- Automatic upload and URL rewriting

### 🔄 Static Site Generation
- Convert dynamic WordPress to static HTML
- Deploy to any supported provider
- Custom domain support
- Cache-optimized delivery

## 🎯 Quick Start

### Requirements

- WordPress 6.4+
- PHP 7.4+ (PHP 8.1+ recommended)
- Cloudflare account (for Workers and media offloading)
- One or more deployment providers (R2, GitHub, GitLab, Pages, Spaces)

### Installation

1. **Install the Plugin**
   ```bash
   cd wp-content/plugins
   git clone https://github.com/aristath/aether.git
   cd aether
   composer install
   npm install
   ```

2. **Activate the Plugin**
   - Go to WordPress Admin → Plugins
   - Activate "Aether"
   - You'll be redirected to the Setup Wizard

3. **Run the Setup Wizard**
   The wizard guides you through:
   - Step 1: Cloudflare credentials
   - Step 2: Playground persistence provider
   - Step 3: Media offloading configuration
   - Step 4: Static site deployment (optional)
   - Step 5: Automatic worker deployment

## 📖 Documentation

For detailed documentation, see the [docs/](docs/) directory:

- **[CLAUDE.md](CLAUDE.md)** - Complete developer guide for AI assistants
- **[docs/ARCHITECTURE-SUMMARY.md](docs/ARCHITECTURE-SUMMARY.md)** - Multi-provider architecture overview
- **[docs/MULTI-PROVIDER-ARCHITECTURE.md](docs/MULTI-PROVIDER-ARCHITECTURE.md)** - Detailed architecture documentation

## 🎨 Publishing Workflow

### 1. Create Content in WordPress Playground
- Administer your site in browser-based WordPress
- Install plugins, themes, create content
- No server setup required

### 2. Publish to Cloud
- Click "Publish Site" in the admin bar
- Site exports, uploads to configured provider
- Blueprint generated for Playground persistence

### 3. Deploy as Static Site (Optional)
- Enable static site generation in settings
- Configure deployment provider
- Automatic HTML generation and deployment

## 🛠️ Advanced Features

### Blueprint-Based Sync
- WordPress.org plugins/themes stored as JSON references
- 98% storage reduction compared to full uploads
- Automatic change detection and updates

### Edge Workers
Located in `assets/js/worker/` and provider directories, these workers enable browser-based uploads:

**Supported Edge Platforms**:
- **Cloudflare Workers** - Full support for all worker types (R2, Git, Media, Spaces)
- **Deno Deploy** - Supports Git, Media, and Spaces workers (R2 not compatible)
- **Vercel Edge Functions** - Supports Git, Media, and Spaces workers

**Worker Types**:
- **R2 Worker** - Proxies uploads to Cloudflare R2 (Cloudflare Workers only)
- **Git Worker** - Handles GitHub/GitLab API operations (all platforms)
- **Spaces Worker** - Proxies uploads to DigitalOcean Spaces (all platforms)
- **Media Worker** - Handles Cloudflare Images/Stream operations (all platforms)

### Smart Caching
- CDN-optimized cache headers
- Path-based cache rules
- Extension-based cache rules
- Custom cache control

### Media URL Rewriting
- Automatic URL rewriting for offloaded media
- Supports custom domains
- Seamless integration with WordPress media library

## 🧪 Code Quality

Aether maintains high code quality standards:

```bash
# PHP code standards (PSR-12 + WordPress)
composer check-cs                # Check coding standards
composer fix-cs                  # Fix coding standards automatically

# PHP static analysis (PHPStan Level 8)
composer phpstan                 # Run static analysis

# JavaScript/React code standards
npm run lint:js                  # Check JavaScript code
npm run lint:js:fix              # Fix JavaScript issues

# JavaScript tests (Jest)
npm run test:js                  # Run Jest unit tests
npm run test:js:coverage         # Run with coverage report

# Run all checks
composer check                   # PHP checks (PHPCS + PHPStan)
npm run lint:js                  # JavaScript checks
npm run test:js                  # JavaScript tests
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

GPL-2.0-or-later - see [LICENSE](LICENSE) for details.

## 🙏 Credits

**Author**: Aristeidis Stathopoulos ([@aristath](https://github.com/aristath))

**Technology Stack**:
- WordPress Playground
- Cloudflare Workers
- Cloudflare R2, Images, Stream, Pages
- GitHub/GitLab Pages
- DigitalOcean Spaces

---

**Aether** - *Greek god of pure upper air and clear sky. Personification of the bright upper atmosphere.*

Perfect for a plugin that runs WordPress in the cloud. ☁️
