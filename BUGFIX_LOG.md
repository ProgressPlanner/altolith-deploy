# Bug Fix Log

## Bug #1: ProviderRegistry.getInstance is not a function

**Date:** November 18, 2025
**Severity:** Critical (blocks settings page)
**Status:** ✅ Fixed

### Symptoms
```
TypeError: registry_ProviderRegistry.getInstance is not a function
```

Error occurred when loading the Settings page in WordPress admin.

### Root Cause
In `ProviderSettings.js`, the code was:
```javascript
import ProviderRegistry from '../providers/registry/ProviderRegistry';

// Later in code:
const registry = ProviderRegistry.getInstance();  // ❌ Error!
```

The issue: `ProviderRegistry` (default export) is already the singleton instance, not the class. Calling `.getInstance()` on an instance doesn't work.

### Fix
Changed `ProviderSettings.js` to use the instance directly:

```javascript
import ProviderRegistry from '../providers/registry/ProviderRegistry';

// Use the instance directly (no .getInstance() call)
const allProviderIds = ProviderRegistry.getAllIds();  // ✅ Correct!
const provider = ProviderRegistry.get(id);  // ✅ Correct!
```

### Technical Details
The `ProviderRegistry.js` file exports two things:
1. **Default export:** The singleton instance (`export default ProviderRegistry.getInstance()`)
2. **Named export:** The class itself (`export { ProviderRegistry }`)

Usage patterns:
```javascript
// Pattern 1: Use singleton instance (default import)
import ProviderRegistry from '../providers/registry/ProviderRegistry';
ProviderRegistry.getAllIds();  // ✅ Works

// Pattern 2: Use class to get instance (named import)
import { ProviderRegistry } from '../providers/registry/ProviderRegistry';
const registry = ProviderRegistry.getInstance();
registry.getAllIds();  // ✅ Works
```

### Files Changed
- `/assets/src/admin-settings/ProviderSettings.js` - Fixed registry usage

### Build
- ✅ Rebuilt successfully
- ✅ No new warnings
- ✅ Bundle sizes unchanged

### Testing
After fix:
1. Load WordPress admin → Settings → Aether
2. Settings page should load without errors
3. All providers should be visible
4. No console errors

---

## Bug #2: Undefined colors.blue[50] style property

**Date:** November 18, 2025
**Severity:** Critical (blocks settings page)
**Status:** ✅ Fixed

### Symptoms
```
TypeError: undefined is not an object (evaluating 'colors.blue[50]')
```

Error occurred when rendering provider badges in ProviderSettings component.

### Root Cause
Code was trying to use nested color properties that don't exist:
```javascript
backgroundColor: colors.blue[50],   // ❌ colors.blue doesn't exist
color: colors.blue[700],            // ❌ colors.blue doesn't exist
```

The `colors` object in `utils/styles.js` doesn't have nested color scales like `blue[50]`. It only has flat color properties like `colors.primary`, `colors.info`, etc.

### Fix
Changed badge styles to use actual color values:
```javascript
backgroundColor: '#d7edff',  // ✅ Light blue (matches statusBadgeStyles.info)
color: '#135e96',            // ✅ Dark blue (matches statusBadgeStyles.info)
```

These colors match the existing `statusBadgeStyles.info` values in `utils/styles.js`.

### Files Changed
- `/assets/src/admin-settings/ProviderSettings.js` - Fixed badge styles

### Build
- ✅ Rebuilt successfully
- ✅ No new warnings

---

## Bug #3: Deployment type checkboxes not saving correctly (checkbox-group arrays)

**Date:** November 18, 2025
**Severity:** Critical (blocks core functionality)
**Status:** ✅ Fixed

### Symptoms
- Users can check deployment type checkboxes but they don't save correctly
- Only one checkbox value saves, or values are lost
- Export fails with "No providers enabled for blueprint bundle" and "No providers enabled for static site deployment"
- Settings appear to save but don't persist on reload

### Root Cause
The `sanitizeConfig()` method in `AbstractProvider.js` (lines 505-563) was missing a case for `checkbox-group` fields. When it encountered the `deployment_types` field (which is type `checkbox-group`), it fell through to the `default` case which converted the array to a string:

```javascript
default:
    value = String(value).trim();  // ❌ Converts ['static_site', 'blueprint_bundle'] to "static_site,blueprint_bundle"
    break;
```

The backend PHP then rejected the string and converted it to an empty array.

### Investigation Results
Using `wp option get aether_site_exporter_settings` revealed:
```json
{
    "deployment_types": ["static_site"]  // Only one value saved
}
```

This confirmed that arrays were being corrupted during sanitization.

### Fix
Added a new case in the `sanitizeConfig()` switch statement to properly handle `checkbox-group` fields:

```javascript
case 'checkbox-group':
    // Ensure value is an array and filter to valid options
    if (!Array.isArray(value)) {
        value = [];
    } else {
        // Validate against allowed options if defined
        const allowedOptions = (field.options || []).map(opt => opt.value);
        if (allowedOptions.length > 0) {
            value = value.filter(v => allowedOptions.includes(v));
        }
    }
    sanitized[fieldId] = value;
    continue;  // Skip the default assignment
```

This ensures:
- Arrays are preserved (not converted to strings)
- Values are validated against allowed options
- Multiple checkboxes can be selected and saved
- Empty arrays are handled gracefully

### Files Changed
- `/assets/src/providers/base/AbstractProvider.js` - Added checkbox-group case (lines 540-556)

### Build
- ✅ Rebuilt successfully
- ✅ No new errors or warnings

### Testing
After fix, users should be able to:
1. Check multiple deployment type checkboxes (Static Site AND Blueprint Bundle)
2. Save settings successfully
3. Reload page - both checkboxes remain checked
4. Export successfully without "No providers enabled" errors

---

*Fixes applied: November 18, 2025*
