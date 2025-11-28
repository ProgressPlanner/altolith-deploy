/**
 * Export Configuration Tests
 *
 * Tests for exportConfiguration utilities.
 * Validates pure functions for workflow configuration.
 *
 */

import {
	prepareExportConfiguration,
	getInstancesForOutputType,
	getInstancesForDeploymentType,
	determineProvidersByOutputType,
	buildWorkflowContext,
} from '../exportConfiguration';

// Mock ProviderRegistry - define before jest.mock
jest.mock( '../../../providers/registry/ProviderRegistry', () => ( {
	__esModule: true,
	default: {
		get: jest.fn(),
	},
} ) );

// Mock outputTypes
jest.mock( '../../../utils/outputTypes', () => ( {
	getOutputTypes: jest.fn( () => [
		{
			id: 'static_site',
			label: 'Static Site',
			fields: [
				{ id: 'enable_static_site', type: 'toggle', default: true },
			],
		},
		{
			id: 'blueprint',
			label: 'Blueprint',
			fields: [
				{ id: 'enable_blueprint', type: 'toggle', default: false },
			],
		},
	] ),
	getEnabledOutputTypes: jest.fn( ( config ) => {
		const enabled = [];
		if ( config.enable_static_site === true ) {
			enabled.push( 'static_site' );
		}
		if ( config.enable_blueprint === true ) {
			enabled.push( 'blueprint' );
		}
		return enabled;
	} ),
} ) );

// Import the mocked registry to access the mock functions
import ProviderRegistry from '../../../providers/registry/ProviderRegistry';
const mockProviderRegistry = ProviderRegistry;

