# `@11ty/eleventy-plugin-jsx`

Adds support for JSX template files in Eleventy v3.0 and newer.

- 11ty Docs https://www.11ty.dev/docs/languages/jsx/
- `tsx` package: https://tsx.is
- `react-dom` package: https://www.npmjs.com/package/react-dom

## Installation

```sh
npm install @11ty/eleventy-plugin-jsx
```

Add to your configuration file (ESM version shown):

```js
import jsxPlugin from "@11ty/eleventy-plugin-jsx";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(jsxPlugin);
}
```

## How it works

Eleventy template files ending in `.11ty.jsx` will be processed by this plugin, by means of the [`tsx` project](https://tsx.is). `tsx` turns the template into JSX nodes using the [`esbuild`](https://esbuild.github.io) package.

To render into a string, this plugin uses a server-side renderer from the [`react-dom`](https://www.npmjs.com/package/react-dom) package. It is *not* client-side React. No React is needed in the browser.

Here is an example of a `MainLayout.11ty.jsx` template:

```jsx
import * as React from "react";

export function render({ name, content }) {
	return (
		<body>
			<h1>{name}</h1>
			<div dangerouslySetInnerHTML={{__html: content}}></div>
		</body>
	);
}
```

This 11ty template gets `name` and `content` from the passed-in `data` object. Since `content` is a string of HTML, you pass it through the
`dangerouslySetInnerHTML` to get it into the result.

Why the `import` on the first line? It's needed to tell the toolchain where to get the functions that do the node processing behind-the-scenes. `esbuild` has ways of setting this, but `tsx` only supports this for TypeScript in `tsconfig.json`. If `tsx` would support the correct [`esbuild` flag](https://esbuild.github.io/content-types/#auto-import-for-jsx), we could skip this line when not using TypeScript.

Why the use of the React renderer? There are alternatives and `esbuild` has [a flag for that too](https://esbuild.github.io/content-types/#using-jsx-without-react). This isn't possible for the same reason: `tsx` needs a way to pass JSX options to `esbuild`.
