/**
 * File Validation Utilities
 *
 * Client-side file validation for uploads.
 * Provides instant feedback before hitting the server.
 * PHP still validates as security backstop.
 */

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
	'jpg',
	'jpeg',
	'png',
	'gif',
	'webp',
	'svg', // Images
	'css',
	'js',
	'json', // Web assets
	'woff',
	'woff2',
	'ttf',
	'eot', // Fonts
	'pdf',
	'txt',
	'md', // Documents
	'zip',
	'tar',
	'gz', // Archives
	'html',
	'htm',
	'xml', // Markup
];

// Expected MIME types for extensions
const MIME_TYPE_MAP = {
	// Images
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	// Web assets
	css: 'text/css',
	js: 'application/javascript',
	json: 'application/json',
	// Fonts
	woff: 'font/woff',
	woff2: 'font/woff2',
	ttf: 'font/ttf',
	eot: 'application/vnd.ms-fontobject',
	// Documents
	pdf: 'application/pdf',
	txt: 'text/plain',
	md: 'text/markdown',
	// Archives
	zip: 'application/zip',
	tar: 'application/x-tar',
	gz: 'application/gzip',
	// Markup
	html: 'text/html',
	htm: 'text/html',
	xml: 'application/xml',
};

/**
 * Format file size in human-readable format.
 *
 * @param {number} bytes File size in bytes.
 * @return {string} Human-readable size (e.g., "1.5 MB").
 */
export function formatFileSize( bytes ) {
	if ( bytes === 0 ) {
		return '0 Bytes';
	}

	const k = 1024;
	const sizes = [ 'Bytes', 'KB', 'MB', 'GB' ];
	const i = Math.floor( Math.log( bytes ) / Math.log( k ) );

	return `${ parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( 2 ) ) } ${
		sizes[ i ]
	}`;
}

/**
 * Get file extension from filename.
 *
 * @param {string} filename File name.
 * @return {string} Extension (lowercase, without dot).
 */
export function getFileExtension( filename ) {
	const lastDot = filename.lastIndexOf( '.' );
	if ( lastDot === -1 ) {
		return '';
	}
	return filename.slice( lastDot + 1 ).toLowerCase();
}

/**
 * Validate file size.
 *
 * @param {File|Blob} file File to validate.
 * @return {Object} Validation result with valid boolean and error message.
 */
export function validateFileSize( file ) {
	if ( ! file || ! file.size ) {
		return {
			valid: true,
		};
	}

	if ( file.size > MAX_FILE_SIZE ) {
		return {
			valid: false,
			error: `File size (${ formatFileSize(
				file.size
			) }) exceeds maximum allowed size of ${ formatFileSize(
				MAX_FILE_SIZE
			) }.`,
		};
	}

	return {
		valid: true,
	};
}

/**
 * Validate file extension.
 *
 * @param {string} filename File name or key.
 * @return {Object} Validation result with valid boolean and error message.
 */
export function validateFileExtension( filename ) {
	const extension = getFileExtension( filename );

	// Allow files without extension (e.g., directory index files)
	if ( extension === '' ) {
		return {
			valid: true,
		};
	}

	if ( ! ALLOWED_EXTENSIONS.includes( extension ) ) {
		return {
			valid: false,
			error: `File type "${ extension }" is not allowed for upload. Allowed types: ${ ALLOWED_EXTENSIONS.join(
				', '
			) }.`,
		};
	}

	return {
		valid: true,
	};
}

/**
 * Validate file MIME type.
 *
 * @param {File|Blob} file     File to validate.
 * @param {string}    filename File name (to check extension).
 * @return {Object} Validation result with valid boolean and error message.
 */
export function validateFileMimeType( file, filename ) {
	if ( ! file || ! file.type ) {
		// No MIME type available (e.g., Blob without type)
		// Skip validation - PHP will handle it
		return {
			valid: true,
		};
	}

	const extension = getFileExtension( filename );
	const expectedMimeType = MIME_TYPE_MAP[ extension ];

	// If we don't have an expected MIME type, allow it
	// (PHP will do final validation)
	if ( ! expectedMimeType ) {
		return {
			valid: true,
		};
	}

	// Check if MIME type matches expected
	if ( file.type !== expectedMimeType ) {
		// Allow common misidentifications
		const mimeType = file.type;

		// JavaScript files often misidentified
		if (
			extension === 'js' &&
			( mimeType === 'text/plain' ||
				mimeType === 'text/x-java' ||
				mimeType === 'application/x-javascript' ||
				mimeType === 'text/javascript' )
		) {
			return { valid: true };
		}

		// Text-based files often detected as text/plain
		if (
			[ 'css', 'html', 'htm', 'xml', 'txt', 'md' ].includes(
				extension
			) &&
			mimeType === 'text/plain'
		) {
			return { valid: true };
		}

		return {
			valid: false,
			error: `File MIME type "${ mimeType }" doesn't match expected type "${ expectedMimeType }" for .${ extension } files.`,
		};
	}

	return {
		valid: true,
	};
}

/**
 * Validate file completely (size, extension, MIME type).
 *
 * @param {File|Blob} file File to validate.
 * @param {string}    key  File key/name.
 * @return {Object} Validation result with valid boolean and error message.
 */
export function validateFile( file, key ) {
	// Validate file size
	const sizeValidation = validateFileSize( file );
	if ( ! sizeValidation.valid ) {
		return sizeValidation;
	}

	// Validate file extension
	const extensionValidation = validateFileExtension( key );
	if ( ! extensionValidation.valid ) {
		return extensionValidation;
	}

	// Validate MIME type
	const mimeValidation = validateFileMimeType( file, key );
	if ( ! mimeValidation.valid ) {
		return mimeValidation;
	}

	return {
		valid: true,
	};
}
