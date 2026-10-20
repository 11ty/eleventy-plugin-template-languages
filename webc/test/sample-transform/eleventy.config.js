import fs from "node:fs";

import EleventyWebcPlugin from "../../eleventyWebcPlugin.js";

const pkg = JSON.parse(fs.readFileSync(new URL("../../package.json", import.meta.url), "utf8"));

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyWebcPlugin, {
		components: "./webc/test/sample-transform/_includes/*.webc",
		useTransform: true,
		transformData: { pkg: pkg }
	});

	return {
		dir: {
			includes: "_includes",
		}
	}
}