<?php

/**
 * Profiles REST Controller
 *
 * Handles CRUD operations for profiles.
 * Profiles store reusable configuration like credentials that can be
 * shared across multiple provider instances.
 *
 * @package Altolith\REST
 */

namespace Altolith\Deploy\REST;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Altolith\Deploy\Core\ProfilesRepository;

/**
 * Profiles REST endpoints.
 */
class ProfilesController
{
	use RESTHelpersTrait;

	/**
	 * Profiles repository instance.
	 *
	 * @var ProfilesRepository
	 */
	private ProfilesRepository $repository;

	/**
	 * Constructor.
	 */
	public function __construct()
	{
		$this->repository = new ProfilesRepository();
	}

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// List all profiles.
		\register_rest_route(
			$this->getNamespace(),
			'/profiles',
			[
				[
					'methods' => 'GET',
					'callback' => [$this, 'listProfiles'],
					'permission_callback' => [$this, 'permissionCheck'],
				],
				[
					'methods' => 'POST',
					'callback' => [$this, 'createProfile'],
					'permission_callback' => [$this, 'permissionCheck'],
					'args' => [
						'name' => [
							'required' => true,
							'type' => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						],
						'category' => [
							'required' => true,
							'type' => 'string',
							'sanitize_callback' => 'sanitize_key',
						],
						'type' => [
							'required' => true,
							'type' => 'string',
							'sanitize_callback' => 'sanitize_key',
						],
						'fields' => [
							'required' => false,
							'type' => 'object',
							'default' => [],
						],
					],
				],
			]
		);

		// Single profile operations.
		\register_rest_route(
			$this->getNamespace(),
			'/profiles/(?P<id>[a-f0-9-]+)',
			[
				[
					'methods' => 'GET',
					'callback' => [$this, 'getProfile'],
					'permission_callback' => [$this, 'permissionCheck'],
				],
				[
					'methods' => 'PUT',
					'callback' => [$this, 'updateProfile'],
					'permission_callback' => [$this, 'permissionCheck'],
					'args' => [
						'name' => [
							'required' => false,
							'type' => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						],
						'fields' => [
							'required' => false,
							'type' => 'object',
						],
					],
				],
				[
					'methods' => 'DELETE',
					'callback' => [$this, 'deleteProfile'],
					'permission_callback' => [$this, 'permissionCheck'],
				],
			]
		);

		// Get profile references (which instances use this profile).
		\register_rest_route(
			$this->getNamespace(),
			'/profiles/(?P<id>[a-f0-9-]+)/references',
			[
				'methods' => 'GET',
				'callback' => [$this, 'getProfileReferences'],
				'permission_callback' => [$this, 'permissionCheck'],
			]
		);

