#!/usr/bin/env node

/**
 * Provider Scaffold CLI
 *
 * Scaffolds a new Aether provider from the template.
 * Usage: npm run create-provider <provider-name>
 *
 * @package
 */

const fs = require( 'fs' );
const path = require( 'path' );
const readline = require( 'readline' );

// Get provider name from command line
const providerName = process.argv[ 2 ];

if ( ! providerName ) {
	console.error( '❌ Error: Provider name is required' );
	console.log( '\nUsage: npm run create-provider <provider-name>' );
	console.log( 'Example: npm run create-provider my-cloud' );
	process.exit( 1 );
}

// Validate provider name (kebab-case)
if ( ! /^[a-z0-9-]+$/.test( providerName ) ) {
	console.error(
		'❌ Error: Provider name must be kebab-case (lowercase letters, numbers, and hyphens only)'
	);
	console.log( 'Example: my-cloud, cloudflare-r2, digital-ocean' );
	process.exit( 1 );
}

// Convert kebab-case to PascalCase for class names
function toPascalCase( str ) {
	return str
		.split( '-' )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( '' );
}

// Convert kebab-case to Title Case for display names
function toTitleCase( str ) {
	return str
		.split( '-' )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
}

const className = toPascalCase( providerName ) + 'Provider';
const displayName = toTitleCase( providerName );

// Paths
const templateDir = path.join( __dirname, '../assets/src/providers/_template' );
const targetDir = path.join(
	__dirname,
	'../assets/src/providers',
	providerName
);

// Check if provider already exists
if ( fs.existsSync( targetDir ) ) {
	console.error( `❌ Error: Provider "${ providerName }" already exists` );
	console.log( `Directory exists at: ${ targetDir }` );
	process.exit( 1 );
}

// Interactive prompts
const rl = readline.createInterface( {
	input: process.stdin,
	output: process.stdout,
} );

function question( query ) {
	return new Promise( ( resolve ) => rl.question( query, resolve ) );
}

async function gatherInfo() {
	console.log( '\n🚀 Creating new Aether provider' );
	console.log( `Provider ID: ${ providerName }` );
	console.log( `Class name: ${ className }` );
	console.log( `Display name: ${ displayName }` );
	console.log();

	const description =
		( await question(
			'Provider description (optional, press Enter to skip): '
		) ) || `Deploy to ${ displayName }.`;

	const capabilities = await question(
		'Capabilities (comma-separated: storage, edge, media, static-site): '
	);

	rl.close();

	return {
		description,
		capabilities: capabilities
			.split( ',' )
			.map( ( c ) => c.trim() )
			.filter( Boolean ),
	};
}

function copyDirectory( src, dest, replacements ) {
	// Create target directory
	fs.mkdirSync( dest, { recursive: true } );

	// Read all files in template directory
	const files = fs.readdirSync( src );

	for ( const file of files ) {
		const srcPath = path.join( src, file );
		let destPath = path.join( dest, file );

		// Rename template files
		if ( file === 'ProviderTemplate.js' ) {
			destPath = path.join( dest, `${ className }.js` );
		}

		const stat = fs.statSync( srcPath );

		if ( stat.isDirectory() ) {
			// Recursively copy directories
			copyDirectory( srcPath, destPath, replacements );
		} else {
			// Read file content
			let content = fs.readFileSync( srcPath, 'utf8' );

			// Apply replacements
			for ( const [ search, replace ] of Object.entries(
				replacements
			) ) {
				content = content.split( search ).join( replace );
			}

			// Write file
			fs.writeFileSync( destPath, content );
		}
	}
}

