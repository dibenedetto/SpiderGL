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
 * @fileOverview WebGL
 */

/**
 * The SpiderGL.WebGL namespace.
 *
 * @namespace The SpiderGL.WebGL namespace.
 * 
 * The SpiderGL.WebGL namespace gives access to WebGL functionalities in terms of context creation and enhancement, and object wrappers.
 * The main purpose of the module is to provide a robust and intuitive way of dealing with all native WebGL objects (e.g., textures, framebuffers, etc.).
 * Each specialized wrapper handles creation/destruction, edit operations (i.e. parameter settings), and binding of the underlying native WebGL object (the GL handle).
 * To allow low level access and integration with existing code, the native handle is exposed. On the other side, wrappers can be created for already existing native objects,
 * ensuring that the same wrapper will be used for multiple wraps of the same object.
 * To create a robust interoperability between wrapper usage and native WebGL calls on handles, wrappers must be informed whenever any single native call operates on the wrapped handle.
 * SpiderGL handles this task by hijacking the WebGLRenderingContext object, and installing on it a set of extensions that use callback mechanisms to report changes to wrappers.
 * Moreover, to overcome the bind-to-edit/bind-to-use paradigm typical of the OpenGL API family, SpiderGL injects an extension that is insired by GL_EXT_direct_state_access extension.
 */
SpiderGL.WebGL = { };

/**
 * The SpiderGL.WebGL.Context namespace.
 *
 * @namespace The SpiderGL.WebGL.Context namespace.
 */
SpiderGL.WebGL.Context = { };

/**
 * The string for obtaining a WebGLRenderingContext from a canvas.
 *
 * @constant
 *
 * @see SpiderGL.WebGL.Context.get
 */
SpiderGL.WebGL.Context.WEBGL_STRING = "experimental-webgl";

/**
 * Default value for pixel unpack parameter WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL.
 *
 * @default true
 *
 * @see SpiderGL.WebGL.Context.DEFAULT_UNPACK_PREMULTIPLY_ALPHA
 * @see SpiderGL.WebGL.Context.DEFAULT_UNPACK_COLORSPACE_CONVERSION
 * @see SpiderGL.WebGL.Context.setStandardGLUnpack
 */
SpiderGL.WebGL.Context.DEFAULT_UNPACK_FLIP_Y = true;

/**
 * Default value for pixel unpack parameter WebGLRenderingContext.UNPACK_PREMULTIPLY_ALPHA_WEBGL.
 *
 * @default true
 *
 * @see SpiderGL.WebGL.Context.DEFAULT_UNPACK_FLIP_Y
 * @see SpiderGL.WebGL.Context.DEFAULT_UNPACK_COLORSPACE_CONVERSION
 * @see SpiderGL.WebGL.Context.setStandardGLUnpack
 */
SpiderGL.WebGL.Context.DEFAULT_UNPACK_PREMULTIPLY_ALPHA = false;

/**
 * Default value for pixel unpack parameter WebGLRenderingContext.UNPACK_COLORSPACE_CONVERSION_WEBGL.
 *
 * @default WebGLRenderingContext.NONE
 *
 * @see SpiderGL.WebGL.Context.DEFAULT_UNPACK_FLIP_Y
 * @see SpiderGL.WebGL.Context.DEFAULT_UNPACK_PREMULTIPLY_ALPHA
 * @see SpiderGL.WebGL.Context.setStandardGLUnpack
 */
SpiderGL.WebGL.Context.DEFAULT_UNPACK_COLORSPACE_CONVERSION = WebGLRenderingContext.NONE;

/**
 * Retrieves the WebGLRenderingContext from a canvas.
 *
 * The WebGLRenderingContext is obtained by calling the getContext() method of the canvas object.
 *
 * @param {HTMLCanvasElement} canvas The HTMLCanvasElement from which retrieve the WebGL context.
 * @param {object} args The optional WebGL context arguments.
 *
 * @returns {WebGLRenderingContext} The canvas WebGL rendering context.
 *
 * @see SpiderGL.WebGL.Context.hijack
 * @see SpiderGL.WebGL.Context.getHijacked
 */
SpiderGL.WebGL.Context.get = function (canvas, args) {
	var c = canvas;
	if (SpiderGL.Type.isString(c)) { c = SpiderGL.DOM.getElementById(c); }
	if (!SpiderGL.Type.instanceOf(c, HTMLCanvasElement)) { return null; }
	var ctx = c.getContext(SpiderGL.WebGL.Context.WEBGL_STRING, args);
	return ctx;
}

SpiderGL.WebGL.Context._prepareContex = function (gl) {
	if (!gl) return;

	var sgl = gl._spidergl;
	if (sgl) return;

	sgl = { };
	gl._spidergl = sgl;
	sgl.TAG = 0;
	sgl.gl = gl;

	var glFunctions = { };
	sgl.glFunctions = glFunctions;
	for (var f in gl) {
		var fn = gl[fn];
		if (typeof fn == "function") {
			glFunctions[f] = fn;
		}
	}
};

SpiderGL.WebGL.Context._addExtension = function (gl, extName, propName, setupFunc) {
	if (!gl) return;

	var getExtension = gl.getExtension;
	gl.getExtension = function (name) {
		if (name == extName) {
			var sgl = this._spidergl;
			if (!sgl) return null;
			var pubExt = sgl[propName];
			if (!pubExt) {
				pubExt = { };

				pubExt.TAG = 0;

				var ext = { };
				pubExt._ext = ext;

				ext[propName] = pubExt;
				ext.sgl = sgl;
				ext.gl  = gl;

				var glFunctions = { };
				ext.glFunctions = glFunctions;

				if (!setupFunc(gl, pubExt)) return null;

				sgl[propName] = pubExt;
			}
			return pubExt;
		}
		return getExtension.call(this, name);
	};
};

SpiderGL.WebGL.Context._setup_SGL_current_binding = function (gl, pubExt) {
	if (!gl) return false;
	if (!pubExt) return false;
	if (!gl._spidergl) return false;
	if (gl._spidergl.cb) return false;

	var cb = pubExt;
	var ext = cb._ext;
	var glFunctions = ext.glFunctions;



	// buffer
	//////////////////////////////////////////////////////////////////////////////////////////
	ext.currentBuffer = { };
	ext.currentBuffer[gl.ARRAY_BUFFER        ] = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
	ext.currentBuffer[gl.ELEMENT_ARRAY_BUFFER] = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);

	ext.bufferStack = { };
	ext.bufferStack[gl.ARRAY_BUFFER        ] = [ ];
	ext.bufferStack[gl.ELEMENT_ARRAY_BUFFER] = [ ];

	glFunctions.bindBuffer = gl.bindBuffer;
	gl.bindBuffer = function (target, buffer) {
		var ext = this._spidergl.cb._ext;
		var current = ext.currentBuffer[target];
		if (current == buffer) return;
		ext.currentBuffer[target] = buffer;
		ext.glFunctions.bindBuffer.call(this, target, buffer);
	};

	cb.getCurrentBuffer = function (target) {
		return this._ext.currentBuffer[target];
	};

	cb.pushBuffer = function (target) {
		var ext = this._ext;
		var stack  = ext.bufferStack[target];
		var buffer = ext.currentBuffer[target];
		stack.push(buffer);
	};

	cb.popBuffer = function (target) {
		var ext = this._ext;
		var stack = ext.bufferStack[target];
		if (stack.length <= 0) return;
		var buffer = stack.pop();
		ext.gl.bindBuffer(target, buffer);
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// framebuffer
	//////////////////////////////////////////////////////////////////////////////////////////
	ext.currentFramebuffer = { };
	ext.currentFramebuffer[gl.FRAMEBUFFER] = gl.getParameter(gl.FRAMEBUFFER_BINDING);

	ext.framebufferStack = { };
	ext.framebufferStack[gl.FRAMEBUFFER] = [ ];

	glFunctions.bindFramebuffer = gl.bindFramebuffer;
	gl.bindFramebuffer = function (target, framebuffer) {
		var ext = this._spidergl.cb._ext;
		var current = ext.currentFramebuffer[target];
		if (current == framebuffer) return;
		ext.currentFramebuffer[target] = framebuffer;
		ext.glFunctions.bindFramebuffer.call(this, target, framebuffer);
	};

	cb.getCurrentFramebuffer = function (target) {
		return this._ext.currentFramebuffer[target];
	};

	cb.pushFramebuffer = function (target) {
		var ext = this._ext;
		var stack  = ext.framebufferStack[target];
		var framebuffer = ext.currentFramebuffer[target];
		stack.push(framebuffer);
	};

	cb.popFramebuffer = function (target) {
		var ext = this._ext;
		var stack = ext.framebufferStack[target];
		if (stack.length <= 0) return;
		var framebuffer = stack.pop();
		ext.gl.bindFramebuffer(target, framebuffer);
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// program
	//////////////////////////////////////////////////////////////////////////////////////////
	ext.currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);

	ext.programStack = [ ];

	glFunctions.useProgram = gl.useProgram;
	gl.useProgram = function (program) {
		var ext = this._spidergl.cb._ext;
		var current = ext.currentProgram;
		if (current == program) return;
		ext.currentProgram = program;
		ext.glFunctions.useProgram.call(this, program);
	};

	cb.getCurrentProgram = function () {
		return this._ext.currentProgram;
	};

	cb.pushProgram = function () {
		var ext = this._ext;
		var stack = ext.programStack;
		var program = ext.currentProgram;
		stack.push(program);
	};

	cb.popProgram = function () {
		var ext = this._ext;
		var stack = ext.programStack;
		if (stack.length <= 0) return;
		var program = stack.pop();
		ext.gl.useProgram(program);
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// renderbuffer
	//////////////////////////////////////////////////////////////////////////////////////////
	ext.currentRenderbuffer = { };
	ext.currentRenderbuffer[gl.RENDERBUFFER] = gl.getParameter(gl.RENDERBUFFER_BINDING);

	ext.renderbufferStack = { };
	ext.renderbufferStack[gl.RENDERBUFFER] = [ ];

	glFunctions.bindRenderbuffer = gl.bindRenderbuffer;
	gl.bindRenderbuffer = function (target, renderbuffer) {
		var ext = this._spidergl.cb._ext;
		var current = ext.currentRenderbuffer[target];
		if (current == renderbuffer) return;
		ext.currentRenderbuffer[target] = renderbuffer;
		ext.glFunctions.bindRenderbuffer.call(this, target, renderbuffer);
	};

	cb.getCurrentRenderbuffer = function (target) {
		return this._ext.currentRenderbuffer[target];
	};

	cb.pushRenderbuffer = function (target) {
		var ext = this._ext;
		var stack  = ext.renderbufferStack[target];
		var renderbuffer = ext.currentRenderbuffer[target];
		stack.push(renderbuffer);
	};

	cb.popRenderbuffer = function (target) {
		var ext = this._ext;
		var stack = ext.renderbufferStack[target];
		if (stack.length <= 0) return;
		var renderbuffer = stack.pop();
		ext.gl.bindRenderbuffer(target, renderbuffer);
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// shader
	//////////////////////////////////////////////////////////////////////////////////////////
	ext.currentShader = { };
	ext.currentShader[gl.VERTEX_SHADER  ] = null;
	ext.currentShader[gl.FRAGMENT_SHADER] = null;

	ext.shaderStack = { };
	ext.shaderStack[gl.VERTEX_SHADER  ] = [ ];
	ext.shaderStack[gl.FRAGMENT_SHADER] = [ ];

	ext.glFunctions.bindShader = function (target, shader) { };
	cb.bindShader = function (target, shader) {
		var ext = this._ext;
		var current = ext.currentShader[target];
		if (current == shader) return;
		ext.currentShader[target] = shader;
		ext.glFunctions.bindShader.call(ext.gl, target, shader);
	};

	cb.getCurrentShader = function (target) {
		return this._ext.currentShader[target];
	};

	cb.pushShader = function (target) {
		var ext = this._ext;
		var stack  = ext.shaderStack[target];
		var shader = ext.currentShader[target];
		stack.push(shader);
	};

	cb.popShader = function (target) {
		var ext = this._ext;
		var stack = ext.shaderStack[target];
		if (stack.length <= 0) return;
		var shader = stack.pop();
		ext.gl.bindShader(target, shader);
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// texture
	//////////////////////////////////////////////////////////////////////////////////////////
	ext.currentTexture = { };

	var currentTextureUnit = gl.getParameter(gl.ACTIVE_TEXTURE);
	var textureUnitsCount  = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
	ext.currentTexture = { };
	ext.textureStack = { };
	ext.textureUnitStack = [ ];
	for (var i=0; i<textureUnitsCount; ++i) {
		var textureUnit = gl.TEXTURE0 + i;
		gl.activeTexture(textureUnit);

		var textureBindings = { }
		textureBindings[gl.TEXTURE_2D      ] = gl.getParameter(gl.TEXTURE_BINDING_2D);
		textureBindings[gl.TEXTURE_CUBE_MAP] = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
		ext.currentTexture[textureUnit] = textureBindings;

		var textureStacks = { }
		textureStacks[gl.TEXTURE_2D      ] = [ ];
		textureStacks[gl.TEXTURE_CUBE_MAP] = [ ];
		ext.textureStack[textureUnit] = textureStacks;
	}
	gl.activeTexture(currentTextureUnit);
	ext.currentTextureUnit = currentTextureUnit;

	glFunctions.activeTexture = gl.activeTexture;
	gl.activeTexture = function (texture) {
		var ext = this._spidergl.cb._ext;
		var current = ext.currentTextureUnit;
		if (current == texture) return;
		ext.currentTextureUnit = texture;
		ext.glFunctions.activeTexture.call(this, texture);
	};

	cb.getCurrentTextureUnit = function () {
		return this._ext.currentTextureUnit;
	};

	cb.pushTextureUnit = function () {
		var ext = this._ext;
		var stack  = ext.textureUnitStack;
		var unit = ext.currentTextureUnit;
		stack.push(unit);
	};

	cb.popTextureUnit = function () {
		var ext = this._ext;
		var stack  = ext.textureUnitStack;
		if (stack.length <= 0) return;
		var unit = stack.pop();
		ext.gl.activeTexture(unit);
	};

	glFunctions.bindTexture = gl.bindTexture;
	gl.bindTexture = function (target, texture) {
		var ext = this._spidergl.cb._ext;
		var unit = ext.currentTextureUnit;
		var current = ext.currentTexture[unit][target];
		if (current == texture) return;
		ext.currentTexture[unit][target] = texture;
		ext.glFunctions.bindTexture.call(this, target, texture);
	};

	cb.getCurrentTexture = function (target) {
		var ext = this._ext;
		var unit = ext.currentTextureUnit;
		return ext.currentTexture[unit][target];
	};

	cb.pushTexture = function (target) {
		var ext = this._ext;
		var unit = ext.currentTextureUnit;
		var stack  = ext.textureStack[unit][target];
		var texture = ext.currentTexture[unit][target];
		stack.push(texture);
	};

	cb.popTexture = function (target) {
		var ext = this._ext;
		var unit = ext.currentTextureUnit;
		var stack  = ext.textureStack[unit][target];
		if (stack.length <= 0) return;
		var texture = stack.pop();
		ext.gl.bindTexture(target, texture);
	};
	//////////////////////////////////////////////////////////////////////////////////////////

	return true;
};

SpiderGL.WebGL.Context._setup_SGL_wrapper_notify = function (gl, pubExt) {
	if (!gl) return false;
	if (!pubExt) return false;
	if (!gl._spidergl) return false;
	if (gl._spidergl.wn) return false;

	var wn = pubExt;
	var ext = wn._ext;
	var glFunctions = ext.glFunctions;

	ext.cb = gl.getExtension("SGL_current_binding");
	if (!ext.cb) return false;



	// buffer
	//////////////////////////////////////////////////////////////////////////////////////////
	glFunctions.deleteBuffer = gl.deleteBuffer;
	gl.deleteBuffer = function (buffer) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.deleteBuffer.apply(this, arguments);
		var current = buffer;
		(current && current._spidergl && current._spidergl._gl_deleteBuffer.apply(current._spidergl, arguments));
	};

	glFunctions.isBuffer = gl.isBuffer;
	gl.isBuffer = function (buffer) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.isBuffer.apply(this, arguments);
		var current = buffer;
		(current && current._spidergl && current._spidergl._gl_isBuffer.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.bindBuffer = gl.bindBuffer;
	gl.bindBuffer = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.bindBuffer.apply(this, arguments);
		var current = ext.cb.getCurrentBuffer(target);
		(current && current._spidergl && current._spidergl._gl_bindBuffer.apply(current._spidergl, arguments));
	};

	glFunctions.getBufferParameter = gl.getBufferParameter;
	gl.getBufferParameter = function (target) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getBufferParameter.apply(this, arguments);
		var current = ext.cb.getCurrentBuffer(target);
		(current && current._spidergl && current._spidergl._gl_getBufferParameter.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.bufferData = gl.bufferData;
	gl.bufferData = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.bufferData.apply(this, arguments);
		var current = ext.cb.getCurrentBuffer(target);
		(current && current._spidergl && current._spidergl._gl_bufferData.apply(current._spidergl, arguments));
	}

	glFunctions.bufferSubData = gl.bufferSubData;
	gl.bufferSubData = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.bufferSubData.apply(this, arguments);
		var current = ext.cb.getCurrentBuffer(target);
		(current && current._spidergl && current._spidergl._gl_bufferSubData.apply(current._spidergl, arguments));
	}

	glFunctions.vertexAttribPointer = gl.vertexAttribPointer;
	gl.vertexAttribPointer = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.vertexAttribPointer.apply(this, arguments);
		var target  = this.ARRAY_BUFFER;
		var current = ext.cb.getCurrentBuffer(target);
		(current && current._spidergl && current._spidergl._gl_vertexAttribPointer.apply(current._spidergl, arguments));
	};

	glFunctions.drawElements = gl.drawElements;
	gl.drawElements = function (buffer, mode, count, type, offset) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.drawElements.apply(this, arguments);
		var target  = this.ELEMENT_ARRAY_BUFFER;
		var current = ext.cb.getCurrentBuffer(target);
		(current && current._spidergl && current._spidergl._gl_drawElements.apply(current._spidergl, arguments));
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// framebuffer
	//////////////////////////////////////////////////////////////////////////////////////////
	glFunctions.deleteFramebuffer = gl.deleteFramebuffer;
	gl.deleteFramebuffer = function (framebuffer) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.deleteFramebuffer.apply(this, arguments);
		var current = framebuffer;
		(current && current._spidergl && current._spidergl._gl_deleteFramebuffer.apply(current._spidergl, arguments));
	};

	glFunctions.isFramebuffer = gl.isFramebuffer;
	gl.isFramebuffer = function (framebuffer) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.isFramebuffer.apply(this, arguments);
		var current = framebuffer;
		(current && current._spidergl && current._spidergl._gl_isFramebuffer.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.bindFramebuffer = gl.bindFramebuffer;
	gl.bindFramebuffer = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.bindFramebuffer.apply(this, arguments);
		var current = ext.cb.getCurrentFramebuffer(target);
		(current && current._spidergl && current._spidergl._gl_bindFramebuffer.apply(current._spidergl, arguments));
	};

	glFunctions.checkFramebufferStatus = gl.checkFramebufferStatus;
	gl.checkFramebufferStatus = function (target) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.checkFramebufferStatus.apply(this, arguments);
		var current = ext.cb.getCurrentFramebuffer(target);
		(current && current._spidergl && current._spidergl._gl_checkFramebufferStatus.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getFramebufferAttachmentParameter = gl.getFramebufferAttachmentParameter;
	gl.getFramebufferAttachmentParameter = function (target) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getFramebufferAttachmentParameter.apply(this, arguments);
		var current = ext.cb.getCurrentFramebuffer(target);
		(current && current._spidergl && current._spidergl._gl_getFramebufferAttachmentParameter.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.framebufferRenderbuffer = gl.framebufferRenderbuffer;
	gl.framebufferRenderbuffer = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.framebufferRenderbuffer.apply(this, arguments);
		var current = ext.cb.getCurrentFramebuffer(target);
		(current && current._spidergl && current._spidergl._gl_framebufferRenderbuffer.apply(current._spidergl, arguments));
	}

	glFunctions.framebufferTexture2D = gl.framebufferTexture2D;
	gl.framebufferTexture2D = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.framebufferTexture2D.apply(this, arguments);
		var current = ext.cb.getCurrentFramebuffer(target);
		(current && current._spidergl && current._spidergl._gl_framebufferTexture2D.apply(current._spidergl, arguments));
	};

	glFunctions.clear = gl.clear;
	gl.clear = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.clear.apply(this, arguments);
		var target = this.FRAMEBUFFER;
		var current = ext.cb.getCurrentFramebuffer(target);
		(current && current._spidergl && current._spidergl._gl_clear.apply(current._spidergl, arguments));
	};

	glFunctions.readPixels = gl.readPixels;
	gl.readPixels = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.readPixels.apply(this, arguments);
		var target = this.FRAMEBUFFER;
		var current = ext.cb.getCurrentFramebuffer(target);
		(current && current._spidergl && current._spidergl._gl_readPixels.apply(current._spidergl, arguments));
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// program
	//////////////////////////////////////////////////////////////////////////////////////////
	glFunctions.deleteProgram = gl.deleteProgram;
	gl.deleteProgram = function (program) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.deleteProgram.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_deleteProgram.apply(current._spidergl, arguments));
	};

	glFunctions.isProgram = gl.isProgram;
	gl.isProgram = function (program) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.isProgram.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_isProgram.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.useProgram = gl.useProgram;
	gl.useProgram = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.useProgram.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_useProgram.apply(current._spidergl, arguments));
	};

	glFunctions.getActiveAttrib = gl.getActiveAttrib;
	gl.getActiveAttrib = function (program) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getActiveAttrib.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_getActiveAttrib.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getActiveUniform = gl.getActiveUniform;
	gl.getActiveUniform = function (program) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getActiveUniform.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_getActiveUniform.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getAttachedShaders = gl.getAttachedShaders;
	gl.getAttachedShaders = function (program) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getAttachedShaders.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_getAttachedShaders.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getAttribLocation = gl.getAttribLocation;
	gl.getAttribLocation = function (program) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getAttribLocation.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_getAttribLocation.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getProgramParameter = gl.getProgramParameter;
	gl.getProgramParameter = function (program) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getProgramParameter.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_getProgramParameter.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getProgramInfoLog = gl.getProgramInfoLog;
	gl.getProgramInfoLog = function (program) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getProgramInfoLog.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_getProgramInfoLog.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getUniform = gl.getUniform;
	gl.getUniform = function (program) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getUniform.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_getUniform.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getUniformLocation = gl.getUniformLocation;
	gl.getUniformLocation = function (program) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getUniformLocation.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_getUniformLocation.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.attachShader = gl.attachShader;
	gl.attachShader = function (program) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.attachShader.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_attachShader.apply(current._spidergl, arguments));
	};

	glFunctions.bindAttribLocation = gl.bindAttribLocation;
	gl.bindAttribLocation = function (program) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.bindAttribLocation.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_bindAttribLocation.apply(current._spidergl, arguments));
	};

	glFunctions.detachShader = gl.detachShader;
	gl.detachShader = function (program) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.detachShader.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_detachShader.apply(current._spidergl, arguments));
	};

	glFunctions.linkProgram = gl.linkProgram;
	gl.linkProgram = function (program) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.linkProgram.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_linkProgram.apply(current._spidergl, arguments));
	};

	glFunctions.uniform1f = gl.uniform1f;
	gl.uniform1f = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform1f.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform1f.apply(current._spidergl, arguments));
	};

	glFunctions.uniform1fv = gl.uniform1fv;
	gl.uniform1fv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform1fv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform1fv.apply(current._spidergl, arguments));
	};

	glFunctions.uniform1i = gl.uniform1i;
	gl.uniform1i = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform1i.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform1i.apply(current._spidergl, arguments));
	};

	glFunctions.uniform1iv = gl.uniform1iv;
	gl.uniform1iv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform1iv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform1iv.apply(current._spidergl, arguments));
	};

	glFunctions.uniform2f = gl.uniform2f;
	gl.uniform2f = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform2f.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform2f.apply(current._spidergl, arguments));
	};

	glFunctions.uniform2fv = gl.uniform2fv;
	gl.uniform2fv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform2fv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform2fv.apply(current._spidergl, arguments));
	};

	glFunctions.uniform2i = gl.uniform2i;
	gl.uniform2i = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform2i.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform2i.apply(current._spidergl, arguments));
	};

	glFunctions.uniform2iv = gl.uniform2iv;
	gl.uniform2iv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform2iv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform2iv.apply(current._spidergl, arguments));
	};

	glFunctions.uniform3f = gl.uniform3f;
	gl.uniform3f = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform3f.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform3f.apply(current._spidergl, arguments));
	};

	glFunctions.uniform3fv = gl.uniform3fv;
	gl.uniform3fv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform3fv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform3fv.apply(current._spidergl, arguments));
	};

	glFunctions.uniform3i = gl.uniform3i;
	gl.uniform3i = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform3i.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform3i.apply(current._spidergl, arguments));
	};

	glFunctions.uniform3iv = gl.uniform3iv;
	gl.uniform3iv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform3iv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform3iv.apply(current._spidergl, arguments));
	};

	glFunctions.uniform4f = gl.uniform4f;
	gl.uniform4f = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform4f.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform4f.apply(current._spidergl, arguments));
	};

	glFunctions.uniform4fv = gl.uniform4fv;
	gl.uniform4fv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform4fv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform4fv.apply(current._spidergl, arguments));
	};

	glFunctions.uniform4i = gl.uniform4i;
	gl.uniform4i = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform4i.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform4i.apply(current._spidergl, arguments));
	};

	glFunctions.uniform4iv = gl.uniform4iv;
	gl.uniform4iv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniform4iv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniform4iv.apply(current._spidergl, arguments));
	};

	glFunctions.uniformMatrix2fv = gl.uniformMatrix2fv;
	gl.uniformMatrix2fv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniformMatrix2fv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniformMatrix2fv.apply(current._spidergl, arguments));
	};

	glFunctions.uniformMatrix3fv = gl.uniformMatrix3fv;
	gl.uniformMatrix3fv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniformMatrix3fv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniformMatrix3fv.apply(current._spidergl, arguments));
	};

	glFunctions.uniformMatrix4fv = gl.uniformMatrix4fv;
	gl.uniformMatrix4fv = function () {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.uniformMatrix4fv.apply(this, arguments);
		var current = ext.cb.getCurrentProgram();
		(current && current._spidergl && current._spidergl._gl_uniformMatrix4fv.apply(current._spidergl, arguments));
	};

	glFunctions.validateProgram = gl.validateProgram;
	gl.validateProgram = function (program) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.validateProgram.apply(this, arguments);
		var current = program;
		(current && current._spidergl && current._spidergl._gl_validateProgram.apply(current._spidergl, arguments));
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// renderbuffer
	//////////////////////////////////////////////////////////////////////////////////////////
	glFunctions.deleteRenderbuffer = gl.deleteRenderbuffer;
	gl.deleteRenderbuffer = function (renderbuffer) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.deleteRenderbuffer.apply(this, arguments);
		var current = renderbuffer;
		(current && current._spidergl && current._spidergl._gl_deleteRenderbuffer.apply(current._spidergl, arguments));
	};

	glFunctions.isRenderbuffer = gl.isRenderbuffer;
	gl.isRenderbuffer = function (renderbuffer) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.isRenderbuffer.apply(this, arguments);
		var current = renderbuffer;
		(current && current._spidergl && current._spidergl._gl_isRenderbuffer.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.bindRenderbuffer = gl.bindRenderbuffer;
	gl.bindRenderbuffer = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.bindRenderbuffer.apply(this, arguments);
		var current = ext.cb.getCurrentRenderbuffer(target);
		(current && current._spidergl && current._spidergl._gl_bindRenderbuffer.apply(current._spidergl, arguments));
	};

	glFunctions.getRenderbufferParameter = gl.getRenderbufferParameter;
	gl.getRenderbufferParameter = function (target) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getRenderbufferParameter.apply(this, arguments);
		var current = ext.cb.getCurrentRenderbuffer(target);
		(current && current._spidergl && current._spidergl._gl_getRenderbufferParameter.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.renderbufferStorage = gl.renderbufferStorage;
	gl.renderbufferStorage = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.renderbufferStorage.apply(this, arguments);
		var current = ext.cb.getCurrentRenderbuffer(target);
		(current && current._spidergl && current._spidergl._gl_renderbufferStorage.apply(current._spidergl, arguments));
	}
	//////////////////////////////////////////////////////////////////////////////////////////



	// shader
	//////////////////////////////////////////////////////////////////////////////////////////
	glFunctions.deleteShader = gl.deleteShader;
	gl.deleteShader = function (shader) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.deleteShader.apply(this, arguments);
		var current = shader;
		(current && current._spidergl && current._spidergl._gl_deleteShader.apply(current._spidergl, arguments));
	};

	glFunctions.isShader = gl.isShader;
	gl.isShader = function (shader) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.isShader.apply(this, arguments);
		var current = shader;
		(current && current._spidergl && current._spidergl._gl_isShader.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getShaderParameter = gl.getShaderParameter;
	gl.getShaderParameter = function (shader) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getShaderParameter.apply(this, arguments);
		var current = shader;
		(current && current._spidergl && current._spidergl._gl_getShaderParameter.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getShaderInfoLog = gl.getShaderInfoLog;
	gl.getShaderInfoLog = function (shader) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getShaderInfoLog.apply(this, arguments);
		var current = shader;
		(current && current._spidergl && current._spidergl._gl_getShaderInfoLog.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.getShaderSource = gl.getShaderSource;
	gl.getShaderSource = function (shader) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getShaderSource.apply(this, arguments);
		var current = shader;
		(current && current._spidergl && current._spidergl._gl_getShaderSource.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.compileShader = gl.compileShader;
	gl.compileShader = function (shader) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.compileShader.apply(this, arguments);
		var current = shader;
		(current && current._spidergl && current._spidergl._gl_compileShader.apply(current._spidergl, arguments));
	}

	glFunctions.shaderSource = gl.shaderSource;
	gl.shaderSource = function (shader) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.shaderSource.apply(this, arguments);
		var current = shader;
		(current && current._spidergl && current._spidergl._gl_shaderSource.apply(current._spidergl, arguments));
	}
	//////////////////////////////////////////////////////////////////////////////////////////



	// texture
	//////////////////////////////////////////////////////////////////////////////////////////
	ext.textureTargetMap = { };
	ext.textureTargetMap[gl.TEXTURE_2D                 ] = gl.TEXTURE_2D;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP           ] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_POSITIVE_X] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_NEGATIVE_X] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_POSITIVE_Y] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_NEGATIVE_Y] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_POSITIVE_Z] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_NEGATIVE_Z] = gl.TEXTURE_CUBE_MAP;

	glFunctions.deleteTexture = gl.deleteTexture;
	gl.deleteTexture = function (texture) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.deleteTexture.apply(this, arguments);
		var current = texture;
		(current && current._spidergl && current._spidergl._gl_deleteTexture.apply(current._spidergl, arguments));
	};

	glFunctions.isTexture = gl.isTexture;
	gl.isTexture = function (texture) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.isTexture.apply(this, arguments);
		var current = texture;
		(current && current._spidergl && current._spidergl._gl_isTexture.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.bindTexture = gl.bindTexture;
	gl.bindTexture = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.bindTexture.apply(this, arguments);
		var current = ext.cb.getCurrentTexture(target);
		(current && current._spidergl && current._spidergl._gl_bindTexture.apply(current._spidergl, arguments));
	};

	glFunctions.getTexParameter = gl.getTexParameter;
	gl.getTexParameter = function (target) {
		var ext = this._spidergl.wn._ext;
		var r = ext.glFunctions.getTexParameter.apply(this, arguments);
		var current = ext.cb.getCurrentTexture(target);
		(current && current._spidergl && current._spidergl._gl_getTexParameter.apply(current._spidergl, arguments));
		return r;
	};

	glFunctions.copyTexImage2D = gl.copyTexImage2D;
	gl.copyTexImage2D = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.copyTexImage2D.apply(this, arguments);
		var texTarget = ext.textureTargetMap[target];
		var current = ext.cb.getCurrentTexture(texTarget);
		(current && current._spidergl && current._spidergl._gl_copyTexImage2D.apply(current._spidergl, arguments));
	}

	glFunctions.copyTexSubImage2D = gl.copyTexSubImage2D;
	gl.copyTexSubImage2D = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.copyTexSubImage2D.apply(this, arguments);
		var texTarget = ext.textureTargetMap[target];
		var current = ext.cb.getCurrentTexture(texTarget);
		(current && current._spidergl && current._spidergl._gl_copyTexSubImage2D.apply(current._spidergl, arguments));
	}

	glFunctions.generateMipmap = gl.generateMipmap;
	gl.generateMipmap = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.generateMipmap.apply(this, arguments);
		var current = ext.cb.getCurrentTexture(target);
		(current && current._spidergl && current._spidergl._gl_generateMipmap.apply(current._spidergl, arguments));
	}

	glFunctions.texImage2D = gl.texImage2D;
	gl.texImage2D = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.texImage2D.apply(this, arguments);
		var texTarget = ext.textureTargetMap[target];
		var current = ext.cb.getCurrentTexture(texTarget);
		(current && current._spidergl && current._spidergl._gl_texImage2D.apply(current._spidergl, arguments));
	}

	glFunctions.texParameterf = gl.texParameterf;
	gl.texParameterf = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.texParameterf.apply(this, arguments);
		var current = ext.cb.getCurrentTexture(target);
		(current && current._spidergl && current._spidergl._gl_texParameterf.apply(current._spidergl, arguments));
	}

	glFunctions.texParameteri = gl.texParameteri;
	gl.texParameteri = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.texParameteri.apply(this, arguments);
		var current = ext.cb.getCurrentTexture(target);
		(current && current._spidergl && current._spidergl._gl_texParameteri.apply(current._spidergl, arguments));
	}

	glFunctions.texSubImage2D = gl.texSubImage2D;
	gl.texSubImage2D = function (target) {
		var ext = this._spidergl.wn._ext;
		ext.glFunctions.texSubImage2D.apply(this, arguments);
		var texTarget = ext.textureTargetMap[target];
		var current = ext.cb.getCurrentTexture(texTarget);
		(current && current._spidergl && current._spidergl._gl_texSubImage2D.apply(current._spidergl, arguments));
	}
	//////////////////////////////////////////////////////////////////////////////////////////

	return true;
};

