/**
 * Progress Emitter Tests
 *
 * Tests for the unified progress event emitter that consolidates
 * all progress tracking into a single event-driven system.
 */

import { createProgressEmitter, PROGRESS_EVENTS } from '../progressEmitter';

describe( 'progressEmitter', () => {
	describe( 'createProgressEmitter', () => {
		it( 'should create an emitter instance', () => {
			const emitter = createProgressEmitter();

			expect( emitter ).toBeDefined();
			expect( typeof emitter.emit ).toBe( 'function' );
			expect( typeof emitter.on ).toBe( 'function' );
			expect( typeof emitter.off ).toBe( 'function' );
			expect( typeof emitter.clear ).toBe( 'function' );
		} );
	} );

	describe( 'PROGRESS_EVENTS', () => {
		it( 'should export event constants', () => {
			expect( PROGRESS_EVENTS.STEP ).toBe( 'step' );
			expect( PROGRESS_EVENTS.FILE ).toBe( 'file' );
			expect( PROGRESS_EVENTS.PROVIDER ).toBe( 'provider' );
			expect( PROGRESS_EVENTS.OVERALL ).toBe( 'overall' );
			expect( PROGRESS_EVENTS.STATUS ).toBe( 'status' );
		} );
	} );

	describe( 'on / emit', () => {
		it( 'should call handler when event is emitted', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			emitter.on( 'step', handler );
			emitter.emit( 'step', { stepId: 'test', current: 5, total: 10 } );

			expect( handler ).toHaveBeenCalledWith( {
				stepId: 'test',
				current: 5,
				total: 10,
			} );
		} );

		it( 'should call multiple handlers for same event', () => {
			const emitter = createProgressEmitter();
			const handler1 = jest.fn();
			const handler2 = jest.fn();

			emitter.on( 'step', handler1 );
			emitter.on( 'step', handler2 );
			emitter.emit( 'step', { stepId: 'test' } );

			expect( handler1 ).toHaveBeenCalled();
			expect( handler2 ).toHaveBeenCalled();
		} );

		it( 'should not call handlers for different events', () => {
			const emitter = createProgressEmitter();
			const stepHandler = jest.fn();
			const fileHandler = jest.fn();

			emitter.on( 'step', stepHandler );
			emitter.on( 'file', fileHandler );
			emitter.emit( 'step', { stepId: 'test' } );

			expect( stepHandler ).toHaveBeenCalled();
			expect( fileHandler ).not.toHaveBeenCalled();
		} );

		it( 'should handle events with no listeners', () => {
			const emitter = createProgressEmitter();

			// Should not throw
			expect( () => {
				emitter.emit( 'unknown', { data: 'test' } );
			} ).not.toThrow();
		} );
	} );

	describe( 'off', () => {
		it( 'should remove handler when called with handler reference', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			emitter.on( 'step', handler );
			emitter.off( 'step', handler );
			emitter.emit( 'step', { stepId: 'test' } );

			expect( handler ).not.toHaveBeenCalled();
		} );

		it( 'should not remove other handlers', () => {
			const emitter = createProgressEmitter();
			const handler1 = jest.fn();
			const handler2 = jest.fn();

			emitter.on( 'step', handler1 );
			emitter.on( 'step', handler2 );
			emitter.off( 'step', handler1 );
			emitter.emit( 'step', { stepId: 'test' } );

			expect( handler1 ).not.toHaveBeenCalled();
			expect( handler2 ).toHaveBeenCalled();
		} );

		it( 'should handle removing non-existent handler', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			// Should not throw
			expect( () => {
				emitter.off( 'step', handler );
			} ).not.toThrow();
		} );
	} );

	describe( 'clear', () => {
		it( 'should remove all handlers', () => {
			const emitter = createProgressEmitter();
			const stepHandler = jest.fn();
			const fileHandler = jest.fn();

			emitter.on( 'step', stepHandler );
			emitter.on( 'file', fileHandler );
			emitter.clear();
			emitter.emit( 'step', { stepId: 'test' } );
			emitter.emit( 'file', { fileName: 'test.js' } );

			expect( stepHandler ).not.toHaveBeenCalled();
			expect( fileHandler ).not.toHaveBeenCalled();
		} );

		it( 'should allow adding handlers after clear', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			emitter.clear();
			emitter.on( 'step', handler );
			emitter.emit( 'step', { stepId: 'test' } );

			expect( handler ).toHaveBeenCalled();
		} );
	} );

	describe( 'once', () => {
		it( 'should call handler only once', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			emitter.once( 'step', handler );
			emitter.emit( 'step', { stepId: 'test1' } );
			emitter.emit( 'step', { stepId: 'test2' } );

			expect( handler ).toHaveBeenCalledTimes( 1 );
			expect( handler ).toHaveBeenCalledWith( { stepId: 'test1' } );
		} );
	} );

	describe( 'step progress events', () => {
		it( 'should emit step progress with correct data', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			emitter.on( PROGRESS_EVENTS.STEP, handler );
			emitter.emit( PROGRESS_EVENTS.STEP, {
				stepId: 'discoverAndScanSite',
				current: 50,
				total: 100,
				statusData: { urlsScanned: 25 },
			} );

			expect( handler ).toHaveBeenCalledWith( {
				stepId: 'discoverAndScanSite',
				current: 50,
				total: 100,
				statusData: { urlsScanned: 25 },
			} );
		} );
	} );

	describe( 'file progress events', () => {
		it( 'should emit file progress with correct data', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			emitter.on( PROGRESS_EVENTS.FILE, handler );
			emitter.emit( PROGRESS_EVENTS.FILE, {
				stepId: 'deploy',
				fileName: 'style.css',
				current: 5,
				total: 20,
				status: 'uploading',
			} );

			expect( handler ).toHaveBeenCalledWith( {
				stepId: 'deploy',
				fileName: 'style.css',
				current: 5,
				total: 20,
				status: 'uploading',
			} );
		} );
	} );

	describe( 'provider progress events', () => {
		it( 'should emit provider progress with correct data', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			emitter.on( PROGRESS_EVENTS.PROVIDER, handler );
			emitter.emit( PROGRESS_EVENTS.PROVIDER, {
				providerId: 'local-filesystem:abc123',
				stepId: 'deploy',
				current: 10,
				total: 50,
				status: 'active',
			} );

			expect( handler ).toHaveBeenCalledWith( {
				providerId: 'local-filesystem:abc123',
				stepId: 'deploy',
				current: 10,
				total: 50,
				status: 'active',
			} );
		} );
	} );

	describe( 'overall progress events', () => {
		it( 'should emit overall progress with correct data', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			emitter.on( PROGRESS_EVENTS.OVERALL, handler );
			emitter.emit( PROGRESS_EVENTS.OVERALL, {
				current: 75,
				total: 100,
				phase: 'uploading',
			} );

			expect( handler ).toHaveBeenCalledWith( {
				current: 75,
				total: 100,
				phase: 'uploading',
			} );
		} );
	} );

	describe( 'status message events', () => {
		it( 'should emit status messages with correct data', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			emitter.on( PROGRESS_EVENTS.STATUS, handler );
			emitter.emit( PROGRESS_EVENTS.STATUS, {
				message: 'Uploading file.css',
				type: 'progress',
				key: 'upload-file',
				progress: { percent: 50, loaded: 5000, total: 10000 },
			} );

			expect( handler ).toHaveBeenCalledWith( {
				message: 'Uploading file.css',
				type: 'progress',
				key: 'upload-file',
				progress: { percent: 50, loaded: 5000, total: 10000 },
			} );
		} );
	} );

	describe( 'chaining', () => {
		it( 'should return emitter from on for chaining', () => {
			const emitter = createProgressEmitter();
			const handler1 = jest.fn();
			const handler2 = jest.fn();

			const result = emitter
				.on( 'step', handler1 )
				.on( 'file', handler2 );

			expect( result ).toBe( emitter );
		} );

		it( 'should return emitter from off for chaining', () => {
			const emitter = createProgressEmitter();
			const handler = jest.fn();

			emitter.on( 'step', handler );
			const result = emitter.off( 'step', handler );

			expect( result ).toBe( emitter );
		} );

		it( 'should return emitter from emit for chaining', () => {
			const emitter = createProgressEmitter();

			const result = emitter.emit( 'step', { stepId: 'test' } );

			expect( result ).toBe( emitter );
		} );
	} );
} );
