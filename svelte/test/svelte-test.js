import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

import SvelteCompiler from "../SvelteCompiler.js";

function getInstance() {
	let sc = new SvelteCompiler();
	sc.setCacheDir(".cache");
	sc.setInputDir("src");
	sc.setIncludesDir("components");
	return sc;
}

async function build(name, options = {}) {
	let sc = new SvelteCompiler();
	sc.setCacheDir(`svelte/.cache/svelte-test-${name}`);
	sc.setInputDir(`svelte/test/stubs-${name}`);
	sc.setIncludesDir("_includes");
	if (options.preprocess) {
		sc.setPreprocess(options.preprocess);
	}
	let output = await sc.write(await sc.getBundle(options.input));
	sc.createComponents(output);
	return { sc, output };
}

test("Directories", () => {
	let sc = getInstance();
	assert.equal(sc.cacheDir, ".cache");
	assert.equal(sc.inputDir, path.join(process.cwd(), "src"));
	assert.equal(sc.includesDir, path.join(process.cwd(), "src/components"));
	assert.equal(sc.isIncludeFile(path.join(sc.includesDir, "test.svelte")), true);
	assert.equal(sc.isIncludeFile(path.join(sc.inputDir, "test.svelte")), false);
	assert.equal(sc.isIncludeFile(path.join(sc.inputDir, "components-legacy", "test.svelte")), false);
});

test("Relative Directories", () => {
	let sc = new SvelteCompiler();
	sc.setInputDir("src");
	sc.setIncludesDir("../components");
	sc.setLayoutsDir("../layouts");

	assert.equal(sc.includesDir, path.join(process.cwd(), "components"));
	assert.equal(sc.layoutsDir, path.join(process.cwd(), "layouts"));
	assert.deepEqual(Array.from(sc.ignores), []);
});

test("findFiles with includes and layouts outside the input directory", async () => {
	let stubs = path.relative(".", path.join(import.meta.dirname, "stubs-b"));
	let sc = new SvelteCompiler();
	sc.setInputDir(stubs);
	sc.setIncludesDir("../stubs-c/_includes");
	sc.setLayoutsDir("../stubs-d/_includes");
	sc.resetIgnores();

	let files = (await sc.findFiles()).map((file) => path.relative(stubs, file).split(path.sep).join("/")).sort();
	assert.deepEqual(files, [
		"../stubs-c/_includes/child.svelte",
		"../stubs-c/_includes/grandchild.svelte",
		"../stubs-d/_includes/child.svelte",
		"../stubs-d/_includes/grandchild.svelte",
		"_includes/child.svelte",
		"_includes/grandchild.svelte",
		"data.svelte",
	]);
});

test("Directory comparisons don’t match sibling directories with the same prefix", async () => {
	let stubs = path.relative(".", path.join(import.meta.dirname, "stubs-prefix"));
	let sc = new SvelteCompiler();
	sc.setInputDir(stubs);
	sc.setIncludesDir("../stubs-prefix-includes");
	sc.resetIgnores();

	let files = (await sc.findFiles()).map((file) => path.relative(stubs, file).split(path.sep).join("/"));
	assert.deepEqual(files, ["../stubs-prefix-includes/child.svelte", "index.svelte"]);
});

test("Cache directories", () => {
	let sc = getInstance();
	assert.equal(sc.getFullCacheDir(), path.join(sc.workingDir, ".cache"));
	assert.equal(new SvelteCompiler(path.resolve("svelte/.cache/absolute")).getFullCacheDir(), path.resolve("svelte/.cache/absolute"));
});

test("getLocalFilePath", () => {
	let sc = getInstance();
	assert.equal(sc.getLocalFilePath(path.join(sc.inputDir, "test.svelte")), SvelteCompiler.normalizeOperatingSystemFilePath("./src/test.svelte"));
	assert.equal(sc.getLocalFilePath(path.join(sc.includesDir, "test.svelte?query=param")), SvelteCompiler.normalizeOperatingSystemFilePath("./src/components/test.svelte"));
});

test("Svelte Render", async () => {
	let { sc, output } = await build("a");
	assert.equal(sc.componentsWriteCount, 3);
	assert.equal(output.length, 3);

	let component = await sc.getComponent("./svelte/test/stubs-a/data.svelte");
	assert.equal(component.data.test, "HELLO");

	let { body } = await sc.renderComponent(component, { page: { url: "/some-url/" }, test: "HELLO" });
	assert.match(body, /^<div class="svelte-\w+"><p>\/some-url\/<\/p><p>HELLO<\/p><div id="child" class="svelte-\w+"><div id="grandchild" class="svelte-\w+"><\/div><\/div><\/div>$/);
});

