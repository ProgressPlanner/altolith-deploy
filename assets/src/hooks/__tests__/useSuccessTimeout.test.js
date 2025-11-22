/**
 * Success Timeout Hook Tests
 *
 * Tests for useSuccessTimeout hook.
 * Validates timer management and cleanup behavior.
 *
 */

import { renderHook, act } from '@testing-library/react';
import { useSuccessTimeout } from '../useSuccessTimeout';
import { SUCCESS_MESSAGE_DURATION_MS } from '../../utils/constants';

describe( 'useSuccessTimeout', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	describe( 'showSuccess()', () => {
		test( 'should call callback after SUCCESS_MESSAGE_DURATION_MS', () => {
			const callback = jest.fn();
			const { result } = renderHook( () => useSuccessTimeout() );

			act( () => {
				result.current.showSuccess( callback );
			} );

			expect( callback ).not.toHaveBeenCalled();

			act( () => {
				jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS );
			} );

			expect( callback ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should not call callback before timeout completes', () => {
			const callback = jest.fn();
			const { result } = renderHook( () => useSuccessTimeout() );

			act( () => {
				result.current.showSuccess( callback );
			} );

			act( () => {
				jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS - 1 );
			} );

			expect( callback ).not.toHaveBeenCalled();
		} );

		test( 'should handle being called without a callback', () => {
			const { result } = renderHook( () => useSuccessTimeout() );

			expect( () => {
				act( () => {
					result.current.showSuccess();
				} );

				act( () => {
					jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS );
				} );
			} ).not.toThrow();
		} );

		test( 'should handle callback being null', () => {
			const { result } = renderHook( () => useSuccessTimeout() );

			expect( () => {
				act( () => {
					result.current.showSuccess( null );
				} );

				act( () => {
					jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS );
				} );
			} ).not.toThrow();
		} );

		test( 'should clear previous timeout when called again', () => {
			const callback1 = jest.fn();
			const callback2 = jest.fn();
			const { result } = renderHook( () => useSuccessTimeout() );

			act( () => {
				result.current.showSuccess( callback1 );
			} );

			act( () => {
				jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS / 2 );
			} );

			// Set new timeout before first completes
			act( () => {
				result.current.showSuccess( callback2 );
			} );

			act( () => {
				jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS );
			} );

			// First callback should NOT be called
			expect( callback1 ).not.toHaveBeenCalled();
			// Second callback should be called
			expect( callback2 ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should be stable across renders', () => {
			const { result, rerender } = renderHook( () =>
				useSuccessTimeout()
			);
			const firstShowSuccess = result.current.showSuccess;

			rerender();

			expect( result.current.showSuccess ).toBe( firstShowSuccess );
		} );
	} );

	describe( 'clearSuccess()', () => {
		test( 'should cancel pending timeout', () => {
			const callback = jest.fn();
			const { result } = renderHook( () => useSuccessTimeout() );

			act( () => {
				result.current.showSuccess( callback );
			} );

			act( () => {
				result.current.clearSuccess();
			} );

			act( () => {
				jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS );
			} );

			expect( callback ).not.toHaveBeenCalled();
		} );

		test( 'should be safe to call when no timeout is active', () => {
			const { result } = renderHook( () => useSuccessTimeout() );

			expect( () => {
				act( () => {
					result.current.clearSuccess();
				} );
			} ).not.toThrow();
		} );

		test( 'should be safe to call multiple times', () => {
			const { result } = renderHook( () => useSuccessTimeout() );

			expect( () => {
				act( () => {
					result.current.clearSuccess();
					result.current.clearSuccess();
					result.current.clearSuccess();
				} );
			} ).not.toThrow();
		} );

		test( 'should be stable across renders', () => {
			const { result, rerender } = renderHook( () =>
				useSuccessTimeout()
			);
			const firstClearSuccess = result.current.clearSuccess;

			rerender();

			expect( result.current.clearSuccess ).toBe( firstClearSuccess );
		} );
	} );

	describe( 'Cleanup on unmount', () => {
		test( 'should clear timeout when component unmounts', () => {
			const callback = jest.fn();
			const { result, unmount } = renderHook( () => useSuccessTimeout() );

			act( () => {
				result.current.showSuccess( callback );
			} );

			unmount();

			act( () => {
				jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS );
			} );

			expect( callback ).not.toHaveBeenCalled();
		} );

		test( 'should handle unmount when no timeout is active', () => {
			const { unmount } = renderHook( () => useSuccessTimeout() );

			expect( () => {
				unmount();
			} ).not.toThrow();
		} );

		test( 'should handle unmount after clearSuccess was called', () => {
			const callback = jest.fn();
			const { result, unmount } = renderHook( () => useSuccessTimeout() );

			act( () => {
				result.current.showSuccess( callback );
			} );

			act( () => {
				result.current.clearSuccess();
			} );

			expect( () => {
				unmount();
			} ).not.toThrow();
		} );
	} );

	describe( 'Integration scenarios', () => {
		test( 'should handle rapid successive calls', () => {
			const callbacks = [
				jest.fn(),
				jest.fn(),
				jest.fn(),
				jest.fn(),
				jest.fn(),
			];
			const { result } = renderHook( () => useSuccessTimeout() );

			// Call showSuccess rapidly
			act( () => {
				callbacks.forEach( ( callback ) => {
					result.current.showSuccess( callback );
				} );
			} );

			act( () => {
				jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS );
			} );

			// Only the last callback should be called
			callbacks.slice( 0, -1 ).forEach( ( callback ) => {
				expect( callback ).not.toHaveBeenCalled();
			} );
			expect( callbacks[ callbacks.length - 1 ] ).toHaveBeenCalledTimes(
				1
			);
		} );

		test( 'should allow new timeout after previous completes', () => {
			const callback1 = jest.fn();
			const callback2 = jest.fn();
			const { result } = renderHook( () => useSuccessTimeout() );

			// First timeout
			act( () => {
				result.current.showSuccess( callback1 );
			} );

			act( () => {
				jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS );
			} );

			expect( callback1 ).toHaveBeenCalledTimes( 1 );

			// Second timeout
			act( () => {
				result.current.showSuccess( callback2 );
			} );

			act( () => {
				jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS );
			} );

			expect( callback2 ).toHaveBeenCalledTimes( 1 );
			expect( callback1 ).toHaveBeenCalledTimes( 1 ); // Still just once
		} );

		test( 'should work correctly with show-clear-show pattern', () => {
			const callback1 = jest.fn();
			const callback2 = jest.fn();
			const { result } = renderHook( () => useSuccessTimeout() );

			// Show
			act( () => {
				result.current.showSuccess( callback1 );
			} );

			// Clear before timeout
			act( () => {
				result.current.clearSuccess();
			} );

			// Show again
			act( () => {
				result.current.showSuccess( callback2 );
			} );

			act( () => {
				jest.advanceTimersByTime( SUCCESS_MESSAGE_DURATION_MS );
			} );

			expect( callback1 ).not.toHaveBeenCalled();
			expect( callback2 ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
