/**
 *	@fileoverview Plugin for Eleventy 3. Provides support for Pug templates.
 */
import EleventyPugExtension from './extension.js'




/**
 *	@typedef {import('@11ty/eleventy/src/UserConfig.js').UserConfig} UserConfig
 */

//	TODO: 	Group Pug-only options under `pugOptions`, and
//			add `eleventyOptions` with options to customize
//			Eleventy’s behavior (e.g., fine-grained control of caching,
//			for instance).

/**
 *	@param {UserConfig} eleventyConfig
 *	@param {Object} [options = {}]
 */
export default function EleventyPluginPug(eleventyConfig, options = {}) {

	// Tell Eleventy to process `*.pug` files
	eleventyConfig.addTemplateFormats('pug')

	// Prepare extension object
	const PugExtension = EleventyPugExtension
	PugExtension.options = Object.assign(PugExtension.options, options)

	// PugExtension.options.basedir =
	// 	options?.basedir
	// 	??  path.normalize(
	// 		eleventyConfig.dir.input,
	// 		eleventyConfig.dir.includes
	// 	)

	// Specify behavior for `*.pug` files
	eleventyConfig.addExtension('pug', PugExtension)
}
