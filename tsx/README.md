# `@11ty/eleventy-plugin-tsx`

Adds support for TSX template files in Eleventy v3.0 and newer.

- 11ty Docs https://www.11ty.dev/docs/languages/typescript/
- `tsx` package: https://tsx.is
- `jsx-async-runtime` package: https://github.com/jeasx/jsx-async-runtime

## Installation

```sh
npm install @11ty/eleventy-plugin-tsx
```

Add to your configuration file (ESM version shown):

```js
import tsxPlugin from "@11ty/eleventy-plugin-tsx";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(tsxPlugin);
}
```

## How it works

Eleventy template files ending in `.11ty.tsx` will be processed by this plugin, by means of the [`tsx` project](https://tsx.is). `tsx` turns the template into JSX nodes using the [`esbuild`](https://esbuild.github.io) package.

To render into a string, this plugin uses a server-side renderer from the [`jsx-async-runtime`](https://github.com/jeasx/jsx-async-runtime) package. It is *not* client-side JSX. No React, Preact, etc. is needed in the browser.

Here is an example of a `MainLayout.11ty.tsx` template:

```tsx
export function render({ name, content }) {
	return (
		<body>
			<h1>{name}</h1>
			<div>{content}</div>
		</body>
	);
}
```
