/**
 * Cloudflare Worker: CORS Proxy + Static Site Router for WordPress Playground
 *
 * This Worker serves two purposes:
 * 1. CORS Proxy: Enables networking in WordPress Playground
 * 2. Static Site Router: Routes static-wp.s12y.org traffic with index.html fallback
 *
 * Usage for CORS Proxy:
 * - Deploy this Worker to Cloudflare Workers
 * - Configure Playground with: corsProxy: 'https://cfp.s12y.org/'
 * - Playground will automatically route cross-origin requests through this proxy
 *
 * Usage for Static Site Routing:
 * - Add custom domain route: static-wp.s12y.org/*
 * - Worker will handle index.html redirects and proxy to R2
 *
 * Request Format (CORS Proxy):
 * - The target URL should be appended to the Worker URL
 * - Example: https://cfp.s12y.org/https://api.example.com/data
 *
 * Security Notes:
 * - This is a permissive proxy designed for private admin use
 * - Consider adding authentication/rate limiting for production deployments
 * - See documentation for security hardening options
 */

export default {
	async fetch( request, env, ctx ) {
		try {
			const url = new URL( request.url );

			// Handle static-wp.s12y.org routing
			if ( url.hostname === 'static-wp.s12y.org' ) {
				return handleStaticSite( request, url );
			}

			// Handle WordPress.org plugin/theme check endpoint
			if ( url.pathname === '/check-wporg' ) {
				return handleWordPressOrgCheck( request, env, ctx );
			}

			// Handle CORS preflight requests
			if ( request.method === 'OPTIONS' ) {
				return handleCorsPreFlight( request );
			}

			// Extract target URL from request path
			const targetUrl = extractTargetUrl( url );

			// Validate target URL
			if ( ! targetUrl ) {
				return createErrorResponse( 'Missing target URL', 400 );
			}

			if ( ! isValidUrl( targetUrl ) ) {
				return createErrorResponse( 'Invalid target URL', 400 );
			}

			// Forward the request to the target URL
			const response = await forwardRequest( request, targetUrl );

			// Add CORS headers and return
			return addCorsHeaders( response );
		} catch ( error ) {
			console.error( 'Proxy error:', error );
			return createErrorResponse(
				`Proxy error: ${ error.message }`,
				500
			);
		}
	},
};

/**
 * Extract target URL from the request path
 * Supports formats:
 * - /https://example.com/path
 * - /http://example.com/path
 *
 * @param {URL} url - The request URL
 * @returns {string|null} The target URL or null if invalid
 */
function extractTargetUrl( url ) {
	// Remove leading slash and get the rest of the path
	const path = url.pathname.substring( 1 );

	// Check if path starts with http:// or https://
	if ( path.startsWith( 'http://' ) || path.startsWith( 'https://' ) ) {
		// Include query parameters if present
		const fullPath = path + url.search + url.hash;
		return fullPath;
	}

	return null;
}

/**
 * Validate that the URL is well-formed
 *
 * @param {string} urlString - URL to validate
 * @returns {boolean} True if valid
 */
function isValidUrl( urlString ) {
	try {
		const url = new URL( urlString );

		// Only allow http and https protocols
		if ( ! [ 'http:', 'https:' ].includes( url.protocol ) ) {
			return false;
		}

		return true;
	} catch ( error ) {
		return false;
	}
}

/**
 * Forward the request to the target URL
 * Preserves method, headers, and body
 *
 * @param {Request} originalRequest - The original request
 * @param {string}  targetUrl       - The target URL to forward to
 * @returns {Promise<Response>} The response from the target
 */
async function forwardRequest( originalRequest, targetUrl ) {
	// Prepare headers - forward all headers from original request
	const headers = new Headers( originalRequest.headers );

	// Remove headers that shouldn't be forwarded
	headers.delete( 'host' );
	headers.delete( 'cf-connecting-ip' );
	headers.delete( 'cf-ray' );
	headers.delete( 'cf-visitor' );

	// Prepare request options
	const requestOptions = {
		method: originalRequest.method,
		headers,
	};

	// Add body for methods that support it
	if (
		[ 'POST', 'PUT', 'PATCH', 'DELETE' ].includes( originalRequest.method )
	) {
		// Clone the request to read the body
		const clonedRequest = originalRequest.clone();
		requestOptions.body = await clonedRequest.arrayBuffer();
	}

	// Make the request to the target URL
	const response = await fetch( targetUrl, requestOptions );

	return response;
}

/**
 * Handle CORS preflight requests (OPTIONS)
 *
 * @param {Request} request - The OPTIONS request
 * @returns {Response} CORS preflight response
 */
