/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 14:
/*!***************************************************!*\
  !*** ./assets/src/publish/utils/htmlProcessor.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getStaticFilePath: () => (/* binding */ getStaticFilePath),
/* harmony export */   processHtml: () => (/* binding */ processHtml)
/* harmony export */ });
/* harmony import */ var _urlRewriter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./urlRewriter */ 8586);
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
  const urlRewriter = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.createUrlRewriter)(siteUrl, staticSiteUrl);
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
  path = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.stripPlaygroundScope)(path);

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

/***/ }),

/***/ 54:
/*!*****************************************************!*\
  !*** ./assets/src/components/ProviderForm/index.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _StatusNotice__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../StatusNotice */ 9403);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils/api */ 1561);
/* harmony import */ var _utils_validation__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../utils/validation */ 4138);
/* harmony import */ var _ProviderField__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../ProviderField */ 9768);
/* harmony import */ var _hooks_useSuccessTimeout__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../hooks/useSuccessTimeout */ 9349);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__);
/**
 * Provider Form Component
 *
 * Dynamically renders a form based on provider field definitions.
 * Can be enhanced with react-hook-form once installed.
 *
 * @package
 */












// Styles - extracted to module level for performance

const formStyle = {
  ...(0,_utils_styles__WEBPACK_IMPORTED_MODULE_9__.createFlexStyle)('column', _utils_styles__WEBPACK_IMPORTED_MODULE_9__.spacing.md)
};
const actionsStyle = {
  ...(0,_utils_styles__WEBPACK_IMPORTED_MODULE_9__.createFlexStyle)('row', _utils_styles__WEBPACK_IMPORTED_MODULE_9__.spacing.sm),
  justifyContent: 'flex-end',
  marginTop: _utils_styles__WEBPACK_IMPORTED_MODULE_9__.spacing.md,
  paddingTop: _utils_styles__WEBPACK_IMPORTED_MODULE_9__.spacing.md,
  borderTop: `1px solid ${_utils_styles__WEBPACK_IMPORTED_MODULE_9__.colors.borderLight}`
};

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
  const [values, setValues] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(initializeValues);
  const [errors, setErrors] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({});
  const [saving, setSaving] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [success, setSuccess] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [error, setError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const {
    showSuccess,
    clearSuccess
  } = (0,_hooks_useSuccessTimeout__WEBPACK_IMPORTED_MODULE_8__.useSuccessTimeout)();

  // Refs for hook container elements
  const beforeFieldsRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const afterFieldsRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const actionsRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  // Update values when initialValues change
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    setValues(initializeValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);
  const handleFieldChange = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((fieldId, value) => {
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
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const hookContext = {
      providerId,
      values,
      onChange: handleFieldChange,
      errors,
      saving
    };

    // Trigger before_fields hook
    if (beforeFieldsRef.current) {
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__.doAction)('aether.provider.form.before_fields', hookContext);
    }

    // Trigger after_fields hook
    if (afterFieldsRef.current) {
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__.doAction)('aether.provider.form.after_fields', hookContext);
    }

    // Trigger actions hook
    if (actionsRef.current) {
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__.doAction)('aether.provider.form.actions', hookContext);
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
    const validation = (0,_utils_validation__WEBPACK_IMPORTED_MODULE_6__.validateConfig)(completeValues, fields);
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
        const settingsResponse = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_5__["default"])({
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
        const saveResponse = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_5__["default"])({
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
      setError(err.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Failed to save settings', 'aether-site-exporter'));
    } finally {
      setSaving(false);
    }
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("form", {
    className: "aether-provider-form",
    onSubmit: handleSubmit,
    style: formStyle,
    children: [error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_StatusNotice__WEBPACK_IMPORTED_MODULE_4__["default"], {
      status: "error",
      message: error,
      isDismissible: true,
      onRemove: () => setError(null),
      className: "aether-provider-form__notice"
    }), success && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_StatusNotice__WEBPACK_IMPORTED_MODULE_4__["default"], {
      status: "success",
      message: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Settings saved successfully!', 'aether-site-exporter'),
      isDismissible: true,
      onRemove: () => setSuccess(false),
      className: "aether-provider-form__notice"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
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
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_ProviderField__WEBPACK_IMPORTED_MODULE_7__["default"], {
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
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.Fragment, {
        children: [regularFields.map(renderField), advancedFields.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalToolsPanel, {
          className: "aether-provider-form__tools-panel",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Advanced settings', 'aether-site-exporter'),
          resetAll: null,
          children: advancedFields.map(field => {
            const isHidden = isFieldHidden(field);
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalToolsPanelItem, {
              className: "aether-provider-form__tools-panel-item",
              hasValue: () => hasFieldValue(field),
              label: field.label || field.name,
              onDeselect: () => resetField(field.id),
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_ProviderField__WEBPACK_IMPORTED_MODULE_7__["default"], {
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
    })(), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
      ref: afterFieldsRef,
      className: "aether-provider-form__after-fields",
      "data-provider-id": providerId
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
      className: "aether-provider-form__actions",
      style: actionsStyle,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        className: "aether-provider-form__submit-button",
        type: "submit",
        variant: "primary",
        isBusy: saving,
        disabled: saving,
        children: saving ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Saving…', 'aether-site-exporter') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Save Settings', 'aether-site-exporter')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
        ref: actionsRef,
        className: "aether-provider-form__actions-hook",
        "data-provider-id": providerId
      })]
    })]
  });
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if providerId, fields array length, or initialValues change
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.memo)(ProviderForm, (prevProps, nextProps) => {
  return prevProps.providerId === nextProps.providerId && prevProps.fields.length === nextProps.fields.length && JSON.stringify(prevProps.initialValues) === JSON.stringify(nextProps.initialValues);
}));

/***/ }),

/***/ 159:
/*!****************************************************!*\
  !*** ./assets/src/components/SecretField/index.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ SecretField)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);
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
  const [isVisible, setIsVisible] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
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
  const [isHovered, setIsHovered] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);

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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
    className: "aether-secret-field",
    style: containerStyle,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "aether-secret-field__wrapper",
      style: inputWrapperStyle,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.TextControl, {
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
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
        type: "button",
        className: "aether-secret-field__toggle",
        onClick: () => setIsVisible(!isVisible),
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        style: {
          ...eyeButtonStyle,
          opacity: isHovered ? 1 : 0.7
        },
        "aria-label": isVisible ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Hide', 'aether-site-exporter') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Show', 'aether-site-exporter'),
        title: isVisible ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Hide', 'aether-site-exporter') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Show', 'aether-site-exporter'),
        children: isVisible ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("svg", {
          className: "aether-secret-field__icon aether-secret-field__icon--visible",
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 32 32",
          width: "18",
          height: "18",
          style: {
            display: 'block'
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("path", {
            d: "M30.94,15.66A16.69,16.69,0,0,0,16,5,16.69,16.69,0,0,0,1.06,15.66a1,1,0,0,0,0,.68A16.69,16.69,0,0,0,16,27,16.69,16.69,0,0,0,30.94,16.34,1,1,0,0,0,30.94,15.66ZM16,25c-5.3,0-10.9-3.93-12.93-9C5.1,10.93,10.7,7,16,7s10.9,3.93,12.93,9C26.9,21.07,21.3,25,16,25Z"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("path", {
            d: "M16,10a6,6,0,1,0,6,6A6,6,0,0,0,16,10Zm0,10a4,4,0,1,1,4-4A4,4,0,0,1,16,20Z"
          })]
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("svg", {
          className: "aether-secret-field__icon aether-secret-field__icon--hidden",
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 32 32",
          width: "18",
          height: "18",
          style: {
            display: 'block'
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("path", {
            d: "M5.24,22.51l1.43-1.42A14.06,14.06,0,0,1,3.07,16C5.1,10.93,10.7,7,16,7a12.38,12.38,0,0,1,4,.72l1.55-1.56A14.72,14.72,0,0,0,16,5,16.69,16.69,0,0,0,1.06,15.66a1,1,0,0,0,0,.68A16,16,0,0,0,5.24,22.51Z"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("path", {
            d: "M12,15.73a4,4,0,0,1,3.7-3.7l1.81-1.82a6,6,0,0,0-7.33,7.33Z"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("path", {
            d: "M30.94,15.66A16.4,16.4,0,0,0,25.2,8.22L30,3.41,28.59,2,2,28.59,3.41,30l5.1-5.1A15.29,15.29,0,0,0,16,27,16.69,16.69,0,0,0,30.94,16.34,1,1,0,0,0,30.94,15.66ZM20,16a4,4,0,0,1-6,3.44L19.44,14A4,4,0,0,1,20,16Zm-4,9a13.05,13.05,0,0,1-6-1.58l2.54-2.54a6,6,0,0,0,8.35-8.35l2.87-2.87A14.54,14.54,0,0,1,28.93,16C26.9,21.07,21.3,25,16,25Z"
          })]
        })
      })]
    })
  });
}

/***/ }),

/***/ 241:
/*!*************************************************!*\
  !*** ./assets/src/constants/deploymentTypes.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEPLOYMENT_TYPES: () => (/* binding */ DEPLOYMENT_TYPES),
/* harmony export */   DEPLOYMENT_TYPE_DESCRIPTIONS: () => (/* binding */ DEPLOYMENT_TYPE_DESCRIPTIONS),
/* harmony export */   DEPLOYMENT_TYPE_LABELS: () => (/* binding */ DEPLOYMENT_TYPE_LABELS)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
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
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Static Site', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Blueprint Bundle', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Edge Functions', 'aether-site-exporter')
};

/**
 * Descriptions for deployment types
 */
const DEPLOYMENT_TYPE_DESCRIPTIONS = {
  [DEPLOYMENT_TYPES.STATIC_SITE]: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Deploy static HTML/CSS/JS files for web hosting', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Deploy WordPress Playground blueprint bundle (ZIP file)', 'aether-site-exporter'),
  [DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Deploy serverless functions to edge computing platforms', 'aether-site-exporter')
};

/***/ }),

/***/ 602:
/*!*****************************************!*\
  !*** ./node_modules/idb/build/index.js ***!
  \*****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   deleteDB: () => (/* binding */ deleteDB),
/* harmony export */   openDB: () => (/* binding */ openDB),
/* harmony export */   unwrap: () => (/* binding */ unwrap),
/* harmony export */   wrap: () => (/* binding */ wrap)
/* harmony export */ });
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




/***/ }),

/***/ 698:
/*!****************************************!*\
  !*** ./assets/src/utils/wporgCache.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WpOrgCache: () => (/* binding */ WpOrgCache),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   getWpOrgCache: () => (/* binding */ getWpOrgCache)
/* harmony export */ });
/* harmony import */ var _indexedDB__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./indexedDB */ 6706);
/* harmony import */ var _debug__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./debug */ 1742);
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
    this.store = new _indexedDB__WEBPACK_IMPORTED_MODULE_0__["default"]('wporgChecks', WPORG_CACHE_CONFIG);
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
          (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)(`[WpOrgCache] Cleaned up ${deleted} expired cache entries`);
        }
        return deleted;
      } catch (error) {
        (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debugError)('[WpOrgCache] Error during cleanup:', error);
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
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (getWpOrgCache);

/***/ }),

/***/ 790:
/*!**********************************!*\
  !*** external "ReactJSXRuntime" ***!
  \**********************************/
/***/ ((module) => {

module.exports = window["ReactJSXRuntime"];

/***/ }),

/***/ 803:
/*!*********************************************************!*\
  !*** ./assets/src/components/UploadStatistics/index.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ UploadStatistics)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var _utils_helpers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/helpers */ 9484);
/* harmony import */ var _UploadStatistic__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../UploadStatistic */ 6002);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);
/**
 * Upload Statistics Component
 *
 * Displays upload statistics including provider count, files uploaded, and total size.
 * Calculates stats from message history and remains visible throughout publish workflow.
 *
 * @package
 */







/**
 * Upload Statistics Component
 *
 * @param {Object} props                          Component props
 * @param {Array}  props.messageHistory           Array of status messages
 * @param {Array}  props.staticSiteProviders      Array of provider IDs for static site deployment
 * @param {Array}  props.blueprintBundleProviders Array of provider IDs for blueprint bundle deployment
 * @return {JSX.Element|null} Upload statistics section or null if no stats available
 */

function UploadStatistics({
  messageHistory,
  staticSiteProviders = [],
  blueprintBundleProviders = []
}) {
  // Calculate upload statistics from message history
  const uploadStats = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    // Get provider count from actual provider arrays (more accurate than parsing messages)
    // Use the largest count between static and blueprint providers
    const providerCount = Math.max(staticSiteProviders.length, blueprintBundleProviders.length, 1);

    // Count static site files uploaded across all providers
    // Parse provider summary messages like "Completed Production: 100 files uploaded"
    // to get actual total (e.g., 100 files × 3 providers = 300 total uploads)
    const providerSummaryMessages = messageHistory.filter(msg => msg.key?.startsWith('upload-provider-') && msg.key?.endsWith('-summary'));

    // Count static site files
    let staticFileCount = 0;
    if (providerSummaryMessages.length > 0) {
      // Multi-provider: sum file counts from each provider summary
      providerSummaryMessages.forEach(msg => {
        const match = msg.message?.match(/(\d+)\s+files?\s+uploaded/i);
        if (match) {
          staticFileCount += parseInt(match[1], 10);
        }
      });
    } else {
      // Single provider or no summaries yet: count unique file messages
      const uploadedFileMessages = messageHistory.filter(msg => msg.type === 'success' && msg.metadata?.fileSize && msg.key?.startsWith('upload-'));
      staticFileCount = uploadedFileMessages.length;
    }

    // Count blueprint bundle uploads (1 file per provider)
    const blueprintFileCount = blueprintBundleProviders.length;

    // Total files = static files + blueprint bundles
    const fileCount = staticFileCount + blueprintFileCount;

    // Calculate total size from metadata
    // Static site files size
    const uploadedFileMessages = messageHistory.filter(msg => msg.type === 'success' && msg.metadata?.fileSize && msg.key?.startsWith('upload-'));
    const staticFilesSize = uploadedFileMessages.reduce((sum, msg) => {
      return sum + (msg.metadata?.fileSize || 0);
    }, 0);

    // Blueprint bundle size (only count once, not per provider)
    const blueprintMessages = messageHistory.filter(msg => msg.key === 'uploadSiteArchive' && msg.type === 'success' && msg.metadata?.isBlueprint);
    const blueprintSize = blueprintMessages[0]?.metadata?.bundleSize || 0;

    // Total size = static files + blueprint
    const totalSize = staticFilesSize + blueprintSize;
    return {
      providerCount,
      fileCount,
      totalSize: (0,_utils_helpers__WEBPACK_IMPORTED_MODULE_3__.formatFileSize)(totalSize)
    };
  }, [messageHistory, staticSiteProviders, blueprintBundleProviders]);

  // Don't render if no uploads at all
  if (uploadStats.fileCount === 0) {
    return null;
  }

  // Styles
  const detailsSectionStyle = {
    marginTop: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.lg,
    padding: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.md,
    backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.colors.backgroundLight,
    borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.borderRadius.sm,
    border: `1px solid ${_utils_styles__WEBPACK_IMPORTED_MODULE_2__.colors.borderLighter}`,
    ...(0,_utils_styles__WEBPACK_IMPORTED_MODULE_2__.createFlexStyle)('row', _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.xl),
    justifyContent: 'space-around',
    flexWrap: 'wrap'
  };
  const detailValueStyle = {
    fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.fontSize.lg,
    color: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.colors.text,
    fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.fontWeight.semibold
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("div", {
    className: "aether-publish-progress-modal__details",
    style: detailsSectionStyle,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_UploadStatistic__WEBPACK_IMPORTED_MODULE_4__["default"], {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Providers', 'aether-site-exporter'),
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("span", {
        style: detailValueStyle,
        children: uploadStats.providerCount
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_UploadStatistic__WEBPACK_IMPORTED_MODULE_4__["default"], {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Files Uploaded', 'aether-site-exporter'),
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("span", {
        style: detailValueStyle,
        children: uploadStats.fileCount
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_UploadStatistic__WEBPACK_IMPORTED_MODULE_4__["default"], {
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Total Size', 'aether-site-exporter'),
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("span", {
        style: detailValueStyle,
        children: uploadStats.totalSize
      })
    })]
  });
}

/***/ }),

/***/ 992:
/*!*****************************************************!*\
  !*** ./assets/src/publish/utils/assetExclusions.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ESSENTIAL_EXTENSIONS: () => (/* binding */ ESSENTIAL_EXTENSIONS),
/* harmony export */   EXCLUDED_URL_PATTERNS: () => (/* binding */ EXCLUDED_URL_PATTERNS),
/* harmony export */   EXCLUDED_URL_REGEX_PATTERNS: () => (/* binding */ EXCLUDED_URL_REGEX_PATTERNS),
/* harmony export */   SKIP_EXTENSIONS: () => (/* binding */ SKIP_EXTENSIONS),
/* harmony export */   WEBPACK_MODULE_IDS: () => (/* binding */ WEBPACK_MODULE_IDS),
/* harmony export */   isEssentialExtension: () => (/* binding */ isEssentialExtension),
/* harmony export */   isExcludedUrl: () => (/* binding */ isExcludedUrl),
/* harmony export */   isSkippedExtension: () => (/* binding */ isSkippedExtension),
/* harmony export */   isWebpackModuleId: () => (/* binding */ isWebpackModuleId)
/* harmony export */ });
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

/***/ }),

/***/ 1064:
/*!***************************************!*\
  !*** ./assets/src/utils/constants.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MAX_PROGRESS: () => (/* binding */ MAX_PROGRESS),
/* harmony export */   SHORT_DELAY_MS: () => (/* binding */ SHORT_DELAY_MS),
/* harmony export */   SUCCESS_MESSAGE_DURATION_MS: () => (/* binding */ SUCCESS_MESSAGE_DURATION_MS)
/* harmony export */ });
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

/***/ }),

/***/ 1075:
/*!**************************************!*\
  !*** ./assets/src/utils/fileHash.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   calculateFileHash: () => (/* binding */ calculateFileHash)
/* harmony export */ });
/* harmony import */ var _debug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./debug */ 1742);
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
async function calculateFileHash(file) {
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
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('calculateFileHash:', {
      fileSize: file.size,
      hashLength: hashHex.length
    });
    return hashHex;
  } catch (error) {
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debugError)('Failed to calculate file hash:', error);
    throw new Error(`Hash calculation failed: ${error.message}`);
  }
}

/***/ }),

/***/ 1350:
/*!**************************************************!*\
  !*** ./assets/src/publish/utils/assetFilters.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   shouldCollectAsset: () => (/* binding */ shouldCollectAsset)
/* harmony export */ });
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _urlRewriter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./urlRewriter */ 8586);
/* harmony import */ var _assetExclusions__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./assetExclusions */ 992);
/* harmony import */ var _assetPatterns__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./assetPatterns */ 9162);
/**
 * Asset Filters
 *
 * Pure functions for determining which assets to collect.
 *
 * @package
 */






/**
 * Extract module ID from URL for webpack checking.
 *
 * @param {string} url URL to extract module ID from.
 * @return {string|null} Module ID or null.
 */
function extractModuleId(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || pathname;
    return filename.replace(/\.[^.]*$/, '');
  } catch {
    const filenameMatch = url.match(/\/([^\/]+)(?:\.[^.]*)?(?:\?|$)/);
    return filenameMatch ? filenameMatch[1] : null;
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
  // FILTER 0: Skip webpack module IDs (not real files)
  const moduleId = extractModuleId(url);
  if (moduleId && (0,_assetExclusions__WEBPACK_IMPORTED_MODULE_2__.isWebpackModuleId)(moduleId)) {
    return false;
  }

  // Get file extension
  const extension = (0,_assetPatterns__WEBPACK_IMPORTED_MODULE_3__.getExtensionFromUrl)(url);

  // PRIORITY 1: Always collect essential assets (CSS, JS, fonts) EVEN IF EXTERNAL
  if ((0,_assetExclusions__WEBPACK_IMPORTED_MODULE_2__.isEssentialExtension)(extension)) {
    return true;
  }

  // FILTER 1 & 2: Skip excluded URL patterns
  if ((0,_assetExclusions__WEBPACK_IMPORTED_MODULE_2__.isExcludedUrl)(url)) {
    return false;
  }

  // FILTER 3: Skip external URLs for non-essential assets
  if ((0,_urlRewriter__WEBPACK_IMPORTED_MODULE_1__.isExternal)(url, siteUrl)) {
    return false;
  }

  // PRIORITY 2: Collect images when referenced in HTML (internal URLs only)
  if (source === 'html' && (0,_assetExclusions__WEBPACK_IMPORTED_MODULE_2__.isSkippedExtension)(extension)) {
    return true;
  }

  // FILTER 4: Skip image files when found in CSS/JS
  if ((0,_assetExclusions__WEBPACK_IMPORTED_MODULE_2__.isSkippedExtension)(extension)) {
    return false;
  }

  // PRIORITY 3: For other assets, apply filter hook
  let shouldCollect = true;

  /**
   * Filter whether an asset should be collected.
   *
   * @param {boolean} shouldCollect Whether to collect this asset.
   * @param {string}  url           Asset URL.
   * @param {string}  siteUrl       Site URL.
   * @param {string}  source        Asset source.
   * @param {string}  extension     File extension.
   */
  shouldCollect = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.assets.should_collect', shouldCollect, url, siteUrl, source, extension);
  return shouldCollect;
}

/***/ }),

/***/ 1455:
/*!**********************************!*\
  !*** external ["wp","apiFetch"] ***!
  \**********************************/
/***/ ((module) => {

module.exports = window["wp"]["apiFetch"];

/***/ }),

/***/ 1468:
/*!*********************************************!*\
  !*** ./assets/src/utils/staticSiteCache.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   StaticSiteCache: () => (/* binding */ StaticSiteCache),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _indexedDB__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./indexedDB */ 6706);
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
const CACHE_CONFIG = {
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
    this.store = new _indexedDB__WEBPACK_IMPORTED_MODULE_0__["default"]('urlCache', CACHE_CONFIG);
    this.isAvailable = (0,_indexedDB__WEBPACK_IMPORTED_MODULE_0__.isIndexedDBAvailable)();

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
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (StaticSiteCache);

/***/ }),

/***/ 1561:
/*!*********************************!*\
  !*** ./assets/src/utils/api.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   configureAPI: () => (/* binding */ configureAPI),
/* harmony export */   createAuthHeaders: () => (/* binding */ createAuthHeaders),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   invalidateCache: () => (/* binding */ invalidateCache),
/* harmony export */   setAPINonce: () => (/* binding */ setAPINonce)
/* harmony export */ });
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/api-fetch */ 1455);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _getRestUrl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./getRestUrl */ 5246);
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
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().createNonceMiddleware(nonce));
}

/**
 * Configure API fetch with base URL, nonce, and middleware.
 * Automatically fetches from meta tags if not provided.
 *
 * @param {string} restUrl Optional REST API base URL (fetches from meta if not provided).
 * @param {string} nonce   Optional WordPress REST API nonce (fetches from meta if not provided).
 */
function configureAPI(restUrl, nonce) {
  const url = restUrl || (0,_getRestUrl__WEBPACK_IMPORTED_MODULE_1__.getRestUrl)();
  const token = nonce || getNonce();
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().createRootURLMiddleware(url));
  if (token) {
    setAPINonce(token);
  }

  // Add custom middleware (order matters: caching before deduplication)
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(responseCachingMiddleware);
  _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(requestDeduplicationMiddleware);
}

// Auto-configure on module load.
configureAPI();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()));

/***/ }),

/***/ 1742:
/*!***********************************!*\
  !*** ./assets/src/utils/debug.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   debug: () => (/* binding */ debug),
/* harmony export */   debugError: () => (/* binding */ debugError),
/* harmony export */   debugGroup: () => (/* binding */ debugGroup),
/* harmony export */   debugGroupEnd: () => (/* binding */ debugGroupEnd),
/* harmony export */   debugInfo: () => (/* binding */ debugInfo),
/* harmony export */   debugTable: () => (/* binding */ debugTable),
/* harmony export */   debugTime: () => (/* binding */ debugTime),
/* harmony export */   debugTimeEnd: () => (/* binding */ debugTimeEnd),
/* harmony export */   debugWarn: () => (/* binding */ debugWarn),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   disableDebug: () => (/* binding */ disableDebug),
/* harmony export */   enableDebug: () => (/* binding */ enableDebug)
/* harmony export */ });
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
function debugWarn(...args) {
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
  warn: debugWarn,
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
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (debugUtil);

/***/ }),

/***/ 1751:
/*!*****************************************************************!*\
  !*** ./assets/src/publish/steps/createBlueprintBundle/index.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createBlueprintBundleStep: () => (/* binding */ createBlueprintBundleStep)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_helpers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../utils/helpers */ 9484);
/**
 * Create Blueprint Bundle Step
 *
 * Creates wp-content.zip containing custom plugins, themes, and uploads.
 * Used for blueprint bundle generation.
 *
 * @package
 */





/**
 * Create blueprint bundle step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {Object}   context.assetManager     Asset manager instance.
 * @param {Array}    context.discoveredAssets Discovered assets from discoverBlueprintBundleAssets step.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with archive info.
 */
async function handler(context) {
  const {
    api,
    assetManager,
    discoveredAssets = [],
    setStatusMessage
  } = context;
  setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Creating blueprint bundle…', 'aether-site-exporter'), 'progress', 'createBlueprintBundle');

  // Determine which files to include
  const filesToInclude = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.publish.step.createBlueprintBundle.files', discoveredAssets, context);

  // Create the archive via API
  const archiveResponse = await api.createArchive({
    assets: filesToInclude,
    includeUploads: true
  });
  if (!archiveResponse.success) {
    throw new Error(archiveResponse.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to create blueprint bundle', 'aether-site-exporter'));
  }
  const {
    zipPath,
    zipUrl,
    zipSize
  } = archiveResponse;
  const sizeFormatted = (0,_utils_helpers__WEBPACK_IMPORTED_MODULE_2__.formatFileSize)(zipSize || 0);

  // Update asset manager if provided and method exists
  if (assetManager && zipPath && typeof assetManager.setArchivePath === 'function') {
    assetManager.setArchivePath(zipPath);
  }
  setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: File size */
  (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Created blueprint bundle (%s)', 'aether-site-exporter'), sizeFormatted), 'success', 'createBlueprintBundle');

  // Return data to merge into execution state
  return {
    zipPath,
    zipUrl,
    zipSize
  };
}

/**
 * Create Blueprint Bundle step definition.
 */
const createBlueprintBundleStep = {
  id: 'createBlueprintBundle',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Create Bundle', 'aether-site-exporter'),
  description: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Package custom plugins, themes, and uploads', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['discoverBlueprintBundleAssets'],
  provides: ['zipPath', 'zipUrl', 'zipSize'],
  handler
};

/***/ }),

/***/ 1838:
/*!**************************************************!*\
  !*** ./assets/src/publish/utils/preScanPhase.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   executePreScan: () => (/* binding */ executePreScan)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _assetExtractor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./assetExtractor */ 8177);
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/debug */ 1742);
/* harmony import */ var _utils_staticSiteCache__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../utils/staticSiteCache */ 1468);
/**
 * Pre-Scan Phase
 *
 * Phase 1 of static site generation: Fetch all URLs, extract assets, count total files.
 *
 * @package
 */







/**
 * Execute the pre-scan phase.
 *
 * Fetches all URLs, extracts assets, and caches processed HTML.
 *
 * @param {Object}   options                  Pre-scan options.
 * @param {Array}    options.urls             URLs to scan.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.providerConfig   Provider configuration.
 * @param {Function} options.setStatusMessage Status message updater.
 * @return {Promise<Object>} Pre-scan results.
 */
async function executePreScan({
  urls,
  siteUrl,
  providerId,
  providerConfig,
  setStatusMessage
}) {
  const failures = {
    urlsFailed: 0,
    failedUrls: []
  };

  // Fire pre-scan start action
  (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.static.pre_scan.before', urls, providerId, providerConfig);
  if (setStatusMessage) {
    setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Scanning files to upload…', 'aether-site-exporter'), 'progress', 'scanFiles');
  }

  // Initialize cache
  const cache = new _utils_staticSiteCache__WEBPACK_IMPORTED_MODULE_4__["default"]();
  const allUniqueAssets = new Set();

  // Log cache health
  const cacheHealth = await cache.getHealth();
  if (cacheHealth.usingFallback) {
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debugWarn)('[Aether] IndexedDB not available, using in-memory fallback (500 URL limit)');
  }
  if (cacheHealth.recommendations.length > 0) {
    cacheHealth.recommendations.forEach(rec => (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debugWarn)(`[Aether] ${rec}`));
  }

  // Clean up old caches
  const cleanedCount = await cache.cleanup();
  if (cleanedCount > 0) {
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debug)(`[Aether] Cleaned up ${cleanedCount} old cache entries`);
  }

  // Scan each URL
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const htmlResponse = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'User-Agent': 'Aether Static Site Generator'
        }
      });
      if (htmlResponse.status !== 200) {
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debugWarn)(`[Aether] Skipping URL with non-200 status: ${url} (HTTP ${htmlResponse.status})`);
        failures.urlsFailed++;
        failures.failedUrls.push({
          url,
          reason: `Failed to fetch HTML: HTTP ${htmlResponse.status} ${htmlResponse.statusText}`
        });
        continue;
      }
      const html = await htmlResponse.text();

      // Extract assets
      const assetUrls = await (0,_assetExtractor__WEBPACK_IMPORTED_MODULE_2__.extractAssetsFromHtml)(html, url, siteUrl);

      // Add to unique set
      for (const assetUrl of assetUrls) {
        allUniqueAssets.add(assetUrl);
      }

      // Filter raw HTML before caching
      const filteredRawHtml = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.static.html.raw', html, url, siteUrl);

      // Cache HTML and assets
      await cache.set(url, filteredRawHtml, assetUrls);
    } catch (error) {
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debugWarn)(`[Aether] Error fetching URL: ${url}`, error.message);
      failures.urlsFailed++;
      failures.failedUrls.push({
        url,
        reason: error.message
      });
    }
  }

  // Get cache stats
  const cacheStats = await cache.getStats();
  const totalFilesToUpload = cacheStats.sessionCached + allUniqueAssets.size;
  (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debug)('Pre-scan complete:', {
    urlsScanned: urls.length,
    urlsSuccessful: cacheStats.sessionCached,
    uniqueAssets: allUniqueAssets.size,
    totalFilesToUpload
  });

  // Fire completion action
  (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.static.pre_scan.after', {
    urlsScanned: urls.length,
    urlsSuccessful: cacheStats.sessionCached,
    uniqueAssets: allUniqueAssets.size,
    totalFiles: totalFilesToUpload
  }, providerId);
  if (setStatusMessage) {
    setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$d: Number of HTML files, %2$d: Number of assets */
    (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Pre-scan complete: %1$d HTML files, %2$d assets', 'aether-site-exporter'), cacheStats.sessionCached, allUniqueAssets.size), 'success', 'scanFiles');
  }
  return {
    cache,
    allUniqueAssets,
    totalFilesToUpload,
    failures,
    cacheStats
  };
}

