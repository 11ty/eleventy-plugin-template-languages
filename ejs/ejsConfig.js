const ejs = require("ejs");

module.exports = function (eleventyConfig, options = {}) {
	eleventyConfig.versionCheck(">=3.0.0-alpha.1");

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
		options || {},
	);

	// Remove eleventy specific things from `options`
	let libraryOverride = options.eleventyLibraryOverride;
	delete options.eleventyLibraryOverride;

	eleventyConfig.addTemplateFormats("ejs");

	eleventyConfig.addExtension("ejs", {
		compileOptions: {
			permalink: (contents, inputPath) => {
				if(typeof contents === "string") {
					return (libraryOverride || ejs).compile(contents, options);
				}

				return contents;
			}
		},
		compile: (str, inputPath) => {
			let compiledOptions = Object.assign({}, options);
			if (inputPath) {
				compiledOptions.filename = inputPath;
			}

			return (libraryOverride || ejs).compile(str, compiledOptions);
		},
	});
};
