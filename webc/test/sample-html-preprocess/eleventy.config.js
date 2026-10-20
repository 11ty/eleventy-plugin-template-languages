import fs from "node:fs";

import EleventyWebcPlugin from "../../eleventyWebcPlugin.js";

const pkg = JSON.parse(fs.readFileSync(new URL("../../package.json", import.meta.url), "utf8"));

export default function (eleventyConfig) {
	eleventyConfig.addGlobalData("webcPkg", pkg);

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