/***/ }),

/***/ 1900:
/*!****************************************************!*\
  !*** ./assets/src/services/ProviderSettingsAPI.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ProviderSettingsAPI: () => (/* binding */ ProviderSettingsAPI),
/* harmony export */   mergeMultipleProviders: () => (/* binding */ mergeMultipleProviders),
/* harmony export */   mergeProviderConfig: () => (/* binding */ mergeProviderConfig)
/* harmony export */ });
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
 * @param {Object}  currentConfig                   Current provider configuration
 * @param {Object}  updatedConfig                   Updated configuration
 * @param {Object}  options                         Merge options
 * @param {boolean} options.preserveEnabled         Preserve existing enabled state
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
 * @param {Object} updates          Object mapping provider IDs to their updated configs
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
   * @param {string} providerId    Provider ID
   * @param {Object} updatedConfig Updated configuration
   * @param {Object} options       Merge options
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
   * @param {string}  providerId Provider ID
   * @param {boolean} enabled    New enabled state
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
   * @param {string} instanceId   Client-generated instance ID (provider_type:uuid)
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
   * @param {string} instanceId   Instance ID
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

/***/ }),

/***/ 1937:
/*!***********************************************!*\
  !*** ./assets/src/hooks/usePublishContext.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   usePublishContext: () => (/* binding */ usePublishContext)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _contexts_PublishContext__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../contexts/PublishContext */ 4140);
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
  const context = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useContext)(_contexts_PublishContext__WEBPACK_IMPORTED_MODULE_1__.PublishContext);
  if (!context) {
    throw new Error('usePublishContext must be used within a PublishProvider');
  }
  return context;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (usePublishContext);

/***/ }),

/***/ 1945:
/*!***************************************************!*\
  !*** ./assets/src/publish/utils/htmlRewriting.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectSiteUrlMatches: () => (/* binding */ collectSiteUrlMatches),
/* harmony export */   protectScriptContent: () => (/* binding */ protectScriptContent),
/* harmony export */   replaceSiteUrlMatches: () => (/* binding */ replaceSiteUrlMatches),
/* harmony export */   restoreScriptContent: () => (/* binding */ restoreScriptContent),
/* harmony export */   rewriteAbsolutePaths: () => (/* binding */ rewriteAbsolutePaths),
/* harmony export */   rewriteImportMaps: () => (/* binding */ rewriteImportMaps),
/* harmony export */   rewriteSrcsetUrls: () => (/* binding */ rewriteSrcsetUrls)
/* harmony export */ });
/* harmony import */ var _urlUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./urlUtils */ 8607);
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/debug */ 1742);
/**
 * HTML Rewriting Utilities
 *
 * Helper functions for HTML URL rewriting.
 *
 * @package
 */




/**
 * Protect inline script content by replacing with placeholders.
 *
 * @param {string} html HTML content.
 * @return {Object} Object with protected HTML and placeholders map.
 */
function protectScriptContent(html) {
  const placeholders = {};
  let counter = 0;
  const protectedHtml = html.replace(/<script(?![^>]*type=["']importmap["'])([^>]*)>(.*?)<\/script>/gis, (match, openingAttrs, content) => {
    if (content.trim()) {
      const placeholder = `___SCRIPT_CONTENT_${counter}___`;
      placeholders[placeholder] = content;
      counter++;
      return `<script${openingAttrs}>${placeholder}</script>`;
    }
    return match;
  });
  return {
    html: protectedHtml,
    placeholders
  };
}

/**
 * Restore inline script content from placeholders.
 *
 * @param {string} html         HTML content with placeholders.
 * @param {Object} placeholders Placeholders map.
 * @return {string} HTML with restored script content.
 */
function restoreScriptContent(html, placeholders) {
  let result = html;
  for (const placeholder in placeholders) {
    if (placeholders.hasOwnProperty(placeholder)) {
      result = result.replace(placeholder, placeholders[placeholder]);
    }
  }
  return result;
}

/**
 * Collect all site URL matches from HTML.
 *
 * @param {string} html     HTML content.
 * @param {string} siteHost Site host to match.
 * @return {Array} Array of match objects with index, length, match, and type.
 */
function collectSiteUrlMatches(html, siteHost) {
  const escapedHost = (0,_urlUtils__WEBPACK_IMPORTED_MODULE_0__.escapeRegex)(siteHost);
  const matches = [];
  const httpPattern = new RegExp(`http://${escapedHost}[^"'\`\\s<>]*`, 'gi');
  const httpsPattern = new RegExp(`https://${escapedHost}[^"'\`\\s<>]*`, 'gi');
  const protocolRelativePattern = new RegExp(`//${escapedHost}[^"'\`\\s<>]*`, 'gi');
  let match;
  while ((match = httpPattern.exec(html)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      match: match[0],
      type: 'http'
    });
  }
  while ((match = httpsPattern.exec(html)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      match: match[0],
      type: 'https'
    });
  }
  while ((match = protocolRelativePattern.exec(html)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      match: match[0],
      type: 'protocol-relative'
    });
  }

  // Sort by index
  matches.sort((a, b) => a.index - b.index);
  return matches;
}

/**
 * Replace site URL matches in HTML.
 *
 * @param {string}   html       HTML content.
 * @param {Array}    matches    Match objects from collectSiteUrlMatches.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with replaced URLs.
 */
function replaceSiteUrlMatches(html, matches, rewriteUrl, contextUrl) {
  let result = '';
  let lastIndex = 0;
  let lastMatchEnd = 0;
  for (const matchData of matches) {
    // Skip overlapping matches
    if (matchData.index < lastMatchEnd) {
      continue;
    }

    // Skip CF Images URLs
    if (matchData.match.includes('imagedelivery.net')) {
      continue;
    }
    let urlToRewrite = matchData.match;
    if (matchData.type === 'protocol-relative') {
      urlToRewrite = 'https:' + matchData.match;
    }
    const rewritten = rewriteUrl(urlToRewrite, contextUrl);
    if (rewritten !== urlToRewrite) {
      result += html.substring(lastIndex, matchData.index);
      result += rewritten;
      lastIndex = matchData.index + matchData.length;
      lastMatchEnd = matchData.index + matchData.length;
    } else {
      lastMatchEnd = matchData.index + matchData.length;
    }
  }
  result += html.substring(lastIndex);
  return result;
}

/**
 * Rewrite absolute paths in HTML attributes.
 *
 * @param {string} html     HTML content.
 * @param {string} basePath Base path to prepend.
 * @return {string} HTML with rewritten paths.
 */
function rewriteAbsolutePaths(html, basePath) {
  if (!basePath || basePath === '' || basePath === '/') {
    return html;
  }
  (0,_utils_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('[URL Rewriter] Rewriting absolute paths with base:', basePath);
  let replaceCount = 0;
  const result = html.replace(/(\b(?:href|src|action|data|poster|content)=)(["'`])(\/(?!\/)[^"'`]*)\2/gi, (match, attrPart, quote, path) => {
    replaceCount++;

    // Skip if already includes the base path
    if (path.startsWith(basePath + '/')) {
      return match;
    }

    // Skip anchors and special paths
    if (path === '/' || path.startsWith('/#') || path.startsWith('/data:')) {
      return match;
    }
    const rewrittenPath = basePath + path;
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_1__.debug)(`[URL Rewriter] Rewriting: ${path} -> ${rewrittenPath}`);
    return attrPart + quote + rewrittenPath + quote;
  });
  (0,_utils_debug__WEBPACK_IMPORTED_MODULE_1__.debug)(`[URL Rewriter] Processed ${replaceCount} absolute path attributes`);
  return result;
}

/**
 * Rewrite srcset attribute URLs.
 *
 * @param {string}   html       HTML content.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with rewritten srcset URLs.
 */
function rewriteSrcsetUrls(html, rewriteUrl, contextUrl) {
  return html.replace(/(<(?:img|source)[^>]+srcset=)(["'`])([^"'`]+)\2/gi, (match, tag, quote, srcsetValue) => {
    const srcsetParts = srcsetValue.split(',').map(part => {
      const trimmed = part.trim();
      const urlMatch = trimmed.match(/^([^\s]+)(\s+.+)?$/);
      if (!urlMatch) {
        return trimmed;
      }
      const url = urlMatch[1];
      const descriptor = urlMatch[2] || '';
      if (url.includes('imagedelivery.net')) {
        return trimmed;
      }
      const rewritten = rewriteUrl(url, contextUrl);
      return rewritten + descriptor;
    });
    return tag + quote + srcsetParts.join(', ') + quote;
  });
}

/**
 * Rewrite import map URLs.
 *
 * @param {string}   html       HTML content.
 * @param {Function} rewriteUrl Function to rewrite URLs.
 * @param {string}   contextUrl Context URL for resolution.
 * @return {string} HTML with rewritten import map URLs.
 */
function rewriteImportMaps(html, rewriteUrl, contextUrl) {
  return html.replace(/<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis, (match, jsonContent) => {
    try {
      const importmap = JSON.parse(jsonContent);
      if (!importmap || typeof importmap !== 'object' || !importmap.imports) {
        return match;
      }
      for (const moduleName in importmap.imports) {
        if (importmap.imports.hasOwnProperty(moduleName)) {
          importmap.imports[moduleName] = rewriteUrl(importmap.imports[moduleName], contextUrl);
        }
      }
      const newJson = JSON.stringify(importmap);
      return match.replace(jsonContent, newJson);
    } catch {
      return match;
    }
  });
}

/***/ }),

/***/ 1996:
/*!*******************************************************!*\
  !*** ./assets/src/components/LoadingSpinner/index.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ LoadingSpinner)
/* harmony export */ });
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);
/**
 * Loading Spinner Component
 *
 * Reusable loading indicator with optional message.
 * Wraps WordPress Spinner component with consistent styling and layout.
 *
 * @package
 */




// Styles - extracted to module level for performance

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: _utils_styles__WEBPACK_IMPORTED_MODULE_1__.spacing.md,
  padding: _utils_styles__WEBPACK_IMPORTED_MODULE_1__.spacing.xl,
  textAlign: 'center'
};
const messageStyle = {
  fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_1__.fontSize.base,
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_1__.colors.textSecondary,
  margin: 0
};

/**
 * LoadingSpinner Component
 *
 * @param {Object} props           Component props
 * @param {string} props.message   Optional loading message to display
 * @param {string} props.className Optional additional CSS class
 * @param {Object} props.style     Optional inline style overrides
 * @return {JSX.Element} Rendered loading spinner
 */
function LoadingSpinner({
  message = '',
  className = '',
  style = {}
}) {
  const containerClassName = `aether-loading-spinner ${className}`.trim();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    className: containerClassName,
    style: {
      ...containerStyle,
      ...style
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Spinner, {
      className: "aether-loading-spinner__spinner"
    }), message && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
      className: "aether-loading-spinner__message",
      style: messageStyle,
      children: message
    })]
  });
}

/***/ }),

/***/ 2093:
/*!****************************************************!*\
  !*** ./assets/src/admin-settings/AdminSettings.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AdminSettings)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _components_PublishProgressModal__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../components/PublishProgressModal */ 9708);
/* harmony import */ var _ProviderSettings__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./ProviderSettings */ 9471);
/* harmony import */ var _components_StatusNotice__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../components/StatusNotice */ 9403);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/styles */ 2123);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/api */ 1561);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);
/**
 * Admin Settings Main Component
 *
 * Main admin settings page container.
 *
 * @package
 */










function AdminSettings() {
  const [isExportModalOpen, setIsExportModalOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [providerConfigs, setProviderConfigs] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({});
  const [notices, setNotices] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);

  // Add notice helper
  const addNotice = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((message, status = 'error') => {
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
  const removeNotice = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(id => {
    setNotices(prev => prev.filter(n => n.id !== id));
  }, []);

  // Load provider configs on mount
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const loadConfigs = async () => {
      try {
        const configsResponse = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_7__["default"])({
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
  const handleConfigsUpdate = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(updatedConfigs => {
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
    marginBottom: _utils_styles__WEBPACK_IMPORTED_MODULE_6__.spacing.xl,
    gap: _utils_styles__WEBPACK_IMPORTED_MODULE_6__.spacing.md
  };
  const headingStyle = {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_6__.fontWeight.semibold,
    color: _utils_styles__WEBPACK_IMPORTED_MODULE_6__.colors.text,
    flex: 1
  };
  const sectionsStyle = {
    ...(0,_utils_styles__WEBPACK_IMPORTED_MODULE_6__.createFlexStyle)('column', _utils_styles__WEBPACK_IMPORTED_MODULE_6__.spacing.lg)
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
    className: "aether-admin-settings",
    style: containerStyle,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
      className: "aether-admin-settings__header",
      style: headerStyle,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("h1", {
        className: "aether-admin-settings__heading",
        style: headingStyle,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Aether Site Exporter Settings', 'aether-site-exporter')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
        className: "aether-admin-settings__export-button",
        variant: "primary",
        onClick: () => setIsExportModalOpen(true),
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Export Site', 'aether-site-exporter')
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
      className: "aether-admin-settings__sections",
      style: sectionsStyle,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_components_StatusNotice__WEBPACK_IMPORTED_MODULE_5__["default"], {
        status: "info",
        message: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Aether Site Exporter allows you to export your WordPress site as a complete package.', 'aether-site-exporter'),
        isDismissible: false,
        className: "aether-admin-settings__notice"
      }), notices.map(notice => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_components_StatusNotice__WEBPACK_IMPORTED_MODULE_5__["default"], {
        status: notice.status,
        message: notice.message,
        isDismissible: notice.isDismissible,
        onRemove: () => removeNotice(notice.id),
        className: "aether-admin-settings__notice"
      }, notice.id)), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_ProviderSettings__WEBPACK_IMPORTED_MODULE_4__["default"], {
        providerConfigs: providerConfigs,
        onConfigsUpdate: handleConfigsUpdate,
        onNotice: addNotice
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_components_PublishProgressModal__WEBPACK_IMPORTED_MODULE_3__["default"], {
      isOpen: isExportModalOpen,
      onClose: () => setIsExportModalOpen(false)
    })]
  });
}

/***/ }),

/***/ 2123:
/*!************************************!*\
  !*** ./assets/src/utils/styles.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   borderRadius: () => (/* binding */ borderRadius),
/* harmony export */   colors: () => (/* binding */ colors),
/* harmony export */   commonStyles: () => (/* binding */ commonStyles),
/* harmony export */   createFlexStyle: () => (/* binding */ createFlexStyle),
/* harmony export */   createGridStyle: () => (/* binding */ createGridStyle),
/* harmony export */   fontSize: () => (/* binding */ fontSize),
/* harmony export */   fontWeight: () => (/* binding */ fontWeight),
/* harmony export */   noticeStyles: () => (/* binding */ noticeStyles),
/* harmony export */   spacing: () => (/* binding */ spacing),
/* harmony export */   statusBadgeStyles: () => (/* binding */ statusBadgeStyles),
/* harmony export */   utilityStyles: () => (/* binding */ utilityStyles)
/* harmony export */ });
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

/***/ }),

/***/ 2619:
/*!*******************************!*\
  !*** external ["wp","hooks"] ***!
  \*******************************/
/***/ ((module) => {

module.exports = window["wp"]["hooks"];

/***/ }),

/***/ 2623:
/*!**********************************************!*\
  !*** ./assets/src/utils/standardResponse.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createErrorResponse: () => (/* binding */ createErrorResponse),
/* harmony export */   createSuccessResponse: () => (/* binding */ createSuccessResponse),
/* harmony export */   getResponseData: () => (/* binding */ getResponseData),
/* harmony export */   getResponseError: () => (/* binding */ getResponseError),
/* harmony export */   getResponseErrors: () => (/* binding */ getResponseErrors),
/* harmony export */   isErrorResponse: () => (/* binding */ isErrorResponse),
/* harmony export */   isSuccessResponse: () => (/* binding */ isSuccessResponse),
/* harmony export */   normalizeResponse: () => (/* binding */ normalizeResponse)
/* harmony export */ });
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
 *
 * @param {Object} response Response to normalize.
 * @return {Object} Normalized response in standard format.
 */
function normalizeResponse(response) {
  // Already in standard format
  if (response && typeof response.success === 'boolean' && (response.data !== undefined || response.error !== undefined)) {
    return response;
  }

  // Format with error field
  if (response && response.error) {
    return createErrorResponse(response.error, response.errors);
  }

  // Format with success=true but no data field
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

  // Format with success=false
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

/***/ }),

/***/ 2727:
/*!*********************************************************!*\
  !*** ./assets/src/providers/services/storageService.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   StorageService: () => (/* binding */ StorageService)
/* harmony export */ });
/* harmony import */ var _utils_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/filesystemAdapter */ 4259);
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
    const result = await (0,_utils_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__.uploadFile)(this.staticPath, prefixedKey, file, options);
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
    return (0,_utils_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__.deleteFile)(this.staticPath, prefixedKey, {
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
    return (0,_utils_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__.copyFile)(this.staticPath, prefixedSourceKey, prefixedDestKey);
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
    return (0,_utils_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__.listObjects)(this.staticPath, prefixedPrefix, limit);
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
      return (0,_utils_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__.getObjectUrl)(this.staticPath, this.baseUrl, key);
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
    return (0,_utils_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__.batchCopy)(this.staticPath, operations);
  }

  /**
   * Batch delete multiple objects from storage.
   *
   * @param {Array} keys Array of object keys to delete.
   * @return {Promise<Object>} Result with success and optional error.
   */
  async batchDelete(keys) {
    return (0,_utils_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__.batchDelete)(this.staticPath, keys, {
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
      const blob = await (0,_utils_filesystemAdapter__WEBPACK_IMPORTED_MODULE_0__.downloadFile)(this.staticPath, prefixedManifestKey, {
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

/***/ }),

/***/ 3010:
/*!***************************************************!*\
  !*** ./assets/src/publish/hooks/usePublishAPI.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   usePublishAPI: () => (/* binding */ usePublishAPI)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/api */ 1561);
/* harmony import */ var _utils_useAssetDiscovery__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/useAssetDiscovery */ 6896);
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/storage */ 9516);
/* harmony import */ var _services_PublishAPIService__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../services/PublishAPIService */ 7068);
/**
 * Publish API Hook
 *
 * Handles API calls for publish operations.
 * Uses PublishAPIService for all business logic.
 *
 * @package
 */






function usePublishAPI() {
  const assetDiscovery = (0,_utils_useAssetDiscovery__WEBPACK_IMPORTED_MODULE_2__["default"])();

  // Create service instance (memoized to prevent recreation)
  const service = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => new _services_PublishAPIService__WEBPACK_IMPORTED_MODULE_4__.PublishAPIService(_utils_api__WEBPACK_IMPORTED_MODULE_1__["default"], assetDiscovery, _utils_storage__WEBPACK_IMPORTED_MODULE_3__.storage), [assetDiscovery]);
  const discoverBlueprintBundleAssets = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async () => {
    return await service.discoverBlueprintBundleAssets();
  }, [service]);

  // getAssetStatus is an alias for discoverBlueprintBundleAssets (eliminates duplication)
  const getAssetStatus = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async () => {
    return await service.discoverBlueprintBundleAssets();
  }, [service]);
  const markAssetChanged = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((type, slug) => {
    return Promise.resolve(service.markAssetChanged(type, slug));
  }, [service]);
  const discoverUrls = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async () => {
    return await service.discoverUrls();
  }, [service]);
  const createArchive = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async options => {
    return await service.createArchive(options);
  }, [service]);
  const generateBlueprint = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async options => {
    return await service.generateBlueprint(options);
  }, [service]);
  const createBlueprintBundle = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async options => {
    return await service.createBlueprintBundle(options);
  }, [service]);
  return {
    discoverBlueprintBundleAssets,
    getAssetStatus,
    markAssetChanged,
    discoverUrls,
    createArchive,
    generateBlueprint,
    createBlueprintBundle
  };
}

/***/ }),

/***/ 3061:
/*!***********************************************************!*\
  !*** ./assets/src/components/ActivityLogMessage/index.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ActivityLogMessage)
/* harmony export */ });
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);
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
    ...(0,_utils_styles__WEBPACK_IMPORTED_MODULE_0__.createFlexStyle)('row', _utils_styles__WEBPACK_IMPORTED_MODULE_0__.spacing.sm),
    alignItems: 'flex-start',
    padding: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.spacing.sm,
    borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.borderRadius.sm,
    transition: 'background-color 0.2s ease'
  };
  const typeStyles = {
    progress: {
      backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.noticeStyles.info.background
    },
    success: {
      backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.noticeStyles.success.background
    },
    error: {
      backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.noticeStyles.error.background
    },
    info: {
      backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.backgroundLighter
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
    progress: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.primary,
    success: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.success,
    error: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.error,
    info: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.textMuted
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
  fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.fontWeight.bold
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
  gap: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.spacing.xs,
  marginLeft: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.spacing.sm
};
const fileProgressBarStyle = {
  flex: 1,
  height: '4px',
  backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.borderLighter,
  borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.borderRadius.full,
  overflow: 'hidden'
};
const fileProgressBarFillStyle = {
  height: '100%',
  backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.primary,
  transition: 'width 0.2s ease'
};
const fileProgressPercentageStyle = {
  fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.fontSize.xs,
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.textMuted,
  fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.fontWeight.medium,
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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("li", {
    className: `aether-publish-progress-modal__activity-item aether-publish-progress-modal__activity-item--${type}`,
    style: getActivityItemStyle(type),
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("span", {
      className: `aether-publish-progress-modal__activity-icon aether-publish-progress-modal__activity-icon--${type}`,
      style: {
        ...activityIconStyle,
        color: getActivityIconColor(type)
      },
      children: getIcon(type)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("span", {
      className: "aether-publish-progress-modal__activity-message",
      style: activityMessageStyle,
      children: message
    }), progress && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
      className: "aether-publish-progress-modal__file-progress",
      style: fileProgressBarContainerStyle,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("div", {
        className: "aether-publish-progress-modal__file-progress-bar",
        style: fileProgressBarStyle,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("div", {
          className: "aether-publish-progress-modal__file-progress-fill",
          style: {
            ...fileProgressBarFillStyle,
            width: `${progress.percent}%`
          }
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("span", {
        className: "aether-publish-progress-modal__file-progress-percentage",
        style: fileProgressPercentageStyle,
        children: [progress.percent, "%"]
      })]
    })]
  });
}

/***/ }),

/***/ 3149:
/*!**********************************************!*\
  !*** ./assets/src/publish/executor/index.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildParallelPlan: () => (/* reexport safe */ _DependencyResolver__WEBPACK_IMPORTED_MODULE_1__.buildParallelPlan),
/* harmony export */   executeSteps: () => (/* reexport safe */ _StepExecutor__WEBPACK_IMPORTED_MODULE_0__.executeSteps),
/* harmony export */   getExecutionOrder: () => (/* reexport safe */ _DependencyResolver__WEBPACK_IMPORTED_MODULE_1__.getExecutionOrder),
/* harmony export */   getExecutionPlan: () => (/* reexport safe */ _StepExecutor__WEBPACK_IMPORTED_MODULE_0__.getExecutionPlan),
/* harmony export */   validateDependencies: () => (/* reexport safe */ _DependencyResolver__WEBPACK_IMPORTED_MODULE_1__.validateDependencies)
/* harmony export */ });
/* harmony import */ var _StepExecutor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./StepExecutor */ 9818);
/* harmony import */ var _DependencyResolver__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DependencyResolver */ 4958);
/**
 * Executor Module
 *
 * @package
 */




/***/ }),

/***/ 3194:
/*!**********************************************************!*\
  !*** ./assets/src/publish/utils/publishConfiguration.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildWorkflowContext: () => (/* binding */ buildWorkflowContext),
/* harmony export */   determineProvidersByDeploymentType: () => (/* binding */ determineProvidersByDeploymentType),
/* harmony export */   getEnabledInstancesForDeploymentType: () => (/* binding */ getEnabledInstancesForDeploymentType),
/* harmony export */   preparePublishConfiguration: () => (/* binding */ preparePublishConfiguration)
/* harmony export */ });
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/debug */ 1742);
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
 * @return {Object} Configuration object with provider IDs
 */
function preparePublishConfiguration(settingsResponse) {
  const settings = settingsResponse?.settings || {};
  const providerTypes = settings.provider_types || {};
  return {
    storageProviderId: providerTypes.storage || '',
    staticSiteProviderId: providerTypes.static_site || '',
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
 * @param {string} deploymentType  - Deployment type to filter by
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
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__.debugError)(`Failed to get instances for deployment type ${deploymentType}:`, error);
    return [];
  }
}

/**
 * Determine providers for all deployment types
 *
 * Pure function that takes provider configs and returns
 * arrays of instance IDs for each deployment type.
 *
 * @param {Object}        providerConfigs - All provider configurations
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
 * @param {Object} config       - Configuration object
 * @param {Object} dependencies - External dependencies
 * @return {Object} Workflow context
 */
function buildWorkflowContext(config, dependencies) {
  const {
    siteUrl,
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

/***/ }),

/***/ 3509:
/*!*****************************************************!*\
  !*** ./assets/src/components/ModalActions/index.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ModalActions)
/* harmony export */ });
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);
/**
 * Modal Actions Component
 *
 * Reusable footer actions component for modals.
 * Provides consistent button layout and spacing.
 *
 * @package
 */




// Styles - extracted to module level for performance

const actionsContainerStyle = {
  display: 'flex',
  gap: _utils_styles__WEBPACK_IMPORTED_MODULE_1__.spacing.sm,
  justifyContent: 'flex-end',
  marginTop: _utils_styles__WEBPACK_IMPORTED_MODULE_1__.spacing.lg
};

/**
 * ModalActions Component
 *
 * @param {Object}      props                Component props
 * @param {Function}    props.onCancel       Cancel button handler
 * @param {Function}    props.onSubmit       Submit button handler
 * @param {string}      props.cancelLabel    Cancel button label
 * @param {string}      props.submitLabel    Submit button label
 * @param {boolean}     props.isSubmitting   Whether submit is in progress
 * @param {boolean}     props.submitDisabled Whether submit button is disabled
 * @param {string}      props.submitVariant  Submit button variant (primary, secondary, etc.)
 * @param {JSX.Element} props.children       Optional additional action buttons
 * @param {string}      props.className      Optional additional CSS class
 * @return {JSX.Element} Rendered modal actions
 */
function ModalActions({
  onCancel,
  onSubmit,
  cancelLabel = 'Cancel',
  submitLabel = 'Submit',
  isSubmitting = false,
  submitDisabled = false,
  submitVariant = 'primary',
  children = null,
  className = ''
}) {
  const containerClassName = `aether-modal-actions ${className}`.trim();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    className: containerClassName,
    style: actionsContainerStyle,
    children: [children, onCancel && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
      className: "aether-modal-actions__cancel",
      variant: "secondary",
      onClick: onCancel,
      disabled: isSubmitting,
      children: cancelLabel
    }), onSubmit && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Button, {
      className: "aether-modal-actions__submit",
      variant: submitVariant,
      onClick: onSubmit,
      isBusy: isSubmitting,
      disabled: submitDisabled || isSubmitting,
      children: submitLabel
    })]
  });
}

/***/ }),

/***/ 3526:
/*!***********************************!*\
  !*** ./assets/src/utils/delay.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   delay: () => (/* binding */ delay)
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ 1064);
/**
 * Delay Utility
 *
 * Utility function for creating delays in async operations.
 * Replaces inline setTimeout patterns with a reusable function.
 *
 * @package
 */



/**
 * Create a delay promise.
 *
 * @param {number} ms Milliseconds to delay (defaults to SHORT_DELAY_MS).
 * @return {Promise<void>} Promise that resolves after delay.
 */
function delay(ms = _constants__WEBPACK_IMPORTED_MODULE_0__.SHORT_DELAY_MS) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/***/ }),

/***/ 3638:
/*!****************************************************!*\
  !*** ./assets/src/services/AssetManagerService.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AssetManagerService: () => (/* binding */ AssetManagerService),
/* harmony export */   calculateNeedsUpload: () => (/* binding */ calculateNeedsUpload),
/* harmony export */   clearAllUploadFlags: () => (/* binding */ clearAllUploadFlags),
/* harmony export */   createAsset: () => (/* binding */ createAsset),
/* harmony export */   filterChangedAssets: () => (/* binding */ filterChangedAssets),
/* harmony export */   mergeAsset: () => (/* binding */ mergeAsset),
/* harmony export */   normalizeAssetData: () => (/* binding */ normalizeAssetData)
/* harmony export */ });
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

  // eslint-disable-next-line camelcase
  const {
    exists_on_r2,
    existsOnR2,
    ...rest
  } = assetData;
  return {
    ...rest,
    // eslint-disable-next-line camelcase
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
 * @param {string}  type       Asset type (theme, plugin)
 * @param {string}  slug       Asset slug
 * @param {string}  name       Asset name (optional)
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
 * @param {Object}  existing                    Existing asset object
 * @param {Object}  updated                     Updated asset data
 * @param {Object}  options                     Merge options
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
   * @param {string} type          Asset type
   * @param {string} slug          Asset slug
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
   * @param {Object} assetData     Server asset data
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
   * @param {Array}  serverAssets  Array of server asset data
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

/***/ }),

/***/ 3689:
/*!***************************************!*\
  !*** ./node_modules/uuid/dist/rng.js ***!
  \***************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ rng)
/* harmony export */ });
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


/***/ }),

/***/ 3712:
/*!************************************************!*\
  !*** ./assets/src/utils/concurrencyLimiter.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createConcurrencyLimiter: () => (/* binding */ createConcurrencyLimiter)
/* harmony export */ });
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

/***/ }),

/***/ 3782:
/*!******************************************************!*\
  !*** ./assets/src/publish/utils/staticSiteConfig.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildStorageConfig: () => (/* binding */ buildStorageConfig),
/* harmony export */   buildUploadResult: () => (/* binding */ buildUploadResult),
/* harmony export */   calculateTotalFiles: () => (/* binding */ calculateTotalFiles),
/* harmony export */   createFailureTracker: () => (/* binding */ createFailureTracker),
/* harmony export */   createStorageService: () => (/* binding */ createStorageService),
/* harmony export */   fetchProviderConfig: () => (/* binding */ fetchProviderConfig)
/* harmony export */ });
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/debug */ 1742);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/api */ 1561);
/**
 * Static Site Configuration Utilities
 *
 * Pure functions for building static site generator configuration.
 *
 * @package
 */





/**
 * Build storage configuration object.
 *
 * @param {string} siteUrl       WordPress site URL.
 * @param {string} staticSiteUrl Target static site URL.
 * @param {string} providerId    Provider ID.
 * @return {Object} Storage configuration.
 */
function buildStorageConfig(siteUrl, staticSiteUrl, providerId) {
  return {
    public_url: siteUrl,
    base_url: staticSiteUrl || siteUrl,
    provider_id: providerId
  };
}

/**
 * Calculate total files to upload from pre-scan results.
 *
 * @param {number} cachedHtmlCount Number of HTML files cached.
 * @param {number} uniqueAssets    Number of unique assets.
 * @return {number} Total files to upload.
 */
