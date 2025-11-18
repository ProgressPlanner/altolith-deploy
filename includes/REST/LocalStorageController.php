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
				\sprintf(\__('Invalid file path: %s', 'aether-site-exporter'), $validation['error']),
				[ 'status' => 400 ]
			);
		}

		// NOW safe to create directories
		if (!\is_dir($uploadDir)) {
			// Check if a FILE exists where we need a DIRECTORY (legacy bug cleanup)
			// This can happen if paths with trailing slashes were uploaded before the fix
			if (\file_exists($uploadDir) && \is_file($uploadDir)) {
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Aether: Removing legacy blocking file to create directory: %s',
						$uploadDir
					));
				}
				@\unlink($uploadDir);
			}

			if (!\wp_mkdir_p($uploadDir)) {
				return new WP_Error(
					'directory_creation_failed',
					\__('Failed to create upload directory.', 'aether-site-exporter'),
					[ 'status' => 500 ]
				);
			}
		}

		if (!\is_dir($fileDir)) {
			// Check if a FILE exists where we need a DIRECTORY (legacy bug cleanup)
			// This can happen if paths with trailing slashes were uploaded before the fix
			if (\file_exists($fileDir) && \is_file($fileDir)) {
				if (\defined('WP_DEBUG') && WP_DEBUG) {
					\error_log(\sprintf(
						'Aether: Removing legacy blocking file to create directory: %s',
						$fileDir
					));
				}
				@\unlink($fileDir);
			}

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

		// Move uploaded file to target location
		if (isset($file['tmp_name']) && \is_uploaded_file($file['tmp_name'])) {
			// Handle actual uploaded file
			if (!\move_uploaded_file($file['tmp_name'], $fullPath)) {
				return new WP_Error(
					'upload_failed',
					\__('Failed to move uploaded file.', 'aether-site-exporter'),
					[ 'status' => 500 ]
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
}
