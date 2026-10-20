import EleventyWebcPlugin from "../../eleventyWebcPlugin.js";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyWebcPlugin, {
		useTransform: true
	});

	return {
		dir: {
			includes: "_includes",
			layouts: "_layouts",
		}
	}
}