describe( 'exportConfiguration', () => {
	describe( 'prepareExportConfiguration()', () => {
		test( 'should extract provider IDs from settings response', () => {
			const settingsResponse = {
				settings: {
					provider_types: {
						storage: 'local-filesystem:123',
						static_site: 'cloudflare:456',
					},
					providers: {
						'local-filesystem:123': {},
						'cloudflare:456': {},
					},
				},
			};

			const result = prepareExportConfiguration( settingsResponse );

			expect( result ).toEqual( {
				storageProviderId: 'local-filesystem:123',
				staticSiteProviderId: 'cloudflare:456',
				providerConfigs: {
					'local-filesystem:123': {},
					'cloudflare:456': {},
				},
			} );
		} );

		test( 'should handle missing settings object', () => {
			const settingsResponse = {};

			const result = prepareExportConfiguration( settingsResponse );

			expect( result ).toEqual( {
				storageProviderId: '',
				staticSiteProviderId: '',
				providerConfigs: {},
			} );
		} );

		test( 'should handle null/undefined settings response', () => {
			const result1 = prepareExportConfiguration( null );
			const result2 = prepareExportConfiguration( undefined );

			expect( result1.storageProviderId ).toBe( '' );
			expect( result2.storageProviderId ).toBe( '' );
		} );

		test( 'should handle empty provider_types object', () => {
			const settingsResponse = {
				settings: {
					provider_types: {},
				},
			};

			const result = prepareExportConfiguration( settingsResponse );

			expect( result.storageProviderId ).toBe( '' );
			expect( result.staticSiteProviderId ).toBe( '' );
		} );
	} );

	describe( 'getInstancesForOutputType()', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		test( 'should return instances with output type enabled', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
					enable_static_site: true,
				},
				'local-filesystem:2': {
					provider_type: 'local-filesystem',
					enable_static_site: true,
					enable_blueprint: true,
				},
				'local-filesystem:3': {
					provider_type: 'local-filesystem',
					enable_blueprint: true,
				},
			};

			// Mock ProviderRegistry.get() to return a valid provider
			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = getInstancesForOutputType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toEqual( [
				'local-filesystem:1',
				'local-filesystem:2',
			] );
		} );

		test( 'should return instances with blueprint enabled', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
					enable_static_site: true,
				},
				'local-filesystem:2': {
					provider_type: 'local-filesystem',
					enable_blueprint: true,
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = getInstancesForOutputType(
				providerConfigs,
				'blueprint'
			);

			expect( result ).toEqual( [ 'local-filesystem:2' ] );
		} );

		test( 'should handle empty provider configs', () => {
			const result = getInstancesForOutputType( {}, 'static_site' );

			expect( result ).toEqual( [] );
		} );

		test( 'should handle null/undefined provider configs', () => {
			const result1 = getInstancesForOutputType( null, 'static_site' );
			const result2 = getInstancesForOutputType(
				undefined,
				'static_site'
			);

			expect( result1 ).toEqual( [] );
			expect( result2 ).toEqual( [] );
		} );

		test( 'should handle malformed provider configs', () => {
			const providerConfigs = {
				'local-filesystem:1': null,
				'local-filesystem:2': 'invalid',
				'local-filesystem:3': {
					// Missing provider_type
					enable_static_site: true,
				},
				'local-filesystem:4': {
					provider_type: 'local-filesystem',
					enable_static_site: true,
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = getInstancesForOutputType(
				providerConfigs,
				'static_site'
			);

			// Only provider-4 should be included
			expect( result ).toEqual( [ 'local-filesystem:4' ] );
		} );
	} );

	describe( 'getInstancesForDeploymentType() (legacy compatibility)', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		test( 'should map static_site deployment type to output type', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
					enable_static_site: true,
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = getInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toEqual( [ 'local-filesystem:1' ] );
		} );

		test( 'should map blueprint_bundle deployment type to blueprint output type', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
					enable_blueprint: true,
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = getInstancesForDeploymentType(
				providerConfigs,
				'blueprint_bundle'
			);

			expect( result ).toEqual( [ 'local-filesystem:1' ] );
		} );
	} );

	describe( 'determineProvidersByOutputType()', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		test( 'should group providers by output type', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
					enable_static_site: true,
				},
				'local-filesystem:2': {
					provider_type: 'local-filesystem',
					enable_static_site: true,
					enable_blueprint: true,
				},
				'local-filesystem:3': {
					provider_type: 'local-filesystem',
					enable_blueprint: true,
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = determineProvidersByOutputType( providerConfigs );

			expect( result ).toEqual( {
				static_site: [ 'local-filesystem:1', 'local-filesystem:2' ],
				blueprint: [ 'local-filesystem:2', 'local-filesystem:3' ],
			} );
		} );

		test( 'should return empty arrays for output types with no providers', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
					enable_static_site: true,
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = determineProvidersByOutputType( providerConfigs );

			expect( result ).toEqual( {
				static_site: [ 'local-filesystem:1' ],
				blueprint: [],
			} );
		} );
	} );

	describe( 'buildWorkflowContext()', () => {
		test( 'should build complete workflow context', () => {
			const providerInstancesByType = {
				static_site: [
					{ id: 'cloudflare:1', label: 'Cloudflare 1' },
					{ id: 'cloudflare:2', label: 'Cloudflare 2' },
				],
				blueprint: [ { id: 'local-filesystem:123', label: 'Local' } ],
			};

			const config = {
				siteUrl: 'https://example.com',
				providerInstancesByType,
			};

			const mockApi = {};
			const mockProcessUrls = jest.fn();
			const mockGenerateBlueprint = jest.fn();
			const mockUpdateProgress = jest.fn();
			const mockAssetManager = {};
			const mockSetStatus = jest.fn();
			const mockSetProgress = jest.fn();
			const mockSetProviderProgress = jest.fn();

			const dependencies = {
				api: mockApi,
				processStaticSiteUrls: mockProcessUrls,
				generateBlueprintJson: mockGenerateBlueprint,
				updateStaticSiteProgressContext: mockUpdateProgress,
				assetManager: mockAssetManager,
				setStatusMessage: mockSetStatus,
				setStepProgress: mockSetProgress,
				setProviderProgress: mockSetProviderProgress,
			};

			const result = buildWorkflowContext( config, dependencies );

			expect( result ).toEqual( {
				// API and state
				api: mockApi,
				siteUrl: 'https://example.com',

				// Provider instances by type
				providerInstancesByType,

				// Provider instance references (for future parallel execution)
				providerInstances: [],
				currentProviderInstance: null,

				// Hooks and utilities
				processStaticSiteUrls: mockProcessUrls,
				generateBlueprintJson: mockGenerateBlueprint,
				updateStaticSiteProgressContext: mockUpdateProgress,
				assetManager: mockAssetManager,

				// State setters
				setStatusMessage: mockSetStatus,
				setStepProgress: mockSetProgress,
				setProviderProgress: mockSetProviderProgress,

				// Discovered assets
				discoveredAssets: null,
			} );
		} );

		test( 'should handle minimal config and dependencies', () => {
			const config = {
				siteUrl: 'https://example.com',
				providerInstancesByType: {},
			};

			const dependencies = {
				api: null,
				processStaticSiteUrls: null,
				generateBlueprintJson: null,
				updateStaticSiteProgressContext: null,
				assetManager: null,
				setStatusMessage: null,
				setStepProgress: null,
				setProviderProgress: null,
			};

			const result = buildWorkflowContext( config, dependencies );

			expect( result ).toHaveProperty( 'siteUrl' );
			expect( result ).toHaveProperty( 'discoveredAssets' );
			expect( result.discoveredAssets ).toBeNull();
		} );
	} );
} );