function calculateTotalFiles(cachedHtmlCount, uniqueAssets) {
  return cachedHtmlCount + uniqueAssets;
}

/**
 * Build the final result object from upload phase.
 *
 * @param {Object} failures           Failure tracking object.
 * @param {Object} assetTracker       Asset tracker instance.
 * @param {number} filesUploaded      Number of files uploaded.
 * @param {number} filesSkipped       Number of files skipped.
 * @param {number} totalFilesToUpload Total files to upload.
 * @param {Array}  uploadedFiles      Array of uploaded file info.
 * @param {number} totalUrls          Total URLs processed.
 * @return {Object} Result object.
 */
function buildUploadResult(failures, assetTracker, filesUploaded, filesSkipped, totalFilesToUpload, uploadedFiles, totalUrls) {
  return {
    success: failures.urlsFailed === 0,
    urlsProcessed: totalUrls,
    urlsSucceeded: failures.urlsSucceeded,
    urlsFailed: failures.urlsFailed,
    assetsUploaded: assetTracker.getCount(),
    assetsFailed: failures.assetsFailed,
    failedUrls: failures.failedUrls,
    uploadedFiles,
    filesUploaded,
    filesSkipped,
    totalFilesToUpload
  };
}

/**
 * Create initial failure tracking object.
 *
 * @return {Object} Failure tracking object.
 */
function createFailureTracker() {
  return {
    urlsFailed: 0,
    urlsSucceeded: 0,
    assetsFailed: 0,
    failedUrls: []
  };
}

/**
 * Fetch provider configuration from REST API.
 *
 * @param {string} staticSiteProviderId Provider ID from parameter.
 * @return {Promise<Object>} Provider configuration object.
 */
async function fetchProviderConfig(staticSiteProviderId) {
  let providerConfig = {};
  try {
    // Dynamic import to avoid circular dependencies
    const providerDiscovery = await Promise.resolve(/*! import() eager */).then(__webpack_require__.bind(__webpack_require__, /*! ../../providers/utils/providerDiscovery */ 7189));
    const discoveredProviderId = await providerDiscovery.getProviderForDeploymentType('static_site');
    const providerIdToUse = staticSiteProviderId || discoveredProviderId;
    if (providerIdToUse) {
      const configResponse = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_2__["default"])({
        path: `/aether/site-exporter/providers/${providerIdToUse}`
      });
      if (configResponse.success && configResponse.config) {
        providerConfig = configResponse.config;
      }
    }
  } catch (error) {
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('Failed to load provider configuration:', error);
  }
  return providerConfig;
}

/**
 * Create and configure storage service.
 *
 * @param {string} staticPath     Static files path.
 * @param {Object} config         Storage configuration.
 * @param {string} providerId     Provider ID.
 * @param {Object} providerConfig Provider configuration.
 * @return {Promise<Object>} Storage service instance.
 */
async function createStorageService(staticPath, config, providerId, providerConfig) {
  // Filter configuration
  const filteredConfig = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.storage.service.config', config, staticPath, providerId, providerConfig);

  // Allow filter to override storage service creation
  let storageService = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.storage.service.create', null, staticPath, filteredConfig, providerId);

  // Create default if not overridden
  if (!storageService) {
    const {
      StorageService
    } = await Promise.resolve(/*! import() eager */).then(__webpack_require__.bind(__webpack_require__, /*! ../../providers/services/storageService */ 2727));
    storageService = new StorageService(staticPath, '', filteredConfig);
  }
  return storageService;
}

/***/ }),

/***/ 3893:
/*!*********************************************!*\
  !*** ./assets/src/utils/manifestManager.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   cleanupManifest: () => (/* binding */ cleanupManifest),
/* harmony export */   fetchManifest: () => (/* binding */ fetchManifest),
/* harmony export */   shouldSkipUpload: () => (/* binding */ shouldSkipUpload),
/* harmony export */   updateManifestEntry: () => (/* binding */ updateManifestEntry),
/* harmony export */   uploadManifest: () => (/* binding */ uploadManifest)
/* harmony export */ });
/* harmony import */ var _debug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./debug */ 1742);
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
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('Fetching manifest from remote:', manifestKey);

    // Try to download manifest from storage.
    const manifestBlob = await storageService.downloadManifest();
    if (!manifestBlob) {
      (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('Manifest not found, starting with empty manifest');
      return {};
    }

    // Parse JSON from blob.
    const manifestText = await manifestBlob.text();
    const manifest = JSON.parse(manifestText);
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('Manifest fetched successfully:', {
      fileCount: Object.keys(manifest).length
    });
    return manifest || {};
  } catch (error) {
    // If manifest doesn't exist (404) or other error, start with empty manifest.
    if (error.message && error.message.includes('404')) {
      (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('Manifest not found (404), starting with empty manifest');
      return {};
    }
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debugWarn)('Failed to fetch manifest, starting with empty manifest:', error);
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
  (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('Updated manifest entry:', {
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
function shouldSkipUpload(manifest, storageKey, size, hash) {
  if (!manifest || !manifest[storageKey]) {
    // No entry in manifest, don't skip.
    return false;
  }
  const entry = manifest[storageKey];

  // Stage 1: Check size first (fast comparison).
  if (entry.size !== size) {
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('File size differs, will upload:', {
      storageKey,
      existingSize: entry.size,
      newSize: size
    });
    return false;
  }

  // Stage 2: Check hash if size matches.
  if (entry.hash !== hash) {
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('File size matches but hash differs, will upload:', {
      storageKey,
      size
    });
    return false;
  }

  // Both size and hash match - skip upload.
  (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('File unchanged, skipping upload:', {
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
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('Manifest cleanup:', {
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
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('Uploading manifest:', {
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
      (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('Manifest uploaded successfully');
      return true;
    }
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debugWarn)('Manifest upload failed:', result.error);
    return false;
  } catch (error) {
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debugWarn)('Failed to upload manifest:', error);
    return false;
  }
}

/***/ }),

/***/ 4047:
/*!*****************************************************!*\
  !*** ./assets/src/publish/utils/progressManager.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   calculateOverallProgress: () => (/* binding */ calculateOverallProgress)
/* harmony export */ });
/* harmony import */ var _utils_constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/constants */ 1064);
/**
 * Progress Manager
 *
 * Calculates progress based on step progress values.
 * With the job-based workflow system, progress is calculated differently.
 *
 * @package
 */



// Hardcoded step weights for step-based progress tracking
// Order matters! Steps are executed in this order.
const STEP_WEIGHTS = {
  discoverBlueprintBundleAssets: 5,
  // Phase 1: 0-5%
  getStaticSiteUrls: 8,
  // Phase 2: 5-13%
  createBlueprintBundle: 20,
  // Phase 3: 13-33%
  generateBlueprint: 1,
  // Phase 4: 33-34%
  uploadSiteArchive: 16,
  // Phase 5: 34-50% (parallel with uploadStaticSiteFiles)
  uploadStaticSiteFiles: 50 // Phase 5: 34-84% (parallel with uploadSiteArchive)
};

/**
 * Get cumulative progress before a step.
 *
 * @param {string} step Step identifier.
 * @return {number} Cumulative progress (0-100).
 */
function getCumulativeProgress(step) {
  const stepOrder = Object.keys(STEP_WEIGHTS);
  const stepIndex = stepOrder.indexOf(step);
  if (stepIndex === -1) {
    return 0;
  }
  let cumulative = 0;
  for (let i = 0; i < stepIndex; i++) {
    cumulative += STEP_WEIGHTS[stepOrder[i]];
  }
  return cumulative;
}

/**
 * Get weight allocated to a step.
 *
 * @param {string} step Step identifier.
 * @return {number} Step weight (0-100).
 */
function getStepWeight(step) {
  return STEP_WEIGHTS[step] || 0;
}

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
  const cumulativeProgress = getCumulativeProgress(step);

  // Get weight allocated to this step
  const stepWeight = getStepWeight(step);
  if (stepWeight === 0) {
    // Step not found in workflow, return 0
    return 0;
  }

  // Calculate progress within step (0-100), clamped to valid range
  const stepProgressValue = progress !== undefined ? Math.min(_utils_constants__WEBPACK_IMPORTED_MODULE_0__.MAX_PROGRESS, Math.max(0, progress)) : 0;

  // Calculate overall progress
  // Example: If cumulative is 45% and step weight is 30%, and step is 50% complete:
  // overall = 45 + (50 * 30 / 100) = 45 + 15 = 60%
  const overall = cumulativeProgress + stepProgressValue * stepWeight / _utils_constants__WEBPACK_IMPORTED_MODULE_0__.MAX_PROGRESS;

  // Ensure progress is between 0-100 and rounded
  return Math.min(_utils_constants__WEBPACK_IMPORTED_MODULE_0__.MAX_PROGRESS, Math.max(0, Math.round(overall)));
}

/***/ }),

/***/ 4061:
/*!******************************************************!*\
  !*** ./assets/src/services/AssetDiscoveryService.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AssetDiscoveryService: () => (/* binding */ AssetDiscoveryService),
/* harmony export */   combineAssetsWithType: () => (/* binding */ combineAssetsWithType),
/* harmony export */   filterActiveAssets: () => (/* binding */ filterActiveAssets),
/* harmony export */   filterBuiltInPlugins: () => (/* binding */ filterBuiltInPlugins),
/* harmony export */   filterByWpOrgStatus: () => (/* binding */ filterByWpOrgStatus),
/* harmony export */   getActiveTheme: () => (/* binding */ getActiveTheme),
/* harmony export */   getSiteName: () => (/* binding */ getSiteName),
/* harmony export */   normalizePluginSlug: () => (/* binding */ normalizePluginSlug),
/* harmony export */   toBlueprintSlugFormat: () => (/* binding */ toBlueprintSlugFormat),
/* harmony export */   toCustomAssetFormat: () => (/* binding */ toCustomAssetFormat)
/* harmony export */ });
/**
 * Asset Discovery Service
 *
 * Pure functions and service class for discovering and categorizing WordPress assets.
 * Extracted from useAssetDiscovery hook for better testability.
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
  if (slug.includes('/')) {
    return slug.split('/')[0];
  }
  return slug;
}

/**
 * Filter assets to only active ones.
 *
 * @param {Array<Object>} assets Array of asset objects with is_active property.
 * @return {Array<Object>} Only active assets.
 */
function filterActiveAssets(assets) {
  return assets.filter(asset => asset.is_active);
}

/**
 * Get active theme from themes array.
 *
 * @param {Array<Object>} themes Array of theme objects.
 * @return {Object|null} Active theme or null if none found.
 */
function getActiveTheme(themes) {
  return themes.find(theme => theme.is_active) || null;
}

/**
 * Filter assets by WordPress.org status.
 *
 * @param {Array<Object>} assets    Array of assets with from_wporg property.
 * @param {boolean}       fromWpOrg True to get WordPress.org assets, false for custom.
 * @return {Array<Object>} Filtered assets.
 */
function filterByWpOrgStatus(assets, fromWpOrg) {
  return assets.filter(asset => asset.from_wporg === fromWpOrg);
}

/**
 * Filter out built-in Playground plugins.
 *
 * @param {Array<Object>} plugins Array of plugin objects.
 * @return {Array<Object>} Plugins excluding built-in ones.
 */
function filterBuiltInPlugins(plugins) {
  const builtInSlugs = ['aether', 'sqlite-database-integration'];
  return plugins.filter(plugin => !builtInSlugs.includes(normalizePluginSlug(plugin.slug)));
}

/**
 * Transform asset to custom asset format.
 *
 * @param {Object} asset Asset object with assetType, slug, name, version.
 * @return {Object} Custom asset format.
 */
function toCustomAssetFormat(asset) {
  return {
    type: asset.assetType,
    slug: asset.slug,
    name: asset.name,
    version: asset.version
  };
}

/**
 * Transform asset to blueprint slug format.
 *
 * @param {Object} asset Asset object with slug.
 * @return {string} Normalized slug.
 */
function toBlueprintSlugFormat(asset) {
  return normalizePluginSlug(asset.slug);
}

/**
 * Combine plugins and themes with asset type tag.
 *
 * @param {Array<Object>} plugins Array of plugin objects.
 * @param {Array<Object>} themes  Array of theme objects.
 * @return {Array<Object>} Combined array with assetType property.
 */
function combineAssetsWithType(plugins, themes) {
  return [...plugins.map(p => ({
    ...p,
    assetType: 'plugin'
  })), ...themes.map(t => ({
    ...t,
    assetType: 'theme'
  }))];
}

/**
 * Get site name from globals.
 * Separated as pure function for testability.
 *
 * @return {string} Site name from window.wp.siteName or document.title or empty string.
 */
function getSiteName() {
  if (typeof window !== 'undefined' && window.wp && window.wp.siteName) {
    return window.wp.siteName;
  }
  if (typeof document !== 'undefined' && document.title) {
    return document.title;
  }
  return '';
}

/**
 * Asset Discovery Service
 *
 * Service class for discovering and categorizing WordPress assets.
 * Uses dependency injection for testability.
 */
class AssetDiscoveryService {
  /**
   * @param {Function} apiFetch      WordPress apiFetch function.
   * @param {Function} checkWpOrg    Function to check if asset is from WordPress.org.
   * @param {Object}   wporgCache    WordPress.org cache instance.
   * @param {Function} getSiteNameFn Function to get site name (optional, defaults to getSiteName).
   */
  constructor(apiFetch, checkWpOrg, wporgCache, getSiteNameFn = null) {
    this.apiFetch = apiFetch;
    this.checkWpOrg = checkWpOrg;
    this.wporgCache = wporgCache;
    this.getSiteName = getSiteNameFn || getSiteName;
  }

  /**
   * Get all installed plugins and themes with metadata from REST API.
   *
   * @return {Promise<Object>} Object with plugins and themes arrays.
   */
  async getInstalledAssets() {
    try {
      const response = await this.apiFetch({
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
      return {
        plugins: [],
        themes: []
      };
    }
  }

  /**
   * Get plugin configuration from REST API.
   *
   * @return {Promise<Object>} Configuration object.
   */
  async getConfig() {
    try {
      const response = await this.apiFetch({
        path: '/aether/site-exporter/config',
        method: 'GET'
      });
      return response || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Check all assets against WordPress.org in parallel.
   *
   * @param {Array<Object>} items  Array of items with slug and assetType.
   * @param {Object}        config Configuration object for WordPress.org check.
   * @return {Promise<Array<Object>>} Assets with from_wporg property added.
   */
  async checkAssetsAgainstWpOrg(items, config) {
    return Promise.all(items.map(async item => {
      const fromWpOrg = await this.checkWpOrg(item.slug, item.assetType, config);
      return {
        ...item,
        from_wporg: fromWpOrg
      };
    }));
  }

  /**
   * Discover all custom assets (not from WordPress.org).
   *
   * @return {Promise<Array<Object>>} Array of custom assets.
   */
  async discoverCustomAssets() {
    const config = await this.getConfig();
    const {
      plugins,
      themes
    } = await this.getInstalledAssets();
    const activePlugins = filterActiveAssets(plugins);
    const activeTheme = getActiveTheme(themes);
    const activeThemes = activeTheme ? [activeTheme] : [];
    const items = combineAssetsWithType(activePlugins, activeThemes);
    const allAssets = await this.checkAssetsAgainstWpOrg(items, config);
    const customAssets = filterByWpOrgStatus(allAssets, false);
    return customAssets.map(toCustomAssetFormat);
  }

  /**
   * Get WordPress.org assets for blueprint generation.
   *
   * Returns only active plugins/themes from WordPress.org.
   * Custom assets will be included in wp-content.zip.
   *
   * @return {Promise<Object>} Object with plugins and themes arrays.
   */
  async getBlueprintAssets() {
    const config = await this.getConfig();
    const {
      plugins,
      themes
    } = await this.getInstalledAssets();
    const activePlugins = filterActiveAssets(plugins);
    const activeTheme = getActiveTheme(themes);
    const activeThemes = activeTheme ? [activeTheme] : [];
    const items = combineAssetsWithType(activePlugins, activeThemes);
    const allAssets = await this.checkAssetsAgainstWpOrg(items, config);
    const wporgAssets = filterByWpOrgStatus(allAssets, true);
    const wporgPlugins = wporgAssets.filter(asset => asset.assetType === 'plugin').filter(plugin => filterBuiltInPlugins([plugin]).length > 0).map(toBlueprintSlugFormat);
    const wporgThemes = wporgAssets.filter(asset => asset.assetType === 'theme').map(toBlueprintSlugFormat);
    return {
      plugins: wporgPlugins,
      themes: wporgThemes,
      siteName: this.getSiteName()
    };
  }
}

/***/ }),

/***/ 4138:
/*!****************************************!*\
  !*** ./assets/src/utils/validation.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   validateConfig: () => (/* binding */ validateConfig),
/* harmony export */   validateField: () => (/* binding */ validateField)
/* harmony export */ });
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

/***/ }),

/***/ 4140:
/*!***********************************************!*\
  !*** ./assets/src/contexts/PublishContext.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PublishContext: () => (/* binding */ PublishContext),
/* harmony export */   PublishProvider: () => (/* binding */ PublishProvider)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);
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

const PublishContext = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createContext)({
  steps: [],
  isPublishing: false,
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
  setIsPublishing: () => {},
  setJobId: () => {},
  setStatusMessage: () => {},
  setOverallProgressValue: () => {},
  updateMessage: () => {},
  removeMessage: () => {},
  setProviders: () => {},
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
  const [steps, setSteps] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [isPublishing, setIsPublishing] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [jobId, setJobId] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [finalStatus, setFinalStatus] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [error, setError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [currentStatusMessage, setCurrentStatusMessage] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [overallProgress, setOverallProgress] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const [messageHistory, setMessageHistory] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [staticSiteProviders, setStaticSiteProviders] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [blueprintBundleProviders, setBlueprintBundleProviders] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);

  // Track maximum progress to prevent progress from going backwards
  const maxProgressRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(0);

  /**
   * Initialize steps from step definitions
   *
   * @param {Array<Object>} stepDefinitions Step definitions with id, label, supportsProgress
   * @param {string|null}   initialStepId   Optional step ID to activate immediately
   */
  const initializeSteps = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((stepDefinitions = [], initialStepId = null) => {
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
  const setStepStatus = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((stepId, status, errorMessage = '') => {
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
  const setStepProgress = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((stepId, progress) => {
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
  const updateFromStep = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(backendStep => {
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
   * @param {string}      message  Message text (can include HTML)
   * @param {string}      type     Message type: 'info' | 'success' | 'error' | 'progress'
   * @param {string|null} key      Optional key to identify message for later updates
   * @param {*}           progress Optional progress value
   * @param {Object}      metadata Optional metadata (e.g., provider info, file size)
   */
  const addMessage = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((message, type = 'info', key = null, progress = undefined, metadata = undefined) => {
    setMessageHistory(prev => [{
      id: Date.now() + Math.random(),
      message,
      type,
      key,
      ...(progress !== undefined && {
        progress
      }),
      // Only include progress if provided
      ...(metadata !== undefined && {
        metadata
      }),
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
   * @param {Object}      metadata   Optional metadata to merge (e.g., provider info)
   */
  const updateMessage = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((key, newMessage = null, newType = null, progress = undefined, metadata = undefined) => {
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
      // Merge metadata - allow updating specific fields
      if (metadata !== undefined) {
        updated.metadata = {
          ...(item.metadata || {}),
          ...metadata
        };
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
  const removeMessage = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(key => {
    setMessageHistory(prev => prev.filter(item => item.key !== key));
  }, []);

  /**
   * Mark all steps as complete
   *
   * Called when publish workflow completes successfully.
   *
   * @param {Object} status Final status object (includes deployment URL, etc.)
   */
  const markAllComplete = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((status = {}) => {
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
  const showError = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((errorMessage, stepId = null) => {
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
   * @param {string}      message  Status message to display
   * @param {string}      type     Message type: 'info' | 'success' | 'error' | 'progress'
   * @param {string|null} key      Optional key to identify message for later updates
   * @param {*}           progress Optional progress value
   * @param {Object}      metadata Optional metadata (e.g., provider info, file size)
   */
  const setStatusMessage = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((message, type, key = null, progress = undefined, metadata = undefined) => {
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
              // Merge metadata - allow updating specific fields
              if (metadata !== undefined) {
                updated.metadata = {
                  ...(item.metadata || {}),
                  ...metadata
                };
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
            ...(metadata !== undefined && {
              metadata
            }),
            timestamp: Date.now()
          }, ...prev];
        });
      } else {
        // No key, just add message
        addMessage(message, type, null, progress, metadata);
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
  const setOverallProgressValue = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(progress => {
    const roundedProgress = Math.max(0, Math.min(100, Math.round(progress)));
    // Ensure progress never goes backwards
    if (roundedProgress > maxProgressRef.current) {
      maxProgressRef.current = roundedProgress;
    }
    setOverallProgress(maxProgressRef.current);
  }, []);

  /**
   * Set provider arrays
   *
   * @param {Array} staticProviders    Array of provider IDs for static site deployment
   * @param {Array} blueprintProviders Array of provider IDs for blueprint bundle deployment
   */
  const setProviders = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((staticProviders = [], blueprintProviders = []) => {
    setStaticSiteProviders(staticProviders);
    setBlueprintBundleProviders(blueprintProviders);
  }, []);

  /**
   * Reset all publish state to initial values
   *
   * Called when starting a new publish or closing the publish modal.
   *
   * @param {boolean} keepSteps If true, don't clear steps (useful when immediately reinitializing)
   */
  const reset = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((keepSteps = false) => {
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
    setStaticSiteProviders([]);
    setBlueprintBundleProviders([]);
    maxProgressRef.current = 0;
  }, []);

  // Provide context value
  const value = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => ({
    steps,
    isPublishing,
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
    setIsPublishing,
    setJobId,
    setStatusMessage,
    setOverallProgressValue,
    addMessage,
    updateMessage,
    removeMessage,
    setProviders,
    reset
  }), [steps, isPublishing, jobId, finalStatus, error, currentStatusMessage, overallProgress, messageHistory, staticSiteProviders, blueprintBundleProviders, initializeSteps, setStepStatus, setStepProgress, updateFromStep, markAllComplete, showError, setStatusMessage, setOverallProgressValue, addMessage, updateMessage, removeMessage, setProviders, reset]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(PublishContext.Provider, {
    value: value,
    children: children
  });
}

/***/ }),

/***/ 4143:
/*!*******************************************!*\
  !*** ./assets/src/publish/steps/index.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getActiveSteps: () => (/* binding */ getActiveSteps),
/* harmony export */   getRegisteredSteps: () => (/* binding */ getRegisteredSteps)
/* harmony export */ });
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _discoverBlueprintBundleAssets__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./discoverBlueprintBundleAssets */ 9711);
/* harmony import */ var _getStaticSiteUrls__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./getStaticSiteUrls */ 6075);
/* harmony import */ var _createBlueprintBundle__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./createBlueprintBundle */ 1751);
/* harmony import */ var _generateBlueprint__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./generateBlueprint */ 7730);
/* harmony import */ var _uploadBlueprintBundle__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./uploadBlueprintBundle */ 6168);
/* harmony import */ var _uploadStaticFiles__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./uploadStaticFiles */ 4590);
/**
 * Step Registry
 *
 * Flat step definitions with explicit dependencies for the publish workflow.
 * Steps are executed in parallel when their dependencies are satisfied.
 *
 * @package
 */









/**
 * Get all registered steps.
 *
 * Steps are filtered through hooks to allow extension.
 *
 * @return {Array<Object>} Array of step definitions.
 */
function getRegisteredSteps() {
  const steps = [_discoverBlueprintBundleAssets__WEBPACK_IMPORTED_MODULE_1__.discoverBlueprintBundleAssetsStep, _getStaticSiteUrls__WEBPACK_IMPORTED_MODULE_2__.getStaticSiteUrlsStep, _createBlueprintBundle__WEBPACK_IMPORTED_MODULE_3__.createBlueprintBundleStep, _generateBlueprint__WEBPACK_IMPORTED_MODULE_4__.generateBlueprintStep, _uploadBlueprintBundle__WEBPACK_IMPORTED_MODULE_5__.uploadBlueprintBundleStep, _uploadStaticFiles__WEBPACK_IMPORTED_MODULE_6__.uploadStaticFilesStep];

  /**
   * Filter registered steps.
   *
   * Allows plugins to add, remove, or modify steps.
   *
   * @param {Array<Object>} steps Array of step definitions.
   */
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.publish.steps', steps);
}

/**
 * Get steps filtered by which providers are enabled.
 *
 * @param {Object} context Execution context with provider arrays.
 * @return {Array<Object>} Filtered steps based on enabled providers.
 */
function getActiveSteps(context) {
  const {
    staticSiteProviders = [],
    blueprintBundleProviders = []
  } = context;
  const steps = getRegisteredSteps();

  // Filter out steps that should be skipped based on provider configuration
  return steps.filter(step => {
    // If step has a static skip function, check it
    if (typeof step.shouldSkip === 'function') {
      return !step.shouldSkip(context);
    }

    // Skip blueprint-related steps if no blueprint providers
    if (step.id === 'discoverBlueprintBundleAssets' || step.id === 'createBlueprintBundle' || step.id === 'generateBlueprint' || step.id === 'uploadBlueprintBundle') {
      return blueprintBundleProviders.length > 0;
    }

    // Skip static site upload if no static site providers
    if (step.id === 'uploadStaticFiles') {
      return staticSiteProviders.length > 0;
    }
    return true;
  });
}

/***/ }),

/***/ 4259:
/*!***********************************************!*\
  !*** ./assets/src/utils/filesystemAdapter.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   batchCopy: () => (/* binding */ batchCopy),
/* harmony export */   batchDelete: () => (/* binding */ batchDelete),
/* harmony export */   copyFile: () => (/* binding */ copyFile),
/* harmony export */   deleteFile: () => (/* binding */ deleteFile),
/* harmony export */   downloadFile: () => (/* binding */ downloadFile),
/* harmony export */   getObjectUrl: () => (/* binding */ getObjectUrl),
/* harmony export */   listObjects: () => (/* binding */ listObjects),
/* harmony export */   uploadFile: () => (/* binding */ uploadFile)
/* harmony export */ });
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api */ 1561);
/* harmony import */ var _debug__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./debug */ 1742);
/* harmony import */ var _standardResponse__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./standardResponse */ 2623);
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
      return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createErrorResponse)(error.message);
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
    const response = await (0,_api__WEBPACK_IMPORTED_MODULE_0__["default"])({
      path: '/aether/site-exporter/local-storage/upload',
      method: 'POST',
      body: formData
    });
    if (!response.success) {
      return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createErrorResponse)(response.error || 'Upload failed');
    }

    // Call progress callback if provided (100% since we don't have chunked upload yet)
    if (options.onProgress) {
      options.onProgress(file.size, file.size, 100);
    }
    return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createSuccessResponse)();
  } catch (error) {
    (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('filesystemAdapter.uploadFile error:', error);
    return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createErrorResponse)(error.message || 'Upload failed');
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
  (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('filesystemAdapter.deleteFile:', {
    staticPath,
    key
  });
  try {
    const response = await (0,_api__WEBPACK_IMPORTED_MODULE_0__["default"])({
      path: '/aether/site-exporter/local-storage/delete',
      method: 'DELETE',
      data: {
        key,
        static_path: staticPath,
        job_id: options.jobId || ''
      }
    });
    if (!response.success) {
      return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createErrorResponse)(response.error || 'Delete failed');
    }
    return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createSuccessResponse)();
  } catch (error) {
    (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('filesystemAdapter.deleteFile error:', error);
    return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createErrorResponse)(error.message || 'Delete failed');
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
  (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('filesystemAdapter.copyFile: Not implemented (not needed for local storage)');
  return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createSuccessResponse)();
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
  (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('filesystemAdapter.listObjects: Not implemented (not needed for static site generation)');
  return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createSuccessResponse)({
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
  (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('filesystemAdapter.batchCopy: Not implemented (not needed for local storage)');
  return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createSuccessResponse)();
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
  (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('filesystemAdapter.batchDelete:', {
    staticPath,
    count: keys.length
  });
  try {
    const response = await (0,_api__WEBPACK_IMPORTED_MODULE_0__["default"])({
      path: '/aether/site-exporter/local-storage/batch-delete',
      method: 'DELETE',
      data: {
        keys,
        static_path: staticPath,
        job_id: options.jobId || ''
      }
    });
    if (!response.success) {
      return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createErrorResponse)(response.error || 'Batch delete failed');
    }
    return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createSuccessResponse)();
  } catch (error) {
    (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('filesystemAdapter.batchDelete error:', error);
    return (0,_standardResponse__WEBPACK_IMPORTED_MODULE_2__.createErrorResponse)(error.message || 'Batch delete failed');
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
  (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('filesystemAdapter.downloadFile:', {
    staticPath,
    key
  });
  try {
    const response = await (0,_api__WEBPACK_IMPORTED_MODULE_0__["default"])({
      path: `/aether/site-exporter/local-storage/download?key=${encodeURIComponent(key)}&static_path=${encodeURIComponent(staticPath)}&job_id=${options.jobId || ''}`,
      method: 'GET',
      parse: false // Get raw response
    });
    if (!response.ok) {
      return null;
    }
    return await response.blob();
  } catch (error) {
    (0,_debug__WEBPACK_IMPORTED_MODULE_1__.debug)('filesystemAdapter.downloadFile error:', error);
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

/***/ }),

/***/ 4296:
/*!**************************************!*\
  !*** ./node_modules/uuid/dist/v4.js ***!
  \**************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _native_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./native.js */ 7697);
/* harmony import */ var _rng_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./rng.js */ 3689);
/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./stringify.js */ 8249);



function _v4(options, buf, offset) {
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? (0,_rng_js__WEBPACK_IMPORTED_MODULE_1__["default"])();
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
    return (0,_stringify_js__WEBPACK_IMPORTED_MODULE_2__.unsafeStringify)(rnds);
}
function v4(options, buf, offset) {
    if (_native_js__WEBPACK_IMPORTED_MODULE_0__["default"].randomUUID && !buf && !options) {
        return _native_js__WEBPACK_IMPORTED_MODULE_0__["default"].randomUUID();
    }
    return _v4(options, buf, offset);
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (v4);


/***/ }),

/***/ 4444:
/*!*****************************************************!*\
  !*** ./assets/src/publish/hooks/useAssetManager.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useAssetManager: () => (/* binding */ useAssetManager)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_storage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/storage */ 9516);
/* harmony import */ var _services_AssetManagerService__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../services/AssetManagerService */ 3638);
/**
 * Asset Manager Hook
 *
 * Manages asset state in localStorage.
 * Uses AssetManagerService for all business logic.
 *
 * @package
 */




