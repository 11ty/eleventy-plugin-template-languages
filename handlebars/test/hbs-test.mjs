import { strictEqual } from "node:assert";
import { test, describe } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import handlebars from "handlebars";
import Eleventy from "@11ty/eleventy";

import HandlebarsPlugin from "../handlebarsConfig.js";

const dirname = path.dirname(import.meta.url);
const input = fileURLToPath(path.join(dirname, "stubs"));

async function getTestResults(configCallback, options = {}) {
	let elev = new Eleventy(input, undefined, {
		config: (eleventyConfig) => {
			eleventyConfig.addPlugin(HandlebarsPlugin, options);

			configCallback(eleventyConfig);
		},
	});

	return await elev.toJSON();
}

test("Handlebars standard template", async function () {
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("sample.hbs", "<p>{{ name }}</p>", {
			name: "Zach",
		});
	});

	strictEqual(result.content, `<p>Zach</p>`);
});

test("Handlebars permalink", async function () {
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("sample.hbs", "<p>{{ name }}</p>", {
			name: "this-is-a-url",
			permalink: "/{{name}}/"
		});
	});

	strictEqual(result.url, `/this-is-a-url/`);
});

describe("Escaped and unescaped output", () => {

	test("Handlebars unescaped output (no HTML)", async function () {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.hbs", "<p>{{{name}}}</p>", {
				name: "Zach",
			});
		});

		strictEqual(result.content, `<p>Zach</p>`);
	});

	test("Handlebars escaped output (HTML)", async function () {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.hbs", "<p>{{name}}</p>", {
				name: "<b>Zach</b>",
			});
		});

		strictEqual(result.content, `<p>&lt;b&gt;Zach&lt;/b&gt;</p>`);
	});

	test("Handlebars Unescaped Output (HTML)", async function () {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.hbs", "<p>{{{name}}}</p>", {
				name: "<b>Zach</b>",
			});
		});

		strictEqual(result.content, `<p><b>Zach</b></p>`);
	});
});

describe("Handlebars Partials", () => {
	test("Handlebars Partial", async function () {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.hbs", "<p>{{> included}}</p>", {});
		});

		strictEqual(result.content, `<p>This is an include.</p>`);
	});

	test("Handlebars Render Partial (Subdirectory)", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.hbs", "<p>{{> subfolder/included-subfolder}}</p>", {});
		});

		strictEqual(result.content, `<p>This is a subfolder include.</p>`);
	});

	test("Handlebars Partial with variable", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.hbs", "<p>{{> includedvar}}</p>", { name: "Zach" });
		});

		strictEqual(result.content, "<p>This is a Zach.</p>");
	});

	test("Handlebars Partial with parameter", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addTemplate("sample.hbs", "<p>{{> myPartial parameter=name }}</p>", { name: "Zach" });
		});

		strictEqual(result.content, "<p>The result is Zach</p>");
	});
});

test("Handlebars Library Override", async () => {
	let [result] = await getTestResults((eleventyConfig) => {
		eleventyConfig.addTemplate("sample.hbs", "<p>{{name}}</p>", { name: "Zach" });
	}, {
		eleventyLibraryOverride: handlebars,
	});

	strictEqual(result.content, "<p>Zach</p>");
});

describe("Handlebars using Universal Filters", () => {
	test("Filter", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addFilter("helpername", () => {
				return "FILTER";
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>This is a {{helpername}} {{name}}.</p>", { name: "Zach" });
		});

		strictEqual(result.content, "<p>This is a FILTER Zach.</p>");
	});

	test("Filter with Argument", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addFilter("helpername", (name) => {
				return "FILTER " + name;
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>This is a {{helpername name}}.</p>", { name: "Zach" });
		});

		strictEqual(result.content, "<p>This is a FILTER Zach.</p>");
	});

	test("Filter with String Argument", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addFilter("helpername", (name) => {
				return "FILTER " + name;
			});

			eleventyConfig.addTemplate("sample.hbs", `<p>This is a {{helpername "Not Zach"}}.</p>`, { name: "Zach" });
		});

		strictEqual(result.content, "<p>This is a FILTER Not Zach.</p>");
	});
});

