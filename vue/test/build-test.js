import { strictEqual, deepStrictEqual, ok, rejects } from "node:assert";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Eleventy from "@11ty/eleventy";

import VuePlugin from "../vueConfig.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.relative(".", path.join(dirname, "stubs-a"));

test("Vue build via Eleventy", async function () {
	let elev = new Eleventy(input, undefined, {
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(VuePlugin, {
				cacheDirectory: path.relative(".", path.join(dirname, "../.cache/build-test/")),
			});
		},
	});

	let [result] = await elev.toJSON();
	strictEqual(result.url, "/data/");
	ok(result.content.includes("<p>/data/</p>"));
	ok(result.content.includes(`<div><p>/data/</p><p>HELLO</p><div id="child"></div></div>`));
	ok(result.content.includes("background-color: pink;"));
	ok(result.content.includes("#grandchild { color: yellow;"));
});

test("Vue pagination via Eleventy (eleventy-plugin-vue#48)", async function () {
	let elev = new Eleventy(path.relative(".", path.join(dirname, "stubs-pagination")), undefined, {
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(VuePlugin, {
				cacheDirectory: path.relative(".", path.join(dirname, "../.cache/build-test-pagination/")),
			});
		},
	});

	let results = (await elev.toJSON()).sort((a, b) => a.url.localeCompare(b.url));
	deepStrictEqual(results.map(({ url, content }) => ({ url, content })), [
		{ url: "/page-0/", content: "<ul><!--[--><li>a</li><li>b</li><!--]--></ul>" },
		{ url: "/page-1/", content: "<ul><!--[--><li>c</li><li>d</li><!--]--></ul>" },
	]);
});

test("Vue script syntax error reports the original error (eleventy-plugin-vue#3)", async function () {
	let elev = new Eleventy(path.relative(".", path.join(dirname, "stubs-syntax-error")), undefined, {
		quietMode: true,
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(VuePlugin, {
				cacheDirectory: path.relative(".", path.join(dirname, "../.cache/build-test-syntax-error/")),
			});
		},
	});

	await rejects(elev.toJSON(), (error) => {
		let messages = [];
		for (let e = error; e; e = e.originalError || e.cause) {
			messages.push(e.message);
		}
		let message = messages.join("\n");
		ok(!message.includes("reading 'line'"), message);
		ok(message.includes("index.vue on Line 6 Column"), message);
		ok(message.includes("Unexpected token"), message);
		return true;
	});
});

test("Template strings don’t share a compile cache key with the component", async function () {
	let elev = new Eleventy(input, undefined, {
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(VuePlugin, {
				cacheDirectory: path.relative(".", path.join(dirname, "../.cache/build-test/")),
			});
		},
	});
	await elev.init();

	let { getCacheKey } = elev.eleventyConfig.userConfig.extensionMap.values().find((entry) => entry.key === "vue").compileOptions;
	ok(getCacheKey("<p>Hi</p>", "./index.vue") !== getCacheKey("", "./index.vue"));
});
