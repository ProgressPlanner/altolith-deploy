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

		// List files in local storage.
		\register_rest_route(
			$this->getNamespace(),
			'/local-storage/list',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'listFiles' ],
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

		// Copy blueprint bundle file to destination path.
		\register_rest_route(
			$this->getNamespace(),
			'/local-storage/copy-blueprint-bundle',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'copyBlueprintBundle' ],
				'permission_callback' => [ $this, 'permissionCheck' ],
				'args'                => [
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

		// Security: Validate file size to prevent disk exhaustion and DoS attacks
		// Allow up to 100MB per file (reasonable for web assets like images, fonts, CSS, JS)
		$maxFileSize = 100 * 1024 * 1024; // 100MB in bytes
		if (isset($file['size']) && $file['size'] > $maxFileSize) {
			return new WP_Error(
				'file_too_large',
				\sprintf(
					/* translators: %s: Maximum allowed file size in human-readable format */
					\__('File size exceeds maximum allowed size of %s.', 'aether-site-exporter'),
					\size_format($maxFileSize)
				),
				[ 'status' => 400 ]
			);
		}

		// Security: Validate file type and MIME type to prevent malicious uploads
		$fileExtension = \strtolower(\pathinfo($key, PATHINFO_EXTENSION));
		$allowedExtensions = [
			'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',  // Images
			'css', 'js', 'json',                          // Web assets
			'woff', 'woff2', 'ttf', 'eot',               // Fonts
			'pdf', 'txt', 'md',                           // Documents
			'zip', 'tar', 'gz',                           // Archives
			'html', 'htm', 'xml',                         // Markup
			'',                                           // Allow files without extension (e.g., directory index files)
		];

		if (!\in_array($fileExtension, $allowedExtensions, true)) {
			return new WP_Error(
				'file_type_not_allowed',
				\sprintf(
					/* translators: %s: file extension */
					\__('File type "%s" is not allowed for upload.', 'aether-site-exporter'),
					$fileExtension
				),
				[ 'status' => 400 ]
			);
		}

		// Also validate MIME type if file is actually uploaded (not just content)
		if (isset($file['tmp_name']) && \file_exists($file['tmp_name'])) {
			$finfo = \finfo_open(FILEINFO_MIME_TYPE);
			if (false !== $finfo) {
				$mimeType = \finfo_file($finfo, $file['tmp_name']);
				\finfo_close($finfo);

				$allowedMimeTypes = [
					'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
					'text/css', 'application/javascript', 'text/javascript', 'application/json',
					'font/woff', 'font/woff2', 'application/font-woff', 'application/font-woff2',
					'font/ttf', 'application/x-font-ttf', 'font/otf', 'application/x-font-otf',
					'application/pdf', 'text/plain', 'text/markdown',
					'application/zip', 'application/x-tar', 'application/gzip', 'application/x-gzip',
					'text/html', 'application/xhtml+xml', 'application/xml', 'text/xml',
					'application/octet-stream',  // Generic binary - allow for files without extension
					'inode/x-empty',              // Empty files
				];

				if (!\in_array($mimeType, $allowedMimeTypes, true)) {
					return new WP_Error(
						'mime_type_not_allowed',
						\sprintf(
							/* translators: %s: MIME type */
							\__('MIME type "%s" is not allowed for upload.', 'aether-site-exporter'),
							$mimeType
						),
						[ 'status' => 400 ]
					);
				}
			}
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
			$this->removeLegacyBlockingFile($uploadDir);

			if (!\wp_mkdir_p($uploadDir)) {
				return new WP_Error(
					'directory_creation_failed',
					\__('Failed to create upload directory.', 'aether-site-exporter'),
					[ 'status' => 500 ]
				);
			}
		}

		if (!\is_dir($fileDir)) {
			$this->removeLegacyBlockingFile($fileDir);

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
			// Try to remove empty directory, otherwise return error
			if ($this->isDirectoryEmpty($fullPath)) {
				if (!\rmdir($fullPath)) {
					if (\defined('WP_DEBUG') && WP_DEBUG) {
						\error_log(\sprintf(
							'Aether: Failed to remove empty directory at destination path: %s',
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
						'Aether: Removed empty directory at destination path: %s',
						$fullPath
					));
				}
			} else {
				// Directory is not empty, cannot proceed
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Aether: Destination path exists as non-empty directory: %s',
						$fullPath
					));
				}
				return new WP_Error(
					'destination_is_directory',
					/* translators: %s: File path */
					\sprintf(\__('Destination path exists as directory: %s', 'aether-site-exporter'), $fullPath),
					[
						'status' => 500,
						'destination' => $fullPath,
						'source' => $file['tmp_name'] ?? 'unknown',
					]
				);
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
					$errorDetails['system_file'] = $lastError['file'] ?? null;
					$errorDetails['system_line'] = $lastError['line'] ?? null;
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

			// Track file for persistence monitoring
			FileManager::trackFile(
				$fullPath,
				'upload',
				[
					'key'          => $key,
					'original_name' => $file['name'] ?? 'unknown',
					'size'         => $file['size'] ?? 0,
				]
			);
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

		// Untrack file
		FileManager::untrackFile($fullPath);

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('File deleted successfully.', 'aether-site-exporter'),
			],
			200
		);
	}

	/**
	 * List files in local storage.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function listFiles(WP_REST_Request $request)
	{
		$staticPath = $request->get_param('static_path') ?? 'static/';
		$prefix = $request->get_param('prefix') ?? '';

		// Sanitize static path
		$staticPath = \trim($staticPath, '/');
		if (empty($staticPath)) {
			$staticPath = 'static';
		}

		$uploadDir = \rtrim(ABSPATH, '/') . '/' . $staticPath;
		$searchPath = $uploadDir;

		if (!empty($prefix)) {
			$searchPath = $uploadDir . '/' . \ltrim($prefix, '/');
		}

		if (!\file_exists($searchPath)) {
			return new WP_REST_Response(
				[
					'success' => true,
					'files'   => [],
				],
				200
			);
		}

		$files = [];
		$iterator = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator($searchPath, \RecursiveDirectoryIterator::SKIP_DOTS),
			\RecursiveIteratorIterator::SELF_FIRST
		);

		foreach ($iterator as $file) {
			if ($file->isFile()) {
				$relativePath = \str_replace($uploadDir . '/', '', $file->getPathname());
				$files[] = [
					'key'  => $relativePath,
					'size' => $file->getSize(),
					'modified' => $file->getMTime(),
				];
			}
		}

		return new WP_REST_Response(
			[
				'success' => true,
				'files'   => $files,
			],
			200
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
	 * Copy blueprint bundle file to destination path.
	 *
	 * Used by local-filesystem provider instances to copy the generated blueprint bundle
	 * to each instance's configured export_path.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function copyBlueprintBundle(WP_REST_Request $request)
	{
		// CSRF protection: Verify nonce for state-changing operation
		$nonceCheck = $this->verifyNonce($request);
		if (\is_wp_error($nonceCheck)) {
			return $nonceCheck;
		}

		$sourcePath = $request->get_param('source_path');
		$destinationPath = $request->get_param('destination_path');

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

		// Security: Validate paths to prevent path traversal attacks
		// Note: Source paths can be absolute (from blueprint bundle generation) or relative
		// PathValidator will ensure absolute paths are within ABSPATH
		if (
			\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $sourcePath) ||
			\strpos($sourcePath, "\0") !== false
		) {
			return new WP_Error(
				'invalid_source_path',
				\__('Invalid source path: path traversal not allowed.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Destination paths must always be relative (from instance config)
		if (
			\preg_match('#(^|/|\\\\)\.\.($|/|\\\\)#', $destinationPath) ||
			\preg_match('#^[/\\\\]#', $destinationPath) ||
			\strpos($destinationPath, "\0") !== false
		) {
			return new WP_Error(
				'invalid_destination_path',
				\__('Invalid destination path: must be relative and path traversal not allowed.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Build full paths - handle both absolute and relative paths
		// Check if source path is already absolute (starts with / or C:\)
		$isAbsolutePath = \preg_match('#^[/\\\\]#', $sourcePath) || \preg_match('#^[A-Za-z]:[/\\\\]#', $sourcePath);

		if ($isAbsolutePath) {
			// Path is absolute, use as-is (will be validated by PathValidator)
			$sourceFullPath = $sourcePath;
		} else {
			// Path is relative, prepend ABSPATH
			$sourceFullPath = \rtrim(ABSPATH, '/') . '/' . \ltrim($sourcePath, '/');
		}

		// Destination path is always relative to ABSPATH
		$destinationFullPath = \rtrim(ABSPATH, '/') . '/' . \ltrim($destinationPath, '/');
		$destinationDir = \dirname($destinationFullPath);

		// Security: Validate paths using universal PathValidator
		$sourceValidation = PathValidator::validatePath($sourceFullPath, ABSPATH, false);
		if (!$sourceValidation['valid']) {
			return new WP_Error(
				'invalid_source_path',
				/* translators: %s: Validation error message */
				\sprintf(\__('Invalid source path: %s', 'aether-site-exporter'), $sourceValidation['error']),
				[ 'status' => 400 ]
			);
		}

		$destinationValidation = PathValidator::validatePath($destinationFullPath, ABSPATH, false);
		if (!$destinationValidation['valid']) {
			return new WP_Error(
				'invalid_destination_path',
				/* translators: %s: Validation error message */
				\sprintf(\__('Invalid destination path: %s', 'aether-site-exporter'), $destinationValidation['error']),
				[ 'status' => 400 ]
			);
		}

		// Verify source file exists
		if (!\file_exists($sourceFullPath) || !\is_file($sourceFullPath)) {
			return new WP_Error(
				'source_file_not_found',
				/* translators: %s: Source file path */
				\sprintf(\__('Source file not found: %s', 'aether-site-exporter'), $sourcePath),
				[ 'status' => 404 ]
			);
		}

		// Create destination directory if it doesn't exist
		if (!\is_dir($destinationDir)) {
			$this->removeLegacyBlockingFile($destinationDir);

			if (!\wp_mkdir_p($destinationDir)) {
				return new WP_Error(
					'directory_creation_failed',
					/* translators: %s: Destination directory path */
					\sprintf(\__('Failed to create destination directory: %s', 'aether-site-exporter'), $destinationDir),
					[ 'status' => 500 ]
				);
			}
		}

		// Verify destination directory exists before attempting file copy
		if (!\is_dir($destinationDir)) {
			return new WP_Error(
				'directory_missing',
				/* translators: %s: Destination directory path */
				\sprintf(\__('Destination directory does not exist: %s', 'aether-site-exporter'), $destinationDir),
				[ 'status' => 500 ]
			);
		}

		// Check if destination path exists as a directory (copy() fails if destination is a directory).
		if (\file_exists($destinationFullPath) && \is_dir($destinationFullPath)) {
			// Try to remove empty directory, otherwise return error.
			if ($this->isDirectoryEmpty($destinationFullPath)) {
				if (!\rmdir($destinationFullPath)) {
					if (\defined('WP_DEBUG') && WP_DEBUG) {
						\error_log(\sprintf(
							'Aether: Failed to remove empty directory at destination path: %s',
							$destinationFullPath
						));
					}
					return new WP_Error(
						'destination_is_directory',
						/* translators: %s: File path */
						\sprintf(\__('Destination path exists as directory and could not be removed: %s', 'aether-site-exporter'), $destinationFullPath),
						[
							'status' => 500,
							'destination' => $destinationFullPath,
							'source' => $sourceFullPath,
						]
					);
				}
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Aether: Removed empty directory at destination path: %s',
						$destinationFullPath
					));
				}
			} else {
				// Directory is not empty, cannot proceed.
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Aether: Destination path exists as non-empty directory: %s',
						$destinationFullPath
					));
				}
				return new WP_Error(
					'destination_is_directory',
					/* translators: %s: File path */
					\sprintf(\__('Destination path exists as directory: %s', 'aether-site-exporter'), $destinationFullPath),
					[
						'status' => 500,
						'destination' => $destinationFullPath,
						'source' => $sourceFullPath,
					]
				);
			}
		}

		// Copy file from source to destination
		if (!\copy($sourceFullPath, $destinationFullPath)) {
			return new WP_Error(
				'copy_failed',
				\sprintf(
					/* translators: %1$s: source path, %2$s: destination path */
					\__('Failed to copy file from %1$s to %2$s', 'aether-site-exporter'),
					$sourcePath,
					$destinationPath
				),
				[ 'status' => 500 ]
			);
		}

		// Track file for persistence monitoring
		FileManager::trackFile(
			$destinationFullPath,
			'copy',
			[
				'source_path'      => $sourcePath,
				'destination_path' => $destinationPath,
				'size'             => \filesize($destinationFullPath),
			]
		);

		return new WP_REST_Response(
			[
				'success' => true,
				'message' => \__('Blueprint bundle copied successfully.', 'aether-site-exporter'),
				'source_path'      => $sourcePath,
				'destination_path' => $destinationPath,
				'warning'          => FileManager::getEphemeralStorageWarning('copy'),
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
		 * @param string $instanceId      Provider instance ID (e.g., 'local-filesystem:abc-123').
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
		if (\strpos($instanceId, 'local-filesystem:') === 0 && !\file_exists($destinationFullPath)) {
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
	 * Remove a legacy blocking file if it exists where a directory is needed.
	 *
	 * This handles cleanup from a historical bug where paths with trailing
	 * slashes were uploaded as files instead of creating directories.
	 *
	 * @param string $path Path to check and clean up.
	 * @return void
	 */
	private function removeLegacyBlockingFile(string $path): void
	{
		if (\file_exists($path) && \is_file($path)) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Removing legacy blocking file to create directory: %s',
					$path
				));
			}
			@\unlink($path);
		}
	}

	/**
	 * Check if a directory is empty.
	 *
	 * @param string $dir Directory path to check.
	 * @return bool True if directory is empty or doesn't exist, false otherwise.
	 */
	private function isDirectoryEmpty(string $dir): bool
	{
		if (!\is_dir($dir)) {
			return true;
		}

		$handle = @\opendir($dir);
		if ($handle === false) {
			return false;
		}

		// Read directory entries, skipping . and ..
		while (($entry = \readdir($handle)) !== false) {
			if ($entry !== '.' && $entry !== '..') {
				\closedir($handle);
				return false;
			}
		}

		\closedir($handle);
		return true;
	}
}
