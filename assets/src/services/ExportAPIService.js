/**
 * Publish API Service
 *
 * Service for export-related API operations.
 * Extracted from useExportAPI hook for testability.
 *
 */

import { ENDPOINTS } from '@altolith/constants';

const CHANGED_ASSETS_KEY = 'altolith_changed_assets';

/**
 * Publish API Service Class
 *
 * Handles export-related API calls and asset tracking.
 */
export class ExportAPIService {
	/**
	 * Create service instance
	 *
	 * @param {Function} apiFetch       WordPress apiFetch function (injectable for testing)
	 * @param {Object}   assetDiscovery Asset discovery service
	 * @param {Object}   storage        Storage implementation (injectable for testing)
	 */
	constructor( apiFetch, assetDiscovery, storage ) {
		this.apiFetch = apiFetch;
		this.assetDiscovery = assetDiscovery;
		this.storage = storage;
	}

	/**
	 * Discover custom assets
	 *
	 * Uses browser-based asset discovery instead of PHP endpoint.
	 * This avoids HTTP requests that fail in WordPress Playground.
	 *
	 * @return {Promise<Object>} Discovery response with assets array
	 */
	async discoverBlueprintBundleAssets() {
		const customAssets = await this.assetDiscovery.discoverCustomAssets();
		return {
			success: true,
			assets: customAssets,
			count: customAssets.length,
		};
	}

	/**
	 * Mark asset as changed
	 *
	 * Stores changed assets in localStorage.
	 * No server call needed - browser-only tracking.
	 *
	 * @param {string} type Asset type (theme, plugin)
	 * @param {string} slug Asset slug
	 * @return {Object} Success response
	 */
	markAssetChanged( type, slug ) {
		// Get current changed assets
		const changedAssets = this.storage.get( CHANGED_ASSETS_KEY, [] );
		const key = `${ type }:${ slug }`;

		// Add if not already present
		if ( ! changedAssets.includes( key ) ) {
			changedAssets.push( key );
			this.storage.set( CHANGED_ASSETS_KEY, changedAssets );
		}

		return {
			success: true,
			message: `Marked ${ type } ${ slug } as changed`,
		};
	}

	/**
	 * Fetch all pages of a paginated URL endpoint.
	 *
	 * @param {string}   endpoint       API endpoint path.
	 * @param {Function} onPageComplete Optional callback after each page.
	 * @return {Promise<Array>} All URLs from all pages.
	 */
	async fetchAllPaginatedUrls( endpoint, onPageComplete = null ) {
		const allUrls = [];
		let page = 1;
		let hasMore = true;

		while ( hasMore ) {
			const response = await this.apiFetch( {
				path: `${ endpoint }?page=${ page }`,
				method: 'GET',
			} );

			if ( ! response.success ) {
				throw new Error(
					response.message ||
						`Failed to fetch URLs from ${ endpoint }`
				);
			}

			allUrls.push( ...( response.urls || [] ) );
			hasMore = response.hasMore;
			page = response.nextPage || page + 1;

			if ( onPageComplete ) {
				onPageComplete( {
					page: page - 1,
					urlsCount: allUrls.length,
					total: response.total,
					hasMore,
				} );
			}
		}

		return allUrls;
	}

	/**
	 * Discover URLs for static site generation
	 *
	 * Calls the consolidated URL discovery endpoint to get all URLs.
	 * Includes posts, terms, authors, archives, and pagination URLs.
	 *
	 * @param {Function} onProgress Optional callback for progress updates.
	 * @return {Promise<Object>} Response with urls array and staticSiteUrl
	 */
	async discoverUrls( onProgress = null ) {
		try {
			const allUrls = [];
			let page = 1;
			let hasMore = true;

			if ( onProgress ) {
				onProgress( { status: 'fetching', type: 'all' } );
			}

			// Fetch all URLs from consolidated endpoint
			while ( hasMore ) {
				const response = await this.apiFetch( {
					path: `${ ENDPOINTS.URL_DISCOVERY.DISCOVER }?page=${ page }`,
					method: 'GET',
				} );

				if ( ! response.success ) {
					throw new Error(
						response.message || 'Failed to discover URLs'
					);
				}

				allUrls.push( ...( response.urls || [] ) );
				hasMore = response.hasMore;
				page = response.nextPage || page + 1;

				if ( onProgress ) {
					onProgress( {
						status: 'fetching',
						page: page - 1,
						urlsCount: allUrls.length,
						total: response.total,
						hasMore,
					} );
				}
			}

			// Deduplicate URLs
			const uniqueUrls = [ ...new Set( allUrls ) ];

			if ( onProgress ) {
				onProgress( {
					status: 'complete',
					urlsCount: uniqueUrls.length,
				} );
			}

			return {
				success: true,
				urls: uniqueUrls,
				staticSiteUrl: null, // Will be determined by provider config
			};
		} catch ( error ) {
			return {
				success: false,
				message: error.message || 'Failed to discover URLs',
				urls: [],
				staticSiteUrl: null,
			};
		}
	}

