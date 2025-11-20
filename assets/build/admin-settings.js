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
          debug(`[WpOrgCache] Cleaned up ${deleted} expired cache entries`);
        }
        return deleted;
      } catch (error) {
        debugError('[WpOrgCache] Error during cleanup:', error);
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
;// ./assets/src/utils/storage.js
/**
 * Storage Abstraction Layer
 *
 * Provides a testable abstraction over localStorage with:
 * - Automatic JSON serialization/deserialization
 * - Error handling for quota exceeded and other errors
 * - Consistent API that can be easily mocked in tests
 * - Support for default values
 *
 * @package
 */

/**
 * Storage abstraction object.
 *
 * @type {Object}
 */
const storage = {
  /**
   * Get a value from storage.
   *
   * @param {string} key          Storage key.
   * @param {*}      defaultValue Optional default value if key doesn't exist or parse fails.
   * @return {*} Parsed value, default value, or null.
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      try {
        return JSON.parse(item);
      } catch (parseError) {
        // If JSON parsing fails, return default value
        return defaultValue;
      }
    } catch (error) {
      // Handle localStorage access errors
      return defaultValue;
    }
  },
  /**
   * Set a value in storage.
   *
   * @param {string} key   Storage key.
   * @param {*}      value Value to store (will be JSON serialized).
   * @return {boolean} True on success, false on error.
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      // Handle quota exceeded, circular references, or other errors
      return false;
    }
  },
  /**
   * Remove a value from storage.
   *
   * @param {string} key Storage key.
   * @return {boolean} True on success, false on error.
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  },
  /**
   * Clear all storage.
   *
   * @return {boolean} True on success, false on error.
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  },
  /**
   * Check if a key exists in storage.
   *
   * @param {string} key Storage key.
   * @return {boolean} True if key exists, false otherwise.
   */
  has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  },
  /**
   * Get all keys in storage.
   *
   * @return {Array<string>} Array of storage keys.
   */
  keys() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      return [];
    }
  }
};
;// ./assets/src/services/PublishAPIService.js
/**
 * Publish API Service
 *
 * Service for publish-related API operations.
 * Extracted from usePublishAPI hook for testability.
 *
 * @package
 */

const CHANGED_ASSETS_KEY = 'aether_changed_assets';

/**
 * Publish API Service Class
 *
 * Handles publish-related API calls and asset tracking.
 */
class PublishAPIService {
  /**
   * Create service instance
   *
   * @param {Function} apiFetch WordPress apiFetch function (injectable for testing)
   * @param {Object} assetDiscovery Asset discovery service
   * @param {Object} storage Storage implementation (injectable for testing)
   */
  constructor(apiFetch, assetDiscovery, storage) {
    this.apiFetch = apiFetch;
    this.assetDiscovery = assetDiscovery;
    this.storage = storage;
  }

  /**
   * Discover custom assets
   *
   * Uses browser-based asset discovery instead of PHP endpoint.
   * This avoids HTTP requests that fail in WordPress Playground.
   *
   * @return {Promise<Object>} Discovery response with assets array
   */
  async discoverAssets() {
    const customAssets = await this.assetDiscovery.discoverCustomAssets();
    return {
      success: true,
      assets: customAssets,
      count: customAssets.length
    };
  }

  /**
   * Mark asset as changed
   *
   * Stores changed assets in localStorage.
   * No server call needed - browser-only tracking.
   *
   * @param {string} type Asset type (theme, plugin)
   * @param {string} slug Asset slug
   * @return {Object} Success response
   */
  markAssetChanged(type, slug) {
    // Get current changed assets
    const changedAssets = this.storage.get(CHANGED_ASSETS_KEY, []);
    const key = `${type}:${slug}`;

    // Add if not already present
    if (!changedAssets.includes(key)) {
      changedAssets.push(key);
      this.storage.set(CHANGED_ASSETS_KEY, changedAssets);
    }
    return {
      success: true,
      message: `Marked ${type} ${slug} as changed`
    };
  }
}
;// ./assets/src/publish/hooks/usePublishAPI.js
/**
 * Publish API Hook
 *
 * Handles API calls for publish operations.
 * Uses PublishAPIService for all business logic.
 *
 * @package
 */






function usePublishAPI() {
  const assetDiscovery = useAssetDiscovery();

  // Create service instance (memoized to prevent recreation)
  const service = (0,external_wp_element_namespaceObject.useMemo)(() => new PublishAPIService(utils_api, assetDiscovery, storage), [assetDiscovery]);
  const discoverAssets = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    return await service.discoverAssets();
  }, [service]);

  // getAssetStatus is an alias for discoverAssets (eliminates duplication)
  const getAssetStatus = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    return await service.discoverAssets();
  }, [service]);
  const markAssetChanged = (0,external_wp_element_namespaceObject.useCallback)((type, slug) => {
    return Promise.resolve(service.markAssetChanged(type, slug));
  }, [service]);
  return {
    discoverAssets,
    getAssetStatus,
    markAssetChanged
  };
}
;// ./assets/src/services/AssetManagerService.js
/**
 * Asset Manager Service
 *
 * Service for managing asset state with pure business logic.
 * Extracted from useAssetManager hook for testability.
 *
 * @package
 */

const STORAGE_KEY = 'aetherAssets';

/**
 * Normalize asset data from server
 *
 * Converts snake_case fields to camelCase and ensures existsOnR2 is present.
 * Pure function for data transformation.
 *
 * @param {Object} assetData Raw asset data from server
 * @return {Object} Normalized asset data
 */
function normalizeAssetData(assetData) {
  if (!assetData || typeof assetData !== 'object') {
    return {
      existsOnR2: false
    };
  }
  const {
    exists_on_r2,
    existsOnR2,
    ...rest
  } = assetData;
  return {
    ...rest,
    existsOnR2: existsOnR2 || exists_on_r2 || false
  };
}

/**
 * Calculate if asset needs upload
 *
 * Pure function to determine upload necessity based on R2 existence.
 *
 * @param {boolean} existsOnR2 Whether asset exists on R2
 * @return {boolean} Whether asset needs upload
 */
function calculateNeedsUpload(existsOnR2) {
  return !existsOnR2;
}

/**
 * Create new asset object
 *
 * Pure function for creating asset with consistent structure.
 *
 * @param {string} type Asset type (theme, plugin)
 * @param {string} slug Asset slug
 * @param {string} name Asset name (optional)
 * @param {boolean} existsOnR2 Whether asset exists on R2 (optional)
 * @return {Object} New asset object
 */
function createAsset(type, slug, name = undefined, existsOnR2 = false) {
  const asset = {
    type,
    slug,
    needsUpload: calculateNeedsUpload(existsOnR2)
  };
  if (name !== undefined) {
    asset.name = name;
  }
  if (existsOnR2 !== undefined) {
    asset.existsOnR2 = existsOnR2;
  }
  return asset;
}

/**
 * Merge asset data
 *
 * Pure function for merging existing asset with updated data.
 *
 * @param {Object} existing Existing asset object
 * @param {Object} updated Updated asset data
 * @param {Object} options Merge options
 * @param {boolean} options.preserveNeedsUpload Preserve existing needsUpload flag
 * @return {Object} Merged asset
 */
function mergeAsset(existing, updated, options = {}) {
  const {
    preserveNeedsUpload = false
  } = options;

  // If no existing asset, treat updated as new
  if (!existing) {
    const normalized = normalizeAssetData(updated);
    return {
      ...normalized,
      needsUpload: calculateNeedsUpload(normalized.existsOnR2)
    };
  }

  // If no update, return existing
  if (!updated) {
    return existing;
  }

  // Normalize updated data
  const normalized = normalizeAssetData(updated);

  // Merge data
  const merged = {
    ...existing,
    ...normalized
  };

  // Calculate or preserve needsUpload
  if (preserveNeedsUpload && 'needsUpload' in existing) {
    merged.needsUpload = existing.needsUpload;
  } else if ('existsOnR2' in merged) {
    merged.needsUpload = calculateNeedsUpload(merged.existsOnR2);
  }
  return merged;
}

/**
 * Filter assets that need upload
 *
 * Pure function to extract changed assets as type:slug strings.
 *
 * @param {Object} assets Assets object
 * @return {Array<string>} Array of "type:slug" strings
 */
function filterChangedAssets(assets) {
  if (!assets || typeof assets !== 'object') {
    return [];
  }
  return Object.values(assets).filter(asset => asset && asset.needsUpload).map(asset => `${asset.type}:${asset.slug}`);
}

/**
 * Clear all upload flags
 *
 * Pure function to set needsUpload=false for all assets.
 *
 * @param {Object} assets Assets object
 * @return {Object} New assets object with cleared flags
 */
function clearAllUploadFlags(assets) {
  if (!assets || typeof assets !== 'object') {
    return {};
  }
  const cleared = {};
  Object.keys(assets).forEach(slug => {
    cleared[slug] = {
      ...assets[slug],
      needsUpload: false
    };
  });
  return cleared;
}

/**
 * Asset Manager Service Class
 *
 * Handles asset state operations with localStorage integration.
 */
class AssetManagerService {
  /**
   * Create service instance
   *
   * @param {Object} storage Storage implementation (injectable for testing)
   */
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Load assets from storage
   *
   * @return {Object} Assets object
   */
  load() {
    return this.storage.get(STORAGE_KEY, {});
  }

  /**
   * Save assets to storage
   *
   * @param {Object} assets Assets to save
   * @return {void}
   */
  save(assets) {
    this.storage.set(STORAGE_KEY, assets);
  }

  /**
   * Mark asset as changed (needs upload)
   *
   * @param {Object} currentAssets Current assets state
   * @param {string} type Asset type
   * @param {string} slug Asset slug
   * @return {Object} Updated assets state
   */
  markAsChanged(currentAssets, type, slug) {
    const updated = {
      ...currentAssets
    };
    const existingAsset = updated[slug];
    updated[slug] = existingAsset ? {
      ...existingAsset,
      needsUpload: true
    } : createAsset(type, slug);
    return updated;
  }

  /**
   * Update asset from server data
   *
   * @param {Object} currentAssets Current assets state
   * @param {Object} assetData Server asset data
   * @return {Object} Updated assets state
   */
  updateFromServer(currentAssets, assetData) {
    const normalized = normalizeAssetData(assetData);
    const {
      slug
    } = normalized;
    const updated = {
      ...currentAssets
    };
    const existingAsset = updated[slug];
    updated[slug] = mergeAsset(existingAsset, normalized);
    return updated;
  }

  /**
   * Sync multiple assets from server
   *
   * @param {Object} currentAssets Current assets state
   * @param {Array} serverAssets Array of server asset data
   * @return {Object} Updated assets state
   */
  syncWithServer(currentAssets, serverAssets) {
    if (!Array.isArray(serverAssets)) {
      return currentAssets;
    }
    const updated = {
      ...currentAssets
    };
    serverAssets.forEach(assetData => {
      const normalized = normalizeAssetData(assetData);
      const {
        slug
      } = normalized;
      const existingAsset = updated[slug];

      // Preserve needsUpload if asset was locally marked as changed
      updated[slug] = mergeAsset(existingAsset, normalized, {
        preserveNeedsUpload: !!existingAsset?.needsUpload
      });
    });
    return updated;
  }
}
;// ./assets/src/publish/hooks/useAssetManager.js
/**
 * Asset Manager Hook
 *
 * Manages asset state in localStorage.
 * Uses AssetManagerService for all business logic.
 *
 * @package
 */




