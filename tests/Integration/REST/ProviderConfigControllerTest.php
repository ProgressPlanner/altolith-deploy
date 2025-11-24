<?php
/**
 * ProviderConfigController Integration Tests
 *
 * Tests the complete provider configuration workflow via REST API.
 * Validates encryption, persistence, and provider integration.
 *
 * @package Aether\SiteExporter\Tests
 */

namespace Aether\SiteExporter\Tests\Integration\REST;

use Aether\SiteExporter\Tests\Helpers\TestCase;
use Aether\SiteExporter\REST\ProviderConfigController;
use Aether\SiteExporter\Utilities\CredentialEncryption;
use WP_REST_Request;

/**
 * ProviderConfigController integration test case.
 */
class ProviderConfigControllerTest extends TestCase {

	/**
	 * Controller instance.
	 *
	 * @var ProviderConfigController
	 */
	private $controller;

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Create admin user for permission checks.
		$this->user_id = $this->factory->user->create( [ 'role' => 'administrator' ] );
		wp_set_current_user( $this->user_id );

		// Initialize REST API.
		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();

		// Register controller routes using rest_api_init hook (WordPress best practice)
		$this->controller = new ProviderConfigController();
		add_action( 'rest_api_init', [ $this->controller, 'registerRoutes' ] );
		do_action( 'rest_api_init', $wp_rest_server );
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		// Clean up settings.
		delete_option( 'aether_site_exporter_settings' );

