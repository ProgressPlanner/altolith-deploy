/**
 * Recent Jobs Hook
 *
 * Fetches recent publish jobs using the generic useAPIData hook.
 * Simplified from 49 to 25 lines (-49% complexity).
 *
 * @package
 */

import { useAPIData } from '../../hooks/useAPIData';

/**
 * Hook to fetch recent publish jobs
 *
 * @param {number} limit Number of jobs to fetch (default: 5)
 * @return {Object} Jobs data, loading state, error, and refresh function
 */
export function useRecentJobs( limit = 5 ) {
	const {
		data: jobs,
		loading,
		error,
		refresh,
	} = useAPIData( {
		path: `/aether/v1/publish/jobs?limit=${ limit }`,
		transform: ( response ) => {
			if ( ! response.success || ! response.value?.jobs ) {
				throw new Error( 'Failed to fetch jobs' );
			}
			return response.value.jobs;
		},
		initialData: [],
		dependencies: [ limit ],
	} );

	return {
		jobs,
		loading,
		error,
		refresh,
	};
}
