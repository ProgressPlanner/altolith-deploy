/**
 * Publish State Hook
 *
 * Wrapper hook that provides publish state from ExportContext.
 * Delegates to centralized state management.
 *
 * @package
 */

import { useExportContext } from '@aether/hooks/useExportContext';

/**
 * Get publish workflow state
 *
 * Returns all publish state and operations from context.
 * Simplified from 202 lines to delegate to ExportContext.
 *
 * @return {Object} Publish state and operations
 */
export function useExportState() {
	return useExportContext();
}
