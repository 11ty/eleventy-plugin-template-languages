<p align="center"><img src="https://www.11ty.dev/img/logo-github.svg" width="200" height="200" alt="11ty Logo"></p>

# eleventy-plugin-webc 🕚⚡️🎈🐀

Adds support for [WebC, the single file web component format](https://github.com/11ty/webc), to Eleventy.

* [This documentation has moved to 11ty.dev](https://www.11ty.dev/docs/languages/webc/).
* Watch the [crash course in Eleventy WebC on YouTube](https://www.youtube.com/watch?v=X-Bpjrkz-V8).
* Watch the [Interactive Components tutorial on YouTube](https://www.youtube.com/watch?v=p0wDUK0Z5Nw)

[![npm Version](https://img.shields.io/npm/v/@11ty/eleventy-plugin-webc.svg?style=for-the-badge)](https://www.npmjs.com/package/@11ty/eleventy-plugin-webc)

- Star [Eleventy on GitHub](https://github.com/11ty/eleventy/)!
- Follow us on Twitter [@eleven_ty](https://twitter.com/eleven_ty)
- Support [11ty on Open Collective](https://opencollective.com/11ty)
- Subscribe to our [YouTube channel](https://11ty.dev/youtube)

## [Documentation](https://www.11ty.dev/docs/languages/webc/)

This documentation has [moved to 11ty.dev](https://www.11ty.dev/docs/languages/webc/).

## Features

* Brings first-class **components** to Eleventy.
  * Expand any HTML element (including custom elements) to HTML with defined conventions from web standards.
  * This means that Web Components created with WebC are compatible with server-side rendering (without duplicating author-written markup)
  * WebC components are [Progressive Enhancement friendly](https://www.youtube.com/watch?v=p0wDUK0Z5Nw).
* Get first-class **incremental builds** (for page templates, components, and Eleventy layouts) when [used with `--incremental`](https://www.11ty.dev/docs/usage/#incremental-for-partial-incremental-builds)
* Streaming friendly (stream on the Edge 👀)
* Easily scope component CSS (or use your own scoping utility).
* Tired of importing components? Use global or per-page no-import components.
* Shadow DOM friendly (works with or without Shadow DOM)
* All configuration extensions/hooks into WebC are async-friendly out of the box.
* Bundler mode: Easily roll up the CSS and JS in-use by WebC components on a page for page-specific bundles. Dirt-simple critical CSS/JS to only load the code you need.
* For more complex templating needs, render any existing Eleventy template syntax (Liquid, markdown, Nunjucks, etc.) inside of WebC.
* Works great with [is-land](https://www.11ty.dev/docs/plugins/partial-hydration/) for web component hydration.

## Installation

```sh
npm install @11ty/eleventy-plugin-webc
```

* `0.12.x` requires Eleventy `3.0.0` or newer and Node.js 22.18 or newer

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
