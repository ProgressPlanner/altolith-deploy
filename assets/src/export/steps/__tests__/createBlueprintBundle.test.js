/**
 * Create Blueprint Bundle Step Tests
 *
 * Tests for the prepare blueprint files step that:
 * 1. Generates blueprint JSON with URL-based resources
 * 2. Exports core content (database, uploads, mu-plugins)
 * 3. Exports custom plugins as individual zips
 * 4. Exports custom themes as individual zips
 *
 * Files are NOT bundled - they're returned as individual paths for the deploy step.
 */

// Mock WordPress hooks
const mockAddAction = jest.fn();
const mockApplyFilters = jest.fn( ( hookName, value ) => value );
jest.mock( '@wordpress/hooks', () => ( {
	addAction: ( ...args ) => mockAddAction( ...args ),
	applyFilters: ( ...args ) => mockApplyFilters( ...args ),
} ) );

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => {
		let result = format;
		args.forEach( ( arg ) => {
			result = result.replace( /%[sd]/, arg );
		} );
		return result;
	},
	_n: ( singular, plural, count ) => ( count === 1 ? singular : plural ),
} ) );

// Mock outputTypes - global settings architecture
jest.mock( '@altolith/utils/outputTypes', () => ( {
	getEnabledOutputTypes: jest.fn( () => [ 'static_site', 'blueprint' ] ),
} ) );

// Import the mocked module
const { getEnabledOutputTypes } = require( '@altolith/utils/outputTypes' );

// Import after mocks are set up
let stepDefinition;
let handler;

/**
 * Helper to create a basic mock API
 * @param overrides
 */
function createMockApi( overrides = {} ) {
	return {
		exportCoreContent: jest.fn().mockResolvedValue( {
			success: true,
			zipPath: '/tmp/wp-content.zip',
			zipSize: 52428800, // 50 MB
		} ),
		exportPlugin: jest.fn().mockResolvedValue( {
			success: true,
			zipPath: '/tmp/plugin.zip',
		} ),
		exportTheme: jest.fn().mockResolvedValue( {
			success: true,
			zipPath: '/tmp/theme.zip',
		} ),
		...overrides,
	};
}

/**
 * Helper to create a mock blueprint generator
 * @param overrides
 */
function createMockBlueprintGenerator( overrides = {} ) {
	return jest.fn().mockResolvedValue( {
		blueprint: {
			landingPage: '/',
			steps: [
				{
					step: 'installPlugin',
					pluginData: { url: '{targetUrl}/playground/plugin.zip' },
				},
			],
		},
		customPlugins: [ 'my-plugin' ],
		customThemes: [ 'my-theme' ],
		...overrides,
	} );
}

