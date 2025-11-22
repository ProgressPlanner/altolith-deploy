/**
 * Export Context
 *
 * Centralized export workflow state management using React Context API.
 * Provides global export state with step tracking, progress management, and status updates.
 *
 * @package
 */

import {
	createContext,
	useState,
	useCallback,
	useRef,
	useMemo,
} from '@wordpress/element';

/**
 * Export Context
 *
 * @type {Object}
 */
export const ExportContext = createContext( {
	steps: [],
	isExporting: false,
	jobId: null,
	finalStatus: null,
	error: null,
	currentStatusMessage: null,
	overallProgress: 0,
	staticSiteProviders: [],
	blueprintBundleProviders: [],
	initializeSteps: () => {},
	setStepStatus: () => {},
	setStepProgress: () => {},
	updateFromStep: () => {},
	markAllComplete: () => {},
	showError: () => {},
	setIsExporting: () => {},
	setJobId: () => {},
	setStatusMessage: () => {},
	setOverallProgressValue: () => {},
	updateMessage: () => {},
	removeMessage: () => {},
	setProviders: () => {},
	reset: () => {},
} );

/**
 * Export Provider Component
 *
 * Wraps the export workflow to provide global state management.
 * Features:
 * - Step tracking (pending, active, complete, error)
 * - Progress management (per-step and overall)
 * - Status messages
 * - Error handling
 * - Progress never goes backwards (monotonic increase)
 * - Retry support (can restart from earlier steps)
 *
 * @param {Object}      props          Component props
 * @param {JSX.Element} props.children Child components
 * @return {JSX.Element} Provider component
 */
