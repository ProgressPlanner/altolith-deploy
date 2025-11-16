/**
 * Connection Test Hooks
 *
 * Provides direct API calls for testing provider connections from React.
 *
 * @package
 */

import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useCloudflareWorkersAPI } from './useCloudflareWorkersAPI';
import apiFetch from '../utils/api';

/**
 * Hook for testing Cloudflare connection.
 *
 * @param {string} accountId Cloudflare account ID.
 * @param {string} apiToken  Cloudflare API token.
 * @return {Object} Test methods and state.
 */
export function useCloudflareConnectionTest( accountId, apiToken ) {
	const [ testing, setTesting ] = useState( false );
	const [ result, setResult ] = useState( null );

	const cloudflareAPI = useCloudflareWorkersAPI( accountId, apiToken );

	const test = useCallback( async () => {
		setTesting( true );
		setResult( null );

		try {
			// Validate credentials before testing
			if ( ! accountId || ! apiToken ) {
				throw new Error(
					__(
						'Account ID and API token are required for connection testing',
						'aether'
					)
				);
			}

			// Validate account ID format (32-character hex string)
			if ( ! /^[a-f0-9]{32}$/i.test( accountId ) ) {
				throw new Error(
					__(
						'Invalid account ID format. Account ID must be a 32-character hexadecimal string',
						'aether'
					)
				);
			}

			// Test connection via API
			await cloudflareAPI.testConnection();
			setResult( {
				success: true,
				message: __(
					'Successfully connected to Cloudflare Workers',
					'aether'
				),
			} );
		} catch ( err ) {
			setResult( {
				success: false,
				message:
					err.message || __( 'Connection test failed', 'aether-site-exporter' ),
			} );
		} finally {
			setTesting( false );
		}
	}, [ cloudflareAPI, accountId, apiToken ] );

	return {
		test,
		testing,
		result,
	};
}

/**
 * Hook for testing R2 storage connection.
 *
 * @param {string} providerId Provider ID.
 * @param {Object} config     Provider configuration.
 * @return {Object} Test methods and state.
 */
export function useR2ConnectionTest( providerId, config ) {
	const [ testing, setTesting ] = useState( false );
	const [ result, setResult ] = useState( null );

	const test = useCallback( async () => {
		setTesting( true );
		setResult( null );

		try {
			// Test connection via REST API endpoint (server-side proxy, avoids CORS)
			const response = await apiFetch( {
				path: `/aether/site-exporter/providers/${ providerId }/test`,
				method: 'POST',
				data: {
					config,
				},
			} );

			if ( ! response.success ) {
				throw new Error(
					response.message ||
						response.error ||
						__( 'Connection test failed', 'aether-site-exporter' )
				);
			}

			setResult( {
				success: true,
				message:
					response.message ||
					__( 'Successfully connected to Cloudflare R2', 'aether-site-exporter' ),
			} );
		} catch ( err ) {
			setResult( {
				success: false,
				message:
					err.message || __( 'Connection test failed', 'aether-site-exporter' ),
			} );
		} finally {
			setTesting( false );
		}
	}, [ config, providerId ] );

	return {
		test,
		testing,
		result,
	};
}

/**
 * Hook for testing GitLab connection.
 *
 * @param {Object} config Provider configuration.
 * @return {Object} Test methods and state.
 */
export function useGitLabConnectionTest( config ) {
	const [ testing, setTesting ] = useState( false );
	const [ result, setResult ] = useState( null );

	const test = useCallback( async () => {
		setTesting( true );
		setResult( null );

		try {
			const personalAccessToken = config.personal_access_token || '';
			const repositoryOwner = config.repository_owner || '';
			const repositoryName = config.repository_name || '';

			if (
				! personalAccessToken ||
				! repositoryOwner ||
				! repositoryName
			) {
				throw new Error(
					__( 'Missing required GitLab credentials', 'aether-site-exporter' )
				);
			}

			// Test GitLab API connection by fetching user info.
			const response = await fetch( 'https://gitlab.com/api/v4/user', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${ personalAccessToken }`,
					'Content-Type': 'application/json',
				},
			} );

			if ( ! response.ok ) {
				const errorData = await response.json().catch( () => ( {} ) );
				throw new Error(
					errorData.message ||
						`HTTP ${ response.status }: ${ response.statusText }`
				);
			}

			// Also verify repository access.
			const repoResponse = await fetch(
				`https://gitlab.com/api/v4/projects/${ encodeURIComponent(
					repositoryOwner + '/' + repositoryName
				) }`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${ personalAccessToken }`,
						'Content-Type': 'application/json',
					},
				}
			);

			if ( ! repoResponse.ok ) {
				throw new Error(
					__(
						'Cannot access repository. Please verify repository name and permissions.',
						'aether'
					)
				);
			}

			setResult( {
				success: true,
				message: __( 'Successfully connected to GitLab', 'aether-site-exporter' ),
			} );
		} catch ( err ) {
			setResult( {
				success: false,
				message:
					err.message || __( 'Connection test failed', 'aether-site-exporter' ),
			} );
		} finally {
			setTesting( false );
		}
	}, [ config ] );

	return {
		test,
		testing,
		result,
	};
}

