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

// Mock IndexedDB
const mockIndexedDB = () => {
	const store = new Map();
	const index = {
		openCursor: jest.fn( ( range ) => {
			const entries = Array.from( store.entries() ).filter( ( [ key ] ) => {
				if ( range && range.lower === range.upper ) {
					return key.startsWith( range.lower );
				}
				return true;
			} );

			let cursorIndex = 0;
			return {
				onsuccess: null,
				onerror: null,
				result: cursorIndex < entries.length ? entries[ cursorIndex ][ 1 ] : null,
				continue: jest.fn( () => {
					cursorIndex++;
					if ( cursorIndex < entries.length ) {
						setTimeout( () => {
							// Simulate cursor continue
						}, 0 );
					}
				} ),
			};
		} ),
	};

	return {
		open: jest.fn( ( name, version ) => {
			const request = {
				result: {
					objectStoreNames: {
						contains: jest.fn( () => false ),
					},
					createObjectStore: jest.fn( () => ( {
						createIndex: jest.fn( () => index ),
					} ) ),
					transaction: jest.fn( () => ( {
						objectStore: jest.fn( () => ( {
							put: jest.fn( ( data ) => {
								store.set( data.stateKey, data );
								return {
									onsuccess: null,
									onerror: null,
									result: data,
								};
							} ),
							get: jest.fn( ( key ) => {
								const result = store.get( key ) || null;
								return {
									onsuccess: null,
									onerror: null,
									result,
								};
							} ),
							delete: jest.fn( ( key ) => {
								store.delete( key );
								return {
									onsuccess: null,
									onerror: null,
								};
							} ),
							index: jest.fn( () => index ),
						} ) ),
					} ) ),
				},
				onsuccess: null,
				onerror: null,
				onupgradeneeded: null,
			};

			// Simulate async behavior
			setTimeout( () => {
				if ( request.onsuccess ) {
					request.onsuccess();
				}
			}, 0 );

			return request;
		} ),
	};
};

// Mock IndexedDB globally
global.indexedDB = mockIndexedDB();

describe( 'stateManager', () => {
	beforeEach( () => {
		jest.clearAllMocks();
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
			const state = { completedSteps: [ 'step1' ], state: { result: 'test' } };

			await manager.save( state );
			const loaded = await manager.load();

			expect( loaded ).toEqual( state );
		} );

		test( 'should handle provider instance isolation', async () => {
			const manager = createStateManager( 'workflow-1' );
			const state1 = { provider: 'provider1' };
			const state2 = { provider: 'provider2' };

			await manager.save( state1, 'provider1' );
			await manager.save( state2, 'provider2' );

			const loaded1 = await manager.load( 'provider1' );
			const loaded2 = await manager.load( 'provider2' );

			expect( loaded1 ).toEqual( state1 );
			expect( loaded2 ).toEqual( state2 );
		} );

		test( 'should return null for non-existent state', async () => {
			const manager = createStateManager( 'workflow-1' );
			const loaded = await manager.load();

			expect( loaded ).toBeNull();
		} );
	} );

	describe( 'clear()', () => {
		test( 'should clear state for workflow', async () => {
			const manager = createStateManager( 'workflow-1' );
			await manager.save( { test: 'data' } );

			await manager.clear();
			const loaded = await manager.load();

			expect( loaded ).toBeNull();
		} );

		test( 'should clear specific provider instance', async () => {
			const manager = createStateManager( 'workflow-1' );
			await manager.save( { provider: 'provider1' }, 'provider1' );
			await manager.save( { provider: 'provider2' }, 'provider2' );

			await manager.clear( 'provider1' );

			const loaded1 = await manager.load( 'provider1' );
			const loaded2 = await manager.load( 'provider2' );

			expect( loaded1 ).toBeNull();
			expect( loaded2 ).toEqual( { provider: 'provider2' } );
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

			const loaded = await manager.load();
			expect( loaded.completedSteps ).toEqual( [ 'step1' ] );
			expect( loaded.state ).toEqual( { result: 'test' } );
			expect( loaded.providers.staticSiteProviders ).toEqual( [
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

			const loaded = await manager.load();
			expect( loaded.stepResults.blueprintBundle ).toBeDefined();
			expect( loaded.stepResults.urlsResult ).toBeDefined();
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

			await manager.save( savedState );
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

			await manager.save( { state: { savedData: 'saved' } } );
			const restored = await restoreExecutionContext(
				manager,
				baseContext
			);

			expect( restored.state.baseData ).toBe( 'base' );
			expect( restored.state.savedData ).toBe( 'saved' );
		} );

		test( 'should return base context if no saved state', async () => {
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

