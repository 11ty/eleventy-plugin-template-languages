import path from "node:path";
import fs from "node:fs";
import { createDebug } from "obug";
import { VERSION } from "svelte/compiler";

import SvelteCompiler from "./SvelteCompiler.js";

const debug = createDebug("Eleventy:Svelte");
const pkg = JSON.parse(fs.readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const globalOptions = {
  input: [], // point to a specific list of Svelte files (defaults to **/*.svelte)

  readOnly: false,

  cacheDirectory: ".cache/svelte/",

  // See https://www.rollupjs.org/configuration-options/
  rollupOptions: {},

  // See https://svelte.dev/docs/svelte/svelte-compiler#CompileOptions
  compilerOptions: {},

  // See https://svelte.dev/docs/svelte/svelte-compiler#preprocess
  preprocess: [],

  // Eleventy bundle that component <style> blocks are added to, output with `{% getBundle "css" %}`
  cssBundleName: "css",

  // See https://www.11ty.dev/docs/plugins/bundle/#asset-bucketing
  cssBundleBucket: undefined,

  // Eleventy bundle that <svelte:head> content is added to, output with `{% getBundle "head" %}`
  headBundleName: "head",

  // Customize the Svelte context Map before each render
  configureContext: undefined, // function(context, data)
};

export default function(eleventyConfig, configGlobalOptions = {}) {
  try {
    eleventyConfig.versionCheck(pkg["11ty"].compatibility);
  } catch(e) {
    console.log( `WARN: Eleventy Plugin (${pkg.name}) Compatibility: ${e.message}` );
  }

  let options = Object.assign({}, globalOptions, configGlobalOptions);

  let svelteCompiler = new SvelteCompiler();
  svelteCompiler.setCacheDir(options.cacheDirectory);
  svelteCompiler.setReadOnly(options.readOnly);
  svelteCompiler.setConfigureContext(options.configureContext);

  for(let bundleName of [options.cssBundleName, options.headBundleName]) {
    if(bundleName) {
      // No-op if the bundle already exists
      eleventyConfig.addBundle(bundleName, {
        outputFileExtension: bundleName === options.cssBundleName ? "css" : "html",
      });
    }
  }

  function addToBundles(url, styles, head) {
    let bundles = eleventyConfig.getBundleManagers();
    if(options.cssBundleName && styles.length) {
      bundles[options.cssBundleName].addToPage(url, styles, options.cssBundleBucket);
    }
    if(options.headBundleName && head) {
      bundles[options.headBundleName].addToPage(url, head);
    }
  }

  let skipSvelteBuild = false;

  let eleventyIgnores;
  eleventyConfig.on("eleventy.ignores", ignores => {
    eleventyIgnores = ignores;
  });

  let eleventyDirectories;
  eleventyConfig.on("eleventy.directories", directories => {
    eleventyDirectories = directories;
  });

  let isVerboseMode = true;
  eleventyConfig.on("eleventy.config", config => {
    if(config.verbose !== undefined) {
      isVerboseMode = config.verbose;
    }
  });

  eleventyConfig.on("afterBuild", () => {
    let count = svelteCompiler.componentsWriteCount;
    if(isVerboseMode && count > 0) {
      console.log( `Built ${count} component${count !== 1 ? "s" : ""} (eleventy-plugin-svelte v${pkg.version} with Svelte ${VERSION})` );
    }
  });

  eleventyConfig.on("beforeWatch", (changedFiles = []) => {
    // Rollup’s cache skips recompiling unchanged modules, so any relevant change triggers a full build
    let hasRelevantChange = changedFiles.some(file => file.endsWith(".svelte") || /\.svelte\.[cm]?[jt]s$/.test(file) || svelteCompiler.watchFiles.has(path.resolve(file)));
    skipSvelteBuild = changedFiles.length > 0 && !hasRelevantChange;
  });

  eleventyConfig.addTemplateFormats("svelte");

  eleventyConfig.addExtension("svelte", {
    read: false, // We use rollup to read the files
    getData: ["data"], // `export const data` (or a function) from `<script module>`
    getInstanceFromInputPath: function(inputPath) {
      return svelteCompiler.getComponent(inputPath);
    },
    init: async function() {
      let { input, includes, layouts } = eleventyDirectories || this.config.directories;
      svelteCompiler.setInputDir(input);
      svelteCompiler.setIncludesDir(path.relative(input, includes));
      svelteCompiler.setLayoutsDir(layouts ? path.relative(input, layouts) : undefined);
      svelteCompiler.resetIgnores(eleventyIgnores);

      svelteCompiler.setRollupOptions(options.rollupOptions);
      svelteCompiler.setCompilerOptions(options.compilerOptions);
      svelteCompiler.setPreprocess(options.preprocess);

      if(skipSvelteBuild) {
        // keep the previous build, reset the write count for this one
        svelteCompiler.componentsWriteCount = 0;
        return;
      }

      if(options.readOnly && svelteCompiler.hasOutputCache()) {
        await svelteCompiler.loadOutputCache();
        return;
      }

      let files = options.input?.length ? options.input : await svelteCompiler.findFiles();
      if(!files.length) {
        return;
      }

      // Skip rollup when no source files, options, or versions changed since the last build
      if(!svelteCompiler.rollupCache && await svelteCompiler.isOutputCacheValid(files)) {
        await svelteCompiler.loadOutputCache();
        return;
      }

      try {
        let bundle = await svelteCompiler.getBundle(files);
        svelteCompiler.createComponents(await svelteCompiler.write(bundle));
      } catch(e) {
        if(e.loc?.line !== undefined) {
          e.message = `Error in Svelte file ${e.loc.file || e.id} on Line ${e.loc.line} Column ${e.loc.column}: ${e.message}`;
        }
        throw e;
      }

      await svelteCompiler.writeOutputCache();
    },

    // Caching
    compileOptions: {
      cache: true,
      permalink: "raw",
      getCacheKey: function(str, inputPath) {
        // Template strings (e.g. via the Render plugin) must not share a cache entry with the component
        if(typeof str === "string" && str) {
          return `${inputPath}::${str}`;
        }
        return inputPath;
      },
    },

    compile: function(str, inputPath) {
      return async (data) => {
        // since `read: false` is set 11ty doesn't read file contents
        // so if str has a value, it's a permalink (string or function) or a template string
        let functions = this.config.javascriptFunctions;
        let component;
        let styles;

        if(str) {
          if(typeof str === "function") {
            return str(data);
          }
          if(typeof str !== "string" || str.trim().charAt(0) !== "<") {
            return str;
          }

          let { mod, css } = await svelteCompiler.getComponentFromString(str);
          component = mod;
          styles = css ? [css] : [];
        } else {
          component = await svelteCompiler.getComponent(inputPath);
          styles = svelteCompiler.getCSSForComponentTree(inputPath);
        }

        let { head, body } = await svelteCompiler.renderComponent(component, data, functions);

        // `data.page` is missing when rendering outside of a page (e.g. in `data`)
        if(data.page) {
          debug("Svelte CSS: Adding %o block(s) from %o to %o", styles.length, inputPath, data.page.url);
          addToBundles(data.page.url, styles, head);
        }

        return body;
      };
    }
  });
}

export { SvelteCompiler };
