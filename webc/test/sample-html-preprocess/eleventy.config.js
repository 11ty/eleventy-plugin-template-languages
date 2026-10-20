const EleventyWebcPlugin = require("../../eleventyWebcPlugin.js");

module.exports = function (eleventyConfig) {
	eleventyConfig.addGlobalData("webcPkg", require("../../package.json"));

	eleventyConfig.addPlugin(EleventyWebcPlugin, {
		components: "./webc/test/sample-html-preprocess/_includes/*.webc",
	});

	return {
		dir: {
			includes: "_includes",
		},
		htmlTemplateEngine: "webc"
	}
}
