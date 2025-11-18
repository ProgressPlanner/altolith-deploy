/**
 * Provider Initialization
 *
 * Providers are registered via PHP using the 'aether_providers' filter for metadata/settings.
 * JavaScript providers register implementation hooks (aether.provider.upload, aether.provider.test, etc.).
 *
 * This import ensures the local-filesystem JavaScript provider implementation is bundled.
 * Note: This is just for loading the implementation code, not for hardcoded logic references.
 *
 * @package
 */

// Import local-filesystem provider JavaScript implementation.
// PHP handles registration and settings; JS handles upload/deployment logic.
import '../providers/local-filesystem/index';