function handleCorsPreFlight( request ) {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods':
			'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
		'Access-Control-Allow-Headers':
			request.headers.get( 'Access-Control-Request-Headers' ) || '*',
		'Access-Control-Max-Age': '86400', // 24 hours
	};

	return new Response( null, {
		status: 204,
		headers: corsHeaders,
	} );
}

/**
 * Add CORS headers to a response
 *
 * @param {Response} response - The response to add headers to
 * @returns {Response} Response with CORS headers
 */
function addCorsHeaders( response ) {
	// Create a new response with the same body
	const newResponse = new Response( response.body, response );

	// Add CORS headers
	newResponse.headers.set( 'Access-Control-Allow-Origin', '*' );
	newResponse.headers.set(
		'Access-Control-Allow-Methods',
		'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS'
	);
	newResponse.headers.set( 'Access-Control-Allow-Headers', '*' );
	newResponse.headers.set( 'Access-Control-Expose-Headers', '*' );

	return newResponse;
}

/**
 * Create an error response
 *
 * @param {string} message - Error message
 * @param {number} status  - HTTP status code
 * @returns {Response} Error response with CORS headers
 */
function createErrorResponse( message, status ) {
	const response = new Response( JSON.stringify( { error: message } ), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	} );

	return response;
}

/**
 * Handle static site routing for static-wp.s12y.org
 * Redirects root path to index.html and adds aggressive caching headers
 *
 * @param {Request} request - The original request
 * @param {URL}     url     - The parsed URL
 * @returns {Response} Redirect or pass-through response with caching headers
 */
async function handleStaticSite( request, url ) {
	// Redirect root path to index.html
	if ( url.pathname === '/' || url.pathname === '' ) {
		return Response.redirect(
			'https://static-wp.s12y.org/index.html',
			301
		);
	}

	// Fetch from R2
	const response = await fetch( request );

	// Clone response to modify headers
	const modifiedResponse = new Response( response.body, response );

	// Add aggressive caching headers based on file type
	const cacheControl = getCacheControlForPath( url.pathname );
	modifiedResponse.headers.set( 'Cache-Control', cacheControl );

	// Add Cloudflare cache directive
	if ( shouldCacheInCloudflare( url.pathname ) ) {
		modifiedResponse.headers.set(
			'CDN-Cache-Control',
			'public, max-age=31536000'
		);
	}

	return modifiedResponse;
}

/**
 * Get appropriate Cache-Control header based on file path
 *
 * @param {string} pathname - The URL pathname
 * @returns {string} Cache-Control header value
 */
function getCacheControlForPath( pathname ) {
	// Immutable assets (content-hashed files) - cache forever
	if (
		pathname.match(
			/\.(js|css|wasm|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico|map)$/i
		)
	) {
		// Check if filename contains a hash (e.g., file-abc123.js)
		if ( pathname.match( /[-_][a-zA-Z0-9]{6,}\.(js|css|wasm)/i ) ) {
			return 'public, max-age=31536000, immutable';
		}
		// Non-hashed assets - still cache aggressively but not immutable
		return 'public, max-age=31536000';
	}

	// HTML files - cache but revalidate
	if ( pathname.match( /\.html?$/i ) || pathname === '/index.html' ) {
		return 'public, max-age=3600, must-revalidate';
	}

	// JSON files - medium cache
	if ( pathname.match( /\.json$/i ) ) {
		return 'public, max-age=86400';
	}

	// PHP files (shouldn't be served but just in case) - no cache
	if ( pathname.match( /\.php$/i ) ) {
		return 'no-cache, no-store, must-revalidate';
	}

	// Everything else - moderate cache
	return 'public, max-age=86400';
}

/**
 * Determine if a file should be cached in Cloudflare's edge
 *
 * @param {string} pathname - The URL pathname
 * @returns {boolean} True if should be cached in Cloudflare
 */
function shouldCacheInCloudflare( pathname ) {
	// Cache all static assets
	return pathname.match(
		/\.(js|css|wasm|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|avif|ico|json|map)$/i
	);
}

/**
 * Handle WordPress.org plugin/theme check with D1 caching
 *
 * Self-learning cache with dual TTL strategy:
 * - WordPress.org plugins/themes: 30-day TTL (stable)
 * - Custom plugins/themes: 2-day TTL (catch newly published)
 *
 * URL format: /check-wporg?slug=akismet&type=plugin
 *
 * @param {Request} request - The request object
 * @param {Object}  env     - Environment bindings (includes DB)
 * @param {Object}  ctx     - Execution context
 * @returns {Promise<Response>} JSON response with exists status
 */
