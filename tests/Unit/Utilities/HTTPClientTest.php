<?php

/**
 * HTTP Client Tests
 *
 * Tests for HTTPClient - wrapper around WordPress HTTP API.
 *
 * Quality Standards:
 * - Tests must verify error handling works correctly
 * - Must test status code validation
 * - Must test timeout configuration
 * - Must fail if errors are not caught properly
 *
 * @package Altolith\Deploy\Tests
 */

namespace Altolith\Deploy\Tests\Unit\Utilities;

use Altolith\Deploy\Utilities\HTTPClient;
use Altolith\Deploy\Tests\Helpers\TestCase;
use WP_Error;

class HTTPClientTest extends TestCase
{
	/**
	 * Set up test environment.
	 */
	public function setUp(): void
	{
		parent::setUp();
	}

	/**
	 * Test get method returns success response.
	 */
	public function test_get_returns_success_response(): void
	{
		// Mock wp_remote_get to return success
		add_filter( 'pre_http_request', function( $preempt, $args, $url ) {
			return [
				'response' => [
					'code' => 200,
					'message' => 'OK',
				],
				'body' => 'Test response body',
			];
		}, 10, 3 );

		$result = HTTPClient::get( 'https://example.com/test' );

		$this->assertTrue( $result['success'] );
		$this->assertSame( 'Test response body', $result['body'] );
		$this->assertSame( 200, $result['status_code'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method handles WP_Error.
	 */
	public function test_get_handles_wp_error(): void
	{
		// Mock wp_remote_get to return WP_Error
		add_filter( 'pre_http_request', function() {
			return new WP_Error( 'http_request_failed', 'Connection timeout' );
		} );

		$result = HTTPClient::get( 'https://example.com/test' );

		$this->assertFalse( $result['success'] );
		$this->assertSame( 'Connection timeout', $result['error'] );
		$this->assertSame( 'http_request_failed', $result['error_code'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method validates status codes.
	 */
	public function test_get_validates_status_codes(): void
	{
		// Mock wp_remote_get to return 404
		add_filter( 'pre_http_request', function() {
			return [
				'response' => [
					'code' => 404,
					'message' => 'Not Found',
				],
				'body' => 'Page not found',
			];
		} );

		$result = HTTPClient::get( 'https://example.com/missing' );

		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( '404', $result['error'] );
		$this->assertSame( 404, $result['status_code'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method allows custom status codes.
	 */
	public function test_get_allows_custom_status_codes(): void
	{
		// Mock wp_remote_get to return 201
		add_filter( 'pre_http_request', function() {
			return [
				'response' => [
					'code' => 201,
					'message' => 'Created',
				],
				'body' => 'Resource created',
			];
		} );

		// 201 should fail with default allowed codes
		$result1 = HTTPClient::get( 'https://example.com/test' );
		$this->assertFalse( $result1['success'] );

		// 201 should succeed when explicitly allowed
		$result2 = HTTPClient::get( 'https://example.com/test', [], [ 200, 201 ] );
		$this->assertTrue( $result2['success'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method sets default timeout.
	 */
	public function test_get_sets_default_timeout(): void
	{
		$capturedArgs = null;

		add_filter( 'pre_http_request', function( $preempt, $args ) use ( &$capturedArgs ) {
			$capturedArgs = $args;

			return [
				'response' => [ 'code' => 200 ],
				'body' => 'Test',
			];
		}, 10, 2 );

		HTTPClient::get( 'https://example.com/test' );

		$this->assertArrayHasKey( 'timeout', $capturedArgs );
		$this->assertSame( 30, $capturedArgs['timeout'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method allows custom timeout.
	 */
	public function test_get_allows_custom_timeout(): void
	{
		$capturedArgs = null;

		add_filter( 'pre_http_request', function( $preempt, $args ) use ( &$capturedArgs ) {
			$capturedArgs = $args;

			return [
				'response' => [ 'code' => 200 ],
				'body' => 'Test',
			];
		}, 10, 2 );

		HTTPClient::get( 'https://example.com/test', [ 'timeout' => 60 ] );

		$this->assertSame( 60, $capturedArgs['timeout'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method preserves custom args.
	 */
	public function test_get_preserves_custom_args(): void
	{
		$capturedArgs = null;

		add_filter( 'pre_http_request', function( $preempt, $args ) use ( &$capturedArgs ) {
			$capturedArgs = $args;

			return [
				'response' => [ 'code' => 200 ],
				'body' => 'Test',
			];
		}, 10, 2 );

		$customArgs = [
			'headers' => [
				'Authorization' => 'Bearer token123',
			],
			'user-agent' => 'Custom Agent',
		];

		HTTPClient::get( 'https://example.com/test', $customArgs );

		$this->assertArrayHasKey( 'headers', $capturedArgs );
		$this->assertSame( 'Bearer token123', $capturedArgs['headers']['Authorization'] );
		$this->assertSame( 'Custom Agent', $capturedArgs['user-agent'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method handles empty response body.
	 */
	public function test_get_handles_empty_response_body(): void
	{
		add_filter( 'pre_http_request', function() {
			return [
				'response' => [ 'code' => 200 ],
				'body' => '',
			];
		} );

		$result = HTTPClient::get( 'https://example.com/test' );

		$this->assertTrue( $result['success'] );
		$this->assertSame( '', $result['body'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method handles 500 server errors.
	 */
	public function test_get_handles_server_errors(): void
	{
		add_filter( 'pre_http_request', function() {
			return [
				'response' => [
					'code' => 500,
					'message' => 'Internal Server Error',
				],
				'body' => 'Server error',
			];
		} );

		$result = HTTPClient::get( 'https://example.com/test' );

		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( '500', $result['error'] );
		$this->assertSame( 500, $result['status_code'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method handles 3xx redirects.
	 */
	public function test_get_handles_redirects(): void
	{
		add_filter( 'pre_http_request', function() {
			return [
				'response' => [
					'code' => 301,
					'message' => 'Moved Permanently',
				],
				'body' => '',
			];
		} );

		// 301 should fail with default allowed codes
		$result = HTTPClient::get( 'https://example.com/test' );

		$this->assertFalse( $result['success'] );
		$this->assertSame( 301, $result['status_code'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method allows multiple allowed status codes.
	 */
	public function test_get_allows_multiple_status_codes(): void
	{
		add_filter( 'pre_http_request', function( $preempt, $args, $url ) {
			// Return different codes for different URLs
			if ( str_contains( $url, '/created' ) ) {
				return [
					'response' => [ 'code' => 201 ],
					'body' => 'Created',
				];
			}

			return [
				'response' => [ 'code' => 200 ],
				'body' => 'OK',
			];
		}, 10, 3 );

		$allowedCodes = [ 200, 201, 202 ];

		$result1 = HTTPClient::get( 'https://example.com/ok', [], $allowedCodes );
		$this->assertTrue( $result1['success'] );

		$result2 = HTTPClient::get( 'https://example.com/created', [], $allowedCodes );
		$this->assertTrue( $result2['success'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method handles malformed responses.
	 */
	public function test_get_handles_malformed_responses(): void
	{
		add_filter( 'pre_http_request', function() {
			// Return malformed response (missing code)
			return [
				'response' => [],
				'body' => 'Test',
			];
		} );

		$result = HTTPClient::get( 'https://example.com/test' );

		// Should handle gracefully
		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'success', $result );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method includes status code in error response.
	 */
	public function test_get_includes_status_code_in_error(): void
	{
		add_filter( 'pre_http_request', function() {
			return [
				'response' => [ 'code' => 403 ],
				'body' => 'Forbidden',
			];
		} );

		$result = HTTPClient::get( 'https://example.com/test' );

		$this->assertFalse( $result['success'] );
		$this->assertArrayHasKey( 'status_code', $result );
		$this->assertSame( 403, $result['status_code'] );

		remove_all_filters( 'pre_http_request' );
	}

	/**
	 * Test get method with various HTTP status codes.
	 */
	public function test_get_with_various_status_codes(): void
	{
		$testCases = [
			200 => true,  // OK
			201 => false, // Created (not in default allowed)
			204 => false, // No Content
			400 => false, // Bad Request
			401 => false, // Unauthorized
			403 => false, // Forbidden
			404 => false, // Not Found
			500 => false, // Internal Server Error
			502 => false, // Bad Gateway
			503 => false, // Service Unavailable
		];

		foreach ( $testCases as $statusCode => $expectedSuccess ) {
			add_filter( 'pre_http_request', function() use ( $statusCode ) {
				return [
					'response' => [ 'code' => $statusCode ],
					'body' => "Response for $statusCode",
				];
			} );

			$result = HTTPClient::get( 'https://example.com/test' );

			$this->assertSame(
				$expectedSuccess,
				$result['success'],
				"Status code $statusCode should " . ( $expectedSuccess ? 'succeed' : 'fail' )
			);

			remove_all_filters( 'pre_http_request' );
		}
	}
}