function useAssetManager() {
  const [assets, setAssets] = (0,external_wp_element_namespaceObject.useState)({});

  // Create service instance (memoized to prevent recreation)
  const service = (0,external_wp_element_namespaceObject.useMemo)(() => new AssetManagerService(storage), []);

  // Load assets from localStorage on mount
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const data = service.load();
    setAssets(data);
  }, [service]);

  // Save assets to localStorage whenever they change
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    service.save(assets);
  }, [service, assets]);
  const markAsChanged = (0,external_wp_element_namespaceObject.useCallback)((type, slug) => {
    setAssets(prev => service.markAsChanged(prev, type, slug));
  }, [service]);
  const updateFromServer = (0,external_wp_element_namespaceObject.useCallback)(assetData => {
    setAssets(prev => service.updateFromServer(prev, assetData));
  }, [service]);
  const syncWithServer = (0,external_wp_element_namespaceObject.useCallback)(serverAssets => {
    setAssets(prev => service.syncWithServer(prev, serverAssets));
  }, [service]);
  const getChangedAssets = (0,external_wp_element_namespaceObject.useCallback)(() => {
    return filterChangedAssets(assets);
  }, [assets]);
  const clearUploadFlags = (0,external_wp_element_namespaceObject.useCallback)(() => {
    setAssets(prev => clearAllUploadFlags(prev));
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
// EXTERNAL MODULE: external ["wp","hooks"]
var external_wp_hooks_ = __webpack_require__(619);
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
    this.providerId = config.provider_id || null;
  }

  /**
   * Add provider prefix to a storage key.
   *
   * Ensures isolated storage paths for each provider.
   * Example: 'static/index.html' → 'cloudflare-r2/static/index.html'
   *
   * Note: Local filesystem providers don't need prefixing since they use
   * different base paths (static/, static2/, static3/) for isolation.
   *
   * @param {string} key Original storage key.
   * @return {string} Prefixed storage key.
   */
  _prefixKey(key) {
    if (!this.providerId) {
      return key;
    }

    // Skip prefixing for local-filesystem providers
    // They use different base paths for isolation (e.g., static/, static2/, static3/)
    if (this.providerId.startsWith('local-filesystem:')) {
      return key;
    }

    // Don't double-prefix
    if (key.startsWith(this.providerId + '/')) {
      return key;
    }
    return `${this.providerId}/${key}`;
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
    const prefixedKey = this._prefixKey(key);
    const result = await uploadFile(this.staticPath, prefixedKey, file, options);
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
    const prefixedKey = this._prefixKey(key);
    return deleteFile(this.staticPath, prefixedKey, {
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
    const prefixedSourceKey = this._prefixKey(sourceKey);
    const prefixedDestKey = this._prefixKey(destKey);
    return copyFile(this.staticPath, prefixedSourceKey, prefixedDestKey);
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
    const prefixedPrefix = this._prefixKey(prefix);
    return listObjects(this.staticPath, prefixedPrefix, limit);
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
    // Use provider-specific manifest filename to ensure isolation between providers
    const manifestKey = this.providerId ? `file-manifest-${this.providerId}.json` : 'file-manifest.json';
    const prefixedManifestKey = this._prefixKey(manifestKey);
    try {
      const blob = await downloadFile(this.staticPath, prefixedManifestKey, {
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
    // Use provider-specific manifest filename to ensure isolation between providers
    const manifestKey = this.providerId ? `file-manifest-${this.providerId}.json` : 'file-manifest.json';
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

  // STEP 2: Remove dynamic WordPress links (RSS comments feed, REST API, XML-RPC).
  // These features don't exist in static exports.
  html = removeDynamicWpLinks(html);

  // STEP 3: Replace all internal URLs (absolute → relative or custom domain).
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
'imagedelivery.net' // External CDN (imagedelivery.net)
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
;// ./assets/src/utils/manifestManager.js
/**
 * Manifest Manager Utility
 *
 * Manages the file manifest JSON that tracks file sizes and hashes
 * for upload optimization. The manifest is stored remotely at
 * file-manifest.json in each provider's storage location.
 *
 * @package
 */



/**
 * Fetch existing manifest from remote storage.
 *
 * @param {Object} storageService StorageService instance.
 * @return {Promise<Object>} Manifest object (empty object if not found).
 */
async function fetchManifest(storageService) {
  const manifestKey = 'file-manifest.json';
  try {
    debug('Fetching manifest from remote:', manifestKey);

    // Try to download manifest from storage.
    const manifestBlob = await storageService.downloadManifest();
    if (!manifestBlob) {
      debug('Manifest not found, starting with empty manifest');
      return {};
    }

    // Parse JSON from blob.
    const manifestText = await manifestBlob.text();
    const manifest = JSON.parse(manifestText);
    debug('Manifest fetched successfully:', {
      fileCount: Object.keys(manifest).length
    });
    return manifest || {};
  } catch (error) {
    // If manifest doesn't exist (404) or other error, start with empty manifest.
    if (error.message && error.message.includes('404')) {
      debug('Manifest not found (404), starting with empty manifest');
      return {};
    }
    debug_debugWarn('Failed to fetch manifest, starting with empty manifest:', error);
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
 * Upload manifest to remote storage.
 *
 * @param {Object} storageService StorageService instance.
 * @param {Object} manifest       Manifest object to upload.
 * @return {Promise<boolean>} True if upload succeeded.
 */
async function uploadManifest(storageService, manifest) {
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
      /**
       * Action fired before each file upload.
       *
       * @param {Object} fileData             File data object.
       * @param {string} fileData.key         Storage key.
       * @param {Blob}   fileData.blob        File blob.
       * @param {string} fileData.contentType Content type.
       * @param {string} fileData.displayName Display name.
       *
       * @example
       * import { addAction } from '@wordpress/hooks';
       *
       * addAction('aether.upload.file.before', 'my-provider', (fileData) => {
       *   console.log('About to upload:', fileData.key);
       * });
       */
      (0,external_wp_hooks_.doAction)('aether.upload.file.before', {
        key,
        blob,
        contentType,
        displayName
      });

      // Hash checking and skip logic (if enabled)
      if (!skipHashCheck && manifest) {
        const fileSize = blob.size;
        const existingEntry = manifest[key];
        if (existingEntry && existingEntry.size === fileSize) {
          // Stage 2: Calculate hash if size matches
          try {
            /**
             * Filter hash calculation for files.
             *
             * Allows providers to customize hash calculation or provide pre-calculated hash.
             *
             * @param {string|null} hash     Calculated hash or null to use default calculation.
             * @param {Blob}        blob     File blob.
             * @param {string}      key      Storage key.
             * @param {Object}      manifest Manifest object.
             *
             * @example
             * import { addFilter } from '@wordpress/hooks';
             *
             * addFilter('aether.upload.hash.calculate', 'my-provider', (hash, blob, key, manifest) => {
             *   // Return pre-calculated hash or null to use default
             *   if (key.startsWith('custom/')) {
             *     return 'pre-calculated-hash';
             *   }
             *   return hash; // Use default calculation
             * });
             */
            const filteredHash = (0,external_wp_hooks_.applyFilters)('aether.upload.hash.calculate', null, blob, key, manifest);
            fileHash = filteredHash || (await fileHash_calculateFileHash(blob));
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
          /**
           * Filter hash calculation for files (when not already calculated).
           *
           * Allows providers to customize hash calculation.
           *
           * @param {string|null} hash     Calculated hash or null to use default calculation.
           * @param {Blob}        blob     File blob.
           * @param {string}      key      Storage key.
           * @param {Object}      manifest Manifest object.
           */
          const filteredHash = (0,external_wp_hooks_.applyFilters)('aether.upload.hash.calculate', null, blob, key, manifest);
          fileHash = filteredHash || (await fileHash_calculateFileHash(blob));
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

      // Prepare upload options
      let uploadOptions = {
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
      };

      /**
       * Filter upload options before file upload.
       *
       * Allows providers to modify upload options (contentType, cacheControl, metadata, etc.).
       *
       * @param {Object} uploadOptions Upload options object.
       * @param {string} key           Storage key.
       * @param {Blob}   blob          File blob.
       * @param {string} contentType   Content type.
       * @param {Object} metadata      File metadata.
       *
       * @example
       * import { addFilter } from '@wordpress/hooks';
       *
       * addFilter('aether.upload.file.options', 'my-provider', (options, key, blob, contentType, metadata) => {
       *   return {
       *     ...options,
       *     cacheControl: 'public, max-age=86400',
       *     customHeader: 'value'
       *   };
       * });
       */
      uploadOptions = (0,external_wp_hooks_.applyFilters)('aether.upload.file.options', uploadOptions, key, blob, contentType, metadata);

      // Upload file with progress tracking
      const uploadResult = await storageService.upload(key, blob, uploadOptions);
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
        const uploadResultData = {
          key,
          success: true,
          skipped: false,
          url: uploadResult.url,
          hash: fileHash,
          size: fileSize
        };

        /**
         * Action fired after each file upload succeeds.
         *
         * @param {Object} result      Upload result object.
         * @param {string} result.key  Storage key.
         * @param {string} result.url  Uploaded file URL.
         * @param {string} result.hash File hash.
         * @param {number} result.size File size.
         * @param {string} displayName Display name.
         *
         * @example
         * import { addAction } from '@wordpress/hooks';
         *
         * addAction('aether.upload.file.after', 'my-provider', (result, displayName) => {
         *   console.log('File uploaded:', result.key, result.url);
         * });
         */
        (0,external_wp_hooks_.doAction)('aether.upload.file.after', uploadResultData, displayName);
        results.push(uploadResultData);
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
      const discoveredStaticSiteProviderId = await providerDiscovery.getProviderForDeploymentType('static_site');

      // Use instance ID parameter if provided (multi-instance support)
      // Otherwise use discovered provider type (legacy single-instance)
      const providerIdToUse = staticSiteProviderId || discoveredStaticSiteProviderId;
      if (providerIdToUse) {
        const configResponse = await utils_api({
          path: `/aether/site-exporter/providers/${providerIdToUse}`
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
      base_url: staticSiteUrl || siteUrl,
      provider_id: staticSiteProviderId
    };
    debug('Static site storage configuration:', {
      staticPath,
      providerId: staticSiteProviderId
    });

    /**
     * Filter storage service configuration before creation.
     *
     * Allows providers to customize storage service configuration.
     *
     * @param {Object} config               Storage service configuration.
     * @param {string} staticPath           Static files path.
     * @param {string} staticSiteProviderId Provider ID.
     * @param {Object} providerConfig       Provider configuration.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.storage.service.config', 'my-provider', (config, staticPath, providerId, providerConfig) => {
     *   return {
     *     ...config,
     *     customOption: 'value'
     *   };
     * });
     */
    const filteredConfig = (0,external_wp_hooks_.applyFilters)('aether.storage.service.config', config, staticPath, staticSiteProviderId, providerConfig);

    /**
     * Filter storage service creation.
     *
     * Allows providers to override StorageService creation with custom implementation.
     *
     * @param {StorageService|null} storageService Storage service instance or null to use default.
     * @param {string}              staticPath     Static files path.
     * @param {Object}              config         Storage service configuration.
     * @param {string}              providerId     Provider ID.
     *
     * @example
     * import { addFilter } from '@wordpress/hooks';
     *
     * addFilter('aether.storage.service.create', 'my-provider', (service, staticPath, config, providerId) => {
     *   if (providerId === 'my-provider') {
     *     return new CustomStorageService(staticPath, config);
     *   }
     *   return service; // Use default
     * });
     */
    let storageService = (0,external_wp_hooks_.applyFilters)('aether.storage.service.create', null, staticPath, filteredConfig, staticSiteProviderId);

    // Create storage service if not overridden by filter
    if (!storageService) {
      storageService = new StorageService(staticPath, '', filteredConfig);
    }
    const totalUrls = urls.length;

    // PHASE 1: Pre-scan all URLs to discover total file count
    // This allows us to report accurate progress (X of Y files) instead of growing totals

    /**
     * Action fired before pre-scan phase starts.
     *
     * @param {Array}  urls                 URLs to scan.
     * @param {string} staticSiteProviderId Provider ID.
     * @param {Object} providerConfig       Provider configuration.
     *
     * @example
     * import { addAction } from '@wordpress/hooks';
     *
     * addAction('aether.static.pre_scan.before', 'my-provider', (urls, providerId, config) => {
     *   console.log('Starting pre-scan for', urls.length, 'URLs');
     * });
     */
    (0,external_wp_hooks_.doAction)('aether.static.pre_scan.before', urls, staticSiteProviderId, providerConfig);
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

        /**
         * Filter raw HTML before caching.
         *
         * Allows providers to modify HTML before caching.
         * NOTE: URL rewriting happens later during upload, per-provider.
         *
         * @param {string} html    Raw HTML content.
         * @param {string} url     Page URL.
         * @param {string} siteUrl Site URL.
         *
         * @example
         * import { addFilter } from '@wordpress/hooks';
         *
         * addFilter('aether.static.html.raw', 'my-provider', (html, url, siteUrl) => {
         *   // Add custom meta tag
         *   return html.replace('</head>', '<meta name="custom" content="value" /></head>');
         * });
         */
        const filteredRawHtml = (0,external_wp_hooks_.applyFilters)('aether.static.html.raw', html, url, siteUrl);

        // Cache RAW HTML (before URL rewriting) and asset URLs in IndexedDB
        // URL rewriting will happen per-provider during upload phase
        // No size limit - IndexedDB can handle thousands of URLs
        await cache.set(url, filteredRawHtml, assetUrls);
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

    /**
     * Action fired after pre-scan phase completes.
     *
     * @param {Object} stats                Pre-scan statistics.
     * @param {number} stats.urlsScanned    Total URLs scanned.
     * @param {number} stats.urlsSuccessful URLs successfully cached.
     * @param {number} stats.uniqueAssets   Unique assets discovered.
     * @param {number} stats.totalFiles     Total files to upload.
     * @param {string} staticSiteProviderId Provider ID.
     *
     * @example
     * import { addAction } from '@wordpress/hooks';
     *
     * addAction('aether.static.pre_scan.after', 'my-provider', (stats, providerId) => {
     *   console.log('Pre-scan complete:', stats);
     * });
     */
    (0,external_wp_hooks_.doAction)('aether.static.pre_scan.after', {
      urlsScanned: urls.length,
      urlsSuccessful: cacheStats.sessionCached,
      uniqueAssets: allUniqueAssets.size,
      totalFiles: totalFilesToUpload
    }, staticSiteProviderId);
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

      /**
       * Filter manifest before fetching.
       *
       * Allows providers to customize manifest fetching or provide custom manifest.
       *
       * @param {Object|null} manifest             Manifest object or null to fetch from storage.
       * @param {Object}      storageService       Storage service instance.
       * @param {string}      staticSiteProviderId Provider ID.
       *
       * @example
       * import { addFilter } from '@wordpress/hooks';
       *
       * addFilter('aether.manifest.fetch', 'my-provider', (manifest, storageService, providerId) => {
       *   // Return custom manifest or null to use default fetching
       *   if (providerId === 'my-provider') {
       *     return { custom: 'manifest' };
       *   }
       *   return manifest; // Use default
       * });
       */
      manifest = (0,external_wp_hooks_.applyFilters)('aether.manifest.fetch', null, storageService, staticSiteProviderId);

      // If filter returned null, fetch from storage
      if (manifest === null) {
        manifest = await fetchManifest(storageService);
      }
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
          let assetBlob = new Blob([assetContent], {
            type: contentType
          });

          /**
           * Filter asset before processing.
           *
           * Allows providers to modify asset blob, path, or metadata before upload.
           *
           * @param {Object} assetData             Asset data object.
           * @param {Blob}   assetData.blob        Asset blob.
           * @param {string} assetData.path        Asset local path.
           * @param {string} assetData.key         Storage key.
           * @param {string} assetData.contentType Content type.
           * @param {string} assetData.url         Original asset URL.
           * @param {string} staticSiteProviderId  Provider ID.
           *
           * @example
           * import { addFilter } from '@wordpress/hooks';
           *
           * addFilter('aether.static.asset.process', 'my-provider', (assetData, providerId) => {
           *   // Modify asset blob
           *   return {
           *     ...assetData,
           *     blob: new Blob([assetData.blob], { type: 'image/webp' })
           *   };
           * });
           */
          const filteredAssetData = (0,external_wp_hooks_.applyFilters)('aether.static.asset.process', {
            blob: assetBlob,
            path: assetPath,
            key: assetKey,
            contentType,
            url: assetUrl
          }, staticSiteProviderId);

          // Use filtered asset data
          assetBlob = filteredAssetData.blob || assetBlob;
          const finalAssetPath = filteredAssetData.path || assetPath;
          const finalAssetKey = filteredAssetData.key || assetKey;
          const finalContentType = filteredAssetData.contentType || contentType;

          // Step 3: Check manifest BEFORE adding to upload queue
          // This prevents unnecessary uploads for assets that already exist in manifest
          const existingEntry = manifest[finalAssetKey];
          if (existingEntry && existingEntry.size === assetBlob.size) {
            // Size matches - calculate hash to verify
            try {
              const assetHash = await fileHash_calculateFileHash(assetBlob);
              if (manifestManager_shouldSkipUpload(manifest, finalAssetKey, assetBlob.size, assetHash)) {
                // Asset exists in manifest with matching hash - skip upload
                // But still mark as uploaded and add to uploadedFiles for cleanup
                assetTracker.markUploaded(assetUrl);
                filesUploaded++;
                filesSkipped++;
                uploadedFiles.push({
                  storageKey: finalAssetKey,
                  relativePath: finalAssetPath,
                  contentType: finalContentType
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
            assetPath: finalAssetPath,
            assetKey: finalAssetKey,
            assetBlob,
            contentType: finalContentType
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

            /**
             * Filter manifest after asset entry update.
             *
             * Allows providers to modify manifest after asset entry is updated.
             *
             * @param {Object} manifest             Manifest object.
             * @param {string} storageKey           Storage key that was updated.
             * @param {string} staticSiteProviderId Provider ID.
             */
            manifest = (0,external_wp_hooks_.applyFilters)('aether.manifest.update', manifest, assetKey, staticSiteProviderId);
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

    /**
     * Action fired before upload phase starts.
     *
     * @param {Array}  cachedUrls           URLs to upload.
     * @param {number} totalFilesToUpload   Total files to upload.
     * @param {string} staticSiteProviderId Provider ID.
     *
     * @example
     * import { addAction } from '@wordpress/hooks';
     *
     * addAction('aether.static.upload.before', 'my-provider', (urls, totalFiles, providerId) => {
     *   console.log('Starting upload phase:', totalFiles, 'files');
     * });
     */
    (0,external_wp_hooks_.doAction)('aether.static.upload.before', cachedUrls, totalFilesToUpload, staticSiteProviderId);

    // Process each URL sequentially and upload files
    for (const url of cachedUrls) {
      const cached = await cache.get(url);
      if (!cached) {
        debug_debugWarn(`[Aether] Cache miss for URL: ${url} - skipping`);
        continue;
      }
      const {
        processedHtml: rawHtml,
        assetUrls
      } = cached;
      try {
        // Update UI to show current progress (files X of Y).
        // Use a single key for all "Uploading files" messages so they update in place
        if (setStatusMessage) {
          setStatusMessage(`Uploading files (${filesUploaded + 1}/${totalFilesToUpload})`, 'progress', 'uploadFilesProgress');
        }

        /**
         * Filter HTML before provider-specific processing.
         *
         * Allows providers to modify HTML before URL rewriting.
         *
         * @param {string} html                 Raw HTML content.
         * @param {string} url                  Page URL.
         * @param {string} siteUrl              Site URL.
         * @param {string} staticSiteUrl        Provider-specific deployment URL.
         * @param {string} staticSiteProviderId Provider ID.
         *
         * @example
         * import { addFilter } from '@wordpress/hooks';
         *
         * addFilter('aether.static.html.process', 'my-provider', (html, url, siteUrl, staticSiteUrl, providerId) => {
         *   // Add custom meta tag
         *   return html.replace('</head>', '<meta name="custom" content="value" /></head>');
         * });
         */
        let processedHtml = (0,external_wp_hooks_.applyFilters)('aether.static.html.process', rawHtml, url, siteUrl, staticSiteUrl, staticSiteProviderId);

        // Process HTML with provider-specific deployment URL
        // This includes URL rewriting, admin bar removal, etc.
        processedHtml = processHtml(processedHtml, url, siteUrl, staticSiteUrl);

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

          /**
           * Filter manifest after entry update.
           *
           * Allows providers to modify manifest after entry is updated.
           *
           * @param {Object} manifest             Manifest object.
           * @param {string} storageKey           Storage key that was updated.
           * @param {string} staticSiteProviderId Provider ID.
           *
           * @example
           * import { addFilter } from '@wordpress/hooks';
           *
           * addFilter('aether.manifest.update', 'my-provider', (manifest, storageKey, providerId) => {
           *   // Add custom metadata to manifest entry
           *   if (manifest[storageKey]) {
           *     manifest[storageKey].customMetadata = 'value';
           *   }
           *   return manifest;
           * });
           */
          manifest = (0,external_wp_hooks_.applyFilters)('aether.manifest.update', manifest, htmlKey, staticSiteProviderId);
        }

        // Periodic manifest save for crash recovery (every 50 files)
        if (filesUploaded % 50 === 0) {
          try {
            debug('Periodic manifest save:', filesUploaded + ' files');
            await uploadManifest(storageService, manifest);
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
            await uploadManifest(storageService, manifest);
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
      let cleanedManifest = cleanupManifest(manifest, currentFileKeys);

      /**
       * Filter manifest before final cleanup and upload.
       *
       * Allows providers to customize manifest cleanup logic.
       *
       * @param {Object} manifest             Cleaned manifest object.
       * @param {Set}    currentFileKeys      Set of current file keys.
       * @param {string} staticSiteProviderId Provider ID.
       *
       * @example
       * import { addFilter } from '@wordpress/hooks';
       *
       * addFilter('aether.manifest.cleanup', 'my-provider', (manifest, currentFileKeys, providerId) => {
       *   // Keep additional entries
       *   return { ...manifest, 'custom-file.html': { size: 100, hash: 'abc' } };
       * });
       */
      cleanedManifest = (0,external_wp_hooks_.applyFilters)('aether.manifest.cleanup', cleanedManifest, currentFileKeys, staticSiteProviderId);
      const afterCleanupCount = Object.keys(cleanedManifest).length;
      const removedCount = beforeCleanupCount - afterCleanupCount;
      debug(`Manifest cleanup: ${beforeCleanupCount} entries → ${afterCleanupCount} entries (${removedCount} removed, ${currentFileKeys.size} current files)`);
      await uploadManifest(storageService, cleanedManifest);

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

    /**
     * Action fired after upload phase completes.
     *
     * @param {Object} result               Upload result statistics.
     * @param {number} result.filesUploaded Files uploaded.
     * @param {number} result.filesSkipped  Files skipped.
     * @param {number} result.urlsSucceeded URLs succeeded.
     * @param {number} result.urlsFailed    URLs failed.
     * @param {string} staticSiteProviderId Provider ID.
     *
     * @example
     * import { addAction } from '@wordpress/hooks';
     *
     * addAction('aether.static.upload.after', 'my-provider', (result, providerId) => {
     *   console.log('Upload phase complete:', result);
     * });
     */
    (0,external_wp_hooks_.doAction)('aether.static.upload.after', {
      filesUploaded,
      filesSkipped,
      urlsSucceeded: failures.urlsSucceeded,
      urlsFailed: failures.urlsFailed,
      assetsUploaded: assetTracker.getCount()
    }, staticSiteProviderId);

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


const PUBLISH_STEPS = [{
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
  return PUBLISH_STEPS.find(step => step.id === stepId) || null;
}

/**
 * Get the next step ID in the workflow.
 *
 * @param {string} currentStepId Current step identifier.
 * @return {string|null} Next step ID or null if this is the final step.
 */
function getNextStep(currentStepId) {
  const currentIndex = PUBLISH_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex === PUBLISH_STEPS.length - 1) {
    return null;
  }
  return PUBLISH_STEPS[currentIndex + 1].id;
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
          debug(`[ArchiveProgressCache] Cleaned up ${deleted} expired entries`);
        }
        return deleted;
      } catch (error) {
        debugError('[ArchiveProgressCache] Error during cleanup:', error);
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

  // Validate required data fields
  if (!initResponse.data || !initResponse.data.zipPath || !initResponse.data.progressId) {
    throw new Error('Invalid response from server: missing required data (zipPath or progressId)');
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
    setStepProgress,
    setOverallProgressValue,
    updateStaticSiteProgressContext,
    removeMessage
  } = context;

  // Support both new format (urls directly in context) and old format (currentStatus.urls for tests)
  const urlsArray = urls || currentStatus?.urls;
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
   * @param {Array}  urls      Array of URL objects to process.
   * @param {Array}  providers Array of provider IDs being used for upload.
   * @param {Object} context   Enhanced context with workflow state and provider info.
   *
   * @example
   * import { addFilter } from '@wordpress/hooks';
   *
   * addFilter('aether.upload.urls', 'my-provider', (urls, providers, context) => {
   *   // Add custom URL
   *   // context contains: siteUrl, blueprintData, staticSiteUrl, etc.
   *   return [...urls, { url: '/custom-page/', type: 'page' }];
   * });
   */
  const filteredUrls = (0,external_wp_hooks_.applyFilters)('aether.upload.urls', urlsArray, providers,
  // Pass array instead of single ID
  {
    // Enhanced context for providers
    siteUrl,
    blueprintData: blueprintDataForStatic,
    staticSiteUrl,
    providers
  });

  // IMPORTANT: To avoid race conditions when multiple providers fetch the same URLs,
  // we need to run providers sequentially, not in parallel.
  // This ensures each provider gets a complete set of files without interference.
  const uploadResults = [];

  // Track progress across all providers
  // We need to wrap processStaticSiteUrls to provide a provider-aware progress callback
  // The original progress callback in usePublishController.js doesn't know about multiple providers
  for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
    const providerIdItem = providers[providerIndex];
    try {
      // Fetch provider-specific deployment URL
      // Each provider may have a different public URL (e.g., custom domain, worker endpoint)
      let providerDeploymentUrl = staticSiteUrl || null;
      try {
        const providerResponse = await utils_api({
          path: `/aether/site-exporter/providers/${providerIdItem}`
        });
        if (providerResponse.success && providerResponse.config) {
          const providerConfig = providerResponse.config || {};
          // Get deployment URL from provider config (same logic as AbstractProvider.getDeploymentUrl)
          if (providerConfig.pages_url) {
            providerDeploymentUrl = providerConfig.pages_url;
          } else if (providerConfig.worker_endpoint) {
            providerDeploymentUrl = providerConfig.worker_endpoint;
          } else if (providerConfig.public_url) {
            providerDeploymentUrl = providerConfig.public_url;
          }
          // Allow filter to override deployment URL
          providerDeploymentUrl = (0,external_wp_hooks_.applyFilters)('aether.provider.deployment_url', providerDeploymentUrl, providerConfig, providerIdItem);
        }
      } catch (error) {
        // If we can't fetch provider config, fall back to shared staticSiteUrl
        // This maintains backwards compatibility
      }

      // Update progress context before processing this provider
      // This allows the progress callback in usePublishController.js to adjust
      // progress based on the current provider index and total providers
      if (updateStaticSiteProgressContext) {
        updateStaticSiteProgressContext(providerIndex, providers.length);
      }
      const result = await processStaticSiteUrls(filteredUrls, providerDeploymentUrl,
      // Provider-specific deployment URL
      providerIdItem, siteUrl, setStatusMessage, blueprintDataForStatic, removeMessage);

      // After processing, ensure progress reflects completed provider
      // The progress callback should have already updated it, but we ensure it's correct
      if (setStepProgress && setOverallProgressValue && updateStaticSiteProgressContext && providers.length > 1) {
        // Provider completed, so update context to reflect completion
        // This ensures progress shows 100% for this provider's share
        updateStaticSiteProgressContext(providerIndex + 1, providers.length);
        // Trigger final progress update (provider at 100% of its share)
        const stepProgress = Math.min(100, Math.round((providerIndex + 1) / providers.length * 100));
        setStepProgress('uploadStaticSiteFiles', stepProgress);
        setOverallProgressValue(calculateOverallProgress({
          step: 'uploadStaticSiteFiles',
          progress: stepProgress
        }));
      }
      uploadResults.push({
        status: 'fulfilled',
        value: {
          providerId: providerIdItem,
          success: true,
          filesUploaded: result.filesUploaded || 0,
          uploadedFiles: result.uploadedFiles || []
        }
      });
    } catch (error) {
      uploadResults.push({
        status: 'rejected',
        value: {
          providerId: providerIdItem,
          success: false,
          error: error.message
        }
      });
    }
  }

  // Use the uploadResults array we built sequentially
  const results = uploadResults;

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
   * @param {Object} context   Enhanced context with workflow state.
   *
   * @example
   * import { addFilter} from '@wordpress/hooks';
   *
   * addFilter('aether.upload.result', 'my-provider', (result, providers, context) => {
   *   return {
   *     ...result,
   *     customMetadata: 'added by my provider',
   *     // context contains: siteUrl, blueprintData, etc.
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
  }, providers, {
    // Enhanced context for providers
    siteUrl,
    blueprintData: blueprintDataForStatic,
    staticSiteUrl
  });
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
    setStatusMessage,
    setStepProgress,
    setOverallProgressValue
  } = context;

  // Use blueprintBundleProviders if available (these are instance IDs)
  // Fallback to single providerId for backward compatibility (may be instance ID or provider type ID)
  let providers = [];
  if (blueprintBundleProviders.length > 0) {
    // blueprintBundleProviders contains instance IDs (e.g., 'local-filesystem:abc-123')
    providers = blueprintBundleProviders;
  } else if (providerId) {
    // Legacy fallback - providerId may be instance ID or provider type ID
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

  // Upload to providers sequentially to avoid race conditions
  const uploadResults = [];
  let successCount = 0;
  let failureCount = 0;
  for (const providerIdItem of providers) {
    try {
      // Fetch provider-specific configuration
      // providerIdItem is an instance ID (e.g., 'local-filesystem:abc-123')
      let exportPath = 'blueprint-bundle/bundle.zip'; // Default path
      try {
        const providerResponse = await external_wp_apiFetch_default()({
          path: `/aether/site-exporter/providers/${providerIdItem}`
        });
        if (providerResponse.success && providerResponse.config) {
          const providerConfig = providerResponse.config || {};
          // Get provider-specific export_path from instance config
          if (providerConfig.export_path) {
            exportPath = providerConfig.export_path;
          }
        } else if (!providerResponse.success) {
          console.warn(`[Aether] Failed to fetch config for instance ${providerIdItem}:`, providerResponse);
        }
      } catch (error) {
        // If we can't fetch provider config, use default export path
        // This maintains backwards compatibility
        console.warn(`[Aether] Error fetching config for instance ${providerIdItem}, using default export path:`, error);
      }

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
        providerId: providerIdItem,
        exportPath // Add export path to config
      }, providerIdItem);

      // Upload blueprint-bundle.zip directly
      // Pass entire context so upload handler has access to blueprintBundle data
      await handleSiteArchiveUpload(providerIdItem, deploymentConfig);
      successCount++;
      uploadResults.push({
        status: 'fulfilled',
        value: {
          providerId: providerIdItem,
          success: true,
          exportPath
        }
      });

      // Update progress incrementally as each instance completes
      // Calculate progress as: (successCount / providers.length) * 100
      if (setStepProgress && setOverallProgressValue) {
        const stepProgress = Math.min(100, Math.round(successCount / providers.length * 100));
        setStepProgress('uploadSiteArchive', stepProgress);
        setOverallProgressValue(calculateOverallProgress({
          step: 'uploadSiteArchive',
          progress: stepProgress
        }));
      }
    } catch (error) {
      failureCount++;
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      console.error(`[Aether] Failed to upload blueprint bundle to instance ${providerIdItem}:`, error);
      uploadResults.push({
        status: 'rejected',
        reason: error,
        providerId: providerIdItem,
        error: errorMessage
      });
    }
  }

  // Report results
  if (successCount > 0) {
    setStatusMessage(`Uploaded blueprint bundle to ${successCount}/${providers.length} provider(s)`, failureCount > 0 ? 'warning' : 'success', 'uploadSiteArchive');
  }

  // Fail only if ALL providers failed
  if (successCount === 0) {
    throw new Error('Failed to upload blueprint bundle to any provider');
  }
  return {
    providers,
    results: uploadResults.map(r => r.status === 'fulfilled' ? r.value : r.reason),
    successCount,
    failureCount
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
function calculateOverallProgress(stepProgress) {
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
;// ./assets/src/publish/utils/publishConfiguration.js
/**
 * Publish Configuration Utilities
 *
 * Pure functions for preparing publish workflow configuration.
 * These functions are extracted from usePublishController for testability.
 *
 * @package
 */



/**
 * Prepare publish configuration from settings response
 *
 * Extracts provider IDs and settings from API response.
 * Pure function - no side effects, easily testable.
 *
 * @param {Object} settingsResponse - Response from settings API
 * @param {string} fallbackStorageProviderId - Fallback provider ID if not in settings
 * @return {Object} Configuration object with provider IDs
 */
function preparePublishConfiguration(settingsResponse, fallbackStorageProviderId = '') {
  const settings = settingsResponse?.settings || {};
  const providerTypes = settings.provider_types || {};
  return {
    storageProviderId: providerTypes.storage || '',
    staticSiteProviderId: providerTypes.static_site || '',
    // For backwards compatibility, use static site provider or storage provider
    providerId: providerTypes.static_site || providerTypes.storage || fallbackStorageProviderId,
    providerConfigs: settings.providers || {}
  };
}

/**
 * Get enabled provider instances for a specific deployment type
 *
 * Filters provider configurations to find enabled instances
 * that support the specified deployment type.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {string} deploymentType - Deployment type to filter by
 * @return {Array<string>} Array of enabled instance IDs
 */
function getEnabledInstancesForDeploymentType(providerConfigs, deploymentType) {
  try {
    if (!providerConfigs || typeof providerConfigs !== 'object') {
      return [];
    }
    return Object.entries(providerConfigs).filter(([, instanceConfig]) => {
      if (!instanceConfig || typeof instanceConfig !== 'object') {
        return false;
      }

      // Check if enabled (default to true if not specified)
      const isEnabled = instanceConfig.enabled !== false;

      // Check if supports this deployment type
      const deploymentTypes = instanceConfig.deployment_types || [];
      const supportsType = Array.isArray(deploymentTypes) && deploymentTypes.includes(deploymentType);
      return isEnabled && supportsType;
    }).map(([id]) => id);
  } catch (error) {
    debugError(`Failed to get instances for deployment type ${deploymentType}:`, error);
    return [];
  }
}

/**
 * Determine providers for all deployment types
 *
 * Pure function that takes provider configs and returns
 * arrays of instance IDs for each deployment type.
 *
 * @param {Object} providerConfigs - All provider configurations
 * @param {Array<string>} deploymentTypes - Array of deployment type constants
 * @return {Object} Object with arrays of instance IDs keyed by deployment type
 */
function determineProvidersByDeploymentType(providerConfigs, deploymentTypes) {
  const result = {};
  deploymentTypes.forEach(deploymentType => {
    const instances = getEnabledInstancesForDeploymentType(providerConfigs, deploymentType);
    result[deploymentType] = instances;
  });
  return result;
}

/**
 * Build workflow context from configuration
 *
 * Pure function that assembles the context object
 * needed for workflow execution.
 *
 * @param {Object} config - Configuration object
 * @param {Object} dependencies - External dependencies
 * @return {Object} Workflow context
 */
function buildWorkflowContext(config, dependencies) {
  const {
    siteUrl,
    providerId,
    staticSiteProviders,
    blueprintBundleProviders,
    edgeFunctionProviders
  } = config;
  const {
    api,
    processStaticSiteUrls,
    generateBlueprintJson,
    updateStaticSiteProgressContext,
    assetManager,
    setStatusMessage,
    setStepProgress,
    handleSiteArchiveUpload
  } = dependencies;
  return {
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
    updateStaticSiteProgressContext,
    assetManager,
    // State setters
    setStatusMessage,
    setStepProgress,
    // Upload handlers
    handleSiteArchiveUpload,
    // Discovered assets (populated during workflow)
    discoveredAssets: null
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

  // Provider context for progress tracking across multiple providers
  // This allows the progress callback to adjust progress based on the current provider index
  const staticSiteProgressContext = (0,external_wp_element_namespaceObject.useRef)({
    providerIndex: 0,
    totalProviders: 1
  });

  // Function to update static site progress context
  // This allows the step handler to set the current provider index before processing
  const updateStaticSiteProgressContext = (0,external_wp_element_namespaceObject.useCallback)((providerIndex, totalProviders) => {
    staticSiteProgressContext.current = {
      providerIndex,
      totalProviders
    };
  }, []);

  // Create static site generator with progress callback
  const processStaticSiteUrls = useStaticSiteGenerator((uploadedFiles, totalFiles) => {
    if (totalFiles > 0 && uploadedFiles >= 0) {
      // Get current provider context
      const {
        providerIndex,
        totalProviders
      } = staticSiteProgressContext.current;

      // Current provider's progress (0-100)
      const currentProviderProgress = Math.min(100, Math.max(0, Math.round(uploadedFiles / totalFiles * 100)));

      // Calculate step progress accounting for multiple providers
      // Progress formula: (providerIndex * 100 + currentProviderProgress) / totalProviders
      let stepProgress = currentProviderProgress;
      if (totalProviders > 1) {
        stepProgress = Math.min(100, Math.round((providerIndex * 100 + currentProviderProgress) / totalProviders));
      }
      const overallProgress = calculateOverallProgress({
        step: 'uploadStaticSiteFiles',
        progress: stepProgress
      });
      setOverallProgressValue(overallProgress);
      setStepProgress('uploadStaticSiteFiles', stepProgress);
    }
  });

  // Helper function to upload blueprint-bundle.zip archive file.
  // Detects upload method from provider's upload strategy (git, storage, or direct).
  const handleSiteArchiveUpload = (0,external_wp_element_namespaceObject.useCallback)(async (providerId, context) => {
    try {
      // providerId is an instance ID (e.g., 'local-filesystem:abc-123')
      // Use provider ID passed from executeSteps (avoids redundant settings fetch).
      // Get default provider if none configured
      let fetchedStorageProviderId = providerId;
      if (!fetchedStorageProviderId) {
        const {
          getDefaultProvider
        } = await Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 264));
        fetchedStorageProviderId = await getDefaultProvider();
      }
      if (!fetchedStorageProviderId) {
        throw new Error('No provider instance ID provided for blueprint bundle upload');
      }

      // Fetch provider metadata from REST API to check upload strategy
      // The endpoint handles both instance IDs and provider type IDs
      let providerMetadata = null;
      let instanceConfig = null;
      try {
        const providerResponse = await utils_api({
          path: `/aether/site-exporter/providers/${fetchedStorageProviderId}`
        });
        if (!providerResponse) {
          throw new Error(`REST API returned null response for provider ${fetchedStorageProviderId}`);
        }
        if (!providerResponse.success) {
          const errorMessage = providerResponse.message || providerResponse.error || 'Unknown error';
          throw new Error(`REST API error for provider ${fetchedStorageProviderId}: ${errorMessage}`);
        }
        if (providerResponse.provider) {
          providerMetadata = providerResponse.provider;
        } else {
          throw new Error(`Provider metadata not found in REST API response for ${fetchedStorageProviderId}`);
        }
        if (providerResponse.config) {
          instanceConfig = providerResponse.config;
        }
        debug(`[Aether] Fetched provider metadata for ${fetchedStorageProviderId}:`, {
          providerType: providerMetadata?.type,
          hasConfig: !!instanceConfig,
          instanceEnabled: instanceConfig?.enabled
        });
      } catch (error) {
        debugError(`[Aether] Failed to fetch provider metadata for instance ${fetchedStorageProviderId}:`, error);
        throw new Error(`Failed to fetch provider metadata for instance ${fetchedStorageProviderId}: ${error.message}`);
      }
      if (!providerMetadata) {
        throw new Error(`Provider instance not found: ${fetchedStorageProviderId}`);
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

      // DECISION POINT: Storage provider upload strategy
      if (uploadStrategy === 'direct') {
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
        // Pass instance ID (fetchedStorageProviderId) to the filter
        // The handler will receive the instance ID and can extract provider type if needed

        debug(`[Aether] Looking for upload handler for instance ${fetchedStorageProviderId}, strategy: ${uploadStrategy}`);
        const uploadHandler = (0,external_wp_hooks_.applyFilters)('aether.provider.upload', null, fetchedStorageProviderId,
        // Instance ID (e.g., 'local-filesystem:abc-123')
        {
          filePath: blueprintBundlePath,
          fileName: 'blueprint-bundle.zip',
          context: {
            ...context,
            instanceId: fetchedStorageProviderId,
            instanceConfig,
            // Include instance config in context
            exportPath: context.exportPath // Include exportPath from uploadSiteArchiveStep
          }
        });
        if (!uploadHandler || typeof uploadHandler !== 'function') {
          // Extract provider type from instance ID for better error message
          const providerType = fetchedStorageProviderId.includes(':') ? fetchedStorageProviderId.split(':')[0] : fetchedStorageProviderId;
          debugError(`[Aether] No upload handler found for provider type: ${providerType} (instance: ${fetchedStorageProviderId})`);
          throw new Error(`No upload handler registered for provider type: ${providerType} (instance: ${fetchedStorageProviderId}). ` + `Make sure the provider has registered an upload handler via the 'aether.provider.upload' filter.`);
        }
        debug(`[Aether] Upload handler found for ${fetchedStorageProviderId}, calling handler...`);

        // Call the upload handler
        // Pass context which includes exportPath from uploadSiteArchiveStep
        const uploadResult = await uploadHandler(blueprintBundlePath, 'blueprint-bundle.zip', {
          ...context,
          instanceId: fetchedStorageProviderId,
          instanceConfig,
          // Include instance config
          exportPath: context.exportPath // Include exportPath from uploadSiteArchiveStep
        });
        if (!uploadResult) {
          throw new Error(`Upload handler returned null/undefined for instance ${fetchedStorageProviderId}`);
        }
        if (!uploadResult.success) {
          const errorMessage = uploadResult?.error || uploadResult?.message || 'Unknown upload error';
          debugError(`[Aether] Upload handler returned error for instance ${fetchedStorageProviderId}:`, errorMessage);
          throw new Error(`Failed to upload blueprint bundle to instance ${fetchedStorageProviderId}: ${errorMessage}`);
        }
        debug(`[Aether] Blueprint bundle upload complete for instance ${fetchedStorageProviderId}:`, uploadResult);

        // Progress updates are handled at the step handler level (uploadSiteArchiveStep.js)
        // to properly track progress across multiple provider instances.
      } else {
        // ERROR: No upload method configured (no provider configured).
        throw new Error('No supported upload method available');
      }

      // Upload complete - control returns to workflow executor.
    } catch (error) {
      throw error;
    }
  }, [api, updateFromStep, setOverallProgressValue // Still used for git upload strategy
  // 			gitUpload,
  // setStepProgress removed from deps as progress is handled at step handler level
  ]);
  const startPublish = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    try {
      debug('startPublish called');

      // Initialize steps with 'discoverAssets' as the active step
      // This sets up steps array, active step, and lastStepIndex correctly
      initializeSteps(PUBLISH_STEPS, 'discoverAssets');
      // Set isPublishing to true to start the workflow
      setIsPublishing(true);
      debug('Steps initialized, starting publish workflow');

      // Fetch settings to get storage provider ID before starting
      const settingsResponse = await utils_api({
        path: '/aether/site-exporter/settings'
      });

      // Use pure function to extract configuration
      const publishConfig = preparePublishConfiguration(settingsResponse, storageProviderId);

      // Update storage provider ID state
      if (settingsResponse.success && publishConfig.storageProviderId) {
        setStorageProviderId(publishConfig.storageProviderId);
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

      // Get current site URL for static site generation (use pure function)
      const siteUrl = window.location.origin;

      // Get providerId for backwards compatibility (from pure function result)
      const providerId = publishConfig.providerId;

      // Get arrays of instance IDs for each deployment type (use pure function)
      const providersByType = determineProvidersByDeploymentType(publishConfig.providerConfigs, [DEPLOYMENT_TYPES.STATIC_SITE, DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE, DEPLOYMENT_TYPES.EDGE_FUNCTIONS]);
      const staticSiteProviders = providersByType[DEPLOYMENT_TYPES.STATIC_SITE];
      const blueprintBundleProviders = providersByType[DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE];
      const edgeFunctionProviders = providersByType[DEPLOYMENT_TYPES.EDGE_FUNCTIONS];
      debug('[Workflow] Providers by deployment type:', {
        staticSite: staticSiteProviders,
        blueprintBundle: blueprintBundleProviders,
        edgeFunctions: edgeFunctionProviders
      });

      // Build context object with all dependencies for step handlers (use pure function)
      const workflowContext = buildWorkflowContext({
        siteUrl,
        providerId,
        staticSiteProviders,
        blueprintBundleProviders,
        edgeFunctionProviders
      }, {
        api,
        processStaticSiteUrls,
        generateBlueprintJson,
        updateStaticSiteProgressContext,
        assetManager,
        setStatusMessage,
        setStepProgress,
        handleSiteArchiveUpload
      });

      // Add additional UI callbacks not in pure function (to avoid coupling)
      workflowContext.setOverallProgressValue = setOverallProgressValue;
      workflowContext.removeMessage = removeMessage;

      // Execute full workflow - individual steps check provider deployment_types

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

      // Execute the workflow
      await executeWorkflow(PUBLISH_WORKFLOW, STEP_HANDLERS, workflowContext, workflowOptions);
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
  }, [setIsPublishing, api, assetManager, showError, initializeSteps, setStorageProviderId, updateFromStep, updateStaticSiteProgressContext, config, storageProviderId, processStaticSiteUrls, generateBlueprintJson, handleSiteArchiveUpload, setStatusMessage, setStepProgress, removeMessage, setOverallProgressValue, markAllComplete]);
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
;// ./assets/src/admin-settings/components/ProviderInstanceCard.js
/**
 * Provider Instance Card Component
 *
 * Displays a single provider instance with inline name editing,
 * enable/disable toggle, configure button, and delete button.
 *
 * @package
 */







/**
 * Provider Instance Card Component.
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.provider    Provider metadata.
 * @param {Object}   props.instance    Instance config.
 * @param {Function} props.onConfigure Callback to configure instance.
 * @param {Function} props.onToggle    Callback to toggle enabled state.
 * @param {Function} props.onDelete    Callback to delete instance.
 * @param {Function} props.onRename    Callback to rename instance.
 * @return {JSX.Element} Rendered component.
 */

function ProviderInstanceCard({
  provider,
  instance,
  onConfigure,
  onToggle,
  onDelete,
  onRename
}) {
  const [isEditing, setIsEditing] = (0,external_wp_element_namespaceObject.useState)(false);
  const [editedName, setEditedName] = (0,external_wp_element_namespaceObject.useState)(instance.config.instance_name || '');
  const inputRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Focus input when editing starts
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  const handleNameSave = async () => {
    if (editedName.trim() === '') {
      setEditedName(instance.config.instance_name || '');
      setIsEditing(false);
      return;
    }

    // Don't save if name hasn't changed
    if (editedName === instance.config.instance_name) {
      setIsEditing(false);
      return;
    }

    // Save the new name via API
    if (onRename) {
      try {
        await onRename(instance.instanceId, editedName);
      } catch (error) {
        console.error('Failed to rename instance:', error);
        // Revert to original name on error
        setEditedName(instance.config.instance_name || '');
      }
    }
    setIsEditing(false);
  };
  const handleNameCancel = () => {
    setEditedName(instance.config.instance_name || '');
    setIsEditing(false);
  };
  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    const confirmed = confirm((0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: instance name */
    (0,external_wp_i18n_namespaceObject.__)('Are you sure you want to delete the instance "%s"? This cannot be undone.', 'aether-site-exporter'), instance.config.instance_name));
    if (confirmed) {
      onDelete();
    }
  };
  const headerContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm
  };
  const headerRowStyle = {
    display: 'flex',
    alignItems: 'center'
  };
  const nameStyle = {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    cursor: 'pointer',
    flex: 1,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.sm,
    transition: 'background-color 0.2s ease'
  };
  const nameInputStyle = {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    padding: `${spacing.xs} ${spacing.sm}`,
    border: `2px solid ${colors.primary}`,
    borderRadius: borderRadius.sm,
    flex: 1,
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };
  const actionsStyle = {
    display: 'flex',
    gap: spacing.sm
  };
  const providerTypeTagStyle = {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    padding: '4px 8px',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundLighter,
    color: colors.textSecondary,
    display: 'inline-block',
    marginBottom: spacing.sm
  };
  const deploymentTypesContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs
  };

  // Get enabled deployment types from instance config
  // Use the latest instance.config to ensure reactivity when props update
  const enabledDeploymentTypes = instance?.config?.deployment_types || [];

  /**
   * Get color styling for a deployment type tag
   *
   * @param {string} deploymentType Deployment type identifier
   * @return {Object} Style object with backgroundColor and color
   */
  const getDeploymentTypeTagStyle = deploymentType => {
    const baseStyle = {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      padding: '3px 8px',
      borderRadius: borderRadius.sm,
      display: 'inline-block'
    };

    // Assign different colors based on deployment type using WordPress statusBadgeStyles
    switch (deploymentType) {
      case DEPLOYMENT_TYPES.STATIC_SITE:
        return {
          ...baseStyle,
          ...statusBadgeStyles.success
        };
      case DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE:
        return {
          ...baseStyle,
          ...statusBadgeStyles.info
        };
      case DEPLOYMENT_TYPES.EDGE_FUNCTIONS:
        return {
          ...baseStyle,
          ...statusBadgeStyles.warning
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.backgroundLighter,
          color: colors.textSecondary
        };
    }
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_wp_components_namespaceObject.Card, {
    className: "aether-provider-instance-card",
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CardHeader, {
      className: "aether-provider-instance-card__header",
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-provider-instance-card__header-content",
        style: headerContentStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
          className: "aether-provider-instance-card__type-tag",
          style: providerTypeTagStyle,
          children: provider.name
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
          className: "aether-provider-instance-card__header-row",
          style: headerRowStyle,
          children: isEditing ? /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_ReactJSXRuntime_namespaceObject.Fragment, {
            children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("input", {
              ref: inputRef,
              className: "aether-provider-instance-card__name-input",
              type: "text",
              value: editedName,
              onChange: e => setEditedName(e.target.value),
              onBlur: handleNameSave,
              onKeyDown: e => {
                if (e.key === 'Enter') {
                  handleNameSave();
                } else if (e.key === 'Escape') {
                  handleNameCancel();
                }
              },
              style: nameInputStyle
            })
          }) : /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
            className: "aether-provider-instance-card__name",
            style: nameStyle,
            onClick: () => setIsEditing(true),
            onKeyDown: e => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsEditing(true);
              }
            },
            onMouseEnter: e => {
              e.currentTarget.style.backgroundColor = colors.backgroundLighter;
            },
            onMouseLeave: e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            },
            role: "button",
            tabIndex: 0,
            title: (0,external_wp_i18n_namespaceObject.__)('Click to edit name', 'aether-site-exporter'),
            children: instance.config.instance_name
          })
        }), enabledDeploymentTypes.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
          className: "aether-provider-instance-card__deployment-types",
          style: deploymentTypesContainerStyle,
          children: enabledDeploymentTypes.map(deploymentType => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
            className: `aether-provider-instance-card__deployment-type-tag aether-provider-instance-card__deployment-type-tag--${deploymentType}`,
            style: getDeploymentTypeTagStyle(deploymentType),
            children: DEPLOYMENT_TYPE_LABELS[deploymentType] || deploymentType
          }, deploymentType))
        })]
      })
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CardBody, {
      className: "aether-provider-instance-card__body",
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-instance-card__toggle",
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.ToggleControl, {
          className: "aether-provider-instance-card__toggle-control",
          label: (0,external_wp_i18n_namespaceObject.__)('Enable this instance', 'aether-site-exporter'),
          checked: instance.config.enabled !== false,
          onChange: onToggle
        })
      })
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CardFooter, {
      className: "aether-provider-instance-card__footer",
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-provider-instance-card__actions",
        style: actionsStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
          className: "aether-provider-instance-card__configure-button",
          variant: "secondary",
          onClick: onConfigure,
          style: {
            flex: 1
          },
          children: (0,external_wp_i18n_namespaceObject.__)('Configure', 'aether-site-exporter')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
          className: "aether-provider-instance-card__delete-button",
          variant: "secondary",
          isDestructive: true,
          onClick: handleDelete,
          title: (0,external_wp_i18n_namespaceObject.__)('Delete this instance', 'aether-site-exporter'),
          children: (0,external_wp_i18n_namespaceObject.__)('Delete', 'aether-site-exporter')
        })]
      })
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
  const inputWrapperStyle = {
    position: 'relative'
  };
  const eyeButtonStyle = {
    position: 'absolute',
    right: '8px',
    top: 'calc(23px + 50%)',
    transform: 'translateY(-100%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    fontSize: '18px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    opacity: 0.7,
    transition: 'opacity 0.2s ease'
  };

  // Add hover effect via onMouseEnter/onMouseLeave
  const [isHovered, setIsHovered] = (0,external_wp_element_namespaceObject.useState)(false);

  // Password manager prevention attributes
  const passwordManagerPreventionAttrs = {
    autoComplete: 'off',
    'data-lpignore': 'true',
    'data-1p-ignore': 'true',
    'data-form-type': 'other'
  };

  // CSS for text masking when not visible
  const inputStyle = {
    paddingRight: '40px',
    // Make room for the eye icon
    ...(!isVisible ? {
      WebkitTextSecurity: 'disc',
      textSecurity: 'disc'
    } : {})
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
    className: "aether-secret-field",
    style: containerStyle,
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-secret-field__wrapper",
      style: inputWrapperStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        className: "aether-secret-field__input",
        label: label,
        help: help,
        value: value,
        onChange: onChange,
        type: "text",
        placeholder: placeholder,
        style: inputStyle,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        ...passwordManagerPreventionAttrs,
        ...props
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("button", {
        type: "button",
        className: "aether-secret-field__toggle",
        onClick: () => setIsVisible(!isVisible),
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        style: {
          ...eyeButtonStyle,
          opacity: isHovered ? 1 : 0.7
        },
        "aria-label": isVisible ? (0,external_wp_i18n_namespaceObject.__)('Hide', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Show', 'aether-site-exporter'),
        title: isVisible ? (0,external_wp_i18n_namespaceObject.__)('Hide', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Show', 'aether-site-exporter'),
        children: isVisible ? /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("svg", {
          className: "aether-secret-field__icon aether-secret-field__icon--visible",
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 32 32",
          width: "18",
          height: "18",
          style: {
            display: 'block'
          },
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("path", {
            d: "M30.94,15.66A16.69,16.69,0,0,0,16,5,16.69,16.69,0,0,0,1.06,15.66a1,1,0,0,0,0,.68A16.69,16.69,0,0,0,16,27,16.69,16.69,0,0,0,30.94,16.34,1,1,0,0,0,30.94,15.66ZM16,25c-5.3,0-10.9-3.93-12.93-9C5.1,10.93,10.7,7,16,7s10.9,3.93,12.93,9C26.9,21.07,21.3,25,16,25Z"
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("path", {
            d: "M16,10a6,6,0,1,0,6,6A6,6,0,0,0,16,10Zm0,10a4,4,0,1,1,4-4A4,4,0,0,1,16,20Z"
          })]
        }) : /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("svg", {
          className: "aether-secret-field__icon aether-secret-field__icon--hidden",
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 32 32",
          width: "18",
          height: "18",
          style: {
            display: 'block'
          },
          children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("path", {
            d: "M5.24,22.51l1.43-1.42A14.06,14.06,0,0,1,3.07,16C5.1,10.93,10.7,7,16,7a12.38,12.38,0,0,1,4,.72l1.55-1.56A14.72,14.72,0,0,0,16,5,16.69,16.69,0,0,0,1.06,15.66a1,1,0,0,0,0,.68A16,16,0,0,0,5.24,22.51Z"
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("path", {
            d: "M12,15.73a4,4,0,0,1,3.7-3.7l1.81-1.82a6,6,0,0,0-7.33,7.33Z"
          }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("path", {
            d: "M30.94,15.66A16.4,16.4,0,0,0,25.2,8.22L30,3.41,28.59,2,2,28.59,3.41,30l5.1-5.1A15.29,15.29,0,0,0,16,27,16.69,16.69,0,0,0,30.94,16.34,1,1,0,0,0,30.94,15.66ZM20,16a4,4,0,0,1-6,3.44L19.44,14A4,4,0,0,1,20,16Zm-4,9a13.05,13.05,0,0,1-6-1.58l2.54-2.54a6,6,0,0,0,8.35-8.35l2.87-2.87A14.54,14.54,0,0,1,28.93,16C26.9,21.07,21.3,25,16,25Z"
          })]
        })
      })]
    })
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
 * @param {boolean}  props.isHidden Whether field should be hidden via CSS.
 * @return {JSX.Element} Rendered field component.
 */

function ProviderField({
  field,
  value,
  onChange,
  errors,
  isHidden = false
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

  // Password manager prevention attributes for all text inputs
  const passwordManagerPreventionAttrs = {
    autoComplete: 'off',
    'data-lpignore': 'true',
    'data-1p-ignore': 'true',
    'data-form-type': 'other'
  };

  // Base style for field wrapper
  const fieldWrapperStyle = {
    display: isHidden ? 'none' : undefined
  };

  // Handle sensitive fields (passwords, API keys, etc.)
  if (sensitive || type === 'password') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
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
      style: fieldWrapperStyle,
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
      style: fieldWrapperStyle,
      children: [label && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-provider-field__label components-base-control__label",
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          className: "aether-provider-field__label-text",
          children: label
        }), required && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
          className: "aether-provider-field__label-required components-base-control__label__required",
          children: "*"
        })]
      }), help && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-provider-field__help components-base-control__help",
        children: help
      }), error && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-provider-field__error aether-provider-field__error--message components-base-control__help components-base-control__help--error",
        children: error
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-field__checkbox-group aether-checkbox-group",
        children: options.map(option => {
          const optionValue = option.value;
          const optionLabel = option.label || option.value;
          const isSelected = currentValue.includes(optionValue);
          return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CheckboxControl, {
            className: "aether-provider-field__checkbox-option",
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
      style: fieldWrapperStyle,
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
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextareaControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        placeholder: placeholder,
        required: required,
        ...passwordManagerPreventionAttrs
      })
    });
  }

  // Handle URL fields
  if (type === 'url') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        type: "url",
        placeholder: placeholder,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        ...passwordManagerPreventionAttrs
      })
    });
  }

  // Handle email fields
  if (type === 'email') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        type: "email",
        placeholder: placeholder,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        ...passwordManagerPreventionAttrs
      })
    });
  }

  // Handle number fields
  if (type === 'number') {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        label: label,
        help: help,
        value: value || '',
        onChange: newValue => onChange(id, newValue),
        type: "number",
        placeholder: placeholder,
        required: required,
        __next40pxDefaultSize: true,
        __nextHasNoMarginBottom: true,
        ...passwordManagerPreventionAttrs
      })
    });
  }

  // Default: text field
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
    className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
    style: fieldWrapperStyle,
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
      label: label,
      help: help,
      value: value || '',
      onChange: newValue => onChange(id, newValue),
      placeholder: placeholder,
      required: required,
      __next40pxDefaultSize: true,
      __nextHasNoMarginBottom: true,
      ...passwordManagerPreventionAttrs
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

  // Refs for hook container elements
  const beforeFieldsRef = (0,external_wp_element_namespaceObject.useRef)(null);
  const afterFieldsRef = (0,external_wp_element_namespaceObject.useRef)(null);
  const actionsRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Update values when initialValues change
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    setValues(initializeValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);
  const handleFieldChange = (0,external_wp_element_namespaceObject.useCallback)((fieldId, value) => {
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
  }, [values, onChange, clearSuccess]);

  // Trigger hooks when values or other state changes
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    const hookContext = {
      providerId,
      values,
      onChange: handleFieldChange,
      errors,
      saving
    };

    // Trigger before_fields hook
    if (beforeFieldsRef.current) {
      (0,external_wp_hooks_.doAction)('aether.provider.form.before_fields', hookContext);
    }

    // Trigger after_fields hook
    if (afterFieldsRef.current) {
      (0,external_wp_hooks_.doAction)('aether.provider.form.after_fields', hookContext);
    }

    // Trigger actions hook
    if (actionsRef.current) {
      (0,external_wp_hooks_.doAction)('aether.provider.form.actions', hookContext);
    }
  }, [providerId, values, handleFieldChange, errors, saving]);
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
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      ref: beforeFieldsRef,
      className: "aether-provider-form__before-fields",
      "data-provider-id": providerId
    }), (() => {
      // Helper function to determine if field should be hidden
      const isFieldHidden = field => {
        // Always hide deployment_types field (managed in modal)
        if (field.name === 'deployment_types') {
          return true;
        }
        if (field.hidden === true) {
          // Hide fields marked as hidden in provider settings
          return true;
        }
        if (field.deploymentType) {
          // Hide fields with deploymentType if that type is not in current deployment_types
          // Check both values.deployment_types and initialValues.deployment_types
          // to handle real-time updates when deployment types change in modal
          const currentDeploymentTypes = values.deployment_types || initialValues.deployment_types || [];
          return !currentDeploymentTypes.includes(field.deploymentType);
        }
        return false;
      };

      // Separate fields into regular and advanced
      const regularFields = fields.filter(field => !field.is_advanced);
      const advancedFields = fields.filter(field => field.is_advanced === true);

      // Render field component
      const renderField = field => {
        const isHidden = isFieldHidden(field);
        return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderField, {
          field: field,
          value: values[field.id],
          onChange: handleFieldChange,
          errors: errors,
          isHidden: isHidden
        }, field.id);
      };

      // Helper function to get default value for a field
      const getFieldDefault = field => {
        if (field.defaultValue !== undefined) {
          return field.defaultValue;
        }
        if (field.type === 'checkbox-group') {
          return [];
        }
        if (field.type === 'checkbox') {
          return false;
        }
        return '';
      };

      // Helper function to check if a field has a value
      const hasFieldValue = field => {
        const value = values[field.id];
        const defaultValue = getFieldDefault(field);

        // If value is undefined or null, it doesn't have a value
        if (value === undefined || value === null) {
          return false;
        }

        // For arrays, check if it's not empty and different from default
        if (Array.isArray(value)) {
          return value.length > 0 && JSON.stringify(value) !== JSON.stringify(defaultValue);
        }

        // For checkboxes, check if value is different from default (true vs false)
        if (field.type === 'checkbox') {
          return value !== defaultValue;
        }

        // For other types, check if value is not empty and different from default
        return value !== '' && value !== defaultValue;
      };

      // Helper function to reset a field to its default
      const resetField = fieldId => {
        const field = fields.find(f => f.id === fieldId);
        if (!field) {
          return;
        }
        const defaultValue = getFieldDefault(field);
        handleFieldChange(fieldId, defaultValue);
      };
      return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_ReactJSXRuntime_namespaceObject.Fragment, {
        children: [regularFields.map(renderField), advancedFields.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.__experimentalToolsPanel, {
          className: "aether-provider-form__tools-panel",
          label: (0,external_wp_i18n_namespaceObject.__)('Advanced settings', 'aether-site-exporter'),
          resetAll: null,
          children: advancedFields.map(field => {
            const isHidden = isFieldHidden(field);
            return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.__experimentalToolsPanelItem, {
              className: "aether-provider-form__tools-panel-item",
              hasValue: () => hasFieldValue(field),
              label: field.label || field.name,
              onDeselect: () => resetField(field.id),
              children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderField, {
                field: field,
                value: values[field.id],
                onChange: handleFieldChange,
                errors: errors,
                isHidden: isHidden
              })
            }, field.id);
          })
        })]
      });
    })(), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      ref: afterFieldsRef,
      className: "aether-provider-form__after-fields",
      "data-provider-id": providerId
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-provider-form__actions",
      style: actionsStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "aether-provider-form__submit-button",
        type: "submit",
        variant: "primary",
        isBusy: saving,
        disabled: saving,
        children: saving ? (0,external_wp_i18n_namespaceObject.__)('Saving…', 'aether-site-exporter') : (0,external_wp_i18n_namespaceObject.__)('Save Settings', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        ref: actionsRef,
        className: "aether-provider-form__actions-hook",
        "data-provider-id": providerId
      })]
    })]
  });
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if providerId, fields array length, or initialValues change
/* harmony default export */ const components_ProviderForm = ((0,external_wp_element_namespaceObject.memo)(ProviderForm, (prevProps, nextProps) => {
  return prevProps.providerId === nextProps.providerId && prevProps.fields.length === nextProps.fields.length && JSON.stringify(prevProps.initialValues) === JSON.stringify(nextProps.initialValues);
}));
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
 * @param {string}   props.instanceId    Instance ID for saving config.
 * @param {Function} props.onSave        Callback called after successful save with updated config.
 * @return {JSX.Element} Rendered modal component.
 */

