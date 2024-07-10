import { strictEqual } from "node:assert";
import { test, describe } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mustache from "mustache";
import Eleventy from "@11ty/eleventy";

import MustachePlugin from "../mustacheConfig.js";

const dirname = path.dirname(import.meta.url);
const input = fileURLToPath(path.join(dirname, "stubs"));

async function getTestResults(configCallback, options = {}) {
	let elev = new Eleventy(input, undefined, {
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(MustachePlugin, options);

			configCallback(eleventyConfig);
		},
	});

	return await elev.toJSON();
}

test("Mustache standard template", async function () {
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("sample.mustache", "<p>{{name}}</p>", {
			name: "Zach",
		});
	});

	strictEqual(result.content, `<p>Zach</p>`);
});

test("Mustache permalink", async function () {
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("sample.mustache", "<p>{{ name }}</p>", {
			name: "this-is-a-url",
			permalink: "/{{name}}/"
		});
	});

	strictEqual(result.url, `/this-is-a-url/`);
});

describe("Partials", () => {
	test("Partial raw text", async function () {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.mustache", "<p>{{> include}}</p>");
		});

		strictEqual(result.content, `<p>This is an include.</p>`);
	});

	test("Partial variable in content", async function () {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.mustache", "<p>{{> includevar}}</p>", { name: "Zach" });
		});

		strictEqual(result.content, `<p>This is a Zach.</p>`);
	});

	test("Partial in subdir", async function () {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.mustache", "<p>{{> dir/include-dir}}</p>", { name: "Zach" });
		});

		strictEqual(result.content, `<p>Include in dir.</p>`);
	});
});

test("Library override", async function () {
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("sample.mustache", "<p>{{name}}</p>", { name: "Zach" });
	}, {
		eleventyLibraryOverride: mustache,
	});

	strictEqual(result.content, `<p>Zach</p>`);
});

describe("Escaped/unescaped output", () => {
	test("Escaped output (no HTML)", async function () {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.mustache", "<p>{{{name}}}</p>", { name: "Zach" });
		});

		strictEqual(result.content, `<p>Zach</p>`);
	});

	test("Escaped output (HTML)", async function () {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.mustache", "<p>{{name}}</p>", { name: "<b>Zach</b>" });
		});

		strictEqual(result.content, `<p>&lt;b&gt;Zach&lt;&#x2F;b&gt;</p>`);
	});

	test("Unescaped output (HTML)", async function () {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.mustache", "<p>{{{name}}}</p>", { name: "<b>Zach</b>" });
		});

		strictEqual(result.content, `<p><b>Zach</b></p>`);
	});
})
