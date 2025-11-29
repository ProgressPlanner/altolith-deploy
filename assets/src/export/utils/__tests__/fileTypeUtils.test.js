/**
 * File Type Utils Tests
 *
 * Tests for file type utilities that determine how files should be processed.
 * Binary assets (images, fonts, video) can be streamed directly, while text
 * assets (HTML, CSS, JS) need to be stored in memory for URL replacement.
 */

import {
	shouldStoreInMemory,
	getFileExtension,
	STREAMABLE_EXTENSIONS,
	MEMORY_EXTENSIONS,
} from '../fileTypeUtils';

describe( 'fileTypeUtils', () => {
	describe( 'getFileExtension', () => {
		it( 'should extract extension from simple URL', () => {
			expect( getFileExtension( 'https://example.com/image.jpg' ) ).toBe(
				'jpg'
			);
		} );

		it( 'should extract extension from URL with query params', () => {
			expect(
				getFileExtension( 'https://example.com/style.css?ver=1.0' )
			).toBe( 'css' );
		} );

		it( 'should extract extension from URL with hash', () => {
			expect(
				getFileExtension( 'https://example.com/script.js#section' )
			).toBe( 'js' );
		} );

		it( 'should handle uppercase extensions', () => {
			expect( getFileExtension( 'https://example.com/image.JPG' ) ).toBe(
				'jpg'
			);
		} );

		it( 'should return empty string for URLs without extension', () => {
			expect( getFileExtension( 'https://example.com/page' ) ).toBe( '' );
		} );

		it( 'should return empty string for root URL', () => {
			expect( getFileExtension( 'https://example.com/' ) ).toBe( '' );
		} );

		it( 'should handle paths with multiple dots', () => {
			expect(
				getFileExtension( 'https://example.com/file.min.js' )
			).toBe( 'js' );
		} );

		it( 'should handle URLs with versioned filenames', () => {
			expect(
				getFileExtension( 'https://example.com/app.abc123.css' )
			).toBe( 'css' );
		} );

		it( 'should handle null and undefined', () => {
			expect( getFileExtension( null ) ).toBe( '' );
			expect( getFileExtension( undefined ) ).toBe( '' );
		} );

		it( 'should handle empty string', () => {
			expect( getFileExtension( '' ) ).toBe( '' );
		} );
	} );

	describe( 'shouldStoreInMemory', () => {
		describe( 'text assets that need URL replacement', () => {
			it( 'should return true for CSS files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/style.css' )
				).toBe( true );
			} );

			it( 'should return true for JavaScript files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/script.js' )
				).toBe( true );
			} );

			it( 'should return true for HTML files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/page.html' )
				).toBe( true );
			} );

			it( 'should return true for JSON files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/data.json' )
				).toBe( true );
			} );

			it( 'should return true for XML files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/feed.xml' )
				).toBe( true );
			} );

			it( 'should return true for SVG files (contain URLs)', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/icon.svg' )
				).toBe( true );
			} );

			it( 'should return true for webmanifest files', () => {
				expect(
					shouldStoreInMemory(
						'https://example.com/site.webmanifest'
					)
				).toBe( true );
			} );
		} );

		describe( 'binary assets that can be streamed', () => {
			// Images
			it( 'should return false for JPG files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/photo.jpg' )
				).toBe( false );
			} );

			it( 'should return false for JPEG files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/photo.jpeg' )
				).toBe( false );
			} );

			it( 'should return false for PNG files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/image.png' )
				).toBe( false );
			} );

			it( 'should return false for GIF files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/anim.gif' )
				).toBe( false );
			} );

			it( 'should return false for WebP files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/image.webp' )
				).toBe( false );
			} );

			it( 'should return false for ICO files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/favicon.ico' )
				).toBe( false );
			} );

			it( 'should return false for AVIF files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/image.avif' )
				).toBe( false );
			} );

			// Video
			it( 'should return false for MP4 files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/video.mp4' )
				).toBe( false );
			} );

			it( 'should return false for WebM files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/video.webm' )
				).toBe( false );
			} );

			it( 'should return false for OGG files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/video.ogg' )
				).toBe( false );
			} );

			// Audio
			it( 'should return false for MP3 files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/audio.mp3' )
				).toBe( false );
			} );

			it( 'should return false for WAV files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/sound.wav' )
				).toBe( false );
			} );

			// Fonts
			it( 'should return false for WOFF files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/font.woff' )
				).toBe( false );
			} );

			it( 'should return false for WOFF2 files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/font.woff2' )
				).toBe( false );
			} );

			it( 'should return false for TTF files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/font.ttf' )
				).toBe( false );
			} );

			it( 'should return false for EOT files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/font.eot' )
				).toBe( false );
			} );

			it( 'should return false for OTF files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/font.otf' )
				).toBe( false );
			} );

			// Documents
			it( 'should return false for PDF files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/doc.pdf' )
				).toBe( false );
			} );

			// Archives
			it( 'should return false for ZIP files', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/archive.zip' )
				).toBe( false );
			} );
		} );

		describe( 'edge cases', () => {
			it( 'should default to true for unknown extensions', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/file.unknown' )
				).toBe( true );
			} );

			it( 'should default to true for URLs without extension', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/path/page' )
				).toBe( true );
			} );

			it( 'should handle mixed case extensions', () => {
				expect(
					shouldStoreInMemory( 'https://example.com/image.PNG' )
				).toBe( false );
				expect(
					shouldStoreInMemory( 'https://example.com/style.CSS' )
				).toBe( true );
			} );

			it( 'should handle URLs with query params', () => {
				expect(
					shouldStoreInMemory(
						'https://example.com/image.jpg?v=123&width=800'
					)
				).toBe( false );
			} );

			it( 'should handle URLs with hash fragments', () => {
				expect(
					shouldStoreInMemory(
						'https://example.com/font.woff2#iefix'
					)
				).toBe( false );
			} );
		} );
	} );

	describe( 'exported constants', () => {
		it( 'should export STREAMABLE_EXTENSIONS as a Set', () => {
			expect( STREAMABLE_EXTENSIONS ).toBeInstanceOf( Set );
		} );

		it( 'should export MEMORY_EXTENSIONS as a Set', () => {
			expect( MEMORY_EXTENSIONS ).toBeInstanceOf( Set );
		} );

		it( 'should have no overlap between streamable and memory extensions', () => {
			const overlap = [ ...STREAMABLE_EXTENSIONS ].filter( ( ext ) =>
				MEMORY_EXTENSIONS.has( ext )
			);
			expect( overlap ).toHaveLength( 0 );
		} );
	} );
} );
