import {strictEqual as equal} from 'node:assert'

import {
    describe,
    describe as context,
    it
}   from 'node:test'

//	test subjects
import plugin from '../index.js'
import Eleventy from '@11ty/eleventy'

async function getResults(input, filename, content, data, pugOptions = {}) {
	let eleventyInstance = new Eleventy(input, undefined, {
		config: function(eleventyConfig) {
			// notable: these tests use .eleventyignore to filter out some include files
			eleventyConfig.addPlugin(plugin, pugOptions);
			eleventyConfig.addTemplate(filename, content, data);
		}
	})

	return eleventyInstance.toJSON();
}

describe('Pug: Tests ported from core', function() {

	context('Virtual template', function() {
		const input = './pug/test-stubs/virtual'

		it('Render file', async function() {
			let results = await getResults(input, "index.pug", "p= name", { name: "Zach" });
			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<p>Zach</p>`);
		})

		it('Render file with function in data', async function() {
			let results = await getResults(input, "index.pug", "p= name()", { name: () => "Zach2" });
			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<p>Zach2</p>`);
		})
	});

	context('Includes and extends', function() {
		const input = './pug/test-stubs/virtual'

		it('With include (absolute path)', async function() {
			let results = await getResults(input, "index.pug", `p
	include /included.pug`, { name: "Zach" });

			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<p><span>This is an include.</span></p>`);
		})

		it('With include (relative path with dot slash)', async function() {
			let results = await getResults(input, "index.pug", `p
	include ./_includes/included.pug`, { name: "Zach" });

			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<p><span>This is an include.</span></p>`);
		})

		it('With include (relative path no leading dot slash)', async function() {
			let results = await getResults(input, "index.pug", `p
	include _includes/included.pug`, { name: "Zach" });

			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<p><span>This is an include.</span></p>`);
		})

		it('With include (relative path double dot slash)', async function() {
			let results = await getResults(input, "index.pug", `p
	include ../included-relative.pug`, { name: "Zach" });

			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<p><span>This is a relative include.</span></p>`);
		})

		it('With include (absolute path) and data', async function() {
			let results = await getResults(input, "index.pug", `p
	include /includedvar.pug`, { name: "Zach" });

			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<p><span>This is Zach.</span></p>`);
		})

		it('With include (absolute path) and data, inline var overrides data', async function() {
			let results = await getResults(input, "index.pug", `
- var name = "Bill";
p
	include /includedvar.pug`, { name: "Zach" });

			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<p><span>This is Bill.</span></p>`);
		})

		it('With extends (absolute path)', async function() {
			let results = await getResults(input, "index.pug", `extends /layout.pug
block content
  h1= name`, { name: "Zach" });

			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<html><body><h1>Zach</h1></body></html>`);
		})

		it('With extends (relative path)', async function() {
			let results = await getResults(input, "index.pug", `extends ./_includes/layout.pug
block content
  h1= name`, { name: "Zach" });

			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<html><body><h1>Zach</h1></body></html>`);
		})
	})

	context('Filters', function() {
		const input = './pug/test-stubs/virtual'

		it('Add one filter', async function() {
			let pugOptions = {
				filters: {
					makeUppercase: function (text, options) {
						return text.toUpperCase();
					},
				}
			};

			let results = await getResults(input, "index.pug", `p
  :makeUppercase()
    Zach
`, {}, pugOptions);

			equal(results.length, 1);
			equal(results[0].outputPath, "./_site/index.html");
			equal(results[0].url, "/");
			equal(results[0].content, `<p>ZACH</p>`);
		})
	})
})
