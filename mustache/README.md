# `@11ty/eleventy-plugin-mustache`

Adds support for `.mustache` (Embedded JavaScript templates) files in Eleventy v3.0 and newer. Support for [`mustache` was moved out of core as part of Project Slipstream](https://github.com/11ty/eleventy/pull/3074).

- 11ty Docs https://www.11ty.dev/docs/languages/mustache/
- `mustache` package: https://github.com/janl/mustache.js

## Installation

```sh
npm install @11ty/eleventy-plugin-mustache
```

Add to your configuration file (ESM version shown):

```js
import mustachePlugin from "@11ty/eleventy-plugin-mustache";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(mustachePlugin);
}
```

Use more options:

```js
import mustache from "mustache";
import mustachePlugin from "@11ty/eleventy-plugin-mustache";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(mustachePlugin, {
		// Override the `mustache` library instance
		eleventyLibraryOverride: mustache,
	});
}
```
