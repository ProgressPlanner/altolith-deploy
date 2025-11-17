/**
 * Tests for filterWorkflowByExportTypes function
 *
 * @package
 */

import {
	filterWorkflowByExportTypes,
	PUBLISH_WORKFLOW,
} from '../publishWorkflow';

describe( 'filterWorkflowByExportTypes', () => {
	it( 'should return original workflow when both export types are included', () => {
		const exportTypes = [ 'static_site', 'blueprint_bundle' ];
		const filtered = filterWorkflowByExportTypes(
			PUBLISH_WORKFLOW,
			exportTypes
		);

		expect( filtered ).toEqual( PUBLISH_WORKFLOW );
	} );

	it( 'should return original workflow when export types is empty', () => {
		const exportTypes = [];
		const filtered = filterWorkflowByExportTypes(
			PUBLISH_WORKFLOW,
			exportTypes
		);

		expect( filtered ).toEqual( PUBLISH_WORKFLOW );
	} );

	it( 'should filter out blueprint_bundle steps when only static_site is selected', () => {
		const exportTypes = [ 'static_site' ];
		const filtered = filterWorkflowByExportTypes(
			PUBLISH_WORKFLOW,
			exportTypes
		);

		// Extract all step IDs from the workflow
		const stepIds = [];
		filtered.forEach( ( phase ) => {
			phase.forEach( ( [ stepId ] ) => {
				stepIds.push( stepId );
			} );
		} );

		// Should include discoverAssets (both), getStaticSiteUrls, uploadStaticSiteFiles
		expect( stepIds ).toContain( 'discoverAssets' );
		expect( stepIds ).toContain( 'getStaticSiteUrls' );
		expect( stepIds ).toContain( 'uploadStaticSiteFiles' );

		// Should NOT include createSiteArchive, generateBlueprint, uploadSiteArchive
		expect( stepIds ).not.toContain( 'createSiteArchive' );
		expect( stepIds ).not.toContain( 'generateBlueprint' );
		expect( stepIds ).not.toContain( 'uploadSiteArchive' );
	} );

	it( 'should filter out static_site steps when only blueprint_bundle is selected', () => {
		const exportTypes = [ 'blueprint_bundle' ];
		const filtered = filterWorkflowByExportTypes(
			PUBLISH_WORKFLOW,
			exportTypes
		);

		// Extract all step IDs from the workflow
		const stepIds = [];
		filtered.forEach( ( phase ) => {
			phase.forEach( ( [ stepId ] ) => {
				stepIds.push( stepId );
			} );
		} );

		// Should include discoverAssets (both), createSiteArchive, generateBlueprint, uploadSiteArchive
		expect( stepIds ).toContain( 'discoverAssets' );
		expect( stepIds ).toContain( 'createSiteArchive' );
		expect( stepIds ).toContain( 'generateBlueprint' );
		expect( stepIds ).toContain( 'uploadSiteArchive' );

		// Should NOT include getStaticSiteUrls, uploadStaticSiteFiles
		expect( stepIds ).not.toContain( 'getStaticSiteUrls' );
		expect( stepIds ).not.toContain( 'uploadStaticSiteFiles' );
	} );

	it( 'should redistribute progress weights to sum to 100%', () => {
		const exportTypes = [ 'static_site' ];
		const filtered = filterWorkflowByExportTypes(
			PUBLISH_WORKFLOW,
			exportTypes
		);

		// Calculate total weight
		let totalWeight = 0;
		filtered.forEach( ( phase ) => {
			phase.forEach( ( [ , weight ] ) => {
				totalWeight += weight;
			} );
		} );

		// Should be 100% (allow small rounding errors)
		expect( totalWeight ).toBeGreaterThanOrEqual( 99 );
		expect( totalWeight ).toBeLessThanOrEqual( 101 );
	} );

	it( 'should maintain workflow structure with phases', () => {
		const exportTypes = [ 'static_site' ];
		const filtered = filterWorkflowByExportTypes(
			PUBLISH_WORKFLOW,
			exportTypes
		);

		// Should return an array of phases
		expect( Array.isArray( filtered ) ).toBe( true );

		// Each phase should be an array
		filtered.forEach( ( phase ) => {
			expect( Array.isArray( phase ) ).toBe( true );

			// Each step should be [stepId, weight]
			phase.forEach( ( step ) => {
				expect( Array.isArray( step ) ).toBe( true );
				expect( step ).toHaveLength( 2 );
				expect( typeof step[ 0 ] ).toBe( 'string' );
				expect( typeof step[ 1 ] ).toBe( 'number' );
			} );
		} );
	} );

	it( 'should remove empty phases', () => {
		const exportTypes = [ 'static_site' ];
		const filtered = filterWorkflowByExportTypes(
			PUBLISH_WORKFLOW,
			exportTypes
		);

		// No phase should be empty
		filtered.forEach( ( phase ) => {
			expect( phase.length ).toBeGreaterThan( 0 );
		} );
	} );
} );