SpiderGL.WebGL.Context._setup_SGL_direct_state_access = function (gl, pubExt) {
	if (!gl) return false;
	if (!pubExt) return false;
	if (!gl._spidergl) return false;
	if (gl._spidergl.dsa) return false;

	var dsa = pubExt;
	var ext = dsa._ext;
	var glFunctions = ext.glFunctions;

	ext.cb = gl.getExtension("SGL_current_binding");
	if (!ext.cb) return false;

	// buffer
	//////////////////////////////////////////////////////////////////////////////////////////
	dsa.getBufferParameter = function (buffer, target, pname) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentBuffer(target);
		(current != buffer) && gl.bindBuffer(target, buffer);
		var r = gl.getBufferParameter(target, pname);
		(current != buffer) && gl.bindBuffer(target, current);
		return r;
	};

	dsa.bufferData = function (buffer, target, dataOrSize, usage) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentBuffer(target);
		(current != buffer) && gl.bindBuffer(target, buffer);
		gl.bufferData(target, dataOrSize, usage);
		(current != buffer) && gl.bindBuffer(target, current);
	}

	dsa.bufferSubData = function (buffer, target, offset, data) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentBuffer(target);
		(current != buffer) && gl.bindBuffer(target, buffer);
		gl.bufferSubData(target, offset, data);
		(current != buffer) && gl.bindBuffer(target, current);
	}

	dsa.vertexAttribPointer = function (buffer, indx, size, type, normalized, stride, offset) {
		var ext = this._ext;
		var gl  = ext.gl;
		var target  = gl.ARRAY_BUFFER;
		var current = ext.cb.getCurrentBuffer(target);
		(current != buffer) && gl.bindBuffer(target, buffer);
		gl.vertexAttribPointer(indx, size, type, normalized, stride, offset);
		(current != buffer) && gl.bindBuffer(target, current);
	};

	dsa.drawElements = function (buffer, mode, count, type, offset) {
		var ext = this._ext;
		var gl  = ext.gl;
		var target  = gl.ELEMENT_ARRAY_BUFFER;
		var current = ext.cb.getCurrentBuffer(target);
		(current != buffer) && gl.bindBuffer(target, buffer);
		gl.drawElements(mode, count, type, offset);
		(current != buffer) && gl.bindBuffer(target, current);
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// framebuffer
	//////////////////////////////////////////////////////////////////////////////////////////
	dsa.checkFramebufferStatus = function (framebuffer, target) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentFramebuffer(target);
		(current != framebuffer) && gl.bindFramebuffer(target, framebuffer);
		var r = gl.checkFramebufferStatus(target);
		(current != framebuffer) && gl.bindFramebuffer(target, current);
		return r;
	};

	dsa.getFramebufferAttachmentParameter = function (framebuffer, target, attachment, pname) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentFramebuffer(target);
		(current != framebuffer) && gl.bindFramebuffer(target, framebuffer);
		var r = gl.getFramebufferAttachmentParameter(target, attachment, pname);
		(current != framebuffer) && gl.bindFramebuffer(target, current);
		return r;
	};

	dsa.framebufferRenderbuffer = function (framebuffer, target, attachment, renderbuffertarget, renderbuffer) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentFramebuffer(target);
		(current != framebuffer) && gl.bindFramebuffer(target, framebuffer);
		gl.framebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer);
		(current != framebuffer) && gl.bindFramebuffer(target, current);
	};

	dsa.framebufferTexture2D = function (framebuffer, target, attachment, textarget, texture, level) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentFramebuffer(target);
		(current != framebuffer) && gl.bindFramebuffer(target, framebuffer);
		gl.framebufferTexture2D(target, attachment, textarget, texture, level);
		(current != framebuffer) && gl.bindFramebuffer(target, current);
	};

	dsa.clear = function (framebuffer, mask) {
		var ext = this._ext;
		var gl  = ext.gl;
		var target = gl.FRAMEBUFFER
		var current = ext.cb.getCurrentFramebuffer(target);
		(current != framebuffer) && gl.bindFramebuffer(target, framebuffer);
		gl.clear(mask);
		(current != framebuffer) && gl.bindFramebuffer(target, current);
	};

	dsa.readPixels = function (framebuffer, x, y, width, height, format, type, pixels) {
		var ext = this._ext;
		var gl  = ext.gl;
		var target = gl.FRAMEBUFFER
		var current = ext.cb.getCurrentFramebuffer(target);
		(current != framebuffer) && gl.bindFramebuffer(target, framebuffer);
		gl.readPixels(x, y, width, height, format, type, pixels);
		(current != framebuffer) && gl.bindFramebuffer(target, current);
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// program
	//////////////////////////////////////////////////////////////////////////////////////////
	dsa.uniform1f = function (program, location, x) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform1f(location, x);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform1fv = function (program, location, v) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform1fv(location, v);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform1i = function (program, location, x) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform1i(location, x);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform1iv = function (program, location, v) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform1iv(location, v);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform2f = function (program, location, x, y) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform2f(location, x, y);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform2fv = function (program, location, v) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform2fv(location, v);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform2i = function (program, location, x, y) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform2i(location, x, y);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform2iv = function (program, location, v) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform2iv(location, v);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform3f = function (program, location, x, y, z) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform3f(location, x, y, z);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform3fv = function (program, location, v) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform3fv(location, v);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform3i = function (program, location, x, y, z) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform3i(location, x, y, z);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform3iv = function (program, location, v) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform3iv(location, v);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform4f = function (program, location, x, y, z, w) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform4f(location, x, y, z, w);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform4fv = function (program, location, v) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform4fv(location, v);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform4i = function (program, location, x, y, z, w) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform4i(location, x, y, z, w);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniform4iv = function (program, location, v) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniform4iv(location, v);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniformMatrix2fv = function (program, location, transpose, value) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniformMatrix2fv(location, transpose, value);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniformMatrix3fv = function (program, location, transpose, value) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniformMatrix3fv(location, transpose, value);
		(current != program) && gl.useProgram(current);
	};

	dsa.uniformMatrix4fv = function (program, location, transpose, value) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentProgram();
		(current != program) && gl.useProgram(program);
		gl.uniformMatrix4fv(location, transpose, value);
		(current != program) && gl.useProgram(current);
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// renderbuffer
	//////////////////////////////////////////////////////////////////////////////////////////
	dsa.getRenderbufferParameter = function (renderbuffer, target, pname) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentRenderbuffer(target);
		(current != renderbuffer) && gl.bindRenderbuffer(target, renderbuffer);
		var r = gl.getRenderbufferParameter.call(gl, target, pname);
		(current != renderbuffer) && gl.bindRenderbuffer(target, current);
		return r;
	};

	dsa.renderbufferStorage = function (renderbuffer, target, internalformat, width, height) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentRenderbuffer(target);
		(current != renderbuffer) && gl.bindRenderbuffer(target, renderbuffer);
		gl.renderbufferStorage(target, internalformat, width, height);
		(current != renderbuffer) && gl.bindRenderbuffer(target, current);
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// shader
	//////////////////////////////////////////////////////////////////////////////////////////
	// NO DSA FUNCTIONS
	dsa.shaderIsNull = function (shader) {
		return (shader == null);
	};
	//////////////////////////////////////////////////////////////////////////////////////////



	// texture
	//////////////////////////////////////////////////////////////////////////////////////////
	ext.textureTargetMap = { };
	ext.textureTargetMap[gl.TEXTURE_2D                 ] = gl.TEXTURE_2D;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP           ] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_POSITIVE_X] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_NEGATIVE_X] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_POSITIVE_Y] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_NEGATIVE_Y] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_POSITIVE_Z] = gl.TEXTURE_CUBE_MAP;
	ext.textureTargetMap[gl.TEXTURE_CUBE_MAP_NEGATIVE_Z] = gl.TEXTURE_CUBE_MAP;

	dsa.getTexParameter = function (texture, target, pname) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentTexture(target);
		(current != texture) && gl.bindTexture(target, texture);
		var r = gl.getTexParameter(target, pname);
		(current != texture) && gl.bindTexture(target, current);
		return r;
	};

	dsa.copyTexImage2D = function (texture, target, level, internalformat, x, y, width, height, border) {
		var ext = this._ext;
		var gl  = ext.gl;
		var texTarget = ext.textureTargetMap[target];
		var current = ext.cb.getCurrentTexture(texTarget);
		(current != texture) && gl.bindTexture(texTarget, texture);
		gl.copyTexImage2D(target, level, internalformat, x, y, width, height, border);
		(current != texture) && gl.bindTexture(texTarget, current);
	};

	dsa.copyTexSubImage2D = function (texture, target, level, xoffset, yoffset, x, y, width, height, border) {
		var ext = this._ext;
		var gl  = ext.gl;
		var texTarget = ext.textureTargetMap[target];
		var current = ext.cb.getCurrentTexture(texTarget);
		(current != texture) && gl.bindTexture(texTarget, texture);
		gl.copyTexSubImage2D(target, level, xoffset, yoffset, x, y, width, height, border);
		(current != texture) && gl.bindTexture(texTarget, current);
	};

	dsa.generateMipmap = function (texture, target) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentTexture(target);
		(current != texture) && gl.bindTexture(target, texture);
		gl.generateMipmap(target);
		(current != texture) && gl.bindTexture(target, current);
	};

	dsa.texImage2D = function (texture, target) {
		var ext = this._ext;
		var gl  = ext.gl;
		var texTarget = ext.textureTargetMap[target];
		var current = ext.cb.getCurrentTexture(texTarget);
		(current != texture) && gl.bindTexture(texTarget, texture);
		var args = Array.prototype.slice.call(arguments, 1);
		gl.texImage2D.apply(gl, args);
		(current != texture) && gl.bindTexture(texTarget, current);
	};

	dsa.texParameterf = function (texture, target, pname, param) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentTexture(target);
		(current != texture) && gl.bindTexture(target, texture);
		gl.texParameterf(target, pname, param);
		(current != texture) && gl.bindTexture(target, current);
	};

	dsa.texParameteri = function (texture, target, pname, param) {
		var ext = this._ext;
		var gl  = ext.gl;
		var current = ext.cb.getCurrentTexture(target);
		(current != texture) && gl.bindTexture(target, texture);
		gl.texParameteri(target, pname, param);
		(current != texture) && gl.bindTexture(target, current);
	};

	dsa.texSubImage2D = function (texture, target) {
		var ext = this._ext;
		var gl  = ext.gl;
		var texTarget = ext.textureTargetMap[target];
		var current = ext.cb.getCurrentTexture(texTarget);
		(current != texture) && gl.bindTexture(texTarget, texture);
		var args = Array.prototype.slice.call(arguments, 1);
		gl.texSubImage2D.apply(gl, args);
		(current != texture) && gl.bindTexture(texTarget, current);
	};

	dsa.bindTexture = function (unit, target, texture) {
		var ext = this._ext;
		var gl  = ext.gl;
		var cb = ext.cb;
		var currentUnit = cb.getCurrentTextureUnit();
		(currentUnit != unit) && gl.activeTexture(unit);
		gl.bindTexture(target, texture);
		(currentUnit != unit) && gl.activeTexture(currentUnit);
	};
	//////////////////////////////////////////////////////////////////////////////////////////

	return true;
};

/**
 * Hijacks a WebGLRenderingContext for SpiderGL.WebGL.ObjectGL wrappers.
 *
 * The WebGLRenderingContext is modified to allow SpiderGL.WebGL.ObjectGL wrappers to be edited without explicit bind and without affecting the WebGL object bindings.
 * Most WebGL objects follow the "bind to edit" / "bind to use" paradigm.
 * This means that the object must be bound to the WebGL context to modify some parameter or its resource data.
 * As a side effect, binding the object just to modify it has the same result of binding it to be used during rendering.
 * To prevent this side effect, all the WebGLRenderingContext functions that bind and modify object parameters or data, as long as the rendering functions, are wrapped.
 * This allows SpiderGL wrappers (derived from {@link SpiderGL.WebGL.ObjectGL}) to be edited without affecting the binding state of the WebGLRenderingContext.
 * The following example clarifies how bindings are handled.
 *
 * @example
 * var textureA = gl.createTexture();
 * gl.bindTexture(gl.TEXTURE_2D, textureA);
 * gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
 * // other texture calls
 * var textureB = new SpiderGL.WebGL.Texture2D(gl, parameters);
 * textureB.minFilter = gl.LINEAR; // textureB is hiddenly bound to modify the minification filter
 * gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // textureA is automatically re-bound to keep WebGL semantic
 * textureB.magFilter = gl.LINEAR; // textureB is hiddenly bound to modify another parameter
 * gl.drawArrays(gl.TRIANGLES, 0, 3); // textureA is automatically re-bound to keep WebGL semantic
 * textureB.bind(); // bind textureB to WebGL, breaking the binding with textureA
 * gl.drawArrays(gl.TRIANGLES, 0, 3); // textureA is used
 * 
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to modify.
 *
 * @returns {bool} True on success, false if the gl argument is not valid or has already been modified.
 *
 * @see SpiderGL.WebGL.Context.isHijacked
 * @see SpiderGL.WebGL.Context.getHijacked
 * @see SpiderGL.WebGL.Context.get
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.Context.hijack = function (gl) {
	if (!SpiderGL.Type.instanceOf(gl, WebGLRenderingContext)) { return false; }
	if (gl._spidergl) { return false; }

	SpiderGL.WebGL.Context._prepareContex(gl);

	SpiderGL.WebGL.Context._addExtension(gl, "SGL_current_binding",     "cb",  SpiderGL.WebGL.Context._setup_SGL_current_binding);
	SpiderGL.WebGL.Context._addExtension(gl, "SGL_wrapper_notify",      "wn",  SpiderGL.WebGL.Context._setup_SGL_wrapper_notify);
	SpiderGL.WebGL.Context._addExtension(gl, "SGL_direct_state_access", "dsa", SpiderGL.WebGL.Context._setup_SGL_direct_state_access);

	var cb  = gl.getExtension("SGL_current_binding"    );
	var wn  = gl.getExtension("SGL_wrapper_notify"     );
	var dsa = gl.getExtension("SGL_direct_state_access");

	var hijacked = (!!cb && !!wn && !!dsa);

	return hijacked;
}

/**
 * Tests whether a WebGLRenderingContext is hijacked.
 *
 * The WebGLRenderingContext is hijacked after a successful call to {@link SpiderGL.WebGL.Context.hijack}.
 *
 * @param {WebGLRenderingContext} gl The WebGLRenderingContext to test.
 *
 * @returns {bool} True on success, false if the gl argument is not valid or has already been modified.
 *
 * @see SpiderGL.WebGL.Context.hijack
 * @see SpiderGL.WebGL.Context.getHijacked
 * @see SpiderGL.WebGL.Context.get
 */
