import EleventyWebcPlugin from "../../eleventyWebcPlugin.js";

export default function (eleventyConfig) {
	eleventyConfig.addGlobalData("permalink", () => ((data) => `${data.page.filePathStem}.html`));

	eleventyConfig.addPlugin(EleventyWebcPlugin);
}