function updateProviderLoader( name ) {
	const loaderPath = path.join(
		__dirname,
		'../assets/src/providers/utils/providerLoader.js'
	);

	let content = fs.readFileSync( loaderPath, 'utf8' );

	// Add to loadAllProviders array
	const arrayMatch = content.match( /loadProviders\(\s*\[([\s\S]*?)\]\s*\)/ );

	if ( arrayMatch ) {
		const arrayContent = arrayMatch[ 1 ];
		const providers = arrayContent
			.split( ',' )
			.map( ( p ) => p.trim().replace( /['"]/g, '' ) )
			.filter( Boolean );

		// Add new provider if not already there
		if ( ! providers.includes( name ) ) {
			providers.push( name );

			const newArray = providers
				.map( ( p ) => `\t\t'${ p }'` )
				.join( ',\n' );

			content = content.replace(
				/loadProviders\(\s*\[([\s\S]*?)\]\s*\)/,
				`loadProviders( [\n${ newArray },\n\t] )`
			);

			fs.writeFileSync( loaderPath, content );

			return true;
		}
	}

	return false;
}

function createTestFile( name, clsName ) {
	const testDir = path.join( __dirname, '../tests/js/providers', name );
	fs.mkdirSync( testDir, { recursive: true } );

	const testContent = `/**
 * ${ clsName } Tests
 *
 * @package Aether
 */

import { ${ clsName } } from '../../../../assets/src/providers/${ name }/${ clsName }';

describe( '${ clsName }', () => {
	let provider;

	beforeEach( () => {
		provider = new ${ clsName }();
	} );

	describe( 'Metadata', () => {
		it( 'should return correct ID', () => {
			expect( provider.getId() ).toBe( '${ name }' );
		} );

		it( 'should return correct name', () => {
			expect( provider.getName() ).toBeTruthy();
			expect( typeof provider.getName() ).toBe( 'string' );
		} );

		it( 'should return correct description', () => {
			expect( provider.getDescription() ).toBeTruthy();
			expect( typeof provider.getDescription() ).toBe( 'string' );
		} );

		it( 'should return capabilities array', () => {
			const capabilities = provider.getCapabilities();
			expect( Array.isArray( capabilities ) ).toBe( true );
			expect( capabilities.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Configuration', () => {
		it( 'should return config fields array', () => {
			const fields = provider.getConfigFields();
			expect( Array.isArray( fields ) ).toBe( true );
			expect( fields.length ).toBeGreaterThan( 0 );
		} );

		it( 'should validate config correctly', () => {
			const validConfig = {
				// TODO: Add valid config
			};

			const result = provider.validateConfig( validConfig );
			expect( result ).toHaveProperty( 'valid' );
			expect( result ).toHaveProperty( 'errors' );
		} );

		it( 'should reject invalid config', () => {
			const invalidConfig = {};

			const result = provider.validateConfig( invalidConfig );
			expect( result.valid ).toBe( false );
			expect( Object.keys( result.errors ).length ).toBeGreaterThan( 0 );
		} );

		it( 'should sanitize config', () => {
			const dirtyConfig = {
				// TODO: Add config with spaces, wrong case, etc.
			};

			const clean = provider.sanitizeConfig( dirtyConfig );
			expect( clean ).toBeTruthy();
			// TODO: Add specific sanitization checks
		} );
	} );

	// TODO: Add more tests for testConnection, deploy, getStatus, etc.
	// Use mocking for API calls
} );
`;

	fs.writeFileSync(
		path.join( testDir, `${ className }.test.js` ),
		testContent
	);
}

// Main execution
( async () => {
	try {
		// Gather provider information
		const info = await gatherInfo();

		console.log( '\n📦 Creating provider files...' );

		// Prepare replacements
		const replacements = {
			ProviderTemplate: className,
			'provider-template': providerName,
			'Provider Template': displayName,
			'Template provider for creating new cloud provider integrations.':
				info.description,
		};

		// Add capability imports/exports
		const capabilityMapping = {
			storage: 'CAP_STORAGE',
			edge: 'CAP_EDGE',
			media: 'CAP_MEDIA',
			'static-site': 'CAP_STATIC_SITE',
		};

		const selectedCapabilities = info.capabilities
			.map( ( c ) => capabilityMapping[ c ] )
			.filter( Boolean );

		if ( selectedCapabilities.length > 0 ) {
			replacements[
				'// CAP_STORAGE,      // Object storage\n\t\t\t// CAP_EDGE,         // Edge computing/workers\n\t\t\t// CAP_MEDIA,        // Media offloading\n\t\t\t// CAP_STATIC_SITE,  // Static site hosting'
			] = selectedCapabilities
				.map( ( cap ) => `\t\t\t${ cap },` )
				.join( '\n' );
		}

		// Copy template directory
		copyDirectory( templateDir, targetDir, replacements );

		console.log( `✅ Created provider directory: ${ targetDir }` );

		// Update providerLoader.js
		console.log( '\n📝 Updating providerLoader.js...' );
		const loaderUpdated = updateProviderLoader( providerName );

		if ( loaderUpdated ) {
			console.log( '✅ Added provider to loadAllProviders()' );
		} else {
			console.log(
				'⚠️  Could not automatically update providerLoader.js'
			);
			console.log(
				`   Please manually add '${ providerName }' to the loadAllProviders() array`
			);
		}

		// Create test file
		console.log( '\n🧪 Creating test file...' );
		createTestFile( providerName, className );
		console.log( '✅ Created test file' );

		// Success message
		console.log( '\n✅ Provider scaffold created successfully!' );
		console.log( '\nNext steps:' );
		console.log( `1. Edit ${ targetDir }/${ className }.js` );
		console.log( '2. Implement required methods (marked with TODO)' );
		console.log( '3. Update configuration fields for your provider' );
		console.log(
			'4. Implement validation, connection test, and deployment logic'
		);
		console.log(
			`5. Write tests in tests/js/providers/${ providerName }/`
		);
		console.log(
			'6. Add provider to webpack config (if needed for separate bundle)'
		);
		console.log( '7. Test in WordPress admin' );
		console.log( '8. Update documentation' );
		console.log( '\nFiles created:' );
		console.log( `- ${ targetDir }/` );
		console.log( `  - ${ className }.js` );
		console.log( '  - index.js' );
		console.log( '  - README.md' );
		console.log(
			`- tests/js/providers/${ providerName }/${ className }.test.js`
		);
		console.log( '\nHappy coding! 🎉' );
	} catch ( error ) {
		console.error( '\n❌ Error creating provider:', error.message );
		process.exit( 1 );
	}
} )();
