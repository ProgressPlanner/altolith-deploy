/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 264:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultProvider: () => (/* binding */ getDefaultProvider),
/* harmony export */   getProviderForDeploymentType: () => (/* binding */ getProviderForDeploymentType)
/* harmony export */ });
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(455);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_1__);
/**
 * Provider Discovery Utilities
 *
 * Helper functions for discovering and working with providers.
 *
 * @package
 */




/**
 * Get default provider ID.
 *
 * Uses filter to allow customization, then queries REST API (PHP registry).
 *
 * @return {Promise<string|null>} Default provider ID or null if none available
 */
async function getDefaultProvider() {
  // Try filter first (allows customization).
  const filtered = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.provider.getDefault', null);
  if (filtered) {
    return filtered;
  }

  // Get from REST API (which queries PHP registry).
  try {
    const response = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_1___default()({
      path: '/aether/site-exporter/providers'
    });
    if (response.success && response.providers && response.providers.length > 0) {
      // Return first provider that supports static_site, or first provider.
      const staticSiteProvider = response.providers.find(p => p.deployment_types && p.deployment_types.includes('static_site'));
      return staticSiteProvider ? staticSiteProvider.id : response.providers[0].id;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Aether] Failed to fetch default provider:', error);
  }
  return null;
}

/**
 * Get provider ID for a specific deployment type.
 *
 * @param {string} deploymentType Deployment type (e.g., 'static_site', 'blueprint_bundle')
 * @return {Promise<string|null>} Provider ID or null if none found
 */
async function getProviderForDeploymentType(deploymentType) {
  // Try filter first (allows customization).
  const filtered = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.provider.getForDeploymentType', null, deploymentType);
  if (filtered) {
    return filtered;
  }

  // Get from REST API (which queries PHP registry).
  try {
    const response = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_1___default()({
      path: `/aether/site-exporter/providers/by-deployment-type/${deploymentType}`
    });
    if (response.success && response.providers && response.providers.length > 0) {
      return response.providers[0].id;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[Aether] Failed to fetch provider for deployment type ${deploymentType}:`, error);
  }
  return null;
}

/***/ }),

/***/ 455:
/***/ ((module) => {

module.exports = window["wp"]["apiFetch"];

/***/ }),

/***/ 619:
/***/ ((module) => {

module.exports = window["wp"]["hooks"];

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "";
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// external ["wp","element"]
const external_wp_element_namespaceObject = window["wp"]["element"];
;// external ["wp","i18n"]
const external_wp_i18n_namespaceObject = window["wp"]["i18n"];
;// external ["wp","components"]
const external_wp_components_namespaceObject = window["wp"]["components"];
;// external "ReactJSXRuntime"
const external_ReactJSXRuntime_namespaceObject = window["ReactJSXRuntime"];
;// ./assets/src/contexts/PublishContext.js
/**
 * Publish Context
 *
 * Centralized publish workflow state management using React Context API.
 * Provides global publish state with step tracking, progress management, and status updates.
 *
 * @package
 */



/**
 * Publish Context
 *
 * @type {Object}
 */

const PublishContext = (0,external_wp_element_namespaceObject.createContext)({
  steps: [],
  isPublishing: false,
  jobId: null,
  finalStatus: null,
  error: null,
  currentStatusMessage: null,
  overallProgress: 0,
  initializeSteps: () => {},
  setStepStatus: () => {},
  setStepProgress: () => {},
  updateFromStep: () => {},
  markAllComplete: () => {},
  showError: () => {},
  setIsPublishing: () => {},
  setJobId: () => {},
  setStatusMessage: () => {},
  setOverallProgressValue: () => {},
  updateMessage: () => {},
  removeMessage: () => {},
  reset: () => {}
});

/**
 * Publish Provider Component
 *
 * Wraps the publish workflow to provide global state management.
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
function PublishProvider({
  children
}) {
  // Core state
  const [steps, setSteps] = (0,external_wp_element_namespaceObject.useState)([]);
  const [isPublishing, setIsPublishing] = (0,external_wp_element_namespaceObject.useState)(false);
  const [jobId, setJobId] = (0,external_wp_element_namespaceObject.useState)(null);
  const [finalStatus, setFinalStatus] = (0,external_wp_element_namespaceObject.useState)(null);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);
  const [currentStatusMessage, setCurrentStatusMessage] = (0,external_wp_element_namespaceObject.useState)(null);
  const [overallProgress, setOverallProgress] = (0,external_wp_element_namespaceObject.useState)(0);
  const [messageHistory, setMessageHistory] = (0,external_wp_element_namespaceObject.useState)([]);

  // Track maximum progress to prevent progress from going backwards
  const maxProgressRef = (0,external_wp_element_namespaceObject.useRef)(0);

  /**
   * Initialize steps from step definitions
   *
   * @param {Array<Object>} stepDefinitions Step definitions with id, label, supportsProgress
   * @param {string|null}   initialStepId   Optional step ID to activate immediately
   */
  const initializeSteps = (0,external_wp_element_namespaceObject.useCallback)((stepDefinitions = [], initialStepId = null) => {
    const newSteps = stepDefinitions.map(stepDef => ({
      id: stepDef.id,
      label: stepDef.label,
      status: 'pending',
      supportsProgress: stepDef.supportsProgress || false,
      progress: 0
    }));

    // If initialStepId is provided, activate it immediately
    let initialStepIndex = -1;
    if (initialStepId) {
      initialStepIndex = newSteps.findIndex(s => s.id === initialStepId);
      if (initialStepIndex !== -1) {
        newSteps[initialStepIndex].status = 'active';
      }
    }

    // Use functional update to ensure we're working with the latest state
    // This prevents race conditions with reset() or other state updates
    setSteps(() => newSteps);
    setError(null);
    setFinalStatus(null);
  }, []);

  /**
   * Set status for a specific step
   *
   * @param {string} stepId       Step ID
   * @param {string} status       Status: 'pending', 'active', 'complete', 'error'
   * @param {string} errorMessage Error message (only used when status is 'error')
   */
  const setStepStatus = (0,external_wp_element_namespaceObject.useCallback)((stepId, status, errorMessage = '') => {
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          status,
          errorMessage: status === 'error' ? errorMessage : ''
        };
      }
      return step;
    }));
  }, []);

  /**
   * Set progress percentage for a specific step
   *
   * @param {string} stepId   Step ID
   * @param {number} progress Progress percentage (0-100)
   */
  const setStepProgress = (0,external_wp_element_namespaceObject.useCallback)((stepId, progress) => {
    setSteps(prevSteps => prevSteps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          progress: Math.max(0, Math.min(100, Math.round(progress)))
        };
      }
      return step;
    }));
  }, []);

  /**
   * Update state to reflect transition to a step
   *
   * Handles both forward progression and retry (backward) scenarios.
   * When moving forward, marks previous steps as complete.
   * When retrying, resets steps between current and target position.
   *
   * @param {string} backendStep Backend step ID to transition to
   */
  const updateFromStep = (0,external_wp_element_namespaceObject.useCallback)(backendStep => {
    // Use setSteps callback to access current steps state without dependency issues
    setSteps(prevSteps => {
      // Find step by backend name
      const step = prevSteps.find(s => s.id === backendStep);
      if (!step) {
        return prevSteps; // No change
      }

      // Get step index
      const stepIndex = prevSteps.findIndex(s => s.id === step.id);
      if (stepIndex === -1) {
        return prevSteps; // No change
      }

      // Update steps based on progression direction
      const newSteps = prevSteps.map((s, i) => {
        // Mark previous steps as complete
        if (i < stepIndex && s.status !== 'complete') {
          return {
            ...s,
            status: 'complete'
          };
        }
        // Mark target step as active
        if (i === stepIndex) {
          return {
            ...s,
            status: 'active'
          };
        }
        return s;
      });
      return newSteps;
    });
  }, [] // No dependencies - uses setSteps callback to access current state
  );

  /**
   * Add message to activity log history
   *
   * @param {string}      message Message text (can include HTML)
   * @param {string}      type    Message type: 'info' | 'success' | 'error' | 'progress'
   * @param {string|null} key     Optional key to identify message for later updates
   */
  const addMessage = (0,external_wp_element_namespaceObject.useCallback)((message, type = 'info', key = null, progress = undefined) => {
    setMessageHistory(prev => [{
      id: Date.now() + Math.random(),
      message,
      type,
      key,
      ...(progress !== undefined && {
        progress
      }),
      // Only include progress if provided
      timestamp: Date.now()
    }, ...prev // Prepend to show newest first
    ]);
  }, []);

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
   */
  const updateMessage = (0,external_wp_element_namespaceObject.useCallback)((key, newMessage = null, newType = null, progress = undefined) => {
    setMessageHistory(prev => prev.map(item => {
      if (item.key !== key) {
        return item;
      }
      const updated = {
        ...item
      };
      if (newMessage !== null) {
        updated.message = newMessage;
      }
      if (newType !== null) {
        updated.type = newType;
      }
      // If progress is explicitly null, remove it. If undefined, don't update.
      if (progress === null) {
        delete updated.progress;
      } else if (progress !== undefined) {
        updated.progress = progress;
      }
      return updated;
    }));
  }, []);

  /**
   * Remove message by key
   *
   * Removes a message with the given key from history.
   *
   * @param {string} key Message key to remove
   */
  const removeMessage = (0,external_wp_element_namespaceObject.useCallback)(key => {
    setMessageHistory(prev => prev.filter(item => item.key !== key));
  }, []);

  /**
   * Mark all steps as complete
   *
   * Called when publish workflow completes successfully.
   *
   * @param {Object} status Final status object (includes deployment URL, etc.)
   */
  const markAllComplete = (0,external_wp_element_namespaceObject.useCallback)((status = {}) => {
    setSteps(prevSteps => prevSteps.map(step => ({
      ...step,
      status: 'complete'
    })));
    setFinalStatus(status);
    setIsPublishing(false);
    addMessage('Site published successfully!', 'success');
  }, [addMessage]);

  /**
   * Show error message and optionally mark step as failed
   *
   * @param {string}      errorMessage Error message to display
   * @param {string|null} stepId       Step ID to mark as failed (optional)
   */
  const showError = (0,external_wp_element_namespaceObject.useCallback)((errorMessage, stepId = null) => {
    setError(errorMessage);
    setIsPublishing(false);
    addMessage(errorMessage, 'error');
    if (stepId) {
      setStepStatus(stepId, 'error', errorMessage);
    }
  }, [addMessage, setStepStatus]);

  /**
   * Set current status message
   *
   * Also adds the message to activity log history.
   * If a key is provided and a message with that key exists, updates it instead of adding new.
   *
   * @param {string}      message Status message to display
   * @param {string}      type    Message type: 'info' | 'success' | 'error' | 'progress'
   * @param {string|null} key     Optional key to identify message for later updates
   */
  const setStatusMessage = (0,external_wp_element_namespaceObject.useCallback)((message, type, key = null, progress = undefined) => {
    setCurrentStatusMessage(message);
    if (message) {
      if (key) {
        // Check if message with this key already exists
        setMessageHistory(prev => {
          const existingIndex = prev.findIndex(item => item.key === key);
          if (existingIndex !== -1) {
            // Update existing message
            return prev.map((item, index) => {
              if (index !== existingIndex) {
                return item;
              }
              const updated = {
                ...item,
                message,
                type
              };
              // If progress is explicitly null, remove it. If undefined, don't update.
              if (progress === null) {
                delete updated.progress;
              } else if (progress !== undefined) {
                updated.progress = progress;
              }
              return updated;
            });
          }
          // Add new message with key
          return [{
            id: Date.now() + Math.random(),
            message,
            type,
            key,
            ...(progress !== undefined && {
              progress
            }),
            timestamp: Date.now()
          }, ...prev];
        });
      } else {
        // No key, just add message
        addMessage(message, type, null, progress);
      }
    }
  }, [addMessage]);

  /**
   * Set overall progress percentage
   *
   * Progress is monotonic - it never decreases.
   * This prevents progress bar from jumping backwards.
   *
   * @param {number} progress Overall progress percentage (0-100)
   */
  const setOverallProgressValue = (0,external_wp_element_namespaceObject.useCallback)(progress => {
    const roundedProgress = Math.max(0, Math.min(100, Math.round(progress)));
    // Ensure progress never goes backwards
    if (roundedProgress > maxProgressRef.current) {
      maxProgressRef.current = roundedProgress;
    }
    setOverallProgress(maxProgressRef.current);
  }, []);

  /**
   * Reset all publish state to initial values
   *
   * Called when starting a new publish or closing the publish modal.
   *
   * @param {boolean} keepSteps If true, don't clear steps (useful when immediately reinitializing)
   */
  const reset = (0,external_wp_element_namespaceObject.useCallback)((keepSteps = false) => {
    if (!keepSteps) {
      setSteps([]);
    }
    setIsPublishing(false);
    setJobId(null);
    setFinalStatus(null);
    setError(null);
    setCurrentStatusMessage(null);
    setOverallProgress(0);
    setMessageHistory([]);
    maxProgressRef.current = 0;
  }, []);

  // Provide context value
  const value = (0,external_wp_element_namespaceObject.useMemo)(() => ({
    steps,
    isPublishing,
    jobId,
    finalStatus,
    error,
    currentStatusMessage,
    overallProgress,
    messageHistory,
    initializeSteps,
    setStepStatus,
    setStepProgress,
    updateFromStep,
    markAllComplete,
    showError,
    setIsPublishing,
    setJobId,
    setStatusMessage,
    setOverallProgressValue,
    addMessage,
    updateMessage,
    removeMessage,
    reset
  }), [steps, isPublishing, jobId, finalStatus, error, currentStatusMessage, overallProgress, messageHistory, initializeSteps, setStepStatus, setStepProgress, updateFromStep, markAllComplete, showError, setStatusMessage, setOverallProgressValue, addMessage, updateMessage, removeMessage, reset]);
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(PublishContext.Provider, {
    value: value,
    children: children
  });
}
;// ./assets/src/hooks/usePublishContext.js
/**
 * usePublishContext Hook
 *
 * Hook to consume the PublishContext.
 * Provides access to global publish workflow state and operations.
 *
 * @package
 */




/**
 * Hook to access publish context
 *
 * Must be used within a PublishProvider.
 *
 * @throws {Error} If used outside PublishProvider
 * @return {Object} Publish context value
 * @property {Array}    steps                   - All workflow steps
 * @property {boolean}  isPublishing            - Publishing flag
 * @property {string}   jobId                   - Current job ID
 * @property {Object}   finalStatus             - Final status object (null if not complete)
 * @property {string}   error                   - Error message (null if no error)
 * @property {string}   currentStatusMessage    - Current status message
 * @property {number}   overallProgress         - Overall progress percentage (0-100)
 * @property {Function} initializeSteps         - Initialize steps from definitions
 * @property {Function} setStepStatus           - Set status for a specific step
 * @property {Function} setStepProgress         - Set progress for a specific step
 * @property {Function} updateFromStep          - Transition to a step
 * @property {Function} markAllComplete         - Mark all steps complete
 * @property {Function} showError               - Show error message
 * @property {Function} setIsPublishing         - Set publishing flag
 * @property {Function} setJobId                - Set job ID
 * @property {Function} setStatusMessage        - Set status message
 * @property {Function} setOverallProgressValue - Set overall progress
 * @property {Function} addMessage              - Add a message to history
 * @property {Function} updateMessage           - Update existing message by key
 * @property {Function} removeMessage           - Remove message by key
 * @property {Function} reset                   - Reset all state
 *
 * @example
 * function PublishButton() {
 *     const { isPublishing, startPublish } = usePublishContext();
 *
 *     return (
 *         <button onClick={startPublish} disabled={isPublishing}>
 *             {isPublishing ? 'Publishing...' : 'Publish'}
 *         </button>
 *     );
 * }
 *
 * @example
 * // Get steps for display
 * function ProgressSteps() {
 *     const { steps } = usePublishContext();
 *
 *     return (
 *         <ul>
 *             {steps.map(step => (
 *                 <li key={step.id}>
 *                     {step.label} - {step.status}
 *                 </li>
 *             ))}
 *         </ul>
 *     );
 * }
 *
 * @example
 * // Update step progress
 * function useWorkflowStep() {
 *     const { setStepProgress, updateFromStep } = usePublishContext();
 *
 *     const runStep = async (stepId) => {
 *         updateFromStep(stepId);
 *         setStepProgress(stepId, 50);
 *         await doWork();
 *         setStepProgress(stepId, 100);
 *     };
 *
 *     return { runStep };
 * }
 */
function usePublishContext() {
  const context = (0,external_wp_element_namespaceObject.useContext)(PublishContext);
  if (!context) {
    throw new Error('usePublishContext must be used within a PublishProvider');
  }
  return context;
}
/* harmony default export */ const hooks_usePublishContext = ((/* unused pure expression or super */ null && (usePublishContext)));
;// ./assets/src/publish/hooks/usePublishState.js
/**
 * Publish State Hook
 *
 * Wrapper hook that provides publish state from PublishContext.
 * Delegates to centralized state management.
 *
 * @package
 */



/**
 * Get publish workflow state
 *
 * Returns all publish state and operations from context.
 * Simplified from 202 lines to delegate to PublishContext.
 *
 * @return {Object} Publish state and operations
 */
function usePublishState() {
  return usePublishContext();
}
// EXTERNAL MODULE: external ["wp","apiFetch"]
var external_wp_apiFetch_ = __webpack_require__(455);
var external_wp_apiFetch_default = /*#__PURE__*/__webpack_require__.n(external_wp_apiFetch_);
;// ./assets/src/utils/getRestUrl.js
/**
 * Get REST API URL Utility
 *
 * Reads the REST API base URL from the meta tag or returns a default.
 * This ensures WordPress Playground scoped URLs work correctly.
 *
 * @package
 */

/**
 * Get REST API URL from meta tag or default.
 *
 * @return {string} REST API base URL.
 */
function getRestUrl() {
  const metaTag = document.querySelector('meta[name="aether-rest-url"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '/wp-json/aether/site-exporter/';
  }
  return '/wp-json/aether/site-exporter/';
}
;// ./assets/src/utils/api.js
/**
 * API Fetch Utility
 *
 * Enhanced wrapper around @wordpress/api-fetch with:
 * - Request deduplication (prevents concurrent identical requests)
 * - Response caching with TTL (GET requests only)
 * - Nonce handling from meta tags
 * - Auth header utilities for external APIs
 *
 * @package
 */




/**
 * Create authorization headers for external API calls.
 *
 * Utility for building consistent Authorization headers.
 *
 * @param {string} token API token or key.
 * @param {string} type  Auth type (default: 'Bearer').
 * @return {Object} Headers object with Authorization and Content-Type.
 */
function createAuthHeaders(token, type = 'Bearer') {
  return {
    Authorization: `${type} ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Get REST API nonce from meta tag or default.
 *
 * @return {string} REST API nonce.
 */
function getNonce() {
  const metaTag = document.querySelector('meta[name="aether-rest-nonce"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '';
  }
  return '';
}

/**
 * Request deduplication middleware
 *
 * Prevents concurrent identical requests by returning the same Promise
 * for duplicate in-flight requests.
 *
 * Uses request key (method + path + data) to identify duplicates.
 */
const pendingRequests = new Map();
function createRequestKey(options) {
  const method = options.method || 'GET';
  const path = options.path || '';
  const data = options.data ? JSON.stringify(options.data) : '';
  return `${method}:${path}:${data}`;
}
const requestDeduplicationMiddleware = (options, next) => {
  const requestKey = createRequestKey(options);

  // Check if this request is already in flight
  if (pendingRequests.has(requestKey)) {
    // Return the existing Promise
    return pendingRequests.get(requestKey);
  }

  // Make the request
  const promise = next(options);

  // Store the Promise
  pendingRequests.set(requestKey, promise);

  // Clean up when request completes (success or error)
  // Use finally() to guarantee cleanup regardless of outcome
  promise.finally(() => {
    pendingRequests.delete(requestKey);
  });
  return promise;
};

/**
 * Response caching middleware
 *
 * Caches GET request responses with TTL to reduce redundant API calls.
 *
 * Cache format: Map<requestKey, {response, timestamp}>
 * TTL: Configurable per endpoint (default: 5 minutes)
 */
const responseCache = new Map();

// Cache configuration with endpoint-specific TTLs
const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000,
  // 5 minutes default
  endpointTTLs: {
    '/assets': 10 * 60 * 1000,
    // 10 minutes - asset lists change infrequently
    '/settings': 1 * 60 * 1000,
    // 1 minute - settings may change
    '/config': 30 * 60 * 1000,
    // 30 minutes - static configuration
    '/check-wporg': 60 * 60 * 1000 // 60 minutes - WordPress.org data rarely changes
  },
  // Set to true to bypass cache (useful for development/testing)
  bypassCache: false
};

/**
 * Get cache TTL for a specific request path.
 *
 * @param {string} path Request path to check.
 * @return {number} TTL in milliseconds.
 */
function getCacheTTL(path) {
  if (CACHE_CONFIG.bypassCache) {
    return 0;
  }

  // Check if path matches any endpoint-specific TTL
  for (const [endpoint, ttl] of Object.entries(CACHE_CONFIG.endpointTTLs)) {
    if (path && path.includes(endpoint)) {
      return ttl;
    }
  }
  return CACHE_CONFIG.defaultTTL;
}
function isCacheValid(cacheEntry, path) {
  if (!cacheEntry) {
    return false;
  }
  const ttl = getCacheTTL(path);
  if (ttl === 0) {
    // Cache bypass enabled
    return false;
  }
  const age = Date.now() - cacheEntry.timestamp;
  return age < ttl;
}
const responseCachingMiddleware = (options, next) => {
  const method = options.method || 'GET';

  // Only cache GET requests
  if (method !== 'GET') {
    return next(options);
  }
  const requestKey = createRequestKey(options);
  const cached = responseCache.get(requestKey);

  // Return cached response if valid (pass path for TTL calculation)
  if (isCacheValid(cached, options.path)) {
    return Promise.resolve(cached.response);
  }

  // Make the request
  const promise = next(options);

  // Cache successful responses
  promise.then(response => {
    responseCache.set(requestKey, {
      response,
      timestamp: Date.now()
    });
    return response;
  }).catch(error => {
    // Don't cache errors
    throw error;
  });
  return promise;
};

/**
 * Invalidate cache for a specific path or all cached responses
 *
 * @param {string|null} path Optional path to invalidate (invalidates all if not provided)
 */
function invalidateCache(path = null) {
  if (path) {
    // Invalidate all cache entries matching this path
    for (const [key] of responseCache.entries()) {
      if (key.includes(path)) {
        responseCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    responseCache.clear();
  }
}

/**
 * Set the API nonce for authenticated requests.
 *
 * @param {string} nonce WordPress REST API nonce.
 */
function setAPINonce(nonce) {
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createNonceMiddleware(nonce));
}

/**
 * Configure API fetch with base URL, nonce, and middleware.
 * Automatically fetches from meta tags if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from meta if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from meta if not provided).
 */
function configureAPI(restUrl, nonce) {
  const url = restUrl || getRestUrl();
  const token = nonce || getNonce();
  external_wp_apiFetch_default().use(external_wp_apiFetch_default().createRootURLMiddleware(url));
  if (token) {
    setAPINonce(token);
  }

  // Add custom middleware (order matters: caching before deduplication)
  external_wp_apiFetch_default().use(responseCachingMiddleware);
  external_wp_apiFetch_default().use(requestDeduplicationMiddleware);
}

// Auto-configure on module load.
configureAPI();
/* harmony default export */ const utils_api = ((external_wp_apiFetch_default()));
;// ./assets/src/constants/api.js
/**
 * API Constants
 *
 * Centralized API endpoints and configuration for WordPress REST API
 *
 * @package
 */

/**
 * WordPress REST API namespace for Aether plugin
 * @constant {string}
 */
const API_NAMESPACE = 'aether/site-exporter';

/**
 * Base path for all Aether REST API endpoints
 * Note: Does not include /wp-json/ prefix as that's handled by apiFetch root URL middleware
 * @constant {string}
 */
const API_BASE_PATH = API_NAMESPACE;

/**
 * REST API Endpoints
 *
 * All WordPress REST API endpoints used throughout the application.
 * Use these constants instead of hardcoded strings.
 */
const ENDPOINTS = {
  /**
   * Settings endpoints
   */
  SETTINGS: `${API_BASE_PATH}/settings`,
  SETTINGS_GET: `${API_BASE_PATH}/settings`,
  SETTINGS_UPDATE: `${API_BASE_PATH}/settings`,
  /**
   * Publish workflow endpoints
   */
  PUBLISH: {
    START: `${API_BASE_PATH}/publish`,
    STATUS: `${API_BASE_PATH}/publish/status`,
    STEPS: `${API_BASE_PATH}/publish/steps`,
    STEP: stepId => `${API_BASE_PATH}/publish/steps/${stepId}`,
    CANCEL: `${API_BASE_PATH}/publish/cancel`,
    RECENT_JOBS: `${API_BASE_PATH}/publish/recent-jobs`,
    JOB_STATUS: jobId => `${API_BASE_PATH}/publish/${jobId}/status`,
    UPDATE_JOB_STATUS: jobId => `${API_BASE_PATH}/publish/${jobId}/status`,
    MARK_UPLOADS_COMPLETE: jobId => `${API_BASE_PATH}/publish/${jobId}/mark-uploads-complete`
  },
  /**
   * Provider endpoints
   */
  PROVIDERS: {
    LIST: `${API_BASE_PATH}/providers`,
    GET: providerId => `${API_BASE_PATH}/providers/${providerId}`,
    CONFIG: providerId => `${API_BASE_PATH}/providers/${providerId}/config`,
    SAVE_CONFIG: providerId => `${API_BASE_PATH}/providers/${providerId}/config`,
    DELETE_CONFIG: providerId => `${API_BASE_PATH}/providers/${providerId}/config`,
    TEST: providerId => `${API_BASE_PATH}/providers/${providerId}/test`,
    STATUS: providerId => `${API_BASE_PATH}/providers/${providerId}/status`
  },
  /**
   * Blueprint endpoints
   * Note: Blueprint generation is now handled client-side via useBlueprintGenerator hook
   */
  BLUEPRINT: {
    GET: `${API_BASE_PATH}/blueprint`
  },
  /**
   * Export endpoints
   */
  EXPORT: {
    START: `${API_BASE_PATH}/export/start`,
    STATUS: `${API_BASE_PATH}/export/status`,
    DOWNLOAD: `${API_BASE_PATH}/export/download`
  },
  /**
   * Configuration endpoints
   */
  CONFIG: {
    GET: `${API_BASE_PATH}/config`,
    UPDATE: `${API_BASE_PATH}/config`,
    RESET: `${API_BASE_PATH}/config/reset`
  },
  /**
   * Static site endpoints
   */
  STATIC_SITE: {
    URLS: `${API_BASE_PATH}/static-site/urls`,
    GENERATE: `${API_BASE_PATH}/static-site/generate`
  },
  /**
   * Asset management endpoints
   * Note: Asset discovery now handled by useAssetDiscovery.js hook (browser-based)
   * These endpoints have been removed as they made HTTP requests that fail in WordPress Playground
   */
  ASSETS: {
    // Removed: DISCOVER, STATUS, MARK_CHANGED (now in useAssetDiscovery.js)
    EXTRACT: `${API_BASE_PATH}/assets/extract`
  },
  /**
   * Usage statistics endpoints
   */
  USAGE: {
    SUMMARY: `${API_BASE_PATH}/usage/summary`,
    DETAILS: `${API_BASE_PATH}/usage/details`
  }
};

/**
 * HTTP Methods
 * @constant {Object}
 */
const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
};

/**
 * API Request Headers
 * @constant {Object}
 */
const API_HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_FORM: 'application/x-www-form-urlencoded'
};

/**
 * API Response Status Codes
 * @constant {Object}
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};
;// ./assets/src/constants/providers.js
/**
 * Provider Constants
 *
 * Centralized provider IDs, types, and categorizations
 *
 * @package
 */

/**
 * Provider IDs
 *
 * Unique identifiers for all registered providers.
 * Use these constants instead of hardcoded strings.
 */
const PROVIDER_IDS = {
  /**
   * Local Filesystem Provider
   * @constant {string}
   */
  LOCAL_FILESYSTEM: 'local-filesystem',
  /**
   * None/Disabled Provider
   * @constant {string}
   */
  NONE: 'none'
};

/**
 * Provider Types
 *
 * Categories of providers by their primary function.
 * Note: These are provider "types" (getType()), not capabilities.
 */
const PROVIDER_TYPES = {
  /**
   * Local storage type
   * @constant {string}
   */
  LOCAL_STORAGE: 'local-storage',
  /**
   * Cloud storage type
   * @constant {string}
   */
  CLOUD_STORAGE: 'cloud-storage',
  /**
   * Git hosting type
   * @constant {string}
   */
  GIT_HOSTING: 'git-hosting',
  /**
   * Static site hosting type
   * @constant {string}
   */
  STATIC_HOSTING: 'static-hosting',
  /**
   * Edge computing type
   * @constant {string}
   */
  EDGE_COMPUTING: 'edge-computing'
};

/**
 * Provider Configuration Keys
 *
 * Standard configuration field names for local filesystem provider.
 */
const PROVIDER_CONFIG_KEYS = {
  // URLs
  ENDPOINT: 'endpoint',
  CUSTOM_DOMAIN: 'custom_domain',
  PUBLIC_URL: 'public_url'
};

/**
 * Provider Status Values
 *
 * Standard status values for provider connections.
 */
const PROVIDER_STATUS = {
  /**
   * Provider is not configured
   * @constant {string}
   */
  NOT_CONFIGURED: 'not_configured',
  /**
   * Provider is configured but not tested
   * @constant {string}
   */
  CONFIGURED: 'configured',
  /**
   * Provider connection test in progress
   * @constant {string}
   */
  TESTING: 'testing',
  /**
   * Provider connection test successful
   * @constant {string}
   */
  CONNECTED: 'connected',
  /**
   * Provider connection test failed
   * @constant {string}
   */
  ERROR: 'error',
  /**
   * Provider is currently deploying
   * @constant {string}
   */
  DEPLOYING: 'deploying',
  /**
   * Provider deployed successfully
   * @constant {string}
   */
  DEPLOYED: 'deployed'
};

/**
 * Provider Internal Keys
 *
 * Internal setting keys (deprecated - providers now use deployment_types config).
 * Kept for backwards compatibility during migration.
 */
const PROVIDER_INTERNAL_KEYS = {
  /**
   * @deprecated Use deployment_types config instead
   * @constant {string}
   */
  STORAGE_PROVIDER: 'storageProvider',
  /**
   * @deprecated Use deployment_types config instead
   * @constant {string}
   */
  STATIC_SITE_PROVIDER: 'staticSiteProvider'
};

/**
 * Provider Error Codes
 *
 * Standard error codes for provider operations.
 */
const PROVIDER_ERROR_CODES = {
  /**
   * Provider not found in registry
   * @constant {string}
   */
  PROVIDER_NOT_FOUND: 'provider_not_found',
  /**
   * Provider not configured
   * @constant {string}
   */
  NOT_CONFIGURED: 'not_configured',
  /**
   * Invalid configuration
   * @constant {string}
   */
  INVALID_CONFIG: 'invalid_config',
  /**
   * Authentication failed
   * @constant {string}
   */
  AUTH_FAILED: 'auth_failed',
  /**
   * Connection failed
   * @constant {string}
   */
  CONNECTION_FAILED: 'connection_failed',
  /**
   * Deployment failed
   * @constant {string}
   */
  DEPLOYMENT_FAILED: 'deployment_failed',
  /**
   * Upload failed
   * @constant {string}
   */
  UPLOAD_FAILED: 'upload_failed',
  /**
   * Deployment type not supported
   * @constant {string}
   */
  DEPLOYMENT_TYPE_NOT_SUPPORTED: 'deployment_type_not_supported'
};
;// ./assets/src/constants/steps.js
/**
 * Publish Step Constants
 *
 * Centralized step names and statuses for publish workflow
 *
 * @package
 */

/**
 * Publish Step IDs
 *
 * Unique identifiers for each step in the publish workflow.
 * Use these constants instead of hardcoded strings.
 */
const PUBLISH_STEPS = {
  /**
   * Discover and extract assets from the site
   * @constant {string}
   */
  DISCOVER_ASSETS: 'discoverAssets',
  /**
   * Get list of URLs for static site generation
   * @constant {string}
   */
  GET_STATIC_SITE_URLS: 'getStaticSiteUrls',
  /**
   * Generate WordPress Playground blueprint
   * @constant {string}
   */
  GENERATE_BLUEPRINT: 'generateBlueprint',
  /**
   * Create site archive (wp-content.zip)
   * @constant {string}
   */
  CREATE_SITE_ARCHIVE: 'createSiteArchive',
  /**
   * Upload static site files (HTML, CSS, JS, assets)
   * @constant {string}
   */
  UPLOAD_STATIC_SITE_FILES: 'uploadStaticSiteFiles',
  /**
   * Upload site archive to provider
   * @constant {string}
   */
  UPLOAD_SITE_ARCHIVE: 'uploadSiteArchive',
  /**
   * Complete publish workflow
   * @constant {string}
   */
  COMPLETE: 'complete'
};

/**
 * Step Status Values
 *
 * Possible states for each step in the workflow.
 */
const STEP_STATUS = {
  /**
   * Step has not started yet
   * @constant {string}
   */
  PENDING: 'pending',
  /**
   * Step is currently in progress
   * @constant {string}
   */
  ACTIVE: 'active',
  /**
   * Step is processing (server-side)
   * @constant {string}
   */
  PROCESSING: 'processing',
  /**
   * Step completed successfully
   * @constant {string}
   */
  COMPLETE: 'complete',
  /**
   * Step encountered an error
   * @constant {string}
   */
  ERROR: 'error',
  /**
   * Step was skipped
   * @constant {string}
   */
  SKIPPED: 'skipped'
};

/**
 * Publish Workflow Status
 *
 * Overall status of the publish job.
 */
const PUBLISH_STATUS = {
  /**
   * Workflow not started
   * @constant {string}
   */
  IDLE: 'idle',
  /**
   * Workflow pending start
   * @constant {string}
   */
  PENDING: 'pending',
  /**
   * Workflow is running
   * @constant {string}
   */
  RUNNING: 'running',
  /**
   * Workflow is processing
   * @constant {string}
   */
  PROCESSING: 'processing',
  /**
   * Waiting for file upload
   * @constant {string}
   */
  WAITING_FOR_UPLOAD: 'waitingForUpload',
  /**
   * Workflow completed successfully
   * @constant {string}
   */
  COMPLETE: 'complete',
  /**
   * Workflow completed with errors
   * @constant {string}
   */
  ERROR: 'error',
  /**
   * Workflow was cancelled
   * @constant {string}
   */
  CANCELLED: 'cancelled'
};

/**
 * Step Labels
 *
 * Human-readable labels for each publish step.
 */
const STEP_LABELS = {
  [PUBLISH_STEPS.DISCOVER_ASSETS]: 'Discovering Assets',
  [PUBLISH_STEPS.GET_STATIC_SITE_URLS]: 'Getting URLs',
  [PUBLISH_STEPS.GENERATE_BLUEPRINT]: 'Generating Blueprint',
  [PUBLISH_STEPS.CREATE_SITE_ARCHIVE]: 'Creating Archive',
  [PUBLISH_STEPS.UPLOAD_STATIC_SITE_FILES]: 'Uploading Static Site',
  [PUBLISH_STEPS.UPLOAD_SITE_ARCHIVE]: 'Uploading Archive',
  [PUBLISH_STEPS.COMPLETE]: 'Complete'
};

/**
 * Step Descriptions
 *
 * Detailed descriptions for each publish step.
 */
const STEP_DESCRIPTIONS = {
  [PUBLISH_STEPS.DISCOVER_ASSETS]: 'Scanning your site for assets (images, CSS, JavaScript, etc.)',
  [PUBLISH_STEPS.GET_STATIC_SITE_URLS]: 'Collecting all URLs to be included in the static site',
  [PUBLISH_STEPS.GENERATE_BLUEPRINT]: 'Creating WordPress Playground blueprint file',
  [PUBLISH_STEPS.CREATE_SITE_ARCHIVE]: 'Packaging your site into a portable archive',
  [PUBLISH_STEPS.UPLOAD_STATIC_SITE_FILES]: 'Uploading static HTML files and assets to your provider',
  [PUBLISH_STEPS.UPLOAD_SITE_ARCHIVE]: 'Uploading site archive to your provider',
  [PUBLISH_STEPS.COMPLETE]: 'Publish workflow completed successfully'
};

/**
 * Step Order
 *
 * Array of steps in the order they should be executed.
 * Use this for iterating through steps in sequence.
 */
const STEP_ORDER = [PUBLISH_STEPS.DISCOVER_ASSETS, PUBLISH_STEPS.GET_STATIC_SITE_URLS, PUBLISH_STEPS.GENERATE_BLUEPRINT, PUBLISH_STEPS.CREATE_SITE_ARCHIVE, PUBLISH_STEPS.UPLOAD_STATIC_SITE_FILES, PUBLISH_STEPS.UPLOAD_SITE_ARCHIVE, PUBLISH_STEPS.COMPLETE];

/**
 * Step Progress Weights
 *
 * Relative weights for calculating overall progress.
 * Steps that take longer should have higher weights.
 */
const STEP_WEIGHTS = {
  [PUBLISH_STEPS.DISCOVER_ASSETS]: 10,
  [PUBLISH_STEPS.GET_STATIC_SITE_URLS]: 5,
  [PUBLISH_STEPS.GENERATE_BLUEPRINT]: 5,
  [PUBLISH_STEPS.CREATE_SITE_ARCHIVE]: 10,
  [PUBLISH_STEPS.UPLOAD_STATIC_SITE_FILES]: 50,
  // Longest step
  [PUBLISH_STEPS.UPLOAD_SITE_ARCHIVE]: 15,
  [PUBLISH_STEPS.COMPLETE]: 5
};

/**
 * Helper Functions
 */

/**
 * Get step index in workflow
 *
 * @param {string} stepId - Step ID
 * @return {number} Step index (0-based) or -1 if not found
 */
function getStepIndex(stepId) {
  return STEP_ORDER.indexOf(stepId);
}

/**
 * Get step label
 *
 * @param {string} stepId - Step ID
 * @return {string} Human-readable label
 */
function getStepLabel(stepId) {
  return STEP_LABELS[stepId] || stepId;
}

/**
 * Get step description
 *
 * @param {string} stepId - Step ID
 * @return {string} Detailed description
 */
function getStepDescription(stepId) {
  return STEP_DESCRIPTIONS[stepId] || '';
}

/**
 * Check if step is final step
 *
 * @param {string} stepId - Step ID
 * @return {boolean} True if this is the last step
 */
function isFinalStep(stepId) {
  return stepId === PUBLISH_STEPS.COMPLETE;
}

/**
 * Get next step in workflow
 *
 * @param {string} currentStepId - Current step ID
 * @return {string|null} Next step ID or null if at end
 */
function getNextStep(currentStepId) {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return null;
  }
  return STEP_ORDER[currentIndex + 1];
}

/**
 * Get previous step in workflow
 *
 * @param {string} currentStepId - Current step ID
 * @return {string|null} Previous step ID or null if at start
 */
function getPreviousStep(currentStepId) {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return STEP_ORDER[currentIndex - 1];
}

/**
 * Calculate overall progress percentage
 *
 * @param {string} currentStepId       - Current step ID
 * @param {number} currentStepProgress - Progress of current step (0-100)
 * @return {number} Overall progress percentage (0-100)
 */
function calculateOverallProgress(currentStepId, currentStepProgress = 0) {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex === -1) {
    return 0;
  }

  // Calculate total weight
  const totalWeight = Object.values(STEP_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

  // Calculate completed weight (all steps before current)
  let completedWeight = 0;
  for (let i = 0; i < currentIndex; i++) {
    completedWeight += STEP_WEIGHTS[STEP_ORDER[i]];
  }

  // Add partial weight for current step
  const currentStepWeight = STEP_WEIGHTS[currentStepId] || 0;
  const currentStepWeightCompleted = currentStepWeight * currentStepProgress / 100;
  completedWeight += currentStepWeightCompleted;

  // Calculate percentage
  return Math.round(completedWeight / totalWeight * 100);
}
;// ./assets/src/constants/capabilities.js
/**
 * Provider Capability Constants
 *
 * Centralized capability names for provider features
 *
 * @package
 */

/**
 * Provider Capabilities
 *
 * Standard capability identifiers that providers can support.
 * Use these constants to check what features a provider supports.
 */

/**
 * Storage capability - provider can store files
 * @constant {string}
 */
const CAP_STORAGE = 'storage';

/**
 * Static site hosting capability - provider can host static sites
 * @constant {string}
 */
const CAP_STATIC_SITE = 'static-site';

/**
 * CDN capability - provider offers CDN distribution
 * @constant {string}
 */
const CAP_CDN = 'cdn';

/**
 * Analytics capability - provider offers analytics/metrics
 * @constant {string}
 */
const CAP_ANALYTICS = 'analytics';

/**
 * Custom domain capability - provider supports custom domains
 * @constant {string}
 */
const CAP_CUSTOM_DOMAIN = 'custom-domain';

/**
 * SSL/TLS capability - provider supports HTTPS
 * @constant {string}
 */
const CAP_SSL = 'ssl';

/**
 * Caching capability - provider offers caching features
 * @constant {string}
 */
const CAP_CACHE = 'cache';

/**
 * Image optimization capability - provider can optimize images
 * @constant {string}
 */
const CAP_IMAGE_OPTIMIZATION = 'image-optimization';

/**
 * Video streaming capability - provider supports video streaming
 * @constant {string}
 */
const CAP_VIDEO_STREAMING = 'video-streaming';

/**
 * Capability Groups
 *
 * Predefined sets of capabilities for common provider types.
 */

/**
 * Core capabilities required for basic functionality
 * @constant {string[]}
 */
const CORE_CAPABILITIES = [CAP_STORAGE];

/**
 * Capabilities for a full-featured static site host
 * @constant {string[]}
 */
const STATIC_SITE_CAPABILITIES = [CAP_STORAGE, CAP_STATIC_SITE, CAP_CDN, CAP_CUSTOM_DOMAIN, CAP_SSL];

/**
 * Capability Labels
 *
 * Human-readable labels for each capability.
 */
const CAPABILITY_LABELS = {
  [CAP_STORAGE]: 'Storage',
  [CAP_STATIC_SITE]: 'Static Site Hosting',
  [CAP_CDN]: 'CDN',
  [CAP_ANALYTICS]: 'Analytics',
  [CAP_CUSTOM_DOMAIN]: 'Custom Domain',
  [CAP_SSL]: 'SSL/TLS',
  [CAP_CACHE]: 'Caching',
  [CAP_IMAGE_OPTIMIZATION]: 'Image Optimization',
  [CAP_VIDEO_STREAMING]: 'Video Streaming'
};

/**
 * Capability Descriptions
 *
 * Detailed descriptions for each capability.
 */
const CAPABILITY_DESCRIPTIONS = {
  [CAP_STORAGE]: 'Store and retrieve files (blueprints, archives, assets)',
  [CAP_STATIC_SITE]: 'Host static HTML/CSS/JS sites with global distribution',
  [CAP_CDN]: 'Content delivery network for fast global access',
  [CAP_ANALYTICS]: 'Track usage, visitors, and performance metrics',
  [CAP_CUSTOM_DOMAIN]: 'Use your own domain name',
  [CAP_SSL]: 'Secure connections with HTTPS/TLS',
  [CAP_CACHE]: 'Cache content for improved performance',
  [CAP_IMAGE_OPTIMIZATION]: 'Automatic image resizing and optimization',
  [CAP_VIDEO_STREAMING]: 'Adaptive video streaming with HLS/DASH'
};

/**
 * Capability Requirements
 *
 * Defines which capabilities are required for specific features.
 */

/**
 * Required capabilities for publish workflow
 * @constant {string[]}
 */
const PUBLISH_REQUIRED_CAPABILITIES = [CAP_STORAGE];

/**
 * Required capabilities for static site generation
 * @constant {string[]}
 */
const STATIC_SITE_REQUIRED_CAPABILITIES = [CAP_STORAGE, CAP_STATIC_SITE];

/**
 * Helper Functions
 */

/**
 * Get capability label
 *
 * @param {string} capability - Capability constant
 * @return {string} Human-readable label
 */
function getCapabilityLabel(capability) {
  return CAPABILITY_LABELS[capability] || capability;
}

/**
 * Get capability description
 *
 * @param {string} capability - Capability constant
 * @return {string} Detailed description
 */
function getCapabilityDescription(capability) {
  return CAPABILITY_DESCRIPTIONS[capability] || '';
}

/**
 * Check if capabilities meet requirements
 *
 * @param {string[]} providerCapabilities - Capabilities the provider supports
 * @param {string[]} requiredCapabilities - Capabilities that are required
 * @return {boolean} True if all required capabilities are supported
 */
function hasRequiredCapabilities(providerCapabilities, requiredCapabilities) {
  return requiredCapabilities.every(cap => providerCapabilities.includes(cap));
}

/**
 * Check if provider can handle publish workflow
 *
 * @param {string[]} providerCapabilities - Capabilities the provider supports
 * @return {boolean} True if provider can handle publish
 */
function canPublish(providerCapabilities) {
  return hasRequiredCapabilities(providerCapabilities, PUBLISH_REQUIRED_CAPABILITIES);
}

/**
 * Check if provider can host static sites
 *
 * @param {string[]} providerCapabilities - Capabilities the provider supports
 * @return {boolean} True if provider can host static sites
 */
function canHostStaticSite(providerCapabilities) {
  return hasRequiredCapabilities(providerCapabilities, STATIC_SITE_REQUIRED_CAPABILITIES);
}

/**
 * Get missing capabilities
 *
 * @param {string[]} providerCapabilities - Capabilities the provider supports
 * @param {string[]} requiredCapabilities - Capabilities that are required
 * @return {string[]} Array of missing capability identifiers
 */
function getMissingCapabilities(providerCapabilities, requiredCapabilities) {
  return requiredCapabilities.filter(cap => !providerCapabilities.includes(cap));
}
;// ./assets/src/constants/index.js
/**
 * Constants Index
 *
 * Central export point for all application constants.
 * Import from this file for convenience:
 *
 * @example
 * import { ENDPOINTS, PUBLISH_STEPS, CAP_STORAGE } from '../constants';
 *
 * @package
 */

// API Constants


// Timing Constants


// Provider Constants


// Step Constants


// Capability Constants

;// ./assets/src/utils/debug.js
/**
 * Debug Utility
 *
 * Centralized logging utility for development debugging.
 * Can be enabled/disabled via window.aetherDebug flag.
 *
 * @package
 */

/**
 * Check if debug mode is enabled.
 *
 * @return {boolean} True if debug mode is enabled.
 */
function isDebugEnabled() {
  return typeof window !== 'undefined' && window.aetherDebug === true;
}

/**
 * Log a message to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debug(...args) {
  if (isDebugEnabled() && window.console && window.console.log) {
    window.console.log('[Aether]', ...args);
  }
}

/**
 * Log an error to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debugError(...args) {
  if (isDebugEnabled() && window.console && window.console.error) {
    window.console.error('[Aether Error]', ...args);
  }
}

/**
 * Log a warning to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debug_debugWarn(...args) {
  if (isDebugEnabled() && window.console && window.console.warn) {
    window.console.warn('[Aether Warning]', ...args);
  }
}

/**
 * Log an info message to console (only in debug mode).
 *
 * @param {...*} args Arguments to log.
 */
function debugInfo(...args) {
  if (isDebugEnabled() && window.console && window.console.info) {
    window.console.info('[Aether Info]', ...args);
  }
}

/**
 * Log a table to console (only in debug mode).
 *
 * @param {*} data Data to display as table.
 */
function debugTable(data) {
  if (isDebugEnabled() && window.console && window.console.table) {
    window.console.table(data);
  }
}

/**
 * Start a performance timer (only in debug mode).
 *
 * @param {string} label Timer label.
 */
function debugTime(label) {
  if (isDebugEnabled() && window.console && window.console.time) {
    window.console.time(`[Aether] ${label}`);
  }
}

/**
 * End a performance timer (only in debug mode).
 *
 * @param {string} label Timer label.
 */
function debugTimeEnd(label) {
  if (isDebugEnabled() && window.console && window.console.timeEnd) {
    window.console.timeEnd(`[Aether] ${label}`);
  }
}

/**
 * Group console messages (only in debug mode).
 *
 * @param {string} label Group label.
 */
function debugGroup(label) {
  if (isDebugEnabled() && window.console && window.console.group) {
    window.console.group(`[Aether] ${label}`);
  }
}

/**
 * End console message group (only in debug mode).
 */
function debugGroupEnd() {
  if (isDebugEnabled() && window.console && window.console.groupEnd) {
    window.console.groupEnd();
  }
}

/**
 * Enable debug mode.
 *
 * Usage: aetherDebug.enable() in browser console.
 */
function enableDebug() {
  if (typeof window !== 'undefined') {
    window.aetherDebug = true;
    debug('Debug mode enabled');
  }
}

/**
 * Disable debug mode.
 *
 * Usage: aetherDebug.disable() in browser console.
 */
function disableDebug() {
  if (typeof window !== 'undefined') {
    window.aetherDebug = false;
  }
}

// Export as single object for easier importing
const debugUtil = {
  debug,
  error: debugError,
  warn: debug_debugWarn,
  info: debugInfo,
  table: debugTable,
  time: debugTime,
  timeEnd: debugTimeEnd,
  group: debugGroup,
  groupEnd: debugGroupEnd,
  enable: enableDebug,
  disable: disableDebug,
  isEnabled: isDebugEnabled
};

// Make available globally for easy browser console access
if (typeof window !== 'undefined') {
  window.aetherDebug = window.aetherDebug || false;
  window.aetherDebugUtil = debugUtil;
}
/* harmony default export */ const utils_debug = ((/* unused pure expression or super */ null && (debugUtil)));
;// ./node_modules/idb/build/index.js
const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
    return (idbProxyableTypes ||
        (idbProxyableTypes = [
            IDBDatabase,
            IDBObjectStore,
            IDBIndex,
            IDBCursor,
            IDBTransaction,
        ]));
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
    return (cursorAdvanceMethods ||
        (cursorAdvanceMethods = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
        ]));
}
const transactionDoneMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
        const unlisten = () => {
            request.removeEventListener('success', success);
            request.removeEventListener('error', error);
        };
        const success = () => {
            resolve(wrap(request.result));
            unlisten();
        };
        const error = () => {
            reject(request.error);
            unlisten();
        };
        request.addEventListener('success', success);
        request.addEventListener('error', error);
    });
    // This mapping exists in reverseTransformCache but doesn't exist in transformCache. This
    // is because we create many promises from a single IDBRequest.
    reverseTransformCache.set(promise, request);
    return promise;
}
function cacheDonePromiseForTransaction(tx) {
    // Early bail if we've already created a done promise for this transaction.
    if (transactionDoneMap.has(tx))
        return;
    const done = new Promise((resolve, reject) => {
        const unlisten = () => {
            tx.removeEventListener('complete', complete);
            tx.removeEventListener('error', error);
            tx.removeEventListener('abort', error);
        };
        const complete = () => {
            resolve();
            unlisten();
        };
        const error = () => {
            reject(tx.error || new DOMException('AbortError', 'AbortError'));
            unlisten();
        };
        tx.addEventListener('complete', complete);
        tx.addEventListener('error', error);
        tx.addEventListener('abort', error);
    });
    // Cache it for later retrieval.
    transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
    get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
            // Special handling for transaction.done.
            if (prop === 'done')
                return transactionDoneMap.get(target);
            // Make tx.store return the only store in the transaction, or undefined if there are many.
            if (prop === 'store') {
                return receiver.objectStoreNames[1]
                    ? undefined
                    : receiver.objectStore(receiver.objectStoreNames[0]);
            }
        }
        // Else transform whatever we get back.
        return wrap(target[prop]);
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    },
    has(target, prop) {
        if (target instanceof IDBTransaction &&
            (prop === 'done' || prop === 'store')) {
            return true;
        }
        return prop in target;
    },
};
function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
    // Due to expected object equality (which is enforced by the caching in `wrap`), we
    // only create one new func per func.
    // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
    // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
    // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
    // with real promises, so each advance methods returns a new promise for the cursor object, or
    // undefined if the end of the cursor has been reached.
    if (getCursorAdvanceMethods().includes(func)) {
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            func.apply(unwrap(this), args);
            return wrap(this.request);
        };
    }
    return function (...args) {
        // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
        // the original object.
        return wrap(func.apply(unwrap(this), args));
    };
}
function transformCachableValue(value) {
    if (typeof value === 'function')
        return wrapFunction(value);
    // This doesn't return, it just creates a 'done' promise for the transaction,
    // which is later returned for transaction.done (see idbObjectHandler).
    if (value instanceof IDBTransaction)
        cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
        return new Proxy(value, idbProxyTraps);
    // Return the same value back if we're not going to transform it.
    return value;
}
function wrap(value) {
    // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
    // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
    if (value instanceof IDBRequest)
        return promisifyRequest(value);
    // If we've already transformed this value before, reuse the transformed value.
    // This is faster, but it also provides object equality.
    if (transformCache.has(value))
        return transformCache.get(value);
    const newValue = transformCachableValue(value);
    // Not all types are transformed.
    // These may be primitive types, so they can't be WeakMap keys.
    if (newValue !== value) {
        transformCache.set(value, newValue);
        reverseTransformCache.set(newValue, value);
    }
    return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
        request.addEventListener('upgradeneeded', (event) => {
            upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
        });
    }
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event.newVersion, event));
    }
    openPromise
        .then((db) => {
        if (terminated)
            db.addEventListener('close', () => terminated());
        if (blocking) {
            db.addEventListener('versionchange', (event) => blocking(event.oldVersion, event.newVersion, event));
        }
    })
        .catch(() => { });
    return openPromise;
}
/**
 * Delete a database.
 *
 * @param name Name of the database.
 */
function deleteDB(name, { blocked } = {}) {
    const request = indexedDB.deleteDatabase(name);
    if (blocked) {
        request.addEventListener('blocked', (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion, event));
    }
    return wrap(request).then(() => undefined);
}

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase &&
        !(prop in target) &&
        typeof prop === 'string')) {
        return;
    }
    if (cachedMethods.get(prop))
        return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, '');
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
        !(isWrite || readMethods.includes(targetFuncName))) {
        return;
    }
    const method = async function (storeName, ...args) {
        // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
        const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
        let target = tx.store;
        if (useIndex)
            target = target.index(args.shift());
        // Must reject if op rejects.
        // If it's a write operation, must reject if tx.done rejects.
        // Must reject with op rejection first.
        // Must resolve with op value.
        // Must handle both promises (no unhandled rejections)
        return (await Promise.all([
            target[targetFuncName](...args),
            isWrite && tx.done,
        ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

const advanceMethodProps = ['continue', 'continuePrimaryKey', 'advance'];
const methodMap = {};
const advanceResults = new WeakMap();
const ittrProxiedCursorToOriginalProxy = new WeakMap();
const cursorIteratorTraps = {
    get(target, prop) {
        if (!advanceMethodProps.includes(prop))
            return target[prop];
        let cachedFunc = methodMap[prop];
        if (!cachedFunc) {
            cachedFunc = methodMap[prop] = function (...args) {
                advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
            };
        }
        return cachedFunc;
    },
};
async function* iterate(...args) {
    // tslint:disable-next-line:no-this-assignment
    let cursor = this;
    if (!(cursor instanceof IDBCursor)) {
        cursor = await cursor.openCursor(...args);
    }
    if (!cursor)
        return;
    cursor = cursor;
    const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
    ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
    // Map this double-proxy back to the original, so other cursor methods work.
    reverseTransformCache.set(proxiedCursor, unwrap(cursor));
    while (cursor) {
        yield proxiedCursor;
        // If one of the advancing methods was not called, call continue().
        cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
        advanceResults.delete(proxiedCursor);
    }
}
function isIteratorProp(target, prop) {
    return ((prop === Symbol.asyncIterator &&
        instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor])) ||
        (prop === 'iterate' && instanceOfAny(target, [IDBIndex, IDBObjectStore])));
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get(target, prop, receiver) {
        if (isIteratorProp(target, prop))
            return iterate;
        return oldTraps.get(target, prop, receiver);
    },
    has(target, prop) {
        return isIteratorProp(target, prop) || oldTraps.has(target, prop);
    },
}));



;// ./assets/src/utils/indexedDB.js
/**
 * IndexedDB Wrapper - Abstract storage interface for browser persistent storage
 *
 * Uses the `idb` library (by Jake Archibald) as a foundation, providing a
 * simple, promise-based API for storing data in IndexedDB.
 *
 * Works in all modern browsers including WordPress Playground WASM environment.
 *
 * Features:
 * - Simple key-value storage interface
 * - Automatic database initialization
 * - Promise-based async API
 * - Error handling and quota management
 * - Support for multiple stores and indexes
 * - Automatic cleanup of expired data
 * - Built on battle-tested `idb` library (9.8M weekly downloads)
 */

/* global indexedDB, IDBKeyRange */



/**
 * IndexedDB database instance cache
 * Stores opened database connections to avoid repeated initialization
 */
const dbInstances = new Map();

/**
 * Default database configuration
 */
const DEFAULT_CONFIG = {
  dbName: 'aether-site-exporter',
  version: 1,
  stores: {
    cache: {
      keyPath: 'key',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'type',
        keyPath: 'type',
        unique: false
      }]
    }
  }
};

/**
 * Open IndexedDB database with configuration using idb library
 *
 * @param {Object} config         - Database configuration
 * @param {string} config.dbName  - Database name
 * @param {number} config.version - Database version
 * @param {Object} config.stores  - Object stores configuration
 * @return {Promise<Object>} Database instance
 */
async function openDatabase(config = DEFAULT_CONFIG) {
  const cacheKey = `${config.dbName}_v${config.version}`;

  // Return cached instance if available
  if (dbInstances.has(cacheKey)) {
    return dbInstances.get(cacheKey);
  }
  try {
    const db = await openDB(config.dbName, config.version, {
      upgrade(database) {
        // Create object stores based on configuration
        Object.entries(config.stores).forEach(([storeName, storeConfig]) => {
          // Delete existing store if it exists (for upgrades)
          if (database.objectStoreNames.contains(storeName)) {
            database.deleteObjectStore(storeName);
          }

          // Create new store
          const store = database.createObjectStore(storeName, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement || false
          });

          // Create indexes
          if (storeConfig.indexes) {
            storeConfig.indexes.forEach(index => {
              store.createIndex(index.name, index.keyPath, {
                unique: index.unique || false
              });
            });
          }
        });
      }
    });
    dbInstances.set(cacheKey, db);
    return db;
  } catch (error) {
    throw new Error(`Failed to open IndexedDB: ${error.message || 'Unknown error'}`);
  }
}

/**
 * IndexedDB Store - Abstract interface for a single object store
 *
 * Provides a simple key-value API on top of idb library
 */
class IndexedDBStore {
  /**
   * Constructor
   *
   * @param {string} storeName - Name of the object store
   * @param {Object} config    - Database configuration (optional)
   */
  constructor(storeName, config = DEFAULT_CONFIG) {
    this.storeName = storeName;
    this.config = config;
    this.db = null;
    // Get the keyPath for this store from config
    this.keyPath = config.stores?.[storeName]?.keyPath || DEFAULT_CONFIG.stores.cache.keyPath;
  }

  /**
   * Ensure database is initialized
   *
   * @return {Promise<Object>} Database instance
   */
  async ensureDatabase() {
    if (!this.db) {
      this.db = await openDatabase(this.config);
    }
    return this.db;
  }

  /**
   * Get a value by key
   *
   * @param {string|number} key - The key to retrieve
   * @return {Promise<any|null>} The stored value or null if not found
   */
  async get(key) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.get(this.storeName, key);
      return result || null;
    } catch (error) {
      console.error(`[IndexedDB] Error getting key "${key}":`, error);
      return null;
    }
  }

  /**
   * Get all values from the store
   *
   * @param {number} limit - Maximum number of items to return (optional)
   * @return {Promise<Array>} Array of all stored values
   */
  async getAll(limit = undefined) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAll(this.storeName, undefined, limit);
      return result || [];
    } catch (error) {
      console.error('[IndexedDB] Error getting all values:', error);
      return [];
    }
  }

  /**
   * Get all keys from the store
   *
   * @return {Promise<Array>} Array of all keys
   */
  async getAllKeys() {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAllKeys(this.storeName);
      return result || [];
    } catch (error) {
      console.error('[IndexedDB] Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Set a value by key
   *
   * @param {string|number} key      - The key to set
   * @param {any}           value    - The value to store
   * @param {Object}        metadata - Additional metadata (optional)
   * @return {Promise<boolean>} True if successful, false otherwise
   */
  async set(key, value, metadata = {}) {
    try {
      const db = await this.ensureDatabase();

      // For object values, spread properties; for primitives, use value property
      const valueData = typeof value === 'object' && value !== null ? {
        ...value
      } : {
        value
      };
      const data = {
        [this.keyPath]: key,
        ...valueData,
        timestamp: Date.now(),
        ...metadata
      };
      await db.put(this.storeName, data);
      return true;
    } catch (error) {
      // Check for quota exceeded error
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
        console.warn('[IndexedDB] Storage quota exceeded. Consider cleaning up old data.');
      }
      console.error(`[IndexedDB] Error setting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Delete a value by key
   *
   * @param {string|number} key - The key to delete
   * @return {Promise<boolean>} True if successful, false otherwise
   */
  async delete(key) {
    try {
      const db = await this.ensureDatabase();
      await db.delete(this.storeName, key);
      return true;
    } catch (error) {
      console.error(`[IndexedDB] Error deleting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all data from the store
   *
   * @return {Promise<boolean>} True if successful, false otherwise
   */
  async clear() {
    try {
      const db = await this.ensureDatabase();
      await db.clear(this.storeName);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Error clearing store:', error);
      return false;
    }
  }

  /**
   * Count number of items in the store
   *
   * @return {Promise<number>} Number of items
   */
  async count() {
    try {
      const db = await this.ensureDatabase();
      const result = await db.count(this.storeName);
      return result || 0;
    } catch (error) {
      console.error('[IndexedDB] Error counting items:', error);
      return 0;
    }
  }

  /**
   * Get values by index
   *
   * @param {string} indexName  - Name of the index
   * @param {any}    indexValue - Value to search for in the index
   * @return {Promise<Array>} Array of matching values
   */
  async getByIndex(indexName, indexValue) {
    try {
      const db = await this.ensureDatabase();
      const result = await db.getAllFromIndex(this.storeName, indexName, indexValue);
      return result || [];
    } catch (error) {
      console.error(`[IndexedDB] Error getting by index "${indexName}":`, error);
      return [];
    }
  }

  /**
   * Delete items older than specified age
   *
   * Uses the timestamp index to efficiently find and delete old items.
   *
   * @param {number} maxAgeMs - Maximum age in milliseconds
   * @return {Promise<number>} Number of items deleted
   */
  async deleteOlderThan(maxAgeMs) {
    try {
      const db = await this.ensureDatabase();
      const cutoffTime = Date.now() - maxAgeMs;

      // Use transaction for atomic delete operation
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const index = store.index('timestamp');
      let deletedCount = 0;

      // Get cursor for items with timestamp <= cutoffTime
      let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffTime));
      while (cursor) {
        await cursor.delete();
        deletedCount++;
        cursor = await cursor.continue();
      }
      await tx.done;
      return deletedCount;
    } catch (error) {
      console.error('[IndexedDB] Error deleting old items:', error);
      return 0;
    }
  }

  /**
   * Get storage estimate (quota and usage)
   *
   * @return {Promise<Object>} Storage estimate with quota and usage
   */
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          percentUsed: estimate.quota > 0 ? estimate.usage / estimate.quota * 100 : 0
        };
      } catch (error) {
        console.error('[IndexedDB] Error getting storage estimate:', error);
      }
    }
    return {
      quota: null,
      usage: null,
      percentUsed: null
    };
  }
}

/**
 * Check if IndexedDB is available
 *
 * @return {boolean} True if IndexedDB is supported
 */
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null && typeof openDB === 'function';
  } catch (error) {
    return false;
  }
}

/**
 * Delete entire database
 *
 * @param {string} dbName - Database name to delete
 * @return {Promise<boolean>} True if successful
 */
async function deleteDatabase(dbName) {
  try {
    // Remove from cache
    const cacheKeys = Array.from(dbInstances.keys()).filter(key => key.startsWith(dbName));
    cacheKeys.forEach(key => dbInstances.delete(key));

    // Delete database
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error(`Failed to delete database: ${request.error?.message || 'Unknown error'}`));
    });
    return true;
  } catch (error) {
    console.error('[IndexedDB] Error deleting database:', error);
    return false;
  }
}
/* harmony default export */ const utils_indexedDB = (IndexedDBStore);
;// ./assets/src/utils/wporgCache.js
/**
 * WordPress.org API Cache - Persistent cache for WordPress.org existence checks
 *
 * Caches WordPress.org plugin/theme existence checks in IndexedDB with 7-day expiration.
 * Provides 3-15 second performance improvement per publish by eliminating redundant API calls.
 *
 * Features:
 * - Persistent storage across browser sessions
 * - 7-day cache expiration
 * - In-memory L1 cache for current session
 * - Automatic cleanup of expired entries
 * - Works in WordPress Playground WASM environment
 */



/**
 * Cache configuration
 */
const WPORG_CACHE_CONFIG = {
  dbName: 'aether-wporg-cache',
  version: 1,
  stores: {
    wporgChecks: {
      keyPath: 'cacheKey',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'type',
        keyPath: 'type',
        unique: false
      }]
    }
  }
};

/**
 * Cache expiration time (7 days)
 * WordPress.org plugins/themes don't change frequently, so 7 days is safe
 */
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * WordPress.org Cache Manager
 *
 * Provides persistent caching of WordPress.org existence checks
 */
class WpOrgCache {
  /**
   * Constructor
   */
  constructor() {
    this.store = new utils_indexedDB('wporgChecks', WPORG_CACHE_CONFIG);
    this.memoryCache = new Map(); // L1 cache for current session
    this.cleanupPromise = null; // Track cleanup to avoid concurrent runs
  }

  /**
   * Generate cache key
   *
   * @param {string} slug - Plugin/theme slug
   * @param {string} type - 'plugin' or 'theme'
   * @return {string} Cache key
   */
  getCacheKey(slug, type) {
    return `${type}:${slug}`;
  }

  /**
   * Get cached existence check result
   *
   * Checks memory cache first, then IndexedDB
   *
   * @param {string} slug - Plugin/theme slug
   * @param {string} type - 'plugin' or 'theme'
   * @return {Promise<boolean|null>} Cached result or null if not found/expired
   */
  async get(slug, type) {
    const cacheKey = this.getCacheKey(slug, type);

    // L1: Check memory cache first (instant)
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    // L2: Check IndexedDB
    try {
      const cached = await this.store.get(cacheKey);

      // Check if cache entry exists and is not expired
      if (cached && cached.timestamp) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_EXPIRATION_MS) {
          // Valid cache hit - store in memory for faster access
          this.memoryCache.set(cacheKey, cached.exists);
          return cached.exists;
        }

        // Cache expired - delete it
        await this.store.delete(cacheKey);
      }
    } catch (error) {
      console.error(`[WpOrgCache] Error getting cache for ${cacheKey}:`, error);
    }
    return null; // Cache miss or error
  }

  /**
   * Set cached existence check result
   *
   * Stores in both memory and IndexedDB
   *
   * @param {string}  slug   - Plugin/theme slug
   * @param {string}  type   - 'plugin' or 'theme'
   * @param {boolean} exists - Whether the asset exists on WordPress.org
   * @return {Promise<boolean>} True if successfully cached
   */
  async set(slug, type, exists) {
    const cacheKey = this.getCacheKey(slug, type);

    // L1: Store in memory
    this.memoryCache.set(cacheKey, exists);

    // L2: Store in IndexedDB
    try {
      await this.store.set(cacheKey, {
        exists
      }, {
        type,
        slug
      });
      return true;
    } catch (error) {
      console.error(`[WpOrgCache] Error setting cache for ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired cache entries
   *
   * Runs automatically on initialization, removes entries older than 7 days
   *
   * @return {Promise<number>} Number of entries cleaned up
   */
  async cleanup() {
    // Prevent concurrent cleanup runs
    if (this.cleanupPromise) {
      return this.cleanupPromise;
    }
    this.cleanupPromise = (async () => {
      try {
        const deleted = await this.store.deleteOlderThan(CACHE_EXPIRATION_MS);
        if (deleted > 0) {
          console.log(`[WpOrgCache] Cleaned up ${deleted} expired cache entries`);
        }
        return deleted;
      } catch (error) {
        console.error('[WpOrgCache] Error during cleanup:', error);
        return 0;
      } finally {
        this.cleanupPromise = null;
      }
    })();
    return this.cleanupPromise;
  }

  /**
   * Clear all cached data
   *
   * @return {Promise<boolean>} True if successful
   */
  async clear() {
    this.memoryCache.clear();
    return this.store.clear();
  }

  /**
   * Get cache statistics
   *
   * @return {Promise<Object>} Cache statistics
   */
  async getStats() {
    try {
      const totalCount = await this.store.count();
      const memoryCount = this.memoryCache.size;
      return {
        totalCached: totalCount,
        memoryCached: memoryCount,
        hitRate: null // Would require tracking hits/misses
      };
    } catch (error) {
      console.error('[WpOrgCache] Error getting stats:', error);
      return {
        totalCached: 0,
        memoryCached: this.memoryCache.size,
        hitRate: null
      };
    }
  }

  /**
   * Get all cached entries for debugging
   *
   * @return {Promise<Array>} Array of all cached entries
   */
  async getAllEntries() {
    try {
      return await this.store.getAll();
    } catch (error) {
      console.error('[WpOrgCache] Error getting all entries:', error);
      return [];
    }
  }
}

// Create singleton instance
let cacheInstance = null;

/**
 * Get WordPress.org cache instance (singleton)
 *
 * @return {WpOrgCache} Cache instance
 */
function getWpOrgCache() {
  if (!cacheInstance) {
    cacheInstance = new WpOrgCache();

    // Run cleanup on first initialization
    cacheInstance.cleanup().catch(error => {
      console.error('[WpOrgCache] Initial cleanup failed:', error);
    });
  }
  return cacheInstance;
}
/* harmony default export */ const wporgCache = ((/* unused pure expression or super */ null && (getWpOrgCache)));
;// ./assets/src/utils/useAssetDiscovery.js
/**
 * Asset Discovery Hook
 *
 * Replaces PHP-based AssetDiscoveryService with browser-based implementation.
 * Detects WordPress.org plugins/themes by checking wordpress.org URLs.
 *
 * @package
 */






/**
 * Normalize plugin slug to directory name only.
 * WordPress stores plugins as 'akismet/akismet.php' but WordPress.org expects just 'akismet'.
 *
 * @param {string} slug - Plugin slug (may include file path)
 * @return {string} Normalized slug (directory name only)
 */
function normalizePluginSlug(slug) {
  // If slug contains a slash, extract just the directory name (first part)
  // Example: 'akismet/akismet.php' -> 'akismet'
  if (slug.includes('/')) {
    return slug.split('/')[0];
  }
  return slug;
}

/**
 * Check if a plugin or theme exists on WordPress.org
 *
 * Uses filterable method (default: PHP server-side) to check WordPress.org.
 * Can be switched to CORS proxy or direct API calls via WordPress filters.
 *
 * @param {string} slug   - Plugin or theme slug (will be normalized for plugins)
 * @param {string} type   - 'plugin' or 'theme'
 * @param {Object} config - Configuration object with wporgCheckMethod and corsProxyUrl
 * @return {Promise<boolean>} True if asset exists on WordPress.org
 */
async function isFromWordPressOrg(slug, type, config = {}) {
  // Normalize plugin slugs (remove file path if present)
  // Example: 'akismet/akismet.php' -> 'akismet'
  const normalizedSlug = type === 'plugin' ? normalizePluginSlug(slug) : slug;

  // Check persistent cache first (IndexedDB + memory)
  const cache = getWpOrgCache();
  const cached = await cache.get(normalizedSlug, type);
  if (cached !== null) {
    return cached;
  }

  // Try PHP method first, then fallback to CORS proxy
  let result = await checkWithMethod(normalizedSlug, type, 'php', config);

  // If PHP method returned null (unable to check), try CORS proxy fallback
  if (result === null) {
    debug_debugWarn(`PHP WordPress.org check returned null for ${type} "${slug}", trying CORS proxy fallback`);
    result = await checkWithMethod(normalizedSlug, type, 'cors-proxy', config);
  }

  // If still null after fallback, treat as false
  if (result === null) {
    debug_debugWarn(`All WordPress.org check methods failed for ${type} "${slug}", treating as custom asset`);
    result = false;
  }

  // Cache the result (only if we got a definitive answer)
  if (result !== null) {
    await cache.set(normalizedSlug, type, result);
  }
  return result;
}

/**
 * Check WordPress.org using specific method
 *
 * @param {string} slug   - Normalized plugin/theme slug
 * @param {string} type   - 'plugin' or 'theme'
 * @param {string} method - 'php', 'cors-proxy', or 'direct'
 * @param {Object} config - Configuration object
 * @return {Promise<boolean|null>} True if exists, false if doesn't exist, null if unable to check
 */
async function checkWithMethod(slug, type, method, config = {}) {
  try {
    let checkUrl;
    switch (method) {
      case 'cors-proxy':
        // Use external CORS proxy (e.g., cfp.s12y.org or custom worker)
        checkUrl = config.corsProxyUrl || 'https://cfp.s12y.org/check-wporg';
        checkUrl += `?slug=${encodeURIComponent(slug)}&type=${encodeURIComponent(type)}`;
        break;
      case 'direct':
        // Direct WordPress.org API calls (will fail in browsers due to CORS)
        if (type === 'theme') {
          checkUrl = `https://api.wordpress.org/themes/info/1.2/?action=theme_information&request[slug]=${encodeURIComponent(slug)}`;
        } else {
          checkUrl = `https://api.wordpress.org/plugins/info/1.0/${encodeURIComponent(slug)}.json`;
        }
        break;
      case 'php':
      default:
        // PHP server-side method (default, no CORS issues)
        // apiFetch expects path without /wp-json prefix
        checkUrl = `/aether/site-exporter/check-wporg?slug=${encodeURIComponent(slug)}&type=${encodeURIComponent(type)}`;
        break;
    }

    // For PHP method, use apiFetch (includes WordPress auth)
    // For other methods, use plain fetch
    let data;
    if (method === 'php') {
      // Use apiFetch for internal WordPress REST API calls
      // This includes nonce and authentication automatically
      data = await utils_api({
        path: checkUrl
      });
    } else {
      // Use plain fetch for external URLs (cors-proxy, direct)
      const response = await fetch(checkUrl);
      if (!response.ok) {
        throw new Error(`WordPress.org check returned ${response.status}`);
      }
      data = await response.json();
    }

    // Handle different response formats
    let exists;
    if (method === 'direct') {
      // Direct WordPress.org API: check for 'error' field
      exists = !data.error && (data.slug || data.name);
    } else {
      // PHP or CORS proxy: standardized response with 'success' and 'exists' fields
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }
      exists = data.exists;
    }

    // Return the result (could be true, false, or null)
    // null means "unable to check" and should trigger fallback
    return exists;
  } catch (error) {
    // Network/API error - return null to indicate unable to check
    debug_debugWarn(`Failed to check WordPress.org for ${type} "${slug}" using ${method} method:`, error);
    return null;
  }
}

/**
 * Get all installed plugins and themes with metadata from REST API
 *
 * @return {Promise<Object>} Object with plugins and themes arrays
 */
async function getInstalledAssets() {
  try {
    const response = await utils_api({
      path: '/aether/site-exporter/assets',
      method: 'GET'
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch assets');
    }
    return {
      plugins: response.plugins || [],
      themes: response.themes || []
    };
  } catch (error) {
    debug_debugWarn('Failed to fetch installed assets:', error);
    return {
      plugins: [],
      themes: []
    };
  }
}

/**
 * Asset Discovery Hook
 *
 * Provides methods to discover and categorize installed plugins/themes.
 *
 * @return {Object} Hook methods and state
 */
function useAssetDiscovery() {
  const [loading, setLoading] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);

  /**
   * Discover all custom assets (not from WordPress.org)
   *
   * @return {Promise<Array<Object>>} Array of custom assets
   */
  const discoverCustomAssets = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch config to get wporgCheckMethod
      const configResponse = await utils_api({
        path: '/aether/site-exporter/config',
        method: 'GET'
      });
      const config = configResponse || {};
      const {
        plugins,
        themes
      } = await getInstalledAssets();

      // Only include active plugins and themes (like getBlueprintAssets does)
      // This ensures the message shows only what will actually be included in the bundle
      const activePlugins = plugins.filter(plugin => plugin.is_active);

      // Get active theme (themes array should only have one active theme)
      const activeTheme = themes.find(theme => theme.is_active);
      const activeThemes = activeTheme ? [activeTheme] : [];

      // Check each asset against WordPress.org
      // Method is configurable via filters (default: PHP server-side)
      const items = [...activePlugins.map(p => ({
        ...p,
        assetType: 'plugin'
      })), ...activeThemes.map(t => ({
        ...t,
        assetType: 'theme'
      }))];

      // Check all assets in parallel
      const allAssets = await Promise.all(items.map(async item => {
        const fromWpOrg = await isFromWordPressOrg(item.slug, item.assetType, config);
        return {
          ...item,
          from_wporg: fromWpOrg
        };
      }));

      // Filter to only custom assets (not from WordPress.org)
      const customAssets = allAssets.filter(asset => !asset.from_wporg).map(asset => ({
        type: asset.assetType,
        slug: asset.slug,
        name: asset.name,
        version: asset.version
      }));
      setLoading(false);
      return customAssets;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Get WordPress.org assets for blueprint generation
   *
   * Returns only active plugins/themes from WordPress.org.
   * Custom assets will be included in wp-content.zip.
   *
   * @return {Promise<Object>} Object with plugins and themes arrays
   */
  const getBlueprintAssets = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch config to get wporgCheckMethod
      const configResponse = await utils_api({
        path: '/aether/site-exporter/config',
        method: 'GET'
      });
      const config = configResponse || {};
      const {
        plugins,
        themes
      } = await getInstalledAssets();

      // Only check active plugins
      const activePlugins = plugins.filter(plugin => plugin.is_active);

      // Get active theme and parent themes
      const activeTheme = themes.find(theme => theme.is_active);
      const activeThemes = activeTheme ? [activeTheme] : [];

      // Check each asset against WordPress.org
      // Method is configurable via filters (default: PHP server-side)
      const items = [...activePlugins.map(p => ({
        ...p,
        assetType: 'plugin'
      })), ...activeThemes.map(t => ({
        ...t,
        assetType: 'theme'
      }))];

      // Check all assets in parallel
      const allAssets = await Promise.all(items.map(async item => {
        const fromWpOrg = await isFromWordPressOrg(item.slug, item.assetType, config);
        return {
          ...item,
          from_wporg: fromWpOrg
        };
      }));

      // Filter to only WordPress.org assets
      const wporgPlugins = allAssets.filter(asset => asset.assetType === 'plugin' && asset.from_wporg).filter(plugin =>
      // Skip plugins that are built into Playground or already included
      !['aether', 'sqlite-database-integration'].includes(normalizePluginSlug(plugin.slug))).map(plugin => normalizePluginSlug(plugin.slug));
      const wporgThemes = allAssets.filter(asset => asset.assetType === 'theme' && asset.from_wporg).map(theme => normalizePluginSlug(theme.slug));
      setLoading(false);
      return {
        plugins: wporgPlugins,
        themes: wporgThemes,
        siteName: window.wp?.siteName || document.title
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);
  return {
    discoverCustomAssets,
    getBlueprintAssets,
    loading,
    error
  };
}
;// ./assets/src/publish/hooks/usePublishAPI.js
/**
 * Publish API Hook
 *
 * Handles API calls for publish operations
 *
 * @package
 */





function usePublishAPI() {
  const assetDiscovery = useAssetDiscovery();
  const discoverAssets = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    // Use browser-based asset discovery instead of PHP endpoint
    const customAssets = await assetDiscovery.discoverCustomAssets();
    return {
      success: true,
      assets: customAssets,
      count: customAssets.length
    };
  }, [assetDiscovery]);
  const getAssetStatus = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    // Use browser-based asset discovery instead of PHP endpoint
    const customAssets = await assetDiscovery.discoverCustomAssets();
    return {
      success: true,
      assets: customAssets,
      count: customAssets.length
    };
  }, [assetDiscovery]);
  const markAssetChanged = (0,external_wp_element_namespaceObject.useCallback)((type, slug) => {
    // Store changed assets in localStorage (no server needed)
    const changedAssets = JSON.parse(localStorage.getItem('aether_changed_assets') || '[]');
    const key = `${type}:${slug}`;
    if (!changedAssets.includes(key)) {
      changedAssets.push(key);
      localStorage.setItem('aether_changed_assets', JSON.stringify(changedAssets));
    }
    return Promise.resolve({
      success: true,
      message: `Marked ${type} ${slug} as changed`
    });
  }, []);
  const getGitConfig = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    const response = await utils_api({
      path: ENDPOINTS.GIT.CONFIG
    });
    return response;
  }, []);
  return {
    discoverAssets,
    getAssetStatus,
    markAssetChanged,
    getGitConfig
  };
}
;// ./assets/src/publish/hooks/useAssetManager.js
/**
 * Asset Manager Hook
 *
 * Manages asset state in localStorage
 *
 * @package
 */


const STORAGE_KEY = 'aetherAssets';
function useAssetManager() {
  const [assets, setAssets] = (0,external_wp_element_namespaceObject.useState)({});

  // Load assets from localStorage on mount
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setAssets(JSON.parse(data));
      }
    } catch (error) {
      // Failed to load assets from localStorage
    }
  }, []);

  // Save assets to localStorage whenever they change
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    } catch (error) {
      // Failed to save assets to localStorage
    }
  }, [assets]);
  const markAsChanged = (0,external_wp_element_namespaceObject.useCallback)((type, slug) => {
    setAssets(prev => {
      const updated = {
        ...prev
      };
      const existingAsset = updated[slug];
      updated[slug] = existingAsset ? {
        ...existingAsset,
        needsUpload: true
      } : {
        type,
        slug,
        needsUpload: true
      };
      return updated;
    });
  }, []);
  const updateFromServer = (0,external_wp_element_namespaceObject.useCallback)(assetData => {
    const {
      slug,
      type,
      name,
      existsOnR2 = assetData.exists_on_r2 || false
    } = assetData;
    setAssets(prev => {
      const updated = {
        ...prev
      };
      const existingAsset = updated[slug];
      updated[slug] = existingAsset ? {
        ...existingAsset,
        existsOnR2,
        name,
        needsUpload: !existsOnR2
      } : {
        type,
        slug,
        name,
        existsOnR2,
        needsUpload: !existsOnR2
      };
      return updated;
    });
  }, []);
  const syncWithServer = (0,external_wp_element_namespaceObject.useCallback)(serverAssets => {
    if (!Array.isArray(serverAssets)) {
      return;
    }
    setAssets(prev => {
      const updated = {
        ...prev
      };
      serverAssets.forEach(assetData => {
        const {
          slug
        } = assetData;
        const existingAsset = updated[slug];
        const existsOnR2 = assetData.existsOnR2 || assetData.exists_on_r2 || false;
        updated[slug] = existingAsset ? {
          ...existingAsset,
          existsOnR2,
          name: assetData.name,
          needsUpload: existingAsset.needsUpload || !existsOnR2
        } : {
          type: assetData.type,
          slug,
          name: assetData.name,
          existsOnR2,
          needsUpload: !existsOnR2
        };
      });
      return updated;
    });
  }, []);
  const getChangedAssets = (0,external_wp_element_namespaceObject.useCallback)(() => {
    return Object.values(assets).filter(asset => asset.needsUpload).map(asset => `${asset.type}:${asset.slug}`);
  }, [assets]);
  const clearUploadFlags = (0,external_wp_element_namespaceObject.useCallback)(() => {
    setAssets(prev => {
      const updated = {
        ...prev
      };
      Object.keys(updated).forEach(slug => {
        updated[slug] = {
          ...updated[slug],
          needsUpload: false
        };
      });
      return updated;
    });
  }, []);
  return {
    assets,
    markAsChanged,
    updateFromServer,
    syncWithServer,
    getChangedAssets,
    clearUploadFlags
  };
}
;// ./assets/src/utils/standardResponse.js
/**
 * Standard Response Format Utility
 *
 * Provides standardized response object format for all API operations.
 * Eliminates inconsistent response structures across the codebase.
 *
 * Standard format:
 * {
 *   success: boolean,
 *   data?: any,           // Success data
 *   error?: string,       // Single error message
 *   errors?: string[]     // Multiple errors (optional)
 * }
 *
 * @package
 */

/**
 * Create a success response.
 *
 * @param {*}      data    Success data (can be any type).
 * @param {string} message Optional success message.
 * @return {Object} Standardized success response.
 */
function createSuccessResponse(data = null, message = null) {
  const response = {
    success: true,
    data
  };

  // Add message to data if provided
  if (message && typeof data === 'object' && data !== null) {
    response.data = {
      ...data,
      message
    };
  } else if (message) {
    response.data = {
      message
    };
  }
  return response;
}

/**
 * Create an error response.
 *
 * @param {string|Error} error  Error message or Error object.
 * @param {Array}        errors Optional array of multiple errors.
 * @return {Object} Standardized error response.
 */
function createErrorResponse(error, errors = null) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error';
  const response = {
    success: false,
    error: errorMessage
  };
  if (errors && Array.isArray(errors) && errors.length > 0) {
    response.errors = errors;
  }
  return response;
}

/**
 * Normalize a response to standard format.
 *
 * Takes various response formats and converts to standard format.
 * Handles legacy formats for migration.
 *
 * @param {Object} response Response to normalize.
 * @return {Object} Normalized response in standard format.
 */
function normalizeResponse(response) {
  // Already in standard format
  if (response && typeof response.success === 'boolean' && (response.data !== undefined || response.error !== undefined)) {
    return response;
  }

  // Legacy format with error field
  if (response && response.error) {
    return createErrorResponse(response.error, response.errors);
  }

  // Legacy format with success=true but no data field
  if (response && response.success === true) {
    // Extract data from non-standard fields
    const {
      success,
      error,
      errors,
      ...data
    } = response;
    return createSuccessResponse(data);
  }

  // Legacy format with success=false
  if (response && response.success === false) {
    return createErrorResponse(response.message || response.error || 'Operation failed', response.errors);
  }

  // Fallback for unknown format
  return response;
}

/**
 * Check if response indicates success.
 *
 * @param {Object} response Response object.
 * @return {boolean} True if successful.
 */
function isSuccessResponse(response) {
  return response?.success === true;
}

/**
 * Check if response indicates error.
 *
 * @param {Object} response Response object.
 * @return {boolean} True if error.
 */
function isErrorResponse(response) {
  return response?.success === false;
}

/**
 * Get data from response.
 *
 * @param {Object} response Response object.
 * @param {*}      fallback Fallback value if no data.
 * @return {*} Response data or fallback.
 */
function getResponseData(response, fallback = null) {
  if (isSuccessResponse(response)) {
    // Return data even if it's null (null is valid data)
    return 'data' in response ? response.data : fallback;
  }
  return fallback;
}

/**
 * Get error from response.
 *
 * @param {Object} response     Response object.
 * @param {string} defaultError Default error message.
 * @return {string} Error message.
 */
function getResponseError(response, defaultError = 'Unknown error') {
  if (isErrorResponse(response)) {
    return response.error || defaultError;
  }
  return defaultError;
}

/**
 * Get all errors from response.
 *
 * @param {Object} response Response object.
 * @return {Array<string>} Array of error messages.
 */
function getResponseErrors(response) {
  if (isErrorResponse(response)) {
    const errors = [];
    if (response.error) {
      errors.push(response.error);
    }
    if (response.errors && Array.isArray(response.errors)) {
      errors.push(...response.errors);
    }
    return errors;
  }
  return [];
}
;// ./assets/src/utils/filesystemAdapter.js
/**
 * Filesystem Adapter
 *
 * Adapter for local filesystem storage operations via REST API.
 * Replaces workerEndpointClient.js for local storage.
 *
 * @package
 */





/**
 * Upload a file to local filesystem via REST API.
 *
 * @param {string}    staticPath Base path for static files.
 * @param {string}    key        File path/key relative to static path.
 * @param {File|Blob} file       File to upload.
 * @param {Object}    options    Optional options (contentType, cacheControl, onProgress, jobId).
 * @return {Promise<Object>} Upload result with success and optional url/error.
 */
async function uploadFile(staticPath, key, file, options = {}) {
  try {
    // Validate key parameter
    if (!key || key === '') {
      const error = new Error(`Upload key is empty. File: ${file?.name || 'unknown'}, staticPath: ${staticPath}`);
      return createErrorResponse(error.message);
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    formData.append('static_path', staticPath);
    formData.append('job_id', options.jobId || '');
    if (options.contentType) {
      formData.append('content_type', options.contentType);
    }
    const response = await utils_api({
      path: '/aether/site-exporter/local-storage/upload',
      method: 'POST',
      body: formData
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Upload failed');
    }

    // Call progress callback if provided (100% since we don't have chunked upload yet)
    if (options.onProgress) {
      options.onProgress(file.size, file.size, 100);
    }
    return createSuccessResponse();
  } catch (error) {
    debug('filesystemAdapter.uploadFile error:', error);
    return createErrorResponse(error.message || 'Upload failed');
  }
}

/**
 * Delete a file from local filesystem.
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to delete.
 * @param {Object} options    Optional options (jobId).
 * @return {Promise<Object>} Delete result.
 */
async function deleteFile(staticPath, key, options = {}) {
  debug('filesystemAdapter.deleteFile:', {
    staticPath,
    key
  });
  try {
    const response = await utils_api({
      path: '/aether/site-exporter/local-storage/delete',
      method: 'DELETE',
      data: {
        key,
        static_path: staticPath,
        job_id: options.jobId || ''
      }
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Delete failed');
    }
    return createSuccessResponse();
  } catch (error) {
    debug('filesystemAdapter.deleteFile error:', error);
    return createErrorResponse(error.message || 'Delete failed');
  }
}

/**
 * Copy a file (not needed for local filesystem - files are uploaded directly).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} sourceKey  Source file path/key.
 * @param {string} destKey    Destination file path/key.
 * @return {Promise<Object>} Copy result.
 */
async function copyFile(staticPath, sourceKey, destKey) {
  // Parameters kept for API consistency, but not used for local filesystem
  // eslint-disable-next-line no-unused-vars
  const _unused = {
    staticPath,
    sourceKey,
    destKey
  };
  // Not implemented for local filesystem
  // Files are uploaded directly to their final location
  debug('filesystemAdapter.copyFile: Not implemented (not needed for local storage)');
  return createSuccessResponse();
}

/**
 * List objects in a directory (not needed for static site generation).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} prefix     Directory prefix to list.
 * @param {number} limit      Maximum number of objects to return.
 * @return {Promise<Object>} List result.
 */
async function listObjects(staticPath, prefix = '', limit = 1000) {
  // Parameters kept for API consistency, but not used for local filesystem
  // eslint-disable-next-line no-unused-vars
  const _unused = {
    staticPath,
    prefix,
    limit
  };
  // Not implemented - not needed for static site generation
  // Static site generator doesn't need to list existing files
  debug('filesystemAdapter.listObjects: Not implemented (not needed for static site generation)');
  return createSuccessResponse({
    objects: []
  });
}

/**
 * Batch copy files (not needed for local filesystem).
 *
 * @param {string} staticPath Base path for static files.
 * @param {Array}  operations Array of {source, dest} operations.
 * @return {Promise<Object>} Batch copy result.
 */
async function batchCopy(staticPath, operations) {
  // Parameters kept for API consistency, but not used for local filesystem
  // eslint-disable-next-line no-unused-vars
  const _unused = {
    staticPath,
    operations
  };
  // Not implemented for local filesystem
  debug('filesystemAdapter.batchCopy: Not implemented (not needed for local storage)');
  return createSuccessResponse();
}

/**
 * Batch delete files.
 *
 * @param {string} staticPath Base path for static files.
 * @param {Array}  keys       Array of file paths/keys to delete.
 * @param {Object} options    Optional options (jobId).
 * @return {Promise<Object>} Batch delete result.
 */
async function batchDelete(staticPath, keys, options = {}) {
  debug('filesystemAdapter.batchDelete:', {
    staticPath,
    count: keys.length
  });
  try {
    const response = await utils_api({
      path: '/aether/site-exporter/local-storage/batch-delete',
      method: 'DELETE',
      data: {
        keys,
        static_path: staticPath,
        job_id: options.jobId || ''
      }
    });
    if (!response.success) {
      return createErrorResponse(response.error || 'Batch delete failed');
    }
    return createSuccessResponse();
  } catch (error) {
    debug('filesystemAdapter.batchDelete error:', error);
    return createErrorResponse(error.message || 'Batch delete failed');
  }
}

/**
 * Download a file (manifest).
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} key        File path/key to download.
 * @param {Object} options    Optional options (jobId).
 * @return {Promise<Blob|null>} File blob or null if not found.
 */
async function downloadFile(staticPath, key, options = {}) {
  debug('filesystemAdapter.downloadFile:', {
    staticPath,
    key
  });
  try {
    const response = await utils_api({
      path: `/aether/site-exporter/local-storage/download?key=${encodeURIComponent(key)}&static_path=${encodeURIComponent(staticPath)}&job_id=${options.jobId || ''}`,
      method: 'GET',
      parse: false // Get raw response
    });
    if (!response.ok) {
      return null;
    }
    return await response.blob();
  } catch (error) {
    debug('filesystemAdapter.downloadFile error:', error);
    return null;
  }
}

/**
 * Get public URL for a file.
 *
 * @param {string} staticPath Base path for static files.
 * @param {string} baseUrl    Base URL for static files.
 * @param {string} key        File path/key.
 * @return {string} Public URL.
 */
function getObjectUrl(staticPath, baseUrl, key) {
  // For local filesystem, construct URL from baseUrl and key
  // Remove any trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // Remove leading slash from key if present
  const cleanKey = key.replace(/^\//, '');
  return `${cleanBaseUrl}/${cleanKey}`;
}
;// ./assets/src/providers/services/storageService.js
/**
 * Storage Service
 *
 * Storage service for local filesystem operations.
 * All operations go through REST API endpoints.
 *
 * @package
 */



/**
 * Storage Service class.
 */
class StorageService {
  /**
   * Constructor.
   *
   * @param {string} staticPath Path for static files storage.
   * @param {string} jobId      Job ID for this export (optional, defaults to empty string).
   * @param {Object} config     Optional configuration.
   */
  constructor(staticPath, jobId = '', config = {}) {
    this.staticPath = staticPath;
    this.jobId = jobId;
    this.config = config;
    this.baseUrl = config.public_url || config.base_url || '';
  }

  /**
   * Upload a file to storage.
   *
   * @param {string}    key      Object key/path in storage.
   * @param {File|Blob} file     File to upload.
   * @param {Object}    metadata Optional metadata (contentType, cacheControl, onProgress).
   * @return {Promise<Object>} Result array with 'success' and optional 'url', 'error'.
   */
  async upload(key, file, metadata = {}) {
    if (!(file instanceof File || file instanceof Blob)) {
      return {
        success: false,
        error: 'File must be a File or Blob object'
      };
    }
    const options = {
      contentType: metadata.contentType || file.type,
      cacheControl: metadata.cacheControl || '',
      onProgress: metadata.onProgress || null,
      jobId: this.jobId
    };
    const result = await uploadFile(this.staticPath, key, file, options);
    if (!result.success) {
      return result;
    }

    // Build public URL.
    const url = this.getUrl(key);
    return {
      success: true,
      url
    };
  }

  /**
   * Delete a file from storage.
   *
   * @param {string} key Object key/path.
   * @return {Promise<Object>} Result array with 'success' and optional 'error'.
   */
  async delete(key) {
    return deleteFile(this.staticPath, key, {
      jobId: this.jobId
    });
  }

  /**
   * Copy an object from source to destination within storage.
   *
   * @param {string} sourceKey Source object key.
   * @param {string} destKey   Destination object key.
   * @return {Promise<Object>} Result array with 'success' and optional 'error'.
   */
  async copy(sourceKey, destKey) {
    return copyFile(this.staticPath, sourceKey, destKey);
  }

  /**
   * Check if a file exists in storage.
   *
   * @param {string} key Object key/path.
   * @return {Promise<boolean>} True if exists, false otherwise.
   */
  async exists(key) {
    // Key parameter kept for API consistency, but not used for local filesystem
    // eslint-disable-next-line no-unused-vars
    const _unused = key;
    // Not implemented for local filesystem - not needed for static site generation
    return false;
  }

  /**
   * List objects in storage.
   *
   * @param {string} prefix Optional prefix to filter objects.
   * @param {number} limit  Maximum number of objects to return.
   * @return {Promise<Object>} Result array with 'success', 'objects' array, and optional 'error'.
   */
  async listObjects(prefix = '', limit = 1000) {
    return listObjects(this.staticPath, prefix, limit);
  }

  /**
   * Get public URL for an object.
   *
   * @param {string} key Object key/path.
   * @return {string} Public URL.
   */
  getUrl(key) {
    // Use baseUrl if available
    if (this.baseUrl) {
      return getObjectUrl(this.staticPath, this.baseUrl, key);
    }
    // Return key as fallback (relative path)
    return key;
  }

  /**
   * Batch copy multiple objects in storage.
   *
   * @param {Array} operations Array of {source, dest} objects.
   * @return {Promise<Object>} Result with success, copied count, errors count, and results array.
   */
  async batchCopy(operations) {
    return batchCopy(this.staticPath, operations);
  }

  /**
   * Batch delete multiple objects from storage.
   *
   * @param {Array} keys Array of object keys to delete.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async batchDelete(keys) {
    return batchDelete(this.staticPath, keys, {
      jobId: this.jobId
    });
  }

  /**
   * Download manifest file from storage.
   *
   * @return {Promise<Blob|null>} Manifest blob or null if not found.
   */
  async downloadManifest() {
    const manifestKey = 'file-manifest.json';
    try {
      const blob = await downloadFile(this.staticPath, manifestKey, {
        jobId: this.jobId
      });
      return blob;
    } catch (error) {
      // Return null if file doesn't exist (404) or other error.
      return null;
    }
  }

  /**
   * Upload manifest file to storage.
   *
   * @param {Blob} blob Manifest blob to upload.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async uploadManifest(blob) {
    const manifestKey = 'file-manifest.json';
    const result = await this.upload(manifestKey, blob, {
      contentType: 'application/json'
    });
    return result;
  }

  /**
   * Test connection to storage service.
   *
   * @return {Promise<Object>} Result array with 'success' and optional 'message', 'error'.
   */
  async testConnection() {
    // For local filesystem, always return success
    return {
      success: true,
      message: 'Local filesystem storage is ready.'
    };
  }
}
// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
;// ./assets/src/publish/utils/urlRewriter.js
/**
 * URL Resolver Utility
 *
 * Provides reusable methods for URL parsing, resolution, and normalization.
 * Ported from PHP URLResolver class.
 *
 * @package
 */




/**
 * Resolve relative URL against a base URL.
 *
 * @param {string} url     Relative or absolute URL.
 * @param {string} baseUrl Base URL for resolution.
 * @return {string} Absolute URL.
 */
function resolveRelative(url, baseUrl) {
  // Data URLs should never be resolved - return as-is.
  if (url.startsWith('data:')) {
    return url;
  }

  // Already absolute.
  try {
    new URL(url);
    return url;
  } catch {
    // Not a valid absolute URL, continue
  }

  // Protocol-relative.
  if (url.startsWith('//')) {
    return 'https:' + url;
  }

  // Absolute path.
  if (url.startsWith('/')) {
    const base = new URL(baseUrl);
    return base.origin + url;
  }

  // Relative to base URL directory.
  const base = new URL(baseUrl);
  const baseDir = base.pathname.substring(0, base.pathname.lastIndexOf('/'));
  const resolvedUrl = base.origin + baseDir + '/' + url;

  /**
   * Filter resolved URL after relative-to-absolute conversion.
   *
   * Allows customization of URL resolution logic.
   *
   * @param {string} resolvedUrl Resolved absolute URL.
   * @param {string} url         Original relative URL.
   * @param {string} baseUrl     Base URL used for resolution.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.url.resolve', 'my-plugin', (resolvedUrl, url, baseUrl) => {
   *     // Custom CDN mapping for assets
   *     if (url.includes('/uploads/')) {
   *         return resolvedUrl.replace('example.com', 'cdn.example.com');
   *     }
   *     return resolvedUrl;
   * });
   */
  return (0,external_wp_hooks_.applyFilters)('aether.url.resolve', resolvedUrl, url, baseUrl);
}

/**
 * Check if URL is external to the site.
 *
 * @param {string} url     URL to check.
 * @param {string} siteUrl Site URL for comparison.
 * @return {boolean} True if external.
 */
function isExternal(url, siteUrl) {
  // Relative URLs are not external.
  if (url.startsWith('/') && !url.startsWith('//')) {
    return false;
  }
  let isExternalUrl = false;

  // URLs that start with http:// or https:// - check host.
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const siteObj = new URL(siteUrl);
      isExternalUrl = urlObj.host !== siteObj.host;
    } catch {
      // If we can't parse, treat as external to be safe.
      isExternalUrl = true;
    }
  }
  // Protocol-relative URLs - check host.
  else if (url.startsWith('//')) {
    try {
      const urlObj = new URL('https:' + url);
      const siteObj = new URL(siteUrl);
      isExternalUrl = urlObj.host !== siteObj.host;
    } catch {
      // If we can't parse, treat as external to be safe.
      isExternalUrl = true;
    }
  }
  // If it doesn't start with a scheme or /, treat as external to be safe.
  else {
    isExternalUrl = true;
  }

  /**
   * Filter external URL detection result.
   *
   * Allows customization of what's considered "external" for URL rewriting.
   *
   * @param {boolean} isExternalUrl Whether URL is considered external.
   * @param {string}  url           URL being checked.
   * @param {string}  siteUrl       Site URL for comparison.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.url.is_external', 'my-plugin', (isExternal, url, siteUrl) => {
   *     // Treat CDN subdomain as internal
   *     if (url.includes('cdn.example.com') && siteUrl.includes('example.com')) {
   *         return false;
   *     }
   *     return isExternal;
   * });
   */
  return (0,external_wp_hooks_.applyFilters)('aether.url.is_external', isExternalUrl, url, siteUrl);
}

/**
 * Force URL to use HTTPS scheme.
 *
 * @param {string} url URL to convert.
 * @return {string} URL with HTTPS scheme.
 */
function forceHttps(url) {
  // Skip data URLs, anchors, and protocol-relative URLs.
  if (url.startsWith('data:') || url.startsWith('#') || url.startsWith('//')) {
    return url;
  }

  // Convert http:// to https://.
  if (url.startsWith('http://')) {
    return 'https://' + url.substring(7);
  }
  return url;
}

/**
 * Strip WordPress Playground scope from path.
 *
 * WordPress Playground uses scoped URLs like:
 * https://playground.wordpress.net/scope:happy-classic-town/
 * https://static-wp.s12y.org/scope:0.1208622458215515/
 *
 * @param {string} path Path that may contain Playground scope.
 * @return {string} Path with scope removed.
 */
function stripPlaygroundScope(path) {
  // Pattern matches: /scope:some-words/ or scope:some-words/
  // Both at the beginning of the string and repeated in the path.
  // Scope can contain alphanumeric, hyphens, dots, and colons (e.g., scope:0.1208622458215515)
  let result = path.replace(/^\/?scope:[a-z0-9.:-]+\//i, '');
  result = result.replace(/\/scope:[a-z0-9.:-]+\//gi, '/');
  // Handle case where path is just the scope with no trailing content.
  result = result.replace(/^\/?scope:[a-z0-9.:-]+$/i, '');
  return result;
}

/**
 * Normalize a URL for comparison.
 *
 * Removes fragments, trailing slashes, and normalizes scheme.
 *
 * @param {string} url     URL to normalize.
 * @param {string} siteUrl Site URL for HTTPS enforcement.
 * @return {string} Normalized URL.
 */
function normalize(url, siteUrl) {
  // Handle relative URLs.
  if (url.startsWith('/') && !url.startsWith('//')) {
    try {
      const siteObj = new URL(siteUrl);
      url = siteObj.origin + url;
    } catch {
      // If siteUrl is invalid, return as-is
    }
  }

  // Strip WordPress Playground scope from URL path.
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname) {
      urlObj.pathname = stripPlaygroundScope(urlObj.pathname);
      url = urlObj.toString();
    }
  } catch {
    // If URL parsing fails, try to strip scope from path directly
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      const strippedPath = stripPlaygroundScope(pathMatch[1]);
      url = url.replace(pathMatch[1], strippedPath);
    }
  }

  // Remove URL fragments.
  const fragmentIndex = url.indexOf('#');
  if (fragmentIndex !== -1) {
    url = url.substring(0, fragmentIndex);
  }

  // Remove trailing slash.
  url = url.replace(/\/$/, '');

  /**
   * Filter normalized URL.
   *
   * Allows customization of URL normalization logic.
   *
   * @param {string} url     Normalized URL.
   * @param {string} siteUrl Site URL used for normalization.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.url.normalize', 'my-plugin', (url, siteUrl) => {
   *     // Custom normalization: remove query parameters
   *     try {
   *         const urlObj = new URL(url);
   *         urlObj.search = '';
   *         return urlObj.toString();
   *     } catch {
   *         return url;
   *     }
   * });
   */
  return (0,external_wp_hooks_.applyFilters)('aether.url.normalize', url, siteUrl);
}

/**
 * URL Rewriter
 *
 * Rewrites WordPress URLs to static URLs for the static site.
 * Ported from PHP URLRewriterService class.
 *
 * @package
 */

/**
 * Create URL rewriter instance.
 *
 * @param {string}                 siteUrl   Site URL.
 * @param {string|null}            staticUrl Static site URL (where it will be deployed).
 * @param {Object<string, string>} urlMap    Optional URL mapping cache.
 * @return {Object} URL rewriter instance.
 */
function createUrlRewriter(siteUrl, staticUrl = null, urlMap = {}) {
  // Force HTTPS for site URL to avoid mixed content issues.
  const normalizedSiteUrl = forceHttps(siteUrl);

  // Treat empty string as null.
  // Do NOT force HTTPS on static URL - preserve the protocol the user configured
  const normalizedStaticUrl = staticUrl && staticUrl.trim() ? staticUrl.trim() : null;

  // Detect if static URL is a public URL (direct R2 access) vs worker endpoint.
  // Public URLs need /static/ prefix, worker endpoints add it internally.
  // Worker endpoints contain .workers.dev.
  // Local URLs with paths (like localhost:10003/static) should NOT get prefix - they already have the path.
  let isPublicUrl = normalizedStaticUrl && !normalizedStaticUrl.includes('.workers.dev');

  // If the static URL has a pathname component (other than /), don't add /static prefix
  // Example: http://localhost:10003/static already has /static in the path
  if (isPublicUrl && normalizedStaticUrl) {
    try {
      const urlObj = new URL(normalizedStaticUrl);
      if (urlObj.pathname && urlObj.pathname !== '/') {
        // URL already has a path component, don't add /static prefix
        isPublicUrl = false;
      }
    } catch {
      // URL parsing failed, leave isPublicUrl as is
    }
  }

  // Build initial URL mapping (homepage).
  // Include both HTTP and HTTPS versions of the site URL in the mapping.
  const mapping = {
    [normalizedSiteUrl]: '/',
    [normalizedSiteUrl + '/']: '/',
    // Also include original siteUrl (HTTP) if different from normalized
    ...(siteUrl !== normalizedSiteUrl ? {
      [siteUrl]: '/',
      [siteUrl + '/']: '/'
    } : {}),
    ...urlMap
  };

  /**
   * Convert WordPress URL to static path.
   *
   * @param {string} url URL to convert.
   * @return {string} Static path.
   */
  function convertToStaticPath(url) {
    // Handle relative URLs.
    if (url.startsWith('/') && !url.startsWith('//')) {
      // Strip WordPress Playground scope from relative URLs.
      return stripPlaygroundScope(url);
    }

    // Parse URL.
    let path = '/';
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname || '/';
    } catch {
      // If URL parsing fails, try to extract path manually
      const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
      if (pathMatch) {
        path = pathMatch[1];
      } else if (url.includes('?')) {
        // Handle query parameters
        const parts = url.split('?');
        path = parts[0];
      }
    }

    // Remove leading/trailing slashes.
    path = path.replace(/^\/+|\/+$/g, '');

    // Strip WordPress Playground scope from path.
    path = stripPlaygroundScope(path);
    if (!path) {
      return '/';
    }

    // Handle WordPress query parameters.
    try {
      const urlObj = new URL(url);
      if (urlObj.search) {
        const params = new URLSearchParams(urlObj.search);

        // Note: We can't resolve ?p=123 or ?page_id=123 without WordPress API
        // These will be handled by the URL mapping if provided, or left as query params
        // For now, convert search queries
        if (params.has('s')) {
          const query = params.get('s');
          return `/search/?q=${encodeURIComponent(query)}`;
        }
      }
    } catch {
      // URL parsing failed, continue with path
    }

    // Ensure trailing slash for directory-style URLs.
    path = '/' + path;

    // Add trailing slash if not a file.
    if (!/\.[a-z0-9]{2,5}$/i.test(path)) {
      path = path.replace(/\/$/, '') + '/';
    }
    return path;
  }

  /**
   * Normalize a URL for comparison.
   *
   * @param {string} url URL to normalize.
   * @return {string} Normalized URL.
   */
  function normalizeUrl(url) {
    // Use original siteUrl (not normalized) for normalization to match both HTTP and HTTPS URLs.
    return normalize(url, siteUrl);
  }

  /**
   * Check if URL is external.
   *
   * @param {string} url URL to check.
   * @return {boolean} True if external.
   */
  function isExternalUrl(url) {
    // Use original siteUrl (not normalized) for comparison to match both HTTP and HTTPS URLs.
    return isExternal(url, siteUrl);
  }

  /**
   * Rewrite a single URL.
   *
   * @param {string} url        URL to rewrite.
   * @param {string} contextUrl Context URL for relative URL resolution.
   * @return {string} Rewritten URL.
   */
  function rewriteUrl(url, contextUrl = '') {
    // Skip external URLs.
    if (isExternalUrl(url)) {
      return url;
    }

    // Skip CF Images URLs.
    if (url.includes('imagedelivery.net')) {
      return url;
    }

    // Skip anchors.
    if (url.startsWith('#')) {
      return url;
    }

    // Skip data URLs.
    if (url.startsWith('data:')) {
      return url;
    }

    // Resolve relative URLs against context.
    let absoluteUrl = url;
    if (contextUrl && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      absoluteUrl = resolveRelative(url, contextUrl);
    } else if (contextUrl && url.startsWith('/')) {
      try {
        const contextObj = new URL(contextUrl);
        absoluteUrl = contextObj.origin + url;
      } catch {
        // If context URL parsing fails, use as-is
      }
    }

    // Check URL map first.
    const urlNormalized = normalizeUrl(absoluteUrl);
    let staticPath = mapping[urlNormalized];
    if (!staticPath) {
      // Convert to static path.
      staticPath = convertToStaticPath(absoluteUrl);
    }

    // If using public URL (direct R2 access), add /static/ prefix.
    // Worker endpoints add /static/ internally, so don't add it for those.
    if (isPublicUrl && staticPath && staticPath !== '/' && !staticPath.startsWith('/static/')) {
      // Don't add /static/ to the homepage or paths that already have it.
      staticPath = '/static' + staticPath;
    }

    // Apply static URL base if configured.
    let rewrittenUrl;
    if (normalizedStaticUrl) {
      // Preserve the protocol from the configured static URL
      // Users can choose HTTP or HTTPS based on their deployment needs
      try {
        const staticUrlObj = new URL(normalizedStaticUrl);
        // Preserve the base path from static URL
        // Remove trailing slash from base, then append staticPath
        const basePath = staticUrlObj.pathname.replace(/\/$/, '');
        rewrittenUrl = staticUrlObj.origin + basePath + staticPath;
      } catch {
        // If URL parsing fails, fall back to simple concatenation
        rewrittenUrl = normalizedStaticUrl.replace(/\/$/, '') + staticPath;
      }
    } else {
      rewrittenUrl = staticPath;
    }

    /**
     * Filter rewritten URL after static site conversion.
     *
     * Allows customization of the final rewritten URL.
     *
     * @param {string} rewrittenUrl        Final rewritten URL.
     * @param {string} url                 Original URL.
     * @param {string} contextUrl          Context URL for resolution.
     * @param {string} siteUrl             Site URL.
     * @param {string} normalizedStaticUrl Static URL (if configured).
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.url.rewrite', 'my-plugin', (rewrittenUrl, url, contextUrl, siteUrl, staticUrl) => {
     *     // Custom URL transformation
     *     if (rewrittenUrl.includes('/wp-content/uploads/')) {
     *         return rewrittenUrl.replace('/wp-content/uploads/', '/media/');
     *     }
     *     return rewrittenUrl;
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.url.rewrite', rewrittenUrl, url, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
  }

  /**
   * Escape special regex characters in a string.
   *
   * @param {string} str String to escape.
   * @return {string} Escaped string.
   */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Rewrite all URLs in HTML content using global replace.
   *
   * @param {string} html       HTML content.
   * @param {string} contextUrl Current page URL for relative URL resolution.
   * @return {string} HTML with rewritten URLs.
   */
  function rewriteHtml(html, contextUrl) {
    debug('[URL Rewriter] rewriteHtml called with:');
    debug('  - contextUrl:', contextUrl);
    debug('  - siteUrl:', siteUrl);
    debug('  - normalizedStaticUrl:', normalizedStaticUrl);
    debug('  - HTML length:', html.length);

    // First, temporarily replace ONLY inline script content (not the tags themselves) to avoid
    // rewriting URLs inside JavaScript code. We keep the opening/closing tags so that
    // src attributes can still be rewritten.
    const scriptContentPlaceholders = {};
    let scriptCounter = 0;
    html = html.replace(/<script(?![^>]*type=["']importmap["'])([^>]*)>(.*?)<\/script>/gis, (match, openingAttrs, content) => {
      // Only create placeholder if there's actual content (not just src attribute).
      if (content.trim()) {
        const placeholder = `___SCRIPT_CONTENT_${scriptCounter}___`;
        scriptContentPlaceholders[placeholder] = content;
        scriptCounter++;
        return `<script${openingAttrs}>${placeholder}</script>`;
      }

      // No content, just return the tag as-is (external script).
      return match;
    });

    // Extract site URL host for matching.
    // Use the original siteUrl (not normalized) to match both HTTP and HTTPS URLs.
    let siteHost = '';
    try {
      const siteUrlObj = new URL(siteUrl);
      siteHost = siteUrlObj.host;
    } catch {
      // If URL parsing fails, try to extract host manually.
      const hostMatch = siteUrl.match(/^https?:\/\/([^\/]+)/);
      if (hostMatch) {
        siteHost = hostMatch[1];
      }
    }
    if (siteHost) {
      // Escape special regex characters in host.
      const escapedHost = escapeRegex(siteHost);

      // Create regex patterns to match site URLs.
      // Match complete URLs: http://host/path?query#fragment
      // Stop at quotes, whitespace, or HTML tag boundaries
      // Use word boundary-like approach: match until we hit a quote, whitespace, or HTML tag
      const httpPattern = new RegExp(`http://${escapedHost}[^"'\`\\s<>]*`, 'gi');
      const httpsPattern = new RegExp(`https://${escapedHost}[^"'\`\\s<>]*`, 'gi');
      const protocolRelativePattern = new RegExp(`//${escapedHost}[^"'\`\\s<>]*`, 'gi');

      // Global replace: find all instances of site URLs and replace them.
      // Use a more robust approach: replace all matches in one pass
      const allMatches = [];
      let match;

      // Collect all HTTP matches
      while ((match = httpPattern.exec(html)) !== null) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          match: match[0],
          type: 'http'
        });
      }

      // Collect all HTTPS matches
      while ((match = httpsPattern.exec(html)) !== null) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          match: match[0],
          type: 'https'
        });
      }

      // Collect all protocol-relative matches
      while ((match = protocolRelativePattern.exec(html)) !== null) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          match: match[0],
          type: 'protocol-relative'
        });
      }

      // Sort matches by index (ascending order - forward processing)
      allMatches.sort((a, b) => a.index - b.index);

      // Build new HTML by processing matches in forward order.
      // This avoids index corruption from in-place string modifications.
      let result = '';
      let lastIndex = 0;
      let lastMatchEnd = 0; // Track end of last processed match to detect overlaps

      for (const matchData of allMatches) {
        // Skip overlapping matches (e.g., http://host/path and //host/path)
        // This happens because protocol-relative pattern can match part of absolute URLs
        if (matchData.index < lastMatchEnd) {
          continue;
        }

        // Skip CF Images URLs.
        if (matchData.match.includes('imagedelivery.net')) {
          continue;
        }
        let urlToRewrite = matchData.match;
        if (matchData.type === 'protocol-relative') {
          // Convert protocol-relative to absolute for rewriting.
          urlToRewrite = 'https:' + matchData.match;
        }
        const rewritten = rewriteUrl(urlToRewrite, contextUrl);

        // Only replace if the rewritten URL is different.
        if (rewritten !== urlToRewrite) {
          // Add everything from lastIndex up to this match
          result += html.substring(lastIndex, matchData.index);
          // Add the rewritten URL
          result += rewritten;
          // Update lastIndex to skip past this match
          lastIndex = matchData.index + matchData.length;
          // Track end of this match to detect overlaps in next iteration
          lastMatchEnd = matchData.index + matchData.length;
        } else {
          // Even if not replaced, update lastMatchEnd to prevent overlap issues
          lastMatchEnd = matchData.index + matchData.length;
        }
      }

      // Add remaining HTML after the last match
      result += html.substring(lastIndex);
      html = result;
    }

    // Rewrite absolute paths (starting with /) when static URL includes subdirectories.
    // This ensures paths like /wp-includes/js/file.js are rewritten to
    // /static/wp-includes/js/file.js when needed.
    if (normalizedStaticUrl) {
      try {
        const staticUrlObj = new URL(normalizedStaticUrl);
        const basePath = staticUrlObj.pathname.replace(/\/$/, '');

        // Debug logging
        debug('[URL Rewriter] normalizedStaticUrl:', normalizedStaticUrl);
        debug('[URL Rewriter] basePath:', basePath);

        // Only rewrite if the static URL has a non-root base path
        if (basePath && basePath !== '' && basePath !== '/') {
          debug('[URL Rewriter] Rewriting absolute paths with base:', basePath);
          // Match absolute paths in href, src, action, data, and other URL attributes.
          // Pattern explanation:
          // - Match attribute names followed by = and quote
          // - Capture the absolute path (starts with /, not //)
          // - Stop at closing quote
          // We use a negative lookahead (?!//) to exclude protocol-relative URLs like //example.com
          let replaceCount = 0;
          html = html.replace(/(\b(?:href|src|action|data|poster|content)=)(["'`])(\/(?!\/)[^"'`]*)\2/gi, (match, attrPart, quote, path) => {
            replaceCount++;
            // Skip if already includes the base path
            if (path.startsWith(basePath + '/')) {
              return match;
            }

            // Skip anchors
            if (path === '/' || path.startsWith('/#')) {
              return match;
            }

            // Skip special paths that don't need rewriting
            if (path.startsWith('/data:') || path.startsWith('/#')) {
              return match;
            }

            // Prepend base path
            const rewrittenPath = basePath + path;
            debug(`[URL Rewriter] Rewriting: ${path} -> ${rewrittenPath}`);
            return attrPart + quote + rewrittenPath + quote;
          });
          debug(`[URL Rewriter] Processed ${replaceCount} absolute path attributes`);
        }
      } catch (error) {
        // If URL parsing fails, skip absolute path rewriting
        debugError('[URL Rewriter] Error in absolute path rewriting:', error);
      }
    }

    // Handle srcset attributes (contains multiple URLs with descriptors).
    // Pattern: "image-300w.webp 300w, image-600w.webp 600w"
    // We still need special handling here to preserve descriptors.
    html = html.replace(/(<(?:img|source)[^>]+srcset=)(["'`])([^"'`]+)\2/gi, (match, tag, quote, srcsetValue) => {
      // Parse and rewrite each URL in srcset while preserving descriptors.
      const srcsetParts = srcsetValue.split(',').map(part => {
        const trimmed = part.trim();
        // Match URL and descriptor: "image-300w.webp 300w" or "image.webp 1x"
        const urlMatch = trimmed.match(/^([^\s]+)(\s+.+)?$/);
        if (!urlMatch) {
          return trimmed; // Return as-is if we can't parse
        }
        const url = urlMatch[1];
        const descriptor = urlMatch[2] || '';

        // Skip CF Images URLs.
        if (url.includes('imagedelivery.net')) {
          return trimmed;
        }

        // URL may have already been rewritten by global replace, but check if it needs rewriting.
        const rewritten = rewriteUrl(url, contextUrl);
        return rewritten + descriptor;
      });
      return tag + quote + srcsetParts.join(', ') + quote;
    });

    // Rewrite URLs in import maps (WordPress 6.5+).
    // We still need special handling here for JSON parsing.
    html = html.replace(/<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis, (match, jsonContent) => {
      try {
        const importmap = JSON.parse(jsonContent);
        if (!importmap || typeof importmap !== 'object' || !importmap.imports) {
          return match;
        }

        // Rewrite each module URL.
        for (const moduleName in importmap.imports) {
          if (importmap.imports.hasOwnProperty(moduleName)) {
            importmap.imports[moduleName] = rewriteUrl(importmap.imports[moduleName], contextUrl);
          }
        }

        // Reconstruct the script tag with rewritten URLs.
        const newJson = JSON.stringify(importmap);
        return match.replace(jsonContent, newJson);
      } catch {
        // Return original if parsing fails.
        return match;
      }
    });

    // Restore inline script content.
    for (const placeholder in scriptContentPlaceholders) {
      if (scriptContentPlaceholders.hasOwnProperty(placeholder)) {
        html = html.replace(placeholder, scriptContentPlaceholders[placeholder]);
      }
    }

    /**
     * Filter HTML after URL rewriting.
     *
     * Allows final customization of HTML after all URL rewriting is complete.
     *
     * @param {string} html       Rewritten HTML content.
     * @param {string} contextUrl Context URL (current page).
     * @param {string} siteUrl    Site URL.
     * @param {string} staticUrl  Static URL (if configured).
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.url.rewrite_html', 'my-plugin', (html, contextUrl, siteUrl, staticUrl) => {
     *     // Add custom meta tags
     *     return html.replace('</head>', '<meta name="generator" content="Aether"></head>');
     * });
     */
    return (0,external_wp_hooks_.applyFilters)('aether.url.rewrite_html', html, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
  }
  return {
    rewriteHtml,
    rewriteUrl,
    addUrlMapping: (originalUrl, staticPath) => {
      const normalized = normalizeUrl(originalUrl);
      mapping[normalized] = staticPath;
    },
    getUrlMapping: () => ({
      ...mapping
    })
  };
}
;// ./assets/src/publish/utils/htmlProcessor.js
/**
 * HTML Processor
 *
 * Processes HTML for static site generation.
 * Ported from PHP HTMLGeneratorService::processHtml() logic.
 *
 * @package
 */



/**
 * Process HTML for static site.
 *
 * @param {string}      html          HTML content.
 * @param {string}      url           Source URL.
 * @param {string}      siteUrl       Site URL.
 * @param {string|null} staticSiteUrl Static site URL for URL rewriting.
 * @return {string} Processed HTML.
 */
function processHtml(html, url, siteUrl, staticSiteUrl = null) {
  // STEP 1: Remove admin bar from HTML (in case source was generated while logged in).
  // This removes #wpadminbar div, related CSS/JS, and body classes.
  html = removeAdminBar(html);

  // STEP 2: Remove aether plugin assets (admin-only functionality not needed in static site).
  html = removeAetherAssets(html);

  // STEP 3: Remove dynamic WordPress links (RSS comments feed, REST API, XML-RPC).
  // These features don't exist in static exports.
  html = removeDynamicWpLinks(html);

  // STEP 4: Replace all internal URLs (absolute → relative or custom domain).
  // This is the main URL rewriting step that makes the static site work.
  const urlRewriter = createUrlRewriter(siteUrl, staticSiteUrl);
  html = urlRewriter.rewriteHtml(html, url);
  return html;
}

/**
 * Remove admin bar from HTML.
 *
 * Strips the WordPress admin bar (#wpadminbar) and related styles/scripts
 * that may have been rendered if the source page was fetched while logged in.
 *
 * @param {string} html HTML content.
 * @return {string} HTML with admin bar removed.
 */
function removeAdminBar(html) {
  // Helper function to remove HTML elements by attribute matching.
  // Used to remove admin bar CSS, JS, and HTML by ID or class.
  const removeElementsByAttr = (htmlContent, element, attribute, valuePattern, exactMatch = false) => {
    // Escape regex special characters in pattern.
    const escapedPattern = valuePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Build regex pattern for attribute matching.
    // exactMatch=true: id="exact-value"
    // exactMatch=false: id="contains-value-anywhere"
    let attrPattern;
    if (exactMatch) {
      attrPattern = `${attribute}=["']${escapedPattern}["']`;
    } else {
      attrPattern = `${attribute}=["'][^"']*${escapedPattern}[^"']*["']`;
    }

    // Handle self-closing tags (link).
    // Pattern: <link ... id="admin-bar-css" ... >
    if (element === 'link') {
      const pattern = new RegExp(`<${element}[^>]*${attrPattern}[^>]*>`, 'gi');
      return htmlContent.replace(pattern, '');
    }

    // Handle tags with content (script, style, div).
    // Pattern: <script ... id="admin-bar-js" ...>...</script>
    const pattern = new RegExp(`<${element}[^>]*${attrPattern}[^>]*>.*?<\/${element}>`, 'gis');
    return htmlContent.replace(pattern, '');
  };

  // Remove admin bar CSS link.
  html = removeElementsByAttr(html, 'link', 'id', 'admin-bar-css', true);
  html = removeElementsByAttr(html, 'script', 'id', 'admin-bar-css', true);
  html = removeElementsByAttr(html, 'style', 'id', 'admin-bar-css', true);
  html = removeElementsByAttr(html, 'div', 'id', 'admin-bar-css', true);

  // Remove dashicons CSS link (used by admin bar).
  html = removeElementsByAttr(html, 'link', 'id', 'dashicons-css', true);
  html = removeElementsByAttr(html, 'script', 'id', 'dashicons-css', true);
  html = removeElementsByAttr(html, 'style', 'id', 'dashicons-css', true);
  html = removeElementsByAttr(html, 'div', 'id', 'dashicons-css', true);

  // Remove admin bar container div.
  html = removeElementsByAttr(html, 'link', 'id', 'wpadminbar', true);
  html = removeElementsByAttr(html, 'script', 'id', 'wpadminbar', true);
  html = removeElementsByAttr(html, 'style', 'id', 'wpadminbar', true);
  html = removeElementsByAttr(html, 'div', 'id', 'wpadminbar', true);

  // Remove admin bar inline styles.
  html = removeElementsByAttr(html, 'link', 'id', 'admin-bar-inline-css', true);
  html = removeElementsByAttr(html, 'script', 'id', 'admin-bar-inline-css', true);
  html = removeElementsByAttr(html, 'style', 'id', 'admin-bar-inline-css', true);
  html = removeElementsByAttr(html, 'div', 'id', 'admin-bar-inline-css', true);

  // Remove admin bar scripts.
  html = removeElementsByAttr(html, 'link', 'id', 'admin-bar-js', true);
  html = removeElementsByAttr(html, 'script', 'id', 'admin-bar-js', true);
  html = removeElementsByAttr(html, 'style', 'id', 'admin-bar-js', true);
  html = removeElementsByAttr(html, 'div', 'id', 'admin-bar-js', true);

  // Remove any remaining admin bar related inline styles.
  html = html.replace(/<style[^>]*>.*?#wpadminbar.*?<\/style>/gis, '');

  // Remove logged-in and admin-bar classes from body tag.
  // These classes affect page layout and should be removed for static site.
  const classesToRemove = ['logged-in', 'admin-bar'];
  for (const className of classesToRemove) {
    const escapedClass = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(class=["'][^"']*)\\b${escapedClass}\\b([^"']*["'])`, 'gi');
    html = html.replace(pattern, '$1$2');
  }

  // Add no-admin-bar class to body (opposite of admin-bar class).
  // WordPress themes use this class to adjust layout when admin bar is absent.
  if (!html.includes('no-admin-bar')) {
    html = html.replace(/(<body[^>]*class=["'][^"']*)(")/i, '$1 no-admin-bar$2');
  }

  // AGGRESSIVE CLEANUP: Remove everything between <body> and wp-site-blocks div.
  // This is a last-resort cleanup for any remaining admin bar HTML.
  // Only runs if admin bar classes are still present in HTML.
  if (html.includes('wp-admin-bar-')) {
    html = html.replace(/(<body[^>]*>).*?(<div[^>]*class=["'][^"']*wp-site-blocks)/gis, '$1$2');
  }
  return html;
}

/**
 * Remove aether plugin assets from HTML.
 *
 * The aether plugin is admin-only and should not be included in static site.
 *
 * @param {string} html HTML content.
 * @return {string} HTML with aether assets removed.
 */
function removeAetherAssets(html) {
  // Helper function to remove elements by attribute.
  const removeElementsByAttr = (htmlContent, element, attribute, valuePattern, exactMatch = false) => {
    const escapedPattern = valuePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Build pattern based on match type.
    let attrPattern;
    if (exactMatch) {
      attrPattern = `${attribute}=["']${escapedPattern}["']`;
    } else {
      attrPattern = `${attribute}=["'][^"']*${escapedPattern}[^"']*["']`;
    }

    // Self-closing tags (link).
    if (element === 'link') {
      const pattern = new RegExp(`<${element}[^>]*${attrPattern}[^>]*>`, 'gi');
      return htmlContent.replace(pattern, '');
    }

    // Tags with content (script, style, div).
    const pattern = new RegExp(`<${element}[^>]*${attrPattern}[^>]*>.*?<\/${element}>`, 'gis');
    return htmlContent.replace(pattern, '');
  };
  const pluginSlug = 'aether';

  // Remove by ID pattern.
  html = removeElementsByAttr(html, 'link', 'id', pluginSlug, false);
  html = removeElementsByAttr(html, 'script', 'id', pluginSlug, false);
  html = removeElementsByAttr(html, 'style', 'id', pluginSlug, false);

  // Remove by path.
  const pathPattern = 'wp-content/plugins/' + pluginSlug + '/';
  html = removeElementsByAttr(html, 'link', 'href', pathPattern, false);
  html = removeElementsByAttr(html, 'script', 'src', pathPattern, false);
  return html;
}

/**
 * Remove dynamic WordPress links from HTML.
 *
 * Removes links to features that don't exist in static exports:
 * - Comments RSS feed
 * - REST API discovery
 * - XML-RPC/RSD
 *
 * @param {string} html HTML content.
 * @return {string} HTML with dynamic links removed.
 */
function removeDynamicWpLinks(html) {
  // Remove comments feed link.
  // <link rel="alternate" type="application/rss+xml" title="..." href=".../comments/feed/" />.
  html = html.replace(/<link[^>]*rel=["']alternate["'][^>]*href=["'][^"']*\/comments\/feed\/["'][^>]*>/gi, '');

  // Alternative pattern (href before rel).
  html = html.replace(/<link[^>]*href=["'][^"']*\/comments\/feed\/["'][^>]*rel=["']alternate["'][^>]*>/gi, '');

  // Remove REST API discovery link.
  // <link rel="https://api.w.org/" href=".../wp-json/" />.
  html = html.replace(/<link[^>]*rel=["']https:\/\/api\.w\.org\/["'][^>]*>/gi, '');

  // Remove XML-RPC/RSD discovery link.
  // <link rel="EditURI" type="application/rsd+xml" title="RSD" href=".../xmlrpc.php" />.
  html = html.replace(/<link[^>]*rel=["']EditURI["'][^>]*type=["']application\/rsd\+xml["'][^>]*>/gi, '');

  // Alternative pattern (type before rel).
  html = html.replace(/<link[^>]*type=["']application\/rsd\+xml["'][^>]*rel=["']EditURI["'][^>]*>/gi, '');
  return html;
}

/**
 * Get static file path for a URL.
 *
 * @param {string} url URL to convert.
 * @return {string} File path (relative to static root).
 */
function getStaticFilePath(url) {
  // Extract pathname from URL.
  let path = '/';
  try {
    const urlObj = new URL(url);
    path = urlObj.pathname || '/';
  } catch {
    // Fallback: If URL parsing fails, extract path manually with regex.
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      path = pathMatch[1];
    }
  }

  // Handle homepage (root URL).
  if (!path || path === '/') {
    return 'index.html';
  }

  // Remove leading slash (normalize path).
  path = path.replace(/^\/+/, '');

  // Remove WordPress Playground scope prefix.
  // Playground URLs contain scope like /scope:12345/path → path
  path = stripPlaygroundScope(path);

  // Remove trailing slash (normalize path).
  path = path.replace(/\/+$/, '');

  // Check if path is empty after removing scope (homepage case).
  if (!path) {
    return 'index.html';
  }

  // Convert URL path to directory structure with index.html.
  // Example: /about → about/index.html
  // This allows static files to be served via directory URLs: example.com/about/
  return path + '/index.html';
}
;// ./assets/src/publish/utils/assetExclusions.js
/**
 * Asset Exclusions Configuration
 *
 * Centralized configuration for assets and URL patterns that should be excluded
 * from static site generation.
 *
 * @package
 */

/**
 * Image file extensions that are served from external CDNs.
 * These are skipped when found in CSS/JS, but collected when referenced in HTML.
 */
const SKIP_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'];

/**
 * Essential file extensions that should always be collected,
 * even if they are external URLs (e.g., Google Fonts).
 * These assets are critical for site functionality.
 */
const ESSENTIAL_EXTENSIONS = ['css', 'js', 'woff', 'woff2', 'ttf', 'eot', 'otf'];

/**
 * Webpack module IDs to skip (not real files, just module references).
 * These are webpack internal module IDs that don't correspond to actual files.
 */
const WEBPACK_MODULE_IDS = ['react', 'is-prop-valid', 'uncategorized', 'git-config', 'react-dom', 'react-jsx-runtime'];

/**
 * URL patterns that should be excluded from asset collection.
 * Patterns starting with '/' are checked at the start of the URL pathname.
 * Other patterns are checked anywhere in the URL using includes().
 */
const EXCLUDED_URL_PATTERNS = ['/wp-json/',
// WordPress REST API endpoints
'/xmlrpc.php',
// WordPress XML-RPC endpoint
'imagedelivery.net',
// External CDN (imagedelivery.net)
'wp-content/plugins/aether/' // Aether plugin assets (admin-only)
];

/**
 * Regex patterns for more complex exclusions.
 * These are checked after simple string patterns.
 */
const EXCLUDED_URL_REGEX_PATTERNS = [/wp-admin\/.*\.php$/ // WordPress admin PHP files (wp-admin/*.php and wp-admin/**/*.php)
];

/**
 * Check if a URL matches any excluded pattern.
 *
 * @param {string} url URL to check.
 * @return {boolean} True if URL should be excluded.
 */
function isExcludedUrl(url) {
  // Check simple string patterns first.
  const matchesStringPattern = EXCLUDED_URL_PATTERNS.some(pattern => {
    // Patterns starting with '/' should match at the start of the pathname.
    if (pattern.startsWith('/')) {
      try {
        const urlObj = new URL(url);
        return urlObj.pathname.startsWith(pattern);
      } catch {
        // If URL parsing fails, check if URL string starts with pattern.
        return url.startsWith(pattern);
      }
    }
    // Other patterns are checked anywhere in the URL.
    return url.includes(pattern);
  });
  if (matchesStringPattern) {
    return true;
  }

  // Check regex patterns for more complex exclusions.
  // Extract pathname for regex matching to avoid matching query strings or fragments.
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return EXCLUDED_URL_REGEX_PATTERNS.some(regex => regex.test(pathname));
  } catch {
    // If URL parsing fails, test against full URL string.
    return EXCLUDED_URL_REGEX_PATTERNS.some(regex => regex.test(url));
  }
}

/**
 * Check if a file extension is in the skip list.
 *
 * @param {string} extension File extension (without dot).
 * @return {boolean} True if extension should be skipped.
 */
function isSkippedExtension(extension) {
  return SKIP_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Check if a file extension is essential (always collected).
 *
 * @param {string} extension File extension (without dot).
 * @return {boolean} True if extension is essential.
 */
function isEssentialExtension(extension) {
  return ESSENTIAL_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Check if a module ID is a webpack internal reference.
 *
 * @param {string} moduleId Module ID to check.
 * @return {boolean} True if module ID should be skipped.
 */
function isWebpackModuleId(moduleId) {
  return WEBPACK_MODULE_IDS.includes(moduleId);
}
;// ./assets/src/publish/utils/assetExtractor.js
/**
 * Asset Extractor
 *
 * Extracts asset URLs (CSS, JS, fonts, images) from HTML content.
 * Ported from PHP AssetCollectorService logic.
 *
 * @package
 */





/**
 * Extract asset URLs from HTML content.
 *
 * @param {string} html    HTML content.
 * @param {string} pageUrl Page URL for resolving relative URLs.
 * @param {string} siteUrl Site URL for internal URL checking.
 * @return {Promise<Array<string>>} Array of asset URLs.
 */
async function extractAssetsFromHtml(html, pageUrl, siteUrl) {
  const collected = new Set(); // Deduplicated asset URLs
  const processed = new Set(); // Track processed assets to avoid infinite loops in recursive dependency collection

  // Collect stylesheets from <link rel="stylesheet"> tags.
  // Two patterns handle both attribute orders: href-first and rel-first.
  const stylesheetPatterns = [/<link[^>]+href=(["'])([^"']+)\1[^>]*rel=["']stylesheet["'][^>]*>/gi, /<link[^>]+rel=["']stylesheet["'][^>]*href=(["'])([^"']+)\1[^>]*>/gi];
  for (const pattern of stylesheetPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const cssUrl = match[2];
      const resolvedUrl = resolveRelative(cssUrl, pageUrl);

      // Filter assets (skip CF Images, aether plugin, external URLs for non-essential assets).
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);

        // RECURSIVE: Parse CSS file for @import and url() dependencies (fonts, background images).
        // collectCssDependencies fetches the CSS file and extracts nested dependencies.
        await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }
  }

  // Collect JavaScript files from <script src="..."> tags.
  const scriptPattern = /<script[^>]+src=(["'])([^"']+)\1[^>]*>/gi;
  const scriptMatches = html.matchAll(scriptPattern);
  for (const match of scriptMatches) {
    const jsUrl = match[2];
    const resolvedUrl = resolveRelative(jsUrl, pageUrl);
    if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
      collected.add(resolvedUrl);

      // RECURSIVE: Parse JS file for import/require dependencies.
      // collectJsDependencies fetches the JS file and extracts nested dependencies (ES6 imports, dynamic imports, CommonJS requires).
      await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
    }
  }

  // Collect assets from inline CSS in <style> tags.
  // Extracts url() references (fonts, background images).
  const inlineCssPattern = /<style[^>]*>(.*?)<\/style>/gis;
  const inlineCssMatches = html.matchAll(inlineCssPattern);
  for (const match of inlineCssMatches) {
    const inlineCss = match[1];
    collectCssInlineDependencies(inlineCss, pageUrl, siteUrl, collected);
  }

  // Collect assets from inline JavaScript in <script> tags (no src attribute).
  // Extracts asset references like new URL('path') or './path.js' strings.
  const inlineJsPattern = /<script[^>]*>(.*?)<\/script>/gis;
  const inlineJsMatches = html.matchAll(inlineJsPattern);
  for (const match of inlineJsMatches) {
    const inlineJs = match[1];
    await collectJsInlineDependencies(inlineJs, pageUrl, siteUrl, collected, processed);
  }

  // Collect ES modules from import maps (WordPress 6.5+ feature).
  // Import maps define module specifier mappings for ES modules.
  const importMapPattern = /<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis;
  const importMapMatches = html.matchAll(importMapPattern);
  for (const match of importMapMatches) {
    const importmapJson = match[1];
    await collectImportmapModules(importmapJson, pageUrl, siteUrl, collected, processed);
  }

  // Collect assets from HTML attributes (img, source, video, audio, link tags).
  collectHtmlAttributeAssets(html, pageUrl, siteUrl, collected);
  let assets = Array.from(collected);

  /**
   * Filter extracted assets before returning.
   *
   * Allows modification of asset list after extraction.
   *
   * @param {Array}  assets  Extracted asset URLs.
   * @param {string} html    HTML content that was processed.
   * @param {string} pageUrl Page URL.
   * @param {string} siteUrl Site URL.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.assets.extracted', 'my-plugin', (assets, html, pageUrl, siteUrl) => {
   *     // Add custom asset
   *     assets.push('https://example.com/custom-asset.js');
   *     return assets;
   * });
   */
  assets = (0,external_wp_hooks_.applyFilters)('aether.assets.extracted', assets, html, pageUrl, siteUrl);
  return assets;
}

/**
 * Escape special regex characters in a string.
 *
 * @param {string} str String to escape.
 * @return {string} Escaped string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Collect assets from HTML attributes (img, source, video, audio, link tags).
 *
 * Uses global regex to find all instances of site URLs in HTML, then extracts
 * and resolves them. This catches all edge cases automatically (meta tags,
 * form actions, canonical links, etc.).
 *
 * @param {string}      html      HTML content.
 * @param {string}      pageUrl   Page URL for resolving relative URLs.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected asset URLs.
 */
function collectHtmlAttributeAssets(html, pageUrl, siteUrl, collected) {
  // Extract site URL host for matching.
  let siteHost = '';
  try {
    const siteUrlObj = new URL(siteUrl);
    siteHost = siteUrlObj.host;
  } catch {
    // If URL parsing fails, try to extract host manually.
    const hostMatch = siteUrl.match(/^https?:\/\/([^\/]+)/);
    if (hostMatch) {
      siteHost = hostMatch[1];
    }
  }
  if (siteHost) {
    // Escape special regex characters in host.
    const escapedHost = escapeRegex(siteHost);

    // Create regex patterns to match site URLs.
    // Match complete URLs: http://host/path?query#fragment
    // Stop at quotes, whitespace, or HTML tag boundaries
    const httpPattern = new RegExp(`http://${escapedHost}[^"'\`\\s<>]*`, 'gi');
    const httpsPattern = new RegExp(`https://${escapedHost}[^"'\`\\s<>]*`, 'gi');
    const protocolRelativePattern = new RegExp(`//${escapedHost}[^"'\`\\s<>]*`, 'gi');

    // Find all site URLs and collect them.
    const allMatches = new Set();

    // Collect http:// URLs.
    let match;
    while ((match = httpPattern.exec(html)) !== null) {
      const url = match[0];
      // Skip CF Images URLs.
      if (!url.includes('imagedelivery.net')) {
        allMatches.add(url);
      }
    }

    // Collect https:// URLs.
    while ((match = httpsPattern.exec(html)) !== null) {
      const url = match[0];
      // Skip CF Images URLs.
      if (!url.includes('imagedelivery.net')) {
        allMatches.add(url);
      }
    }

    // Collect protocol-relative URLs.
    while ((match = protocolRelativePattern.exec(html)) !== null) {
      const url = match[0];
      // Skip CF Images URLs.
      if (!url.includes('imagedelivery.net')) {
        // Convert protocol-relative to absolute using source site's protocol.
        // This ensures protocol consistency with the source site.
        let protocol = 'https:';
        try {
          const siteUrlObj = new URL(siteUrl);
          protocol = siteUrlObj.protocol;
        } catch {
          // Fallback to HTTPS if siteUrl parsing fails
        }
        const absoluteUrl = protocol + url;
        allMatches.add(absoluteUrl);
      }
    }

    // Process all collected URLs.
    for (const url of allMatches) {
      const resolvedUrl = resolveRelative(url, pageUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'html')) {
        collected.add(resolvedUrl);
      }
    }
  }

  // Collect relative URLs from common attributes (src, poster, href for preload/prefetch).
  // These patterns handle relative URLs that don't include the site host.
  // Patterns are tolerant of malformed HTML (missing closing bracket).
  const attrPatterns = [
  // img src
  /<img[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
  // video src
  /<video[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
  // video poster
  /<video[^>]+poster=(["'])([^"']+)\1[^>]*>?/gi,
  // audio src
  /<audio[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
  // source src
  /<source[^>]+src=(["'])([^"']+)\1[^>]*>?/gi,
  // link preload/prefetch href
  /<link[^>]+(?:rel=["'](?:preload|prefetch)["'][^>]+)?href=(["'])([^"']+)\1[^>]*>?/gi];
  for (const pattern of attrPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const url = match[2];
      const resolvedUrl = resolveRelative(url, pageUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'html')) {
        collected.add(resolvedUrl);
      }
    }
  }

  // Still handle srcset attributes separately to extract individual URLs with descriptors.
  // Pattern: "image-300w.webp 300w, image-600w.webp 600w"
  const imgSrcsetPattern = /<img[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi;
  const srcsetMatches = html.matchAll(imgSrcsetPattern);
  for (const match of srcsetMatches) {
    const srcsetValue = match[2];
    // Parse srcset: "image-300w.webp 300w, image-600w.webp 600w"
    const srcsetUrls = srcsetValue.split(',').map(part => {
      // Extract URL (everything before the descriptor like "300w" or "1x").
      const trimmed = part.trim();
      const urlMatch = trimmed.match(/^([^\s]+)/);
      return urlMatch ? urlMatch[1] : null;
    });
    for (const srcsetUrl of srcsetUrls) {
      if (srcsetUrl) {
        const resolvedUrl = resolveRelative(srcsetUrl, pageUrl);
        if (shouldCollectAsset(resolvedUrl, siteUrl, 'html')) {
          collected.add(resolvedUrl);
        }
      }
    }
  }
  const sourceSrcsetPattern = /<source[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi;
  const sourceSrcsetMatches = html.matchAll(sourceSrcsetPattern);
  for (const match of sourceSrcsetMatches) {
    const srcsetValue = match[2];
    const srcsetUrls = srcsetValue.split(',').map(part => {
      const trimmed = part.trim();
      const urlMatch = trimmed.match(/^([^\s]+)/);
      return urlMatch ? urlMatch[1] : null;
    });
    for (const srcsetUrl of srcsetUrls) {
      if (srcsetUrl) {
        const resolvedUrl = resolveRelative(srcsetUrl, pageUrl);
        if (shouldCollectAsset(resolvedUrl, siteUrl, 'html')) {
          collected.add(resolvedUrl);
        }
      }
    }
  }

  // Collect assets from inline style attributes (e.g., style="background: url('...')").
  // Extract url() references from inline CSS in style attributes.
  // Pattern handles both single and double quotes, allowing nested quotes of different type.
  // Also handles escaped quotes: style="background: url(\"...\")"
  // Match style="..." or style='...' - extract everything between matching quotes, handling escapes.
  // Pattern: match opening quote, then any character that's not the closing quote (unless escaped), then closing quote.
  const inlineStylePattern = /style\s*=\s*(["'])((?:(?!\1)(?:\\.|[^\\]))*)\1/gi;
  const inlineStyleMatches = html.matchAll(inlineStylePattern);
  for (const match of inlineStyleMatches) {
    let inlineCss = match[2];
    // Unescape escaped quotes for proper CSS parsing
    inlineCss = inlineCss.replace(/\\(["'])/g, '$1');
    // Use the same CSS dependency collection logic for inline styles.
    // Pass 'html' as source so images are collected.
    collectCssInlineDependencies(inlineCss, pageUrl, siteUrl, collected, 'html');
  }
}

/**
 * Collect modules referenced in an import map.
 *
 * @param {string}      importmapJson Import map JSON content.
 * @param {string}      pageUrl       Page URL for resolving relative URLs.
 * @param {string}      siteUrl       Site URL.
 * @param {Set<string>} collected     Collected asset URLs.
 * @param {Set<string>} processed     Processed URLs to avoid loops.
 */
async function collectImportmapModules(importmapJson, pageUrl, siteUrl, collected, processed) {
  try {
    const importmap = JSON.parse(importmapJson);
    if (!importmap || typeof importmap !== 'object' || !importmap.imports) {
      return;
    }
    for (const moduleName in importmap.imports) {
      if (importmap.imports.hasOwnProperty(moduleName)) {
        const moduleUrl = importmap.imports[moduleName];
        const resolvedUrl = resolveRelative(moduleUrl, pageUrl);
        if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
          collected.add(resolvedUrl);
          // Recursively collect module dependencies.
          await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
        }
      }
    }
  } catch {
    // Invalid JSON, skip
  }
}

/**
 * Collect CSS dependencies (fonts, images, @import).
 *
 * @param {string}      cssUrl    CSS file URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected asset URLs.
 * @param {Set<string>} processed Processed URLs to avoid loops.
 */
async function collectCssDependencies(cssUrl, siteUrl, collected, processed) {
  if (processed.has(cssUrl)) {
    return; // Already processed
  }
  processed.add(cssUrl);
  try {
    const response = await fetch(cssUrl, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        'User-Agent': 'Aether Static Site Generator'
      }
    });
    if (!response.ok) {
      return;
    }
    const cssContent = await response.text();

    // Extract @import statements.
    const importPattern = /@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi;
    const importMatches = cssContent.matchAll(importPattern);
    for (const match of importMatches) {
      const importUrl = match[1];
      const resolvedUrl = resolveRelative(importUrl, cssUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
        // Recursively collect dependencies.
        await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }

    // Extract url() references (fonts, background images).
    const urlPattern = /url\(["']?([^"')]+)["']?\)/gi;
    const urlMatches = cssContent.matchAll(urlPattern);
    for (const match of urlMatches) {
      const assetUrl = match[1];
      // Skip data URLs.
      if (assetUrl.startsWith('data:')) {
        continue;
      }
      const resolvedUrl = resolveRelative(assetUrl, cssUrl);

      // Collect fonts and other assets (but skip images - they're on CF Images).
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
      }
    }
  } catch (error) {
    // Failed to fetch CSS - skip this asset
  }
}

/**
 * Collect CSS dependencies from inline CSS content.
 *
 * @param {string}      cssContent Inline CSS content.
 * @param {string}      baseUrl    Base URL for resolving relative URLs.
 * @param {string}      siteUrl    Site URL.
 * @param {Set<string>} collected  Collected asset URLs.
 * @param {string}      source     Source where CSS was found ('html', 'css', 'js').
 */
function collectCssInlineDependencies(cssContent, baseUrl, siteUrl, collected, source = 'css') {
  // Extract url() references (fonts, background images).
  const urlPattern = /url\(["']?([^"')]+)["']?\)/gi;
  const urlMatches = cssContent.matchAll(urlPattern);
  for (const match of urlMatches) {
    const assetUrl = match[1];
    // Skip data URLs.
    if (assetUrl.startsWith('data:')) {
      continue;
    }
    const resolvedUrl = resolveRelative(assetUrl, baseUrl);
    if (shouldCollectAsset(resolvedUrl, siteUrl, source)) {
      collected.add(resolvedUrl);
    }
  }
}

/**
 * Collect JS dependencies (imports, dynamic imports, asset references).
 *
 * @param {string}      jsUrl     JavaScript file URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected asset URLs.
 * @param {Set<string>} processed Processed URLs to avoid loops.
 */
async function collectJsDependencies(jsUrl, siteUrl, collected, processed) {
  if (processed.has(jsUrl)) {
    return; // Already processed
  }
  processed.add(jsUrl);
  try {
    const response = await fetch(jsUrl, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        'User-Agent': 'Aether Static Site Generator'
      }
    });
    if (!response.ok) {
      return;
    }
    const jsContent = await response.text();

    // Extract ES6 import statements: import ... from 'module'
    const importPattern = /import\s+(?:[^;"']+\s+from\s+)?["']([^"']+)["']/gi;
    const importMatches = jsContent.matchAll(importPattern);
    for (const match of importMatches) {
      const importUrl = match[1];

      // Skip webpack module IDs (not real files)
      if (isWebpackModuleId(importUrl)) {
        continue;
      }
      const resolvedUrl = resolveRelative(importUrl, jsUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
        collected.add(resolvedUrl);
        // Recursively collect dependencies.
        await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }

    // Extract dynamic imports: import('module').
    const dynamicImportPattern = /import\s*\(\s*["']([^"']+)["']\s*\)/gi;
    const dynamicImportMatches = jsContent.matchAll(dynamicImportPattern);
    for (const match of dynamicImportMatches) {
      const importUrl = match[1];

      // Skip webpack module IDs (not real files)
      if (isWebpackModuleId(importUrl)) {
        continue;
      }
      const resolvedUrl = resolveRelative(importUrl, jsUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
        collected.add(resolvedUrl);
        // Recursively collect dependencies.
        await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }

    // Extract CommonJS require: require('module').
    const requirePattern = /require\s*\(\s*["']([^"']+)["']\s*\)/gi;
    const requireMatches = jsContent.matchAll(requirePattern);
    for (const match of requireMatches) {
      const requireUrl = match[1];

      // Skip webpack module IDs (not real files)
      if (isWebpackModuleId(requireUrl)) {
        continue;
      }
      const resolvedUrl = resolveRelative(requireUrl, jsUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
        collected.add(resolvedUrl);
        // Recursively collect dependencies.
        await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }

    // Extract URL references in strings (for images, fonts, etc).
    await collectJsInlineDependencies(jsContent, jsUrl, siteUrl, collected, processed);
  } catch (error) {
    // Failed to fetch JS - skip this asset
  }
}

/**
 * Collect asset dependencies from inline JS content.
 *
 * @param {string}      jsContent Inline JS content.
 * @param {string}      baseUrl   Base URL for resolving relative URLs.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected asset URLs.
 * @param {Set<string>} processed Processed URLs to avoid loops.
 */
async function collectJsInlineDependencies(jsContent, baseUrl, siteUrl, collected, processed) {
  // Extract URL references: new URL('path', ...) or 'path' in context of URLs.
  const assetPatterns = [
  // new URL() constructor.
  /new\s+URL\s*\(\s*["']([^"']+\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi,
  // String literals with asset extensions (more conservative to avoid false positives).
  /["']([\.\/][^"']*\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi];
  for (const pattern of assetPatterns) {
    const matches = jsContent.matchAll(pattern);
    for (const match of matches) {
      const assetUrl = match[1];
      // Skip data URLs and absolute URLs to external domains.
      if (assetUrl.startsWith('data:') || assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
        continue;
      }
      const resolvedUrl = resolveRelative(assetUrl, baseUrl);
      if (shouldCollectAsset(resolvedUrl, siteUrl, 'js')) {
        collected.add(resolvedUrl);

        // If it's a CSS or JS file, recursively collect its dependencies.
        const type = getAssetType(resolvedUrl);
        if (type === 'css') {
          await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
        } else if (type === 'js') {
          await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
        }
      }
    }
  }
}

/**
 * Check if asset should be collected.
 *
 * @param {string} url     Asset URL.
 * @param {string} siteUrl Site URL.
 * @param {string} source  Source where asset was found ('html', 'css', 'js').
 * @return {boolean} True if should collect.
 */
function shouldCollectAsset(url, siteUrl, source = 'css') {
  // FILTER 0: Skip webpack module IDs (not real files).
  // These are webpack internal module references that don't correspond to actual files.
  // Extract just the filename/path part to check against module IDs.
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || pathname;
    const moduleId = filename.replace(/\.[^.]*$/, ''); // Remove extension

    if (isWebpackModuleId(moduleId)) {
      return false;
    }
  } catch {
    // If URL parsing fails, try to extract filename manually
    const filenameMatch = url.match(/\/([^\/]+)(?:\.[^.]*)?(?:\?|$)/);
    if (filenameMatch) {
      const moduleId = filenameMatch[1];
      if (isWebpackModuleId(moduleId)) {
        return false;
      }
    }
  }

  // Extract file extension to determine asset type.
  let extension = '';
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot !== -1) {
      extension = pathname.substring(lastDot + 1).toLowerCase();
    }
  } catch {
    // Fallback: If URL parsing fails, use regex to extract extension.
    const match = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    if (match) {
      extension = match[1].toLowerCase();
    }
  }

  // PRIORITY 1: Always collect essential assets (CSS, JS, fonts) EVEN IF EXTERNAL.
  // These assets are critical for site functionality and must be included.
  // External CDN assets (Google Fonts, etc) are collected and self-hosted.
  // Check this BEFORE exclusion patterns to ensure essential assets are never excluded.
  if (isEssentialExtension(extension)) {
    return true;
  }

  // FILTER 1 & 2: Skip excluded URL patterns (external CDNs, Aether plugin, REST API, etc.).
  // Only applies to non-essential assets (essential assets already returned above).
  if (isExcludedUrl(url)) {
    return false;
  }

  // FILTER 3: Always skip external URLs (including offloaded assets) for non-essential assets.
  // Only collect internal URLs to avoid collecting external/offloaded assets.
  if (isExternal(url, siteUrl)) {
    return false;
  }

  // PRIORITY 2: Collect images when referenced in HTML (internal URLs only).
  // Images in CSS are handled by CF Images, but HTML-referenced images need to be uploaded.
  if (source === 'html' && isSkippedExtension(extension)) {
    // Already checked for external URLs above, so this is an internal image
    return true;
  }

  // FILTER 4: Skip image files when found in CSS/JS (handled by CF Images).
  // Images may be hosted on external CDNs, not stored in static site.
  if (isSkippedExtension(extension)) {
    return false;
  }

  // PRIORITY 3: For other non-essential assets, collect if internal to this site.
  // This prevents collecting random external assets that aren't critical.
  let shouldCollect = true;

  /**
   * Filter whether an asset should be collected.
   *
   * Allows custom logic to include/exclude specific assets.
   *
   * @param {boolean} shouldCollect Whether to collect this asset (default: true).
   * @param {string}  url           Asset URL.
   * @param {string}  siteUrl       Site URL.
   * @param {string}  source        Asset source ('css', 'js', 'html').
   * @param {string}  extension     File extension.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.assets.should_collect', 'my-plugin', (shouldCollect, url, siteUrl, source, extension) => {
   *     // Skip all PDF files
   *     if (extension === 'pdf') {
   *         return false;
   *     }
   *     return shouldCollect;
   * });
   */
  shouldCollect = (0,external_wp_hooks_.applyFilters)('aether.assets.should_collect', shouldCollect, url, siteUrl, source, extension);
  return shouldCollect;
}

/**
 * Get asset type from URL.
 *
 * @param {string} url Asset URL.
 * @return {string} Asset type.
 */
function getAssetType(url) {
  let extension = '';
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot !== -1) {
      extension = pathname.substring(lastDot + 1).toLowerCase();
    }
  } catch {
    // If URL parsing fails, try to extract extension manually
    const match = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    if (match) {
      extension = match[1].toLowerCase();
    }
  }
  const typeMap = {
    css: 'css',
    js: 'js',
    woff: 'font',
    woff2: 'font',
    ttf: 'font',
    otf: 'font',
    eot: 'font'
  };
  return typeMap[extension] || 'other';
}

/**
 * Get asset local path for an asset URL.
 *
 * @param {string} url Asset URL.
 * @return {string|null} Local file path (relative to static root), or null if invalid.
 */
function getAssetLocalPath(url) {
  // Extract pathname from URL.
  let path = '';
  try {
    const urlObj = new URL(url);
    path = urlObj.pathname || '';
  } catch {
    // Fallback: If URL parsing fails, extract path manually with regex.
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      path = pathMatch[1];
    }
  }

  // Remove leading slashes (normalize path).
  path = path.replace(/^\/+/, '');

  // CRITICAL: Remove WordPress Playground scope prefix.
  // Playground URLs contain scope prefix like /scope:12345/wp-content/...
  // This must be stripped to get the actual file path: wp-content/...
  path = stripPlaygroundScope(path);

  // Safeguard: If path is empty after stripping Playground scope,
  // this is an invalid asset URL (e.g., just a scope prefix with no actual path).
  // Return null to signal this should be skipped.
  if (!path || path === '') {
    return null;
  }
  return path;
}
;// ./assets/src/publish/utils/assetTracker.js
/**
 * Asset Tracker
 *
 * Tracks uploaded assets to prevent duplicate uploads.
 *
 * @package
 */

/**
 * Create an asset tracker instance.
 *
 * @return {Object} Asset tracker instance.
 */
function createAssetTracker() {
  // Track uploaded assets by normalized URL.
  const uploadedAssets = new Set();

  /**
   * Check if an asset has already been uploaded.
   *
   * @param {string} url Asset URL.
   * @return {boolean} True if already uploaded.
   */
  function isUploaded(url) {
    // Normalize URL for comparison (remove fragments, trailing slashes).
    const normalized = normalizeUrl(url);
    return uploadedAssets.has(normalized);
  }

  /**
   * Mark an asset as uploaded.
   *
   * @param {string} url Asset URL.
   */
  function markUploaded(url) {
    const normalized = normalizeUrl(url);
    uploadedAssets.add(normalized);
  }

  /**
   * Get count of uploaded assets.
   *
   * @return {number} Number of uploaded assets.
   */
  function getCount() {
    return uploadedAssets.size;
  }

  /**
   * Clear all tracked assets.
   */
  function clear() {
    uploadedAssets.clear();
  }

  /**
   * Normalize a URL for comparison.
   *
   * @param {string} url URL to normalize.
   * @return {string} Normalized URL.
   */
  function normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove fragments.
      urlObj.hash = '';
      // Remove trailing slash from path.
      if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return as-is (will still work for exact matches).
      return url;
    }
  }
  return {
    isUploaded,
    markUploaded,
    getCount,
    clear
  };
}
;// ./assets/src/utils/fileHash.js
/**
 * File Hash Utility
 *
 * Utility functions for calculating SHA-256 hashes of files and blobs.
 * Uses Web Crypto API for hardware-accelerated hashing.
 *
 * @package
 */



/**
 * Calculate SHA-256 hash for a File or Blob object.
 *
 * Converts the file/blob to ArrayBuffer and calculates SHA-256 hash
 * using Web Crypto API. Works with all Blob types including images
 * (WebP, PNG, JPG), CSS, JS, HTML, and other binary files.
 *
 * @param {File|Blob} file File or Blob object to hash.
 * @return {Promise<string>} Hex-encoded hash string (64 characters).
 */
async function fileHash_calculateFileHash(file) {
  if (!(file instanceof File || file instanceof Blob)) {
    throw new Error('File must be a File or Blob object');
  }
  try {
    // Convert Blob/File to ArrayBuffer for hashing.
    const arrayBuffer = await file.arrayBuffer();

    // Calculate SHA-256 hash using Web Crypto API.
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

    // Convert ArrayBuffer to hex string.
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    debug('calculateFileHash:', {
      fileSize: file.size,
      hashLength: hashHex.length
    });
    return hashHex;
  } catch (error) {
    debugError('Failed to calculate file hash:', error);
    throw new Error(`Hash calculation failed: ${error.message}`);
  }
}
;// ./assets/src/utils/staticSiteCache.js
/**
 * Static Site Cache - IndexedDB-based cache for static site generation
 *
 * Provides persistent browser storage for processed HTML and discovered assets
 * during static site generation. Eliminates memory limits by storing data in
 * IndexedDB instead of RAM.
 *
 * Features:
 * - Unlimited URL caching (limited only by browser storage quota)
 * - Persistent across browser sessions
 * - Automatic cleanup of old caches
 * - Works in WordPress Playground WASM environment
 */



/**
 * Cache configuration
 */
const staticSiteCache_CACHE_CONFIG = {
  dbName: 'aether-static-site-cache',
  version: 1,
  stores: {
    urlCache: {
      keyPath: 'url',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'sessionId',
        keyPath: 'sessionId',
        unique: false
      }]
    }
  }
};

/**
 * Maximum age for cached items (24 hours)
 * After this time, cached items are considered stale
 */
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Static Site Cache Manager
 *
 * Manages caching of processed HTML and assets during static site generation.
 */
class StaticSiteCache {
  /**
   * Constructor
   *
   * @param {string} sessionId - Unique session identifier for this generation run
   */
  constructor(sessionId = null) {
    this.sessionId = sessionId || this.generateSessionId();
    this.store = new utils_indexedDB('urlCache', staticSiteCache_CACHE_CONFIG);
    this.isAvailable = isIndexedDBAvailable();

    // Fallback to in-memory cache if IndexedDB unavailable
    this.memoryCache = new Map();
  }

  /**
   * Generate unique session ID
   *
   * @return {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Check if cache is available
   *
   * @return {boolean} True if IndexedDB is available
   */
  isReady() {
    return this.isAvailable;
  }

  /**
   * Get cached data for a URL
   *
   * @param {string} url - The URL to retrieve from cache
   * @return {Promise<Object|null>} Cached data or null if not found
   */
  async get(url) {
    if (!this.isAvailable) {
      return this.memoryCache.get(url) || null;
    }
    try {
      const cached = await this.store.get(url);

      // Check if cache is stale
      if (cached && cached.timestamp) {
        const age = Date.now() - cached.timestamp;
        if (age > MAX_CACHE_AGE_MS) {
          // Cache is stale, delete it
          await this.delete(url);
          return null;
        }
      }
      return cached ? {
        processedHtml: cached.processedHtml,
        assetUrls: cached.assetUrls,
        url: cached.url,
        timestamp: cached.timestamp
      } : null;
    } catch (error) {
      console.error(`[StaticSiteCache] Error getting URL "${url}":`, error);
      return null;
    }
  }

  /**
   * Cache processed HTML and assets for a URL
   *
   * @param {string}        url           - The URL being cached
   * @param {string}        processedHtml - The processed HTML content
   * @param {Array<string>} assetUrls     - Array of discovered asset URLs
   * @return {Promise<boolean>} True if successful
   */
  async set(url, processedHtml, assetUrls) {
    if (!this.isAvailable) {
      this.memoryCache.set(url, {
        processedHtml,
        assetUrls,
        url,
        timestamp: Date.now()
      });
      return true;
    }
    try {
      return await this.store.set(url, {
        processedHtml,
        assetUrls
      }, {
        sessionId: this.sessionId
      });
    } catch (error) {
      console.error(`[StaticSiteCache] Error caching URL "${url}":`, error);
      return false;
    }
  }

  /**
   * Delete cached data for a URL
   *
   * @param {string} url - The URL to delete from cache
   * @return {Promise<boolean>} True if successful
   */
  async delete(url) {
    if (!this.isAvailable) {
      return this.memoryCache.delete(url);
    }
    try {
      return await this.store.delete(url);
    } catch (error) {
      console.error(`[StaticSiteCache] Error deleting URL "${url}":`, error);
      return false;
    }
  }

  /**
   * Check if a URL is cached
   *
   * @param {string} url - The URL to check
   * @return {Promise<boolean>} True if cached
   */
  async has(url) {
    const cached = await this.get(url);
    return cached !== null;
  }

  /**
   * Get all cached URLs for current session
   *
   * @return {Promise<Array<string>>} Array of cached URLs
   */
  async getAllUrls() {
    if (!this.isAvailable) {
      return Array.from(this.memoryCache.keys());
    }
    try {
      const items = await this.store.getByIndex('sessionId', this.sessionId);
      return items.map(item => item.url);
    } catch (error) {
      console.error('[StaticSiteCache] Error getting all URLs:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   *
   * @return {Promise<Object>} Cache statistics
   */
  async getStats() {
    if (!this.isAvailable) {
      return {
        totalCached: this.memoryCache.size,
        sessionCached: this.memoryCache.size,
        storageUsed: null,
        storageQuota: null,
        storagePercent: null,
        usingFallback: true
      };
    }
    try {
      const [totalCount, sessionItems, storageEstimate] = await Promise.all([this.store.count(), this.store.getByIndex('sessionId', this.sessionId), this.store.getStorageEstimate()]);
      return {
        totalCached: totalCount,
        sessionCached: sessionItems.length,
        storageUsed: storageEstimate.usage,
        storageQuota: storageEstimate.quota,
        storagePercent: storageEstimate.percentUsed,
        usingFallback: false
      };
    } catch (error) {
      console.error('[StaticSiteCache] Error getting stats:', error);
      return {
        totalCached: 0,
        sessionCached: 0,
        storageUsed: null,
        storageQuota: null,
        storagePercent: null,
        usingFallback: false
      };
    }
  }

  /**
   * Clear all cache for current session
   *
   * @return {Promise<number>} Number of items deleted
   */
  async clearSession() {
    if (!this.isAvailable) {
      const size = this.memoryCache.size;
      this.memoryCache.clear();
      return size;
    }
    try {
      // Get all items for this session
      const items = await this.store.getByIndex('sessionId', this.sessionId);

      // Delete each item
      let deletedCount = 0;
      for (const item of items) {
        const success = await this.store.delete(item.url);
        if (success) {
          deletedCount++;
        }
      }
      return deletedCount;
    } catch (error) {
      console.error('[StaticSiteCache] Error clearing session:', error);
      return 0;
    }
  }

  /**
   * Clear all cache (all sessions)
   *
   * @return {Promise<boolean>} True if successful
   */
  async clearAll() {
    if (!this.isAvailable) {
      this.memoryCache.clear();
      return true;
    }
    try {
      return await this.store.clear();
    } catch (error) {
      console.error('[StaticSiteCache] Error clearing all:', error);
      return false;
    }
  }

  /**
   * Clean up old cached items (older than MAX_CACHE_AGE_MS)
   *
   * @return {Promise<number>} Number of items deleted
   */
  async cleanup() {
    if (!this.isAvailable) {
      // For memory cache, just clear everything
      const size = this.memoryCache.size;
      this.memoryCache.clear();
      return size;
    }
    try {
      return await this.store.deleteOlderThan(MAX_CACHE_AGE_MS);
    } catch (error) {
      console.error('[StaticSiteCache] Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Batch get multiple URLs
   *
   * @param {Array<string>} urls - Array of URLs to retrieve
   * @return {Promise<Map<string, Object>>} Map of URL to cached data
   */
  async batchGet(urls) {
    const results = new Map();

    // Process in parallel for better performance
    await Promise.all(urls.map(async url => {
      const cached = await this.get(url);
      if (cached) {
        results.set(url, cached);
      }
    }));
    return results;
  }

  /**
   * Batch set multiple URLs
   *
   * @param {Array<Object>} items - Array of {url, processedHtml, assetUrls}
   * @return {Promise<number>} Number of items successfully cached
   */
  async batchSet(items) {
    let successCount = 0;

    // Process in parallel for better performance
    await Promise.all(items.map(async item => {
      const success = await this.set(item.url, item.processedHtml, item.assetUrls);
      if (success) {
        successCount++;
      }
    }));
    return successCount;
  }

  /**
   * Get cache health information
   *
   * @return {Promise<Object>} Health information
   */
  async getHealth() {
    const stats = await this.getStats();
    return {
      isHealthy: this.isAvailable,
      usingFallback: stats.usingFallback,
      cacheSize: stats.sessionCached,
      storageWarning: stats.storagePercent !== null && stats.storagePercent > 80,
      recommendations: this.getRecommendations(stats)
    };
  }

  /**
   * Get recommendations based on cache state
   *
   * @param {Object} stats - Cache statistics
   * @return {Array<string>} Array of recommendation messages
   */
  getRecommendations(stats) {
    const recommendations = [];
    if (stats.usingFallback) {
      recommendations.push('IndexedDB is not available. Using in-memory fallback which has a 500 URL limit.');
    }
    if (stats.storagePercent !== null && stats.storagePercent > 80) {
      recommendations.push(`Browser storage is ${Math.round(stats.storagePercent)}% full. Consider clearing old caches.`);
    }
    if (stats.storagePercent !== null && stats.storagePercent > 95) {
      recommendations.push('Browser storage is nearly full. Cache operations may fail.');
    }
    if (stats.totalCached > stats.sessionCached * 2) {
      recommendations.push('Old cache data detected. Run cleanup() to free up space.');
    }
    return recommendations;
  }
}
/* harmony default export */ const staticSiteCache = (StaticSiteCache);
;// ./assets/src/utils/manifestCache.js
/**
 * Manifest Cache - Persistent cache for file-manifest.json
 *
 * Caches the file manifest locally in IndexedDB to avoid fetching from remote
 * storage on every publish. Provides 2-5 second improvement per publish by
 * eliminating network round trip for manifest download.
 *
 * Cache Key Strategy:
 * Uses provider ID as cache key. Each storage provider has its own manifest.
 *
 * Features:
 * - Persistent storage across browser sessions
 * - 1-hour cache expiration (manifests update frequently)
 * - Per-provider caching (different providers have different manifests)
 * - Automatic cleanup of old entries
 * - Works in WordPress Playground WASM environment
 *
 * Performance Impact:
 * - First publish: Fetch from remote, cache locally (no improvement)
 * - Subsequent publishes within 1 hour: Use cached manifest (2-5 second improvement)
 * - After manifest updates: Cache is automatically updated
 *
 * @package
 */



/**
 * Cache schema version
 * Increment this when making breaking changes to cache structure.
 * This will automatically invalidate old cached data.
 */
const CACHE_SCHEMA_VERSION = 2; // Incremented for IndexedDB keyPath fix

/**
 * Cache configuration
 */
const MANIFEST_CACHE_CONFIG = {
  dbName: 'aether-manifest-cache',
  version: 1,
  stores: {
    manifests: {
      keyPath: 'cacheKey',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }, {
        name: 'providerId',
        keyPath: 'providerId',
        unique: false
      }]
    }
  }
};

/**
 * Cache expiration time (1 hour)
 * Manifests update frequently during development/publishing, so short TTL
 */
const manifestCache_CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Manifest Cache Manager
 *
 * Provides persistent caching of file manifests
 */
class ManifestCache {
  /**
   * Constructor
   */
  constructor() {
    this.store = new utils_indexedDB('manifests', MANIFEST_CACHE_CONFIG);
    this.cleanupPromise = null; // Track cleanup to avoid concurrent runs
  }

  /**
   * Generate cache key from provider ID
   *
   * @param {string} providerId - Storage provider ID
   * @return {string} Cache key
   */
  getCacheKey(providerId) {
    return `manifest:${providerId}`;
  }

  /**
   * Get cached manifest for a provider
   *
   * @param {string} providerId - Storage provider ID
   * @return {Promise<Object|null>} Cached manifest or null if not found/expired
   */
  async get(providerId) {
    const cacheKey = this.getCacheKey(providerId);
    try {
      const cached = await this.store.get(cacheKey);

      // Check if cache entry exists
      if (cached && cached.timestamp) {
        // Check schema version - invalidate if mismatched
        if (cached.schemaVersion !== undefined && cached.schemaVersion !== CACHE_SCHEMA_VERSION) {
          console.log(`[ManifestCache] Cache schema version mismatch for ${providerId} (cached: ${cached.schemaVersion}, current: ${CACHE_SCHEMA_VERSION}). Invalidating cache.`);
          await this.store.delete(cacheKey);
          return null;
        }

        // Check if cache is expired
        const age = Date.now() - cached.timestamp;
        if (age < manifestCache_CACHE_EXPIRATION_MS) {
          return cached.manifest;
        }

        // Cache expired - delete it
        await this.store.delete(cacheKey);
      }
    } catch (error) {
      console.error(`[ManifestCache] Error getting cache for ${providerId}:`, error);
    }
    return null; // Cache miss or error
  }

  /**
   * Set cached manifest for a provider
   *
   * @param {string} providerId - Storage provider ID
   * @param {Object} manifest   - Manifest object to cache
   * @return {Promise<boolean>} True if successfully cached
   */
  async set(providerId, manifest) {
    const cacheKey = this.getCacheKey(providerId);
    try {
      await this.store.set(cacheKey, {
        manifest
      }, {
        providerId,
        schemaVersion: CACHE_SCHEMA_VERSION
      });
      return true;
    } catch (error) {
      console.error(`[ManifestCache] Error setting cache for ${providerId}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cached manifest for a provider
   *
   * Use this after uploading a new manifest to force refresh on next publish
   *
   * @param {string} providerId - Storage provider ID
   * @return {Promise<boolean>} True if deleted successfully
   */
  async invalidate(providerId) {
    const cacheKey = this.getCacheKey(providerId);
    try {
      await this.store.delete(cacheKey);
      return true;
    } catch (error) {
      console.error(`[ManifestCache] Error invalidating cache for ${providerId}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired cache entries
   *
   * Runs automatically on initialization, removes entries older than 1 hour
   *
   * @return {Promise<number>} Number of entries cleaned up
   */
  async cleanup() {
    // Prevent concurrent cleanup runs
    if (this.cleanupPromise) {
      return this.cleanupPromise;
    }
    this.cleanupPromise = (async () => {
      try {
        const deleted = await this.store.deleteOlderThan(manifestCache_CACHE_EXPIRATION_MS);
        if (deleted > 0) {
          console.log(`[ManifestCache] Cleaned up ${deleted} expired cache entries`);
        }
        return deleted;
      } catch (error) {
        console.error('[ManifestCache] Error during cleanup:', error);
        return 0;
      } finally {
        this.cleanupPromise = null;
      }
    })();
    return this.cleanupPromise;
  }

  /**
   * Clear all cached data
   *
   * @return {Promise<boolean>} True if successful
   */
  async clear() {
    return this.store.clear();
  }

  /**
   * Get cache statistics
   *
   * @return {Promise<Object>} Cache statistics
   */
  async getStats() {
    try {
      const totalCount = await this.store.count();
      return {
        totalCached: totalCount
      };
    } catch (error) {
      console.error('[ManifestCache] Error getting stats:', error);
      return {
        totalCached: 0
      };
    }
  }
}

// Create singleton instance
let manifestCache_cacheInstance = null;

/**
 * Get manifest cache instance (singleton)
 *
 * @return {ManifestCache} Cache instance
 */
function getManifestCache() {
  if (!manifestCache_cacheInstance) {
    manifestCache_cacheInstance = new ManifestCache();

    // Run cleanup on first initialization
    manifestCache_cacheInstance.cleanup().catch(error => {
      console.error('[ManifestCache] Initial cleanup failed:', error);
    });
  }
  return manifestCache_cacheInstance;
}
/* harmony default export */ const manifestCache = ((/* unused pure expression or super */ null && (getManifestCache)));
;// ./assets/src/utils/manifestManager.js
/**
 * Manifest Manager Utility
 *
 * Manages the file manifest JSON that tracks file sizes and hashes
 * for upload optimization. The manifest is stored remotely at
 * file-manifest.json and cached locally in IndexedDB.
 *
 * Performance: Local caching saves 2-5 seconds per publish by avoiding
 * remote manifest download on subsequent publishes within 1 hour.
 *
 * @package
 */




/**
 * Fetch existing manifest from remote storage with local caching.
 *
 * Checks local IndexedDB cache first (1-hour TTL), falls back to remote download.
 * Saves 2-5 seconds per publish by avoiding network round trip.
 *
 * @param {Object} storageService StorageService instance.
 * @param {string} providerId     Optional provider ID for caching (defaults to 'default').
 * @return {Promise<Object>} Manifest object (empty object if not found).
 */
async function fetchManifest(storageService, providerId = 'default') {
  const manifestKey = 'file-manifest.json';

  // Check cache first
  const cache = getManifestCache();
  const cachedManifest = await cache.get(providerId);
  if (cachedManifest) {
    debug('Manifest loaded from cache:', {
      providerId,
      fileCount: Object.keys(cachedManifest).length
    });
    return cachedManifest;
  }
  try {
    debug('Fetching manifest from remote:', manifestKey);

    // Try to download manifest from storage.
    const manifestBlob = await storageService.downloadManifest();
    if (!manifestBlob) {
      debug('Manifest not found, starting with empty manifest');
      // Cache empty manifest to avoid repeated fetches
      await cache.set(providerId, {});
      return {};
    }

    // Parse JSON from blob.
    const manifestText = await manifestBlob.text();
    const manifest = JSON.parse(manifestText);
    debug('Manifest fetched successfully:', {
      fileCount: Object.keys(manifest).length
    });

    // Cache the manifest
    await cache.set(providerId, manifest);
    return manifest || {};
  } catch (error) {
    // If manifest doesn't exist (404) or other error, start with empty manifest.
    if (error.message && error.message.includes('404')) {
      debug('Manifest not found (404), starting with empty manifest');
      // Cache empty manifest
      await cache.set(providerId, {});
      return {};
    }
    debug_debugWarn('Failed to fetch manifest, starting with empty manifest:', error);
    // Don't cache errors to allow retry on next publish
    return {};
  }
}

/**
 * Update manifest entry with size, hash, and optional content-type.
 *
 * @param {Object} manifest    Manifest object to update.
 * @param {string} storageKey  Storage key/path for the file.
 * @param {number} size        File size in bytes.
 * @param {string} hash        SHA-256 hash hex string.
 * @param {string} contentType Optional content-type header value.
 * @return {Object} Updated manifest object.
 */
function updateManifestEntry(manifest, storageKey, size, hash, contentType = null) {
  if (!manifest) {
    manifest = {};
  }
  manifest[storageKey] = {
    size,
    hash
  };

  // Add content-type if provided
  if (contentType) {
    manifest[storageKey].contentType = contentType;
  }
  debug('Updated manifest entry:', {
    storageKey,
    size,
    hashLength: hash.length,
    contentType: contentType || 'not specified'
  });
  return manifest;
}

/**
 * Check if file should be skipped based on size and hash comparison.
 *
 * Two-stage check: size first, then hash if size matches.
 * Returns true if both size and hash match existing entry.
 *
 * @param {Object} manifest   Manifest object.
 * @param {string} storageKey Storage key/path for the file.
 * @param {number} size       File size in bytes.
 * @param {string} hash       SHA-256 hash hex string.
 * @return {boolean} True if file should be skipped (size and hash match).
 */
function manifestManager_shouldSkipUpload(manifest, storageKey, size, hash) {
  if (!manifest || !manifest[storageKey]) {
    // No entry in manifest, don't skip.
    return false;
  }
  const entry = manifest[storageKey];

  // Stage 1: Check size first (fast comparison).
  if (entry.size !== size) {
    debug('File size differs, will upload:', {
      storageKey,
      existingSize: entry.size,
      newSize: size
    });
    return false;
  }

  // Stage 2: Check hash if size matches.
  if (entry.hash !== hash) {
    debug('File size matches but hash differs, will upload:', {
      storageKey,
      size
    });
    return false;
  }

  // Both size and hash match - skip upload.
  debug('File unchanged, skipping upload:', {
    storageKey,
    size,
    hash: hash.substring(0, 16) + '...'
  });
  return true;
}

/**
 * Clean up manifest by removing entries not in current upload set.
 *
 * This prevents manifest from growing indefinitely as files are added/removed.
 * Returns a new manifest object containing only entries for files in currentFiles set.
 *
 * @param {Object} manifest     Existing manifest object.
 * @param {Set}    currentFiles Set of storage keys for files in current upload.
 * @return {Object} Cleaned manifest object.
 */
function cleanupManifest(manifest, currentFiles) {
  if (!manifest || !currentFiles) {
    return manifest || {};
  }
  const cleanedManifest = {};
  let removedCount = 0;

  // Keep only entries for files that exist in current upload
  // Also preserve wp-content.zip entries (uploaded in parallel step)
  for (const storageKey of Object.keys(manifest)) {
    if (currentFiles.has(storageKey) || storageKey.includes('/wp-content.zip')) {
      cleanedManifest[storageKey] = manifest[storageKey];
    } else {
      removedCount++;
    }
  }
  if (removedCount > 0) {
    debug('Manifest cleanup:', {
      before: Object.keys(manifest).length,
      after: Object.keys(cleanedManifest).length,
      removed: removedCount
    });
  }
  return cleanedManifest;
}

/**
 * Upload manifest to remote storage and update cache.
 *
 * @param {Object} storageService StorageService instance.
 * @param {Object} manifest       Manifest object to upload.
 * @param {string} providerId     Optional provider ID for cache invalidation (defaults to 'default').
 * @return {Promise<boolean>} True if upload succeeded.
 */
async function uploadManifest(storageService, manifest, providerId = 'default') {
  const manifestKey = 'file-manifest.json';
  try {
    debug('Uploading manifest:', {
      manifestKey,
      fileCount: Object.keys(manifest).length
    });

    // Convert manifest to JSON blob (minified for smaller file size).
    const manifestJson = JSON.stringify(manifest);
    const manifestBlob = new Blob([manifestJson], {
      type: 'application/json'
    });

    // Upload manifest via storage service.
    const result = await storageService.uploadManifest(manifestBlob);
    if (result.success) {
      debug('Manifest uploaded successfully');

      // Update cache with new manifest
      const cache = getManifestCache();
      await cache.set(providerId, manifest);
      return true;
    }
    debug_debugWarn('Manifest upload failed:', result.error);
    return false;
  } catch (error) {
    debug_debugWarn('Failed to upload manifest:', error);
    return false;
  }
}
;// ./assets/src/utils/concurrencyLimiter.js
/**
 * Concurrency Limiter Utility
 *
 * Limits the number of concurrent async operations to prevent overwhelming
 * the browser/server with too many simultaneous requests.
 *
 * @package
 */

/**
 * Create a concurrency limiter function.
 *
 * Returns a function that wraps async operations and ensures only
 * a limited number run concurrently. Additional operations are queued
 * and executed as slots become available.
 *
 * @param {number} limit Maximum number of concurrent operations (default: 5)
 * @return {Function} Limiter function that wraps async operations
 *
 * @example
 * const limiter = createConcurrencyLimiter(3);
 * const results = await Promise.allSettled([
 *   limiter(() => asyncOperation1()),
 *   limiter(() => asyncOperation2()),
 *   limiter(() => asyncOperation3()),
 *   limiter(() => asyncOperation4()), // Will wait until one of the first 3 completes
 * ]);
 */
function createConcurrencyLimiter(limit = 5) {
  let running = 0;
  const queue = [];

  /**
   * Execute the next queued operation if slots are available.
   */
  const processQueue = () => {
    // If we're at the limit or queue is empty, nothing to do
    if (running >= limit || queue.length === 0) {
      return;
    }

    // Get next operation from queue
    const {
      operation,
      resolve,
      reject
    } = queue.shift();
    running++;

    // Execute the operation
    Promise.resolve(operation()).then(result => {
      running--;
      resolve(result);
      // Process next item in queue
      processQueue();
    }).catch(error => {
      running--;
      reject(error);
      // Process next item in queue
      processQueue();
    });
  };

  /**
   * Limiter function that wraps async operations.
   *
   * @param {Function} operation Async operation to execute
   * @return {Promise} Promise that resolves when operation completes
   */
  return operation => {
    return new Promise((resolve, reject) => {
      queue.push({
        operation,
        resolve,
        reject
      });
      processQueue();
    });
  };
}
;// ./assets/src/publish/utils/fileUploadManager.js
/**
 * File Upload Manager Utility
 *
 * Provides reusable functions for uploading files with progress tracking,
 * concurrency limiting, and hash-based deduplication.
 *
 * Used by:
 * - Static site file uploads (useStaticSiteGenerator.js)
 * - wp-content.zip uploads (usePublishController.js)
 *
 * @package
 */






/**
 * Sanitize a storage key for use in status message keys.
 *
 * @param {string} key Storage key.
 * @return {string} Sanitized key.
 */
function sanitizeKeyForStatus(key) {
  // Replace special characters that might cause issues in status keys
  return key.replace(/[^a-zA-Z0-9-_]/g, '-');
}

/**
 * Upload multiple files with progress tracking and concurrency limiting.
 *
 * @typedef {Object} FileUploadDescriptor
 * @property {string}                 key                           Storage key/path.
 * @property {Blob}                   blob                          File blob to upload.
 * @property {string}                 contentType                   MIME type.
 * @property {string}                 [displayName]                 Display name for progress messages (optional).
 * @property {Object}                 [metadata]                    Optional metadata object.
 *
 * @param    {Object}                 options                       Options object.
 * @param    {FileUploadDescriptor[]} options.files                 Array of file upload descriptors.
 * @param    {Object}                 options.storageService        StorageService instance.
 * @param    {Function}               options.setStatusMessage      Status message callback function.
 * @param    {number}                 [options.concurrency=5]       Max concurrent uploads (default: 5).
 * @param    {Function}               [options.onProgress]          Overall progress callback (optional).
 * @param    {string}                 [options.keyPrefix='upload']  Prefix for status message keys (default: 'upload').
 * @param    {boolean}                [options.skipHashCheck=false] Boolean to skip hash checking (default: false).
 * @param    {Object}                 [options.manifest]            Manifest object for hash checking (optional).
 * @param    {Function}               [options.shouldSkipUpload]    Custom function to determine if file should be skipped (optional).
 * @return {Promise<Object>} Result with success, uploaded, skipped, failed counts and results array.
 */
async function uploadFilesWithProgress({
  files,
  storageService,
  setStatusMessage,
  concurrency = 5,
  onProgress = null,
  keyPrefix = 'upload',
  skipHashCheck = false,
  manifest = null,
  shouldSkipUpload: customShouldSkipUpload = null
}) {
  if (!files || files.length === 0) {
    return {
      success: true,
      uploaded: 0,
      skipped: 0,
      failed: 0,
      results: []
    };
  }
  const limiter = createConcurrencyLimiter(concurrency);
  let filesUploaded = 0;
  let filesSkipped = 0;
  let filesFailed = 0;
  let totalProcessed = 0; // Track total processed (uploaded + skipped) for progress
  const results = [];

  // Process all files in parallel with concurrency limiting
  const uploadPromises = files.map(file => limiter(async () => {
    const {
      key,
      blob,
      contentType,
      displayName: providedDisplayName,
      metadata = {}
    } = file;

    // Ensure displayName is never empty - fallback to key, then to 'file'
    const displayName = providedDisplayName || key || 'file';
    const uploadKey = `${keyPrefix}-${sanitizeKeyForStatus(key)}`;
    let fileHash = null;
    let shouldSkip = false;
    try {
      // Hash checking and skip logic (if enabled)
      if (!skipHashCheck && manifest) {
        const fileSize = blob.size;
        const existingEntry = manifest[key];
        if (existingEntry && existingEntry.size === fileSize) {
          // Stage 2: Calculate hash if size matches
          try {
            fileHash = await fileHash_calculateFileHash(blob);
            shouldSkip = customShouldSkipUpload ? customShouldSkipUpload(manifest, key, fileSize, fileHash) : manifestManager_shouldSkipUpload(manifest, key, fileSize, fileHash);
          } catch (error) {
            debug_debugWarn('Failed to calculate file hash, will upload:', error);
            shouldSkip = false;
          }
        }
      }
      if (shouldSkip) {
        // File unchanged - skip upload
        filesSkipped++;
        totalProcessed++;
        if (setStatusMessage) {
          setStatusMessage(`Skipped unchanged file ${displayName}`, 'success', uploadKey);
        }

        // Report progress (guard against empty array to prevent division by zero)
        if (onProgress && files.length > 0) {
          onProgress(totalProcessed, files.length, null);
        }
        results.push({
          key,
          success: true,
          skipped: true,
          url: null,
          hash: fileHash,
          // Include hash so skipped files can be added to manifest
          size: blob.size // Include size for consistency
        });
        return;
      }

      // Calculate hash if not already calculated (for manifest update)
      if (!fileHash && !skipHashCheck) {
        try {
          fileHash = await fileHash_calculateFileHash(blob);
        } catch (error) {
          debug_debugWarn('Failed to calculate hash:', error);
          fileHash = null;
        }
      }
      const fileSize = blob.size;

      // Create status message with unique key for progress tracking
      if (setStatusMessage) {
        setStatusMessage(`Uploading ${displayName}`, 'progress', uploadKey, {
          percent: 0,
          loaded: 0,
          total: fileSize
        });
      }

      // Upload file with progress tracking
      const uploadResult = await storageService.upload(key, blob, {
        contentType,
        cacheControl: metadata.cacheControl || 'public, max-age=31536000, immutable',
        onProgress: (loaded, total, percent) => {
          // Update progress in status message
          if (setStatusMessage) {
            setStatusMessage(`Uploading ${displayName}`, 'progress', uploadKey, {
              percent,
              loaded,
              total
            });
          }
        }
      });
      if (uploadResult.success) {
        filesUploaded++;
        totalProcessed++;

        // Update message to success (remove progress)
        if (setStatusMessage) {
          setStatusMessage(`Uploaded ${displayName}`, 'success', uploadKey, null // Remove progress
          );
        }

        // Report progress after upload completes (guard against empty array)
        if (onProgress && files.length > 0) {
          onProgress(totalProcessed, files.length, null);
        }
        results.push({
          key,
          success: true,
          skipped: false,
          url: uploadResult.url,
          hash: fileHash,
          size: fileSize
        });
      } else {
        // Upload failed
        filesFailed++;
        if (setStatusMessage) {
          setStatusMessage(`Failed to upload ${displayName}`, 'error', uploadKey, null);
        }
        results.push({
          key,
          success: false,
          skipped: false,
          url: null,
          error: uploadResult.error || 'Upload failed'
        });
      }
    } catch (error) {
      // Failed to process file
      filesFailed++;
      debug_debugWarn(`Failed to upload file: ${key}`, error);
      if (setStatusMessage) {
        setStatusMessage(`Failed to upload ${displayName}`, 'error', uploadKey, null);
      }
      results.push({
        key,
        success: false,
        skipped: false,
        url: null,
        error: error.message || 'Upload failed'
      });
    }
  }));

  // Wait for all uploads to complete (success or failure)
  await Promise.allSettled(uploadPromises);
  return {
    success: filesFailed === 0,
    uploaded: filesUploaded,
    skipped: filesSkipped,
    failed: filesFailed,
    results
  };
}

/**
 * Upload a single file with progress tracking.
 *
 * @param {Object}   options                  Options object.
 * @param {string}   options.key              Storage key.
 * @param {Blob}     options.blob             File blob.
 * @param {Object}   options.storageService   StorageService instance.
 * @param {Function} options.setStatusMessage Status message callback.
 * @param {string}   options.contentType      MIME type.
 * @param {string}   options.displayName      Display name (optional, defaults to key).
 * @param {string}   options.statusKey        Unique key for status message (required).
 * @param {Function} options.onProgress       Progress callback (optional).
 * @param {boolean}  options.skipHashCheck    Boolean to skip hash checking (default: false).
 * @param {Object}   options.manifest         Manifest object (optional).
 * @param {Function} options.shouldSkipUpload Custom function to determine if file should be skipped (optional).
 * @param {Object}   options.metadata         Optional metadata object.
 * @return {Promise<Object>} Result with success, url, skipped, error.
 */
async function uploadSingleFileWithProgress({
  key,
  blob,
  storageService,
  setStatusMessage,
  contentType,
  displayName: providedDisplayName,
  statusKey,
  onProgress = null,
  skipHashCheck = false,
  manifest = null,
  shouldSkipUpload: customShouldSkipUpload = null,
  metadata = {}
}) {
  if (!statusKey) {
    throw new Error('statusKey is required for uploadSingleFileWithProgress');
  }

  // Ensure displayName is never empty - fallback to key, then to 'file'
  const displayName = providedDisplayName || key || 'file';
  let fileHash = null;
  let shouldSkip = false;
  try {
    // Hash checking and skip logic (if enabled)
    if (!skipHashCheck && manifest) {
      const fileSize = blob.size;
      const existingEntry = manifest[key];
      if (existingEntry && existingEntry.size === fileSize) {
        // Stage 2: Calculate hash if size matches
        try {
          fileHash = await calculateFileHash(blob);
          shouldSkip = customShouldSkipUpload ? customShouldSkipUpload(manifest, key, fileSize, fileHash) : shouldSkipUpload(manifest, key, fileSize, fileHash);
        } catch (error) {
          debugWarn('Failed to calculate file hash, will upload:', error);
          shouldSkip = false;
        }
      }
    }
    if (shouldSkip) {
      // File unchanged - skip upload
      if (setStatusMessage) {
        const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        setStatusMessage(`${displayName} unchanged (${fileSizeMB} MB) - skipping upload`, 'success', statusKey);
      }
      return {
        success: true,
        url: null,
        skipped: true,
        error: null,
        hash: fileHash
      };
    }

    // Calculate hash if not already calculated (for manifest update)
    if (!fileHash && !skipHashCheck) {
      try {
        fileHash = await calculateFileHash(blob);
      } catch (error) {
        debugWarn('Failed to calculate hash:', error);
        fileHash = null;
      }
    }
    const fileSize = blob.size;

    // Create status message with progress tracking
    if (setStatusMessage) {
      setStatusMessage(`Uploading ${displayName}`, 'progress', statusKey, {
        percent: 0,
        loaded: 0,
        total: fileSize
      });
    }

    // Upload file with progress tracking
    const uploadResult = await storageService.upload(key, blob, {
      contentType,
      cacheControl: metadata.cacheControl || 'public, max-age=31536000, immutable',
      onProgress: (loaded, total, percent) => {
        // Update progress in status message
        if (setStatusMessage) {
          setStatusMessage(`Uploading ${displayName}`, 'progress', statusKey, {
            percent,
            loaded,
            total
          });
        }

        // Call custom progress callback if provided
        if (onProgress) {
          onProgress(loaded, total, percent);
        }
      }
    });
    if (uploadResult.success) {
      // Update message to success (remove progress)
      if (setStatusMessage) {
        setStatusMessage(`Uploaded ${displayName}`, 'success', statusKey, null // Remove progress
        );
      }
      return {
        success: true,
        url: uploadResult.url,
        skipped: false,
        error: null,
        hash: fileHash,
        size: fileSize
      };
    }
    // Upload failed
    if (setStatusMessage) {
      setStatusMessage(`Failed to upload ${displayName}`, 'error', statusKey, null);
    }
    return {
      success: false,
      url: null,
      skipped: false,
      error: uploadResult.error || 'Upload failed',
      hash: fileHash
    };
  } catch (error) {
    debugWarn(`Failed to upload file: ${key}`, error);
    if (setStatusMessage) {
      setStatusMessage(`Failed to upload ${displayName}`, 'error', statusKey, null);
    }
    return {
      success: false,
      url: null,
      skipped: false,
      error: error.message || 'Upload failed',
      hash: fileHash
    };
  }
}
;// ./assets/src/publish/hooks/useStaticSiteGenerator.js
/**
 * Static Site Generator Hook
 *
 * Processes URLs and uploads static site files using a two-phase approach:
 * 1. PHASE 1 (Pre-scan): Fetch all URLs, extract assets, count total files
 *    - Discovers all unique assets across all pages
 *    - Caches processed HTML to avoid duplicate work
 *    - Calculates accurate total file count for progress tracking
 * 2. PHASE 2 (Upload): Upload all files with accurate progress
 *    - Uses cached HTML from pre-scan phase
 *    - Reports progress as filesUploaded/totalFilesToUpload (fixed total)
 *    - Handles deduplication of shared assets across pages
 *
 * @package
 */













/**
 * Process URLs and upload static site files.
 *
 * @param {Function} onProgress Progress callback (uploadedFiles, totalFiles, message).
 * @return {Function} Process function.
 */
function useStaticSiteGenerator(onProgress) {
  const processUrls = (0,external_wp_element_namespaceObject.useCallback)(async (urls, staticSiteUrl, staticSiteProviderId, siteUrl, setStatusMessage, blueprintData, removeMessage = null) => {
    // Create asset tracker to prevent duplicate uploads.
    const assetTracker = createAssetTracker();

    // Track all uploaded files for manifest generation.
    const uploadedFiles = [];

    // Track failures for reporting.
    const failures = {
      urlsFailed: 0,
      urlsSucceeded: 0,
      assetsFailed: 0,
      failedUrls: []
    };

    // Get provider configuration
    let providerConfig = {};
    try {
      // Get provider for static_site deployment type
      // Dynamic import to avoid circular dependencies
      const providerDiscovery = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 264));
      const staticSiteProviderId = await providerDiscovery.getProviderForDeploymentType('static_site');
      if (staticSiteProviderId) {
        const configResponse = await utils_api({
          path: `/aether/site-exporter/providers/${staticSiteProviderId}/config`
        });
        if (configResponse.success && configResponse.config) {
          providerConfig = configResponse.config;
        }
      }
    } catch (error) {
      debug('Failed to load provider configuration:', error);
    }

    // Configure local filesystem storage
    const staticPath = providerConfig.static_files_path || 'static/';
    const config = {
      public_url: siteUrl,
      base_url: staticSiteUrl || siteUrl
    };
    debug('Static site storage configuration:', {
      staticPath
    });

    // Create storage service (jobId no longer needed for path)
    const storageService = new StorageService(staticPath, '', config);
    const totalUrls = urls.length;

    // PHASE 1: Pre-scan all URLs to discover total file count
    // This allows us to report accurate progress (X of Y files) instead of growing totals
    if (setStatusMessage) {
      setStatusMessage('Scanning files to upload…', 'progress', 'scanFiles');
    }

    // Cache for processed HTML and discovered assets
    // Using IndexedDB for unlimited caching (instead of RAM-limited Map)
    const cache = new staticSiteCache();
    const allUniqueAssets = new Set(); // Track unique assets across all URLs

    // Log cache health
    const cacheHealth = await cache.getHealth();
    if (cacheHealth.usingFallback) {
      debug_debugWarn('[Aether] IndexedDB not available, using in-memory fallback (500 URL limit)');
    }
    if (cacheHealth.recommendations.length > 0) {
      cacheHealth.recommendations.forEach(rec => debug_debugWarn(`[Aether] ${rec}`));
    }

    // Clean up old caches before starting
    const cleanedCount = await cache.cleanup();
    if (cleanedCount > 0) {
      debug(`[Aether] Cleaned up ${cleanedCount} old cache entries`);
    }

    // Pre-scan: Fetch all URLs, extract assets, count total files
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        // Fetch HTML content directly from URL (as anonymous visitor).
        const htmlResponse = await fetch(url, {
          method: 'GET',
          credentials: 'omit',
          headers: {
            'User-Agent': 'Aether Static Site Generator'
          }
        });
        if (htmlResponse.status !== 200) {
          // Log failure silently (non-200 responses are expected for some URLs)
          // Use debugWarn instead of console.error to avoid console noise
          debug_debugWarn(`[Aether] Skipping URL with non-200 status: ${url} (HTTP ${htmlResponse.status})`);
          failures.urlsFailed++;
          failures.failedUrls.push({
            url,
            reason: `Failed to fetch HTML: HTTP ${htmlResponse.status} ${htmlResponse.statusText}`
          });
          continue;
        }
        const html = await htmlResponse.text();

        // Extract assets from HTML
        const assetUrls = await extractAssetsFromHtml(html, url, siteUrl);

        // Add all assets to unique set
        for (const assetUrl of assetUrls) {
          allUniqueAssets.add(assetUrl);
        }

        // Process HTML and cache it
        const processedHtml = processHtml(html, url, siteUrl, staticSiteUrl);

        // Cache processed HTML and asset URLs in IndexedDB
        // No size limit - IndexedDB can handle thousands of URLs
        await cache.set(url, processedHtml, assetUrls);
      } catch (error) {
        // Log failure silently (network errors are expected for some URLs)
        // Use debugWarn instead of letting error propagate to avoid console noise
        debug_debugWarn(`[Aether] Error fetching URL: ${url}`, error.message);
        failures.urlsFailed++;
        failures.failedUrls.push({
          url,
          reason: error.message
        });
      }
    }

    // Calculate total files: HTML files + unique assets
    const cacheStats = await cache.getStats();
    const totalFilesToUpload = cacheStats.sessionCached +
    // HTML files successfully cached
    allUniqueAssets.size; // Unique assets across all pages

    debug('Pre-scan complete:', {
      urlsScanned: urls.length,
      urlsSuccessful: cacheStats.sessionCached,
      uniqueAssets: allUniqueAssets.size,
      totalFilesToUpload
    });
    if (setStatusMessage) {
      setStatusMessage(`Pre-scan complete: ${cacheStats.sessionCached} HTML files, ${allUniqueAssets.size} assets`, 'success', 'scanFiles');
    }

    // PHASE 2: Upload all files with accurate progress tracking
    // Fetch manifest for hash comparison
    let manifest = {};
    try {
      if (setStatusMessage) {
        setStatusMessage('Fetching file manifest…', 'progress', 'fetchManifest');
      }
      manifest = await fetchManifest(storageService, staticSiteProviderId);
      const manifestEntryCount = Object.keys(manifest).length;
      if (setStatusMessage) {
        setStatusMessage(`Fetched file manifest (${manifestEntryCount} entries)`, 'success', 'fetchManifest');
      }
      debug(`Manifest loaded with ${manifestEntryCount} entries`);
    } catch (error) {
      debug_debugWarn('Failed to fetch manifest, continuing without hash comparison:', error);
      manifest = {};
    }
    let filesUploaded = 0;
    let filesSkipped = 0;

    /**
     * Process and upload assets for a given set of asset URLs.
     * This function handles fetching, uploading, and manifest tracking for assets.
     *
     * @param {Array<string>} assetUrls Array of asset URLs to process.
     * @return {Promise<void>}
     */
    const processAssets = async assetUrls => {
      // Step 1: Filter out assets already processed in THIS session (deduplication)
      const assetsNotInTracker = assetUrls.filter(assetUrl => !assetTracker.isUploaded(assetUrl));
      if (assetsNotInTracker.length === 0) {
        return; // Skip if no assets to process
      }

      // Step 2: Fetch all assets first (this part stays sequential to avoid overwhelming the server)
      const assetData = [];
      for (const assetUrl of assetsNotInTracker) {
        try {
          // Fetch asset content from URL (as anonymous visitor).
          const assetResponse = await fetch(assetUrl, {
            method: 'GET',
            credentials: 'omit',
            headers: {
              'User-Agent': 'Aether Static Site Generator'
            }
          });
          if (assetResponse.status !== 200) {
            // Skip failed asset silently (non-200 responses are expected for some assets)
            continue;
          }
          const assetContent = await assetResponse.blob();
          const contentType = assetResponse.headers.get('content-type') || 'application/octet-stream';

          // Get asset path and storage key.
          const assetPath = getAssetLocalPath(assetUrl);

          // Skip invalid assets (empty path after Playground scope stripping)
          if (assetPath === null) {
            debug_debugWarn(`Skipping invalid asset URL (empty path after scope stripping): ${assetUrl}`);
            assetTracker.markFailed(assetUrl);
            continue;
          }
          const assetKey = assetPath;

          // Create blob with appropriate content type.
          const assetBlob = new Blob([assetContent], {
            type: contentType
          });

          // Step 3: Check manifest BEFORE adding to upload queue
          // This prevents unnecessary uploads for assets that already exist in manifest
          const existingEntry = manifest[assetKey];
          if (existingEntry && existingEntry.size === assetBlob.size) {
            // Size matches - calculate hash to verify
            try {
              const assetHash = await fileHash_calculateFileHash(assetBlob);
              if (manifestManager_shouldSkipUpload(manifest, assetKey, assetBlob.size, assetHash)) {
                // Asset exists in manifest with matching hash - skip upload
                // But still mark as uploaded and add to uploadedFiles for cleanup
                assetTracker.markUploaded(assetUrl);
                filesUploaded++;
                filesSkipped++;
                uploadedFiles.push({
                  storageKey: assetKey,
                  relativePath: assetPath,
                  contentType
                });
                continue; // Skip adding to assetData
              }
            } catch (error) {
              debug_debugWarn('Failed to calculate hash for manifest check, will upload:', assetUrl, error);
              // Continue to add asset to upload queue
            }
          }
          assetData.push({
            assetUrl,
            assetPath,
            assetKey,
            assetBlob,
            contentType
          });
        } catch (error) {
          // Failed to fetch asset silently (network errors are expected).
          debug_debugWarn('Failed to fetch asset:', assetUrl, error);
        }
      }

      // Prepare files for upload utility
      const filesToUpload = assetData.map(data => ({
        key: data.assetKey,
        blob: data.assetBlob,
        contentType: data.contentType,
        displayName: data.assetPath || data.assetKey || 'file',
        metadata: {},
        assetData: data // Store original data for later processing
      }));

      // Upload all files in parallel using the utility
      const uploadResult = await uploadFilesWithProgress({
        files: filesToUpload,
        storageService,
        setStatusMessage,
        concurrency: 5,
        onProgress: uploaded => {
          if (onProgress) {
            onProgress(filesUploaded + uploaded, totalFilesToUpload, null);
          }
        },
        keyPrefix: 'upload',
        skipHashCheck: false,
        manifest,
        shouldSkipUpload: manifestManager_shouldSkipUpload
      });

      // Process results and update manifest
      // IMPORTANT: Match results by key, not index, since parallel uploads complete out of order
      for (let i = 0; i < uploadResult.results.length; i++) {
        const result = uploadResult.results[i];
        // Find corresponding fileData by matching the key
        // IMPORTANT: Match by key, not index, since parallel uploads complete out of order
        const fileData = filesToUpload.find(f => f.key === result.key);
        if (!fileData) {
          debug_debugWarn('Could not find fileData for result key:', result.key);
          continue;
        }
        const {
          assetUrl,
          assetPath,
          assetKey,
          contentType
        } = fileData.assetData;
        if (result.success) {
          // Mark asset as uploaded.
          assetTracker.markUploaded(assetUrl);
          filesUploaded++;
          if (result.skipped) {
            filesSkipped++;
          }

          // Update manifest entry if hash was calculated.
          if (result.hash) {
            manifest = updateManifestEntry(manifest, assetKey, result.size || fileData.blob.size, result.hash, contentType);
          }

          // Track uploaded asset file for manifest generation.
          uploadedFiles.push({
            storageKey: assetKey,
            relativePath: assetPath,
            contentType
          });
        }
      }
    };

    // Get all cached URLs from IndexedDB
    const cachedUrls = await cache.getAllUrls();

    // Process each URL sequentially and upload files
    for (const url of cachedUrls) {
      const cached = await cache.get(url);
      if (!cached) {
        debug_debugWarn(`[Aether] Cache miss for URL: ${url} - skipping`);
        continue;
      }
      const {
        processedHtml,
        assetUrls
      } = cached;
      try {
        // Update UI to show current progress (files X of Y).
        // Use a single key for all "Uploading files" messages so they update in place
        if (setStatusMessage) {
          setStatusMessage(`Uploading files (${filesUploaded + 1}/${totalFilesToUpload})`, 'progress', 'uploadFilesProgress');
        }

        // Upload HTML file to storage with progress tracking.
        const htmlPath = getStaticFilePath(url);
        const htmlKey = htmlPath;
        let htmlBlob = new Blob([processedHtml], {
          type: 'text/html'
        });

        // Check if file should be skipped based on size and hash
        const htmlSize = htmlBlob.size;
        let htmlHash = null;
        let shouldSkip = false;

        // Stage 1: Check size first
        const existingEntry = manifest[htmlKey];
        if (existingEntry && existingEntry.size === htmlSize) {
          // Stage 2: Calculate hash if size matches
          try {
            htmlHash = await fileHash_calculateFileHash(htmlBlob);
            shouldSkip = manifestManager_shouldSkipUpload(manifest, htmlKey, htmlSize, htmlHash);
          } catch (error) {
            debug_debugWarn('Failed to calculate hash, will upload:', error);
            shouldSkip = false;
          }
        }
        if (shouldSkip) {
          // File unchanged - skip upload
          filesUploaded++;
          filesSkipped++;
          failures.urlsSucceeded++;

          // Track skipped file in uploadedFiles for manifest cleanup.
          // This prevents the manifest from being wiped clean on next publish.
          uploadedFiles.push({
            storageKey: htmlKey,
            relativePath: htmlPath,
            contentType: 'text/html'
          });
          if (setStatusMessage) {
            const uploadKey = `upload-${htmlPath}`;
            setStatusMessage(`Skipped unchanged file ${htmlPath}`, 'success', uploadKey);
          }

          // Report progress
          if (onProgress) {
            onProgress(filesUploaded, totalFilesToUpload, null);
          }

          // IMPORTANT: Process assets even when HTML is skipped
          // Assets might have changed even if HTML hasn't
          await processAssets(assetUrls);

          // Null blob reference to help GC
          htmlBlob = null;
          continue;
        }

        // Calculate hash if not already calculated
        if (!htmlHash) {
          try {
            htmlHash = await fileHash_calculateFileHash(htmlBlob);
          } catch (error) {
            debug_debugWarn('Failed to calculate hash:', error);
            htmlHash = null;
          }
        }

        // Update status message to show current file being uploaded.
        if (setStatusMessage) {
          const uploadKey = `upload-${htmlPath}`;
          setStatusMessage(`Uploading ${htmlPath}`, 'progress', uploadKey);
        }

        // Report progress BEFORE uploading
        if (onProgress) {
          const progressPercent = totalFilesToUpload > 0 ? Math.round(filesUploaded / totalFilesToUpload * 100) : 0;
          debug('[Aether] uploadStaticSiteFiles HTML before upload:', {
            filesUploaded,
            totalFilesToUpload,
            progressPercent
          });
          onProgress(filesUploaded, totalFilesToUpload, null);
        }

        // Upload HTML file (progress reported via onProgress callback, not upload callback)
        const htmlUploadResult = await storageService.upload(htmlKey, htmlBlob, {
          contentType: 'text/html'
        });
        if (!htmlUploadResult.success) {
          throw new Error(`Failed to upload HTML file: ${htmlUploadResult.error}`);
        }

        // File uploaded successfully - update progress and manifest
        filesUploaded++;
        failures.urlsSucceeded++;

        // Update message to success
        if (setStatusMessage) {
          const uploadKey = `upload-${htmlPath}`;
          setStatusMessage(`Uploaded ${htmlPath}`, 'success', uploadKey);
        }

        // Update manifest entry if hash was calculated
        if (htmlHash) {
          manifest = updateManifestEntry(manifest, htmlKey, htmlSize, htmlHash, 'text/html');
        }

        // Periodic manifest save for crash recovery (every 50 files)
        if (filesUploaded % 50 === 0) {
          try {
            debug('Periodic manifest save:', filesUploaded + ' files');
            await uploadManifest(storageService, manifest, staticSiteProviderId);
          } catch (error) {
            debug_debugWarn('Periodic manifest save failed:', error);
            // Don't fail upload on manifest save error
          }
        }

        // Null blob reference to help GC
        htmlBlob = null;

        // Report progress after upload completes
        if (onProgress) {
          const progressPercent = totalFilesToUpload > 0 ? Math.round(filesUploaded / totalFilesToUpload * 100) : 0;
          debug('[Aether] uploadStaticSiteFiles HTML after upload:', {
            filesUploaded,
            totalFilesToUpload,
            progressPercent
          });
          onProgress(filesUploaded, totalFilesToUpload, null);
        }

        // Track uploaded HTML file.
        uploadedFiles.push({
          storageKey: htmlKey,
          relativePath: htmlPath,
          contentType: 'text/html'
        });

        // Upload all assets extracted from this HTML page.
        // Assets include: CSS, JS, images, fonts, etc.
        // OPTIMIZATION: Deduplication prevents uploading the same asset multiple times.
        // OPTIMIZATION: Parallel uploads with concurrency limiting for better performance.
        await processAssets(assetUrls);

        // Periodic manifest save (after batch completes).
        if (filesUploaded % 50 === 0) {
          try {
            debug('Periodic manifest save:', filesUploaded + ' files');
            await uploadManifest(storageService, manifest, staticSiteProviderId);
          } catch (error) {
            debug_debugWarn('Periodic manifest save failed:', error);
          }
        }
      } catch (error) {
        failures.urlsFailed++;
        failures.failedUrls.push({
          url,
          reason: error.message
        });
      }
    }

    // Clean up cache for this session
    // Cache will be automatically cleaned up after 24 hours anyway
    const cacheCleanedCount = await cache.clearSession();
    if (cacheCleanedCount > 0) {
      debug(`[Aether] Cleared ${cacheCleanedCount} cache entries from this session`);
    }

    // Upload final manifest with cleanup
    try {
      if (setStatusMessage) {
        setStatusMessage('Updating file manifest…', 'progress', 'updateManifest');
      }

      // Clean up manifest to remove entries for files not in current upload
      const currentFileKeys = new Set(uploadedFiles.map(file => file.storageKey));
      const beforeCleanupCount = Object.keys(manifest).length;
      const cleanedManifest = cleanupManifest(manifest, currentFileKeys);
      const afterCleanupCount = Object.keys(cleanedManifest).length;
      const removedCount = beforeCleanupCount - afterCleanupCount;
      debug(`Manifest cleanup: ${beforeCleanupCount} entries → ${afterCleanupCount} entries (${removedCount} removed, ${currentFileKeys.size} current files)`);
      await uploadManifest(storageService, cleanedManifest, staticSiteProviderId);

      // Add success message after manifest update
      if (setStatusMessage) {
        setStatusMessage('Updated file manifest', 'success', 'updateManifest');
      }

      // Log summary statistics for hash-based deduplication
      const actualUploads = filesUploaded - filesSkipped;
      debug('Upload optimization summary:', {
        totalFiles: filesUploaded,
        uploaded: actualUploads,
        skipped: filesSkipped,
        skipRate: filesUploaded > 0 ? `${Math.round(filesSkipped / filesUploaded * 100)}%` : '0%'
      });
    } catch (error) {
      debug_debugWarn('Failed to upload manifest:', error);
      // Don't fail publish if manifest upload fails
    }

    // Remove the "Uploading files" progress message at the end
    // This message is just for progress tracking and not needed in final history
    if (removeMessage) {
      removeMessage('uploadFilesProgress');
    }

    // Return comprehensive result object.
    // Used by usePublishController to track success/failure and update job status.
    return {
      success: failures.urlsFailed === 0,
      urlsProcessed: totalUrls,
      urlsSucceeded: failures.urlsSucceeded,
      urlsFailed: failures.urlsFailed,
      assetsUploaded: assetTracker.getCount(),
      assetsFailed: failures.assetsFailed,
      failedUrls: failures.failedUrls,
      uploadedFiles,
      // List of all uploaded files (for manifest).
      filesUploaded,
      // Number of files uploaded (for progress calculation).
      filesSkipped,
      // Number of files skipped (for reporting).
      totalFilesToUpload // Total files to upload (for progress calculation).
    };
  }, [onProgress]);
  return processUrls;
}
;// ./assets/src/publish/utils/blueprintStepBuilders.js
/**
 * Blueprint Step Builders
 *
 * Utility functions for constructing individual WordPress Playground blueprint steps.
 * Each function is responsible for creating a single step or group of related steps.
 *
 * @package
 */



/**
 * Production zip URL for Aether plugin (matches PHP constant AETHER_PRODUCTION_ZIP_URL).
 */
const AETHER_PRODUCTION_ZIP_URL = 'https://r2.s12y.org/aether.zip';

/**
 * Build the importWordPressFiles step for importing wp-content.zip.
 *
 * Uses 'bundled' resource type to reference wp-content.zip inside the blueprint-bundle.zip.
 *
 * @return {Object} Blueprint step object.
 */
function buildImportFilesStep() {
  return {
    step: 'importWordPressFiles',
    wordPressFilesZip: {
      resource: 'bundled',
      path: '/wp-content.zip'
    }
  };
}

/**
 * Build the installPlugin step for Aether plugin.
 *
 * @return {Object} Blueprint step object.
 */
function buildAetherInstallStep() {
  // Add cache-busting to ensure fresh download.
  const aetherUrl = `${AETHER_PRODUCTION_ZIP_URL}?v=${Date.now()}`;
  return {
    step: 'installPlugin',
    pluginData: {
      resource: 'url',
      url: aetherUrl,
      caption: 'Installing Aether plugin'
    },
    options: {
      activate: false
    }
  };
}

/**
 * Build the defineWpConfigConsts step to identify Playground environment.
 *
 * @return {Object} Blueprint step object.
 */
function buildDefineConstsStep() {
  return {
    step: 'defineWpConfigConsts',
    consts: {
      AETHER_PLAYGROUND_SITE: true
    }
  };
}

/**
 * Build installPlugin steps for WordPress.org plugins.
 *
 * @param {Array<string>} pluginSlugs Array of WordPress.org plugin slugs.
 * @return {Array<Object>} Array of blueprint step objects.
 */
function buildPluginInstallSteps(pluginSlugs) {
  if (!Array.isArray(pluginSlugs)) {
    return [];
  }
  return pluginSlugs.map(slug => ({
    step: 'installPlugin',
    pluginData: {
      resource: 'wordpress.org/plugins',
      slug
    },
    options: {
      activate: false
    }
  }));
}

/**
 * Build installTheme steps for WordPress.org themes.
 *
 * @param {Array<string>} themeSlugs Array of WordPress.org theme slugs.
 * @return {Array<Object>} Array of blueprint step objects.
 */
function buildThemeInstallSteps(themeSlugs) {
  if (!Array.isArray(themeSlugs)) {
    return [];
  }
  return themeSlugs.map(slug => ({
    step: 'installTheme',
    themeData: {
      resource: 'wordpress.org/themes',
      slug
    },
    options: {
      activate: false
    }
  }));
}

/**
 * Build the activatePlugin step for Aether plugin.
 *
 * @return {Object} Blueprint step object.
 */
function buildAetherActivationStep() {
  return {
    step: 'activatePlugin',
    pluginPath: 'aether/aether.php'
  };
}

/**
 * Build complete blueprint steps array.
 *
 * @param {Object} config              Configuration object.
 * @param {Array}  config.wporgPlugins WordPress.org plugin slugs.
 * @param {Array}  config.wporgThemes  WordPress.org theme slugs.
 * @return {Array<Object>} Complete array of blueprint steps.
 */
function buildBlueprintSteps(config) {
  const {
    wporgPlugins = [],
    wporgThemes = []
  } = config;
  const steps = [];

  // Step 1: Import WordPress files (wp-content.zip from bundle).
  steps.push(buildImportFilesStep());

  // Step 2: Install WordPress.org plugins.
  steps.push(...buildPluginInstallSteps(wporgPlugins));

  // Step 3: Install WordPress.org themes.
  steps.push(...buildThemeInstallSteps(wporgThemes));

  /**
   * Filter blueprint steps array.
   *
   * Allows modification of blueprint steps before final JSON generation.
   *
   * @param {Array<Object>} steps  Blueprint steps array.
   * @param {Object}        config Configuration object with wporgPlugins, wporgThemes.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.blueprint.steps', 'my-plugin', (steps, config) => {
   *     // Add custom step at the end
   *     steps.push({
   *         step: 'runPHP',
   *         code: '<?php update_option("my_custom_option", "value"); ?>'
   *     });
   *     return steps;
   * });
   */
  return (0,external_wp_hooks_.applyFilters)('aether.blueprint.steps', steps, config);
}

/**
 * Build complete blueprint JSON object.
 *
 * @param {Array} steps Blueprint steps array.
 * @return {Object} Complete blueprint JSON.
 */
function buildBlueprintJson(steps) {
  const blueprint = {
    $schema: 'https://playground.wordpress.net/blueprint-schema.json',
    landingPage: '/wp-login.php',
    preferredVersions: {
      php: '8.4',
      wp: 'latest'
    },
    features: {
      networking: true
    },
    steps
  };

  /**
   * Filter complete blueprint JSON object.
   *
   * Allows modification of the final blueprint configuration.
   *
   * @param {Object} blueprint Complete blueprint JSON object.
   * @param {Array}  steps     Blueprint steps array.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.blueprint.json', 'my-plugin', (blueprint, steps) => {
   *     // Customize landing page
   *     blueprint.landingPage = '/wp-admin/';
   *
   *     // Change PHP version
   *     blueprint.preferredVersions.php = '8.3';
   *
   *     // Add login credentials
   *     blueprint.login = {
   *         username: 'admin',
   *         password: 'password'
   *     };
   *
   *     return blueprint;
   * });
   */
  return (0,external_wp_hooks_.applyFilters)('aether.blueprint.json', blueprint, steps);
}
;// ./assets/src/publish/hooks/useBlueprintGenerator.js
/**
 * Blueprint Generator Hook
 *
 * Generates WordPress Playground blueprint JSON for site deployment.
 * Fetches WordPress.org plugin/theme slugs and constructs blueprint with bundled resources.
 *
 * @package
 */






/**
 * Hook for generating WordPress Playground blueprint JSON.
 *
 * @return {Object} Object with generateBlueprint function.
 */
function useBlueprintGenerator() {
  const assetDiscovery = useAssetDiscovery();
  const generateBlueprint = (0,external_wp_element_namespaceObject.useCallback)(
  /**
   * Generate blueprint JSON.
   *
   * @param {Function} setStatusMessage Optional status message callback.
   * @return {Promise<Object>} Blueprint JSON object.
   */
  async (setStatusMessage = null) => {
    // Fetch WordPress.org plugin/theme slugs and site name using browser-based discovery.
    if (setStatusMessage) {
      setStatusMessage('Detecting WordPress.org plugins and themes…', 'progress', 'detectWporgAssets');
    }
    const assetsResponse = await assetDiscovery.getBlueprintAssets();
    let {
      plugins: wporgPlugins,
      themes: wporgThemes
    } = assetsResponse;

    /**
     * Filter discovered WordPress.org assets.
     *
     * Allows modification of detected plugins and themes before blueprint generation.
     *
     * @param {Object}        assets         Discovered assets object.
     * @param {Array<string>} assets.plugins WordPress.org plugin slugs.
     * @param {Array<string>} assets.themes  WordPress.org theme slugs.
     * @param {Object}        assetsResponse Full asset discovery response.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.blueprint.assets', 'my-plugin', (assets) => {
     *     // Exclude specific plugins
     *     assets.plugins = assets.plugins.filter(slug => slug !== 'unwanted-plugin');
     *
     *     // Add additional plugins
     *     assets.plugins.push('my-required-plugin');
     *
     *     return assets;
     * });
     */
    const filteredAssets = (0,external_wp_hooks_.applyFilters)('aether.blueprint.assets', {
      plugins: wporgPlugins,
      themes: wporgThemes
    }, assetsResponse);
    wporgPlugins = filteredAssets.plugins || [];
    wporgThemes = filteredAssets.themes || [];

    // Start configuring Playground settings
    if (setStatusMessage) {
      setStatusMessage('Configuring WordPress Playground settings…', 'progress', 'configurePlayground');
    }

    // Build blueprint steps array with bundled wp-content resources.
    const steps = buildBlueprintSteps({
      wporgPlugins,
      wporgThemes
    });

    // Construct blueprint JSON.
    let blueprint = buildBlueprintJson(steps);
    if (setStatusMessage) {
      setStatusMessage(`Blueprint generated: ${steps.length} total steps`, 'success', 'generateBlueprint');
      // Update detection message to success
      setStatusMessage('Detected WordPress.org plugins and themes', 'success', 'detectWporgAssets');
      // Update configuration message to success
      setStatusMessage('Configured WordPress Playground settings', 'success', 'configurePlayground');
      // Update plugin/theme messages to success
      // Keep original message text, just update type to success
      if (wporgPlugins.length > 0) {
        const pluginNames = wporgPlugins.join(', ');
        setStatusMessage(`Adding ${wporgPlugins.length} WordPress.org plugin${wporgPlugins.length !== 1 ? 's' : ''} to blueprint`, 'success', 'addPluginsToBlueprint');
        setStatusMessage(`Plugins: ${pluginNames}`, 'success', 'pluginsList');
      }
      if (wporgThemes.length > 0) {
        const themeNames = wporgThemes.join(', ');
        setStatusMessage(`Adding ${wporgThemes.length} WordPress.org theme${wporgThemes.length !== 1 ? 's' : ''} to blueprint`, 'success', 'addThemesToBlueprint');
        setStatusMessage(`Themes: ${themeNames}`, 'success', 'themesList');
      }
    }

    /**
     * Filter final generated blueprint.
     *
     * Allows final modification of blueprint before it's used for deployment.
     *
     * @param {Object}        blueprint    Complete blueprint JSON object.
     * @param {Array<string>} wporgPlugins WordPress.org plugin slugs.
     * @param {Array<string>} wporgThemes  WordPress.org theme slugs.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.blueprint.generated', 'my-plugin', (blueprint) => {
     *     // Add custom metadata
     *     blueprint.description = 'My custom WordPress site';
     *
     *     return blueprint;
     * });
     */
    blueprint = (0,external_wp_hooks_.applyFilters)('aether.blueprint.generated', blueprint, wporgPlugins, wporgThemes);
    return blueprint;
  }, [assetDiscovery]);
  return {
    generateBlueprint
  };
}
;// ./assets/src/contexts/ConfigContext.js
/**
 * Config Context
 *
 * Centralized configuration management using React Context API.
 * Provides global config state with caching, optimistic updates, and invalidation.
 *
 * @package
 */




/**
 * Config Context
 *
 * @type {Object}
 */

const ConfigContext = (0,external_wp_element_namespaceObject.createContext)({
  config: {},
  loading: true,
  error: null,
  refetch: () => {},
  updateConfig: () => {},
  invalidateCache: () => {}
});

/**
 * Cache TTL in milliseconds (5 minutes)
 *
 * @type {number}
 */
const CACHE_TTL = (/* unused pure expression or super */ null && (5 * 60 * 1000));

/**
 * Config Provider Component
 *
 * Wraps the application to provide global config state.
 * Features:
 * - Single API fetch shared across all consumers
 * - Cache with 5-minute TTL
 * - Optimistic updates
 * - Manual cache invalidation
 * - Error handling with retry
 * - Loading state management
 *
 * @param {Object}      props          Component props
 * @param {JSX.Element} props.children Child components
 * @return {JSX.Element} Provider component
 */
function ConfigProvider({
  children
}) {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheTimestampRef = useRef(null);
  const fetchInProgressRef = useRef(false);

  /**
   * Check if cache is valid
   *
   * @return {boolean} True if cache is still valid
   */
  const isCacheValid = useCallback(() => {
    if (!cacheTimestampRef.current) {
      return false;
    }
    const now = Date.now();
    const age = now - cacheTimestampRef.current;
    return age < CACHE_TTL;
  }, []);

  /**
   * Fetch configuration from API
   *
   * @param {boolean} force Force fetch even if cache is valid
   * @return {Promise<Object|null>} Config object or null on error
   */
  const fetchConfig = useCallback(async (force = false) => {
    // Return cached config if valid and not forcing
    if (!force && isCacheValid()) {
      return config;
    }

    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      return null;
    }
    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch({
        path: '/aether/site-exporter/config'
      });
      if (response.success) {
        const newConfig = {
          playgroundUrl: response.playgroundUrl || '',
          publicUrl: response.publicUrl || '',
          adminUrl: response.adminUrl || '',
          ...response.config // Include any additional config fields
        };
        setConfig(newConfig);
        cacheTimestampRef.current = Date.now();
        setLoading(false);
        fetchInProgressRef.current = false;
        return newConfig;
      }
      throw new Error('Config fetch failed: response.success is false');
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch configuration';
      setError(errorMessage);
      setLoading(false);
      fetchInProgressRef.current = false;
      return null;
    }
  }, [config, isCacheValid]);

  /**
   * Refetch configuration
   *
   * Forces a fresh fetch regardless of cache status.
   *
   * @return {Promise<void>}
   */
  const refetch = useCallback(async () => {
    await fetchConfig(true);
  }, [fetchConfig]);

  /**
   * Update config optimistically
   *
   * Updates config immediately in state without waiting for API.
   * Useful for UI responsiveness.
   *
   * @param {Object} updates Config updates to apply
   */
  const updateConfig = useCallback(updates => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...updates
    }));
    // Invalidate cache so next fetch gets fresh data
    cacheTimestampRef.current = null;
  }, []);

  /**
   * Invalidate cache
   *
   * Clears the cached config timestamp, forcing a fresh fetch on next access.
   */
  const invalidateCache = useCallback(() => {
    cacheTimestampRef.current = null;
  }, []);

  // Fetch config on mount
  useEffect(() => {
    let isMounted = true;
    async function initialFetch() {
      await fetchConfig();
    }
    if (isMounted) {
      initialFetch();
    }
    return () => {
      isMounted = false;
    };
  }, [fetchConfig]);

  // Provide context value
  const value = useMemo(() => ({
    config,
    loading,
    error,
    refetch,
    updateConfig,
    invalidateCache
  }), [config, loading, error, refetch, updateConfig, invalidateCache]);
  return /*#__PURE__*/_jsx(ConfigContext.Provider, {
    value: value,
    children: children
  });
}
;// ./assets/src/hooks/useConfigContext.js
/**
 * useConfigContext Hook
 *
 * Hook to consume the ConfigContext.
 * Provides access to global config state and config operations.
 *
 * @package
 */




/**
 * Hook to access config context
 *
 * Must be used within a ConfigProvider.
 *
 * @throws {Error} If used outside ConfigProvider
 * @return {Object} Config context value
 * @property {Object}   config          - Configuration object
 * @property {boolean}  loading         - Loading state
 * @property {string}   error           - Error message (null if no error)
 * @property {Function} refetch         - Force refetch config
 * @property {Function} updateConfig    - Update config optimistically
 * @property {Function} invalidateCache - Invalidate cache
 *
 * @example
 * function MyComponent() {
 *     const { config, loading, error, refetch } = useConfigContext();
 *
 *     if (loading) return <Spinner />;
 *     if (error) return <Error message={error} onRetry={refetch} />;
 *
 *     return <div>Playground URL: {config.playgroundUrl}</div>;
 * }
 *
 * @example
 * // Optimistic update
 * function SettingsForm() {
 *     const { config, updateConfig } = useConfigContext();
 *
 *     const handleChange = (newUrl) => {
 *         // Update UI immediately
 *         updateConfig({ publicUrl: newUrl });
 *         // Then save to API
 *         saveToAPI(newUrl);
 *     };
 * }
 */
function useConfigContext() {
  const context = (0,external_wp_element_namespaceObject.useContext)(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  return context;
}
/* harmony default export */ const hooks_useConfigContext = ((/* unused pure expression or super */ null && (useConfigContext)));
;// ./assets/src/hooks/useConfig.js
/**
 * useConfig Hook
 *
 * Fetches configuration values from ConfigContext.
 * Replaces values previously localized via wp_localize_script.
 *
 * Now uses ConfigContext for centralized state management.
 * Maintains backward compatibility with previous API.
 *
 * @package
 */



/**
 * Hook to fetch and cache configuration values.
 *
 * This hook now consumes ConfigContext instead of making its own API call.
 * Multiple components using this hook will share the same config state.
 *
 * @return {Object} Configuration object with loading state and config values
 * @property {boolean} loading       - Loading state
 * @property {string}  playgroundUrl - Playground URL
 * @property {string}  publicUrl     - Public URL
 * @property {string}  adminUrl      - Admin URL
 */
function useConfig() {
  const {
    config,
    loading
  } = useConfigContext();

  // Return in the same format as before for backward compatibility
  return {
    loading,
    playgroundUrl: config.playgroundUrl || '',
    publicUrl: config.publicUrl || '',
    adminUrl: config.adminUrl || '',
    ...config // Include any additional config fields
  };
}
;// ./assets/src/publish/utils/steps.js
/**
 * Publish Step Definitions
 *
 * Single source of truth for all publish workflow steps.
 * Defines step order, metadata, phases, and messages.
 *
 * @package
 */


const steps_PUBLISH_STEPS = [{
  id: 'discoverAssets',
  label: (0,external_wp_i18n_namespaceObject.__)('Discover Assets', 'aether-site-exporter'),
  supportsProgress: false,
  phase: 'discover',
  waitingMessage: (0,external_wp_i18n_namespaceObject.__)('Discovering plugins and themes…', 'aether-site-exporter'),
  completionMessage: (0,external_wp_i18n_namespaceObject.__)('Assets discovered successfully', 'aether-site-exporter')
}, {
  id: 'getStaticSiteUrls',
  label: (0,external_wp_i18n_namespaceObject.__)('Get Static Site URLs', 'aether-site-exporter'),
  supportsProgress: false,
  phase: 'prepare',
  waitingMessage: (0,external_wp_i18n_namespaceObject.__)('Discovering URLs for static site…', 'aether-site-exporter'),
  completionMessage: (0,external_wp_i18n_namespaceObject.__)('URLs discovered successfully', 'aether-site-exporter')
}, {
  id: 'generateBlueprint',
  label: (0,external_wp_i18n_namespaceObject.__)('Generate Blueprint', 'aether-site-exporter'),
  supportsProgress: false,
  phase: 'generate',
  waitingMessage: (0,external_wp_i18n_namespaceObject.__)('Generating blueprint…', 'aether-site-exporter'),
  completionMessage: (0,external_wp_i18n_namespaceObject.__)('Blueprint generated successfully', 'aether-site-exporter')
}, {
  id: 'createSiteArchive',
  label: (0,external_wp_i18n_namespaceObject.__)('Create Site Archive', 'aether-site-exporter'),
  supportsProgress: true,
  phase: 'generate',
  waitingMessage: (0,external_wp_i18n_namespaceObject.__)('Creating administration archive…', 'aether-site-exporter'),
  completionMessage: (0,external_wp_i18n_namespaceObject.__)('Administration archive created successfully', 'aether')
}, {
  id: 'uploadStaticSiteFiles',
  label: (0,external_wp_i18n_namespaceObject.__)('Upload Static Site Files', 'aether-site-exporter'),
  supportsProgress: true,
  phase: 'upload',
  waitingMessage: (0,external_wp_i18n_namespaceObject.__)('Uploading static site files…', 'aether-site-exporter'),
  completionMessage: (0,external_wp_i18n_namespaceObject.__)('Static site files uploaded successfully', 'aether')
}, {
  id: 'uploadSiteArchive',
  label: (0,external_wp_i18n_namespaceObject.__)('Upload Site Archive', 'aether-site-exporter'),
  supportsProgress: true,
  phase: 'upload',
  waitingMessage: (0,external_wp_i18n_namespaceObject.__)('Uploading site archive…', 'aether-site-exporter'),
  completionMessage: (0,external_wp_i18n_namespaceObject.__)('Site archive uploaded successfully', 'aether-site-exporter')
}];

/**
 * Get step definition by ID.
 *
 * @param {string} stepId Step identifier.
 * @return {Object|null} Step definition or null if not found.
 */
function getStep(stepId) {
  return steps_PUBLISH_STEPS.find(step => step.id === stepId) || null;
}

/**
 * Get the next step ID in the workflow.
 *
 * @param {string} currentStepId Current step identifier.
 * @return {string|null} Next step ID or null if this is the final step.
 */
function steps_getNextStep(currentStepId) {
  const currentIndex = steps_PUBLISH_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex === steps_PUBLISH_STEPS.length - 1) {
    return null;
  }
  return steps_PUBLISH_STEPS[currentIndex + 1].id;
}

/**
 * Get the completion message for a step.
 *
 * @param {string} stepId Step identifier.
 * @return {string|null} Completion message or null if not defined.
 */
function getCompletionMessage(stepId) {
  const step = getStep(stepId);
  return step?.completionMessage || null;
}

/**
 * Get the waiting message for a step.
 *
 * @param {string} stepId Step identifier.
 * @return {string|null} Waiting message or null if not defined.
 */
function getWaitingMessage(stepId) {
  const step = getStep(stepId);
  return step?.waitingMessage || null;
}

/**
 * Get the label for a step.
 *
 * @param {string} stepId Step identifier.
 * @return {string|null} Step label or null if not found.
 */
function getLabel(stepId) {
  const step = getStep(stepId);
  return step?.label || null;
}

/**
 * Check if a step supports progress reporting.
 *
 * @param {string} stepId Step identifier.
 * @return {boolean} True if step supports progress.
 */
function supportsProgress(stepId) {
  const step = getStep(stepId);
  return step?.supportsProgress || false;
}

/**
 * Check if a step requires browser upload.
 *
 * @param {string} stepId Step identifier.
 * @return {boolean} True if step requires browser upload.
 */
function requiresBrowserUpload(stepId) {
  const step = getStep(stepId);
  return step?.requiresBrowserUpload || false;
}
;// ./assets/src/utils/constants.js
/**
 * Application Constants
 *
 * Centralized constants to avoid magic numbers and strings throughout the codebase.
 *
 * @package
 */

/**
 * Success message display duration (milliseconds).
 */
const SUCCESS_MESSAGE_DURATION_MS = 3000;

/**
 * Short delay for async operations (milliseconds).
 * Used to allow state updates to propagate before continuing.
 */
const SHORT_DELAY_MS = 100;

/**
 * Maximum progress percentage.
 */
const MAX_PROGRESS = 100;
;// ./assets/src/publish/steps/discoverAssetsStep.js
/**
 * Discover Assets Step
 *
 * Discovers custom plugins and themes that are not from WordPress.org.
 * These assets need to be included in wp-content.zip.
 *
 * @package
 */

/**
 * Discover assets step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered assets.
 */
async function discoverAssetsHandler(context) {
  const {
    api,
    setStatusMessage
  } = context;
  setStatusMessage('Discovering plugins and themes…', 'progress', 'discoverAssets');

  // Call client-side asset discovery
  const discoveryResponse = await api.discoverAssets();
  if (!discoveryResponse.success) {
    throw new Error(discoveryResponse.message || 'Failed to discover assets');
  }
  const assets = discoveryResponse.assets || [];
  const plugins = assets.filter(a => a.type === 'plugin');
  const themes = assets.filter(a => a.type === 'theme');

  // Build success message
  let message;
  if (assets.length === 0) {
    message = 'Discovered 0 active custom plugins/themes';
  } else {
    const parts = [];
    if (plugins.length > 0) {
      const pluginText = plugins.length === 1 ? `1 active custom plugin (${plugins[0].slug})` : `${plugins.length} active custom plugins (${plugins.map(p => p.slug).join(', ')})`;
      parts.push(pluginText);
    }
    if (themes.length > 0) {
      const themeText = themes.length === 1 ? `1 active custom theme (${themes[0].slug})` : `${themes.length} active custom themes (${themes.map(t => t.slug).join(', ')})`;
      parts.push(themeText);
    }
    message = `Discovered ${parts.join(' and ')}. These will be included in the blueprint bundle.`;
  }
  setStatusMessage(message, 'success', 'discoverAssets');

  // Return data to merge into job status
  return {
    discoveredAssets: assets
  };
}
;// ./assets/src/publish/steps/getStaticSiteUrlsStep.js
/**
 * Get Static Site URLs Step
 *
 * Discovers all URLs that need to be converted to static HTML.
 * Uses WordPress queries to find posts, pages, archives, etc.
 *
 * @package
 */



/**
 * Get static site URLs step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered URLs.
 */
async function getStaticSiteUrlsHandler(context) {
  const {
    setStatusMessage
  } = context;
  setStatusMessage('Discovering URLs for static site…', 'progress', 'getStaticSiteUrls');

  // Call REST endpoint to discover URLs (handled by URLDiscoveryService.php)
  const urlsResponse = await utils_api({
    path: '/aether/site-exporter/publish/steps/getStaticSiteUrls'
  });
  if (!urlsResponse.success || !urlsResponse.urls) {
    throw new Error(urlsResponse.message || 'Failed to discover URLs');
  }
  const urls = urlsResponse.urls;
  const staticSiteUrl = urlsResponse.staticSiteUrl || null;
  setStatusMessage(`Discovered ${urls.length} URLs for static site`, 'success', 'getStaticSiteUrls');
  return {
    urls,
    staticSiteUrl,
    urlsCount: urls.length
  };
}
;// ./assets/src/publish/steps/generateBlueprintStep.js
/**
 * Generate Blueprint Step
 *
 * Creates WordPress Playground blueprint-bundle.zip.
 * Bundle contains blueprint.json + wp-content.zip.
 *
 * @package
 */



/**
 * Generate blueprint step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Function} context.generateBlueprintJson Blueprint generator function.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @param {string}   context.zipPath               Path to wp-content.zip from createSiteArchive step.
 * @param {string}   context.zipUrl                URL to wp-content.zip from createSiteArchive step.
 * @param {string}   context.zipSize               Size of wp-content.zip from createSiteArchive step.
 * @return {Promise<Object>} Step result with blueprint bundle data.
 */
async function generateBlueprintHandler(context) {
  const {
    generateBlueprintJson,
    setStatusMessage,
    zipPath,
    zipUrl,
    zipSize
  } = context;
  setStatusMessage('Generating the blueprint file', 'progress', 'generateBlueprint');

  // Generate blueprint JSON using React hook.
  const blueprintData = await generateBlueprintJson(setStatusMessage);
  setStatusMessage('Creating blueprint bundle', 'progress', 'generateBlueprint');

  // Get archive result from previous step (createSiteArchive).
  // The workflow executor merges step results into the context, so zipPath is available directly.
  if (!zipPath) {
    throw new Error('Archive result not found. createSiteArchive must run before generateBlueprint.');
  }

  // Build archiveResult object for REST endpoint
  const archiveResult = {
    zipPath,
    zipUrl,
    zipSize
  };

  // Call REST endpoint to generate blueprint-bundle.zip.
  const response = await utils_api({
    path: '/aether/site-exporter/publish/generateBlueprintBundle',
    method: 'POST',
    data: {
      blueprintData,
      archiveResult
    }
  });
  if (!response.success) {
    throw new Error(response.message || 'Failed to generate blueprint bundle');
  }
  setStatusMessage('Generated the blueprint bundle', 'success', 'generateBlueprint');
  return {
    blueprintData,
    blueprintBundle: response.data
  };
}
;// ./assets/src/utils/archiveProgressCache.js
/**
 * Archive Progress Cache - Persistent cache for archive creation progress
 *
 * Stores archive creation progress state in IndexedDB for persistence across
 * page refreshes. Progress is managed entirely in the frontend (React state + IndexedDB).
 *
 * Features:
 * - Persistent storage across browser sessions
 * - 1-hour cache expiration (archive progress is temporary)
 * - Progress ID-based tracking
 * - Stores zip path, phase status, and overall progress
 * - Works in WordPress Playground WASM environment
 *
 * @package
 */



/**
 * Cache configuration
 */
const ARCHIVE_PROGRESS_CONFIG = {
  dbName: 'aether-archive-progress',
  version: 1,
  stores: {
    progress: {
      keyPath: 'progressId',
      indexes: [{
        name: 'timestamp',
        keyPath: 'timestamp',
        unique: false
      }]
    }
  }
};

/**
 * Cache expiration time (1 hour)
 * Archive progress is temporary and should be cleaned up after completion
 */
const archiveProgressCache_CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Archive Progress Cache Manager
 *
 * Provides persistent caching of archive creation progress
 */
class ArchiveProgressCache {
  /**
   * Constructor
   */
  constructor() {
    this.store = new utils_indexedDB('progress', ARCHIVE_PROGRESS_CONFIG);
    this.cleanupPromise = null; // Track cleanup to avoid concurrent runs
  }

  /**
   * Get cached progress for a progress ID
   *
   * @param {string} progressId - Progress ID
   * @return {Promise<Object|null>} Cached progress or null if not found/expired
   */
  async get(progressId) {
    try {
      const cached = await this.store.get(progressId);
      if (!cached) {
        return null;
      }

      // Check if cache entry is expired
      const age = Date.now() - cached.timestamp;
      if (age > archiveProgressCache_CACHE_EXPIRATION_MS) {
        await this.store.delete(progressId);
        return null;
      }
      return cached.progress || null;
    } catch (error) {
      console.error(`[ArchiveProgressCache] Error getting progress for ${progressId}:`, error);
      return null;
    }
  }

  /**
   * Set cached progress
   *
   * @param {string} progressId - Progress ID
   * @param {Object} progress   - Progress state object
   * @return {Promise<boolean>} True if successfully cached
   */
  async set(progressId, progress) {
    try {
      await this.store.set(progressId, {
        progress
      }, {
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error(`[ArchiveProgressCache] Error setting progress for ${progressId}:`, error);
      return false;
    }
  }

  /**
   * Update cached progress (merges with existing)
   *
   * Deep merges nested objects like 'phases' to preserve all phase data.
   *
   * @param {string} progressId - Progress ID
   * @param {Object} updates    - Progress updates to merge
   * @return {Promise<boolean>} True if successfully updated
   */
  async update(progressId, updates) {
    try {
      const existing = await this.get(progressId);
      const merged = existing ? this.deepMerge(existing, updates) : updates;
      return this.set(progressId, merged);
    } catch (error) {
      console.error(`[ArchiveProgressCache] Error updating progress for ${progressId}:`, error);
      return false;
    }
  }

  /**
   * Deep merge two objects
   *
   * @param {Object} target - Target object to merge into
   * @param {Object} source - Source object to merge from
   * @return {Object} Merged object
   */
  deepMerge(target, source) {
    const result = {
      ...target
    };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        // Deep merge nested objects (like 'phases')
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        // Replace primitives, arrays, or non-object values
        result[key] = source[key];
      }
    }
    return result;
  }

  /**
   * Clear cached progress
   *
   * @param {string} progressId - Progress ID
   * @return {Promise<boolean>} True if successfully cleared
   */
  async clear(progressId) {
    try {
      await this.store.delete(progressId);
      return true;
    } catch (error) {
      console.error(`[ArchiveProgressCache] Error clearing progress for ${progressId}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired cache entries
   *
   * Runs automatically on initialization, removes entries older than 1 hour
   *
   * @return {Promise<number>} Number of entries cleaned up
   */
  async cleanup() {
    // Prevent concurrent cleanup runs
    if (this.cleanupPromise) {
      return this.cleanupPromise;
    }
    this.cleanupPromise = (async () => {
      try {
        const deleted = await this.store.deleteOlderThan(archiveProgressCache_CACHE_EXPIRATION_MS);
        if (deleted > 0) {
          console.log(`[ArchiveProgressCache] Cleaned up ${deleted} expired entries`);
        }
        return deleted;
      } catch (error) {
        console.error('[ArchiveProgressCache] Error during cleanup:', error);
        return 0;
      } finally {
        this.cleanupPromise = null;
      }
    })();
    return this.cleanupPromise;
  }

  /**
   * Clear all cached data
   *
   * @return {Promise<boolean>} True if successful
   */
  async clearAll() {
    return this.store.clear();
  }
}

// Create singleton instance
let archiveProgressCache_cacheInstance = null;

/**
 * Get archive progress cache instance (singleton)
 *
 * @return {ArchiveProgressCache} Cache instance
 */
function getArchiveProgressCache() {
  if (!archiveProgressCache_cacheInstance) {
    archiveProgressCache_cacheInstance = new ArchiveProgressCache();

    // Run cleanup on first initialization
    archiveProgressCache_cacheInstance.cleanup().catch(error => {
      console.error('[ArchiveProgressCache] Initial cleanup failed:', error);
    });
  }
  return archiveProgressCache_cacheInstance;
}
/* harmony default export */ const archiveProgressCache = ((/* unused pure expression or super */ null && (getArchiveProgressCache)));
;// ./assets/src/publish/steps/createSiteArchiveStep.js
/**
 * Create Site Archive Step
 *
 * Creates wp-content.zip containing database + custom assets.
 * This is the LARGEST file in the publish (potentially 100s of MB).
 * Archive format matches WordPress Playground's expected structure.
 *
 * Modular approach: Breaks down zip creation into separate API requests
 * to avoid timeouts and provide granular progress feedback.
 *
 * @package
 */




/**
 * Create site archive step handler (modular approach).
 *
 * @param {Object}   context                  Execution context.
 * @param {Array}    context.discoveredAssets Custom assets from discoverAssets step.
 * @param {Function} context.setStatusMessage Status message updater.
 * @param {Function} context.setStepProgress  Step progress updater.
 * @return {Promise<Object>} Step result.
 */
async function createSiteArchiveHandler(context) {
  const {
    discoveredAssets,
    setStatusMessage,
    setStepProgress
  } = context;
  const progressCache = getArchiveProgressCache();
  setStatusMessage('Initializing archive...', 'progress', 'createSiteArchive');

  // Prepare custom assets list for API
  const customAssetSlugs = discoveredAssets ? discoveredAssets.map(asset => asset.slug) : undefined;

  // Step 1: Initialize archive
  const initResponse = await utils_api({
    path: '/aether/site-exporter/publish/createArchive/init',
    method: 'POST',
    data: customAssetSlugs ? {
      custom_assets: customAssetSlugs
    } : undefined
  });
  if (!initResponse.success) {
    throw new Error(initResponse.message || 'Failed to initialize archive');
  }
  const {
    zipPath,
    progressId
  } = initResponse.data;
  const progress = initResponse.progress || {};

  // Store initial progress in IndexedDB
  await progressCache.set(progressId, progress);

  // Step 2: Add database
  setStatusMessage('Adding database...', 'progress', 'createSiteArchive');
  const dbResponse = await utils_api({
    path: '/aether/site-exporter/publish/createArchive/phase/database',
    method: 'POST',
    data: {
      zipPath,
      progress
    }
  });
  if (!dbResponse.success) {
    await progressCache.clear(progressId);
    throw new Error(dbResponse.message || 'Failed to add database to archive');
  }
  let currentProgress = dbResponse.progress || progress;
  await progressCache.update(progressId, currentProgress);
  setStepProgress('createSiteArchive', currentProgress.overall || 0);

  // Step 3: Add uploads in batches
  const uploadsBatchesResponse = await utils_api({
    path: '/aether/site-exporter/publish/createArchive/phase/uploads/batches',
    method: 'GET'
  });
  if (!uploadsBatchesResponse.success) {
    await progressCache.clear(progressId);
    throw new Error(uploadsBatchesResponse.message || 'Failed to get uploads batches list');
  }
  const batches = uploadsBatchesResponse.data.batches || 0;
  if (batches > 0) {
    for (let i = 0; i < batches; i++) {
      setStatusMessage(`Adding uploads (batch ${i + 1}/${batches})...`, 'progress', 'createSiteArchive');
      const batchResponse = await utils_api({
        path: '/aether/site-exporter/publish/createArchive/phase/uploads/batch',
        method: 'POST',
        data: {
          zipPath,
          batch: i,
          progress: currentProgress
        }
      });
      if (!batchResponse.success) {
        await progressCache.clear(progressId);
        throw new Error(batchResponse.message || `Failed to add uploads batch ${i + 1}`);
      }
      currentProgress = batchResponse.progress || currentProgress;
      await progressCache.update(progressId, currentProgress);
      setStepProgress('createSiteArchive', currentProgress.overall || 0);
    }
  } else {
    setStatusMessage('No uploads to add', 'progress', 'createSiteArchive');
  }

  // Step 4: Add plugins one by one
  const pluginsListPath = '/aether/site-exporter/publish/createArchive/phase/plugins/list' + (customAssetSlugs ? `?custom_assets=${encodeURIComponent(JSON.stringify(customAssetSlugs))}` : '');
  const pluginsListResponse = await utils_api({
    path: pluginsListPath,
    method: 'GET'
  });
  if (!pluginsListResponse.success) {
    await progressCache.clear(progressId);
    throw new Error(pluginsListResponse.message || 'Failed to get plugins list');
  }
  const plugins = pluginsListResponse.data.plugins || [];
  const totalPlugins = plugins.length;
  if (totalPlugins > 0) {
    for (let i = 0; i < plugins.length; i++) {
      const pluginSlug = plugins[i];
      setStatusMessage(`Adding plugin: ${pluginSlug} (${i + 1}/${totalPlugins})...`, 'progress', 'createSiteArchive');
      const pluginResponse = await utils_api({
        path: '/aether/site-exporter/publish/createArchive/phase/plugins/add',
        method: 'POST',
        data: {
          zipPath,
          slug: pluginSlug,
          progress: currentProgress
        }
      });
      if (!pluginResponse.success) {
        await progressCache.clear(progressId);
        throw new Error(pluginResponse.message || `Failed to add plugin: ${pluginSlug}`);
      }
      currentProgress = pluginResponse.progress || currentProgress;
      await progressCache.update(progressId, currentProgress);
      setStepProgress('createSiteArchive', currentProgress.overall || 0);
    }
  } else {
    setStatusMessage('No plugins to add', 'progress', 'createSiteArchive');
  }

  // Step 5: Add themes one by one
  const themesListPath = '/aether/site-exporter/publish/createArchive/phase/themes/list' + (customAssetSlugs ? `?custom_assets=${encodeURIComponent(JSON.stringify(customAssetSlugs))}` : '');
  const themesListResponse = await utils_api({
    path: themesListPath,
    method: 'GET'
  });
  if (!themesListResponse.success) {
    await progressCache.clear(progressId);
    throw new Error(themesListResponse.message || 'Failed to get themes list');
  }
  const themes = themesListResponse.data.themes || [];
  const totalThemes = themes.length;
  if (totalThemes > 0) {
    for (let i = 0; i < themes.length; i++) {
      const themeSlug = themes[i];
      setStatusMessage(`Adding theme: ${themeSlug} (${i + 1}/${totalThemes})...`, 'progress', 'createSiteArchive');
      const themeResponse = await utils_api({
        path: '/aether/site-exporter/publish/createArchive/phase/themes/add',
        method: 'POST',
        data: {
          zipPath,
          slug: themeSlug,
          progress: currentProgress
        }
      });
      if (!themeResponse.success) {
        await progressCache.clear(progressId);
        throw new Error(themeResponse.message || `Failed to add theme: ${themeSlug}`);
      }
      currentProgress = themeResponse.progress || currentProgress;
      await progressCache.update(progressId, currentProgress);
      setStepProgress('createSiteArchive', currentProgress.overall || 0);
    }
  } else {
    setStatusMessage('No themes to add', 'progress', 'createSiteArchive');
  }

  // Step 6: Add mu-plugins in batches
  const muPluginsBatchesResponse = await utils_api({
    path: '/aether/site-exporter/publish/createArchive/phase/mu-plugins/batches',
    method: 'GET'
  });
  if (!muPluginsBatchesResponse.success) {
    await progressCache.clear(progressId);
    throw new Error(muPluginsBatchesResponse.message || 'Failed to get mu-plugins batches list');
  }
  const muPluginsBatches = muPluginsBatchesResponse.data.batches || 0;
  if (muPluginsBatches > 0) {
    for (let i = 0; i < muPluginsBatches; i++) {
      setStatusMessage(`Adding mu-plugins (batch ${i + 1}/${muPluginsBatches})...`, 'progress', 'createSiteArchive');
      const batchResponse = await utils_api({
        path: '/aether/site-exporter/publish/createArchive/phase/mu-plugins/batch',
        method: 'POST',
        data: {
          zipPath,
          batch: i,
          progress: currentProgress
        }
      });
      if (!batchResponse.success) {
        await progressCache.clear(progressId);
        throw new Error(batchResponse.message || `Failed to add mu-plugins batch ${i + 1}`);
      }
      currentProgress = batchResponse.progress || currentProgress;
      await progressCache.update(progressId, currentProgress);
      setStepProgress('createSiteArchive', currentProgress.overall || 0);
    }
  } else {
    setStatusMessage('No mu-plugins to add', 'progress', 'createSiteArchive');
  }

  // Step 7: Finalize archive
  setStatusMessage('Finalizing archive...', 'progress', 'createSiteArchive');
  const finalizeResponse = await utils_api({
    path: '/aether/site-exporter/publish/createArchive/finalize',
    method: 'POST',
    data: {
      zipPath
    }
  });
  if (!finalizeResponse.success) {
    await progressCache.clear(progressId);
    throw new Error(finalizeResponse.message || 'Failed to finalize archive');
  }

  // Clean up progress cache
  await progressCache.clear(progressId);
  setStepProgress('createSiteArchive', 100);
  setStatusMessage('Zipped the wp-content.zip file', 'success', 'createSiteArchive');
  return finalizeResponse.data || {};
}
;// ./assets/src/publish/steps/uploadStaticSiteFilesStep.js
/**
 * Upload Static Site Files Step
 *
 * This is the MOST COMPLEX step - generates static HTML/CSS/JS and uploads to storage.
 * Handles all URL fetching, asset extraction, URL rewriting, and file uploads.
 *
 * @package
 */



/**
 * Upload static site files step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Function} context.processStaticSiteUrls Static site generator function.
 * @param {Array}    context.staticSiteProviders   Array of provider IDs that support static site deployment.
 * @param {string}   context.providerId            (Legacy) Single provider ID for backwards compatibility.
 * @param {Object}   context.currentStatus         Current job status.
 * @param {string}   context.siteUrl               WordPress site URL.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @param {Function} context.removeMessage         Message remover.
 * @return {Promise<Object>} Step result with uploaded files.
 */
async function uploadStaticSiteFilesHandler(context) {
  const {
    processStaticSiteUrls,
    urls,
    // From getStaticSiteUrlsHandler (workflow) or currentStatus (tests)
    staticSiteUrl,
    // From getStaticSiteUrlsHandler (workflow) or currentStatus (tests)
    blueprintData,
    // From generateBlueprintHandler (workflow) or currentStatus (tests)
    currentStatus,
    // Legacy support for tests
    siteUrl,
    staticSiteProviders = [],
    // NEW: Array of provider IDs
    providerId,
    // LEGACY: Keep for backwards compat
    setStatusMessage,
    removeMessage
  } = context;

  // Support both new format (urls directly in context) and old format (currentStatus.urls for tests)
  const urlsArray = urls || currentStatus?.urls;
  const siteUrlForStatic = staticSiteUrl !== undefined ? staticSiteUrl : currentStatus?.staticSiteUrl ?? null;
  const blueprintDataForStatic = blueprintData !== undefined ? blueprintData : currentStatus?.blueprintData ?? null;
  if (!urlsArray || !Array.isArray(urlsArray)) {
    throw new Error('URLs not found. Please run getStaticSiteUrls first.');
  }

  // Use staticSiteProviders if available, fallback to single providerId
  let providers = [];
  if (staticSiteProviders.length > 0) {
    providers = staticSiteProviders;
  } else if (providerId) {
    providers = [providerId];
  }
  if (providers.length === 0) {
    setStatusMessage('No providers enabled for static site deployment', 'warning', 'uploadStaticSiteFiles');
    return {
      skipped: true,
      reason: 'no_providers'
    };
  }
  setStatusMessage(`Uploading static site to ${providers.length} provider(s)…`, 'progress', 'uploadStaticSiteFiles');

  /**
   * Filter the URLs before processing for static site upload.
   *
   * Allows modification of URLs that will be fetched and uploaded.
   *
   * @param {Array} urls      Array of URL objects to process.
   * @param {Array} providers Array of provider IDs being used for upload.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.upload.urls', 'my-provider', (urls, providers) => {
   *   // Add custom URL
   *   return [...urls, { url: '/custom-page/', type: 'page' }];
   * });
   */
  const filteredUrls = (0,external_wp_hooks_.applyFilters)('aether.upload.urls', urlsArray, providers // Pass array instead of single ID
  );

  // Upload to ALL providers in parallel
  const uploadPromises = providers.map(async providerIdItem => {
    try {
      const result = await processStaticSiteUrls(filteredUrls, siteUrlForStatic, providerIdItem, siteUrl, setStatusMessage, blueprintDataForStatic, removeMessage);
      return {
        providerId: providerIdItem,
        success: true,
        filesUploaded: result.filesUploaded || 0,
        uploadedFiles: result.uploadedFiles || []
      };
    } catch (error) {
      return {
        providerId: providerIdItem,
        success: false,
        error: error.message
      };
    }
  });
  const results = await Promise.allSettled(uploadPromises);

  // Aggregate results
  const successfulUploads = results.filter(r => r.status === 'fulfilled' && r.value.success);
  const failedUploads = results.filter(r => r.status === 'rejected' || r.status === 'fulfilled' && !r.value.success);
  if (successfulUploads.length > 0) {
    const totalFiles = successfulUploads.reduce((sum, r) => sum + (r.value.filesUploaded || 0), 0);
    setStatusMessage(`Uploaded static site to ${successfulUploads.length}/${providers.length} provider(s) (${totalFiles} files)`, failedUploads.length > 0 ? 'warning' : 'success', 'uploadStaticSiteFiles');
  }
  if (failedUploads.length === providers.length) {
    throw new Error('Failed to upload static site to any provider');
  }

  /**
   * Filter the upload result before returning.
   *
   * @param {Object} result    The aggregated upload result object.
   * @param {Array}  providers Array of provider IDs used for upload.
   *
   * @example
   * import { addFilter} from '@wordpress/hooks';
   *
   * addFilter('aether.upload.result', 'my-provider', (result, providers) => {
   *   return {
   *     ...result,
   *     customMetadata: 'added by my provider'
   *   };
   * });
   */
  const filteredResult = (0,external_wp_hooks_.applyFilters)('aether.upload.result', {
    providers,
    results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason),
    successCount: successfulUploads.length,
    failureCount: failedUploads.length,
    // Legacy fields for backwards compatibility
    staticFiles: successfulUploads[0]?.value?.uploadedFiles || [],
    filesUploaded: successfulUploads[0]?.value?.filesUploaded || 0
  }, providers);
  return filteredResult;
}
;// ./assets/src/publish/steps/uploadSiteArchiveStep.js
/**
 * Upload Site Archive Step
 *
 * Uploads wp-content.zip file directly to storage.
 * Handles both Git and storage provider uploads.
 *
 * @package
 */



/**
 * Upload site archive step handler (stateless).
 *
 * @param {Object}   context                          Execution context.
 * @param {Function} context.handleSiteArchiveUpload  Archive upload function.
 * @param {Array}    context.blueprintBundleProviders Array of provider IDs that support blueprint bundle deployment.
 * @param {string}   context.providerId               (Legacy) Single provider ID for backwards compatibility.
 * @param {Function} context.setStatusMessage         Status message updater.
 * @param {Object}   context.blueprintBundle          Blueprint bundle data from generateBlueprint step.
 * @return {Promise<Object>} Step result.
 */
async function uploadSiteArchiveHandler(context) {
  const {
    handleSiteArchiveUpload,
    blueprintBundleProviders = [],
    // NEW: Array of provider IDs
    providerId,
    // LEGACY: Keep for backwards compat
    setStatusMessage
  } = context;

  // Use blueprintBundleProviders if available, fallback to single providerId
  let providers = [];
  if (blueprintBundleProviders.length > 0) {
    providers = blueprintBundleProviders;
  } else if (providerId) {
    providers = [providerId];
  }
  if (providers.length === 0) {
    setStatusMessage('No providers enabled for blueprint bundle', 'warning', 'uploadSiteArchive');
    return {
      skipped: true,
      reason: 'no_providers'
    };
  }
  setStatusMessage(`Uploading blueprint bundle to ${providers.length} provider(s)…`, 'progress', 'uploadSiteArchive');

  // Upload to ALL providers in parallel
  const uploadPromises = providers.map(async providerIdItem => {
    try {
      /**
       * Filter the deployment configuration before archive upload.
       *
       * Allows modification of upload settings, provider ID, or context data.
       *
       * @param {Object} deploymentConfig Configuration object with context data.
       * @param {string} providerId       The provider ID being used.
       *
       * @example
       * import { addFilter } from '@wordpress/hooks';
       *
       * addFilter('aether.deployment.config', 'my-provider', (config, providerId) => {
       *   return {
       *     ...config,
       *     customUploadOptions: {
       *       compression: 'gzip',
       *       cacheControl: 'max-age=3600'
       *     }
       *   };
       * });
       */
      const deploymentConfig = (0,external_wp_hooks_.applyFilters)('aether.deployment.config', {
        ...context,
        providerId: providerIdItem
      }, providerIdItem);

      // Upload blueprint-bundle.zip directly
      // Pass entire context so upload handler has access to blueprintBundle data
      await handleSiteArchiveUpload(providerIdItem, deploymentConfig);
      return {
        providerId: providerIdItem,
        success: true
      };
    } catch (error) {
      return {
        providerId: providerIdItem,
        success: false,
        error: error.message
      };
    }
  });
  const results = await Promise.allSettled(uploadPromises);

  // Aggregate results
  const successfulUploads = results.filter(r => r.status === 'fulfilled' && r.value.success);
  const failedUploads = results.filter(r => r.status === 'rejected' || r.status === 'fulfilled' && !r.value.success);
  if (successfulUploads.length > 0) {
    setStatusMessage(`Uploaded blueprint bundle to ${successfulUploads.length}/${providers.length} provider(s)`, failedUploads.length > 0 ? 'warning' : 'success', 'uploadSiteArchive');
  }
  if (failedUploads.length === providers.length) {
    throw new Error('Failed to upload blueprint bundle to any provider');
  }
  return {
    providers,
    results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason),
    successCount: successfulUploads.length,
    failureCount: failedUploads.length
  };
}
;// ./assets/src/publish/workflows/publishWorkflow.js
/**
 * Publish Workflow Definition
 *
 * Defines the complete publish workflow as a series of sequential phases.
 * Each phase can contain one or more steps that run in parallel.
 *
 * Structure: [[[stepId, progressWeight], ...], ...]
 * - Outer array = sequential phases (run one after another)
 * - Inner array = parallel steps within phase (run simultaneously)
 * - Each step = [stepId, progressWeight] where weight is percentage of total progress
 *
 * Example:
 * [
 *   [['step1', 10]],              // Phase 1: step1 alone (10%)
 *   [['step2', 3]],               // Phase 2: step2 alone (3%)
 *   [['step3', 20], ['step4', 14]], // Phase 3: step3 and step4 in PARALLEL (34% total)
 * ]
 *
 * @package
 */









/**
 * Publish workflow definition.
 *
 * Current workflow is entirely sequential (one step per phase).
 * Future optimization: Move independent steps into same phase for parallel execution.
 *
 * Total progress must equal 100%.
 * Note: Removed offloadMedia step (10%) - redistributed to other steps.
 *
 * IMPORTANT: generateBlueprint must run AFTER createSiteArchive because it needs
 * the archive result (zipPath) to generate the blueprint-bundle.zip.
 */
const PUBLISH_WORKFLOW = [[['discoverAssets', 5]], [['getStaticSiteUrls', 8]], [['createSiteArchive', 20]], [['generateBlueprint', 1]], [['uploadStaticSiteFiles', 50], ['uploadSiteArchive', 16]]];

/**
 * Map step IDs to handler functions.
 *
 * Each handler is an async function that returns a Promise.
 * Handlers receive a context object with all necessary dependencies.
 *
 * Handler signature:
 * async function handler(context): Promise<Object>
 *
 * Context includes:
 * - api: PublishAPI instance
 * - jobId: Current job ID
 * - currentStatus: Current job status
 * - providerId: Storage provider ID
 * - setStatusMessage: Function to update UI status
 * - setOverallProgressValue: Function to update progress bar
 * - setStepProgress: Function to update step progress
 * - ... (other dependencies as needed)
 *
 * Return value:
 * - Object with step-specific data to merge into job status
 * - Or throw Error on failure
 */
const STEP_HANDLERS = {
  discoverAssets: discoverAssetsHandler,
  getStaticSiteUrls: getStaticSiteUrlsHandler,
  generateBlueprint: generateBlueprintHandler,
  createSiteArchive: createSiteArchiveHandler,
  uploadStaticSiteFiles: uploadStaticSiteFilesHandler,
  uploadSiteArchive: uploadSiteArchiveHandler
};

/**
 * Get workflow with filters applied.
 *
 * Allows third-party code to modify the workflow steps via filters.
 *
 * @return {Array} Workflow with filters applied.
 */
function getWorkflow() {
  /**
   * Filter the publish workflow steps.
   *
   * Allows providers to add, remove, or modify workflow steps.
   *
   * @param {Array} workflow The workflow definition.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.publish.workflow.steps', 'my-provider', (workflow) => {
   *   // Add custom step at the end
   *   return [...workflow, [['myCustomStep', 5]]];
   * });
   */
  return applyFilters('aether.publish.workflow.steps', PUBLISH_WORKFLOW);
}

/**
 * Validate workflow definition.
 *
 * Ensures:
 * - All step IDs have handlers
 * - Progress weights sum to 100%
 * - No duplicate step IDs
 *
 * @return {Object} Validation result { isValid, errors }
 */
function validateWorkflow() {
  const errors = [];

  // Flatten workflow to get all steps
  const allSteps = PUBLISH_WORKFLOW.flat(2).filter(item => typeof item === 'string');

  // Check for missing handlers
  allSteps.forEach((stepId, index) => {
    if (index % 2 === 0 && !STEP_HANDLERS[stepId]) {
      errors.push(`Missing handler for step: ${stepId}`);
    }
  });

  // Calculate total progress
  let totalProgress = 0;
  PUBLISH_WORKFLOW.forEach(phase => {
    phase.forEach(([, weight]) => {
      totalProgress += weight;
    });
  });
  if (totalProgress !== 100) {
    errors.push(`Progress weights must sum to 100%, got ${totalProgress}%`);
  }

  // Check for duplicate step IDs
  const stepIds = [];
  PUBLISH_WORKFLOW.forEach(phase => {
    phase.forEach(([stepId]) => {
      if (stepIds.includes(stepId)) {
        errors.push(`Duplicate step ID: ${stepId}`);
      }
      stepIds.push(stepId);
    });
  });
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get step progress weight by step ID.
 *
 * @param {string} stepId Step identifier.
 * @return {number} Progress weight (0-100) or 0 if not found.
 */
function publishWorkflow_getStepWeight(stepId) {
  for (const phase of PUBLISH_WORKFLOW) {
    for (const [id, weight] of phase) {
      if (id === stepId) {
        return weight;
      }
    }
  }
  return 0;
}

/**
 * Get cumulative progress up to (but not including) a step.
 *
 * For parallel steps (within same phase), returns progress BEFORE the phase starts.
 * For sequential steps (each in own phase), returns sum of all previous phases.
 *
 * Example:
 * Phase 1: [['stepA', 10]]           -> stepA: cumulative = 0
 * Phase 2: [['stepB', 20], ['stepC', 5]] -> stepB: cumulative = 10, stepC: cumulative = 10 (parallel!)
 * Phase 3: [['stepD', 15]]           -> stepD: cumulative = 35 (10 + 20 + 5)
 *
 * @param {string} stepId Step identifier.
 * @return {number} Cumulative progress (0-100).
 */
function publishWorkflow_getCumulativeProgress(stepId) {
  let cumulative = 0;
  for (const phase of PUBLISH_WORKFLOW) {
    // Check if stepId is in this phase
    const stepInPhase = phase.some(([id]) => id === stepId);
    if (stepInPhase) {
      // Return progress before this phase (all parallel steps start at same point)
      return cumulative;
    }
    // Add all weights from this phase (sum of parallel steps)
    const phaseWeight = phase.reduce((sum, [, weight]) => sum + weight, 0);
    cumulative += phaseWeight;
  }
  return cumulative;
}

/**
 * Filter workflow based on export types configuration.
 *
 * @deprecated No longer filters workflow - always returns original workflow unchanged.
 * The new architecture uses deployment_types in provider config instead of global export_types.
 * Upload steps automatically skip providers that don't have the deployment type enabled.
 *
 * Kept for backwards compatibility in case external code calls this function.
 *
 * @param {Array} workflow    The workflow (returned unchanged).
 * @param {Array} exportTypes Array of export types (ignored).
 * @return {Array} Original workflow unchanged.
 */
function filterWorkflowByExportTypes(workflow, exportTypes = []) {
  // eslint-disable-next-line no-unused-vars
  const _unused = exportTypes;
  // Simply return the full workflow - no filtering needed
  // Individual steps will check provider deployment_types and handle appropriately
  return workflow;

  /* OLD IMPLEMENTATION - REMOVED
  // Default to both if empty or invalid
  if ( ! Array.isArray( exportTypes ) || exportTypes.length === 0 ) {
  	return workflow;
  }
  	const includeStaticSite = exportTypes.includes( 'static_site' );
  const includeBlueprintBundle = exportTypes.includes( 'blueprint_bundle' );
  	// If both are included, return original workflow
  if ( includeStaticSite && includeBlueprintBundle ) {
  	return workflow;
  }
  	// Map steps to their export type
  const stepExportTypes = {
  	discoverAssets: 'both', // Always needed
  	getStaticSiteUrls: 'static_site',
  	createSiteArchive: 'blueprint_bundle',
  	generateBlueprint: 'blueprint_bundle',
  	uploadStaticSiteFiles: 'static_site',
  	uploadSiteArchive: 'blueprint_bundle',
  };
  	// Filter workflow to remove unwanted steps
  const filteredWorkflow = workflow
  	.map( ( phase ) => {
  		return phase.filter( ( [ stepId ] ) => {
  			const stepType = stepExportTypes[ stepId ];
  			if ( stepType === 'both' ) {
  				return true;
  			}
  			if ( stepType === 'static_site' && includeStaticSite ) {
  				return true;
  			}
  			if (
  				stepType === 'blueprint_bundle' &&
  				includeBlueprintBundle
  			) {
  				return true;
  			}
  			return false;
  		} );
  	} )
  	.filter( ( phase ) => phase.length > 0 ); // Remove empty phases
  	// Calculate total weight of remaining steps
  let totalWeight = 0;
  filteredWorkflow.forEach( ( phase ) => {
  	phase.forEach( ( [ , weight ] ) => {
  		totalWeight += weight;
  	} );
  } );
  	// Redistribute weights to sum to 100%
  if ( totalWeight > 0 && totalWeight !== 100 ) {
  	const scaleFactor = 100 / totalWeight;
  	return filteredWorkflow.map( ( phase ) => {
  		return phase.map( ( [ stepId, weight ] ) => {
  			return [ stepId, Math.round( weight * scaleFactor ) ];
  		} );
  	} );
  }
  	return filteredWorkflow;
  */
}
;// ./assets/src/publish/utils/progressManager.js
/**
 * Progress Manager
 *
 * Dynamically calculates progress based on PUBLISH_WORKFLOW configuration.
 * Automatically adapts to workflow changes without hardcoded values.
 *
 * @package
 */




/**
 * Calculate overall progress percentage based on current step and step progress.
 *
 * Uses PUBLISH_WORKFLOW to dynamically determine:
 * - Cumulative progress before this step (sum of all previous step weights)
 * - Weight of current step (percentage allocated to this step)
 * - Progress within current step (0-100%)
 *
 * Formula: overallProgress = cumulativeProgress + (stepProgress * stepWeight / 100)
 *
 * @param {Object} stepProgress          Step progress information.
 * @param {string} stepProgress.step     Step identifier.
 * @param {number} stepProgress.progress Step progress (0-100).
 * @return {number} Overall progress percentage (0-100).
 */
function progressManager_calculateOverallProgress(stepProgress) {
  const {
    step,
    progress
  } = stepProgress;

  // Get cumulative progress before this step (sum of all previous weights)
  const cumulativeProgress = publishWorkflow_getCumulativeProgress(step);

  // Get weight allocated to this step
  const stepWeight = publishWorkflow_getStepWeight(step);
  if (stepWeight === 0) {
    // Step not found in workflow, return 0
    return 0;
  }

  // Calculate progress within step (0-100), clamped to valid range
  const stepProgressValue = progress !== undefined ? Math.min(MAX_PROGRESS, Math.max(0, progress)) : 0;

  // Calculate overall progress
  // Example: If cumulative is 45% and step weight is 30%, and step is 50% complete:
  // overall = 45 + (50 * 30 / 100) = 45 + 15 = 60%
  const overall = cumulativeProgress + stepProgressValue * stepWeight / MAX_PROGRESS;

  // Ensure progress is between 0-100 and rounded
  return Math.min(MAX_PROGRESS, Math.max(0, Math.round(overall)));
}

/**
 * Get progress weight configuration for a step.
 *
 * Returns an object with start and range for backwards compatibility.
 *
 * @param {string} step Step identifier.
 * @return {Object|null} Progress weight configuration { start, range } or null if step not found.
 */
function getProgressWeight(step) {
  const weight = getStepWeight(step);
  const start = getCumulativeProgress(step);
  if (weight === 0) {
    return null;
  }
  return {
    start,
    range: weight
  };
}
;// ./assets/src/constants/deploymentTypes.js
/**
 * Deployment type constants and labels
 *
 * @package
 */



/**
 * Deployment type identifiers
 */
const DEPLOYMENT_TYPES = {
  STATIC_SITE: 'static_site',
  BLUEPRINT_BUNDLE: 'blueprint_bundle',
  EDGE_FUNCTIONS: 'edge_functions'
};

/**
 * Human-readable labels for deployment types
 */
const DEPLOYMENT_TYPE_LABELS = {
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_namespaceObject.__)('Static Site', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_namespaceObject.__)('Blueprint Bundle', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_namespaceObject.__)('Edge Functions', 'aether-site-exporter')
};

/**
 * Descriptions for deployment types
 */
const DEPLOYMENT_TYPE_DESCRIPTIONS = {
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_namespaceObject.__)('Deploy static HTML/CSS/JS files for web hosting', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_namespaceObject.__)('Deploy WordPress Playground blueprint bundle (ZIP file)', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_namespaceObject.__)('Deploy serverless functions to edge computing platforms', 'aether-site-exporter')
};
;// ./assets/src/publish/workflows/workflowExecutor.js
/**
 * Workflow Executor
 *
 * Generic executor for running phase-based workflows with parallel step support.
 * Handles progress tracking, state transitions, and error handling.
 *
 * @package
 */




/**
 * Execute a workflow with sequential phases and parallel steps.
 *
 * @param {Array}    workflow                Workflow definition (phases with steps).
 * @param {Object}   handlers                Map of step IDs to handler functions.
 * @param {Object}   context                 Execution context passed to handlers.
 * @param {Object}   options                 Execution options.
 * @param {Function} options.onPhaseStart    Called when phase starts.
 * @param {Function} options.onPhaseComplete Called when phase completes.
 * @param {Function} options.onStepStart     Called when step starts.
 * @param {Function} options.onStepComplete  Called when step completes.
 * @param {Function} options.onProgress      Called on progress updates.
 * @return {Promise<Object>} Final execution state.
 */
async function executeWorkflow(workflow, handlers, context, options = {}) {
  const {
    onPhaseStart = () => {},
    onPhaseComplete = () => {},
    onStepStart = () => {},
    onStepComplete = () => {},
    onProgress = () => {}
  } = options;
  let cumulativeProgress = 0;
  const state = {}; // Accumulate state from all steps

  try {
    // Execute each phase sequentially
    for (let phaseIndex = 0; phaseIndex < workflow.length; phaseIndex++) {
      const phase = workflow[phaseIndex];
      debug(`[WorkflowExecutor] Starting phase ${phaseIndex + 1}/${workflow.length} with ${phase.length} step(s)`);
      onPhaseStart(phaseIndex, phase);

      // Execute all steps in phase in parallel
      const stepPromises = phase.map(([stepId, weight]) => {
        return executeStep(stepId, weight, handlers[stepId], {
          ...context,
          ...state,
          // Include accumulated state from previous steps
          stepId,
          weight,
          cumulativeProgress
        }, {
          onStepStart,
          onStepComplete,
          onProgress
        });
      });

      // Wait for all steps in phase to complete
      // Use Promise.allSettled() to collect results from all steps,
      // even if some fail. This allows better error recovery and cleanup.
      const stepResults = await Promise.allSettled(stepPromises);

      // Process results - merge successful results into state, throw on failures
      const errors = [];
      stepResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          // Step succeeded - merge result into state
          Object.assign(state, result.value);
        } else {
          // Step failed - collect error
          const [stepId] = phase[index];
          errors.push({
            stepId,
            error: result.reason
          });
        }
      });

      // If any steps failed, throw error with details
      if (errors.length > 0) {
        const errorMessages = errors.map(({
          stepId,
          error
        }) => `${stepId}: ${error.message}`).join(', ');
        throw new Error(`${errors.length} step(s) failed: ${errorMessages}`);
      }

      // Update cumulative progress
      const phaseProgress = phase.reduce((sum, [, weight]) => sum + weight, 0);
      cumulativeProgress += phaseProgress;
      debug(`[WorkflowExecutor] Phase ${phaseIndex + 1} complete. Progress: ${cumulativeProgress}%`);
      onPhaseComplete(phaseIndex, phase, cumulativeProgress);
      onProgress(cumulativeProgress, 100);
    }
    debug('[WorkflowExecutor] Workflow completed successfully');
    return state;
  } catch (error) {
    debugError('[WorkflowExecutor] Workflow failed:', error);
    throw error;
  }
}

/**
 * Execute a single step.
 *
 * @param {string}   stepId                 Step identifier.
 * @param {number}   weight                 Progress weight for this step.
 * @param {Function} handler                Step handler function (async).
 * @param {Object}   context                Execution context.
 * @param {Object}   options                Step options.
 * @param {Function} options.onStepStart    Called when step starts.
 * @param {Function} options.onStepComplete Called when step completes.
 * @return {Promise<Object>} Step result data.
 */
async function executeStep(stepId, weight, handler, context, {
  onStepStart,
  onStepComplete
}) {
  if (!handler) {
    throw new Error(`No handler found for step: ${stepId}`);
  }
  debug(`[WorkflowExecutor] Executing step: ${stepId} (weight: ${weight}%)`);
  onStepStart(stepId, weight);

  /**
   * Action fired before a publish step executes.
   *
   * @param {Object} context Execution context passed to the step handler.
   *
   * @example
   * import { addAction } from '@wordpress/hooks';
   *
   * addAction('aether.publish.step.uploadStaticSiteFiles.before', 'my-provider', (context) => {
   *   console.log('About to upload files:', context);
   * });
   */
  (0,external_wp_hooks_.doAction)(`aether.publish.step.${stepId}.before`, context);
  try {
    // Execute step handler (returns Promise)
    const result = await handler(context);

    /**
     * Filter the result of a publish step.
     *
     * Allows modification of step results before they're merged into workflow state.
     *
     * @param {Object} result  The step result object.
     * @param {Object} context The execution context.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.publish.step.createSiteArchive.result', 'my-provider', (result, context) => {
     *   return {
     *     ...result,
     *     customData: 'my custom value'
     *   };
     * });
     */
    const filteredResult = (0,external_wp_hooks_.applyFilters)(`aether.publish.step.${stepId}.result`, result || {}, context);
    debug(`[WorkflowExecutor] Step completed: ${stepId}`);
    onStepComplete(stepId, filteredResult);

    /**
     * Action fired after a publish step completes successfully.
     *
     * @param {Object} result  The step result object (after filtering).
     * @param {Object} context The execution context.
     *
     * @example
     * import { addAction } from '@wordpress/hooks';
     *
     * addAction('aether.publish.step.generateBlueprint.after', 'my-provider', (result, context) => {
     *   console.log('Blueprint generated:', result.blueprint);
     * });
     */
    (0,external_wp_hooks_.doAction)(`aether.publish.step.${stepId}.after`, filteredResult, context);
    return filteredResult;
  } catch (error) {
    debugError(`[WorkflowExecutor] Step failed: ${stepId}`, error);

    /**
     * Action fired when a publish step fails.
     *
     * @param {Error}  error   The error object.
     * @param {Object} context The execution context.
     *
     * @example
     * import { addAction } from '@wordpress/hooks';
     *
     * addAction('aether.publish.step.uploadStaticSiteFiles.error', 'my-provider', (error, context) => {
     *   // Log error to external service
     *   console.error('Upload failed:', error.message);
     * });
     */
    (0,external_wp_hooks_.doAction)(`aether.publish.step.${stepId}.error`, error, context);
    throw new Error(`Step ${stepId} failed: ${error.message}`);
  }
}

/**
 * Calculate overall progress based on step progress.
 *
 * @param {number} cumulativeProgress Progress completed before current step (0-100).
 * @param {number} stepWeight         Weight of current step (0-100).
 * @param {number} stepProgress       Progress within current step (0-100).
 * @return {number} Overall progress (0-100).
 */
function calculateProgress(cumulativeProgress, stepWeight, stepProgress) {
  const stepProgressContribution = stepWeight * stepProgress / 100;
  const calculatedProgress = Math.min(100, Math.round(cumulativeProgress + stepProgressContribution));

  /**
   * Filter the calculated progress value.
   *
   * Allows custom progress calculation or smoothing.
   *
   * @param {number} progress           The calculated progress (0-100).
   * @param {number} cumulativeProgress Progress before current step.
   * @param {number} stepWeight         Weight of current step.
   * @param {number} stepProgress       Progress within current step.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.publish.progress', 'my-provider', (progress) => {
   *   // Never show 100% until truly complete
   *   return Math.min(99, progress);
   * });
   */
  return applyFilters('aether.publish.progress', calculatedProgress, cumulativeProgress, stepWeight, stepProgress);
}

/**
 * Validate workflow structure.
 *
 * @param {Array}  workflow Workflow definition.
 * @param {Object} handlers Handler map.
 * @return {Object} Validation result { isValid, errors }.
 */
function validateWorkflowStructure(workflow, handlers) {
  const errors = [];
  if (!Array.isArray(workflow)) {
    errors.push('Workflow must be an array');
    return {
      isValid: false,
      errors
    };
  }
  workflow.forEach((phase, phaseIndex) => {
    if (!Array.isArray(phase)) {
      errors.push(`Phase ${phaseIndex} must be an array`);
      return;
    }
    if (phase.length === 0) {
      errors.push(`Phase ${phaseIndex} is empty`);
    }
    phase.forEach((step, stepIndex) => {
      if (!Array.isArray(step) || step.length !== 2) {
        errors.push(`Phase ${phaseIndex}, step ${stepIndex} must be [stepId, weight]`);
        return;
      }
      const [stepId, weight] = step;
      if (typeof stepId !== 'string') {
        errors.push(`Phase ${phaseIndex}, step ${stepIndex}: stepId must be a string`);
      }
      if (typeof weight !== 'number' || weight <= 0 || weight > 100) {
        errors.push(`Phase ${phaseIndex}, step ${stepIndex}: weight must be a number between 0 and 100`);
      }
      if (!handlers[stepId]) {
        errors.push(`Phase ${phaseIndex}, step ${stepIndex}: no handler found for '${stepId}'`);
      }
    });
  });
  return {
    isValid: errors.length === 0,
    errors
  };
}
;// ./assets/src/publish/hooks/usePublishController.js
/**
 * Publish Controller Hook
 *
 * Orchestrates the publish workflow using phase-based execution
 *
 * @package
 */















function usePublishController(publishState) {
  const {
    setIsPublishing,
    updateFromStep,
    markAllComplete,
    showError,
    initializeSteps,
    setStatusMessage,
    setOverallProgressValue,
    setStepProgress,
    removeMessage
  } = publishState;

  // State for storage provider ID (set before starting publish)
  // Must be declared before hooks that use it
  const [storageProviderId, setStorageProviderId] = (0,external_wp_element_namespaceObject.useState)('');
  const api = usePublishAPI();
  const assetManager = useAssetManager();

  // Get config at hook level (hooks can't be called inside callbacks)
  const config = useConfig();

  // Create blueprint generator hook.
  const {
    generateBlueprint: generateBlueprintJson
  } = useBlueprintGenerator();

  // Create static site generator with progress callback
  const processStaticSiteUrls = useStaticSiteGenerator((uploadedFiles, totalFiles) => {
    if (totalFiles > 0 && uploadedFiles >= 0) {
      // Calculate progress percentage based on file count
      const progress = Math.min(100, Math.max(0, Math.round(uploadedFiles / totalFiles * 100)));
      const overallProgress = progressManager_calculateOverallProgress({
        step: 'uploadStaticSiteFiles',
        progress
      });
      setOverallProgressValue(overallProgress);
      setStepProgress('uploadStaticSiteFiles', progress);
    }
  });

  // Helper function to upload blueprint-bundle.zip archive file.
  // Detects upload method from provider's upload strategy (git, storage, or direct).
  const handleSiteArchiveUpload = (0,external_wp_element_namespaceObject.useCallback)(async (providerId, context) => {
    try {
      // Use provider ID passed from executeSteps (avoids redundant settings fetch).
      // Get default provider if none configured
      let fetchedStorageProviderId = providerId;
      if (!fetchedStorageProviderId) {
        const {
          getDefaultProvider
        } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 264));
        fetchedStorageProviderId = await getDefaultProvider();
      }

      // Fetch provider metadata from REST API to check upload strategy
      let providerMetadata = null;
      try {
        const providerResponse = await utils_api({
          path: `/aether/site-exporter/providers/${fetchedStorageProviderId}`
        });
        if (providerResponse.success && providerResponse.provider) {
          providerMetadata = providerResponse.provider;
        }
      } catch (error) {
        debugError(`[Aether] Failed to fetch provider metadata for ${fetchedStorageProviderId}:`, error);
      }
      if (!providerMetadata) {
        throw new Error(`Provider not found: ${fetchedStorageProviderId}`);
      }

      // Determine upload strategy from provider type or use hook
      // Git providers have type 'git-hosting', local has type 'local-storage'
      let uploadStrategy = 'storage'; // Default
      if (providerMetadata.type === 'git-hosting') {
        uploadStrategy = 'git';
      } else if (providerMetadata.type === 'local-storage') {
        uploadStrategy = 'direct';
      }

      // Allow providers to override upload strategy via filter
      const filteredStrategy = (0,external_wp_hooks_.applyFilters)('aether.provider.upload_strategy', uploadStrategy, fetchedStorageProviderId, providerMetadata);
      uploadStrategy = filteredStrategy;
      let gitConfig = null;
      if (uploadStrategy === 'git') {
        // For Git-based providers, fetch Git configuration
        gitConfig = await api.getGitConfig().catch(() => null);
      }

      // DECISION POINT: Git vs Storage provider upload.
      // Priority: Git upload takes precedence if configured.
      // Fallback: Storage provider upload via API.
      if (uploadStrategy === 'git' && gitConfig && gitConfig.success && gitConfig.config) {
        // METHOD 1: Git-based upload
        // Create simple manifest with wp-content.zip for Git upload.
        // eslint-disable-next-line no-unused-vars
        const _manifest = [{
          storageKey: 'wp-content.zip',
          contentType: 'application/zip'
        }];
        // 					await gitUpload.uploadFiles( manifest, gitConfig );
        // Update progress to 100% for uploadSiteArchive when Git upload completes.
        updateFromStep('uploadSiteArchive');
        setOverallProgressValue(progressManager_calculateOverallProgress({
          step: 'uploadSiteArchive',
          progress: 100
        }));
      } else if (uploadStrategy === 'direct') {
        // METHOD 2: Direct provider upload (LocalFilesystem)
        // For 'direct' strategy, we use the provider's uploadFile method
        // This allows the provider to handle the file operation (copy, verify, etc.)

        // Get blueprintBundle data from context (set by generateBlueprint step)
        // Note: The workflow executor merges step results into context
        const blueprintBundlePath = context.blueprintBundle?.bundlePath;
        if (!blueprintBundlePath) {
          throw new Error('Blueprint bundle not found. generateBlueprint must run before uploadSiteArchive.');
        }
        debug('Uploading blueprint bundle via provider:', blueprintBundlePath);

        // Use hook-based upload instead of provider method
        // Get upload handler for this provider via filter
        const uploadHandler = (0,external_wp_hooks_.applyFilters)('aether.provider.upload', null, fetchedStorageProviderId, {
          filePath: blueprintBundlePath,
          fileName: 'blueprint-bundle.zip',
          context: context
        });
        if (!uploadHandler || typeof uploadHandler !== 'function') {
          throw new Error(`No upload handler registered for provider: ${fetchedStorageProviderId}`);
        }

        // Call the upload handler
        const uploadResult = await uploadHandler(blueprintBundlePath, 'blueprint-bundle.zip', context);
        if (!uploadResult || !uploadResult.success) {
          throw new Error(uploadResult?.error || 'Failed to upload blueprint bundle');
        }
        debug('Blueprint bundle upload complete:', uploadResult);

        // Update progress to 100%
        updateFromStep('uploadSiteArchive');
        setOverallProgressValue(progressManager_calculateOverallProgress({
          step: 'uploadSiteArchive',
          progress: 100
        }));
        setStepProgress('uploadSiteArchive', 100);
      } else {
        // ERROR: No upload method configured (no provider configured).
        throw new Error('No supported upload method available');
      }

      // Upload complete - control returns to workflow executor.
    } catch (error) {
      throw error;
    }
  }, [api, updateFromStep,
  // 			gitUpload,
  setOverallProgressValue, setStepProgress]);
  const startPublish = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    try {
      debug('startPublish called');

      // Initialize steps with 'discoverAssets' as the active step
      // This sets up steps array, active step, and lastStepIndex correctly
      initializeSteps(steps_PUBLISH_STEPS, 'discoverAssets');
      // Set isPublishing to true to start the workflow
      setIsPublishing(true);
      debug('Steps initialized, starting publish workflow');

      // Fetch settings to get storage provider ID before starting
      const settingsResponse = await utils_api({
        path: '/aether/site-exporter/settings'
      });
      if (settingsResponse.success) {
        const settings = settingsResponse.settings || {};
        const providerTypes = settings.provider_types || {};
        const currentStorageProviderId = providerTypes.storage || '';
        setStorageProviderId(currentStorageProviderId);
      }

      // Fetch asset status
      try {
        const assetStatusResponse = await api.getAssetStatus();
        if (assetStatusResponse.success && assetStatusResponse.assets) {
          assetManager.syncWithServer(assetStatusResponse.assets);
        }
      } catch (assetError) {
        // Asset status fetch is not critical - log and continue
        debugError('Failed to fetch asset status:', assetError);
      }

      // STATELESS WORKFLOW EXECUTION
      // No job tracking - React owns all state, PHP provides stateless endpoints

      // Activate the first step immediately to update UI
      updateFromStep('discoverAssets');

      // Fetch static site provider settings
      const fetchedStaticSiteProviderId = settingsResponse.settings?.provider_types?.static_site || '';

      // Get current site URL for static site generation
      const siteUrl = config.playgroundUrl || window.location.origin;

      // Get providerId for backwards compatibility
      const providerId = fetchedStaticSiteProviderId || storageProviderId;

      // Fetch providers for each deployment type from REST API (PHP registry)
      const getProvidersForDeploymentType = async deploymentType => {
        try {
          const response = await utils_api({
            path: `/aether/site-exporter/providers/by-deployment-type/${deploymentType}`
          });
          if (response.success && response.providers) {
            // Return array of provider IDs
            return response.providers.map(p => p.id);
          }
        } catch (error) {
          debugError(`Failed to fetch providers for deployment type ${deploymentType}:`, error);
        }
        return [];
      };

      // Get arrays of providers for each deployment type (in parallel)
      const [staticSiteProviders, blueprintBundleProviders, edgeFunctionProviders] = await Promise.all([getProvidersForDeploymentType(DEPLOYMENT_TYPES.STATIC_SITE), getProvidersForDeploymentType(DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE), getProvidersForDeploymentType(DEPLOYMENT_TYPES.EDGE_FUNCTIONS)]);
      debug('[Workflow] Providers by deployment type:', {
        staticSite: staticSiteProviders,
        blueprintBundle: blueprintBundleProviders,
        edgeFunctions: edgeFunctionProviders
      });

      // Build context object with all dependencies for step handlers
      const workflowContext = {
        // API and state
        api,
        siteUrl,
        providerId,
        // Legacy: single provider ID for backwards compat

        // Provider arrays by deployment type (from PHP registry via REST API)
        staticSiteProviders,
        blueprintBundleProviders,
        edgeFunctionProviders,
        // Hooks and utilities
        processStaticSiteUrls,
        generateBlueprintJson,
        handleSiteArchiveUpload,
        // UI callbacks
        setStatusMessage,
        setStepProgress,
        removeMessage
      };

      // Get export_types from provider settings to determine which exports to run
      const providerSettings = settingsResponse.settings?.providers?.[providerId] || {};
      const exportTypes = providerSettings.export_types || ['static_site', 'blueprint_bundle'];
      debug('[Workflow] Export types configured:', exportTypes);

      // Filter workflow based on export types
      const filteredWorkflow = filterWorkflowByExportTypes(PUBLISH_WORKFLOW, exportTypes);
      debug('[Workflow] Filtered workflow phases:', filteredWorkflow.length);

      // Set up workflow lifecycle callbacks for UI updates
      const workflowOptions = {
        onStepStart: stepId => {
          debug(`[Workflow] Step starting: ${stepId}`);
          updateFromStep(stepId);
        },
        onStepComplete: (stepId, result) => {
          debug(`[Workflow] Step completed: ${stepId}`, result);
        },
        onProgress: current => {
          setOverallProgressValue(current);
        }
      };

      // Execute the filtered workflow
      await executeWorkflow(filteredWorkflow, STEP_HANDLERS, workflowContext, workflowOptions);
      debug('[Workflow] All steps completed successfully');

      // Clear asset upload tracking flags (reset state for next publish)
      assetManager.clearUploadFlags();

      // Update UI to show all steps as complete with success message
      markAllComplete({
        status: 'complete'
      });

      // Release publishing lock (allows user to start new publish)
      setIsPublishing(false);
    } catch (error) {
      debugError('Publish failed:', error);
      showError(`Failed to start: ${error.message}`);
      setIsPublishing(false);
    }
  }, [setIsPublishing, api, assetManager, showError, initializeSteps, setStorageProviderId, updateFromStep, config, storageProviderId, processStaticSiteUrls, generateBlueprintJson, handleSiteArchiveUpload, setStatusMessage, setStepProgress, removeMessage, setOverallProgressValue, markAllComplete]);
  return {
    startPublish
  };
}
;// ./assets/src/utils/styles.js
/**
 * Shared style utilities and constants
 *
 * Centralized styles for inline styling across components.
 *
 * @package
 */

const colors = {
  primary: '#2271b1',
  primaryHover: '#135e96',
  primaryDark: '#0a4168',
  text: '#1d2327',
  textMuted: '#646970',
  textSecondary: '#50575e',
  white: '#fff',
  background: '#f6f7f7',
  backgroundLighter: '#f0f0f1',
  backgroundError: '#fcf0f1',
  borderLight: '#c3c4c7',
  borderLighter: '#e0e0e0',
  error: '#d63638',
  success: '#00a32a',
  warning: '#dba617',
  info: '#2271b1'
};
const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1.25rem',
  xl: '1.5rem',
  '2xl': '2rem'
};
const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px'
};
const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem'
};
const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
};
const commonStyles = {
  section: {
    background: colors.white,
    border: `1px solid ${colors.borderLight}`,
    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.04)',
    marginBottom: spacing.lg,
    padding: 0
  },
  sectionHeader: {
    borderBottom: `1px solid ${colors.borderLight}`,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    background: colors.background
  },
  card: {
    background: colors.white,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.sm,
    padding: spacing.lg
  }
};
const statusBadgeStyles = {
  base: {
    display: 'inline-block',
    paddingTop: '3px',
    paddingBottom: '3px',
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  success: {
    background: '#d5f0dd',
    color: '#00833e'
  },
  error: {
    background: '#fcf0f1',
    color: '#c22c2e'
  },
  warning: {
    background: '#fcf0c7',
    color: '#826200'
  },
  info: {
    background: '#d7edff',
    color: '#135e96'
  }
};
const noticeStyles = {
  base: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
    borderLeft: '4px solid',
    background: colors.white
  },
  success: {
    borderLeftColor: colors.success,
    background: '#d5f0dd'
  },
  error: {
    borderLeftColor: colors.error,
    background: colors.backgroundError
  },
  warning: {
    borderLeftColor: colors.warning,
    background: '#fcf0c7'
  },
  info: {
    borderLeftColor: colors.info,
    background: '#d7edff'
  }
};

/**
 * Create flexbox style object
 *
 * @param {string} direction Flex direction ('row' or 'column')
 * @param {string} gap       Gap spacing
 * @return {Object} Style object
 */
const createFlexStyle = (direction = 'row', gap = spacing.md) => ({
  display: 'flex',
  flexDirection: direction,
  gap
});

/**
 * Create grid style object
 *
 * @param {string} minColumnWidth Minimum column width
 * @param {string} gap            Gap spacing
 * @return {Object} Style object
 */
const createGridStyle = (minColumnWidth = '16rem', gap = spacing.md) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`,
  gap
});

/**
 * Common utility styles
 */
const utilityStyles = {
  noMargin: {
    margin: 0
  },
  noMarginTop: {
    marginTop: 0
  },
  noMarginBottom: {
    marginBottom: 0
  }
};
;// ./assets/src/publish/components/ActivityLogMessage.js
/**
 * Activity Log Message Component
 *
 * Renders a single activity log message with icon, text, and optional progress bar
 *
 * @package
 */



/**
 * Get activity item style based on message type
 *
 * @param {string} type Message type: 'info' | 'success' | 'error' | 'progress'
 * @return {Object} Style object
 */

const getActivityItemStyle = type => {
  const baseStyle = {
    ...createFlexStyle('row', spacing.sm),
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    transition: 'background-color 0.2s ease'
  };
  const typeStyles = {
    progress: {
      backgroundColor: noticeStyles.info.background
    },
    success: {
      backgroundColor: noticeStyles.success.background
    },
    error: {
      backgroundColor: noticeStyles.error.background
    },
    info: {
      backgroundColor: colors.backgroundLighter
    }
  };
  return {
    ...baseStyle,
    ...(typeStyles[type] || typeStyles.info)
  };
};

/**
 * Get icon color based on message type
 *
 * @param {string} type Message type: 'info' | 'success' | 'error' | 'progress'
 * @return {string} Color value
 */
const getActivityIconColor = type => {
  const iconColors = {
    progress: colors.primary,
    success: colors.success,
    error: colors.error,
    info: colors.textMuted
  };
  return iconColors[type] || iconColors.info;
};
const activityIconStyle = {
  flexShrink: 0,
  width: '1rem',
  height: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: fontWeight.bold
};
const activityMessageStyle = {
  flex: 1,
  lineHeight: 1.4,
  wordBreak: 'break-word',
  minWidth: 0 // Allow flex item to shrink below content size
};
const fileProgressBarContainerStyle = {
  flexShrink: 0,
  width: '120px',
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  marginLeft: spacing.sm
};
const fileProgressBarStyle = {
  flex: 1,
  height: '4px',
  backgroundColor: colors.borderLighter,
  borderRadius: borderRadius.full,
  overflow: 'hidden'
};
const fileProgressBarFillStyle = {
  height: '100%',
  backgroundColor: colors.primary,
  transition: 'width 0.2s ease'
};
const fileProgressPercentageStyle = {
  fontSize: fontSize.xs,
  color: colors.textMuted,
  fontWeight: fontWeight.medium,
  minWidth: '35px',
  textAlign: 'right'
};

/**
 * Get icon character for message type
 *
 * @param {string} type Message type
 * @return {string} Icon character
 */
const getIcon = type => {
  const icons = {
    success: '✓',
    error: '✕',
    progress: '◉',
    info: '•'
  };
  return icons[type] || icons.info;
};

/**
 * Activity Log Message Component
 *
 * @param {Object}      props          Component props
 * @param {string}      props.message  Message text (plain text, HTML will be escaped)
 * @param {string}      props.type     Message type: 'info' | 'success' | 'error' | 'progress'
 * @param {Object|null} props.progress Optional progress data { percent: number, loaded?: number, total?: number }
 * @return {JSX.Element} Activity log message item
 */
function ActivityLogMessage({
  message,
  type,
  progress
}) {
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("li", {
    className: `aether-publish-progress-modal__activity-item aether-publish-progress-modal__activity-item--${type}`,
    style: getActivityItemStyle(type),
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
      className: `aether-publish-progress-modal__activity-icon aether-publish-progress-modal__activity-icon--${type}`,
      style: {
        ...activityIconStyle,
        color: getActivityIconColor(type)
      },
      children: getIcon(type)
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
      className: "aether-publish-progress-modal__activity-message",
      style: activityMessageStyle,
      children: message
    }), progress && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-publish-progress-modal__file-progress",
      style: fileProgressBarContainerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-publish-progress-modal__file-progress-bar",
        style: fileProgressBarStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
          className: "aether-publish-progress-modal__file-progress-fill",
          style: {
            ...fileProgressBarFillStyle,
            width: `${progress.percent}%`
          }
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
        className: "aether-publish-progress-modal__file-progress-percentage",
        style: fileProgressPercentageStyle,
        children: [progress.percent, "%"]
      })]
    })]
  });
}
;// ./assets/src/publish/components/PublishProgressModal.js
/**
 * Publish Progress Modal Component
 *
 * Shows publish progress with progress bar and status messages
 *
 * @package
 */









function PublishProgressModal({
  isOpen,
  onClose,
  onComplete
}) {
  const publishState = usePublishState();
  const {
    startPublish
  } = usePublishController(publishState);
  const {
    steps,
    isPublishing,
    jobId,
    finalStatus,
    error,
    reset,
    overallProgress,
    messageHistory
  } = publishState;

  // Ref for activity log auto-scroll
  const activityLogRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Keep modal open if finalStatus is set, even if isOpen becomes false
  // This allows the auto-close effect to run and show the success message
  const shouldShowModal = isOpen || finalStatus;

  // Wrapper for onClose that resets state before closing
  const handleClose = (0,external_wp_element_namespaceObject.useCallback)(() => {
    reset();
    if (onClose) {
      onClose();
    }
  }, [reset, onClose]);

  // Reset state when modal closes (only when shouldShowModal becomes false)
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (!shouldShowModal) {
      reset();
    }
  }, [shouldShowModal, reset]);

  // Start publish when modal opens
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (isOpen && !isPublishing) {
      // Only start if we haven't started yet (no steps initialized and no job ID)
      if (steps.length === 0 && !jobId) {
        startPublish();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen to avoid re-triggering

  // Handle completion
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (finalStatus && onComplete) {
      // Call onComplete callback to close modal and refresh data
      onComplete(finalStatus);
    }
  }, [finalStatus, onComplete]);

  // Auto-close modal after successful completion (with delay to show success message)
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (finalStatus && !error) {
      const timer = setTimeout(() => {
        handleClose();
      }, 2000); // Close after 2 seconds to show success message

      return () => clearTimeout(timer);
    }
  }, [finalStatus, error, handleClose]);

  // Auto-scroll activity log to top when new messages arrive
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (activityLogRef.current) {
      activityLogRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [messageHistory.length]);

  // Calculate overall progress from steps if not explicitly set
  const displayProgress = (0,external_wp_element_namespaceObject.useMemo)(() => {
    if (overallProgress > 0) {
      return overallProgress;
    }
    if (steps.length === 0) {
      return 0;
    }
    const completedSteps = steps.filter(step => step.status === 'complete').length;
    const currentActiveStep = steps.find(step => step.status === 'active');
    let progress = completedSteps / steps.length * 100;
    if (currentActiveStep && currentActiveStep.supportsProgress) {
      progress += currentActiveStep.progress / steps.length;
    }
    return Math.min(100, Math.round(progress));
  }, [steps, overallProgress]);

  // Sort activity log messages by priority: progress → error → success/info
  const sortedMessageHistory = (0,external_wp_element_namespaceObject.useMemo)(() => {
    const getPriority = type => {
      switch (type) {
        case 'progress':
          return 0;
        case 'error':
          return 1;
        case 'success':
        case 'info':
        default:
          return 2;
      }
    };
    return [...messageHistory].sort((a, b) => {
      const priorityA = getPriority(a.type);
      const priorityB = getPriority(b.type);
      // Sort by priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // Within same priority, maintain existing order (newest first)
      // Since messages are prepended, original index order is preserved
      return 0;
    });
  }, [messageHistory]);
  if (!shouldShowModal) {
    return null;
  }
  const getModalTitle = () => {
    if (error) {
      return (0,external_wp_i18n_namespaceObject.__)('Publish Failed', 'aether-site-exporter');
    }
    if (finalStatus) {
      return (0,external_wp_i18n_namespaceObject.__)('Site Published Successfully!', 'aether-site-exporter');
    }
    return (0,external_wp_i18n_namespaceObject.__)('Publishing Site', 'aether-site-exporter');
  };
  const modalContentStyle = {
    padding: spacing['2xl'],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xl']
  };
  const noticeErrorStyle = {
    ...noticeStyles.error,
    padding: spacing.md,
    marginBottom: spacing.md
  };
  const noticeSuccessStyle = {
    ...noticeStyles.success,
    padding: spacing.md,
    marginBottom: spacing.md
  };
  const noticeParagraphStyle = {
    margin: '0 0 0.5rem'
  };
  const progressContainerStyle = {
    ...createFlexStyle('column', spacing.xl)
  };
  const progressBarContainerStyle = {
    ...createFlexStyle('row', spacing.lg),
    alignItems: 'center',
    width: '100%'
  };
  const progressBarStyle = {
    width: '100%',
    height: '20px',
    backgroundColor: colors.borderLighter,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    position: 'relative'
  };
  const progressBarFillStyle = {
    height: '100%',
    backgroundColor: colors.primary,
    transition: 'width 0.3s ease',
    borderRadius: borderRadius.sm
  };
  const progressPercentageStyle = {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    minWidth: '3rem',
    textAlign: 'right',
    flexShrink: 0
  };
  const activityLogStyle = {
    marginTop: spacing.xl,
    overflowY: 'auto',
    fontSize: fontSize.xs
  };
  const activityListStyle = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    ...createFlexStyle('column', 0)
  };
  const loadingStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xl,
    padding: spacing['2xl'],
    textAlign: 'center'
  };
  const loadingParagraphStyle = {
    margin: 0,
    fontSize: '1.125rem',
    color: colors.textMuted
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Modal, {
    className: "aether-publish-progress-modal",
    title: getModalTitle(),
    onRequestClose: handleClose,
    isFullScreen: true,
    style: {
      width: '100vw',
      height: '100vh'
    },
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-publish-progress-modal__content",
      style: modalContentStyle,
      children: [error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-publish-progress-modal__notice aether-publish-progress-modal__notice--error",
        style: noticeErrorStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-publish-progress-modal__notice-text",
          style: utilityStyles.noMargin,
          children: error
        })
      }), finalStatus && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-publish-progress-modal__notice aether-publish-progress-modal__notice--success",
        style: noticeSuccessStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-publish-progress-modal__notice-text",
          style: noticeParagraphStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Your site has been published successfully!', 'aether')
        }), finalStatus.deploymentUrl && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("p", {
          className: "aether-publish-progress-modal__deployment",
          style: utilityStyles.noMargin,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
            className: "aether-publish-progress-modal__deployment-label",
            children: (0,external_wp_i18n_namespaceObject.__)('View your published site:', 'aether')
          }), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("a", {
            className: "aether-publish-progress-modal__deployment-link",
            href: finalStatus.deploymentUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            children: finalStatus.deploymentUrl
          })]
        })]
      }), !finalStatus && !error && steps.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-publish-progress-modal__progress",
        style: progressContainerStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          className: "aether-publish-progress-modal__progress-container",
          style: progressBarContainerStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
            className: "aether-publish-progress-modal__progress-bar",
            style: progressBarStyle,
            children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
              className: "aether-publish-progress-modal__progress-fill",
              style: {
                ...progressBarFillStyle,
                width: `${displayProgress}%`
              }
            })
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
            className: "aether-publish-progress-modal__progress-percentage",
            style: progressPercentageStyle,
            children: [displayProgress, "%"]
          })]
        })
      }), messageHistory.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-publish-progress-modal__activity-log",
        style: activityLogStyle,
        ref: activityLogRef,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("ul", {
          className: "aether-publish-progress-modal__activity-list",
          style: activityListStyle,
          children: sortedMessageHistory.map(item => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ActivityLogMessage, {
            message: item.message,
            type: item.type,
            progress: item.progress
          }, item.id))
        })
      }), steps.length === 0 && !error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-publish-progress-modal__loading",
        style: loadingStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Spinner, {
          className: "aether-publish-progress-modal__spinner"
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          className: "aether-publish-progress-modal__loading-text",
          style: loadingParagraphStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Initializing publish process…', 'aether-site-exporter')
        })]
      })]
    })
  });
}
;// ./assets/src/admin-settings/components/ProviderCard.js
/**
 * Provider Card Component
 *
 * Displays a compact card for a provider with enable/disable toggle,
 * status indicators, and a Configure button that opens the modal.
 *
 * @package
 */






/**
 * Provider Card Component.
 *
 * @param {Object}   props                Component props.
 * @param {Object}   props.provider       Provider metadata.
 * @param {Object}   props.config         Provider configuration.
 * @param {boolean}  props.enabled        Whether provider is enabled.
 * @param {Function} props.onToggle       Toggle enable/disable handler.
 * @param {Function} props.onConfigure    Open configuration modal handler.
 * @return {JSX.Element} Rendered card component.
 */

function ProviderCard({
  provider,
  config = {},
  enabled = false,
  onToggle,
  onConfigure
}) {
  const {
    id,
    metadata,
    settingsFields
  } = provider;
  const {
    name,
    description,
    supportedDeploymentTypes = [],
    type
  } = metadata;

  // Check if provider is configured (has any non-default config values)
  const isConfigured = config && Object.keys(config).length > 0;

  // Get deployment types from config or use supported types as default
  const deploymentTypes = config.deployment_types || supportedDeploymentTypes || [];
  const cardStyle = {
    position: 'relative',
    opacity: enabled ? 1 : 0.6,
    transition: 'opacity 0.2s ease'
  };
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md
  };
  const titleStyle = {
    fontSize: '1.125rem',
    fontWeight: fontWeight.semibold,
    color: colors.text,
    margin: 0,
    marginBottom: spacing.xs
  };
  const descriptionStyle = {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    margin: 0,
    marginBottom: spacing.md,
    lineHeight: '1.5'
  };
  const badgeContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md
  };
  const badgeStyle = {
    display: 'inline-block',
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: '#d7edff',
    color: '#135e96',
    borderRadius: borderRadius.sm,
    fontSize: '0.75rem',
    fontWeight: fontWeight.medium
  };
  const statusBadgeStyle = {
    display: 'inline-block',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.sm,
    fontSize: '0.75rem',
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };
  const actionsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.borderLight}`
  };
  const statusIndicatorStyle = {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isConfigured ? colors.success : colors.borderLight
  };
  const cardContainerStyle = {
    ...cardStyle,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: '4px',
    padding: spacing.lg,
    backgroundColor: colors.white
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    style: cardContainerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      style: statusIndicatorStyle
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      style: headerStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        style: {
          flex: 1
        },
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h3", {
          style: titleStyle,
          children: name
        }), description && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          style: descriptionStyle,
          children: description
        })]
      })
    }), deploymentTypes.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      style: badgeContainerStyle,
      children: deploymentTypes.map(type => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
        style: badgeStyle,
        children: DEPLOYMENT_TYPE_LABELS[type] || type
      }, type))
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      style: badgeContainerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
        style: {
          ...statusBadgeStyle,
          backgroundColor: isConfigured ? '#d5f0dd' : '#f0f0f1',
          color: isConfigured ? '#00833e' : '#646970'
        },
        children: isConfigured ? (0,external_wp_i18n_namespaceObject.__)('Configured', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Not Configured', 'aether-site-exporter')
      }), type && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
        style: {
          ...statusBadgeStyle,
          backgroundColor: '#f0f0f1',
          color: '#646970'
        },
        children: type
      })]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      style: actionsStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.ToggleControl, {
        label: enabled ? (0,external_wp_i18n_namespaceObject.__)('Enabled', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Disabled', 'aether-site-exporter'),
        checked: enabled,
        onChange: onToggle,
        __nextHasNoMarginBottom: true
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        variant: "secondary",
        onClick: onConfigure,
        disabled: !enabled,
        children: (0,external_wp_i18n_namespaceObject.__)('Configure', 'aether-site-exporter')
      })]
    })]
  });
}
;// ./assets/src/utils/validation.js
/**
 * Validation Utilities
 *
 * Client-side validation utilities for provider configurations.
 * Can be used with zod schemas once zod is installed.
 *
 * @package
 */

/**
 * Validate a field value based on validation rules.
 *
 * @param {string} value Value to validate.
 * @param {Object} field Field definition with validation rules.
 * @return {string|null} Error message if invalid, null if valid.
 */
function validateField(value, field) {
  const {
    validation,
    label,
    required
  } = field;

  // Check required fields.
  if (required && (value === null || value === undefined || value === '')) {
    return `${label} is required.`;
  }

  // Skip validation if field is empty and not required.
  if (!value && !required) {
    return null;
  }
  if (!validation) {
    return null;
  }

  // Pattern validation.
  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return validation.message || `${label} format is invalid.`;
    }
  }

  // Min length validation.
  if (validation.minLength && value.length < validation.minLength) {
    return `${label} must be at least ${validation.minLength} characters.`;
  }

  // Max length validation.
  if (validation.maxLength && value.length > validation.maxLength) {
    return `${label} must be no more than ${validation.maxLength} characters.`;
  }
  return null;
}

/**
 * Validate a provider configuration.
 *
 * @param {Object} config Configuration object to validate.
 * @param {Array}  fields Array of field definitions.
 * @return {Object} Object with `valid` boolean and `errors` object.
 */
function validateConfig(config, fields) {
  const errors = {};
  fields.forEach(field => {
    const fieldId = field.id;
    const value = config[fieldId];
    const error = validateField(value, field);
    if (error) {
      errors[fieldId] = error;
    }
  });
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
;// ./assets/src/components/SecretField.js
/**
 * Secret Field Component
 *
 * Replaces the aether-secret web component with a React component.
 *
 * @package
 */






function SecretField({
  value = '',
  onChange,
  label,
  help,
  placeholder,
  ...props
}) {
  const [isVisible, setIsVisible] = (0,external_wp_element_namespaceObject.useState)(false);
  const containerStyle = {
    position: 'relative'
  };
  const toggleStyle = {
    marginTop: spacing.sm
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-secret-field",
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      className: "aether-secret-field__input",
      label: label,
      help: help,
      value: value,
      onChange: onChange,
      type: isVisible ? 'text' : 'password',
      placeholder: placeholder,
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      ...props
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
      className: "aether-secret-field__toggle",
      variant: "secondary",
      onClick: () => setIsVisible(!isVisible),
      style: toggleStyle,
      children: isVisible ? (0,external_wp_i18n_namespaceObject.__)('Hide', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Show', 'aether-site-exporter')
    })]
  });
}
;// ./assets/src/providers/components/ProviderField.js
/**
 * Provider Field Component
 *
 * Dynamically renders a form field based on provider field definition.
 *
 * @package
 */




/**
 * Render a provider configuration field.
 *
 * @param {Object}   props          Component props.
 * @param {Object}   props.field    Field definition from provider metadata.
 * @param {*}        props.value    Current field value.
 * @param {Function} props.onChange Change handler.
 * @param {Object}   props.errors   Validation errors object.
 * @return {JSX.Element} Rendered field component.
 */

function ProviderField({
  field,
  value,
  onChange,
  errors
}) {
  const {
    id,
    label,
    description,
    type = 'text',
    required = false,
    options = [],
    placeholder = '',
    sensitive = false
  } = field;
  const error = errors?.[id];
  const help = error || description;

  // Handle sensitive fields (passwords, API keys, etc.)
  if (sensitive || type === 'password') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(SecretField, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        placeholder: placeholder,
        required: required
      })
    });
  }

  // Handle checkbox fields
  if (type === 'checkbox') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CheckboxControl, {
        label: label,
        help: help,
        checked: value || false,
        onChange: newValue => onChange(id, newValue),
        __nextHasNoMarginBottom: true
      })
    });
  }

  // Handle toggle group fields (checkbox group with multiple selection)
  if (type === 'checkbox-group' && options.length > 0) {
    // Use defaultValue if value is undefined or null
    let resolvedValue = [];
    if (value !== undefined && value !== null) {
      resolvedValue = value;
    } else if (field.defaultValue !== undefined) {
      resolvedValue = field.defaultValue;
    }
    const currentValue = Array.isArray(resolvedValue) ? resolvedValue : [];
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      children: [label && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "components-base-control__label",
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          children: label
        }), required && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
          className: "components-base-control__label__required",
          children: "*"
        })]
      }), help && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "components-base-control__help",
        children: help
      }), error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "components-base-control__help components-base-control__help--error",
        children: error
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-checkbox-group",
        children: options.map(option => {
          const optionValue = option.value;
          const optionLabel = option.label || option.value;
          const isSelected = currentValue.includes(optionValue);
          return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CheckboxControl, {
            label: optionLabel,
            checked: isSelected,
            onChange: checked => {
              let newValue;
              if (checked) {
                // Add to array if not already present (prevent duplicates)
                if (!currentValue.includes(optionValue)) {
                  newValue = [...currentValue, optionValue];
                } else {
                  // Already in array, no change needed
                  return;
                }
              } else {
                // Remove from array
                newValue = currentValue.filter(v => v !== optionValue);
              }
              onChange(id, newValue);
            },
            style: {
              margin: '0.25rem 0'
            },
            __nextHasNoMarginBottom: true
          }, optionValue);
        })
      })]
    });
  }

  // Handle select fields
  if (type === 'select' && options.length > 0) {
    const selectOptions = options.map(opt => ({
      label: opt.label || opt.value,
      value: opt.value
    }));
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.SelectControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        options: selectOptions,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true
      })
    });
  }

  // Handle textarea fields
  if (type === 'textarea') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextareaControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        placeholder: placeholder,
        required: required
      })
    });
  }

  // Handle URL fields
  if (type === 'url') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        type: "url",
        placeholder: placeholder,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true
      })
    });
  }

  // Handle email fields
  if (type === 'email') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        type: "email",
        placeholder: placeholder,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true
      })
    });
  }

  // Handle number fields
  if (type === 'number') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        type: "number",
        placeholder: placeholder,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true
      })
    });
  }

  // Default: text field
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
    className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      label: label,
      help: help,
      value: value || '',
      onChange: newValue => onChange(id, newValue),
      placeholder: placeholder,
      required: required,
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true
    })
  });
}
;// ./assets/src/hooks/useSuccessTimeout.js
/**
 * Success Timeout Hook
 *
 * Manages success message timeout with automatic cleanup.
 * Prevents memory leaks and ensures proper cleanup on unmount.
 *
 * @package
 */




/**
 * Hook for managing success message timeout.
 *
 * @return {Object} { showSuccess, clearSuccess }
 */
function useSuccessTimeout() {
  const timeoutRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Cleanup timeout on unmount
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
  const showSuccess = (0,external_wp_element_namespaceObject.useCallback)(callback => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (callback) {
        callback();
      }
      timeoutRef.current = null;
    }, SUCCESS_MESSAGE_DURATION_MS);
  }, []);
  const clearSuccess = (0,external_wp_element_namespaceObject.useCallback)(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  return {
    showSuccess,
    clearSuccess
  };
}
;// ./assets/src/providers/components/ProviderForm.js
/**
 * Provider Form Component
 *
 * Dynamically renders a form based on provider field definitions.
 * Can be enhanced with react-hook-form once installed.
 *
 * @package
 */










/**
 * Provider Form Component.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.providerId    Provider ID.
 * @param {Array}    props.fields        Array of field definitions from provider metadata.
 * @param {Object}   props.initialValues Initial form values.
 * @param {Function} props.onSubmit      Optional submit handler.
 * @param {Function} props.onChange      Optional change handler.
 * @return {JSX.Element} Rendered form component.
 */

function ProviderForm({
  providerId,
  fields = [],
  initialValues = {},
  onSubmit,
  onChange
}) {
  // Initialize values with field defaults merged with initialValues
  const initializeValues = () => {
    const defaults = {};
    fields.forEach(field => {
      // Use defaultValue if provided, otherwise use empty defaults based on field type
      if (field.defaultValue !== undefined) {
        defaults[field.id] = field.defaultValue;
      } else if (field.type === 'checkbox-group') {
        // Ensure checkbox-group fields are always arrays (even if empty)
        defaults[field.id] = [];
      } else if (field.type === 'checkbox') {
        defaults[field.id] = false;
      }
    });

    // Merge defaults with initialValues, but treat null/undefined as "not set"
    // This ensures that null values from backend don't override defaults
    const merged = {
      ...defaults
    };
    Object.keys(initialValues).forEach(key => {
      const value = initialValues[key];
      // Only use initialValues if it's not null or undefined
      if (value !== null && value !== undefined) {
        merged[key] = value;
      }
    });
    return merged;
  };
  const [values, setValues] = (0,external_wp_element_namespaceObject.useState)(initializeValues);
  const [errors, setErrors] = (0,external_wp_element_namespaceObject.useState)({});
  const [saving, setSaving] = (0,external_wp_element_namespaceObject.useState)(false);
  const [success, setSuccess] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);
  const {
    showSuccess,
    clearSuccess
  } = useSuccessTimeout();

  // Update values when initialValues change
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    setValues(initializeValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);
  const handleFieldChange = (fieldId, value) => {
    const newValues = {
      ...values,
      [fieldId]: value
    };
    setValues(newValues);
    setErrors({});
    setError(null);
    clearSuccess();
    setSuccess(false);

    // Call onChange callback if provided
    if (onChange) {
      onChange(newValues);
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Ensure all fields are included in values (even if not touched)
    // This prevents fields from being omitted when saving
    const completeValues = {
      ...values
    };
    fields.forEach(field => {
      // Handle undefined or null values (null shouldn't happen due to initialization, but be defensive)
      if (completeValues[field.id] === undefined || completeValues[field.id] === null) {
        // Use defaultValue if available, otherwise use type-specific defaults
        if (field.defaultValue !== undefined) {
          completeValues[field.id] = field.defaultValue;
        } else if (field.type === 'checkbox-group') {
          completeValues[field.id] = [];
        } else if (field.type === 'checkbox') {
          completeValues[field.id] = false;
        }
      }

      // Ensure checkbox-group fields are always arrays (defensive check)
      if (field.type === 'checkbox-group' && !Array.isArray(completeValues[field.id])) {
        completeValues[field.id] = [];
      }
    });

    // Client-side validation
    const validation = validateConfig(completeValues, fields);
    if (!validation.valid) {
      setErrors(validation.errors);
      setSaving(false);
      return;
    }
    try {
      // Call custom onSubmit if provided
      if (onSubmit) {
        await onSubmit(completeValues);
      } else {
        // Default: save to settings using /aether/site-exporter/settings endpoint
        // Get current providers settings
        const settingsResponse = await utils_api({
          path: '/aether/site-exporter/settings?key=providers'
        });
        if (!settingsResponse.success) {
          throw new Error('Failed to load current settings');
        }

        // Merge new provider settings with existing providers
        const currentProviders = settingsResponse.value || {};
        const updatedProviders = {
          ...currentProviders,
          [providerId]: completeValues
        };

        // Save updated providers object
        const saveResponse = await utils_api({
          path: '/aether/site-exporter/settings',
          method: 'POST',
          data: {
            key: 'providers',
            value: updatedProviders
          }
        });
        if (!saveResponse.success) {
          throw new Error(saveResponse.message || 'Failed to save settings');
        }
      }
      setSuccess(true);
      showSuccess(() => setSuccess(false));
    } catch (err) {
      setError(err.message || (0,external_wp_i18n_namespaceObject.__)('Failed to save settings', 'aether-site-exporter'));
    } finally {
      setSaving(false);
    }
  };
  const formStyle = {
    ...createFlexStyle('column', spacing.md)
  };
  const actionsStyle = {
    ...createFlexStyle('row', spacing.sm),
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.borderLight}`
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("form", {
    className: "aether-provider-form",
    onSubmit: handleSubmit,
    style: formStyle,
    children: [error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
      className: "aether-provider-form__notice aether-provider-form__notice--error",
      status: "error",
      isDismissible: true,
      onRemove: () => setError(null),
      children: error
    }), success && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
      className: "aether-provider-form__notice aether-provider-form__notice--success",
      status: "success",
      isDismissible: true,
      onRemove: () => setSuccess(false),
      children: (0,external_wp_i18n_namespaceObject.__)('Settings saved successfully!', 'aether-site-exporter')
    }), fields.map(field => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderField, {
      field: field,
      value: values[field.id],
      onChange: handleFieldChange,
      errors: errors
    }, field.id)), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-form__actions",
      style: actionsStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "aether-provider-form__submit-button",
        type: "submit",
        variant: "primary",
        isBusy: saving,
        disabled: saving,
        children: saving ? (0,external_wp_i18n_namespaceObject.__)('Saving…', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Save Settings', 'aether-site-exporter')
      })
    })]
  });
}
;// ./assets/src/admin-settings/components/ProviderConfigModal.js
/**
 * Provider Configuration Modal Component
 *
 * Modal dialog wrapping ProviderForm for configuring a provider.
 *
 * @package
 */








/**
 * Provider Configuration Modal Component.
 *
 * @param {Object}   props               Component props.
 * @param {boolean}  props.isOpen        Whether modal is open.
 * @param {Function} props.onClose       Close modal handler.
 * @param {Object}   props.provider      Provider metadata.
 * @param {Object}   props.initialConfig Initial configuration values.
 * @return {JSX.Element} Rendered modal component.
 */

function ProviderConfigModal({
  isOpen,
  onClose,
  provider,
  initialConfig = {}
}) {
  const [config, setConfig] = (0,external_wp_element_namespaceObject.useState)(initialConfig);
  const [hasChanges, setHasChanges] = (0,external_wp_element_namespaceObject.useState)(false);
  const [saveError, setSaveError] = (0,external_wp_element_namespaceObject.useState)(null);
  const closeTimeoutRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Reset config when modal opens/closes or provider changes
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (isOpen) {
      // Remove deployment_types from config since it's managed in sidebar
      // eslint-disable-next-line camelcase
      const {
        deployment_types,
        ...configWithoutDeploymentTypes
      } = initialConfig;
      setConfig(configWithoutDeploymentTypes);
      setHasChanges(false);
      setSaveError(null);
    } else if (closeTimeoutRef.current) {
      // Clear timeout if modal is closed
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, [isOpen, initialConfig]);
  if (!provider) {
    return null;
  }
  const {
    id,
    metadata,
    settingsFields
  } = provider;
  const {
    name,
    description
  } = metadata;

  // Filter out deployment_types field - it's now managed in the sidebar
  const filteredSettingsFields = settingsFields.filter(field => field.name !== 'deployment_types');
  const headerStyle = {
    marginBottom: spacing.md
  };
  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: fontWeight.semibold,
    color: colors.text,
    margin: 0,
    marginBottom: spacing.xs
  };
  const descriptionStyle = {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    margin: 0
  };
  const handleFormChange = newValues => {
    setConfig(newValues);
    setHasChanges(true);
  };
  const handleFormSubmit = async values => {
    // ProviderForm handles the save, but we need to preserve the enabled state
    // Get current provider config to preserve enabled state
    setSaveError(null);
    try {
      const configResponse = await utils_api({
        path: '/aether/site-exporter/settings?key=providers'
      });
      if (!configResponse.success) {
        throw new Error('Failed to load current settings');
      }
      const providerConfigs = configResponse.value || {};
      const currentConfig = providerConfigs[id] || {};
      const enabled = currentConfig.enabled !== false; // Default to enabled
      // Preserve deployment_types (managed in sidebar)
      // eslint-disable-next-line camelcase
      const deploymentTypes = currentConfig.deployment_types;

      // Merge form values with enabled state and deployment_types
      const updatedConfig = {
        ...values,
        enabled,
        ...(deploymentTypes && {
          deployment_types: deploymentTypes
        })
      };

      // Save with enabled state preserved
      const updatedProviders = {
        ...providerConfigs,
        [id]: updatedConfig
      };
      const saveResponse = await utils_api({
        path: '/aether/site-exporter/settings',
        method: 'POST',
        data: {
          key: 'providers',
          value: updatedProviders
        }
      });
      if (!saveResponse.success) {
        throw new Error(saveResponse.message || 'Failed to save settings');
      }
      setHasChanges(false);
      // Close modal after 2 seconds - parent will refresh configs
      closeTimeoutRef.current = setTimeout(() => {
        onClose();
        closeTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to save provider config:', err);
      setSaveError(err.message || (0,external_wp_i18n_namespaceObject.__)('Failed to save settings', 'aether-site-exporter'));
      // Re-throw error so ProviderForm can also handle it
      throw err;
    }
  };
  const handleClose = () => {
    // Clear any pending timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (hasChanges) {
      // Could show a confirmation dialog here
      // For now, just close and discard changes
    }
    setHasChanges(false);
    setSaveError(null);
    onClose();
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_wp_components_namespaceObject.Modal, {
    title: name,
    onRequestClose: handleClose,
    isFullScreen: false,
    className: "aether-provider-config-modal",
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      style: headerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h2", {
        style: titleStyle,
        children: name
      }), description && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        style: descriptionStyle,
        children: description
      })]
    }), saveError && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
      status: "error",
      isDismissible: true,
      onRemove: () => setSaveError(null),
      children: saveError
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderForm, {
      providerId: id,
      fields: filteredSettingsFields,
      initialValues: config,
      onChange: handleFormChange,
      onSubmit: handleFormSubmit
    })]
  });
}
;// ./assets/src/admin-settings/ProviderSettings.js
/**
 * Provider Settings Component
 *
 * Displays providers in a responsive grid layout with cards.
 * Each card shows provider summary with enable/disable toggle
 * and opens configuration in a modal.
 *
 * @package
 */









/**
 * Provider Settings Component.
 *
 * @param {Object}   props                Component props.
 * @param {Object}   props.providerConfigs Provider configurations from parent.
 * @param {Function} props.onConfigsUpdate Callback to update parent configs.
 * @return {JSX.Element} Rendered component.
 */

function ProviderSettings({
  providerConfigs = {},
  onConfigsUpdate
}) {
  const [providers, setProviders] = (0,external_wp_element_namespaceObject.useState)([]);
  const [loading, setLoading] = (0,external_wp_element_namespaceObject.useState)(true);
  const [selectedProvider, setSelectedProvider] = (0,external_wp_element_namespaceObject.useState)(null);
  const [isModalOpen, setIsModalOpen] = (0,external_wp_element_namespaceObject.useState)(false);
  const [searchQuery, setSearchQuery] = (0,external_wp_element_namespaceObject.useState)('');
  const [filterType, setFilterType] = (0,external_wp_element_namespaceObject.useState)('all');
  const configs = providerConfigs;

  // Reload providers when deployment types change (to get updated settings fields)
  // Extract deployment types from configs to watch for changes
  const deploymentTypesByProvider = Object.keys(configs).reduce((acc, providerId) => {
    const deploymentTypes = configs[providerId]?.deployment_types;
    if (Array.isArray(deploymentTypes)) {
      acc[providerId] = deploymentTypes.sort().join(',');
    }
    return acc;
  }, {});
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const reloadProviders = async () => {
      try {
        const providersResponse = await utils_api({
          path: '/aether/site-exporter/providers'
        });
        if (providersResponse.success && providersResponse.providers) {
          const providerMetadata = providersResponse.providers.map(provider => ({
            id: provider.id,
            metadata: {
              name: provider.name,
              description: provider.description,
              supportedDeploymentTypes: provider.deployment_types || [],
              type: provider.type,
              icon: ''
            },
            settingsFields: (provider.settings_fields || []).map(field => ({
              ...field,
              id: field.name
            }))
          }));
          setProviders(providerMetadata);

          // If a provider modal is open, update the selected provider with latest metadata
          if (selectedProvider) {
            const updatedProvider = providerMetadata.find(p => p.id === selectedProvider.id);
            if (updatedProvider) {
              setSelectedProvider(updatedProvider);
            }
          }
        }
      } catch (error) {
        console.error('Failed to reload providers:', error);
      }
    };

    // Only reload if we have configs (not on initial mount)
    if (Object.keys(configs).length > 0) {
      reloadProviders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(deploymentTypesByProvider)]);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    // Fetch providers from REST API (PHP registry is source of truth)
    const loadProviders = async () => {
      try {
        // Fetch provider metadata from REST API
        const providersResponse = await utils_api({
          path: '/aether/site-exporter/providers'
        });
        if (providersResponse.success && providersResponse.providers) {
          // Transform REST API response to match component expectations
          const providerMetadata = providersResponse.providers.map(provider => ({
            id: provider.id,
            metadata: {
              name: provider.name,
              description: provider.description,
              supportedDeploymentTypes: provider.deployment_types || [],
              type: provider.type,
              icon: '' // Icon not provided by PHP, can be added later if needed
            },
            // Transform settings_fields: map 'name' to 'id' for ProviderForm compatibility
            settingsFields: (provider.settings_fields || []).map(field => ({
              ...field,
              id: field.name // ProviderForm expects 'id' field
            }))
          }));
          setProviders(providerMetadata);
        }

        // Configs are now managed by parent component
        // If parent hasn't loaded them yet, trigger initial load
        if (onConfigsUpdate && Object.keys(configs).length === 0) {
          const configsResponse = await utils_api({
            path: '/aether/site-exporter/settings?key=providers'
          });
          if (configsResponse.success && configsResponse.value) {
            onConfigsUpdate(configsResponse.value);
          }
        }
      } catch (error) {
        console.error('Failed to load providers or configurations:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProviders();
  }, []);

  // Filter providers based on search and type filter
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = !searchQuery || provider.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) || provider.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || provider.metadata.type === filterType;
    return matchesSearch && matchesType;
  });

  // Get unique provider types for filter
  const providerTypes = [...new Set(providers.map(p => p.metadata.type))];

  // Count enabled and configured providers
  const enabledCount = providers.filter(p => configs[p.id]?.enabled !== false).length;
  const configuredCount = providers.filter(p => {
    const config = configs[p.id];
    return config && Object.keys(config).length > 0;
  }).length;
  const handleToggleProvider = async (providerId, enabled) => {
    try {
      // Get current config for this provider
      const currentConfig = configs[providerId] || {};

      // Update enabled state
      const updatedConfig = {
        ...currentConfig,
        enabled
      };

      // Get current providers settings
      const settingsResponse = await utils_api({
        path: '/aether/site-exporter/settings?key=providers'
      });
      if (!settingsResponse.success) {
        throw new Error('Failed to load current settings');
      }

      // Merge updated provider config
      const currentProviders = settingsResponse.value || {};
      const updatedProviders = {
        ...currentProviders,
        [providerId]: updatedConfig
      };

      // Save updated providers object
      const saveResponse = await utils_api({
        path: '/aether/site-exporter/settings',
        method: 'POST',
        data: {
          key: 'providers',
          value: updatedProviders
        }
      });
      if (!saveResponse.success) {
        throw new Error(saveResponse.message || 'Failed to save settings');
      }

      // Update parent configs state
      if (onConfigsUpdate) {
        onConfigsUpdate(updatedProviders);
      }
    } catch (error) {
      console.error('Failed to toggle provider:', error);
    }
  };
  const handleConfigureProvider = async provider => {
    // Reload provider metadata to get updated settings fields based on current deployment types
    try {
      const providerResponse = await utils_api({
        path: `/aether/site-exporter/providers/${provider.id}`
      });
      if (providerResponse.success && providerResponse.provider) {
        // Update the provider with latest metadata (including filtered settings fields)
        const updatedProvider = {
          ...provider,
          settingsFields: (providerResponse.provider.settings_fields || []).map(field => ({
            ...field,
            id: field.name // ProviderForm expects 'id' field
          }))
        };
        setSelectedProvider(updatedProvider);
        setIsModalOpen(true);
      } else {
        // Fallback to original provider if fetch fails
        setSelectedProvider(provider);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to reload provider metadata:', error);
      // Fallback to original provider if fetch fails
      setSelectedProvider(provider);
      setIsModalOpen(true);
    }
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    // Clear selected provider to unmount the modal immediately
    setSelectedProvider(null);
    // Reload configs to get latest values after a short delay
    // This ensures the modal is fully closed before reloading
    setTimeout(() => {
      utils_api({
        path: '/aether/site-exporter/settings?key=providers'
      }).then(response => {
        if (response.success && response.value && onConfigsUpdate) {
          onConfigsUpdate(response.value);
        }
      });
    }, 100);
  };
  if (loading) {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      style: {
        textAlign: 'center',
        padding: spacing.xl
      },
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Spinner, {})
    });
  }
  if (providers.length === 0) {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        style: {
          color: colors.textSecondary
        },
        children: (0,external_wp_i18n_namespaceObject.__)('No providers available. Install a provider plugin to enable deployment options.', 'aether-site-exporter')
      })
    });
  }
  const pageHeaderStyle = {
    marginBottom: spacing.lg,
    fontSize: '1.5rem',
    fontWeight: fontWeight.bold,
    color: colors.text
  };
  const pageDescriptionStyle = {
    marginBottom: spacing.lg,
    color: colors.textSecondary,
    fontSize: '0.875rem'
  };
  const controlsStyle = {
    display: 'flex',
    gap: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
    alignItems: 'center'
  };
  const statsStyle = {
    display: 'flex',
    gap: spacing.md,
    marginBottom: spacing.md,
    fontSize: '0.875rem',
    color: colors.textSecondary
  };
  const gridStyle = createGridStyle('280px', spacing.lg);
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h2", {
      style: pageHeaderStyle,
      children: (0,external_wp_i18n_namespaceObject.__)('Provider Settings', 'aether-site-exporter')
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
      style: pageDescriptionStyle,
      children: (0,external_wp_i18n_namespaceObject.__)('Configure deployment providers. Each provider can handle different deployment types (static sites, blueprint bundles, edge functions).', 'aether-site-exporter')
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      style: statsStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
        children: [(0,external_wp_i18n_namespaceObject.__)('Total:', 'aether-site-exporter'), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          children: providers.length
        })]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
        children: [(0,external_wp_i18n_namespaceObject.__)('Enabled:', 'aether-site-exporter'), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          children: enabledCount
        })]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
        children: [(0,external_wp_i18n_namespaceObject.__)('Configured:', 'aether-site-exporter'), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          children: configuredCount
        })]
      })]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      style: controlsStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.SearchControl, {
        value: searchQuery,
        onChange: setSearchQuery,
        placeholder: (0,external_wp_i18n_namespaceObject.__)('Search providers…', 'aether-site-exporter'),
        style: {
          maxWidth: '300px'
        }
      }), providerTypes.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("select", {
        value: filterType,
        onChange: e => setFilterType(e.target.value),
        style: {
          padding: `${spacing.sm} ${spacing.md}`,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: '4px'
        },
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("option", {
          value: "all",
          children: (0,external_wp_i18n_namespaceObject.__)('All Types', 'aether-site-exporter')
        }), providerTypes.map(type => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("option", {
          value: type,
          children: type
        }, type))]
      })]
    }), filteredProviders.length > 0 ? /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      style: gridStyle,
      children: filteredProviders.map(provider => {
        const providerConfig = configs[provider.id] || {};
        const enabled = providerConfig.enabled !== false; // Default to enabled

        return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderCard, {
          provider: provider,
          config: providerConfig,
          enabled: enabled,
          onToggle: newEnabled => handleToggleProvider(provider.id, newEnabled),
          onConfigure: () => handleConfigureProvider(provider)
        }, provider.id);
      })
    }) : /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
      style: {
        color: colors.textSecondary
      },
      children: (0,external_wp_i18n_namespaceObject.__)('No providers match your search criteria.', 'aether-site-exporter')
    }), selectedProvider && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderConfigModal, {
      isOpen: isModalOpen,
      onClose: handleModalClose,
      provider: selectedProvider,
      initialConfig: configs[selectedProvider.id] || {}
    })]
  });
}
;// ./assets/src/admin-settings/components/GlobalDeploymentTypes.js
/**
 * Per-Provider Deployment Types Component
 *
 * Allows setting deployment types for each provider individually.
 * All providers are displayed in a non-collapsible list.
 *
 * @package
 */








/**
 * Per-Provider Deployment Types Component.
 *
 * @param {Object}   props               Component props.
 * @param {Object}   props.providerConfigs Provider configurations from parent.
 * @param {Function} props.onConfigsUpdate Callback to update parent configs.
 * @return {JSX.Element} Rendered component.
 */

function GlobalDeploymentTypes({
  providerConfigs = {},
  onConfigsUpdate
}) {
  const [providers, setProviders] = (0,external_wp_element_namespaceObject.useState)([]);
  const [loading, setLoading] = (0,external_wp_element_namespaceObject.useState)(true);
  const [saving, setSaving] = (0,external_wp_element_namespaceObject.useState)({});
  const [errors, setErrors] = (0,external_wp_element_namespaceObject.useState)({});
  const configs = providerConfigs;
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    // Load providers and configs
    const loadData = async () => {
      try {
        // Fetch providers from REST API
        const providersResponse = await utils_api({
          path: '/aether/site-exporter/providers'
        });
        if (providersResponse.success && providersResponse.providers) {
          setProviders(providersResponse.providers);
        }

        // Configs are now passed as props from parent
      } catch (err) {
        console.error('Failed to load providers or configurations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Debounced save function
  const saveProviderDeploymentTypes = (0,external_wp_element_namespaceObject.useCallback)(async (providerId, deploymentTypes) => {
    // Clear any previous error
    setErrors(prev => {
      const newErrors = {
        ...prev
      };
      delete newErrors[providerId];
      return newErrors;
    });
    setSaving(prev => ({
      ...prev,
      [providerId]: true
    }));
    try {
      // Get current provider configs
      const configResponse = await utils_api({
        path: '/aether/site-exporter/settings?key=providers'
      });
      if (!configResponse.success) {
        throw new Error('Failed to load current settings');
      }
      const currentProviderConfigs = configResponse.value || {};
      const currentConfig = currentProviderConfigs[providerId] || {};

      // Update deployment types
      const updatedConfig = {
        ...currentConfig,
        deployment_types: deploymentTypes
      };

      // Save with enabled state preserved
      const updatedProviders = {
        ...currentProviderConfigs,
        [providerId]: updatedConfig
      };
      const saveResponse = await utils_api({
        path: '/aether/site-exporter/settings',
        method: 'POST',
        data: {
          key: 'providers',
          value: updatedProviders
        }
      });
      if (!saveResponse.success) {
        throw new Error(saveResponse.message || 'Failed to save settings');
      }

      // Update parent configs state
      if (onConfigsUpdate) {
        onConfigsUpdate(updatedProviders);
      }
    } catch (err) {
      console.error(`Failed to save deployment types for ${providerId}:`, err);
      setErrors(prev => ({
        ...prev,
        [providerId]: err.message || (0,external_wp_i18n_namespaceObject.__)('Failed to save settings', 'aether-site-exporter')
      }));
    } finally {
      setSaving(prev => {
        const newSaving = {
          ...prev
        };
        delete newSaving[providerId];
        return newSaving;
      });
    }
  }, [onConfigsUpdate]);
  const handleDeploymentTypeChange = (providerId, deploymentType, checked) => {
    const currentConfig = configs[providerId] || {};
    const currentTypes = currentConfig.deployment_types || [];
    let newTypes;
    if (checked) {
      // Add deployment type if not already present
      if (!currentTypes.includes(deploymentType)) {
        newTypes = [...currentTypes, deploymentType];
      } else {
        return; // Already in array
      }
    } else {
      // Remove deployment type
      newTypes = currentTypes.filter(type => type !== deploymentType);
    }

    // Save to server (parent will receive updated configs via callback)
    saveProviderDeploymentTypes(providerId, newTypes);
  };
  if (loading) {
    return null;
  }
  const headerStyle = {
    marginBottom: spacing.md,
    fontSize: '1.25rem',
    fontWeight: fontWeight.semibold,
    color: colors.text
  };
  const descriptionStyle = {
    marginBottom: spacing.lg,
    color: colors.textSecondary,
    fontSize: '0.875rem'
  };
  const providerItemStyle = {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.borderLight}`
  };
  const providerItemLastStyle = {
    ...providerItemStyle,
    borderBottom: 'none'
  };
  const providerNameStyle = {
    fontSize: '1rem',
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs
  };
  const providerDescriptionStyle = {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    marginBottom: spacing.sm
  };
  const checkboxesContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs
  };
  if (providers.length === 0) {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Card, {
      style: {
        marginBottom: 0
      },
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CardBody, {
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          style: {
            color: colors.textSecondary
          },
          children: (0,external_wp_i18n_namespaceObject.__)('No providers available.', 'aether-site-exporter')
        })
      })
    });
  }
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Card, {
    style: {
      marginBottom: 0
    },
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_wp_components_namespaceObject.CardBody, {
      style: {
        padding: 0
      },
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        style: {
          padding: spacing.lg
        },
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h3", {
          style: headerStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Deployment Types', 'aether-site-exporter')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
          style: descriptionStyle,
          children: (0,external_wp_i18n_namespaceObject.__)('Configure which deployment types each provider should handle.', 'aether-site-exporter')
        })]
      }), providers.filter(provider => {
        // Only show enabled providers
        const providerConfig = configs[provider.id] || {};
        return providerConfig.enabled !== false;
      }).map((provider, index, filteredProviders) => {
        const providerConfig = configs[provider.id] || {};
        const deploymentTypes = providerConfig.deployment_types || [];
        const supportedTypes = provider.deployment_types || [];
        const isLast = index === filteredProviders.length - 1;
        const isSaving = saving[provider.id] || false;
        const error = errors[provider.id];
        return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          style: isLast ? providerItemLastStyle : providerItemStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
            style: providerNameStyle,
            children: [provider.name, isSaving && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
              style: {
                marginLeft: spacing.sm,
                color: colors.textSecondary,
                fontSize: '0.875rem',
                fontWeight: fontWeight.normal
              },
              children: (0,external_wp_i18n_namespaceObject.__)('Saving…', 'aether-site-exporter')
            })]
          }), provider.description && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
            style: providerDescriptionStyle,
            children: provider.description
          }), error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
            status: "error",
            isDismissible: true,
            onRemove: () => setErrors(prev => {
              const newErrors = {
                ...prev
              };
              delete newErrors[provider.id];
              return newErrors;
            }),
            style: {
              marginBottom: spacing.sm
            },
            children: error
          }), supportedTypes.length > 0 ? /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
            style: checkboxesContainerStyle,
            children: supportedTypes.map(type => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CheckboxControl, {
              label: DEPLOYMENT_TYPE_LABELS[type] || type,
              checked: deploymentTypes.includes(type),
              onChange: checked => handleDeploymentTypeChange(provider.id, type, checked),
              disabled: isSaving,
              __nextHasNoMarginBottom: true
            }, type))
          }) : /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
            style: {
              color: colors.textSecondary,
              fontSize: '0.875rem',
              fontStyle: 'italic'
            },
            children: (0,external_wp_i18n_namespaceObject.__)('No deployment types supported.', 'aether-site-exporter')
          })]
        }, provider.id);
      })]
    })
  });
}
;// ./assets/src/admin-settings/AdminSettings.js
/**
 * Admin Settings Main Component
 *
 * Main admin settings page container.
 *
 * @package
 */










function AdminSettings() {
  const [isExportModalOpen, setIsExportModalOpen] = (0,external_wp_element_namespaceObject.useState)(false);
  const [providerConfigs, setProviderConfigs] = (0,external_wp_element_namespaceObject.useState)({});

  // Load provider configs on mount
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const loadConfigs = async () => {
      try {
        const configsResponse = await utils_api({
          path: '/aether/site-exporter/settings?key=providers'
        });
        if (configsResponse.success && configsResponse.value) {
          setProviderConfigs(configsResponse.value);
        }
      } catch (err) {
        console.error('Failed to load provider configs:', err);
      }
    };
    loadConfigs();
  }, []);

  // Callback to update configs when a provider is toggled or configured
  const handleConfigsUpdate = (0,external_wp_element_namespaceObject.useCallback)(updatedConfigs => {
    setProviderConfigs(updatedConfigs);
  }, []);
  const containerStyle = {
    padding: '1.25rem',
    maxWidth: '100%'
  };
  const headingStyle = {
    marginBottom: spacing.xl,
    fontSize: '1.75rem',
    fontWeight: fontWeight.semibold,
    color: colors.text
  };
  const layoutStyle = {
    display: 'flex',
    gap: spacing.xl,
    alignItems: 'flex-start'
  };
  const mainContentStyle = {
    flex: 1,
    minWidth: 0 // Prevents flex item from overflowing
  };
  const sidebarStyle = {
    width: '300px',
    flexShrink: 0
  };
  const sidebarContentStyle = {
    ...createFlexStyle('column', spacing.lg),
    position: 'sticky',
    top: spacing.lg
  };
  const sectionsStyle = {
    ...createFlexStyle('column', spacing.lg)
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-admin-settings",
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h1", {
      className: "aether-admin-settings__heading",
      style: headingStyle,
      children: (0,external_wp_i18n_namespaceObject.__)('Aether Site Exporter Settings', 'aether-site-exporter')
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      style: layoutStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        style: mainContentStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          style: sectionsStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
            status: "info",
            isDismissible: false,
            children: (0,external_wp_i18n_namespaceObject.__)('Aether Site Exporter allows you to export your WordPress site as a complete package.', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderSettings, {
            providerConfigs: providerConfigs,
            onConfigsUpdate: handleConfigsUpdate
          })]
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        style: sidebarStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          style: sidebarContentStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
            variant: "primary",
            onClick: () => setIsExportModalOpen(true),
            style: {
              width: '100%'
            },
            children: (0,external_wp_i18n_namespaceObject.__)('Export Site', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(GlobalDeploymentTypes, {
            providerConfigs: providerConfigs,
            onConfigsUpdate: handleConfigsUpdate
          })]
        })
      })]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(PublishProgressModal, {
      isOpen: isExportModalOpen,
      onClose: () => setIsExportModalOpen(false)
    })]
  });
}
;// ./assets/src/components/ErrorBoundary.js
/**
 * Error Boundary Component
 *
 * Catches errors in React component tree and displays a fallback UI
 * instead of crashing the entire application.
 *
 * @package
 */






/**
 * Error Boundary component
 */

class ErrorBoundary extends external_wp_element_namespaceObject.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    debugError('Error caught by ErrorBoundary:', {
      error,
      errorInfo
    });
    this.setState({
      error,
      errorInfo
    });

    // Optionally send to error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };
  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.resetError
        });
      }

      // Default fallback UI
      const containerStyle = {
        padding: spacing.lg
      };
      const noticeStyle = {
        ...noticeStyles.error,
        padding: spacing.md + ' ' + spacing.lg,
        margin: spacing.lg + ' 0'
      };
      const headingStyle = {
        margin: '0 0 ' + spacing.sm,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        color: colors.text
      };
      const paragraphStyle = {
        margin: '0 0 ' + spacing.sm,
        color: colors.text
      };
      return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-error-boundary",
        style: containerStyle,
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
          className: "aether-error-boundary__notice",
          style: noticeStyle,
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h2", {
            className: "aether-error-boundary__heading",
            style: headingStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('Something went wrong', 'aether-site-exporter')
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
            className: "aether-error-boundary__message",
            style: paragraphStyle,
            children: (0,external_wp_i18n_namespaceObject.__)('An unexpected error occurred. Please try refreshing the page.', 'aether')
          }), this.state.error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("details", {
            className: "aether-error-boundary__details",
            style: {
              marginTop: spacing.lg
            },
            children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("summary", {
              className: "aether-error-boundary__summary",
              children: (0,external_wp_i18n_namespaceObject.__)('Error details', 'aether-site-exporter')
            }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("pre", {
              className: "aether-error-boundary__error-text",
              style: {
                marginTop: spacing.lg,
                padding: spacing.lg,
                background: colors.backgroundLighter,
                overflow: 'auto',
                fontSize: fontSize.sm
              },
              children: [this.state.error.toString(), this.state.errorInfo && this.state.errorInfo.componentStack]
            })]
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("button", {
            type: "button",
            className: "aether-error-boundary__retry-button",
            onClick: this.resetError,
            style: {
              marginTop: spacing.lg,
              padding: spacing.sm + ' ' + spacing.lg,
              background: colors.primary,
              color: colors.white,
              border: `1px solid ${colors.primary}`,
              borderRadius: borderRadius.sm,
              cursor: 'pointer',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.normal,
              lineHeight: 1.5
            },
            children: (0,external_wp_i18n_namespaceObject.__)('Try again', 'aether-site-exporter')
          })]
        })
      });
    }
    return this.props.children;
  }
}
/* harmony default export */ const components_ErrorBoundary = (ErrorBoundary);
;// ./assets/src/admin-settings/index.js
/**
 * Admin Settings Entry Point
 *
 * Loads providers via dynamic imports and renders the AdminSettings component.
 * Providers are imported directly here rather than via PHP-enqueued scripts
 * to ensure they register before the component queries the provider registry.
 *
 * @package
 */

// Set webpack publicPath before any imports (for asset loading)
// Note: Webpack is configured to never create chunks - all code is bundled into single files
// eslint-disable-next-line camelcase, no-undef
if (true) {
  const pluginUrlMeta = document.querySelector('meta[name="aether-plugin-url"]');
  if (pluginUrlMeta) {
    const pluginUrl = pluginUrlMeta.getAttribute('content');
    // Ensure plugin URL ends with slash
    const publicPath = pluginUrl.endsWith('/') ? pluginUrl + 'assets/build/' : pluginUrl + '/assets/build/';
    // eslint-disable-next-line camelcase, no-undef
    __webpack_require__.p = publicPath;
  }
}





// Providers are registered via PHP using the 'aether_providers' filter.
// JavaScript providers register implementation hooks (aether.provider.upload, aether.provider.test, etc.).

/**
 * Initialize admin settings page.
 *
 * @return {void}
 */

const init = () => {
  const container = document.getElementById('aether-admin-settings');
  if (!container) {
    return;
  }
  (0,external_wp_element_namespaceObject.render)(/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ErrorBoundary, {
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(PublishProvider, {
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(AdminSettings, {})
    })
  }), container);
};
init();
/******/ })()
;