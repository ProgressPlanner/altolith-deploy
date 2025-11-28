/**
 * Error Handler Tests
 *
 */

import { initializeErrorHandlers } from '../errorHandler';

describe( 'errorHandler', () => {
	let originalAddEventListener;
	let eventListeners;
	let mockConsoleError;

	beforeEach( () => {
		jest.clearAllMocks();
		eventListeners = {};

		// Mock window.addEventListener
		originalAddEventListener = window.addEventListener;
		window.addEventListener = jest.fn( ( type, handler ) => {
			eventListeners[ type ] = handler;
		} );

		// Mock console.error
		mockConsoleError = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		// Reset wp global
		delete window.wp;
	} );

	afterEach( () => {
		window.addEventListener = originalAddEventListener;
		mockConsoleError.mockRestore();
	} );

	describe( 'initializeErrorHandlers()', () => {
		test( 'should register unhandledrejection listener', () => {
			initializeErrorHandlers();

			expect( window.addEventListener ).toHaveBeenCalledWith(
				'unhandledrejection',
				expect.any( Function )
			);
		} );

		test( 'should register error listener', () => {
			initializeErrorHandlers();

			expect( window.addEventListener ).toHaveBeenCalledWith(
				'error',
				expect.any( Function )
			);
		} );

		test( 'should handle unhandled promise rejection', () => {
			initializeErrorHandlers();

			const mockEvent = {
				reason: new Error( 'Test rejection' ),
				promise: Promise.resolve(),
				preventDefault: jest.fn(),
			};

			eventListeners.unhandledrejection( mockEvent );

			expect( mockEvent.preventDefault ).toHaveBeenCalled();
		} );

		test( 'should handle uncaught error with stack', () => {
			initializeErrorHandlers();

			const mockEvent = {
				message: 'Test error',
				filename: 'test.js',
				lineno: 10,
				colno: 5,
				error: { stack: 'Error stack trace' },
				preventDefault: jest.fn(),
			};

			eventListeners.error( mockEvent );

			expect( mockEvent.preventDefault ).toHaveBeenCalled();
		} );

		test( 'should not prevent default for errors without stack', () => {
			initializeErrorHandlers();

			const mockEvent = {
				message: 'Syntax error',
				filename: 'test.js',
				lineno: 10,
				colno: 5,
				error: null,
				preventDefault: jest.fn(),
			};

			eventListeners.error( mockEvent );

			expect( mockEvent.preventDefault ).not.toHaveBeenCalled();
		} );

		test( 'should use WordPress notices when available', () => {
			const mockCreateErrorNotice = jest.fn();
			window.wp = {
				data: {
					dispatch: jest.fn( () => ( {
						createErrorNotice: mockCreateErrorNotice,
					} ) ),
				},
			};

			initializeErrorHandlers();

			const mockEvent = {
				reason: new Error( 'Test' ),
				promise: Promise.resolve(),
				preventDefault: jest.fn(),
			};

			eventListeners.unhandledrejection( mockEvent );

			expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
				expect.any( String ),
				expect.objectContaining( {
					id: 'altolith-global-error',
					isDismissible: true,
				} )
			);
		} );

		test( 'should fallback to console when wp.data unavailable', () => {
			window.wp = {};

			initializeErrorHandlers();

			const mockEvent = {
				reason: new Error( 'Test' ),
				promise: Promise.resolve(),
				preventDefault: jest.fn(),
			};

			eventListeners.unhandledrejection( mockEvent );

			expect( mockConsoleError ).toHaveBeenCalled();
		} );

		test( 'should fallback to console when dispatch returns null', () => {
			window.wp = {
				data: {
					dispatch: jest.fn( () => null ),
				},
			};

			initializeErrorHandlers();

			const mockEvent = {
				reason: new Error( 'Test' ),
				promise: Promise.resolve(),
				preventDefault: jest.fn(),
			};

			eventListeners.unhandledrejection( mockEvent );

			expect( mockConsoleError ).toHaveBeenCalled();
		} );
	} );
} );
