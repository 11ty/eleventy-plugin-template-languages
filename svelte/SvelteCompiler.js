import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { glob as tinyglobby } from "tinyglobby";

import { rollup } from "rollup";

import { compile, compileModule, preprocess, VERSION as svelteVersion } from "svelte/compiler";
import { render } from "svelte/server";

import { createDebug } from "obug";

const debug = createDebug("Eleventy:Svelte");
const debugDev = createDebug("Dev:Eleventy:Svelte");

const pkg = JSON.parse(fs.readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const CACHE_MANIFEST_FILENAME = "eleventy-svelte.json";

// `.svelte.js` and `.svelte.ts` modules can use runes
const SVELTE_MODULE_REGEX = /\.svelte\.[cm]?[jt]s$/;

// Matches `svelte` and `svelte/*` import specifiers in compiled output
const SVELTE_IMPORT_REGEX = /(["'])(svelte(?:\/[^"']*)?)\1/g;

// Hydration markers (`<!--[-->`, `<!--[!-->`, `<!--]-->`, `<!---->`) are unused without client JavaScript
const HYDRATION_MARKER_REGEX = /<!--(?:\[!?|\])?-->/g;

// `<svelte:head>` content is wrapped in `<!--hash-->…<!---->`
const HEAD_MARKER_REGEX = /<!--[a-z0-9]+-->/g;

// Components must share the plugin’s Svelte runtime (context, renderer state), so its imports resolve to absolute URLs
function resolveSvelteImport(id) {
  return import.meta.resolve(id);
}

function isSvelteFile(filePath) {
  return filePath.endsWith(".svelte") || SVELTE_MODULE_REGEX.test(filePath);
}

function getErrorLocation(e, file) {
  if(e.start?.line !== undefined) {
    return { file, line: e.start.line, column: e.start.column };
  }
}

// Trailing separator so `src/components` doesn’t match `src/components-legacy`
function isInsideDirectory(filePath, dir) {
  return filePath.startsWith(dir.endsWith(path.sep) ? dir : dir + path.sep);
}

function addLeadingDotSlash(pathArg) {
  if (pathArg === "." || pathArg === "..") {
    return pathArg + path.sep;
  }

  if (
    path.isAbsolute(pathArg) ||
    pathArg.startsWith("." + path.sep) ||
    pathArg.startsWith(".." + path.sep)
  ) {
    return pathArg;
  }

  return "." + path.sep + pathArg;
}

async function hashFile(file) {
  return createHash("sha256").update(await fsp.readFile(file)).digest("hex");
}

export default class SvelteCompiler {
  static normalizeOperatingSystemFilePath(filePath, sep = "/") {
    return filePath.split(sep).join(path.sep);
  }

  static forceForwardSlashOnFilePath(filePath) {
    return filePath.split(path.sep).join("/");
  }

  constructor(cacheDirectory = ".cache/svelte/") {
    this.workingDir = path.resolve(".");
    this.ignores = new Set();

    this.svelteFileToCSSMap = {};
    this.svelteFileToJavaScriptFilenameMap = {};
    this.componentRelationships = [];
    this.cssTreeCache = new Map();
    this.stringComponentCache = new Map();
    // Absolute paths of every module rollup has bundled
    this.watchFiles = new Set();

    this.rollupBundleOptions = {
      format: "esm",
      preserveModules: true,
      // Content hashes give changed modules (and their importers) new URLs, bypassing the ESM import cache
      entryFileNames: (chunkInfo) => {
        debugDev("Rollup chunk %o", chunkInfo.facadeModuleId);
        return chunkInfo.name.replace(/\.svelte$/, "") + "-[hash].js";
      },
    };

    this.setCacheDir(cacheDirectory);

    this.compilerOptions = {};
    this.preprocessors = [];
    this.rollupOptions = {};
    this.componentsWriteCount = 0;
    this.readOnly = false;
  }

  setReadOnly(readOnly) {
    this.readOnly = !!readOnly;
  }

  setRollupOptions(options = {}) {
    this.rollupOptions = options;
  }

  // See https://svelte.dev/docs/svelte/svelte-compiler#CompileOptions
  setCompilerOptions(compilerOptions = {}) {
    this.compilerOptions = compilerOptions;
  }

  // See https://svelte.dev/docs/svelte/svelte-compiler#preprocess
  setPreprocess(preprocessors = []) {
    this.preprocessors = preprocessors;
  }

  // Called with the context Map and page data before each render
  setConfigureContext(configureContext) {
    this.configureContext = configureContext;
  }

  getCompileOptions(filename) {
    return {
      ...this.compilerOptions,
      filename,
      generate: "server",
      css: "external",
      experimental: {
        async: true,
        ...this.compilerOptions.experimental,
      },
    };
  }

  async compileSource(code, filename) {
    if(SVELTE_MODULE_REGEX.test(filename)) {
      let { dev, experimental } = this.getCompileOptions(filename);
      return compileModule(code, { dev, experimental, filename, generate: "server" });
    }

    let dependencies = [];
    if(this.preprocessors && (!Array.isArray(this.preprocessors) || this.preprocessors.length)) {
      let processed = await preprocess(code, this.preprocessors, { filename });
      code = processed.code;
      dependencies = processed.dependencies || [];
    }

    let result = compile(code, this.getCompileOptions(filename));
    result.dependencies = dependencies;
    return result;
  }

  getRollupPlugin() {
    let compiler = this;
    return {
      name: "eleventy-svelte",
      resolveId(id, importer, { isEntry }) {
        // Entry paths are files (e.g. `svelte/index.svelte`), not package imports
        if(!isEntry && importer && (id === "svelte" || id.startsWith("svelte/"))) {
          return { id: resolveSvelteImport(id), external: true };
        }
      },
      async transform(code, id) {
        if(!isSvelteFile(id)) {
          return;
        }

        let result;
        try {
          result = await compiler.compileSource(code, id);
        } catch(e) {
          this.error({ message: e.message, loc: getErrorLocation(e, id), cause: e });
        }

        for(let dependency of result.dependencies || []) {
          this.addWatchFile(dependency);
        }
        for(let warning of result.warnings || []) {
          this.warn({ message: warning.message, loc: getErrorLocation(warning, id) });
        }

        compiler.setCSS(id, result.css?.code || "");

        return {
          code: result.js.code,
          map: result.js.map,
        };
      },
    };
  }

  getMergedRollupOptions(input) {
    let options = {
      input,
      cache: this.rollupCache,
      onwarn (warning, warn) {
        if(warning.code === "UNUSED_EXTERNAL_IMPORT") {
          debug("Unused external import: %O", warning);
        } else {
          warn(warning);
        }
      },
      external: [],
      plugins: [
        this.getRollupPlugin(),
      ],
    };

    for(let key in this.rollupOptions) {
      if(key === "external" || key === "plugins") {
        // merge the Array
        options[key] = options[key].concat(this.rollupOptions[key]);
      } else {
        options[key] = this.rollupOptions[key];
      }
    }

    return options;
  }

  resetIgnores(extraIgnores = []) {
    this.ignores = new Set();

    // These need to be forced to forward slashes for comparison
    this.relativeIncludesDir = this.rawIncludesDir ? SvelteCompiler.forceForwardSlashOnFilePath(addLeadingDotSlash(path.join(this.relativeInputDir, this.rawIncludesDir))) : undefined;
    this.relativeLayoutsDir = this.rawLayoutsDir ? SvelteCompiler.forceForwardSlashOnFilePath(addLeadingDotSlash(path.join(this.relativeInputDir, this.rawLayoutsDir))) : undefined;

    // don’t add ignores that match includes or layouts dirs
    for(let ignore of extraIgnores) {
      if(this.relativeIncludesDir && ignore.startsWith(this.relativeIncludesDir)) {
        debug("Skipping ignore from eleventy.ignores event: %o, matched includes dir", ignore);
      } else if(this.relativeLayoutsDir && ignore.startsWith(this.relativeLayoutsDir)) {
        debug("Skipping ignore from eleventy.ignores event: %o, matched layouts dir", ignore);
      } else {
        debug("Adding ignore from eleventy.ignores event: %o", ignore);
        this.ignores.add(ignore);
      }
    }
  }

  setInputDir(inputDir) {
    this.relativeInputDir = inputDir;
    this.inputDir = path.join(this.workingDir, inputDir);
  }

  setIncludesDir(includesDir) {
    if(includesDir) {
      this.rawIncludesDir = includesDir;
      this.includesDir = path.join(this.inputDir, includesDir);
    }
  }

  setLayoutsDir(layoutsDir) {
    if(layoutsDir) {
      this.rawLayoutsDir = layoutsDir;
      this.layoutsDir = path.join(this.inputDir, layoutsDir);
    }
  }

  setCacheDir(cacheDir) {
    this.cacheDir = cacheDir;
    this.rollupBundleOptions.dir = cacheDir;
    this.cacheManifestFile = path.join(this.cacheDir || "", CACHE_MANIFEST_FILENAME);
  }

  getFullCacheDir() {
    if(path.isAbsolute(this.cacheDir)) {
      return this.cacheDir;
    }
    return path.join(this.workingDir, this.cacheDir);
  }

  isIncludeFile(filepath) {
    return isInsideDirectory(filepath, this.includesDir);
  }

  async findFiles(glob = "**/*.svelte") {
    let globPaths = [
      addLeadingDotSlash(path.join(this.relativeInputDir, glob))
    ];

    if(this.includesDir && !isInsideDirectory(this.includesDir, this.inputDir)) {
      globPaths.push(addLeadingDotSlash(path.join(this.relativeIncludesDir, glob)));
    }

    if(this.layoutsDir && !isInsideDirectory(this.layoutsDir, this.inputDir)) {
      globPaths.push(addLeadingDotSlash(path.join(this.relativeLayoutsDir, glob)));
    }

    // ignores should not include layouts or includes directories, filtered out above.
    let ignores = Array.from(this.ignores).map(ignore => SvelteCompiler.forceForwardSlashOnFilePath(ignore));
    globPaths = globPaths.map(path => SvelteCompiler.forceForwardSlashOnFilePath(path));
    debug("Looking for %O and ignoring %O", globPaths, ignores);

    // MUST use forward slashes here (even in Windows), per tinyglobby requirements
    let files = await tinyglobby(globPaths, {
      caseSensitiveMatch: false,
      ignore: ignores,
    });
    return files.sort();
  }

  async getBundle(input) {
    if(!input) {
      input = await this.findFiles();
    }

    debug("Processing %o Svelte files: %O", input.length, input);

    await fsp.mkdir(this.cacheDir, { recursive: true });
    // Compiled components are ES modules, even in CommonJS projects
    await fsp.writeFile(path.join(this.cacheDir, "package.json"), JSON.stringify({ type: "module" }));

    this.setCacheInputs(input);

    let bundle = await rollup(this.getMergedRollupOptions(input));
    // Unchanged modules skip compilation on the next (watch) build
    this.rollupCache = bundle.cache;
    for(let file of bundle.watchFiles) {
      this.watchFiles.add(file);
    }

    return bundle;
  }

  async write(bundle) {
    if(!bundle) {
      throw new Error("Eleventy Svelte Plugin: write(bundle) needs a bundle argument.");
    }

    let { output } = await bundle.write(this.rollupBundleOptions);
    await bundle.close();

    output = output.filter(entry => !!entry.facadeModuleId);
    await this.removeStaleFiles(output);

    return output;
  }

  // Content-hashed file names leave old builds behind
  async removeStaleFiles(output) {
    let current = new Set(output.map(entry => path.join(this.getFullCacheDir(), entry.fileName)));
    let files = await fsp.readdir(this.getFullCacheDir(), { recursive: true, withFileTypes: true });
    for(let file of files) {
      let fullPath = path.join(file.parentPath, file.name);
      if(file.isFile() && file.name.endsWith(".js") && !current.has(fullPath)) {
        debugDev("Removing stale compiled file: %o", fullPath);
        await fsp.rm(fullPath, { force: true });
      }
    }
  }

  // Changes to versions or options invalidate the cache (functions, e.g. plugins, compare by source)
  getCacheKey() {
    try {
      return JSON.stringify({
        plugin: pkg.version,
        svelte: svelteVersion,
        rollupOptions: this.rollupOptions,
        compilerOptions: this.compilerOptions,
        preprocess: this.preprocessors,
      }, (key, value) => typeof value === "function" ? value.toString() : value);
    } catch(e) {
      debug("Options are not serializable, skipping the output cache: %o", e.message);
    }
  }

  // Hashes of every source file rollup read, keyed by path relative to the working directory
  async getSourceFileHashes() {
    let files = new Set();
    for(let id of this.watchFiles) {
      if(!id.startsWith("\0")) {
        files.add(path.relative(this.workingDir, id.split("?")[0]));
      }
    }

    let hashes = {};
    for(let file of Array.from(files).sort()) {
      try {
        hashes[file] = await hashFile(file);
      } catch {
        // Not a file on disk
      }
    }
    return hashes;
  }

  normalizeCacheInputs(input) {
    return input.map(file => SvelteCompiler.forceForwardSlashOnFilePath(path.normalize(file))).sort();
  }

  setCacheInputs(input) {
    this.cacheInputs = this.normalizeCacheInputs(input);
  }

  hasOutputCache() {
    return fs.existsSync(this.cacheManifestFile);
  }

  async writeOutputCache() {
    if(this.readOnly) {
      return;
    }

    let css = {};
    for(let localPath in this.svelteFileToJavaScriptFilenameMap) {
      css[SvelteCompiler.forceForwardSlashOnFilePath(localPath)] = this.getCSSForComponent(localPath);
    }

    let svelteToJs = {};
    for(let localPath in this.svelteFileToJavaScriptFilenameMap) {
      svelteToJs[SvelteCompiler.forceForwardSlashOnFilePath(localPath)] = this.svelteFileToJavaScriptFilenameMap[localPath];
    }

    debug("Writing output cache to file system %o", this.cacheManifestFile);
    return fsp.writeFile(this.cacheManifestFile, JSON.stringify({
      key: this.getCacheKey(),
      inputs: this.cacheInputs,
      files: await this.getSourceFileHashes(),
      svelteToJs,
      css,
      relationships: this.componentRelationships,
    }, null, 2));
  }

  async readOutputCache() {
    try {
      return JSON.parse(await fsp.readFile(this.cacheManifestFile, "utf8"));
    } catch {
      // missing or malformed
    }
  }

  async isOutputCacheValid(input) {
    let cache = await this.readOutputCache();
    if(!cache) {
      return false;
    }

    let key = this.getCacheKey();
    let inputs = this.normalizeCacheInputs(input);
    if(!key || cache.key !== key || JSON.stringify(cache.inputs) !== JSON.stringify(inputs) || !cache.files) {
      debug("Output cache is stale: options or input files changed");
      return false;
    }

    for(let file in cache.files) {
      let hash;
      try {
        hash = await hashFile(file);
      } catch {
        // deleted
      }
      if(hash !== cache.files[file]) {
        debug("Output cache is stale: %o changed", file);
        return false;
      }
    }

    for(let jsFilename of Object.values(cache.svelteToJs || {})) {
      if(!fs.existsSync(path.join(this.getFullCacheDir(), jsFilename))) {
        debug("Output cache is stale: %o is missing", jsFilename);
        return false;
      }
    }

    return true;
  }

  async loadOutputCache() {
    debugDev("Using output cache to bypass rollup.");
    let { svelteToJs = {}, css = {}, relationships = [], files = {} } = await this.readOutputCache() || {};

    this.componentsWriteCount = 0;
    this.svelteFileToCSSMap = {};
    this.svelteFileToJavaScriptFilenameMap = {};
    for(let localPath in svelteToJs) {
      this.addSvelteToJavaScriptMapping(localPath, svelteToJs[localPath]);
      this.setCSSViaLocalPath(localPath, css[localPath] || "");
    }
    this.componentRelationships = relationships;
    this.cssTreeCache.clear();
    for(let file in files) {
      this.watchFiles.add(path.resolve(this.workingDir, file));
    }
  }

  // output is returned from .write()
  createComponents(output) {
    this.componentsWriteCount = 0;
    this.cssTreeCache.clear();

    // Rebuilt modules replace their previous import edges
    let rebuilt = new Set(output.map(entry => entry.fileName));
    this.componentRelationships = this.componentRelationships.filter(({ from }) => !rebuilt.has(from));

    for(let entry of output) {
      let jsFilename = entry.fileName;

      // Plain JavaScript modules and virtual helpers aren’t components
      if(entry.facadeModuleId.endsWith(".svelte")) {
        let localPath = this.getLocalFilePath(entry.facadeModuleId);
        debugDev("Adding Svelte file to JS component file name mapping: %o to %o", localPath, jsFilename);
        this.addSvelteToJavaScriptMapping(localPath, jsFilename);
        this.componentsWriteCount++;
      }

      // Imported component CSS rolls up into the parent component
      for(let importFilename of [...(entry.imports || []), ...(entry.dynamicImports || [])]) {
        this.componentRelationships.push({ from: jsFilename, to: importFilename });
      }
    }

    debug("Created %o Svelte components", this.componentsWriteCount);
  }

  getLocalFilePath(fullPath) {
    let filePath = fullPath.split("?")[0];
    if(filePath.startsWith(this.workingDir)) {
      filePath = `.${filePath.slice(this.workingDir.length)}`;
    }
    return SvelteCompiler.normalizeOperatingSystemFilePath(filePath);
  }

  /* CSS */
  setCSS(fullPath, cssText) {
    this.setCSSViaLocalPath(this.getLocalFilePath(fullPath), cssText);
  }

  setCSSViaLocalPath(localPath, cssText) {
    localPath = SvelteCompiler.normalizeOperatingSystemFilePath(localPath);
    this.cssTreeCache.clear();

    let css = cssText.trim();
    if(css) {
      debugDev("Setting CSS for %o, length: %o", localPath, css.length);
      this.svelteFileToCSSMap[localPath] = css;
    } else {
      delete this.svelteFileToCSSMap[localPath];
    }
  }

  getCSSForComponent(localPath) {
    return this.svelteFileToCSSMap[SvelteCompiler.normalizeOperatingSystemFilePath(localPath)] || "";
  }

  // CSS blocks for a component and everything it imports, deepest first
  getCSSForComponentTree(localPath) {
    let entryFilename = this.getJavaScriptComponentFile(localPath);
    if(!entryFilename) {
      return [];
    }
    if(this.cssTreeCache.has(entryFilename)) {
      return this.cssTreeCache.get(entryFilename);
    }

    let imports = {};
    for(let { from, to } of this.componentRelationships) {
      (imports[from] ||= []).push(to);
    }

    let cssByFilename = {};
    for(let sveltePath in this.svelteFileToJavaScriptFilenameMap) {
      cssByFilename[this.svelteFileToJavaScriptFilenameMap[sveltePath]] = this.getCSSForComponent(sveltePath);
    }

    let seen = new Set();
    let styles = [];
    let walk = (jsFilename) => {
      if(seen.has(jsFilename)) {
        return;
      }
      seen.add(jsFilename);

      for(let dependency of imports[jsFilename] || []) {
        walk(dependency);
      }

      if(cssByFilename[jsFilename]) {
        styles.push(cssByFilename[jsFilename]);
      }
    };
    walk(entryFilename);

    this.cssTreeCache.set(entryFilename, styles);
    return styles;
  }

  /* Map from Svelte files to compiled JavaScript files */
  addSvelteToJavaScriptMapping(localPath, jsFilename) {
    this.cssTreeCache.clear();
    this.svelteFileToJavaScriptFilenameMap[SvelteCompiler.normalizeOperatingSystemFilePath(localPath)] = jsFilename;
  }

  getJavaScriptComponentFile(localPath) {
    return this.svelteFileToJavaScriptFilenameMap[SvelteCompiler.normalizeOperatingSystemFilePath(localPath)];
  }

  getFullJavaScriptComponentFilePath(localPath) {
    let jsFilename = this.getJavaScriptComponentFile(localPath);
    if(!jsFilename) {
      throw new Error("Could not find compiled JavaScript file for Svelte component: " + localPath);
    }
    return path.join(this.getFullCacheDir(), jsFilename);
  }

  // Returns the module namespace: `default` is the component, `data` feeds the data cascade
  async getComponent(localPath) {
    return import(pathToFileURL(this.getFullJavaScriptComponentFilePath(localPath)).href);
  }

  // Compiles a component from a string (e.g. via the Render plugin), relative imports are not supported
  async getComponentFromString(str) {
    if(!this.stringComponentCache.has(str)) {
      this.stringComponentCache.set(str, (async () => {
        let { js, css } = await this.compileSource(str, "eleventy-svelte-string.svelte");
        let code = js.code.replace(SVELTE_IMPORT_REGEX, (match, quote, id) => JSON.stringify(resolveSvelteImport(id)));
        let mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
        return { mod, css: css?.code?.trim() || "" };
      })());
    }
    return this.stringComponentCache.get(str);
  }

  // Filters and shortcodes get `this.page` and `this.eleventy`, same as in other template languages
  bindFunctions(functions = {}, data = {}) {
    let thisContext = { page: data.page, eleventy: data.eleventy, ctx: data };
    let bound = {};
    for(let name in functions) {
      bound[name] = typeof functions[name] === "function" ? functions[name].bind(thisContext) : functions[name];
    }
    return bound;
  }

  // Returns `{ head, body }`
  async renderComponent(component, data = {}, functions = {}) {
    let context = new Map([
      ["page", data.page],
      // A copy so components can’t mutate the data cascade
      ["data", { ...data }],
      ["functions", this.bindFunctions(functions, data)],
    ]);

    if(typeof this.configureContext === "function") {
      await this.configureContext(context, data);
    }

    let { head, body } = await render(component.default || component, {
      props: { ...data },
      context,
    });
    return {
      head: head.replace(HEAD_MARKER_REGEX, "").replace(HYDRATION_MARKER_REGEX, ""),
      body: body.replace(HYDRATION_MARKER_REGEX, ""),
    };
  }
}
