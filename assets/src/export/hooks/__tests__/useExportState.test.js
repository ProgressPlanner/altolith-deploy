/**
 * useExportState Hook Tests
 *
 * @package
 */

import { renderHook } from '@testing-library/react';
import { useExportState } from '../useExportState';
import { useExportContext } from '../../../hooks/useExportContext';

jest.mock( '../../../hooks/useExportContext' );

describe( 'useExportState', () => {
	test( 'delegates to useExportContext', () => {
		const mockContextValue = {
			state: { isExporting: false },
			actions: { startExport: jest.fn() },
		};

		useExportContext.mockReturnValue( mockContextValue );

		const { result } = renderHook( () => useExportState() );

		expect( useExportContext ).toHaveBeenCalled();
		expect( result.current ).toEqual( mockContextValue );
	} );

	test( 'returns all context values', () => {
		const mockContextValue = {
			state: {
				isExporting: true,
				currentStep: 'upload',
				progress: 50,
			},
			actions: {
				startExport: jest.fn(),
				cancelPublish: jest.fn(),
			},
			error: null,
		};

		useExportContext.mockReturnValue( mockContextValue );

		const { result } = renderHook( () => useExportState() );

		expect( result.current ).toEqual( mockContextValue );
	} );
} );
