const haml = require("hamljs");

module.exports = function (eleventyConfig, options = {}) {
	eleventyConfig.versionCheck(">=3.0.0-alpha.1");

	options = Object.assign(
		{
			// Override the instance
			eleventyLibraryOverride: undefined,
		},
		options || {},
	);

	// Remove eleventy specific things from `options`
	let libraryOverride = options.eleventyLibraryOverride;
	delete options.eleventyLibraryOverride;

	eleventyConfig.addTemplateFormats("haml");

	eleventyConfig.addExtension("haml", {
		compile: (str, inputPath) => {
			return (libraryOverride || haml).compile(str);
		},
	});
};
