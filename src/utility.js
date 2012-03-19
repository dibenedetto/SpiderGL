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
 * @fileOverview Utility
 */

/**
 * The SpiderGL.Utility namespace.
 *
 * @namespace The SpiderGL.Utility namespace.
 */
SpiderGL.Utility = { };

/**
 * Gets default value for varibles.
 *
 * This function is used to get default values for optional variables.
 * If arg is undefined or is {@link SpiderGL.Core.DEFAULT}, then defaultValue will be returned. Otherwise, arg will be returned.
 *
 * @returns {any} Returns arg if arg is not undefined and is not {@link SpiderGL.Core.DEFAULT}, otherwise returns defaultValue.
 *
 * @example
 * var DEFAULT_V = 1;
 *
 * var v = null;
 * v = SpiderGL.Utility.getDefaultValue(someVar, DEFAULT_V); // someVar is undefined, so v = DEFAULT_V
 *
 * var someVar = 2;
 * v = SpiderGL.Utility.getDefaultValue(someVar, DEFAULT_V); // someVar is defined, so v = someVar
 *
 * var someVar = SpiderGL.Core.DEFAULT;
 * v = SpiderGL.Utility.getDefaultValue(someVar, DEFAULT_V); // someVar is SpiderGL.Core.DEFAULT, so v = DEFAULT_V
 *
 * @example
 * var DEFAULT_Y = 1;
 * var DEFAULT_Z = 2;
 *
 * function setObject(obj, x, options) {
 *   options = options || { }; // create an empty object to avoid testing for null
 *   obj.x = x;
 *   obj.y = SpiderGL.Utility.getDefaultValue(options.y, DEFAULT_Y);
 *   obj.z = SpiderGL.Utility.getDefaultValue(options.z, DEFAULT_Z);
 * }
 *
 * var obj = {
 *   x : 0,
 *   y : 1,
 *   z : 2
 * };
 *
 * setObject(obj, 3);        // obj = { x:3, y:DEFAULT_Y, z:DEFAULT_Z }
 * setObject(obj, 4, {z:5}); // obj = { x:4, y:DEFAULT_Y, z:5         }
 */
SpiderGL.Utility.getDefaultValue = function (arg, defaultValue) {
	if ((arg === undefined) || (arg === SpiderGL.Core.DEFAULT)) { return defaultValue; }
	return arg;
}

/**
 * Gets default values for objects.
 *
 * @param {object} defaultObj The object containing the default values.
 * @param {object} obj The object from which values are extracted.
 *
 * @returns {object} The modified defaultObj.
 */
SpiderGL.Utility.getDefaultObject = function (defaultObj, obj) {
	if (obj) {
		var sDefault = SpiderGL.Core.DEFAULT;
		//var getter = null;
		for (var p in obj) {
			/* getter = obj.__lookupGetter__(p);
			if (getter) {
				defaultObj.__defineGetter__(p, getter);
			}
			else */ if (obj[p] != sDefault) {
				defaultObj[p] = obj[p];
			}
		}
	}
	return defaultObj;
};

/**
 * Sets default values for the passed object.
 *
 * @param {object} defaultObj The object containing the default values.
 * @param {object} obj The object from which values are extracted.
 *
 * @returns {object} The modified obj. If obj is null, defaultObj will be returned.
 */
SpiderGL.Utility.setDefaultValues = function (defaultObj, obj) {
	if (!obj) return defaultObj;

	var sDefault = SpiderGL.Core.DEFAULT;
	for (var p in obj) {
		if (obj[p] == sDefault) {
			if (typeof defaultObj[p] != "undefined") {
				obj[p] = defaultObj[p];
			}
		}
	}
	for (var p in defaultObj) {
		if (typeof obj[p] == "undefined") {
			obj[p] = defaultObj[p];
		}
	}
	return obj;
};

/**
 * Converts the input arguments to a 4-component Float32Array.
 * The input value is handled like WebGL handles constant vertex attributes,
 * that is, if the input parameter is null, a number, or an array with less than four components,
 * missing values are taken from the array [0, 0, 0, 1] at the respective position. 
 *
 * @param {null|undefined|number|array|Float32Array} x The input value.
 *
 * @returns {array} a 4-component array.
 *
 * @example
 * x = SpiderGL.Utility.getAttrib4fv();                        // x = [0, 0, 0, 1]
 * x = SpiderGL.Utility.getAttrib4fv(null);                    // x = [0, 0, 0, 1]
 * x = SpiderGL.Utility.getAttrib4fv(undefined);               // x = [0, 0, 0, 1]
 * x = SpiderGL.Utility.getAttrib4fv(0);                       // x = [0, 0, 0, 1]
 * x = SpiderGL.Utility.getAttrib4fv(7);                       // x = [7, 0, 0, 1]
 * x = SpiderGL.Utility.getAttrib4fv([]);                      // x = [0, 0, 0, 1]
 * x = SpiderGL.Utility.getAttrib4fv([1]);                     // x = [1, 0, 0, 1]
 * x = SpiderGL.Utility.getAttrib4fv([1, 2]);                  // x = [1, 2, 0, 1]
 * x = SpiderGL.Utility.getAttrib4fv([1, 2, 3]);               // x = [1, 2, 3, 1]
 * x = SpiderGL.Utility.getAttrib4fv([1, 2, 3, 4, 5, 6]);      // x = [1, 2, 3, 4]
 * x = SpiderGL.Utility.getAttrib4fv(new Float32Array([0,9]);  // x = [0, 9, 0, 1]
 */
SpiderGL.Utility.getAttrib4fv = function (x) {
	if (SpiderGL.Type.isNumber(x)) return [x, 0, 0, 1];
	if (!x) return [0, 0, 0, 1];
	return [
		(x[0] != undefined) ? x[0] : 0,
		(x[1] != undefined) ? x[1] : 0,
		(x[2] != undefined) ? x[2] : 0,
		(x[3] != undefined) ? x[3] : 1
	];
}

/**
 * Gets the number of milliseconds elapsed since January 1, 1970 at 00:00.
 * It is a utility function for (new Date()).getTime().
 *
 * @returns {number} The number of milliseconds elapsed since January 1, 1970 at 00:00.
 */
SpiderGL.Utility.getTime = function () {
	return (new Date()).getTime();
};

SpiderGL.Utility.Timer = function () {
	this._tStart   = -1;
	this._tElapsed = 0;
}

SpiderGL.Utility.Timer.prototype = {
	_accumElapsed : function () {
		this._tElapsed += this.now - this._tStart;
	},

	get now() {
		return Date.now();
	},

	start : function () {
		if (this.isStarted) return;
		if (this.isPaused)  return;
		this._tStart   = this.now;
		this._tElapsed = 0;
	},

	restart : function () {
		var r = this.elapsed;
		this._tStart   = this.now;
		this._tElapsed = 0;
		return r;
	},

	stop : function () {
		if (!this.isStarted) return;
		if (this.isPaused)   return;
		this._accumElapsed();
		this._tStart = -1;
	},

	get isStarted() {
		return (this._tStart >= 0);
	},

	pause : function () {
		if (!this.isStarted) return;
		if (this.isPaused)   return;
		this._accumElapsed();
		this._tStart = -2;
	},

	resume : function () {
		if (!this.isStarted) return;
		if (!this.isPaused)  return;
		this._tStart = this.now;
	},

	get isPaused() {
		return (this._tStart == -2);
	},

	get elapsed() {
		return ((this.isStarted) ? (this._tElapsed + (this.now - this._tStart)) : (this._tElapsed))
	}
};
