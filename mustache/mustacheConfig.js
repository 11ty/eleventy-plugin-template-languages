const fs = require("node:fs");

const mustache = require("mustache");
const fastglob = require("fast-glob");
const { TemplatePath } = require("@11ty/eleventy-utils");
const debug = require("debug")("Eleventy:Mustache");

async function getPartials(directories, extensions) {
	if (!directories?.includes) {
		return {
			files: [],
			partials: {},
		};
	}

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

	eleventyConfig.addTemplateFormats("mustache");

	// Partials
	let files = [];
	let partials = {};
	eleventyConfig.on("eleventy.resourceModified", async modifiedPath => {
		if(files.includes(modifiedPath)) {
			ret = await getPartials(eleventyConfig.directories, ["mustache"]);
			files = ret.files;
			partials = ret.partials;
		}
	});

	eleventyConfig.addExtension("mustache", {
		init: async () => {
			// Cache the partials
			let ret = await getPartials(eleventyConfig.directories, ["mustache"]);
			files = ret.files;
			partials = ret.partials;
		},
		compileOptions: {
			permalink: (contents, inputPath) => {
				if(typeof contents === "string") {
					return function(data) {
						return (libraryOverride || mustache).render(contents, data, partials);
					};
				}

				return contents;
			}
		},
		compile: (str, inputPath) => {
			return function(data) {
				return (libraryOverride || mustache).render(str, data, partials);
			};
		},
	});
};
