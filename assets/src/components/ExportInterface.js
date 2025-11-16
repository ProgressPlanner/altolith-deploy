/**
 * Export Interface Component
 *
 * Complete export interface for static sites and blueprint bundles.
 * Features:
 * - Export configuration with target URL
 * - Real-time progress tracking
 * - Job history and management
 * - Download completed exports
 * - Error handling and recovery
 *
 * @package AetherSiteExporter
 */

import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, TextControl, CheckboxControl, Notice, Spinner, Card, CardHeader, CardBody, Modal } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

/**
 * Export Interface component.
 *
 * @return {JSX.Element} Export interface.
 */
const ExportInterface = () => {
	// State for export configuration
	const [ config, setConfig ] = useState( {
		exportStaticSite: true,
		exportBlueprint: false,
		targetUrl: window.location.origin,
		staticSitePath: '',
		blueprintPath: '',
	} );

	// State for showing custom path inputs
	const [ showStaticPathInput, setShowStaticPathInput ] = useState( false );
	const [ showBlueprintPathInput, setShowBlueprintPathInput ] = useState( false );

	// State for current export job
	const [ currentJob, setCurrentJob ] = useState( null );
	const [ jobStatus, setJobStatus ] = useState( null );
	const [ isExporting, setIsExporting ] = useState( false );
	const [ error, setError ] = useState( null );

	// State for job history
	const [ jobHistory, setJobHistory ] = useState( [] );
	const [ loadingHistory, setLoadingHistory ] = useState( true );

	// State for job being deleted
	const [ deletingJobId, setDeletingJobId ] = useState( null );

	// Load job history on mount
	useEffect( () => {
		loadJobHistory();
	}, [] );

	// Poll job status when exporting
	useEffect( () => {
		if ( ! isExporting || ! currentJob ) {
			return;
		}

		const pollInterval = setInterval( () => {
			pollJobStatus();
		}, 2000 ); // Poll every 2 seconds

		return () => clearInterval( pollInterval );
	}, [ isExporting, currentJob ] );

	/**
	 * Load job history from API.
	 */
	const loadJobHistory = async () => {
		try {
			setLoadingHistory( true );
			const response = await apiFetch( {
				path: '/aether-site-exporter/v1/export/jobs',
			} );
			setJobHistory( response.data?.jobs || [] );
		} catch ( err ) {
			console.error( 'Failed to load job history:', err );
		} finally {
			setLoadingHistory( false );
		}
	};

	/**
	 * Start a new export job.
	 */
	const startExport = async () => {
		// Validation
		if ( ! config.exportStaticSite && ! config.exportBlueprint ) {
			setError( __( 'Please select at least one export type.', 'aether-site-exporter' ) );
			return;
		}

		if ( config.exportStaticSite && ! config.targetUrl ) {
			setError( __( 'Target URL is required for static site export.', 'aether-site-exporter' ) );
			return;
		}

		setError( null );
		setIsExporting( true );

		// Debug logging
		console.log( 'Export config:', config );
		console.log( 'Export types being sent:', {
			staticSite: config.exportStaticSite,
			blueprint: config.exportBlueprint,
		} );

		try {
			// Create export job
			const response = await apiFetch( {
				path: '/aether-site-exporter/v1/export',
				method: 'POST',
				data: {
					exportTypes: {
						staticSite: config.exportStaticSite,
						blueprint: config.exportBlueprint,
					},
					targetUrl: config.targetUrl,
					staticSitePath: config.staticSitePath || '',
					blueprintPath: config.blueprintPath || '',
				},
			} );

			setCurrentJob( response.data?.jobId );

			// Execute export steps
			await runExportWorkflow( response.data?.jobId );
		} catch ( err ) {
			setError( err.message || __( 'Failed to start export', 'aether-site-exporter' ) );
			setIsExporting( false );
		}
	};

	/**
	 * Run the complete export workflow.
	 *
	 * @param {string} jobId Job ID.
	 */
	const runExportWorkflow = async ( jobId ) => {
		try {
			// Step 1: Discover URLs
			await apiFetch( {
				path: `/aether-site-exporter/v1/export/${ jobId }/discover-urls`,
				method: 'POST',
			} );

			// Step 2: Create static site archive (if requested)
			if ( config.exportStaticSite ) {
				await apiFetch( {
					path: `/aether-site-exporter/v1/export/${ jobId }/create-archive`,
					method: 'POST',
				} );
			}

			// Step 3: Generate blueprint bundle (if requested)
			if ( config.exportBlueprint ) {
				try {
					await apiFetch( {
						path: `/aether-site-exporter/v1/export/${ jobId }/generate-blueprint`,
						method: 'POST',
					} );
				} catch ( err ) {
					// Blueprint may fail if SQLite is not available - that's okay
					console.warn( 'Blueprint generation failed:', err.message );
				}
			}

			// Step 4: Cleanup temporary files
			await apiFetch( {
				path: `/aether-site-exporter/v1/export/${ jobId }/cleanup`,
				method: 'POST',
			} );

			// Mark job as complete
			await apiFetch( {
				path: `/aether-site-exporter/v1/export/${ jobId }/status`,
				method: 'POST',
				data: {
					status: 'complete',
				},
			} );

			// Reload job history
			await loadJobHistory();

			setIsExporting( false );
			setCurrentJob( null );
		} catch ( err ) {
			setError( err.message || __( 'Export failed', 'aether-site-exporter' ) );
			setIsExporting( false );

			// Mark job as failed
			try {
				await apiFetch( {
					path: `/aether-site-exporter/v1/export/${ jobId }/status`,
					method: 'POST',
					data: {
						status: 'failed',
						error: err.message,
					},
				} );
			} catch ( statusErr ) {
				console.error( 'Failed to update job status:', statusErr );
			}
		}
	};

	/**
	 * Poll current job status.
	 */
	const pollJobStatus = async () => {
		if ( ! currentJob ) {
			return;
		}

		try {
			const response = await apiFetch( {
				path: `/aether-site-exporter/v1/export/${ currentJob }/status`,
			} );
			setJobStatus( response.data );
		} catch ( err ) {
			console.error( 'Failed to poll job status:', err );
		}
	};

	/**
	 * Delete a job.
	 *
	 * @param {string} jobId Job ID.
	 */
	const deleteJob = async ( jobId ) => {
		if ( ! confirm( __( 'Are you sure you want to delete this export job?', 'aether-site-exporter' ) ) ) {
			return;
		}

		setDeletingJobId( jobId );

		try {
			await apiFetch( {
				path: `/aether-site-exporter/v1/export/${ jobId }`,
				method: 'DELETE',
			} );

			// Reload job history
			await loadJobHistory();
		} catch ( err ) {
			setError( err.message || __( 'Failed to delete job', 'aether-site-exporter' ) );
		} finally {
			setDeletingJobId( null );
		}
	};

	/**
	 * Get download URL for a job export.
	 *
	 * @param {string} jobId       Job ID.
	 * @param {string} exportType  'static-site' or 'blueprint'.
	 * @return {string} Download URL.
	 */
	const getDownloadUrl = ( jobId, exportType ) => {
		return `/wp-json/aether-site-exporter/v1/download/${ jobId }/${ exportType }`;
	};

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

			{ error && (
				<Notice status="error" isDismissible onRemove={ () => setError( null ) }>
					{ error }
				</Notice>
			) }

			{ /* Export Configuration */ }
			<Card>
				<CardHeader>
					<h2>{ __( 'New Export', 'aether-site-exporter' ) }</h2>
				</CardHeader>
				<CardBody>
					<CheckboxControl
						label={ __( 'Export Static Site', 'aether-site-exporter' ) }
						help={ __( 'Generate static HTML files for your entire site', 'aether-site-exporter' ) }
						checked={ config.exportStaticSite }
						onChange={ ( value ) => setConfig( { ...config, exportStaticSite: value } ) }
						disabled={ isExporting }
					/>

					{ config.exportStaticSite && (
						<>
							<TextControl
								label={ __( 'Target URL', 'aether-site-exporter' ) }
								help={ __( 'The URL where the static site will be deployed', 'aether-site-exporter' ) }
								value={ config.targetUrl }
								onChange={ ( value ) => setConfig( { ...config, targetUrl: value } ) }
								disabled={ isExporting }
								placeholder="https://example.com"
							/>

							<div style={ { marginTop: '16px', marginBottom: '16px' } }>
								{ ! showStaticPathInput ? (
									<>
										<p style={ { marginBottom: '8px' } }>
											{ __( 'Static files will be written to:', 'aether-site-exporter' ) }{ ' ' }
											<code>{ config.staticSitePath || '/wp-content/aether-exports/{job-id}/static-site' }</code>
										</p>
										<Button
											variant="secondary"
											onClick={ () => setShowStaticPathInput( true ) }
											disabled={ isExporting }
											style={ { marginTop: '8px' } }
										>
											{ __( 'Customize Path', 'aether-site-exporter' ) }
										</Button>
									</>
								) : (
									<TextControl
										label={ __( 'Custom Static Site Path', 'aether-site-exporter' ) }
										help={ __( 'Absolute path where static files will be written. Leave empty for default.', 'aether-site-exporter' ) }
										value={ config.staticSitePath }
										onChange={ ( value ) => setConfig( { ...config, staticSitePath: value } ) }
										disabled={ isExporting }
										placeholder="/var/www/html/static-site"
									/>
								) }
							</div>
						</>
					) }

					<CheckboxControl
						label={ __( 'Export WordPress Playground Blueprint Bundle', 'aether-site-exporter' ) }
						help={ __( 'Create a blueprint bundle that can be loaded in WordPress Playground', 'aether-site-exporter' ) }
						checked={ config.exportBlueprint }
						onChange={ ( value ) => setConfig( { ...config, exportBlueprint: value } ) }
						disabled={ isExporting }
					/>

					{ config.exportBlueprint && (
						<div style={ { marginTop: '16px', marginBottom: '16px' } }>
							{ ! showBlueprintPathInput ? (
								<>
									<p style={ { marginBottom: '8px' } }>
										{ __( 'Blueprint bundle will be written to:', 'aether-site-exporter' ) }{ ' ' }
										<code>{ config.blueprintPath || '/wp-content/aether-exports/{job-id}/blueprint-bundle' }</code>
									</p>
									<Button
										variant="secondary"
										onClick={ () => setShowBlueprintPathInput( true ) }
										disabled={ isExporting }
										style={ { marginTop: '8px' } }
									>
										{ __( 'Customize Path', 'aether-site-exporter' ) }
									</Button>
								</>
							) : (
								<TextControl
									label={ __( 'Custom Blueprint Path', 'aether-site-exporter' ) }
									help={ __( 'Absolute path where blueprint bundle will be written. Leave empty for default.', 'aether-site-exporter' ) }
									value={ config.blueprintPath }
									onChange={ ( value ) => setConfig( { ...config, blueprintPath: value } ) }
									disabled={ isExporting }
									placeholder="/var/www/html/blueprint"
								/>
							) }
						</div>
					) }

					<div className="aether-site-exporter__actions">
						<Button
							variant="primary"
							onClick={ startExport }
							disabled={ isExporting }
						>
							{ isExporting ? (
								<>
									<Spinner />
									{ __( 'Exporting...', 'aether-site-exporter' ) }
								</>
							) : (
								__( 'Start Export', 'aether-site-exporter' )
							) }
						</Button>
					</div>

					{ isExporting && jobStatus && (
						<div className="aether-site-exporter__progress">
							<Notice status="info" isDismissible={ false }>
								<p><strong>{ __( 'Export in progress...', 'aether-site-exporter' ) }</strong></p>
								<p>{ __( 'Status:', 'aether-site-exporter' ) } { jobStatus.status }</p>
								{ jobStatus.current_step && (
									<p>{ __( 'Current step:', 'aether-site-exporter' ) } { jobStatus.current_step }</p>
								) }
							</Notice>
						</div>
					) }
				</CardBody>
			</Card>

			{ /* Job History */ }
			<Card style={ { marginTop: '20px' } }>
				<CardHeader>
					<h2>{ __( 'Export History', 'aether-site-exporter' ) }</h2>
				</CardHeader>
				<CardBody>
					{ loadingHistory ? (
						<div style={ { textAlign: 'center', padding: '20px' } }>
							<Spinner />
						</div>
					) : jobHistory.length === 0 ? (
						<p>{ __( 'No exports yet. Create your first export above.', 'aether-site-exporter' ) }</p>
					) : (
						<table className="wp-list-table widefat fixed striped">
							<thead>
								<tr>
									<th>{ __( 'Date', 'aether-site-exporter' ) }</th>
									<th>{ __( 'Status', 'aether-site-exporter' ) }</th>
									<th>{ __( 'Actions', 'aether-site-exporter' ) }</th>
								</tr>
							</thead>
							<tbody>
								{ jobHistory.map( ( job ) => (
									<tr key={ job.id }>
										<td>
											{ new Date( job.created_at ).toLocaleString() }
										</td>
										<td>
											<span className={ `aether-site-exporter__status aether-site-exporter__status--${ job.status }` }>
												{ job.status }
											</span>
											{ job.error_message && (
												<div style={ { color: '#cc1818', fontSize: '12px', marginTop: '4px' } }>
													{ job.error_message }
												</div>
											) }
										</td>
										<td>
											{ job.status === 'complete' && (
												<>
													{ job.workflow_state?.staticSiteZip && (
														<a
															href={ getDownloadUrl( job.id, 'static-site' ) }
															className="button button-small"
															style={ { marginRight: '8px' } }
														>
															{ __( 'Download Static Site', 'aether-site-exporter' ) }
														</a>
													) }
													{ job.workflow_state?.blueprintZip && (
														<a
															href={ getDownloadUrl( job.id, 'blueprint' ) }
															className="button button-small"
															style={ { marginRight: '8px' } }
														>
															{ __( 'Download Blueprint', 'aether-site-exporter' ) }
														</a>
													) }
												</>
											) }
											<Button
												variant="secondary"
												isDestructive
												onClick={ () => deleteJob( job.id ) }
												disabled={ deletingJobId === job.id }
												style={ { marginLeft: '8px' } }
											>
												{ deletingJobId === job.id ? (
													<Spinner />
												) : (
													__( 'Delete', 'aether-site-exporter' )
												) }
											</Button>
										</td>
									</tr>
								) ) }
							</tbody>
						</table>
					) }
				</CardBody>
			</Card>
		</div>
	);
};

export default ExportInterface;
