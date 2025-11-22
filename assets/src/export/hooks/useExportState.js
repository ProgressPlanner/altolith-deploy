/**
 * Publish State Hook
 *
 * Wrapper hook that provides publish state from PublishContext.
 * Delegates to centralized state management.
 *
 * @package
 */

import { usePublishContext } from '@aether/hooks/usePublishContext';

/**
 * Get publish workflow state
 *
 * Returns all publish state and operations from context.
 * Simplified from 202 lines to delegate to PublishContext.
 *
 * @return {Object} Publish state and operations
 */
export function usePublishState() {
	return usePublishContext();
}