async function handleWordPressOrgCheck( request, env, ctx ) {
	const url = new URL( request.url );
	const slug = url.searchParams.get( 'slug' );
	const type = url.searchParams.get( 'type' ); // 'plugin' or 'theme'

	// Validate parameters
	if ( ! slug || ! type ) {
		return new Response(
			JSON.stringify( {
				success: false,
				error: 'Missing required parameters: slug and type',
			} ),
			{
				status: 400,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Content-Type': 'application/json',
				},
			}
		);
	}

	if ( type !== 'plugin' && type !== 'theme' ) {
		return new Response(
			JSON.stringify( {
				success: false,
				error: 'Invalid type parameter. Must be "plugin" or "theme"',
			} ),
			{
				status: 400,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Content-Type': 'application/json',
				},
			}
		);
	}

	// TTL constants (milliseconds)
	const WPORG_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
	const CUSTOM_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

	try {
		// Check D1 cache first
		const cached = await env.DB.prepare(
			'SELECT is_wporg, checked_at FROM wporg_cache WHERE slug = ? AND type = ?'
		)
			.bind( slug, type )
			.first();

		if ( cached ) {
			const cacheAge =
				Date.now() - new Date( cached.checked_at ).getTime();
			const isWpOrg = cached.is_wporg === 1;
			const ttl = isWpOrg ? WPORG_TTL_MS : CUSTOM_TTL_MS;

			// Check if cache is still valid
			if ( cacheAge < ttl ) {
				// Update hit count asynchronously (don't wait)
				ctx.waitUntil(
					env.DB.prepare(
						'UPDATE wporg_cache SET hit_count = hit_count + 1 WHERE slug = ? AND type = ?'
					)
						.bind( slug, type )
						.run()
				);

				return new Response(
					JSON.stringify( {
						success: true,
						exists: isWpOrg,
						slug,
						type,
						cached: true,
						cache_age_days: Math.floor(
							cacheAge / ( 24 * 60 * 60 * 1000 )
						),
						ttl_days: isWpOrg ? 30 : 2,
					} ),
					{
						headers: {
							'Access-Control-Allow-Origin': '*',
							'Content-Type': 'application/json',
							'Cache-Control': 'public, max-age=3600', // Browser cache for 1 hour
						},
					}
				);
			}

			// Cache expired - will re-check WordPress.org below
		}

		// Cache miss or expired - check WordPress.org using official API
		let wporgUrl;
		if ( type === 'plugin' ) {
			// Plugins API: https://api.wordpress.org/plugins/info/1.0/{slug}.json
			wporgUrl = `https://api.wordpress.org/plugins/info/1.0/${ slug }.json`;
		} else {
			// Themes API: https://api.wordpress.org/themes/info/1.2/?action=theme_information&request[slug]={slug}
			wporgUrl = `https://api.wordpress.org/themes/info/1.2/?action=theme_information&request[slug]=${ slug }`;
		}

		const response = await fetch( wporgUrl );

		// Parse JSON response
		const data = await response.json();

		// Check if asset exists:
		// - Exists: JSON contains 'slug' field
		// - Doesn't exist: JSON contains 'error' field
		const exists = ! data.error && ( data.slug === slug || data.name );

		// Store/update result in D1 asynchronously
		ctx.waitUntil(
			env.DB.prepare(
				`INSERT INTO wporg_cache (slug, type, is_wporg, checked_at, hit_count)
				 VALUES (?, ?, ?, ?, 1)
				 ON CONFLICT(slug, type) DO UPDATE SET
					is_wporg = excluded.is_wporg,
					checked_at = excluded.checked_at,
					hit_count = hit_count + 1`
			)
				.bind( slug, type, exists ? 1 : 0, new Date().toISOString() )
				.run()
		);

		return new Response(
			JSON.stringify( {
				success: true,
				exists,
				slug,
				type,
				cached: false,
				checked_at: new Date().toISOString(),
				ttl_days: exists ? 30 : 2,
			} ),
			{
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Content-Type': 'application/json',
					'Cache-Control': 'public, max-age=3600', // Browser cache for 1 hour
				},
			}
		);
	} catch ( error ) {
		console.error( 'WordPress.org check error:', error );
		return new Response(
			JSON.stringify( {
				success: false,
				error: `WordPress.org check failed: ${ error.message }`,
				slug,
				type,
			} ),
			{
				status: 500,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Content-Type': 'application/json',
				},
			}
		);
	}
}
