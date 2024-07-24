# `@11ty/eleventy-plugin-pug`

Adds support for `.pug` files in Eleventy v3.0 and newer. Support for [`pug` was moved out of core as part of Project Slipstream](https://github.com/11ty/eleventy/pull/3074).

- 11ty Docs https://www.11ty.dev/docs/languages/pug/
- `pug` package: https://pugjs.org/

## Installation

```sh
npm install @11ty/eleventy-plugin-pug
```

Add to your configuration file (ESM version shown):

```js
import pugPlugin from "@11ty/eleventy-plugin-pug";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(pugPlugin);
}
```