function ProviderConfigModal({
  isOpen,
  onClose,
  provider,
  initialConfig = {},
  instanceId,
  onSave
}) {
  const [config, setConfig] = (0,external_wp_element_namespaceObject.useState)(initialConfig);
  const [hasChanges, setHasChanges] = (0,external_wp_element_namespaceObject.useState)(false);
  const [saveError, setSaveError] = (0,external_wp_element_namespaceObject.useState)(null);
  const closeTimeoutRef = (0,external_wp_element_namespaceObject.useRef)(null);

  // Refs for hook container elements
  const beforeFormRef = (0,external_wp_element_namespaceObject.useRef)(null);
  const afterFormRef = (0,external_wp_element_namespaceObject.useRef)(null);
  const handleFormChange = (0,external_wp_element_namespaceObject.useCallback)(newValues => {
    // Include deployment_types in the merged config
    setConfig({
      ...newValues,
      // eslint-disable-next-line camelcase
      deployment_types: config.deployment_types || []
    });
    setHasChanges(true);
  }, [config.deployment_types]);
  const handleDeploymentTypeToggle = (0,external_wp_element_namespaceObject.useCallback)((deploymentType, checked) => {
    setConfig(prevConfig => {
      const currentTypes = prevConfig.deployment_types || [];
      const newTypes = checked ? [...currentTypes, deploymentType] : currentTypes.filter(t => t !== deploymentType);
      return {
        ...prevConfig,
        // eslint-disable-next-line camelcase
        deployment_types: newTypes
      };
    });
    setHasChanges(true);
  }, []);

  // Reset config when modal opens/closes or provider changes
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (!provider) {
      return;
    }
    if (isOpen) {
      // Keep deployment_types in config for visibility logic, but don't show it in form
      setConfig(initialConfig);
      setHasChanges(false);
      setSaveError(null);
    } else if (closeTimeoutRef.current) {
      // Clear timeout if modal is closed
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, [isOpen, initialConfig, provider]);

  // Trigger hooks when modal is open and config/provider changes
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (!isOpen || !provider || !instanceId) {
      return;
    }
    const {
      id
    } = provider;
    const hookContext = {
      providerId: id,
      // Provider type (for backwards compatibility)
      instanceId,
      // Instance ID (for instance-specific operations)
      provider,
      config,
      onConfigChange: handleFormChange
    };

    // Trigger before_form hook
    if (beforeFormRef.current) {
      (0,external_wp_hooks_.doAction)('aether.provider.modal.before_form', hookContext);
    }

    // Trigger after_form hook
    if (afterFormRef.current) {
      (0,external_wp_hooks_.doAction)('aether.provider.modal.after_form', hookContext);
    }
  }, [isOpen, provider, config, handleFormChange, instanceId]);
  const handleFormSubmit = async values => {
    if (!provider || !instanceId) {
      return;
    }

    // Use instanceId for saving (not provider.id which is the provider type)
    setSaveError(null);
    try {
      const configResponse = await utils_api({
        path: '/aether/site-exporter/settings?key=providers'
      });
      if (!configResponse.success) {
        throw new Error('Failed to load current settings');
      }
      const providerConfigs = configResponse.value || {};
      const currentConfig = providerConfigs[instanceId] || {};
      const enabled = currentConfig.enabled !== false; // Default to enabled

      // Include deployment_types from config state (managed in modal checkboxes)
      const updatedConfig = {
        ...values,
        enabled,
        // eslint-disable-next-line camelcase
        deployment_types: config.deployment_types || []
      };

      // Save with enabled state preserved
      const updatedProviders = {
        ...providerConfigs,
        [instanceId]: updatedConfig
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

      // Notify parent of successful save with updated config for immediate reactivity
      if (onSave) {
        onSave(instanceId, updatedConfig);
      }

      // Close modal after 2 seconds
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
  const headerStyle = {
    marginBottom: spacing.md
  };
  const descriptionStyle = {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    margin: 0
  };
  const sectionTitleStyle = {
    fontSize: '1rem',
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md
  };
  const deploymentTypesSectionStyle = {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: '6px',
    border: `1px solid ${colors.borderLight}`,
    marginBottom: spacing.lg
  };

  // Get supported deployment types from provider metadata
  const supportedDeploymentTypes = metadata.supportedDeploymentTypes || [];

  // Deployment type labels
  const deploymentTypeLabels = {
    [DEPLOYMENT_TYPES.STATIC_SITE]: (0,external_wp_i18n_namespaceObject.__)('Static Site', 'aether-site-exporter'),
    [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,external_wp_i18n_namespaceObject.__)('Blueprint Bundle', 'aether-site-exporter'),
    [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,external_wp_i18n_namespaceObject.__)('Edge Functions', 'aether-site-exporter')
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)(external_wp_components_namespaceObject.Modal, {
    title: name,
    onRequestClose: handleClose,
    isFullScreen: false,
    className: "aether-provider-config-modal",
    children: [description && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-config-modal__header",
      style: headerStyle,
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-provider-config-modal__description",
        style: descriptionStyle,
        children: description
      })
    }), saveError && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
      className: "aether-provider-config-modal__notice aether-provider-config-modal__notice--error",
      status: "error",
      isDismissible: true,
      onRemove: () => setSaveError(null),
      children: saveError
    }), supportedDeploymentTypes.length > 0 && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-provider-config-modal__deployment-types",
      style: deploymentTypesSectionStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-config-modal__deployment-types-title",
        style: sectionTitleStyle,
        children: (0,external_wp_i18n_namespaceObject.__)('Deployment Types', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-provider-config-modal__deployment-types-description",
        style: {
          fontSize: '0.875rem',
          color: colors.textSecondary,
          marginBottom: spacing.md
        },
        children: (0,external_wp_i18n_namespaceObject.__)('Select which deployment types this provider instance should handle.', 'aether-site-exporter')
      }), supportedDeploymentTypes.map(deploymentType => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.CheckboxControl, {
        className: "aether-provider-config-modal__deployment-type-checkbox",
        label: deploymentTypeLabels[deploymentType],
        checked: config.deployment_types?.includes(deploymentType) || false,
        onChange: checked => handleDeploymentTypeToggle(deploymentType, checked)
      }, deploymentType))]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      ref: beforeFormRef,
      className: "aether-provider-modal__before-form",
      "data-provider-id": id,
      "data-instance-id": instanceId
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(components_ProviderForm, {
      providerId: id,
      fields: settingsFields,
      initialValues: {
        ...config,
        // Include deployment_types in initialValues for reactive field visibility
        // eslint-disable-next-line camelcase
        deployment_types: config.deployment_types || []
      },
      onChange: handleFormChange,
      onSubmit: handleFormSubmit
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      ref: afterFormRef,
      className: "aether-provider-modal__after-form",
      "data-provider-id": id,
      "data-instance-id": instanceId
    })]
  });
}
;// ./node_modules/uuid/dist/native.js
const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
/* harmony default export */ const dist_native = ({ randomUUID });

