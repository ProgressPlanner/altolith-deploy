<?php

/**
 * Local Storage REST Controller
 *
 * Handles REST API endpoints for local filesystem storage operations.
 *
 * @package Aether\SiteExporter\REST
 */

namespace Aether\SiteExporter\REST;

use Aether\SiteExporter\Utilities\FileManager;
use Aether\SiteExporter\Utilities\PathValidator;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Handles REST API endpoints for local filesystem storage.
 */
class LocalStorageController
{
	use RESTHelpersTrait;

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function registerRoutes(): void
	{
		// Upload file to local storage.
		\register_rest_route(
			$this->getNamespace(),
			'/local-storage/upload',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'uploadFile' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Delete file from local storage.
		\register_rest_route(
			$this->getNamespace(),
			'/local-storage/delete',
			[
				'methods'             => 'DELETE',
				'callback'            => [ $this, 'deleteFile' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Batch delete files from local storage.
		\register_rest_route(
			$this->getNamespace(),
			'/local-storage/batch-delete',
			[
				'methods'             => 'DELETE',
				'callback'            => [ $this, 'batchDeleteFiles' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Download file from local storage.
		\register_rest_route(
			$this->getNamespace(),
			'/local-storage/download',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'downloadFile' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
			]
		);

		// Trigger blueprint bundle upload action (fires action for provider hooks).
		\register_rest_route(
			$this->getNamespace(),
			'/local-storage/trigger-blueprint-bundle-upload',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'triggerBlueprintBundleUpload' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
					'instance_id'      => [
						'required' => true,
						'type'     => 'string',
					],
					'source_path'      => [
						'required' => true,
						'type'     => 'string',
					],
					'destination_path' => [
						'required' => true,
						'type'     => 'string',
					],
				],
			]
		);
	}

	/**
	 * Upload file to local filesystem.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function uploadFile(WP_REST_Request $request)
	{
		// CSRF protection: Verify nonce for state-changing operation
		$nonceCheck = $this->verifyNonce($request);
		if (\is_wp_error($nonceCheck)) {
			return $nonceCheck;
		}

		$files = $request->get_file_params();
		$params = $request->get_params();

		if (empty($files['file'])) {
			return new WP_Error(
				'missing_file',
				\__('No file provided.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		$file = $files['file'];
		$key = $params['key'] ?? '';
		$staticPath = $params['static_path'] ?? 'static/';

		if (empty($key)) {
			return new WP_Error(
				'missing_key',
				\__('File key is required.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Security backstop: Basic validation (client-side does detailed validation)
		// This prevents bypassing client-side checks via direct API calls
		$maxFileSize = 100 * 1024 * 1024; // 100MB
		if (isset($file['size']) && $file['size'] > $maxFileSize) {
			return new WP_Error(
				'file_too_large',
				\sprintf(
					/* translators: %s: Maximum allowed file size */
					\__('File size exceeds maximum allowed size of %s.', 'aether-site-exporter'),
					\size_format($maxFileSize)
				),
				[ 'status' => 400 ]
			);
		}

		// Security: Validate key to prevent path traversal attacks.
		// Reject keys containing path traversal sequences (..) or starting with /.
		if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $key) || \preg_match('#^[/\\\\]#', $key)) {
			return new WP_Error(
				'invalid_key',
				\__('Invalid file key: path traversal not allowed.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Sanitize static path - remove leading/trailing slashes
		$staticPath = \trim($staticPath, '/');
		if (empty($staticPath)) {
			$staticPath = 'static';
		}

		// Security: Validate static_path to prevent path traversal.
		if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $staticPath) || \preg_match('#^[/\\\\]#', $staticPath)) {
			return new WP_Error(
				'invalid_static_path',
				\__('Invalid static path: path traversal not allowed.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Build full path: ABSPATH/static_path/key
		// Handle trailing slashes: paths ending with / should become index.html files
		// e.g., "category/uncategorized/" -> "category/uncategorized/index.html"
		$cleanKey = \ltrim($key, '/');
		if (\substr($cleanKey, -1) === '/') {
			// Path ends with slash - this is a directory index
			$cleanKey .= 'index.html';
		} elseif (empty($cleanKey)) {
			// Empty key means root index
			$cleanKey = 'index.html';
		}

		$uploadDir = \rtrim(ABSPATH, '/') . '/' . $staticPath;
		$fullPath = $uploadDir . '/' . $cleanKey;
		$fileDir = \dirname($fullPath);

		// Security: Validate path using universal PathValidator
		// Works in all environments including WordPress Playground
		$validation = PathValidator::validatePath($fullPath, ABSPATH, false);
		if (!$validation['valid']) {
			return new WP_Error(
				'invalid_path',
				/* translators: %s: Validation error message */
				\sprintf(\__('Invalid file path: %s', 'aether-site-exporter'), $validation['error']),
				[ 'status' => 400 ]
			);
		}

		// NOW safe to create directories
		if (!\is_dir($uploadDir)) {
			if (!\wp_mkdir_p($uploadDir)) {
				return new WP_Error(
					'directory_creation_failed',
					\__('Failed to create upload directory.', 'aether-site-exporter'),
					[ 'status' => 500 ]
				);
			}
		}

		if (!\is_dir($fileDir)) {
			if (!\wp_mkdir_p($fileDir)) {
				return new WP_Error(
					'directory_creation_failed',
					\__('Failed to create file directory.', 'aether-site-exporter'),
					[ 'status' => 500 ]
				);
			}
		}

		// Verify directory exists before attempting file move
		if (!\is_dir($fileDir)) {
			return new WP_Error(
				'directory_missing',
				\__('Upload directory does not exist.', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		// Verify parent directory is writable
		if (!\is_writable($fileDir)) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Parent directory is not writable: %s',
					$fileDir
				));
			}
			return new WP_Error(
				'directory_not_writable',
				/* translators: %s: Directory path */
				\sprintf(\__('Upload directory is not writable: %s', 'aether-site-exporter'), $fileDir),
				[
					'status' => 500,
					'directory' => $fileDir,
				]
			);
		}

		// CRITICAL FIX: Check if destination path exists as a directory
		// move_uploaded_file() fails if destination is a directory instead of a file
		if (\file_exists($fullPath) && \is_dir($fullPath)) {
			// Recursively remove the directory and its contents
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Removing directory at destination path to allow file upload: %s',
					$fullPath
				));
			}

			if (!$this->removeDirectoryRecursively($fullPath)) {
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Aether: Failed to remove directory at destination path: %s',
						$fullPath
					));
				}
				return new WP_Error(
					'destination_is_directory',
					/* translators: %s: File path */
					\sprintf(\__('Destination path exists as directory and could not be removed: %s', 'aether-site-exporter'), $fullPath),
					[
						'status' => 500,
						'destination' => $fullPath,
						'source' => $file['tmp_name'] ?? 'unknown',
					]
				);
			}

			// Directory removed, continue with file upload
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Successfully removed directory at destination path: %s',
					$fullPath
				));
			}
		}

		// Move uploaded file to target location
		if (isset($file['tmp_name']) && \is_uploaded_file($file['tmp_name'])) {
			// Handle actual uploaded file
			if (!\move_uploaded_file($file['tmp_name'], $fullPath)) {
				// Capture system error details for better diagnostics
				$lastError = \error_get_last();
				$errorMessage = \__('Failed to move uploaded file.', 'aether-site-exporter');
				$errorDetails = [
					'status' => 500,
					'source' => $file['tmp_name'] ?? 'unknown',
					'destination' => $fullPath,
				];

				// Include system error details if available
				if ($lastError && \strpos($lastError['message'], 'move_uploaded_file') !== false) {
					$errorMessage = \sprintf(
						/* translators: %1$s: Original error, %2$s: Destination path */
						\__('Failed to move uploaded file: %1$s (destination: %2$s)', 'aether-site-exporter'),
						$lastError['message'],
						$fullPath
					);
					$errorDetails['system_error'] = $lastError['message'];
					$errorDetails['system_file'] = $lastError['file'];
					$errorDetails['system_line'] = $lastError['line'];
				} else {
					// Fallback: include paths in error message
					$errorMessage = \sprintf(
						/* translators: %1$s: Source path, %2$s: Destination path */
						\__('Failed to move uploaded file from %1$s to %2$s', 'aether-site-exporter'),
						$file['tmp_name'] ?? 'unknown',
						$fullPath
					);
				}

				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Aether: move_uploaded_file() failed. Source: %s, Destination: %s, System error: %s',
						$file['tmp_name'] ?? 'unknown',
						$fullPath,
						$lastError['message'] ?? 'unknown'
					));
				}

				return new WP_Error(
					'upload_failed',
					$errorMessage,
					$errorDetails
				);
			}
		} else {
			return new WP_Error(
				'invalid_file',
				\__('Invalid uploaded file.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('File uploaded successfully.', 'aether-site-exporter'),
				'path'    => $key,
				'warning' => FileManager::getEphemeralStorageWarning('upload'),
			],
			200
		);
	}

	/**
	 * Delete file from local filesystem.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function deleteFile(WP_REST_Request $request)
	{
		// CSRF protection: Verify nonce for state-changing operation
		$nonceCheck = $this->verifyNonce($request);
		if (\is_wp_error($nonceCheck)) {
			return $nonceCheck;
		}

		$key = $request->get_param('key');
		$staticPath = $request->get_param('static_path') ?? 'static/';

		if (empty($key)) {
			return new WP_Error(
				'missing_key',
				\__('File key is required.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Security: Validate key to prevent path traversal attacks.
		if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $key) || \preg_match('#^[/\\\\]#', $key)) {
			return new WP_Error(
				'invalid_key',
				\__('Invalid file key: path traversal not allowed.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Sanitize static path
		$staticPath = \trim($staticPath, '/');
		if (empty($staticPath)) {
			$staticPath = 'static';
		}

		// Security: Validate static_path to prevent path traversal.
		if (!PathValidator::isSafePath($staticPath)) {
			return new WP_Error(
				'invalid_static_path',
				\__('Invalid static path: path traversal not allowed.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Build full path
		$uploadDir = \rtrim(ABSPATH, '/') . '/' . $staticPath;
		$fullPath = $uploadDir . '/' . \ltrim($key, '/');

		// Security: Validate path using universal PathValidator
		$validation = PathValidator::validatePath($fullPath, ABSPATH, false);
		if (!$validation['valid']) {
			return new WP_Error(
				'invalid_path',
				/* translators: %s: Validation error message */
				\sprintf(\__('Invalid file path: %s', 'aether-site-exporter'), $validation['error']),
				[ 'status' => 400 ]
			);
		}

		// Verify file exists before deletion
		if (!FileManager::verifyFileExists($fullPath, 'delete')) {
			return new WP_Error(
				'file_not_found',
				\__('File not found.', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		// Delete file using FileManager
		if (!FileManager::deleteFile($fullPath)) {
			return new WP_Error(
				'delete_failed',
				\__('Failed to delete file.', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('File deleted successfully.', 'aether-site-exporter'),
			],
			200
		);
	}

	/**
	 * Batch delete files from local filesystem.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function batchDeleteFiles(WP_REST_Request $request)
	{
		// CSRF protection: Verify nonce for state-changing operation
		$nonceCheck = $this->verifyNonce($request);
		if (\is_wp_error($nonceCheck)) {
			return $nonceCheck;
		}

		$keys = $request->get_param('keys');
		$staticPath = $request->get_param('static_path') ?? 'static/';

		if (empty($keys) || !\is_array($keys)) {
			return new WP_Error(
				'missing_keys',
				\__('File keys array is required.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Sanitize static path
		$staticPath = \trim($staticPath, '/');
		if (empty($staticPath)) {
			$staticPath = 'static';
		}

		// Security: Validate static_path to prevent path traversal.
		if (!PathValidator::isSafePath($staticPath)) {
			return new WP_Error(
				'invalid_static_path',
				\__('Invalid static path: path traversal not allowed.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		$uploadDir = \rtrim(ABSPATH, '/') . '/' . $staticPath;
		$deleted = [];
		$errors = [];

		foreach ($keys as $key) {
			if (empty($key) || !\is_string($key)) {
				continue;
			}

			// Security: Validate key to prevent path traversal attacks.
			if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $key) || \preg_match('#^[/\\\\]#', $key)) {
				$errors[] = [
					'key'   => $key,
					'error' => \__('Invalid file key: path traversal not allowed.', 'aether-site-exporter'),
				];
				continue;
			}

			$fullPath = $uploadDir . '/' . \ltrim($key, '/');

			// Security: Validate path using universal PathValidator
			$validation = PathValidator::validatePath($fullPath, ABSPATH, false);
			if (!$validation['valid']) {
				$errors[] = [
					'key'   => $key,
					'error' => $validation['error'],
				];
				continue;
			}

			// Check if file exists
			if (!FileManager::verifyFileExists($fullPath, 'batch-delete')) {
				// File doesn't exist - not an error for batch delete (may already be deleted)
				$deleted[] = $key;
				continue;
			}

			// Delete file using FileManager
			if (FileManager::deleteFile($fullPath)) {
				$deleted[] = $key;
			} else {
				$errors[] = [
					'key'   => $key,
					'error' => \__('Failed to delete file.', 'aether-site-exporter'),
				];
			}
		}

		return new WP_REST_Response(
			[
				'success' => empty($errors),
				'deleted' => $deleted,
				'errors'  => $errors,
				'message' => empty($errors)
					? \__('All files deleted successfully.', 'aether-site-exporter')
					: \sprintf(
						/* translators: %1$d: number of deleted files, %2$d: number of errors */
						\__('Deleted %1$d files with %2$d errors.', 'aether-site-exporter'),
						\count($deleted),
						\count($errors)
					),
			],
			empty($errors) ? 200 : 207 // 207 Multi-Status for partial success
		);
	}

	/**
	 * Download file from local storage.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function downloadFile(WP_REST_Request $request)
	{
		$key = $request->get_param('key');
		$staticPath = $request->get_param('static_path') ?? 'static/';

		if (empty($key)) {
			return new WP_Error(
				'missing_key',
				\__('File key is required.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Security: Validate key to prevent path traversal attacks.
		if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $key) || \preg_match('#^[/\\\\]#', $key)) {
			return new WP_Error(
				'invalid_key',
				\__('Invalid file key: path traversal not allowed.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Sanitize static path
		$staticPath = \trim($staticPath, '/');
		if (empty($staticPath)) {
			$staticPath = 'static';
		}

		// Security: Validate static_path to prevent path traversal.
		if (\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $staticPath) || \preg_match('#^[/\\\\]#', $staticPath)) {
			return new WP_Error(
				'invalid_static_path',
				\__('Invalid static path: path traversal not allowed.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Build full path
		$uploadDir = \rtrim(ABSPATH, '/') . '/' . $staticPath;
		$fullPath = $uploadDir . '/' . \ltrim($key, '/');

		// Security: Validate path using universal PathValidator
		$validation = PathValidator::validatePath($fullPath, ABSPATH, false);
		if (!$validation['valid']) {
			return new WP_Error(
				'invalid_path',
				/* translators: %s: Validation error message */
				\sprintf(\__('Invalid file path: %s', 'aether-site-exporter'), $validation['error']),
				[ 'status' => 400 ]
			);
		}

		// Verify file exists and persistence
		if (!FileManager::verifyFileExists($fullPath, 'download')) {
			return new WP_Error(
				'file_not_found',
				\__('File not found. It may have been cleaned up or not persisted across sessions.', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		// Read file with retry logic for transient filesystem issues
		$content = FileManager::readFileWithRetry($fullPath);
		if (false === $content) {
			return new WP_Error(
				'read_failed',
				\__('Failed to read file. The file may be temporarily unavailable.', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'content' => \base64_encode($content),
			],
			200
		);
	}

	/**
	 * Trigger blueprint bundle upload action.
	 *
	 * Fires the 'aether_blueprint_bundle_upload' action which allows provider instances
	 * to handle their own upload implementation.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function triggerBlueprintBundleUpload(WP_REST_Request $request)
	{
		// CSRF protection: Verify nonce for state-changing operation
		$nonceCheck = $this->verifyNonce($request);
		if (\is_wp_error($nonceCheck)) {
			return $nonceCheck;
		}

		$instanceId = $request->get_param('instance_id');
		$sourcePath = $request->get_param('source_path');
		$destinationPath = $request->get_param('destination_path');
		$context = $request->get_param('context') ?? [];

		if (empty($instanceId)) {
			return new WP_Error(
				'missing_instance_id',
				\__('Instance ID is required.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		if (empty($sourcePath)) {
			return new WP_Error(
				'missing_source_path',
				\__('Source path is required.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		if (empty($destinationPath)) {
			return new WP_Error(
				'missing_destination_path',
				\__('Destination path is required.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		/**
		 * Action fired when blueprint bundle needs to be uploaded to a provider instance.
		 *
		 * This allows provider instances to handle their own upload implementation.
		 * For example, local-filesystem provider instances will copy the file to their
		 * configured export_path, while cloud providers might upload to their storage.
		 *
		 * @param string $instanceId      Provider instance ID (e.g., 'local-filesystem:abc-123' or 'local-filesystem-blueprint-bundle:abc-123').
		 * @param string $sourcePath      Source path of the generated blueprint bundle (relative to ABSPATH).
		 * @param string $destinationPath Destination path (instance's export_path, relative to ABSPATH).
		 * @param array  $context         Additional context data.
		 */
		\do_action('aether_blueprint_bundle_upload', $instanceId, $sourcePath, $destinationPath, $context);

		// Verify the upload succeeded by checking if destination file exists (for local-filesystem)
		// This is a synchronous check since action hooks run synchronously
		// Destination paths are always relative (from instance config)
		$destinationFullPath = \rtrim(ABSPATH, '/') . '/' . \ltrim($destinationPath, '/');

		// Only verify for local-filesystem instances (they should have created the file)
		// This includes both old 'local-filesystem:' and new 'local-filesystem-static-site:' / 'local-filesystem-blueprint-bundle:' providers
		if (\strpos($instanceId, 'local-filesystem') === 0 && !\file_exists($destinationFullPath)) {
			// Check if source file exists (might be the issue)
			// Source paths can be absolute or relative
			$sourceFullPath = $sourcePath;
			if (!\preg_match('#^[/\\\\]#', $sourcePath) && !\preg_match('#^[A-Za-z]:[/\\\\]#', $sourcePath)) {
				$sourceFullPath = \rtrim(ABSPATH, '/') . '/' . \ltrim($sourcePath, '/');
			}

			if (!\file_exists($sourceFullPath)) {
				return new WP_Error(
					'source_file_not_found',
					\sprintf(
						/* translators: %s: Source file path */
						\__('Source file not found: %s', 'aether-site-exporter'),
						$sourcePath
					),
					[ 'status' => 404 ]
				);
			}

			// Source exists but destination doesn't - upload likely failed
			return new WP_Error(
				'upload_failed',
				\sprintf(
					/* translators: %1$s: instance ID, %2$s: destination path */
					\__('Blueprint bundle upload failed for instance %1$s. Destination file not created at %2$s', 'aether-site-exporter'),
					$instanceId,
					$destinationPath
				),
				[ 'status' => 500 ]
			);
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Blueprint bundle upload completed successfully.', 'aether-site-exporter'),
				'instance_id'      => $instanceId,
				'source_path'      => $sourcePath,
				'destination_path' => $destinationPath,
			],
			200
		);
	}

	/**
	 * Recursively remove a directory and its contents.
	 *
	 * Safely removes a directory and all its contents, with security checks
	 * to ensure we only remove directories within ABSPATH.
	 *
	 * @param string $dir Directory path to remove.
	 * @return bool True on success, false on failure.
	 */
	private function removeDirectoryRecursively(string $dir): bool
	{
		if (!\is_dir($dir)) {
			return true; // Already removed or doesn't exist
		}

		// Security: Ensure directory is within ABSPATH
		$validation = PathValidator::validatePath($dir, ABSPATH, false);
		if (!$validation['valid']) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Cannot remove directory outside ABSPATH: %s',
					$dir
				));
			}
			return false;
		}

		$iterator = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
			\RecursiveIteratorIterator::CHILD_FIRST
		);

		foreach ($iterator as $file) {
			if ($file->isDir()) {
				if (!\rmdir($file->getPathname())) {
					if (\defined('WP_DEBUG') && WP_DEBUG) {
						\error_log(\sprintf(
							'Aether: Failed to remove directory: %s',
							$file->getPathname()
						));
					}
					return false;
				}
			} else {
				if (!\unlink($file->getPathname())) {
					if (\defined('WP_DEBUG') && WP_DEBUG) {
						\error_log(\sprintf(
							'Aether: Failed to remove file: %s',
							$file->getPathname()
						));
					}
					return false;
				}
			}
		}

		// Remove the directory itself
		if (!\rmdir($dir)) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Failed to remove root directory: %s',
					$dir
				));
			}
			return false;
		}

		return true;
	}
}
