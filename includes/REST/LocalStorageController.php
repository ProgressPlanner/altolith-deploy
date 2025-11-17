<?php

/**
 * Local Storage REST Controller
 *
 * Handles REST API endpoints for local filesystem storage operations.
 *
 * @package Aether\SiteExporter\REST
 */

namespace Aether\SiteExporter\REST;

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
		$uploadDir = \rtrim(ABSPATH, '/') . '/' . $staticPath;
		$fullPath = $uploadDir . '/' . \ltrim($key, '/');
		$fileDir = \dirname($fullPath);

		// Security: Validate parent exists and is within ABSPATH BEFORE creating any directories
		// This prevents TOCTOU race condition with symlink attacks
		$realAbspath = \realpath(ABSPATH);
		if (false === $realAbspath) {
			return new WP_Error(
				'invalid_abspath',
				\__('Invalid WordPress installation path.', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		// Find the first existing ancestor directory
		$checkDir = $fileDir;
		while (!\is_dir($checkDir) && \strlen($checkDir) > \strlen(ABSPATH)) {
			$checkDir = \dirname($checkDir);
		}

		// Validate the existing ancestor is within ABSPATH
		$realCheckDir = \realpath($checkDir);
		if (false === $realCheckDir || 0 !== \strpos($realCheckDir, $realAbspath)) {
			return new WP_Error(
				'path_outside_abspath',
				\__('File path must be within WordPress installation.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		// Check for symlinks in the path to prevent symlink attacks
		if (\is_link($checkDir)) {
			return new WP_Error(
				'symlink_detected',
				\__('Symlinks are not allowed in upload path.', 'aether-site-exporter'),
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

		// Final validation after directory creation
		// Note: realpath() requires the path to exist, so this should work now
		$realFileDir = \realpath($fileDir);
		if (false === $realFileDir) {
			// Debug logging to understand why realpath failed
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: realpath() failed for directory: %s (exists: %s, readable: %s)',
					$fileDir,
					\is_dir($fileDir) ? 'yes' : 'no',
					\is_readable($fileDir) ? 'yes' : 'no'
				));
			}

			// Don't delete the directory we just created - it might still be usable
			// Instead, try using the non-resolved path
			$realFileDir = $fileDir;
		}

		// Verify the resolved path is within ABSPATH
		if (0 !== \strpos($realFileDir, $realAbspath)) {
			// This indicates a security issue - path escaped ABSPATH
			return new WP_Error(
				'path_validation_failed',
				\__('File path validation failed: path is outside WordPress installation.', 'aether-site-exporter'),
				[ 'status' => 400 ]
			);
		}

		$realFullPath = $realFileDir . '/' . \basename($fullPath);

		// Verify directory exists before attempting file move
		if (!\is_dir($realFileDir)) {
			if (\defined('WP_DEBUG') && WP_DEBUG) {
				\error_log(\sprintf(
					'Aether: Directory disappeared before file move: %s',
					$realFileDir
				));
			}
			return new WP_Error(
				'directory_missing',
				\__('Upload directory does not exist.', 'aether-site-exporter'),
				[ 'status' => 500 ]
			);
		}

		// Move uploaded file to target location
		if (isset($file['tmp_name']) && \is_uploaded_file($file['tmp_name'])) {
			// Handle actual uploaded file
			if (!\move_uploaded_file($file['tmp_name'], $realFullPath)) {
				return new WP_Error(
					'upload_failed',
					\__('Failed to move uploaded file.', 'aether-site-exporter'),
					[ 'status' => 500 ]
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

		// Security: Validate path
		$realUploadDir = \realpath($uploadDir);
		if ($realUploadDir === false) {
			return new WP_Error(
				'directory_not_found',
				\__('Upload directory not found.', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		$realFullPath = \realpath($fullPath);
		if ($realFullPath === false || \strpos($realFullPath, $realUploadDir) !== 0) {
			return new WP_Error(
				'file_not_found',
				\__('File not found.', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		// Delete file
		if (!\unlink($realFullPath)) {
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

		// Security: Validate path
		$realUploadDir = \realpath($uploadDir);
		if ($realUploadDir === false) {
			return new WP_Error(
				'directory_not_found',
				\__('Upload directory not found.', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		$realFullPath = \realpath($fullPath);
		if ($realFullPath === false || \strpos($realFullPath, $realUploadDir) !== 0) {
			return new WP_Error(
				'file_not_found',
				\__('File not found.', 'aether-site-exporter'),
				[ 'status' => 404 ]
			);
		}

		// Read and return file
		$content = \file_get_contents($realFullPath);
		if ($content === false) {
			return new WP_Error(
				'read_failed',
				\__('Failed to read file.', 'aether-site-exporter'),
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
}
