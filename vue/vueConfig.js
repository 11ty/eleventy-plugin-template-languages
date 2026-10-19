import path from "node:path";
import fs from "node:fs";
import { DeepCopy } from "@11ty/eleventy-utils";
import { createDebug } from "obug";
import { version } from "vue";

import VueCompiler from "./VueCompiler.js";

const debug = createDebug("Eleventy:Vue");
const pkg = JSON.parse(fs.readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const globalOptions = {
  input: [], // point to a specific list of Vue files (defaults to **/*.vue)

  readOnly: false,

  cacheDirectory: ".cache/vue/",

  // See https://www.rollupjs.org/guide/en/#big-list-of-options
  rollupOptions: {},

  // See https://rollup-plugin-vue.vuejs.org/options.html
  rollupPluginVueOptions: {},

  // Eleventy bundle that component <style> blocks are added to, output with `{% getBundle "css" %}`
  cssBundleName: "css",

  // See https://www.11ty.dev/docs/plugins/bundle/#asset-bucketing
  cssBundleBucket: undefined,

  // Customize the Vue app before each render, e.g. `app.component()` or `app.config`
  configureApp: undefined, // function(app, data)
};

export default function(eleventyConfig, configGlobalOptions = {}) {
  try {
    eleventyConfig.versionCheck(pkg["11ty"].compatibility);
  } catch(e) {
    console.log( `WARN: Eleventy Plugin (${pkg.name}) Compatibility: ${e.message}` );
  }

  if("assets" in configGlobalOptions) {
    console.log( `WARN: Eleventy Plugin (${pkg.name}): the \`assets\` option and \`getVueComponentCssForPage\` filter were removed. Component CSS is now added to Eleventy’s \`css\` bundle, use \`{% getBundle "css" %}\` instead.` );
  }

  let options = DeepCopy({}, globalOptions, configGlobalOptions);

  let vueCompiler = new VueCompiler();
  vueCompiler.setCacheDir(options.cacheDirectory);
  vueCompiler.setReadOnly(options.readOnly);
  vueCompiler.setConfigureApp(options.configureApp);

  if(options.cssBundleName) {
    // No-op if the bundle already exists
    eleventyConfig.addBundle(options.cssBundleName, {
      outputFileExtension: "css",
    });
  }

  let changedVueFilesOnWatch = [];
  let skipVueBuild = false;

  let eleventyIgnores;
  eleventyConfig.on("eleventy.ignores", ignores => {
    eleventyIgnores = ignores;
  });

  let eleventyDirectories;
  eleventyConfig.on("eleventy.directories", directories => {
    eleventyDirectories = directories;
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
      let { input, includes, layouts } = eleventyDirectories || this.config.directories;
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
          // loc is `{ file, line, column }` or `{ start: { line, column } }`
          let loc = e.loc?.start || e.loc;
          if(loc?.line !== undefined) {
            e.message = `Error in Vue file ${e.loc.file || e.id} on Line ${loc.line} Column ${loc.column}: ${e.message}`;
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
        // so if str has a value, it's a permalink (which can be a string or a function)
        // currently Vue template syntax in permalink string is not supported.
        let vueMixin = {
          methods: this.config.javascriptFunctions,
        };

        if (str) {
          if(typeof str === "function") {
            return str(data);
          }
          if(typeof str === "string" && str.trim().charAt(0) === "<") {
            return vueCompiler.renderString(str, data, vueMixin);
          }
          return str;
        }

        let vueComponent = vueCompiler.getComponent(inputPath);

        // if user attempts to render a Vue template in `serverPrefetch` or `data` to add to the data cascade
        // this will fail because data.page does not exist yet!
        if(data.page && options.cssBundleName) {
          let styles = vueCompiler.getCSSForComponentTree(inputPath);
          debug("Vue CSS: Adding %o block(s) from %o to %o", styles.length, inputPath, data.page.url);
          eleventyConfig.getBundleManagers()[options.cssBundleName].addToPage(data.page.url, styles, options.cssBundleBucket);
        }

        return vueCompiler.renderComponent(vueComponent, data, vueMixin);
      };
    }
  });
}

export { VueCompiler };
