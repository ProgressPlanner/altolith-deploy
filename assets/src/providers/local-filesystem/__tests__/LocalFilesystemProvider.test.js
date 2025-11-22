/**
 * LocalFilesystemProvider Tests
 *
 * Comprehensive test suite for the local filesystem provider.
 * Tests basic functionality, configuration fields, validation, sanitization,
 * security boundaries, and provider operations.
 *
 */

import { LocalFilesystemProvider } from '../LocalFilesystemProvider';
import { DEPLOYMENT_TYPES } from '@aether/constants/deploymentTypes';

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: jest.fn( ( text ) => text ),
	sprintf: jest.fn( ( format, ...args ) =>
		format.replace( /%s/g, () => args.shift() )
	),
} ) );

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: jest.fn( ( hook, value ) => value ),
	doAction: jest.fn(),
} ) );

describe( 'LocalFilesystemProvider', () => {
	let provider;

	beforeEach( () => {
		provider = new LocalFilesystemProvider();
		jest.clearAllMocks();
	} );

	// ========================================================================
	// Basic Implementations Tests (CRITICAL)
	// ========================================================================

	describe( 'Basic Methods', () => {
		it( 'should return correct ID', () => {
			expect( provider.getId() ).toBe( 'local-filesystem' );
		} );

		it( 'should use registered ID if provided', () => {
			const customProvider = new LocalFilesystemProvider(
				{},
				'custom-id'
			);
			expect( customProvider.getId() ).toBe( 'custom-id' );
		} );

		it( 'should return correct name', () => {
			expect( provider.getName() ).toBe( 'Local Filesystem' );
		} );

		it( 'should return correct type', () => {
			expect( provider.getType() ).toBe( 'local-storage' );
		} );

		it( 'should return correct description', () => {
			const description = provider.getDescription();
			expect( description ).toContain( 'local' );
			expect( description.length ).toBeGreaterThan( 0 );
		} );

		it( 'should return correct icon', () => {
			expect( provider.getIcon() ).toBe( '💾' );
		} );
	} );

	// ========================================================================
	// Deployment Types Tests (HIGH)
	// ========================================================================

	describe( 'Deployment Types', () => {
		it( 'should support static site deployment', () => {
			const types = provider.getSupportedDeploymentTypes();
			expect( types ).toContain( DEPLOYMENT_TYPES.STATIC_SITE );
		} );

		it( 'should support blueprint bundle deployment', () => {
			const types = provider.getSupportedDeploymentTypes();
			expect( types ).toContain( DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE );
		} );

		it( 'should support exactly two deployment types', () => {
			const types = provider.getSupportedDeploymentTypes();
			expect( types ).toHaveLength( 2 );
		} );
	} );

	// ========================================================================
	// Configuration Fields Tests (HIGH)
	// ========================================================================

	describe( 'Configuration Fields', () => {
		it( 'should return three configuration fields', () => {
			const fields = provider.getProviderSpecificConfigFields();
			expect( fields ).toHaveLength( 3 );
		} );

		it( 'should have export_path field', () => {
			const fields = provider.getProviderSpecificConfigFields();
			const exportPathField = fields.find(
				( f ) => f.id === 'export_path'
			);
			expect( exportPathField ).toBeDefined();
			expect( exportPathField.required ).toBe( true );
			expect( exportPathField.type ).toBe( 'text' );
		} );

		it( 'should validate export_path pattern', () => {
			const fields = provider.getProviderSpecificConfigFields();
			const exportPathField = fields.find(
				( f ) => f.id === 'export_path'
			);

			expect(
				exportPathField.validation.pattern.test(
					'blueprint-bundle/bundle.zip'
				)
			).toBe( true );
			expect(
				exportPathField.validation.pattern.test( 'path/file.txt' )
			).toBe( false );
		} );

		it( 'should have public_url field', () => {
			const fields = provider.getProviderSpecificConfigFields();
			const publicUrlField = fields.find(
				( f ) => f.id === 'public_url'
			);
			expect( publicUrlField ).toBeDefined();
			expect( publicUrlField.required ).toBe( false );
		} );

		it( 'should validate public_url pattern', () => {
			const fields = provider.getProviderSpecificConfigFields();
			const publicUrlField = fields.find(
				( f ) => f.id === 'public_url'
			);

			expect(
				publicUrlField.validation.pattern.test( 'https://example.com' )
			).toBe( true );
			expect(
				publicUrlField.validation.pattern.test( 'ftp://example.com' )
			).toBe( false );
		} );

		it( 'should have static_files_path field', () => {
			const fields = provider.getProviderSpecificConfigFields();
			const staticPathField = fields.find(
				( f ) => f.id === 'static_files_path'
			);
			expect( staticPathField ).toBeDefined();
			expect( staticPathField.required ).toBe( true );
		} );
	} );

	// ========================================================================
	// Validation Tests (CRITICAL - Security)
	// ========================================================================

	describe( 'Configuration Validation', () => {
		it( 'should reject path traversal with ..', async () => {
			const config = { export_path: '../../../etc/passwd' };
			const errors = await provider.validateConfig( config );
			expect( errors.export_path ).toBeDefined();
			expect( errors.export_path ).toContain( '..' );
		} );

		it( 'should reject absolute paths', async () => {
			const config = { export_path: '/absolute/path/file.zip' };
			const errors = await provider.validateConfig( config );
			expect( errors.export_path ).toBeDefined();
			expect( errors.export_path ).toContain( 'relative' );
		} );

		it( 'should allow valid relative paths', async () => {
			const config = { export_path: 'blueprint-bundle/bundle.zip' };
			const errors = await provider.validateConfig( config );
			expect( errors.export_path ).toBeUndefined();
		} );
	} );

	// ========================================================================
	// Sanitization Tests (HIGH)
	// ========================================================================

	describe( 'Configuration Sanitization', () => {
		it( 'should trim export_path', async () => {
			const config = {
				export_path: '  blueprint-bundle/bundle.zip  ',
			};
			const sanitized = await provider.sanitizeConfig( config );
			expect( sanitized.export_path ).toBe(
				'blueprint-bundle/bundle.zip'
			);
		} );

		it( 'should remove leading slashes from export_path', async () => {
			const config = {
				export_path: '/blueprint-bundle/bundle.zip',
			};
			const sanitized = await provider.sanitizeConfig( config );
			expect( sanitized.export_path ).not.toMatch( /^\// );
		} );

		it( 'should set default export_path if empty', async () => {
			const config = { export_path: '' };
			const sanitized = await provider.sanitizeConfig( config );
			expect( sanitized.export_path ).toBe(
				'blueprint-bundle/bundle.zip'
			);
		} );

		it( 'should set default export_path if missing', async () => {
			const config = {};
			const sanitized = await provider.sanitizeConfig( config );
			expect( sanitized.export_path ).toBe(
				'blueprint-bundle/bundle.zip'
			);
		} );

		it( 'should set default static_files_path if empty', async () => {
			const config = { static_files_path: '' };
			const sanitized = await provider.sanitizeConfig( config );
			expect( sanitized.static_files_path ).toBe( 'static/' );
		} );
	} );

	// ========================================================================
	// Provider Operations Tests (MEDIUM)
	// ========================================================================

	describe( 'Provider Operations', () => {
		it( 'testConnection should always succeed', async () => {
			const result = await provider.testConnection( {} );
			expect( result.success ).toBe( true );
		} );

		it( 'deploy should return success', async () => {
			const result = await provider.deploy( {} );
			expect( result.success ).toBe( true );
			expect( result.deploymentUrl ).toBe( '' );
		} );

		it( 'getStatus should return success', async () => {
			const result = await provider.getStatus( {} );
			expect( result.success ).toBe( true );
			expect( result.healthy ).toBe( true );
		} );

		it( 'getDeploymentUrl should return empty string', async () => {
			const url = await provider.getDeploymentUrl();
			expect( url ).toBe( '' );
		} );

		it( 'getUploadStrategy should return direct', () => {
			expect( provider.getUploadStrategy() ).toBe( 'direct' );
		} );

		it( 'uploadFile should return success', async () => {
			const result = await provider.uploadFile(
				'source.zip',
				'dest.zip'
			);
			expect( result.success ).toBe( true );
			expect( result.url ).toBe( '' );
			expect( result.path ).toBe( 'source.zip' );
		} );

		it( 'isConfigured should always return true', async () => {
			const configured = await provider.isConfigured();
			expect( configured ).toBe( true );
		} );
	} );

	// ========================================================================
	// Inheritance Tests (MEDIUM)
	// ========================================================================

	describe( 'Inheritance from AbstractProvider', () => {
		it( 'should accept config in constructor', () => {
			const config = {
				export_path: 'test.zip',
				static_files_path: 'static/',
			};
			const customProvider = new LocalFilesystemProvider( config );
			expect( customProvider.config ).toEqual( config );
		} );

		it( 'should accept registered ID in constructor', () => {
			const customProvider = new LocalFilesystemProvider(
				{},
				'custom-local'
			);
			expect( customProvider.registeredId ).toBe( 'custom-local' );
			expect( customProvider.getId() ).toBe( 'custom-local' );
		} );

		it( 'should have initialize method from base class', () => {
			expect( typeof provider.initialize ).toBe( 'function' );
		} );
	} );
} );
