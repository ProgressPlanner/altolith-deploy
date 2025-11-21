/**
 * Provider Initialization
 *
 * Providers are now registered entirely in JavaScript via aether.providers.register hooks.
 * Provider metadata comes from JavaScript ProviderRegistry, not PHP.
 *
 * Providers are loaded dynamically as separate scripts (enqueued via PHP) to reduce initial bundle size.
 * When a provider script loads, it registers itself in the JavaScript ProviderRegistry.
 *
 * @package
 */
