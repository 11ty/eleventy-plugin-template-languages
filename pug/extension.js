import { createHash } from 'node:crypto'

import debugUtil from 'debug'
import pug	from 'pug'

import DEFAULT_PUG_OPTIONS from './defaults.js'


const debug 	= debugUtil('Eleventy:Plugins:Pug')
const debugDev 	= debugUtil('Dev:Eleventy:Plugins:Pug')

let cache = {}

function getCacheKey(renderOptions, inputSource) {
	const hash = createHash('md5')
	hash.update(JSON.stringify({ renderOptions, inputSource }))
	return hash.digest('hex')
}

const extension = {
	outputFileExtension: 'html',
	options: DEFAULT_PUG_OPTIONS,

	async init() {
		debug('Plugin initialized.')
		debugDev('%O', this)
		cache = {}
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

		// Used to record dependencies after the fact.
		const self = this

		/** @param {Object} arg - Provided by Eleventy at runtime	*/
		return async function(arg) {
			debug(	 'about to render... inputPath: %O',	inputPath)

			// If we could get the `includes` in the outer function, we
			// could call `compile` there and enable caching on the Eleventy
			// side. We don’t set `cache: true` in the Pug options since we
			// want to invalidate the cache ourselves on every build (see
			// `init` above).
			const renderOptions = {
				basedir: arg.eleventy.directories.includes,
				filename: inputPath,
				filters: extension.options.filters,
			}

			// `inputPath` is not enough as the plugin may render multiple
			// parts of the same template, such as the permalink and the
			// main content.
			const key = getCacheKey(renderOptions, inputSource)
			debugDev("Render key: %O", key)
			const compiled = (cache[key] ??= pug.compile(inputSource, renderOptions))

			const output = compiled(arg)
			// See above about `includes`.
			self.addDependencies(inputPath, output.dependencies)
			return output
		}
	},
	compileOptions: {
		cache: false,
	}
}

export default extension;
