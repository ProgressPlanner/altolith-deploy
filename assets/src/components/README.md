# Components

Shared React components used across the Aether plugin.

## Overview

This directory contains reusable React components that are used by multiple features. Components should be extracted here when they:

1. Are used by 2+ different features
2. Have clear, well-defined responsibilities
3. Accept props for configuration (not hardcoded)
4. Have comprehensive JSDoc documentation

## Available Components

### UI Components

- **AddProviderInstanceModal** - Modal for adding new provider instances
- **CopyConfigDropdown** - Dropdown menu for copying provider configurations
- **ErrorBoundary** - React error boundary for graceful error handling
- **ExportConfigModal** - Modal for exporting configuration
- **ExportProgressModal** - Modal showing export progress
- **GlobalStepsProgress** - Global progress indicator for workflow steps
- **ImportConfigModal** - Modal for importing configuration
- **LoadingSpinner** - Consistent loading indicator
- **ModalActions** - Standard modal action buttons
- **ProgressBar** - Progress bar component
- **ProviderField** - Individual provider configuration field
- **ProviderForm** - Complete provider configuration form
- **ProviderInstanceItem** - Single provider instance in list
- **ProviderInstancesContainer** - Container for provider instances list
- **ProviderPill** - Provider type indicator pill
- **SectionHeader** - Section header with title
- **StatusNotice** - Status notification component
- **StepConnector** - Connector between workflow steps
- **StepNode** - Individual step in workflow visualization
- **VerticalStepper** - Vertical step progress indicator

## Component Guidelines

### File Structure

Each component is in its own directory:

```
components/
├── ComponentName/
│   ├── index.js      # Component implementation
│   └── __tests__/    # Component tests (optional)
```

### Code Structure

```javascript
/**
 * Component Name
 *
 * Brief description of component purpose and behavior.
 *
 * @package Aether
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Component Name
 *
 * Detailed description with usage examples.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Prop description
 * @param {Function} props.onAction - Callback description
 * @returns {JSX.Element} Rendered component
 */
export function ComponentName( { title, onAction } ) {
    // Component implementation
    return (
        <div>
            <h2>{title}</h2>
            <button onClick={onAction}>
                {__('Action', 'aether-site-exporter')}
            </button>
        </div>
    );
}
```

### Naming Conventions

- **PascalCase** for component directories and files: `ComponentName/index.js`
- **Named exports** for components: `export function ComponentName`
- **Descriptive names** that explain purpose

### Internationalization

Always use `@wordpress/i18n` for user-facing text:

```javascript
import { __, sprintf } from '@wordpress/i18n';

// Translate strings
const label = __('Save Changes', 'aether-site-exporter');

// Translate with placeholders
const message = sprintf(
    __('Uploaded %d files', 'aether-site-exporter'),
    fileCount
);
```

### Styling

Components use **inline styles exclusively** with design tokens from `utils/styles.js`:

```javascript
import { Modal, Button } from '@wordpress/components';
import { colors, spacing, fontSize } from '../utils/styles';

const containerStyle = {
    padding: spacing.lg,
    background: colors.white,
};

<Modal title={__('Title', 'aether-site-exporter')}>
    <div className="aether-component" style={ containerStyle }>
        <Button isPrimary>
            {__('Save', 'aether-site-exporter')}
        </Button>
    </div>
</Modal>
```

**Key Points:**
- All styling via `style` prop using design tokens
- BEM class names via `className` prop for semantic identification
- No CSS files - everything is JavaScript-based

## Testing Components

### Unit Tests

```bash
# Test all components
npm run test:js -- components

# Test specific component
npm run test:js -- components/LoadingSpinner
```

### Test Structure

```javascript
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
    it('should render correctly', () => {
        render(<LoadingSpinner />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
});
```

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Export README](../export/README.md) - Export workflow components
- [Admin Settings](../admin-settings/README.md) - Settings page components
