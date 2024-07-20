import pugExtension from '../../index.js'

export default function (eleventyConfig) {
	eleventyConfig.addPlugin(pugExtension)
	return {
		dir: {
			layouts: '_layouts'
		}
	}
}
