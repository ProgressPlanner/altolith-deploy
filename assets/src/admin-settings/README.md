# Admin Settings

WordPress admin settings page for the Aether plugin.

## Overview

The admin settings page allows users to configure cloud providers, manage deployments, and view plugin status. Built with React and integrated into WordPress admin.

## Entry Point

**File:** `admin-settings.js` (webpack entry point)

**PHP Integration:**
- Enqueued by `SettingsPage.php`
- Mounted at `admin.php?page=aether-settings`
- Requires `manage_options` capability

## Directory Structure

```
admin-settings/
├── AdminSettings.js     # Main settings page component
├── ProviderSection.js   # Provider configuration section
├── SettingsModal.js     # Settings modal component
└── ...                  # Other settings components
```

## Main Components

### AdminSettings

Root component for the settings page.

**Responsibilities:**
- Tab navigation (Providers, Media, Static Site, etc.)
- Provider listing and management
- Connection testing
- Configuration saving

**Sections:**
1. **Providers** - Configure cloud providers
2. **Media Offload** - Configure automatic media offloading
3. **Static Site** - Static site deployment settings
4. **Advanced** - Developer options

### Provider Configuration

Settings page allows users to:

1. **Add Provider** - Select from available providers
2. **Configure** - Fill in provider-specific fields
3. **Test Connection** - Verify credentials work
4. **Save** - Persist configuration (encrypted for sensitive fields)
5. **Deploy** - Test deployment (if applicable)
6. **Delete** - Remove provider configuration

## Provider Integration

### Using Provider Hooks

```javascript
import { useProviderRegistry, useProvider } from '../hooks';

function ProviderSettings() {
    const { providers } = useProviderRegistry();
    const { config, saveConfig, testConnection } = useProvider(providerId);

    // Render provider config form
}
```

### Configuration Fields

Providers define their own configuration fields:

```javascript
// Provider defines fields
provider.getConfigFields(); // Returns array of field definitions

// Each field has:
{
    id: 'api_key',
    label: 'API Key',
    type: 'text',       // text, password, select, checkbox
    required: true,
    secure: true,        // Server-side encryption
    validation: {
        pattern: /^.{20,}$/,
        message: 'Must be at least 20 characters'
    }
}
```

### Field Rendering

Settings page dynamically renders fields based on provider definitions:

```javascript
provider.getConfigFields().map(field => {
    switch (field.type) {
        case 'text':
            return <TextControl {...field} />;
        case 'password':
            return <PasswordControl {...field} />;
        case 'select':
            return <SelectControl {...field} />;
        // etc.
    }
});
```

## State Management

### Local State

Component-level state for UI:

```javascript
const [activeTab, setActiveTab] = useState('providers');
const [selectedProvider, setSelectedProvider] = useState(null);
const [isTesting, setIsTesting] = useState(false);
```

### Provider State

Provider configuration managed by hooks:

```javascript
const { config, loading, error, saveConfig } = useProviderConfig(providerId);
```

### Global State (Planned Phase 3)

Will use Context API to reduce prop drilling:

```javascript
// Planned for Phase 3
const { settings, updateSettings } = useSettingsContext();
```

## Connection Testing

Test provider credentials before saving:

```javascript
const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
        const result = await provider.testConnection(config);

        if (result.success) {
            setTestResult({
                success: true,
                message: 'Connection successful!',
            });
        } else {
            setTestResult({
                success: false,
                message: result.error || 'Connection failed',
            });
        }
    } catch (error) {
        setTestResult({
            success: false,
            message: error.message,
        });
    } finally {
        setIsTesting(false);
    }
};
```

## Validation

### Client-Side Validation

Validate before saving:

```javascript
const validateConfig = (config, provider) => {
    const result = provider.validateConfig(config);

    if (!result.valid) {
        // Show errors
        Object.entries(result.errors).forEach(([field, message]) => {
            showFieldError(field, message);
        });
        return false;
    }

    return true;
};
```

### Server-Side Validation

PHP validates on save (backup for security):

