/**
 * Asset Tracker Tests
 *
 * @package
 */

import { createAssetTracker } from '../assetTracker';

describe( 'createAssetTracker', () => {
	let tracker;

	beforeEach( () => {
		tracker = createAssetTracker();
	} );

	describe( 'isUploaded', () => {
		test( 'returns false for untracked URL', () => {
			expect(
				tracker.isUploaded( 'https://example.com/image.jpg' )
			).toBe( false );
		} );

		test( 'returns true for tracked URL', () => {
			const url = 'https://example.com/image.jpg';
			tracker.markUploaded( url );
			expect( tracker.isUploaded( url ) ).toBe( true );
		} );

		test( 'normalizes URLs before checking', () => {
			const url1 = 'https://example.com/image.jpg';
			const url2 = 'https://example.com/image.jpg/';
			const url3 = 'https://example.com/image.jpg#fragment';

			tracker.markUploaded( url1 );
			expect( tracker.isUploaded( url2 ) ).toBe( true );
			expect( tracker.isUploaded( url3 ) ).toBe( true );
		} );

		test( 'handles root path correctly', () => {
			const rootUrl = 'https://example.com/';
			tracker.markUploaded( rootUrl );
			expect( tracker.isUploaded( 'https://example.com/' ) ).toBe( true );
			expect( tracker.isUploaded( 'https://example.com' ) ).toBe( true );
		} );

		test( 'handles invalid URLs', () => {
			const invalidUrl = 'not-a-valid-url';
			tracker.markUploaded( invalidUrl );
			expect( tracker.isUploaded( invalidUrl ) ).toBe( true );
		} );
	} );

	describe( 'markUploaded', () => {
		test( 'marks URL as uploaded', () => {
			const url = 'https://example.com/image.jpg';
			tracker.markUploaded( url );
			expect( tracker.isUploaded( url ) ).toBe( true );
		} );

		test( 'normalizes URL before storing', () => {
			const url1 = 'https://example.com/image.jpg';
			const url2 = 'https://example.com/image.jpg/';
			const url3 = 'https://example.com/image.jpg#fragment';

			tracker.markUploaded( url1 );
			expect( tracker.isUploaded( url2 ) ).toBe( true );
			expect( tracker.isUploaded( url3 ) ).toBe( true );
		} );

		test( 'handles multiple URLs', () => {
			const url1 = 'https://example.com/image1.jpg';
			const url2 = 'https://example.com/image2.jpg';
			const url3 = 'https://example.com/image3.jpg';

			tracker.markUploaded( url1 );
			tracker.markUploaded( url2 );
			tracker.markUploaded( url3 );

			expect( tracker.isUploaded( url1 ) ).toBe( true );
			expect( tracker.isUploaded( url2 ) ).toBe( true );
			expect( tracker.isUploaded( url3 ) ).toBe( true );
		} );

		test( 'handles duplicate URLs', () => {
			const url = 'https://example.com/image.jpg';
			tracker.markUploaded( url );
			tracker.markUploaded( url );
			expect( tracker.getCount() ).toBe( 1 );
		} );
	} );

	describe( 'getCount', () => {
		test( 'returns 0 for empty tracker', () => {
			expect( tracker.getCount() ).toBe( 0 );
		} );

		test( 'returns correct count after marking URLs', () => {
			tracker.markUploaded( 'https://example.com/image1.jpg' );
			expect( tracker.getCount() ).toBe( 1 );

			tracker.markUploaded( 'https://example.com/image2.jpg' );
			expect( tracker.getCount() ).toBe( 2 );

			tracker.markUploaded( 'https://example.com/image3.jpg' );
			expect( tracker.getCount() ).toBe( 3 );
		} );

		test( 'does not count duplicates', () => {
			tracker.markUploaded( 'https://example.com/image.jpg' );
			tracker.markUploaded( 'https://example.com/image.jpg' );
			tracker.markUploaded( 'https://example.com/image.jpg/' );
			expect( tracker.getCount() ).toBe( 1 );
		} );
	} );

	describe( 'clear', () => {
		test( 'clears all tracked URLs', () => {
			tracker.markUploaded( 'https://example.com/image1.jpg' );
			tracker.markUploaded( 'https://example.com/image2.jpg' );
			expect( tracker.getCount() ).toBe( 2 );

			tracker.clear();
			expect( tracker.getCount() ).toBe( 0 );
			expect(
				tracker.isUploaded( 'https://example.com/image1.jpg' )
			).toBe( false );
			expect(
				tracker.isUploaded( 'https://example.com/image2.jpg' )
			).toBe( false );
		} );

		test( 'handles clearing empty tracker', () => {
			expect( () => tracker.clear() ).not.toThrow();
			expect( tracker.getCount() ).toBe( 0 );
		} );
	} );

	describe( 'URL normalization', () => {
		test( 'removes fragments from URLs', () => {
			const url1 = 'https://example.com/image.jpg#section1';
			const url2 = 'https://example.com/image.jpg#section2';

			tracker.markUploaded( url1 );
			expect( tracker.isUploaded( url2 ) ).toBe( true );
		} );

		test( 'removes trailing slashes from paths', () => {
			const url1 = 'https://example.com/path/';
			const url2 = 'https://example.com/path';

			tracker.markUploaded( url1 );
			expect( tracker.isUploaded( url2 ) ).toBe( true );
		} );

		test( 'preserves root path', () => {
			const rootUrl = 'https://example.com/';
			tracker.markUploaded( rootUrl );
			expect( tracker.isUploaded( 'https://example.com/' ) ).toBe( true );
		} );

		test( 'handles URLs with query parameters', () => {
			const url1 = 'https://example.com/image.jpg?v=1';
			const url2 = 'https://example.com/image.jpg?v=2';

			tracker.markUploaded( url1 );
			// Query parameters are preserved, so these are different URLs
			expect( tracker.isUploaded( url2 ) ).toBe( false );
		} );

		test( 'handles relative URLs', () => {
			// Relative URLs will fail URL parsing and be stored as-is
			const relativeUrl = '/image.jpg';
			tracker.markUploaded( relativeUrl );
			expect( tracker.isUploaded( relativeUrl ) ).toBe( true );
		} );
	} );
} );
