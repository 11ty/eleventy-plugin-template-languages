import { test } from "node:test";
import assert from "node:assert";
import path from "node:path";
import { InlineCodeManager } from "@11ty/eleventy-assets";
import postcssNested from "postcss-nested";

import VueCompiler from "../VueCompiler.js";

function getEvInstance() {
	let ev = new VueCompiler();
	ev.setCacheDir(".cache");
	ev.setInputDir("src");
	ev.setIncludesDir("components");
	return ev;
}

function normalizeNewLines(str) {
	return str.replace(/\r\n/g, "\n");
}

test("Directories", () => {
	let ev = getEvInstance();
	assert.equal(ev.cacheDir, ".cache");
	assert.equal(ev.inputDir, path.join(process.cwd(), "src"));
	assert.equal(ev.includesDir, path.join(process.cwd(), "src/components"));
	assert.equal(ev.isIncludeFile(path.join(ev.includesDir, "test.vue")), true);
	assert.equal(ev.isIncludeFile(path.join(ev.inputDir, "test.vue")), false);
});

test("Relative Directories", () => {
	let ev = new VueCompiler();
	ev.setCacheDir(".cache");
	ev.setInputDir("src");
	ev.setIncludesDir("../components");
	ev.setLayoutsDir("../layouts");

	assert.equal(ev.inputDir, path.join(process.cwd(), "src"));
	assert.equal(ev.includesDir, path.join(process.cwd(), "components"));
	assert.equal(ev.layoutsDir, path.join(process.cwd(), "layouts"));

	// ignores should not include layouts/includes even though they were passed from eleventy.ignores event
	assert.deepEqual(Array.from(ev.ignores), []);
});

test("Can use relative path for cache directory", () => {
	let ev = getEvInstance();
	ev.setCacheDir(".cache");
	assert.ok(ev.workingDir);
	assert.equal(ev.getFullCacheDir(), path.join(ev.workingDir, ".cache"));
});

test("Can use absolute path for cache directory", () => {
	let ev = getEvInstance();
	ev.setCacheDir("/tmp");
	assert.equal(ev.getFullCacheDir(), "/tmp");
});

test("getLocalVueFilePath", () => {
	let ev = getEvInstance();
	assert.equal(ev.getLocalVueFilePath(path.join(ev.inputDir, "test.vue")), VueCompiler.normalizeOperatingSystemFilePath("./src/test.vue"));
	assert.equal(ev.getLocalVueFilePath(path.join(ev.includesDir, "test.vue")), VueCompiler.normalizeOperatingSystemFilePath("./src/components/test.vue"));
	assert.equal(ev.getLocalVueFilePath(path.join(ev.inputDir, "test.vue?query=param")), VueCompiler.normalizeOperatingSystemFilePath("./src/test.vue"));
	assert.equal(ev.getLocalVueFilePath(path.join(ev.includesDir, "test.vue?query=param")), VueCompiler.normalizeOperatingSystemFilePath("./src/components/test.vue"));
	assert.equal(ev.getLocalVueFilePath(path.join(ev.inputDir, "press", "press-release.vue?rollup-plugin-vue=styles.0.css")), VueCompiler.normalizeOperatingSystemFilePath("./src/press/press-release.vue"));
});

test("Vue SFC Render", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-test-a");
	ev.setInputDir("vue/test/stubs-a");
	ev.setIncludesDir("_includes");

	let files = await ev.findFiles();
	let bundle = await ev.getBundle(files);
	let output = await ev.write(bundle);

	ev.createVueComponents(output);
	assert.equal(output.length, 9);

	let component = ev.getComponent("./vue/test/stubs-a/data.vue");
	assert.equal(await ev.renderComponent(component, {
		page: {
			url: "/some-url/"
		}
	}), `<div><p>/some-url/</p><p>HELLO</p><div id="child"></div></div>`);
});

test("Vue SFC Render (one input file)", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-test-b");
	ev.setInputDir("vue/test/stubs-b");
	ev.setIncludesDir("_includes");

	let filepath = VueCompiler.normalizeOperatingSystemFilePath("./vue/test/stubs-b/data.vue");
	let inputFile = path.join(process.cwd(), filepath);
	let files = [inputFile];
	let bundle = await ev.getBundle(files);
	let output = await ev.write(bundle);

	ev.createVueComponents(output);
	assert.equal(output.length, 9);

	let component = ev.getComponent("./vue/test/stubs-b/data.vue");

	assert.equal(await ev.renderComponent(component, {
		page: {
			url: "/some-url/"
		}
	}), `<div><p>/some-url/</p><p>HELLO</p><div id="child"></div></div>`);
});

test("Vue SFC CSS", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-test-c");
	ev.setInputDir("vue/test/stubs-c");
	ev.setIncludesDir("_includes");

	let cssMgr = new InlineCodeManager();
	ev.setCssManager(cssMgr);

	let files = await ev.findFiles();
	let bundle = await ev.getBundle(files);
	let output = await ev.write(bundle);

	ev.createVueComponents(output);
	assert.equal(output.length, 9);

	assert.equal(normalizeNewLines(ev.getCSSForComponent("./vue/test/stubs-c/data.vue")), `body {
	background-color: blue;
}
body {
	background-color: pink;
}`);

	assert.equal(normalizeNewLines(ev.getCSSForComponent("./vue/test/stubs-c/_includes/child.vue")), `#child { color: green;
}`);

	let componentName = ev.getJavaScriptComponentFile("./vue/test/stubs-c/data.vue");
	cssMgr.addComponentForUrl(componentName, "/data/");

	assert.equal(normalizeNewLines(cssMgr.getCodeForUrl("/data/")), `/* _includes/grandchild.js Component */
#grandchild { color: yellow;
}
/* _includes/child.js Component */
#child { color: green;
}
/* data.js Component */
body {
	background-color: blue;
}
body {
	background-color: pink;
}`);
});

