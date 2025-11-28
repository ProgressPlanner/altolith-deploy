/**
 * Publish State Hook
 *
 * Wrapper hook that provides export state from ExportContext.
 * Delegates to centralized state management.
 *
 */

import { useExportContext } from '@altolith/hooks/useExportContext';

/**
 * Get export workflow state
 *
 * Returns all export state and operations from context.
 * Simplified from 202 lines to delegate to ExportContext.
 *
 * @return {Object} Publish state and operations
 */
export function useExportState() {
	return useExportContext();
}
