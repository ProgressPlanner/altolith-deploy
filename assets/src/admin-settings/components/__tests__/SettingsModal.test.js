/**
 * SettingsModal Component Tests
 *
 * Comprehensive tests for SettingsModal component.
 *
 * @package
 */

import { render, screen, waitFor } from '@testing-library/react';
import { doAction, addAction, removeAction } from '@wordpress/hooks';
import SettingsModal from '../SettingsModal';

// Mock WordPress hooks
jest.mock( '@wordpress/hooks', () => ( {
	doAction: jest.fn(),
	addAction: jest.fn(),
	removeAction: jest.fn(),
} ) );

// Mock WordPress Modal component
jest.mock( '@wordpress/components', () => ( {
	Modal: ( { title, onRequestClose, children, className } ) => (
		<div data-testid="modal" className={ className }>
			<div data-testid="modal-title">{ title }</div>
			<button data-testid="modal-close" onClick={ onRequestClose }>
				Close
			</button>
			<div data-testid="modal-content">{ children }</div>
		</div>
	),
} ) );

// Mock ProviderRegistry
jest.mock( '../../../providers/registry/ProviderRegistry', () => ( {
	ProviderRegistry: {
		getInstance: jest.fn( () => ( {
			getProvider: jest.fn( () => ( {
				getId: () => 'cloudflare-r2',
				getName: () => 'Cloudflare R2',
			} ) ),
		} ) ),
	},
} ) );

// Mock ProviderSettings component
jest.mock( '../../../components/ProviderSettings', () => ( {
	ProviderSettings: () => (
		<div data-testid="provider-settings">Provider Settings Component</div>
	),
} ) );

describe( 'SettingsModal', () => {
	const defaultProps = {
		isOpen: false,
		onClose: jest.fn(),
		providerId: 'cloudflare-r2',
		title: 'Provider Settings',
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'should not render when closed', () => {
		render( <SettingsModal { ...defaultProps } isOpen={ false } /> );

		expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
	} );

	test( 'should render modal when open', () => {
		render( <SettingsModal { ...defaultProps } isOpen={ true } /> );

		expect( screen.getByTestId( 'modal' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'modal-title' ) ).toHaveTextContent(
			'Provider Settings'
		);
	} );

	test( 'should use default title when not provided', () => {
		render(
			<SettingsModal
				{ ...defaultProps }
				isOpen={ true }
				title={ undefined }
			/>
		);

		expect( screen.getByTestId( 'modal-title' ) ).toHaveTextContent(
			'Provider Settings'
		);
	} );

	test( 'should call onClose when close button clicked', () => {
		const onClose = jest.fn();
		render(
			<SettingsModal
				{ ...defaultProps }
				isOpen={ true }
				onClose={ onClose }
			/>
		);

		const closeButton = screen.getByTestId( 'modal-close' );
		closeButton.click();

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'should show message when providerId not provided', () => {
		render(
			<SettingsModal
				{ ...defaultProps }
				isOpen={ true }
				providerId={ null }
			/>
		);

		expect(
			screen.getByText( /Please select a provider first/i )
		).toBeInTheDocument();
	} );

	test( 'should auto-close after save success', async () => {
		const onClose = jest.fn();
		render(
			<SettingsModal
				{ ...defaultProps }
				isOpen={ true }
				onClose={ onClose }
			/>
		);

		// Get the handler that was registered
		const [ [ , , handler ] ] = addAction.mock.calls;

		// Simulate save success
		handler( 'cloudflare-r2' );

		// Wait for auto-close timeout (3 seconds)
		await waitFor(
			() => {
				expect( onClose ).toHaveBeenCalled();
			},
			{ timeout: 3500 }
		);
	} );

	test( 'should not auto-close for different provider', async () => {
		const onClose = jest.fn();
		render(
			<SettingsModal
				{ ...defaultProps }
				isOpen={ true }
				onClose={ onClose }
			/>
		);

		// Get the handler that was registered
		const [ [ , , handler ] ] = addAction.mock.calls;

		// Simulate save success for different provider
		handler( 'gitlab-pages' );

		// Wait a bit
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	test( 'should cleanup action handler on unmount', () => {
		const { unmount } = render(
			<SettingsModal { ...defaultProps } isOpen={ true } />
		);

		unmount();

		expect( removeAction ).toHaveBeenCalledWith(
			'aether.admin.provider.settings.saved',
			expect.stringContaining( 'settings-modal-auto-close-' )
		);
	} );

	test( 'should cleanup timeout on unmount', () => {
		const onClose = jest.fn();
		const { unmount } = render(
			<SettingsModal
				{ ...defaultProps }
				isOpen={ true }
				onClose={ onClose }
			/>
		);

		// Get the handler and trigger it
		const [ [ , , handler ] ] = addAction.mock.calls;
		handler( 'cloudflare-r2' );

		// Unmount before timeout completes
		unmount();

		// Wait for timeout that should have been cleared
		return new Promise( ( resolve ) => {
			setTimeout( () => {
				expect( onClose ).not.toHaveBeenCalled();
				resolve();
			}, 3500 );
		} );
	} );

	test( 'should cleanup modal content on close', () => {
		const { rerender } = render(
			<SettingsModal { ...defaultProps } isOpen={ true } />
		);

		rerender( <SettingsModal { ...defaultProps } isOpen={ false } /> );

		// Modal should be removed
		expect( screen.queryByTestId( 'modal' ) ).not.toBeInTheDocument();
	} );
} );