		parent::tear_down();
	}

	// ========================================================================
	// Config Save/Retrieve Tests
	// ========================================================================

	/**
	 * Test saving and retrieving provider config.
	 */
	public function test_save_and_retrieve_config() {
		$instance_id = 'local-filesystem-static-site:test-uuid';
		$config      = [
			'provider_type' => 'local-filesystem-static-site',
			'path'          => '/test/path',
		];

		// Save config.
		$save_request = new WP_REST_Request( 'POST', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$save_request->set_param( 'config', $config );

		$save_response = rest_do_request( $save_request );
		$this->assertEquals( 200, $save_response->get_status() );

		// Retrieve config.
		$get_request  = new WP_REST_Request( 'GET', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$get_response = rest_do_request( $get_request );

		$this->assertEquals( 200, $get_response->get_status() );

		$response_data = $get_response->get_data();
		$this->assertArrayHasKey( 'config', $response_data );

		$retrieved = $response_data['config'];
		$this->assertEquals( $config['path'], $retrieved['path'] );
	}

	/**
	 * Test credentials are encrypted in storage.
	 */
	public function test_credentials_encrypted_in_storage() {
		$instance_id = 'local-filesystem-static-site:test-uuid';
		$config      = [
			'provider_type' => 'local-filesystem-static-site',
			'path'          => '/test/path',
			'api_key'       => 'secret-key-123',
			'api_secret'    => 'secret-value-456',
		];

		// Save config.
		$request = new WP_REST_Request( 'POST', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$request->set_param( 'config', $config );

		$response = rest_do_request( $request );
		$this->assertEquals( 200, $response->get_status() );

		// Check database - credentials should be encrypted.
		$settings      = get_option( 'aether_site_exporter_settings', [] );
		$stored_config = $settings['providers'][ $instance_id ] ?? [];

		$this->assertArrayHasKey( 'api_key', $stored_config, 'Config should have api_key' );
		$this->assertArrayHasKey( 'api_secret', $stored_config, 'Config should have api_secret' );

		$this->assertNotEquals( 'secret-key-123', $stored_config['api_key'], 'API key should be encrypted in database' );
		$this->assertNotEquals( 'secret-value-456', $stored_config['api_secret'], 'API secret should be encrypted in database' );

		// Verify encrypted values are actually encrypted (not plaintext).
		$this->assertTrue( CredentialEncryption::isEncrypted( $stored_config['api_key'] ) );
		$this->assertTrue( CredentialEncryption::isEncrypted( $stored_config['api_secret'] ) );
	}

	/**
	 * Test credentials are decrypted when retrieved.
	 */
	public function test_credentials_decrypted_on_retrieval() {
		$instance_id = 'local-filesystem-static-site:test-uuid';
		$config      = [
			'provider_type' => 'local-filesystem-static-site',
			'path'          => '/test/path',
			'api_key'       => 'secret-key-123',
		];

		// Save config.
		$save_request = new WP_REST_Request( 'POST', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$save_request->set_param( 'config', $config );
		rest_do_request( $save_request );

		// Retrieve config.
		$get_request  = new WP_REST_Request( 'GET', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$get_response = rest_do_request( $get_request );

		$response_data = $get_response->get_data();
		$retrieved     = $response_data['config'];

		// Should be decrypted.
		$this->assertEquals( 'secret-key-123', $retrieved['api_key'], 'Credentials should be decrypted on retrieval' );
	}

	/**
	 * Test updating existing config preserves unmodified fields.
	 */
	public function test_update_existing_config() {
		$instance_id = 'local-filesystem-static-site:test-uuid';

		// Initial config.
		$initial_config = [
			'path'             => '/initial/path',
			'api_key'          => 'initial-key',
			'custom_field'     => 'preserved',
		];

		$save_request = new WP_REST_Request( 'POST', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$save_request->set_param( 'config', $initial_config );
		rest_do_request( $save_request );

		// Update only path.
		$update_config = [
			'path'             => '/updated/path',
			'api_key'          => 'initial-key',
			'custom_field'     => 'preserved',
		];

		$update_request = new WP_REST_Request( 'POST', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$update_request->set_param( 'config', $update_config );
		rest_do_request( $update_request );

		// Retrieve and verify.
		$get_request  = new WP_REST_Request( 'GET', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$get_response = rest_do_request( $get_request );
		$response_data = $get_response->get_data();
		$retrieved     = $response_data['config'];

		$this->assertEquals( '/updated/path', $retrieved['path'] );
		$this->assertEquals( 'preserved', $retrieved['custom_field'] );
	}

	// ========================================================================
	// Config Deletion Tests
	// ========================================================================

	/**
	 * Test deleting provider config.
	 */
	public function test_delete_config() {
		$instance_id = 'local-filesystem-static-site:test-uuid';
		$config      = [
			'provider_type' => 'local-filesystem-static-site',
			'path'          => '/test/path',
		];

		// Save config.
		$save_request = new WP_REST_Request( 'POST', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$save_request->set_param( 'config', $config );
		rest_do_request( $save_request );

		// Delete config.
		$delete_request  = new WP_REST_Request( 'DELETE', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$delete_response = rest_do_request( $delete_request );

		$this->assertEquals( 200, $delete_response->get_status() );

		// Verify deletion.
		$settings = get_option( 'aether_site_exporter_settings', [] );
		$this->assertArrayNotHasKey( $instance_id, $settings['providers'] ?? [] );
	}

	// ========================================================================
	// Multiple Instances Tests
	// ========================================================================

	/**
	 * Test configuring multiple instances of same provider type.
	 */
	public function test_multiple_instances_same_provider() {
		$instance1 = 'local-filesystem:uuid-1';
		$instance2 = 'local-filesystem:uuid-2';

		$config1 = [
			'path'             => '/path1',
		];
		$config2 = [
			'path'             => '/path2',
		];

		// Save both configs.
		$req1 = new WP_REST_Request( 'POST', '/aether/site-exporter/providers/' . $instance1 . '/config' );
		$req1->set_param( 'config', $config1 );
		rest_do_request( $req1 );

		$req2 = new WP_REST_Request( 'POST', '/aether/site-exporter/providers/' . $instance2 . '/config' );
		$req2->set_param( 'config', $config2 );
		rest_do_request( $req2 );

		// Retrieve both.
		$get1 = new WP_REST_Request( 'GET', '/aether/site-exporter/providers/' . $instance1 . '/config' );
		$get2 = new WP_REST_Request( 'GET', '/aether/site-exporter/providers/' . $instance2 . '/config' );

		$response1 = rest_do_request( $get1 );
		$response2 = rest_do_request( $get2 );

		$this->assertEquals( '/path1', $response1->get_data()['config']['path'] );
		$this->assertEquals( '/path2', $response2->get_data()['config']['path'] );
	}

	// ========================================================================
	// Provider Status Tests
	// ========================================================================

	/**
	 * Test getting provider status.
	 */
	public function test_get_provider_status() {
		$instance_id = 'local-filesystem-static-site:test-uuid';

		// Status before config.
		$status_request = new WP_REST_Request( 'GET', '/aether/site-exporter/providers/' . $instance_id . '/status' );
		$status_response = rest_do_request( $status_request );

		$status = $status_response->get_data();
		$this->assertFalse( $status['configured'] ?? true );

		// Save config.
		$config_request = new WP_REST_Request( 'POST', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$config_request->set_param(
			'config',
			[
				'path'             => '/test/path',
			]
		);
		rest_do_request( $config_request );

		// Status after config.
		$status_response = rest_do_request( $status_request );
		$status          = $status_response->get_data();

		$this->assertTrue( $status['configured'] );
	}

	// ========================================================================
	// Invalid Instance ID Tests
	// ========================================================================

	/**
	 * Test invalid instance ID is rejected.
	 */
	public function test_invalid_instance_id_rejected() {
		$invalid_id = 'invalid-format-no-colon';

		$request = new WP_REST_Request( 'GET', '/aether/site-exporter/providers/' . $invalid_id . '/config' );
		$response = rest_do_request( $request );

		// Should return error.
		$this->assertEquals( 404, $response->get_status() );
	}

	// ========================================================================
	// Permission Tests
	// ========================================================================

	/**
	 * Test non-admin user cannot access config endpoints.
	 */
	public function test_non_admin_cannot_access() {
		// Create subscriber user.
		$subscriber_id = $this->factory->user->create( [ 'role' => 'subscriber' ] );
		wp_set_current_user( $subscriber_id );

		$instance_id = 'local-filesystem-static-site:test-uuid';
		$request     = new WP_REST_Request( 'GET', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$response    = rest_do_request( $request );

		$this->assertEquals( 403, $response->get_status() );
	}

	/**
	 * Test unauthenticated user cannot access config endpoints.
	 */
	public function test_unauthenticated_cannot_access() {
		wp_set_current_user( 0 );

		$instance_id = 'local-filesystem-static-site:test-uuid';
		$request     = new WP_REST_Request( 'GET', '/aether/site-exporter/providers/' . $instance_id . '/config' );
		$response    = rest_do_request( $request );

		// WordPress REST API returns 401 for unauthenticated requests.
		$this->assertContains( $response->get_status(), [ 401, 403 ], 'Unauthenticated users should get 401 or 403' );
	}
}
