/**
 * usePublishState Hook Tests
 *
 * @package
 */

import { renderHook } from '@testing-library/react';
import { usePublishState } from '../usePublishState';
import { usePublishContext } from '../../../hooks/usePublishContext';

jest.mock( '../../../hooks/usePublishContext' );

describe( 'usePublishState', () => {
	test( 'delegates to usePublishContext', () => {
		const mockContextValue = {
			state: { isPublishing: false },
			actions: { startPublish: jest.fn() },
		};

		usePublishContext.mockReturnValue( mockContextValue );

		const { result } = renderHook( () => usePublishState() );

		expect( usePublishContext ).toHaveBeenCalled();
		expect( result.current ).toEqual( mockContextValue );
	} );

	test( 'returns all context values', () => {
		const mockContextValue = {
			state: {
				isPublishing: true,
				currentStep: 'upload',
				progress: 50,
			},
			actions: {
				startPublish: jest.fn(),
				cancelPublish: jest.fn(),
			},
			error: null,
		};

		usePublishContext.mockReturnValue( mockContextValue );

		const { result } = renderHook( () => usePublishState() );

		expect( result.current ).toEqual( mockContextValue );
	} );
} );
