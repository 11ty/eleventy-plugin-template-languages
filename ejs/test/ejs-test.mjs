import {strictEqual} from "node:assert";
import { after, before, test, describe } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ejs from "ejs";
import Eleventy from "@11ty/eleventy";

import EjsPlugin from "../ejsConfig.js";

const dirname = path.dirname(import.meta.url);
const input = fileURLToPath(path.join(dirname, "stubs"));

async function getTestResults(configCallback, options = {}) {
	let elev = new Eleventy(input, undefined, {
		config: eleventyConfig => {
			eleventyConfig.addPlugin(EjsPlugin, options);

			configCallback(eleventyConfig);
		}
	})

	return await elev.toJSON();
}

test("EJS standard template", async function() {
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("sample.ejs", "<p><%= name %></p>", {
			name: "Zach"
		});
	});

	strictEqual(result.content, `<p>Zach</p>`)
});

test("EJS template with front matter", async function() {
	let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.ejs", `---
name: Zach
---
<p><%= name %></p>`);
	});

	strictEqual(result.content, `<p>Zach</p>`)
});

describe("EJS Includes", () => {
	test("EJS Render Absolute Include, Fxn no Data", async function() {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("filename.ejs", "<p><%- include('/included') %></p>", {
				name: "Zach"
			});
		});

		strictEqual(result.content, `<p>This is an include.</p>`)
	});

	test("EJS Render Absolute Include, Fxn with Data", async function() {
		let [result] = await getTestResults((eleventyConfig) => {
			// includes require a full filename passed in
			eleventyConfig.addTemplate("filename.ejs", "<p><%- include('/includedvar', { name: 'Bill' }) %></p>", {});
		});

		strictEqual(result.content, `<p>This is an Bill.</p>`)
	});

	test("EJS Render Relative Include (no leading dot-slash for current dir)", async function() {
		let [result] = await getTestResults((eleventyConfig) => {
			// includes require a full filename passed in
			eleventyConfig.addTemplate("./dir/filename.ejs", "<p><%- include('included-in-dir') -%></p>", {});
		});

		strictEqual(result.content, `<p>This is an include.</p>`)
	});

	test("EJS Render Relative Include Current dir to Subdir", async function() {
		let [result] = await getTestResults((eleventyConfig) => {
			// includes require a full filename passed in
			eleventyConfig.addTemplate("filename.ejs", "<p><%- include('./dir/included-in-dir') -%></p>", {});
		});

		strictEqual(result.content, `<p>This is an include.</p>`)
	});

	test("EJS Render Relative Include Parent dir to Subdir", async function() {
		let [result] = await getTestResults((eleventyConfig) => {
			// includes require a full filename passed in
			eleventyConfig.addTemplate("./dir/filename.ejs", "<p><%- include('../dir/included-in-dir') -%></p>", {});
		})

		strictEqual(result.content, `<p>This is an include.</p>`)
	});

	test("EJS Render Relative Include Parent dir to Subdir", async function() {
		let [result] = await getTestResults((eleventyConfig) => {
			// includes require a full filename passed in
			eleventyConfig.addTemplate("./dir/filename.ejs", "<p><%- include('../dir/included-in-dir') -%></p>", {});
		});

		strictEqual(result.content, `<p>This is an include.</p>`)
	});

	test("EJS Render Relative Include, Fxn no Data", async function() {
		let [result] = await getTestResults((eleventyConfig) => {
			// includes require a full filename passed in
			eleventyConfig.addTemplate("filename.ejs", "<p><%- include('_includes/included', {}) %></p>", {});
		});

		strictEqual(result.content, `<p>This is an include.</p>`)
	});

	test("EJS Render Relative Include current dir to subdir, Fxn no Data", async function() {
		let [result] = await getTestResults((eleventyConfig) => {
			// includes require a full filename passed in
			eleventyConfig.addTemplate("filename.ejs", "<p><%- include('./dir/included-in-dir', {}) %></p>", {});
		});

		strictEqual(result.content, `<p>This is an include.</p>`)
	});

	test("EJS Render Relative Include, Fxn with Data", async function() {
		let [result] = await getTestResults((eleventyConfig) => {
			// includes require a full filename passed in
			eleventyConfig.addTemplate("filename.ejs", "<p><%- include('_includes/includedvar', { name: 'Bill' }) %></p>", {});
		});

		strictEqual(result.content, `<p>This is an Bill.</p>`)
	});
});

test("EJS Library Override", async function() {
	let [result] = await getTestResults((eleventyConfig) => {
		// includes require a full filename passed in
		eleventyConfig.addTemplate("filename.ejs", "<p><%= name %></p>", { name: "Zach" });
	}, {
		eleventyLibraryOverride: ejs
	});

	strictEqual(result.content, `<p>Zach</p>`)
});
