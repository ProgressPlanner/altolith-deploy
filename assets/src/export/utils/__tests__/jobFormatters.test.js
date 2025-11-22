/**
 * Job Formatters Tests
 *
 * Tests for job formatting utilities.
 * These are pure functions for formatting job data.
 *
 */

import { formatJobTime, getStatusDisplay } from '../jobFormatters';

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

describe( 'jobFormatters', () => {
	describe( 'formatJobTime()', () => {
		// Save original Date.now and restore after tests
		let originalDateNow;

		beforeEach( () => {
			originalDateNow = Date.now;
			// Mock current time: Jan 1, 2024, 12:00:00 UTC (1704110400 seconds)
			Date.now = jest.fn( () => 1704110400000 );
		} );

		afterEach( () => {
			Date.now = originalDateNow;
		} );

		describe( 'Invalid input', () => {
			test( 'should return "Unknown" for null timestamp', () => {
				expect( formatJobTime( null ) ).toBe( 'Unknown' );
			} );

			test( 'should return "Unknown" for undefined timestamp', () => {
				expect( formatJobTime( undefined ) ).toBe( 'Unknown' );
			} );

			test( 'should return "Unknown" for 0 timestamp', () => {
				expect( formatJobTime( 0 ) ).toBe( 'Unknown' );
			} );

			test( 'should return "Unknown" for empty string', () => {
				expect( formatJobTime( '' ) ).toBe( 'Unknown' );
			} );
		} );

		describe( 'Just now', () => {
			test( 'should return "Just now" for current timestamp', () => {
				const now = Math.floor( Date.now() / 1000 );
				expect( formatJobTime( now ) ).toBe( 'Just now' );
			} );

			test( 'should return "Just now" for 30 seconds ago', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 30;
				expect( formatJobTime( timestamp ) ).toBe( 'Just now' );
			} );

			test( 'should return "Just now" for 59 seconds ago', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 59;
				expect( formatJobTime( timestamp ) ).toBe( 'Just now' );
			} );
		} );

		describe( 'Minutes ago', () => {
			test( 'should return "1 minute ago" for 1 minute ago (singular)', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 60;
				expect( formatJobTime( timestamp ) ).toBe( '1 minute ago' );
			} );

			test( 'should return "2 minutes ago" for 2 minutes ago (plural)', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 120;
				expect( formatJobTime( timestamp ) ).toBe( '2 minutes ago' );
			} );

			test( 'should return "30 minutes ago"', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 1800;
				expect( formatJobTime( timestamp ) ).toBe( '30 minutes ago' );
			} );

			test( 'should return "59 minutes ago"', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 3540;
				expect( formatJobTime( timestamp ) ).toBe( '59 minutes ago' );
			} );
		} );

		describe( 'Hours ago', () => {
			test( 'should return "1 hour ago" for 1 hour ago (singular)', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 3600;
				expect( formatJobTime( timestamp ) ).toBe( '1 hour ago' );
			} );

			test( 'should return "2 hours ago" for 2 hours ago (plural)', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 7200;
				expect( formatJobTime( timestamp ) ).toBe( '2 hours ago' );
			} );

			test( 'should return "12 hours ago"', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 43200;
				expect( formatJobTime( timestamp ) ).toBe( '12 hours ago' );
			} );

			test( 'should return "23 hours ago"', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 82800;
				expect( formatJobTime( timestamp ) ).toBe( '23 hours ago' );
			} );
		} );

		describe( 'Days ago', () => {
			test( 'should return "1 day ago" for 1 day ago (singular)', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 86400;
				expect( formatJobTime( timestamp ) ).toBe( '1 day ago' );
			} );

			test( 'should return "2 days ago" for 2 days ago (plural)', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 172800;
				expect( formatJobTime( timestamp ) ).toBe( '2 days ago' );
			} );

			test( 'should return "7 days ago" for 1 week ago', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 604800;
				expect( formatJobTime( timestamp ) ).toBe( '7 days ago' );
			} );

			test( 'should return "30 days ago" for 1 month ago', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 2592000;
				expect( formatJobTime( timestamp ) ).toBe( '30 days ago' );
			} );

			test( 'should return "365 days ago" for 1 year ago', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 31536000;
				expect( formatJobTime( timestamp ) ).toBe( '365 days ago' );
			} );
		} );

		describe( 'Boundary conditions', () => {
			test( 'should prefer days over hours at 24 hour mark', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 86400;
				expect( formatJobTime( timestamp ) ).toBe( '1 day ago' );
			} );

			test( 'should prefer hours over minutes at 1 hour mark', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 3600;
				expect( formatJobTime( timestamp ) ).toBe( '1 hour ago' );
			} );

			test( 'should prefer minutes over "just now" at 1 minute mark', () => {
				const timestamp = Math.floor( Date.now() / 1000 ) - 60;
				expect( formatJobTime( timestamp ) ).toBe( '1 minute ago' );
			} );
		} );

		describe( 'Future timestamps', () => {
			test( 'should handle future timestamps gracefully', () => {
				const futureTimestamp = Math.floor( Date.now() / 1000 ) + 3600;
				// Negative diff should result in 0 for floor operations
				expect( formatJobTime( futureTimestamp ) ).toBe( 'Just now' );
			} );
		} );
	} );

	describe( 'getStatusDisplay()', () => {
		describe( 'Known statuses', () => {
			test( 'should return correct display for "complete" status', () => {
				const result = getStatusDisplay( 'complete' );
				expect( result ).toEqual( {
					label: 'Completed',
					class: 'success',
				} );
			} );

			test( 'should return correct display for "failed" status', () => {
				const result = getStatusDisplay( 'failed' );
				expect( result ).toEqual( {
					label: 'Failed',
					class: 'error',
				} );
			} );

			test( 'should return correct display for "running" status', () => {
				const result = getStatusDisplay( 'running' );
				expect( result ).toEqual( {
					label: 'Running',
					class: 'info',
				} );
			} );
		} );

		describe( 'Unknown statuses', () => {
			test( 'should capitalize first letter of unknown status', () => {
				const result = getStatusDisplay( 'pending' );
				expect( result ).toEqual( {
					label: 'Pending',
					class: 'warning',
				} );
			} );

			test( 'should handle lowercase unknown status', () => {
				const result = getStatusDisplay( 'paused' );
				expect( result ).toEqual( {
					label: 'Paused',
					class: 'warning',
				} );
			} );

			test( 'should handle uppercase unknown status', () => {
				const result = getStatusDisplay( 'QUEUED' );
				expect( result ).toEqual( {
					label: 'QUEUED',
					class: 'warning',
				} );
			} );

			test( 'should handle mixed-case unknown status', () => {
				const result = getStatusDisplay( 'InProgress' );
				expect( result ).toEqual( {
					label: 'InProgress',
					class: 'warning',
				} );
			} );

			test( 'should use "warning" class for all unknown statuses', () => {
				expect( getStatusDisplay( 'custom' ).class ).toBe( 'warning' );
				expect( getStatusDisplay( 'another' ).class ).toBe( 'warning' );
				expect( getStatusDisplay( 'unknown' ).class ).toBe( 'warning' );
			} );
		} );

		describe( 'Edge cases', () => {
			test( 'should handle empty string status', () => {
				const result = getStatusDisplay( '' );
				expect( result ).toEqual( {
					label: '',
					class: 'warning',
				} );
			} );

			test( 'should handle single character status', () => {
				const result = getStatusDisplay( 'a' );
				expect( result ).toEqual( {
					label: 'A',
					class: 'warning',
				} );
			} );

			test( 'should handle status with spaces', () => {
				const result = getStatusDisplay( 'in progress' );
				expect( result ).toEqual( {
					label: 'In progress',
					class: 'warning',
				} );
			} );

			test( 'should handle status with hyphens', () => {
				const result = getStatusDisplay( 'in-progress' );
				expect( result ).toEqual( {
					label: 'In-progress',
					class: 'warning',
				} );
			} );

			test( 'should handle status with underscores', () => {
				const result = getStatusDisplay( 'in_progress' );
				expect( result ).toEqual( {
					label: 'In_progress',
					class: 'warning',
				} );
			} );
		} );

		describe( 'Immutability', () => {
			test( 'should return a new object each time', () => {
				const result1 = getStatusDisplay( 'complete' );
				const result2 = getStatusDisplay( 'complete' );
				expect( result1 ).not.toBe( result2 );
				expect( result1 ).toEqual( result2 );
			} );

			test( 'should not modify input', () => {
				const status = 'running';
				getStatusDisplay( status );
				expect( status ).toBe( 'running' );
			} );
		} );
	} );

	describe( 'Integration', () => {
		test( 'both functions should handle various inputs', () => {
			// formatJobTime
			expect( formatJobTime( null ) ).toBe( 'Unknown' );
			expect( formatJobTime( Math.floor( Date.now() / 1000 ) ) ).toBe(
				'Just now'
			);

			// getStatusDisplay
			expect( getStatusDisplay( 'complete' ).class ).toBe( 'success' );
			expect( getStatusDisplay( 'unknown' ).class ).toBe( 'warning' );
		} );
	} );
} );
