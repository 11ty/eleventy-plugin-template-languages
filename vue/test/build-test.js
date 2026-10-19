import { strictEqual, deepStrictEqual, ok, rejects } from "node:assert";
import { test } from "node:test";
import fs from "node:fs";
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

test("configureApp option (plugin-template-languages#48)", async function () {
	let calls = [];
	let elev = new Eleventy(path.relative(".", path.join(dirname, "stubs-configure-app")), undefined, {
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(VuePlugin, {
				cacheDirectory: path.relative(".", path.join(dirname, "../.cache/build-test-configure-app/")),
				configureApp(app, data) {
					calls.push(data.page.url);
					app.component("site-name", { template: "<b>Eleventy</b>" });
					app.config.globalProperties.$siteUrl = "https://www.11ty.dev/";
				},
			});
		},
	});

	let [result] = await elev.toJSON();
	strictEqual(result.content, `<div><b>Eleventy</b><p>https://www.11ty.dev/</p></div>`);
	deepStrictEqual(calls, ["/"]);
});

test("Vue as a layout file (plugin-template-languages#39)", async function () {
	let elev = new Eleventy(path.relative(".", path.join(dirname, "stubs-layout")), undefined, {
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(VuePlugin, {
				cacheDirectory: path.relative(".", path.join(dirname, "../.cache/build-test-layout/")),
			});
		},
	});

	let results = (await elev.toJSON()).sort((a, b) => a.url.localeCompare(b.url));
	// Windows checkouts may convert fixture line endings to CRLF
	deepStrictEqual(results.map(({ url, content }) => ({ url, content: content.replace(/\r\n/g, "\n") })), [
		{
			url: "/",
			content: `<!doctype html><title>Hello</title><style>main { color: rebeccapurple;\n}</style><main data-title="Hello"><h1>Markdown content</h1>\n</main>\n`,
		},
		{
			url: "/vue-page/",
			content: `<!doctype html><title>Vue page</title><style>main { color: rebeccapurple;\n}</style><main data-title="Vue page"><p>Vue page content</p></main>\n`,
		},
	]);
});

test("Unchanged components skip rollup on the next build (plugin-template-languages#40)", async function () {
	let cacheDirectory = path.relative(".", path.join(dirname, "../.cache/build-test-incremental/"));
	await fs.promises.rm(cacheDirectory, { recursive: true, force: true });

	async function build() {
		let elev = new Eleventy(input, undefined, {
			config: (eleventyConfig) => {
				eleventyConfig.addPlugin(VuePlugin, { cacheDirectory });
			},
		});
		let [result] = await elev.toJSON();
		return result.content;
	}

	let compiledFile = path.join(cacheDirectory, "data.js");
	let first = await build();
	let { mtimeMs } = await fs.promises.stat(compiledFile);

	strictEqual(await build(), first);
	strictEqual((await fs.promises.stat(compiledFile)).mtimeMs, mtimeMs);
});