;// ./node_modules/uuid/dist/rng.js
let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
    if (!getRandomValues) {
        if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
            throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
        getRandomValues = crypto.getRandomValues.bind(crypto);
    }
    return getRandomValues(rnds8);
}

;// ./node_modules/uuid/dist/stringify.js

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] +
        byteToHex[arr[offset + 1]] +
        byteToHex[arr[offset + 2]] +
        byteToHex[arr[offset + 3]] +
        '-' +
        byteToHex[arr[offset + 4]] +
        byteToHex[arr[offset + 5]] +
        '-' +
        byteToHex[arr[offset + 6]] +
        byteToHex[arr[offset + 7]] +
        '-' +
        byteToHex[arr[offset + 8]] +
        byteToHex[arr[offset + 9]] +
        '-' +
        byteToHex[arr[offset + 10]] +
        byteToHex[arr[offset + 11]] +
        byteToHex[arr[offset + 12]] +
        byteToHex[arr[offset + 13]] +
        byteToHex[arr[offset + 14]] +
        byteToHex[arr[offset + 15]]).toLowerCase();
}
function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!validate(uuid)) {
        throw TypeError('Stringified UUID is invalid');
    }
    return uuid;
}
/* harmony default export */ const dist_stringify = ((/* unused pure expression or super */ null && (stringify)));