	/**
	 * Export core WordPress content (database, uploads, mu-plugins).
	 *
	 * Creates wp-content.zip containing only core content, excluding
	 * custom plugins and themes which are exported separately.
	 *
	 * @return {Promise<Object>} Response with zipPath, zipUrl, and zipSize
	 */
	async exportCoreContent() {
		try {
			const response = await this.apiFetch( {
				path: ENDPOINTS.EXPORT_WORKFLOW.CORE_CONTENT,
				method: 'POST',
			} );

			if ( response.success && response.data ) {
				const data = response.data;
				return {
					success: true,
					zipPath: data.zipPath || null,
					zipUrl: data.zipUrl || null,
					zipSize: data.zipSize || 0,
				};
			}

			return {
				success: false,
				message: response.message || 'Failed to export core content',
			};
		} catch ( error ) {
			return {
				success: false,
				message: error.message || 'Failed to export core content',
			};
		}
	}

	/**
	 * Export a single plugin as a zip file.
	 *
	 * @param {string} slug Plugin slug (directory name).
	 * @return {Promise<Object>} Response with zipPath, zipUrl, zipSize, and slug
	 */
	async exportPlugin( slug ) {
		try {
			const response = await this.apiFetch( {
				path: ENDPOINTS.EXPORT_WORKFLOW.EXPORT_PLUGIN,
				method: 'POST',
				data: { slug },
			} );

			if ( response.success && response.data ) {
				const data = response.data;
				return {
					success: true,
					zipPath: data.zipPath || null,
					zipUrl: data.zipUrl || null,
					zipSize: data.zipSize || 0,
					slug: data.slug || slug,
				};
			}

			return {
				success: false,
				message:
					response.message || `Failed to export plugin: ${ slug }`,
			};
		} catch ( error ) {
			return {
				success: false,
				message: error.message || `Failed to export plugin: ${ slug }`,
			};
		}
	}

	/**
	 * Export a single theme as a zip file.
	 *
	 * @param {string} slug Theme slug (directory name).
	 * @return {Promise<Object>} Response with zipPath, zipUrl, zipSize, and slug
	 */
	async exportTheme( slug ) {
		try {
			const response = await this.apiFetch( {
				path: ENDPOINTS.EXPORT_WORKFLOW.EXPORT_THEME,
				method: 'POST',
				data: { slug },
			} );

			if ( response.success && response.data ) {
				const data = response.data;
				return {
					success: true,
					zipPath: data.zipPath || null,
					zipUrl: data.zipUrl || null,
					zipSize: data.zipSize || 0,
					slug: data.slug || slug,
				};
			}

			return {
				success: false,
				message:
					response.message || `Failed to export theme: ${ slug }`,
			};
		} catch ( error ) {
			return {
				success: false,
				message: error.message || `Failed to export theme: ${ slug }`,
			};
		}
	}

	/**
	 * Generate blueprint JSON
	 *
	 * This is typically handled client-side via generateBlueprintJson function.
	 * This method is a fallback if the function is not available.
	 *
	 * @return {Promise<Object>} Response with blueprint data
	 */
	async generateBlueprint() {
		// This is a fallback method - typically blueprint generation is done client-side
		// via the generateBlueprintJson function from useBlueprintGenerator hook
		return {
			success: false,
			message:
				'Blueprint generation must be done client-side. Please ensure generateBlueprintJson function is available.',
		};
	}

	/**
	 * Fetch HTML content as anonymous user via PHP endpoint
	 *
	 * Uses server-side fetching with wp_set_current_user(0) to ensure
	 * content matches what anonymous visitors see. This is more reliable
	 * than credentials: 'omit' in WordPress Playground.
	 *
	 * @param {string} url URL to fetch
	 * @return {Promise<Object>} Response with success, html, and status
	 */
	async fetchHtml( url ) {
		try {
			const response = await this.apiFetch( {
				path: ENDPOINTS.EXPORT_WORKFLOW.FETCH_HTML,
				method: 'POST',
				data: { url },
			} );

			return response;
		} catch ( error ) {
			return {
				success: false,
				error: error.message || 'Failed to fetch HTML via PHP',
			};
		}
	}

	/**
	 * Fetch HTML content for multiple URLs as anonymous user
	 *
	 * Batch endpoint to reduce HTTP overhead when fetching many pages.
	 *
	 * @param {Array<string>} urls URLs to fetch (max 10)
	 * @return {Promise<Object>} Response with results map (url -> {success, html, status})
	 */
	async fetchHtmlBatch( urls ) {
		try {
			const response = await this.apiFetch( {
				path: ENDPOINTS.EXPORT_WORKFLOW.FETCH_HTML_BATCH,
				method: 'POST',
				data: { urls },
			} );

			return response;
		} catch ( error ) {
			return {
				success: false,
				error: error.message || 'Failed to fetch HTML batch via PHP',
				results: {},
			};
		}
	}
}
