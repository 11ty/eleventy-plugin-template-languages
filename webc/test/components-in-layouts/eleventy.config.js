import EleventyWebcPlugin from "../../eleventyWebcPlugin.js";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyWebcPlugin, {
		components: "webc/test/components-in-layouts/_components/**/*.webc"
	});

	return {
		dir: {
			includes: "_includes",
		}
	}
}
