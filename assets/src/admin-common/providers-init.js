/**
 * Provider Initialization
 *
 * Providers are now registered entirely in JavaScript via aether.providers.register hooks.
 * Provider metadata comes from JavaScript ProviderRegistry, not PHP.
 *
 * Import the local-filesystem provider here to ensure it's always available
 * as the default provider. Other providers are loaded dynamically as separate scripts.
 *
 * @package
 */

// Import local-filesystem provider to ensure it registers early
// This provider is always available and doesn't need dynamic loading
import '../providers/local-filesystem';
