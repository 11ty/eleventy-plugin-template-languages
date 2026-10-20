/**
 *	@fileoverview Pug default options.
 */

export const DEFAULT_PUG_OPTIONS = {
	/**
	 *	The name of the file being compiled. Used in exceptions, and required for
	 *	relative `include`\s and `extend`\s.
	 *	@type {String}
	 *	@default 'Pug'
	 */
	filename: 'Pug',

	/**
	 *	The root directory of all absolute inclusion.
	 *	@type {String|undefined}
	 *	@default undefined
	 */
	basedir: undefined,

	/**
	 *	If the doctype is not specified as part of the template, you can specify it here.
	 *	It is sometimes useful to get self-closing tags and remove mirroring of boolean attributes.
	 *	See doctype documentation for more information.
	 *	@type {String|undefined}
	 *	@default undefined
	 */
	doctype: undefined,

	/**
	 *	[Deprecated.] Adds whitespace to the resulting HTML to make it easier for a human to read
	 *	using '  ' as indentation. If a string is specified, that will be used as indentation instead
	 *	(e.g. '\t').
	 *
	 *	We strongly recommend against using this option. Too often, it creates subtle bugs in your
	 *	templates because of the way it alters the interpretation and rendering of whitespace, and
	 *	so this feature is going to be removed. Defaults to `false`.
	 *
	 *	@type {Boolean|String}
	 *	@default false
	 */
	pretty: false,

	/**
	 *	Hash table of custom filters. Defaults to `undefined`.
	 *	@type {Object|undefined}
	 *	@default undefined
	 */
	filters: undefined,

	/**
	 *	Use a self namespace to hold the locals. It will speed up the compilation, but
	 *	instead of writing `variable` you will have to write `self.variable` to access
	 *	a property of the `locals` object. Defaults to `false`.
	 *	@type {Boolean}
	 *	@default false
	 */
	self: false,

	/**
	 *	If set to `true`, the tokens and function body are logged to stdout.
	 *	@type {Boolean}
	 *	@default false
	 */
	debug: false,

	/**
	 *	If set to `true`, the function source will be included in the compiled template for
	 *	better error messages (sometimes useful in development).
	 *	It is enabled by default, unless used with Express in production mode.
	 *	@type {Boolean}
	 *	@default true
	 */
	compileDebug: true,

	/**
	 *	Add a list of global names to make accessible in templates.
	 *	@type {Array<String>}
	 *	@default []
	 */
	globals: [],

	/**
	 *	(Only applies to `render*` functions.) If set to `true`, compiled functions
	 *	are cached. `filename` must be set as the cache key. Defaults to `false`.
	 *	@type {Boolean}
	 *	@default false
	 */
	cache: false,

	/**
	 *	Inline runtime functions instead of require-ing them from a shared version.
	 *
	 * 	For `compileClient*` functions, the default is `true` (so that one does not
	 * 	have to include the runtime).
	 *
	 *	For all other compilation or rendering types, the default is `false`.
	 *	@type {Boolean}
	 *	@default false
	 */
	inlineRuntimeFunctions: false,

	/**
	 *	(Only applies to `compileClient*` functions.) The name of the template function.
	 *	Defaults to 'template'.
	 *	@type {String}
	 *	@default 'template'
	 */
	name: 'template'
}

export default DEFAULT_PUG_OPTIONS
