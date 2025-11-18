/**
 * Provider SDK
 *
 * Public API for building provider plugins.
 * Exposed as window.AetherProviderSDK for external provider plugins.
 *
 * @package Aether
 */

// Core abstractions
export { AbstractProvider } from '../providers/base/AbstractProvider';
export { ProviderRegistry } from '../providers/registry/ProviderRegistry';

// Utilities
export {
	ConfigFieldBuilder,
	buildDeploymentTypesField,
} from '../providers/utils/configFieldBuilder';

// Constants
export {
	DEPLOYMENT_TYPES,
	DEPLOYMENT_TYPE_LABELS,
	DEPLOYMENT_TYPE_DESCRIPTIONS,
} from '../constants/deploymentTypes';

// UI Components
export { default as ProviderForm } from '../providers/components/ProviderForm';
export { default as ProviderField } from '../providers/components/ProviderField';

// React Hooks
export { default as useProvider } from '../providers/hooks/useProvider';
export { default as useProviderConfig } from '../providers/hooks/useProviderConfig';

/**
 * SDK Version
 *
 * Follows the parent plugin version.
 */
export const SDK_VERSION = '1.0.0';