function useAssetManager() {
  const [assets, setAssets] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({});

  // Create service instance (memoized to prevent recreation)
  const service = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => new _services_AssetManagerService__WEBPACK_IMPORTED_MODULE_2__.AssetManagerService(_utils_storage__WEBPACK_IMPORTED_MODULE_1__.storage), []);

  // Load assets from localStorage on mount
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const data = service.load();
    setAssets(data);
  }, [service]);

  // Save assets to localStorage whenever they change
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    service.save(assets);
  }, [service, assets]);
  const markAsChanged = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((type, slug) => {
    setAssets(prev => service.markAsChanged(prev, type, slug));
  }, [service]);
  const updateFromServer = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(assetData => {
    setAssets(prev => service.updateFromServer(prev, assetData));
  }, [service]);
  const syncWithServer = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(serverAssets => {
    setAssets(prev => service.syncWithServer(prev, serverAssets));
  }, [service]);
  const getChangedAssets = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    return (0,_services_AssetManagerService__WEBPACK_IMPORTED_MODULE_2__.filterChangedAssets)(assets);
  }, [assets]);
  const clearUploadFlags = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    setAssets(prev => (0,_services_AssetManagerService__WEBPACK_IMPORTED_MODULE_2__.clearAllUploadFlags)(prev));
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

/***/ }),

/***/ 4495:
/*!************************************************************!*\
  !*** ./assets/src/components/ProviderConfigModal/index.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ProviderConfigModal)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _ProviderForm__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../ProviderForm */ 54);
/* harmony import */ var _StatusNotice__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../StatusNotice */ 9403);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../utils/api */ 1561);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var _constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../constants/deploymentTypes */ 241);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);
/**
 * Provider Configuration Modal Component
 *
 * Modal dialog wrapping ProviderForm for configuring a provider.
 *
 * @package
 */











// Styles - extracted to module level for performance

const headerStyle = {
  marginBottom: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.spacing.md
};
const descriptionStyle = {
  fontSize: '0.875rem',
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.colors.textSecondary,
  margin: 0
};
const sectionTitleStyle = {
  fontSize: '1rem',
  fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.fontWeight.semibold,
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.colors.text,
  marginTop: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.spacing.lg,
  marginBottom: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.spacing.md
};
const deploymentTypesSectionStyle = {
  padding: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.spacing.md,
  backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.colors.surfaceAlt,
  borderRadius: '6px',
  border: `1px solid ${_utils_styles__WEBPACK_IMPORTED_MODULE_7__.colors.borderLight}`,
  marginBottom: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.spacing.lg
};
const deploymentTypesDescriptionStyle = {
  fontSize: '0.875rem',
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.colors.textSecondary,
  marginBottom: _utils_styles__WEBPACK_IMPORTED_MODULE_7__.spacing.md
};

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
  const [config, setConfig] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(initialConfig);
  const [hasChanges, setHasChanges] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [saveError, setSaveError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const closeTimeoutRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  // Refs for hook container elements
  const beforeFormRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const afterFormRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const handleFormChange = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(newValues => {
    // Include deployment_types in the merged config
    setConfig({
      ...newValues,
      // eslint-disable-next-line camelcase
      deployment_types: config.deployment_types || []
    });
    setHasChanges(true);
  }, [config.deployment_types]);
  const handleDeploymentTypeToggle = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((deploymentType, checked) => {
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
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
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
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!isOpen || !provider || !instanceId) {
      return;
    }
    const {
      id
    } = provider;
    const hookContext = {
      providerId: id,
      // Provider type
      instanceId,
      // Instance ID (for instance-specific operations)
      provider,
      config,
      onConfigChange: handleFormChange
    };

    // Trigger before_form hook
    if (beforeFormRef.current) {
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__.doAction)('aether.provider.modal.before_form', hookContext);
    }

    // Trigger after_form hook
    if (afterFormRef.current) {
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_3__.doAction)('aether.provider.modal.after_form', hookContext);
    }
  }, [isOpen, provider, config, handleFormChange, instanceId]);
  const handleFormSubmit = async values => {
    if (!provider || !instanceId) {
      return;
    }

    // Use instanceId for saving (not provider.id which is the provider type)
    setSaveError(null);
    try {
      const configResponse = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_6__["default"])({
        path: '/aether/site-exporter/settings?key=providers'
      });
      if (!configResponse.success) {
        throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Failed to load current settings', 'aether-site-exporter'));
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
      const saveResponse = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_6__["default"])({
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
      setSaveError(err.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Failed to save settings', 'aether-site-exporter'));
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

  // Get supported deployment types from provider metadata
  const supportedDeploymentTypes = metadata.supportedDeploymentTypes || [];

  // Deployment type labels
  const deploymentTypeLabels = {
    [_constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_8__.DEPLOYMENT_TYPES.STATIC_SITE]: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Static Site', 'aether-site-exporter'),
    [_constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_8__.DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE]: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Blueprint Bundle', 'aether-site-exporter'),
    [_constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_8__.DEPLOYMENT_TYPES.EDGE_FUNCTIONS]: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Edge Functions', 'aether-site-exporter')
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Modal, {
    title: name,
    onRequestClose: handleClose,
    isFullScreen: false,
    className: "aether-provider-config-modal",
    children: [description && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("div", {
      className: "aether-provider-config-modal__header",
      style: headerStyle,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("p", {
        className: "aether-provider-config-modal__description",
        style: descriptionStyle,
        children: description
      })
    }), saveError && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_StatusNotice__WEBPACK_IMPORTED_MODULE_5__["default"], {
      status: "error",
      message: saveError,
      isDismissible: true,
      onRemove: () => setSaveError(null),
      className: "aether-provider-config-modal__notice"
    }), supportedDeploymentTypes.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
      className: "aether-provider-config-modal__deployment-types",
      style: deploymentTypesSectionStyle,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("div", {
        className: "aether-provider-config-modal__deployment-types-title",
        style: sectionTitleStyle,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Deployment Types', 'aether-site-exporter')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("p", {
        className: "aether-provider-config-modal__deployment-types-description",
        style: deploymentTypesDescriptionStyle,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Select which deployment types this provider instance should handle.', 'aether-site-exporter')
      }), supportedDeploymentTypes.map(deploymentType => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.CheckboxControl, {
        className: "aether-provider-config-modal__deployment-type-checkbox",
        label: deploymentTypeLabels[deploymentType],
        checked: config.deployment_types?.includes(deploymentType) || false,
        onChange: checked => handleDeploymentTypeToggle(deploymentType, checked)
      }, deploymentType))]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("div", {
      ref: beforeFormRef,
      className: "aether-provider-modal__before-form",
      "data-provider-id": id,
      "data-instance-id": instanceId
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_ProviderForm__WEBPACK_IMPORTED_MODULE_4__["default"], {
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
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("div", {
      ref: afterFormRef,
      className: "aether-provider-modal__after-form",
      "data-provider-id": id,
      "data-instance-id": instanceId
    })]
  });
}

/***/ }),

/***/ 4590:
/*!*************************************************************!*\
  !*** ./assets/src/publish/steps/uploadStaticFiles/index.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   uploadStaticFilesStep: () => (/* binding */ uploadStaticFilesStep)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_progressManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/progressManager */ 4047);
/**
 * Upload Static Files Step
 *
 * Generates static HTML/CSS/JS and uploads to storage providers.
 * Uses hook-based architecture where providers handle URL rewriting and uploading.
 *
 * @package
 */





/**
 * Upload static files step handler.
 *
 * @param {Object}   context                         Execution context.
 * @param {Array}    context.staticSiteProviders     Providers for static site.
 * @param {Array}    context.urls                    URLs from getStaticSiteUrls.
 * @param {string}   context.staticSiteUrl           Static site URL.
 * @param {Object}   context.blueprintData           Blueprint data.
 * @param {string}   context.siteUrl                 WordPress site URL.
 * @param {Function} context.setStatusMessage        Status message updater.
 * @param {Function} context.setStepProgress         Step progress updater.
 * @param {Function} context.setOverallProgressValue Overall progress updater.
 * @return {Promise<Object>} Step result with uploaded files.
 */
async function handler(context) {
  const {
    urls,
    staticSiteUrl,
    blueprintData,
    siteUrl,
    staticSiteProviders = [],
    setStatusMessage,
    setStepProgress,
    setOverallProgressValue
  } = context;
  if (!urls || !Array.isArray(urls)) {
    throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('URLs not found. Please run getStaticSiteUrls first.', 'aether-site-exporter'));
  }
  const providers = staticSiteProviders;
  if (providers.length === 0) {
    setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('No providers enabled for static site deployment', 'aether-site-exporter'), 'warning', 'uploadStaticFiles');
    return {
      skipped: true,
      reason: 'no_providers'
    };
  }
  setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$d: Number of files, %2$d: Number of providers */
  (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__._n)('Processing %1$d file for %2$d provider…', 'Processing %1$d files for %2$d providers…', urls.length, 'aether-site-exporter'), urls.length, providers.length), 'progress', 'uploadStaticFiles');

  // Filter URLs before processing
  const filteredUrls = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.upload.urls', urls, providers, {
    siteUrl,
    blueprintData,
    staticSiteUrl,
    providers
  });

  // Track results per provider
  const providerResults = {};
  providers.forEach(providerId => {
    providerResults[providerId] = {
      filesProcessed: 0,
      filesUploaded: 0,
      errors: []
    };
  });

  // Process each file through hooks
  const totalFiles = filteredUrls.length;
  let processedCount = 0;
  for (const urlData of filteredUrls) {
    processedCount++;

    // Update progress
    if (setStepProgress && setOverallProgressValue) {
      const stepProgress = Math.min(100, Math.round(processedCount / totalFiles * 100));
      setStepProgress('uploadStaticFiles', stepProgress);
      setOverallProgressValue((0,_utils_progressManager__WEBPACK_IMPORTED_MODULE_2__.calculateOverallProgress)({
        step: 'uploadStaticFiles',
        progress: stepProgress
      }));
    }

    // Create file context for hooks
    const fileContext = {
      url: urlData.url || urlData,
      path: urlData.path || urlData.url || urlData,
      content: urlData.content || null,
      contentType: urlData.contentType || 'text/html',
      siteUrl,
      staticSiteUrl,
      blueprintData,
      providers,
      setStatusMessage
    };

    /**
     * Action: Process a static site file.
     *
     * Providers hook into this action to:
     * 1. Perform URL rewriting/HTML transformations
     * 2. Upload the file to their storage
     *
     * @param {Object}   fileContext                  File context object.
     * @param {string}   fileContext.url              Original URL.
     * @param {string}   fileContext.path             File path.
     * @param {string}   fileContext.content          File content (may be null, provider fetches if needed).
     * @param {string}   fileContext.contentType      Content type.
     * @param {string}   fileContext.siteUrl          WordPress site URL.
     * @param {string}   fileContext.staticSiteUrl    Target static site URL.
     * @param {Object}   fileContext.blueprintData    Blueprint data.
     * @param {Array}    fileContext.providers        Provider IDs.
     * @param {Function} fileContext.setStatusMessage Status updater.
     */
    (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.staticSite.file.process', fileContext);

    // Also fire provider-specific actions for more granular control
    for (const providerId of providers) {
      /**
       * Action: Process a file for a specific provider.
       *
       * @param {Object} fileContext File context object.
       * @param {string} providerId  Provider ID.
       */
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)(`aether.staticSite.file.process.${providerId}`, fileContext, providerId);
    }
  }

  // Gather results from providers via filter
  const results = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.staticSite.upload.results', providerResults, providers, {
    siteUrl,
    blueprintData,
    staticSiteUrl
  });

  // Calculate totals
  const successfulProviders = Object.entries(results).filter(([, data]) => data.filesUploaded > 0 || data.errors.length === 0);
  const failedProviders = Object.entries(results).filter(([, data]) => data.errors.length > 0 && data.filesUploaded === 0);
  const totalFilesUploaded = Object.values(results).reduce((sum, data) => sum + (data.filesUploaded || 0), 0);
  if (successfulProviders.length > 0) {
    setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$d: Success count, %2$d: Total providers, %3$d: Total files uploaded */
    (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__._n)('Uploaded static site to %1$d/%2$d provider (%3$d file)', 'Uploaded static site to %1$d/%2$d providers (%3$d files)', totalFilesUploaded, 'aether-site-exporter'), successfulProviders.length, providers.length, totalFilesUploaded), failedProviders.length > 0 ? 'warning' : 'success', 'uploadStaticFiles');
  }
  if (failedProviders.length === providers.length) {
    throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to upload static site to any provider', 'aether-site-exporter'));
  }
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.upload.result', {
    providers,
    results,
    successCount: successfulProviders.length,
    failureCount: failedProviders.length,
    totalFilesUploaded
  }, providers, {
    siteUrl,
    blueprintData,
    staticSiteUrl
  });
}

/**
 * Upload Static Files step definition.
 */
const uploadStaticFilesStep = {
  id: 'uploadStaticFiles',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Upload Static Files', 'aether-site-exporter'),
  description: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Generate and upload static HTML files', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['getStaticSiteUrls'],
  provides: [],
  handler
};

/***/ }),

/***/ 4958:
/*!***********************************************************!*\
  !*** ./assets/src/publish/executor/DependencyResolver.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildParallelPlan: () => (/* binding */ buildParallelPlan),
/* harmony export */   getExecutionOrder: () => (/* binding */ getExecutionOrder),
/* harmony export */   validateDependencies: () => (/* binding */ validateDependencies)
/* harmony export */ });
/**
 * Dependency Resolver
 *
 * Resolves step dependencies and builds parallel execution plan.
 * Uses topological sort to determine execution order.
 *
 * @package
 */

/**
 * Build a parallel execution plan from steps with dependencies.
 *
 * Returns an array of arrays, where each inner array contains step IDs
 * that can be executed in parallel.
 *
 * @param {Array<Object>} steps Array of step definitions with id and dependencies.
 * @return {Array<Array<string>>} Execution plan with parallel groups.
 */
function buildParallelPlan(steps) {
  const stepIds = new Set(steps.map(s => s.id));
  const remaining = new Set(stepIds);
  const result = [];
  while (remaining.size > 0) {
    // Find all steps whose dependencies are satisfied (not in remaining)
    const ready = [...remaining].filter(stepId => {
      const step = steps.find(s => s.id === stepId);
      const deps = step.dependencies || [];
      // All dependencies must be completed (not in remaining)
      return deps.every(depId => !remaining.has(depId));
    });
    if (ready.length === 0 && remaining.size > 0) {
      const unresolved = [...remaining].join(', ');
      throw new Error(`Circular dependency detected. Unresolved steps: ${unresolved}`);
    }

    // These steps can run in parallel
    result.push(ready);

    // Remove from remaining
    ready.forEach(id => remaining.delete(id));
  }
  return result;
}

/**
 * Validate step dependencies.
 *
 * Checks that all declared dependencies reference existing steps.
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<string>} Array of validation errors (empty if valid).
 */
function validateDependencies(steps) {
  const errors = [];
  const stepIds = new Set(steps.map(s => s.id));
  steps.forEach(step => {
    const deps = step.dependencies || [];
    deps.forEach(depId => {
      if (!stepIds.has(depId)) {
        errors.push(`Step "${step.id}" depends on unknown step "${depId}"`);
      }
    });
  });
  return errors;
}

/**
 * Get execution order as a flat array.
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<string>} Flat array of step IDs in execution order.
 */
function getExecutionOrder(steps) {
  const plan = buildParallelPlan(steps);
  return plan.flat();
}

/***/ }),

/***/ 5044:
/*!**********************************************************!*\
  !*** ./assets/src/publish/hooks/usePublishController.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   usePublishController: () => (/* binding */ usePublishController)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _usePublishAPI__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./usePublishAPI */ 3010);
/* harmony import */ var _useAssetManager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./useAssetManager */ 4444);
/* harmony import */ var _useStaticSiteGenerator__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./useStaticSiteGenerator */ 7853);
/* harmony import */ var _useBlueprintGenerator__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./useBlueprintGenerator */ 5335);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../utils/api */ 1561);
/* harmony import */ var _utils_progressManager__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/progressManager */ 4047);
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../utils/debug */ 1742);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var _constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../constants/deploymentTypes */ 241);
/* harmony import */ var _executor__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../executor */ 3149);
/* harmony import */ var _steps__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../steps */ 4143);
/* harmony import */ var _utils_publishConfiguration__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../utils/publishConfiguration */ 3194);
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
    removeMessage,
    setProviders
  } = publishState;

  // State for storage provider ID (set before starting publish)
  // Must be declared before hooks that use it
  const [setStorageProviderId] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const api = (0,_usePublishAPI__WEBPACK_IMPORTED_MODULE_2__.usePublishAPI)();
  const assetManager = (0,_useAssetManager__WEBPACK_IMPORTED_MODULE_3__.useAssetManager)();

  // Create blueprint generator hook.
  const {
    generateBlueprint: generateBlueprintJson
  } = (0,_useBlueprintGenerator__WEBPACK_IMPORTED_MODULE_5__.useBlueprintGenerator)();

  // Provider context for progress tracking across multiple providers
  // This allows the progress callback to adjust progress based on the current provider index
  const staticSiteProgressContext = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)({
    providerIndex: 0,
    totalProviders: 1
  });

  // Function to update static site progress context
  // This allows the step handler to set the current provider index before processing
  const updateStaticSiteProgressContext = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((providerIndex, totalProviders) => {
    staticSiteProgressContext.current = {
      providerIndex,
      totalProviders
    };
  }, []);

  // Create static site generator with progress callback
  const processStaticSiteUrls = (0,_useStaticSiteGenerator__WEBPACK_IMPORTED_MODULE_4__.useStaticSiteGenerator)((uploadedFiles, totalFiles) => {
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
      const overallProgress = (0,_utils_progressManager__WEBPACK_IMPORTED_MODULE_7__.calculateOverallProgress)({
        step: 'uploadStaticSiteFiles',
        progress: stepProgress
      });
      setOverallProgressValue(overallProgress);
      setStepProgress('uploadStaticSiteFiles', stepProgress);
    }
  });

  // Helper function to upload blueprint-bundle.zip archive file.
  // Detects upload method from provider's upload strategy (git, storage, or direct).
  const handleSiteArchiveUpload = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (providerId, context) => {
    try {
      // providerId is an instance ID (e.g., 'local-filesystem:abc-123')
      // Use provider ID passed from executeSteps (avoids redundant settings fetch).
      // Get default provider if none configured
      let fetchedStorageProviderId = providerId;
      if (!fetchedStorageProviderId) {
        const {
          getDefaultProvider
        } = await Promise.resolve(/*! import() eager */).then(__webpack_require__.bind(__webpack_require__, /*! ../../providers/utils/providerDiscovery */ 7189));
        fetchedStorageProviderId = await getDefaultProvider();
      }
      if (!fetchedStorageProviderId) {
        throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('No provider instance ID provided for blueprint bundle upload', 'aether-site-exporter'));
      }

      // Fetch provider metadata from REST API to check upload strategy
      // The endpoint handles both instance IDs and provider type IDs
      let providerMetadata = null;
      let instanceConfig = null;
      try {
        const providerResponse = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_6__["default"])({
          path: `/aether/site-exporter/providers/${fetchedStorageProviderId}`
        });
        if (!providerResponse) {
          throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: Provider ID */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('REST API returned null response for provider %s', 'aether-site-exporter'), fetchedStorageProviderId));
        }
        if (!providerResponse.success) {
          const errorMessage = providerResponse.message || providerResponse.error || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Unknown error', 'aether-site-exporter');
          throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: 1: Provider ID, 2: Error message */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('REST API error for provider %1$s: %2$s', 'aether-site-exporter'), fetchedStorageProviderId, errorMessage));
        }
        if (providerResponse.provider) {
          providerMetadata = providerResponse.provider;
        } else {
          throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: Provider ID */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Provider metadata not found in REST API response for %s', 'aether-site-exporter'), fetchedStorageProviderId));
        }
        if (providerResponse.config) {
          instanceConfig = providerResponse.config;
        }
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)(`[Aether] Fetched provider metadata for ${fetchedStorageProviderId}:`, {
          providerType: providerMetadata?.type,
          hasConfig: !!instanceConfig,
          instanceEnabled: instanceConfig?.enabled
        });
      } catch (error) {
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debugError)(`[Aether] Failed to fetch provider metadata for instance ${fetchedStorageProviderId}:`, error);
        throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: 1: Provider instance ID, 2: Error message */
        (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Failed to fetch provider metadata for instance %1$s: %2$s', 'aether-site-exporter'), fetchedStorageProviderId, error.message));
      }
      if (!providerMetadata) {
        throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: Provider instance ID */
        (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Provider instance not found: %s', 'aether-site-exporter'), fetchedStorageProviderId));
      }

      // Determine upload strategy from provider type
      // Local filesystem has type 'local-storage' and uses direct file operations
      let uploadStrategy = 'storage'; // Default for cloud storage providers
      if (providerMetadata.type === 'local-storage') {
        uploadStrategy = 'direct';
      }

      // Allow providers to override upload strategy via filter
      const filteredStrategy = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_9__.applyFilters)('aether.provider.upload_strategy', uploadStrategy, fetchedStorageProviderId, providerMetadata);
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
          throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Blueprint bundle not found. generateBlueprint must run before uploadSiteArchive.', 'aether-site-exporter'));
        }
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)('Uploading blueprint bundle via provider:', blueprintBundlePath);

        // Use hook-based upload instead of provider method
        // Get upload handler for this provider via filter
        // Pass instance ID (fetchedStorageProviderId) to the filter
        // The handler will receive the instance ID and can extract provider type if needed

        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)(`[Aether] Looking for upload handler for instance ${fetchedStorageProviderId}, strategy: ${uploadStrategy}`);
        const uploadHandler = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_9__.applyFilters)('aether.provider.upload', null, fetchedStorageProviderId,
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
          (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debugError)(`[Aether] No upload handler found for provider type: ${providerType} (instance: ${fetchedStorageProviderId})`);
          throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: 1: Provider type, 2: Provider instance ID */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("No upload handler registered for provider type: %1$s (instance: %2$s). Make sure the provider has registered an upload handler via the 'aether.provider.upload' filter.", 'aether-site-exporter'), providerType, fetchedStorageProviderId));
        }
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)(`[Aether] Upload handler found for ${fetchedStorageProviderId}, calling handler...`);

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
          throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: Provider instance ID */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Upload handler returned null/undefined for instance %s', 'aether-site-exporter'), fetchedStorageProviderId));
        }
        if (!uploadResult.success) {
          const errorMessage = uploadResult?.error || uploadResult?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Unknown upload error', 'aether-site-exporter');
          (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debugError)(`[Aether] Upload handler returned error for instance ${fetchedStorageProviderId}:`, errorMessage);
          throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: 1: Provider instance ID, 2: Error message */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Failed to upload blueprint bundle to instance %1$s: %2$s', 'aether-site-exporter'), fetchedStorageProviderId, errorMessage));
        }
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)(`[Aether] Blueprint bundle upload complete for instance ${fetchedStorageProviderId}:`, uploadResult);

        // Progress updates are handled at the step handler level (uploadSiteArchiveStep.js)
        // to properly track progress across multiple provider instances.
      } else {
        // ERROR: No upload method configured (no provider configured).
        throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('No supported upload method available', 'aether-site-exporter'));
      }

      // Upload complete - control returns to workflow executor.
    } catch (error) {
      throw error;
    }
  }, []);
  const startPublish = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async () => {
    try {
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)('startPublish called');

      // Initialize steps with 'discoverBlueprintBundleAssets' as the active step
      // This sets up steps array, active step, and lastStepIndex correctly
      initializeSteps((0,_steps__WEBPACK_IMPORTED_MODULE_12__.getRegisteredSteps)(), 'discoverBlueprintBundleAssets');
      // Set isPublishing to true to start the workflow
      setIsPublishing(true);
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)('Steps initialized, starting publish workflow');

      // Fetch settings to get storage provider ID before starting
      const settingsResponse = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_6__["default"])({
        path: '/aether/site-exporter/settings'
      });

      // Use pure function to extract configuration
      const publishConfig = (0,_utils_publishConfiguration__WEBPACK_IMPORTED_MODULE_13__.preparePublishConfiguration)(settingsResponse);

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
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debugError)('Failed to fetch asset status:', assetError);
      }

      // STATELESS WORKFLOW EXECUTION
      // No job tracking - React owns all state, PHP provides stateless endpoints

      // Activate the first step immediately to update UI
      updateFromStep('discoverBlueprintBundleAssets');

      // Get current site URL for static site generation (use pure function)
      const siteUrl = window.location.origin;

      // Get arrays of instance IDs for each deployment type (use pure function)
      const providersByType = (0,_utils_publishConfiguration__WEBPACK_IMPORTED_MODULE_13__.determineProvidersByDeploymentType)(publishConfig.providerConfigs, [_constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_10__.DEPLOYMENT_TYPES.STATIC_SITE, _constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_10__.DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE, _constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_10__.DEPLOYMENT_TYPES.EDGE_FUNCTIONS]);
      const staticSiteProviders = providersByType[_constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_10__.DEPLOYMENT_TYPES.STATIC_SITE];
      const blueprintBundleProviders = providersByType[_constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_10__.DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE];
      const edgeFunctionProviders = providersByType[_constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_10__.DEPLOYMENT_TYPES.EDGE_FUNCTIONS];
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)('[Workflow] Providers by deployment type:', {
        staticSite: staticSiteProviders,
        blueprintBundle: blueprintBundleProviders,
        edgeFunctions: edgeFunctionProviders
      });

      // Store provider arrays in global state for UI access
      setProviders(staticSiteProviders, blueprintBundleProviders);

      // Build context object with all dependencies for step handlers (use pure function)
      const workflowContext = (0,_utils_publishConfiguration__WEBPACK_IMPORTED_MODULE_13__.buildWorkflowContext)({
        siteUrl,
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
          (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)(`[Workflow] Step starting: ${stepId}`);
          // Update UI with step ID
          updateFromStep(stepId);
        },
        onStepComplete: (stepId, result) => {
          (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)(`[Workflow] Step completed: ${stepId}`, result);
        },
        onStepSkipped: stepId => {
          (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)(`[Workflow] Step skipped: ${stepId}`);
        },
        onError: (stepId, error) => {
          (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debugError)(`[Workflow] Step error: ${stepId}`, error);
        }
      };

      // Get steps filtered by enabled providers
      const activeSteps = (0,_steps__WEBPACK_IMPORTED_MODULE_12__.getActiveSteps)(workflowContext);

      // Execute steps using flat executor with dependency resolution
      await (0,_executor__WEBPACK_IMPORTED_MODULE_11__.executeSteps)(activeSteps, workflowContext, workflowOptions);
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debug)('[Workflow] All steps completed successfully');

      // Clear asset upload tracking flags (reset state for next publish)
      assetManager.clearUploadFlags();

      // Update UI to show all steps as complete with success message
      markAllComplete({
        status: 'complete'
      });

      // Release publishing lock (allows user to start new publish)
      setIsPublishing(false);
    } catch (error) {
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_8__.debugError)('Publish failed:', error);
      showError(`Failed to start: ${error.message}`);
      setIsPublishing(false);
    }
  }, [setIsPublishing, api, assetManager, showError, initializeSteps, setStorageProviderId, updateFromStep, updateStaticSiteProgressContext, processStaticSiteUrls, generateBlueprintJson, handleSiteArchiveUpload, setStatusMessage, setStepProgress, removeMessage, setOverallProgressValue, setProviders, markAllComplete]);
  return {
    startPublish
  };
}

/***/ }),

/***/ 5204:
/*!********************************************!*\
  !*** ./node_modules/uuid/dist/validate.js ***!
  \********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _regex_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./regex.js */ 6619);

function validate(uuid) {
    return typeof uuid === 'string' && _regex_js__WEBPACK_IMPORTED_MODULE_0__["default"].test(uuid);
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (validate);


/***/ }),

/***/ 5246:
/*!****************************************!*\
  !*** ./assets/src/utils/getRestUrl.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getRestUrl: () => (/* binding */ getRestUrl)
/* harmony export */ });
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

/***/ }),

/***/ 5287:
/*!******************************************!*\
  !*** ./assets/src/utils/errorHandler.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeErrorHandlers: () => (/* binding */ initializeErrorHandlers)
/* harmony export */ });
/* harmony import */ var _debug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./debug */ 1742);
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
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debugError)('Unhandled promise rejection:', {
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
    (0,_debug__WEBPACK_IMPORTED_MODULE_0__.debugError)('Uncaught error:', {
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

/***/ }),

/***/ 5333:
/*!**************************************************!*\
  !*** ./assets/src/publish/utils/assetTracker.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createAssetTracker: () => (/* binding */ createAssetTracker)
/* harmony export */ });
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

/***/ }),

/***/ 5335:
/*!***********************************************************!*\
  !*** ./assets/src/publish/hooks/useBlueprintGenerator.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useBlueprintGenerator: () => (/* binding */ useBlueprintGenerator)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_useAssetDiscovery__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/useAssetDiscovery */ 6896);
/* harmony import */ var _utils_blueprintStepBuilders__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/blueprintStepBuilders */ 9792);
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
  const assetDiscovery = (0,_utils_useAssetDiscovery__WEBPACK_IMPORTED_MODULE_2__["default"])();
  const generateBlueprint = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(
  /**
   * Generate blueprint JSON.
   *
   * @param {Object|Function} optionsOrSetStatusMessage Options object with assets/wpContentZipUrl, or setStatusMessage callback (for backward compatibility).
   * @param {Array}          [optionsOrSetStatusMessage.assets] Discovered assets.
   * @param {string}          [optionsOrSetStatusMessage.wpContentZipUrl] URL to wp-content.zip.
   * @param {Function}        [setStatusMessage] Optional status message callback (if first param is options object).
   * @return {Promise<Object>} Blueprint JSON object.
   */
  async (optionsOrSetStatusMessage = null, setStatusMessage = null) => {
    // Handle both old signature (setStatusMessage) and new signature (options object, setStatusMessage)
    let actualSetStatusMessage = null;
    let assets = [];
    let wpContentZipUrl = null;
    if (typeof optionsOrSetStatusMessage === 'function') {
      // Old signature: generateBlueprint(setStatusMessage)
      actualSetStatusMessage = optionsOrSetStatusMessage;
    } else if (optionsOrSetStatusMessage && typeof optionsOrSetStatusMessage === 'object') {
      // New signature: generateBlueprint({ assets, wpContentZipUrl }, setStatusMessage)
      assets = optionsOrSetStatusMessage.assets || [];
      wpContentZipUrl = optionsOrSetStatusMessage.wpContentZipUrl || null;
      actualSetStatusMessage = setStatusMessage;
    }
    // Fetch WordPress.org plugin/theme slugs and site name using browser-based discovery.
    if (actualSetStatusMessage) {
      actualSetStatusMessage('Detecting WordPress.org plugins and themes…', 'progress', 'detectWporgAssets');
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
    const filteredAssets = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.blueprint.assets', {
      plugins: wporgPlugins,
      themes: wporgThemes
    }, assetsResponse);
    wporgPlugins = filteredAssets.plugins || [];
    wporgThemes = filteredAssets.themes || [];

    // Start configuring Playground settings
    if (actualSetStatusMessage) {
      actualSetStatusMessage('Configuring WordPress Playground settings…', 'progress', 'configurePlayground');
    }

    // Build blueprint steps array with bundled wp-content resources.
    const steps = (0,_utils_blueprintStepBuilders__WEBPACK_IMPORTED_MODULE_3__.buildBlueprintSteps)({
      wporgPlugins,
      wporgThemes
    });

    // Construct blueprint JSON.
    let blueprint = (0,_utils_blueprintStepBuilders__WEBPACK_IMPORTED_MODULE_3__.buildBlueprintJson)(steps);
    if (actualSetStatusMessage) {
      actualSetStatusMessage(`Blueprint generated: ${steps.length} total steps`, 'success', 'generateBlueprint');
      // Update detection message to success
      actualSetStatusMessage('Detected WordPress.org plugins and themes', 'success', 'detectWporgAssets');
      // Update configuration message to success
      actualSetStatusMessage('Configured WordPress Playground settings', 'success', 'configurePlayground');
      // Update plugin/theme messages to success
      // Keep original message text, just update type to success
      if (wporgPlugins.length > 0) {
        const pluginNames = wporgPlugins.join(', ');
        actualSetStatusMessage(`Adding ${wporgPlugins.length} WordPress.org plugin${wporgPlugins.length !== 1 ? 's' : ''} to blueprint`, 'success', 'addPluginsToBlueprint');
        actualSetStatusMessage(`Plugins: ${pluginNames}`, 'success', 'pluginsList');
      }
      if (wporgThemes.length > 0) {
        const themeNames = wporgThemes.join(', ');
        actualSetStatusMessage(`Adding ${wporgThemes.length} WordPress.org theme${wporgThemes.length !== 1 ? 's' : ''} to blueprint`, 'success', 'addThemesToBlueprint');
        actualSetStatusMessage(`Themes: ${themeNames}`, 'success', 'themesList');
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
    blueprint = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.blueprint.generated', blueprint, wporgPlugins, wporgThemes);
    return blueprint;
  }, [assetDiscovery]);
  return {
    generateBlueprint
  };
}

