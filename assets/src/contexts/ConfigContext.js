/**
 * Config Context
 *
 * Centralized configuration management using React Context API.
 * Provides global config state from window.aetherData.
 *
 * @package
 */

import {
	createContext,
	useState,
	useEffect,
	useMemo,
} from '@wordpress/element';

/**
 * Config Context
 *
 * @type {Object}
 */
export const ConfigContext = createContext( {
	config: {},
} );

/**
 * Get configuration from window.aetherData
 *
 * @return {Object} Configuration object
 */
function getConfigFromWindow() {
	if ( typeof window !== 'undefined' && window.aetherData ) {
		return {
			publicUrl: window.aetherData.publicUrl || '',
			adminUrl: window.aetherData.adminUrl || '',
			pluginUrl: window.aetherData.pluginUrl || '',
			restUrl: window.aetherData.restUrl || '',
		};
	}

	return {
		publicUrl: '',
		adminUrl: '',
		pluginUrl: '',
		restUrl: '',
	};
}

/**
 * Config Provider Component
 *
 * Wraps the application to provide global config state from window.aetherData.
 *
 * @param {Object}      props          Component props
 * @param {JSX.Element} props.children Child components
 * @return {JSX.Element} Provider component
 */
export function ConfigProvider( { children } ) {
	const [ config, setConfig ] = useState( getConfigFromWindow );

	// Update config if window.aetherData changes (shouldn't happen, but defensive)
	useEffect( () => {
		setConfig( getConfigFromWindow() );
	}, [] );

	// Provide context value
	const value = useMemo(
		() => ( {
			config,
		} ),
		[ config ]
	);

	return (
		<ConfigContext.Provider value={ value }>
			{ children }
		</ConfigContext.Provider>
	);
}