describe( 'createBlueprintBundle step', () => {
	beforeAll( () => {
		// Import the module to trigger addAction
		require( '../createBlueprintBundle' );

		// Extract the step definition from the mock call
		const registerCall = mockAddAction.mock.calls.find(
			( call ) => call[ 0 ] === 'altolith.export.register_steps'
		);
		expect( registerCall ).toBeDefined();

		// Call the callback with a mock registry to get the step definition
		const mockRegistry = {
			register: jest.fn(),
		};
		registerCall[ 2 ]( mockRegistry );
		stepDefinition = mockRegistry.register.mock.calls[ 0 ][ 0 ];
		handler = stepDefinition.handler;
	} );

	beforeEach( () => {
		jest.clearAllMocks();
		// Reset to default - blueprint enabled
		getEnabledOutputTypes.mockReturnValue( [ 'static_site', 'blueprint' ] );
	} );

	describe( 'step registration', () => {
		test( 'should register with correct id', () => {
			expect( stepDefinition.id ).toBe( 'createBlueprintBundle' );
		} );

		test( 'should have descriptive label', () => {
			expect( stepDefinition.label ).toBe( 'Prepare Blueprint Files' );
		} );

		test( 'should have no dependencies', () => {
			expect( stepDefinition.dependencies ).toEqual( [] );
		} );

		test( 'should require api from initial context', () => {
			expect( stepDefinition.requires.api ).toBe( true );
		} );

		test( 'should require generateBlueprintJson from initial context', () => {
			expect( stepDefinition.requires.generateBlueprintJson ).toBe(
				true
			);
		} );

		test( 'should require setStatusMessage from initial context', () => {
			expect( stepDefinition.requires.setStatusMessage ).toBe( true );
		} );

		test( 'should provide coreContentZipPath with global scope', () => {
			expect( stepDefinition.provides.coreContentZipPath.type ).toBe(
				'string'
			);
			expect( stepDefinition.provides.coreContentZipPath.scope ).toBe(
				'global'
			);
		} );

		test( 'should provide blueprintData with global scope', () => {
			expect( stepDefinition.provides.blueprintData.type ).toBe(
				'object'
			);
			expect( stepDefinition.provides.blueprintData.scope ).toBe(
				'global'
			);
		} );

		test( 'should provide pluginZips with global scope', () => {
			expect( stepDefinition.provides.pluginZips.type ).toBe( 'object' );
			expect( stepDefinition.provides.pluginZips.scope ).toBe( 'global' );
		} );

		test( 'should provide themeZips with global scope', () => {
			expect( stepDefinition.provides.themeZips.type ).toBe( 'object' );
			expect( stepDefinition.provides.themeZips.scope ).toBe( 'global' );
		} );
	} );

	describe( 'handler - blueprint disabled', () => {
		test( 'should return empty result when blueprint not enabled', async () => {
			getEnabledOutputTypes.mockReturnValue( [ 'static_site' ] );

			const context = {
				api: createMockApi(),
				generateBlueprintJson: createMockBlueprintGenerator(),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await handler( context );

			expect( result.coreContentZipPath ).toBeNull();
			expect( result.blueprintData ).toBeNull();
			expect( result.pluginZips ).toEqual( {} );
			expect( result.themeZips ).toEqual( {} );
			expect( context.api.exportCoreContent ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'handler - blueprint generation', () => {
		test( 'should call generateBlueprintJson with baseUrl and subfolder', async () => {
			const mockGenerator = createMockBlueprintGenerator();
			const context = {
				api: createMockApi(),
				generateBlueprintJson: mockGenerator,
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await handler( context );

			expect( mockGenerator ).toHaveBeenCalledWith(
				{ baseUrl: '{targetUrl}', subfolder: 'playground' },
				context.setStatusMessage
			);
		} );

		test( 'should throw error when generateBlueprintJson is not a function', async () => {
			const context = {
				api: createMockApi(),
				generateBlueprintJson: 'not a function',
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await expect( handler( context ) ).rejects.toThrow(
				'Blueprint generator function is required'
			);
		} );
	} );

	describe( 'handler - core content export', () => {
		test( 'should call api.exportCoreContent', async () => {
			const mockApi = createMockApi();
			const context = {
				api: mockApi,
				generateBlueprintJson: createMockBlueprintGenerator(),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await handler( context );

			expect( mockApi.exportCoreContent ).toHaveBeenCalled();
		} );

		test( 'should throw error when core content export fails', async () => {
			const mockApi = createMockApi( {
				exportCoreContent: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Export failed',
				} ),
			} );

			const context = {
				api: mockApi,
				generateBlueprintJson: createMockBlueprintGenerator(),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await expect( handler( context ) ).rejects.toThrow(
				'Export failed'
			);
		} );
	} );

	describe( 'handler - plugin/theme export', () => {
		test( 'should export custom plugins', async () => {
			const mockApi = createMockApi();
			const context = {
				api: mockApi,
				generateBlueprintJson: createMockBlueprintGenerator( {
					customPlugins: [ 'plugin-a', 'plugin-b' ],
					customThemes: [],
				} ),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await handler( context );

			expect( mockApi.exportPlugin ).toHaveBeenCalledTimes( 2 );
			expect( mockApi.exportPlugin ).toHaveBeenCalledWith( 'plugin-a' );
			expect( mockApi.exportPlugin ).toHaveBeenCalledWith( 'plugin-b' );
		} );

		test( 'should export custom themes', async () => {
			const mockApi = createMockApi();
			const context = {
				api: mockApi,
				generateBlueprintJson: createMockBlueprintGenerator( {
					customPlugins: [],
					customThemes: [ 'theme-a', 'theme-b' ],
				} ),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await handler( context );

			expect( mockApi.exportTheme ).toHaveBeenCalledTimes( 2 );
			expect( mockApi.exportTheme ).toHaveBeenCalledWith( 'theme-a' );
			expect( mockApi.exportTheme ).toHaveBeenCalledWith( 'theme-b' );
		} );

		test( 'should continue when plugin export fails (log warning)', async () => {
			const consoleSpy = jest
				.spyOn( console, 'warn' )
				.mockImplementation( () => {} );
			const mockApi = createMockApi( {
				exportPlugin: jest.fn().mockResolvedValue( {
					success: false,
					message: 'Plugin not found',
				} ),
			} );

			const context = {
				api: mockApi,
				generateBlueprintJson: createMockBlueprintGenerator( {
					customPlugins: [ 'missing-plugin' ],
					customThemes: [],
				} ),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			// Should not throw
			const result = await handler( context );
			expect( result.pluginZips ).toEqual( {} );
			expect( consoleSpy ).toHaveBeenCalled();

			consoleSpy.mockRestore();
		} );
	} );

	describe( 'handler - return value', () => {
		test( 'should return all expected fields', async () => {
			const mockApi = createMockApi();
			const context = {
				api: mockApi,
				generateBlueprintJson: createMockBlueprintGenerator(),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await handler( context );

			expect( result ).toHaveProperty( 'coreContentZipPath' );
			expect( result ).toHaveProperty( 'coreContentZipSize' );
			expect( result ).toHaveProperty( 'pluginZips' );
			expect( result ).toHaveProperty( 'themeZips' );
			expect( result ).toHaveProperty( 'blueprintData' );
			expect( result ).toHaveProperty( 'customPlugins' );
			expect( result ).toHaveProperty( 'customThemes' );
			expect( result ).toHaveProperty( 'blueprintSubfolder' );
		} );

		test( 'should return plugin zips keyed by slug', async () => {
			const mockApi = createMockApi( {
				exportPlugin: jest.fn().mockResolvedValue( {
					success: true,
					zipPath: '/tmp/my-plugin.zip',
				} ),
			} );

			const context = {
				api: mockApi,
				generateBlueprintJson: createMockBlueprintGenerator( {
					customPlugins: [ 'my-plugin' ],
					customThemes: [],
				} ),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await handler( context );

			expect( result.pluginZips ).toEqual( {
				'my-plugin': '/tmp/my-plugin.zip',
			} );
		} );
	} );

	describe( 'handler - progress updates', () => {
		test( 'should update step progress with asset counts', async () => {
			const mockSetStepProgress = jest.fn();
			const context = {
				api: createMockApi(),
				generateBlueprintJson: createMockBlueprintGenerator( {
					customPlugins: [ 'p1', 'p2' ],
					customThemes: [ 't1' ],
				} ),
				setStatusMessage: jest.fn(),
				setStepProgress: mockSetStepProgress,
			};

			await handler( context );

			expect( mockSetStepProgress ).toHaveBeenCalledWith(
				'createBlueprintBundle',
				{
					current: 1,
					total: 1,
					statusData: {
						customPlugins: 2,
						customThemes: 1,
					},
				}
			);
		} );
	} );

	describe( 'handler - applyFilters', () => {
		test( 'should apply filter for blueprint data', async () => {
			const context = {
				api: createMockApi(),
				generateBlueprintJson: createMockBlueprintGenerator(),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await handler( context );

			expect( mockApplyFilters ).toHaveBeenCalledWith(
				'altolith.export.step.createBlueprintBundle.blueprintData',
				expect.any( Object ),
				context
			);
		} );
	} );

	describe( 'status labels', () => {
		test( 'should have pending label', () => {
			expect( stepDefinition.statusLabels.pending ).toBe(
				'Prepare blueprint files'
			);
		} );

		test( 'should have running label function', () => {
			expect( typeof stepDefinition.statusLabels.running ).toBe(
				'function'
			);
			const label = stepDefinition.statusLabels.running();
			expect( label ).toContain( 'Preparing' );
		} );

		test( 'should have complete label function', () => {
			expect( typeof stepDefinition.statusLabels.complete ).toBe(
				'function'
			);
		} );

		test( 'complete label should show asset info when available', () => {
			const label = stepDefinition.statusLabels.complete( {
				customPlugins: 2,
				customThemes: 1,
			} );
			expect( label ).toContain( 'Blueprint files prepared' );
			expect( label ).toContain( '2 custom plugins' );
			expect( label ).toContain( '1 custom theme' );
		} );

		test( 'complete label should work without asset info', () => {
			const label = stepDefinition.statusLabels.complete( {} );
			expect( label ).toBe( 'Blueprint files prepared' );
		} );
	} );
} );