/***/ }),

/***/ 6002:
/*!********************************************************!*\
  !*** ./assets/src/components/UploadStatistic/index.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ UploadStatistic)
/* harmony export */ });
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);
/**
 * Upload Statistic Component
 *
 * Reusable component for displaying individual statistics with a labeled badge
 * and flexible content area. Used within UploadStatistics to show metrics like
 * provider count, file count, and total size.
 *
 * @package
 */



/**
 * Upload Statistic Component
 *
 * @param {Object}      props          Component props
 * @param {string}      props.label    Label text displayed in badge
 * @param {Object}      props.color    Color configuration for label badge (with backgroundColor and textColor properties)
 * @param {JSX.Element} props.children Content to display below the label
 * @return {JSX.Element} Statistic item
 */

function UploadStatistic({
  label,
  color = {
    backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.backgroundLight,
    textColor: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.textMuted
  },
  children
}) {
  // Styles
  const itemStyle = {
    ...(0,_utils_styles__WEBPACK_IMPORTED_MODULE_0__.createFlexStyle)('column', _utils_styles__WEBPACK_IMPORTED_MODULE_0__.spacing.xs),
    alignItems: 'center',
    minWidth: '120px'
  };
  const labelStyle = {
    fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.fontSize.xs,
    color: color.textColor,
    backgroundColor: color.backgroundColor,
    fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: `${_utils_styles__WEBPACK_IMPORTED_MODULE_0__.spacing.xs} ${_utils_styles__WEBPACK_IMPORTED_MODULE_0__.spacing.sm}`,
    borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.borderRadius.sm
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
    className: "aether-publish-progress-modal__detail-item",
    style: itemStyle,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("span", {
      className: "aether-publish-progress-modal__detail-label",
      style: labelStyle,
      children: label
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("div", {
      className: "aether-publish-progress-modal__detail-value",
      children: children
    })]
  });
}

/***/ }),

/***/ 6075:
/*!*************************************************************!*\
  !*** ./assets/src/publish/steps/getStaticSiteUrls/index.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getStaticSiteUrlsStep: () => (/* binding */ getStaticSiteUrlsStep)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/**
 * Get Static Site URLs Step
 *
 * Discovers all URLs that need to be fetched for static site generation.
 *
 * @package
 */



/**
 * Get static site URLs step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {string}   context.siteUrl          WordPress site URL.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered URLs.
 */
async function handler(context) {
  const {
    api,
    siteUrl,
    setStatusMessage
  } = context;
  setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Discovering URLs for static site…', 'aether-site-exporter'), 'progress', 'getStaticSiteUrls');

  // Discover URLs from API
  const urlResponse = await api.discoverUrls();
  if (!urlResponse.success) {
    throw new Error(urlResponse.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to discover URLs', 'aether-site-exporter'));
  }
  const urls = urlResponse.urls || [];
  const staticSiteUrl = urlResponse.staticSiteUrl || siteUrl;
  const urlsCount = urls.length;
  setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %d: Number of URLs */
  (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Discovered %d URLs for static site generation', 'aether-site-exporter'), urlsCount), 'success', 'getStaticSiteUrls');

  // Return data to merge into execution state
  return {
    urls,
    staticSiteUrl,
    urlsCount
  };
}

/**
 * Get Static Site URLs step definition.
 */
const getStaticSiteUrlsStep = {
  id: 'getStaticSiteUrls',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Discover URLs', 'aether-site-exporter'),
  description: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Find all URLs for static site generation', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: [],
  provides: ['urls', 'staticSiteUrl', 'urlsCount'],
  handler
};

/***/ }),

/***/ 6087:
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
/***/ ((module) => {

module.exports = window["wp"]["element"];

/***/ }),

/***/ 6168:
/*!*****************************************************************!*\
  !*** ./assets/src/publish/steps/uploadBlueprintBundle/index.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   uploadBlueprintBundleStep: () => (/* binding */ uploadBlueprintBundleStep)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/api-fetch */ 1455);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _utils_helpers__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../utils/helpers */ 9484);
/* harmony import */ var _utils_progressManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../utils/progressManager */ 4047);
/**
 * Upload Blueprint Bundle Step
 *
 * Uploads blueprint-bundle.zip to configured provider(s).
 *
 * @package
 */







/**
 * Upload blueprint bundle step handler.
 *
 * @param {Object}   context                          Execution context.
 * @param {Function} context.handleSiteArchiveUpload  Archive upload function.
 * @param {Array}    context.blueprintBundleProviders Providers for blueprint bundle.
 * @param {Object}   context.blueprintBundle          Bundle data from generateBlueprint.
 * @param {Function} context.setStatusMessage         Status message updater.
 * @param {Function} context.setStepProgress          Step progress updater.
 * @param {Function} context.setOverallProgressValue  Overall progress updater.
 * @return {Promise<Object>} Step result.
 */
async function handler(context) {
  const {
    handleSiteArchiveUpload,
    blueprintBundleProviders = [],
    blueprintBundle,
    setStatusMessage,
    setStepProgress,
    setOverallProgressValue
  } = context;
  const providers = blueprintBundleProviders;
  if (providers.length === 0) {
    setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('No providers enabled for blueprint bundle', 'aether-site-exporter'), 'warning', 'uploadBlueprintBundle');
    return {
      skipped: true,
      reason: 'no_providers'
    };
  }
  const bundleSize = blueprintBundle?.bundleSize || 0;
  const bundleSizeFormatted = (0,_utils_helpers__WEBPACK_IMPORTED_MODULE_3__.formatFileSize)(bundleSize);
  setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$s: File size, %2$d: Number of providers */
  (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__._n)('Uploading blueprint bundle (%1$s) to %2$d provider…', 'Uploading blueprint bundle (%1$s) to %2$d providers…', providers.length, 'aether-site-exporter'), bundleSizeFormatted, providers.length), 'progress', 'uploadBlueprintBundle');

  // Upload to providers sequentially
  const uploadResults = [];
  let successCount = 0;
  let failureCount = 0;
  for (const providerIdItem of providers) {
    try {
      // Fetch provider config
      let exportPath = 'blueprint-bundle/bundle.zip';
      try {
        const providerResponse = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2___default()({
          path: `/aether/site-exporter/providers/${providerIdItem}`
        });
        if (providerResponse.success && providerResponse.config) {
          const providerConfig = providerResponse.config || {};
          if (providerConfig.export_path) {
            exportPath = providerConfig.export_path;
          }
        }
      } catch {
        // Use default path on error
      }
      const deploymentConfig = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.deployment.config', {
        ...context,
        providerId: providerIdItem,
        exportPath
      }, providerIdItem);
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

      // Update progress
      if (setStepProgress && setOverallProgressValue) {
        const stepProgress = Math.min(100, Math.round(successCount / providers.length * 100));
        setStepProgress('uploadBlueprintBundle', stepProgress);
        setOverallProgressValue((0,_utils_progressManager__WEBPACK_IMPORTED_MODULE_4__.calculateOverallProgress)({
          step: 'uploadBlueprintBundle',
          progress: stepProgress
        }));
      }
    } catch (error) {
      failureCount++;
      uploadResults.push({
        status: 'rejected',
        reason: error,
        providerId: providerIdItem,
        error: error?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Unknown error', 'aether-site-exporter')
      });
    }
  }

  // Report results
  if (successCount > 0) {
    setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$s: File size, %2$d: Success count, %3$d: Total providers */
    (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__._n)('Uploaded blueprint bundle (%1$s) to %2$d/%3$d provider', 'Uploaded blueprint bundle (%1$s) to %2$d/%3$d providers', providers.length, 'aether-site-exporter'), bundleSizeFormatted, successCount, providers.length), failureCount > 0 ? 'warning' : 'success', 'uploadBlueprintBundle');
  }
  if (successCount === 0) {
    throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to upload blueprint bundle to any provider', 'aether-site-exporter'));
  }
  return {
    providers,
    results: uploadResults.map(r => r.status === 'fulfilled' ? r.value : r.reason),
    successCount,
    failureCount
  };
}

/**
 * Upload Blueprint Bundle step definition.
 */
const uploadBlueprintBundleStep = {
  id: 'uploadBlueprintBundle',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Upload Blueprint Bundle', 'aether-site-exporter'),
  description: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Upload blueprint-bundle.zip to providers', 'aether-site-exporter'),
  supportsProgress: true,
  dependencies: ['generateBlueprint'],
  provides: [],
  handler
};

/***/ }),

/***/ 6427:
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
/***/ ((module) => {

module.exports = window["wp"]["components"];

/***/ }),

/***/ 6457:
/*!*************************************************************!*\
  !*** ./assets/src/components/ProviderInstanceCard/index.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ProviderInstanceCard)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var _constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../constants/deploymentTypes */ 241);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);
/**
 * Provider Instance Card Component
 *
 * Displays a single provider instance with inline name editing,
 * enable/disable toggle, configure button, and delete button.
 *
 * @package
 */







// Styles - extracted to module level for performance

const headerContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.spacing.sm
};
const headerRowStyle = {
  display: 'flex',
  alignItems: 'center'
};
const nameStyle = {
  fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.fontSize.base,
  fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.fontWeight.semibold,
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.colors.text,
  cursor: 'pointer',
  flex: 1,
  padding: `${_utils_styles__WEBPACK_IMPORTED_MODULE_3__.spacing.xs} ${_utils_styles__WEBPACK_IMPORTED_MODULE_3__.spacing.sm}`,
  borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.borderRadius.sm,
  transition: 'background-color 0.2s ease'
};
const nameInputStyle = {
  fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.fontSize.base,
  fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.fontWeight.semibold,
  padding: `${_utils_styles__WEBPACK_IMPORTED_MODULE_3__.spacing.xs} ${_utils_styles__WEBPACK_IMPORTED_MODULE_3__.spacing.sm}`,
  border: `2px solid ${_utils_styles__WEBPACK_IMPORTED_MODULE_3__.colors.primary}`,
  borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.borderRadius.sm,
  flex: 1,
  outline: 'none',
  transition: 'border-color 0.2s ease'
};
const actionsStyle = {
  display: 'flex',
  gap: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.spacing.sm
};
const providerTypeTagStyle = {
  fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.fontSize.xs,
  fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.fontWeight.medium,
  padding: '4px 8px',
  borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.borderRadius.sm,
  backgroundColor: '#000',
  color: '#fff',
  display: 'inline-block',
  marginBottom: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.spacing.sm
};
const deploymentTypesContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.spacing.xs,
  marginTop: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.spacing.xs
};
const toggleContainerStyle = {
  marginTop: '1rem'
};
const configureButtonStyle = {
  flex: 1
};

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
  const [isEditing, setIsEditing] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [editedName, setEditedName] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(instance.config.instance_name || '');
  const inputRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  // Focus input when editing starts
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
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
    const confirmed = confirm((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: instance name */
    (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Are you sure you want to delete the instance "%s"? This cannot be undone.', 'aether-site-exporter'), instance.config.instance_name));
    if (confirmed) {
      onDelete();
    }
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
      fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.fontSize.xs,
      fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.fontWeight.medium,
      padding: '3px 8px',
      borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.borderRadius.sm,
      display: 'inline-block'
    };

    // Assign different colors based on deployment type using WordPress statusBadgeStyles
    switch (deploymentType) {
      case _constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_4__.DEPLOYMENT_TYPES.STATIC_SITE:
        return {
          ...baseStyle,
          ..._utils_styles__WEBPACK_IMPORTED_MODULE_3__.statusBadgeStyles.success
        };
      case _constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_4__.DEPLOYMENT_TYPES.BLUEPRINT_BUNDLE:
        return {
          ...baseStyle,
          ..._utils_styles__WEBPACK_IMPORTED_MODULE_3__.statusBadgeStyles.info
        };
      case _constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_4__.DEPLOYMENT_TYPES.EDGE_FUNCTIONS:
        return {
          ...baseStyle,
          ..._utils_styles__WEBPACK_IMPORTED_MODULE_3__.statusBadgeStyles.warning
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.colors.backgroundLighter,
          color: _utils_styles__WEBPACK_IMPORTED_MODULE_3__.colors.textSecondary
        };
    }
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Card, {
    className: "aether-provider-instance-card",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CardHeader, {
      className: "aether-provider-instance-card__header",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("div", {
        className: "aether-provider-instance-card__header-content",
        style: headerContentStyle,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("div", {
          className: "aether-provider-instance-card__header-row",
          style: headerRowStyle,
          children: isEditing ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("input", {
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
          }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("div", {
            className: "aether-provider-instance-card__name",
            style: nameStyle,
            onClick: () => setIsEditing(true),
            onKeyDown: e => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsEditing(true);
              }
            },
            onMouseEnter: e => {
              e.currentTarget.style.backgroundColor = _utils_styles__WEBPACK_IMPORTED_MODULE_3__.colors.backgroundLighter;
            },
            onMouseLeave: e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            },
            role: "button",
            tabIndex: 0,
            title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Click to edit name', 'aether-site-exporter'),
            children: instance.config.instance_name
          })
        })
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CardBody, {
      className: "aether-provider-instance-card__body",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("div", {
        className: "aether-provider-instance-card__body-content-tags",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("div", {
          className: "aether-provider-instance-card__type-tag",
          style: providerTypeTagStyle,
          children: provider.name
        }), enabledDeploymentTypes.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("div", {
          className: "aether-provider-instance-card__deployment-types",
          style: deploymentTypesContainerStyle,
          children: enabledDeploymentTypes.map(deploymentType => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("span", {
            className: `aether-provider-instance-card__deployment-type-tag aether-provider-instance-card__deployment-type-tag--${deploymentType}`,
            style: getDeploymentTypeTagStyle(deploymentType),
            children: _constants_deploymentTypes__WEBPACK_IMPORTED_MODULE_4__.DEPLOYMENT_TYPE_LABELS[deploymentType] || deploymentType
          }, deploymentType))
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)("div", {
        className: "aether-provider-instance-card__toggle",
        style: toggleContainerStyle,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.ToggleControl, {
          className: "aether-provider-instance-card__toggle-control",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Enable this instance', 'aether-site-exporter'),
          checked: instance.config.enabled !== false,
          onChange: onToggle
        })
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.CardFooter, {
      className: "aether-provider-instance-card__footer",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)("div", {
        className: "aether-provider-instance-card__actions",
        style: actionsStyle,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          className: "aether-provider-instance-card__configure-button",
          variant: "secondary",
          onClick: onConfigure,
          style: configureButtonStyle,
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Configure', 'aether-site-exporter')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          className: "aether-provider-instance-card__delete-button",
          variant: "secondary",
          isDestructive: true,
          onClick: handleDelete,
          title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Delete this instance', 'aether-site-exporter'),
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Delete', 'aether-site-exporter')
        })]
      })
    })]
  });
}

/***/ }),

/***/ 6543:
/*!******************************************************!*\
  !*** ./assets/src/components/ErrorBoundary/index.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/debug */ 1742);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);
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

class ErrorBoundary extends _wordpress_element__WEBPACK_IMPORTED_MODULE_0__.Component {
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
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debugError)('Error caught by ErrorBoundary:', {
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
        padding: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.lg
      };
      const noticeStyle = {
        ..._utils_styles__WEBPACK_IMPORTED_MODULE_2__.noticeStyles.error,
        padding: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.md + ' ' + _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.lg,
        margin: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.lg + ' 0'
      };
      const headingStyle = {
        margin: '0 0 ' + _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.sm,
        fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.fontSize.xl,
        fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.fontWeight.semibold,
        color: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.colors.text
      };
      const paragraphStyle = {
        margin: '0 0 ' + _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.sm,
        color: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.colors.text
      };
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
        className: "aether-error-boundary",
        style: containerStyle,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
          className: "aether-error-boundary__notice",
          style: noticeStyle,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("h2", {
            className: "aether-error-boundary__heading",
            style: headingStyle,
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Something went wrong', 'aether-site-exporter')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
            className: "aether-error-boundary__message",
            style: paragraphStyle,
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('An unexpected error occurred. Please try refreshing the page.', 'aether')
          }), this.state.error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("details", {
            className: "aether-error-boundary__details",
            style: {
              marginTop: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.lg
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("summary", {
              className: "aether-error-boundary__summary",
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Error details', 'aether-site-exporter')
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("pre", {
              className: "aether-error-boundary__error-text",
              style: {
                marginTop: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.lg,
                padding: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.lg,
                background: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.colors.backgroundLighter,
                overflow: 'auto',
                fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.fontSize.sm
              },
              children: [this.state.error.toString(), this.state.errorInfo && this.state.errorInfo.componentStack]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("button", {
            type: "button",
            className: "aether-error-boundary__retry-button",
            onClick: this.resetError,
            style: {
              marginTop: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.lg,
              padding: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.sm + ' ' + _utils_styles__WEBPACK_IMPORTED_MODULE_2__.spacing.lg,
              background: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.colors.primary,
              color: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.colors.white,
              border: `1px solid ${_utils_styles__WEBPACK_IMPORTED_MODULE_2__.colors.primary}`,
              borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.borderRadius.sm,
              cursor: 'pointer',
              fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.fontSize.sm,
              fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_2__.fontWeight.normal,
              lineHeight: 1.5
            },
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Try again', 'aether-site-exporter')
          })]
        })
      });
    }
    return this.props.children;
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ErrorBoundary);

/***/ }),

/***/ 6603:
/*!*************************************************!*\
  !*** ./assets/src/hooks/useProviderSettings.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useProviderSettings: () => (/* binding */ useProviderSettings)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/api-fetch */ 1455);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _services_ProviderSettingsAPI__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../services/ProviderSettingsAPI */ 1900);
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
  const [loading, setLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [error, setError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);

  // Create service instance with apiFetch (memoized to prevent recreation)
  const api = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => new _services_ProviderSettingsAPI__WEBPACK_IMPORTED_MODULE_2__.ProviderSettingsAPI((_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_1___default())), []);

  /**
   * Fetch all provider settings
   *
   * @return {Promise<Object>} Provider configurations object
   */
  const fetchProviderSettings = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async () => {
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
  const updateProviderConfig = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (providerId, updatedConfig, options = {}) => {
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
  const updateMultipleProviders = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async updates => {
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
  const toggleProviderEnabled = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (providerId, enabled) => {
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
  const createProviderInstance = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (instanceId, providerType, instanceName) => {
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
  const renameProviderInstance = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (instanceId, instanceName) => {
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
  const deleteProviderInstance = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async instanceId => {
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

/***/ }),

/***/ 6619:
/*!*****************************************!*\
  !*** ./node_modules/uuid/dist/regex.js ***!
  \*****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i);


/***/ }),

/***/ 6706:
/*!***************************************!*\
  !*** ./assets/src/utils/indexedDB.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IndexedDBStore: () => (/* binding */ IndexedDBStore),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   deleteDatabase: () => (/* binding */ deleteDatabase),
/* harmony export */   isIndexedDBAvailable: () => (/* binding */ isIndexedDBAvailable)
/* harmony export */ });
/* harmony import */ var idb__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! idb */ 602);
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
    const db = await (0,idb__WEBPACK_IMPORTED_MODULE_0__.openDB)(config.dbName, config.version, {
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
    return typeof indexedDB !== 'undefined' && indexedDB !== null && typeof idb__WEBPACK_IMPORTED_MODULE_0__.openDB === 'function';
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
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (IndexedDBStore);

/***/ }),

/***/ 6896:
/*!***********************************************!*\
  !*** ./assets/src/utils/useAssetDiscovery.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ useAssetDiscovery),
/* harmony export */   isFromWordPressOrg: () => (/* binding */ isFromWordPressOrg),
/* harmony export */   normalizePluginSlug: () => (/* reexport safe */ _services_AssetDiscoveryService__WEBPACK_IMPORTED_MODULE_5__.normalizePluginSlug)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./api */ 1561);
/* harmony import */ var _wporgCache__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./wporgCache */ 698);
/* harmony import */ var _debug__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./debug */ 1742);
/* harmony import */ var _services_AssetDiscoveryService__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../services/AssetDiscoveryService */ 4061);
/**
 * Asset Discovery Hook
 *
 * Replaces PHP-based AssetDiscoveryService with browser-based implementation.
 * Detects WordPress.org plugins/themes by checking wordpress.org URLs.
 *
 * @package
 */








// Re-export normalizePluginSlug


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
  const normalizedSlug = type === 'plugin' ? (0,_services_AssetDiscoveryService__WEBPACK_IMPORTED_MODULE_5__.normalizePluginSlug)(slug) : slug;

  // Check persistent cache first (IndexedDB + memory)
  const cache = (0,_wporgCache__WEBPACK_IMPORTED_MODULE_3__.getWpOrgCache)();
  const cached = await cache.get(normalizedSlug, type);
  if (cached !== null) {
    return cached;
  }

  // Try PHP method first, then fallback to CORS proxy
  let result = await checkWithMethod(normalizedSlug, type, 'php', config);

  // If PHP method returned null (unable to check), try CORS proxy fallback
  if (result === null) {
    (0,_debug__WEBPACK_IMPORTED_MODULE_4__.debugWarn)(`PHP WordPress.org check returned null for ${type} "${slug}", trying CORS proxy fallback`);
    result = await checkWithMethod(normalizedSlug, type, 'cors-proxy', config);
  }

  // If still null after fallback, treat as false
  if (result === null) {
    (0,_debug__WEBPACK_IMPORTED_MODULE_4__.debugWarn)(`All WordPress.org check methods failed for ${type} "${slug}", treating as custom asset`);
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
      data = await (0,_api__WEBPACK_IMPORTED_MODULE_2__["default"])({
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
        throw new Error(data.error || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Unknown error', 'aether-site-exporter'));
      }
      exists = data.exists;
    }

    // Return the result (could be true, false, or null)
    // null means "unable to check" and should trigger fallback
    return exists;
  } catch (error) {
    // Network/API error - return null to indicate unable to check
    (0,_debug__WEBPACK_IMPORTED_MODULE_4__.debugWarn)(`Failed to check WordPress.org for ${type} "${slug}" using ${method} method:`, error);
    return null;
  }
}

/**
 * Asset Discovery Hook
 *
 * Provides methods to discover and categorize installed plugins/themes.
 * Uses AssetDiscoveryService for business logic.
 *
 * @return {Object} Hook methods and state
 */
function useAssetDiscovery() {
  const [loading, setLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
  const [error, setError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(null);

  // Create service instance with dependencies
  const service = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => new _services_AssetDiscoveryService__WEBPACK_IMPORTED_MODULE_5__.AssetDiscoveryService(_api__WEBPACK_IMPORTED_MODULE_2__["default"], isFromWordPressOrg, (0,_wporgCache__WEBPACK_IMPORTED_MODULE_3__.getWpOrgCache)()), []);

  /**
   * Discover all custom assets (not from WordPress.org)
   *
   * @return {Promise<Array<Object>>} Array of custom assets
   */
  const discoverCustomAssets = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const customAssets = await service.discoverCustomAssets();
      setLoading(false);
      return customAssets;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [service]);

  /**
   * Get WordPress.org assets for blueprint generation
   *
   * Returns only active plugins/themes from WordPress.org.
   * Custom assets will be included in wp-content.zip.
   *
   * @return {Promise<Object>} Object with plugins and themes arrays
   */
  const getBlueprintAssets = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async () => {
    setLoading(true);
    setError(null);
    try {
      const blueprintAssets = await service.getBlueprintAssets();
      setLoading(false);
      return blueprintAssets;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [service]);
  return {
    discoverCustomAssets,
    getBlueprintAssets,
    loading,
    error
  };
}

/***/ }),

/***/ 7068:
/*!**************************************************!*\
  !*** ./assets/src/services/PublishAPIService.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PublishAPIService: () => (/* binding */ PublishAPIService)
/* harmony export */ });
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
   * @param {Function} apiFetch       WordPress apiFetch function (injectable for testing)
   * @param {Object}   assetDiscovery Asset discovery service
   * @param {Object}   storage        Storage implementation (injectable for testing)
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
  async discoverBlueprintBundleAssets() {
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

  /**
   * Discover URLs for static site generation
   *
   * Calls the REST API to discover all URLs that need to be fetched.
   *
   * @return {Promise<Object>} Response with urls array and staticSiteUrl
   */
  async discoverUrls() {
    try {
      const response = await this.apiFetch({
        path: '/aether/site-exporter/publish/steps/getStaticSiteUrls',
        method: 'GET'
      });
      if (response.success) {
        return {
          success: true,
          urls: response.urls || [],
          staticSiteUrl: response.staticSiteUrl || null
        };
      }
      return {
        success: false,
        message: response.message || 'Failed to discover URLs',
        urls: [],
        staticSiteUrl: null
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to discover URLs',
        urls: [],
        staticSiteUrl: null
      };
    }
  }

  /**
   * Create site archive
   *
   * Creates wp-content.zip containing custom plugins, themes, and uploads.
   *
   * @param {Object}   options              Archive creation options.
   * @param {Array}    options.assets       Array of asset objects to include.
   * @param {boolean}  options.includeUploads Whether to include uploads directory.
   * @return {Promise<Object>} Response with zipPath, zipUrl, and zipSize
   */
  async createArchive({
    assets = [],
    includeUploads = true
  } = {}) {
    try {
      // Extract slugs from assets array
      const customAssets = assets.map(asset => asset.slug || asset);
      const response = await this.apiFetch({
        path: '/aether/site-exporter/publish/createArchive',
        method: 'POST',
        data: {
          custom_assets: customAssets,
          include_uploads: includeUploads
        }
      });
      if (response.success && response.data) {
        // The PHP endpoint returns data in a 'data' property
        const archiveData = response.data;
        return {
          success: true,
          zipPath: archiveData.zipPath || null,
          zipUrl: archiveData.zipUrl || null,
          zipSize: archiveData.zipSize || 0
        };
      }
      return {
        success: false,
        message: response.message || 'Failed to create archive'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create archive'
      };
    }
  }

  /**
   * Generate blueprint JSON
   *
   * This is typically handled client-side via generateBlueprintJson function.
   * This method is a fallback if the function is not available.
   *
   * @param {Object}   options              Blueprint generation options.
   * @param {Array}    options.assets       Discovered assets.
   * @param {string}   options.wpContentZipUrl URL to wp-content.zip.
   * @return {Promise<Object>} Response with blueprint data
   */
  async generateBlueprint({
    assets = [],
    wpContentZipUrl = null
  } = {}) {
    // This is a fallback method - typically blueprint generation is done client-side
    // via the generateBlueprintJson function from useBlueprintGenerator hook
    return {
      success: false,
      message: 'Blueprint generation must be done client-side. Please ensure generateBlueprintJson function is available.'
    };
  }

  /**
   * Create blueprint bundle
   *
   * Creates blueprint-bundle.zip containing blueprint.json and wp-content.zip.
   *
   * @param {Object}   options                Bundle creation options.
   * @param {Object}   options.blueprint     Blueprint JSON data.
   * @param {string}   options.wpContentZipPath Path to wp-content.zip.
   * @return {Promise<Object>} Response with bundlePath, bundleUrl, and bundleSize
   */
  async createBlueprintBundle({
    blueprint,
    wpContentZipPath
  } = {}) {
    try {
      if (!blueprint) {
        return {
          success: false,
          message: 'Blueprint data is required'
        };
      }
      if (!wpContentZipPath) {
        return {
          success: false,
          message: 'Archive path is required'
        };
      }
      const response = await this.apiFetch({
        path: '/aether/site-exporter/publish/generateBlueprintBundle',
        method: 'POST',
        data: {
          blueprintData: blueprint,
          archiveResult: {
            zipPath: wpContentZipPath
          }
        }
      });
      if (response.success && response.data) {
        // The PHP endpoint returns data in a 'data' property
        const bundleData = response.data;
        return {
          success: true,
          bundlePath: bundleData.bundlePath || null,
          bundleUrl: bundleData.bundleUrl || null,
          bundleSize: bundleData.bundleSize || 0
        };
      }
      return {
        success: false,
        message: response.message || 'Failed to create blueprint bundle'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create blueprint bundle'
      };
    }
  }
}

/***/ }),

/***/ 7189:
/*!*********************************************************!*\
  !*** ./assets/src/providers/utils/providerDiscovery.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultProvider: () => (/* binding */ getDefaultProvider),
/* harmony export */   getProviderForDeploymentType: () => (/* binding */ getProviderForDeploymentType)
/* harmony export */ });
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/api-fetch */ 1455);
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

/***/ 7697:
/*!******************************************!*\
  !*** ./node_modules/uuid/dist/native.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({ randomUUID });


/***/ }),

/***/ 7723:
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
/***/ ((module) => {

module.exports = window["wp"]["i18n"];

/***/ }),

/***/ 7730:
/*!*************************************************************!*\
  !*** ./assets/src/publish/steps/generateBlueprint/index.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   generateBlueprintStep: () => (/* binding */ generateBlueprintStep)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_helpers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../utils/helpers */ 9484);
/**
 * Generate Blueprint Step
 *
 * Generates blueprint-bundle.zip containing blueprint.json and wp-content.zip.
 *
 * @package
 */





/**
 * Generate blueprint step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Object}   context.api                   PublishAPI instance.
 * @param {Function} context.generateBlueprintJson Blueprint JSON generator function.
 * @param {string}   context.zipPath               Path to wp-content.zip from createBlueprintBundle.
 * @param {string}   context.zipUrl                URL to wp-content.zip.
 * @param {Array}    context.discoveredAssets      Discovered assets.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @return {Promise<Object>} Step result with blueprint bundle info.
 */