export function ExportProvider( { children } ) {
	// Core state
	const [ steps, setSteps ] = useState( [] );
	const [ isExporting, setIsExporting ] = useState( false );
	const [ jobId, setJobId ] = useState( null );
	const [ finalStatus, setFinalStatus ] = useState( null );
	const [ error, setError ] = useState( null );
	const [ currentStatusMessage, setCurrentStatusMessage ] = useState( null );
	const [ overallProgress, setOverallProgress ] = useState( 0 );
	const [ messageHistory, setMessageHistory ] = useState( [] );
	const [ staticSiteProviders, setStaticSiteProviders ] = useState( [] );
	const [ blueprintBundleProviders, setBlueprintBundleProviders ] = useState(
		[]
	);

	// Track maximum progress to prevent progress from going backwards
	const maxProgressRef = useRef( 0 );

	/**
	 * Initialize steps from step definitions
	 *
	 * @param {Array<Object>} stepDefinitions Step definitions with id, label, supportsProgress
	 * @param {string|null}   initialStepId   Optional step ID to activate immediately
	 */
	const initializeSteps = useCallback(
		( stepDefinitions = [], initialStepId = null ) => {
			const newSteps = stepDefinitions.map( ( stepDef ) => ( {
				id: stepDef.id,
				label: stepDef.label,
				status: 'pending',
				supportsProgress: stepDef.supportsProgress || false,
				progress: 0,
			} ) );

			// If initialStepId is provided, activate it immediately
			let initialStepIndex = -1;
			if ( initialStepId ) {
				initialStepIndex = newSteps.findIndex(
					( s ) => s.id === initialStepId
				);
				if ( initialStepIndex !== -1 ) {
					newSteps[ initialStepIndex ].status = 'active';
				}
			}

			// Use functional update to ensure we're working with the latest state
			// This prevents race conditions with reset() or other state updates
			setSteps( () => newSteps );
			setError( null );
			setFinalStatus( null );
		},
		[]
	);

	/**
	 * Set status for a specific step
	 *
	 * @param {string} stepId       Step ID
	 * @param {string} status       Status: 'pending', 'active', 'complete', 'error'
	 * @param {string} errorMessage Error message (only used when status is 'error')
	 */
	const setStepStatus = useCallback(
		( stepId, status, errorMessage = '' ) => {
			setSteps( ( prevSteps ) =>
				prevSteps.map( ( step ) => {
					if ( step.id === stepId ) {
						return {
							...step,
							status,
							errorMessage:
								status === 'error' ? errorMessage : '',
						};
					}
					return step;
				} )
			);
		},
		[]
	);

	/**
	 * Set progress percentage for a specific step
	 *
	 * @param {string} stepId   Step ID
	 * @param {number} progress Progress percentage (0-100)
	 */
	const setStepProgress = useCallback( ( stepId, progress ) => {
		setSteps( ( prevSteps ) =>
			prevSteps.map( ( step ) => {
				if ( step.id === stepId ) {
					return {
						...step,
						progress: Math.max(
							0,
							Math.min( 100, Math.round( progress ) )
						),
					};
				}
				return step;
			} )
		);
	}, [] );

	/**
	 * Update state to reflect transition to a step
	 *
	 * Handles both forward progression and retry (backward) scenarios.
	 * When moving forward, marks previous steps as complete.
	 * When retrying, resets steps between current and target position.
	 *
	 * @param {string} backendStep Backend step ID to transition to
	 */
	const updateFromStep = useCallback(
		( backendStep ) => {
			// Use setSteps callback to access current steps state without dependency issues
			setSteps( ( prevSteps ) => {
				// Find step by backend name
				const step = prevSteps.find( ( s ) => s.id === backendStep );
				if ( ! step ) {
					return prevSteps; // No change
				}

				// Get step index
				const stepIndex = prevSteps.findIndex(
					( s ) => s.id === step.id
				);
				if ( stepIndex === -1 ) {
					return prevSteps; // No change
				}

				// Update steps based on progression direction
				const newSteps = prevSteps.map( ( s, i ) => {
					// Mark previous steps as complete
					if ( i < stepIndex && s.status !== 'complete' ) {
						return { ...s, status: 'complete' };
					}
					// Mark target step as active
					if ( i === stepIndex ) {
						return { ...s, status: 'active' };
					}
					return s;
				} );

				return newSteps;
			} );
		},
		[] // No dependencies - uses setSteps callback to access current state
	);

	/**
	 * Add message to activity log history
	 *
	 * @param {string}      message  Message text (can include HTML)
	 * @param {string}      type     Message type: 'info' | 'success' | 'error' | 'progress'
	 * @param {string|null} key      Optional key to identify message for later updates
	 * @param {*}           progress Optional progress value
	 * @param {Object}      metadata Optional metadata (e.g., provider info, file size)
	 */
	const addMessage = useCallback(
		(
			message,
			type = 'info',
			key = null,
			progress = undefined,
			metadata = undefined
		) => {
			setMessageHistory( ( prev ) => [
				{
					id: Date.now() + Math.random(),
					message,
					type,
					key,
					...( progress !== undefined && { progress } ), // Only include progress if provided
					...( metadata !== undefined && { metadata } ),
					timestamp: Date.now(),
				},
				...prev, // Prepend to show newest first
			] );
		},
		[]
	);

	/**
	 * Update existing message by key
	 *
	 * Finds a message with the given key and updates its message text, type, and/or progress.
	 * If no message with the key exists, does nothing.
	 *
	 * @param {string}      key        Message key to find
	 * @param {string|null} newMessage New message text (optional, keeps existing if null)
	 * @param {string|null} newType    New message type (optional, keeps existing if null)
	 * @param {Object|null} progress   Progress data { percent, loaded, total } (optional)
	 * @param {Object}      metadata   Optional metadata to merge (e.g., provider info)
	 */
	const updateMessage = useCallback(
		(
			key,
			newMessage = null,
			newType = null,
			progress = undefined,
			metadata = undefined
		) => {
			setMessageHistory( ( prev ) =>
				prev.map( ( item ) => {
					if ( item.key !== key ) {
						return item;
					}
					const updated = { ...item };
					if ( newMessage !== null ) {
						updated.message = newMessage;
					}
					if ( newType !== null ) {
						updated.type = newType;
					}
					// If progress is explicitly null, remove it. If undefined, don't update.
					if ( progress === null ) {
						delete updated.progress;
					} else if ( progress !== undefined ) {
						updated.progress = progress;
					}
					// Merge metadata - allow updating specific fields
					if ( metadata !== undefined ) {
						updated.metadata = {
							...( item.metadata || {} ),
							...metadata,
						};
					}
					return updated;
				} )
			);
		},
		[]
	);

	/**
	 * Remove message by key
	 *
	 * Removes a message with the given key from history.
	 *
	 * @param {string} key Message key to remove
	 */
	const removeMessage = useCallback( ( key ) => {
		setMessageHistory( ( prev ) =>
			prev.filter( ( item ) => item.key !== key )
		);
	}, [] );

	/**
	 * Mark all steps as complete
	 *
	 * Called when export workflow completes successfully.
	 *
	 * @param {Object} status Final status object (includes deployment URL, etc.)
	 */
	const markAllComplete = useCallback(
		( status = {} ) => {
			setSteps( ( prevSteps ) =>
				prevSteps.map( ( step ) => ( { ...step, status: 'complete' } ) )
			);
			setFinalStatus( status );
			setIsExporting( false );
			addMessage( 'Site exported successfully!', 'success' );
		},
		[ addMessage ]
	);

	/**
	 * Show error message and optionally mark step as failed
	 *
	 * @param {string}      errorMessage Error message to display
	 * @param {string|null} stepId       Step ID to mark as failed (optional)
	 */
	const showError = useCallback(
		( errorMessage, stepId = null ) => {
			setError( errorMessage );
			setIsExporting( false );
			addMessage( errorMessage, 'error' );
			if ( stepId ) {
				setStepStatus( stepId, 'error', errorMessage );
			}
		},
		[ addMessage, setStepStatus ]
	);

	/**
	 * Set current status message
	 *
	 * Also adds the message to activity log history.
	 * If a key is provided and a message with that key exists, updates it instead of adding new.
	 *
	 * @param {string}      message  Status message to display
	 * @param {string}      type     Message type: 'info' | 'success' | 'error' | 'progress'
	 * @param {string|null} key      Optional key to identify message for later updates
	 * @param {*}           progress Optional progress value
	 * @param {Object}      metadata Optional metadata (e.g., provider info, file size)
	 */
	const setStatusMessage = useCallback(
		(
			message,
			type,
			key = null,
			progress = undefined,
			metadata = undefined
		) => {
			setCurrentStatusMessage( message );
			if ( message ) {
				if ( key ) {
					// Check if message with this key already exists
					setMessageHistory( ( prev ) => {
						const existingIndex = prev.findIndex(
							( item ) => item.key === key
						);
						if ( existingIndex !== -1 ) {
							// Update existing message
							return prev.map( ( item, index ) => {
								if ( index !== existingIndex ) {
									return item;
								}
								const updated = {
									...item,
									message,
									type,
								};
								// If progress is explicitly null, remove it. If undefined, don't update.
								if ( progress === null ) {
									delete updated.progress;
								} else if ( progress !== undefined ) {
									updated.progress = progress;
								}
								// Merge metadata - allow updating specific fields
								if ( metadata !== undefined ) {
									updated.metadata = {
										...( item.metadata || {} ),
										...metadata,
									};
								}
								return updated;
							} );
						}
						// Add new message with key
						return [
							{
								id: Date.now() + Math.random(),
								message,
								type,
								key,
								...( progress !== undefined && { progress } ),
								...( metadata !== undefined && { metadata } ),
								timestamp: Date.now(),
							},
							...prev,
						];
					} );
				} else {
					// No key, just add message
					addMessage( message, type, null, progress, metadata );
				}
			}
		},
		[ addMessage ]
	);

	/**
	 * Set overall progress percentage
	 *
	 * Progress is monotonic - it never decreases.
	 * This prevents progress bar from jumping backwards.
	 *
	 * @param {number} progress Overall progress percentage (0-100)
	 */
	const setOverallProgressValue = useCallback( ( progress ) => {
		const roundedProgress = Math.max(
			0,
			Math.min( 100, Math.round( progress ) )
		);
		// Ensure progress never goes backwards
		if ( roundedProgress > maxProgressRef.current ) {
			maxProgressRef.current = roundedProgress;
		}
		setOverallProgress( maxProgressRef.current );
	}, [] );

	/**
	 * Set provider arrays
	 *
	 * @param {Array} staticProviders    Array of provider IDs for static site deployment
	 * @param {Array} blueprintProviders Array of provider IDs for blueprint bundle deployment
	 */
	const setProviders = useCallback(
		( staticProviders = [], blueprintProviders = [] ) => {
			setStaticSiteProviders( staticProviders );
			setBlueprintBundleProviders( blueprintProviders );
		},
		[]
	);

	/**
	 * Reset all export state to initial values
	 *
	 * Called when starting a new export or closing the export modal.
	 *
	 * @param {boolean} keepSteps If true, don't clear steps (useful when immediately reinitializing)
	 */
	const reset = useCallback( ( keepSteps = false ) => {
		if ( ! keepSteps ) {
			setSteps( [] );
		}
		setIsExporting( false );
		setJobId( null );
		setFinalStatus( null );
		setError( null );
		setCurrentStatusMessage( null );
		setOverallProgress( 0 );
		setMessageHistory( [] );
		setStaticSiteProviders( [] );
		setBlueprintBundleProviders( [] );
		maxProgressRef.current = 0;
	}, [] );

	// Provide context value
	const value = useMemo(
		() => ( {
			steps,
			isExporting,
			jobId,
			finalStatus,
			error,
			currentStatusMessage,
			overallProgress,
			messageHistory,
			staticSiteProviders,
			blueprintBundleProviders,
			initializeSteps,
			setStepStatus,
			setStepProgress,
			updateFromStep,
			markAllComplete,
			showError,
			setIsExporting,
			setJobId,
			setStatusMessage,
			setOverallProgressValue,
			addMessage,
			updateMessage,
			removeMessage,
			setProviders,
			reset,
		} ),
		[
			steps,
			isExporting,
			jobId,
			finalStatus,
			error,
			currentStatusMessage,
			overallProgress,
			messageHistory,
			staticSiteProviders,
			blueprintBundleProviders,
			initializeSteps,
			setStepStatus,
			setStepProgress,
			updateFromStep,
			markAllComplete,
			showError,
			setStatusMessage,
			setOverallProgressValue,
			addMessage,
			updateMessage,
			removeMessage,
			setProviders,
			reset,
		]
	);

	return (
		<ExportContext.Provider value={ value }>
			{ children }
		</ExportContext.Provider>
	);
}