/**
 * Hook for testing provider connection (generic).
 *
 * @param {string} providerId Provider ID.
 * @param {Object} config     Provider configuration.
 * @return {Object} Test methods and state.
 */
export function useConnectionTest( providerId, config ) {
	const [ testing, setTesting ] = useState( false );
	const [ result, setResult ] = useState( null );

	const gitlabTest = useGitLabConnectionTest( config );

	const test = useCallback( async () => {
		setTesting( true );
		setResult( null );

		try {
			if (
				providerId === 'cloudflare' ||
				providerId === 'cloudflare-workers'
			) {
				// Use REST API endpoint to test connection (avoids CORS issues)
				try {
					const response = await apiFetch( {
						path: `/aether/site-exporter/providers/${ providerId }/test`,
						method: 'POST',
						data: { config },
					} );

					if ( response.success ) {
						setResult( {
							success: true,
							message:
								response.message ||
								__(
									'Successfully connected to Cloudflare Workers',
									'aether'
								),
						} );
						return;
					}

					throw new Error(
						response.message ||
							response.error ||
							__( 'Connection test failed', 'aether-site-exporter' )
					);
				} catch ( apiError ) {
					// Handle API errors (WP_Error responses)
					const errorMessage =
						apiError?.message ||
						apiError?.data?.message ||
						apiError?.error ||
						__( 'Connection test failed', 'aether-site-exporter' );
					throw new Error( errorMessage );
				}
			} else if ( providerId === 'cloudflare-r2' ) {
				// Test R2 connection directly via REST API endpoint
				try {
					const response = await apiFetch( {
						path: `/aether/site-exporter/providers/${ providerId }/test`,
						method: 'POST',
						data: {
							config,
						},
					} );

					// Handle WP_Error responses
					if ( response.code && response.message ) {
						throw new Error( response.message );
					}

					if ( ! response.success ) {
						throw new Error(
							response.message ||
								response.error ||
								__( 'Connection test failed', 'aether-site-exporter' )
						);
					}

					setResult( {
						success: true,
						message:
							response.message ||
							__(
								'Successfully connected to Cloudflare R2',
								'aether'
							),
					} );
				} catch ( err ) {
					// Extract error message from various error formats
					const errorMessage =
						err?.message ||
						err?.data?.message ||
						err?.error ||
						__( 'Connection test failed', 'aether-site-exporter' );

					setResult( {
						success: false,
						message: errorMessage,
					} );
				}
			} else if ( providerId === 'gitlab-pages' ) {
				await gitlabTest.test();
				setTimeout( () => {
					if ( gitlabTest.result ) {
						setResult( gitlabTest.result );
					}
				}, 100 );
			} else {
				// For other providers, fall back to REST API.
				const response = await apiFetch( {
					path: `/aether/site-exporter/providers/${ providerId }/test`,
					method: 'POST',
					data: { config },
				} );

				setResult( {
					success: response.success || false,
					message:
						response.message ||
						response.error ||
						__( 'Connection test failed', 'aether-site-exporter' ),
				} );
			}
		} catch ( err ) {
			setResult( {
				success: false,
				message:
					err.message || __( 'Connection test failed', 'aether-site-exporter' ),
			} );
		} finally {
			setTesting( false );
		}
	}, [ providerId, config, gitlabTest ] );

	return {
		test,
		testing,
		result,
	};
}