async function handler(context) {
  const {
    api,
    generateBlueprintJson,
    zipPath,
    zipUrl,
    discoveredAssets = [],
    setStatusMessage
  } = context;
  setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Generating blueprint bundle…', 'aether-site-exporter'), 'progress', 'generateBlueprint');
  if (!zipPath) {
    throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Site archive not found. Please run createBlueprintBundle first.', 'aether-site-exporter'));
  }

  // Generate blueprint.json
  let blueprintData;
  if (typeof generateBlueprintJson === 'function') {
    blueprintData = await generateBlueprintJson({
      assets: discoveredAssets,
      wpContentZipUrl: zipUrl
    }, setStatusMessage);
  } else {
    // Fallback: use API to generate blueprint
    const blueprintResponse = await api.generateBlueprint({
      assets: discoveredAssets,
      wpContentZipUrl: zipUrl
    });
    if (!blueprintResponse.success) {
      throw new Error(blueprintResponse.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to generate blueprint', 'aether-site-exporter'));
    }
    blueprintData = blueprintResponse.blueprint;
  }

  // Allow filtering of blueprint data
  const filteredBlueprint = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.publish.step.generateBlueprint.data', blueprintData, context);

  // Create the bundle via API
  const bundleResponse = await api.createBlueprintBundle({
    blueprint: filteredBlueprint,
    wpContentZipPath: zipPath
  });
  if (!bundleResponse.success) {
    throw new Error(bundleResponse.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to create blueprint bundle', 'aether-site-exporter'));
  }
  const {
    bundlePath,
    bundleUrl,
    bundleSize
  } = bundleResponse;
  const sizeFormatted = (0,_utils_helpers__WEBPACK_IMPORTED_MODULE_2__.formatFileSize)(bundleSize || 0);
  setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: File size */
  (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Generated blueprint bundle (%s)', 'aether-site-exporter'), sizeFormatted), 'success', 'generateBlueprint');

  // Return data to merge into execution state
  return {
    blueprintData: filteredBlueprint,
    blueprintBundle: {
      bundlePath,
      bundleUrl,
      bundleSize
    }
  };
}

/**
 * Generate Blueprint step definition.
 */
const generateBlueprintStep = {
  id: 'generateBlueprint',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Generate Blueprint', 'aether-site-exporter'),
  description: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Create blueprint-bundle.zip', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: ['createBlueprintBundle'],
  provides: ['blueprintData', 'blueprintBundle'],
  handler
};

/***/ }),

/***/ 7853:
/*!************************************************************!*\
  !*** ./assets/src/publish/hooks/useStaticSiteGenerator.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useStaticSiteGenerator: () => (/* binding */ useStaticSiteGenerator)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_assetTracker__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/assetTracker */ 5333);
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/debug */ 1742);
/* harmony import */ var _utils_manifestManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../utils/manifestManager */ 3893);
/* harmony import */ var _utils_staticSiteConfig__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/staticSiteConfig */ 3782);
/* harmony import */ var _utils_preScanPhase__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/preScanPhase */ 1838);
/* harmony import */ var _utils_uploadPhase__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/uploadPhase */ 9577);
/**
 * Static Site Generator Hook
 *
 * Processes URLs and uploads static site files using a two-phase approach:
 * 1. PHASE 1 (Pre-scan): Fetch all URLs, extract assets, count total files
 * 2. PHASE 2 (Upload): Upload all files with accurate progress
 *
 * @package
 */







// Extracted modules




/**
 * Process URLs and upload static site files.
 *
 * @param {Function} onProgress Progress callback (uploadedFiles, totalFiles, message).
 * @return {Function} Process function.
 */
function useStaticSiteGenerator(onProgress) {
  const processUrls = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (urls, staticSiteUrl, staticSiteProviderId, siteUrl, setStatusMessage, blueprintData, removeMessage = null) => {
    // Create asset tracker to prevent duplicate uploads
    const assetTracker = (0,_utils_assetTracker__WEBPACK_IMPORTED_MODULE_2__.createAssetTracker)();

    // Track all uploaded files for manifest generation
    const uploadedFiles = [];

    // Track failures for reporting
    const failures = (0,_utils_staticSiteConfig__WEBPACK_IMPORTED_MODULE_5__.createFailureTracker)();

    // Get provider configuration
    const providerConfig = await (0,_utils_staticSiteConfig__WEBPACK_IMPORTED_MODULE_5__.fetchProviderConfig)(staticSiteProviderId);
    const staticPath = providerConfig.static_files_path || 'static/';

    // Build and create storage service
    const config = (0,_utils_staticSiteConfig__WEBPACK_IMPORTED_MODULE_5__.buildStorageConfig)(siteUrl, staticSiteUrl, staticSiteProviderId);
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debug)('Static site storage configuration:', {
      staticPath,
      providerId: staticSiteProviderId
    });
    const storageService = await (0,_utils_staticSiteConfig__WEBPACK_IMPORTED_MODULE_5__.createStorageService)(staticPath, config, staticSiteProviderId, providerConfig);
    const totalUrls = urls.length;

    // PHASE 1: Pre-scan all URLs
    const preScanResult = await (0,_utils_preScanPhase__WEBPACK_IMPORTED_MODULE_6__.executePreScan)({
      urls,
      siteUrl,
      providerId: staticSiteProviderId,
      providerConfig,
      setStatusMessage
    });
    const {
      cache,
      totalFilesToUpload
    } = preScanResult;

    // Merge pre-scan failures
    failures.urlsFailed += preScanResult.failures.urlsFailed;
    failures.failedUrls.push(...preScanResult.failures.failedUrls);

    // PHASE 2: Upload all files
    let manifest = await (0,_utils_uploadPhase__WEBPACK_IMPORTED_MODULE_7__.prepareManifest)(storageService, staticSiteProviderId, setStatusMessage);
    let filesUploaded = 0;
    let filesSkipped = 0;

    // Get cached URLs
    const cachedUrls = await cache.getAllUrls();

    // Fire upload start action
    (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.static.upload.before', cachedUrls, totalFilesToUpload, staticSiteProviderId);

    // Process each URL
    for (const url of cachedUrls) {
      const cached = await cache.get(url);
      if (!cached) {
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debugWarn)(`[Aether] Cache miss for URL: ${url} - skipping`);
        continue;
      }
      const {
        processedHtml: rawHtml,
        assetUrls
      } = cached;
      try {
        // Update progress message
        if (setStatusMessage) {
          setStatusMessage(`Uploading files (${filesUploaded + 1}/${totalFilesToUpload})`, 'progress', 'uploadFilesProgress');
        }

        // Upload HTML file
        const htmlResult = await (0,_utils_uploadPhase__WEBPACK_IMPORTED_MODULE_7__.uploadHtmlFile)({
          url,
          rawHtml,
          siteUrl,
          staticSiteUrl,
          providerId: staticSiteProviderId,
          storageService,
          manifest,
          setStatusMessage
        });
        filesUploaded++;
        failures.urlsSucceeded++;
        if (htmlResult.skipped) {
          filesSkipped++;
          if (setStatusMessage) {
            setStatusMessage(`Skipped unchanged file ${htmlResult.htmlPath}`, 'success', `upload-${htmlResult.htmlPath}`);
          }
        }

        // Update manifest if hash available
        if (htmlResult.htmlHash && !htmlResult.skipped) {
          manifest = (0,_utils_manifestManager__WEBPACK_IMPORTED_MODULE_4__.updateManifestEntry)(manifest, htmlResult.htmlKey, htmlResult.htmlSize, htmlResult.htmlHash, 'text/html');
          manifest = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.manifest.update', manifest, htmlResult.htmlKey, staticSiteProviderId);
        }

        // Track uploaded file
        uploadedFiles.push({
          storageKey: htmlResult.htmlKey,
          relativePath: htmlResult.htmlPath,
          contentType: 'text/html'
        });

        // Report progress
        if (onProgress) {
          onProgress(filesUploaded, totalFilesToUpload, null);
        }

        // Process assets for this page
        const assetResult = await (0,_utils_uploadPhase__WEBPACK_IMPORTED_MODULE_7__.processAssets)({
          assetUrls,
          assetTracker,
          storageService,
          manifest,
          providerId: staticSiteProviderId,
          filesUploaded,
          totalFilesToUpload,
          onProgress,
          setStatusMessage
        });
        filesUploaded = assetResult.filesUploaded;
        filesSkipped += assetResult.filesSkipped;
        uploadedFiles.push(...assetResult.uploadedFiles);
        manifest = assetResult.manifest;

        // Periodic manifest save
        if (filesUploaded % 50 === 0) {
          try {
            (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debug)('Periodic manifest save:', filesUploaded + ' files');
            await (0,_utils_manifestManager__WEBPACK_IMPORTED_MODULE_4__.uploadManifest)(storageService, manifest);
          } catch (error) {
            (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debugWarn)('Periodic manifest save failed:', error);
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

    // Clean up cache
    const cacheCleanedCount = await cache.clearSession();
    if (cacheCleanedCount > 0) {
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debug)(`[Aether] Cleared ${cacheCleanedCount} cache entries from this session`);
    }

    // Finalize manifest
    await (0,_utils_uploadPhase__WEBPACK_IMPORTED_MODULE_7__.finalizeManifest)(storageService, manifest, uploadedFiles, staticSiteProviderId, setStatusMessage);

    // Log optimization summary
    const actualUploads = filesUploaded - filesSkipped;
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_3__.debug)('Upload optimization summary:', {
      totalFiles: filesUploaded,
      uploaded: actualUploads,
      skipped: filesSkipped,
      skipRate: filesUploaded > 0 ? `${Math.round(filesSkipped / filesUploaded * 100)}%` : '0%'
    });

    // Remove progress message
    if (removeMessage) {
      removeMessage('uploadFilesProgress');
    }

    // Fire completion action
    (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.static.upload.after', {
      filesUploaded,
      filesSkipped,
      urlsSucceeded: failures.urlsSucceeded,
      urlsFailed: failures.urlsFailed,
      assetsUploaded: assetTracker.getCount()
    }, staticSiteProviderId);

    // Return result
    return (0,_utils_staticSiteConfig__WEBPACK_IMPORTED_MODULE_5__.buildUploadResult)(failures, assetTracker, filesUploaded, filesSkipped, totalFilesToUpload, uploadedFiles, totalUrls);
  }, [onProgress]);
  return processUrls;
}

/***/ }),

/***/ 8177:
/*!****************************************************!*\
  !*** ./assets/src/publish/utils/assetExtractor.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   extractAssetsFromHtml: () => (/* binding */ extractAssetsFromHtml),
/* harmony export */   getAssetLocalPath: () => (/* binding */ getAssetLocalPath)
/* harmony export */ });
/* harmony import */ var _urlRewriter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./urlRewriter */ 8586);
/* harmony import */ var _assetExclusions__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./assetExclusions */ 992);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _assetFilters__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./assetFilters */ 1350);
/* harmony import */ var _assetPatterns__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./assetPatterns */ 9162);
/**
 * Asset Extractor
 *
 * Extracts asset URLs (CSS, JS, fonts, images) from HTML content.
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
  const collected = new Set();
  const processed = new Set();

  // Collect stylesheets
  for (const pattern of _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.STYLESHEET_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const cssUrl = match[2];
      const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(cssUrl, pageUrl);
      if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
        await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }
  }

  // Collect scripts
  _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.SCRIPT_PATTERN.lastIndex = 0;
  const scriptMatches = html.matchAll(_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.SCRIPT_PATTERN);
  for (const match of scriptMatches) {
    const jsUrl = match[2];
    const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(jsUrl, pageUrl);
    if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, 'js')) {
      collected.add(resolvedUrl);
      await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
    }
  }

  // Collect from inline CSS
  _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.INLINE_CSS_PATTERN.lastIndex = 0;
  const inlineCssMatches = html.matchAll(_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.INLINE_CSS_PATTERN);
  for (const match of inlineCssMatches) {
    collectCssInlineDependencies(match[1], pageUrl, siteUrl, collected);
  }

  // Collect from inline JS
  _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.INLINE_JS_PATTERN.lastIndex = 0;
  const inlineJsMatches = html.matchAll(_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.INLINE_JS_PATTERN);
  for (const match of inlineJsMatches) {
    await collectJsInlineDependencies(match[1], pageUrl, siteUrl, collected, processed);
  }

  // Collect from import maps
  _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.IMPORT_MAP_PATTERN.lastIndex = 0;
  const importMapMatches = html.matchAll(_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.IMPORT_MAP_PATTERN);
  for (const match of importMapMatches) {
    await collectImportmapModules(match[1], pageUrl, siteUrl, collected, processed);
  }

  // Collect from HTML attributes
  collectHtmlAttributeAssets(html, pageUrl, siteUrl, collected);
  let assets = Array.from(collected);
  assets = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_2__.applyFilters)('aether.assets.extracted', assets, html, pageUrl, siteUrl);
  return assets;
}

/**
 * Collect assets from HTML attributes.
 *
 * @param {string}      html      HTML content.
 * @param {string}      pageUrl   Page URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 */
function collectHtmlAttributeAssets(html, pageUrl, siteUrl, collected) {
  const siteHost = (0,_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.extractHost)(siteUrl);
  if (siteHost) {
    const escapedHost = (0,_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.escapeRegex)(siteHost);
    const patterns = [new RegExp(`http://${escapedHost}[^"'\`\\s<>]*`, 'gi'), new RegExp(`https://${escapedHost}[^"'\`\\s<>]*`, 'gi'), new RegExp(`//${escapedHost}[^"'\`\\s<>]*`, 'gi')];
    const allMatches = new Set();
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[0];
        if (!url.includes('imagedelivery.net')) {
          // Protocol-relative URLs (third pattern, index 2)
          if (i === 2) {
            try {
              const siteUrlObj = new URL(siteUrl);
              allMatches.add(siteUrlObj.protocol + url);
            } catch {
              allMatches.add('https:' + url);
            }
          } else {
            allMatches.add(url);
          }
        }
      }
    }
    for (const url of allMatches) {
      const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(url, pageUrl);
      if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, 'html')) {
        collected.add(resolvedUrl);
      }
    }
  }

  // Collect from attribute patterns
  for (const pattern of _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.HTML_ATTR_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const url = match[2];
      const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(url, pageUrl);
      if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, 'html')) {
        collected.add(resolvedUrl);
      }
    }
  }

  // Collect from srcset
  for (const [, pattern] of Object.entries(_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.SRCSET_PATTERNS)) {
    pattern.lastIndex = 0;
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const urls = (0,_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.parseSrcset)(match[2]);
      for (const url of urls) {
        const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(url, pageUrl);
        if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, 'html')) {
          collected.add(resolvedUrl);
        }
      }
    }
  }

  // Collect from inline styles
  _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.INLINE_STYLE_PATTERN.lastIndex = 0;
  const inlineStyleMatches = html.matchAll(_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.INLINE_STYLE_PATTERN);
  for (const match of inlineStyleMatches) {
    let inlineCss = match[2];
    inlineCss = inlineCss.replace(/\\(["'])/g, '$1');
    collectCssInlineDependencies(inlineCss, pageUrl, siteUrl, collected, 'html');
  }
}

/**
 * Collect modules from import map.
 *
 * @param {string}      json      Import map JSON.
 * @param {string}      pageUrl   Page URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectImportmapModules(json, pageUrl, siteUrl, collected, processed) {
  try {
    const importmap = JSON.parse(json);
    if (!importmap?.imports) {
      return;
    }
    for (const moduleName in importmap.imports) {
      if (importmap.imports.hasOwnProperty(moduleName)) {
        const moduleUrl = importmap.imports[moduleName];
        const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(moduleUrl, pageUrl);
        if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, 'js')) {
          collected.add(resolvedUrl);
          await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
        }
      }
    }
  } catch {
    // Invalid JSON
  }
}

/**
 * Collect CSS dependencies.
 *
 * @param {string}      cssUrl    CSS URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectCssDependencies(cssUrl, siteUrl, collected, processed) {
  if (processed.has(cssUrl)) {
    return;
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

    // @import statements
    _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.CSS_IMPORT_PATTERN.lastIndex = 0;
    const importMatches = cssContent.matchAll(_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.CSS_IMPORT_PATTERN);
    for (const match of importMatches) {
      const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(match[1], cssUrl);
      if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
        await collectCssDependencies(resolvedUrl, siteUrl, collected, processed);
      }
    }

    // url() references
    _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.CSS_URL_PATTERN.lastIndex = 0;
    const urlMatches = cssContent.matchAll(_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.CSS_URL_PATTERN);
    for (const match of urlMatches) {
      const assetUrl = match[1];
      if (assetUrl.startsWith('data:')) {
        continue;
      }
      const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(assetUrl, cssUrl);
      if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, 'css')) {
        collected.add(resolvedUrl);
      }
    }
  } catch {
    // Failed to fetch
  }
}

/**
 * Collect CSS inline dependencies.
 *
 * @param {string}      cssContent CSS content.
 * @param {string}      baseUrl    Base URL.
 * @param {string}      siteUrl    Site URL.
 * @param {Set<string>} collected  Collected URLs.
 * @param {string}      source     Source type.
 */
function collectCssInlineDependencies(cssContent, baseUrl, siteUrl, collected, source = 'css') {
  _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.CSS_URL_PATTERN.lastIndex = 0;
  const urlMatches = cssContent.matchAll(_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.CSS_URL_PATTERN);
  for (const match of urlMatches) {
    const assetUrl = match[1];
    if (assetUrl.startsWith('data:')) {
      continue;
    }
    const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(assetUrl, baseUrl);
    if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, source)) {
      collected.add(resolvedUrl);
    }
  }
}

/**
 * Collect JS dependencies.
 *
 * @param {string}      jsUrl     JS URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectJsDependencies(jsUrl, siteUrl, collected, processed) {
  if (processed.has(jsUrl)) {
    return;
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

    // Process all import patterns
    for (const [, pattern] of Object.entries(_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.JS_IMPORT_PATTERNS)) {
      pattern.lastIndex = 0;
      const matches = jsContent.matchAll(pattern);
      for (const match of matches) {
        const importUrl = match[1];
        if ((0,_assetExclusions__WEBPACK_IMPORTED_MODULE_1__.isWebpackModuleId)(importUrl)) {
          continue;
        }
        const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(importUrl, jsUrl);
        if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, 'js')) {
          collected.add(resolvedUrl);
          await collectJsDependencies(resolvedUrl, siteUrl, collected, processed);
        }
      }
    }
    await collectJsInlineDependencies(jsContent, jsUrl, siteUrl, collected, processed);
  } catch {
    // Failed to fetch
  }
}

/**
 * Collect JS inline dependencies.
 *
 * @param {string}      jsContent JS content.
 * @param {string}      baseUrl   Base URL.
 * @param {string}      siteUrl   Site URL.
 * @param {Set<string>} collected Collected URLs.
 * @param {Set<string>} processed Processed URLs.
 */
async function collectJsInlineDependencies(jsContent, baseUrl, siteUrl, collected, processed) {
  for (const pattern of _assetPatterns__WEBPACK_IMPORTED_MODULE_4__.JS_ASSET_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = jsContent.matchAll(pattern);
    for (const match of matches) {
      const assetUrl = match[1];
      if (assetUrl.startsWith('data:') || assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
        continue;
      }
      const resolvedUrl = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.resolveRelative)(assetUrl, baseUrl);
      if ((0,_assetFilters__WEBPACK_IMPORTED_MODULE_3__.shouldCollectAsset)(resolvedUrl, siteUrl, 'js')) {
        collected.add(resolvedUrl);
        const type = (0,_assetPatterns__WEBPACK_IMPORTED_MODULE_4__.getAssetType)(resolvedUrl);
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
 * Get asset local path.
 *
 * @param {string} url Asset URL.
 * @return {string|null} Local path or null.
 */
function getAssetLocalPath(url) {
  let path = '';
  try {
    const urlObj = new URL(url);
    path = urlObj.pathname || '';
  } catch {
    const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
    if (pathMatch) {
      path = pathMatch[1];
    }
  }
  path = path.replace(/^\/+/, '');
  path = (0,_urlRewriter__WEBPACK_IMPORTED_MODULE_0__.stripPlaygroundScope)(path);
  if (!path || path === '') {
    return null;
  }
  return path;
}

/***/ }),

/***/ 8249:
/*!*********************************************!*\
  !*** ./node_modules/uuid/dist/stringify.js ***!
  \*********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   unsafeStringify: () => (/* binding */ unsafeStringify)
/* harmony export */ });
/* harmony import */ var _validate_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./validate.js */ 5204);

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
    if (!(0,_validate_js__WEBPACK_IMPORTED_MODULE_0__["default"])(uuid)) {
        throw TypeError('Stringified UUID is invalid');
    }
    return uuid;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (stringify);


/***/ }),

/***/ 8586:
/*!*************************************************!*\
  !*** ./assets/src/publish/utils/urlRewriter.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createUrlRewriter: () => (/* binding */ createUrlRewriter),
/* harmony export */   forceHttps: () => (/* reexport safe */ _urlUtils__WEBPACK_IMPORTED_MODULE_2__.forceHttps),
/* harmony export */   isExternal: () => (/* reexport safe */ _urlUtils__WEBPACK_IMPORTED_MODULE_2__.isExternal),
/* harmony export */   normalize: () => (/* reexport safe */ _urlUtils__WEBPACK_IMPORTED_MODULE_2__.normalize),
/* harmony export */   resolveRelative: () => (/* reexport safe */ _urlUtils__WEBPACK_IMPORTED_MODULE_2__.resolveRelative),
/* harmony export */   stripPlaygroundScope: () => (/* reexport safe */ _urlUtils__WEBPACK_IMPORTED_MODULE_2__.stripPlaygroundScope)
/* harmony export */ });
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/debug */ 1742);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _urlUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./urlUtils */ 8607);
/* harmony import */ var _htmlRewriting__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./htmlRewriting */ 1945);
/**
 * URL Rewriter
 *
 * Rewrites WordPress URLs to static URLs for the static site.
 *
 * @package
 */




// Import URL utilities


// Import HTML rewriting helpers


// Re-export URL utilities for backwards compatibility


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
  const normalizedSiteUrl = (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__.forceHttps)(siteUrl);

  // Treat empty string as null.
  const normalizedStaticUrl = staticUrl && staticUrl.trim() ? staticUrl.trim() : null;

  // Detect if static URL is a public URL vs worker endpoint.
  let isPublicUrl = normalizedStaticUrl && !normalizedStaticUrl.includes('.workers.dev');

  // If the static URL has a pathname component, don't add /static prefix
  if (isPublicUrl && normalizedStaticUrl) {
    try {
      const urlObj = new URL(normalizedStaticUrl);
      if (urlObj.pathname && urlObj.pathname !== '/') {
        isPublicUrl = false;
      }
    } catch {
      // URL parsing failed, leave isPublicUrl as is
    }
  }

  // Build initial URL mapping.
  const mapping = {
    [normalizedSiteUrl]: '/',
    [normalizedSiteUrl + '/']: '/',
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
      return (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__.stripPlaygroundScope)(url);
    }

    // Parse URL.
    let path = '/';
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname || '/';
    } catch {
      const pathMatch = url.match(/^https?:\/\/[^\/]+(\/.*)$/);
      if (pathMatch) {
        path = pathMatch[1];
      } else if (url.includes('?')) {
        const parts = url.split('?');
        path = parts[0];
      }
    }

    // Remove leading/trailing slashes.
    path = path.replace(/^\/+|\/+$/g, '');

    // Strip WordPress Playground scope.
    path = (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__.stripPlaygroundScope)(path);
    if (!path) {
      return '/';
    }

    // Handle WordPress query parameters.
    try {
      const urlObj = new URL(url);
      if (urlObj.search) {
        const params = new URLSearchParams(urlObj.search);
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
    return (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__.normalize)(url, siteUrl);
  }

  /**
   * Check if URL is external.
   *
   * @param {string} url URL to check.
   * @return {boolean} True if external.
   */
  function isExternalUrl(url) {
    return (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__.isExternal)(url, siteUrl);
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

    // Skip special URLs.
    if ((0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__.shouldSkipUrl)(url)) {
      return url;
    }

    // Resolve relative URLs against context.
    let absoluteUrl = url;
    if (contextUrl && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      absoluteUrl = (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__.resolveRelative)(url, contextUrl);
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
      staticPath = convertToStaticPath(absoluteUrl);
    }

    // If using public URL, add /static/ prefix.
    if (isPublicUrl && staticPath && staticPath !== '/' && !staticPath.startsWith('/static/')) {
      staticPath = '/static' + staticPath;
    }

    // Apply static URL base if configured.
    let rewrittenUrl;
    if (normalizedStaticUrl) {
      try {
        const staticUrlObj = new URL(normalizedStaticUrl);
        const basePath = staticUrlObj.pathname.replace(/\/$/, '');
        rewrittenUrl = staticUrlObj.origin + basePath + staticPath;
      } catch {
        rewrittenUrl = normalizedStaticUrl.replace(/\/$/, '') + staticPath;
      }
    } else {
      rewrittenUrl = staticPath;
    }
    return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.url.rewrite', rewrittenUrl, url, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
  }

  /**
   * Rewrite all URLs in HTML content.
   *
   * @param {string} html       HTML content.
   * @param {string} contextUrl Current page URL for relative URL resolution.
   * @return {string} HTML with rewritten URLs.
   */
  function rewriteHtml(html, contextUrl) {
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('[URL Rewriter] rewriteHtml called with:');
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('  - contextUrl:', contextUrl);
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('  - siteUrl:', siteUrl);
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('  - normalizedStaticUrl:', normalizedStaticUrl);
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__.debug)('  - HTML length:', html.length);

    // Protect inline script content
    const {
      html: protectedHtml,
      placeholders
    } = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__.protectScriptContent)(html);
    let result = protectedHtml;

    // Extract site host and rewrite URLs
    const siteHost = (0,_urlUtils__WEBPACK_IMPORTED_MODULE_2__.extractHost)(siteUrl);
    if (siteHost) {
      const matches = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__.collectSiteUrlMatches)(result, siteHost);
      result = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__.replaceSiteUrlMatches)(result, matches, rewriteUrl, contextUrl);
    }

    // Rewrite absolute paths if static URL has subdirectories
    if (normalizedStaticUrl) {
      try {
        const staticUrlObj = new URL(normalizedStaticUrl);
        const basePath = staticUrlObj.pathname.replace(/\/$/, '');
        result = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__.rewriteAbsolutePaths)(result, basePath);
      } catch (error) {
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_0__.debugError)('[URL Rewriter] Error in absolute path rewriting:', error);
      }
    }

    // Rewrite srcset and import map URLs
    result = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__.rewriteSrcsetUrls)(result, rewriteUrl, contextUrl);
    result = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__.rewriteImportMaps)(result, rewriteUrl, contextUrl);

    // Restore inline script content
    result = (0,_htmlRewriting__WEBPACK_IMPORTED_MODULE_3__.restoreScriptContent)(result, placeholders);
    return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.url.rewrite_html', result, contextUrl, normalizedSiteUrl, normalizedStaticUrl);
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

/***/ }),

/***/ 8607:
/*!**********************************************!*\
  !*** ./assets/src/publish/utils/urlUtils.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   escapeRegex: () => (/* binding */ escapeRegex),
/* harmony export */   extractHost: () => (/* binding */ extractHost),
/* harmony export */   forceHttps: () => (/* binding */ forceHttps),
/* harmony export */   isExternal: () => (/* binding */ isExternal),
/* harmony export */   normalize: () => (/* binding */ normalize),
/* harmony export */   resolveRelative: () => (/* binding */ resolveRelative),
/* harmony export */   shouldSkipUrl: () => (/* binding */ shouldSkipUrl),
/* harmony export */   stripPlaygroundScope: () => (/* binding */ stripPlaygroundScope)
/* harmony export */ });
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/**
 * URL Utilities
 *
 * Pure functions for URL parsing, resolution, and normalization.
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
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.url.resolve', resolvedUrl, url, baseUrl);
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
      isExternalUrl = true;
    }
  }
  // If it doesn't start with a scheme or /, treat as external to be safe.
  else {
    isExternalUrl = true;
  }
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.url.is_external', isExternalUrl, url, siteUrl);
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
 *
 * @param {string} path Path that may contain Playground scope.
 * @return {string} Path with scope removed.
 */
function stripPlaygroundScope(path) {
  let result = path.replace(/^\/?scope:[a-z0-9.:-]+\//i, '');
  result = result.replace(/\/scope:[a-z0-9.:-]+\//gi, '/');
  result = result.replace(/^\/?scope:[a-z0-9.:-]+$/i, '');
  return result;
}

/**
 * Normalize a URL for comparison.
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
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.url.normalize', url, siteUrl);
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
 * Extract host from a URL.
 *
 * @param {string} url URL to extract host from.
 * @return {string} Host string or empty string if invalid.
 */
function extractHost(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    const hostMatch = url.match(/^https?:\/\/([^\/]+)/);
    return hostMatch ? hostMatch[1] : '';
  }
}

/**
 * Check if URL should be skipped (anchors, data URLs, CF Images).
 *
 * @param {string} url URL to check.
 * @return {boolean} True if should skip.
 */
function shouldSkipUrl(url) {
  return url.startsWith('#') || url.startsWith('data:') || url.includes('imagedelivery.net');
}

/***/ }),

/***/ 8697:
/*!******************************************************!*\
  !*** ./assets/src/components/SectionHeader/index.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ SectionHeader)
/* harmony export */ });
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);
/**
 * Section Header Component
 *
 * Reusable section header with title and optional description.
 * Provides consistent styling across admin pages.
 *
 * @package
 */



// Styles - extracted to module level for performance

const sectionHeaderStyle = {
  ..._utils_styles__WEBPACK_IMPORTED_MODULE_0__.commonStyles.sectionHeader
};
const headerTitleStyle = {
  margin: 0,
  fontSize: '1.3em',
  lineHeight: 1.4,
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.text
};
const headerDescriptionStyle = {
  margin: '0.5rem 0 0',
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.colors.textMuted,
  fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_0__.fontSize.base
};

/**
 * SectionHeader Component
 *
 * @param {Object}      props             Component props
 * @param {string}      props.title       Section title
 * @param {string}      props.description Optional section description
 * @param {string}      props.className   Optional additional CSS class
 * @param {JSX.Element} props.actions     Optional action buttons/elements to display in header
 * @return {JSX.Element} Rendered section header
 */
function SectionHeader({
  title,
  description = '',
  className = '',
  actions = null
}) {
  const headerClassName = `aether-section-header ${className}`.trim();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
    className: headerClassName,
    style: sectionHeaderStyle,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)("div", {
      className: "aether-section-header__content",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("h2", {
        className: "aether-section-header__title",
        style: headerTitleStyle,
        children: title
      }), description && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("p", {
        className: "aether-section-header__description",
        style: headerDescriptionStyle,
        children: description
      })]
    }), actions && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)("div", {
      className: "aether-section-header__actions",
      children: actions
    })]
  });
}

/***/ }),

/***/ 9143:
/*!*******************************************************!*\
  !*** ./assets/src/publish/utils/fileUploadManager.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   sanitizeKeyForStatus: () => (/* binding */ sanitizeKeyForStatus),
