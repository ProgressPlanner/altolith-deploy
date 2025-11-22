/**
 * Tests for ExportButton Component
 *
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ExportButton from '../index';

describe( 'ExportButton', () => {
	const defaultProps = {
		readiness: {
			ready: true,
			issues: [],
		},
		onExportClick: jest.fn(),
		isExporting: false,
	};

	beforeEach( () => {
		jest.clearAllMocks();
		// Mock window.aetherExport
		window.aetherExport = {
			adminUrl: '/wp-admin/admin.php?page=aether',
		};
	} );

	afterEach( () => {
		delete window.aetherExport;
	} );

	it( 'should render export button when ready', () => {
		render( <ExportButton { ...defaultProps } /> );

		expect( screen.getByText( 'Export Site Now' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Your site is ready to export!' )
		).toBeInTheDocument();
	} );

	it( 'should call onExportClick when button is clicked', () => {
		const onExportClick = jest.fn();
		render(
			<ExportButton { ...defaultProps } onExportClick={ onExportClick } />
		);

		const button = screen.getByText( 'Export Site Now' );
		fireEvent.click( button );

		expect( onExportClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should disable button when not ready', () => {
		render(
			<ExportButton
				{ ...defaultProps }
				readiness={ { ready: false, issues: [] } }
			/>
		);

		const button = screen.getByText( 'Export Site Now' );
		expect( button ).toBeDisabled();
	} );

	it( 'should disable button when exporting', () => {
		render( <ExportButton { ...defaultProps } isExporting={ true } /> );

		const button = screen.getByText( 'Exporting…' );
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
				/Cannot export - please fix the following issues/i
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

	it( 'should show exporting state', () => {
		render( <ExportButton { ...defaultProps } isExporting={ true } /> );

		expect( screen.getByText( 'Exporting…' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'Export Site Now' )
		).not.toBeInTheDocument();
	} );
} );
