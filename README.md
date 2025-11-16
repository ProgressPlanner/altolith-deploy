# Aether Site Exporter

Export WordPress sites as static HTML or WordPress Playground blueprint bundles.

## Description

Aether Site Exporter is a WordPress plugin that enables you to export your WordPress site into two portable formats:

1. **Static HTML Site** - Complete static HTML version with all pages, posts, and media files
2. **WordPress Playground Blueprint Bundle** - A blueprint bundle compatible with WordPress Playground for browser-based WordPress environments

## Features

- 🚀 **Complete Static Site Generation** - Exports all pages, posts, categories, tags, custom post types, authors, and date archives
- 📦 **Blueprint Bundle Creation** - WordPress Playground-compatible bundles with SQLite database
- 🎯 **URL Rewriting** - Automatically rewrites URLs for the target domain
- 📊 **Job Management** - Track export progress, view history, and download completed exports
- 🔒 **Secure Downloads** - Protected file serving with path validation
- 🗂️ **Database Persistence** - Export jobs stored in dedicated database table
- ⚡ **REST API** - Full REST API for programmatic access
- 🎨 **Modern UI** - React-based admin interface with real-time progress tracking
- 🧹 **Automatic Cleanup** - Scheduled daily cleanup of old exports (30+ days)
- 💻 **WP-CLI Support** - Command-line tools for cleanup and statistics

## Installation

1. Upload the plugin files to `/wp-content/plugins/aether-site-exporter/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Access the exporter via **Tools → Export Site**

## Usage

### Creating a Static Site Export

1. Navigate to **Tools → Export Site**
2. Check **Export Static Site**
3. Enter the **Target URL** where your static site will be hosted
4. Click **Start Export**
5. Wait for the export to complete
6. Download the ZIP file from the job history

### Creating a Blueprint Bundle

1. Navigate to **Tools → Export Site**
2. Check **Export WordPress Playground Blueprint Bundle**
3. Click **Start Export**
4. Wait for the export to complete
5. Download the blueprint ZIP from the job history

**Note:** Blueprint export requires a SQLite database. Install the [SQLite Database Integration](https://wordpress.org/plugins/sqlite-database-integration/) plugin first.

### Managing Export Jobs

The job history table shows:
- Export date and time
- Current status (pending, running, complete, failed)
- Download buttons for completed exports
- Delete button to remove old exports

## WP-CLI Commands

### Cleanup Old Exports

Clean up export jobs and files older than specified days:

```bash
# Clean up jobs older than 30 days (default)
wp aether-exporter cleanup

# Clean up jobs older than 7 days
wp aether-exporter cleanup --days=7

# Preview what would be deleted (dry run)
wp aether-exporter cleanup --dry-run
```

### Cleanup Failed Jobs

Clean up failed jobs older than specified hours:

```bash
# Clean up failed jobs older than 24 hours (default)
wp aether-exporter cleanup-failed

