# `@11ty/eleventy-plugin-haml`

Adds support for `.haml` (Embedded JavaScript templates) files in Eleventy v3.0 and newer. Support for [`haml` was moved out of core as part of Project Slipstream](https://github.com/11ty/eleventy/pull/3074).

- 11ty Docs https://www.11ty.dev/docs/languages/haml/
- `hamljs` package: https://github.com/tj/haml.js

## Installation

```sh
npm install @11ty/eleventy-plugin-haml
```

Add to your configuration file (ESM version shown):

```js
import hamlPlugin from "@11ty/eleventy-plugin-haml";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(hamlPlugin);
}
```

Use more options:

```js
import haml from "hamljs";
import hamlPlugin from "@11ty/eleventy-plugin-haml";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(hamlPlugin, {
		// Override the `haml` library instance
		eleventyLibraryOverride: haml,
	});
}
```
