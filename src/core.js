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
 * @fileOverview Core
 */

/**
 * The SpiderGL.Core namespace.
 *
 * @namespace The SpiderGL.Core namespace.
 */
SpiderGL.Core = { };

/**
 * Default token.
 *
 * This constant can be used to set a parameter to its default value.
 *
 * @constant
 * @type object
 *
 * @example
 * texture.setSampler({
 *   wrapS : gl.REPEAT,
 *   wrapT : SpiderGL.Core.DEFAULT // set to the default value gl.CLAMP_TO_EDGE
 * });
 */
SpiderGL.Core.DEFAULT = { };

/**
 * Don't care token.
 *
 * This constant can be used to avoid setting policy/behavior parameter.
 *
 * @constant
 * @type object
 *
 * @example
 * texture.setImage({
 *   data  : image,
 *   flipY : SpiderGL.Core.DONT_CARE // overrides the texture automatic flipY policy and keeps current gl setting
 * });
 */
SpiderGL.Core.DONT_CARE = { };

/**
 * Alias for "".
 *
 * @constant
 * @type string
 */
SpiderGL.Core.EMPTY_STRING = "";

/**
 * Alias for { }.
 *
 * @constant
 * @type object
*/
SpiderGL.Core.EMPTY_OBJECT = { };

/**
 * Alias for [ ].
 *
 * @constant
 * @type array
*/
SpiderGL.Core.EMPTY_ARRAY = [ ];

/**
 * Alias for function () { }.
 *
 * It can be used as a function parameter or event handler to avoid checking whether the provided function is not null or undefined.
 *
 * @constant
 * @type function
 *
 * @example
 * // avoid test for null/undefined when invoking an event handler
 * someObject.onSomeEvent = SpiderGL.Core.EMPTY_FUNCTION;
 */
SpiderGL.Core.EMPTY_FUNCTION = function () { };

/**
 * Generates a unique id.
 *
 * @returns {number} A unique id.
 */
SpiderGL.Core.generateUID = function () {
	SpiderGL.Core.generateUID._lastUID++;
	return SpiderGL.Core.generateUID._lastUID;
}

SpiderGL.Core.generateUID._lastUID = 0;

/**
 * Creates a SpiderGL.Core.ObjectBase
 *
 * SpiderGL.Core.ObjectBase is the base class for all SpiderGL classes.
 *
 * @class The SpiderGL.Core.ObjectBase is the base class for all SpiderGL classes.
 */
SpiderGL.Core.ObjectBase = function () {
	this._uid = SpiderGL.Core.generateUID();
};

SpiderGL.Core.ObjectBase.prototype = {
	/**
	 * The object unique identifier.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get uid() {
		return this._uid;
	}
};
