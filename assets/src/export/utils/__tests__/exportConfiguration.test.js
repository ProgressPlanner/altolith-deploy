/**
 * Export Configuration Tests
 *
 * Tests for exportConfiguration utilities.
 * Validates pure functions for workflow configuration.
 *
 */

import {
	prepareExportConfiguration,
	getValidProviderInstanceIds,
	getInstancesForOutputType,
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

// Mock outputTypes - new architecture with global settings
jest.mock( '../../../utils/outputTypes', () => ( {
	getOutputTypes: jest.fn( () => [
		{
			id: 'static_site',
			label: 'Static Site',
			fields: [],
		},
		{
			id: 'blueprint',
			label: 'Blueprint',
			fields: [
				{
					id: 'blueprint_subfolder',
					type: 'text',
					default: 'playground',
				},
			],
		},
	] ),
	getEnabledOutputTypes: jest.fn( () => [ 'static_site', 'blueprint' ] ),
} ) );

// Import the mocked modules
import ProviderRegistry from '../../../providers/registry/ProviderRegistry';
import { getEnabledOutputTypes } from '../../../utils/outputTypes';
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

	describe( 'getValidProviderInstanceIds()', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		test( 'should return all valid provider instances', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
				},
				'local-filesystem:2': {
					provider_type: 'local-filesystem',
				},
				'cloudflare:1': {
					provider_type: 'cloudflare',
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = getValidProviderInstanceIds( providerConfigs );

			expect( result ).toEqual( [
				'local-filesystem:1',
				'local-filesystem:2',
				'cloudflare:1',
			] );
		} );

		test( 'should filter out invalid instances', () => {
			const providerConfigs = {
				'local-filesystem:1': null,
				'local-filesystem:2': 'invalid',
				'local-filesystem:3': {
					// Missing provider_type
				},
				'local-filesystem:4': {
					provider_type: 'local-filesystem',
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			const result = getValidProviderInstanceIds( providerConfigs );

			expect( result ).toEqual( [ 'local-filesystem:4' ] );
		} );

		test( 'should filter out instances with unregistered provider types', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
				},
				'unknown:1': {
					provider_type: 'unknown',
				},
			};

			// Mock to return provider only for local-filesystem
			mockProviderRegistry.get.mockImplementation( ( type ) => {
				if ( type === 'local-filesystem' ) {
					return class MockProvider {};
				}
				return null;
			} );

			const result = getValidProviderInstanceIds( providerConfigs );

			expect( result ).toEqual( [ 'local-filesystem:1' ] );
		} );

		test( 'should handle empty provider configs', () => {
			const result = getValidProviderInstanceIds( {} );

			expect( result ).toEqual( [] );
		} );

		test( 'should handle null/undefined provider configs', () => {
			const result1 = getValidProviderInstanceIds( null );
			const result2 = getValidProviderInstanceIds( undefined );

			expect( result1 ).toEqual( [] );
			expect( result2 ).toEqual( [] );
		} );
	} );

	describe( 'getInstancesForOutputType()', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		test( 'should return all valid instances when output type is enabled globally', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
				},
				'local-filesystem:2': {
					provider_type: 'local-filesystem',
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			// Mock static_site as enabled
			getEnabledOutputTypes.mockReturnValue( [ 'static_site' ] );

			const result = getInstancesForOutputType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toEqual( [
				'local-filesystem:1',
				'local-filesystem:2',
			] );
		} );

		test( 'should return empty array when output type is not enabled globally', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			// Mock blueprint as NOT enabled
			getEnabledOutputTypes.mockReturnValue( [ 'static_site' ] );

			const result = getInstancesForOutputType(
				providerConfigs,
				'blueprint'
			);

			expect( result ).toEqual( [] );
		} );

		test( 'should handle empty provider configs', () => {
			getEnabledOutputTypes.mockReturnValue( [ 'static_site' ] );

			const result = getInstancesForOutputType( {}, 'static_site' );

			expect( result ).toEqual( [] );
		} );
	} );

	describe( 'determineProvidersByOutputType()', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		test( 'should return all valid instances for each enabled output type', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
				},
				'local-filesystem:2': {
					provider_type: 'local-filesystem',
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			// Both types enabled
			getEnabledOutputTypes.mockReturnValue( [
				'static_site',
				'blueprint',
			] );

			const result = determineProvidersByOutputType( providerConfigs );

			// All valid instances for each enabled output type
			expect( result ).toEqual( {
				static_site: [ 'local-filesystem:1', 'local-filesystem:2' ],
				blueprint: [ 'local-filesystem:1', 'local-filesystem:2' ],
			} );
		} );

		test( 'should return empty array for disabled output types', () => {
			const providerConfigs = {
				'local-filesystem:1': {
					provider_type: 'local-filesystem',
				},
			};

			class MockProvider {
				static ID = 'local-filesystem';
			}
			mockProviderRegistry.get.mockReturnValue( MockProvider );

			// Only static_site enabled
			getEnabledOutputTypes.mockReturnValue( [ 'static_site' ] );

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
