import { strictEqual } from "node:assert";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import haml from "hamljs";
import Eleventy from "@11ty/eleventy";

import HamlPlugin from "../hamlConfig.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.relative(".", path.join(dirname, "stubs"));

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

test('Haml built-in filter', async function () {
  // Haml needs spaces for indents; tabs are a syntax error.
  const template = `
:cdata
  foo`;

  let [result] = await getTestResults((eleventyConfig) => {
    eleventyConfig.addTemplate("sample.haml", template, {});
  });

  const expectedContent = `<![CDATA[
foo
]]>`;
  strictEqual(result.content.trim(), expectedContent);
});

test('Eleventy built-in universal filter', async function () {
  // Haml needs spaces for indents; tabs are a syntax error.
  const template =`
:slugify
  My String
`;

  let [result] = await getTestResults((eleventyConfig) => {
    eleventyConfig.addTemplate("sample.haml", template, {foo: 'bar'});
  });

  strictEqual(result.content.trim(), 'my-string');
});

test('User-defined universal filter', async function () {
  const myFilter = (string) => `FILTERED[${string}]`
  const string = 'a string variable'

  // Haml needs spaces for indents; tabs are a syntax error.
  const template =`
:my_filter
  ${string}
`;

  let [result] = await getTestResults((eleventyConfig) => {
    eleventyConfig.addFilter('my_filter', myFilter);
    eleventyConfig.addTemplate("sample.haml", template, {foo: 'bar'});
  });

  strictEqual(result.content.trim(), myFilter(string));
});
