/**
 * Export Context Tests
 *
 * Tests for ExportContext - centralized export workflow state management.
 *
 * Quality Standards:
 * - Tests must verify step tracking and state transitions
 * - Must test monotonic progress (never goes backwards)
 * - Must test message history management
 * - Must fail if state updates are incorrect
 *
 */

import { renderHook, act } from '@testing-library/react';
import { ExportProvider, ExportContext } from '../ExportContext';
import { useContext } from '@wordpress/element';

describe( 'ExportContext', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'ExportProvider', () => {
		it( 'should provide default context values', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			expect( result.current ).toHaveProperty( 'steps' );
			expect( result.current ).toHaveProperty( 'isExporting' );
			expect( result.current ).toHaveProperty( 'finalStatus' );
			expect( result.current ).toHaveProperty( 'error' );
			expect( result.current ).toHaveProperty( 'currentStatusMessage' );
			expect( result.current ).toHaveProperty( 'overallProgress' );
			expect( result.current ).toHaveProperty( 'messageHistory' );
			expect( result.current ).toHaveProperty( 'staticSiteProviders' );
			expect( result.current ).toHaveProperty(
				'blueprintBundleProviders'
			);
			expect( result.current ).toHaveProperty( 'initializeSteps' );
			expect( result.current ).toHaveProperty( 'setStepStatus' );
			expect( result.current ).toHaveProperty( 'setStepProgress' );
			expect( result.current ).toHaveProperty( 'updateFromStep' );
			expect( result.current ).toHaveProperty( 'markAllComplete' );
			expect( result.current ).toHaveProperty( 'showError' );
			expect( result.current ).toHaveProperty( 'setIsExporting' );
			expect( result.current ).toHaveProperty( 'setStatusMessage' );
			expect( result.current ).toHaveProperty(
				'setOverallProgressValue'
			);
			expect( result.current ).toHaveProperty( 'addMessage' );
			expect( result.current ).toHaveProperty( 'updateMessage' );
			expect( result.current ).toHaveProperty( 'removeMessage' );
			expect( result.current ).toHaveProperty( 'setProviders' );
			expect( result.current ).toHaveProperty( 'reset' );
		} );

		it( 'should have correct initial state', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			expect( result.current.steps ).toEqual( [] );
			expect( result.current.isExporting ).toBe( false );
			expect( result.current.finalStatus ).toBeNull();
			expect( result.current.error ).toBeNull();
			expect( result.current.currentStatusMessage ).toBeNull();
			expect( result.current.overallProgress ).toBe( 0 );
			expect( result.current.messageHistory ).toEqual( [] );
			expect( result.current.staticSiteProviders ).toEqual( [] );
			expect( result.current.blueprintBundleProviders ).toEqual( [] );
		} );
	} );

	describe( 'initializeSteps', () => {
		it( 'should initialize steps from definitions', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const stepDefinitions = [
				{
					id: 'step1',
					label: 'Step 1',
					supportsProgress: true,
				},
				{
					id: 'step2',
					label: 'Step 2',
					supportsProgress: false,
				},
				{
					id: 'step3',
					label: 'Step 3',
				},
			];

			act( () => {
				result.current.initializeSteps( stepDefinitions );
			} );

			expect( result.current.steps ).toHaveLength( 3 );
			expect( result.current.steps[ 0 ] ).toEqual( {
				id: 'step1',
				label: 'Step 1',
				status: 'pending',
				supportsProgress: true,
				progress: { current: 0, total: 0 },
				statusData: {},
				statusLabels: null,
				requires: {},
			} );
			expect( result.current.steps[ 1 ] ).toEqual( {
				id: 'step2',
				label: 'Step 2',
				status: 'pending',
				supportsProgress: false,
				progress: { current: 0, total: 0 },
				statusData: {},
				statusLabels: null,
				requires: {},
			} );
			expect( result.current.steps[ 2 ] ).toEqual( {
				id: 'step3',
				label: 'Step 3',
				status: 'pending',
				supportsProgress: false,
				progress: { current: 0, total: 0 },
				statusData: {},
				statusLabels: null,
				requires: {},
			} );
		} );

		it( 'should activate initial step when provided', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const stepDefinitions = [
				{ id: 'step1', label: 'Step 1' },
				{ id: 'step2', label: 'Step 2' },
				{ id: 'step3', label: 'Step 3' },
			];

			act( () => {
				result.current.initializeSteps( stepDefinitions, 'step2' );
			} );

			expect( result.current.steps[ 0 ].status ).toBe( 'pending' );
			expect( result.current.steps[ 1 ].status ).toBe( 'active' );
			expect( result.current.steps[ 2 ].status ).toBe( 'pending' );
		} );

		it( 'should reset error and finalStatus on initialization', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			// Set error and finalStatus
			act( () => {
				result.current.showError( 'Test error' );
				result.current.markAllComplete( {
					url: 'https://example.com',
				} );
			} );

			expect( result.current.error ).toBe( 'Test error' );
			expect( result.current.finalStatus ).toEqual( {
				url: 'https://example.com',
			} );

			// Initialize steps should reset
			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
			} );

			expect( result.current.error ).toBeNull();
			expect( result.current.finalStatus ).toBeNull();
		} );

		it( 'should handle empty step definitions', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [] );
			} );

			expect( result.current.steps ).toEqual( [] );
		} );

		it( 'should ignore invalid initialStepId', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const stepDefinitions = [
				{ id: 'step1', label: 'Step 1' },
				{ id: 'step2', label: 'Step 2' },
			];

			act( () => {
				result.current.initializeSteps(
					stepDefinitions,
					'non-existent-step'
				);
			} );

			// All steps should be pending
			expect( result.current.steps[ 0 ].status ).toBe( 'pending' );
			expect( result.current.steps[ 1 ].status ).toBe( 'pending' );
		} );
	} );

	describe( 'setStepStatus', () => {
		it( 'should set step status', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
			} );

			act( () => {
				result.current.setStepStatus( 'step1', 'active' );
			} );

			expect( result.current.steps[ 0 ].status ).toBe( 'active' );
		} );

		it( 'should set error message when status is error', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
			} );

			act( () => {
				result.current.setStepStatus(
					'step1',
					'error',
					'Test error message'
				);
			} );

			expect( result.current.steps[ 0 ].status ).toBe( 'error' );
			expect( result.current.steps[ 0 ].errorMessage ).toBe(
				'Test error message'
			);
		} );

		it( 'should clear error message when status is not error', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
			} );

			act( () => {
				result.current.setStepStatus(
					'step1',
					'error',
					'Error message'
				);
			} );

			expect( result.current.steps[ 0 ].errorMessage ).toBe(
				'Error message'
			);

			act( () => {
				result.current.setStepStatus( 'step1', 'active' );
			} );

			expect( result.current.steps[ 0 ].errorMessage ).toBe( '' );
		} );

		it( 'should not modify other steps', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
					{ id: 'step2', label: 'Step 2' },
					{ id: 'step3', label: 'Step 3' },
				] );
			} );

			act( () => {
				result.current.setStepStatus( 'step2', 'active' );
			} );

			expect( result.current.steps[ 0 ].status ).toBe( 'pending' );
			expect( result.current.steps[ 1 ].status ).toBe( 'active' );
			expect( result.current.steps[ 2 ].status ).toBe( 'pending' );
		} );

		it( 'should handle non-existent step ID gracefully', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
			} );

			act( () => {
				result.current.setStepStatus( 'non-existent', 'active' );
			} );

			// Original step should be unchanged
			expect( result.current.steps[ 0 ].status ).toBe( 'pending' );
		} );
	} );

	describe( 'setStepProgress', () => {
		it( 'should set step progress', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1', supportsProgress: true },
				] );
			} );

			act( () => {
				result.current.setStepProgress( 'step1', {
					current: 50,
					total: 100,
				} );
			} );

			expect( result.current.steps[ 0 ].progress ).toEqual( {
				current: 50,
				total: 100,
			} );
		} );

		it( 'should clamp progress to non-negative values', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1', supportsProgress: true },
				] );
			} );

			act( () => {
				result.current.setStepProgress( 'step1', {
					current: 150,
					total: 100,
				} );
			} );

			expect( result.current.steps[ 0 ].progress ).toEqual( {
				current: 150,
				total: 100,
			} );

			act( () => {
				result.current.setStepProgress( 'step1', {
					current: -10,
					total: 100,
				} );
			} );

			expect( result.current.steps[ 0 ].progress ).toEqual( {
				current: 0,
				total: 100,
			} );
		} );

		it( 'should accept decimal values for current and total', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1', supportsProgress: true },
				] );
			} );

			act( () => {
				result.current.setStepProgress( 'step1', {
					current: 45.7,
					total: 100,
				} );
			} );

			expect( result.current.steps[ 0 ].progress ).toEqual( {
				current: 45.7,
				total: 100,
			} );
		} );

		it( 'should not modify other steps', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1', supportsProgress: true },
					{ id: 'step2', label: 'Step 2', supportsProgress: true },
				] );
			} );

			act( () => {
				result.current.setStepProgress( 'step2', {
					current: 75,
					total: 100,
				} );
			} );

			expect( result.current.steps[ 0 ].progress ).toEqual( {
				current: 0,
				total: 0,
			} );
			expect( result.current.steps[ 1 ].progress ).toEqual( {
				current: 75,
				total: 100,
			} );
		} );
	} );

	describe( 'updateFromStep', () => {
		it( 'should activate target step without auto-completing previous steps', () => {
			// Note: updateFromStep no longer auto-completes previous steps
			// This was changed to support parallel step execution
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
					{ id: 'step2', label: 'Step 2' },
					{ id: 'step3', label: 'Step 3' },
					{ id: 'step4', label: 'Step 4' },
				] );
			} );

			act( () => {
				result.current.updateFromStep( 'step3' );
			} );

			// Previous steps remain pending (not auto-completed)
			expect( result.current.steps[ 0 ].status ).toBe( 'pending' );
			expect( result.current.steps[ 1 ].status ).toBe( 'pending' );
			// Target step is activated
			expect( result.current.steps[ 2 ].status ).toBe( 'active' );
			// Future steps remain pending
			expect( result.current.steps[ 3 ].status ).toBe( 'pending' );
		} );

		it( 'should not change already complete steps', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
					{ id: 'step2', label: 'Step 2' },
					{ id: 'step3', label: 'Step 3' },
				] );
			} );

			// Mark step1 as complete
			act( () => {
				result.current.setStepStatus( 'step1', 'complete' );
			} );

			act( () => {
				result.current.updateFromStep( 'step2' );
			} );

			// Step1 should remain complete
			expect( result.current.steps[ 0 ].status ).toBe( 'complete' );
			expect( result.current.steps[ 1 ].status ).toBe( 'active' );
		} );

		it( 'should handle transitioning to first step', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
					{ id: 'step2', label: 'Step 2' },
				] );
			} );

			act( () => {
				result.current.updateFromStep( 'step1' );
			} );

			expect( result.current.steps[ 0 ].status ).toBe( 'active' );
			expect( result.current.steps[ 1 ].status ).toBe( 'pending' );
		} );

		it( 'should handle non-existent step ID gracefully', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
					{ id: 'step2', label: 'Step 2' },
				] );
			} );

			act( () => {
				result.current.updateFromStep( 'non-existent' );
			} );

			// Steps should remain unchanged
			expect( result.current.steps[ 0 ].status ).toBe( 'pending' );
			expect( result.current.steps[ 1 ].status ).toBe( 'pending' );
		} );
	} );

	describe( 'markAllComplete', () => {
		it( 'should mark all steps as complete', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
					{ id: 'step2', label: 'Step 2' },
					{ id: 'step3', label: 'Step 3' },
				] );
			} );

			act( () => {
				result.current.markAllComplete();
			} );

			expect( result.current.steps[ 0 ].status ).toBe( 'complete' );
			expect( result.current.steps[ 1 ].status ).toBe( 'complete' );
			expect( result.current.steps[ 2 ].status ).toBe( 'complete' );
		} );

		it( 'should set finalStatus', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const finalStatus = {
				url: 'https://example.com',
				provider: 'local-filesystem',
			};

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
			} );

			act( () => {
				result.current.markAllComplete( finalStatus );
			} );

			expect( result.current.finalStatus ).toEqual( finalStatus );
		} );

		it( 'should set isExporting to false', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
				result.current.setIsExporting( true );
			} );

			expect( result.current.isExporting ).toBe( true );

			act( () => {
				result.current.markAllComplete();
			} );

			expect( result.current.isExporting ).toBe( false );
		} );

		it( 'should add success message to history', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
			} );

			act( () => {
				result.current.markAllComplete();
			} );

			expect( result.current.messageHistory ).toHaveLength( 1 );
			expect( result.current.messageHistory[ 0 ].message ).toBe(
				'Site exported successfully!'
			);
			expect( result.current.messageHistory[ 0 ].type ).toBe( 'success' );
		} );
	} );

	describe( 'showError', () => {
		it( 'should set error message', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.showError( 'Test error message' );
			} );

			expect( result.current.error ).toBe( 'Test error message' );
		} );

		it( 'should set isExporting to false', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setIsExporting( true );
			} );

			act( () => {
				result.current.showError( 'Error' );
			} );

			expect( result.current.isExporting ).toBe( false );
		} );

		it( 'should add error message to history', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.showError( 'Test error' );
			} );

			expect( result.current.messageHistory ).toHaveLength( 1 );
			expect( result.current.messageHistory[ 0 ].message ).toBe(
				'Test error'
			);
			expect( result.current.messageHistory[ 0 ].type ).toBe( 'error' );
		} );

		it( 'should mark step as error when stepId provided', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
			} );

			act( () => {
				result.current.showError( 'Step failed', 'step1' );
			} );

			expect( result.current.steps[ 0 ].status ).toBe( 'error' );
			expect( result.current.steps[ 0 ].errorMessage ).toBe(
				'Step failed'
			);
		} );

		it( 'should not mark step as error when stepId not provided', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
			} );

			act( () => {
				result.current.showError( 'General error' );
			} );

			expect( result.current.steps[ 0 ].status ).toBe( 'pending' );
		} );
	} );

	describe( 'setStatusMessage', () => {
		it( 'should set current status message', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setStatusMessage( 'Processing...', 'info' );
			} );

			expect( result.current.currentStatusMessage ).toBe(
				'Processing...'
			);
		} );

		it( 'should add message to history without key', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setStatusMessage( 'Test message', 'info' );
			} );

			expect( result.current.messageHistory ).toHaveLength( 1 );
			expect( result.current.messageHistory[ 0 ].message ).toBe(
				'Test message'
			);
			expect( result.current.messageHistory[ 0 ].type ).toBe( 'info' );
		} );

		it( 'should update existing message with key', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setStatusMessage(
					'Processing file 1',
					'info',
					'file-upload'
				);
			} );

			expect( result.current.messageHistory ).toHaveLength( 1 );

			act( () => {
				result.current.setStatusMessage(
					'Processing file 2',
					'info',
					'file-upload'
				);
			} );

			// Should still be 1 message (updated, not added)
			expect( result.current.messageHistory ).toHaveLength( 1 );
			expect( result.current.messageHistory[ 0 ].message ).toBe(
				'Processing file 2'
			);
		} );

		it( 'should add message with key if not existing', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setStatusMessage( 'Message 1', 'info', 'key1' );
			} );

			expect( result.current.messageHistory ).toHaveLength( 1 );
			expect( result.current.messageHistory[ 0 ].key ).toBe( 'key1' );
		} );

		it( 'should include progress when provided', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const progress = { percent: 50, loaded: 50, total: 100 };

			act( () => {
				result.current.setStatusMessage(
					'Uploading',
					'progress',
					'upload',
					progress
				);
			} );

			expect( result.current.messageHistory[ 0 ].progress ).toEqual(
				progress
			);
		} );

		it( 'should include metadata when provided', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const metadata = { provider: 'local-filesystem', fileSize: 1024 };

			act( () => {
				result.current.setStatusMessage(
					'Upload complete',
					'success',
					null,
					undefined,
					metadata
				);
			} );

			expect( result.current.messageHistory[ 0 ].metadata ).toEqual(
				metadata
			);
		} );

		it( 'should merge metadata when updating message', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setStatusMessage(
					'Upload',
					'info',
					'upload',
					undefined,
					{ provider: 'local-filesystem' }
				);
			} );

			act( () => {
				result.current.setStatusMessage(
					'Upload',
					'info',
					'upload',
					undefined,
					{ fileSize: 1024 }
				);
			} );

			expect( result.current.messageHistory[ 0 ].metadata ).toEqual( {
				provider: 'local-filesystem',
				fileSize: 1024,
			} );
		} );

		it( 'should not add message when message is empty', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setStatusMessage( '', 'info' );
			} );

			expect( result.current.messageHistory ).toHaveLength( 0 );
		} );
	} );

	describe( 'setOverallProgressValue', () => {
		it( 'should set overall progress', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setOverallProgressValue( 50 );
			} );

			expect( result.current.overallProgress ).toBe( 50 );
		} );

		it( 'should clamp progress to 0-100 range', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setOverallProgressValue( 150 );
			} );

			expect( result.current.overallProgress ).toBe( 100 );

			act( () => {
				result.current.reset();
				result.current.setOverallProgressValue( -10 );
			} );

			expect( result.current.overallProgress ).toBe( 0 );
		} );

		it( 'should round progress to integer', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setOverallProgressValue( 45.7 );
			} );

			expect( result.current.overallProgress ).toBe( 46 );
		} );

		it( 'should never decrease (monotonic)', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setOverallProgressValue( 70 );
			} );

			expect( result.current.overallProgress ).toBe( 70 );

			act( () => {
				result.current.setOverallProgressValue( 50 );
			} );

			// Progress should remain at 70, not decrease to 50
			expect( result.current.overallProgress ).toBe( 70 );
		} );

		it( 'should increase from previous maximum', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setOverallProgressValue( 30 );
			} );

			act( () => {
				result.current.setOverallProgressValue( 60 );
			} );

			act( () => {
				result.current.setOverallProgressValue( 90 );
			} );

			expect( result.current.overallProgress ).toBe( 90 );
		} );
	} );

	describe( 'addMessage', () => {
		it( 'should add message to history', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Test message', 'info' );
			} );

			expect( result.current.messageHistory ).toHaveLength( 1 );
			expect( result.current.messageHistory[ 0 ].message ).toBe(
				'Test message'
			);
			expect( result.current.messageHistory[ 0 ].type ).toBe( 'info' );
		} );

		it( 'should prepend messages (newest first)', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Message 1', 'info' );
			} );

			act( () => {
				result.current.addMessage( 'Message 2', 'info' );
			} );

			expect( result.current.messageHistory ).toHaveLength( 2 );
			expect( result.current.messageHistory[ 0 ].message ).toBe(
				'Message 2'
			);
			expect( result.current.messageHistory[ 1 ].message ).toBe(
				'Message 1'
			);
		} );

		it( 'should include key when provided', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Test', 'info', 'test-key' );
			} );

			expect( result.current.messageHistory[ 0 ].key ).toBe( 'test-key' );
		} );

		it( 'should include progress when provided', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Test', 'progress', null, {
					percent: 75,
				} );
			} );

			expect( result.current.messageHistory[ 0 ].progress ).toEqual( {
				percent: 75,
			} );
		} );

		it( 'should include metadata when provided', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Test', 'info', null, undefined, {
					provider: 'test',
				} );
			} );

			expect( result.current.messageHistory[ 0 ].metadata ).toEqual( {
				provider: 'test',
			} );
		} );

		it( 'should include timestamp', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const before = Date.now();

			act( () => {
				result.current.addMessage( 'Test', 'info' );
			} );

			const after = Date.now();

			expect(
				result.current.messageHistory[ 0 ].timestamp
			).toBeGreaterThanOrEqual( before );
			expect(
				result.current.messageHistory[ 0 ].timestamp
			).toBeLessThanOrEqual( after );
		} );
	} );

	describe( 'updateMessage', () => {
		it( 'should update message text by key', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage(
					'Original message',
					'info',
					'test-key'
				);
			} );

			act( () => {
				result.current.updateMessage( 'test-key', 'Updated message' );
			} );

			expect( result.current.messageHistory[ 0 ].message ).toBe(
				'Updated message'
			);
		} );

		it( 'should update message type by key', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Test', 'info', 'test-key' );
			} );

			act( () => {
				result.current.updateMessage( 'test-key', null, 'success' );
			} );

			expect( result.current.messageHistory[ 0 ].type ).toBe( 'success' );
		} );

		it( 'should update progress by key', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Test', 'progress', 'test-key', {
					percent: 50,
				} );
			} );

			act( () => {
				result.current.updateMessage( 'test-key', null, null, {
					percent: 75,
				} );
			} );

			expect( result.current.messageHistory[ 0 ].progress.percent ).toBe(
				75
			);
		} );

		it( 'should remove progress when explicitly null', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Test', 'progress', 'test-key', {
					percent: 50,
				} );
			} );

			act( () => {
				result.current.updateMessage( 'test-key', null, null, null );
			} );

			expect(
				result.current.messageHistory[ 0 ].progress
			).toBeUndefined();
		} );

		it( 'should merge metadata', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage(
					'Test',
					'info',
					'test-key',
					undefined,
					{ provider: 'test' }
				);
			} );

			act( () => {
				result.current.updateMessage(
					'test-key',
					null,
					null,
					undefined,
					{ fileSize: 1024 }
				);
			} );

			expect( result.current.messageHistory[ 0 ].metadata ).toEqual( {
				provider: 'test',
				fileSize: 1024,
			} );
		} );

		it( 'should do nothing for non-existent key', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Test', 'info', 'test-key' );
			} );

			act( () => {
				result.current.updateMessage( 'non-existent', 'New message' );
			} );

			// Original message unchanged
			expect( result.current.messageHistory[ 0 ].message ).toBe( 'Test' );
		} );
	} );

	describe( 'removeMessage', () => {
		it( 'should remove message by key', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Test 1', 'info', 'key1' );
				result.current.addMessage( 'Test 2', 'info', 'key2' );
			} );

			expect( result.current.messageHistory ).toHaveLength( 2 );

			act( () => {
				result.current.removeMessage( 'key1' );
			} );

			expect( result.current.messageHistory ).toHaveLength( 1 );
			expect( result.current.messageHistory[ 0 ].key ).toBe( 'key2' );
		} );

		it( 'should do nothing for non-existent key', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.addMessage( 'Test', 'info', 'test-key' );
			} );

			act( () => {
				result.current.removeMessage( 'non-existent' );
			} );

			expect( result.current.messageHistory ).toHaveLength( 1 );
		} );
	} );

	describe( 'setProviders', () => {
		it( 'should set static site providers', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const staticProviders = [ 'provider1', 'provider2' ];

			act( () => {
				result.current.setProviders( staticProviders, [] );
			} );

			expect( result.current.staticSiteProviders ).toEqual(
				staticProviders
			);
		} );

		it( 'should set blueprint bundle providers', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const blueprintProviders = [ 'provider3', 'provider4' ];

			act( () => {
				result.current.setProviders( [], blueprintProviders );
			} );

			expect( result.current.blueprintBundleProviders ).toEqual(
				blueprintProviders
			);
		} );

		it( 'should set both provider arrays', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const staticProviders = [ 'provider1' ];
			const blueprintProviders = [ 'provider2' ];

			act( () => {
				result.current.setProviders(
					staticProviders,
					blueprintProviders
				);
			} );

			expect( result.current.staticSiteProviders ).toEqual(
				staticProviders
			);
			expect( result.current.blueprintBundleProviders ).toEqual(
				blueprintProviders
			);
		} );

		it( 'should handle empty arrays', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setProviders( [], [] );
			} );

			expect( result.current.staticSiteProviders ).toEqual( [] );
			expect( result.current.blueprintBundleProviders ).toEqual( [] );
		} );
	} );

	describe( 'reset', () => {
		it( 'should reset all state to initial values', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			// Set various state
			act( () => {
				result.current.initializeSteps( [
					{ id: 'step1', label: 'Step 1' },
				] );
				result.current.setIsExporting( true );
				result.current.setStatusMessage( 'Processing', 'info' );
				result.current.setOverallProgressValue( 50 );
				result.current.setProviders( [ 'provider1' ], [ 'provider2' ] );
			} );

			// Reset
			act( () => {
				result.current.reset();
			} );

			expect( result.current.steps ).toEqual( [] );
			expect( result.current.isExporting ).toBe( false );
			expect( result.current.finalStatus ).toBeNull();
			expect( result.current.error ).toBeNull();
			expect( result.current.currentStatusMessage ).toBeNull();
			expect( result.current.overallProgress ).toBe( 0 );
			expect( result.current.messageHistory ).toEqual( [] );
			expect( result.current.staticSiteProviders ).toEqual( [] );
			expect( result.current.blueprintBundleProviders ).toEqual( [] );
		} );

		it( 'should keep steps when keepSteps is true', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			const steps = [ { id: 'step1', label: 'Step 1' } ];

			act( () => {
				result.current.initializeSteps( steps );
				result.current.setIsExporting( true );
			} );

			act( () => {
				result.current.reset( true );
			} );

			expect( result.current.steps ).toHaveLength( 1 );
			expect( result.current.isExporting ).toBe( false );
		} );

		it( 'should reset max progress ref', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setOverallProgressValue( 80 );
			} );

			expect( result.current.overallProgress ).toBe( 80 );

			act( () => {
				result.current.reset();
			} );

			// After reset, should be able to set lower progress
			act( () => {
				result.current.setOverallProgressValue( 20 );
			} );

			expect( result.current.overallProgress ).toBe( 20 );
		} );
	} );

	describe( 'setIsExporting', () => {
		it( 'should set isExporting flag', () => {
			const { result } = renderHook( () => useContext( ExportContext ), {
				wrapper: ExportProvider,
			} );

			act( () => {
				result.current.setIsExporting( true );
			} );

			expect( result.current.isExporting ).toBe( true );

			act( () => {
				result.current.setIsExporting( false );
			} );

			expect( result.current.isExporting ).toBe( false );
		} );
	} );
} );
