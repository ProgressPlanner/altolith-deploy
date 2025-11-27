/**
 * CopyConfigDropdown Component Tests
 *
 * Tests for the copy configuration dropdown component.
 * Covers rendering, instance filtering, API calls, and success/error handling.
 *
 * These tests define expected behavior - if implementation differs, fix the implementation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock WordPress dependencies.
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
	sprintf: ( format, ...args ) => {
		let result = format;
		args.forEach( ( arg ) => {
			result = result.replace( /%[sd]/, arg );
		} );
		return result;
	},
} ) );

jest.mock( '@wordpress/element', () => ( {
	useState: jest.requireActual( 'react' ).useState,
} ) );

jest.mock( '@wordpress/components', () => ( {
	SelectControl: ( { value, onChange, options, disabled, label } ) => (
		<select
			data-testid="select-control"
			value={ value }
			onChange={ ( e ) => onChange( e.target.value ) }
			disabled={ disabled }
			aria-label={ label }
		>
			{ options.map( ( opt ) => (
				<option key={ opt.value } value={ opt.value }>
					{ opt.label }
				</option>
			) ) }
		</select>
	),
	Notice: ( { children, status, isDismissible } ) => (
		<div
			data-testid="notice"
			data-status={ status }
			data-dismissible={ isDismissible }
		>
			{ children }
		</div>
	),
	Spinner: () => <div data-testid="spinner">Loading...</div>,
} ) );

// Mock apiFetch.
const mockApiFetch = jest.fn();
jest.mock( '@aether/utils/api', () => ( {
	__esModule: true,
	default: ( ...args ) => mockApiFetch( ...args ),
} ) );

// Mock providerFamily utility.
jest.mock( '@aether/providers/utils/providerFamily', () => ( {
	getCompatibleInstances: jest.fn(),
} ) );

// Mock styles.
jest.mock( '@aether/utils/styles', () => ( {
	colors: {
		text: '#333',
		borderLight: '#e0e0e0',
		backgroundLighter: '#f9f9f9',
	},
	spacing: { sm: '8px', md: '12px', lg: '16px' },
	fontSize: { sm: '12px' },
	borderRadius: { md: '4px' },
} ) );

import CopyConfigDropdown from '../index';
import { getCompatibleInstances } from '@aether/providers/utils/providerFamily';

describe( 'CopyConfigDropdown', () => {
	const mockInstances = [
		{
			instanceId: 'cloudflare-r2-static-site:uuid-1',
			config: {
				provider_type: 'cloudflare-r2-static-site',
				instance_name: 'R2 Production',
			},
		},
		{
			instanceId: 'cloudflare-r2-blueprint-bundle:uuid-2',
			config: {
				provider_type: 'cloudflare-r2-blueprint-bundle',
				instance_name: 'R2 Staging',
			},
		},
	];

	const defaultProps = {
		currentInstanceId: 'cloudflare-r2-static-site:uuid-current',
		allInstances: mockInstances,
		targetFields: [ 'account_id', 'api_token', 'bucket_name' ],
		onCopy: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();
		// Default: return all mock instances as compatible.
		getCompatibleInstances.mockReturnValue( mockInstances );
	} );

	// ============================================================
	// Basic Rendering
	// ============================================================
	describe( 'rendering', () => {
		test( 'should render dropdown when compatible instances exist', () => {
			render( <CopyConfigDropdown { ...defaultProps } /> );

			expect(
				screen.getByTestId( 'select-control' )
			).toBeInTheDocument();
		} );

		test( 'should not render when no compatible instances', () => {
			getCompatibleInstances.mockReturnValue( [] );

			const { container } = render(
				<CopyConfigDropdown { ...defaultProps } />
			);

			expect( container.firstChild ).toBeNull();
		} );

		test( 'should display correct label', () => {
			render( <CopyConfigDropdown { ...defaultProps } /> );

			expect(
				screen.getByText( 'Copy settings from another instance' )
			).toBeInTheDocument();
		} );

		test( 'should show placeholder option', () => {
			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			const options = select.querySelectorAll( 'option' );

			expect( options[ 0 ].textContent ).toBe( 'Copy from…' );
			expect( options[ 0 ].value ).toBe( '' );
		} );

		test( 'should list compatible instances', () => {
			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			const options = select.querySelectorAll( 'option' );

			expect( options ).toHaveLength( 3 ); // placeholder + 2 instances
			expect( options[ 1 ].textContent ).toBe( 'R2 Production' );
			expect( options[ 2 ].textContent ).toBe( 'R2 Staging' );
		} );

		test( 'should use instance ID when instance_name is missing', () => {
			const instancesWithoutNames = [
				{
					instanceId: 'cloudflare-r2-static-site:uuid-1',
					config: { provider_type: 'cloudflare-r2-static-site' },
				},
			];
			getCompatibleInstances.mockReturnValue( instancesWithoutNames );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			const options = select.querySelectorAll( 'option' );

			expect( options[ 1 ].textContent ).toBe(
				'cloudflare-r2-static-site'
			);
		} );
	} );

	// ============================================================
	// Copy Functionality
	// ============================================================
	describe( 'copy functionality', () => {
		test( 'should call API when instance is selected', async () => {
			mockApiFetch.mockResolvedValue( {
				success: true,
				copiedFields: {
					account_id: 'test-id',
					api_token: 'test-token',
				},
			} );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			await waitFor( () => {
				expect( mockApiFetch ).toHaveBeenCalledWith( {
					path: expect.stringContaining( '/copy-from/' ),
					method: 'POST',
					data: {
						target_fields: [
							'account_id',
							'api_token',
							'bucket_name',
						],
					},
				} );
			} );
		} );

		test( 'should call onCopy with copied fields on success', async () => {
			const copiedFields = {
				account_id: 'test-id',
				api_token: 'test-token',
			};
			mockApiFetch.mockResolvedValue( {
				success: true,
				copiedFields,
			} );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			await waitFor( () => {
				expect( defaultProps.onCopy ).toHaveBeenCalledWith(
					copiedFields
				);
			} );
		} );

		test( 'should show success notice after copying', async () => {
			mockApiFetch.mockResolvedValue( {
				success: true,
				copiedFields: {
					account_id: 'test-id',
					api_token: 'test-token',
				},
			} );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			await waitFor( () => {
				const notice = screen.getByTestId( 'notice' );
				expect( notice ).toHaveAttribute( 'data-status', 'success' );
				expect( notice.textContent ).toContain( '2 field(s)' );
			} );
		} );

		test( 'should show spinner while copying', async () => {
			// Create a promise we can control.
			let resolvePromise;
			mockApiFetch.mockReturnValue(
				new Promise( ( resolve ) => {
					resolvePromise = resolve;
				} )
			);

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			expect( screen.getByTestId( 'spinner' ) ).toBeInTheDocument();

			// Resolve the promise.
			resolvePromise( { success: true, copiedFields: {} } );

			await waitFor( () => {
				expect(
					screen.queryByTestId( 'spinner' )
				).not.toBeInTheDocument();
			} );
		} );

		test( 'should disable select while copying', async () => {
			let resolvePromise;
			mockApiFetch.mockReturnValue(
				new Promise( ( resolve ) => {
					resolvePromise = resolve;
				} )
			);

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			expect( select ).toBeDisabled();

			resolvePromise( { success: true, copiedFields: {} } );

			await waitFor( () => {
				expect( select ).not.toBeDisabled();
			} );
		} );

		test( 'should reset selection after copying', async () => {
			mockApiFetch.mockResolvedValue( {
				success: true,
				copiedFields: { account_id: 'test-id' },
			} );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			await waitFor( () => {
				expect( select.value ).toBe( '' );
			} );
		} );

		test( 'should not call API when placeholder is selected', () => {
			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, { target: { value: '' } } );

			expect( mockApiFetch ).not.toHaveBeenCalled();
		} );
	} );

	// ============================================================
	// Error Handling
	// ============================================================
	describe( 'error handling', () => {
		test( 'should show error notice on API failure', async () => {
			mockApiFetch.mockRejectedValue( new Error( 'Network error' ) );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			await waitFor( () => {
				const notice = screen.getByTestId( 'notice' );
				expect( notice ).toHaveAttribute( 'data-status', 'error' );
				expect( notice.textContent ).toContain( 'Network error' );
			} );
		} );

		test( 'should show default error message when error has no message', async () => {
			mockApiFetch.mockRejectedValue( {} );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			await waitFor( () => {
				const notice = screen.getByTestId( 'notice' );
				expect( notice.textContent ).toContain(
					'Failed to copy configuration.'
				);
			} );
		} );

		test( 'should not call onCopy on error', async () => {
			mockApiFetch.mockRejectedValue( new Error( 'API error' ) );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			await waitFor( () => {
				expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			} );

			expect( defaultProps.onCopy ).not.toHaveBeenCalled();
		} );

		test( 'should show warning when no fields were copied', async () => {
			mockApiFetch.mockResolvedValue( {
				success: true,
				copiedFields: {},
			} );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			await waitFor( () => {
				const notice = screen.getByTestId( 'notice' );
				expect( notice ).toHaveAttribute( 'data-status', 'warning' );
				expect( notice.textContent ).toContain(
					'No compatible fields found'
				);
			} );
		} );
	} );

	// ============================================================
	// Edge Cases
	// ============================================================
	describe( 'edge cases', () => {
		test( 'should clear previous notice when selecting new source', async () => {
			mockApiFetch.mockRejectedValueOnce( new Error( 'First error' ) );
			mockApiFetch.mockResolvedValueOnce( {
				success: true,
				copiedFields: { account_id: 'test' },
			} );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );

			// First selection - error.
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			await waitFor( () => {
				expect( screen.getByTestId( 'notice' ) ).toHaveAttribute(
					'data-status',
					'error'
				);
			} );

			// Second selection - should clear error before new request.
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-blueprint-bundle:uuid-2' },
			} );

			await waitFor( () => {
				const notice = screen.getByTestId( 'notice' );
				expect( notice ).toHaveAttribute( 'data-status', 'success' );
			} );
		} );

		test( 'should call getCompatibleInstances with correct params', () => {
			render( <CopyConfigDropdown { ...defaultProps } /> );

			expect( getCompatibleInstances ).toHaveBeenCalledWith(
				'cloudflare-r2-static-site:uuid-current',
				mockInstances
			);
		} );

		test( 'should use instance IDs directly in API path without encoding', async () => {
			mockApiFetch.mockResolvedValue( {
				success: true,
				copiedFields: { account_id: 'test' },
			} );

			render( <CopyConfigDropdown { ...defaultProps } /> );

			const select = screen.getByTestId( 'select-control' );
			fireEvent.change( select, {
				target: { value: 'cloudflare-r2-static-site:uuid-1' },
			} );

			await waitFor( () => {
				expect( mockApiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						path: '/aether/site-exporter/providers/cloudflare-r2-static-site:uuid-current/copy-from/cloudflare-r2-static-site:uuid-1',
					} )
				);
			} );
		} );
	} );
} );
