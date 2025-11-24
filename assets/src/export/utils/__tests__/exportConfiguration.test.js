/**
 * Publish Configuration Tests
 *
 * Tests for exportConfiguration utilities.
 * Validates pure functions for workflow configuration.
 *
 */

import {
	prepareExportConfiguration,
	getEnabledInstancesForDeploymentType,
	determineProvidersByDeploymentType,
	buildWorkflowContext,
} from '../exportConfiguration';
import { DEPLOYMENT_TYPES } from '../../../constants/deploymentTypes';

// Mock ProviderRegistry - define before jest.mock
jest.mock( '../../../providers/registry/ProviderRegistry', () => ( {
	__esModule: true,
	default: {
		get: jest.fn(),
	},
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

	describe( 'getEnabledInstancesForDeploymentType()', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		test( 'should return instances for deployment type', () => {
			const providerConfigs = {
				'local-filesystem-static-site:1': {
					provider_type: 'local-filesystem-static-site',
				},
				'local-filesystem-static-site:2': {
					provider_type: 'local-filesystem-static-site',
				},
				'local-filesystem-blueprint-bundle:1': {
					provider_type: 'local-filesystem-blueprint-bundle',
				},
			};

			// Mock ProviderRegistry.get() to return providers with DEPLOYMENT_TYPE
			mockProviderRegistry.get.mockImplementation( ( providerType ) => {
				if ( providerType === 'local-filesystem-static-site' ) {
					class MockProvider {
						static DEPLOYMENT_TYPE = 'static_site';
					}
					return MockProvider;
				}
				if ( providerType === 'local-filesystem-blueprint-bundle' ) {
					class MockProvider {
						static DEPLOYMENT_TYPE = 'blueprint_bundle';
					}
					return MockProvider;
				}
				return null;
			} );

			const result = getEnabledInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toEqual( [
				'local-filesystem-static-site:1',
				'local-filesystem-static-site:2',
			] );
		} );

		test( 'should filter out instances that do not support deployment type', () => {
			const providerConfigs = {
				'local-filesystem-static-site:1': {
					provider_type: 'local-filesystem-static-site',
				},
				'local-filesystem-blueprint-bundle:1': {
					provider_type: 'local-filesystem-blueprint-bundle',
				},
			};

			mockProviderRegistry.get.mockImplementation( ( providerType ) => {
				if ( providerType === 'local-filesystem-static-site' ) {
					class MockProvider {
						static DEPLOYMENT_TYPE = 'static_site';
					}
					return MockProvider;
				}
				if ( providerType === 'local-filesystem-blueprint-bundle' ) {
					class MockProvider {
						static DEPLOYMENT_TYPE = 'blueprint_bundle';
					}
					return MockProvider;
				}
				return null;
			} );

			const result = getEnabledInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toEqual( [ 'local-filesystem-static-site:1' ] );
		} );

		test( 'should handle empty provider configs', () => {
			const result = getEnabledInstancesForDeploymentType(
				{},
				'static_site'
			);

			expect( result ).toEqual( [] );
		} );

		test( 'should handle null/undefined provider configs', () => {
			const result1 = getEnabledInstancesForDeploymentType(
				null,
				'static_site'
			);
			const result2 = getEnabledInstancesForDeploymentType(
				undefined,
				'static_site'
			);

			expect( result1 ).toEqual( [] );
			expect( result2 ).toEqual( [] );
		} );

		test( 'should handle malformed provider configs', () => {
			const providerConfigs = {
				'local-filesystem-static-site:1': null,
				'local-filesystem-static-site:2': 'invalid',
				'local-filesystem-static-site:3': {
					// Missing provider_type
				},
				'local-filesystem-static-site:4': {
					provider_type: 'local-filesystem-static-site',
				},
			};

			class MockProvider {
				static DEPLOYMENT_TYPE = 'static_site';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = getEnabledInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			// Only provider-4 should be included
			expect( result ).toEqual( [ 'local-filesystem-static-site:4' ] );
		} );

		test( 'should handle error gracefully and return empty array', () => {
			// Force an error by passing something that will throw
			const badConfig = {
				get [ Symbol.iterator ]() {
					throw new Error( 'Iteration error' );
				},
			};

			const result = getEnabledInstancesForDeploymentType(
				badConfig,
				'static_site'
			);

			expect( result ).toEqual( [] );
		} );

		test( 'should handle multiple instances with same deployment type', () => {
			const providerConfigs = {
				'local-filesystem-static-site:1': {
					provider_type: 'local-filesystem-static-site',
				},
				'local-filesystem-static-site:2': {
					provider_type: 'local-filesystem-static-site',
				},
				'local-filesystem-static-site:3': {
					provider_type: 'local-filesystem-static-site',
				},
			};

			class MockProvider {
				static DEPLOYMENT_TYPE = 'static_site';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = getEnabledInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toHaveLength( 3 );
			expect( result ).toContain( 'local-filesystem-static-site:1' );
			expect( result ).toContain( 'local-filesystem-static-site:2' );
			expect( result ).toContain( 'local-filesystem-static-site:3' );
		} );
	} );

	describe( 'determineProvidersByDeploymentType()', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		test( 'should group providers by deployment type', () => {
			const providerConfigs = {
				'local-filesystem-static-site:1': {
					provider_type: 'local-filesystem-static-site',
				},
				'local-filesystem-static-site:2': {
					provider_type: 'local-filesystem-static-site',
				},
				'local-filesystem-blueprint-bundle:1': {
					provider_type: 'local-filesystem-blueprint-bundle',
				},
			};

			mockProviderRegistry.get.mockImplementation( ( providerType ) => {
				if ( providerType === 'local-filesystem-static-site' ) {
					class MockProvider {
						static DEPLOYMENT_TYPE = 'static_site';
					}
					return MockProvider;
				}
				if ( providerType === 'local-filesystem-blueprint-bundle' ) {
					class MockProvider {
						static DEPLOYMENT_TYPE = 'blueprint_bundle';
					}
					return MockProvider;
				}
				return null;
			} );

			const deploymentTypes = [ 'static_site', 'blueprint_bundle' ];

			const result = determineProvidersByDeploymentType(
				providerConfigs,
				deploymentTypes
			);

			expect( result ).toEqual( {
				static_site: [
					'local-filesystem-static-site:1',
					'local-filesystem-static-site:2',
				],
				blueprint_bundle: [ 'local-filesystem-blueprint-bundle:1' ],
			} );
		} );

		test( 'should handle empty deployment types array', () => {
			const providerConfigs = {
				'local-filesystem-static-site:1': {
					provider_type: 'local-filesystem-static-site',
				},
			};

			const result = determineProvidersByDeploymentType(
				providerConfigs,
				[]
			);

			expect( result ).toEqual( {} );
		} );

		test( 'should return empty arrays for deployment types with no providers', () => {
			const providerConfigs = {
				'local-filesystem-static-site:1': {
					provider_type: 'local-filesystem-static-site',
				},
			};

			class MockProvider {
				static DEPLOYMENT_TYPE = 'static_site';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const deploymentTypes = [ 'static_site', 'blueprint_bundle' ];

			const result = determineProvidersByDeploymentType(
				providerConfigs,
				deploymentTypes
			);

			expect( result ).toEqual( {
				static_site: [ 'local-filesystem-static-site:1' ],
				blueprint_bundle: [],
			} );
		} );

		test( 'should work with DEPLOYMENT_TYPES constants', () => {
			const providerConfigs = {
				'local-filesystem-static-site:1': {
					provider_type: 'local-filesystem-static-site',
				},
				'local-filesystem-blueprint-bundle:1': {
					provider_type: 'local-filesystem-blueprint-bundle',
				},
			};

			mockProviderRegistry.get.mockImplementation( ( providerType ) => {
				if ( providerType === 'local-filesystem-static-site' ) {
					return class {
						static DEPLOYMENT_TYPE =
							DEPLOYMENT_TYPES.STATIC_SITE;
					};
				}
				if ( providerType === 'local-filesystem-blueprint-bundle' ) {
					return class {
						static DEPLOYMENT_TYPE =
							DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE;
					};
				}
				return null;
			} );

			const deploymentTypes = [
				DEPLOYMENT_TYPES.STATIC_SITE,
				DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE,
			];

			const result = determineProvidersByDeploymentType(
				providerConfigs,
				deploymentTypes
			);

			expect( result[ DEPLOYMENT_TYPES.STATIC_SITE ] ).toEqual( [
				'local-filesystem-static-site:1',
			] );
			expect( result[ DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE ] ).toEqual( [
				'local-filesystem-blueprint-bundle:1',
			] );
		} );
	} );

	describe( 'buildWorkflowContext()', () => {
		test( 'should build complete workflow context', () => {
			const config = {
				siteUrl: 'https://example.com',
				staticSiteProviders: [ 'cloudflare:1', 'cloudflare:2' ],
				blueprintBundleProviders: [ 'local-filesystem:123' ],
				edgeFunctionProviders: [],
			};

			const mockApi = {};
			const mockProcessUrls = jest.fn();
			const mockGenerateBlueprint = jest.fn();
			const mockUpdateProgress = jest.fn();
			const mockAssetManager = {};
			const mockSetStatus = jest.fn();
			const mockSetProgress = jest.fn();

			const dependencies = {
				api: mockApi,
				processStaticSiteUrls: mockProcessUrls,
				generateBlueprintJson: mockGenerateBlueprint,
				updateStaticSiteProgressContext: mockUpdateProgress,
				assetManager: mockAssetManager,
				setStatusMessage: mockSetStatus,
				setStepProgress: mockSetProgress,
			};

			const result = buildWorkflowContext( config, dependencies );

			expect( result ).toEqual( {
				// API and state
				api: mockApi,
				siteUrl: 'https://example.com',

				// Provider arrays
				staticSiteProviders: [ 'cloudflare:1', 'cloudflare:2' ],
				blueprintBundleProviders: [ 'local-filesystem:123' ],
				edgeFunctionProviders: [],

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

				// Discovered assets
				discoveredAssets: null,
			} );
		} );

		test( 'should handle minimal config and dependencies', () => {
			const config = {
				siteUrl: 'https://example.com',
				staticSiteProviders: [],
				blueprintBundleProviders: [],
				edgeFunctionProviders: [],
			};

			const dependencies = {
				api: null,
				processStaticSiteUrls: null,
				generateBlueprintJson: null,
				updateStaticSiteProgressContext: null,
				assetManager: null,
				setStatusMessage: null,
				setStepProgress: null,
				handleSiteArchiveUpload: null,
			};

			const result = buildWorkflowContext( config, dependencies );

			expect( result ).toHaveProperty( 'siteUrl' );
			expect( result ).toHaveProperty( 'discoveredAssets' );
			expect( result.discoveredAssets ).toBeNull();
		} );
	} );
} );