test("Svelte Render (one input file)", async () => {
	let { sc } = await build("b", { input: [path.join(process.cwd(), "svelte/test/stubs-b/data.svelte")] });
	assert.equal(sc.componentsWriteCount, 3);
	let { body } = await sc.renderComponent(await sc.getComponent("./svelte/test/stubs-b/data.svelte"), { page: { url: "/" } });
	assert.ok(body.includes(`<div id="grandchild"`));
});

test("Svelte CSS", async () => {
	let { sc } = await build("c");

	assert.match(sc.getCSSForComponent("./svelte/test/stubs-c/data.svelte"), /^div\.svelte-\w+ \{ background-color: pink; \}$/);
	assert.match(sc.getCSSForComponent("./svelte/test/stubs-c/_includes/child.svelte"), /^#child\.svelte-\w+ \{ color: green; \}$/);

	let tree = sc.getCSSForComponentTree("./svelte/test/stubs-c/data.svelte");
	assert.equal(tree.length, 3);
	assert.match(tree[0], /#grandchild/);
	assert.match(tree[1], /#child/);
	assert.match(tree[2], /pink/);
});

test("Svelte CSS (one component, no children)", async () => {
	let { sc } = await build("e");
	assert.deepEqual(sc.getCSSForComponentTree("./svelte/test/stubs-e/data.svelte"), [sc.getCSSForComponent("./svelte/test/stubs-e/data.svelte")]);
	assert.match(sc.getCSSForComponent("./svelte/test/stubs-e/data.svelte"), /color: blue/);
});

test("Svelte preprocess", async () => {
	let { sc } = await build("preprocess", {
		preprocess: {
			style: ({ content }) => ({ code: content.replaceAll("$brand", "rebeccapurple") }),
		},
	});
	assert.match(sc.getCSSForComponent("./svelte/test/stubs-preprocess/data.svelte"), /color: rebeccapurple/);
});

test("Svelte data doesn’t leak between renders", async () => {
	let { sc } = await build("data-leak");
	let component = await sc.getComponent("./svelte/test/stubs-data-leak/index.svelte");
	let data = { events: [{ a: 1 }, { b: 2 }] };

	for (let i = 0; i < 3; i++) {
		let { body } = await sc.renderComponent(component, data);
		assert.equal(body, `<div>[{"a":1},{"b":2}]</div>`);
	}
	assert.deepEqual(Object.keys(data), ["events"]);
});

test("Async child components render per instance", async () => {
	let { sc } = await build("async");
	let component = await sc.getComponent("./svelte/test/stubs-async/index.svelte");
	let { body } = await sc.renderComponent(component, { page: { url: "/" }, eleventy: { generator: "Eleventy" } });
	assert.equal(body, `<div><p>A Eleventy</p><p>B Eleventy</p><p>C Eleventy</p></div>`);
});

test("Dynamically imported component", async () => {
	let { sc } = await build("dynamic-import");
	let component = await sc.getComponent("./svelte/test/stubs-dynamic-import/index.svelte");
	let { body } = await sc.renderComponent(component, {});
	assert.match(body, /^<div><p class="svelte-\w+">Dynamic child<\/p><\/div>$/);
	assert.equal(sc.getCSSForComponentTree("./svelte/test/stubs-dynamic-import/index.svelte").length, 1);
});

test("Rune modules (.svelte.js)", async () => {
	let { sc } = await build("module");
	assert.equal(sc.componentsWriteCount, 1);
	let { body } = await sc.renderComponent(await sc.getComponent("./svelte/test/stubs-module/index.svelte"), {});
	assert.equal(body, "<p>3</p>");
});

test("Template strings", async () => {
	let sc = new SvelteCompiler();
	let { mod, css } = await sc.getComponentFromString(`<script>let { name } = $props();</script><b>{name}</b><style>b { color: red; }</style>`);
	let { body } = await sc.renderComponent(mod, { name: "Eleventy" });
	assert.match(body, /<b class="svelte-\w+">Eleventy<\/b>/);
	assert.match(css, /color: red/);
});

test("Rebuilt components replace their stale import relationships", () => {
	let sc = new SvelteCompiler();
	sc.componentRelationships = [
		{ from: "page.js", to: "child.js" },
		{ from: "other.js", to: "child.js" },
	];
	sc.createComponents([{ facadeModuleId: path.join(process.cwd(), "page.svelte"), fileName: "page.js", imports: [] }]);
	assert.deepEqual(sc.componentRelationships, [{ from: "other.js", to: "child.js" }]);
});

test("Non-.svelte modules are not counted as components", () => {
	let sc = new SvelteCompiler();
	sc.createComponents([
		{ facadeModuleId: path.join(process.cwd(), "page.svelte"), fileName: "page.js", imports: ["helpers.js"] },
		{ facadeModuleId: path.join(process.cwd(), "helpers.js"), fileName: "helpers.js", imports: [] },
	]);
	assert.equal(sc.componentsWriteCount, 1);
	assert.deepEqual(Object.keys(sc.svelteFileToJavaScriptFilenameMap), [`.${path.sep}page.svelte`]);
});

test("Output cache is validated against source files and options", async () => {
	let src = "svelte/.cache/cache-test-src";
	await fs.promises.rm(src, { recursive: true, force: true });
	await fs.promises.mkdir(path.join(src, "_includes"), { recursive: true });
	await fs.promises.writeFile(path.join(src, "index.svelte"), `<script>import Child from "./_includes/child.svelte";</script><Child />`);
	await fs.promises.writeFile(path.join(src, "_includes/child.svelte"), `<script>import { label } from "./label.js";</script><p>{label}</p><style>p { color: red; }</style>`);
	await fs.promises.writeFile(path.join(src, "_includes/label.js"), `export const label = "Hi";`);

	function getCompiler() {
		let sc = new SvelteCompiler();
		sc.setCacheDir("svelte/.cache/cache-test");
		sc.setInputDir(src);
		sc.setIncludesDir("_includes");
		return sc;
	}

	let sc = getCompiler();
	let files = await sc.findFiles();
	sc.createComponents(await sc.write(await sc.getBundle(files)));
	await sc.writeOutputCache();

	let cached = getCompiler();
	assert.equal(await cached.isOutputCacheValid(files), true);
	await cached.loadOutputCache();
	let { body } = await cached.renderComponent(await cached.getComponent(`./${src}/index.svelte`), {});
	assert.match(body, /<p class="svelte-\w+">Hi<\/p>/);
	assert.deepEqual(cached.getCSSForComponentTree(`./${src}/index.svelte`), sc.getCSSForComponentTree(`./${src}/index.svelte`));
	assert.ok(cached.watchFiles.has(path.resolve(src, "_includes/label.js")));

	// options
	let otherOptions = getCompiler();
	otherOptions.setCompilerOptions({ dev: true });
	assert.equal(await otherOptions.isOutputCacheValid(files), false);

	// input files
	assert.equal(await getCompiler().isOutputCacheValid(files.slice(1)), false);

	// imported JavaScript dependency
	await fs.promises.writeFile(path.join(src, "_includes/label.js"), `export const label = "Bye";`);
	assert.equal(await getCompiler().isOutputCacheValid(files), false);
	await fs.promises.writeFile(path.join(src, "_includes/label.js"), `export const label = "Hi";`);
	assert.equal(await getCompiler().isOutputCacheValid(files), true);

	// component
	await fs.promises.appendFile(path.join(src, "_includes/child.svelte"), "\n");
	assert.equal(await getCompiler().isOutputCacheValid(files), false);
});

test("Changed components get new module URLs and stale files are removed", async () => {
	let src = "svelte/.cache/rebuild-test-src";
	await fs.promises.rm(src, { recursive: true, force: true });
	await fs.promises.mkdir(src, { recursive: true });
	await fs.promises.writeFile(path.join(src, "child.svelte"), `<p>One</p>`);
	await fs.promises.writeFile(path.join(src, "index.svelte"), `<script>import Child from "./child.svelte";</script><Child />`);

	let sc = new SvelteCompiler();
	sc.setCacheDir("svelte/.cache/rebuild-test");
	sc.setInputDir(src);
	let input = [path.join(src, "index.svelte")];

	sc.createComponents(await sc.write(await sc.getBundle(input)));
	let first = sc.getFullJavaScriptComponentFilePath(`./${src}/index.svelte`);
	assert.match((await sc.renderComponent(await sc.getComponent(`./${src}/index.svelte`), {})).body, /One/);

	await fs.promises.writeFile(path.join(src, "child.svelte"), `<p>Two</p>`);
	sc.createComponents(await sc.write(await sc.getBundle(input)));
	assert.notEqual(sc.getFullJavaScriptComponentFilePath(`./${src}/index.svelte`), first);
	assert.equal(fs.existsSync(first), false);
	assert.match((await sc.renderComponent(await sc.getComponent(`./${src}/index.svelte`), {})).body, /Two/);
});
