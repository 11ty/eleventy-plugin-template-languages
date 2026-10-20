import EleventyWebcPlugin from "../../eleventyWebcPlugin.js";

let i = 0;

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyWebcPlugin, {
		before: (component) => {
			component.setUidFunction(function() {
				return `webc-${i++}`;
			});
		}
	});

	return {
		dir: {
			includes: "_includes",
			layouts: "_layouts",
		}
	}
}