/* harmony export */   uploadFilesWithProgress: () => (/* binding */ uploadFilesWithProgress),
/* harmony export */   uploadSingleFileWithProgress: () => (/* binding */ uploadSingleFileWithProgress)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_concurrencyLimiter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../utils/concurrencyLimiter */ 3712);
/* harmony import */ var _utils_fileHash__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../utils/fileHash */ 1075);
/* harmony import */ var _utils_manifestManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../utils/manifestManager */ 3893);
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils/debug */ 1742);
/* harmony import */ var _utils_helpers__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../utils/helpers */ 9484);
/* harmony import */ var _utils_delay__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../utils/delay */ 3526);
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
  const limiter = (0,_utils_concurrencyLimiter__WEBPACK_IMPORTED_MODULE_2__.createConcurrencyLimiter)(concurrency);
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
      (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.upload.file.before', {
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
            const filteredHash = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.upload.hash.calculate', null, blob, key, manifest);
            fileHash = filteredHash || (await (0,_utils_fileHash__WEBPACK_IMPORTED_MODULE_3__.calculateFileHash)(blob));
            shouldSkip = customShouldSkipUpload ? customShouldSkipUpload(manifest, key, fileSize, fileHash) : (0,_utils_manifestManager__WEBPACK_IMPORTED_MODULE_4__.shouldSkipUpload)(manifest, key, fileSize, fileHash);
          } catch (error) {
            (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Failed to calculate file hash, will upload:', error);
            shouldSkip = false;
          }
        }
      }
      if (shouldSkip) {
        // File unchanged - skip upload
        filesSkipped++;
        totalProcessed++;
        const fileSize = blob.size;
        const sizeStr = (0,_utils_helpers__WEBPACK_IMPORTED_MODULE_6__.formatFileSize)(fileSize);
        if (setStatusMessage) {
          setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$s: File name, %2$s: File size */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Skipped unchanged file %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'success', uploadKey, undefined, {
            fileSize
          });
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
          const filteredHash = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.upload.hash.calculate', null, blob, key, manifest);
          fileHash = filteredHash || (await (0,_utils_fileHash__WEBPACK_IMPORTED_MODULE_3__.calculateFileHash)(blob));
        } catch (error) {
          (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Failed to calculate hash:', error);
          fileHash = null;
        }
      }
      const fileSize = blob.size;
      const sizeStr = (0,_utils_helpers__WEBPACK_IMPORTED_MODULE_6__.formatFileSize)(fileSize);

      // Create status message with unique key for progress tracking
      if (setStatusMessage) {
        setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$s: File name, %2$s: File size */
        (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Uploading %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'progress', uploadKey, {
          percent: 0,
          loaded: 0,
          total: fileSize
        }, {
          fileSize
        });
      }

      // Prepare upload options
      let uploadOptions = {
        contentType,
        cacheControl: metadata.cacheControl || 'public, max-age=31536000, immutable',
        onProgress: (loaded, total, percent) => {
          // Update progress in status message
          if (setStatusMessage) {
            setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$s: File name, %2$s: File size */
            (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Uploading %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'progress', uploadKey, {
              percent,
              loaded,
              total
            }, {
              fileSize
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
      uploadOptions = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.upload.file.options', uploadOptions, key, blob, contentType, metadata);

      // Upload file with retry logic (max 3 attempts with exponential backoff)
      const maxRetries = 3;
      let uploadResult = null;
      let lastError = null;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          uploadResult = await storageService.upload(key, blob, uploadOptions);
          if (uploadResult.success) {
            // Upload succeeded, break out of retry loop
            break;
          }

          // Upload returned failure, prepare for retry
          lastError = uploadResult.error || 'Upload failed';

          // If this isn't the last attempt, retry with backoff
          if (attempt < maxRetries) {
            const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
            if (setStatusMessage) {
              setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$s: File name, %2$s: File size, %3$d: Attempt number, %4$d: Max retries */
              (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Retrying %1$s (%2$s) - attempt %3$d/%4$d', 'aether-site-exporter'), displayName, sizeStr, attempt + 1, maxRetries), 'info', uploadKey, undefined, {
                fileSize
              });
            }
            await (0,_utils_delay__WEBPACK_IMPORTED_MODULE_7__.delay)(delayMs);
          }
        } catch (error) {
          lastError = error.message || error;

          // If this isn't the last attempt, retry with backoff
          if (attempt < maxRetries) {
            const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
            if (setStatusMessage) {
              setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$s: File name, %2$s: File size, %3$d: Attempt number, %4$d: Max retries */
              (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Retrying %1$s (%2$s) - attempt %3$d/%4$d', 'aether-site-exporter'), displayName, sizeStr, attempt + 1, maxRetries), 'info', uploadKey, undefined, {
                fileSize
              });
            }
            await (0,_utils_delay__WEBPACK_IMPORTED_MODULE_7__.delay)(delayMs);
          }
        }
      }
      if (uploadResult && uploadResult.success) {
        filesUploaded++;
        totalProcessed++;

        // Update message to success (remove progress)
        if (setStatusMessage) {
          setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$s: File name, %2$s: File size */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Uploaded %1$s (%2$s)', 'aether-site-exporter'), displayName, sizeStr), 'success', uploadKey, null,
          // Remove progress
          {
            fileSize
          });
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
        (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.upload.file.after', uploadResultData, displayName);
        results.push(uploadResultData);
      } else {
        // Upload failed after all retries
        filesFailed++;
        const errorMessage = lastError || 'Upload failed after ${ maxRetries } attempts';
        if (setStatusMessage) {
          setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$s: File name, %2$d: Number of attempts */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to upload %1$s after %2$d attempts', 'aether-site-exporter'), displayName, maxRetries), 'error', uploadKey, null);
        }
        results.push({
          key,
          success: false,
          skipped: false,
          url: null,
          error: errorMessage
        });
      }
    } catch (error) {
      // Failed to process file
      filesFailed++;
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)(`Failed to upload file: ${key}`, error);
      if (setStatusMessage) {
        setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: File name */
        (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', uploadKey, null);
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
          fileHash = await (0,_utils_fileHash__WEBPACK_IMPORTED_MODULE_3__.calculateFileHash)(blob);
          shouldSkip = customShouldSkipUpload ? customShouldSkipUpload(manifest, key, fileSize, fileHash) : (0,_utils_manifestManager__WEBPACK_IMPORTED_MODULE_4__.shouldSkipUpload)(manifest, key, fileSize, fileHash);
        } catch (error) {
          (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Failed to calculate file hash, will upload:', error);
          shouldSkip = false;
        }
      }
    }
    if (shouldSkip) {
      // File unchanged - skip upload
      if (setStatusMessage) {
        const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$s: File name, %2$s: File size in MB */
        (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('%1$s unchanged (%2$s MB) - skipping upload', 'aether-site-exporter'), displayName, fileSizeMB), 'success', statusKey);
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
        fileHash = await (0,_utils_fileHash__WEBPACK_IMPORTED_MODULE_3__.calculateFileHash)(blob);
      } catch (error) {
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Failed to calculate hash:', error);
        fileHash = null;
      }
    }
    const fileSize = blob.size;

    // Create status message with progress tracking
    if (setStatusMessage) {
      setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: File name */
      (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Uploading %s', 'aether-site-exporter'), displayName), 'progress', statusKey, {
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
          setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: File name */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Uploading %s', 'aether-site-exporter'), displayName), 'progress', statusKey, {
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
        setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: File name */
        (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Uploaded %s', 'aether-site-exporter'), displayName), 'success', statusKey, null // Remove progress
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
      setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: File name */
      (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', statusKey, null);
    }
    return {
      success: false,
      url: null,
      skipped: false,
      error: uploadResult.error || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Upload failed', 'aether-site-exporter'),
      hash: fileHash
    };
  } catch (error) {
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)(`Failed to upload file: ${key}`, error);
    if (setStatusMessage) {
      setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: File name */
      (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to upload %s', 'aether-site-exporter'), displayName), 'error', statusKey, null);
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

/***/ }),

/***/ 9162:
/*!***************************************************!*\
  !*** ./assets/src/publish/utils/assetPatterns.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ASSET_TYPE_MAP: () => (/* binding */ ASSET_TYPE_MAP),
/* harmony export */   CSS_IMPORT_PATTERN: () => (/* binding */ CSS_IMPORT_PATTERN),
/* harmony export */   CSS_URL_PATTERN: () => (/* binding */ CSS_URL_PATTERN),
/* harmony export */   HTML_ATTR_PATTERNS: () => (/* binding */ HTML_ATTR_PATTERNS),
/* harmony export */   IMPORT_MAP_PATTERN: () => (/* binding */ IMPORT_MAP_PATTERN),
/* harmony export */   INLINE_CSS_PATTERN: () => (/* binding */ INLINE_CSS_PATTERN),
/* harmony export */   INLINE_JS_PATTERN: () => (/* binding */ INLINE_JS_PATTERN),
/* harmony export */   INLINE_STYLE_PATTERN: () => (/* binding */ INLINE_STYLE_PATTERN),
/* harmony export */   JS_ASSET_PATTERNS: () => (/* binding */ JS_ASSET_PATTERNS),
/* harmony export */   JS_IMPORT_PATTERNS: () => (/* binding */ JS_IMPORT_PATTERNS),
/* harmony export */   SCRIPT_PATTERN: () => (/* binding */ SCRIPT_PATTERN),
/* harmony export */   SRCSET_PATTERNS: () => (/* binding */ SRCSET_PATTERNS),
/* harmony export */   STYLESHEET_PATTERNS: () => (/* binding */ STYLESHEET_PATTERNS),
/* harmony export */   escapeRegex: () => (/* binding */ escapeRegex),
/* harmony export */   extractHost: () => (/* binding */ extractHost),
/* harmony export */   getAssetType: () => (/* binding */ getAssetType),
/* harmony export */   getExtensionFromUrl: () => (/* binding */ getExtensionFromUrl),
/* harmony export */   parseSrcset: () => (/* binding */ parseSrcset)
/* harmony export */ });
/**
 * Asset Patterns
 *
 * Regex patterns for asset extraction from HTML, CSS, and JS.
 *
 * @package
 */

/**
 * Stylesheet link patterns.
 * Two patterns handle both attribute orders: href-first and rel-first.
 */
const STYLESHEET_PATTERNS = [/<link[^>]+href=(["'])([^"']+)\1[^>]*rel=["']stylesheet["'][^>]*>/gi, /<link[^>]+rel=["']stylesheet["'][^>]*href=(["'])([^"']+)\1[^>]*>/gi];

/**
 * Script src pattern.
 */
const SCRIPT_PATTERN = /<script[^>]+src=(["'])([^"']+)\1[^>]*>/gi;

/**
 * Inline CSS in style tags pattern.
 */
const INLINE_CSS_PATTERN = /<style[^>]*>(.*?)<\/style>/gis;

/**
 * Inline JS in script tags pattern.
 */
const INLINE_JS_PATTERN = /<script[^>]*>(.*?)<\/script>/gis;

/**
 * Import map pattern.
 */
const IMPORT_MAP_PATTERN = /<script[^>]*type=["']importmap["'][^>]*>(.*?)<\/script>/gis;

/**
 * CSS @import pattern.
 */
const CSS_IMPORT_PATTERN = /@import\s+(?:url\()?["']?([^"')]+)["']?\)?/gi;

/**
 * CSS url() pattern.
 */
const CSS_URL_PATTERN = /url\(["']?([^"')]+)["']?\)/gi;

/**
 * JS import patterns.
 */
const JS_IMPORT_PATTERNS = {
  // ES6 import: import ... from 'module'
  es6: /import\s+(?:[^;"']+\s+from\s+)?["']([^"']+)["']/gi,
  // Dynamic import: import('module')
  dynamic: /import\s*\(\s*["']([^"']+)["']\s*\)/gi,
  // CommonJS require: require('module')
  require: /require\s*\(\s*["']([^"']+)["']\s*\)/gi
};

/**
 * JS asset reference patterns.
 */
const JS_ASSET_PATTERNS = [
// new URL() constructor
/new\s+URL\s*\(\s*["']([^"']+\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi,
// String literals with asset extensions
/["']([\.\/][^"']*\.(png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|otf|css|js))["']/gi];

/**
 * HTML attribute patterns for asset extraction.
 */
const HTML_ATTR_PATTERNS = [/<img[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<video[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<video[^>]+poster=(["'])([^"']+)\1[^>]*>?/gi, /<audio[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<source[^>]+src=(["'])([^"']+)\1[^>]*>?/gi, /<link[^>]+(?:rel=["'](?:preload|prefetch)["'][^>]+)?href=(["'])([^"']+)\1[^>]*>?/gi];

/**
 * Srcset patterns.
 */
const SRCSET_PATTERNS = {
  img: /<img[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi,
  source: /<source[^>]+srcset=(["'])([^"']+)\1[^>]*>/gi
};

/**
 * Inline style attribute pattern.
 */
const INLINE_STYLE_PATTERN = /style\s*=\s*(["'])((?:(?!\1)(?:\\.|[^\\]))*)\1/gi;

/**
 * Asset type map by extension.
 */
const ASSET_TYPE_MAP = {
  css: 'css',
  js: 'js',
  woff: 'font',
  woff2: 'font',
  ttf: 'font',
  otf: 'font',
  eot: 'font'
};

/**
 * Get file extension from URL.
 *
 * @param {string} url URL to extract extension from.
 * @return {string} File extension in lowercase, or empty string.
 */
function getExtensionFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot !== -1) {
      return pathname.substring(lastDot + 1).toLowerCase();
    }
  } catch {
    const match = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  return '';
}

/**
 * Get asset type from URL.
 *
 * @param {string} url Asset URL.
 * @return {string} Asset type ('css', 'js', 'font', or 'other').
 */
function getAssetType(url) {
  const extension = getExtensionFromUrl(url);
  return ASSET_TYPE_MAP[extension] || 'other';
}

/**
 * Parse srcset value into array of URLs.
 *
 * @param {string} srcsetValue Srcset attribute value.
 * @return {Array<string>} Array of URLs (without descriptors).
 */
function parseSrcset(srcsetValue) {
  return srcsetValue.split(',').map(part => {
    const trimmed = part.trim();
    const urlMatch = trimmed.match(/^([^\s]+)/);
    return urlMatch ? urlMatch[1] : null;
  }).filter(Boolean);
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
 * Extract host from URL.
 *
 * @param {string} url URL to extract host from.
 * @return {string} Host string or empty string.
 */
function extractHost(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    const hostMatch = url.match(/^https?:\/\/([^\/]+)/);
    return hostMatch ? hostMatch[1] : '';
  }
}

/***/ }),

/***/ 9349:
/*!***********************************************!*\
  !*** ./assets/src/hooks/useSuccessTimeout.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useSuccessTimeout: () => (/* binding */ useSuccessTimeout)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/constants */ 1064);
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
  const timeoutRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  // Cleanup timeout on unmount
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
  const showSuccess = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(callback => {
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
    }, _utils_constants__WEBPACK_IMPORTED_MODULE_1__.SUCCESS_MESSAGE_DURATION_MS);
  }, []);
  const clearSuccess = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
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

/***/ }),

/***/ 9403:
/*!*****************************************************!*\
  !*** ./assets/src/components/StatusNotice/index.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ StatusNotice)
/* harmony export */ });
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);
/**
 * Status Notice Component
 *
 * Reusable notice/alert component for displaying status messages.
 * Wraps WordPress Notice component with consistent styling.
 *
 * @package
 */



/**
 * StatusNotice Component
 *
 * @param {Object}   props               Component props
 * @param {string}   props.status        Notice status (success, error, warning, info)
 * @param {string}   props.message       Message to display
 * @param {boolean}  props.isDismissible Whether notice can be dismissed
 * @param {Function} props.onDismiss     Callback when notice is dismissed
 * @param {string}   props.className     Optional additional CSS class
 * @return {JSX.Element} Rendered notice
 */

function StatusNotice({
  status = 'info',
  message,
  isDismissible = true,
  onDismiss = null,
  className = ''
}) {
  const noticeClassName = `aether-status-notice aether-status-notice--${status} ${className}`.trim();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.Notice, {
    className: noticeClassName,
    status: status,
    isDismissible: isDismissible,
    onRemove: onDismiss,
    children: message
  });
}

/***/ }),

/***/ 9471:
/*!*******************************************************!*\
  !*** ./assets/src/admin-settings/ProviderSettings.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ProviderSettings)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _components_ProviderInstanceCard__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../components/ProviderInstanceCard */ 6457);
/* harmony import */ var _components_ProviderConfigModal__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../components/ProviderConfigModal */ 4495);
/* harmony import */ var _components_AddProviderInstanceModal__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../components/AddProviderInstanceModal */ 9499);
/* harmony import */ var _components_LoadingSpinner__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../components/LoadingSpinner */ 1996);
/* harmony import */ var _components_SectionHeader__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../components/SectionHeader */ 8697);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/api */ 1561);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils/styles */ 2123);
/* harmony import */ var _hooks_useProviderSettings__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../hooks/useProviderSettings */ 6603);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__);
/**
 * Provider Settings Component (Instance-Based)
 *
 * Displays provider types with their instances grouped together.
 * Each provider type section can have multiple named instances.
 *
 * @package
 */













// Styles - extracted to module level for performance

const emptyMessageStyle = {
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_9__.colors.textSecondary
};
const statsContainerStyle = {
  fontSize: '0.875rem',
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_9__.colors.textSecondary,
  marginBottom: _utils_styles__WEBPACK_IMPORTED_MODULE_9__.spacing.lg
};
const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: _utils_styles__WEBPACK_IMPORTED_MODULE_9__.spacing.md
};
const emptyStateStyle = {
  padding: _utils_styles__WEBPACK_IMPORTED_MODULE_9__.spacing.xl,
  textAlign: 'center',
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_9__.colors.textSecondary,
  fontSize: '0.875rem',
  border: `1px dashed ${_utils_styles__WEBPACK_IMPORTED_MODULE_9__.colors.borderLight}`,
  borderRadius: '8px'
};

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
  const [providers, setProviders] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [loading, setLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
  const [selectedInstanceId, setSelectedInstanceId] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [isAddModalOpen, setIsAddModalOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);

  // Local state for optimistic updates
  const [localConfigs, setLocalConfigs] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(providerConfigs);

  // Sync local state when parent prop changes
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    setLocalConfigs(providerConfigs);
  }, [providerConfigs]);
  const configs = localConfigs;

  // Initialize provider settings hook
  const {
    toggleProviderEnabled,
    createProviderInstance,
    deleteProviderInstance,
    renameProviderInstance
  } = (0,_hooks_useProviderSettings__WEBPACK_IMPORTED_MODULE_10__.useProviderSettings)();
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    // Fetch providers from REST API (PHP registry is source of truth)
    const loadProviders = async () => {
      try {
        // Fetch provider metadata from REST API
        const providersResponse = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_8__["default"])({
          path: '/aether/site-exporter/providers'
        });
        if (providersResponse.success && providersResponse.providers) {
          setProviders(providersResponse.providers);
        }

        // Configs are now managed by parent component
        // If parent hasn't loaded them yet, trigger initial load
        if (onConfigsUpdate && Object.keys(configs).length === 0) {
          const configsResponse = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_8__["default"])({
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
  const handleCreateInstanceConfirm = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (instanceId, providerType, instanceName) => {
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
  const handleConfigureInstance = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async instanceId => {
    setSelectedInstanceId(instanceId);
    setIsConfigModalOpen(true);
  }, []);
  const handleToggleInstance = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (instanceId, enabled) => {
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
  const handleDeleteInstance = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async instanceId => {
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
  const handleRenameInstance = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (instanceId, newName) => {
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
  const handleModalSave = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((instanceId, updatedConfig) => {
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
  const handleModalClose = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    setIsConfigModalOpen(false);
    setSelectedInstanceId(null);
  }, []);
  if (loading) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("div", {
      className: "aether-provider-settings aether-provider-settings--loading",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components_LoadingSpinner__WEBPACK_IMPORTED_MODULE_6__["default"], {})
    });
  }
  if (providers.length === 0) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("div", {
      className: "aether-provider-settings aether-provider-settings--empty",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("p", {
        className: "aether-provider-settings__empty-message",
        style: emptyMessageStyle,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('No providers available. Install a provider plugin to enable deployment options.', 'aether-site-exporter')
      })
    });
  }

  // Get selected instance and provider for config modal
  const selectedInstance = selectedInstanceId ? {
    instanceId: selectedInstanceId,
    config: configs[selectedInstanceId] || {}
  } : null;
  const selectedProvider = selectedInstance && selectedInstance.config.provider_type ? providers.find(p => p.id === selectedInstance.config.provider_type) : null;

  // Count total instances
  const totalInstances = Object.keys(configs).length;
  const enabledInstances = Object.values(configs).filter(c => c.enabled !== false).length;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)("div", {
    className: "aether-provider-settings",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components_SectionHeader__WEBPACK_IMPORTED_MODULE_7__["default"], {
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Provider Instances', 'aether-site-exporter'),
      description: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Create and manage multiple instances of each provider type. Each instance can have its own configuration and deployment settings.', 'aether-site-exporter'),
      className: "aether-provider-settings__header",
      actions: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
        className: "aether-provider-settings__add-button",
        variant: "tertiary",
        onClick: () => setIsAddModalOpen(true),
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Add Provider Instance', 'aether-site-exporter')
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)("div", {
      className: "aether-provider-settings__stats",
      style: statsContainerStyle,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)("span", {
        className: "aether-provider-settings__stat",
        children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Total Instances:', 'aether-site-exporter'), ' ', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("strong", {
          className: "aether-provider-settings__stat-value",
          children: totalInstances
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("span", {
        className: "aether-provider-settings__stat-separator",
        children: ' • '
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)("span", {
        className: "aether-provider-settings__stat",
        children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Enabled:', 'aether-site-exporter'), ' ', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("strong", {
          className: "aether-provider-settings__stat-value",
          children: enabledInstances
        })]
      })]
    }), allInstances.length > 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("div", {
      className: "aether-provider-settings__grid",
      style: gridContainerStyle,
      children: allInstances.map(instance => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components_ProviderInstanceCard__WEBPACK_IMPORTED_MODULE_3__["default"], {
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
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("div", {
      className: "aether-provider-settings__empty-state",
      style: emptyStateStyle,
      children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('No provider instances configured. Click "Add Provider Instance" to create one.', 'aether-site-exporter')
    }), selectedProvider && selectedInstance && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components_ProviderConfigModal__WEBPACK_IMPORTED_MODULE_4__["default"], {
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
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_components_AddProviderInstanceModal__WEBPACK_IMPORTED_MODULE_5__["default"], {
      isOpen: isAddModalOpen,
      onClose: () => setIsAddModalOpen(false),
      providers: providers,
      onCreate: handleCreateInstanceConfirm
    })]
  });
}

/***/ }),

/***/ 9484:
/*!*************************************!*\
  !*** ./assets/src/utils/helpers.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   debounce: () => (/* binding */ debounce),
/* harmony export */   deepMerge: () => (/* binding */ deepMerge),
/* harmony export */   filterNullishValues: () => (/* binding */ filterNullishValues),
/* harmony export */   formatFileSize: () => (/* binding */ formatFileSize),
/* harmony export */   isEncryptedValue: () => (/* binding */ isEncryptedValue),
/* harmony export */   parseJSONArray: () => (/* binding */ parseJSONArray),
/* harmony export */   parseJSONObject: () => (/* binding */ parseJSONObject),
/* harmony export */   parseJSONSafely: () => (/* binding */ parseJSONSafely)
/* harmony export */ });
/**
 * General Utility Functions
 *
 * Common helper functions used throughout the application.
 *
 * @package
 */

/**
 * Filter out null and undefined values from an object
 *
 * @param {Object} obj Object to filter
 * @return {Object} New object with null/undefined values removed
 */
