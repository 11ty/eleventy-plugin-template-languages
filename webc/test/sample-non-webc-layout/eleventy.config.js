import EleventyWebcPlugin from "../../eleventyWebcPlugin.js";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyWebcPlugin, {
		components: "./webc/test/sample-non-webc-layout/_includes/*.webc"
	});

	return {
		dir: {
			includes: "_includes",
			layouts: "_layouts",
		}
	}
}
