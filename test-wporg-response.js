/**
 * Simple test to check what WordPress.org API actually returns
 *
 * Run with: node test-wporg-response.js
 */

async function testWordPressOrgResponse() {
	const tests = [
		{ slug: 'akismet', type: 'plugin', shouldExist: true },
		{ slug: 'jetpack', type: 'plugin', shouldExist: true },
		{ slug: 'twentytwentyfour', type: 'theme', shouldExist: true },
		{ slug: 'nonexistent-12345', type: 'plugin', shouldExist: false },
	];

	console.log( '🔍 Testing WordPress.org API responses...\n' );

	for ( const test of tests ) {
		const url = `https://wordpress.org/${ test.type }s/${ test.slug }/`;

		try {
			// Test with redirect: 'manual'
			const response = await fetch( url, {
				method: 'HEAD',
				redirect: 'manual',
			} );

			console.log( `\n📦 ${ test.type }: ${ test.slug }` );
			console.log( `   URL: ${ url }` );
			console.log( `   Status: ${ response.status }` );
			console.log( `   Type: ${ response.type }` );
			console.log( `   OK: ${ response.ok }` );
			console.log( `   Redirected: ${ response.redirected }` );
			console.log(
				`   Current check (status=200 && type!==opaqueredirect): ${
					response.status === 200 &&
					response.type !== 'opaqueredirect'
				}`
			);
			console.log( `   Should exist: ${ test.shouldExist }` );

			// Try to get headers
			if ( response.headers ) {
				const location = response.headers.get( 'location' );
				if ( location ) {
					console.log( `   Location header: ${ location }` );
				}
			}
		} catch ( error ) {
			console.log( `\n📦 ${ test.type }: ${ test.slug }` );
			console.log( `   ❌ ERROR: ${ error.message }` );
		}

		// Add delay to avoid rate limiting
		await new Promise( ( resolve ) => setTimeout( resolve, 500 ) );
	}

	console.log( '\n✅ Test complete!\n' );
}

testWordPressOrgResponse();
