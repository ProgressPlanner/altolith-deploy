/**
 * useProviderStatus Hook
 *
 * Checks if a provider is configured (green checkmark or red X).
 *
 * @package
 */

import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { addAction, removeAction } from '@wordpress/hooks';
import apiFetch from '../../utils/api';

/**
 * Hook to check provider configuration status.
 *
 * @param {string} providerId Provider ID to check.
 * @return {Object} { status: 'configured'|'not-configured'|'error'|null, loading }
 */
export default function useProviderStatus( providerId ) {
	// Initialize status based on whether providerId exists
	// If no provider is selected, show "not-configured" immediately
	const [ status, setStatus ] = useState(
		! providerId ? 'not-configured' : null
	);
	const [ loading, setLoading ] = useState( !! providerId );
	const isMountedRef = useRef( true );
	const timeoutRef = useRef( null );
	const rafRef = useRef( null );
	const checkStatusRef = useRef( null );

	const safeSetStatus = useCallback( ( value ) => {
		if ( isMountedRef.current ) {
			setStatus( value );
		}
	}, [] );

	const safeSetLoading = useCallback( ( value ) => {
		if ( isMountedRef.current ) {
			setLoading( value );
		}
	}, [] );

	const checkStatus = useCallback( async () => {
		if ( ! providerId ) {
			// Show "not-configured" when no provider is selected
			safeSetStatus( 'not-configured' );
			safeSetLoading( false );
			return;
		}

		try {
			safeSetLoading( true );

			const response = await apiFetch( {
				path: `/aether/site-exporter/providers/${ providerId }/status`,
			} );

			safeSetStatus(
				response.configured ? 'configured' : 'not-configured'
			);
		} catch ( err ) {
			safeSetStatus( 'error' );
		} finally {
			safeSetLoading( false );
		}
	}, [ providerId, safeSetStatus, safeSetLoading ] );

	// Store the latest checkStatus in a ref
	useEffect( () => {
		checkStatusRef.current = checkStatus;
	}, [ checkStatus ] );

	useEffect( () => {
		isMountedRef.current = true;
		checkStatus();

		return () => {
			isMountedRef.current = false;
		};
	}, [ checkStatus ] );

	// Listen for settings save to refresh status
	useEffect( () => {
		if ( ! providerId ) {
			return;
		}

		const handleSettingsSaved = ( savedProviderId ) => {
			if ( ! isMountedRef.current || savedProviderId !== providerId ) {
				return;
			}

			// Clear any existing timeout and RAF
			if ( timeoutRef.current ) {
				clearTimeout( timeoutRef.current );
				timeoutRef.current = null;
			}
			if ( rafRef.current ) {
				// eslint-disable-next-line no-undef
				cancelAnimationFrame( rafRef.current );
				rafRef.current = null;
			}

			// Wait for modal animation to complete before updating status.
			// Modal auto-closes after 3 seconds, so we wait 3.5 seconds.
			rafRef.current = requestAnimationFrame( () => {
				rafRef.current = null;

				if ( ! isMountedRef.current ) {
					return;
				}

				timeoutRef.current = setTimeout( () => {
					if ( isMountedRef.current && checkStatusRef.current ) {
						checkStatusRef.current();
					}
					timeoutRef.current = null;
				}, 3500 );
			} );
		};

		const namespace = `refresh-status-${ providerId }`;
		addAction(
			'aether.admin.provider.settings.saved',
			namespace,
			handleSettingsSaved
		);

		return () => {
			if ( timeoutRef.current ) {
				clearTimeout( timeoutRef.current );
				timeoutRef.current = null;
			}
			if ( rafRef.current ) {
				// eslint-disable-next-line no-undef
				cancelAnimationFrame( rafRef.current );
				rafRef.current = null;
			}
			removeAction( 'aether.admin.provider.settings.saved', namespace );
		};
	}, [ providerId ] );

	return { status, loading };
}
