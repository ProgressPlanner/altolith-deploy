# JavaScript Testing Guide

## Overview

The JavaScript codebase has been migrated from vanilla JavaScript to React. Tests have been updated to use React Testing Library and Jest's React testing capabilities.

## Test Structure

### New Test Locations

- **React Components**: `tests/js/components/`
- **React Hooks**: `tests/js/hooks/`
- **Legacy Tests**: `tests/js/modules/`, `tests/js/services/`, `tests/js/utils/` (marked as obsolete)

### Testing React Components

We use `@testing-library/react` for testing React components. See [Jest React Testing Guide](https://jestjs.io/docs/tutorial-react) for details.

#### Example: Testing a Component

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../../../assets/src/components/MyComponent';

describe( 'MyComponent', () => {
	it( 'should render correctly', () => {
		render( <MyComponent prop="value" /> );
		expect( screen.getByText( 'Expected Text' ) ).toBeInTheDocument();
	} );
} );
```

#### Example: Testing a Hook

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '../../../assets/src/hooks/useMyHook';

describe( 'useMyHook', () => {
	it( 'should return expected value', async () => {
		const { result } = renderHook( () => useMyHook() );
		await waitFor( () => {
			expect( result.current.loading ).toBe( false );
		} );
		expect( result.current.data ).toBeDefined();
	} );
} );
```

## Mocking WordPress Components

WordPress components from `@wordpress/components` are automatically mocked in `tests/js/setup.js`. The mocks provide basic functionality for testing.

## Running Tests

```bash
# Run all JavaScript tests
npm run test:js

# Run specific test file
npm run test:js -- tests/js/components/ProviderSection.test.js

# Run tests in watch mode
npm run test:js:watch

# Run tests with coverage
npm run test:js:coverage
```

## Test Coverage

### ✅ Migrated to React Tests

- `ProviderSection` component
- `ExportProgressModal` component
- `useExportReadiness` hook
- `useUsageSummary` hook


These tests are kept for reference but should not be updated. New tests should be written for React components instead.

## Writing New Tests

When writing tests for new React components:

1. Place tests in `tests/js/components/` directory
2. Use `@testing-library/react` for rendering and interactions
3. Mock WordPress components and hooks as needed
4. Follow the existing test patterns in `ProviderSection.test.js` and `ExportProgressModal.test.js`

## Resources

- [Jest React Testing Guide](https://jestjs.io/docs/tutorial-react)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [WordPress Component Testing](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src)

