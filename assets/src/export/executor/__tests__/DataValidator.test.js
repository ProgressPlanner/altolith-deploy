/**
 * DataValidator Tests
 *
 * Tests for data dependency validation between workflow steps.
 * DataValidator ensures steps receive required data and provide declared outputs.
 *
 * These tests define the expected behavior - if implementation differs, fix the implementation.
 */

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text ) => text,
} ) );

import {
	isThreadStep,
	getProvideScope,
	validateScope,
	validate,
	validateOutput,
	getRequirementsSummary,
	getProvidesSummary,
} from '../DataValidator';

describe( 'DataValidator', () => {
	// ============================================================
	// isThreadStep - Determines if a step runs per-provider-thread
	// ============================================================
	describe( 'isThreadStep', () => {
		test( 'should return false for step with no requires', () => {
			const step = { id: 'testStep' };
			expect( isThreadStep( step ) ).toBe( false );
		} );

		test( 'should return false for step with empty requires', () => {
			const step = { id: 'testStep', requires: {} };
			expect( isThreadStep( step ) ).toBe( false );
		} );

		test( 'should return false for step requiring only global/initial data', () => {
			const step = {
				id: 'testStep',
				requires: {
					siteUrl: { from: 'initial', required: true },
					urls: { from: 'getStaticSiteUrls', required: true },
				},
			};
			expect( isThreadStep( step ) ).toBe( false );
		} );

		test( 'should return true for step requiring thread data', () => {
			const step = {
				id: 'uploadStaticFiles',
				requires: {
					currentProviderInstance: { from: 'thread', required: true },
					urls: { from: 'preScanStaticSite', required: true },
				},
			};
			expect( isThreadStep( step ) ).toBe( true );
		} );

		test( 'should return true if any requirement is from thread', () => {
			const step = {
				id: 'testStep',
				requires: {
					globalData: { from: 'initial', required: true },
					anotherGlobal: { from: 'someStep', required: true },
					threadData: { from: 'thread', required: true },
				},
			};
			expect( isThreadStep( step ) ).toBe( true );
		} );
	} );

	// ============================================================
	// getProvideScope - Determines scope of provided data
	// ============================================================
	describe( 'getProvideScope', () => {
		test( 'should return thread as default when provides is undefined', () => {
			const step = { id: 'testStep' };
			expect( getProvideScope( step, 'anyKey' ) ).toBe( 'thread' );
		} );

		test( 'should return thread as default when key not in provides', () => {
			const step = {
				id: 'testStep',
				provides: {
					otherKey: { type: 'object', scope: 'global' },
				},
			};
			expect( getProvideScope( step, 'missingKey' ) ).toBe( 'thread' );
		} );

		test( 'should return defined scope from provides', () => {
			const step = {
				id: 'testStep',
				provides: {
					globalData: { type: 'object', scope: 'global' },
					threadData: { type: 'object', scope: 'thread' },
				},
			};
			expect( getProvideScope( step, 'globalData' ) ).toBe( 'global' );
			expect( getProvideScope( step, 'threadData' ) ).toBe( 'thread' );
		} );

		test( 'should return thread when scope is not specified in definition', () => {
			const step = {
				id: 'testStep',
				provides: {
					data: { type: 'object' }, // No scope specified
				},
			};
			expect( getProvideScope( step, 'data' ) ).toBe( 'thread' );
		} );

		test( 'should throw error for invalid provides format (string)', () => {
			const step = {
				id: 'testStep',
				provides: {
					badData: 'string', // Invalid - should be object
				},
			};
			expect( () => getProvideScope( step, 'badData' ) ).toThrow(
				/invalid format/i
			);
		} );

		test( 'should throw error for invalid provides format (null)', () => {
			const step = {
				id: 'testStep',
				provides: {
					badData: null, // Invalid - should be object
				},
			};
			expect( () => getProvideScope( step, 'badData' ) ).toThrow(
				/invalid format/i
			);
		} );
	} );

	// ============================================================
	// validateScope - Ensures scope consistency between step type and outputs
	// ============================================================
	describe( 'validateScope', () => {
		test( 'should pass for step with no provides', () => {
			const step = { id: 'testStep' };
			expect( () => validateScope( step ) ).not.toThrow();
		} );

		test( 'should pass for global step providing global data', () => {
			const step = {
				id: 'globalStep',
				requires: {
					siteUrl: { from: 'initial', required: true },
				},
				provides: {
					urls: { type: 'array', scope: 'global' },
				},
			};
			expect( () => validateScope( step ) ).not.toThrow();
		} );

		test( 'should pass for thread step providing thread data', () => {
			const step = {
				id: 'threadStep',
				requires: {
					currentProviderInstance: { from: 'thread', required: true },
				},
				provides: {
					uploadResults: { type: 'object', scope: 'thread' },
				},
			};
			expect( () => validateScope( step ) ).not.toThrow();
		} );

		test( 'should throw error when thread step provides global data', () => {
			const step = {
				id: 'badThreadStep',
				requires: {
					currentProviderInstance: { from: 'thread', required: true },
				},
				provides: {
					globalData: { type: 'object', scope: 'global' },
				},
			};
			expect( () => validateScope( step ) ).toThrow(
				/scope inconsistencies/i
			);
			expect( () => validateScope( step ) ).toThrow(
				/globalData.*global scope.*thread step/i
			);
		} );

		test( 'should throw error when global step provides thread data', () => {
			const step = {
				id: 'badGlobalStep',
				requires: {
					siteUrl: { from: 'initial', required: true },
				},
				provides: {
					threadData: { type: 'object', scope: 'thread' },
				},
			};
			expect( () => validateScope( step ) ).toThrow(
				/scope inconsistencies/i
			);
			expect( () => validateScope( step ) ).toThrow(
				/threadData.*thread scope.*global step/i
			);
		} );

		test( 'should collect multiple scope errors', () => {
			const step = {
				id: 'badStep',
				requires: {
					currentProviderInstance: { from: 'thread', required: true },
				},
				provides: {
					badGlobal1: { type: 'object', scope: 'global' },
					badGlobal2: { type: 'array', scope: 'global' },
					goodThread: { type: 'string', scope: 'thread' },
				},
			};
			expect( () => validateScope( step ) ).toThrow( /badGlobal1/i );
			expect( () => validateScope( step ) ).toThrow( /badGlobal2/i );
		} );
	} );

	// ============================================================
	// validate - Checks required data exists in context before execution
	// ============================================================
	describe( 'validate', () => {
		test( 'should pass for step with no requires', () => {
			const step = { id: 'testStep' };
			const context = {};
			expect( () => validate( step, context ) ).not.toThrow();
		} );

		test( 'should pass when all required data is present', () => {
			const step = {
				id: 'testStep',
				requires: {
					urls: { from: 'getStaticSiteUrls', required: true },
					siteUrl: { from: 'initial', required: true },
				},
			};
			const context = {
				urls: [ 'http://example.com/' ],
				siteUrl: 'http://example.com',
			};
			expect( () => validate( step, context ) ).not.toThrow();
		} );

		test( 'should throw error when required data is missing', () => {
			const step = {
				id: 'uploadStaticFiles',
				requires: {
					urls: { from: 'preScanStaticSite', required: true },
					siteUrl: { from: 'initial', required: true },
				},
			};
			const context = {
				siteUrl: 'http://example.com', // urls is missing
			};
			expect( () => validate( step, context ) ).toThrow(
				/missing required data/i
			);
			expect( () => validate( step, context ) ).toThrow( /urls/i );
		} );

		test( 'should pass when optional data is missing', () => {
			const step = {
				id: 'testStep',
				requires: {
					requiredData: { from: 'initial', required: true },
					optionalData: { from: 'initial', required: false },
				},
			};
			const context = {
				requiredData: 'present',
				// optionalData is missing - that's OK
			};
			expect( () => validate( step, context ) ).not.toThrow();
		} );

		test( 'should list all missing required data in error', () => {
			const step = {
				id: 'testStep',
				requires: {
					data1: { from: 'step1', required: true },
					data2: { from: 'step2', required: true },
					data3: { from: 'step3', required: true },
				},
			};
			const context = {}; // All missing

			expect( () => validate( step, context ) ).toThrow( /data1/i );
			expect( () => validate( step, context ) ).toThrow( /data2/i );
			expect( () => validate( step, context ) ).toThrow( /data3/i );
		} );

		test( 'should include source step in error message', () => {
			const step = {
				id: 'testStep',
				requires: {
					urls: { from: 'getStaticSiteUrls', required: true },
				},
			};
			const context = {};

			expect( () => validate( step, context ) ).toThrow(
				/getStaticSiteUrls/i
			);
		} );

		test( 'should treat missing required field as required by default', () => {
			const step = {
				id: 'testStep',
				requires: {
					// No 'required' field specified - should default to required
					data: { from: 'someStep' },
				},
			};
			const context = {};

			// The implementation treats missing 'required' as required: true
			expect( () => validate( step, context ) ).toThrow(
				/missing required data/i
			);
		} );
	} );

	// ============================================================
	// validateOutput - Ensures step returned all declared provides
	// ============================================================
	describe( 'validateOutput', () => {
		test( 'should pass for step with no provides', () => {
			const step = { id: 'testStep' };
			const result = { someData: 'value' };
			expect( () => validateOutput( step, result ) ).not.toThrow();
		} );

		test( 'should pass when result is null/undefined and no provides', () => {
			const step = { id: 'testStep' };
			expect( () => validateOutput( step, null ) ).not.toThrow();
			expect( () => validateOutput( step, undefined ) ).not.toThrow();
		} );

		test( 'should pass when all declared outputs are provided', () => {
			const step = {
				id: 'testStep',
				provides: {
					urls: { type: 'array', scope: 'global' },
					staticSiteUrl: { type: 'string', scope: 'global' },
				},
			};
			const result = {
				urls: [ 'http://example.com/' ],
				staticSiteUrl: 'http://static.example.com',
			};
			expect( () => validateOutput( step, result ) ).not.toThrow();
		} );

		test( 'should throw error when declared output is missing', () => {
			const step = {
				id: 'uploadStaticFiles',
				provides: {
					staticUploadResults: { type: 'object', scope: 'thread' },
				},
			};
			const result = {
				// staticUploadResults is missing
				someOtherData: 'value',
			};
			expect( () => validateOutput( step, result ) ).toThrow(
				/did not provide/i
			);
			expect( () => validateOutput( step, result ) ).toThrow(
				/staticUploadResults/i
			);
		} );

		test( 'should list all missing outputs in error', () => {
			const step = {
				id: 'testStep',
				provides: {
					output1: { type: 'string', scope: 'global' },
					output2: { type: 'array', scope: 'global' },
					output3: { type: 'object', scope: 'global' },
				},
			};
			const result = {}; // All missing

			expect( () => validateOutput( step, result ) ).toThrow(
				/output1/i
			);
			expect( () => validateOutput( step, result ) ).toThrow(
				/output2/i
			);
			expect( () => validateOutput( step, result ) ).toThrow(
				/output3/i
			);
		} );

		test( 'should pass when result is null but provides is empty', () => {
			const step = { id: 'testStep', provides: {} };
			expect( () => validateOutput( step, null ) ).not.toThrow();
		} );

		test( 'should skip validation when result is null but provides exists', () => {
			// Edge case: If handler returns null, we don't validate
			// This allows early returns/errors to not trigger validation
			const step = {
				id: 'testStep',
				provides: {
					data: { type: 'object', scope: 'global' },
				},
			};
			expect( () => validateOutput( step, null ) ).not.toThrow();
		} );
	} );

	// ============================================================
	// getRequirementsSummary - Human-readable requirements list
	// ============================================================
	describe( 'getRequirementsSummary', () => {
		test( 'should return no requirements message for step with no requires', () => {
			const step = { id: 'testStep' };
			const summary = getRequirementsSummary( step );
			expect( summary ).toMatch( /no data requirements/i );
		} );

		test( 'should list all requirements with source and required status', () => {
			const step = {
				id: 'testStep',
				requires: {
					urls: { from: 'getStaticSiteUrls', required: true },
					optionalData: { from: 'initial', required: false },
				},
			};
			const summary = getRequirementsSummary( step );

			expect( summary ).toContain( 'urls' );
			expect( summary ).toContain( 'getStaticSiteUrls' );
			expect( summary ).toContain( 'required' );
			expect( summary ).toContain( 'optionalData' );
			expect( summary ).toContain( 'optional' );
		} );
	} );

	// ============================================================
	// getProvidesSummary - Human-readable provides list
	// ============================================================
	describe( 'getProvidesSummary', () => {
		test( 'should return no provides message for step with no provides', () => {
			const step = { id: 'testStep' };
			const summary = getProvidesSummary( step );
			expect( summary ).toMatch( /no data provided/i );
		} );

		test( 'should list all provides with type and scope', () => {
			const step = {
				id: 'testStep',
				provides: {
					urls: { type: 'array', scope: 'global' },
					results: { type: 'object', scope: 'thread' },
				},
			};
			const summary = getProvidesSummary( step );

			expect( summary ).toContain( 'urls' );
			expect( summary ).toContain( 'array' );
			expect( summary ).toContain( 'global' );
			expect( summary ).toContain( 'results' );
			expect( summary ).toContain( 'object' );
			expect( summary ).toContain( 'thread' );
		} );

		test( 'should throw error for invalid provides format', () => {
			const step = {
				id: 'testStep',
				provides: {
					badData: 'string', // Invalid
				},
			};
			expect( () => getProvidesSummary( step ) ).toThrow(
				/invalid format/i
			);
		} );

		test( 'should handle provides with no type specified', () => {
			const step = {
				id: 'testStep',
				provides: {
					data: { scope: 'global' }, // No type specified
				},
			};
			const summary = getProvidesSummary( step );
			expect( summary ).toContain( 'unknown' );
		} );
	} );

	// ============================================================
	// Edge Cases and Security
	// ============================================================
	describe( 'edge cases', () => {
		test( 'should handle step with undefined id gracefully in errors', () => {
			const step = {
				requires: {
					data: { from: 'initial', required: true },
				},
			};
			const context = {};

			// Should still throw, even without step.id
			expect( () => validate( step, context ) ).toThrow();
		} );

		test( 'should handle context with null values', () => {
			const step = {
				id: 'testStep',
				requires: {
					data: { from: 'initial', required: true },
				},
			};
			const context = { data: null }; // null is a valid value (key exists)

			expect( () => validate( step, context ) ).not.toThrow();
		} );

		test( 'should handle context with undefined values', () => {
			const step = {
				id: 'testStep',
				requires: {
					data: { from: 'initial', required: true },
				},
			};
			const context = { data: undefined }; // key exists but value is undefined

			// The 'in' operator checks for key presence, not value
			expect( () => validate( step, context ) ).not.toThrow();
		} );

		test( 'should handle result with null values in validateOutput', () => {
			const step = {
				id: 'testStep',
				provides: {
					data: { type: 'object', scope: 'global' },
				},
			};
			const result = { data: null }; // null is a valid output value

			expect( () => validateOutput( step, result ) ).not.toThrow();
		} );
	} );
} );