# Clean up failed jobs older than 1 hour
wp aether-exporter cleanup-failed --hours=1
```

### View Statistics

View export statistics (job count, file count, disk usage):

```bash
wp aether-exporter stats
```

## Automatic Cleanup

The plugin automatically runs a daily cleanup job that removes:
- Export jobs older than 30 days
- Associated export files

The cleanup is scheduled via WordPress cron and runs once per day.

## REST API

### Endpoints

#### Create Export Job
```
POST /wp-json/aether-site-exporter/v1/export
```

**Body:**
```json
{
  "exportTypes": {
    "staticSite": true,
    "blueprint": false
  },
  "targetUrl": "https://example.com"
}
```

#### Get Job Status
```
GET /wp-json/aether-site-exporter/v1/export/{jobId}/status
```

#### Update Job Status
```
POST /wp-json/aether-site-exporter/v1/export/{jobId}/status
```

**Body:**
```json
{
  "status": "complete"
}
```

#### Discover URLs
```
POST /wp-json/aether-site-exporter/v1/export/{jobId}/discover-urls
```

#### Create Static Site Archive
```
POST /wp-json/aether-site-exporter/v1/export/{jobId}/create-archive
```

#### Generate Blueprint Bundle
```
POST /wp-json/aether-site-exporter/v1/export/{jobId}/generate-blueprint
```

#### Cleanup Temporary Files
```
POST /wp-json/aether-site-exporter/v1/export/{jobId}/cleanup
```

#### Get All Jobs
```
GET /wp-json/aether-site-exporter/v1/export/jobs
```

#### Delete Job
```
DELETE /wp-json/aether-site-exporter/v1/export/{jobId}
```

#### Download Static Site
```
GET /wp-json/aether-site-exporter/v1/download/{jobId}/static-site
```

#### Download Blueprint
```
GET /wp-json/aether-site-exporter/v1/download/{jobId}/blueprint
```

### Authentication

All endpoints require the `manage_options` capability (administrator access).

## Architecture

### Backend (PHP)

**Services:**
- `URLDiscoveryService` - Discovers all URLs on the site (posts, pages, archives, etc.)
- `StaticSiteGenerator` - Generates static HTML files and creates ZIP archives
- `BlueprintBundleExporter` - Creates WordPress Playground blueprint bundles
- `HTTPClient` - HTTP client with error handling for internal requests

**REST Controllers:**
- `ExportJobController` - Manages export jobs (create, status, list, delete)
- `ExportStepsController` - Handles workflow steps (discover, generate, cleanup)
- `DownloadController` - Secure file serving

**Database:**
- `JobStateManager` - Manages job state in `wp_aether_export_jobs` table

### Frontend (React)

**Components:**
- `ExportInterface` - Main export UI with configuration form, progress tracking, and job history

**Features:**
- Real-time progress tracking via polling
- Job history with download links
- Error handling and recovery
- Form validation

## File Structure

```
aether-site-exporter/
├── includes/
│   ├── Plugin.php                     # Main plugin class
│   ├── Services/
│   │   ├── StaticSiteGenerator.php   # Static site generation
│   │   ├── BlueprintBundleExporter.php # Blueprint creation
│   │   └── URLDiscoveryService.php   # URL discovery
│   ├── REST/
│   │   ├── ExportJobController.php    # Job management
│   │   ├── ExportStepsController.php  # Workflow steps
│   │   ├── DownloadController.php     # File downloads
│   │   └── RESTHelpersTrait.php       # Shared utilities
│   ├── Sync/
│   │   └── JobStateManager.php        # Database operations
│   └── Utilities/
│       └── HTTPClient.php             # HTTP wrapper
├── assets/
│   ├── src/
│   │   ├── admin.js                   # Entry point
│   │   └── components/
│   │       └── ExportInterface.js     # Main UI component
│   └── build/                         # Compiled assets
├── tests/
│   └── php/unit/                      # PHPUnit tests
├── aether-site-exporter.php           # Main plugin file
├── package.json                       # NPM dependencies
├── composer.json                      # PHP dependencies
└── webpack.config.js                  # Build configuration
```

## Database Schema

**Table:** `wp_aether_export_jobs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | varchar(255) | Job ID (format: `export_timestamp_randomchars`) |
| `status` | varchar(20) | Job status (pending, running, complete, failed) |
| `current_step` | varchar(50) | Current workflow step |
| `workflow_state` | longtext | JSON object with step-specific state |
| `config` | longtext | JSON object with export configuration |
| `error_message` | text | Error details if job failed |
| `created_at` | datetime | Job creation timestamp |
| `updated_at` | datetime | Last update timestamp |

## Export Workflow

1. **Create Job** - Initialize export job in database
2. **Discover URLs** - Find all URLs to export using `URLDiscoveryService`
3. **Generate Static Site** (if requested)
   - Fetch HTML for each URL
   - Rewrite URLs for target domain
   - Remove admin bar
   - Copy upload directory
   - Create ZIP archive
4. **Generate Blueprint** (if requested)
   - Check for SQLite database
   - Create blueprint.json
   - Package SQLite database
   - Create bundle ZIP
5. **Cleanup** - Remove temporary files, keep ZIP archives
6. **Mark Complete** - Update job status in database

## URL Discovery

The `URLDiscoveryService` discovers:
- Homepage
- All published posts and pages
- Category archives
- Tag archives
- Custom post type archives
- Author archives
- Date-based archives (last 12 months)
- Pagination links
- Internal links (when crawling enabled)

Crawling is **disabled by default** for performance. Set `enableCrawling = true` to enable.

## Requirements

- WordPress 6.4+
- PHP 7.4+
- SQLite Database Integration plugin (for blueprint exports)

## Development

### Build Frontend

```bash
npm install
npm run build
```

### Run Tests

```bash
# PHP tests
composer test

# PHP static analysis
composer phpstan
```

## Security

- All REST endpoints require `manage_options` capability
- Export files protected by `.htaccess`
- Path validation prevents directory traversal
- File downloads use secure streaming
- Job IDs validated with regex pattern

## Hooks

### Filters

None currently available.

### Actions

None currently available.

## Troubleshooting

### Static Site Export Issues

**Problem:** Export fails with timeout
- **Solution:** Reduce the number of URLs by implementing URL filtering

**Problem:** Images not showing in static site
- **Solution:** Ensure upload directory is readable and contains files

### Blueprint Export Issues

**Problem:** "SQLite database not found" error
- **Solution:** Install [SQLite Database Integration](https://wordpress.org/plugins/sqlite-database-integration/) plugin

**Problem:** Blueprint fails to import in Playground
- **Solution:** Ensure blueprint.json follows the official spec

## Support

For issues, feature requests, or contributions:
- GitHub: https://github.com/aristath/aether-site-exporter

## License

GPL-2.0-or-later

## Credits

Developed by Ari Stathopoulos

Part of the Aether plugin suite.
