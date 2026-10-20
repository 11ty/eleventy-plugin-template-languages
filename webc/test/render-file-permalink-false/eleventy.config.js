import EleventyWebcPlugin from "../../eleventyWebcPlugin.js";
import { RenderPlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(EleventyWebcPlugin);
	eleventyConfig.addPlugin(RenderPlugin);
}
