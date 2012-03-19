/*
SpiderGL Computer Graphics Library
Copyright (c) 2010, Marco Di Benedetto - Visual Computing Lab, ISTI - CNR
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of SpiderGL nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL PAUL BRUNT BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * @fileOverview Namespace
 */

/**
 * The SpiderGL namespace.
 *
 * @namespace The SpiderGL namespace.
 */
var SpiderGL = { };

/**
 * Utility tag for any use.
 *
 * @type any
 */
SpiderGL.TAG = 0;

/**
 * Publishes SpiderGL modules content to a global object.
 *
 * The effect is to pollute the global object with the SpiderGL symbols. At the same time, it allows a faster and less verbose code.
 *
 * @param {object} [options] Symbols publishing options.
 * @param {object} [options.globalObject=SpiderGL.openNamespace.DEFAULT_GLOBAL_OBJECT] The global object to which inject SpiderGL symbols.
 * @param {string} [options.constantPrefix=SpiderGL.openNamespace.DEFAULT_CONSTANT_PREFIX] String prefix for constants.
 * @param {string} [options.functionPrefix=SpiderGL.openNamespace.DEFAULT_FUNCTION_PREFIX] String prefix for functions. The first letter of the function identifier will be made capital.
 * @param {string} [options.classPrefix=SpiderGL.openNamespace.DEFAULT_CLASS_PREFIX] String prefix for classes and sub-modules.
 */
SpiderGL.openNamespace = function (options) {
	options = SpiderGL.Utility.getDefaultObject({
		globalObject   : SpiderGL.openNamespace.DEFAULT_GLOBAL_OBJECT,
		constantPrefix : SpiderGL.openNamespace.DEFAULT_CONSTANT_PREFIX,
		functionPrefix : SpiderGL.openNamespace.DEFAULT_FUNCTION_PREFIX,
		classPrefix    : SpiderGL.openNamespace.DEFAULT_CLASS_PREFIX
	}, options);

	var constantRegExp = new RegExp("^(([_\$0-9A-Z])+)$");
	function isConstant(name) {
		return constantRegExp.test(name);
	}

	var namespaceOrClassRegExp = new RegExp("^([A-Z])");
	function isNamespaceOrClass(name) {
		return (namespaceOrClassRegExp.test(name) && !isConstant(name));
	}

	var functionRegExp = new RegExp("^(([a-z])+([_\$0-9A-Za-z])*)$");
	function isFunction(name) {
		return functionRegExp.test(name);
	}

	function initialCap(name) {
		return (name.substr(0, 1).toUpperCase() + name.substr(1));
	}

	var classes    = { };
	var functions  = { };
	var constants  = { };

	function collect(module) {
		if (!module) return;
		for (var x in module) {
			if (x.substr(0, 1) == "_") continue;
			var y = module[x];
			if (isNamespaceOrClass(x)) {
				//if (classes[x]) log("Duplicate: " + x);
				classes[x] = y;
			}
			else if (isFunction(x)) {
				//if (functions[x]) log("Duplicate: " + x);
				functions[x] = y;
			}
			else if (isConstant(x)) {
				//if (constants[x]) log("Duplicate: " + x);
				constants[x] = y;
			}
			else {
				//log("Unknown : " + x);
			}
		}
	}

	var modules = [
		"Core",
		"DOM",
		"IO",
		"Math",
		"Mesh",
		"Model",
		"Semantic",
		"Space",
		"Type",
		"UserInterface",
		"Utility",
		"Version",
		"WebGL"
	];

	for (var x in modules) {
		collect(SpiderGL[modules[x]]);
	}

	for (var x in classes) {
		var name = options.classPrefix + initialCap(x);
		//log("CLASS    : " + name);
		options.globalObject[name] = classes[x];
	}

	for (var x in functions) {
		var name = options.functionPrefix + initialCap(x);
		//log("FUNCTION : " + name);
		options.globalObject[name] = functions[x];
	}

	for (var x in constants) {
		var name = options.constantPrefix + initialCap(x);
		//log("CONSTANT : " + name);
		options.globalObject[name] = constants[x];
	}
};

/**
 * Default publishing global object.
 *
 * @type object
 *
 * @default window
 */
SpiderGL.openNamespace.DEFAULT_GLOBAL_OBJECT = window;

/**
 * Default publishing prefix for constant symbols.
 *
 * @type string
 *
 * @default "SGL_"
 */
SpiderGL.openNamespace.DEFAULT_CONSTANT_PREFIX = "SGL_";

/**
 * Default publishing prefix for function symbols.
 *
 * @type string
 *
 * @default "sgl"
 */
SpiderGL.openNamespace.DEFAULT_FUNCTION_PREFIX = "sgl";

/**
 * Default publishing prefix for classes and sub-modules symbols.
 *
 * @type string
 *
 * @default "Sgl"
 */
SpiderGL.openNamespace.DEFAULT_CLASS_PREFIX = "Sgl";
