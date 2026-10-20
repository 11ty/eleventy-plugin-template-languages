import EleventyWebcPlugin from "../../eleventyWebcPlugin.js";

export default function (eleventyConfig) {
	eleventyConfig.addGlobalData("dynamicPermalink", false);
	eleventyConfig.addGlobalData("permalink", "page.html");

	eleventyConfig.addPlugin(EleventyWebcPlugin);
}
