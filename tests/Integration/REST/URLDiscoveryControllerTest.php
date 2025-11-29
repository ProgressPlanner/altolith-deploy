<?php
/**
 * URLDiscoveryController Integration Tests
 *
 * Test suite for the URL Discovery REST controller.
 * Tests the consolidated URL discovery endpoint that returns
 * posts, terms, authors, archives, and pagination URLs.
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Integration\REST;

use Altolith\Deploy\Tests\Helpers\TestCase;
use Altolith\Deploy\REST\URLDiscoveryController;
use WP_REST_Request;

/**
 * Test URLDiscoveryController class.
 */
class URLDiscoveryControllerTest extends TestCase {
	/**
	 * Controller instance.
	 *
	 * @var URLDiscoveryController
	 */
	private $controller;

	/**
	 * Test admin user ID.
	 *
	 * @var int
	 */
	private $admin_user_id;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();

		$this->controller = new URLDiscoveryController();
		$this->admin_user_id = $this->act_as_admin();
	}

	// ========================================================================
	// discoverUrls Tests (CRITICAL)
	// ========================================================================

	/**
	 * Test discover URLs returns success response.
	 */
	public function test_discover_urls_returns_success() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
	}

	/**
	 * Test discover URLs returns required fields.
	 */
	public function test_discover_urls_returns_required_fields() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'success', $data );
		$this->assertArrayHasKey( 'urls', $data );
		$this->assertArrayHasKey( 'total', $data );
	}

	/**
	 * Test discover URLs no longer has pagination fields.
	 */
	public function test_discover_urls_no_pagination_fields() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$this->assertArrayNotHasKey( 'hasMore', $data );
		$this->assertArrayNotHasKey( 'nextPage', $data );
	}

	/**
	 * Test discover URLs returns array of URLs.
	 */
	public function test_discover_urls_returns_array_of_urls() {
		// Create a test post.
		$this->factory->post->create(
			[
				'post_status' => 'publish',
				'post_title'  => 'Test Post',
			]
		);

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$this->assertIsArray( $data['urls'] );
		$this->assertGreaterThan( 0, count( $data['urls'] ) );

		// Verify URLs are valid.
		foreach ( $data['urls'] as $url ) {
			$this->assertIsString( $url );
			$this->assertStringStartsWith( home_url(), $url );
		}
	}

	/**
	 * Test discover URLs total matches URL count.
	 */
	public function test_discover_urls_total_matches_count() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$this->assertEquals( count( $data['urls'] ), $data['total'] );
	}

	/**
	 * Test discover URLs includes homepage.
	 */
	public function test_discover_urls_includes_homepage() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$this->assertContains( home_url( '/' ), $data['urls'] );
	}

	/**
	 * Test discover URLs includes published posts.
	 */
	public function test_discover_urls_includes_published_posts() {
		// Create published post.
		$post_id = $this->factory->post->create(
			[
				'post_status' => 'publish',
				'post_title'  => 'Published Post',
			]
		);

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$published_url = get_permalink( $post_id );
		$this->assertContains( $published_url, $data['urls'] );
	}

	/**
	 * Test discover URLs excludes draft posts.
	 */
	public function test_discover_urls_excludes_draft_posts() {
		// Create draft post.
		$draft_id = $this->factory->post->create(
			[
				'post_status' => 'draft',
				'post_title'  => 'Draft Post',
			]
		);

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$draft_url = get_permalink( $draft_id );
		$this->assertNotContains( $draft_url, $data['urls'] );
	}

	/**
	 * Test discover URLs includes author URLs.
	 */
	public function test_discover_urls_includes_author_urls() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$admin_url = get_author_posts_url( $this->admin_user_id );
		$this->assertContains( $admin_url, $data['urls'] );
	}

	/**
	 * Test discover URLs includes term URLs.
	 */
	public function test_discover_urls_includes_term_urls() {
		// Create a test term.
		$term_id = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Test Category',
			]
		);

		// Associate term with a post (make it non-empty).
		$post_id = $this->factory->post->create(
			[
				'post_status' => 'publish',
			]
		);
		wp_set_post_terms( $post_id, [ $term_id ], 'category' );

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$term_url = get_term_link( $term_id );
		if ( ! is_wp_error( $term_url ) ) {
			$this->assertContains( $term_url, $data['urls'] );
		}
	}

	/**
	 * Test discover URLs excludes empty terms.
	 */
	public function test_discover_urls_excludes_empty_terms() {
		// Create empty term (not associated with any posts).
		$empty_term = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Empty Category',
			]
		);

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$empty_term_url = get_term_link( $empty_term );
		if ( ! is_wp_error( $empty_term_url ) ) {
			$this->assertNotContains( $empty_term_url, $data['urls'] );
		}
	}

	// ========================================================================
	// Type Filtering Tests (MEDIUM)
	// ========================================================================

	/**
	 * Test discover URLs can filter by types.
	 */
	public function test_discover_urls_filter_by_types() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );
		$request->set_param( 'types', [ 'archives' ] );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
		$this->assertIsArray( $data['urls'] );
		// Should include homepage at minimum.
		$this->assertContains( home_url( '/' ), $data['urls'] );
	}

	/**
	 * Test discover URLs with posts type only.
	 */
	public function test_discover_urls_posts_type_only() {
		// Create a test post.
		$post_id = $this->factory->post->create(
			[
				'post_status' => 'publish',
				'post_title'  => 'Test Post',
			]
		);

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );
		$request->set_param( 'types', [ 'posts' ] );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$post_url = get_permalink( $post_id );
		$this->assertContains( $post_url, $data['urls'] );
		// Should NOT include homepage since archives type not requested.
		$this->assertNotContains( home_url( '/' ), $data['urls'] );
	}

	/**
	 * Test discover URLs with multiple types.
	 */
	public function test_discover_urls_multiple_types() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );
		$request->set_param( 'types', [ 'archives', 'authors' ] );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
		// Should include homepage (from archives).
		$this->assertContains( home_url( '/' ), $data['urls'] );
		// Should include admin author URL.
		$admin_url = get_author_posts_url( $this->admin_user_id );
		$this->assertContains( $admin_url, $data['urls'] );
	}

	// ========================================================================
	// URL Validation Tests (MEDIUM)
	// ========================================================================

	/**
	 * Test URLs are always strings.
	 */
	public function test_urls_are_always_strings() {
		// Create a post to ensure we have URLs to test.
		$this->factory->post->create( [ 'post_status' => 'publish' ] );

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$this->assertNotEmpty( $data['urls'], 'Should have at least one URL' );
		foreach ( $data['urls'] as $url ) {
			$this->assertIsString( $url );
		}
	}

	/**
	 * Test total is always integer.
	 */
	public function test_total_is_always_integer() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$this->assertIsInt( $data['total'] );
	}

	/**
	 * Test URLs start with home URL.
	 */
	public function test_urls_start_with_home_url() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		foreach ( $data['urls'] as $url ) {
			$this->assertStringStartsWith( home_url(), $url );
		}
	}

	/**
	 * Test no duplicate URLs in results.
	 */
	public function test_no_duplicate_urls() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$unique_urls = array_unique( $data['urls'] );

		$this->assertCount(
			count( $unique_urls ),
			$data['urls'],
			'Should not have duplicate URLs'
		);
	}

	/**
	 * Test excludes subscribers from author URLs.
	 */
	public function test_excludes_subscribers_from_authors() {
		// Create subscriber (no edit_posts capability).
		$subscriber_id = $this->factory->user->create(
			[
				'role' => 'subscriber',
			]
		);

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/discover' );

		$response = $this->controller->discoverUrls( $request );
		$data = $response->get_data();

		$subscriber_url = get_author_posts_url( $subscriber_id );
		$this->assertNotContains( $subscriber_url, $data['urls'] );
	}
}
