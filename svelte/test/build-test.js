import { strictEqual, deepStrictEqual, ok, match, rejects } from "node:assert";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Eleventy from "@11ty/eleventy";

import SveltePlugin from "../svelteConfig.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));

function getEleventy(stubs, options = {}, eleventyOptions = {}) {
	return new Eleventy(path.relative(".", path.join(dirname, stubs)), undefined, {
		...eleventyOptions,
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(SveltePlugin, {
				cacheDirectory: path.relative(".", path.join(dirname, `../.cache/build-${stubs}/`)),
				...options,
			});
		},
	});
}

test("Svelte build via Eleventy", async function () {
	let [result] = await getEleventy("stubs-a").toJSON();
	strictEqual(result.url, "/data/");
	match(result.content, /<div class="svelte-\w+"><p>\/data\/<\/p><p>HELLO<\/p>/);
	ok(result.content.includes("background-color: pink;"));
	// Child component CSS comes first
	ok(result.content.indexOf("#grandchild") < result.content.indexOf("#child"));
	ok(result.content.indexOf("#child") < result.content.indexOf("pink"));
});

test("Svelte pagination via Eleventy", async function () {
	let results = (await getEleventy("stubs-pagination").toJSON()).sort((a, b) => a.url.localeCompare(b.url));
	deepStrictEqual(
		results.map(({ url, content }) => ({ url, content })),
		[
			{ url: "/page-0/", content: "<ul><li>a</li><li>b</li></ul>" },
			{ url: "/page-1/", content: "<ul><li>c</li><li>d</li></ul>" },
		],
	);
});

test("Svelte syntax errors report the file and location", async function () {
	await rejects(getEleventy("stubs-syntax-error", {}, { quietMode: true }).toJSON(), (error) => {
		let messages = [];
		for (let e = error; e; e = e.originalError || e.cause) {
			messages.push(e.message);
		}
		let message = messages.join("\n");
		ok(message.includes("index.svelte on Line 5 Column"), message);
		ok(message.includes("Unexpected token"), message);
		return true;
	});
});

test("Template strings don’t share a compile cache key with the component", async function () {
	let elev = getEleventy("stubs-a");
	await elev.init();

	let { getCacheKey } = elev.eleventyConfig.userConfig.extensionMap.values().find((entry) => entry.key === "svelte").compileOptions;
	ok(getCacheKey("<p>Hi</p>", "./index.svelte") !== getCacheKey("", "./index.svelte"));
});

test("configureContext option", async function () {
	let calls = [];
	let [result] = await getEleventy("stubs-configure-context", {
		configureContext(context, data) {
			calls.push(data.page.url);
			context.set("site", { url: "https://www.11ty.dev/" });
		},
	}).toJSON();
	strictEqual(result.content, `<p>https://www.11ty.dev/</p>`);
	deepStrictEqual(calls, ["/"]);
});

test("Svelte as a layout file", async function () {
	let results = (await getEleventy("stubs-layout").toJSON()).sort((a, b) => a.url.localeCompare(b.url));
	deepStrictEqual(results.map(({ url }) => url), ["/", "/svelte-page/"]);
	match(results[0].content, /^<!doctype html><title>Hello<\/title><style>main\.svelte-\w+ \{ color: rebeccapurple; \}<\/style><main data-title="Hello" class="svelte-\w+"><h1>Markdown content<\/h1>\n<\/main>\n$/);
	match(results[1].content, /^<!doctype html><title>Svelte page<\/title><style>main\.svelte-\w+ \{ color: rebeccapurple; \}<\/style><main data-title="Svelte page" class="svelte-\w+"><p>Svelte page content<\/p><\/main>\n$/);
});

test("<svelte:head> goes to the head bundle and filters are available via context", async function () {
	let [result] = await getEleventy("stubs-head").toJSON();
	strictEqual(result.content, `<head><meta name="description" content="Svelte"></head><a href="/about/">About</a>\n`);
});

test("Unchanged components skip rollup on the next build", async function () {
	let cacheDirectory = path.relative(".", path.join(dirname, "../.cache/build-test-incremental/"));
	await fs.promises.rm(cacheDirectory, { recursive: true, force: true });

	async function build() {
		let [result] = await getEleventy("stubs-a", { cacheDirectory }).toJSON();
		return result.content;
	}

	let first = await build();
	let { svelteToJs } = JSON.parse(await fs.promises.readFile(path.join(cacheDirectory, "eleventy-svelte.json"), "utf8"));
	let compiledFile = path.join(cacheDirectory, Object.values(svelteToJs)[0]);
	let { mtimeMs } = await fs.promises.stat(compiledFile);

	strictEqual(await build(), first);
	strictEqual((await fs.promises.stat(compiledFile)).mtimeMs, mtimeMs);
});
