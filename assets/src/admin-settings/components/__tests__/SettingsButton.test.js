/**
 * Tests for SettingsButton Component
 *
 * @package
 */

import { render, screen, fireEvent } from '@testing-library/react';
import SettingsButton from '../SettingsButton';

describe( 'SettingsButton', () => {
	const defaultProps = {
		onClick: jest.fn(),
		disabled: false,
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render settings button', () => {
		render( <SettingsButton { ...defaultProps } /> );

		expect(
			screen.getByRole( 'button', { name: /configure/i } )
		).toBeInTheDocument();
	} );

	it( 'should call onClick when clicked', () => {
		const onClick = jest.fn();
		render( <SettingsButton { ...defaultProps } onClick={ onClick } /> );

		const button = screen.getByRole( 'button', { name: /configure/i } );
		fireEvent.click( button );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should be disabled when disabled prop is true', () => {
		render( <SettingsButton { ...defaultProps } disabled={ true } /> );

		const button = screen.getByRole( 'button', { name: /configure/i } );
		expect( button ).toBeDisabled();
	} );

	it( 'should not be disabled by default', () => {
		render( <SettingsButton { ...defaultProps } /> );

		const button = screen.getByRole( 'button', { name: /configure/i } );
		expect( button ).not.toBeDisabled();
	} );
} );
