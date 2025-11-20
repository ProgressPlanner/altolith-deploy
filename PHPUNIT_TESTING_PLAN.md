# PHPUnit Testing Infrastructure Setup Plan

## Philosophy: Tests That Catch Bugs, Not Coverage Metrics

**Core Principle**: Write tests that verify intended functionality and prevent regressions. Coverage is a side effect of good testing, not the goal.

**Focus Areas**:
- Security boundaries (prevent vulnerabilities)
- Business logic (verify correct behavior)
- Error handling (ensure graceful failures)
- Edge cases that could break in production
- Integration points that could fail

---

## Phase 1: Infrastructure Setup

### 1.1 Install Dependencies
- Add `yoast/phpunit-polyfills` (WordPress compatibility)
- Add `wp-phpunit/wp-phpunit` (WordPress test framework)
- Add `mockery/mockery` (mocking)
- Add `brain/monkey` (WordPress function mocking)
- Update `composer.json` scripts:
  - `"test": "phpunit"`
  - `"test:unit": "phpunit --testsuite=unit"`
  - `"test:integration": "phpunit --testsuite=integration"`

### 1.2 Create PHPUnit Configuration
**File**: `phpunit.xml.dist`
```xml
- Test suites: unit, integration
- Bootstrap: tests/bootstrap.php
- Test directory: tests/
- Colors enabled
- Stop on failure for faster debugging
```

### 1.3 Create Test Bootstrap
**File**: `tests/bootstrap.php`
- Load Composer autoloader
- Initialize wp-phpunit
- Load plugin files
- Set up test constants

### 1.4 Create Test Structure
```
tests/
├── bootstrap.php
├── Unit/              # Isolated unit tests
├── Integration/       # Tests with WordPress
├── Fixtures/          # Test data
└── Helpers/           # Shared utilities
    └── TestCase.php   # Base test case
```

---

## Phase 2: Security-Critical Tests (Prevent Vulnerabilities)

### 2.1 PathValidator Tests
**File**: `tests/Unit/Utilities/PathValidatorTest.php`

**What We're Testing**: Path traversal prevention - attackers shouldn't access files outside allowed directories

**Critical Test Cases**:
```php
// Real attack vectors that must be blocked:
testRejectsBasicPathTraversal()           // ../../etc/passwd
testRejectsEncodedPathTraversal()         // ..%2F..%2Fetc%2Fpasswd
testRejectsDoubleEncodedPathTraversal()   // ..%252F..%252Fetc
testRejectsNullByteInjection()            // file.txt\0.php (bypass extension check)
testRejectsAbsolutePaths()                // /etc/passwd, C:\Windows\System32
testRejectsSymlinkEscape()                // Symlinks pointing outside base dir
testRejectsBackslashTraversal()           // ..\..\ (Windows)
testRejectsUnicodeTraversal()             // ‥/‥/ (Unicode lookalikes)

// Valid paths that should work:
testAllowsNormalRelativePaths()           // user/documents/file.txt
testAllowsSafeFilenames()                 // my-file_v2.txt
testAllowsDeepDirectories()               // a/b/c/d/e/file.txt

// Path operations must work correctly:
testJoinPathsSafely()                     // Joining shouldn't create traversal
testCalculatesRelativePathCorrectly()     // Path math must be accurate
testSanitizesFilenamesSecurely()          // Remove dangerous characters
```

**Why These Tests Matter**: Each test blocks a real attack vector. If any fail, the plugin has a security vulnerability.

---

### 2.2 CredentialEncryption Tests
**File**: `tests/Unit/Utilities/CredentialEncryptionTest.php`

**What We're Testing**: Credentials (API keys, passwords) are properly encrypted and can't be recovered if tampered with

