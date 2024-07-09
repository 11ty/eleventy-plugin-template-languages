# `@11ty/eleventy-plugin-handlebars`

Adds support for `.hbs` (Handlebars) files in Eleventy v3.0 and newer. Support for [`hbs` was moved out of core as part of Project Slipstream](https://github.com/11ty/eleventy/pull/3074).

- 11ty Docs https://www.11ty.dev/docs/languages/handlebars/
- `handlebars` package: https://github.com/handlebars-lang/handlebars.js

Re-uses Universal Filters, Universal Shortcodes, and Universal Paired Shortcodes.

## Installation

```sh
npm install @11ty/eleventy-plugin-handlebars
```

Add to your configuration file (ESM version shown):

```js
import handlebarsPlugin from "@11ty/eleventy-plugin-handlebars";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(handlebarsPlugin);
}
```

Use more options:

```js
import handlebars from "handlebars";
import handlebarsPlugin from "@11ty/eleventy-plugin-handlebars";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(handlebarsPlugin, {
		// Override the `ejs` library instance
		eleventyLibraryOverride: handlebars,
	});
}
```
