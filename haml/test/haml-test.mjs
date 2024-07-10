import { strictEqual } from "node:assert";
import { test, describe } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import haml from "hamljs";
import Eleventy from "@11ty/eleventy";

import HamlPlugin from "../hamlConfig.js";

const dirname = path.dirname(import.meta.url);
const input = fileURLToPath(path.join(dirname, "stubs"));

async function getTestResults(configCallback, options = {}) {
	let elev = new Eleventy(input, undefined, {
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(HamlPlugin, options);

			configCallback(eleventyConfig);
		},
	});

	return await elev.toJSON();
}

test("HAML standard template", async function () {
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("sample.haml", "%p= name", {
			name: "Zach",
		});
	});

	strictEqual(result.content.trim(), `<p>Zach</p>`);
});

test("HAML library override", async function () {
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("sample.haml", "%p= name", {
			name: "Zach",
		});
	}, {
		eleventyLibraryOverride: haml
	});

	strictEqual(result.content.trim(), `<p>Zach</p>`);
});

test("HAML permalink (should be raw text)", async function () {
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("sample.haml", "", {
			permalink: "/this-is-a-url/"
		});
	});

	strictEqual(result.url, `/this-is-a-url/`);
});
