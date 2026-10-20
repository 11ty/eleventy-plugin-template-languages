import { test } from "node:test";
import assert from "node:assert";
import Eleventy from "@11ty/eleventy";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pkg = require("../package.json");

function normalize(str) {
  return str.trim().replace(/\r\n/g, "\n");
}

test("Sample page (webc layout)", async () => {
	let elev = new Eleventy("./webc/test/sample-1/page.webc", "./webc/test/sample-1/_site", {
		configPath: "./webc/test/sample-1/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<!doctype html>
<html lang="en">
<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
		
		
	</head>
	<body>
		<say-hello></say-hello>
<say-hello></say-hello>
WHO IS THIS
hi
<span>HELLO FROM FRONT MATTER</span>

		
		
	
</body>
</html>`);
});

test("Sample page (liquid layout and one webc component)", async () => {
	let elev = new Eleventy("./webc/test/sample-non-webc-layout/page.webc", "./webc/test/sample-non-webc-layout/_site", {
		configPath: "./webc/test/sample-non-webc-layout/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
		<style>* { color: red; }</style>
		
	</head>
	<body>
		<say-hello>HELLO
</say-hello>
<say-hello>HELLO
</say-hello>
WHO IS THIS
hi
<span>HELLO FROM FRONT MATTER</span>

		
		
	</body>
</html>`);
});

test("Sample page with global component", async () => {
	let elev = new Eleventy("./webc/test/sample-2/page.webc", "./webc/test/sample-2/_site", {
		configPath: "./webc/test/sample-2/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<!doctype html>
<html lang="en">
<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
		
		
	</head>
	<body>
		This is a component.
This is a component.
WHO IS THIS
hi
<span>HELLO FROM FRONT MATTER</span>

		
		
	
</body>
</html>`);
});

test("Page with front matter no-import components", async () => {
	let elev = new Eleventy("./webc/test/sample-page-global-components/page.webc", "./webc/test/sample-page-global-components/_site", {
		configPath: "./webc/test/sample-page-global-components/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<!doctype html>
<html lang="en">
<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
		
		
	</head>
	<body>
		HELLO
HELLO
WHO IS THIS
hi
<span>HELLO FROM FRONT MATTER</span>

		
		
	
</body>
</html>`);
});


test("Page with front matter no-import components (relative to input path)", async () => {
	let elev = new Eleventy("./webc/test/sample-page-global-components-relative-to-inputpath/page.webc", "./webc/test/sample-page-global-components-relative-to-inputpath/_site", {
		configPath: "./webc/test/sample-page-global-components-relative-to-inputpath/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<!doctype html>
<html lang="en">
<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
		
		
	</head>
	<body>
		HELLO
HELLO
WHO IS THIS
hi
<span>HELLO FROM FRONT MATTER</span>

		
		
	
</body>
</html>`);
});

test("WebC using a transform", async () => {
	let elev = new Eleventy("./webc/test/sample-transform/", "./webc/test/sample-transform/_site", {
		configPath: "./webc/test/sample-transform/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<say-hello>HELLO<span>${pkg.version}</span><style>/* Hello */</style></say-hello>
<say-hello>HELLO<span>${pkg.version}</span><style>/* Hello */</style></say-hello>
WHO IS THIS
hi
<span>HELLO FROM FRONT MATTER</span>`);
});

test("WebC using htmlTemplateEngine", async () => {
	let elev = new Eleventy("./webc/test/sample-html-preprocess/", "./webc/test/sample-html-preprocess/_site", {
		configPath: "./webc/test/sample-html-preprocess/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `HELLO<span>${pkg.version}</span>
HELLO<span>${pkg.version}</span>
WHO IS THIS
hi`);
});

test("Sample page with permalink: false (issue #9)", async () => {
	let elev = new Eleventy("./webc/test/sample-permalink-false/", "./webc/test/sample-permalink-false/_site", {
		configPath: "./webc/test/sample-permalink-false/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
	</head>
	<body>

	</body>
</html>`);
});

test("Sample WebC page with permalink: false (issue #86)", async () => {
	let elev = new Eleventy("./webc/test/sample-permalink-false-webc/", "./webc/test/sample-permalink-false-webc/_site", {
		configPath: "./webc/test/sample-permalink-false-webc/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<!doctype html>
<html lang="en">
<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content>
		<title></title>
	</head>
	<body>
</body>
</html>`);
});

test("Add JS Functions as helpers (universal filters) (issue #3)", async () => {
	let elev = new Eleventy("./webc/test/sample-universal-helpers/", "./webc/test/sample-universal-helpers/_site", {
		configPath: "./webc/test/sample-universal-helpers/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<!doctype html>
<html lang="en">
<head>
		<title></title>
	</head>
	<body>helloAlways return this/page/</body>
</html>`);
});

test("Use render plugin #22", async () => {
	let elev = new Eleventy("./webc/test/render-plugin/page.md", "./webc/test/render-plugin/_site", {
		configPath: "./webc/test/render-plugin/eleventy.config.mjs"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<h1>Hello</h1>
<p>My component</p>`);
});

test("UID leftovers #17", async () => {
	let elev = new Eleventy("./webc/test/uid-leftovers/page.webc", "./webc/test/uid-leftovers/_site", {
		configPath: "./webc/test/uid-leftovers/eleventy.config.js"
	});

	await elev.toJSON();

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<!doctype html>
<html>
<head>
		<title></title>
		<style>#webc-2 {}</style>
	</head>
	<body>
</body>
</html>`);
});

test("Custom permalink JS, issue #27", async () => {
	let elev = new Eleventy("./webc/test/custom-permalink/page.webc", "./webc/test/custom-permalink/_site", {
		configPath: "./webc/test/custom-permalink/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(result.url, "/hello-from-front-matter.html")
	assert.equal(normalize(result.content), `<say-hello></say-hello>
<say-hello></say-hello>
WHO IS THIS
hi
<span>HELLO FROM FRONT MATTER</span>`);
});

test("Raw layout html to re-enable reprocessing mode in layouts, issue #20", async () => {
	let elev = new Eleventy("./webc/test/raw-layout-html/page.webc", "./webc/test/raw-layout-html/_site", {
		configPath: "./webc/test/raw-layout-html/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;
	assert.equal(normalize(result.content), `<!doctype html>
<html lang="en">
<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
		<style>/* <reprocess-me>Hello</reprocess-me> */</style>
	</head>
	<body>
		<say-hello><reprocess-me>Using raw here to test reprocessing in the layout</reprocess-me>
</say-hello>
<say-hello><reprocess-me>Using raw here to test reprocessing in the layout</reprocess-me>
</say-hello>
WHO IS THIS
hi
<span>HELLO FROM FRONT MATTER</span>
		REPROCESSED
	
</body>
</html>`);
});


test("Shortcodes, issue #16", async () => {
	let elev = new Eleventy("./webc/test/shortcodes-issue-16/page.webc", "./webc/test/shortcodes-issue-16/_site", {
		configPath: "./webc/test/shortcodes-issue-16/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;
	assert.equal(normalize(result.content), `HELLO FROM FRONT MATTER
<undefined-component></undefined-component>COMPONENTS DIR
LOWERCASE`);
});

test("Nested layouts", async () => {
	let elev = new Eleventy("./webc/test/nested-layouts/page.webc", "./webc/test/nested-layouts/_site", {
		configPath: "./webc/test/nested-layouts/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;
	assert.equal(normalize(result.content), `<!doctype html>
<html lang="en">
<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
		<style>/* <reprocess-me>Hello</reprocess-me> */</style>
	</head>
	<body>
		Base
Testing

<style>/* <reprocess-me>Hello</reprocess-me> */</style>
	
</body>
</html>`);
});

test("Components in layouts #11", async () => {
	let elev = new Eleventy("./webc/test/components-in-layouts/", "./webc/test/components-in-layouts/_site", {
		configPath: "./webc/test/components-in-layouts/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [page1] = results.filter(page => page.inputPath.endsWith("page1.webc"));
	let [page2] = results.filter(page => page.inputPath.endsWith("page2.webc"));
	let [page3] = results.filter(page => page.inputPath.endsWith("page3.webc"));

	assert.equal(normalize(page1.content), `<!doctype html>
<html lang="en">
<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
		<style>/* Inner CSS */
/* Outer CSS */</style>
	</head>
	<body>
		Page
<inner>Test
</inner>
		<outer>Test
</outer>
	
</body>
</html>`);

assert.equal(normalize(page2.content), `<!doctype html>
<html lang="en">
<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
		<style>/* Inner CSS */
/* Outer CSS */</style>
	</head>
	<body>
		Other page
<inner>Test
</inner>
		<outer>Test
</outer>
	
</body>
</html>`);

assert.equal(normalize(page3.content), `No layouts here
<style>/* Outer CSS */</style>
<outer>Test
</outer>`);
});


test("Helpers in the bundler", async () => {
	let elev = new Eleventy("./webc/test/bundler-helpers/index.webc", "./webc/test/bundler-helpers/_site", {
		configPath: "./webc/test/bundler-helpers/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<style>/* Bundle 2 */
/* Bundle 1 */</style>
<style>/* Bundle 2 */
/* Bundle 1 */</style>`);
});

test("page with `javascript` front matter", async () => {
	let elev = new Eleventy("./webc/test/custom-js-front-matter/", "./webc/test/custom-js-front-matter/_site", {
		configPath: "./webc/test/custom-js-front-matter/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<span>HELLO FROM FRONT MATTER</span>`);
});

test("Custom permalink JS, issue #32", async () => {
	let elev = new Eleventy("./webc/test/custom-permalink-issue-32/page.webc", "./webc/test/custom-permalink-issue-32/_site", {
		configPath: "./webc/test/custom-permalink-issue-32/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(result.url, "/page.html")
});

// waiting on https://github.com/11ty/eleventy/issues/2823
// ref: https://github.com/11ty/eleventy-plugin-webc/issues/32#issuecomment-1440831590
test("Custom permalink JS, `dynamicPermalink: false` issue #32", async () => {
	let elev = new Eleventy("./webc/test/custom-permalink-not-dynamic-issue-32/page.webc", "./webc/test/custom-permalink-not-dynamic-issue-32/_site", {
		configPath: "./webc/test/custom-permalink-not-dynamic-issue-32/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(result.url, "/page.html")
});

test("WebC components in liquid layout, issue #35", async () => {
	let elev = new Eleventy("./webc/test/webc-component-in-layout/page.liquid", "./webc/test/webc-component-in-layout/_site", {
		configPath: "./webc/test/webc-component-in-layout/eleventy.config.mjs"
	});

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(normalize(result.content), `<html lang="en">
<head>
<style>.wpwyzh6rm button{color:firebrick}</style>
<script type="module">alert("test")</script>
</head>
<body><twitter-share class="wpwyzh6rm"><button type="button" class="nes-btn">Share Tweet</button>



</twitter-share>
Hello
</body>
</html>`);
});

test("Permalink string, issue #52", async () => {
	let elev = new Eleventy("./webc/test/permalink-string/", "./webc/test/permalink-string/_site", {
		configPath: "./webc/test/permalink-string/eleventy.config.js"
	});

	let results = await elev.toJSON();
	let [result1, result2] = results.sort((a, b) => a.inputPath < b.inputPath ? -1 : 1);

	assert.equal(result1.url, "/");
	assert.equal(result2.url, "/index2.html");
});

test("Using file system bundles, issue #4", async () => {
	let elev = new Eleventy("./webc/test/bundler-to-file/", "./webc/test/bundler-to-file/_site", {
		configPath: "./webc/test/generic.eleventy.config.js"
	});

	let [result] = await elev.toJSON();
	assert.equal(normalize(result.content), `<link rel="stylesheet" type="text/css" href="/TJO8QCgik9.css">`);

	// TODO test actual file output when https://github.com/11ty/eleventy-plugin-bundle/issues/4 is fixed
	// let [ passthroughCopy, results ] = await elev.write();
	// let [ result ] = results;
	// assert.equal(normalize(result.content), `<link rel="stylesheet" type="text/css" href="/TJO8QCgik9.css">`);

	// fs.unlinkSync("./webc/test/bundler-to-file/_site/index.html")
	// fs.rmdirSync("./webc/test/bundler-to-file/_site/")
});

test("Page with bundled scripts and styles from components", async () => {
	let elev = new Eleventy(
		"./webc/test/script-and-style-buckets/page.webc",
		"./webc/test/script-and-style-buckets/_site",
		{
			configPath: "./webc/test/script-and-style-buckets/eleventy.config.mjs",
		}
	);

	let results = await elev.toJSON();
	let [result] = results;

	assert.equal(
		normalize(result.content),
		`<!doctype html>
<html lang="en">
<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="description" content="">
		<title></title>
		<style>button {
		background: rebeccapurple;
	}</style>
		<script>console.log("Hello world!")</script>
	</head>
	<body>
		<h1>Hello everyone!</h1>
<button>Buttons are purple</button>




		<style>h1 { color: red; }</style>
		<script>console.log("Hello world but deferred!")</script>
	

</body>
</html>`
	);
});

test("Excluded files skip bundling (permalink: false), issue #59", async () => {
	let elev = new Eleventy("./webc/test/excluded-files/page.webc", "./webc/test/excluded-files/_site", {
		configPath: "./webc/test/generic.eleventy.config.js"
	});

	let [result] = await elev.toJSON();
	assert.equal(normalize(result.content), `<h1>Testing</h1>`);
});

test("Global data from component, $data (pull #80)", async () => {
	let elev = new Eleventy("./webc/test/global-data/page.webc", "./webc/test/global-data/_site", {
		configPath: "./webc/test/global-data/eleventy.config.js"
	});

	let [result] = await elev.toJSON();

	assert.equal(normalize(result.content), `<dl>
	
		<dt>key1</dt>
		<dd>val1</dd>
	

		<dt>key2</dt>
		<dd>val2</dd>
	

		<dt>key3</dt>
		<dd>val3</dd>
	
</dl>`);
});

test("renderFile of WebC in a permalink: false page, issue #59", async () => {
	let elev = new Eleventy("./webc/test/render-file-permalink-false/page.njk", "./webc/test/render-file-permalink-false/_site", {
		configPath: "./webc/test/render-file-permalink-false/eleventy.config.js"
	});

	let [result] = await elev.toJSON();
	assert.equal(normalize(result.content), `<h1>Testing</h1>`);
});
