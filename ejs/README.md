# `@11ty/eleventy-plugin-ejs`

Adds support for `.ejs` (Embedded JavaScript templates) files in Eleventy v3.0 and newer. Support for [`ejs` was moved out of core as part of Project Slipstream](https://github.com/11ty/eleventy/pull/3074).

- 11ty Docs https://www.11ty.dev/docs/languages/ejs/
- `ejs` package: https://github.com/mde/ejs

## Installation

```sh
npm install @11ty/eleventy-plugin-ejs
```

Add to your configuration file (ESM version shown):

```js
import ejsPlugin from "@11ty/eleventy-plugin-ejs";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(ejsPlugin);
}
```

Use more `ejs` options ([full options list](https://github.com/mde/ejs#options)):

```js
import ejs from "ejs";
import ejsPlugin from "@11ty/eleventy-plugin-ejs";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(ejsPlugin, {
		async: false, // default

		// use <? ?> instead of <% %>
		delimiter: "?",

		// Override the `ejs` library instance
		eleventyLibraryOverride: ejs,
	});
}
```
