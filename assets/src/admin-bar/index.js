/**
 * Admin Bar Export Handler
 *
 * Lightweight vanilla JavaScript handler for admin bar export button.
 * Dynamically loads the full export modal bundle when clicked.
 *
 * Pure vanilla JS - no dependencies, minimal size.
 *
 * @package
 */

(function() {
	'use strict';

	// Get plugin URL from window.aetherData (injected by PHP).
	const pluginUrl = (window.aetherData && window.aetherData.pluginUrl) || '';
	if (!pluginUrl) {
		return; // Exit if no plugin URL.
	}

	/**
	 * Handle admin bar click event.
	 */
	document.addEventListener('click', function(e) {
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

		// Dynamically load export-modal.js bundle.
		const script = document.createElement('script');
		const scriptUrl = pluginUrl.endsWith('/')
			? pluginUrl + 'assets/build/export-modal.js'
			: pluginUrl + '/assets/build/export-modal.js';
		script.src = scriptUrl;
		script.onload = function() {
			window.aetherExportLoading = false;
			window.aetherExportLoaded = true;
			hideLoadingOverlay();
		};
		script.onerror = function() {
			window.aetherExportLoading = false;
			hideLoadingOverlay();
			alert('Failed to load export modal. Please refresh the page.');
		};
		document.head.appendChild(script);
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

