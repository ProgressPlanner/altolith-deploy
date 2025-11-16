/**
 * Admin interface entry point
 *
 * @package AetherSiteExporter
 */

import { render } from '@wordpress/element';
import ExportInterface from './components/ExportInterface';

// Mount the React app when DOM is ready
document.addEventListener( 'DOMContentLoaded', () => {
	const container = document.getElementById( 'aether-site-exporter-root' );

	if ( container ) {
		render( <ExportInterface />, container );
	}
} );
