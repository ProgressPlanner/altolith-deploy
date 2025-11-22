/**
 * Error Boundary Tests
 *
 * Tests for ErrorBoundary component.
 * Validates error catching and fallback UI rendering.
 *
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../index';

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

// Mock debug utility
jest.mock( '../../../utils/debug', () => ( {
	debugError: jest.fn(),
} ) );

// Import the mock
import { debugError } from '../../../utils/debug';

// Component that throws an error
const ThrowError = ( { shouldThrow, error } ) => {
	if ( shouldThrow ) {
		throw error || new Error( 'Test error' );
	}
	return <div>No error</div>;
};

// Suppress console.error in tests since we expect errors
beforeAll( () => {
	jest.spyOn( console, 'error' ).mockImplementation( () => {} );
} );

afterAll( () => {
	console.error.mockRestore();
} );

describe( 'ErrorBoundary', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Normal rendering (no errors)', () => {
		test( 'should render children when no error', () => {
			render(
				<ErrorBoundary>
					<div>Child component</div>
				</ErrorBoundary>
			);

			expect( screen.getByText( 'Child component' ) ).toBeInTheDocument();
		} );

		test( 'should not show error boundary UI when no error', () => {
			render(
				<ErrorBoundary>
					<div>Child component</div>
				</ErrorBoundary>
			);

			expect(
				screen.queryByText( 'Something went wrong' )
			).not.toBeInTheDocument();
		} );

		test( 'should render multiple children', () => {
			render(
				<ErrorBoundary>
					<div>First child</div>
					<div>Second child</div>
				</ErrorBoundary>
			);

			expect( screen.getByText( 'First child' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Second child' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Error catching', () => {
		test( 'should catch error and show fallback UI', () => {
			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={ true } />
				</ErrorBoundary>
			);

			expect(
				screen.getByText( 'Something went wrong' )
			).toBeInTheDocument();
			expect( screen.queryByText( 'No error' ) ).not.toBeInTheDocument();
		} );

		test( 'should display default error message', () => {
			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={ true } />
				</ErrorBoundary>
			);

			expect(
				screen.getByText(
					'An unexpected error occurred. Please try refreshing the page.'
				)
			).toBeInTheDocument();
		} );

		test( 'should show error details in details element', () => {
			render(
				<ErrorBoundary>
					<ThrowError
						shouldThrow={ true }
						error={ new Error( 'Custom error message' ) }
					/>
				</ErrorBoundary>
			);

			expect( screen.getByText( 'Error details' ) ).toBeInTheDocument();
			expect(
				screen.getByText( /Error: Custom error message/ )
			).toBeInTheDocument();
		} );

		test( 'should call debugError on error catch', () => {
			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={ true } />
				</ErrorBoundary>
			);

			expect( debugError ).toHaveBeenCalledWith(
				'Error caught by ErrorBoundary:',
				expect.objectContaining( {
					error: expect.any( Error ),
					errorInfo: expect.any( Object ),
				} )
			);
		} );

		test( 'should call onError callback if provided', () => {
			const onError = jest.fn();

			render(
				<ErrorBoundary onError={ onError }>
					<ThrowError shouldThrow={ true } />
				</ErrorBoundary>
			);

			expect( onError ).toHaveBeenCalledWith(
				expect.any( Error ),
				expect.any( Object )
			);
		} );

		test( 'should propagate error if onError callback throws', () => {
			const onError = jest.fn().mockImplementation( () => {
				throw new Error( 'onError failed' );
			} );

			// The onError callback is called in componentDidCatch, which runs
			// after render. If it throws, React will catch and re-throw it.
			expect( () => {
				render(
					<ErrorBoundary onError={ onError }>
						<ThrowError shouldThrow={ true } />
					</ErrorBoundary>
				);
			} ).toThrow( 'onError failed' );
		} );
	} );

	describe( 'Reset functionality', () => {
		test( 'should render "Try again" button', () => {
			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={ true } />
				</ErrorBoundary>
			);

			expect(
				screen.getByRole( 'button', { name: 'Try again' } )
			).toBeInTheDocument();
		} );

		test( 'should reset error state when retry button clicked', async () => {
			const user = userEvent.setup();

			// Wrapper component to control throwing behavior
			function Wrapper() {
				const [ shouldThrow, setShouldThrow ] = React.useState( true );

				// Make setShouldThrow available on window for testing
				React.useEffect( () => {
					window.testSetShouldThrow = setShouldThrow;
				}, [] );

				return (
					<ErrorBoundary>
						<ThrowError shouldThrow={ shouldThrow } />
					</ErrorBoundary>
				);
			}

			render( <Wrapper /> );

			expect(
				screen.getByText( 'Something went wrong' )
			).toBeInTheDocument();

			// Fix the underlying issue
			window.testSetShouldThrow( false );

			// Click retry button
			await user.click(
				screen.getByRole( 'button', { name: 'Try again' } )
			);

			expect( screen.getByText( 'No error' ) ).toBeInTheDocument();
			expect(
				screen.queryByText( 'Something went wrong' )
			).not.toBeInTheDocument();
		} );

		test( 'should call onReset callback when reset button clicked', async () => {
			const user = userEvent.setup();
			const onReset = jest.fn();

			render(
				<ErrorBoundary onReset={ onReset }>
					<ThrowError shouldThrow={ true } />
				</ErrorBoundary>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Try again' } )
			);

			expect( onReset ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should work without onReset callback', async () => {
			const user = userEvent.setup();

			// Wrapper component to control throwing behavior
			function Wrapper() {
				const [ shouldThrow, setShouldThrow ] = React.useState( true );

				React.useEffect( () => {
					window.testSetShouldThrow2 = setShouldThrow;
				}, [] );

				return (
					<ErrorBoundary>
						<ThrowError shouldThrow={ shouldThrow } />
					</ErrorBoundary>
				);
			}

			render( <Wrapper /> );

			// Fix the underlying issue
			window.testSetShouldThrow2( false );

			await user.click(
				screen.getByRole( 'button', { name: 'Try again' } )
			);

			expect( screen.getByText( 'No error' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Custom fallback UI', () => {
		test( 'should render custom fallback when provided', () => {
			const customFallback = ( { error } ) => (
				<div>Custom error UI: { error.message }</div>
			);

			render(
				<ErrorBoundary fallback={ customFallback }>
					<ThrowError
						shouldThrow={ true }
						error={ new Error( 'Custom error' ) }
					/>
				</ErrorBoundary>
			);

			expect(
				screen.getByText( 'Custom error UI: Custom error' )
			).toBeInTheDocument();
			expect(
				screen.queryByText( 'Something went wrong' )
			).not.toBeInTheDocument();
		} );

		test( 'should pass error, errorInfo, and resetError to custom fallback', () => {
			const customFallback = jest.fn( () => <div>Custom UI</div> );

			render(
				<ErrorBoundary fallback={ customFallback }>
					<ThrowError shouldThrow={ true } />
				</ErrorBoundary>
			);

			expect( customFallback ).toHaveBeenCalledWith(
				expect.objectContaining( {
					error: expect.any( Error ),
					errorInfo: expect.any( Object ),
					resetError: expect.any( Function ),
				} )
			);
		} );

		test( 'should allow custom fallback to call resetError', async () => {
			const user = userEvent.setup();
			const customFallback = ( { resetError } ) => (
				<button onClick={ resetError }>Custom reset</button>
			);

			// Wrapper component to control throwing behavior
			function Wrapper() {
				const [ shouldThrow, setShouldThrow ] = React.useState( true );

				React.useEffect( () => {
					window.testSetShouldThrow3 = setShouldThrow;
				}, [] );

				return (
					<ErrorBoundary fallback={ customFallback }>
						<ThrowError shouldThrow={ shouldThrow } />
					</ErrorBoundary>
				);
			}

			render( <Wrapper /> );

			// Fix the underlying issue
			window.testSetShouldThrow3( false );

			await user.click(
				screen.getByRole( 'button', { name: 'Custom reset' } )
			);

			expect( screen.getByText( 'No error' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Edge cases', () => {
		test( 'should handle null error message', () => {
			const nullError = new Error();
			nullError.message = null;

			render(
				<ErrorBoundary>
					<ThrowError shouldThrow={ true } error={ nullError } />
				</ErrorBoundary>
			);

			expect(
				screen.getByText( 'Something went wrong' )
			).toBeInTheDocument();
		} );

		test( 'should handle error without stack trace', () => {
			const errorWithoutStack = new Error( 'Error without stack' );
			delete errorWithoutStack.stack;

			render(
				<ErrorBoundary>
					<ThrowError
						shouldThrow={ true }
						error={ errorWithoutStack }
					/>
				</ErrorBoundary>
			);

			expect(
				screen.getByText( 'Something went wrong' )
			).toBeInTheDocument();
		} );

		test( 'should handle non-Error objects thrown', () => {
			const ThrowString = () => {
				throw 'String error'; // eslint-disable-line no-throw-literal
			};

			render(
				<ErrorBoundary>
					<ThrowString />
				</ErrorBoundary>
			);

			expect(
				screen.getByText( 'Something went wrong' )
			).toBeInTheDocument();
		} );

		test( 'should handle deeply nested error', () => {
			const Nested = () => {
				throw new Error( 'Deep error' );
			};

			render(
				<ErrorBoundary>
					<div>
						<div>
							<div>
								<Nested />
							</div>
						</div>
					</div>
				</ErrorBoundary>
			);

			expect(
				screen.getByText( 'Something went wrong' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Integration scenarios', () => {
		test( 'should handle error after successful render', () => {
			const { rerender } = render(
				<ErrorBoundary>
					<ThrowError shouldThrow={ false } />
				</ErrorBoundary>
			);

			expect( screen.getByText( 'No error' ) ).toBeInTheDocument();

			rerender(
				<ErrorBoundary>
					<ThrowError shouldThrow={ true } />
				</ErrorBoundary>
			);

			expect(
				screen.getByText( 'Something went wrong' )
			).toBeInTheDocument();
		} );

		test( 'should work with both onError and onReset callbacks', async () => {
			const user = userEvent.setup();
			const onError = jest.fn();
			const onReset = jest.fn();

			// Wrapper component to control throwing behavior
			function Wrapper() {
				const [ shouldThrow, setShouldThrow ] = React.useState( true );

				React.useEffect( () => {
					window.testSetShouldThrow4 = setShouldThrow;
				}, [] );

				return (
					<ErrorBoundary onError={ onError } onReset={ onReset }>
						<ThrowError shouldThrow={ shouldThrow } />
					</ErrorBoundary>
				);
			}

			render( <Wrapper /> );

			expect( onError ).toHaveBeenCalled();

			// Fix the underlying issue
			window.testSetShouldThrow4( false );

			await user.click(
				screen.getByRole( 'button', { name: 'Try again' } )
			);

			expect( onReset ).toHaveBeenCalled();
			expect( screen.getByText( 'No error' ) ).toBeInTheDocument();
		} );
	} );
} );
