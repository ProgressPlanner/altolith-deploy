/******/ (() => { // webpackBootstrap
/**
 * Admin Bar Export Handler
 *
 * Lightweight vanilla JavaScript handler for admin bar export button.
 * Dynamically loads the full export modal bundle when clicked.
 *
 * Pure vanilla JS - no dependencies, minimal size.
 *
 */

(function () {
  'use strict';

  // Get plugin URL from window.aetherData (injected by PHP).
  const pluginUrl = window.aetherData && window.aetherData.pluginUrl || '';
  if (!pluginUrl) {
    return; // Exit if no plugin URL.
  }

  /**
   * Handle admin bar click event.
   */
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-aether-export="true"], #wp-admin-bar-aether-export');
    if (trigger) {
      e.preventDefault();
      loadExportModal();
    }
  });

  /**
   * Load export modal bundle dynamically.
   */
  function loadExportModal() {
    // Prevent duplicate loading.
    if (window.aetherExportLoading || window.aetherExportLoaded) {
      return;
    }
    window.aetherExportLoading = true;

    // Show simple loading overlay (vanilla JS).
    showLoadingOverlay();

    // First, ensure WordPress scripts and styles are loaded.
    loadRequiredDependencies(function () {
      // Once dependencies are loaded, load export-modal.js bundle.
      const script = document.createElement('script');
      const scriptUrl = pluginUrl.endsWith('/') ? pluginUrl + 'assets/build/export-modal.js' : pluginUrl + '/assets/build/export-modal.js';
      script.src = scriptUrl;
      script.onload = function () {
        window.aetherExportLoading = false;
        window.aetherExportLoaded = true;
        hideLoadingOverlay();
      };
      script.onerror = function () {
        window.aetherExportLoading = false;
        hideLoadingOverlay();
        alert('Failed to load export modal. Please refresh the page.');
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Load required WordPress scripts and styles before loading modal.
   * Fetches dependencies list from REST API, checks which are loaded, loads missing ones.
   * @param callback
   */
  function loadRequiredDependencies(callback) {
    const restUrl = window.aetherData && window.aetherData.restUrl || '';
    const namespace = window.aetherData && window.aetherData.restNamespace || 'aether/site-exporter/';
    const nonce = window.aetherData && window.aetherData.nonce || '';
    if (!restUrl) {
      // No REST URL available, try to load modal anyway.
      callback();
      return;
    }

    // Fetch dependencies (scripts and styles) from REST API with authentication.
    const headers = {
      'Content-Type': 'application/json'
    };
    if (nonce) {
      headers['X-WP-Nonce'] = nonce;
    }
    fetch(restUrl + namespace + 'admin-bar-dependencies', {
      method: 'GET',
      credentials: 'same-origin',
      headers
    }).then(function (response) {
      if (!response.ok) {
        throw new Error('Failed to fetch dependencies');
      }
      return response.json();
    }).then(function (data) {
      if (!data.success) {
        throw new Error('Invalid dependencies response');
      }
      const scripts = data.scripts || [];
      const styles = data.styles || [];

      // Filter out scripts that are already loaded.
      const missingScripts = scripts.filter(function (script) {
        return !document.getElementById(script.id);
      });

      // Filter out styles that are already loaded.
      const missingStyles = styles.filter(function (style) {
        return !document.getElementById(style.id);
      });

      // If nothing is missing, call callback immediately.
      if (missingScripts.length === 0 && missingStyles.length === 0) {
        callback();
        return;
      }

      // Track completion of both loading operations.
      let scriptsDone = false;
      let stylesDone = false;
      function checkComplete() {
        if (scriptsDone && stylesDone) {
          callback();
        }
      }

      // Load scripts.
      if (missingScripts.length === 0) {
        scriptsDone = true;
        checkComplete();
      } else {
        // Sort scripts by dependencies (topological sort).
        const sortedScripts = sortByDependencies(missingScripts, scripts, '-js');

        // Load sorted scripts sequentially.
        loadScriptsSequentially(sortedScripts, 0, function () {
          scriptsDone = true;
          checkComplete();
        });
      }

      // Load styles (can load in parallel with scripts).
      if (missingStyles.length === 0) {
        stylesDone = true;
        checkComplete();
      } else {
        // Sort styles by dependencies (topological sort).
        const sortedStyles = sortByDependencies(missingStyles, styles, '-css');

        // Load sorted styles sequentially.
        loadStylesSequentially(sortedStyles, 0, function () {
          stylesDone = true;
          checkComplete();
        });
      }
    }).catch(function (error) {
      // On error, try to load modal anyway (dependencies might already be there).
      console.error('Failed to load WordPress dependencies:', error);
      callback();
    });
  }

  /**
   * Sort assets (scripts or styles) by dependencies (simple topological sort).
   * Ensures dependencies are loaded before dependent assets.
   *
   * @param {Array}  missingAssets Assets that need to be loaded.
   * @param {Array}  allAssets     All available assets.
   * @param {string} suffix        Suffix for ID format ('-js' or '-css').
   * @return {Array} Sorted assets array.
   */
  function sortByDependencies(missingAssets, allAssets, suffix) {
    // Create a map for quick lookup.
    const assetMap = {};
    allAssets.forEach(function (asset) {
      assetMap[asset.handle] = asset;
    });
    const sorted = [];
    const visited = {};
    const loading = {};
    function visit(handle) {
      if (loading[handle]) {
        // Circular dependency - skip.
        return;
      }
      if (visited[handle]) {
        return;
      }
      loading[handle] = true;

      // Visit dependencies first.
      const asset = assetMap[handle];
      if (asset && asset.dependencies) {
        asset.dependencies.forEach(function (dep) {
          // Check if dependency is already loaded or in missing assets.
          const isAlreadyLoaded = !!document.getElementById(dep + suffix);
          const isMissing = missingAssets.some(function (a) {
            return a.handle === dep;
          });
          // If it's missing and not already loaded, visit it first.
          if (isMissing && !isAlreadyLoaded) {
            visit(dep);
          }
        });
      }
      loading[handle] = false;
      visited[handle] = true;

      // Add to sorted list.
      const assetToAdd = missingAssets.find(function (a) {
        return a.handle === handle;
      });
      if (assetToAdd) {
        sorted.push(assetToAdd);
      }
    }

    // Visit all missing assets.
    missingAssets.forEach(function (asset) {
      visit(asset.handle);
    });
    return sorted;
  }

  /**
   * Load scripts sequentially (simple recursive function).
   * @param scripts
   * @param index
   * @param callback
   */
  function loadScriptsSequentially(scripts, index, callback) {
    if (index >= scripts.length) {
      // All scripts loaded.
      callback();
      return;
    }
    const scriptData = scripts[index];
    const script = document.createElement('script');
    script.id = scriptData.id;
    script.src = scriptData.src;
    script.onload = function () {
      // Load next script.
      loadScriptsSequentially(scripts, index + 1, callback);
    };
    script.onerror = function () {
      // Continue even if one script fails (others might succeed).
      loadScriptsSequentially(scripts, index + 1, callback);
    };
    document.head.appendChild(script);
  }

  /**
   * Load styles sequentially (simple recursive function).
   * @param styles
   * @param index
   * @param callback
   */
  function loadStylesSequentially(styles, index, callback) {
    if (index >= styles.length) {
      // All styles loaded.
      callback();
      return;
    }
    const styleData = styles[index];
    const link = document.createElement('link');
    link.id = styleData.id;
    link.rel = 'stylesheet';
    link.href = styleData.src;
    link.onload = function () {
      // Load next style.
      loadStylesSequentially(styles, index + 1, callback);
    };
    link.onerror = function () {
      // Continue even if one style fails (others might succeed).
      loadStylesSequentially(styles, index + 1, callback);
    };
    document.head.appendChild(link);
  }

  /**
   * Show loading overlay.
   */
  function showLoadingOverlay() {
    // Check if overlay already exists.
    if (document.getElementById('aether-export-loading')) {
      return;
    }

    // Create minimal loading overlay with vanilla DOM.
    const overlay = document.createElement('div');
    overlay.id = 'aether-export-loading';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:999999;display:flex;align-items:center;justify-content:center;';
    const spinner = document.createElement('div');
    spinner.style.cssText = 'color:#fff;font-size:18px;';
    spinner.textContent = 'Loading...';
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);
  }

  /**
   * Hide loading overlay.
   */
  function hideLoadingOverlay() {
    const overlay = document.getElementById('aether-export-loading');
    if (overlay) {
      overlay.remove();
    }
  }
})();
/******/ })()
;