;// ./node_modules/uuid/dist/v4.js



function _v4(options, buf, offset) {
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? rng();
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    if (buf) {
        offset = offset || 0;
        if (offset < 0 || offset + 16 > buf.length) {
            throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
        }
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i];
        }
        return buf;
    }
    return unsafeStringify(rnds);
}
function v4(options, buf, offset) {
    if (dist_native.randomUUID && !buf && !options) {
        return dist_native.randomUUID();
    }
    return _v4(options, buf, offset);
}
/* harmony default export */ const dist_v4 = (v4);

;// ./assets/src/admin-settings/components/AddProviderInstanceModal.js
/**
 * Add Provider Instance Modal Component
 *
 * Modal for creating a new provider instance.
 * Shows provider type selector and instance name input.
 *
 * @package
 */




// eslint-disable-next-line import/no-unresolved



/**
 * Add Provider Instance Modal Component.
 *
 * @param {Object}   props           Component props.
 * @param {boolean}  props.isOpen    Whether modal is open.
 * @param {Function} props.onClose   Callback to close modal.
 * @param {Array}    props.providers Array of available provider types.
 * @param {Function} props.onCreate  Callback to create instance (instanceId, providerType, instanceName).
 * @return {JSX.Element|null} Rendered component.
 */

function AddProviderInstanceModal({
  isOpen,
  onClose,
  providers,
  onCreate
}) {
  const [selectedProviderType, setSelectedProviderType] = (0,external_wp_element_namespaceObject.useState)('');
  const [instanceName, setInstanceName] = (0,external_wp_element_namespaceObject.useState)('');
  const [isCreating, setIsCreating] = (0,external_wp_element_namespaceObject.useState)(false);
  const handleCreate = async () => {
    if (!selectedProviderType || !instanceName.trim()) {
      return;
    }

    // Generate UUID client-side for instant feedback
    const instanceId = `${selectedProviderType}:${dist_v4()}`;
    setIsCreating(true);
    try {
      await onCreate(instanceId, selectedProviderType, instanceName.trim());
      // Reset form and close
      setSelectedProviderType('');
      setInstanceName('');
      onClose();
    } catch (error) {
      console.error('Failed to create instance:', error);
      // eslint-disable-next-line no-alert
      alert((0,external_wp_i18n_namespaceObject.__)('Failed to create instance. Please try again.', 'aether-site-exporter'));
    } finally {
      setIsCreating(false);
    }
  };
  const handleClose = () => {
    setSelectedProviderType('');
    setInstanceName('');
    onClose();
  };
  if (!isOpen) {
    return null;
  }
  const selectedProvider = providers.find(p => p.id === selectedProviderType);
  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg
  };
  const actionsStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.lg
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Modal, {
    className: "aether-add-provider-instance-modal",
    title: (0,external_wp_i18n_namespaceObject.__)('Add Provider Instance', 'aether-site-exporter'),
    onRequestClose: handleClose,
    size: "medium",
    children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-add-provider-instance-modal__form",
      style: formStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.SelectControl, {
        className: "aether-add-provider-instance-modal__provider-select",
        label: (0,external_wp_i18n_namespaceObject.__)('Provider Type', 'aether-site-exporter'),
        value: selectedProviderType,
        onChange: setSelectedProviderType,
        options: [{
          label: (0,external_wp_i18n_namespaceObject.__)('Select a provider…', 'aether-site-exporter'),
          value: ''
        }, ...providers.map(provider => ({
          label: provider.name,
          value: provider.id
        }))],
        help: selectedProvider ? selectedProvider.description : (0,external_wp_i18n_namespaceObject.__)('Choose which type of provider to create', 'aether-site-exporter')
      }), selectedProviderType && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.TextControl, {
        className: "aether-add-provider-instance-modal__instance-name",
        label: (0,external_wp_i18n_namespaceObject.__)('Instance Name', 'aether-site-exporter'),
        value: instanceName,
        onChange: setInstanceName,
        placeholder: (0,external_wp_i18n_namespaceObject.sprintf)(/* translators: %s: provider name */
        (0,external_wp_i18n_namespaceObject.__)('e.g., "%s Production"', 'aether-site-exporter'), selectedProvider?.name || 'My'),
        help: (0,external_wp_i18n_namespaceObject.__)('Choose a descriptive name for this instance', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
        className: "aether-add-provider-instance-modal__actions",
        style: actionsStyle,
        children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
          className: "aether-add-provider-instance-modal__cancel-button",
          variant: "tertiary",
          onClick: handleClose,
          children: (0,external_wp_i18n_namespaceObject.__)('Cancel', 'aether-site-exporter')
        }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
          className: "aether-add-provider-instance-modal__create-button",
          variant: "primary",
          onClick: handleCreate,
          disabled: !selectedProviderType || !instanceName.trim() || isCreating,
          isBusy: isCreating,
          children: (0,external_wp_i18n_namespaceObject.__)('Create Instance', 'aether-site-exporter')
        })]
      })]
    })
  });
}
;// ./assets/src/services/ProviderSettingsAPI.js
/**
 * Provider Settings API Service
 *
 * Service class for managing provider settings via REST API.
 * Extracted from useProviderSettings hook for testability.
 *
 * @package
 */

