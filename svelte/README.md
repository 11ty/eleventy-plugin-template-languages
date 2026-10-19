<p align="center"><img src="https://www.11ty.dev/img/logo-github.svg" width="200" height="200" alt="eleventy Logo"></p>

# eleventy-plugin-svelte for Svelte 5 🕚⚡️🎈🐀

Adds Svelte component support to Eleventy. Eleventy processes `.svelte` files as Eleventy templates and outputs zero-bundle size server rendered components.

## Installation

```sh
npm install @11ty/eleventy-plugin-svelte
```

* `1.x` requires Eleventy `3.0.0` or newer, Svelte 5, and Node.js 22 or newer

## Features

* Builds `*.svelte` components, both in the input directory and in Eleventy’s includes directory. `.svelte` files in the includes directory are available for import and don’t write files to your output directory.
* Component `<style>` blocks (plus those of every imported component) are added to Eleventy’s `css` [bundle](https://www.11ty.dev/docs/plugins/bundle/) for the page.
* `<svelte:head>` content is added to Eleventy’s `head` bundle for the page.
* `export const data` (an object or function) from `<script module>` feeds into the data cascade.
* The page’s data cascade is passed to the page component as props.
* `page`, the full data cascade (`data`), and all JavaScript Template Functions, Universal Filters and Shortcodes (`functions`) are available to every component via [`getContext`](https://svelte.dev/docs/svelte/context).
* Top-level `await` works in components (Svelte’s async SSR).
* `.svelte.js` and `.svelte.ts` modules (runes outside components) are supported.
* Compiled components are cached in `cacheDirectory`: later builds skip compilation when no `.svelte` file, imported module, plugin option, or Svelte version has changed.
* `.svelte` files work as Eleventy layouts: render the child template with `{@html content}`, and chain to another layout with `layout` in `data`.

### Not Yet Available

* Does not yet embed any client-side JavaScript (hydration) into the output.

## Usage

### Add to Configuration File

Usually `eleventy.config.js`:

```js
import eleventySvelte from "@11ty/eleventy-plugin-svelte";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(eleventySvelte);
}
```

#### Output component CSS and `<svelte:head>`

In a layout:

```html
<head>
  {% getBundle "head" %}
  <style>{% getBundle "css" %}</style>
</head>
```

#### Customize with Options

```js
import eleventySvelte from "@11ty/eleventy-plugin-svelte";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(eleventySvelte, {
    // Directory to store compiled Svelte components
    cacheDirectory: ".cache/svelte/",

    // Pass in a file or multiple .svelte files to limit compilation
    // If this is empty, the plugin will search for all *.svelte files
    input: [],

    // Eleventy bundles that component CSS and <svelte:head> are added to (`false` to opt out)
    cssBundleName: "css",
    headBundleName: "head",

    // See https://www.11ty.dev/docs/plugins/bundle/#asset-bucketing
    cssBundleBucket: undefined,

    // See https://svelte.dev/docs/svelte/svelte-compiler#CompileOptions
    compilerOptions: {},

    // See https://svelte.dev/docs/svelte/svelte-compiler#preprocess
    preprocess: [],

    // Customize the Svelte context before each render (may be async)
    configureContext(context, data) {
      context.set("site", data.site);
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

To import Svelte component libraries from `node_modules`, add [`@rollup/plugin-node-resolve`](https://www.npmjs.com/package/@rollup/plugin-node-resolve) with `exportConditions: ["svelte"]` to `rollupOptions.plugins`.

### Example

```svelte
<script module>
  export const data = {
    layout: "base.njk",
    title: "Possums",
  };
</script>

<script>
  import { getContext } from "svelte";
  import Nav from "./_includes/nav.svelte";

  let { title, collections } = $props();
  const { url } = getContext("functions");
  const page = getContext("page");
</script>

<svelte:head>
  <meta name="description" content="Website about possums">
</svelte:head>

<Nav />
<h1>{title}</h1>
<a href={url("/about/")}>About</a>
<p>{page.url}</p>

<style>
  h1 { color: rebeccapurple; }
</style>
```

### Migrating from `eleventy-plugin-svelte`

* Svelte 5 is required.
* Pages use `.svelte` instead of `.11ty.svelte`. Components in the includes directory are not rendered as pages.
* Use `{% getBundle "css" %}` and `{% getBundle "head" %}` instead of `content.css` and `content.head`.
* Client-side hydration (`svelteClient`, `svelteData`, `dataFn`) is not supported.
