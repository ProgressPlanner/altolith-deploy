# Admin Bar

WordPress admin bar integration for quick access to publish functionality.

## Overview

The admin bar module adds a "Publish" button to the WordPress admin bar, allowing users to trigger static site generation and deployment from anywhere in the admin interface.

## Entry Point

**File:** `admin-bar.js` (webpack entry point)

**PHP Integration:**
- Enqueued by `AdminBar.php`
- Adds admin bar node with ID `wp-admin-bar-aether-publish`
- Visible on all admin pages when user has appropriate permissions

## Directory Structure

```
admin-bar/
├── AdminBarPublish.js   # Main entry point
└── components/
    └── AdminBarPublishModal.js  # Modal wrapper (in ../components/)
```

## Workflow

### 1. Button Click

User clicks "Publish" in WordPress admin bar.

### 2. Modal Mount

AdminBarPublish mounts `AdminBarPublishModal` component in a React portal.

### 3. Publish Workflow

`PublishProgressModal` executes the full publish workflow with progress display.

### 4. Completion

On successful deployment:
- Modal closes
- Admin bar "View Static Site" button is enabled
- Button URL is updated with deployment URL

## Components

### AdminBarPublish (Main Entry)

**Location:** `AdminBarPublish.js`

**Responsibilities:**
- Find admin bar publish button
- Attach click handler
- Create React portal container
- Mount/unmount modal component
- Update "View Site" button on completion

**Initialization:**
```javascript
function initAdminBarPublish() {
    const publishButton = document.querySelector(
        '#wp-admin-bar-aether-publish .ab-item'
    );

    if (!publishButton) {
        // Retry after delay (admin bar might not be loaded)
        setTimeout(initAdminBarPublish, 100);
        return;
    }

    // Attach click handler
    publishButton.addEventListener('click', handleClick, { capture: true });
}
```

### AdminBarPublishModal (Wrapper)

**Location:** `../components/AdminBarPublishModal.js`

**Responsibilities:**
- Manage modal state (open/close)
- Handle publish completion
- Update "View Static Site" button
- Cleanup after modal closes

**Props:**
- `onUnmount` (function) - Cleanup callback when modal is unmounted

## Admin Bar Nodes

WordPress admin bar has two Aether nodes:

### 1. Publish Button

**ID:** `wp-admin-bar-aether-publish`

**Attributes:**
- Title: "Publish Static Site"
- Icon: WordPress dashicon
- Click handler: Opens publish modal

### 2. View Site Button

**ID:** `wp-admin-bar-aether-view-site`

**Attributes:**
- Title: "View Static Site"
- Initially disabled (href="#", disabled class)
- Enabled after successful publish
- Links to deployment URL

**Update Function:**
```javascript
function updateViewSiteButton(deploymentUrl) {
    const viewSiteButton = document.querySelector(
        '#wp-admin-bar-aether-view-site .ab-item'
    );

    if (!viewSiteButton) return;

    if (deploymentUrl && deploymentUrl !== '#') {
        // Enable button
        viewSiteButton.href = deploymentUrl;
        viewSiteButton.target = '_blank';
        viewSiteButton.rel = 'noopener noreferrer';

        // Remove disabled class
        const parentLi = viewSiteButton.closest('li');
        if (parentLi) {
            parentLi.classList.remove('aether-disabled');
        }
    }
}
```

## Event Handling

### Click Event Capture

Uses capture phase to ensure handler runs first:

```javascript
publishButton.addEventListener(
    'click',
    (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Mount modal
        mountModal();
    },
    { capture: true }  // Capture phase
);
```

**Why capture phase?**
- Prevents default link behavior
- Stops event propagation early
- Ensures no other handlers interfere

### Duplicate Handler Prevention

```javascript
// Check if listener already attached
if (publishButton.dataset.aetherListenerAttached === 'true') {
    return;  // Already attached, skip
}

// Mark as attached
publishButton.dataset.aetherListenerAttached = 'true';

// Attach handler
publishButton.addEventListener(/* ... */);
```

## React Portal

Modal is rendered in a React portal for proper DOM placement:

```javascript
// Create container
const modalContainer = document.createElement('div');
modalContainer.id = 'aether-admin-bar-publish-modal';
modalContainer.className = 'aether-publish-modal-wrapper';
document.body.appendChild(modalContainer);

// Render React component
render(
    <AdminBarPublishModal onUnmount={handleUnmount} />,
    modalContainer
);
```

