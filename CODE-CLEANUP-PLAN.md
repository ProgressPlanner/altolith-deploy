# Plan: Code Cleanup and Simplification

## Overview

Remove dead code, unused exports, and simplify overly complex patterns. Goal is to reduce code size and maintenance burden without adding new abstractions.

---

## Part 1: Dead Code Removal (JavaScript)

### 1.1 Remove unused exports in `assets/src/utils/helpers.js`
- `parseJSONSafely()` - exported but never imported
- `deepMerge()` - exported but never imported

### 1.2 Remove unused constant in `assets/src/utils/constants.js`
- `MAX_PROGRESS` - exported but never used

### 1.3 Remove unused function in `assets/src/providers/utils/providerFamily.js`
- `isSameProviderFamily()` - exported but never imported (line ~100-105)

### 1.4 Delete empty directory
- `assets/src/components/SectionHeader/` - empty directory, no implementation

---

## Part 2: Dead Code Removal (PHP)

### 2.1 Delete entire unused class
- **File:** `includes/Utilities/HTTPClient.php` (entire file ~127 lines)
- **Also remove:** import in `includes/REST/Export/ExportStepsController.php` line 28

### 2.2 Remove unused methods in `includes/REST/RESTHelpersTrait.php`
- `checkRateLimit()` (lines 178-224) - never called
- `validateArrayComplexity()` (lines 113-165) - never called

### 2.3 Remove unused methods in `includes/Utilities/PathValidator.php`
- `getRelativePath()` (lines 266-311) - only used in tests, not production
- `joinPaths()` (lines 124-148) - only used in tests, not production
- `sanitizeFilename()` (lines 189-201) - never used anywhere

### 2.4 Remove unused method in `includes/Utilities/SecurityValidator.php`
- `validatePathComprehensive()` (lines 153-183) - never called

---

## Part 3: Code Simplification

### 3.1 Consolidate duplicate `formatFileSize` functions
**Problem:** Two implementations exist:
- `assets/src/utils/fileValidation.js` (lines 76-87)
- `assets/src/export/utils/helpers.js` (lines 15-33)

**Action:** Keep the one in `fileValidation.js`, remove from `helpers.js`, update imports.

### 3.2 Flatten nested null checks in `filesystemAdapter.js`
**File:** `assets/src/providers/services/filesystemAdapter.js` (lines 58-75)

**Before:**
```javascript
if (window.wp && window.wp.data && window.wp.data.dispatch) {
    const noticesDispatch = window.wp.data.dispatch('core/notices');
    if (noticesDispatch && typeof noticesDispatch === 'object') {
        const { createErrorNotice } = noticesDispatch;
        if (createErrorNotice && typeof createErrorNotice === 'function') {
            // ...
        }
    }
}
```

**After:**
```javascript
const createErrorNotice = window.wp?.data?.dispatch?.('core/notices')?.createErrorNotice;
if (typeof createErrorNotice === 'function') {
    // ...
}
```

### 3.3 Simplify redundant null checks in `CredentialEncryption.php`
**File:** `includes/Utilities/CredentialEncryption.php` (lines 161-169)

Remove double empty check (already checked in `isEncrypted()`).

---

## Part 4: Test Updates

After removing PathValidator methods, update or remove corresponding tests:
- `tests/Unit/Utilities/PathValidatorTest.php` - remove tests for deleted methods

---

## Files to Modify (Summary)

| Action | File |
|--------|------|
| DELETE | `includes/Utilities/HTTPClient.php` |
| DELETE | `assets/src/components/SectionHeader/` (directory) |
| EDIT | `includes/REST/Export/ExportStepsController.php` (remove import) |
| EDIT | `includes/REST/RESTHelpersTrait.php` (remove 2 methods) |
| EDIT | `includes/Utilities/PathValidator.php` (remove 3 methods) |
| EDIT | `includes/Utilities/SecurityValidator.php` (remove 1 method) |
| EDIT | `assets/src/utils/helpers.js` (remove 2 functions) |
| EDIT | `assets/src/utils/constants.js` (remove 1 constant) |
| EDIT | `assets/src/providers/utils/providerFamily.js` (remove 1 function) |
| EDIT | `assets/src/export/utils/helpers.js` (remove duplicate formatFileSize) |
| EDIT | `assets/src/providers/services/filesystemAdapter.js` (simplify) |
| EDIT | `includes/Utilities/CredentialEncryption.php` (simplify) |
| EDIT | `tests/Unit/Utilities/PathValidatorTest.php` (remove dead tests) |

---

## Execution Order

1. **PHP dead code first** (HTTPClient, RESTHelpersTrait methods, PathValidator methods, SecurityValidator method)
2. **JS dead code** (helpers.js, constants.js, providerFamily.js, empty SectionHeader dir)
3. **Consolidate formatFileSize** (remove duplicate, update imports)
4. **Simplify code** (filesystemAdapter.js null checks, CredentialEncryption.php)
5. **Update tests** (remove tests for deleted PathValidator methods)
6. **Run linters and tests** to verify nothing broke

---

## Verification

After each part:
- `composer phpstan` - PHP static analysis
- `composer check-cs` - PHP code style
- `npm run lint:js` - JS linting
- `npm run test:js` - JS tests
- `composer test` - PHP tests
- `npm run build:dev` - Build assets

---

## Estimated Impact

- **Lines removed:** ~400-500 lines
- **Files deleted:** 2 (HTTPClient.php, SectionHeader directory)
- **Risk level:** Low (all identified code is genuinely unused)
- **Tests:** Will need to remove tests for deleted methods

---

## Not Included (Future Refactoring Opportunities)

These were identified but excluded to keep scope manageable:

1. **EncryptionHelper trait** - Could be inlined into ProviderConfigController
2. **RESTHelpersTrait splitting** - Could be broken into focused utilities
3. **Duplicate deleteDirectory()** - Exists in 3 files, could be consolidated
4. **FileBatchService duplication** - `countFilesInDirectory` vs `countFilesInDirectoryWithExclusions`
