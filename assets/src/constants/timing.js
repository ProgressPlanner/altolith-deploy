/**
 * Timing Constants
 *
 * Centralized timing values for polling intervals, timeouts, and delays
 *
 * @package
 */

/**
 * Polling Intervals
 *
 * Standard polling intervals for various operations.
 * All values in milliseconds.
 */

/**
 * Default polling interval for job status checks
 * @constant {number} milliseconds
 */
export const POLLING_INTERVAL = 500;

/**
 * Slow polling interval for less critical operations
 * @constant {number} milliseconds
 */
export const SLOW_POLLING_INTERVAL = 1000;

/**
 * Fast polling interval for time-sensitive operations
 * @constant {number} milliseconds
 */
export const FAST_POLLING_INTERVAL = 250;

/**
 * Very slow polling interval for background operations
 * @constant {number} milliseconds
 */
export const VERY_SLOW_POLLING_INTERVAL = 2000;

/**
 * Media upload polling interval
 * @constant {number} milliseconds
 */
export const MEDIA_POLLING_INTERVAL = 500;

/**
 * Publish status polling interval
 * @constant {number} milliseconds
 */
export const PUBLISH_STATUS_POLLING_INTERVAL = 500;

/**
 * Worker status polling interval
 * @constant {number} milliseconds
 */
export const WORKER_STATUS_POLLING_INTERVAL = 1000;

/**
 * Timeouts
 *
 * Timeout values for various operations.
 * All values in milliseconds.
 */

/**
 * Default timeout for API requests
 * @constant {number} milliseconds
 */
export const TIMEOUT_DEFAULT = 5000;

/**
 * Long timeout for complex operations (publish, export, etc.)
 * @constant {number} milliseconds
 */
export const TIMEOUT_LONG = 30000;

/**
 * Very long timeout for file uploads
 * @constant {number} milliseconds
 */
export const TIMEOUT_VERY_LONG = 60000;

/**
 * Short timeout for quick operations
 * @constant {number} milliseconds
 */
export const TIMEOUT_SHORT = 2000;

/**
 * Timeout for connection tests
 * @constant {number} milliseconds
 */
export const TIMEOUT_CONNECTION_TEST = 10000;

/**
 * Maximum polling timeout (stop polling after this duration)
 * @constant {number} milliseconds
 */
export const MAX_POLLING_TIMEOUT = 300000; // 5 minutes

/**
 * Delays
 *
 * Delay values for UI interactions and debouncing.
 * All values in milliseconds.
 */

/**
 * Default debounce delay for input fields
 * @constant {number} milliseconds
 */
export const DEBOUNCE_DELAY = 300;

/**
 * Debounce delay for search inputs
 * @constant {number} milliseconds
 */
export const DEBOUNCE_SEARCH = 500;

/**
 * Debounce delay for auto-save
 * @constant {number} milliseconds
 */
export const DEBOUNCE_AUTO_SAVE = 1000;

/**
 * Throttle delay for scroll events
 * @constant {number} milliseconds
 */
export const THROTTLE_SCROLL = 100;

/**
 * Throttle delay for resize events
 * @constant {number} milliseconds
 */
export const THROTTLE_RESIZE = 150;

/**
 * Delay before showing success message
 * @constant {number} milliseconds
 */
export const SUCCESS_DELAY = 200;

/**
 * Duration to show success message
 * @constant {number} milliseconds
 */
export const SUCCESS_TIMEOUT = 3000;

/**
 * Duration to show error message
 * @constant {number} milliseconds
 */
export const ERROR_TIMEOUT = 5000;

/**
 * Duration to show notification
 * @constant {number} milliseconds
 */
export const NOTIFICATION_TIMEOUT = 4000;

/**
 * Delay before auto-dismissing toast messages
 * @constant {number} milliseconds
 */
export const TOAST_AUTO_DISMISS = 3000;

/**
 * Animation Durations
 *
 * Standard animation durations for transitions.
 * All values in milliseconds.
 */

/**
 * Fast animation duration
 * @constant {number} milliseconds
 */
export const ANIMATION_FAST = 150;

/**
 * Normal animation duration
 * @constant {number} milliseconds
 */
export const ANIMATION_NORMAL = 250;

/**
 * Slow animation duration
 * @constant {number} milliseconds
 */
export const ANIMATION_SLOW = 400;

/**
 * Modal fade duration
 * @constant {number} milliseconds
 */
export const ANIMATION_MODAL_FADE = 200;

/**
 * Retry Configuration
 *
 * Configuration for retry logic
 */

/**
 * Maximum number of retry attempts
 * @constant {number}
 */
export const MAX_RETRIES = 3;

/**
 * Initial retry delay (exponential backoff starts from this)
 * @constant {number} milliseconds
 */
export const RETRY_INITIAL_DELAY = 1000;

/**
 * Maximum retry delay (exponential backoff caps at this)
 * @constant {number} milliseconds
 */
export const RETRY_MAX_DELAY = 30000;

/**
 * Cache Durations
 *
 * How long to cache various types of data.
 * All values in milliseconds.
 */

/**
 * Default cache duration
 * @constant {number} milliseconds
 */
export const CACHE_DEFAULT = 60000; // 1 minute

/**
 * Short cache duration for frequently changing data
 * @constant {number} milliseconds
 */
export const CACHE_SHORT = 30000; // 30 seconds

/**
 * Long cache duration for rarely changing data
 * @constant {number} milliseconds
 */
export const CACHE_LONG = 300000; // 5 minutes

/**
 * Very long cache duration for static data
 * @constant {number} milliseconds
 */
export const CACHE_VERY_LONG = 600000; // 10 minutes

/**
 * Provider config cache duration
 * @constant {number} milliseconds
 */
export const CACHE_PROVIDER_CONFIG = 300000; // 5 minutes

/**
 * Settings cache duration
 * @constant {number} milliseconds
 */
export const CACHE_SETTINGS = 300000; // 5 minutes