/**
 * Merge provider configurations with preservation options
 *
 * Pure function for merging provider configs.
 *
 * @param {Object} currentConfig Current provider configuration
 * @param {Object} updatedConfig Updated configuration
 * @param {Object} options Merge options
 * @param {boolean} options.preserveEnabled Preserve existing enabled state
 * @param {boolean} options.preserveDeploymentTypes Preserve existing deployment_types
 * @return {Object} Merged configuration
 */
function mergeProviderConfig(currentConfig, updatedConfig, options = {}) {
  const {
    preserveEnabled = false,
    preserveDeploymentTypes = false
  } = options;

  // Start with existing config to preserve all fields, then overlay updates
  const mergedConfig = {
    ...(currentConfig || {}),
    ...(updatedConfig || {})
  };

  // Preserve enabled state if requested
  if (preserveEnabled && currentConfig && 'enabled' in currentConfig) {
    mergedConfig.enabled = currentConfig.enabled;
  }

  // Preserve deployment_types if requested and exists
  if (preserveDeploymentTypes && currentConfig && 'deployment_types' in currentConfig) {
    mergedConfig.deployment_types = currentConfig.deployment_types;
  }
  return mergedConfig;
}

/**
 * Merge multiple provider updates
 *
 * Pure function for merging multiple provider config updates.
 *
 * @param {Object} currentProviders Current provider configurations
 * @param {Object} updates Object mapping provider IDs to their updated configs
 * @return {Object} Updated provider configurations
 */
