/**
 * Gather Files to Deploy Step Tests
 *
 * Tests for the gatherFilesToDeploy step that collects files
 * from discoverAndScanSite and prepareBlueprint steps.
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
} ) );

// Mock outputTypes
jest.mock( '@altolith/utils/outputTypes', () => ( {
	getEnabledOutputTypes: jest.fn( () => [ 'static_site', 'blueprint' ] ),
} ) );

// Import the mocked module
const { getEnabledOutputTypes } = require( '@altolith/utils/outputTypes' );

let stepDefinition;
let handler;

describe( 'gatherFilesToDeploy step', () => {
	beforeAll( () => {
		// Import the module to trigger addAction
		require( '../index' );

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
		// Reset to default - both types enabled
		getEnabledOutputTypes.mockReturnValue( [ 'static_site', 'blueprint' ] );
	} );

	describe( 'step registration', () => {
		test( 'should register with correct id', () => {
			expect( stepDefinition.id ).toBe( 'gatherFilesToDeploy' );
		} );

		test( 'should have descriptive label', () => {
			expect( stepDefinition.label ).toBe( 'Gather Files' );
		} );

		test( 'should depend on discoverAndScanSite and prepareBlueprint', () => {
			expect( stepDefinition.dependencies ).toContain(
				'discoverAndScanSite'
			);
			expect( stepDefinition.dependencies ).toContain(
				'prepareBlueprint'
			);
		} );

		test( 'should provide filesToDeploy with global scope', () => {
			expect( stepDefinition.provides.filesToDeploy.type ).toBe(
				'object'
			);
			expect( stepDefinition.provides.filesToDeploy.scope ).toBe(
				'global'
			);
		} );

		test( 'should require siteUrl from initial context', () => {
			expect( stepDefinition.requires.siteUrl ).toBe( true );
		} );

		test( 'should have optional requirements from previous steps', () => {
			expect( stepDefinition.requires.urls.optional ).toBe( true );
			expect( stepDefinition.requires.htmlDataMap.optional ).toBe( true );
			expect( stepDefinition.requires.blueprintFiles.optional ).toBe(
				true
			);
			expect( stepDefinition.requires.blueprintJson.optional ).toBe(
				true
			);
		} );
	} );

	describe( 'handler - static site files', () => {
		test( 'should gather static site files when enabled', async () => {
			getEnabledOutputTypes.mockReturnValue( [ 'static_site' ] );

			const htmlDataMap = new Map();
			htmlDataMap.set(
				'https://example.com/',
				'<html><body>Home</body></html>'
			);
			htmlDataMap.set(
				'https://example.com/about/',
				'<html><body>About</body></html>'
			);

			const context = {
				siteUrl: 'https://example.com',
				urls: [ 'https://example.com/', 'https://example.com/about/' ],
				htmlDataMap,
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await handler( context );

			expect( 'index.html' in result.filesToDeploy.staticSite ).toBe(
				true
			);
			expect(
				'about/index.html' in result.filesToDeploy.staticSite
			).toBe( true );
			expect( result.filesToDeploy.staticSite[ 'index.html' ].type ).toBe(
				'static'
			);
		} );

		test( 'should not gather static files when disabled', async () => {
			getEnabledOutputTypes.mockReturnValue( [ 'blueprint' ] );

			const context = {
				siteUrl: 'https://example.com',
				urls: [ 'https://example.com/' ],
				htmlDataMap: new Map(),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await handler( context );

			expect( result.filesToDeploy.staticSite ).toEqual( {} );
		} );
	} );

	describe( 'handler - blueprint files', () => {
		test( 'should gather blueprint files when enabled', async () => {
			getEnabledOutputTypes.mockReturnValue( [ 'blueprint' ] );

			const context = {
				siteUrl: 'https://example.com',
				blueprintJson: { steps: [] },
				blueprintFiles: {
					'wp-content.zip': {
						sourcePath: '/tmp/wp-content.zip',
						size: 1024,
						type: 'core',
					},
					'plugins/my-plugin.zip': {
						sourcePath: '/tmp/my-plugin.zip',
						type: 'plugin',
						slug: 'my-plugin',
					},
					'themes/my-theme.zip': {
						sourcePath: '/tmp/my-theme.zip',
						type: 'theme',
						slug: 'my-theme',
					},
				},
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await handler( context );
			const blueprint = result.filesToDeploy.blueprint;

			expect( 'playground/blueprint.json' in blueprint ).toBe( true );
			expect( 'playground/wp-content.zip' in blueprint ).toBe( true );
			expect( 'playground/plugins/my-plugin.zip' in blueprint ).toBe(
				true
			);
			expect( 'playground/themes/my-theme.zip' in blueprint ).toBe(
				true
			);
		} );

		test( 'should not gather blueprint files when disabled', async () => {
			getEnabledOutputTypes.mockReturnValue( [ 'static_site' ] );

			const context = {
				siteUrl: 'https://example.com',
				blueprintJson: { steps: [] },
				blueprintFiles: {
					'wp-content.zip': {
						sourcePath: '/tmp/wp-content.zip',
						type: 'core',
					},
				},
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await handler( context );

			expect( result.filesToDeploy.blueprint ).toEqual( {} );
		} );

		test( 'should use correct file types for blueprint files', async () => {
			getEnabledOutputTypes.mockReturnValue( [ 'blueprint' ] );

			const context = {
				siteUrl: 'https://example.com',
				blueprintJson: { steps: [] },
				blueprintFiles: {
					'wp-content.zip': {
						sourcePath: '/tmp/wp-content.zip',
						type: 'core',
					},
					'plugins/plugin.zip': {
						sourcePath: '/tmp/plugin.zip',
						type: 'plugin',
						slug: 'plugin',
					},
					'themes/theme.zip': {
						sourcePath: '/tmp/theme.zip',
						type: 'theme',
						slug: 'theme',
					},
				},
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await handler( context );

			expect(
				result.filesToDeploy.blueprint[ 'playground/blueprint.json' ]
					.type
			).toBe( 'blueprint-json' );
			expect(
				result.filesToDeploy.blueprint[ 'playground/wp-content.zip' ]
					.type
			).toBe( 'blueprint-archive' );
			expect(
				result.filesToDeploy.blueprint[
					'playground/plugins/plugin.zip'
				].type
			).toBe( 'blueprint-plugin' );
			expect(
				result.filesToDeploy.blueprint[ 'playground/themes/theme.zip' ]
					.type
			).toBe( 'blueprint-theme' );
		} );
	} );

	describe( 'handler - both output types', () => {
		test( 'should gather both static and blueprint files', async () => {
			getEnabledOutputTypes.mockReturnValue( [
				'static_site',
				'blueprint',
			] );

			const htmlDataMap = new Map();
			htmlDataMap.set(
				'https://example.com/',
				'<html><body>Home</body></html>'
			);

			const context = {
				siteUrl: 'https://example.com',
				urls: [ 'https://example.com/' ],
				htmlDataMap,
				blueprintJson: { steps: [] },
				blueprintFiles: {
					'wp-content.zip': {
						sourcePath: '/tmp/wp-content.zip',
						type: 'core',
					},
				},
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			const result = await handler( context );

			expect(
				Object.keys( result.filesToDeploy.staticSite ).length
			).toBeGreaterThan( 0 );
			expect(
				Object.keys( result.filesToDeploy.blueprint ).length
			).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'handler - filter application', () => {
		test( 'should apply filesToDeploy filter', async () => {
			const context = {
				siteUrl: 'https://example.com',
				urls: [ 'https://example.com/' ],
				htmlDataMap: new Map(),
				setStatusMessage: jest.fn(),
				setStepProgress: jest.fn(),
			};

			await handler( context );

			expect( mockApplyFilters ).toHaveBeenCalledWith(
				'altolith.export.filesToDeploy',
				expect.any( Object ),
				context
			);
		} );
	} );

	describe( 'handler - progress updates', () => {
		test( 'should update step progress with file counts', async () => {
			const htmlDataMap = new Map();
			htmlDataMap.set(
				'https://example.com/',
				'<html><body>Home</body></html>'
			);
			htmlDataMap.set(
				'https://example.com/about/',
				'<html><body>About</body></html>'
			);

			const mockSetStepProgress = jest.fn();
			const context = {
				siteUrl: 'https://example.com',
				urls: [ 'https://example.com/', 'https://example.com/about/' ],
				htmlDataMap,
				blueprintJson: { steps: [] },
				blueprintFiles: {
					'wp-content.zip': {
						sourcePath: '/tmp/wp-content.zip',
						type: 'core',
					},
				},
				setStatusMessage: jest.fn(),
				setStepProgress: mockSetStepProgress,
			};

			await handler( context );

			expect( mockSetStepProgress ).toHaveBeenCalledWith(
				'gatherFilesToDeploy',
				expect.objectContaining( {
					statusData: expect.objectContaining( {
						staticFileCount: 2,
						blueprintFileCount: 2, // blueprint.json + wp-content.zip
					} ),
				} )
			);
		} );
	} );

	describe( 'status labels', () => {
		test( 'should have pending label', () => {
			expect( stepDefinition.statusLabels.pending ).toBe(
				'Gather files'
			);
		} );

		test( 'should have running label function', () => {
			expect( typeof stepDefinition.statusLabels.running ).toBe(
				'function'
			);
			const label = stepDefinition.statusLabels.running();
			expect( label ).toContain( 'Gathering' );
		} );

		test( 'should have complete label function', () => {
			expect( typeof stepDefinition.statusLabels.complete ).toBe(
				'function'
			);
		} );

		test( 'complete label should show file counts', () => {
			const label = stepDefinition.statusLabels.complete( {
				staticFileCount: 10,
				blueprintFileCount: 5,
			} );
			expect( label ).toContain( '10' );
			expect( label ).toContain( '5' );
		} );

		test( 'complete label should handle no files', () => {
			const label = stepDefinition.statusLabels.complete( {} );
			expect( label ).toContain( 'No files' );
		} );
	} );
} );