SpiderGL.WebGL.Context.isHijacked = function (gl) {
	return (SpiderGL.Type.instanceOf(gl, WebGLRenderingContext) && gl._spidergl);
}

/**
 * Creates a WebGLRenderingContext and hijacks it.
 *
 * The WebGLRenderingContext obtained from the canvas parameter with optional arguments is hijacked.
 *
 * @param {HTMLCanvasElement} canvas The HTMLCanvasElement from which retrieve the WebGL context.
 * @param {object} args The optional WebGL context arguments.
 *
 * @returns {WebGLRenderingContext} The hijacked canvas WebGL rendering context.
 *
 * @see SpiderGL.WebGL.Context.get
 * @see SpiderGL.WebGL.Context.getHijacked
 * @see SpiderGL.WebGL.Context.isHijacked
 */
SpiderGL.WebGL.Context.getHijacked = function (canvas, args) {
	var gl = SpiderGL.WebGL.Context.get(canvas, args);
	SpiderGL.WebGL.Context.hijack(gl);
	return gl;
}

/**
 * Sets pixel store unpack parameters to standard OpenGL SpiderGL values.
 * The parameters to be set are UNPACK_FLIP_Y_WEBGL (true), UNPACK_PREMULTIPLY_ALPHA_WEBGL (false) and UNPACK_COLORSPACE_CONVERSION_WEBGL (WebGLRenderingContext.NONE).
 *
 * @param {WebGLRenderingContext} gl The target WebGLRenderingContext.
 */
SpiderGL.WebGL.Context.setStandardGLUnpack = function (gl) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,                true);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,     false);
	gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, WebGLRenderingContext.NONE);
}

/**
 * Creates a SpiderGL.WebGL.ObjectGL.
 *
 * SpiderGL.WebGL.ObjectGL is the base class for every WebObjectGL wrapper and must not be directly used.
 * In general, every SpiderGL.WebGL.ObjectGL-derived constructor takes two arguments: a hijacked WebGLRenderingContext ("gl")
 * and an optional object argument ("options") that is used to wrap an existing native WebObjectGL and to set object-specific parameters or data.
 * If the options parameter has a propery named "handle" referencing a WebObjectGL, the constructed SpiderGL.WebGL.ObjectGL will use the provided WebObjectGL as the underlying resource.
 * Otherwise, a new WebObjectGL is created. In both cases, the internal WebObjectGL can be accessed with the {@link handle} read-only property and directly used in WebGLRenderingContext calls.
 * With a notification mechanism built into the hijacked WebGLRenderingContext, every direct access is communicated to the wrapper to keep up-to-date the internal state of the wrapper.
 *
 * @example
 * // create a native vertex WebGLBuffer
 * var vbo = gl.createBuffer();
 * gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
 * // ... use buffer ...
 * // create a SpiderGL wrapper from an existing object;
 * // the native object can be accessed through the "handle" property.
 * var wrappedVBO = new SpiderGL.WebGL.VertexBuffer(gl, {handle: vbo});
 * // it is not mandatory to bind the object before setting parameters or data
 * as the hijacked WebGLRendering context takes care of it and does not break previous bindings
 * wrappedVBO.setSize(sizeInBytes, gl.STATIC_DRAW);
 * wrappedVBO.bind(); // equivalent to gl.bindBuffer(gl.ARRAY_BUFFER, wrappedVBO.handle)
 * // create another SpiderGL.WebGL.VertexBuffer without specifying an existing object,
 * // thus letting the wrapper to create one
 * var anotherVBO = new SpiderGL.WebGL.VertexBuffer(gl, {size: someSizeInBytes});
 *
 * @class The SpiderGL.WebGL.ObjectGL is the base class for all WebGL object wrappers.
 *
 * @augments SpiderGL.Core.ObjectBase
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {number} target The WebObjectGL default target.
 * @param {object} [options] Object-specific parameters.
 */
SpiderGL.WebGL.ObjectGL = function (gl, target, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }

	options = SpiderGL.Utility.getDefaultObject({
		handle : null
	}, options);

	SpiderGL.Core.ObjectBase.call(this);

	var wn = gl.getExtension("SGL_wrapper_notify");

	this._gl  = gl;
	this._cb  = gl.getExtension("SGL_current_binding");
	this._dsa = gl.getExtension("SGL_direct_state_access");

	this._h = options.handle;
	this._t = target;
}

/**
 * Default WebObjectGL target.
 *
 * @type number
 *
 * @default WebGLRenderingContext.NONE
 */
SpiderGL.WebGL.ObjectGL.TARGET = WebGLRenderingContext.NONE;

/**
 * Generic null WebObjectGL binding.
 *
 * This function is empty and provided only for completeness.
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext.
 */
SpiderGL.WebGL.ObjectGL.unbind = function (gl) { };

