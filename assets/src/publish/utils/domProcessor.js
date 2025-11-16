/**
 * DOM Processor
 *
 * Provides DOM-based HTML manipulation using parse5.
 * Async-loaded to avoid bundle size impact.
 *
 * @package
 */

let parse5Module = null;

/**
 * Lazy-load parse5 module.
 *
 * @return {Promise<Object>} parse5 module.
 */
async function loadParse5() {
	if ( parse5Module ) {
		return parse5Module;
	}

	parse5Module = await import( 'parse5' );
	return parse5Module;
}

/**
 * Remove elements from HTML by attribute matching.
 *
 * @param {string}  html       HTML content.
 * @param {string}  selector   Element selector (e.g., 'link', 'script', 'div').
 * @param {string}  attribute  Attribute name (e.g., 'id', 'class', 'href').
 * @param {string}  value      Attribute value to match.
 * @param {boolean} exactMatch Whether to match exact value (default: false).
 * @return {Promise<string>} Processed HTML.
 */
export async function removeElementsByAttribute(
	html,
	selector,
	attribute,
	value,
	exactMatch = false
) {
	const parse5 = await loadParse5();
	const document = parse5.parse( html );

	// Walk the tree and remove matching elements.
	const toRemove = [];
	walkTree( document, ( node ) => {
		if ( node.nodeName === selector ) {
			const attr = node.attrs?.find( ( a ) => a.name === attribute );
			if ( attr ) {
				const matches = exactMatch
					? attr.value === value
					: attr.value.includes( value );
				if ( matches ) {
					toRemove.push( node );
				}
			}
		}
	} );

	// Remove nodes from tree.
	for ( const node of toRemove ) {
		removeNode( node );
	}

	return parse5.serialize( document );
}

/**
 * Walk DOM tree and execute callback on each node.
 *
 * @param {Object}   node     DOM node.
 * @param {Function} callback Callback to execute on each node.
 */
function walkTree( node, callback ) {
	callback( node );

	if ( node.childNodes ) {
		for ( const child of node.childNodes ) {
			walkTree( child, callback );
		}
	}
}

/**
 * Remove node from parent.
 *
 * @param {Object} node DOM node to remove.
 */
function removeNode( node ) {
	if ( ! node.parentNode ) {
		return;
	}

	const parent = node.parentNode;
	const index = parent.childNodes.indexOf( node );
	if ( index !== -1 ) {
		parent.childNodes.splice( index, 1 );
	}
}

/**
 * Add class to body element.
 *
 * @param {string} html      HTML content.
 * @param {string} className Class name to add.
 * @return {Promise<string>} Processed HTML.
 */
export async function addBodyClass( html, className ) {
	const parse5 = await loadParse5();
	const document = parse5.parse( html );

	// Find body element.
	let bodyNode = null;
	walkTree( document, ( node ) => {
		if ( node.nodeName === 'body' && ! bodyNode ) {
			bodyNode = node;
		}
	} );

	if ( ! bodyNode ) {
		return html;
	}

	// Find or create class attribute.
	const classAttr = bodyNode.attrs?.find( ( a ) => a.name === 'class' );
	if ( classAttr ) {
		// Check if class already exists.
		const classes = classAttr.value.split( /\s+/ );
		if ( ! classes.includes( className ) ) {
			classAttr.value = `${ classAttr.value } ${ className }`.trim();
		}
	} else {
		// Create class attribute.
		if ( ! bodyNode.attrs ) {
			bodyNode.attrs = [];
		}
		bodyNode.attrs.push( { name: 'class', value: className } );
	}

	return parse5.serialize( document );
}

/**
 * Remove class from body element.
 *
 * @param {string}          html       HTML content.
 * @param {string|string[]} classNames Class name(s) to remove.
 * @return {Promise<string>} Processed HTML.
 */
