import { test } from "node:test";
import assert from "node:assert";
import path from "node:path";
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

test("findFiles with includes and layouts outside the input directory", async () => {
	let stubs = path.relative(".", path.join(import.meta.dirname, "stubs-b"));
	let ev = new VueCompiler();
	ev.setCacheDir(".cache");
	ev.setInputDir(stubs);
	ev.setIncludesDir("../stubs-c/_includes");
	ev.setLayoutsDir("../stubs-d/_includes");
	ev.resetIgnores();

	let files = (await ev.findFiles()).map(file => path.relative(stubs, file).split(path.sep).join("/")).sort();
	assert.deepEqual(files, [
		"../stubs-c/_includes/child.vue",
		"../stubs-c/_includes/grandchild.vue",
		"../stubs-d/_includes/child.vue",
		"../stubs-d/_includes/grandchild.vue",
		"_includes/child.vue",
		"_includes/grandchild.vue",
		"data.vue",
	]);
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

	assert.equal(normalizeNewLines(ev.getCSSForComponentTree("./vue/test/stubs-c/data.vue").join("\n")), `#grandchild { color: yellow;
}
#child { color: green;
}
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

	assert.equal(normalizeNewLines(ev.getCSSForComponentTree("./vue/test/stubs-d/data.vue").join("\n")), `#grandchild { color: yellow;
}
#child { color: green;
}
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

	let bundle = await ev.getBundle();
	let output = await ev.write(bundle);

	ev.createVueComponents(output);

	assert.equal(normalizeNewLines(ev.getCSSForComponent("./vue/test/stubs-e/data.vue")), `body {
	background-color: blue;
}`);

	assert.equal(normalizeNewLines(ev.getCSSForComponentTree("./vue/test/stubs-e/data.vue").join("\n")), `body {
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

	assert.equal(normalizeNewLines(ev.getCSSForComponentTree("./vue/test/stubs-postcss/data.vue").join("\n")), `body {
	background-color: blue;
}
body {
		color: black;
}`);
});

test("Child component data is per-instance with async serverPrefetch (eleventy-plugin-vue#46)", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-test-serverprefetch");
	ev.setInputDir("vue/test/stubs-serverprefetch");
	ev.setIncludesDir("_includes");

	let bundle = await ev.getBundle();
	ev.createVueComponents(await ev.write(bundle));

	let component = ev.getComponent("./vue/test/stubs-serverprefetch/index.vue");
	let data = { page: { url: "/" }, eleventy: { generator: "Eleventy" }, buildawesome: { generator: "Build Awesome" } };
	assert.equal(await ev.renderComponent(component, data), `<div><!--[--><p>A Eleventy Build Awesome</p><p>B Eleventy Build Awesome</p><p>C Eleventy Build Awesome</p><!--]--></div>`);
	assert.deepEqual(Object.keys(data), ["page", "eleventy", "buildawesome"]);
});

test("findFiles returns sorted results", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir(".cache");
	ev.setInputDir(path.relative(".", path.join(import.meta.dirname, "stubs-b")));
	ev.setIncludesDir("../stubs-c/_includes");
	ev.resetIgnores();

	let files = await ev.findFiles();
	assert.deepEqual(files, [...files].sort());
});

test("Directory comparisons don’t match sibling directories with the same prefix", async () => {
	let stubs = path.relative(".", path.join(import.meta.dirname, "stubs-prefix"));
	let ev = new VueCompiler();
	ev.setCacheDir(".cache");
	ev.setInputDir(stubs);
	ev.setIncludesDir("../stubs-prefix-includes");
	ev.resetIgnores();

	let files = (await ev.findFiles()).map(file => path.relative(stubs, file).split(path.sep).join("/"));
	assert.deepEqual(files, ["../stubs-prefix-includes/child.vue", "index.vue"]);

	let ev2 = getEvInstance();
	assert.equal(ev2.isIncludeFile(path.join(ev2.inputDir, "components-legacy", "test.vue")), false);
});

test("Component tree CSS loads from the rollup output cache", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-test-readonly");
	ev.setInputDir("vue/test/stubs-c");
	ev.setIncludesDir("_includes");
	ev.createVueComponents(await ev.write(await ev.getBundle()));
	await ev.writeRollupOutputCache();

	let cached = new VueCompiler();
	cached.setCacheDir("vue/.cache/vue-test-readonly");
	cached.setReadOnly(true);
	assert.ok(cached.hasRollupOutputCache());
	await cached.loadRollupOutputCache();

	assert.deepEqual(cached.getCSSForComponentTree("./vue/test/stubs-c/data.vue"), ev.getCSSForComponentTree("./vue/test/stubs-c/data.vue"));
	assert.equal(cached.getCSSForComponentTree("./vue/test/stubs-c/data.vue").length, 3);
});

test("Dynamically imported component (plugin-template-languages#49)", async () => {
	let ev = new VueCompiler();
	ev.setCacheDir("vue/.cache/vue-test-dynamic-import");
	ev.setInputDir("vue/test/stubs-dynamic-import");
	ev.setIncludesDir("_includes");
	ev.createVueComponents(await ev.write(await ev.getBundle()));

	let component = ev.getComponent("./vue/test/stubs-dynamic-import/index.vue");
	assert.equal(await ev.renderComponent(component, {}), `<div><p>Dynamic child</p></div>`);
});
