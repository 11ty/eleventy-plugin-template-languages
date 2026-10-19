<p align="center"><img src="https://www.11ty.dev/img/logo-github.svg" width="200" height="200" alt="eleventy Logo"></p>

# eleventy-plugin-vue for Vue 3 🕚⚡️🎈🐀

Adds Vue Single File Component (SFC) support to Eleventy. Eleventy processes `.vue` SFC files as Eleventy templates and outputs zero-bundle size server rendered components.

Read more about the goals of this plugin (and a full tutorial!) at [Eleventy and Vue, a match made to power Netlify.com](https://www.netlify.com/blog/2020/09/18/eleventy-and-vue-a-match-made-to-power-netlify.com/)

## Installation

```sh
npm install @11ty/eleventy-plugin-vue
```

* `2.x` requires Eleventy `3.0.0` or newer and Node.js 22 or newer
* `1.x` requires Eleventy `1.0.0` or newer
* `0.2.x` encouraged to use Eleventy `0.11.1` or newer (for incremental Vue component builds)
* `0.1.x` requires Eleventy `0.11.0` or newer
<!--
* `0.0.x` requires Eleventy 0.11.0 Beta 2 or above (`0.11.0-beta.2`)
-->

### Changelog

* `2.0.0` Requires Eleventy v3 and Node.js 22. Renames the `EleventyVue` export to `VueCompiler`. Component CSS moves to Eleventy’s `css` bundle: the `assets` option, `getVueComponentCssForPage` filter, and `@11ty/eleventy-assets` dependency were removed. Documents `.vue` layout support.
* `1.0.0` ([Milestone](https://github.com/11ty/eleventy-plugin-vue/milestone/6?closed=1)) Works with Vue 3. Adds Windows support.
* `0.6.x` ([Milestone](https://github.com/11ty/eleventy-plugin-vue/milestone/5?closed=1))
* `0.3.1` ([Milestone](https://github.com/11ty/eleventy-plugin-vue/milestone/4?closed=1))
* `0.3.0` ([Milestone](https://github.com/11ty/eleventy-plugin-vue/milestone/3?closed=1)) More consistent incremental builds. Performance improvements.
* `0.2.1` ([Milestone](https://github.com/11ty/eleventy-plugin-vue/milestone/2?closed=1)) adds incremental builds for Eleventy Vue components to avoid unnecessary repeat work. Fixes bug with `permalink` strings returned from Vue Single File Component data.
* `0.1.x` converted to use a Single File Components for everything (templates, components, etc), instead of `0.0.x`’s string templates with front matter.

## Features

* Builds `*.vue`’s Single File Components, both in the input directory and in Eleventy’s includes directory. `.vue` files in the includes directory are available for import. Same as any Eleventy template syntax, includes do not write files to your output directory.
* Works with Vue’s Single File Components, including with `scoped` CSS.
* Component `<style>` blocks (plus those of every imported component) are added to Eleventy’s `css` [bundle](https://www.11ty.dev/docs/plugins/bundle/) for the page.
* Data from SFC files feeds into the data cascade (similar to front matter)
* All JavaScript Template Functions (see https://www.11ty.dev/docs/languages/javascript/#javascript-template-functions), Universal Filters, Universal Shortcodes, Universal Paired Shortcodes are available as Vue `methods` (global functions to use in templates and child components). 
  * For example, you can  use the [`url` Universal Filter](https://www.11ty.dev/docs/filters/url/) like `url("/my-url/")` in your Vue templates.
* `page` Eleventy supplied data is also available globally in all components.
* `.vue` files work as Eleventy layouts: render the child template with `v-html="content"` on an element, and chain to another layout by returning `layout` from `data`.

### Not Yet Available

* Does not yet embed any client-side JavaScript from inside single file components into the output for use on the client.
* `lang` on `<template>`, `<style>`, or `<script>` is not yet supported.

## Usage

### Add to Configuration File

Usually `eleventy.config.js`:

```js
import eleventyVue from "@11ty/eleventy-plugin-vue";

export default function(eleventyConfig) {
  // Use Defaults
  eleventyConfig.addPlugin(eleventyVue);
}
```

#### Output component CSS

Use `{% getBundle "css" %}` in a layout:

```html
<style>{% getBundle "css" %}</style>
```

#### Customize with Options

```js
import autoprefixer from "autoprefixer";
import postcssNested from "postcss-nested";
import eleventyVue from "@11ty/eleventy-plugin-vue";

export default function(eleventyConfig) {
  // OR, Use your own options
  eleventyConfig.addPlugin(eleventyVue, {
    // Directory to store compiled Vue single file components
    cacheDirectory: ".cache/vue/",

    // Pass in a file or multiple .vue files to limit compilation
    // If this is empty, the plugin will search for all *.vue files
    input: [],

    // Eleventy bundle that component CSS is added to (`false` to opt out)
    cssBundleName: "css",

    // See https://www.11ty.dev/docs/plugins/bundle/#asset-bucketing
    cssBundleBucket: undefined,

    // Use postcss in the single file components
    rollupPluginVueOptions: {
      style: {
        postcssPlugins: [
          autoprefixer,
          postcssNested
        ]
      }
    },

    // Customize the Vue app before each render (may be async)
    configureApp(app, data) {
      app.component("my-global-component", MyGlobalComponent);
      app.config.globalProperties.$site = data.site;
    },

    // Passed to rollup.rollup
    rollupOptions: {
      // Declare your own external dependencies
      external: [],

      // Use your own Rollup plugins
      plugins: [],
    },
  });
}
```

For a full list of `rollupPluginVueOptions`, see [`rollup-plugin-vue`’s Options](https://rollup-plugin-vue.vuejs.org/options.html#include). To leave custom elements to the browser, use `rollupPluginVueOptions: { compilerOptions: { isCustomElement: tag => tag.includes("-") } }`.

`configureApp` receives the [Vue app instance](https://vuejs.org/api/application.html) and the page’s data, see [`app.config`](https://vuejs.org/api/application.html#app-config).

#### Advanced: Run async things before component render

_Available with Eleventy 1.0+ and Eleventy Vue Plugin 0.6+_

Use [`serverPrefetch`](https://ssr.vuejs.org/guide/data.html) to tell the component to do a few async things before it renders the component.

Below is an example of a Vue template that uses [the Eleventy Render Plugin](https://11ty.dev/docs/plugins/render/) to render Markdown (either in an external file or a string).

```html
<template>
  <header v-html="content"/>
</template>
<script>
export default {
  async serverPrefetch() {
    // let content = await this.renderFile("./_includes/blogpost.md", "md");
    this.content = await this.renderTemplate("# Title", "md");
  }
}
</script>
```

<!-- ## Relevant Links

* https://ssr.vuejs.org/
* https://vuejs.org/v2/guide/single-file-components.html
* https://vue-loader.vuejs.org/guide/scoped-css.html
* https://rollup-plugin-vue.vuejs.org/
* https://rollupjs.org/guide/en/ -->
<!-- https://github.com/tj/consolidate.js/ -->