function mergeMultipleProviders(currentProviders, updates) {
  if (!updates || typeof updates !== 'object') {
    return currentProviders || {};
  }
  return {
    ...(currentProviders || {}),
    ...Object.entries(updates).reduce((acc, [providerId, config]) => {
      acc[providerId] = {
        ...(currentProviders?.[providerId] || {}),
        ...(config || {})
      };
      return acc;
    }, {})
  };
}

/**
 * Provider Settings API Service Class
 *
 * Handles all provider settings operations via REST API.
 */
class ProviderSettingsAPI {
  /**
   * Create API service instance
   *
   * @param {Function} apiFetch WordPress apiFetch function (injectable for testing)
   */
  constructor(apiFetch) {
    this.apiFetch = apiFetch;
  }

  /**
   * Fetch all provider settings
   *
   * @return {Promise<Object>} Provider configurations object
   */
  async fetchAll() {
    const response = await this.apiFetch({
      path: '/aether/site-exporter/settings?key=providers'
    });
    if (!response.success) {
      throw new Error('Failed to load provider settings');
    }
    return response.value || {};
  }

  /**
   * Save provider settings
   *
   * @param {Object} providers Provider configurations to save
   * @return {Promise<Object>} Saved provider configurations
   */
  async save(providers) {
    const response = await this.apiFetch({
      path: '/aether/site-exporter/settings',
      method: 'POST',
      data: {
        key: 'providers',
        value: providers
      }
    });
    if (!response.success) {
      throw new Error('Failed to save provider settings');
    }
    return providers;
  }

  /**
   * Update a single provider's configuration
   *
   * @param {string} providerId Provider ID
   * @param {Object} updatedConfig Updated configuration
   * @param {Object} options Merge options
   * @return {Promise<Object>} Updated provider configurations
   */
  async update(providerId, updatedConfig, options = {}) {
    // Fetch current settings
    const currentProviders = await this.fetchAll();
    const currentConfig = currentProviders[providerId] || {};

    // Merge configurations using pure function
    const mergedConfig = mergeProviderConfig(currentConfig, updatedConfig, options);

    // Build updated providers object
    const updatedProviders = {
      ...currentProviders,
      [providerId]: mergedConfig
    };

    // Save to API
    return await this.save(updatedProviders);
  }

  /**
   * Update multiple providers at once
   *
   * @param {Object} updates Object mapping provider IDs to their updated configs
   * @return {Promise<Object>} Updated provider configurations
   */
  async updateMultiple(updates) {
    // Fetch current settings
    const currentProviders = await this.fetchAll();

    // Merge all updates using pure function
    const updatedProviders = mergeMultipleProviders(currentProviders, updates);

    // Save to API
    return await this.save(updatedProviders);
  }

  /**
   * Toggle provider enabled state
   *
   * @param {string} providerId Provider ID
   * @param {boolean} enabled New enabled state
   * @return {Promise<Object>} Updated provider configurations
   */
  async toggleEnabled(providerId, enabled) {
    return await this.update(providerId, {
      enabled
    });
  }

  /**
   * Create a new provider instance
   *
   * @param {string} instanceId Client-generated instance ID (provider_type:uuid)
   * @param {string} providerType Provider type (e.g., 'local-filesystem')
   * @param {string} instanceName User-friendly instance name
   * @return {Promise<Object>} Created instance info
   */
  async createInstance(instanceId, providerType, instanceName) {
    const response = await this.apiFetch({
      path: `/aether/site-exporter/providers/${providerType}/instances`,
      method: 'POST',
      data: {
        instance_id: instanceId,
        instance_name: instanceName
      }
    });
    if (!response.success) {
      throw new Error('Failed to create provider instance');
    }
    return response;
  }

  /**
   * Rename a provider instance
   *
   * @param {string} instanceId Instance ID
   * @param {string} instanceName New instance name
   * @return {Promise<Object>} Updated provider configurations
   */
  async renameInstance(instanceId, instanceName) {
    return await this.update(instanceId, {
      instance_name: instanceName
    });
  }

  /**
   * Delete a provider instance
   *
   * @param {string} instanceId Instance ID
   * @return {Promise<Object>} Updated provider configurations
   */
  async deleteInstance(instanceId) {
    // Delete via REST API
    await this.apiFetch({
      path: `/aether/site-exporter/providers/${instanceId}/config`,
      method: 'DELETE'
    });

    // Fetch and return updated settings
    return await this.fetchAll();
  }
}
;// ./assets/src/hooks/useProviderSettings.js
/**
 * Provider Settings Hook
 *
 * Centralized hook for fetching and updating provider settings.
 * Eliminates duplicate code across components that manage provider configurations.
 *
 * Uses ProviderSettingsAPI service for all business logic.
 * Hook provides React state management (loading/error) around service calls.
 *
 * @package
 */





/**
 * Custom hook for managing provider settings
 *
 * @return {Object} Settings management functions and state
 */