**Critical Test Cases**:
```php
// Encryption must work correctly:
testEncryptDecryptRoundtrip()             // Data survives encrypt→decrypt
testEachEncryptionHasUniqueIV()           // Same data encrypted twice differs (prevent pattern analysis)
testEncryptedDataLooksRandom()            // No plaintext visible in encrypted output

// Security boundaries:
testRejectsDecryptionOfTamperedData()     // Modified ciphertext rejected
testRejectsDecryptionOfWrongFormat()      // Malformed data rejected
testRejectsDecryptionWithWrongKey()       // Can't decrypt with different key

// Edge cases that could break:
testHandlesEmptyString()                  // Empty credentials
testHandlesVeryLongData()                 // Large API keys/tokens
testHandlesSpecialCharacters()            // Unicode, emojis in passwords

// Key management:
testKeyGeneratedSecurely()                // Uses cryptographically secure random
testKeyPersistedAcrossCalls()             // Same key used consistently
testKeyRotationReencryptsData()           // Old data readable with new key
```

**Why These Tests Matter**: If encryption breaks, all stored credentials are at risk. If decryption accepts tampered data, attackers can inject malicious values.

---

### 2.3 SettingsController Tests
**File**: `tests/Integration/REST/SettingsControllerTest.php`

**What We're Testing**: User input is properly validated/sanitized before storage; malicious input can't break the system

**Critical Test Cases**:
```php
// DoS prevention:
testRejectsDeeplyNestedArrays()           // Prevent stack overflow (max depth 10)
testRejectsTooManyProviders()             // Limit 50 providers (prevent memory exhaustion)
testRejectsTooManyFieldsPerProvider()     // Limit 100 fields (prevent storage bloat)

// Data integrity:
testDeepMergePreservesExistingFields()    // Updating one field doesn't delete others
testDeepMergeHandlesArrayReplacements()   // Can replace entire arrays when needed
testSanitizationRemovesDangerousScripts() // Strip <script> tags from strings
testSanitizationNormalizesUrls()          // URLs properly formatted
testSanitizationHandlesEmptyValues()      // Empty values handled gracefully

// Validation:
testRejectsInvalidDeploymentTypes()       // Only 'static' or 'playground' allowed
testRejectsInvalidDataTypes()             // Boolean fields can't be strings
testValidatesRequiredFields()             // Missing required fields rejected

// Security:
testUnauthorizedUsersCantUpdate()         // Permission check works
testCredentialFieldsGetEncrypted()        // Sensitive fields encrypted before storage
testQueryingSpecificKeyWorks()            // Can retrieve single setting
```

**Why These Tests Matter**: This endpoint accepts arbitrary user input. Must verify it can't be used to DoS the server, inject malicious data, or bypass security.

---

## Phase 3: Business Logic Tests (Verify Correct Behavior)

### 3.1 JobStateManager Tests
**File**: `tests/Unit/Sync/JobStateManagerTest.php`

**What We're Testing**: Job state transitions work correctly, especially under concurrent access

**Critical Test Cases**:
```php
// State management:
testJobStartsInPendingState()             // Initial state correct
testValidTransitionsSucceed()             // pending→running→complete works
testInvalidTransitionsRejected()          // complete→running should fail
testJobStatusPersistedToTransient()       // State survives across requests

// Race conditions (critical for concurrent requests):
testIncrementRetryAtomic()                // Two simultaneous retries both increment (compare-and-swap)
testJobCompletionAtomic()                 // Only one request can mark complete
testConcurrentUpdatesConsistent()         // No lost updates when multiple processes update

// Error handling:
testFailedJobsRecordError()               // Error messages stored
testShouldRetryLogicCorrect()             // Retry only when appropriate (< max retries, transient errors)
testExhaustedRetriesStopRetrying()        // Don't retry forever

// Cleanup:
testExpiredJobsCleanedUp()                // Old jobs deleted (30 minute expiration)
testGetAllJobsLimitsSqlInjection()        // LIMIT parameter sanitized
```

**Why These Tests Matter**: Race conditions can cause lost job updates, duplicate work, or jobs stuck in wrong state. State machine bugs can break entire publish workflow.

---

### 3.2 ProviderRegistry Tests
**File**: `tests/Unit/Providers/ProviderRegistryTest.php`

**What We're Testing**: Provider system correctly discovers, registers, and retrieves providers and instances

