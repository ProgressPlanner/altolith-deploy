# Security Best Practices

This document outlines security considerations and best practices for deploying and using the Altolith Deploy plugin.

## System Requirements

### Minimum Requirements
- **HTTPS Required**: This plugin uses SameSite=None cookies for iframe compatibility with WordPress Playground. HTTPS is **required** for secure cookie transmission. HTTP-only deployments will experience authentication issues and security vulnerabilities.
- **PHP 7.4+**: Minimum PHP version required. Older PHP versions lack critical security features used by this plugin.
- **WordPress 6.0+**: Minimum WordPress version required for REST API security features and modern authentication.

### Recommended Environment
- PHP 8.0+ for improved performance and security
- WordPress 6.4+ for latest security patches
- Modern web server (Apache 2.4+, Nginx 1.18+, or LiteSpeed)
- SSL/TLS certificate from trusted Certificate Authority

## Deployment Recommendations

### 1. SSL/TLS Configuration
- **Enable HTTPS** on your WordPress site before installing this plugin
- Use strong TLS configuration (TLS 1.2+ only)
- Implement HSTS (HTTP Strict Transport Security) headers
- Renew certificates before expiration

### 2. Access Control
- **Limit admin access** to trusted users only
- All plugin endpoints require `manage_options` capability
- Use strong admin passwords (16+ characters, mixed case, numbers, symbols)
- Enable two-factor authentication (2FA) for admin accounts
- Regularly audit user accounts and remove unused accounts

### 3. WordPress Hardening
- Keep WordPress core, themes, and plugins updated
- Disable file editing in wp-config.php: `define('DISALLOW_FILE_EDIT', true);`
- Limit login attempts (use plugins like Limit Login Attempts Reloaded)
- Change default database table prefix from `wp_`
- Disable XML-RPC if not needed
- Remove WordPress version information from headers

### 4. Server-Level Security
Consider implementing server-level rate limiting and security measures:
- **fail2ban** or similar for IP-based rate limiting
- **ModSecurity** (or equivalent WAF) with OWASP Core Rule Set
- **CloudFlare** or similar CDN/WAF service
- Regular security updates for operating system and server software

### 5. File Permissions
Set proper file permissions to prevent unauthorized modifications:
```bash
# Directories: 755
find /path/to/wordpress -type d -exec chmod 755 {} \;

# Files: 644
find /path/to/wordpress -type f -exec chmod 644 {} \;

# wp-config.php: 600 (more restrictive)
chmod 600 /path/to/wordpress/wp-config.php
```

## Plugin Security Features

### Authentication & Authorization
- **CSRF Protection**: All state-changing REST API endpoints use WordPress nonce verification
- **Permission Checks**: All endpoints require `manage_options` capability
- **Rate Limiting**: Prevents abuse via frequency-limited requests
  - Export creation: 5 requests per 5 minutes
  - Status polling: 60 requests per minute

### Data Protection
- **Credential Encryption**: Storage provider credentials are encrypted using AES-128-CBC
- **Path Traversal Prevention**: All file paths are validated and sanitized
- **Input Sanitization**: All user inputs are sanitized before processing
- **Output Escaping**: All outputs are properly escaped to prevent XSS

### File Security
- **File Type Validation**: Only web-safe file types allowed for uploads
- **File Size Limits**: Maximum 100MB per uploaded file
- **Automatic Cleanup**: Temporary export files deleted automatically after 1 hour
- **Path Validation**: Prevents directory traversal attacks (`../`, null bytes, etc.)

### CORS Security
- **Restricted Origins**: Only WordPress Playground and same-origin requests allowed
- **Debug Mode Restrictions**: Local development CORS requires explicit opt-in via `ALTOLITH_ALLOW_LOCAL_CORS` constant
- **Limited Ports**: Debug mode only allows common development ports (3000, 3001, 8000, 8080, 8888)

## Configuration Options

### Enable Local Development CORS
Add to `wp-config.php` for local development only:
```php
// WARNING: Only enable on development sites, never in production
if (defined('WP_DEBUG') && WP_DEBUG) {
    define('ALTOLITH_ALLOW_LOCAL_CORS', true);
}
```

### Increase Upload Limits (if needed)
To handle larger static site exports, increase PHP upload limits in `php.ini` or `.htaccess`:
```ini
; php.ini
upload_max_filesize = 200M
post_max_size = 200M
memory_limit = 512M
max_execution_time = 300
```

## Data Handling

### Sensitive Information
The plugin handles the following sensitive data:
- **Storage Provider Credentials**: Encrypted at rest, transmitted over HTTPS
- **Database Content**: Exported in SQLite format (may contain sensitive data)
- **File Uploads**: Temporary storage in `wp-content/uploads/altolith-temp/` directory

### Data Retention
- **Export Files**: Automatically deleted after 1 hour
- **Job Status**: Transients expire after 10 minutes
- **Encrypted Credentials**: Stored in WordPress options table until manually deleted

### Backup Procedures
**IMPORTANT**: Always backup your site before running exports:
1. **Database Backup**: Use WordPress backup plugins or manual export
2. **File Backup**: Backup `wp-content/` directory
3. **Test Exports**: Test on staging sites before production use
4. **Verify Integrity**: Check exported files are complete and valid

## Known Limitations

### WordPress Playground Compatibility
- Requires SameSite=None cookies which necessitate HTTPS
- Iframe-based authentication may be blocked by some browser privacy settings
- Not compatible with sites that set X-Frame-Options: DENY

### Export Limitations
- Large sites (>1GB) may timeout or exhaust memory
- Export process is single-threaded and may be slow for large datasets
- Temporary files stored in `wp-content/uploads/altolith-temp/` (ensure sufficient disk space)

### Security Considerations
- Exported files contain complete site data including credentials
- Static site exports may reveal WordPress structure/versions
- Blueprint bundles include database with user passwords (hashed)

## Reporting Security Issues

### Disclosure Policy
We take security seriously. If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. **DO** email security concerns privately to: [security contact - to be added]
3. **Include**:
   - Detailed description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if available)

### Response Timeline
- **Initial Response**: Within 48 hours
- **Severity Assessment**: Within 5 business days
- **Fix Development**: Varies based on severity
  - Critical: 1-3 days
  - High: 1-2 weeks
  - Medium/Low: Next regular release

### Responsible Disclosure
We request a **90-day** disclosure timeline to allow users time to update:
1. Vulnerability reported privately
2. Fix developed and tested
3. Security release published
4. 30 days for user adoption
5. Public disclosure with credit to reporter (if desired)

## Additional Resources

- [WordPress Security Best Practices](https://wordpress.org/support/article/hardening-wordpress/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PHP Security Best Practices](https://www.php.net/manual/en/security.php)
- [WordPress REST API Security](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/)

## License

This security documentation is part of the Altolith Deploy plugin and is released under the GPL v2 or later license.
