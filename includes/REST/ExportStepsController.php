<?php
/**
 * Export Steps Controller
 *
 * Handles PHP-based export workflow steps (URL discovery, archive creation, etc.).
 *
 * @package AetherSiteExporter\REST
 * @since 1.0.0
 */

declare(strict_types=1);

namespace AetherSiteExporter\REST;

use AetherSiteExporter\Sync\JobStateManager;
use WP_REST_Request;
use WP_Error;

/**
 * Export steps controller.
 *
 * @since 1.0.0
 */
class ExportStepsController {
	use RESTHelpersTrait;

	/**
	 * Job state manager instance.
	 *
	 * @var JobStateManager
	 */
	private JobStateManager $state_manager;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->state_manager = new JobStateManager();
	}

	/**
	 * Register REST routes.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_routes(): void {
		// Discover URLs.
		register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/discover-urls',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'discover_urls' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Generate blueprint bundle.
		register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/generate-blueprint',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'generate_blueprint_bundle' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Create static site archive.
		register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/create-archive',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'create_static_site_archive' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);

		// Cleanup old exports.
		register_rest_route(
			$this->get_namespace(),
			'/export/(?P<jobId>[a-zA-Z0-9_]+)/cleanup',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'cleanup' ],
				'permission_callback' => [ $this, 'permission_check' ],
			]
		);
	}

	/**
	 * Discover URLs step.
	 *
	 * TODO: Implement URL discovery service.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function discover_urls( WP_REST_Request $request ) {
		$job_id = $this->validate_job_id( $request );
		if ( is_wp_error( $job_id ) ) {
			return $job_id;
		}

		// TODO: Implement URL discovery.
		$urls = [];

		// Update job state.
		$this->state_manager->update_status(
			$job_id,
			[
				'workflow_state' => [
					'urls'     => $urls,
					'urlCount' => count( $urls ),
				],
			]
		);

		return $this->success_response(
			[ 'urls' => $urls ],
			sprintf(
				/* translators: %d: number of URLs */
				__( 'Discovered %d URLs', 'aether-site-exporter' ),
				count( $urls )
			)
		);
	}

	/**
	 * Generate blueprint bundle step.
	 *
	 * TODO: Implement blueprint bundle generation.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function generate_blueprint_bundle( WP_REST_Request $request ) {
		$job_id = $this->validate_job_id( $request );
		if ( is_wp_error( $job_id ) ) {
			return $job_id;
		}

		// TODO: Implement blueprint bundle generation.

		return $this->success_response(
			null,
			__( 'Blueprint bundle generated', 'aether-site-exporter' )
		);
	}

	/**
	 * Create static site archive step.
	 *
	 * TODO: Implement static site archive creation.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function create_static_site_archive( WP_REST_Request $request ) {
		$job_id = $this->validate_job_id( $request );
		if ( is_wp_error( $job_id ) ) {
			return $job_id;
		}

		// TODO: Implement archive creation.

		return $this->success_response(
			null,
			__( 'Static site archive created', 'aether-site-exporter' )
		);
	}

	/**
	 * Cleanup step.
	 *
	 * TODO: Implement cleanup logic.
	 *
	 * @since 1.0.0
	 * @param WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function cleanup( WP_REST_Request $request ) {
		$job_id = $this->validate_job_id( $request );
		if ( is_wp_error( $job_id ) ) {
			return $job_id;
		}

		// TODO: Implement cleanup.

		return $this->success_response(
			null,
			__( 'Cleanup complete', 'aether-site-exporter' )
		);
	}
}
