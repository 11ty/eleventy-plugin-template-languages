import path from "node:path";
import fs from "node:fs";
import lodashMerge from "lodash.merge";
import debugUtil from "debug";
import { InlineCodeManager } from "@11ty/eleventy-assets";
import { version } from "vue";

import VueCompiler from "./VueCompiler.js";

const debug = debugUtil("Eleventy:Vue");
const pkg = JSON.parse(fs.readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const globalOptions = {
  input: [], // point to a specific list of Vue files (defaults to **/*.vue)

  readOnly: false,

  cacheDirectory: ".cache/vue/",

  // See https://www.rollupjs.org/guide/en/#big-list-of-options
  rollupOptions: {},

  // See https://rollup-plugin-vue.vuejs.org/options.html
  rollupPluginVueOptions: {},

  assets: {
    css: null
  } // optional `eleventy-assets` instances
};

export default function(eleventyConfig, configGlobalOptions = {}) {
  try {
    eleventyConfig.versionCheck(pkg["11ty"].compatibility);
  } catch(e) {
    console.log( `WARN: Eleventy Plugin (${pkg.name}) Compatibility: ${e.message}` );
  }

  let options = lodashMerge({}, globalOptions, configGlobalOptions);

  let vueCompiler = new VueCompiler();
  vueCompiler.setCacheDir(options.cacheDirectory);
  vueCompiler.setReadOnly(options.readOnly);

  let cssManager = options.assets.css || new InlineCodeManager();
  vueCompiler.setCssManager(cssManager);

  let changedVueFilesOnWatch = [];
  let skipVueBuild = false;

  // Only add this filter if you’re not re-using your own asset manager.
  // TODO Add warnings to readme
  // * This will probably only work in a layout template.
  // * Probably complications with components that are only used in a layout template.
  eleventyConfig.addFilter("getVueComponentCssForPage", (url) => {
    let components = cssManager.getComponentListForUrl(url);
    let css = cssManager.getCodeForUrl(url);
    debug("Component CSS for %o component count: %o, CSS size: %o: %O", url, components.length, css.length, components);
    return css;
  });

  let eleventyIgnores;
  eleventyConfig.on("eleventy.ignores", ignores => {
    eleventyIgnores = ignores;
  });

  // Default output
  let isVerboseMode = true;
  eleventyConfig.on("eleventy.config", config => {
    // Available in 1.0.0-beta.6+
    if(config.verbose !== undefined) {
      isVerboseMode = config.verbose;
    }
  });

  eleventyConfig.on("afterBuild", () => {
    let count = vueCompiler.componentsWriteCount;
    if(isVerboseMode && count > 0) {
      console.log( `Built ${count} component${count !== 1 ? "s" : ""} (eleventy-plugin-vue v${pkg.version}${version ? ` with Vue ${version}` : ""})` );
    }
  });

  // `beforeWatch` is available on Eleventy 0.11.0 and newer
  eleventyConfig.on("beforeWatch", (changedFiles) => {
    let hasChangedFiles = changedFiles && changedFiles.length > 0;

    // `changedFiles` array argument is available on Eleventy 0.11.1+
    changedVueFilesOnWatch = (changedFiles || []).filter(file => file.endsWith(".vue"));

    // Only reset what changed! (Partial builds for Vue rollup files)
    if(changedVueFilesOnWatch.length > 0) {
      skipVueBuild = false;
    } else {
      if(hasChangedFiles) {
        skipVueBuild = true;
      }
    }
    vueCompiler.clearRequireCache();
  });

  eleventyConfig.addTemplateFormats("vue");

  eleventyConfig.addExtension("vue", {
    read: false, // We use rollup to read the files
    getData: [ // get data from both the data function and serverPrefetch
      "data",
      // including this by default is bad because a lot of async data fetching happens here!
      // "serverPrefetch"
    ],
    getInstanceFromInputPath: function(inputPath) {
      return vueCompiler.getComponent(inputPath);
    },
    init: async function() {
      let { input, includes, layouts } = this.config.directories;
      vueCompiler.setInputDir(input);
      vueCompiler.setIncludesDir(path.relative(input, includes));
      vueCompiler.setLayoutsDir(layouts ? path.relative(input, layouts) : undefined);
      vueCompiler.resetIgnores(eleventyIgnores);

      vueCompiler.setRollupOptions(options.rollupOptions);
      vueCompiler.setRollupPluginVueOptions(options.rollupPluginVueOptions);

      if(skipVueBuild) {
        // we only call this to set the write count for the build
        vueCompiler.createVueComponents([]);
      } else if(options.readOnly && vueCompiler.hasRollupOutputCache()) {
        await vueCompiler.loadRollupOutputCache();
      } else {
        let files = changedVueFilesOnWatch;
        let isSubset = false;

        if(files && files.length) {
          isSubset = true;
        } else {
          // input passed in via config
          if(options.input && options.input.length) {
            files = options.input;
            isSubset = true;
          } else {
            files = await vueCompiler.findFiles();
          }
        }

        // quit early
        if(!files || !files.length) {
          return;
        }

        try {
          let bundle = await vueCompiler.getBundle(files, isSubset);
          let output = await vueCompiler.write(bundle);
  
          vueCompiler.createVueComponents(output);
        } catch(e) {
          if(e.loc) {
            e.message = `Error in Vue file ${e.loc.file} on Line ${e.loc.line} Column ${e.loc.column}: ${e.message}`
          }
          throw e;
        }

        if(!options.readOnly && !isSubset) { // implied vueCompiler.hasRollupOutputCache() was false
          await vueCompiler.writeRollupOutputCache();
        }
      }
    },

    // Caching
    compileOptions: {
      cache: true,
      permalink: "raw",
      getCacheKey: function(str, inputPath) {
        return inputPath;
      },
    },

    compile: function(str, inputPath) {
      return async (data) => {
        // since `read: false` is set 11ty doesn't read file contents
        // so if str has a value, it's a permalink (which can be a string or a function)
        // currently Vue template syntax in permalink string is not supported.
        let vueMixin = {
          methods: this.config.javascriptFunctions,
        };

        if (str) {
          if(typeof str === "function") {
            return str(data);
          }
          if(typeof str === "string" && str.trim().charAt("0") === "<") {
            return vueCompiler.renderString(str, data, vueMixin);
          }
          return str;
        }

        let vueComponent = vueCompiler.getComponent(inputPath);
        let componentName = vueCompiler.getJavaScriptComponentFile(inputPath);

        // if user attempts to render a Vue template in `serverPrefetch` or `data` to add to the data cascade
        // this will fail because data.page does not exist yet!
        if(data.page) {
          debug("Vue CSS: Adding component %o to %o", componentName, data.page.url);
          cssManager.addComponentForUrl(componentName, data.page.url);
        }

        return vueCompiler.renderComponent(vueComponent, data, vueMixin);
      };
    }
  });
}

export { VueCompiler };