SpiderGL.WebGL.ObjectGL.prototype = {
	/**
	 * The WebGLRenderingContext used at costruction.
	 *
	 * @type WebGLRenderingContext
	 *
	 * @readonly
	 *
	 * @see #handle
	 */
	get gl() {
		return this._gl;
	},

	/**
	 * The native WebObjectGL.
	 *
	 * The native handle can be used with WebGLRenderingContext methods.
	 *
	 * @type WebObjectGL
	 *
	 * @readonly
	 *
	 * @see #gl
	 */
	get handle() {
		return this._h;
	},

	/**
	 * The WebObjectGL default target.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get target() {
		return this._t;
	},

	/**
	 * Tests for non-null handle.
	 *
	 * @type bool
	 *
	 * @readonly
	 */
	get isValid() {
		return (this._h != null);
	},

	/* *
	 * Tests for empty object.
	 * It is reimplemented on each derived classes with object-specific semantic.
	 *
	 * @type bool
	 *
	 * @readonly
	 */
	/*
	get isEmpty () {
		return true;
	},
	*/

	/**
	 * Tests if the object is ready to use.
	 * It is reimplemented on each derived classes with object-specific semantic.
	 *
	 * @type bool
	 *
	 * @readonly
	 */
	get isReady () {
		return false;
	},

	/**
	 * Destroys the wrapped WebObjectGL.
	 * 
	 * After calling this method, the object must not be accessed anymore.
	 */
	destroy : function () {
	},

	/**
	 * Binds the object to the rendering pipeline.
	 * 
	 * The wrapped WebObjectGL is bound to its default target in the WebGLRenderingContext.
	 */
	bind : function () {
	},

	/**
	 * Binds the null object to the rendering pipeline.
	 * 
	 * This method is provided for symmetry with {@link SpiderGL.WebGL.ObjectGL#bind}. It binds the null object to the per-object webGL target.
	 */
	unbind : function () {
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.ObjectGL, SpiderGL.Core.ObjectBase);

/**
 * Creates a SpiderGL.WebGL.Buffer.
 *
 * SpiderGL.WebGL.Buffer is the base class for WebGLBuffer object wrappers ({@link SpiderGL.WebGL.VertexBuffer} and {@link SpiderGL.WebGL.IndexBuffer}) and must not be directly used.
 * When passing data or size with the options parameter, the data field will have precedence on the size field, which will be ignored.
 *
 * @class The SpiderGL.WebGL.Buffer is the base class for all WebGLBuffer object wrappers, i.e. {@link SpiderGL.WebGL.VertexBuffer} and {@link SpiderGL.WebGL.IndexBuffer}.
 *
 * @augments SpiderGL.WebGL.ObjectGL
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {number} target The WebGLBuffer target. It must be either WebGLRenderingContext.ARRAY_BUFFER or WebGLRenderingContext.ELEMENT_ARRAY_BUFFER.
 * @param {object} [options] Optional parameters.
 * @param {WebGLBuffer} [options.handle] If defined, the provided buffer will be wrapped and its size and usage attributes will be queried to the rendering context. Otherwise an internal buffer will be created.
 * @param {ArrayBuffer|ArrayBufferView} [options.data] Buffer content to be set with WebGLRenderingContext.bufferData (see {@link setData}). If present, the data will be set both if a handle is provided or internally created.
 * @param {number} [options.size] Buffer size to be set with WebGLRenderingContext.bufferData (see {@link setData}). If present, it will be set both if a handle is provided or internally created. If data parameter is present, the size field is ignored.
 * @param {number} [options.usage=SpiderGL.WebGL.Buffer.DEFAULT_USAGE] WebGL buffer usage hint parameter for WebGLRenderingContext.bufferData.
 *
 * @example
 * // create a vertex buffer with a specified size
 * var vbuff = new SpiderGL.WebGL.VertexBuffer(gl, {
 * 	size  : 2 * 1024 * 1024,  // 2 MB
 * 	usage : gl.STATIC_DRAW    // if omitted, defaults to SpiderGL.WebGL.Buffer.DEFAULT_USAGE
 * });
 *
 * // create an index buffer with content
 * var ibuff = new SpiderGL.WebGL.IndexBuffer(gl, {
 * 	data : new Uint16Array(...)  // use a typed array for setting buffer data
 * });
 *
 * @see SpiderGL.WebGL.ObjectGL
 * @see SpiderGL.WebGL.VertexBuffer
 * @see SpiderGL.WebGL.IndexBuffer
 */
SpiderGL.WebGL.Buffer = function (gl, target, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }

	if (SpiderGL.Type.instanceOf(options, WebGLBuffer)) {
		options = { handle : options };
	}
	else if (SpiderGL.Type.instanceOf(options, ArrayBuffer) || SpiderGL.Type.isTypedArray(options)) {
		options = { data : options };
	}
	else if (SpiderGL.Type.isNumber(options)) {
		options = { size : options };
	}

	options = SpiderGL.Utility.getDefaultObject({
		handle : null,
		data   : null,
		size   : 0,
		usage  : SpiderGL.WebGL.Buffer.DEFAULT_USAGE
	}, options);

	SpiderGL.WebGL.ObjectGL.call(this, gl, target, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;

	var gl  = this._gl;
	var cb  = this._cb;
	var dsa = this._dsa;

	var t = this._t;
	var h = this._h;

	cb.pushBuffer(t);
	if (h) {
		gl.bindBuffer(t, h);
		options.size  = gl.getBufferParameter(t, gl.BUFFER_SIZE);
		options.usage = gl.getBufferParameter(t, gl.BUFFER_USAGE);
	}
	else {
		h = gl.createBuffer();
		gl.bindBuffer(t, h);
		this._h = h;
	}
	cb.popBuffer(t);
	h._spidergl = this;

	this._size   = options.size;
	this._usage  = options.usage;

	if (options.data) {
		this.setData(options.data, options.usage);
	}
	else if (options.size) {
		this.setSize(options.size, options.usage);
	}
}

/**
 * Default WebGLBuffer target.
 *
 * @type number
 *
 * @default WebGLRenderingContext.NONE
 */
SpiderGL.WebGL.Buffer.TARGET = WebGLRenderingContext.NONE;

/**
 * Default usage hint when specifying buffer size or data.
 *
 * @type number
 *
 * @default WebGLRenderingContext.STATIC_DRAW
 */
SpiderGL.WebGL.Buffer.DEFAULT_USAGE = WebGLRenderingContext.STATIC_DRAW;

/**
 * Default buffer offset when specifying buffer subdata.
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.WebGL.Buffer.DEFAULT_SUB_DATA_OFFSET = 0;

/**
 * Generic WebGLBuffer unbinding.
 *
 * This function is empty and it is provided only for completeness.
 *
 * @param  {WebGLRenderingContext} gl A WebGLRenderingContext.
 */
SpiderGL.WebGL.Buffer.unbind = function (gl) { };

SpiderGL.WebGL.Buffer.prototype = {
	_gl_deleteBuffer : function () {
		this._h = null;
	},

	_gl_isBuffer : function () {
	},

	_gl_bindBuffer : function () {
	},

	_gl_getBufferParameter : function () {
	},

	_gl_bufferData : function () {
		var sizeOrData = arguments[1];
		var usage = arguments[2];
		this._size = (SpiderGL.Type.isNumber(sizeOrData)) ? (sizeOrData) : (sizeOrData.byteLength);
		this._usage = usage;
	},

	_gl_bufferSubData : function () {
	},

	_gl_vertexAttribPointer : function () {
	},

	_gl_drawElements : function () {
	},

	/* *
	 * Tests for empty buffer.
	 * It is true if the buffer size is greather than zero, false otherwise.
	 *
	 * @type bool
	 *
	 * @readonly
	 */
	/*
	get isEmpty() { return (this._size <= 0); },
	*/

	/**
	 * Tests if the buffer is ready to use.
	 * A buffer is considered ready if its size is greater than zero.
	 *
	 * @type bool
	 *
	 * @readonly
	 */
	get isReady () {
		return (this._size > 0);
	},

	/**
	 * The size in bytes of the buffer.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get size() {
		return this._size;
	},

	/**
	 * The usage hint of the WebGLBuffer.
	 * It refers to the usage hint as specified in WebGLRenderingContext.bufferData().
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get usage() {
		return this._usage;
	},

	/**
	 * Sets the buffer size and usage.
	 * The buffer is set up with specified size and usage.
	 *
	 * @param {number} size The buffer size.
	 * @param {number} [usage=SpiderGL.WebGL.Buffer.DEFAULT_USAGE] WebGL buffer usage hint.
	 *
	 * @see setData
	 */
	setSize : function (size, usage) {
		usage = SpiderGL.Utility.getDefaultValue(usage, SpiderGL.WebGL.Buffer.DEFAULT_USAGE);
		this._dsa.bufferData(this._h, this._t, size, usage);
	},

	/**
	 * Sets the buffer data and usage.
	 * The buffer is set up with specified data and usage.
	 *
	 * @param {ArrayBuffer|ArrayBufferView} data The buffer data.
	 * @param {number} [usage=SpiderGL.WebGL.Buffer.DEFAULT_USAGE] WebGL buffer usage hint.
	 *
	 * @see setSubData
	 * @see setSize
	 */
	setData : function (data, usage) {
		usage = SpiderGL.Utility.getDefaultValue(usage, SpiderGL.WebGL.Buffer.DEFAULT_USAGE);
		this._dsa.bufferData(this._h, this._t, data, usage);
	},

	/**
	 * Sets a range of the buffer data.
	 * A range of buffer content can be set by specifying the starting offset and the typed array of values.
	 *
	 * @param {ArrayBuffer|ArrayBufferView} data The buffer sub data.
	 * @param {number} [offset=SpiderGL.WebGL.Buffer.DEFAULT_SUB_DATA_OFFSET] The range starting offset, in bytes.
	 *
	 * @see setData
	 */
	setSubData : function (data, offset) {
		offset = SpiderGL.Utility.getDefaultValue(offset, SpiderGL.WebGL.Buffer.DEFAULT_SUB_DATA_OFFSET);
		this._dsa.bufferSubData(this._h, this._t, offset, data);
	},

	/**
	 * Destroys the WebGLBuffer.
	 * After destruction, the handle is set to null and this object should not be used anymore.
	 *
	 * @see SpiderGL.WebGL.ObjectGL#destroy
	 */
	destroy : function () {
		this._gl.deleteBuffer(this._h);
	},

	/**
	 * Binds the wrapped WebGLBuffer to the appropriate target.
	 * The used target is set by the derived objects {@link SpiderGL.WebGL.VertexBuffer} and {@link SpiderGL.WebGL.IndexBuffer}.
	 *
	 * @see unbind
	 */
	bind : function () {
		this._gl.bindBuffer(this._t, this._h);
	},

	/**
	 * Binds "null" to the appropriate target.
	 * This method is provided only for simmetry with {@link bind} and is not relative to the object state.
	 *
	 * @see bind
	 */
	unbind : function () {
		this._gl.bindBuffer(this._t, null);
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.Buffer, SpiderGL.WebGL.ObjectGL);

/**
 * Creates a SpiderGL.WebGL.VertexBuffer.
 *
 * SpiderGL.WebGL.VertexBuffer represents a wrapper for a WebGLBuffer to be bound to the WebGLRenderingContext.ARRAY_BUFFER target.
 *
 * @class The SpiderGL.WebGL.VertexBuffer is WebGLBuffer wrapper for vertex buffers.
 *
 * @augments SpiderGL.WebGL.Buffer
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {object} [options] See {@link SpiderGL.WebGL.Buffer}.
 *
 * @see SpiderGL.WebGL.Buffer
 * @see SpiderGL.WebGL.IndexBuffer
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.VertexBuffer = function (gl, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }
	SpiderGL.WebGL.Buffer.call(this, gl, SpiderGL.WebGL.VertexBuffer.TARGET, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;
}

/**
 * WebGL target for vertex buffers.
 *
 * @type number
 *
 * @default WebGLRenderingContext.ARRAY_BUFFER
 */
SpiderGL.WebGL.VertexBuffer.TARGET = WebGLRenderingContext.ARRAY_BUFFER;

/**
 * Default vertex attribute index when using SpiderGL.WebGL.VertexBuffer#vertexAttribPointer.
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_INDEX = 0;

/**
 * Default vertex attribute size when using SpiderGL.WebGL.VertexBuffer#vertexAttribPointer.
 *
 * @type number
 *
 * @default 3
 */
SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_SIZE = 3;

/**
 * Default vertex attribute type when using SpiderGL.WebGL.VertexBuffer#vertexAttribPointer.
 *
 * @type number
 *
 * @default WebGLRenderingContext.FLOAT
 */
SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_TYPE = WebGLRenderingContext.FLOAT;

/**
 * Default vertex attribute normalized flag when using SpiderGL.WebGL.VertexBuffer#vertexAttribPointer.
 *
 * @type bool
 *
 * @default false
 */
SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_NORMALIZED = false;

/**
 * Default vertex attribute stride when using SpiderGL.WebGL.VertexBuffer#vertexAttribPointer.
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_STRIDE = 0;

/**
 * Default vertex attribute offset when using SpiderGL.WebGL.VertexBuffer#vertexAttribPointer.
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_OFFSET = 0;

/**
 * Default enable flag for vertex attribute when using SpiderGL.WebGL.VertexBuffer#vertexAttribPointer.
 *
 * @type bool
 *
 * @default true
 */
SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_ENABLE = true;

/**
 * WebGLBuffer unbinding for vertex buffers.
 *
 * This function binds the null buffer to the WebGLRenderingContext.ARRAY_BUFFER target.
 *
 * @param  {WebGLRenderingContext} gl A WebGLRenderingContext.
 */
SpiderGL.WebGL.VertexBuffer.unbind = function (gl) { gl.bindBuffer(SpiderGL.WebGL.VertexBuffer.TARGET, null); };

SpiderGL.WebGL.VertexBuffer.prototype = {
	/**
	 * Latches the WebGL vertex attribute pointer with the internal buffer.
	 * The effect of this method is to bind the SpiderGL.WebGL.VertexBuffer and call WebGLRenderingContext.vertexAttribPointer() with the provided parameters.
	 *
	 * @param {object} [options] Vertex attribute pointer parameters.
	 * @param {number} [options.index=SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_INDEX] Attribute index.
	 * @param {number} [options.size=SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_SIZE] Attribute size.
	 * @param {number} [options.type=SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_TYPE] Attribute base type.
	 * @param {number} [options.normalized=SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_NORMALIZED] True if the attribute has an integer type and must be normalized.
	 * @param {number} [options.stride=SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_STRIDE] Bytes from the beginning of an element and the beginning of the next one.
	 * @param {number} [options.offset=SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_OFFSET] Offset (in bytes) from the start of the buffer.
	 * @param {bool} [options.enable=SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_ENABLE] If true, the index-th vertex attribute array will be enabled with WebGLRenderingContext.enableVertexAttribArray(index).
	 *
	 * @example
	 * var vb = new SpiderGL.WebGL.VertexBuffer(...); // create a vertex buffer
	 * // [... set vb data ...]
	 * // calling vb.vertexAttribPointer has the same effect of:
	 * // vb.bind();
	 * // gl.vertexAttribPointer(positionAttributeIndex, 3, gl.FLOAT, false, 0, 0);
	 * // gl.enableVertexAttribArray(positionAttributeIndex);
	 * vb.vertexAttribPointer({
	 * 	index      : positionAttributeIndex,  // if omitted, defaults to SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_INDEX
	 * 	size       : 3,         // if omitted, defaults to SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_SIZE
	 * 	glType     : gl.FLOAT,  // if omitted, defaults to SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_TYPE
	 * 	normalized : false,     // if omitted, defaults to SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_NORMALIZED
	 * 	stride     : 0,         // if omitted, defaults to SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_STRIDE
	 * 	offset     : 0,         // if omitted, defaults to SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_OFFSET
	 * 	enable     : true       // if omitted, defaults to SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_ENABLE
	 * });
	 */
	vertexAttribPointer : function (options) {
		options = SpiderGL.Utility.getDefaultObject({
			index      : SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_INDEX,
			size       : SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_SIZE,
			glType     : SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_TYPE,
			normalized : SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_NORMALIZED,
			stride     : SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_STRIDE,
			offset     : SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_OFFSET,
			enable     : SpiderGL.WebGL.VertexBuffer.DEFAULT_ATTRIBUTE_ENABLE
		}, options);

		this._dsa.vertexAttribPointer(this._h, options.index, options.size, options.glType, options.normalized, options.stride, options.offset);
		if (options.enable) {
			this._gl.enableVertexAttribArray(options.index);
		}
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.VertexBuffer, SpiderGL.WebGL.Buffer);


/**
 * Creates a SpiderGL.WebGL.IndexBuffer.
 *
 * SpiderGL.WebGL.IndexBuffer represents a wrapper for a WebGLBuffer to be bound to the WebGLRenderingContext.ELEMENT_ARRAY_BUFFER target.
 *
 * @class The SpiderGL.WebGL.IndexBuffer is WebGLBuffer wrapper for index buffers.
 *
 * @augments SpiderGL.WebGL.Buffer
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {object} [options] See {@link SpiderGL.WebGL.Buffer}.
 *
 * @see SpiderGL.WebGL.Buffer
 * @see SpiderGL.WebGL.VertexBuffer
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.IndexBuffer = function (gl, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }
	SpiderGL.WebGL.Buffer.call(this, gl, SpiderGL.WebGL.IndexBuffer.TARGET, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;
}

/**
 * WebGL target for index buffers.
 *
 * @type number
 *
 * @default WebGLRenderingContext.ELEMENT_ARRAY_BUFFER
 */
SpiderGL.WebGL.IndexBuffer.TARGET = WebGLRenderingContext.ELEMENT_ARRAY_BUFFER;

/**
 * Default elements draw mode when using SpiderGL.WebGL.IndexBuffer#drawElements.
 *
 * @type number
 *
 * @default WebGLRenderingContext.TRIANGLES
 */
SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_MODE  = WebGLRenderingContext.TRIANGLES;

/**
 * Default elements count when using SpiderGL.WebGL.IndexBuffer#drawElements.
 * A negative value causes the calculation of the maximum number of elements given the buffer size, offset and index type.
 *
 * @type number
 *
 * @default -1
 */
SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_COUNT  = -1;

/**
 * Default index type when using SpiderGL.WebGL.IndexBuffer#drawElements.
 *
 * @type number
 *
 * @default WebGLRenderingContext.UNSIGNED_SHORT
 */
SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_TYPE = WebGLRenderingContext.UNSIGNED_SHORT;

/**
 * Default index buffer offset when using SpiderGL.WebGL.IndexBuffer#drawElements.
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_OFFSET = 0;

/**
 * WebGLBuffer unbinding for index buffers.
 *
 * This function binds the null buffer to the WebGLRenderingContext.ELEMENT_ARRAY_BUFFER target.
 *
 * @param  {WebGLRenderingContext} gl A WebGLRenderingContext.
 */
SpiderGL.WebGL.IndexBuffer.unbind = function (gl) { gl.bindBuffer(SpiderGL.WebGL.IndexBuffer.TARGET, null); };

SpiderGL.WebGL.IndexBuffer.prototype = {
	/**
	 * Binds the index buffers and calls WebGLRenderingContext.drawElements with the provided parameters.
	 *
	 * @param {object} [options] Draw parameters.
	 * @param {number} [options.glMode=SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_MODE] The WebGL primitive type.
	 * @param {number} [options.count=SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_COUNT] Number of elements to draw. If less than or equal to zero, its value will be calculated as the maximum number of stored indices, based on offset, buffer size and index type.
	 * @param {number} [options.glType=SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_TYPE] Index type.
	 * @param {number} [options.offset=SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_OFFSET] Offset (in bytes) from the start of the buffer.
	 *
	 * @example
	 * var ib = new SpiderGL.WebGL.IndexBuffer(...); // create an index buffer
	 * // [... set ib data ...]
	 * // calling ib.drawElements has the same effect of:
	 * // ib.bind();
	 * // gl.drawElements(gl.TRIANGLES, (ib.size - offset) / SpiderGL.Type.SIZEOF_UINT16, gl.UNSIGNED_SHORT, offset);
	 * ib.drawElements({
	 * 	glMode : gl.TRIANGLES,       // if omitted, defaults to SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_MODE
	 * 	count  : 0,                  // if omitted, defaults to SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_COUNT
	 * 	glType : gl.UNSIGNED_SHORT,  // if omitted, defaults to SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_TYPE
	 * 	offset : offset              // if omitted, defaults to SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_OFFSET
	 * });
	 */
	drawElements : function (options) {
		options = SpiderGL.Utility.getDefaultObject({
			glMode : SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_MODE,
			count  : SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_COUNT,
			glType : SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_TYPE,
			offset : SpiderGL.WebGL.IndexBuffer.DEFAULT_DRAW_ELEMENTS_OFFSET
		}, options);

		if (options.count < 1) {
			var bytesPerElem = SpiderGL.Type.typeSizeFromGL(options.glType);
			options.count = (this._size - options.offset) / bytesPerElem;
		}

		this._dsa.drawElements(this._h, options.glMode, options.count, options.glType, options.offset);
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.IndexBuffer, SpiderGL.WebGL.Buffer);

/**
 * Creates a SpiderGL.WebGL.Framebuffer.
 *
 * SpiderGL.WebGL.Framebuffer wraps a WebGLFramebuffer object.
 *
 * @class The SpiderGL.WebGL.Framebuffer is a wrapper for WebGLFramebuffer.
 *
 * @augments SpiderGL.WebGL.ObjectGL
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {object} [options] Optional parameters.
 * @param {WebGLFramebuffer} [options.handle] A WebGLFramebuffer. If present, this object will be used as the wrapped WebGLFramebuffer. Otherwise a new one will be created.
 * @param {bool} [options.autoViewport=SpiderGL.WebGL.Framebuffer.DEFAULT_AUTO_VIEWPORT] The value of the {@link autoViewport} property.
 * @param {object} [options.color] Color attachment target (see {@link setAttachments}).
 * @param {object} [options.depth] Depth attachment target (see {@link setAttachments}).
 * @param {object} [options.stencil] Stencil attachment target (see {@link setAttachments}).
 * @param {object} [options.depthStencil] Depth-Stencil attachment target (see {@link setAttachments}).
 *
 * @see setAttachments
 * @see SpiderGL.WebGL.Texture2D
 * @see SpiderGL.WebGL.TextureCubeMap
 * @see SpiderGL.WebGL.Renderbuffer
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.Framebuffer = function (gl, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }

	if (SpiderGL.Type.instanceOf(options, WebGLFramebuffer)) {
		options = { handle : options };
	}

	options = SpiderGL.Utility.getDefaultObject({
		handle       : null,
		autoViewport : SpiderGL.WebGL.Framebuffer.DEFAULT_AUTO_VIEWPORT
	}, options);

	var that = SpiderGL.WebGL.ObjectGL.call(this, gl, SpiderGL.WebGL.Framebuffer.TARGET, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;

	var gl  = this._gl;
	var cb  = this._cb;
	var dsa = this._dsa;

	var t = this._t;
	var h = this._h;

	var imported = false;
	if (h) {
		imported = true;
	}
	else {
		h = gl.createFramebuffer();
		this._h = h;
	}
	h._spidergl = this;

	this._attachments  = { };
	this._status       = 0;
	this._autoViewport = options.autoViewport;
	this._viewport     = [ 0, 0, 1, 1 ];

	cb.pushFramebuffer(t);
	gl.bindFramebuffer(t, h);

	if (imported) {
		var resource = null;
		var type     = 0;
		var level    = 0;
		var target   = 0;

		for (var attachment in SpiderGL.WebGL.Framebuffer._attachmentName) {
			resource = gl.getFramebufferAttachmentParameter(t, att, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
			type     = gl.getFramebufferAttachmentParameter(t, att, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE);
			switch (type) {
				case gl.RENDERBUFFER:
					target = gl.RENDERBUFFER;
					this._importRenderbuffer(t, attachment, target, resource);
				break;
				case gl.TEXTURE:
					level  = gl.getFramebufferAttachmentParameter(t, att, gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL);
					target = gl.getFramebufferAttachmentParameter(t, att, gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE);
					if (target == 0) target = gl.TEXTURE_2D;
					this._importTexture(t, attachment, target, resource, level);
				break;
				default: break;
			}
		}
	}

	this._status = gl.checkFramebufferStatus(t);

	cb.popFramebuffer(t);

	this.setAttachments(options);
}

/**
 * WebGL target for framebuffers.
 *
 * @type number
 *
 * @default WebGLRenderingContext.FRAMEBUFFER
 */
SpiderGL.WebGL.Framebuffer.TARGET = WebGLRenderingContext.FRAMEBUFFER;

/**
 * Default value for SpiderGL.WebGL.Framebuffer#autoViewport.
 *
 * @type bool
 *
 * @default true
 */
SpiderGL.WebGL.Framebuffer.DEFAULT_AUTO_VIEWPORT = true;

/**
 * Default texture level to attach when using SpiderGL.WebGL.Framebuffer#setAttachments.
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.WebGL.Framebuffer.DEFAULT_ATTACHMENT_TEXTURE_LEVEL = 0;

/**
 * Default texture cube map face to attach when using SpiderGL.WebGL.Framebuffer#setAttachments.
 *
 * @type number
 *
 * @default WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X
 */
SpiderGL.WebGL.Framebuffer.DEFAULT_ATTACHMENT_CUBE_MAP_FACE = WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X;

/**
 * Default read rectangle left coordinate (in pixels).
 *
 * @type number
 *
 * @default 0
 *
 * @see SpiderGL.WebGL.Framebuffer#readPixels
 */
SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_X = 0;

/**
 * Default read rectangle bottom coordinate (in pixels).
 *
 * @type number
 *
 * @default 0
 *
 * @see SpiderGL.WebGL.Framebuffer#readPixels
 */
SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_Y = 0;

/**
 * Default read rectangle width (in pixels).
 * If less than zero, the width will be set to span the whole render target (starting from read rectangle x coordinate).
 *
 * @type number
 *
 * @default -1
 *
 * @see SpiderGL.WebGL.Framebuffer#readPixels
 */
SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_WIDTH = -1;

/**
 * Default read rectangle height (in pixels).
 * If less than zero, the height will be set to span the whole render target (starting from read rectangle y coordinate).
 *
 * @type number
 *
 * @default -1
 *
 * @see SpiderGL.WebGL.Framebuffer#readPixels
 */
SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_HEIGHT = -1;

/**
 * The WebGL pixel format for reading framebuffer pixels.
 *
 * @type number
 *
 * @default WebGLRenderingContext.RGBA
 *
 * @see SpiderGL.WebGL.Framebuffer#readPixels
 */
SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_FORMAT = WebGLRenderingContext.RGBA;

/**
 * The WebGL birfield mask used for clearing the framebuffer.
 *
 * @type number
 *
 * @default (WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT | WebGLRenderingContext.STENCIL_BUFFER_BIT)
 *
 * @see SpiderGL.WebGL.Framebuffer#clear
 */
SpiderGL.WebGL.Framebuffer.DEFAULT_CLEAR_MASK = (WebGLRenderingContext.COLOR_BUFFER_BIT | WebGLRenderingContext.DEPTH_BUFFER_BIT | WebGLRenderingContext.STENCIL_BUFFER_BIT);

/**
 * The WebGL pixel type for reading framebuffer pixels.
 *
 * @type number
 *
 * @default WebGLRenderingContext.UNSIGNED_BYTE
 *
 * @see SpiderGL.WebGL.Framebuffer#readPixels
 */
SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_TYPE = WebGLRenderingContext.UNSIGNED_BYTE;

/**
 * WebGLFramebuffer unbinding.
 *
 * This function binds the null framebuffer to the WebGLRenderingContext.FRAMEBUFFER target.
 *
 * @param  {WebGLRenderingContext} gl A WebGLRenderingContext.
 */
SpiderGL.WebGL.Framebuffer.unbind = function (gl) { gl.bindFramebuffer(SpiderGL.WebGL.Framebuffer.TARGET, null); };

SpiderGL.WebGL.Framebuffer._attachmentName = { };
SpiderGL.WebGL.Framebuffer._attachmentName[WebGLRenderingContext.COLOR_ATTACHMENT0]        = "color";
SpiderGL.WebGL.Framebuffer._attachmentName[WebGLRenderingContext.DEPTH_ATTACHMENT]         = "depth";
SpiderGL.WebGL.Framebuffer._attachmentName[WebGLRenderingContext.STENCIL_ATTACHMENT]       = "stencil";
SpiderGL.WebGL.Framebuffer._attachmentName[WebGLRenderingContext.DEPTH_STENCIL_ATTACHMENT] = "depthStencil";

SpiderGL.WebGL.Framebuffer.prototype = {
	_gl_deleteFramebuffer : function (framebuffer) {
		this._h = null;
	},

	_gl_isFramebuffer : function (framebuffer) {
	},

	_gl_bindFramebuffer : function (target, framebuffer) {
	},

	_gl_checkFramebufferStatus : function (target) {
	},

	_gl_getFramebufferAttachmentParameter : function (target, attachment, pname) {
	},

	_gl_framebufferRenderbuffer : function (target, attachment, renderbuffertarget, renderbuffer) {
		this._importRenderbuffer.apply(this, arguments);
		this._status = this._gl.checkFramebufferStatus(this._t);
	},

	_gl_framebufferTexture2D : function (target, attachment, textarget, texture, level) {
		this._importTexture.apply(this, arguments);
		this._status = this._gl.checkFramebufferStatus(this._t);
	},

	_gl_clear : function (mask) {
	},

	_gl_readPixels : function (x, y, width, height, format, type, pixels) {
	},

	_importTexture : function (target, attachment, textarget, texture, level) {
		var name = SpiderGL.WebGL.Framebuffer._attachmentName[attachment];
		if (!name) return;

		if (!texture) {
			delete this._attachments[name];
			return;
		}

		var gl = this._gl;

		var att = {
			attachment : attachment,
			resource   : null,
			target     : textarget,
			level      : level,
			face       : gl.NONE
		};

		this._attachments[name] = att;

		if (textarget == gl.TEXTURE_2D) {
			att.resource = new SpiderGL.WebGL.Texture2D(gl, { handle : texture });
		}
		else {
			att.resource = new SpiderGL.WebGL.TextureCubeMap(gl, { handle : texture });
			att.face     = textarget;
		}

		this._viewport = [ 0, 0, SpiderGL.Math.max(att.resource.width, 1), SpiderGL.Math.max(att.resource.height, 1) ];
	},

	_importRenderbuffer : function (target, attachment, renderbuffertarget, renderbuffer) {
		var name = SpiderGL.WebGL.Framebuffer._attachmentName[attachment];
		if (!name) return;

		if (!renderbuffer) {
			delete this._attachments[name];
			return;
		}

		var gl = this._gl;

		var att = {
			attachment : attachment,
			resource   : null,
			target     : renderbuffertarget,
			level      : 0,
			face       : gl.NONE
		};

		this._attachments[name] = att;

		att.resource = new SpiderGL.WebGL.Renderbuffer(gl, { handle : renderbuffer });

		this._viewport = [ 0, 0, SpiderGL.Math.max(att.resource.width, 1), SpiderGL.Math.max(att.resource.height, 1) ];
	},

	_setAttachment : function (attachment, nfo) {
		var name = SpiderGL.WebGL.Framebuffer._attachmentName[attachment];
		if (!name) return false;

		var gl = this._gl;

		var isNullResource = (!nfo || (("resource" in nfo) && !nfo.resource));
		if  (isNullResource) {
			var att = this._attachments[name];
			if (att) {
				if (att.target === gl.RENDERBUFFER) {
					gl.framebufferRenderbuffer(t, att.attachment, gl.RENDERBUFFER, null);
				}
				else {
					gl.framebufferTexture2D(t, att.attachment, gl.TEXTURE_2D, null, 0);
				}
			}
			return;
		}

		var resourceType = gl.NONE;

		if (SpiderGL.Type.instanceOf(nfo, WebGLTexture)) {
			nfo = { resource : nfo };
			resourceType = gl.TEXTURE;
		}
		else if (SpiderGL.Type.instanceOf(nfo, WebGLRenderbuffer)) {
			nfo = { resource : nfo };
			resourceType = gl.RENDERBUFFER;
		}
		else if (SpiderGL.Type.instanceOf(nfo, SpiderGL.WebGL.Texture)) {
			nfo = { resource : nfo.handle };
			resourceType = gl.TEXTURE;
		}
		else if (SpiderGL.Type.instanceOf(nfo, SpiderGL.WebGL.Renderbuffer)) {
			nfo = { resource : nfo.handle };
			resourceType = gl.RENDERBUFFER;
		}

		var cubeFaceSpecified = !!nfo && (typeof (nfo.face) != "undefined");

		nfo = SpiderGL.Utility.getDefaultObject({
			resource : null,
			level    : SpiderGL.WebGL.Framebuffer.DEFAULT_ATTACHMENT_TEXTURE_LEVEL,
			face     : SpiderGL.WebGL.Framebuffer.DEFAULT_ATTACHMENT_CUBE_MAP_FACE
		}, nfo);

		var t = this._t;

		switch (resourceType) {
			case gl.TEXTURE:
				var isCubemap = SpiderGL.Type.instanceOf(nfo, SpiderGL.WebGL.TextureCubeMap) || cubeFaceSpecified;
				var target = (isCubemap) ? (nfo.face) : (gl.TEXTURE_2D);
				gl.framebufferTexture2D(t, attachment, target, nfo.resource, nfo.level);
			break;
			case gl.RENDERBUFFER:
				gl.framebufferRenderbuffer(t, attachment, gl.RENDERBUFFER, nfo.resource);
			break;
			default: break;
		}

		return true;
	},

	/*
	get isEmpty () {
		return (
			!this._attachments.color        &&
			!this._attachments.depth        &&
			!this._attachments.stencil      &&
			!this._attachments.depthStencil
		);
	},
	*/

	/**
	 * Tests if the framebuffer is ready to use.
	 * A framebuffer is considered ready if its status is WebGLRenderingContext.FRAMEBUFFER_COMPLETE.
	 *
	 * @type bool
	 *
	 * @readonly
	 *
	 * @see isComplete
	 */
	get isReady () {
		return this.isComplete;
	},

	/**
	 * The WebGL status of the framebuffer.
	 *
	 * @type number
	 *
	 * @readonly
	 *
	 * @see isComplete
	 */
	get status() {
		return this._status;
	},

	/**
	 * Indicates if the the status of the framebuffer is WebGLRenderingContext.FRAMEBUFFER_COMPLETE.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get isComplete() {
		return (this._status === this._gl.FRAMEBUFFER_COMPLETE);
	},

	/**
	 * Gets a 4-component array with the viewport parameters.
	 *
	 * Viewport parameters are stored as [0, 0, width, height] and will be set using WebGLRenderingContext.viewport() during a {@link bind} call if {@link autoViewport} is true.
	 * The width and height parameters corresponds to the width and height of the last resource attached with {@link setAttachments}.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see autoViewport
	 * @see setAttachments
	 */
	get viewport() {
		return this._viewport.slice();
	},

	/**
	 * Gets the width of the attached resources.
	 *
	 * The value represents the width of the attached resources.
	 * It is equal to viewport[2].
	 *
	 * @type number
	 *
	 * @readonly
	 *
	 * @see height
	 * @see viewport
	 */
	get width() {
		return this._viewport[2];
	},

	/**
	 * Gets the height of the attached resources.
	 *
	 * The value represents the height of the attached resources.
	 * It is equal to viewport[3].
	 *
	 * @type number
	 *
	 * @readonly
	 *
	 * @see width
	 * @see viewport
	 */
	get height() {
		return this._viewport[3];
	},

	/**
	 * Automatic viewport settings in a call to {@link bind}.
	 *
	 * If true, when calling {@link bind} the viewport will be set with a call to WebGLRenderingContext.viewport().
	 *
	 * @type bool
	 */
	get autoViewport() {
		return this._autoViewport;
	},

	set autoViewport(on) {
		this._autoViewport = !!on;
	},

	/**
	 * Sets the framebuffer attachments.
	 * It is used to attach resources (SpiderGL.WebGL.Texture2D, SpiderGL.WebGL.TextureCubeMap or SpiderGL.WebGL.Renderbuffer) as render targets.
	 *
	 * @param {object} attachments The resources to attach to the WebGLFramebuffer.
	 * @param {object|SpiderGL.WebGL.Texture2D|SpiderGL.WebGL.TextureCubeMap|SpiderGL.WebGL.Renderbuffer} [attachments.color] The color attachment for target WebGLRenderingContext.COLOR_ATTACHMENT0; if omitted, the current color attachment is kept; if null, the current color attachment is detached.
	 * @param {SpiderGL.WebGL.Texture2D|SpiderGL.WebGL.TextureCubeMap|SpiderGL.WebGL.Renderbuffer} [attachments.color.resource] The resource to use as a render target for color attachment.
	 * @param {number} [attachments.color.level=SpiderGL.WebGL.Framebuffer.DEFAULT_ATTACHMENT_TEXTURE_LEVEL] If resource is SpiderGL.WebGL.Texture2D or SpiderGL.WebGL.TextureCubeMap, specifies the texture level to attach. As per WebGL specifications, level must be zero.
	 * @param {number} [attachments.color.face=SpiderGL.WebGL.Framebuffer.DEFAULT_ATTACHMENT_CUBE_MAP_FACE] If resource is SpiderGL.WebGL.TextureCubeMap, specifies the texture cube map face to attach.
	 * @param {object|SpiderGL.WebGL.Renderbuffer} [attachments.depth] Same as attachments.color but for WebGLRenderingContext.DEPTH_ATTACHMENT. To ensure the restrictions of the WebGL specifications, stencil and depthStencil attachments are detached.
	 * @param {object|SpiderGL.WebGL.Renderbuffer} [attachments.stencil] Same as attachments.color but for WebGLRenderingContext.STENCIL_ATTACHMENT. To ensure the restrictions of the WebGL specifications, depth and depthStencil attachments are detached.
	 * @param {object|SpiderGL.WebGL.Renderbuffer} [attachments.depthStencil] Same as attachments.color but for WebGLRenderingContext.DEPTH_STENCIL_ATTACHMENT. To ensure the restrictions of the WebGL specifications, depth and stencil attachments are detached.
	 *
	 * @returns {bool} True if the framebuffer is complete, false otherwise.
	 *
	 * @example
	 * var t2D = new SpiderGL.WebGL.Texture2D(...);
	 * var tCM = new SpiderGL.WebGL.TextureCubeMap(...);
	 * var rb  = new SpiderGL.WebGL.Renderbuffer(...);
	 *
	 * var fb = new SpiderGL.WebGL.Framebuffer(gl, {
	 * 	color : {resource: t2D, level: 0 }, // alternatively: color: t2D; in this case level would default to SpiderGL.WebGL.Framebuffer.DEFAULT_ATTACHMENT_TEXTURE_LEVEL
	 * 	depth : rb                          // alternatively: depth: {resource: rb}; renderbuffers do not have mipmap levels
	 * };
	 * // use fb
	 * // ...
	 * 
	 * // change attachment
	 * fb.setAttachments({
	 * 	color: {resource: tCM, face: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z} // if face is omitted, defaults to SpiderGL.WebGL.Framebuffer.DEFAULT_ATTACHMENT_CUBE_MAP_FACE
	 * })
	 *
	 * @see getAttachments
	 */
	setAttachments : function (attachments) {
		attachments = attachments || { };

		var gl = this._gl;
		var cb = this._cb;

		var t = this._t;
		var h = this._h;

		cb.pushFramebuffer(t);
		gl.bindFramebuffer(t, h);

		if ("color" in attachments) {
			this._setAttachment(gl.COLOR_ATTACHMENT0, attachments.color);
		}

		if ("depthStencil" in attachments) {
			this._setAttachment(gl.DEPTH_ATTACHMENT,         null                    );
			this._setAttachment(gl.STENCIL_ATTACHMENT,       null                    );
			this._setAttachment(gl.DEPTH_STENCIL_ATTACHMENT, attachments.depthStencil);
		}
		else if ("depth" in attachments) {
			this._setAttachment(gl.DEPTH_STENCIL_ATTACHMENT, null                    );
			this._setAttachment(gl.STENCIL_ATTACHMENT,       null                    );
			this._setAttachment(gl.DEPTH_ATTACHMENT,         attachments.depth       );
		}
		else if ("stencil" in attachments) {
			this._setAttachment(gl.DEPTH_STENCIL_ATTACHMENT, null                    );
			this._setAttachment(gl.DEPTH_ATTACHMENT,         null                    );
			this._setAttachment(gl.STENCIL_ATTACHMENT,       attachments.stencil     );
		}

		this._status = gl.checkFramebufferStatus(t);

		cb.popFramebuffer(t);

		return this.isComplete;
	},

	/**
	 * Retrieves the attached resources.
	 * This method returns a new object containing the attachments information.
	 *
	 * @returns {object} The attachments data. The object fields may be: color, depth, stencil and depthStencil.
	 *
	 * @see setAttachments
	 */
	getAttachments : function () {
		var rAtts = { };
		var att   = null;
		for (var a in this._attachments) {
			att = this._attachments[a];
			rAtts[a] = {
				attachment : att.attachment,
				resource   : att.resource,
				target     : att.target,
				level      : att.level
			};
		}
		return rAtts;
	},

	/**
	 * Detaches all attached resources.
	 *
	 * @see setAttachments
	 */
	detachAll : function () {
		this.setAttachments({
			color        : null,
			depthStencil : null
		});
	},

	/**
	 * Gets/Sets the resource attached to the color attachment.
	 * If no resource is attached the result is null.
	 * When setting, default attaching parameters are used.
	 *
	 * @type SpiderGL.WebGL.Texture|SpiderGL.WebGL.Renderbuffer
	 *
	 * @readonly
	 *
	 * @see depthTarget
	 * @see stencilTarget
	 * @see depthStencilTarget
	 */
	get colorTarget() {
		var att = this._attachments.color;
		if (!att) return null
		return att.resource;
	},

	set colorTarget(rt) {
		this.setAttachments({ color : rt });
	},

	/**
	 * Gets/Sets the resource attached to the depth attachment.
	 * If no resource is attached the result is null.
	 * When setting, default attaching parameters are used.
	 *
	 * @type SpiderGL.WebGL.Texture|SpiderGL.WebGL.Renderbuffer
	 *
	 * @readonly
	 *
	 * @see colorTarget
	 * @see stencilTarget
	 * @see depthStencilTarget
	 */
	get depthTarget() {
		var att = this._attachments.depth;
		if (!att) return null
		return att.resource;
	},

	set depthTarget(rt) {
		this.setAttachments({ depth : rt });
	},

	/**
	 * Gets/Sets the resource attached to the stencil attachment.
	 * If no resource is attached the result is null.
	 * When setting, default attaching parameters are used.
	 *
	 * @type SpiderGL.WebGL.Texture|SpiderGL.WebGL.Renderbuffer
	 *
	 * @readonly
	 *
	 * @see colorTarget
	 * @see depthTarget
	 * @see depthStencilTarget
	 */
	get stencilTarget() {
		var att = this._attachments.stencil;
		if (!att) return null
		return att.resource;
	},

	set stencilTarget(rt) {
		this.setAttachments({ stencil : rt });
	},

	/**
	 * Gets/Sets the resource attached to the depthStencil attachment.
	 * If no resource is attached the result is null.
	 * When setting, default attaching parameters are used.
	 *
	 * @type SpiderGL.WebGL.Texture|SpiderGL.WebGL.Renderbuffer
	 *
	 * @readonly
	 *
	 * @see colorTarget
	 * @see depthTarget
	 * @see stencilTarget
	 */
	get depthStencilTarget() {
		var att = this._attachments.depthStencil;
		if (!att) return null
		return att.resource;
	},

	set depthStencilTarget(rt) {
		this.setAttachments({ depthStencil : rt });
	},

	/**
	 * Clears the framebuffer using current clear values.
	 *
	 * @param {number} mask The clear mask as for WebGLRenderingContext.clear.
	 */
	clear : function (mask) {
		mask = SpiderGL.Utility.getDefaultValue(mask, SpiderGL.WebGL.Framebuffer.DEFAULT_CLEAR_MASK);
		this._dsa.clear(this._h, mask);
	},

	/**
	 * Reads the pixels from a rectangular region of the framebuffer.
	 *
	 * @param {ArrayBufferView} buffer The destination buffer in which pixels will be written.
	 * @param {object} [options] Optional parameters.
	 * @param {number} [options.x=SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_X] The rectangle left coordinate (in pixels).
	 * @param {number} [options.y=SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_X] The rectangle bottom coordinate (in pixels).
	 * @param {number} [options.width=SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_WIDTH] The rectangle width (in pixels). If less than zero, the width will be set to span the whole render target (starting from rectangle x coordinate).
	 * @param {number} [options.height=SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_HEIGHT] The rectangle height (in pixels). If less than zero, the height will be set to span the whole render target (starting from rectangle y coordinate).
	 * @param {number} [options.format=SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_FORMAT] The WebGL pixel format.
	 * @param {number} [options.type=SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_TYPE] The WebGL pixel type.
	 */
	readPixels : function (buffer, options) {
		options = SpiderGL.Utility.getDefaultObject({
			x      : SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_X,
			y      : SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_Y,
			width  : SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_WIDTH,
			height : SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_HEIGHT,
			format : SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_FORMAT,
			type   : SpiderGL.WebGL.Framebuffer.DEFAULT_READ_PIXELS_TYPE
		}, options);

		if (options.width  < 0) { options.width  = this._viewport[2]; }
		if (options.height < 0) { options.height = this._viewport[3]; }

		this._dsa.readPixels(this._h, options.x, options.y, options.width, options.height, options.format, options.type, buffer);
	},

	/**
	 * Sets the WebGL viewport to the framebuffer viewport rectangle.
	 *
	 * @see viewport
	 * @see autoViewport
	 * @see setAttachments
	 */
	applyViewport : function () {
		var gl = this._gl;
		var vp = this._viewport;
		gl.viewport(vp[0], vp[1], vp[2], vp[3]);
	},

	/**
	 * Destroys the WebGLFramebuffer.
	 * After destruction, the handle is set to null and this object should not be used anymore.
	 *
	 * @see SpiderGL.WebGL.ObjectGL#destroy
	 */
	destroy : function () {
		this._gl.deleteFramebuffer(this._h);
	},

	/**
	 * Binds the wrapped WebGLFramebuffer to the WebGLRenderingContex.FRAMEBUFFER target.
	 * If setViewport is not specified and autoViewport is true, the stored viewport is set with WebGLRenderingContext.viewport().
	 *
	 * @param {bool} [setViewport] If specified, overrides the value of autoViewport.
	 *
	 * @see unbind
	 * @see autoViewport
	 */
	bind : function (setViewport) {
		var gl = this._gl;
		gl.bindFramebuffer(this._t, this._h);
		var svp = SpiderGL.Utility.getDefaultValue(setViewport, this._autoViewport);
		if (svp) {
			var vp = this._viewport;
			gl.viewport(vp[0], vp[1], vp[2], vp[3]);
		}
	},

	/**
	 * Binds "null" to the WebGLRenderingContex.FRAMEBUFFER target.
	 * This method is provided only for simmetry with {@link bind} and is not relative to the object state.
	 *
	 * @see bind
	 */
	unbind : function () {
		this._gl.bindFramebuffer(this._t, null);
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.Framebuffer, SpiderGL.WebGL.ObjectGL);

/**
 * Creates a SpiderGL.WebGL.Program.
 *
 * SpiderGL.WebGL.Program is a wrapper for WebGLProgram objects.
 *
 * @class The SpiderGL.WebGL.Program is a wrapper for WebGLProgram objects.
 *
 * @augments SpiderGL.WebGL.ObjectGL
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {object} [options] Optional parameters.
 * @param {WebGLProgram} [options.handle] A WebGLProgram. If present, this object will be used as the wrapped WebGLProgram and the attached shaders will be queried. Otherwise a new one will be created.
 * @param {bool} [options.autoLink=SpiderGL.WebGL.Program.DEFAULT_AUTO_LINK] If true, the program will be linked automatically whenever shaders are added or removed, or vertex attribute indices change.
 * @param {array} [options.shaders] An array of SpiderGL.WebGL.Shader objects to attach to the program.
 * @param {object} [options.attributes] An object where each property has the name of a vertex shader attribute and whose value is the attribute index to wich the vertex attribute will be bound.
 * @param {object} [options.uniforms] An object where each property has the name of a program uniform and whose value is the uniform value.
 *
 * @example
 * var vertexShader   = new SpiderGL.WebGL.VertexShader   (gl, {source: vertexShaderSrc  });
 * var fragmentShader = new SpiderGL.WebGL.FragmentShader (gl, {source: fragmentShaderSrc});
 *
 * var program = new SpiderGL.WebGL.Program(gl, {
 * 	autoLink : true, // if true, the program is automatically linked whenever shaders are added or removed, or whenever attribute indices are changed.
 * 	shaders  : [vertexShader, fragmentShader],
 * 	attributes : {
 * 		aPosition : 0, // the vertex shader aPosition attribute will be bound to the vertex attribute at index 0
 * 		aNormal   : 1  // the vertex shader aNormal attribute will be bound to the vertex attribute at index 1
 * 	},
 * 	uniforms : {
 * 		uDiffuseMap  : 0,  // index of the texture unit for diffuse color textures
 * 		uScaleFactor : 2.0
 * 	}
 * };
 *
 * // uniforms can also be set when the program is not bound
 * program.setUniforms({
 *	uModelViewProjection : getMVP(),
 *	uShininess           : getShininess()
 * });
 *
 * program.bind();
 * // render
 *
 * @see setShaders
 * @see setAttributes
 * @see setUniforms
 * @see autoLink
 * @see SpiderGL.WebGL.Shader
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.Program = function (gl, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }

	if (SpiderGL.Type.instanceOf(options, WebGLProgram)) {
		options = { handle : options };
	}

	options = SpiderGL.Utility.getDefaultObject({
		handle   : null,
		autoLink : SpiderGL.WebGL.Program.DEFAULT_AUTO_LINK
	}, options);

	SpiderGL.WebGL.ObjectGL.call(this, gl, SpiderGL.WebGL.Program.TARGET, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;

	var gl  = this._gl;
	var cb  = this._cb;
	var dsa = this._dsa;

	var h = this._h;

	var linked    = false;
	var log       = "";

	var imported = false;
	if (h) {
		imported = true;
		linked   = !!gl.getProgramParameter(h, gl.LINK_STATUS);
		log      = gl.getProgramInfoLog(h);
		if (!log) { log = ""; }
	}
	else {
		h = gl.createProgram();
		this._h = h;
	}
	h._spidergl = this;

	this._shaders    = [ ];
	this._linked     = linked;
	this._log        = log;
	this._autoLink   = options.autoLink;
	this._attributes = { };
	this._uniforms   = { };

	if (imported) {
		var shaders = gl.getAttachedShaders(h);
		for (var i=0,n=shaders.length; i<n; ++i) {
			this._importShader(shaders[i]);
		}
	}

	var mustLink = false;
	if (this._addShaders(options.shaders))       { mustLink = true; }
	if (this._setAttributes(options.attributes)) { mustLink = true; }

	if (mustLink && this._autoLink) { this.link(); }
	else if (imported) { this._postLink(); }

	this.setUniforms(options.uniforms);
}

/**
 * Dummy WebGL target for programs.
 * It is equal to WebGLRenderingContext.NONE and is provided only for completeness with other WebGL wrappers.
 *
 * @type number
 *
 * @default WebGLRenderingContext.NONE
 */
SpiderGL.WebGL.Program.TARGET = WebGLRenderingContext.NONE;

/**
 * Default value for SpiderGL.WebGL.Program#autoLink.
 *
 * @type bool
 *
 * @default true
 */
SpiderGL.WebGL.Program.DEFAULT_AUTO_LINK = true;

/**
 * WebGLProgram unbinding.
 *
 * This function binds the null program with WebGLRenderingContext.useProgram(null).
 *
 * @param  {WebGLRenderingContext} gl A WebGLRenderingContext.
 */
SpiderGL.WebGL.Program.unbind = function (gl) { gl.useProgram(null); };

SpiderGL.WebGL.Program._uniformSetFunctions = { };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.BOOL        ] = function (dsa, h, v) { dsa.uniform1i        (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.BOOL_VEC2   ] = function (dsa, h, v) { dsa.uniform2iv       (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.BOOL_VEC3   ] = function (dsa, h, v) { dsa.uniform3iv       (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.BOOL_VEC4   ] = function (dsa, h, v) { dsa.uniform4iv       (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.INT         ] = function (dsa, h, v) { dsa.uniform1i        (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.INT_VEC2    ] = function (dsa, h, v) { dsa.uniform2iv       (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.INT_VEC3    ] = function (dsa, h, v) { dsa.uniform3iv       (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.INT_VEC4    ] = function (dsa, h, v) { dsa.uniform4iv       (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.FLOAT       ] = function (dsa, h, v) { dsa.uniform1f        (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.FLOAT_VEC2  ] = function (dsa, h, v) { dsa.uniform2fv       (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.FLOAT_VEC3  ] = function (dsa, h, v) { dsa.uniform3fv       (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.FLOAT_VEC4  ] = function (dsa, h, v) { dsa.uniform4fv       (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.FLOAT_MAT2  ] = function (dsa, h, v) { dsa.uniformMatrix2fv (h, this.location, false, v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.FLOAT_MAT3  ] = function (dsa, h, v) { dsa.uniformMatrix3fv (h, this.location, false, v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.FLOAT_MAT4  ] = function (dsa, h, v) { dsa.uniformMatrix4fv (h, this.location, false, v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.SAMPLER_2D  ] = function (dsa, h, v) { dsa.uniform1i        (h, this.location,        v); };
SpiderGL.WebGL.Program._uniformSetFunctions[WebGLRenderingContext.SAMPLER_CUBE] = function (dsa, h, v) { dsa.uniform1i        (h, this.location,        v); };

SpiderGL.WebGL.Program.prototype = {
	_gl_deleteProgram : function (program) {
		this._h = null;
	},

	_gl_isProgram : function (program) {
	},

	_gl_useProgram : function (program) {
	},

	_gl_getActiveAttrib : function (program, index) {
	},

	_gl_getActiveUniform : function (program, index) {
	},

	_gl_getAttachedShaders : function (program) {
	},

	_gl_getAttribLocation : function (program, name) {
	},

	_gl_getProgramParameter : function (program, pname) {
	},

	_gl_getProgramInfoLog : function (program) {
	},

	_gl_getUniform : function (program, location) {
	},

	_gl_getUniformLocation : function (program, name) {
	},

	_gl_attachShader : function (program, shader) {
		this._importShader(shader);
	},

	_gl_bindAttribLocation : function (program, index, name) {
	},

	_gl_detachShader : function (program, shader) {
		if (!shader) { return; }
		var idx = this._shaderHandleIndex(shader);
		if (idx < 0) { return; }
		this._shaders.splice(idx, 1);
	},

	_gl_linkProgram : function (program) {
		this._postLink();
	},

	_gl_uniform1f : function (location, x) {
	},

	_gl_uniform1fv : function (location, v) {
	},

	_gl_uniform1i : function (location, x) {
	},

	_gl_uniform1iv : function (location, v) {
	},

	_gl_uniform2f : function (location, x, y) {
	},

	_gl_uniform2fv : function (location, v) {
	},

	_gl_uniform2i : function (location, x, y) {
	},

	_gl_uniform2iv : function (location, v) {
	},

	_gl_uniform3f : function (location, x, y, z) {
	},

	_gl_uniform3fv : function (location, v) {
	},

	_gl_uniform3i : function (location, x, y, z) {
	},

	_gl_uniform3iv : function (location, v) {
	},

	_gl_uniform4f : function (location, x, y, z, w) {
	},

	_gl_uniform4fv : function (location, v) {
	},

	_gl_uniform4i : function (location, x, y, z, w) {
	},

	_gl_uniform4iv : function (location, v) {
	},

	_gl_uniformMatrix2fv : function (location, transpose, value) {
	},

	_gl_uniformMatrix3fv : function (location, transpose, value) {
	},

	_gl_uniformMatrix4fv : function (location, transpose, value) {
	},

	_gl_validateProgram : function (program) {
	},

	_shaderHandleIndex : function (shader) {
		for (var i=0,n=this._shaders.length; i<n; ++i) {
			if (this._shaders[i].handle === shader) {
				return i;
			}
		}
		return -1;
	},

	_shaderIndex : function (shader) {
		if (this._shaders.indexOf) { return this._shaders.indexOf(shader); }
		else {
			for (var i=0,n=this._shaders.length; i<n; ++i) {
				if (this._shaders[i] === shader) {
					return i;
				}
			}
			return -1;
		}
	},

	_importShader : function (shader) {
		if (!shader) { return; }
		if (this._shaderHandleIndex(shader) >= 0) { return; }

		var gl = this._gl;
		var shd = shader._spidergl;
		if (!shd) {
			var type = gl.getShaderParameter(shader, gl.SHADER_TYPE);
			switch (type) {
				case gl.VERTEX_SHADER   : shd = new SpiderGL.WebGL.VertexShader   (gl, { handle : shader }); break;
				case gl.FRAGMENT_SHADER : shd = new SpiderGL.WebGL.FragmentShader (gl, { handle : shader }); break;
				default : return; break;
			}
		}
		this._shaders.push(shd);
	},

	_updateActiveInfo : function () {
		var gl = this._gl;
		var h = this._h;

		var n    = 0;
		var nfo  = null;
		var name = null;
		var loc  = null;

		var attributes = { };
		n = gl.getProgramParameter(h, gl.ACTIVE_ATTRIBUTES);
		for (var i=0; i<n; ++i) {
			nfo  = gl.getActiveAttrib(h, i);
			name = nfo.name;
			loc  = gl.getAttribLocation(h, name);
			attributes[name] = {
				index    : i,
				name     : name,
				size     : nfo.size,
				type     : nfo.type,
				location : loc
			};
		}

		var uniforms = { };
		n = gl.getProgramParameter(h, gl.ACTIVE_UNIFORMS);
		for (var i=0; i<n; ++i) {
			nfo = gl.getActiveUniform(h, i);
			name = nfo.name;
			loc  = gl.getUniformLocation(h, name);
			uniforms[name] = {
				index    : i,
				name     : name,
				size     : nfo.size,
				type     : nfo.type,
				location : loc,
				setValue : SpiderGL.WebGL.Program._uniformSetFunctions[nfo.type]
			};
		}

		this._attributes = attributes;
		this._uniforms   = uniforms;
	},

	_postLink : function () {
		var gl = this._gl;
		var h = this._h;
		this._linked = !!gl.getProgramParameter(h, gl.LINK_STATUS);
		this._log = gl.getProgramInfoLog(h);
		if (!this._log) { this._log = ""; }
		this._updateActiveInfo();
	},

	_addShaders : function (shaders) {
		if (!shaders) { return false; }

		var gl = this._gl;
		var h = this._h;
		var shd = null;
		var hshd = null;

		for (var i=0,n=shaders.length; i<n; ++i) {
			shd = shaders[i];
			hshd = null;
			if (SpiderGL.Type.instanceOf(shd, SpiderGL.WebGL.Shader)) {
				hshd = shd.handle;
			}
			if (SpiderGL.Type.instanceOf(shd, WebGLShader)) {
				hshd = shd;
			}
			if (hshd) {
				gl.attachShader(h, hshd);
			}
		}

		return true;
	},

	_removeShaders : function (shaders) {
		if (!shaders) { return false; }

		var gl = this._gl;
		var h = this._h;
		var shd = null;
		var hshd = null;

		for (var i=0,n=shaders.length; i<n; ++i) {
			shd = shaders[i];
			hshd = null;
			if (SpiderGL.Type.instanceOf(shd, SpiderGL.WebGL.Shader)) {
				hshd = shd.handle;
			}
			if (SpiderGL.Type.instanceOf(shd, SpiderGL.WebGL.Shader)) {
				hshd = shd;
			}
			if (hshd) {
				gl.detachShader(h, hshd);
			}
		}

		return true;
	},

	_setAttributes : function (attributes) {
		if (!attributes) { return false; }
		var gl = this._gl;
		var h = this._h;
		for (var a in attributes) {
			gl.bindAttribLocation(h, attributes[a], a);
		}
		return true;
	},

	/*
	get isEmpty     () { return (this._shaders.length <= 0); },
	*/

	/**
	 * Tests if the program is ready to use.
	 * A program is considered ready if it is succesfully linked.
	 *
	 * @type bool
	 *
	 * @readonly
	 *
	 * @see isLinked
	 */
	get isReady() {
		return this.isLinked;
	},

	/**
	 * Tests if the program is linked.
	 *
	 * @type bool
	 *
	 * @readonly
	 *
	 * @see isReady
	 */
	get isLinked() {
		return this._linked;
	},

	/*
	get isValidated() {
		return this._validated;
	},
	*/

	/**
	 * Gets the program info log.
	 *
	 * @type bool
	 *
	 * @readonly
	 */
	get log() {
		return this._log;
	},

	/**
	 * Gets/Sets if the program will be linked automatically whenever shaders are added or removed, or vertex attribute indices change.
	 *
	 * @type bool
	 *
	 * @see link
	 */
	get autoLink() {
		return this._autoLink;
	},

	set autoLink(on) { 
		this._autoLink = !!on;
	},

	/**
	 * Attaches the provided shaders to the program.
	 * If link is not specified and autoLink is true, the program is automatically linked.
	 *
	 * @param {array|SpiderGL.WebGL.Shader} shaders An array of SpiderGL.WebGL.Shader or a single SpiderGL.WebGL.Shader to attach.
	 * @param {bool} [link] If specified, overrides the value of autoLink.
	 *
	 * @returns {bool} If the program has been linked, returns whether the program is linked, otherwise always returns true.
	 *
	 * @see isLinked
	 */
	addShaders : function (shaders, link) {
		var mustLink = this._addShaders(shaders);
		if (!mustLink) { return true; };
		mustLink = SpiderGL.Utility.getDefaultValue(link, this._autoLink);
		if (!mustLink) { return true; }
		return this.link()
	},

	/**
	 * Detaches the provided shaders to the program.
	 * If link is not specified and autoLink is true, the program is automatically linked.
	 *
	 * @param {array|SpiderGL.WebGL.Shader} shaders An array of SpiderGL.WebGL.Shader or a single SpiderGL.WebGL.Shader to detach.
	 * @param {bool} [link] If specified, overrides the value of autoLink.
	 *
	 * @returns {bool} If the program has been linked, returns whether the program is linked, otherwise always returns true.
	 */
	removeShaders : function (shaders, link) {
		var mustLink = this._removeShaders(shaders);
		if (!mustLink) { return true; };
		mustLink = SpiderGL.Utility.getDefaultValue(link, this._autoLink);
		if (!mustLink) { return true; }
		return this.link()
	},

	/**
	 * Tests whether the passed shader is attached to the program.
	 *
	 * @param {SpiderGL.WebGL.Shader} shader The shader to test for attachment.
	 *
	 * @returns {bool} If the shader is attached, false otherwise.
	 */
	hasShader : function (shader) {
		return (this._shaderIndex(shader) >= 0);
	},

	/**
	 * Gets the attached shaders.
	 *
	 * @returns {array} An array with the attached SpiderGL.WebGL.Shader objects.
	 */
	getShaders : function () {
		return this._shaders.slice();
	},

	/**
	 * Links the program.
	 *
	 * @returns {bool} True if the program has been succesfully linked, false otherwise.
	 */
	link : function () {
		this._gl.linkProgram(this._h);
		return this._linked;
	},

	/**
	 * Validates the program with the current attribute indices, uniforms and WebGLRenderingContext state
	 * It is performed using WebGLRenderingContext.validateProgram().
	 *
	 * @returns {bool} True if the program has been succesfully validated, false otherwise.
	 */
	validate : function () {
		var gl = this._gl;
		var h = this._h;
		gl.validateProgram(h);
		var validated = !!gl.getProgramParameter(h, gl.VALIDATE_STATUS);
		return validated;
	},

	/**
	 * Sets the indices of vertex shader attributes.
	 * Only the recognized attributes (i.e. the active attributes in vertex shaders) will be set.
	 * The attribute binding indices will take effect only when the program is linked again.
	 * If autoLink is true, the program is automatically linked.
	 *
	 * @param {object} attributes The attributes to set. For each attribute index to set, the object must contain a property whose name is the name of the vertex attribute and whose value is a non-negative integer specifying the attribute bind index.
	 *
	 * @example
	 * var vertexShaderSrc = "" +
	 * 	"..." + 
	 * 	"attribute vec3 aPosition; \n" +
	 * 	"attribute vec3 aNormal;   \n" +
	 * 	"...";
	 *
	 * // setup the program (attribute indices can also be set at construction)
	 * // ...
	 *
	 * // set attributes indices;
	 * // if autoLink is true, the program will be automatically linked;
	 * // otherwise it must be explicitly linked with program.link()
	 * program.setAttributes({
	 * 	aPosition : 3,  // bind attribute aPosition to vertex attribute 3
	 * 	aNormal   : 1   // bind attribute aNormal to vertex attribute 1
	 * 	aColor    : 2   // this attribute is not set because it is not an active attribute
	 * });
	 *
	 * @returns {bool} True if the attributes have been set, false otherwise.
	 *
	 * @see getAttributesIndices
	 * @see getAttributesInfo
	 * @see setUniforms
	 * @see link
	 * @see autoLink
	 */
	setAttributes : function (attributes) {
		if (!this._setAttributes(attributes)) return false;
		if (this._autoLink) return this.link();
		return true;
	},

	/**
	 * Gets vertex attributes names.
	 *
	 * @returns {array} An array containing the names of all active vertex shader attributes.
	 *
	 * @see getAttributesIndices
	 * @see getAttributesInfo
	 */
	getAttributesNames : function () {
		var attributes  = this._attributes;
		var rAttributes = [ ];
		for (var a in attributes) {
			rAttributes.push(attributes[a].name);
		}
		return rAttributes;
	},

	/**
	 * Gets the vertex attributes binding indices.
	 *
	 * @returns {object} An object with one property for each active vertex attribute. The name of the property is the name of the attribute in the vertex shader and its value is a non-negative integer representing the attribute bind index.
	 *
	 * @see getAttributesInfo
	 * @see setAttributes
	 */
	getAttributesIndices : function () {
		var attributes  = this._attributes;
		var rAttributes = { };
		for (var a in attributes) {
			rAttributes[a] = attributes[a].location;
		}
		return rAttributes;
	},

	/**
	 * Gets the vertex attributes informations.
	 *
	 * @returns {object} An object where each property has the name of a vertex shader attribute and whose value is an object containing attribute information. The attribute index is in the "location" property.
	 *
	 * @see getAttributesIndices
	 * @see setAttributes
	 */
	getAttributesInfo : function () {
		var attributes  = this._attributes;
		var attribute   = null;
		var rAttributes = { };
		for (var a in attributes) {
			attribute = attributes[a];
			rAttributes[a] = {
				index    : attribute.index,
				name     : attribute.name,
				size     : attribute.size,
				type     : attribute.type,
				location : attribute.location
			};
		}
		return rAttributes;
	},

	/**
	 * Sets the program uniforms.
	 * Only the recognized uniforms are set.
	 *
	 * @param {object} uniforms An object where each property has the name of the uniform to set and whose value is the uniform value.
	 *
	 * @example
	 * var vertexShaderSrc = "" +
	 * 	"..." + 
	 * 	"uniform mat4  uMVP;      \n" +
	 * 	"uniform float uScale;    \n" +
	 * 	"uniform vec3  uLightPos; \n" +
	 * 	"...";
	 *
	 * // setup the program (uniforms can also be set at construction)
	 * // ...
	 *
	 * // set uniform values;
	 * program.setUniforms({
	 * 	uMVP      : getModelViewProjection(),
	 * 	uScale    : 2.3,
	 * 	uLightPos : [0, 0.5, 4.7], // can be a typed array: new Float32Array([0, 0.5, 4.7])
	 * 	uOther    : 1.0 // this uniform is not set because it is not an active uniform
	 * });
	 *
	 * @returns {bool} True if the uniforms have been set succesfully, false otherwise.
	 */
	setUniforms : function (uniforms) {
		if (!uniforms) { return false; }

		var gl  = this._gl;
		var cb  = this._cb;
		var dsa = this._dsa;

		var h = this._h;

		cb.pushProgram();
		gl.useProgram(h);

		var _uniforms = this._uniforms;
		var uniform = null;
		var value   = null;
		for (var u in uniforms) {
			uniform = _uniforms[u];
			if (uniform) {
				uniform.setValue(dsa, h, uniforms[u]);
			}
		}

		cb.popProgram();

		return true;
	},

	/**
	 * Gets uniforms names.
	 *
	 * @returns {array} An array containing the names of all active uniforms.
	 *
	 * @see getUniformsValues
	 * @see getUniformsInfo
	 */
	getUniformsNames : function () {
		var uniforms  = this._uniforms;
		var rUniforms = [ ];
		for (var u in uniforms) {
			rUniforms.push(uniforms[u].name);
		}
		return rUniforms;
	},

	/**
	 * Gets the values of the program uniforms.
	 *
	 * @returns {object} An object with one property for each active uniform. The name of the property is the name of the uniform and its value is the uniform value, which can be a number, an array or a typed array.
	 */
	getUniformsValues : function () {
		var gl = this._gl;
		var h = this._h;
		var uniforms  = this._uniforms;
		var rUniforms = { };
		for (var u in uniforms) {
			rUniforms[u] = gl.getUniform(h, uniforms[u].location);
		}
		return rUniforms;
	},

	/**
	 * Gets the program uniforms informations.
	 *
	 * @returns {object} An object where each property has the name of a program uniform and whose value is an object containing uinformation.
	 */
	getUniformsInfo : function () {
		var uniforms  = this._uniforms;
		var uniform   = null;
		var value     = null;
		var rUniforms = { };
		for (var u in uniforms) {
			uniform = uniforms[u];
			rUniforms[u] = {
				index    : uniform.index,
				name     : uniform.name,
				size     : uniform.size,
				type     : uniform.type,
				location : uniform.location
			};
		}
		return rUniforms;
	},

	/**
	 * Destroys the WebGLProgram.
	 * After destruction, the handle is set to null and this object should not be used anymore.
	 *
	 * @see SpiderGL.WebGL.ObjectGL#destroy
	 */
	destroy : function () {
		this._gl.deleteProgram(this._h);
	},

	/**
	 * Binds the wrapped WebGLProgram with WebGLRenderingContext.useProgram().
	 *
	 * @see unbind
	 */
	bind : function () {
		this._gl.useProgram(this._h);
	},

	/**
	 * Binds the "null" program with WebGLRenderingContext.useProgram(null).
	 * This method is provided only for simmetry with {@link bind} and is not relative to the object state.
	 *
	 * @see bind
	 */
	unbind : function () {
		this._gl.useProgram(null);
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.Program, SpiderGL.WebGL.ObjectGL);

/**
 * Creates a SpiderGL.WebGL.Renderbuffer.
 *
 * SpiderGL.WebGL.Renderbuffer is a wrapper for WebGLRenderbuffer.
 *
 * @class The SpiderGL.WebGL.Renderbuffer is a wrapper for WebGLRenderbuffer.
 *
 * @augments SpiderGL.WebGL.ObjectGL
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {object} [options] Optional parameters.
 * @param {WebGLRenderbuffer} [options.handle] A WebGLRenderbuffer. If present, this object will be used as the wrapped WebGLRenderbuffer. Otherwise a new one will be created.
 * @param {number} [options.internalFormat] The WebGL enumeration specifying the renderbuffer internal format.
 * @param {object} [options.width] The width of the renderbuffer.
 * @param {object} [options.height] The height of the renderbuffer.
 *
 * @example
 * var rb = new SpiderGL.WebGL.Renderbuffer(gl, {
 * 	internalFormat : gl.RGBA,
 * 	width  : 800,
 * 	height : 600
 * });
 *
 * @see setStorage
 * @see SpiderGL.WebGL.Framebuffer
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.Renderbuffer = function (gl, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }

	if (SpiderGL.Type.instanceOf(h, WebGLRenderbuffer)) {
		options = { handle : options };
	}

	options = SpiderGL.Utility.getDefaultObject({
		handle : null,
	}, options);

	SpiderGL.WebGL.ObjectGL.call(this, gl, SpiderGL.WebGL.Renderbuffer.TARGET, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;

	var gl  = this._gl;
	var cb  = this._cb;
	var dsa = this._dsa;

	var t = this._t;
	var h = this._h;

	var format = gl.NONE;
	var width  = 0;
	var height = 0;

	if (h) {
		cb.pushRenderbuffer(t);
		gl.bindRenderbuffer(t, h);
		format = gl.getRenderbufferParameter(t, gl.RENDERBUFFER_INTERNAL_FORMAT);
		width  = gl.getRenderbufferParameter(t, gl.RENDERBUFFER_WIDTH);
		height = gl.getRenderbufferParameter(t, gl.RENDERBUFFER_HEIGHT);
		cb.popRenderbuffer(t);
	}
	else {
		h = gl.createRenderbuffer();
		this._h = h;
	}
	h._spidergl = this;

	this._width  = width;
	this._height = height;
	this._format = format;

	if (SpiderGL.Type.isNumber(options.internalFormat) && SpiderGL.Type.isNumber(options.width) && SpiderGL.Type.isNumber(options.height)) {
		this.setStorage(options.internalFormat, options.width, options.height, options.format);
	}
}

/**
 * WebGL target for renderbuffers.
 *
 * @type number
 *
 * @default WebGLRenderingContext.RENDERBUFFER
 */
SpiderGL.WebGL.Renderbuffer.TARGET = WebGLRenderingContext.RENDERBUFFER;

/**
 * WebGLRenderbuffer unbinding.
 *
 * This function binds the null renderbuffer to the WebGLRenderingContext.RENDERBUFFER target.
 *
 * @param  {WebGLRenderingContext} gl A WebGLRenderingContext.
 */
SpiderGL.WebGL.Renderbuffer.unbind = function (gl) { gl.bindRenderbuffer(SpiderGL.WebGL.Renderbuffer.TARGET, null); };

SpiderGL.WebGL.Renderbuffer.prototype = {
	_gl_deleteRenderbuffer : function (renderbuffer) {
		this._h = null;
	},

	_gl_isRenderbuffer : function (renderbuffer) {
	},

	_gl_bindRenderbuffer : function (target, renderbuffer) {
	},

	_gl_getRenderbufferParameter : function (target, pname) {
	},

	_gl_renderbufferStorage : function (target, internalformat, width, height) {
		this._format = internalformat;
		this._width  = width;
		this._height = height;
	},

	/*
	get isEmpty () { return ((this._width <= 0) || (this._height <= 0)); },
	*/

	/**
	 * Tests if the renderbuffer is ready to use.
	 * A renderbuffer is considered ready if its width and height are greater than zero.
	 *
	 * @type bool
	 *
	 * @readonly
	 */
	get isReady() {
		return ((this._width > 0) && (this._height > 0));
	},

	/**
	 * Gets the WebGL internal format of the renderbuffer.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get format() {
		return this._format;
	},

	/**
	 * Gets the width in pixels of the renderbuffer.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get width() {
		return this._width;
	},

	/**
	 * Gets the height in pixels of the renderbuffer.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get height() {
		return this._height;
	},

	/**
	 * Setups the renderbuffer storage configuration.
	 *
	 * @param {number} internalFormat The WebGL enumeration for the internal pixel format.
	 * @param {number} width The width in pixels of the renderbuffer.
	 * @param {number} height The height in pixels of the renderbuffer.
	 */
	setStorage : function (internalFormat, width, height) {
		this._dsa.renderbufferStorage(this._h, this._t, internalFormat, width, height);
	},

	/**
	 * Destroys the WebGLRenderbuffer.
	 * After destruction, the handle is set to null and this object should not be used anymore.
	 *
	 * @see SpiderGL.WebGL.ObjectGL#destroy
	 */
	destroy : function () {
		this._gl.deleteRenderbuffer(this._h);
	},

	/**
	 * Binds the wrapped WebGLRenderbuffer to the WebGLRenderingContex.RENDERBUFFER target.
	 *
	 * @see unbind
	 */
	bind : function () {
		this._gl.bindRenderbuffer(this._t, this._h);
	},

	/**
	 * Binds "null" to the WebGLRenderingContex.RENDERBUFFER target.
	 * This method is provided only for simmetry with {@link bind} and is not relative to the object state.
	 *
	 * @see bind
	 */
	unbind : function () {
		this._gl.bindRenderbuffer(this._t, null);
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.Renderbuffer, SpiderGL.WebGL.ObjectGL);

/**
 * Creates a SpiderGL.WebGL.Shader.
 *
 * SpiderGL.WebGL.Shader is the base class for WebGLShader object wrappers and must not be directly used.
 *
 * @class The SpiderGL.WebGL.Shader is the base class for all WebGLShader object wrappers, i.e. {@link SpiderGL.WebGL.Shader} and {@link SpiderGL.WebGL.FragmentShader}.
 *
 * @augments SpiderGL.WebGL.ObjectGL
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {number} target Not used.
 * @param {number} type WebGL shader type.
 * @param {object} [options] Optional parameters.
 * @param {WebGLShader} [options.handle] If defined, the provided shader will be wrapped and its source code will be queried to the rendering context. Otherwise an internal shader will be created.
 * @param {bool} [options.autoCompile=SpiderGL.WebGL.Shader.DEFAULT_AUTO_COMPILE] If true, the shader is automatically compiled whenever its source code changes.
 * @param {string} [options.source] Shader source code. If autoCompile is true, the shader will be automatically compiled.
 *
 * @see autoCompile
 * @see source
 * @see compile
 * @see SpiderGL.WebGL.VertexShader
 * @see SpiderGL.WebGL.FragmentShader
 * @see SpiderGL.WebGL.Program
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.Shader = function (gl, target, type, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }

	if (SpiderGL.Type.instanceOf(options, WebGLShader)) {
		options = { handle : options };
	}
	else if (SpiderGL.Type.isString(options)) {
		options = { source : options };
	}

	options = SpiderGL.Utility.getDefaultObject({
		handle      : null,
		source      : null,
		autoCompile : SpiderGL.WebGL.Shader.DEFAULT_AUTO_COMPILE
	}, options);

	SpiderGL.WebGL.ObjectGL.call(this, gl, target, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;

	var gl  = this._gl;
	var cb  = this._cb;
	var dsa = this._dsa;

	var source   = "";
	var compiled = false;
	var deleted  = false;
	var log      = "";

	var h = this._h;
	if (h) {
		source   = gl.getShaderSource(h);
		if (!source) { source = ""; }
		compiled = !!gl.getShaderParameter(h, gl.COMPILE_STATUS);
		deleted  = !!gl.getShaderParameter(h, gl.DELETE_STATUS);
		log      = gl.getShaderInfoLog(h);
		if (!log) { log = ""; }
	}
	else {
		h = gl.createShader(type);
		this._h = h;
	}
	h._spidergl = this;

	this._source      = source;
	this._compiled    = compiled;
	this._log         = log;
	this._autoCompile = options.autoCompile;

	if (options.source) { this.setSource(options.source); }
}

/**
 * Dummy WebGL target for shaders.
 *
 * It is equal to WebGLRenderingContext.NONE and is provided only for completeness with other WebGL wrappers.
 *
 * @type number
 *
 * @default WebGLRenderingContext.NONE
 */
SpiderGL.WebGL.Shader.TARGET = WebGLRenderingContext.NONE;

/**
 * Default value for SpiderGL.WebGL.Shader#autoCompile.
 *
 * @type bool
 *
 * @default true
 */
SpiderGL.WebGL.Shader.DEFAULT_AUTO_COMPILE = true;

/**
 * Dummy shader unbinding.
 *
 * This function does nothing and it is provided only for simmetry with other wrappers.
 *
 * @param  {WebGLRenderingContext} gl A WebGLRenderingContext.
 */
SpiderGL.WebGL.Shader.unbind = function (gl) { };

SpiderGL.WebGL.Shader.prototype = {
	_gl_deleteShader : function (shader) {
		this._h = null;
	},

	_gl_isShader : function (shader) {
	},

	_gl_getShaderParameter : function (shader, pname) {
	},

	_gl_getShaderInfoLog : function (shader) {
	},

	_gl_getShaderSource : function (shader) {
	},

	_gl_compileShader : function (shader) {
		this._postCompile();
	},

	_gl_shaderSource : function (shader, source) {
		this._source = source;
		if (!this._source) { this._source = ""; }
	},

	_postCompile : function () {
		var gl = this._gl;
		var h = this._h;
		this._compiled = !!gl.getShaderParameter(h, gl.COMPILE_STATUS);
		this._log      = gl.getShaderInfoLog(h);
		if (!this._log) { this._log = ""; }
	},

	/*
	get isEmpty () { return (this._source.length <= 0); },
	*/

	/**
	 * Tests if the shader is ready to use.
	 * A shader is considered ready if it is successfully compiled.
	 *
	 * @type bool
	 *
	 * @readonly
	 *
	 * @see isCompiled
	 */
	get isReady() {
		return this.isCompiled;
	},

	/**
	 * Tests if the shader is successfully compiled.
	 *
	 * @type bool
	 *
	 * @readonly
	 *
	 * @see isReady
	 */
	get isCompiled() {
		return this._compiled;
	},

	/**
	 * Gets the log output generated by the shader compiler.
	 *
	 * @type string
	 *
	 * @readonly
	 *
	 * @see compile
	 */
	get log() {
		return this._log;
	},

	/**
	 * Gets/Sets if the shader will be compiled automatically whenever the source code is changed.
	 *
	 * @type bool
	 *
	 * @see source
	 * @see compile
	 */
	get autoCompile() {
		return this._autoCompile;
	},

	set autoCompile(on) {
		this._autoCompile = !!on;
	},

	/**
	 * Sets the shader source code.
	 * If compile is not specified and autoCompile is true, the shader is automatically compiled.
	 *
	 * @param {string} src The shader source code.
	 * @param {bool} [compile] If specified, overrides the value of autoCompile.
	 *
	 * @see compile
	 * @see autoCompile
	 */
	setSource : function (src, compile) {
		var gl = this._gl;
		var h = this._h;

		gl.shaderSource(h, src);

		var c = SpiderGL.Utility.getDefaultValue(compile, this._autoCompile);
		if (!c) { true; }
		return this.compile();
	},

	/**
	 * Gets/Sets the shader source code.
	 * If autoCompile is true, the shader is automatically compiled when the source code string is changed.
	 *
	 * @type string
	 *
	 * @see setSource
	 * @see compile
	 * @see autoCompile
	 */
	get source() {
		return this._source;
	},

	set source(src) {
		this.setSource(src);
	},

	/**
	 * Compiles the shader.
	 *
	 * @returns {bool} True if the shader has been successfully compiled, false otherwise.
	 *
	 * @see source
	 * @see autoCompile
	 * @see log
	 */
	compile : function () {
		this._gl.compileShader(this._h);
		return this._compiled;
	},

	/**
	 * Destroys the WebGLShader.
	 * After destruction, the handle is set to null and this object should not be used anymore.
	 *
	 * @see SpiderGL.WebGL.ObjectGL#destroy
	 */
	destroy : function () {
		this._gl.deleteShader(this._h);
	},

	/**
	 * Dummy bind method.
	 * It is provided for simmetry with other WebGL object wrappers.
	 *
	 * @see unbind
	 */
	bind : function () {
	},

	/**
	 * Dummy unbind method.
	 * It is provided for simmetry with other WebGL object wrappers.
	 *
	 * @see bind
	 */
	unbind : function () {
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.Shader, SpiderGL.WebGL.ObjectGL);

/**
 * Creates a SpiderGL.WebGL.VertexShader.
 *
 * SpiderGL.WebGL.VertexShader represents a wrapper for a WebGLShader whose type is type WebGLRenderingContext.VERTEX_SHADER.
 *
 * @class The SpiderGL.WebGL.VertexShader is a WebGLShader wrapper for vertex shaders.
 *
 * @augments SpiderGL.WebGL.Shader
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {object} [options] See {@link SpiderGL.WebGL.Shader}.
 *
 * @see SpiderGL.WebGL.Shader
 * @see SpiderGL.WebGL.FragmentShader
 * @see SpiderGL.WebGL.Program
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.VertexShader = function (gl, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }
	SpiderGL.WebGL.Shader.call(this, gl, SpiderGL.WebGL.VertexShader.TARGET, gl.VERTEX_SHADER, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;
}

/**
 * Dummy WebGL target for vertex shaders.
 *
 * It is equal to WebGLRenderingContext.NONE and is provided only for completeness with other WebGL wrappers.
 *
 * @type number
 *
 * @default WebGLRenderingContext.NONE
 */
SpiderGL.WebGL.VertexShader.TARGET = WebGLRenderingContext.NONE;

/**
 * Dummy vertex shader unbinding.
 *
 * This function does nothing and it is provided only for simmetry with other wrappers.
 *
 * @param  {WebGLRenderingContext} gl A WebGLRenderingContext.
 */
SpiderGL.WebGL.VertexShader.unbind = function (gl) { };

SpiderGL.WebGL.VertexShader.prototype = { };

SpiderGL.Type.extend(SpiderGL.WebGL.VertexShader, SpiderGL.WebGL.Shader);

/**
 * Creates a SpiderGL.WebGL.FragmentShader.
 *
 * SpiderGL.WebGL.FragmentShader represents a wrapper for a WebGLShader whose type is type WebGLRenderingContext.FRAGMENT_SHADER.
 *
 * @class The SpiderGL.WebGL.FragmentShader is a WebGLShader wrapper for fragment shaders.
 *
 * @augments SpiderGL.WebGL.Shader
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {object} [options] See {@link SpiderGL.WebGL.Shader}.
 *
 * @see SpiderGL.WebGL.Shader
 * @see SpiderGL.WebGL.VertexShader
 * @see SpiderGL.WebGL.Program
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.FragmentShader = function (gl, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }
	SpiderGL.WebGL.Shader.call(this, gl, SpiderGL.WebGL.FragmentShader.TARGET, gl.FRAGMENT_SHADER, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;
}

/**
 * Dummy WebGL target for fragment shaders.
 *
 * It is equal to WebGLRenderingContext.NONE and is provided only for completeness with other WebGL wrappers.
 *
 * @type number
 *
 * @default WebGLRenderingContext.NONE
 */
SpiderGL.WebGL.FragmentShader.TARGET = WebGLRenderingContext.NONE;

/**
 * Dummy fragment shader unbinding.
 *
 * This function does nothing and it is provided only for simmetry with other wrappers.
 *
 * @param  {WebGLRenderingContext} gl A WebGLRenderingContext.
 */
SpiderGL.WebGL.FragmentShader.unbind = function (gl) { };

SpiderGL.WebGL.FragmentShader.prototype = { };

SpiderGL.Type.extend(SpiderGL.WebGL.FragmentShader, SpiderGL.WebGL.Shader);

/**
 * Creates a SpiderGL.WebGL.Texture.
 *
 * SpiderGL.WebGL.Texture is the base class for WebGLTexture object wrappers ({@link SpiderGL.WebGL.Texture2D} and {@link SpiderGL.WebGL.TextureCubeMap}) and must not be directly used.
 *
 * @class The SpiderGL.WebGL.Texture is the base class for all WebGLTexture object wrappers, i.e. {@link SpiderGL.WebGL.Texture2D} and {@link SpiderGL.WebGL.TextureCubeMap}.
 *
 * @augments SpiderGL.WebGL.ObjectGL
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {number} target Texture-specific target.
 * @param {object} [options] Optional parameters.
 * @param {WebGLTexture} [options.handle] If defined, the provided texture will be wrapped and its sampling parameters will be queried to the rendering context; as texture image base level width and height can not be retrieved, they should be specified with the width and height optional parameters. If handle is not specified, an internal texture will be created.
 * @param {string|array} [options.url] The url of the texture image to load. It has precedence over the data optional parameter. For SpiderGL.Texture.Texture2D, url is a string. For SpiderGL.Texture.TextureCubeMap, url is an array of six strings, one for each cube map face, in the order [+X, -X, +Y, -Y, +Z, -Z].
 * @param {ArrayBuffer|ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} [options.data] The texture image pixel data.
 * @param {number} [options.internalFormat=SpiderGL.WebGL.Texture.DEFAULT_INTERNAL_FORMAT] The texture internal format.
 * @param {number} [options.width] If data is null or a typed array, specifies the texture image width. If handle is provided, the width parameter will supply the width information, not querable to the WebGLRenderingContext.
 * @param {number} [options.height] If data is null or a typed array, specifies the texture image height. If handle is provided, the width parameter will supply the height information, not querable to the WebGLRenderingContext.
 * @param {number} [options.border=SpiderGL.WebGL.Texture.DEFAULT_BORDER] Texture border.
 * @param {number} [options.format=SpiderGL.WebGL.Texture.DEFAULT_FORMAT] The format parameter used for WebGLRenderingContext.texImage2D.
 * @param {number} [options.type=SpiderGL.WebGL.Texture.DEFAULT_TYPE] The type parameter used for WebGLRenderingContext.texImage2D.
 * @param {number} [options.magFilter=SpiderGL.WebGL.Texture.DEFAULT_MAG_FILTER] Texture magnification filter (see {@link SpiderGL.WebGL.Texture#magFilter}).
 * @param {number} [options.minFilter=SpiderGL.WebGL.Texture.DEFAULT_MIN_FILTER] Texture minnification filter (see {@link SpiderGL.WebGL.Texture#minFilter}).
 * @param {number} [options.wrapS=SpiderGL.WebGL.Texture.DEFAULT_WRAP_S] Texture horizontal wrap mode (see {@link SpiderGL.WebGL.Texture#wrapS}).
 * @param {number} [options.wrapT=SpiderGL.WebGL.Texture.DEFAULT_WRAP_T] Texture vertical wrap mode (see {@link SpiderGL.WebGL.Texture#wrapT}).
 * @param {bool} [options.autoMipmap=SpiderGL.WebGL.Texture.DEFAULT_AUTO_GENERATE_MIPMAP] If true, mipmaps are automatically generated when calling setImage or setSubImage (see {@link SpiderGL.WebGL.Texture#autoMipmap}).
 * @param {bool} [options.generateMipmap] If specified, overrides autoMipmap for this call.
 * @param {bool} [options.flipYPolicy=SpiderGL.WebGL.Texture.DEFAULT_UNPACK_FLIP_Y] WebGL unpack flip Y policy (see SpiderGL.WebGL.Texture#flipYPolicy).
 * @param {bool} [options.flipY] If specified, overrides flipYPolicy for this call.
 * @param {bool} [options.premultiplyAlphaPolicy=SpiderGL.WebGL.Texture.DEFAULT_UNPACK_PREMULTIPLY_ALPHA] WebGL unpack premultiply alpha policy (see SpiderGL.WebGL.Texture#premultiplyAlphaPolicy).
 * @param {bool} [options.premultiplyAlpha] If specified, overrides premultiplyAlphaPolicy for this call.
 * @param {number} [options.colorspaceConversionPolicy=SpiderGL.WebGL.Texture.DEFAULT_UNPACK_COLORSPACE_CONVERSION] WebGL unpack colorspace conversion policy (see SpiderGL.WebGL.Texture#colorspaceConversionPolicy).
 * @param {number} [options.colorspaceConversion] If specified, overrides colorspaceConversionPolicy for this call.
 * @param {function} [options.onCancel] If url is specified, this function will be called if image data loading is cancelled.
 * @param {function} [options.onError] If url is specified, this function will be called if an error occurs when loading image data.
 * @param {function} [options.onProgress] If url is specified, this function will be called during the image loading progress.
 * @param {function} [options.onSuccess] If url is specified, this function will be called when image data has been successfully loaded.
 *
 * @example
 * var tex1 = new SpiderGL.WebGL.Texture2D(gl, {
 * 	internalFormat : gl.RGBA,              // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_INTERNAL_FORMAT
 * 	width          : 256,
 * 	height         : 128,
 * 	border         : 0,                    // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_BORDER
 * 	format         : gl.RGBA,              // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_FORMAT
 * 	type           : gl.UNSIGNED_BYTE,     // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_TYPE
 * 	data           : new Uint8Array(...),  // if omitted or null, the texture is initialized to zero by the WebGLRenderingContext
 * 	magFilter      : gl.LINEAR,            // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_MAG_FILTER
 * 	minFilter      : gl.LINEAR,            // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_MIN_FILTER
 * 	wrapS          : gl.CLAMP_TO_EDGE,     // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_WRAP_S
 * 	wrapT          : gl.CLAMP_TO_EDGE,     // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_WRAP_T
 * 	autoMipmap     : true,                 // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_AUTO_GENERATE_MIPMAP
 * 	generateMipmap : false,                // if specified, overrides autoMipmap for this implicit call to setImage
 * 	flipYPolicy                : true,     // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_UNPACK_FLIP_Y
 * 	flipY                      : false,    // if specified, overrides flipYPolicy for this implicit call to setImage
 * 	premultiplyAlphaPolicy     : true,     // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_UNPACK_PREMULTIPLY_ALPHA
 * 	premultiplyAlpha           : false,    // if specified, overrides premultiplyAlphaPolicy for this implicit call to setImage
 * 	colorspaceConversionPolicy : true,     // if omitted, defaults to SpiderGL.WebGL.Texture.DEFAULT_UNPACK_COLORSPACE_CONVERSION
 * 	colorspaceConversion       : false     // if specified, overrides colorspaceConversionPolicy for this implicit call to setImage
 * });
 *
 * var tex2 = new SpiderGL.WebGL.TextureCubeMap(gl, {
 * 	url : [
 * 		http://someurl.org/cubemap_pos_x.png,
 * 		http://someurl.org/cubemap_neg_x.png,
 * 		http://someurl.org/cubemap_pos_y.png,
 * 		http://someurl.org/cubemap_neg_y.png,
 * 		http://someurl.org/cubemap_pos_z.png,
 * 		http://someurl.org/cubemap_neg_z.png
 * 	],
 * 	onCancel   : function () { ... },
 * 	onError    : function () { ... },
 * 	onProgress : function () { ... },
 * 	onLoad     : function () { ... },
 * 	wrapS      : gl.REPEAT,
 * 	magFilter  : gl.NEAREST
 * });
 *
 * @see SpiderGL.WebGL.Texture2D
 * @see SpiderGL.WebGL.TextureCubeMap
 * @see SpiderGL.WebGL.Framebuffer
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.Texture = function (gl, target, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }

	if (SpiderGL.Type.instanceOf(options, WebGLTexture)) {
		options = { handle : options };
	}
	else if (SpiderGL.Type.isString(options)) {
		options = { url : options };
	}

	options = SpiderGL.Utility.getDefaultObject({
		handle                     : null,
		magFilter                  : SpiderGL.WebGL.Texture.DEFAULT_MAG_FILTER,
		minFilter                  : SpiderGL.WebGL.Texture.DEFAULT_MIN_FILTER,
		wrapS                      : SpiderGL.WebGL.Texture.DEFAULT_WRAP_S,
		wrapT                      : SpiderGL.WebGL.Texture.DEFAULT_WRAP_T,
		flipYPolicy                : SpiderGL.WebGL.Context.DEFAULT_UNPACK_FLIP_Y,
		premultiplyAlphaPolicy     : SpiderGL.WebGL.Context.DEFAULT_UNPACK_PREMULTIPLY_ALPHA,
		colorspaceConversionPolicy : SpiderGL.WebGL.Context.DEFAULT_UNPACK_COLORSPACE_CONVERSION,
		autoMipmap                 : SpiderGL.WebGL.Texture.DEFAULT_AUTO_GENERATE_MIPMAP,
		format                     : gl.NONE,
		width                      : 0,
		height                     : 0
	}, options);

	SpiderGL.WebGL.ObjectGL.call(this, gl, target, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;

	var gl  = this._gl;
	var cb  = this._cb;
	var dsa = this._dsa;

	var t = this._t;
	var h = this._h;

	if (!h) {
		h = gl.createTexture();
		this._h = h;
	}

	cb.pushTexture(t);
	gl.bindTexture(t, h);
	this._magFilter = gl.getTexParameter(t, gl.TEXTURE_MAG_FILTER);
	this._minFilter = gl.getTexParameter(t, gl.TEXTURE_MIN_FILTER);
	this._wrapS     = gl.getTexParameter(t, gl.TEXTURE_WRAP_S);
	this._wrapT     = gl.getTexParameter(t, gl.TEXTURE_WRAP_T);
	cb.popTexture(t);
	h._spidergl = this;

	this._format               = options.format;
	this._width                = options.width;
	this._height               = options.height;
	this._flipY                = options.flipYPolicy;
	this._premultiplyAlpha     = options.premultiplyAlphaPolicy;
	this._colorspaceConversion = options.colorspaceConversionPolicy;
	this._autoMipmap           = options.autoMipmap;

	this._missingFaces = SpiderGL.WebGL.Texture._FACE_ALL_BITS;

	this.setSampler(options);
}

SpiderGL.WebGL.Texture.TARGET = WebGLRenderingContext.NONE;

/**
 * Default texture border when calling setImage
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.WebGL.Texture.DEFAULT_BORDER = 0;

/**
 * Default texture input data format when calling setImage or setSubImage.
 *
 * @type number
 *
 * @default WebGLRenderingContext.RGBA
 */
SpiderGL.WebGL.Texture.DEFAULT_FORMAT = WebGLRenderingContext.RGBA;

/**
 * Default value for SpiderGL.WebGL.Texture#autoMipmap
 *
 * @type bool
 *
 * @default false
 */
SpiderGL.WebGL.Texture.DEFAULT_AUTO_GENERATE_MIPMAP = false;

/**
 * Default texture internal format when calling setImage.
 *
 * @type number
 *
 * @default WebGLRenderingContext.RGBA
 */
SpiderGL.WebGL.Texture.DEFAULT_INTERNAL_FORMAT = WebGLRenderingContext.RGBA;

/**
 * Default texture level when calling setImage.
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.WebGL.Texture.DEFAULT_LEVEL = 0;

/**
 * Default texture magnification filter.
 *
 * @type number
 *
 * @default WebGLRenderingContext.LINEAR
 */
SpiderGL.WebGL.Texture.DEFAULT_MAG_FILTER = WebGLRenderingContext.LINEAR;

/**
 * Default texture minification filter.
 *
 * @type number
 *
 * @default WebGLRenderingContext.LINEAR
 */
SpiderGL.WebGL.Texture.DEFAULT_MIN_FILTER = WebGLRenderingContext.LINEAR;

/**
 * Default texture input data type when calling setImage or setSubImage.
 *
 * @type number
 *
 * @default WebGLRenderingContext.UNSIGNED_BYTE
 */
SpiderGL.WebGL.Texture.DEFAULT_TYPE = WebGLRenderingContext.UNSIGNED_BYTE;

/**
 * Default texture wrap mode in horizontal direction.
 *
 * @type number
 *
 * @default WebGLRenderingContext.REPEAT
 */
SpiderGL.WebGL.Texture.DEFAULT_WRAP_S = WebGLRenderingContext.REPEAT;

/**
 * Default texture wrap mode in vertical direction.
 *
 * @type number
 *
 * @default WebGLRenderingContext.REPEAT
 */
SpiderGL.WebGL.Texture.DEFAULT_WRAP_T = WebGLRenderingContext.REPEAT;

/**
 * Default texture sub-image x offset when calling setSubImage.
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.WebGL.Texture.DEFAULT_X_OFFSET = 0;

/**
 * Default texture sub-image y offset when calling setSubImage.
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.WebGL.Texture.DEFAULT_Y_OFFSET = 0;

/**
 * Default value for pixel unpack parameter WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL when calling setImage or setSubImage.
 *
 * @default true
 *
 * @see SpiderGL.WebGL.Texture.DEFAULT_UNPACK_PREMULTIPLY_ALPHA
 * @see SpiderGL.WebGL.Texture.DEFAULT_UNPACK_COLORSPACE_CONVERSION
 */
SpiderGL.WebGL.Texture.DEFAULT_UNPACK_FLIP_Y = true;

/**
 * Default value for pixel unpack parameter WebGLRenderingContext.UNPACK_PREMULTIPLY_ALPHA_WEBGL when calling setImage or setSubImage.
 *
 * @default true
 *
 * @see SpiderGL.WebGL.Texture.DEFAULT_UNPACK_FLIP_Y
 * @see SpiderGL.WebGL.Texture.DEFAULT_UNPACK_COLORSPACE_CONVERSION
 */
SpiderGL.WebGL.Texture.DEFAULT_UNPACK_PREMULTIPLY_ALPHA = false;

/**
 * Default value for pixel unpack parameter WebGLRenderingContext.UNPACK_COLORSPACE_CONVERSION_WEBGL when calling setImage or setSubImage.
 *
 * @default WebGLRenderingContext.NONE
 *
 * @see SpiderGL.WebGL.Texture.DEFAULT_UNPACK_FLIP_Y
 * @see SpiderGL.WebGL.Texture.DEFAULT_UNPACK_PREMULTIPLY_ALPHA
 */
SpiderGL.WebGL.Texture.DEFAULT_UNPACK_COLORSPACE_CONVERSION = WebGLRenderingContext.NONE;

SpiderGL.WebGL.Texture.unbind = function (gl) { };

SpiderGL.WebGL.Texture._FACE_POSITIVE_X_BIT = (1 << 0);
SpiderGL.WebGL.Texture._FACE_NEGATIVE_X_BIT = (1 << 1);
SpiderGL.WebGL.Texture._FACE_POSITIVE_Y_BIT = (1 << 2);
SpiderGL.WebGL.Texture._FACE_NEGATIVE_Y_BIT = (1 << 3);
SpiderGL.WebGL.Texture._FACE_POSITIVE_Z_BIT = (1 << 4);
SpiderGL.WebGL.Texture._FACE_NEGATIVE_Z_BIT = (1 << 5);
SpiderGL.WebGL.Texture._FACE_ALL_BITS       = (SpiderGL.WebGL.Texture._FACE_POSITIVE_X_BIT | SpiderGL.WebGL.Texture._FACE_NEGATIVE_X_BIT | SpiderGL.WebGL.Texture._FACE_POSITIVE_Y_BIT | SpiderGL.WebGL.Texture._FACE_NEGATIVE_Y_BIT | SpiderGL.WebGL.Texture._FACE_POSITIVE_Z_BIT | SpiderGL.WebGL.Texture._FACE_NEGATIVE_Z_BIT);

SpiderGL.WebGL.Texture._faceBits = { };
SpiderGL.WebGL.Texture._faceBits[WebGLRenderingContext.TEXTURE_2D                 ] = SpiderGL.WebGL.Texture._FACE_ALL_BITS;
SpiderGL.WebGL.Texture._faceBits[WebGLRenderingContext.TEXTURE_CUBE_MAP           ] = SpiderGL.WebGL.Texture._FACE_ALL_BITS;
SpiderGL.WebGL.Texture._faceBits[WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X] = SpiderGL.WebGL.Texture._FACE_POSITIVE_X_BIT;
SpiderGL.WebGL.Texture._faceBits[WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_X] = SpiderGL.WebGL.Texture._FACE_NEGATIVE_X_BIT;
SpiderGL.WebGL.Texture._faceBits[WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Y] = SpiderGL.WebGL.Texture._FACE_POSITIVE_Y_BIT;
SpiderGL.WebGL.Texture._faceBits[WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Y] = SpiderGL.WebGL.Texture._FACE_NEGATIVE_Y_BIT;
SpiderGL.WebGL.Texture._faceBits[WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Z] = SpiderGL.WebGL.Texture._FACE_POSITIVE_Z_BIT;
SpiderGL.WebGL.Texture._faceBits[WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Z] = SpiderGL.WebGL.Texture._FACE_NEGATIVE_Z_BIT;

SpiderGL.WebGL.Texture.prototype = {
	_gl_deleteTexture : function (texture) {
		this._h = null;
	},

	_gl_isTexture : function (texture) {
	},

	_gl_bindTexture : function (target, texture) {
	},

	_gl_getTexParameter : function (target, pname) {
	},

	_gl_copyTexImage2D : function (target, level, internalformat, x, y, width, height, border) {
		if (level == 0) {
			this._format = internalformat;
			this._width  = width;
			this._height = height;
		}
	},

	_gl_copyTexSubImage2D : function (target, level, xoffset, yoffset, x, y, width, height, border) {
	},

	_gl_generateMipmap : function (target) {
	},

	_gl_texImage2D : function (target) {
		var n = arguments.length;
		if (n === 6) {
			if (arguments[1] === 0) {
				this._format = arguments[2];
				this._width  = arguments[5].width;
				this._height = arguments[5].height;
			}
		}
		else if (n === 9) {
			if (arguments[1] === 0) {
				this._format = arguments[2];
				this._width  = arguments[3];
				this._height = arguments[4];
			}
		}
	},

	_gl_texParameterf : function (target, pname, param) {
		this._setTexParameter(pname, param);
	},

	_gl_texParameteri : function (target, pname, param) {
		this._setTexParameter(pname, param);
	},

	_gl_texSubImage2D : function (target) {
	},

	_setTexParameter : function (pname, param) {
		var gl = this._gl;

		switch (pname) {
			case gl.TEXTURE_MAG_FILTER : this._magFilter = param; break;
			case gl.TEXTURE_MIN_FILTER : this._minFilter = param; break;
			case gl.TEXTURE_WRAP_S     : this._wrapS     = param; break;
			case gl.TEXTURE_WRAP_T     : this._wrapT     = param; break;
			default : break;
		}
	},

	_setImageData : function (fullImage, target, options) {
		options = SpiderGL.Utility.getDefaultObject({
			internalFormat       : SpiderGL.WebGL.Texture.DEFAULT_INTERNAL_FORMAT,
			border               : SpiderGL.WebGL.Texture.DEFAULT_BORDER,
			xoffset              : SpiderGL.WebGL.Texture.DEFAULT_X_OFFSET,
			yoffset              : SpiderGL.WebGL.Texture.DEFAULT_Y_OFFSET,
			level                : SpiderGL.WebGL.Texture.DEFAULT_LEVEL,
			format               : SpiderGL.WebGL.Texture.DEFAULT_FORMAT,
			type                 : SpiderGL.WebGL.Texture.DEFAULT_TYPE,
			width                : 0,
			height               : 0,
			generateMipmap       : this._autoMipmap,
			flipY                : this._flipY,
			premultiplyAlpha     : this._premultiplyAlpha,
			colorspaceConversion : this._colorspaceConversion,
			data                 : null,
			url                  : null,
			onCancel             : null,
			onError              : null,
			onProgress           : null,
			onSuccess            : null
		}, options);

		var isURL     = !!options.url;
		var isData    = false;
		if (!isURL) { isData = (!options.data || SpiderGL.Type.isTypedArray(options.data)); /* (!options.data || SpiderGL.Type.instanceOf(options.data, ArrayBufferView)) */ }
		var isElement = false;
		if (!isURL && !isData) {
			// [WORKAROUND]
			// Firefox does not define ImageData
			// /* correct */ isElement = (SpiderGL.Type.instanceOf(data, ImageData) || SpiderGL.Type.instanceOf(data, HTMLImageElement) || SpiderGL.Type.instanceOf(data, HTMLCanvasElement) || SpiderGL.Type.instanceOf(data, HTMLVideoElement));
			isElement = (SpiderGL.Type.instanceOf(options.data, HTMLImageElement) || SpiderGL.Type.instanceOf(options.data, HTMLCanvasElement) || SpiderGL.Type.instanceOf(options.data, HTMLVideoElement));
			if (!isElement) {
				if (typeof ImageData != "undefined") {
					isElement = SpiderGL.Type.instanceOf(options.data, ImageData);
				}
			}
		}

		var gl  = this._gl;
		var cb  = this._cb;
		var dsa = this._dsa;

		var t = target;
		var h = this._h;

		var userFlipY                = -1;
		var flipY                    = -1;
		var userPremultiplyAlpha     = -1;
		var premultiplyAlpha         = -1;
		var userColorspaceConversion = -1;
		var colorspaceConversion     = -1;

		if (isData || isElement) {
			userFlipY = options.flipY;
			if (userFlipY != SpiderGL.Core.DONT_CARE) {
				flipY = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
				if (userFlipY == flipY) { flipY = -1; }
				else { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, userFlipY); }
			}

			userPremultiplyAlpha = options.premultiplyAlpha;
			if (userPremultiplyAlpha != SpiderGL.Core.DONT_CARE) {
				premultiplyAlpha = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
				if (userPremultiplyAlpha == premultiplyAlpha) { premultiplyAlpha = -1; }
				else { gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, userPremultiplyAlpha); }
			}

			userColorspaceConversion = options.colorspaceConversion;
			if (userColorspaceConversion != SpiderGL.Core.DONT_CARE) {
				colorspaceConversion = gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL);
				if (userColorspaceConversion == colorspaceConversion) { colorspaceConversion = -1; }
				else { gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, userColorspaceConversion); }
			}
		}

		var imageUpdated = false;

		if (isURL) {
			var opts = {
				internalFormat       : options.internalFormat,
				border               : options.border,
				xoffset              : options.xoffset,
				yoffset              : options.yoffset,
				level                : options.level,
				format               : options.format,
				type                 : options.type,
				generateMipmap       : options.generateMipmap,
				flipY                : options.flipY,
				premultiplyAlpha     : options.premultiplyAlpha,
				colorspaceConversion : options.colorspaceConversion,
				data                 : null
			};

			var that = this;
			var onSuccess = options.onSuccess;

			var req = new SpiderGL.IO.ImageRequest(options.url, {
				onCancel   : options.onCancel,
				onError    : options.onError,
				onProgress : options.onProgress,
				onSuccess  : function () {
					opts.data = req.image;
					if (fullImage) {
						that._setImage(target, opts);
					}
					else {
						that._setSubImage(target, opts);
					}
					if (onSuccess) { onSuccess(); }
				},
				send : true
			});

			return true;
		}
		else if (isData) {
			if ((options.width <= 0) || (options.height <= 0)) { return false; }
			if (fullImage) {
				dsa.texImage2D(h, t, options.level, options.internalFormat, options.width, options.height, options.border, options.format, options.type, options.data);
				imageUpdated = true;
			}
			else {
				dsa.texSubImage2D(h, t, options.level, options.xoffset, options.yoffset, options.width, options.height, options.format, options.type, options.data);
			}
		}
		else if (isElement) {
			if (fullImage) {
				dsa.texImage2D(h, t, options.level, options.internalFormat, options.format, options.type, options.data);
				imageUpdated = true;
			}
			else {
				dsa.texSubImage2D(h, t, options.level, options.xoffset, options.yoffset, options.format, options.type, options.data);
			}
		}
		else {
			return false;
		}

		if (imageUpdated) {
			this._missingFaces &= ~(SpiderGL.WebGL.Texture._faceBits[t]);
		}

		if (isData || isElement) {
			if (flipY                != -1) { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,                flipY);                }
			if (premultiplyAlpha     != -1) { gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,     premultiplyAlpha);     }
			if (colorspaceConversion != -1) { gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, colorspaceConversion); }
		}

		if (options.generateMipmap) {
			this.generateMipmap();
		}

		return true;
	},

	_setImage : function (target, options) {
		return this._setImageData(true, target, options);
	},

	_setSubImage : function (target, options) {
		return this._setImageData(false, target, options);
	},

	/*
	get isEmpty () { return ((this._width <= 0) || (this._height <= 0)); },
	*/

	/**
	 * Tests if the texture is ready to use.
	 * A texture is considered ready if all its associated images (one for 2D textures, six for cube maps) have width and height greater than zero.
	 *
	 * @type bool
	 *
	 * @readonly
	 */
	get isReady() {
		return ((this._missingFaces == 0) && (this._width > 0) && (this._height > 0));
	},

	/**
	 * Gets/Sets the flip Y policy.
	 * It specifies the image data vertical flipping policy when unpacking pixel data in setData or setSubData.
	 * If set to true, the WebGL pixel unpack parameter WebGLRenderingContext.UNPACK_FLIP_Y will be set to true
	 * If set to false, the WebGL pixel unpack parameter WebGLRenderingContext.UNPACK_FLIP_Y will be set to false 
	 * In either case, the unpack parameter will be restored.
	 * If set to SpiderGL.Core.DONT_CARE, the current WebGLRenderingContext setting will be used (i.e. nothing will be changed).
	 *
	 * @type bool
	 *
	 * @default SpiderGL.WebGL.Context.DEFAULT_UNPACK_FLIP_Y
	 */
	get flipYPolicy() {
		return this._flipY;
	},

	set flipYPolicy(x) {
		this._flipY = SpiderGL.Utility.getDefaultValue(x, SpiderGL.WebGL.Context.DEFAULT_UNPACK_FLIP_Y);
	},

	/**
	 * Gets/Sets the premultiply alpha policy.
	 * It specifies the image data premultiply alpha policy when unpacking pixel data in setData or setSubData.
	 * If set to true, the WebGL pixel unpack parameter WebGLRenderingContext.UNPACK_PREMULTIPLY_ALPHA will be set to true
	 * If set to false, the WebGL pixel unpack parameter WebGLRenderingContext.UNPACK_PREMULTIPLY_ALPHA will be set to false 
	 * In either case, the unpack parameter will be restored after image data has been set
	 * If set to SpiderGL.Core.DONT_CARE, the current WebGLRenderingContext setting will be used (i.e. nothing will be changed).
	 *
	 * @type bool
	 *
	 * @default SpiderGL.WebGL.Context.DEFAULT_UNPACK_PREMULTIPLY_ALPHA
	 */
	get premultuplyAlphaPolicy() {
		return this._premultuplyAlpha;
	},

	set premultuplyAlphaPolicy(x) {
		this._premultuplyAlpha = SpiderGL.Utility.getDefaultValue(x, SpiderGL.WebGL.Context.DEFAULT_UNPACK_PREMULTIPLY_ALPHA);
	},

	/**
	 * Gets/Sets the colorspace conversionpolicy.
	 * It specifies the image data colorpsce conversion policy when unpacking pixel data in setData or setSubData.
	 * If set to SpiderGL.Core.DONT_CARE, the current WebGLRenderingContext setting will be used (i.e. nothing will be changed).
	 * Otherwise, the specified value will be used and then restored after image data has been set.
	 *
	 * @type number
	 *
	 * @default SpiderGL.WebGL.Context.DEFAULT_UNPACK_COLORSPACE_CONVERSION
	 */
	get colorspaceConversionPolicy() {
		return this._colorspaceConversion;
	},

	set colorspaceConversionPolicy(x) {
		this._colorspaceConversion = SpiderGL.Utility.getDefaultValue(x, SpiderGL.WebGL.Context.DEFAULT_UNPACK_COLORSPACE_CONVERSION);
	},

	/**
	 * Gets/Sets the automatic mipmap generation.
	 *
	 * @type bool
	 *
	 * @default SpiderGL.WebGL.Texture.DEFAULT_AUTO_GENERATE_MIPMAP
	 */
	get autoMipmap() {
		return this._autoMipmap;
	},

	set autoMipmap(on) {
		this._autoMipmap = on;
	},

	/**
	 * Gets the texture image internal format.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get format() {
		return this._format;
	},

	/**
	 * Gets the texture image width.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get width() {
		return this._width;
	},

	/**
	 * Gets the texture image height.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get height() {
		return this._height;
	},

	/**
	 * Gets/Sets the texture magnification filter.
	 *
	 * @type number
	 */
	get magFilter() {
		return this._magFilter;
	},

	set magFilter(f) {
		f = SpiderGL.Utility.getDefaultValue(w, SpiderGL.WebGL.Texture.DEFAULT_MAG_FILTER);
		this._dsa.texParameteri(this._h, this._t, gl.TEXTURE_MAG_FILTER, f);
	},

	/**
	 * Gets/Sets the texture minification filter.
	 *
	 * @type number
	 */
	get minFilter() {
		return this._minFilter;
	},

	set minFilter (f) {
		f = SpiderGL.Utility.getDefaultValue(w, SpiderGL.WebGL.Texture.DEFAULT_MIN_FILTER);
		this._dsa.texParameteri(this._h, this._t, gl.TEXTURE_MIN_FILTER, f);
	},

	/**
	 * Gets/Sets the texture horizontal wrap mode.
	 *
	 * @type number
	 */
	get wrapS() {
		return this._wrapS;
	},

	set wrapS(w) {
		w = SpiderGL.Utility.getDefaultValue(w, SpiderGL.WebGL.Texture.DEFAULT_WRAP_S);
		this._dsa.texParameteri(this._h, this._t, gl.TEXTURE_WRAP_S, w);
	},

	/**
	 * Gets/Sets the texture vertical wrap mode.
	 *
	 * @type number
	 */
	get wrapT() {
		return this._wrapT;
	},

	set wrapT(w) {
		w = SpiderGL.Utility.getDefaultValue(w, SpiderGL.WebGL.Texture.DEFAULT_WRAP_T);
		this._dsa.texParameteri(this._h, this._t, gl.TEXTURE_WRAP_T, w);
	},

	/**
	 * Sets the texture sampling (filtering and addressing) mode.
	 * It is a utility function to specify the addressing and filtering parameters at once.
	 * Only the specified properties will be changed.
	 * To restore the default value, specify the property with value SpiderGL.Core.DEFAULT.
	 *
	 * @param {object} sampler The sampling options.
	 * @param {number} [sampler.magFilter] Texture magnification filter (see {@link SpiderGL.WebGL.Texture#magFilter}).
	 * @param {number} [sampler.minFilter] Texture minnification filter (see {@link SpiderGL.WebGL.Texture#minFilter}).
	 * @param {number} [sampler.wrapS] Texture horizontal wrap mode (see {@link SpiderGL.WebGL.Texture#wrapS}).
	 * @param {number} [sampler.wrapT] Texture vertical wrap mode (see {@link SpiderGL.WebGL.Texture#wrapT}).
	 */
	setSampler : function (sampler) {
		if (!sampler) return false;

		var gl  = this._gl;
		var cb  = this._cb;
		var dsa = this._dsa;

		var t = this._t;
		var h = this._h;

		cb.pushTexture(t);
		gl.bindTexture(t, h);

		var p = 0;

		if ("magFilter" in sampler) {
			p = SpiderGL.Utility.getDefaultValue(sampler.magFilter, SpiderGL.WebGL.Texture.DEFAULT_MAG_FILTER);
			gl.texParameteri(t, gl.TEXTURE_MAG_FILTER, p);
		}

		if ("minFilter" in sampler) {
			p = SpiderGL.Utility.getDefaultValue(sampler.minFilter, SpiderGL.WebGL.Texture.DEFAULT_MIN_FILTER);
			gl.texParameteri(t, gl.TEXTURE_MIN_FILTER, p);
		}

		if ("wrapS" in sampler) {
			p = SpiderGL.Utility.getDefaultValue(sampler.wrapS, SpiderGL.WebGL.Texture.DEFAULT_WRAP_S);
			gl.texParameteri(t, gl.TEXTURE_WRAP_S, p);
		}

		if ("wrapT" in sampler) {
			p = SpiderGL.Utility.getDefaultValue(sampler.wrapT, SpiderGL.WebGL.Texture.DEFAULT_WRAP_T);
			gl.texParameteri(t, gl.TEXTURE_WRAP_T, p);
		}

		cb.popTexture(t);

		return true;
	},

	/**
	 * Gets the texture sampling (filtering and addressing) mode.
	 *
	 * @returns {object} The sampling options. The returned object will have the following properties: magFilter, minFilter, wrapS, wrapT.
	 */
	getSampler : function () {
		return {
			magFilter : this._magFilter,
			minFilter : this._minFilter,
			wrapS     : this._wrapS,
			wrapT     : this._wrapT
		};
	},

	/**
	 * Generates the mipmap pyramid.
	 */
	generateMipmap : function () {
		if (this._missingFaces != 0) return;
		this._dsa.generateMipmap(this._h, this._t);
	},

	/**
	 * Destroys the WebGLTexture.
	 * After destruction, the handle is set to null and this object should not be used anymore.
	 *
	 * @see SpiderGL.WebGL.ObjectGL#destroy
	 */
	destroy : function () {
		this._gl.deleteTexture(this._h);
	},

	/**
	 * Binds the texture to the appropriate target for SpiderGL.WebGL.Texture2D and SpiderGL.WebGL.TextureCubeMap.
	 *
	 * @param {number} unit The unit (zero-based index) to which bind the texture. If not specified, the current texture unit is used.
	 *
	 * @see unbind
	 */
	bind : function (unit) {
		var gl  = this._gl;
		var cb  = this._cb;
		var dsa = this._dsa;
		if (typeof unit == "undefined") {
			gl.bindTexture(this._t, this._h);
		}
		else {
			dsa.bindTexture(gl.TEXTURE0 + unit, this._t, this._h);
		}
	},

	/**
	 * Binds "null" to the appropriate texture target for SpiderGL.WebGL.Texture2D and SpiderGL.WebGL.TextureCubeMap.
	 * This method is provided only for simmetry with {@link bind} and is not relative to the object state.
	 *
	 * @param {number} unit The unit (zero-based index) to which bind the null texture. If not specified, the current texture unit is used.
	 *
	 * @see bind
	 */
	unbind : function (unit) {
		var gl  = this._gl;
		var cb  = this._cb;
		var dsa = this._dsa;
		if (typeof unit == "undefined") {
			gl.bindTexture(this._t, null);
		}
		else {
			dsa.bindTexture(gl.TEXTURE0 + unit, this._t, null);
		}
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.Texture, SpiderGL.WebGL.ObjectGL);

/**
 * Creates a SpiderGL.WebGL.Texture2D.
 *
 * SpiderGL.WebGL.Texture2D is a wrapper for 2D WebGLTexture objects.
 *
 * @class The SpiderGL.WebGL.Texture2D is a wrapper for 2D WebGLTexture objects
 *
 * @augments SpiderGL.WebGL.Texture
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {object} [options] Optional parameters (see SpiderGL.WebGL.Texture constructor).
 *
 * @see SpiderGL.WebGL.Texture
 * @see SpiderGL.WebGL.TextureCubeMap
 * @see SpiderGL.WebGL.Framebuffer
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.Texture2D = function (gl, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }
	SpiderGL.WebGL.Texture.call(this, gl, SpiderGL.WebGL.Texture2D.TARGET, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;

	options = options || { };
	if (SpiderGL.Type.instanceOf(options, WebGLTexture)) {
		options = { handle : options };
	}
	else if (SpiderGL.Type.isString(options)) {
		options = { url : options };
	}

	if (("url" in options) || ("data" in options) || (("width" in options) && ("height" in options))) { this.setImage(options); }
}

SpiderGL.WebGL.Texture2D.TARGET = WebGLRenderingContext.TEXTURE_2D;

SpiderGL.WebGL.Texture2D.unbind = function (gl, unit) {
	var cb  = gl.getExtension("SGL_current_binding");
	var dsa = gl.getExtension("SGL_direct_state_access");
	if (typeof unit == "undefined") {
		gl.bindTexture(SpiderGL.WebGL.Texture2D.TARGET, null);
	}
	else {
		dsa.bindTexture(gl.TEXTURE0 + unit, SpiderGL.WebGL.Texture2D.TARGET, null);
	}
};

SpiderGL.WebGL.Texture2D.prototype = {
	/**
	 * Sets the texture image.
	 *
	 * @param {object} options The image data and type parameters (see SpiderGL.WebGL.Texture constructor).
	 * @param {ArrayBuffer|ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} [options.data] The texture image pixel data.
	 * @param {number} [options.internalFormat=SpiderGL.WebGL.Texture.DEFAULT_INTERNAL_FORMAT] The texture internal format.
	 * @param {number} [options.level=SpiderGL.WebGL.Texture.DEFAULT_LEVEL] The texture image mip level.
	 * @param {number} [options.width] If data is null or a typed array, specifies the texture image width. If handle is provided, the width parameter will supply the width information, not querable to the WebGLRenderingContext.
	 * @param {number} [options.height] If data is null or a typed array, specifies the texture image height. If handle is provided, the width parameter will supply the height information, not querable to the WebGLRenderingContext.
	 * @param {number} [options.border=SpiderGL.WebGL.Texture.DEFAULT_BORDER] Texture border.
	 * @param {number} [options.format=SpiderGL.WebGL.Texture.DEFAULT_FORMAT] The format parameter used for WebGLRenderingContext.texImage2D.
	 * @param {number} [options.type=SpiderGL.WebGL.Texture.DEFAULT_TYPE] The type parameter used for WebGLRenderingContext.texImage2D.
	 * @param {bool} [options.generateMipmap] If specified, overrides autoMipmap.
	 * @param {bool} [options.flipY] If specified, overrides flipYPolicy.
	 * @param {bool} [options.premultiplyAlpha] If specified, overrides premultiplyAlphaPolicy.
	 * @param {number} [options.colorspaceConversion] If specified, overrides colorspaceConversionPolicy.
	 * @param {function} [options.onAbort] If url is specified, this function will be called if image data loading is aborted.
	 * @param {function} [options.onError] If url is specified, this function will be called if an error occurs when loading image data.
	 * @param {function} [options.onLoad] If url is specified, this function will be called when image data has been loaded.
	 *
	 * @see setSubImage
	 * @see SpiderGL.WebGL.Texture
	 */
	setImage : function (options) {
		return this._setImage(this._t, options);
	},

	/**
	 * Sets a region of the texture image.
	 *
	 * @param {object} options The image data and type parameters (see SpiderGL.WebGL.Texture constructor).
	 * @param {ArrayBuffer|ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} [options.data] The texture sub-image pixel data.
	 * @param {number} [options.xoffset=SpiderGL.WebGL.Texture.DEFAULT_X_OFFSET] The sub-image x offset.
	 * @param {number} [options.yoffset=SpiderGL.WebGL.Texture.DEFAULT_Y_OFFSET] The sub-image y offset.
	 * @param {number} [options.width] If data is null or a typed array, specifies the texture image width. If handle is provided, the width parameter will supply the width information, not querable to the WebGLRenderingContext.
	 * @param {number} [options.height] If data is null or a typed array, specifies the texture image height. If handle is provided, the width parameter will supply the height information, not querable to the WebGLRenderingContext.
	 * @param {number} [options.border=SpiderGL.WebGL.Texture.DEFAULT_BORDER] Texture border.
	 * @param {number} [options.format=SpiderGL.WebGL.Texture.DEFAULT_FORMAT] The format parameter used for WebGLRenderingContext.texSubImage2D.
	 * @param {number} [options.type=SpiderGL.WebGL.Texture.DEFAULT_TYPE] The type parameter used for WebGLRenderingContext.texSubImage2D.
	 * @param {bool} [options.generateMipmap] If specified, overrides autoMipmap.
	 * @param {bool} [options.flipY] If specified, overrides flipYPolicy.
	 * @param {bool} [options.premultiplyAlpha] If specified, overrides premultiplyAlphaPolicy.
	 * @param {number} [options.colorspaceConversion] If specified, overrides colorspaceConversionPolicy.
	 * @param {function} [options.onAbort] If url is specified, this function will be called if image data loading is aborted.
	 * @param {function} [options.onError] If url is specified, this function will be called if an error occurs when loading image data.
	 * @param {function} [options.onLoad] If url is specified, this function will be called when image data has been loaded.
	 *
	 * @see setImage
	 * @see SpiderGL.WebGL.Texture
	 */
	setSubImage : function (options) {
		return this._setSubImage(this._t, options);
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.Texture2D, SpiderGL.WebGL.Texture);

/**
 * Creates a SpiderGL.WebGL.TextureCubeMap.
 *
 * SpiderGL.WebGL.TextureCubeMap is a wrapper for cube map WebGLTexture objects.
 *
 * @class The SpiderGL.WebGL.TextureCubeMap is a wrapper for cube map WebGLTexture objects
 *
 * @augments SpiderGL.WebGL.Texture
 *
 * @param {WebGLRenderingContext} gl A WebGLRenderingContext hijacked with {@link SpiderGL.WebGL.Context.hijack}.
 * @param {object} [options] Optional parameters (see SpiderGL.WebGL.Texture constructor). This constructor accepts only the url options as an array of six strings, or internalFormat, width, height, format and type, ignoring the data property.
 *
 * @see SpiderGL.WebGL.Texture
 * @see SpiderGL.WebGL.Texture2D
 * @see SpiderGL.WebGL.Framebuffer
 * @see SpiderGL.WebGL.ObjectGL
 */
SpiderGL.WebGL.TextureCubeMap = function (gl, options) {
	if (!SpiderGL.WebGL.Context.isHijacked(gl)) { return null; }
	SpiderGL.WebGL.Texture.call(this, gl, SpiderGL.WebGL.TextureCubeMap.TARGET, options);
	if (!!this._h && !!this._h._spidergl && (this._h._spidergl != this)) return this._h._spidergl;

	options = options || { };
	if (SpiderGL.Type.instanceOf(options, WebGLTexture)) {
		options = { handle : options };
	}
	else if (SpiderGL.Type.isString(options)) {
		options = { url : options };
	}

	var faceTargets = SpiderGL.WebGL.TextureCubeMap._faceTargets;

	if (options.url) {
		var urls = options.url;
		for (var i=0; i<6; ++i) {
			options.url = urls[i];
			this.setImage(faceTargets[i], options);
		}
	}
	else if (options.data) {
		var datas = options.data;
		for (var i=0; i<6; ++i) {
			options.data = datas[i];
			this.setImage(faceTargets[i], options);
		}
	}
	else if ((options.width > 0) && (options.height > 0)) {
		for (var i=0; i<6; ++i) {
			this.setImage(faceTargets[i], options);
		}
	}
}

SpiderGL.WebGL.TextureCubeMap.TARGET = WebGLRenderingContext.TEXTURE_CUBE_MAP;

SpiderGL.WebGL.TextureCubeMap.unbind = function (gl, unit) {
	var cb  = gl.getExtension("SGL_current_binding");
	var dsa = gl.getExtension("SGL_direct_state_access");
	if (typeof unit == "undefined") {
		gl.bindTexture(SpiderGL.WebGL.TextureCubeMap.TARGET, null);
	}
	else {
		dsa.bindTexture(gl.TEXTURE0 + unit, SpiderGL.WebGL.TextureCubeMap.TARGET, null);
	}
};

SpiderGL.WebGL.TextureCubeMap._faceTargets = [
	WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X,
	WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_X,
	WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Y,
	WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Y,
	WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Z,
	WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Z
];

SpiderGL.WebGL.TextureCubeMap.prototype = {
	/**
	 * Sets the texture image for a cube face.
	 *
	 * @param {number} face The cube map face to set.
	 * @param {object} options The image data and type parameters (see SpiderGL.WebGL.Texture constructor).
	 * @param {ArrayBuffer|ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} [options.data] The texture image pixel data.
	 * @param {number} [options.internalFormat=SpiderGL.WebGL.Texture.DEFAULT_INTERNAL_FORMAT] The texture internal format.
	 * @param {number} [options.width] If data is null or a typed array, specifies the texture image width. If handle is provided, the width parameter will supply the width information, not querable to the WebGLRenderingContext.
	 * @param {number} [options.height] If data is null or a typed array, specifies the texture image height. If handle is provided, the width parameter will supply the height information, not querable to the WebGLRenderingContext.
	 * @param {number} [options.border=SpiderGL.WebGL.Texture.DEFAULT_BORDER] Texture border.
	 * @param {number} [options.format=SpiderGL.WebGL.Texture.DEFAULT_FORMAT] The format parameter used for WebGLRenderingContext.texImage2D.
	 * @param {number} [options.type=SpiderGL.WebGL.Texture.DEFAULT_TYPE] The type parameter used for WebGLRenderingContext.texImage2D.
	 * @param {bool} [options.generateMipmap] If specified, overrides autoMipmap.
	 * @param {bool} [options.flipY] If specified, overrides flipYPolicy.
	 * @param {bool} [options.premultiplyAlpha] If specified, overrides premultiplyAlphaPolicy.
	 * @param {number} [options.colorspaceConversion] If specified, overrides colorspaceConversionPolicy.
	 * @param {function} [options.onAbort] If url is specified, this function will be called if image data loading is aborted.
	 * @param {function} [options.onError] If url is specified, this function will be called if an error occurs when loading image data.
	 * @param {function} [options.onLoad] If url is specified, this function will be called when image data has been loaded.
	 *
	 * @see setSubImage
	 * @see SpiderGL.WebGL.Texture
	 */
	setImage : function (face, options) {
		/*
		var b = SpiderGL.WebGL.TextureCubeMap._faceBits[face];
		if (!b) return false;
		var r = this._setImage(face, options);
		if (r) { this._missingFaces &= ~b; }
		return r;
		*/
		return this._setImage(face, options);
	},

	/**
	 * Sets a region of the texture image for a cube face.
	 *
	 * @param {number} face The cube map face to set.
	 * @param {object} options The image data and type parameters (see SpiderGL.WebGL.Texture constructor).
	 * @param {ArrayBuffer|ArrayBufferView|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} [options.data] The texture sub-image pixel data.
	 * @param {number} [options.xoffset=SpiderGL.WebGL.Texture.DEFAULT_X_OFFSET] The sub-image x offset.
	 * @param {number} [options.yoffset=SpiderGL.WebGL.Texture.DEFAULT_Y_OFFSET] The sub-image y offset.
	 * @param {number} [options.width] If data is null or a typed array, specifies the texture image width. If handle is provided, the width parameter will supply the width information, not querable to the WebGLRenderingContext.
	 * @param {number} [options.height] If data is null or a typed array, specifies the texture image height. If handle is provided, the width parameter will supply the height information, not querable to the WebGLRenderingContext.
	 * @param {number} [options.border=SpiderGL.WebGL.Texture.DEFAULT_BORDER] Texture border.
	 * @param {number} [options.format=SpiderGL.WebGL.Texture.DEFAULT_FORMAT] The format parameter used for WebGLRenderingContext.texSubImage2D.
	 * @param {number} [options.type=SpiderGL.WebGL.Texture.DEFAULT_TYPE] The type parameter used for WebGLRenderingContext.texSubImage2D.
	 * @param {bool} [options.generateMipmap] If specified, overrides autoMipmap.
	 * @param {bool} [options.flipY] If specified, overrides flipYPolicy.
	 * @param {bool} [options.premultiplyAlpha] If specified, overrides premultiplyAlphaPolicy.
	 * @param {number} [options.colorspaceConversion] If specified, overrides colorspaceConversionPolicy.
	 * @param {function} [options.onAbort] If url is specified, this function will be called if image data loading is aborted.
	 * @param {function} [options.onError] If url is specified, this function will be called if an error occurs when loading image data.
	 * @param {function} [options.onLoad] If url is specified, this function will be called when image data has been loaded.
	 *
	 * @see setImage
	 * @see SpiderGL.WebGL.Texture
	 */
	setSubImage : function (face, options) {
		return this._setSubImage(face, options);
	}
};

SpiderGL.Type.extend(SpiderGL.WebGL.TextureCubeMap, SpiderGL.WebGL.Texture);