test("Vue SFC CSS (one input file)", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-test-d");
	ev.setInputDir("vue/test/stubs-d");
	ev.setIncludesDir("_includes");

	let cssMgr = new InlineCodeManager();
	ev.setCssManager(cssMgr);

	let inputFile = path.join(process.cwd(), "vue/test/stubs-d/data.vue");
	let files = [inputFile];
	let bundle = await ev.getBundle(files);
	let output = await ev.write(bundle);

	ev.createVueComponents(output);
	assert.equal(output.length, 9);

	assert.equal(normalizeNewLines(ev.getCSSForComponent("./vue/test/stubs-d/data.vue")), `body {
	background-color: blue;
}
body {
	background-color: pink;
}`);

	assert.equal(normalizeNewLines(ev.getCSSForComponent("./vue/test/stubs-d/_includes/child.vue")), `#child { color: green;
}`);

	let componentName = ev.getJavaScriptComponentFile("./vue/test/stubs-d/data.vue");
	cssMgr.addComponentForUrl(componentName, "/data/");

	assert.equal(normalizeNewLines(cssMgr.getCodeForUrl("/data/")), `/* _includes/grandchild.js Component */
#grandchild { color: yellow;
}
/* _includes/child.js Component */
#child { color: green;
}
/* data.js Component */
body {
	background-color: blue;
}
body {
	background-color: pink;
}`);
});

test("Vue SFC CSS (one component, no children) Issue #10", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-test-e");
	ev.setInputDir("vue/test/stubs-e");
	ev.setIncludesDir("_includes");

	let cssMgr = new InlineCodeManager();
	ev.setCssManager(cssMgr);

	let bundle = await ev.getBundle();
	let output = await ev.write(bundle);

	ev.createVueComponents(output);

	assert.equal(normalizeNewLines(ev.getCSSForComponent("./vue/test/stubs-e/data.vue")), `body {
	background-color: blue;
}`);

	let componentName = ev.getJavaScriptComponentFile("./vue/test/stubs-e/data.vue");
	cssMgr.addComponentForUrl(componentName, "/data/");

	assert.equal(normalizeNewLines(cssMgr.getCodeForUrl("/data/")), `/* data.js Component */
body {
	background-color: blue;
}`);
});

test.skip("Vue as Layout file (Issue #26)", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-test-layout");
	ev.setInputDir("vue/test/stubs-layout");
	ev.setIncludesDir("_includes", true);
	assert.deepEqual(Array.from(ev.ignores), []);

	let files = await ev.findFiles();
	assert.equal(files.length, 2);

	let bundle = await ev.getBundle(files);
	let output = await ev.write(bundle);

	ev.createVueComponents(output);

	let component = ev.getComponent("./vue/test/stubs-layout/page.vue");

	assert.equal(await ev.renderComponent(component, {
		page: {
			url: "/some-url/"
		}
	}), `<html lang="en">
	<title></title>
	<div data-server-rendered="true">Child content</div>
</html>`);
});

test("Vue SFC Data Leak", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-data-leak");
	ev.setInputDir("vue/test/stubs-data-leak");

	let files = await ev.findFiles();
	let bundle = await ev.getBundle(files);
	let output = await ev.write(bundle);
	ev.createVueComponents(output);
	assert.equal(output.length, 3);

	let component = ev.getComponent("./vue/test/stubs-data-leak/index.vue");

	let data = {
		events: [
			{a: 1, b: 2},
			{c: 3, d: 4},
		]
	};

	assert.equal(await ev.renderComponent(component, data), `<div>[{"a":1,"b":2},{"c":3,"d":4}]</div>`);
	assert.equal(await ev.renderComponent(component, data), `<div>[{"a":1,"b":2},{"c":3,"d":4}]</div>`);
	assert.equal(await ev.renderComponent(component, data), `<div>[{"a":1,"b":2},{"c":3,"d":4}]</div>`);
});

test("Vue SFC CSS postcss Plugin", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-test-postcss");
	ev.setInputDir("vue/test/stubs-postcss");
	ev.setIncludesDir("_includes");

	ev.setRollupOptions({
		external: ["testtesttest"]
	});

	ev.setRollupPluginVueOptions({
		postcssPlugins: [
			postcssNested
		]
	});

	let rollupOptions = ev.getMergedRollupOptions();
	assert.deepEqual(rollupOptions.external, [
		"vue",
		"vue/server-renderer",
		"@vue/server-renderer",
		"testtesttest"
	]);
	assert.equal(rollupOptions.plugins.length, 2);

	let cssMgr = new InlineCodeManager();
	ev.setCssManager(cssMgr);

	let files = await ev.findFiles();
	let bundle = await ev.getBundle(files);
	let output = await ev.write(bundle);

	ev.createVueComponents(output);
	assert.equal(output.length, 3);

	assert.equal(normalizeNewLines(ev.getCSSForComponent("./vue/test/stubs-postcss/data.vue")), `body {
	background-color: blue;
}
body {
		color: black;
}`);

	let componentName = ev.getJavaScriptComponentFile("./vue/test/stubs-postcss/data.vue");
	cssMgr.addComponentForUrl(componentName, "/data/");

	assert.equal(normalizeNewLines(cssMgr.getCodeForUrl("/data/")), `/* data.js Component */
body {
	background-color: blue;
}
body {
		color: black;
}`);
});
