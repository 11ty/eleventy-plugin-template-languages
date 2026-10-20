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

	const library = libraryOverride || haml;

	for(let [name, callback] of Object.entries(eleventyConfig.getFilters())) {
		library.filters[name] = function (string, buffer) {
			return buffer.push(callback(string));
		}
	}

	eleventyConfig.addTemplateFormats("haml");

	eleventyConfig.addExtension("haml", {
		compile: (str, inputPath) => {
			return library.compile(str);
		},
	});
};
