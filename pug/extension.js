import debugUtil from 'debug'
import pug	from 'pug'

import DEFAULT_PUG_OPTIONS from './defaults.js'


const debug 	= debugUtil('Eleventy:Plugins:Pug')
const debugDev 	= debugUtil('Dev:Eleventy:Plugins:Pug')


const extension = {
	outputFileExtension: 'html',
	options: DEFAULT_PUG_OPTIONS,

	async init() {
		debug('Plugin initialized.')
		debugDev('%O', this)
	},

	/**
	 *	Provides runtime Pug compilation for Eleventy.
	 *	@param {String} inputSource - Source of the input file
	 *	@param {String} inputPath   - Path of the input file
	 *	@returns {String} The resulting code returned by Pug (currently, `pug.render()`).
	 */
	async compile(inputSource, inputPath) {
		debugDev('inputSource: %s', inputSource)
		debugDev('inputPath: %s',	inputPath)

		//	@TODO:	Determine if Eleventy provides a built-in way to
		//			detect when rendering a layout.

		//	sometimes this is a layout, in which case it will
		//	not be the same as `page.inputPath` (see `page`, below).
		//
		// const filename = path.resolve('.', inputPath)
		// debug('compile resolved inputPath to filename: %s', filename)

		//	@TODO: Register Pug template dependencies for caching & performance
		//	@see	https://www.11ty.dev/docs/languages/custom/#registering-dependencies

		/** @param {Object} arg - Provided by Eleventy at runtime	*/
		return async function(arg) {
			debugDev('rendering... received arg: %O',		arg)
			debug(	 'about to render... inputPath: %O', 	inputPath)

			const renderOptions = Object.assign(
				{},
				{
					basedir: extension.options.basedir ?? arg.eleventy.directories.includes,
					filename: inputPath,
					filters: extension.options.filters,
					doctype: extension.options.doctype,
					pretty: extension.options.pretty,
					self: extension.options.self,
					debug: extension.options.debug,
					compileDebug: extension.options.compileDebug,
					globals: extension.options.globals,
					cache: extension.options.cache,
					inlineRuntimeFunctions: extension.options.inlineRuntimeFunctions,
				},
				arg
			)

			// console.log('\n\nrenderOptions: %O\n\n', renderOptions)

			/*
			 *	Using `pug.render()` is the simplest path to get this plugin working.
			 *
			 *	However:
			 *		- `pug.compile()` returns a function that can be cached,
			 *			_and_ that function has a `.dependencies` property!
			 *
			 *			- @see: `CustomEngine.getCompileCacheKey()`
			 *			- would this actually speed up build times for large projects?
			 */
			return pug.render(inputSource, renderOptions)
		}
	}
}

export default extension;
