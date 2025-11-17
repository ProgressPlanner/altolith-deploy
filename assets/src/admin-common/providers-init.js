/**
 * Provider Initialization
 *
 * Ensures critical providers are registered before any code tries to use them.
 * This file is imported by admin-common to make providers available across all admin pages.
 *
 * @package
 */

// Import local-filesystem provider - this is the default/fallback provider
import '../providers/local-filesystem/index';
