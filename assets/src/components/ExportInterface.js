/**
 * Export Interface Component
 *
 * Main interface for exporting static sites and blueprint bundles.
 *
 * @package AetherSiteExporter
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Export Interface component.
 *
 * @return {JSX.Element} Export interface.
 */
const ExportInterface = () => {
	const [ exportType, setExportType ] = useState( {
		staticSite: true,
		blueprint: false,
	} );

	return (
		<div className="aether-site-exporter">
			<div className="aether-site-exporter__header">
				<h1>{ __( 'Export Site', 'aether-site-exporter' ) }</h1>
				<p>
					{ __(
						'Export your WordPress site as a static HTML site or WordPress Playground blueprint bundle.',
						'aether-site-exporter'
					) }
				</p>
			</div>

			<div className="aether-site-exporter__options">
				<h2>{ __( 'Export Options', 'aether-site-exporter' ) }</h2>

				<label>
					<input
						type="checkbox"
						checked={ exportType.staticSite }
						onChange={ ( e ) =>
							setExportType( {
								...exportType,
								staticSite: e.target.checked,
							} )
						}
					/>
					{ __( 'Export Static Site', 'aether-site-exporter' ) }
				</label>

				<label>
					<input
						type="checkbox"
						checked={ exportType.blueprint }
						onChange={ ( e ) =>
							setExportType( {
								...exportType,
								blueprint: e.target.checked,
							} )
						}
					/>
					{ __(
						'Export WordPress Playground Blueprint Bundle',
						'aether-site-exporter'
					) }
				</label>
			</div>

			<div className="aether-site-exporter__actions">
				<Button variant="primary">
					{ __( 'Start Export', 'aether-site-exporter' ) }
				</Button>
			</div>
		</div>
	);
};

export default ExportInterface;