export async function removeBodyClass( html, classNames ) {
	const parse5 = await loadParse5();
	const document = parse5.parse( html );

	const classesToRemove = Array.isArray( classNames )
		? classNames
		: [ classNames ];

	// Find body element.
	let bodyNode = null;
	walkTree( document, ( node ) => {
		if ( node.nodeName === 'body' && ! bodyNode ) {
			bodyNode = node;
		}
	} );

	if ( ! bodyNode ) {
		return html;
	}

	// Find class attribute.
	const classAttr = bodyNode.attrs?.find( ( a ) => a.name === 'class' );
	if ( classAttr ) {
		// Remove specified classes.
		const classes = classAttr.value.split( /\s+/ );
		const filteredClasses = classes.filter(
			( c ) => ! classesToRemove.includes( c )
		);
		classAttr.value = filteredClasses.join( ' ' );
	}

	return parse5.serialize( document );
}

/**
 * Find and replace text in HTML.
 *
 * @param {string}        html        HTML content.
 * @param {string|RegExp} search      Text or regex to search for.
 * @param {string}        replacement Replacement text.
 * @return {Promise<string>} Processed HTML.
 */
export async function replaceText( html, search, replacement ) {
	const parse5 = await loadParse5();
	const document = parse5.parse( html );

	// Walk tree and replace text in text nodes.
	walkTree( document, ( node ) => {
		if ( node.nodeName === '#text' && node.value ) {
			if ( typeof search === 'string' ) {
				node.value = node.value.split( search ).join( replacement );
			} else if ( search instanceof RegExp ) {
				node.value = node.value.replace( search, replacement );
			}
		}
	} );

	return parse5.serialize( document );
}

/**
 * Inject content before closing tag.
 *
 * @param {string} html    HTML content.
 * @param {string} tag     Tag name (e.g., 'head', 'body').
 * @param {string} content Content to inject.
 * @return {Promise<string>} Processed HTML.
 */
export async function injectBeforeClosingTag( html, tag, content ) {
	const parse5 = await loadParse5();
	const document = parse5.parse( html );

	// Find target element.
	let targetNode = null;
	walkTree( document, ( node ) => {
		if ( node.nodeName === tag && ! targetNode ) {
			targetNode = node;
		}
	} );

	if ( ! targetNode ) {
		return html;
	}

	// Parse injected content and add as child nodes.
	const fragment = parse5.parseFragment( content );
	if ( ! targetNode.childNodes ) {
		targetNode.childNodes = [];
	}
	targetNode.childNodes.push( ...fragment.childNodes );

	return parse5.serialize( document );
}

/**
 * Query selector (find first matching element).
 *
 * @param {string} html     HTML content.
 * @param {string} selector CSS selector (simplified - only tag names supported).
 * @return {Promise<Object|null>} First matching node or null.
 */
export async function querySelector( html, selector ) {
	const parse5 = await loadParse5();
	const document = parse5.parse( html );

	let result = null;
	walkTree( document, ( node ) => {
		if ( ! result && node.nodeName === selector ) {
			result = node;
		}
	} );

	return result;
}

/**
 * Query selector all (find all matching elements).
 *
 * @param {string} html     HTML content.
 * @param {string} selector CSS selector (simplified - only tag names supported).
 * @return {Promise<Array>} Array of matching nodes.
 */
export async function querySelectorAll( html, selector ) {
	const parse5 = await loadParse5();
	const document = parse5.parse( html );

	const results = [];
	walkTree( document, ( node ) => {
		if ( node.nodeName === selector ) {
			results.push( node );
		}
	} );

	return results;
}

/**
 * Get attribute value from element.
 *
 * @param {Object} node      DOM node.
 * @param {string} attribute Attribute name.
 * @return {string|null} Attribute value or null.
 */
export function getAttribute( node, attribute ) {
	const attr = node.attrs?.find( ( a ) => a.name === attribute );
	return attr ? attr.value : null;
}

/**
 * Set attribute value on element.
 *
 * @param {Object} node      DOM node.
 * @param {string} attribute Attribute name.
 * @param {string} value     Attribute value.
 */
export function setAttribute( node, attribute, value ) {
	if ( ! node.attrs ) {
		node.attrs = [];
	}

	const attr = node.attrs.find( ( a ) => a.name === attribute );
	if ( attr ) {
		attr.value = value;
	} else {
		node.attrs.push( { name: attribute, value } );
	}
}