describe("Handlebars using Universal Shortcodes", () => {
	test("Shortcode with context vars", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addShortcode("helpername", function() {
				// Data in context
				// Note Handlebars exposes all data while other template languages only expose { page }. See #741
				strictEqual(this.name, "Zach");
				strictEqual(this.page.url, "/sample/");

				return "SHORTCODE";
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>This is a {{helpername}} {{name}}.</p>", { name: "Zach" });
		});

		strictEqual(result.content, "<p>This is a SHORTCODE Zach.</p>");
	});

	test("Shortcode returns HTML content, with one argument (Issue #460)", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addShortcode("helpername", function(name) {
				return `<span>${name.toUpperCase()}</span>`;
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>This is a {{{helpername name}}}.</p>", { name: "Zach" });
		});

		strictEqual(result.content, "<p>This is a <span>ZACH</span>.</p>");
	});

	test("Shortcode with multiple args", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addShortcode("helpername", function(name, name2) {
				return `${name.toUpperCase()} ${name2.toUpperCase()}`;
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>This is a {{helpername name name2}}.</p>", { name: "Zach", name2: "Howdy" });
		});

		strictEqual(result.content, "<p>This is a ZACH HOWDY.</p>");
	});

	test("Shortcodes Raw Output Issue #436", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addShortcode("raw-helper", function (options) {
				return options.fn();
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>{{{{raw-helper}}}}{{bar}}{{{{/raw-helper}}}}</p>", { bar: "Zach" });
		});

		strictEqual(result.content, "<p>{{bar}}</p>");
	});

	test("Shortcodes Raw Output Issue #436 with an if statement", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addShortcode("raw-helper", function (options) {
				return options.fn();
			});

			eleventyConfig.addTemplate("sample.hbs", `{{{{raw-helper}}}}{{#if ready}}
<p>Ready</p>
{{/if}}{{{{/raw-helper}}}}`);
		});

		strictEqual(result.content, `{{#if ready}}
<p>Ready</p>
{{/if}}`);
	});

	test("Shortcodes #each with Global Variable (Issue #759)", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addShortcode("raw-helper", function (options) {
				return options.fn();
			});

			eleventyConfig.addTemplate("sample.hbs", `<ul>{{#each navigation as |navItem|}}<li><a href={{navItem.link}}>{{../name}}{{navItem.text}}</a></li>{{/each}}</ul>`, {
				name: "Zach",
				navigation: [{ link: "a", text: "text" }],
			});
		});

		strictEqual(result.content, `<ul><li><a href=a>Zachtext</a></li></ul>`);
	});

	test("Async shortcode", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addShortcode("asynchelper", async function() {
				let ret = await new Promise(resolve => {
					setTimeout(() => resolve("Hello"), 200);
				});
				strictEqual(ret, "Hello");
				return ret;
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>This is a {{asynchelper}}.</p>", { name: "Zach" });
		});

		// Async is not supported
		// We return the promise here to make it clear that Handlebars isn’t async-friendly.
		// Alternatively, if we filtered out the async shortcodes it would return "<p>This is a .</p>" which makes less sense.
		strictEqual(result.content, "<p>This is a [object Promise].</p>");
	});
});

describe("Handlebars using Universal Paired Shortcodes", () => {
	test("Paired Shortcode", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addPairedShortcode("helpername", function (content) {
				// Data in context
				// Note Handlebars exposes all data while other template languages only expose { page }. See #741
				strictEqual(this.name, "Zach");
				strictEqual(this.page.url, "/sample/");

				return `BEFORE${content}AFTER`;
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>{{#helpername}}{{name}}{{/helpername}}</p>", { name: "Zach" });
		});

		strictEqual(result.content, "<p>BEFOREZachAFTER</p>");
	});

	test("Paired Shortcode with HTML content", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addPairedShortcode("helpername", function (content) {
				return `BEFORE${content}AFTER`;
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>{{#helpername}}<span>Testing</span>{{/helpername}}</p>", { name: "Zach" });
		});

		strictEqual(result.content, "<p>BEFORE<span>Testing</span>AFTER</p>");
	});

	test("Paired Shortcode with HTML content (spaces)", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addPairedShortcode("helpername", function (content, name) {
				return `BEFORE${name} ${content}AFTER`;
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>{{# helpername name }}Test{{/ helpername }}</p>", { name: "Zach" });
		});

		strictEqual(result.content, "<p>BEFOREZach TestAFTER</p>");
	});
});

describe("Handlebars using mixed Shortcodes", () => {
	test("Shortcodes, nested", async () => {
		let [result] = await getTestResults((eleventyConfig) => {
			eleventyConfig.addShortcode("child", function (txt) {
				return txt;
			});

			eleventyConfig.addPairedShortcode("parent", function (content, name, name2) {
				return `${content} ${name} ${name2}`;
			});

			eleventyConfig.addTemplate("sample.hbs", "<p>{{# parent name name2 }}{{child 'Child'}}{{/ parent }}</p>", { name: "Zach", name2: "Howdy" });
		});

		strictEqual(result.content, "<p>Child Zach Howdy</p>");
	});
});
