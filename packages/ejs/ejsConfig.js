const ejs = require("ejs");

module.exports = function(eleventyConfig, options = {}) {
	options = Object.assign(
		{
			// Makes more sense as `input`, but backwards compat here
			root: eleventyConfig.directories.includes,

			// Set via `compile` below
			// filename: eleventyConfig.directories.includes,

			compileDebug: true,

			async: false,

			// Override the ejs instance
			eleventyLibraryOverride: undefined,
		},
		options || {}
	);

	// Remove eleventy specific things from `options`
	let libraryOverride = options.eleventyLibraryOverride;
	delete options.eleventyLibraryOverride;

	eleventyConfig.addTemplateFormats("ejs");

	eleventyConfig.addExtension("ejs", {
		compile: (str, inputPath) => {
			let compiledOptions;
			if (inputPath) {
				compiledOptions = Object.assign({}, options);
				compiledOptions.filename = inputPath;
			} else {
				compiledOptions = options;
			}

			return (libraryOverride || ejs).compile(str, compiledOptions);
		}
	})
}