function filterNullishValues(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

/**
 * Safely parse JSON with fallback value
 *
 * @param {string}   jsonString JSON string to parse
 * @param {*}        fallback   Fallback value if parsing fails (default: null)
 * @param {Function} validator  Optional validator function to verify parsed value
 * @return {*} Parsed value or fallback
 */
function parseJSONSafely(jsonString, fallback = null, validator = null) {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(jsonString);

    // If validator provided, use it to verify the parsed value
    if (validator && !validator(parsed)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

/**
 * Parse JSON array from localStorage safely
 *
 * @param {string} jsonString JSON string to parse
 * @param {Array}  fallback   Fallback array if parsing fails (default: [])
 * @return {Array} Parsed array or fallback
 */
function parseJSONArray(jsonString, fallback = []) {
  return parseJSONSafely(jsonString, fallback, Array.isArray);
}

/**
 * Parse JSON object from localStorage safely
 *
 * @param {string} jsonString JSON string to parse
 * @param {Object} fallback   Fallback object if parsing fails (default: {})
 * @return {Object} Parsed object or fallback
 */
function parseJSONObject(jsonString, fallback = {}) {
  return parseJSONSafely(jsonString, fallback, val => val && typeof val === 'object' && !Array.isArray(val));
}

/**
 * Check if a value is an encrypted credential
 *
 * @param {*} value Value to check
 * @return {boolean} True if value is encrypted credential string
 */
function isEncryptedValue(value) {
  return typeof value === 'string' && value.startsWith('encrypted:');
}

/**
 * Deep merge two objects
 *
 * @param {Object} target Target object
 * @param {Object} source Source object
 * @return {Object} Merged object
 */
function deepMerge(target, source) {
  const output = {
    ...target
  };
  if (!source || typeof source !== 'object') {
    return output;
  }
  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  });
  return output;
}

/**
 * Debounce a function call
 *
 * @param {Function} func      Function to debounce
 * @param {number}   wait      Milliseconds to wait
 * @param {boolean}  immediate Execute on leading edge instead of trailing
 * @return {Function} Debounced function
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args);
      }
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func(...args);
    }
  };
}

/**
 * Format file size in bytes to human-readable string
 *
 * @param {number} bytes    Number of bytes
 * @param {number} decimals Number of decimal places (default: 1)
 * @return {string} Formatted file size (e.g., "2.5 MB", "123 KB")
 */
function formatFileSize(bytes, decimals = 1) {
  if (!bytes || bytes === 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(decimals)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(decimals)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(decimals)} GB`;
}

/***/ }),

/***/ 9499:
/*!*****************************************************************!*\
  !*** ./assets/src/components/AddProviderInstanceModal/index.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AddProviderInstanceModal)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! uuid */ 4296);
/* harmony import */ var _ModalActions__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../ModalActions */ 3509);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);
/**
 * Add Provider Instance Modal Component
 *
 * Modal for creating a new provider instance.
 * Shows provider type selector and instance name input.
 *
 * @package
 */




// eslint-disable-next-line import/no-unresolved




// Styles - extracted to module level for performance

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing.lg
};

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
  const [selectedProviderType, setSelectedProviderType] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [instanceName, setInstanceName] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [isCreating, setIsCreating] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const handleCreate = async () => {
    if (!selectedProviderType || !instanceName.trim()) {
      return;
    }

    // Generate UUID client-side for instant feedback
    const instanceId = `${selectedProviderType}:${(0,uuid__WEBPACK_IMPORTED_MODULE_3__["default"])()}`;
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
      alert((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Failed to create instance. Please try again.', 'aether-site-exporter'));
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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Modal, {
    className: "aether-add-provider-instance-modal",
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Add Provider Instance', 'aether-site-exporter'),
    onRequestClose: handleClose,
    size: "medium",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
      className: "aether-add-provider-instance-modal__form",
      style: formStyle,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.SelectControl, {
        className: "aether-add-provider-instance-modal__provider-select",
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Provider Type', 'aether-site-exporter'),
        value: selectedProviderType,
        onChange: setSelectedProviderType,
        options: [{
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Select a provider…', 'aether-site-exporter'),
          value: ''
        }, ...providers.map(provider => ({
          label: provider.name,
          value: provider.id
        }))],
        help: selectedProvider ? selectedProvider.description : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Choose which type of provider to create', 'aether-site-exporter')
      }), selectedProviderType && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
        className: "aether-add-provider-instance-modal__instance-name",
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Instance Name', 'aether-site-exporter'),
        value: instanceName,
        onChange: setInstanceName,
        placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.sprintf)(/* translators: %s: provider name */
        (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('e.g., "%s Production"', 'aether-site-exporter'), selectedProvider?.name || 'My'),
        help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Choose a descriptive name for this instance', 'aether-site-exporter')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_ModalActions__WEBPACK_IMPORTED_MODULE_4__["default"], {
        onCancel: handleClose,
        onSubmit: handleCreate,
        cancelLabel: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Cancel', 'aether-site-exporter'),
        submitLabel: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Create Instance', 'aether-site-exporter'),
        isSubmitting: isCreating,
        isSubmitDisabled: !selectedProviderType || !instanceName.trim() || isCreating,
        className: "aether-add-provider-instance-modal__actions"
      })]
    })
  });
}

/***/ }),

/***/ 9516:
/*!*************************************!*\
  !*** ./assets/src/utils/storage.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   storage: () => (/* binding */ storage)
/* harmony export */ });
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

/***/ }),

/***/ 9577:
/*!*************************************************!*\
  !*** ./assets/src/publish/utils/uploadPhase.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   finalizeManifest: () => (/* binding */ finalizeManifest),
/* harmony export */   prepareManifest: () => (/* binding */ prepareManifest),
/* harmony export */   processAssets: () => (/* binding */ processAssets),
/* harmony export */   uploadHtmlFile: () => (/* binding */ uploadHtmlFile)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _htmlProcessor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./htmlProcessor */ 14);
/* harmony import */ var _assetExtractor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./assetExtractor */ 8177);
/* harmony import */ var _fileUploadManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./fileUploadManager */ 9143);
/* harmony import */ var _utils_debug__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils/debug */ 1742);
/* harmony import */ var _utils_fileHash__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../utils/fileHash */ 1075);
/* harmony import */ var _utils_manifestManager__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../utils/manifestManager */ 3893);
/**
 * Upload Phase
 *
 * Phase 2 of static site generation: Upload all files with accurate progress tracking.
 *
 * @package
 */










/**
 * Fetch and prepare manifest for upload phase.
 *
 * @param {Object}   storageService   Storage service instance.
 * @param {string}   providerId       Provider ID.
 * @param {Function} setStatusMessage Status message updater.
 * @return {Promise<Object>} Manifest object.
 */
async function prepareManifest(storageService, providerId, setStatusMessage) {
  let manifest = {};
  try {
    if (setStatusMessage) {
      setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Fetching file manifest…', 'aether-site-exporter'), 'progress', 'fetchManifest');
    }
    manifest = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.manifest.fetch', null, storageService, providerId);
    if (manifest === null) {
      manifest = await (0,_utils_manifestManager__WEBPACK_IMPORTED_MODULE_7__.fetchManifest)(storageService);
    }
    const manifestEntryCount = Object.keys(manifest).length;
    if (setStatusMessage) {
      setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %d: Number of manifest entries */
      (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Fetched file manifest (%d entries)', 'aether-site-exporter'), manifestEntryCount), 'success', 'fetchManifest');
    }
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debug)(`Manifest loaded with ${manifestEntryCount} entries`);
  } catch (error) {
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Failed to fetch manifest, continuing without hash comparison:', error);
    manifest = {};
  }
  return manifest;
}

/**
 * Process and upload assets for a given set of asset URLs.
 *
 * @param {Object}   options                    Upload options.
 * @param {Array}    options.assetUrls          Asset URLs to process.
 * @param {Object}   options.assetTracker       Asset tracker instance.
 * @param {Object}   options.storageService     Storage service instance.
 * @param {Object}   options.manifest           Manifest object.
 * @param {string}   options.providerId         Provider ID.
 * @param {number}   options.filesUploaded      Current files uploaded count.
 * @param {number}   options.totalFilesToUpload Total files to upload.
 * @param {Function} options.onProgress         Progress callback.
 * @param {Function} options.setStatusMessage   Status message updater.
 * @return {Promise<Object>} Updated counts and manifest.
 */
async function processAssets({
  assetUrls,
  assetTracker,
  storageService,
  manifest,
  providerId,
  filesUploaded,
  totalFilesToUpload,
  onProgress,
  setStatusMessage
}) {
  let currentFilesUploaded = filesUploaded;
  let filesSkipped = 0;
  const uploadedFiles = [];
  let currentManifest = manifest;

  // Filter out already processed assets
  const assetsNotInTracker = assetUrls.filter(assetUrl => !assetTracker.isUploaded(assetUrl));
  if (assetsNotInTracker.length === 0) {
    return {
      filesUploaded: currentFilesUploaded,
      filesSkipped,
      uploadedFiles,
      manifest: currentManifest
    };
  }

  // Fetch and prepare asset data
  const assetData = [];
  for (const assetUrl of assetsNotInTracker) {
    try {
      const assetResponse = await fetch(assetUrl, {
        method: 'GET',
        credentials: 'omit',
        headers: {
          'User-Agent': 'Aether Static Site Generator'
        }
      });
      if (assetResponse.status !== 200) {
        continue;
      }
      const assetContent = await assetResponse.blob();
      const contentType = assetResponse.headers.get('content-type') || 'application/octet-stream';
      const assetPath = (0,_assetExtractor__WEBPACK_IMPORTED_MODULE_3__.getAssetLocalPath)(assetUrl);
      if (assetPath === null) {
        (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)(`Skipping invalid asset URL (empty path after scope stripping): ${assetUrl}`);
        assetTracker.markFailed(assetUrl);
        continue;
      }
      const assetKey = assetPath;
      let assetBlob = new Blob([assetContent], {
        type: contentType
      });

      // Filter asset before processing
      const filteredAssetData = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.static.asset.process', {
        blob: assetBlob,
        path: assetPath,
        key: assetKey,
        contentType,
        url: assetUrl
      }, providerId);
      assetBlob = filteredAssetData.blob || assetBlob;
      const finalAssetPath = filteredAssetData.path || assetPath;
      const finalAssetKey = filteredAssetData.key || assetKey;
      const finalContentType = filteredAssetData.contentType || contentType;

      // Check manifest for skip
      const existingEntry = currentManifest[finalAssetKey];
      if (existingEntry && existingEntry.size === assetBlob.size) {
        try {
          const assetHash = await (0,_utils_fileHash__WEBPACK_IMPORTED_MODULE_6__.calculateFileHash)(assetBlob);
          if ((0,_utils_manifestManager__WEBPACK_IMPORTED_MODULE_7__.shouldSkipUpload)(currentManifest, finalAssetKey, assetBlob.size, assetHash)) {
            assetTracker.markUploaded(assetUrl);
            currentFilesUploaded++;
            filesSkipped++;
            uploadedFiles.push({
              storageKey: finalAssetKey,
              relativePath: finalAssetPath,
              contentType: finalContentType
            });
            continue;
          }
        } catch (error) {
          (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Failed to calculate hash for manifest check, will upload:', assetUrl, error);
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
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Failed to fetch asset:', assetUrl, error);
    }
  }

  // Prepare files for upload
  const filesToUpload = assetData.map(data => ({
    key: data.assetKey,
    blob: data.assetBlob,
    contentType: data.contentType,
    displayName: data.assetPath || data.assetKey || 'file',
    metadata: {},
    assetData: data
  }));

  // Upload in parallel
  const uploadResult = await (0,_fileUploadManager__WEBPACK_IMPORTED_MODULE_4__.uploadFilesWithProgress)({
    files: filesToUpload,
    storageService,
    setStatusMessage,
    concurrency: 5,
    onProgress: uploaded => {
      if (onProgress) {
        onProgress(currentFilesUploaded + uploaded, totalFilesToUpload, null);
      }
    },
    keyPrefix: 'upload',
    skipHashCheck: false,
    manifest: currentManifest,
    shouldSkipUpload: _utils_manifestManager__WEBPACK_IMPORTED_MODULE_7__.shouldSkipUpload
  });

  // Process results
  for (const result of uploadResult.results) {
    const fileData = filesToUpload.find(f => f.key === result.key);
    if (!fileData) {
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Could not find fileData for result key:', result.key);
      continue;
    }
    const {
      assetUrl,
      assetPath,
      assetKey,
      contentType
    } = fileData.assetData;
    if (result.success) {
      assetTracker.markUploaded(assetUrl);
      currentFilesUploaded++;
      if (result.skipped) {
        filesSkipped++;
      }
      if (result.hash) {
        currentManifest = (0,_utils_manifestManager__WEBPACK_IMPORTED_MODULE_7__.updateManifestEntry)(currentManifest, assetKey, result.size || fileData.blob.size, result.hash, contentType);
        currentManifest = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.manifest.update', currentManifest, assetKey, providerId);
      }
      uploadedFiles.push({
        storageKey: assetKey,
        relativePath: assetPath,
        contentType
      });
    }
  }
  return {
    filesUploaded: currentFilesUploaded,
    filesSkipped,
    uploadedFiles,
    manifest: currentManifest
  };
}

/**
 * Upload a single HTML file.
 *
 * @param {Object}   options                  Upload options.
 * @param {string}   options.url              Page URL.
 * @param {string}   options.rawHtml          Raw HTML content.
 * @param {string}   options.siteUrl          WordPress site URL.
 * @param {string}   options.staticSiteUrl    Target static site URL.
 * @param {string}   options.providerId       Provider ID.
 * @param {Object}   options.storageService   Storage service instance.
 * @param {Object}   options.manifest         Manifest object.
 * @param {Function} options.setStatusMessage Status message updater.
 * @return {Promise<Object>} Upload result.
 */
async function uploadHtmlFile({
  url,
  rawHtml,
  siteUrl,
  staticSiteUrl,
  providerId,
  storageService,
  manifest,
  setStatusMessage
}) {
  // Filter HTML before processing
  let processedHtml = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.static.html.process', rawHtml, url, siteUrl, staticSiteUrl, providerId);

  // Process HTML with URL rewriting
  processedHtml = (0,_htmlProcessor__WEBPACK_IMPORTED_MODULE_2__.processHtml)(processedHtml, url, siteUrl, staticSiteUrl);
  const htmlPath = (0,_htmlProcessor__WEBPACK_IMPORTED_MODULE_2__.getStaticFilePath)(url);
  const htmlKey = htmlPath;
  const htmlBlob = new Blob([processedHtml], {
    type: 'text/html'
  });
  const htmlSize = htmlBlob.size;
  let htmlHash = null;
  let shouldSkip = false;

  // Check manifest for skip
  const existingEntry = manifest[htmlKey];
  if (existingEntry && existingEntry.size === htmlSize) {
    try {
      htmlHash = await (0,_utils_fileHash__WEBPACK_IMPORTED_MODULE_6__.calculateFileHash)(htmlBlob);
      shouldSkip = (0,_utils_manifestManager__WEBPACK_IMPORTED_MODULE_7__.shouldSkipUpload)(manifest, htmlKey, htmlSize, htmlHash);
    } catch (error) {
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Failed to calculate hash, will upload:', error);
      shouldSkip = false;
    }
  }
  if (shouldSkip) {
    return {
      success: true,
      skipped: true,
      htmlPath,
      htmlKey,
      htmlHash,
      htmlSize
    };
  }

  // Calculate hash if not already calculated
  if (!htmlHash) {
    try {
      htmlHash = await (0,_utils_fileHash__WEBPACK_IMPORTED_MODULE_6__.calculateFileHash)(htmlBlob);
    } catch (error) {
      (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Failed to calculate hash:', error);
      htmlHash = null;
    }
  }

  // Upload status
  if (setStatusMessage) {
    setStatusMessage(`Uploading ${htmlPath}`, 'progress', `upload-${htmlPath}`);
  }
  const htmlUploadResult = await storageService.upload(htmlKey, htmlBlob, {
    contentType: 'text/html'
  });
  if (!htmlUploadResult.success) {
    throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: Error message */
    (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to upload HTML file: %s', 'aether-site-exporter'), htmlUploadResult.error));
  }
  if (setStatusMessage) {
    setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: File path */
    (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Uploaded %s', 'aether-site-exporter'), htmlPath), 'success', `upload-${htmlPath}`);
  }
  return {
    success: true,
    skipped: false,
    htmlPath,
    htmlKey,
    htmlHash,
    htmlSize
  };
}

/**
 * Finalize manifest after upload phase.
 *
 * @param {Object}   storageService   Storage service instance.
 * @param {Object}   manifest         Manifest object.
 * @param {Array}    uploadedFiles    Array of uploaded file info.
 * @param {string}   providerId       Provider ID.
 * @param {Function} setStatusMessage Status message updater.
 * @return {Promise<void>}
 */
async function finalizeManifest(storageService, manifest, uploadedFiles, providerId, setStatusMessage) {
  try {
    if (setStatusMessage) {
      setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Updating file manifest…', 'aether-site-exporter'), 'progress', 'updateManifest');
    }
    const currentFileKeys = new Set(uploadedFiles.map(file => file.storageKey));
    const beforeCleanupCount = Object.keys(manifest).length;
    let cleanedManifest = (0,_utils_manifestManager__WEBPACK_IMPORTED_MODULE_7__.cleanupManifest)(manifest, currentFileKeys);
    cleanedManifest = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)('aether.manifest.cleanup', cleanedManifest, currentFileKeys, providerId);
    const afterCleanupCount = Object.keys(cleanedManifest).length;
    const removedCount = beforeCleanupCount - afterCleanupCount;
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debug)(`Manifest cleanup: ${beforeCleanupCount} entries → ${afterCleanupCount} entries (${removedCount} removed, ${currentFileKeys.size} current files)`);
    await (0,_utils_manifestManager__WEBPACK_IMPORTED_MODULE_7__.uploadManifest)(storageService, cleanedManifest);
    if (setStatusMessage) {
      setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Updated file manifest', 'aether-site-exporter'), 'success', 'updateManifest');
    }
  } catch (error) {
    (0,_utils_debug__WEBPACK_IMPORTED_MODULE_5__.debugWarn)('Failed to upload manifest:', error);
  }
}

/***/ }),

/***/ 9579:
/*!*****************************************************!*\
  !*** ./assets/src/publish/hooks/usePublishState.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   usePublishState: () => (/* binding */ usePublishState)
/* harmony export */ });
/* harmony import */ var _hooks_usePublishContext__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../hooks/usePublishContext */ 1937);
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
  return (0,_hooks_usePublishContext__WEBPACK_IMPORTED_MODULE_0__.usePublishContext)();
}

/***/ }),

/***/ 9708:
/*!*************************************************************!*\
  !*** ./assets/src/components/PublishProgressModal/index.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ PublishProgressModal)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _publish_hooks_usePublishState__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../publish/hooks/usePublishState */ 9579);
/* harmony import */ var _publish_hooks_usePublishController__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../publish/hooks/usePublishController */ 5044);
/* harmony import */ var _utils_styles__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../utils/styles */ 2123);
/* harmony import */ var _ActivityLogMessage__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../ActivityLogMessage */ 3061);
/* harmony import */ var _UploadStatistics__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../UploadStatistics */ 803);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);
/**
 * Publish Progress Modal Component
 *
 * Shows publish progress with progress bar and status messages
 *
 * @package
 */










// Styles - extracted to module level for performance

const modalContentStyle = {
  padding: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing['2xl'],
  display: 'flex',
  flexDirection: 'column',
  gap: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing['2xl']
};
const noticeErrorStyle = {
  ..._utils_styles__WEBPACK_IMPORTED_MODULE_5__.noticeStyles.error,
  padding: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing.md,
  marginBottom: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing.md
};
const noticeSuccessStyle = {
  ..._utils_styles__WEBPACK_IMPORTED_MODULE_5__.noticeStyles.success,
  padding: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing.md,
  marginBottom: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing.md
};
const noticeParagraphStyle = {
  margin: '0 0 0.5rem'
};
const progressContainerStyle = {
  ...(0,_utils_styles__WEBPACK_IMPORTED_MODULE_5__.createFlexStyle)('column', _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing.xl)
};
const progressBarContainerStyle = {
  ...(0,_utils_styles__WEBPACK_IMPORTED_MODULE_5__.createFlexStyle)('row', _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing.lg),
  alignItems: 'center',
  width: '100%'
};
const progressBarStyle = {
  width: '100%',
  height: '20px',
  backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.colors.borderLighter,
  borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.borderRadius.sm,
  overflow: 'hidden',
  position: 'relative'
};
const progressBarFillStyle = {
  height: '100%',
  backgroundColor: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.colors.primary,
  transition: 'width 0.3s ease',
  borderRadius: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.borderRadius.sm
};
const progressPercentageStyle = {
  fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.fontSize.sm,
  fontWeight: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.fontWeight.semibold,
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.colors.text,
  minWidth: '3rem',
  textAlign: 'right',
  flexShrink: 0
};
const activityLogStyle = {
  marginTop: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing.xl,
  overflowY: 'auto',
  fontSize: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.fontSize.xs,
  height: '300px'
};
const activityListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  ...(0,_utils_styles__WEBPACK_IMPORTED_MODULE_5__.createFlexStyle)('column', 0)
};
const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing.xl,
  padding: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.spacing['2xl'],
  textAlign: 'center'
};
const loadingParagraphStyle = {
  margin: 0,
  fontSize: '1.125rem',
  color: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.colors.textMuted
};
function PublishProgressModal({
  isOpen,
  onClose,
  onComplete
}) {
  const publishState = (0,_publish_hooks_usePublishState__WEBPACK_IMPORTED_MODULE_3__.usePublishState)();
  const {
    startPublish
  } = (0,_publish_hooks_usePublishController__WEBPACK_IMPORTED_MODULE_4__.usePublishController)(publishState);
  const {
    steps,
    isPublishing,
    jobId,
    finalStatus,
    error,
    reset,
    overallProgress,
    messageHistory,
    staticSiteProviders,
    blueprintBundleProviders
  } = publishState;

  // Ref for activity log auto-scroll
  const activityLogRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  // Keep modal open if finalStatus is set, even if isOpen becomes false
  // This allows the auto-close effect to run and show the success message
  const shouldShowModal = isOpen || finalStatus;

  // Wrapper for onClose that resets state before closing
  // Only allow closing when job is finished (has finalStatus or error)
  const handleClose = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    // Prevent closing while job is in progress
    if (isPublishing && !finalStatus && !error) {
      return;
    }
    reset();
    if (onClose) {
      onClose();
    }
  }, [reset, onClose, isPublishing, finalStatus, error]);

  // Reset state when modal closes (only when shouldShowModal becomes false)
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!shouldShowModal) {
      reset();
    }
  }, [shouldShowModal, reset]);

  // Start publish when modal opens
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (isOpen && !isPublishing) {
      // Only start if we haven't started yet (no steps initialized and no job ID)
      if (steps.length === 0 && !jobId) {
        startPublish();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen to avoid re-triggering

  // Handle completion
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (finalStatus && onComplete) {
      // Call onComplete callback to refresh data
      // Note: Modal no longer auto-closes, user must manually close
      onComplete(finalStatus);
    }
  }, [finalStatus, onComplete]);

  // Auto-scroll activity log to top when new messages arrive
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (activityLogRef.current) {
      activityLogRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [messageHistory.length]);

  // Calculate overall progress from steps if not explicitly set
  const displayProgress = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
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
  const sortedMessageHistory = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
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
      return (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Publish Failed', 'aether-site-exporter');
    }
    if (finalStatus) {
      return (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Site Published Successfully!', 'aether-site-exporter');
    }
    return (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Publishing Site', 'aether-site-exporter');
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Modal, {
    className: "aether-publish-progress-modal",
    title: getModalTitle(),
    onRequestClose: handleClose,
    isFullScreen: false,
    shouldCloseOnClickOutside: false,
    shouldCloseOnEsc: false,
    __experimentalHideHeader: false,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
      className: "aether-publish-progress-modal__content",
      style: modalContentStyle,
      children: [error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("div", {
        className: "aether-publish-progress-modal__notice aether-publish-progress-modal__notice--error",
        style: noticeErrorStyle,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("p", {
          className: "aether-publish-progress-modal__notice-text",
          style: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.utilityStyles.noMargin,
          children: error
        })
      }), finalStatus && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
        className: "aether-publish-progress-modal__notice aether-publish-progress-modal__notice--success",
        style: noticeSuccessStyle,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("p", {
          className: "aether-publish-progress-modal__notice-text",
          style: noticeParagraphStyle,
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Your site has been published successfully!', 'aether')
        }), finalStatus.deploymentUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("p", {
          className: "aether-publish-progress-modal__deployment",
          style: _utils_styles__WEBPACK_IMPORTED_MODULE_5__.utilityStyles.noMargin,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("strong", {
            className: "aether-publish-progress-modal__deployment-label",
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('View your published site:', 'aether')
          }), ' ', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("a", {
            className: "aether-publish-progress-modal__deployment-link",
            href: finalStatus.deploymentUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            children: finalStatus.deploymentUrl
          })]
        })]
      }), !finalStatus && !error && steps.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("div", {
        className: "aether-publish-progress-modal__progress",
        style: progressContainerStyle,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
          className: "aether-publish-progress-modal__progress-container",
          style: progressBarContainerStyle,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("div", {
            className: "aether-publish-progress-modal__progress-bar",
            style: progressBarStyle,
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("div", {
              className: "aether-publish-progress-modal__progress-fill",
              style: {
                ...progressBarFillStyle,
                width: `${displayProgress}%`
              }
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("span", {
            className: "aether-publish-progress-modal__progress-percentage",
            style: progressPercentageStyle,
            children: [displayProgress, "%"]
          })]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_UploadStatistics__WEBPACK_IMPORTED_MODULE_7__["default"], {
        messageHistory: messageHistory,
        staticSiteProviders: staticSiteProviders,
        blueprintBundleProviders: blueprintBundleProviders
      }), messageHistory.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("div", {
        className: "aether-publish-progress-modal__activity-log",
        style: activityLogStyle,
        ref: activityLogRef,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("ul", {
          className: "aether-publish-progress-modal__activity-list",
          style: activityListStyle,
          children: sortedMessageHistory.map(item => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_ActivityLogMessage__WEBPACK_IMPORTED_MODULE_6__["default"], {
            message: item.message,
            type: item.type,
            progress: item.progress
          }, item.id))
        })
      }), steps.length === 0 && !error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
        className: "aether-publish-progress-modal__loading",
        style: loadingStyle,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Spinner, {
          className: "aether-publish-progress-modal__spinner"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("p", {
          className: "aether-publish-progress-modal__loading-text",
          style: loadingParagraphStyle,
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Initializing publish process…', 'aether-site-exporter')
        })]
      })]
    })
  });
}

/***/ }),

/***/ 9711:
/*!*************************************************************************!*\
  !*** ./assets/src/publish/steps/discoverBlueprintBundleAssets/index.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   discoverBlueprintBundleAssetsStep: () => (/* binding */ discoverBlueprintBundleAssetsStep)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/**
 * Discover Blueprint Bundle Assets Step
 *
 * Discovers custom plugins and themes that are not from WordPress.org.
 * These assets need to be included in the blueprint bundle.
 *
 * @package
 */



/**
 * Discover blueprint bundle assets step handler.
 *
 * @param {Object}   context                  Execution context.
 * @param {Object}   context.api              PublishAPI instance.
 * @param {Function} context.setStatusMessage Status message updater.
 * @return {Promise<Object>} Step result with discovered assets.
 */
async function handler(context) {
  const {
    api,
    setStatusMessage
  } = context;
  setStatusMessage((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Discovering plugins and themes…', 'aether-site-exporter'), 'progress', 'discoverBlueprintBundleAssets');

  // Call client-side asset discovery
  const discoveryResponse = await api.discoverBlueprintBundleAssets();
  if (!discoveryResponse.success) {
    throw new Error(discoveryResponse.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Failed to discover assets', 'aether-site-exporter'));
  }
  const assets = discoveryResponse.assets || [];
  const plugins = assets.filter(a => a.type === 'plugin');
  const themes = assets.filter(a => a.type === 'theme');

  // Build success message
  let message;
  if (assets.length === 0) {
    message = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Discovered 0 active custom plugins/themes', 'aether-site-exporter');
  } else {
    const parts = [];
    if (plugins.length > 0) {
      const pluginText = plugins.length === 1 ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: Plugin slug */
      (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('1 active custom plugin (%s)', 'aether-site-exporter'), plugins[0].slug) : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$d: Number of plugins, %2$s: Comma-separated plugin slugs */
      (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__._n)('%1$d active custom plugin (%2$s)', '%1$d active custom plugins (%2$s)', plugins.length, 'aether-site-exporter'), plugins.length, plugins.map(p => p.slug).join(', '));
      parts.push(pluginText);
    }
    if (themes.length > 0) {
      const themeText = themes.length === 1 ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: Theme slug */
      (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('1 active custom theme (%s)', 'aether-site-exporter'), themes[0].slug) : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %1$d: Number of themes, %2$s: Comma-separated theme slugs */
      (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__._n)('%1$d active custom theme (%2$s)', '%1$d active custom themes (%2$s)', themes.length, 'aether-site-exporter'), themes.length, themes.map(t => t.slug).join(', '));
      parts.push(themeText);
    }
    message = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: %s: Discovered assets description */
    (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Discovered %s. These will be included in the blueprint bundle.', 'aether-site-exporter'), parts.join((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)(' and ', 'aether-site-exporter')));
  }
  setStatusMessage(message, 'success', 'discoverBlueprintBundleAssets');

  // Return data to merge into execution state
  return {
    discoveredAssets: assets
  };
}

/**
 * Discover Blueprint Bundle Assets step definition.
 */
const discoverBlueprintBundleAssetsStep = {
  id: 'discoverBlueprintBundleAssets',
  label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Discover Assets', 'aether-site-exporter'),
  description: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Find custom plugins and themes for blueprint bundle', 'aether-site-exporter'),
  supportsProgress: false,
  dependencies: [],
  provides: ['discoveredAssets'],
  handler
};

/***/ }),

/***/ 9768:
/*!******************************************************!*\
  !*** ./assets/src/components/ProviderField/index.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ProviderField)
/* harmony export */ });
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/components */ 6427);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _SecretField__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../SecretField */ 159);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_SecretField__WEBPACK_IMPORTED_MODULE_1__["default"], {
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.CheckboxControl, {
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: [label && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "aether-provider-field__label components-base-control__label",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("strong", {
          className: "aether-provider-field__label-text",
          children: label
        }), required && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
          className: "aether-provider-field__label-required components-base-control__label__required",
          children: "*"
        })]
      }), help && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
        className: "aether-provider-field__help components-base-control__help",
        children: help
      }), error && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
        className: "aether-provider-field__error aether-provider-field__error--message components-base-control__help components-base-control__help--error",
        children: error
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
        className: "aether-provider-field__checkbox-group aether-checkbox-group",
        children: options.map(option => {
          const optionValue = option.value;
          const optionLabel = option.label || option.value;
          const isSelected = currentValue.includes(optionValue);
          return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.CheckboxControl, {
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.SelectControl, {
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.TextareaControl, {
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.TextControl, {
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.TextControl, {
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
      style: fieldWrapperStyle,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.TextControl, {
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
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
    className: `aether-provider-field aether-provider-field--${type} ${error ? 'aether-provider-field--error' : ''}`,
    style: fieldWrapperStyle,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_0__.TextControl, {
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

/***/ }),

/***/ 9792:
/*!***********************************************************!*\
  !*** ./assets/src/publish/utils/blueprintStepBuilders.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildAetherActivationStep: () => (/* binding */ buildAetherActivationStep),
/* harmony export */   buildAetherInstallStep: () => (/* binding */ buildAetherInstallStep),
/* harmony export */   buildBlueprintJson: () => (/* binding */ buildBlueprintJson),
/* harmony export */   buildBlueprintSteps: () => (/* binding */ buildBlueprintSteps),
/* harmony export */   buildDefineConstsStep: () => (/* binding */ buildDefineConstsStep),
/* harmony export */   buildImportFilesStep: () => (/* binding */ buildImportFilesStep),
/* harmony export */   buildPluginInstallSteps: () => (/* binding */ buildPluginInstallSteps),
/* harmony export */   buildThemeInstallSteps: () => (/* binding */ buildThemeInstallSteps)
/* harmony export */ });
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
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
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.blueprint.steps', steps, config);
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
  return (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('aether.blueprint.json', blueprint, steps);
}

/***/ }),

/***/ 9818:
/*!*****************************************************!*\
  !*** ./assets/src/publish/executor/StepExecutor.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   executeSteps: () => (/* binding */ executeSteps),
/* harmony export */   getExecutionPlan: () => (/* binding */ getExecutionPlan)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ 7723);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/hooks */ 2619);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _DependencyResolver__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DependencyResolver */ 4958);
/**
 * Step Executor
 *
 * Executes publish workflow steps with automatic dependency resolution
 * and parallel execution support.
 *
 * @package
 */





/**
 * Execute a workflow with the given steps.
 *
 * @param {Array<Object>} steps   Array of step definitions to execute.
 * @param {Object}        context Initial context with dependencies and state.
 * @param {Object}        options Execution options.
 * @return {Promise<Object>} Final execution state.
 */
async function executeSteps(steps, context, options = {}) {
  const {
    onStepStart = () => {},
    onStepComplete = () => {},
    onStepSkipped = () => {},
    onError = () => {}
  } = options;

  // Validate dependencies
  const errors = (0,_DependencyResolver__WEBPACK_IMPORTED_MODULE_2__.validateDependencies)(steps);
  if (errors.length > 0) {
    throw new Error(`Invalid step dependencies: ${errors.join('; ')}`);
  }

  // Build execution plan with parallel groups
  const executionPlan = (0,_DependencyResolver__WEBPACK_IMPORTED_MODULE_2__.buildParallelPlan)(steps);

  // Create execution context
  const executionContext = {
    ...context,
    completedSteps: [],
    skippedSteps: [],
    state: {}
  };

  // Fire workflow start action
  (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.publish.workflow.before', executionContext, steps);
  try {
    for (const parallelGroup of executionPlan) {
      // Determine which steps to run vs skip
      const stepsToRun = [];
      const stepsToSkip = [];
      for (const stepId of parallelGroup) {
        const step = steps.find(s => s.id === stepId);
        const shouldSkip = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)(`aether.publish.step.${stepId}.skip`, step.skip ? step.skip(executionContext) : false, executionContext);
        if (shouldSkip) {
          stepsToSkip.push(stepId);
        } else {
          stepsToRun.push(stepId);
        }
      }

      // Mark skipped steps
      for (const stepId of stepsToSkip) {
        executionContext.skippedSteps.push(stepId);
        onStepSkipped(stepId);
        (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)(`aether.publish.step.${stepId}.skipped`, executionContext);
      }
      if (stepsToRun.length === 0) {
        continue;
      }

      // Execute steps in parallel
      const results = await Promise.all(stepsToRun.map(stepId => executeStep(stepId, steps, executionContext, {
        onStepStart,
        onStepComplete,
        onError
      })));

      // Merge results into state
      for (const result of results) {
        if (result) {
          Object.assign(executionContext.state, result);
        }
      }

      // Mark as completed
      executionContext.completedSteps.push(...stepsToRun);
    }

    // Fire workflow complete action
    (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.publish.workflow.after', executionContext.state, executionContext);
    return executionContext.state;
  } catch (error) {
    (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)('aether.publish.workflow.error', error, executionContext);
    throw error;
  }
}

/**
 * Execute a single step.
 *
 * @param {string}        stepId           Step ID to execute.
 * @param {Array<Object>} allSteps         All step definitions.
 * @param {Object}        executionContext Current execution context.
 * @param {Object}        options          Execution options.
 * @return {Promise<Object>} Step result data.
 */
async function executeStep(stepId, allSteps, executionContext, options) {
  const step = allSteps.find(s => s.id === stepId);
  const {
    onStepStart,
    onStepComplete,
    onError
  } = options;

  // Fire before hook
  (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)(`aether.publish.step.${stepId}.before`, executionContext);
  onStepStart(stepId, step);
  try {
    // Build context for this step (merge state into context)
    const stepContext = {
      ...executionContext,
      ...executionContext.state
    };

    // Execute handler
    const result = await step.handler(stepContext);

    // Apply result filter
    const filteredResult = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.applyFilters)(`aether.publish.step.${stepId}.result`, result || {}, executionContext);
    onStepComplete(stepId, filteredResult);

    // Fire after hook
    (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)(`aether.publish.step.${stepId}.after`, filteredResult, executionContext);
    return filteredResult;
  } catch (error) {
    onError(stepId, error);
    (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_1__.doAction)(`aether.publish.step.${stepId}.error`, error, executionContext);
    throw new Error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.sprintf)(/* translators: 1: Step ID, 2: Error message */
    (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Step "%1$s" failed: %2$s', 'aether-site-exporter'), stepId, error.message));
  }
}

/**
 * Get the parallel execution plan for steps.
 *
 * @param {Array<Object>} steps Array of step definitions.
 * @return {Array<Array<string>>} Execution plan with parallel groups.
 */
function getExecutionPlan(steps) {
  return (0,_DependencyResolver__WEBPACK_IMPORTED_MODULE_2__.buildParallelPlan)(steps);
}

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
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "";
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!********************************************!*\
  !*** ./assets/src/admin-settings/index.js ***!
  \********************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ 6087);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _AdminSettings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./AdminSettings */ 2093);
/* harmony import */ var _components_ErrorBoundary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/ErrorBoundary */ 6543);
/* harmony import */ var _contexts_PublishContext__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../contexts/PublishContext */ 4140);
/* harmony import */ var _utils_errorHandler__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/errorHandler */ 5287);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ 790);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);
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

(0,_utils_errorHandler__WEBPACK_IMPORTED_MODULE_4__.initializeErrorHandlers)();

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
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.render)(/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_components_ErrorBoundary__WEBPACK_IMPORTED_MODULE_2__["default"], {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_contexts_PublishContext__WEBPACK_IMPORTED_MODULE_3__.PublishProvider, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_AdminSettings__WEBPACK_IMPORTED_MODULE_1__["default"], {})
    })
  }), container);
};
init();
})();

/******/ })()
;
