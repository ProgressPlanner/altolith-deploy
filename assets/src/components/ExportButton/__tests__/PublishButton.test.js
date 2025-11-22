/**
 * Tests for ExportButton Component
 *
 * @package
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ExportButton from '../index';

describe( 'ExportButton', () => {
	const defaultProps = {
		readiness: {
			ready: true,
			issues: [],
		},
		onPublishClick: jest.fn(),
		isPublishing: false,
	};

	beforeEach( () => {
		jest.clearAllMocks();
		// Mock window.aetherPublish
		window.aetherPublish = {
			adminUrl: '/wp-admin/admin.php?page=aether',
		};
	} );

	afterEach( () => {
		delete window.aetherPublish;
	} );

	it( 'should render publish button when ready', () => {
		render( <ExportButton { ...defaultProps } /> );

		expect( screen.getByText( 'Publish Site Now' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Your site is ready to publish!' )
		).toBeInTheDocument();
	} );

	it( 'should call onPublishClick when button is clicked', () => {
		const onPublishClick = jest.fn();
		render(
			<ExportButton
				{ ...defaultProps }
				onPublishClick={ onPublishClick }
			/>
		);

		const button = screen.getByText( 'Publish Site Now' );
		fireEvent.click( button );

		expect( onPublishClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should disable button when not ready', () => {
		render(
			<ExportButton
				{ ...defaultProps }
				readiness={ { ready: false, issues: [] } }
			/>
		);

		const button = screen.getByText( 'Publish Site Now' );
		expect( button ).toBeDisabled();
	} );

	it( 'should disable button when publishing', () => {
		render( <ExportButton { ...defaultProps } isPublishing={ true } /> );

		const button = screen.getByText( 'Publishing…' );
		expect( button ).toBeDisabled();
	} );

	it( 'should show issues when not ready', () => {
		const issues = [
			'No blueprint storage provider is selected.',
			'Provider is not configured.',
		];

		render(
			<ExportButton
				{ ...defaultProps }
				readiness={ { ready: false, issues } }
			/>
		);

		expect(
			screen.getByText(
				/Cannot publish - please fix the following issues/i
			)
		).toBeInTheDocument();
		expect( screen.getByText( issues[ 0 ] ) ).toBeInTheDocument();
		expect( screen.getByText( issues[ 1 ] ) ).toBeInTheDocument();
	} );

	it( 'should show dashboard link when not ready', () => {
		render(
			<ExportButton
				{ ...defaultProps }
				readiness={ { ready: false, issues: [ 'Test issue' ] } }
			/>
		);

		const dashboardLink = screen.getByText( 'Dashboard' );
		expect( dashboardLink ).toBeInTheDocument();
		expect( dashboardLink.closest( 'a' ) ).toHaveAttribute(
			'href',
			'/wp-admin/admin.php?page=aether'
		);
	} );

	it( 'should show publishing state', () => {
		render( <ExportButton { ...defaultProps } isPublishing={ true } /> );

		expect( screen.getByText( 'Publishing…' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'Publish Site Now' )
		).not.toBeInTheDocument();
	} );
} );
