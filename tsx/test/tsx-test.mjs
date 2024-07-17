import { strictEqual } from "node:assert";
import { test } from "node:test";

import Eleventy from "@11ty/eleventy";
import JsxPlugin from "../tsxConfig.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(import.meta.url);
const input = fileURLToPath(path.join(dirname, "stubs"));

export async function getTestResults(configCallback) {
	let elev = new Eleventy(input, undefined, {
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(JsxPlugin);

			configCallback(eleventyConfig);
		},
	});

	return await elev.toJSON();
}

test("TSX standard template", async function () {
	const md = `---
layout: MainLayout.11ty.tsx
---
The body goes here.
`;
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("hello.md", md, {
			name: "Zach",
		});
	});

	const expected = `<body><h1>Zach</h1><div><p>The body goes here.</p>\n</div></body>`

	strictEqual(result.content, expected);
});
