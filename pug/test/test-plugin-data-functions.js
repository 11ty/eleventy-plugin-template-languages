import {strict as assert} from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import {
    after,
    before,
    describe,
    describe as context,
    it
}   from 'node:test'

//	test subjects
import { rimrafSync } from 'rimraf';
import Eleventy from '@11ty/eleventy'


describe('SCENARIO: Global Data Function', function() {
	const GLOBAL_DATA_PROJECT_PATH 	= './test-stubs/data-functions'
	const input						= path.join(GLOBAL_DATA_PROJECT_PATH, '_src')
	const output					= path.join(GLOBAL_DATA_PROJECT_PATH, '_site')
	const options	= {
		configPath: path.join(GLOBAL_DATA_PROJECT_PATH, "eleventy.config.js")
	}

	context('GIVEN a function export from global data', function() {
		before(function cleanPreviousTestOutputDirs() {
			/* ⚠️ 	CAUTION:
			 *		Dangerous if you mess with the paths above!
			 */
			 if (output && fs.existsSync(output)) {
				rimrafSync(output);
			}
		})

		after(function() {
			/* ⚠️ 	CAUTION:
			 *		Dangerous if you mess with the paths above!
			 */
			if (output && fs.existsSync(output)) {
				rimrafSync(output);
			}
		})
		let eleventyInstance = new Eleventy(input, output, options)

		it('The compilation can use the data function ', async function() {
			await eleventyInstance.executeBuild()
			assert(fs.existsSync(output), `output did not exist: ${output}`)
			assert(fs.existsSync(path.resolve(output, 'index.html')))
		})
	})
})
