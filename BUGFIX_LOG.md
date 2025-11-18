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

## Bug #4: Only last deployment_type value saves to database (PHP sanitization bug)

**Date:** November 18, 2025
**Severity:** Critical (blocks core functionality - deployment types broken)
**Status:** ✅ Fixed

### Symptoms
- Users can check multiple deployment type checkboxes
- Frontend correctly creates array: `["static_site", "blueprint_bundle"]`
- Frontend correctly submits to API: `["static_site", "blueprint_bundle"]`
- Database only saves last value: `["blueprint_bundle"]`
- Export fails with "No providers enabled for blueprint bundle" or "No providers enabled for static site deployment"

### Root Cause
The `sanitizeConfig()` method in `SettingsController.php` (line 435-436) was processing `deployment_types` arrays recursively BEFORE applying the special validation logic:

**Order of Operations (WRONG)**:
1. Line 435: Detect `$value` is an array → `if (\is_array($value))`
2. Line 436: Recursively sanitize the array as if it's a nested object
3. During recursion, array `["static_site", "blueprint_bundle"]` is treated as `[0 => "static_site", 1 => "blueprint_bundle"]`
4. Each element gets processed separately, last element overwrites previous
5. Line 464-480: Special `deployment_types` validation runs, but TOO LATE - array already corrupted

The recursive call on line 436 was treating the simple string array as a nested associative array, processing each numeric key separately and causing only the last value to persist.

### Investigation Results
Console logs from frontend proved JavaScript was working perfectly:
```
[ProviderField] New value to save: ["static_site", "blueprint_bundle"] ✓
[ProviderForm] Submitting to API: {deployment_types: ["static_site", "blueprint_bundle"]} ✓
[ProviderForm] Save successful: {deployment_types: ["static_site", "blueprint_bundle"]} ✓
```

Database check revealed corruption happened in PHP:
```bash
wp option get aether_site_exporter_settings --format=json
# Result: {"deployment_types": ["blueprint_bundle"]}  # Only last value!
```

### Fix
Moved the `deployment_types` special validation to occur BEFORE the generic array recursion (line 435-451). Key changes:

1. **Check for `deployment_types` FIRST** (before `if (\is_array($value))`)
2. **Use `array_map('sanitize_text_field', $value)`** to sanitize each string element
3. **Skip recursive `sanitizeConfig()` call** using `continue` statement
4. **Preserve array structure** instead of treating it as a nested object

```php
// NEW: Handle deployment_types BEFORE generic array processing
if ($sanitizedKey === 'deployment_types') {
    $validDeploymentTypes = ['static_site', 'blueprint_bundle', 'edge_functions'];

    if (!\is_array($value)) {
        $sanitized[$sanitizedKey] = [];
    } else {
        // Sanitize each element, then filter to valid values
        $sanitizedValues = \array_map('sanitize_text_field', $value);
        $sanitized[$sanitizedKey] = \array_values(
            \array_intersect($sanitizedValues, $validDeploymentTypes)
        );
    }
    // Skip the rest of the loop
    continue;
}

// Generic array handling happens AFTER deployment_types is already handled
if (\is_array($value)) {
    $sanitized[$sanitizedKey] = $this->sanitizeConfig($value, $depth + 1);
}
```

### Files Changed
- `/includes/REST/SettingsController.php` - Moved deployment_types validation before array recursion (lines 435-451)

### Testing
After fix, users should be able to:
1. Check multiple deployment type checkboxes (Static Site AND Blueprint Bundle)
2. Save settings successfully
3. Reload page - both checkboxes remain checked
4. Verify in database: `wp option get aether_site_exporter_settings`
5. Export successfully without "No providers enabled" errors

---

*Fixes applied: November 18, 2025*