**Cleanup:**
```javascript
const handleUnmount = () => {
    if (modalContainer) {
        unmountComponentAtNode(modalContainer);
        modalContainer.remove();
        modalContainer = null;
    }
};
```

## Webpack Public Path

Critical for chunk loading to work correctly:

```javascript
// Set webpack publicPath before any imports
if (typeof __webpack_public_path__ !== 'undefined') {
    const pluginUrlMeta = document.querySelector('meta[name="aether-plugin-url"]');
    if (pluginUrlMeta) {
        __webpack_public_path__ =
            pluginUrlMeta.getAttribute('content') + 'assets/build/';
    }
}
```

**Why needed?**
- Webpack needs to know where to load dynamic chunks
- Admin bar script might be loaded from different paths
- Meta tag provides the correct plugin URL

## Provider Loading

Providers are loaded dynamically when modal opens:

```javascript
import { loadAllProviders } from '../providers/utils/providerLoader';

// Load providers (may already be loaded by PHP)
loadAllProviders().catch(() => {
    // Fail silently - providers may already be loaded
});
```

**Why dynamic loading?**
- Reduces initial bundle size for admin bar
- Providers only loaded when needed (publish button clicked)
- Fallback if PHP hasn't enqueued providers yet

## Integration with Publish Workflow

Admin bar modal uses the same publish workflow as the full-page publish interface:

```javascript
// Both use PublishProgressModal
import PublishProgressModal from '../publish/components/PublishProgressModal';

<PublishProgressModal
    isOpen={isOpen}
    onClose={handleClose}
    onComplete={handleComplete}
/>
```

**Shared workflow ensures:**
- Consistent behavior across interfaces
- Same step execution
- Same error handling
- Same progress reporting

## Styling

### Admin Bar Button

WordPress handles admin bar button styling via PHP:

```php
// AdminBar.php
$wp_admin_bar->add_node([
    'id'    => 'aether-publish',
    'title' => '<span class="ab-icon dashicons-upload"></span> Publish',
    'meta'  => ['class' => 'aether-admin-bar-publish'],
]);
```

### Modal

Modal uses WordPress Components styling (inherits from `PublishProgressModal`).

## Error Handling

### Button Not Found

```javascript
if (!publishButton) {
    // Retry after delay
    setTimeout(initAdminBarPublish, 100);
    return;
}
```

**Handles:**
- Admin bar not yet loaded
- DOM timing issues
- Script load order issues

### Publish Failures

Errors are handled by `PublishProgressModal`:

- Display error message in modal
- Option to retry
- Cancel button to close
- Error details for debugging

## Security

### Capability Checks

PHP ensures only authorized users see the button:

```php
// AdminBar.php
if (!current_user_can('manage_options')) {
    return;  // Don't add admin bar node
}
```

### Nonce Verification

All API requests include WordPress nonce (handled by `apiFetch`).

## Testing

### Manual Testing

1. Log in as administrator
2. Navigate to any admin page
3. Click "Publish" in admin bar
4. Verify modal opens
5. Complete publish workflow
6. Verify "View Site" button enables and links to deployment

### E2E Tests

```bash
npm run test:e2e -- --grep "admin bar"
```

## Future Improvements

### Planned Enhancements

1. **Status Indicator** - Show publish status in admin bar
2. **Quick Actions Menu** - Dropdown with common actions
3. **Deployment History** - Recent deployments in submenu
4. **Error Notifications** - Toast notifications for failures

## Troubleshooting

### Modal Doesn't Open

**Possible causes:**
1. Click handler not attached - Check console for errors
2. Provider loading failed - Check network tab for failed requests
3. React portal creation failed - Check for DOM manipulation conflicts

**Solutions:**
- Ensure webpack public path is set correctly
- Verify meta tag exists: `<meta name="aether-plugin-url" content="...">`
- Check for JavaScript errors in console

### "View Site" Button Not Updating

**Possible causes:**
1. Deployment URL not returned - Check API response
2. Button selector incorrect - Check admin bar HTML structure
3. CSS preventing class removal - Check for !important rules

**Solutions:**
- Verify `deploymentUrl` in publish completion handler
- Use browser dev tools to inspect button element
- Check for conflicting CSS rules

## Related Documentation

- [Main README](../README.md) - Source code overview
- [Publish README](../publish/README.md) - Publish workflow details
- [Components README](../components/README.md) - AdminBarPublishModal component
- [Providers README](../providers/README.md) - Provider integration
