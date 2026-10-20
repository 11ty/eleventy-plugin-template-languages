const EleventyWebcPlugin = require("../../eleventyWebcPlugin.js");

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyWebcPlugin, {
		components: "./webc/test/sample-transform/_includes/*.webc",
		useTransform: true,
		transformData: { pkg: require("../../package.json") }
	});

	return {
		dir: {
			includes: "_includes",
		}
	}
}