function useProviderSettings() {
  const [loading, setLoading] = (0,external_wp_element_namespaceObject.useState)(false);
  const [error, setError] = (0,external_wp_element_namespaceObject.useState)(null);

  // Create service instance with apiFetch (memoized to prevent recreation)
  const api = (0,external_wp_element_namespaceObject.useMemo)(() => new ProviderSettingsAPI((external_wp_apiFetch_default())), []);

  /**
   * Fetch all provider settings
   *
   * @return {Promise<Object>} Provider configurations object
   */
  const fetchProviderSettings = (0,external_wp_element_namespaceObject.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const providers = await api.fetchAll();
      setLoading(false);
      return providers;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Update a single provider's configuration
   *
   * @param {string}  providerId                      Provider ID
   * @param {Object}  updatedConfig                   Updated configuration for the provider
   * @param {Object}  options                         Options
   * @param {boolean} options.preserveEnabled         Preserve existing enabled state (default: false)
   * @param {boolean} options.preserveDeploymentTypes Preserve existing deployment_types (default: false)
   * @return {Promise<Object>} Updated provider configurations
   */
  const updateProviderConfig = (0,external_wp_element_namespaceObject.useCallback)(async (providerId, updatedConfig, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProviders = await api.update(providerId, updatedConfig, options);
      setLoading(false);
      return updatedProviders;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Update multiple providers at once
   *
   * @param {Object} updates Object mapping provider IDs to their updated configs
   * @return {Promise<Object>} Updated provider configurations
   */
  const updateMultipleProviders = (0,external_wp_element_namespaceObject.useCallback)(async updates => {
    setLoading(true);
    setError(null);
    try {
      const updatedProviders = await api.updateMultiple(updates);
      setLoading(false);
      return updatedProviders;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Toggle provider enabled state
   *
   * @param {string}  providerId Provider ID (can be instance ID)
   * @param {boolean} enabled    New enabled state
   * @return {Promise<Object>} Updated provider configurations
   */
  const toggleProviderEnabled = (0,external_wp_element_namespaceObject.useCallback)(async (providerId, enabled) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProviders = await api.toggleEnabled(providerId, enabled);
      setLoading(false);
      return updatedProviders;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Create a new provider instance
   *
   * @param {string} instanceId   Client-generated instance ID (provider_type:uuid)
   * @param {string} providerType Provider type (e.g., 'local-filesystem')
   * @param {string} instanceName User-friendly instance name
   * @return {Promise<Object>} Created instance info
   */
  const createProviderInstance = (0,external_wp_element_namespaceObject.useCallback)(async (instanceId, providerType, instanceName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.createInstance(instanceId, providerType, instanceName);
      setLoading(false);
      return response;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Rename a provider instance
   *
   * @param {string} instanceId   Instance ID
   * @param {string} instanceName New instance name
   * @return {Promise<Object>} Updated provider configurations
   */
  const renameProviderInstance = (0,external_wp_element_namespaceObject.useCallback)(async (instanceId, instanceName) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProviders = await api.renameInstance(instanceId, instanceName);
      setLoading(false);
      return updatedProviders;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);

  /**
   * Delete a provider instance
   *
   * @param {string} instanceId Instance ID
   * @return {Promise<Object>} Updated provider configurations
   */
  const deleteProviderInstance = (0,external_wp_element_namespaceObject.useCallback)(async instanceId => {
    setLoading(true);
    setError(null);
    try {
      const updatedProviders = await api.deleteInstance(instanceId);
      setLoading(false);
      return updatedProviders;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [api]);
  return {
    loading,
    error,
    fetchProviderSettings,
    updateProviderConfig,
    updateMultipleProviders,
    toggleProviderEnabled,
    createProviderInstance,
    renameProviderInstance,
    deleteProviderInstance
  };
}
;// ./assets/src/admin-settings/ProviderSettings.js
/**
 * Provider Settings Component (Instance-Based)
 *
 * Displays provider types with their instances grouped together.
 * Each provider type section can have multiple named instances.
 *
 * @package
 */











/**
 * Provider Settings Component.
 *
 * @param {Object}   props                 Component props.
 * @param {Object}   props.providerConfigs Provider configurations from parent.
 * @param {Function} props.onConfigsUpdate Callback to update parent configs.
 * @param {Function} props.onNotice        Callback to show notices.
 * @return {JSX.Element} Rendered component.
 */

function ProviderSettings({
  providerConfigs = {},
  onConfigsUpdate,
  onNotice
}) {
  const [providers, setProviders] = (0,external_wp_element_namespaceObject.useState)([]);
  const [loading, setLoading] = (0,external_wp_element_namespaceObject.useState)(true);
  const [selectedInstanceId, setSelectedInstanceId] = (0,external_wp_element_namespaceObject.useState)(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = (0,external_wp_element_namespaceObject.useState)(false);
  const [isAddModalOpen, setIsAddModalOpen] = (0,external_wp_element_namespaceObject.useState)(false);

  // Local state for optimistic updates
  const [localConfigs, setLocalConfigs] = (0,external_wp_element_namespaceObject.useState)(providerConfigs);

  // Sync local state when parent prop changes
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    setLocalConfigs(providerConfigs);
  }, [providerConfigs]);
  const configs = localConfigs;

  // Initialize provider settings hook
  const {
    toggleProviderEnabled,
    createProviderInstance,
    deleteProviderInstance,
    renameProviderInstance
  } = useProviderSettings();
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    // Fetch providers from REST API (PHP registry is source of truth)
    const loadProviders = async () => {
      try {
        // Fetch provider metadata from REST API
        const providersResponse = await utils_api({
          path: '/aether/site-exporter/providers'
        });
        if (providersResponse.success && providersResponse.providers) {
          setProviders(providersResponse.providers);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create flat list of all instances with provider metadata
  const allInstances = Object.entries(configs).map(([instanceId, config]) => {
    const providerType = config.provider_type || instanceId.split(':')[0];
    const provider = providers.find(p => p.id === providerType);
    return {
      instanceId,
      config,
      provider: provider || {
        name: providerType,
        id: providerType
      }
    };
  });
  const handleCreateInstanceConfirm = (0,external_wp_element_namespaceObject.useCallback)(async (instanceId, providerType, instanceName) => {
    // Get provider metadata for default deployment types
    const provider = providers.find(p => p.id === providerType);
    const defaultDeploymentTypes = provider?.deployment_types || [];

    // Optimistically add the new instance to local state
    const newInstance = {
      provider_type: providerType,
      instance_name: instanceName,
      enabled: false,
      deployment_types: defaultDeploymentTypes
    };
    const optimisticConfigs = {
      ...localConfigs,
      [instanceId]: newInstance
    };
    setLocalConfigs(optimisticConfigs);
    try {
      // Create instance in backend
      await createProviderInstance(instanceId, providerType, instanceName);

      // Update parent state (persists the optimistic update)
      if (onConfigsUpdate) {
        onConfigsUpdate(optimisticConfigs);
      }
    } catch (error) {
      console.error('Failed to create instance:', error);

      // Rollback optimistic update on error
      setLocalConfigs(localConfigs);

      // Re-throw to show error in modal
      throw error;
    }
  }, [createProviderInstance, onConfigsUpdate, localConfigs, providers]);
  const handleConfigureInstance = (0,external_wp_element_namespaceObject.useCallback)(async instanceId => {
    setSelectedInstanceId(instanceId);
    setIsConfigModalOpen(true);
  }, []);
  const handleToggleInstance = (0,external_wp_element_namespaceObject.useCallback)(async (instanceId, enabled) => {
    try {
      const updatedProviders = await toggleProviderEnabled(instanceId, enabled);

      // Update parent configs state
      if (onConfigsUpdate) {
        onConfigsUpdate(updatedProviders);
      }
    } catch (error) {
      console.error('Failed to toggle instance:', error);
    }
  }, [toggleProviderEnabled, onConfigsUpdate]);
  const handleDeleteInstance = (0,external_wp_element_namespaceObject.useCallback)(async instanceId => {
    // Optimistically remove from local state
    const {
      [instanceId]: removed,
      ...remainingConfigs
    } = localConfigs;
    setLocalConfigs(remainingConfigs);
    try {
      // Delete from backend
      await deleteProviderInstance(instanceId);

      // Update parent state (persists the optimistic update)
      if (onConfigsUpdate) {
        onConfigsUpdate(remainingConfigs);
      }
    } catch (error) {
      console.error('Failed to delete instance:', error);

      // Rollback optimistic update on error
      setLocalConfigs(localConfigs);

      // Show error notification
      if (onNotice) {
        onNotice(`Failed to delete instance: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  }, [deleteProviderInstance, onConfigsUpdate, localConfigs, onNotice]);
  const handleRenameInstance = (0,external_wp_element_namespaceObject.useCallback)(async (instanceId, newName) => {
    try {
      const updatedProviders = await renameProviderInstance(instanceId, newName);

      // Update parent configs state
      if (onConfigsUpdate) {
        onConfigsUpdate(updatedProviders);
      }
    } catch (error) {
      console.error('Failed to rename instance:', error);
      throw error;
    }
  }, [renameProviderInstance, onConfigsUpdate]);
  const handleModalSave = (0,external_wp_element_namespaceObject.useCallback)((instanceId, updatedConfig) => {
    // Update local state immediately for reactivity
    const updatedConfigs = {
      ...localConfigs,
      [instanceId]: updatedConfig
    };
    setLocalConfigs(updatedConfigs);

    // Also update parent state
    if (onConfigsUpdate) {
      onConfigsUpdate(updatedConfigs);
    }
  }, [localConfigs, onConfigsUpdate]);
  const handleModalClose = (0,external_wp_element_namespaceObject.useCallback)(() => {
    setIsConfigModalOpen(false);
    setSelectedInstanceId(null);
  }, []);
  if (loading) {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings aether-provider-settings--loading",
      style: {
        textAlign: 'center',
        padding: spacing.xl
      },
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Spinner, {
        className: "aether-provider-settings__spinner"
      })
    });
  }
  if (providers.length === 0) {
    return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings aether-provider-settings--empty",
      children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
        className: "aether-provider-settings__empty-message",
        style: {
          color: colors.textSecondary
        },
        children: (0,external_wp_i18n_namespaceObject.__)('No providers available. Install a provider plugin to enable deployment options.', 'aether-site-exporter')
      })
    });
  }

  // Get selected instance and provider for config modal
  const selectedInstance = selectedInstanceId ? {
    instanceId: selectedInstanceId,
    config: configs[selectedInstanceId] || {}
  } : null;
  const selectedProvider = selectedInstance && selectedInstance.config.provider_type ? providers.find(p => p.id === selectedInstance.config.provider_type) : null;
  const pageHeaderStyle = {
    marginBottom: spacing.lg,
    fontSize: '1.5rem',
    fontWeight: fontWeight.bold,
    color: colors.text,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };
  const pageDescriptionStyle = {
    marginBottom: spacing.lg,
    color: colors.textSecondary,
    fontSize: '0.875rem'
  };

  // Count total instances
  const totalInstances = Object.keys(configs).length;
  const enabledInstances = Object.values(configs).filter(c => c.enabled !== false).length;
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-provider-settings",
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-provider-settings__header",
      style: pageHeaderStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
        className: "aether-provider-settings__header-content",
        children: /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h2", {
          className: "aether-provider-settings__title",
          style: {
            margin: 0
          },
          children: (0,external_wp_i18n_namespaceObject.__)('Provider Instances', 'aether-site-exporter')
        })
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "aether-provider-settings__add-button",
        variant: "primary",
        onClick: () => setIsAddModalOpen(true),
        children: (0,external_wp_i18n_namespaceObject.__)('Add Provider Instance', 'aether-site-exporter')
      })]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("p", {
      className: "aether-provider-settings__description",
      style: pageDescriptionStyle,
      children: (0,external_wp_i18n_namespaceObject.__)('Create and manage multiple instances of each provider type. Each instance can have its own configuration and deployment settings.', 'aether-site-exporter')
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-provider-settings__stats",
      style: {
        fontSize: '0.875rem',
        color: colors.textSecondary,
        marginBottom: spacing.lg
      },
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
        className: "aether-provider-settings__stat",
        children: [(0,external_wp_i18n_namespaceObject.__)('Total Instances:', 'aether-site-exporter'), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          className: "aether-provider-settings__stat-value",
          children: totalInstances
        })]
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("span", {
        className: "aether-provider-settings__stat-separator",
        children: ' • '
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("span", {
        className: "aether-provider-settings__stat",
        children: [(0,external_wp_i18n_namespaceObject.__)('Enabled:', 'aether-site-exporter'), ' ', /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("strong", {
          className: "aether-provider-settings__stat-value",
          children: enabledInstances
        })]
      })]
    }), allInstances.length > 0 ? /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings__grid",
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: spacing.md
      },
      children: allInstances.map(instance => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderInstanceCard, {
        provider: instance.provider,
        instance: {
          instanceId: instance.instanceId,
          config: instance.config
        },
        onConfigure: () => handleConfigureInstance(instance.instanceId),
        onToggle: enabled => handleToggleInstance(instance.instanceId, enabled),
        onDelete: () => handleDeleteInstance(instance.instanceId),
        onRename: handleRenameInstance
      }, instance.instanceId))
    }) : /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("div", {
      className: "aether-provider-settings__empty-state",
      style: {
        padding: spacing.xl,
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: '0.875rem',
        border: `1px dashed ${colors.borderLight}`,
        borderRadius: '8px'
      },
      children: (0,external_wp_i18n_namespaceObject.__)('No provider instances configured. Click "Add Provider Instance" to create one.', 'aether-site-exporter')
    }), selectedProvider && selectedInstance && /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderConfigModal, {
      isOpen: isConfigModalOpen,
      onClose: handleModalClose,
      onSave: handleModalSave,
      provider: {
        id: selectedProvider.id,
        metadata: {
          name: selectedProvider.name,
          description: selectedProvider.description,
          supportedDeploymentTypes: selectedProvider.deployment_types || [],
          type: selectedProvider.type
        },
        settingsFields: (selectedProvider.settings_fields || []).map(field => ({
          ...field,
          id: field.name
        }))
      },
      initialConfig: selectedInstance.config,
      instanceId: selectedInstanceId
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(AddProviderInstanceModal, {
      isOpen: isAddModalOpen,
      onClose: () => setIsAddModalOpen(false),
      providers: providers,
      onCreate: handleCreateInstanceConfirm
    })]
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
  const [notices, setNotices] = (0,external_wp_element_namespaceObject.useState)([]);

  // Add notice helper
  const addNotice = (0,external_wp_element_namespaceObject.useCallback)((message, status = 'error') => {
    const id = Date.now();
    setNotices(prev => [...prev, {
      id,
      message,
      status,
      isDismissible: true
    }]);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotices(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Remove notice helper
  const removeNotice = (0,external_wp_element_namespaceObject.useCallback)(id => {
    setNotices(prev => prev.filter(n => n.id !== id));
  }, []);

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
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md
  };
  const headingStyle = {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1
  };
  const sectionsStyle = {
    ...createFlexStyle('column', spacing.lg)
  };
  return /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
    className: "aether-admin-settings",
    style: containerStyle,
    children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-admin-settings__header",
      style: headerStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)("h1", {
        className: "aether-admin-settings__heading",
        style: headingStyle,
        children: (0,external_wp_i18n_namespaceObject.__)('Aether Site Exporter Settings', 'aether-site-exporter')
      }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Button, {
        className: "aether-admin-settings__export-button",
        variant: "primary",
        onClick: () => setIsExportModalOpen(true),
        children: (0,external_wp_i18n_namespaceObject.__)('Export Site', 'aether-site-exporter')
      })]
    }), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsxs)("div", {
      className: "aether-admin-settings__sections",
      style: sectionsStyle,
      children: [/*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
        className: "aether-admin-settings__notice aether-admin-settings__notice--info",
        status: "info",
        isDismissible: false,
        children: (0,external_wp_i18n_namespaceObject.__)('Aether Site Exporter allows you to export your WordPress site as a complete package.', 'aether-site-exporter')
      }), notices.map(notice => /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(external_wp_components_namespaceObject.Notice, {
        className: `aether-admin-settings__notice aether-admin-settings__notice--${notice.status}`,
        status: notice.status,
        isDismissible: notice.isDismissible,
        onRemove: () => removeNotice(notice.id),
        children: notice.message
      }, notice.id)), /*#__PURE__*/(0,external_ReactJSXRuntime_namespaceObject.jsx)(ProviderSettings, {
        providerConfigs: providerConfigs,
        onConfigsUpdate: handleConfigsUpdate,
        onNotice: addNotice
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
;// ./assets/src/utils/errorHandler.js
/**
 * Global Error Handler
 *
 * Handles unhandled promise rejections and runtime errors globally.
 *
 * @package
 */



/**
 * Initialize global error handlers
 */
function initializeErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    debugError('Unhandled promise rejection:', {
      reason: event.reason,
      promise: event.promise
    });

    // Prevent default browser behavior (console error)
    event.preventDefault();

    // Show user-friendly error notification
    showErrorNotification('An unexpected error occurred. Please try again or refresh the page.');
  });

  // Handle uncaught errors
  window.addEventListener('error', event => {
    debugError('Uncaught error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });

    // Don't prevent default for syntax errors - let them show in console
    if (event.error && event.error.stack) {
      event.preventDefault();
      showErrorNotification('An unexpected error occurred. Please refresh the page.');
    }
  });
}

/**
 * Show error notification to user
 *
 * @param {string} message Error message to display
 */
function showErrorNotification(message) {
  // Use WordPress notices if available
  if (window.wp && window.wp.data && window.wp.data.dispatch) {
    const {
      createErrorNotice
    } = window.wp.data.dispatch('core/notices');
    if (createErrorNotice) {
      createErrorNotice(message, {
        id: 'aether-global-error',
        isDismissible: true
      });
      return;
    }
  }

  // Fallback to console error
  console.error(message);
}
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






// Initialize global error handlers

initializeErrorHandlers();

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