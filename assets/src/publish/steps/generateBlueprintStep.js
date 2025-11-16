/**
 * Generate Blueprint Step
 *
 * Creates WordPress Playground blueprint JSON.
 * Blueprint tells Playground how to restore the site.
 *
 * @package
 */

/**
 * Generate blueprint step handler.
 *
 * @param {Object}   context                       Execution context.
 * @param {Function} context.generateBlueprintJson Blueprint generator function.
 * @param {string}   context.siteKey               Site key for storage.
 * @param {string}   context.providerId            Storage provider ID.
 * @param {Function} context.setStatusMessage      Status message updater.
 * @return {Promise<Object>} Step result with blueprint data.
 */
export async function generateBlueprintHandler( context ) {
	const { generateBlueprintJson, siteKey, providerId, setStatusMessage } =
		context;

	setStatusMessage(
		'Generating the blueprint file',
		'progress',
		'generateBlueprint'
	);

	// Generate blueprint using React hook
	const blueprintData = await generateBlueprintJson(
		siteKey,
		providerId,
		setStatusMessage
	);

	setStatusMessage(
		'Generated the blueprint file',
		'success',
		'generateBlueprint'
	);

	return {
		blueprintData,
	};
}