```php
// ProviderConfigController.php
public function save_config($request) {
    $config = $request->get_json_params();

    // Validate required fields
    // Sanitize values
    // Encrypt sensitive fields
    // Save to database

    return rest_ensure_response($result);
}
```

## Styling

### WordPress Components

Uses `@wordpress/components` for consistent UI:

```javascript
import {
    Panel,
    PanelBody,
    PanelRow,
    Button,
    TextControl,
    SelectControl,
    Notice,
} from '@wordpress/components';

<Panel>
    <PanelBody title="Provider Settings">
        <PanelRow>
            <TextControl
                label="Account ID"
                value={config.account_id}
                onChange={(value) => setConfig({ ...config, account_id: value })}
            />
        </PanelRow>
        <Button isPrimary onClick={save}>
            Save Configuration
        </Button>
    </PanelBody>
</Panel>
```

### Custom Styles

All styling uses inline styles with design tokens from `utils/styles.js`:

```javascript
import { colors, spacing, fontSize, fontWeight, commonStyles } from '../utils/styles';

const sectionStyle = {
    ...commonStyles.section,
    padding: spacing.lg,
};

<div className="aether-admin-settings" style={ sectionStyle }>
    {/* Content */}
</div>
```

**Key Points:**
- Use design tokens (`colors`, `spacing`, `fontSize`, etc.) from `utils/styles.js`
- Apply styles via `style` prop
- Add BEM class names via `className` prop for semantic identification
- No CSS files - everything is JavaScript-based
- See `CLAUDE.md` for complete styling architecture documentation

## Internationalization

All user-facing text is translatable:

```javascript
import { __, sprintf } from '@wordpress/i18n';

<h2>{__('Provider Settings', 'aether')}</h2>
<p>
    {sprintf(
        __('Configure your %s provider', 'aether'),
        provider.getName()
    )}
</p>
```

## Error Handling

### User-Friendly Messages

```javascript
if (error) {
    return (
        <Notice status="error" isDismissible={false}>
            {__('Failed to load settings. Please try again.', 'aether')}
        </Notice>
    );
}
```

### Specific Error Cases

```javascript
try {
    await saveConfig(config);
    showSuccessNotice(__('Settings saved successfully', 'aether'));
} catch (error) {
    if (error.code === 'invalid_credentials') {
        showErrorNotice(__('Invalid credentials. Please check your API key.', 'aether'));
    } else if (error.code === 'network_error') {
        showErrorNotice(__('Network error. Please check your connection.', 'aether'));
    } else {
        showErrorNotice(__('An error occurred. Please try again.', 'aether'));
    }
}
```

## Security

### Capability Checks

PHP ensures only administrators can access:

```php
// SettingsPage.php
if (!current_user_can('manage_options')) {
    wp_die(__('You do not have sufficient permissions.'));
}
```

### Nonce Verification

REST API requests include nonce:

```javascript
import apiFetch from '../utils/api';

// Nonce automatically included
await apiFetch({
    path: '/wp-json/aether/site-exporter/providers/{providerId}/config',
    method: 'POST',
    data: config,
});
```

### Field Encryption

Sensitive fields encrypted server-side:

```javascript
// Mark fields as secure
{
    id: 'api_token',
    label: 'API Token',
    type: 'password',
    secure: true,  // Triggers server-side encryption
}
```

## Future Improvements

### Phase 4: Component Refactoring

- Extract ProviderSettings component
- Create ConfigurationSummary component
- Build ProviderDropdown component
- Add SettingsButton component

### Phase 3: State Management

- Implement SettingsContext
- Reduce prop drilling
- Centralize settings state

See `REFACTORING_PLAN.md` for details.

## Testing

### Manual Testing

1. Navigate to Settings > Aether
2. Add new provider
3. Fill in configuration fields
4. Test connection
5. Save configuration
6. Verify persistence after page reload

### E2E Tests

```bash
npm run test:e2e -- --grep "settings"
```

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Providers README](../providers/README.md) - Provider system
- [Hooks README](../hooks/README.md) - Settings hooks
- [Components README](../components/README.md) - Reusable components
