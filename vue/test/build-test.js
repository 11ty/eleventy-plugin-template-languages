import { strictEqual, ok } from "node:assert";
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