**Critical Test Cases**:
```php
// Registry basics:
testSingletonInstanceConsistent()         // Same instance always returned
testProvidersDiscoveredViaFilter()        // 'aether_providers' filter works
testProvidersRegisteredCorrectly()        // Can register and retrieve

// Instance management:
testInstanceIdParsedCorrectly()           // "type:uuid" format parsed
testInvalidInstanceIdRejected()           // Malformed IDs rejected
testUuidGenerationUnique()                // No collisions in UUIDs
testGetProviderForInstanceWorks()         // Can find provider from instance ID

// Filtering:
testGetByDeploymentTypeFilters()          // Returns only matching providers
testGetEnabledInstanceFindsCorrectOne()   // Returns enabled instance for deployment type
testMultipleInstancesSameType()           // Can have 2+ instances of same provider
testDisabledInstancesNotReturned()        // Disabled instances excluded
```

**Why These Tests Matter**: If provider discovery fails, no exports work. If instance lookup breaks, users can't find their configurations. If filtering fails, wrong provider used for deployment.

---

### 3.3 FileManager Tests
**File**: `tests/Unit/Utilities/FileManagerTest.php`

**What We're Testing**: File operations work reliably, especially in ephemeral filesystems (WordPress Playground)

**Critical Test Cases**:
```php
// Reliability:
testRetryLogicRetriesTransientFailures()  // Retries on temporary failures
testRetryLogicStopsAfterMaxAttempts()     // Doesn't retry forever
testWriteVerifiesFileExists()             // Confirms write succeeded
testReadHandlesMissingFiles()             // Graceful error when file gone

// Tracking (Playground compatibility):
testFilesTrackedInTransient()             // File lifecycle tracked
testPersistenceVerificationDetectsEphemeral() // Warns if files disappear
testStaleFilesDetected()                  // Old tracked files cleaned up

// Operations:
testCopyVerifiesSuccess()                 // Copy confirmed before returning
testDeleteVerifiesSuccess()               // Deletion confirmed
testDirectoryCreatedWithPermissions()     // Correct permissions set
testMetadataExtractedCorrectly()          // Size, mtime accurate
```

**Why These Tests Matter**: In Playground's ephemeral filesystem, files can disappear unexpectedly. Must detect and handle this. Retry logic prevents transient failures from breaking exports.

---

### 3.4 TempDirectoryManager Tests
**File**: `tests/Unit/Utilities/TempDirectoryManagerTest.php`

**What We're Testing**: Temp files managed securely with automatic cleanup

**Critical Test Cases**:
```php
// Directory management:
testTempDirectoryUsesUploadsPath()        // Uses wp-content/uploads/aether-temp (Playground compatible)
testDirectoryCreatedIfMissing()           // Auto-creates on first use
testDirectoryProtectedWithHtaccess()      // .htaccess prevents web access
testPermissionsCorrect()                  // Directory writable by PHP

// File management:
testUniqueTempFilePath()                  // No collisions
testExpiredFilesCleanedUp()               // 24 hour expiration works
testCleanupOnlyDeletesTempFiles()         // Won't delete outside temp dir

// Security:
testCantDeleteOutsideTempDir()            // Path traversal prevented
testFilterOverrideWorks()                 // 'aether_site_exporter_temp_directory' filter
```

**Why These Tests Matter**: Temp files left on server waste disk space and could leak sensitive data. Must automatically clean up. Must prevent path traversal attacks via deleteFile().

---

## Phase 4: Integration Tests (Complete Workflows)

### 4.1 Provider Config Integration Tests
**File**: `tests/Integration/REST/ProviderConfigControllerTest.php`

**What We're Testing**: Complete provider configuration workflow including encryption

**Critical Test Cases**:
```php
// Full workflow:
testSaveAndRetrieveConfig()               // Save config, retrieve it back
testCredentialsEncryptedInStorage()       // Check database - credentials encrypted
testCredentialsDecryptedOnRetrieval()     // Retrieved config has plaintext credentials
testUpdateExistingConfig()                // Can update without losing data

// Instance management:
testMultipleInstancesSameProvider()       // Can configure multiple instances
testDeleteInstanceRemovesConfig()         // Deletion cleans up completely
testInvalidInstanceIdRejected()           // Bad instance IDs rejected

// Provider-specific validation:
testLocalProviderRequiresPath()           // Local provider validation works
testInvalidConfigRejected()               // Provider validators called
```

