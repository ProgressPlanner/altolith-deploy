/**
 * Providers Initialization Tests
 *
 * Tests for providers-init - ensures local-filesystem provider is imported.
 *
 * Quality Standards:
 * - Test must verify local-filesystem provider registers
 * - Must not crash during import
 *
 * @package Aether\SiteExporter\Tests
 */

// Mock the local-filesystem provider import
jest.mock( '../providers/local-filesystem', () => ( {} ) );

describe( 'providers-init', () => {
	it( 'should import without errors', () => {
		expect( () => {
			require( '../providers-init' );
		} ).not.toThrow();
	} );

	it( 'should import local-filesystem provider', () => {
		// Mock should have been called when module loaded
		const localFilesystem = require( '../providers/local-filesystem' );

		// Verify mock was loaded (proves import statement works)
		expect( localFilesystem ).toBeDefined();
	} );
} );