		// Test profile credentials.
		\register_rest_route(
			$this->getNamespace(),
			'/profiles/(?P<id>[a-f0-9-]+)/test',
			[
				'methods' => 'POST',
				'callback' => [$this, 'testProfile'],
				'permission_callback' => [$this, 'permissionCheck'],
			]
		);
	}

	/**
	 * List all profiles.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response with profiles array.
	 */
	public function listProfiles(WP_REST_Request $request): WP_REST_Response
	{
		$category = $request->get_param('category');
		$type = $request->get_param('type');

		if ($category && $type) {
			$profiles = $this->repository->getByType($category, $type);
		} elseif ($category) {
			$profiles = $this->repository->getByCategory($category);
		} else {
			$profiles = $this->repository->getAll();
		}

		// Convert to indexed array for JSON response.
		$profilesArray = \array_values($profiles);

		return new WP_REST_Response(
			[
				'success' => true,
				'profiles' => $profilesArray,
			],
			200
		);
	}

	/**
	 * Get a single profile.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function getProfile(WP_REST_Request $request)
	{
		$profileId = $request->get_param('id');
		$profile = $this->repository->get($profileId);

		if (! $profile) {
			return new WP_Error(
				'profile_not_found',
				\__('Profile not found.', 'altolith-deploy'),
				['status' => 404]
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'profile' => $profile,
			],
			200
		);
	}

	/**
	 * Create a new profile.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function createProfile(WP_REST_Request $request)
	{
		$data = [
			'name' => $request->get_param('name'),
			'category' => $request->get_param('category'),
			'type' => $request->get_param('type'),
			'fields' => $request->get_param('fields') ?? [],
		];

		// Validate required fields.
		if (empty($data['name'])) {
			return new WP_Error(
				'missing_name',
				\__('Profile name is required.', 'altolith-deploy'),
				['status' => 400]
			);
		}

		if (empty($data['category'])) {
			return new WP_Error(
				'missing_category',
				\__('Profile category is required.', 'altolith-deploy'),
				['status' => 400]
			);
		}

		if (empty($data['type'])) {
			return new WP_Error(
				'missing_type',
				\__('Profile type is required.', 'altolith-deploy'),
				['status' => 400]
			);
		}

		$profile = $this->repository->create($data);

		if (! $profile) {
			return new WP_Error(
				'create_failed',
				\__('Failed to create profile.', 'altolith-deploy'),
				['status' => 500]
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Profile created successfully.', 'altolith-deploy'),
				'profile' => $profile,
			],
			201
		);
	}

	/**
	 * Update an existing profile.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function updateProfile(WP_REST_Request $request)
	{
		$profileId = $request->get_param('id');

		// Check profile exists.
		$existing = $this->repository->get($profileId);
		if (! $existing) {
			return new WP_Error(
				'profile_not_found',
				\__('Profile not found.', 'altolith-deploy'),
				['status' => 404]
			);
		}

		$data = [];

		// Only include provided fields.
		if ($request->has_param('name')) {
			$data['name'] = $request->get_param('name');
		}

		if ($request->has_param('fields')) {
			$data['fields'] = $request->get_param('fields');
		}

		if (empty($data)) {
			return new WP_Error(
				'no_data',
				\__('No data provided for update.', 'altolith-deploy'),
				['status' => 400]
			);
		}

		$profile = $this->repository->update($profileId, $data);

		if (! $profile) {
			return new WP_Error(
				'update_failed',
				\__('Failed to update profile.', 'altolith-deploy'),
				['status' => 500]
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Profile updated successfully.', 'altolith-deploy'),
				'profile' => $profile,
			],
			200
		);
	}

	/**
	 * Delete a profile.
	 *
	 * Will fail if the profile is referenced by provider instances.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function deleteProfile(WP_REST_Request $request)
	{
		$profileId = $request->get_param('id');

		// Check profile exists.
		$existing = $this->repository->get($profileId);
		if (! $existing) {
			return new WP_Error(
				'profile_not_found',
				\__('Profile not found.', 'altolith-deploy'),
				['status' => 404]
			);
		}

		// Check for references (block deletion if referenced).
		if ($this->repository->isReferenced($profileId)) {
			$references = $this->repository->getReferences($profileId);
			$instanceNames = \array_map(function ($ref) {
				return $ref['instance_name'];
			}, $references);

			return new WP_Error(
				'profile_in_use',
				\sprintf(
					/* translators: %s: comma-separated list of instance names */
					\__('Cannot delete profile. It is used by: %s', 'altolith-deploy'),
					\implode(', ', $instanceNames)
				),
				[
					'status' => 409,
					'references' => $references,
				]
			);
		}

		if (! $this->repository->delete($profileId)) {
			return new WP_Error(
				'delete_failed',
				\__('Failed to delete profile.', 'altolith-deploy'),
				['status' => 500]
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Profile deleted successfully.', 'altolith-deploy'),
			],
			200
		);
	}

	/**
	 * Get instances that reference a profile.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function getProfileReferences(WP_REST_Request $request)
	{
		$profileId = $request->get_param('id');

		// Check profile exists.
		$existing = $this->repository->get($profileId);
		if (! $existing) {
			return new WP_Error(
				'profile_not_found',
				\__('Profile not found.', 'altolith-deploy'),
				['status' => 404]
			);
		}

		$references = $this->repository->getReferences($profileId);

		return new WP_REST_Response(
			[
				'success' => true,
				'references' => $references,
			],
			200
		);
	}

	/**
	 * Test profile credentials.
	 *
	 * Delegates to the profile type's test endpoint if available.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function testProfile(WP_REST_Request $request)
	{
		$profileId = $request->get_param('id');

		// Get profile.
		$profile = $this->repository->get($profileId);
		if (! $profile) {
			return new WP_Error(
				'profile_not_found',
				\__('Profile not found.', 'altolith-deploy'),
				['status' => 404]
			);
		}

		/**
		 * Filter to handle profile testing.
		 *
		 * Profile type plugins should hook into this filter to provide
		 * testing functionality for their profile types.
		 *
		 * @param array|null $result  Test result (null if not handled).
		 * @param array      $profile The profile data.
		 * @param string     $profileId The profile ID.
		 * @return array Test result with 'success' and 'message' keys.
		 *
		 * @example
		 * add_filter('altolith_profile_test', function($result, $profile, $profileId) {
		 *     if ($profile['category'] === 'credentials' && $profile['type'] === 'cloudflare') {
		 *         // Test Cloudflare credentials
		 *         return ['success' => true, 'message' => 'Credentials valid'];
		 *     }
		 *     return $result;
		 * }, 10, 3);
		 */
		$result = \apply_filters('altolith_profile_test', null, $profile, $profileId);

		if ($result === null) {
			return new WP_Error(
				'test_not_supported',
				\sprintf(
					/* translators: %1$s: category, %2$s: type */
					\__('Testing not supported for profile type: %1$s/%2$s', 'altolith-deploy'),
					$profile['category'],
					$profile['type']
				),
				['status' => 400]
			);
		}

		// Always return 200 for valid test responses.
		// The 'success' field in the response body indicates test pass/fail.
		// HTTP status should reflect the HTTP request status, not business logic.
		return new WP_REST_Response(
			[
				'success' => $result['success'] ?? false,
				'message' => $result['message'] ?? \__('Test completed.', 'altolith-deploy'),
				'details' => $result['details'] ?? null,
			],
			200
		);
	}
}