**Why These Tests Matter**: If save/retrieve doesn't work, users lose configurations. If encryption fails, credentials exposed in database. If deletion doesn't clean up, orphaned configs waste storage.

---

### 4.2 Export Workflow Integration Tests
**File**: `tests/Integration/Workflows/ExportWorkflowTest.php`

**What We're Testing**: Complete export workflow from start to finish

**Critical Test Cases**:
```php
// Full workflow:
testCompleteExportCreatesZip()            // Database + files exported
testExportContainsSqlFile()               // Database dump included
testExportContainsWpContentFiles()        // wp-content files included
testZipIntegrityValid()                   // ZIP not corrupted

// Filtering:
testExcludePatternsWork()                 // Excluded files not in export
testLargeFilesHandled()                   // Large sites don't timeout
testEmptyDirectoriesHandled()             // Edge case: empty dirs

// Error handling:
testDatabaseDumpFailureHandled()          // Graceful error if DB dump fails
testDiskSpaceErrorHandled()               // Error if disk full
testCleanupOnFailure()                    // Temp files cleaned up even on error

// Cleanup:
testTempFilesDeletedOnSuccess()           // No temp files left after success
```

**Why These Tests Matter**: Export is core functionality. Must verify it actually works end-to-end. Must verify cleanup happens so disk doesn't fill up.

---

### 4.3 Publish Workflow Integration Tests
**File**: `tests/Integration/Workflows/PublishWorkflowTest.php`

**What We're Testing**: Complete publish workflow including job state management

**Critical Test Cases**:
```php
// Job lifecycle:
testCreateJobStartsPending()              // Job created in pending state
testExecuteStepsTransitionsState()        // State transitions as steps execute
testCompletedJobFinalState()              // Job ends in completed state
testFailedJobRecordsError()               // Failures recorded with error message

// Step execution:
testStepsExecuteInOrder()                 // Steps run sequentially
testStepFailureStopsWorkflow()            // Failure in step stops workflow
testRetryLogicWorksForTransientFailures() // Transient failures retried

// Provider integration:
testPublishUsesCorrectProvider()          // Uses enabled provider instance
testPublishCallsProviderUpload()          // Provider's upload method called
testPublishHandlesProviderFailure()       // Provider failure handled gracefully
```

**Why These Tests Matter**: Publish is the entire point of the plugin. Must verify it works end-to-end. Must verify state management doesn't break under real workflow.

---

## Phase 5: REST API Integration Tests

### 5.1 REST API Integration Tests
**File**: `tests/Integration/REST/RESTAPIIntegrationTest.php`

**What We're Testing**: REST endpoints work correctly with authentication

**Critical Test Cases**:
```php
// Authentication:
testUnauthorizedRequestsRejected()        // Must be logged in
testAuthorizedRequestsWork()              // Logged in users can access

// CORS (Playground compatibility):
testCorsHeadersSentForPlayground()        // Playground origins allowed
testCorsBlocksUnknownOrigins()            // Unknown origins blocked

// Error handling:
testInvalidJsonRejected()                 // Malformed JSON returns 400
testMissingRequiredFieldsRejected()       // Validation errors return 400
testServerErrorsReturn500()               // Internal errors return 500
testErrorResponsesWellFormatted()         // Error messages consistent format

// Endpoints:
testSettingsEndpointWorks()               // GET/PUT /settings
testProviderConfigEndpointWorks()         // GET/POST /provider-config
testPublishJobEndpointWorks()             // POST /publish/jobs
```

**Why These Tests Matter**: REST API is how frontend communicates with backend. Must verify authentication works, CORS works for Playground, error handling works.

---

## Phase 6: Update CLAUDE.md Documentation

### 6.1 Update Development Commands Section
Add PHP test commands:
```bash
composer test              # Run all PHP tests
composer test:unit         # Run unit tests only
composer test:integration  # Run integration tests only
composer test -- --filter testName  # Run specific test
```

