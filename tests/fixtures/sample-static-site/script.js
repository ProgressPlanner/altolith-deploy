/**
 * Test Static Site JavaScript
 */

// Wait for DOM to be ready
document.addEventListener( 'DOMContentLoaded', () => {
	console.log( 'Test static site loaded' );

	// Add click handler to nav links
	const navLinks = document.querySelectorAll( 'nav a' );
	navLinks.forEach( ( link ) => {
		link.addEventListener( 'click', () => {
			console.log( 'Navigating to:', link.getAttribute( 'href' ) );
		} );
	} );
} );
