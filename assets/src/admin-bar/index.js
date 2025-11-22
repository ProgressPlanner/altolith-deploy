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

		// First, ensure WordPress scripts are loaded.
		loadRequiredScripts(function() {
			// Once scripts are loaded, load export-modal.js bundle.
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
		});
	}

	/**
	 * Load required WordPress scripts before loading modal.
	 * Fetches script list from REST API, checks which are loaded, loads missing ones.
	 */
	function loadRequiredScripts(callback) {
		const restUrl = (window.aetherData && window.aetherData.restUrl) || '';
		const namespace = (window.aetherData && window.aetherData.restNamespace) || 'aether/site-exporter/';
		const nonce = (window.aetherData && window.aetherData.nonce) || '';
		if (!restUrl) {
			// No REST URL available, try to load modal anyway.
			callback();
			return;
		}

		// Fetch scripts list from REST API with authentication.
		const headers = {
			'Content-Type': 'application/json',
		};
		if (nonce) {
			headers['X-WP-Nonce'] = nonce;
		}

		fetch(restUrl + namespace + 'scripts', {
			method: 'GET',
			credentials: 'same-origin',
			headers: headers,
		})
			.then(function(response) {
				if (!response.ok) {
					throw new Error('Failed to fetch scripts');
				}
				return response.json();
			})
			.then(function(data) {
				if (!data.success || !data.scripts) {
					throw new Error('Invalid scripts response');
				}

				// Filter out scripts that are already loaded.
				const missingScripts = data.scripts.filter(function(script) {
					return !document.getElementById(script.id);
				});

				if (missingScripts.length === 0) {
					// All scripts already loaded.
					callback();
					return;
				}

				// Sort scripts by dependencies (topological sort).
				const sortedScripts = sortScriptsByDependencies(missingScripts, data.scripts);

				// Load sorted scripts sequentially.
				loadScriptsSequentially(sortedScripts, 0, callback);
			})
			.catch(function(error) {
				// On error, try to load modal anyway (scripts might already be there).
				console.error('Failed to load WordPress scripts:', error);
				callback();
			});
	}

	/**
	 * Sort scripts by dependencies (simple topological sort).
	 * Ensures dependencies are loaded before dependent scripts.
	 */
	function sortScriptsByDependencies(missingScripts, allScripts) {
		// Create a map for quick lookup.
		const scriptMap = {};
		allScripts.forEach(function(script) {
			scriptMap[script.handle] = script;
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
			const script = scriptMap[handle];
			if (script && script.dependencies) {
				script.dependencies.forEach(function(dep) {
					// Check if dependency is already loaded or in missing scripts.
					const isAlreadyLoaded = !!document.getElementById(dep + '-js');
					const isMissing = missingScripts.some(function(s) {
						return s.handle === dep;
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
			const scriptToAdd = missingScripts.find(function(s) {
				return s.handle === handle;
			});
			if (scriptToAdd) {
				sorted.push(scriptToAdd);
			}
		}

		// Visit all missing scripts.
		missingScripts.forEach(function(script) {
			visit(script.handle);
		});

		return sorted;
	}

	/**
	 * Load scripts sequentially (simple recursive function).
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
		script.onload = function() {
			// Load next script.
			loadScriptsSequentially(scripts, index + 1, callback);
		};
		script.onerror = function() {
			// Continue even if one script fails (others might succeed).
			loadScriptsSequentially(scripts, index + 1, callback);
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

