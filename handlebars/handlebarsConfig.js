const fs = require("node:fs");
const handlebars = require("handlebars");
const fastglob = require("fast-glob");
const { TemplatePath } = require("@11ty/eleventy-utils");
const debug = require("debug")("Eleventy:Handlebars");

async function getPartials(directories) {
	if (!directories?.includes) {
		return {
			files: [],
			partials: {},
		};
	}

	let extensions = ["hbs"];
	let results = [];
	let partialFiles = [];
	let prefix = directories.includes + "**/*.";

	await Promise.all(
		extensions.map(async function (extension) {
			partialFiles = partialFiles.concat(
				await fastglob(prefix + extension, {
					caseSensitiveMatch: false,
					dot: true,
				})
			);
		})
	);

	results = await Promise.all(
		partialFiles.map((partialFile) => {
			partialFile = TemplatePath.addLeadingDotSlash(partialFile);
			let partialPath = TemplatePath.stripLeadingSubPath(partialFile, directories.includes);
			let partialPathNoExt = partialPath;
			extensions.forEach(function (extension) {
				partialPathNoExt = TemplatePath.removeExtension(partialPathNoExt, "." + extension);
			});

			return fs.promises
				.readFile(partialFile, {
					encoding: "utf8",
				})
				.then((content) => {
					return {
						content,
						path: partialPathNoExt,
					};
				});
		})
	);

	let partials = {};
	for (let result of results) {
		partials[result.path] = result.content;
	}

	debug(
		`${directories.includes}/*.{${extensions}} found partials for: %o`,
		Object.keys(partials)
	);

	return {
		files: partialFiles,
		partials,
	};
}

module.exports = function (eleventyConfig, options = {}) {
	eleventyConfig.versionCheck(">= 3.0.0-alpha.15");

	options = Object.assign(
		{
			// Override the ejs instance
			eleventyLibraryOverride: undefined,
		},
		options || {},
	);

	eleventyConfig.addTemplateFormats("hbs");

	// Remove eleventy specific things from `options`
	let library = options.eleventyLibraryOverride || handlebars;
	delete options.eleventyLibraryOverride;

	// Filters
	for(let [name, filter] of Object.entries(eleventyConfig.getFilters())) {
		library.registerHelper(name, filter);
	}

	// Shortcodes
	for(let [name, shortcode] of Object.entries(eleventyConfig.getShortcodes())) {
		library.registerHelper(name, shortcode);
	}

	// Paired Shortcodes
	for(let [name, shortcode] of Object.entries(eleventyConfig.getPairedShortcodes())) {
		library.registerHelper(name, function (...args) {
			let options = args[args.length - 1];
			let content = "";
			if (options && options.fn) {
				content = options.fn(this);
			}

			return shortcode.call(this, content, ...args);
		});

	}

	// Partials
	let files = [];
	eleventyConfig.on("eleventy.resourceModified", async modifiedPath => {
		if(files.includes(modifiedPath)) {
			ret = await getPartials(eleventyConfig.directories);
			files = ret.files;
			library.registerPartial(ret.partials);
		}
	});

	eleventyConfig.addExtension("hbs", {
		init: async () => {
			// Cache the partials
			let ret = await getPartials(eleventyConfig.directories);
			files = ret.files;
			library.registerPartial(ret.partials);
		},
		compile: (str, inputPath) => {
			return library.compile(str);
		},
	});
};
