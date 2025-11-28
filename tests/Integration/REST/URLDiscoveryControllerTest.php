<?php
/**
 * URLDiscoveryController Integration Tests
 *
 * Comprehensive test suite for the URL Discovery REST controller.
 * Tests URL discovery for posts, terms, authors, and archives with
 * pagination, filtering, and data integrity.
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
	// getPosts Tests (CRITICAL)
	// ========================================================================

	/**
	 * Test get posts returns success response.
	 */
	public function test_get_posts_returns_success() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/posts' );

		$response = $this->controller->getPosts( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
	}

	/**
	 * Test get posts returns required fields.
	 */
	public function test_get_posts_returns_required_fields() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/posts' );

		$response = $this->controller->getPosts( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'success', $data );
		$this->assertArrayHasKey( 'urls', $data );
		$this->assertArrayHasKey( 'hasMore', $data );
		$this->assertArrayHasKey( 'nextPage', $data );
		$this->assertArrayHasKey( 'total', $data );
	}

	/**
	 * Test get posts returns array of URLs.
	 */
	public function test_get_posts_returns_array_of_urls() {
		// Create a test post.
		$post_id = $this->factory->post->create(
			[
				'post_status' => 'publish',
				'post_title'  => 'Test Post',
			]
		);

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/posts' );

		$response = $this->controller->getPosts( $request );
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
	 * Test get posts pagination.
	 */
	public function test_get_posts_pagination() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/posts' );
		$request->set_param( 'page', 1 );

		$response = $this->controller->getPosts( $request );
		$data = $response->get_data();

		$this->assertIsBool( $data['hasMore'] );
		$this->assertIsInt( $data['total'] );

		if ( $data['hasMore'] ) {
			$this->assertEquals( 2, $data['nextPage'] );
		} else {
			$this->assertNull( $data['nextPage'] );
		}
	}

	/**
	 * Test get posts page 2.
	 */
	public function test_get_posts_page_2() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/posts' );
		$request->set_param( 'page', 2 );

		$response = $this->controller->getPosts( $request );
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
		$this->assertIsArray( $data['urls'] );
	}

	/**
	 * Test get posts only includes published posts.
	 */
	public function test_get_posts_only_published() {
		// Create published post.
		$published_id = $this->factory->post->create(
			[
				'post_status' => 'publish',
				'post_title'  => 'Published Post',
			]
		);

		// Create draft post.
		$draft_id = $this->factory->post->create(
			[
				'post_status' => 'draft',
				'post_title'  => 'Draft Post',
			]
		);

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/posts' );

		$response = $this->controller->getPosts( $request );
		$data = $response->get_data();

		$published_url = get_permalink( $published_id );
		$draft_url = get_permalink( $draft_id );

		// Published post should be in results.
		$this->assertContains( $published_url, $data['urls'] );

		// Draft post should not be in results.
		$this->assertNotContains( $draft_url, $data['urls'] );
	}

	// ========================================================================
	// getTerms Tests (CRITICAL)
	// ========================================================================

	/**
	 * Test get terms returns success response.
	 */
	public function test_get_terms_returns_success() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/terms' );

		$response = $this->controller->getTerms( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
	}

	/**
	 * Test get terms returns required fields.
	 */
	public function test_get_terms_returns_required_fields() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/terms' );

		$response = $this->controller->getTerms( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'success', $data );
		$this->assertArrayHasKey( 'urls', $data );
		$this->assertArrayHasKey( 'hasMore', $data );
		$this->assertArrayHasKey( 'nextPage', $data );
		$this->assertArrayHasKey( 'total', $data );
	}

	/**
	 * Test get terms returns array of URLs.
	 */
	public function test_get_terms_returns_array_of_urls() {
		// Create a test term.
		$term = $this->factory->term->create(
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
		wp_set_post_terms( $post_id, [ $term ], 'category' );

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/terms' );

		$response = $this->controller->getTerms( $request );
		$data = $response->get_data();

		$this->assertIsArray( $data['urls'] );

		// Verify URLs are valid.
		foreach ( $data['urls'] as $url ) {
			$this->assertIsString( $url );
			$this->assertStringStartsWith( home_url(), $url );
		}
	}

	/**
	 * Test get terms pagination.
	 */
	public function test_get_terms_pagination() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/terms' );
		$request->set_param( 'page', 1 );

		$response = $this->controller->getTerms( $request );
		$data = $response->get_data();

		$this->assertIsBool( $data['hasMore'] );
		$this->assertIsInt( $data['total'] );

		if ( $data['hasMore'] ) {
			$this->assertEquals( 2, $data['nextPage'] );
		} else {
			$this->assertNull( $data['nextPage'] );
		}
	}

	/**
	 * Test get terms excludes empty terms.
	 */
	public function test_get_terms_excludes_empty_terms() {
		// Create empty term (not associated with any posts).
		$empty_term = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Empty Category',
			]
		);

		// Create non-empty term.
		$term = $this->factory->term->create(
			[
				'taxonomy' => 'category',
				'name'     => 'Used Category',
			]
		);

		$post_id = $this->factory->post->create(
			[
				'post_status' => 'publish',
			]
		);
		wp_set_post_terms( $post_id, [ $term ], 'category' );

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/terms' );

		$response = $this->controller->getTerms( $request );
		$data = $response->get_data();

		$used_term_link = get_term_link( $term );
		$empty_term_link = get_term_link( $empty_term );

		// Non-empty term should be in results.
		if ( ! is_wp_error( $used_term_link ) ) {
			$this->assertContains( $used_term_link, $data['urls'] );
		}

		// Empty term should not be in results.
		if ( ! is_wp_error( $empty_term_link ) ) {
			$this->assertNotContains( $empty_term_link, $data['urls'] );
		}
	}

	// ========================================================================
	// getAuthors Tests (CRITICAL)
	// ========================================================================

	/**
	 * Test get authors returns success response.
	 */
	public function test_get_authors_returns_success() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/authors' );

		$response = $this->controller->getAuthors( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
	}

	/**
	 * Test get authors returns required fields.
	 */
	public function test_get_authors_returns_required_fields() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/authors' );

		$response = $this->controller->getAuthors( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'success', $data );
		$this->assertArrayHasKey( 'urls', $data );
		$this->assertArrayHasKey( 'hasMore', $data );
		$this->assertArrayHasKey( 'nextPage', $data );
		$this->assertArrayHasKey( 'total', $data );
	}

	/**
	 * Test get authors returns array of URLs.
	 */
	public function test_get_authors_returns_array_of_urls() {
		// Admin user has edit_posts capability.
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/authors' );

		$response = $this->controller->getAuthors( $request );
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
	 * Test get authors pagination.
	 */
	public function test_get_authors_pagination() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/authors' );
		$request->set_param( 'page', 1 );

		$response = $this->controller->getAuthors( $request );
		$data = $response->get_data();

		$this->assertIsBool( $data['hasMore'] );
		$this->assertIsInt( $data['total'] );

		if ( $data['hasMore'] ) {
			$this->assertEquals( 2, $data['nextPage'] );
		} else {
			$this->assertNull( $data['nextPage'] );
		}
	}

	/**
	 * Test get authors includes admin user.
	 */
	public function test_get_authors_includes_admin() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/authors' );

		$response = $this->controller->getAuthors( $request );
		$data = $response->get_data();

		$admin_url = get_author_posts_url( $this->admin_user_id );

		$this->assertContains( $admin_url, $data['urls'] );
	}

	/**
	 * Test get authors excludes users without edit_posts.
	 */
	public function test_get_authors_excludes_non_editors() {
		// Create subscriber (no edit_posts capability).
		$subscriber_id = $this->factory->user->create(
			[
				'role' => 'subscriber',
			]
		);

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/authors' );

		$response = $this->controller->getAuthors( $request );
		$data = $response->get_data();

		$subscriber_url = get_author_posts_url( $subscriber_id );

		$this->assertNotContains( $subscriber_url, $data['urls'] );
	}

	// ========================================================================
	// getArchives Tests (CRITICAL)
	// ========================================================================

	/**
	 * Test get archives returns success response.
	 */
	public function test_get_archives_returns_success() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/archives' );

		$response = $this->controller->getArchives( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
	}

	/**
	 * Test get archives returns required fields.
	 */
	public function test_get_archives_returns_required_fields() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/archives' );

		$response = $this->controller->getArchives( $request );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'success', $data );
		$this->assertArrayHasKey( 'urls', $data );
		$this->assertArrayHasKey( 'hasMore', $data );
		$this->assertArrayHasKey( 'nextPage', $data );
		$this->assertArrayHasKey( 'total', $data );
	}

	/**
	 * Test get archives includes homepage.
	 */
	public function test_get_archives_includes_homepage() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/archives' );

		$response = $this->controller->getArchives( $request );
		$data = $response->get_data();

		$this->assertContains( home_url( '/' ), $data['urls'] );
	}

	/**
	 * Test get archives is not paginated.
	 */
	public function test_get_archives_not_paginated() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/archives' );

		$response = $this->controller->getArchives( $request );
		$data = $response->get_data();

		$this->assertFalse( $data['hasMore'] );
		$this->assertNull( $data['nextPage'] );
	}

	/**
	 * Test get archives total matches URL count.
	 */
	public function test_get_archives_total_matches_count() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/archives' );

		$response = $this->controller->getArchives( $request );
		$data = $response->get_data();

		$this->assertEquals( count( $data['urls'] ), $data['total'] );
	}

	/**
	 * Test get archives returns array of URLs.
	 */
	public function test_get_archives_returns_array_of_urls() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/archives' );

		$response = $this->controller->getArchives( $request );
		$data = $response->get_data();

		$this->assertIsArray( $data['urls'] );
		$this->assertGreaterThan( 0, count( $data['urls'] ) );

		// Verify URLs are valid.
		foreach ( $data['urls'] as $url ) {
			$this->assertIsString( $url );
			$this->assertStringStartsWith( home_url(), $url );
		}
	}

	// ========================================================================
	// Response Structure Tests (MEDIUM)
	// ========================================================================

	/**
	 * Test all endpoints have consistent response structure.
	 */
	public function test_consistent_response_structure() {
		$endpoints = [
			[ 'method' => 'getPosts', 'params' => [] ],
			[ 'method' => 'getTerms', 'params' => [] ],
			[ 'method' => 'getAuthors', 'params' => [] ],
			[ 'method' => 'getArchives', 'params' => [] ],
		];

		foreach ( $endpoints as $endpoint ) {
			$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/' . strtolower( str_replace( 'get', '', $endpoint['method'] ) ) );

			$method = $endpoint['method'];
			$response = $this->controller->$method( $request );
			$data = $response->get_data();

			$this->assertArrayHasKey( 'success', $data, "Endpoint {$method} should have 'success'" );
			$this->assertArrayHasKey( 'urls', $data, "Endpoint {$method} should have 'urls'" );
			$this->assertArrayHasKey( 'hasMore', $data, "Endpoint {$method} should have 'hasMore'" );
			$this->assertArrayHasKey( 'nextPage', $data, "Endpoint {$method} should have 'nextPage'" );
			$this->assertArrayHasKey( 'total', $data, "Endpoint {$method} should have 'total'" );
		}
	}

	/**
	 * Test URLs are always strings.
	 */
	public function test_urls_are_always_strings() {
		// Create a post to ensure we have URLs to test.
		$this->factory->post->create( [ 'post_status' => 'publish' ] );

		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/posts' );

		$response = $this->controller->getPosts( $request );
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
		$endpoints = [ 'getPosts', 'getTerms', 'getAuthors', 'getArchives' ];

		foreach ( $endpoints as $method ) {
			$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/' . strtolower( str_replace( 'get', '', $method ) ) );

			$response = $this->controller->$method( $request );
			$data = $response->get_data();

			$this->assertIsInt( $data['total'], "Endpoint {$method} total should be integer" );
		}
	}

	// ========================================================================
	// Pagination Logic Tests (HIGH)
	// ========================================================================

	/**
	 * Test nextPage is null when hasMore is false.
	 */
	public function test_next_page_null_when_no_more() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/posts' );

		$response = $this->controller->getPosts( $request );
		$data = $response->get_data();

		// Verify the nextPage/hasMore relationship.
		if ( ! $data['hasMore'] ) {
			$this->assertNull( $data['nextPage'] );
		} else {
			$this->assertNotNull( $data['nextPage'] );
		}
	}

	/**
	 * Test nextPage is page + 1 when hasMore is true.
	 */
	public function test_next_page_increments_when_has_more() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/posts' );
		$request->set_param( 'page', 1 );

		$response = $this->controller->getPosts( $request );
		$data = $response->get_data();

		// Verify nextPage logic based on hasMore.
		if ( $data['hasMore'] ) {
			$this->assertEquals( 2, $data['nextPage'] );
		} else {
			// In test environment, usually no pagination needed.
			$this->assertNull( $data['nextPage'] );
		}
	}

	/**
	 * Test page parameter defaults to 1.
	 */
	public function test_page_defaults_to_one() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/posts' );
		// No page parameter.

		$response = $this->controller->getPosts( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	// ========================================================================
	// URL Validation Tests (MEDIUM)
	// ========================================================================

	/**
	 * Test URLs start with home URL.
	 */
	public function test_urls_start_with_home_url() {
		$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/archives' );

		$response = $this->controller->getArchives( $request );
		$data = $response->get_data();

		foreach ( $data['urls'] as $url ) {
			$this->assertStringStartsWith( home_url(), $url );
		}
	}

	/**
	 * Test no duplicate URLs in results.
	 */
	public function test_no_duplicate_urls() {
		$endpoints = [ 'getPosts', 'getTerms', 'getAuthors', 'getArchives' ];

		foreach ( $endpoints as $method ) {
			$request = new WP_REST_Request( 'GET', '/altolith/v1/urls/' . strtolower( str_replace( 'get', '', $method ) ) );

			$response = $this->controller->$method( $request );
			$data = $response->get_data();

			$unique_urls = array_unique( $data['urls'] );

			$this->assertCount(
				count( $unique_urls ),
				$data['urls'],
				"Endpoint {$method} should not have duplicate URLs"
			);
		}
	}
}
