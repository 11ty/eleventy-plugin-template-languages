import {strictEqual as equal} from 'node:assert'
import path from 'node:path'
import {
	describe,
	describe as context,
	it
}   from 'node:test'

//	test subjects
import Eleventy from "@11ty/eleventy";


describe('Pug Global Data', function() {
	const GLOBAL_DATA_PROJECT_PATH 	= './pug/test-stubs/data-access'
	const input						= path.join(GLOBAL_DATA_PROJECT_PATH, '_src')
	const output					= path.join(GLOBAL_DATA_PROJECT_PATH, '_site')
	const options	= {
		configPath: path.join(GLOBAL_DATA_PROJECT_PATH, "eleventy.config.js")
	}

	context('GIVEN some global data', function() {
		let eleventyInstance = new Eleventy(input, output, options)

		it('The compilation can use the data ', async function() {
			let results = await eleventyInstance.toJSON();
			equal(results.length, 1);
			equal(results[0].outputPath, "./pug/test-stubs/data-access/_site/index.html");
			equal(results[0].url, "/");
		})
	})
})