### 6.2 Add PHP Testing Guidelines Section
**Add after "Testing Philosophy" section**:

```markdown
### PHP Testing Best Practices

**Write tests that verify intended functionality:**
- Test what the code should DO, not what it currently does
- Think: "How could this break in production?"
- Focus on behavior, not implementation details

**Test Organization:**
- Unit tests: Test single class in isolation with mocked dependencies
- Integration tests: Test with real WordPress environment and database
- Use descriptive test names: `testRejectsPathTraversalAttacks()` not `testValidatePath()`

**What to Test:**
1. **Security boundaries** - Anything that prevents attacks
2. **Business logic** - Core functionality that must work correctly
3. **Error handling** - Failures must be handled gracefully
4. **Edge cases** - Unusual inputs that could break things
5. **Integration points** - Places where components interact

**What NOT to Test:**
- Simple getters/setters with no logic
- Private methods (test through public interface)
- Third-party library code
- WordPress core functions (assume they work)

**Using WP_UnitTestCase:**
```php
class MyControllerTest extends \WP_UnitTestCase {
    private $controller;

    public function setUp(): void {
        parent::setUp();
        $this->controller = new MyController();
    }

    public function testUnauthorizedAccessRejected() {
        // Arrange: No user logged in
        wp_set_current_user(0);

        // Act: Try to access protected endpoint
        $response = $this->controller->protectedAction();

        // Assert: Should be rejected
        $this->assertInstanceOf(\WP_Error::class, $response);
        $this->assertEquals('unauthorized', $response->get_error_code());
    }
}
```

**Coverage Notes:**
- Coverage is a side effect of good tests, not the goal
- 100% coverage doesn't mean bug-free code
- Focus on meaningful tests that catch real bugs
- It's okay to have <100% coverage if remaining code is trivial
```

### 6.3 Update Testing Philosophy Section
Add PHP example:
```markdown
**Example: PHP Tests That Catch Bugs**

```php
// ✅ GOOD: Tests intended functionality
public function testRejectsPathTraversalAttack() {
    $validator = new PathValidator();
    $result = $validator->validatePath('../../etc/passwd', '/var/www');
    $this->assertFalse($result, 'Should reject path traversal attacks');
}

// ✅ GOOD: Tests edge case that could break in production
public function testHandlesEmptyEncryptionInput() {
    $encryption = new CredentialEncryption();
    $encrypted = $encryption->encrypt('');
    $decrypted = $encryption->decrypt($encrypted);
    $this->assertEquals('', $decrypted, 'Empty strings should survive encryption roundtrip');
}

// ❌ BAD: Chasing coverage without testing real functionality
public function testGetterReturnsValue() {
    $obj = new MyClass();
    $obj->setValue('test');
    $this->assertEquals('test', $obj->getValue()); // Trivial test adds no value
}
```
```

### 6.4 Update Code Quality Standards Section
Add:
```markdown
- Run `composer test` before committing - all tests must pass
- Write tests for new functionality BEFORE implementation (TDD)
- Write tests for bug fixes to prevent regression
```

---

## Success Criteria

✅ **All tests pass** - No failing tests
✅ **Security boundaries tested** - Path traversal, encryption, input validation all verified
✅ **Core workflows tested** - Export, publish, provider management work end-to-end
✅ **Error handling tested** - Failures handled gracefully
✅ **Tests are maintainable** - Clear, focused, testing actual functionality
✅ **Tests are fast** - Full suite runs in < 2 minutes
✅ **CLAUDE.md updated** - Testing guidelines reflect focus on meaningful tests
✅ **Tests follow TDD principles** - Written to verify behavior, not chase coverage

---

## Estimated Deliverables

- **Configuration**: 3 files (composer.json, phpunit.xml.dist, bootstrap.php)
- **Security tests**: 3 files (~800 lines)
- **Business logic tests**: 5 files (~1,200 lines)
- **Integration tests**: 3 files (~900 lines)
- **Test helpers**: 2 files (~200 lines)
- **Fixtures**: Test data as needed
- **Documentation**: CLAUDE.md updates (~150 lines)
- **Total**: ~15 test files, ~3,100 lines of meaningful test code
