<p align="center"><img src="https://www.11ty.dev/img/logo-github.svg" width="200" height="200" alt="eleventy Logo"></p>

# eleventy-plugin-webc 🕚⚡️🎈🐀

Adds support for [WebC, the single file web component format](https://github.com/11ty/webc), to Eleventy. Eleventy processes `.webc` files as Eleventy templates and outputs server rendered components.

Full documentation is at [11ty.dev/docs/languages/webc/](https://www.11ty.dev/docs/languages/webc/).

## Installation

```sh
npm install @11ty/eleventy-plugin-webc
```

* `0.12.x` requires Eleventy `3.0.0` or newer and Node.js 18 or newer
* This package is ESM-only: `require()` from a CommonJS configuration file needs Node.js 20.19+ or 22.12+.

## Features

* Builds `*.webc` files as Eleventy templates and layouts.
* Global no-import components (via the `components` option) or per-page components (via `webc.components` in front matter).
* Component `<style>` and `<script>` blocks are added to Eleventy’s `css` and `js` [bundles](https://www.11ty.dev/docs/plugins/bundle/) for the page.
* All JavaScript Template Functions, Universal Filters and Shortcodes are available as WebC helpers.
* Render any Eleventy template syntax (Liquid, Markdown, Nunjucks, etc.) inside WebC with `webc:type="11ty"`.
* Incremental builds for pages, components, and layouts when [used with `--incremental`](https://www.11ty.dev/docs/usage/#incremental-for-partial-incremental-builds).
* Works great with [is-land](https://www.11ty.dev/docs/plugins/partial-hydration/) for web component hydration.

## Usage

### Add to Configuration File

Usually `eleventy.config.js`:

```js
import eleventyWebc from "@11ty/eleventy-plugin-webc";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(eleventyWebc);
}
```

#### Output component CSS and JS

In a WebC layout:

```html
<head>
  <style @raw="getBundle('css')" webc:keep></style>
  <script type="module" @raw="getBundle('js')" webc:keep></script>
</head>
```

In a Nunjucks or Liquid layout:

```html
<head>
  <style>{% getBundle "css" %}</style>
  <script type="module">{% getBundle "js" %}</script>
</head>
```

#### Customize with Options

```js
import eleventyWebc from "@11ty/eleventy-plugin-webc";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(eleventyWebc, {
    // Glob (or array of globs) of no-import global components, `npm:` prefix for packages
    components: "_components/**/*.webc",

    // Helpers only available under `webc.helpers` (e.g. `webc.helpers.css()`) instead of top-level
    scopedHelpers: ["css", "js", "html"],

    // Process WebC in all non-WebC `.html` output
    useTransform: false,

    // Extra global data for `useTransform`
    transformData: {},

    // Passed to the Bundle plugin, see https://www.11ty.dev/docs/plugins/bundle/
    bundlePluginOptions: {
      hoistDuplicateBundlesFor: ["css", "js"],
    },

    // Customize the WebC instance before each render (may be async)
    before(webc) {},
  });
}
```

### Example

`_components/my-greeting.webc`:

```html
<p>Hello, <span @text="name"></span>!</p>

<style webc:scoped>
  :host { color: rebeccapurple; }
</style>
```

`index.webc`:

```html
---
layout: base.webc
title: Possums
---
<h1 @text="title"></h1>
<my-greeting name="Possum"></my-greeting>
```

To use components for only one page, add `webc.components` to its front matter (relative to the template, or the project root with `~/`):

```yaml
---
webc:
  components: ./_page-components/*.webc
---
```
