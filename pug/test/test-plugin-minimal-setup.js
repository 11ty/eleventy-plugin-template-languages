import {strict as assert} from 'node:assert'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
    after,
    before,
    describe,
    describe as context,
    it
}   from 'node:test'
import { rimrafSync } from "rimraf";

//	test subjects
import plugin from '../index.js'
import Eleventy from '@11ty/eleventy'
import UserConfig from '@11ty/eleventy/src/UserConfig.js'

//	Other plugins I’ve looked at test their own code,
//	but they don’t test how it interacts with Eleventy.
//
//	Pug had some a few rough edges in Eleventy 2, so
//	I want to be sure it’s solid for Eleventy 3.


describe('SCENARIO: Minimal possible setup', function() {

	context('GIVEN a UserConfig', function() {
		const config = new UserConfig()

		it('it starts with no plugins', function() {
			assert.equal(config.plugins.length, 0)
		})

		it('runs .addPlugin() successfully', function() {
			config.addPlugin(plugin)
			assert.equal(config.plugins.length, 1)
		})
	})

	context('GIVEN a minimal project and config', function() {
		const GLOBAL_DATA_PROJECT_PATH 	= './test-stubs/minimal'
		const input						= path.join(GLOBAL_DATA_PROJECT_PATH, '_src')
		const output					= path.join(GLOBAL_DATA_PROJECT_PATH, '_site')
		const options	= {
			configPath: path.join(GLOBAL_DATA_PROJECT_PATH, "eleventy.config.js")
		}

		context('WHEN we instantiate Eleventy', function() {
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

			it('Can build a Pug file', async function() {
				await eleventyInstance.executeBuild()
				await assert(fs.existsSync(output), `output did not exist: “${output}”\n`)
				assert(fs.existsSync(path.resolve(output, 'index.html')))
			})

		})
	})
})

describe.todo('SCENARIO: Multiple layouts', function() {})

