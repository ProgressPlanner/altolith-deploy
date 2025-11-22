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

// Mock debug utilities
jest.mock( '../../../utils/debug', () => ( {
	debugError: jest.fn(),
} ) );

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
						'local-filesystem:123': { enabled: true },
						'cloudflare:456': { enabled: true },
					},
				},
			};

			const result = prepareExportConfiguration( settingsResponse );

			expect( result ).toEqual( {
				storageProviderId: 'local-filesystem:123',
				staticSiteProviderId: 'cloudflare:456',
				providerConfigs: {
					'local-filesystem:123': { enabled: true },
					'cloudflare:456': { enabled: true },
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
		test( 'should return enabled instances for deployment type', () => {
			const providerConfigs = {
				'provider-1': {
					enabled: true,
					deployment_types: [ 'static_site', 'blueprint-bundle' ],
				},
				'provider-2': {
					enabled: true,
					deployment_types: [ 'static_site' ],
				},
				'provider-3': {
					enabled: true,
					deployment_types: [ 'blueprint-bundle' ],
				},
			};

			const result = getEnabledInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toEqual( [ 'provider-1', 'provider-2' ] );
		} );

		test( 'should filter out disabled instances', () => {
			const providerConfigs = {
				'provider-1': {
					enabled: true,
					deployment_types: [ 'static_site' ],
				},
				'provider-2': {
					enabled: false,
					deployment_types: [ 'static_site' ],
				},
				'provider-3': {
					deployment_types: [ 'static_site' ],
					// enabled not specified - defaults to true
				},
			};

			const result = getEnabledInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toEqual( [ 'provider-1', 'provider-3' ] );
		} );

		test( 'should filter out instances that do not support deployment type', () => {
			const providerConfigs = {
				'provider-1': {
					enabled: true,
					deployment_types: [ 'static_site' ],
				},
				'provider-2': {
					enabled: true,
					deployment_types: [ 'blueprint-bundle' ],
				},
				'provider-3': {
					enabled: true,
					deployment_types: [],
				},
			};

			const result = getEnabledInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toEqual( [ 'provider-1' ] );
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
				'provider-1': null,
				'provider-2': 'invalid',
				'provider-3': {
					enabled: true,
					deployment_types: 'not-an-array',
				},
				'provider-4': {
					enabled: true,
					deployment_types: [ 'static_site' ],
				},
			};

			const result = getEnabledInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			// Only provider-4 should be included
			expect( result ).toEqual( [ 'provider-4' ] );
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

		test( 'should default enabled to true when not specified', () => {
			const providerConfigs = {
				'provider-1': {
					deployment_types: [ 'static_site' ],
					// No 'enabled' field
				},
			};

			const result = getEnabledInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toEqual( [ 'provider-1' ] );
		} );

		test( 'should handle multiple instances with same deployment type', () => {
			const providerConfigs = {
				'cloudflare:1': {
					enabled: true,
					deployment_types: [ 'static_site' ],
				},
				'cloudflare:2': {
					enabled: true,
					deployment_types: [ 'static_site' ],
				},
				'cloudflare:3': {
					enabled: true,
					deployment_types: [ 'static_site' ],
				},
			};

			const result = getEnabledInstancesForDeploymentType(
				providerConfigs,
				'static_site'
			);

			expect( result ).toHaveLength( 3 );
			expect( result ).toContain( 'cloudflare:1' );
			expect( result ).toContain( 'cloudflare:2' );
			expect( result ).toContain( 'cloudflare:3' );
		} );
	} );

	describe( 'determineProvidersByDeploymentType()', () => {
		test( 'should group providers by deployment type', () => {
			const providerConfigs = {
				'provider-1': {
					enabled: true,
					deployment_types: [ 'static_site', 'blueprint-bundle' ],
				},
				'provider-2': {
					enabled: true,
					deployment_types: [ 'static_site' ],
				},
				'provider-3': {
					enabled: true,
					deployment_types: [ 'edge-functions' ],
				},
			};

			const deploymentTypes = [
				'static_site',
				'blueprint-bundle',
				'edge-functions',
			];

			const result = determineProvidersByDeploymentType(
				providerConfigs,
				deploymentTypes
			);

			expect( result ).toEqual( {
				static_site: [ 'provider-1', 'provider-2' ],
				'blueprint-bundle': [ 'provider-1' ],
				'edge-functions': [ 'provider-3' ],
			} );
		} );

		test( 'should handle empty deployment types array', () => {
			const providerConfigs = {
				'provider-1': {
					enabled: true,
					deployment_types: [ 'static_site' ],
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
				'provider-1': {
					enabled: true,
					deployment_types: [ 'static_site' ],
				},
			};

			const deploymentTypes = [ 'static_site', 'blueprint-bundle' ];

			const result = determineProvidersByDeploymentType(
				providerConfigs,
				deploymentTypes
			);

			expect( result ).toEqual( {
				static_site: [ 'provider-1' ],
				'blueprint-bundle': [],
			} );
		} );

		test( 'should work with DEPLOYMENT_TYPES constants', () => {
			const providerConfigs = {
				'provider-1': {
					enabled: true,
					deployment_types: [ DEPLOYMENT_TYPES.STATIC_SITE ],
				},
				'provider-2': {
					enabled: true,
					deployment_types: [ DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE ],
				},
			};

			const deploymentTypes = [
				DEPLOYMENT_TYPES.STATIC_SITE,
				DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE,
			];

			const result = determineProvidersByDeploymentType(
				providerConfigs,
				deploymentTypes
			);

			expect( result[ DEPLOYMENT_TYPES.STATIC_SITE ] ).toEqual( [
				'provider-1',
			] );
			expect( result[ DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE ] ).toEqual( [
				'provider-2',
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

			// New fields: providerIds and jobId are added
			// providerIds combines all provider arrays
			expect( result.providerIds ).toEqual( [
				'cloudflare:1',
				'cloudflare:2',
				'local-filesystem:123',
			] );
			// JobId now uses UUID v4 format (8-4-4-4-12 hex digits)
			expect( result.jobId ).toMatch(
				/^export-job-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
			);

			// Check all other expected fields
			expect( result ).toMatchObject( {
				// API and state
				api: mockApi,
				siteUrl: 'https://example.com',

				// Provider arrays (kept for backward compatibility)
				staticSiteProviders: [ 'cloudflare:1', 'cloudflare:2' ],
				blueprintBundleProviders: [ 'local-filesystem:123' ],
				edgeFunctionProviders: [],

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
