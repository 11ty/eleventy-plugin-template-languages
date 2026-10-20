import EleventyWebcPlugin from "../../eleventyWebcPlugin.js";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyWebcPlugin, {
		components: "webc/test/raw-layout-html/_includes/*.webc"
	});

	return {
		dir: {
			includes: "_includes",
			layouts: "_layouts",
		}
	}
}
