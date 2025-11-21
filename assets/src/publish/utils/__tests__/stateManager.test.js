/**
 * State Manager Tests
 *
 * Tests for stateManager utility with IndexedDB persistence.
 *
 * @package
 */

import {
	createStateManager,
	saveExecutionContext,
	restoreExecutionContext,
} from '../stateManager';

// Mock IndexedDB store
const mockIndexedDBStore = {
	get: jest.fn(),
	set: jest.fn(),
	delete: jest.fn(),
	clear: jest.fn(),
	getByIndex: jest.fn(),
	getAll: jest.fn(),
};

jest.mock( '../../../utils/indexedDB', () => {
	return {
		__esModule: true,
		default: jest.fn( () => mockIndexedDBStore ),
		isIndexedDBAvailable: jest.fn( () => true ),
	};
} );

describe( 'stateManager', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIndexedDBStore.get.mockResolvedValue( null );
		mockIndexedDBStore.set.mockResolvedValue( true );
		mockIndexedDBStore.delete.mockResolvedValue( true );
		mockIndexedDBStore.getByIndex.mockResolvedValue( [] );
	} );

	describe( 'createStateManager()', () => {
		test( 'should create state manager instance', () => {
			const manager = createStateManager( 'workflow-1' );

			expect( manager ).toBeDefined();
			expect( manager.save ).toBeDefined();
			expect( manager.load ).toBeDefined();
			expect( manager.clear ).toBeDefined();
			expect( manager.list ).toBeDefined();
		} );
	} );

	describe( 'save() and load()', () => {
		test( 'should save and load state', async () => {
			const manager = createStateManager( 'workflow-1' );
			const state = {
				completedSteps: [ 'step1' ],
				state: { result: 'test' },
			};

			// Mock get to return saved state
			mockIndexedDBStore.get.mockResolvedValue( {
				stateKey: 'workflow-1',
				workflowId: 'workflow-1',
				providerInstance: null,
				state,
				timestamp: Date.now(),
			} );

			await manager.save( state );
			const loaded = await manager.load();

			expect( mockIndexedDBStore.set ).toHaveBeenCalled();
			expect( loaded ).toEqual( state );
		} );

		test( 'should handle provider instance isolation', async () => {
			const manager = createStateManager( 'workflow-1' );
			const state1 = { provider: 'provider1' };
			const state2 = { provider: 'provider2' };

			await manager.save( state1, 'provider1' );
			await manager.save( state2, 'provider2' );

			// Mock get to return different states based on key
			mockIndexedDBStore.get
				.mockResolvedValueOnce( {
					stateKey: 'workflow-1::provider1',
					workflowId: 'workflow-1',
					providerInstance: 'provider1',
					state: state1,
					timestamp: Date.now(),
				} )
				.mockResolvedValueOnce( {
					stateKey: 'workflow-1::provider2',
					workflowId: 'workflow-1',
					providerInstance: 'provider2',
					state: state2,
					timestamp: Date.now(),
				} );

			const loaded1 = await manager.load( 'provider1' );
			const loaded2 = await manager.load( 'provider2' );

			expect( loaded1 ).toEqual( state1 );
			expect( loaded2 ).toEqual( state2 );
		} );

		test( 'should return null for non-existent state', async () => {
			mockIndexedDBStore.get.mockResolvedValue( null );

			const manager = createStateManager( 'workflow-1' );
			const loaded = await manager.load();

			expect( loaded ).toBeNull();
		} );
	} );

	describe( 'clear()', () => {
		test( 'should clear state for workflow', async () => {
			const manager = createStateManager( 'workflow-1' );
			await manager.save( { test: 'data' } );

			// Mock getByIndex to return the state we saved (for clear all)
			mockIndexedDBStore.getByIndex.mockResolvedValue( [
				{ stateKey: 'workflow-1' },
			] );
			// Mock get to return null after clear
			mockIndexedDBStore.get.mockResolvedValue( null );

			await manager.clear();
			const loaded = await manager.load();

			expect( mockIndexedDBStore.delete ).toHaveBeenCalledWith(
				'workflow-1'
			);
			expect( loaded ).toBeNull();
		} );

		test( 'should clear specific provider instance', async () => {
			const manager = createStateManager( 'workflow-1' );
			await manager.save( { provider: 'provider1' }, 'provider1' );
			await manager.save( { provider: 'provider2' }, 'provider2' );

			// Mock get to return null after clear
			mockIndexedDBStore.get.mockResolvedValue( null );

			await manager.clear( 'provider1' );

			expect( mockIndexedDBStore.delete ).toHaveBeenCalledWith(
				'workflow-1::provider1'
			);
		} );

		test( 'should clear all states for workflow when no provider specified', async () => {
			const manager = createStateManager( 'workflow-1' );
			mockIndexedDBStore.getByIndex.mockResolvedValue( [
				{ stateKey: 'workflow-1::provider1' },
				{ stateKey: 'workflow-1::provider2' },
			] );

			await manager.clear();

			expect( mockIndexedDBStore.getByIndex ).toHaveBeenCalledWith(
				'workflowId',
				'workflow-1'
			);
			expect( mockIndexedDBStore.delete ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'list()', () => {
		test( 'should list all states for workflow', async () => {
			const manager = createStateManager( 'workflow-1' );
			const states = [
				{
					stateKey: 'workflow-1::provider1',
					providerInstance: 'provider1',
					timestamp: Date.now(),
				},
				{
					stateKey: 'workflow-1::provider2',
					providerInstance: 'provider2',
					timestamp: Date.now(),
				},
			];

			mockIndexedDBStore.getByIndex.mockResolvedValue( states );

			const listed = await manager.list();

			expect( listed ).toEqual( states );
			expect( mockIndexedDBStore.getByIndex ).toHaveBeenCalledWith(
				'workflowId',
				'workflow-1'
			);
		} );
	} );

	describe( 'saveExecutionContext()', () => {
		test( 'should save execution context state', async () => {
			const manager = createStateManager( 'workflow-1' );
			const context = {
				completedSteps: [ 'step1' ],
				skippedSteps: [],
				state: { result: 'test' },
				staticSiteProviders: [ 'provider1' ],
				siteUrl: 'https://example.com',
			};

			await saveExecutionContext( manager, context );

			expect( mockIndexedDBStore.set ).toHaveBeenCalled();
			const setCall = mockIndexedDBStore.set.mock.calls[ 0 ];
			// set(key, value, metadata) - value is the second argument
			// The value is wrapped in stateData with stateKey, workflowId, etc.
			const savedValue = setCall[ 1 ];
			expect( savedValue.state.completedSteps ).toEqual( [ 'step1' ] );
			expect( savedValue.state.state ).toEqual( { result: 'test' } );
			expect( savedValue.state.providers.staticSiteProviders ).toEqual( [
				'provider1',
			] );
		} );

		test( 'should extract step results from state', async () => {
			const manager = createStateManager( 'workflow-1' );
			const context = {
				state: {
					blueprintBundle: { path: '/path/to/bundle.zip' },
					urlsResult: [ 'url1', 'url2' ],
					otherData: 'test',
				},
			};

			await saveExecutionContext( manager, context );

			const setCall = mockIndexedDBStore.set.mock.calls[ 0 ];
			// set(key, value, metadata) - value is the second argument
			// The value is wrapped in stateData with stateKey, workflowId, etc.
			const savedValue = setCall[ 1 ];
			expect( savedValue.state.stepResults.blueprintBundle ).toBeDefined();
			expect( savedValue.state.stepResults.urlsResult ).toBeDefined();
		} );
	} );

	describe( 'restoreExecutionContext()', () => {
		test( 'should restore execution context from saved state', async () => {
			const manager = createStateManager( 'workflow-1' );
			const baseContext = {
				siteUrl: 'https://example.com',
				staticSiteProviders: [],
			};

			const savedState = {
				completedSteps: [ 'step1' ],
				state: { result: 'test' },
				providers: {
					staticSiteProviders: [ 'provider1' ],
				},
			};

			mockIndexedDBStore.get.mockResolvedValue( {
				stateKey: 'workflow-1',
				workflowId: 'workflow-1',
				providerInstance: null,
				state: savedState,
				timestamp: Date.now(),
			} );

			const restored = await restoreExecutionContext(
				manager,
				baseContext
			);

			expect( restored.completedSteps ).toEqual( [ 'step1' ] );
			expect( restored.state.result ).toBe( 'test' );
			expect( restored.staticSiteProviders ).toEqual( [ 'provider1' ] );
		} );

		test( 'should merge with base context', async () => {
			const manager = createStateManager( 'workflow-1' );
			const baseContext = {
				siteUrl: 'https://example.com',
				state: { baseData: 'base' },
			};

			mockIndexedDBStore.get.mockResolvedValue( {
				stateKey: 'workflow-1',
				workflowId: 'workflow-1',
				providerInstance: null,
				state: { state: { savedData: 'saved' } },
				timestamp: Date.now(),
			} );

			const restored = await restoreExecutionContext(
				manager,
				baseContext
			);

			expect( restored.state.baseData ).toBe( 'base' );
			expect( restored.state.savedData ).toBe( 'saved' );
		} );

		test( 'should return base context if no saved state', async () => {
			mockIndexedDBStore.get.mockResolvedValue( null );

			const manager = createStateManager( 'workflow-1' );
			const baseContext = { siteUrl: 'https://example.com' };

			const restored = await restoreExecutionContext(
				manager,
				baseContext
			);

			expect( restored ).toEqual( baseContext );
		} );
	} );
} );
