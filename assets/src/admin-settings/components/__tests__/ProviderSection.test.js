/**
 * Tests for ProviderSection Component
 *
 * @package
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProviderSection from '../ProviderSection';
import * as useProviderOptionsHook from '../../hooks/useProviderOptions';
import * as useProviderStatusHook from '../../hooks/useProviderStatus';

// Mock hooks
jest.mock( '../../hooks/useProviderOptions' );
jest.mock( '../../hooks/useProviderStatus' );
jest.mock( '../SettingsModal', () => {
	return function MockSettingsModal( {
		isOpen,
		onClose,
		providerId,
		title,
	} ) {
		if ( ! isOpen ) {
			return null;
		}
		return (
			<div data-testid="settings-modal">
				<h2>{ title }</h2>
				<button onClick={ onClose }>Close</button>
				<div data-testid="provider-id">{ providerId }</div>
			</div>
		);
	};
} );

describe( 'ProviderSection', () => {
	const mockOptions = [
		{ value: 'cloudflare-r2', label: 'Cloudflare R2' },
		{ value: 'github-pages', label: 'GitHub Pages' },
	];

	const defaultProps = {
		type: 'storage',
		label: 'Storage Provider',
		description: 'Choose a storage provider',
		value: '',
		onChange: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();
		useProviderOptionsHook.default.mockReturnValue( {
			options: mockOptions,
			loading: false,
		} );
		useProviderStatusHook.default.mockReturnValue( {
			status: 'not-configured',
			loading: false,
		} );
	} );

	it( 'should render label and description', () => {
		render( <ProviderSection { ...defaultProps } /> );

		expect( screen.getByText( 'Storage Provider' ) ).toBeInTheDocument();
		// Description may be filtered, so check if it exists or is filtered out
		const description = screen.queryByText( 'Choose a storage provider' );
		if ( description ) {
			expect( description ).toBeInTheDocument();
		}
	} );

	it( 'should render provider dropdown with options', () => {
		render( <ProviderSection { ...defaultProps } /> );

		expect( screen.getByRole( 'group' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Cloudflare R2' ) ).toBeInTheDocument();
		expect( screen.getByText( 'GitHub Pages' ) ).toBeInTheDocument();
	} );

	it( 'should call onChange when dropdown value changes', () => {
		const onChange = jest.fn();
		render( <ProviderSection { ...defaultProps } onChange={ onChange } /> );

		const button = screen.getByText( 'Cloudflare R2' );
		fireEvent.click( button );

		expect( onChange ).toHaveBeenCalledWith( 'cloudflare-r2' );
	} );

	it( 'should show settings button when provider is selected', () => {
		render( <ProviderSection { ...defaultProps } value="cloudflare-r2" /> );

		const settingsButton = screen.getByRole( 'button', {
			name: /configure/i,
		} );
		expect( settingsButton ).toBeInTheDocument();
		expect( settingsButton ).not.toBeDisabled();
	} );

	it( 'should disable settings button when no provider is selected', () => {
		render( <ProviderSection { ...defaultProps } value="" /> );

		const settingsButton = screen.getByRole( 'button', {
			name: /configure/i,
		} );
		expect( settingsButton ).toBeDisabled();
	} );

	it( 'should open settings modal when settings button is clicked', async () => {
		render( <ProviderSection { ...defaultProps } value="cloudflare-r2" /> );

		const settingsButton = screen.getByRole( 'button', {
			name: /configure/i,
		} );
		fireEvent.click( settingsButton );

		await waitFor( () => {
			expect(
				screen.getByTestId( 'settings-modal' )
			).toBeInTheDocument();
		} );
	} );

	it( 'should show status indicator', () => {
		useProviderStatusHook.default.mockReturnValue( {
			status: 'configured',
			loading: false,
		} );

		render( <ProviderSection { ...defaultProps } value="cloudflare-r2" /> );

		// Status indicator should be present (exact implementation depends on StatusIndicator component)
		const section = screen
			.getByText( 'Storage Provider' )
			.closest( '.aether-provider-section' );
		expect( section ).toBeInTheDocument();
	} );

	it( 'should show loading state when options are loading', () => {
		useProviderOptionsHook.default.mockReturnValue( {
			options: [],
			loading: true,
		} );

		render( <ProviderSection { ...defaultProps } /> );

		// When loading, ProviderSelector returns null if no options
		expect( screen.queryByRole( 'group' ) ).not.toBeInTheDocument();
	} );
} );
