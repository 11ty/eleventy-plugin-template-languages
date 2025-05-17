import "tsx/esm";
import { renderToStaticMarkup } from "react-dom/server";

export default function (eleventyConfig) {
	// Currently no options for configuration

	eleventyConfig.addTemplateFormats("jsx");

	eleventyConfig.addExtension("jsx", {
		// compileOptions: {
		// 	// Not sure if overriding permalink interpretation is
		// 	// something to implement, so leaving as default.
		// },
		key: "11ty.js",
		read: false,
		compile: function () {
			return async function (data) {
				// This is an extension of the 11ty renderer so go get it.
				let content = await this.defaultRenderer(data);
				return await renderToStaticMarkup(content);
			};
		},
	});
}
