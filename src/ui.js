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
 * @fileOverview UI
 */

/**
 * The SpiderGL.UserInterface namespace.
 *
 * @namespace The SpiderGL.UserInterface namespace.
 */
SpiderGL.UserInterface = { };

/**
 * Creates a SpiderGL.UserInterface.CanvasHandler.
 *
 * SpiderGL.UserInterface.CanvasHandler is an event handler used to implement an easy controller for WebGL canvas.
 * It should not be directly used. Use {@link SpiderGL.UserInterface.handleCanvas} or {@link SpiderGL.UserInterface.handleCanvasOnLoad} to install it to a listener object.
 *
 * @class The SpiderGL.UserInterface.CanvasHandler is an event handler used to implement an easy controller for WebGL canvas. It should not be directly used.
 *
 * @augments SpiderGL.Core.ObjectBase
 *
 * @param {WebGLRenderingcontext} gl The WebGLRenderingcontext to pass to the handler.
 * @param {object} handler The event handler to which events will be dispatched.
 * @param {object} [options] Optional parameters
 * @param {bool} [options.standardGLUnpack=SpiderGL.UserInterface.CanvasHandler.DEFAULT_STANDARD_GL_UNPACK] If true, sets the default OpenGL unpack behaviour.
 * @param {number} [options.animateRate=SpiderGL.UserInterface.CanvasHandler.DEFAULT_ANIMATE_RATE] Additional options.
 *
 * @see SpiderGL.UserInterface.handleCanvas
 * @see SpiderGL.UserInterface.handleCanvasOnLoad
 */
SpiderGL.UserInterface.CanvasHandler = function (gl, handler, options) {
	SpiderGL.Core.ObjectBase.call(this);

	options = options || { };

	var that = this;
	var canvas = gl.canvas;

	this._gl        = gl;
	this._canvas    = canvas;
	this._handler   = handler;

	this._ignoreKeyRepeat = SpiderGL.Utility.getDefaultValue(options.ignoreKeyRepeat, SpiderGL.UserInterface.CanvasHandler.DEFAULT_IGNORE_KEY_REPEAT);
	this._keysDown = { };

	this._mouseButtonsDown = [false, false, false];

	this._dragging     = [false, false, false];
	this._dragStartPos = [[0, 0], [0, 0], [0, 0]];
	this._dragEndPos   = [[0, 0], [0, 0], [0, 0]];
	this._dragDeltaPos = [[0, 0], [0, 0], [0, 0]];

	this._cursorPos      = [0, 0];
	this._cursorPrevPos  = [0, 0];
	this._cursorDeltaPos = [0, 0];

	this._drawEventPending      = false;
	this._drawEventHandler      = function () { that._onDraw(); };
	this._postDrawEventFunction = function () { that._postDrawEvent(); };

	this._animateTime         = Date.now();
	this._animatePrevTime     = this._animateTime;
	this._animateDeltaTime    = 0;
	this._animateRate         = 0;
	this._animateID           = null;
	this._animateEventHandler = function () { that._onAnimate(); };
	this._animateMS           = -1;
	this._animateWithTimeout  = false;
	this._fastAnimate         = false;

	this._fpsUpdateMS = 1000;
	this._fpsTime     = Date.now();
	this._fpsCount    = 0;
	this._fps         = 0;

	/** @private */
	var handleMessage = function (evt) {
		if (evt.source != window) return;
		if (evt.data == SpiderGL.UserInterface.CanvasHandler._FAST_ANIMATE_MESSAGE_NAME) {
			evt.stopPropagation();
			that._onAnimate();
		}
		else if (evt.data == SpiderGL.UserInterface.CanvasHandler._FAST_DRAW_MESSAGE_NAME) {
			evt.stopPropagation();
			that._onDraw();
		}
	};
	window.addEventListener("message", handleMessage, true);
 
	canvas.contentEditable = true;
	canvas.tabIndex = 0;

	canvas.addEventListener("unload",          function (e) { that._onTerminate       (e); }, false);
	canvas.addEventListener("keydown",         function (e) { that._onKeyDown         (e); }, false);
	canvas.addEventListener("keyup",           function (e) { that._onKeyUp           (e); }, false);
	canvas.addEventListener("keypress",        function (e) { that._onKeyPress        (e); }, false);
	canvas.addEventListener("mousedown",       function (e) { that._onMouseButtonDown (e); }, false);
	canvas.addEventListener("mouseup",         function (e) { that._onMouseButtonUp   (e); }, false);
	canvas.addEventListener("mousemove",       function (e) { that._onMouseMove       (e); }, false);
	canvas.addEventListener("mouseout",        function (e) { that._onMouseOut        (e); }, false);
	canvas.addEventListener("click",           function (e) { that._onClick           (e); }, false);
	canvas.addEventListener("dblclick",        function (e) { that._onDoubleClick     (e); }, false);
	canvas.addEventListener("resize",          function (e) { that._onResize          (e); }, false);
	canvas.addEventListener("DOMMouseScroll",  function (e) { that._onMouseWheel      (e); }, false);
	canvas.addEventListener("mousewheel",      function (e) { that._onMouseWheel      (e); }, false);
	canvas.addEventListener("blur",            function (e) { that._onBlur            (e); }, false);

	window.addEventListener("mouseup",         function (e) { that._onWindowMouseButtonUp (e); }, false);
	window.addEventListener("mousemove",       function (e) { that._onWindowMouseMove     (e); }, false);

	canvas.addEventListener("touchstart",      SpiderGL.UserInterface.CanvasHandler._touchHandler, true);
	canvas.addEventListener("touchend",        SpiderGL.UserInterface.CanvasHandler._touchHandler, true);
	canvas.addEventListener("touchmove",       SpiderGL.UserInterface.CanvasHandler._touchHandler, true);
	canvas.addEventListener("touchcancel",     SpiderGL.UserInterface.CanvasHandler._touchHandler, true);

	var standardGLUnpack = SpiderGL.Utility.getDefaultValue(options.standardGLUnpack, SpiderGL.UserInterface.CanvasHandler.DEFAULT_STANDARD_GL_UNPACK);
	if (standardGLUnpack) {
		SpiderGL.WebGL.Context.setStandardGLUnpack(gl);
	}

	this.animateRate = SpiderGL.Utility.getDefaultValue(options.animateRate, SpiderGL.UserInterface.CanvasHandler.DEFAULT_ANIMATE_RATE);
}

SpiderGL.UserInterface.CanvasHandler._FAST_DRAW_MESSAGE_NAME    = "spidergl-fast-draw-message";
SpiderGL.UserInterface.CanvasHandler._FAST_ANIMATE_MESSAGE_NAME = "spidergl-fast-animate-message";

/**
 * Default value for animate rate.
 *
 * @type number
 *
 * @default 0
 */
SpiderGL.UserInterface.CanvasHandler.DEFAULT_ANIMATE_RATE = 0;

/**
 * Default value for ignoring key repeats.
 *
 * @type bool
 *
 * @default true
 */
SpiderGL.UserInterface.CanvasHandler.DEFAULT_IGNORE_KEY_REPEAT = true;

/**
 * Default value for applying standard OpenGL pixel unpack parameters.
 *
 * @type bool
 *
 * @default true
 */
SpiderGL.UserInterface.CanvasHandler.DEFAULT_STANDARD_GL_UNPACK = true;

/**
 * Default name of the property to install in the handler object for accessing the canvas handler.
 *
 * @type string
 *
 * @default "ui"
 */
SpiderGL.UserInterface.CanvasHandler.DEFAULT_PROPERTY_NAME = "ui";

SpiderGL.UserInterface.CanvasHandler._touchHandler = function (event) {
	var touches = event.changedTouches,

	first = touches[0],
	type = "";

	switch(event.type)
	{
		case "touchstart": type = "mousedown"; break;
		case "touchmove":  type = "mousemove"; break;        
		case "touchend":   type = "mouseup";   break;
		default: return;
	}

	//initMouseEvent(type, canBubble, cancelable, view, clickCount, 
	//           screenX, screenY, clientX, clientY, ctrlKey, 
	//           altKey, shiftKey, metaKey, button, relatedTarget);

	var simulatedEvent = document.createEvent("MouseEvent");
	simulatedEvent.initMouseEvent(
		type, true, true, window, 1, 
		first.screenX, first.screenY, 
		first.clientX, first.clientY, false, 
		false, false, false, 0/*left*/, null
	);

	first.target.dispatchEvent(simulatedEvent);
	event.preventDefault();
};

SpiderGL.UserInterface.CanvasHandler.prototype = {
	_firstNotify : function () {
		this._onInitialize();
		if (this._animateRate > 0) {
			this._onAnimate();
		}
		this.postDrawEvent();
	},

	_dispatch : function () {
		var evt     = arguments[0];
		var handler = this._handler;
		var method  = handler[evt];
		if (!method) return;
		var args = Array.prototype.slice.call(arguments, 1);
		var r = method.apply(handler, args);
		//if (r === false) return;
		//this._postDrawEvent();
	},

	_postDrawEvent : function () {
		if (this._drawEventPending) return;
		this._drawEventPending = true;
		//setTimeout(this._drawEventHandler, 0);
		window.postMessage(SpiderGL.UserInterface.CanvasHandler._FAST_DRAW_MESSAGE_NAME, "*");
	},

	_getMouseClientPos : function(e) {
		var r = this._canvas.getBoundingClientRect();
		var w = this._canvas.width;
		var h = this._canvas.height;
		var x = e.clientX - r.left;
		var y = h - 1 - (e.clientY - r.top);
		var outside = ((x < 0) || (x >= w) || (y < 0) || (y >= h));
		return [x, y, outside];
	},

	/*
	_getTouchClientPos : function(e) {
		return this._getMouseClientPos(e);
	},
	*/

	_onInitialize : function () {
		this._dispatch("onInitialize");
	},

	_onTerminate : function () {
		this._dispatch("onTerminate");
	},

	_onBlur : function (e) {
		var gl = this._gl;
		var ks = this._keysDown;
		for (var c in ks) {
			if (ks[c]) {
				ks[c] = false;
				this._dispatch("onKeyUp", c, null);
			}
		}
	},

	_onKeyDown : function (e) {
		var c = e.keyCode || e.charCode;
		var s = String.fromCharCode(c);
		if (s.length > 0) {
			c = s.toUpperCase();
		}
		var wasDown = this._keysDown[c];
		this._keysDown[c] = true;
		if (!wasDown || !this._ignoreKeyRepeat) {
			this._dispatch("onKeyDown", c, e);
		}
	},

	_onKeyUp : function (e) {
		var c = e.keyCode || e.charCode;
		var s = String.fromCharCode(c);
		if (s.length > 0) {
			c = s.toUpperCase();
		}
		this._keysDown[c] = false;
		this._dispatch("onKeyUp", c, e);
	},

	_onKeyPress : function (e) {
		var c = e.keyCode || e.charCode;
		var s = String.fromCharCode(c);
		if (s.length > 0) {
			c = s;
		}
		this._dispatch("onKeyPress", c, e);
	},

	/*
	_onTouchStart : function (e) {
		e = e.changedTouches[0];
		this._canvas.focus();
		var xy  = this._getTouchClientPos(e);
		this._dispatch("onTouchStart", xy[0], xy[1], e);
		e.stopPropagation();
	},

	_onTouchEnd : function (e) {
		e = e.changedTouches[0];
		this._canvas.focus();
		var xy  = this._getTouchClientPos(e);
		this._dispatch("onTouchEnd", xy[0], xy[1], e);
		e.stopPropagation();
	},

	_onTouchMove : function (e) {
		e = e.changedTouches[0];
		this._canvas.focus();
		var xy  = this._getTouchClientPos(e);
		this._dispatch("onTouchMove", xy[0], xy[1], e);
		e.stopPropagation();
	},
	*/

	_onMouseButtonDown : function (e) {
		this._canvas.focus();
		var xy  = this._getMouseClientPos(e);
		var btn = e.button;
		this._mouseButtonsDown[btn] = true;
		this._dragStartPos[btn] = [xy[0], xy[1]];
		this._dispatch("onMouseButtonDown", btn, xy[0], xy[1], e);

		e.stopPropagation();
	},

	_onMouseButtonUp : function (e) {
		var xy = this._getMouseClientPos(e);
		var btn = e.button;
		this._mouseButtonsDown[btn] = false;
		this._dispatch("onMouseButtonUp", btn, xy[0], xy[1], e);

		if (this._dragging[btn]) {
			this._dragging[btn] = false;
			var sPos = this._dragStartPos[btn];
			var ePos = [xy[0], xy[1]];
			this._dragEndPos[btn] = ePos;
			this._dragDeltaPos[btn] = [ePos[0] - sPos[0], ePos[1] - sPos[1]];
			this._dispatch("onDragEnd", btn, ePos[0], ePos[1]);
		}

		e.stopPropagation();
	},

	_onWindowMouseButtonUp : function (e) {
		var xy = this._getMouseClientPos(e);
		var btn = e.button;
		if (!xy[2] || !this._mouseButtonsDown[btn]) return;

		this._mouseButtonsDown[btn] = false;
		this._dispatch("onMouseButtonUp", btn, xy[0], xy[1], e);

		if (this._dragging[btn]) {
			this._dragging[btn] = false;
			var sPos = this._dragStartPos[btn];
			var ePos = [xy[0], xy[1]];
			this._dragEndPos[btn] = ePos;
			this._dragDeltaPos[btn] = [ePos[0] - sPos[0], ePos[1] - sPos[1]];
			this._dispatch("onDragStart", btn, ePos[0], ePos[1]);
		}

		e.stopPropagation();
	},

	_onMouseMove : function (e) {
		var xy = this._getMouseClientPos(e);

		this._cursorPrevPos  = this._cursorPos;
		this._cursorPos      = xy;
		this._cursorDeltaPos = [this._cursorPos[0] - this._cursorPrevPos[0], this._cursorPos[1] - this._cursorPrevPos[1]];
		this._dispatch("onMouseMove", xy[0], xy[1], e);

		for (var i=0; i<3; ++i) {
			if (!this._mouseButtonsDown[i]) continue;
			var sPos = this._dragStartPos[i];
			var ePos = [xy[0], xy[1]];
			this._dragEndPos[i] = ePos;
			this._dragDeltaPos[i] = [ePos[0] - sPos[0], ePos[1] - sPos[1]];
			if (!this._dragging[i]) {
				this._dragging[i] = true;
				this._dispatch("onDragStart", i, sPos[0], sPos[1]);
			}
			this._dispatch("onDrag", i, ePos[0], ePos[1]);
		}

		e.stopPropagation();
	},

	_onWindowMouseMove : function (e) {
		var gl = this._gl;
		var xy = this._getMouseClientPos(e);

		if (!xy[2]) return;

		for (var i=0; i<3; ++i) {
			if (!this._dragging[i]) continue;
			var sPos = this._dragStartPos[i];
			var ePos = [xy[0], xy[1]];
			this._dragEndPos[i] = ePos;
			this._dragDeltaPos[i] = [ePos[0] - sPos[0], ePos[1] - sPos[1]];
			this._dispatch("onDrag", i, ePos[0], ePos[1]);
		}

		e.stopPropagation();
	},

	_onMouseWheel : function (e) {
		var xy = this._getMouseClientPos(e);
		var delta = 0;
		if (!e) {
			e = window.event;
		}
		if (e.wheelDelta) {
			delta = e.wheelDelta / 120;
			if (window.opera) {
				delta = -delta;
			}
		}
		else if (e.detail) {
			delta = -e.detail / 3;
		}
		if (delta) {
			this._dispatch("onMouseWheel", delta, xy[0], xy[1], e);
		}

		if (e.preventDefault) {
			e.preventDefault();
		}

		e.stopPropagation();
	},

	_onMouseOut: function(e) {
	},

	_onClick : function (e) {
		var xy = this._getMouseClientPos(e);
		this._dispatch("onClick", e.button, xy[0], xy[1], e);
	},

	_onDoubleClick : function (e) {
		var xy = this._getMouseClientPos(e);
		this._dispatch("onDoubleClick", e.button, xy[0], xy[1], e);
	},

	_onResize : function (e) {
		this._dispatch("onResize", this._canvas.width, this._canvas.height, e);
	},

	_onAnimate : function () {
		this._animatePrevTime  = this._animateTime;
		this._animateTime      = Date.now();
		this._animateDeltaTime = this._animateTime - this._animatePrevTime;
		this._dispatch("onAnimate", this._animateDeltaTime / 1000);
		if (this._animateMS >= 0) {
			if (this._animateWithTimeout) {
				setTimeout(this._animateEventHandler, this._animateMS);
			}
		}
		else if (this._fastAnimate) {
			window.postMessage(SpiderGL.UserInterface.CanvasHandler._FAST_ANIMATE_MESSAGE_NAME, "*");
		}
	},

	_onDraw : function () {
		this._drawEventPending = false;

		this._fpsCount++;

		var now   = Date.now();
		var fpsDT = now - this._fpsTime;
		if (fpsDT >= this._fpsUpdateMS) {
			this._fps      = SpiderGL.Math.floor(this._fpsCount * 1000 / fpsDT);
			this._fpsTime  = now;
			this._fpsCount = 0;
		}

		this._dispatch("onDraw");
	},

	/**
	 * Gets the canvas hijacked WebGLRenderingContext.
	 *
	 * @type WebGLRenderingContext
	 *
	 * @readonly
	 */
	get gl() {
		return this._gl;
	},

	/**
	 * Gets the associated canvas.
	 *
	 * @type HTMLCanvasElement
	 *
	 * @readonly
	 */
	get canvas() {
		return this._canvas;
	},

	/**
	 * Gets the width of the associated canvas.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get width() {
		return this._canvas.width;
	},

	/**
	 * Gets the height of the associated canvas.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get height() {
		return this._canvas.height;
	},

	/**
	 * Gets a function that, once called, sends a draw event, which once handled will call the onDraw method of the registered handler.
	 *
	 * @type function
	 *
	 * @readonly
	 */
	get postDrawEvent() {
		return this._postDrawEventFunction;
	},

	/**
	 * Gets the time, in seconds, of the current onAnimate event.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get animateTime() {
		return this._animateTime;
	},

	/**
	 * Gets the time, in seconds, of the last onAnimate event.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get animatePrevTime() {
		return this._animatePrevTime;
	},

	/**
	 * Gets the elapsed time, in milliseconds, between the last and the current onAnimate event.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get animateDeltaTime() {
		return this._animateDeltaTime;
	},

	/**
	 * Gets/Sets the frequency (calls per second) used to emit the onAnimate event.
	 * If zero, the onAnimate event will be disabled. If greater than zero, specifies how many times emit the event per second.
	 * If less than zero, the event will be emitted as fast as possible.
	 *
	 * @type number
	 *
	 * @default SpiderGL.UserInterface.CanvasHandler.DEFAULT_ANIMATE_RATE
	 */
	get animateRate() {
		return this._animateRate;
	},

	set animateRate(r) {
		r = SpiderGL.Utility.getDefaultValue(r, SpiderGL.UserInterface.CanvasHandler.DEFAULT_ANIMATE_RATE);
		if (this._animateRate === r) return;

		this._fastAnimate = false;
		this._animateMS   = -1;

		this._animateTime      = Date.now();
		this._animatePrevTime  = this._animateTime;
		this._animateDeltaTime = 0;

		if (this._animateID) {
			clearInterval(this._animateID);
			this._animateID = null;
		}

		if (r > 0) {
			this._animateMS = SpiderGL.Math.floor(1000 / r);
			if (this._animateWithTimeout) {
				setTimeout(this._animateEventHandler, this._animateMS);
			}
			else {
				this._animateID = setInterval(this._animateEventHandler, this._animateMS);
			}
		}
		else if (r < 0) {
			this._fastAnimate = true;
			window.postMessage(SpiderGL.UserInterface.CanvasHandler._FAST_ANIMATE_MESSAGE_NAME, "*");
		}
	},

	/**
	 * Gets the number of draw events occurred in the last second.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get framesPerSecond() {
		return this._fps;
	},

	/**
	 * Gets/Sets if the key repeat must be ignored.
	 *
	 * @type bool
	 * 
	 * @default SpiderGL.UserInterface.CanvasHandler.DEFAULT_IGNORE_KEY_REPEAT
	 */
	get ignoreKeyRepeat() {
		return this._ignoreKeyRepeat;
	},

	set ignoreKeyRepeat(on) {
		this._ignoreKeyRepeat = SpiderGL.Utility.getDefaultValue(on, SpiderGL.UserInterface.CanvasHandler.DEFAULT_IGNORE_KEY_REPEAT);
	},

	/**
	 * Tests if a key is pressed.
	 *
	 * @param {string|number} key The key to test.
	 *
	 * @returns {bool} True if the key is pressed, false otherwise.
	 */
	isKeyDown : function (key) {
		if (key.toUpperCase) {
			key = key.toUpperCase();
		}
		return this._keysDown[key];
	},

	/**
	 * Tests if a mouse button is pressed.
	 *
	 * @param {number} btn The button to test (0 = left, 1 = right, 2 = middle).
	 *
	 * @returns {bool} True if the mouse button is pressed, false otherwise.
	 */
	isMouseButtonDown : function (btn) {
		return this._mouseButtonsDown[btn];
	},

	/**
	 * Tests if a dragging (mouse move + mouse button down) operation is active.
	 *
	 * @param {number} btn The button to test (0 = left, 1 = right, 2 = middle).
	 *
	 * @returns {bool} True if the dragging operation is active with the specified mouse button, false otherwise.
	 */
	isDragging : function (btn) {
		return this._dragging[btn];
	},

	/**
	 * Gets the cursor x position when dragging has started.
	 *
	 * @param {number} btn The button to test (0 = left, 1 = right, 2 = middle).
	 *
	 * @returns {number} The cursor x position, relative to the canvas lower left corner, when the dragging has started.
	 */
	dragStartX : function (btn) {
		return this._dragStartPos[btn][0];
	},

	/**
	 * Gets the cursor y position when dragging has started.
	 *
	 * @param {number} btn The button to test (0 = left, 1 = right, 2 = middle).
	 *
	 * @returns {number} The cursor y position, relative to the canvas lower left corner, when the dragging has started.
	 */
	dragStartY : function (btn) {
		return this._dragStartPos[btn][1];
	},

	/**
	 * Gets the cursor x position when dragging has finished.
	 *
	 * @param {number} btn The button to test (0 = left, 1 = right, 2 = middle).
	 *
	 * @returns {number} The cursor x position, relative to the canvas lower left corner, when the dragging has finished.
	 */
	dragEndX : function (btn) {
		return this._dragEndPos[btn][0];
	},

	/**
	 * Gets the cursor y position when dragging has finished.
	 *
	 * @param {number} btn The button to test (0 = left, 1 = right, 2 = middle).
	 *
	 * @returns {number} The cursor y position, relative to the canvas lower left corner, when the dragging has finished.
	 */
	dragEndY : function (btn) {
		return this._dragEndPos[btn][1];
	},

	/**
	 * If dragging is ongoing, gets the difference between the current cursor x position and the cursor x position at dragging start.
	 *
	 * @param {number} btn The button to test (0 = left, 1 = right, 2 = middle).
	 *
	 * @returns {number} The difference between the current cursor x position and the cursor x position at dragging start.
	 */
	dragDeltaX : function (btn) {
		return this._dragDeltaPos[btn][0];
	},

	/**
	 * If dragging is ongoing, gets the difference between the current cursor y position and the cursor x position at dragging start.
	 *
	 * @param {number} btn The button to test (0 = left, 1 = right, 2 = middle).
	 *
	 * @returns {number} The difference between the current cursor y position and the cursor y position at dragging start.
	 */
	dragDeltaY : function (btn) {
		return this._dragDeltaPos[btn][1];
	},

	/**
	 * Gets the cursor x position, relative to the canvas lower left corner.
	 *
	 * @type number
	 */
	get cursorX() {
		return this._cursorPos[0];
	},

	/**
	 * Gets the cursor y position, relative to the canvas lower left corner.
	 *
	 * @type number
	 */
	get cursorY() {
		return this._cursorPos[1];
	},

	/**
	 * Gets the previous cursor x position, relative to the canvas lower left corner.
	 *
	 * @type number
	 */
	get cursorPrevX() {
		return this._cursorPrevPos[0];
	},

	/**
	 * Gets the previous cursor y position, relative to the canvas lower left corner.
	 *
	 * @type number
	 */
	get cursorPrevY() {
		return this._cursorPrevPos[1];
	},

	/**
	 * Gets the difference between the current and the previous cursor x position, relative to the canvas lower left corner.
	 *
	 * @type number
	 */
	get cursorDeltaX() {
		return this._cursorDeltaPos[0];
	},

	/**
	 * Gets the difference between the current and the previous cursor y position, relative to the canvas lower left corner.
	 *
	 * @type number
	 */
	get cursorDeltaY() {
		return this._cursorDeltaPos[1];
	},

	/**
	 * Calls immediately the onDraw event handler.
	 */
	draw : function () {
		this._onDraw();
	}
};

SpiderGL.Type.extend(SpiderGL.UserInterface.CanvasHandler, SpiderGL.Core.ObjectBase);

/**
 * Sets up a WebGL context and canvas event handling.
 * The WebGLRenderingContext is created and hijacked using {@link SpiderGL.WebGL.Context.getHijacked}.
 * A {@link SpiderGL.UserInterface.CanvasHandler} is created to handle the canvas events and dispatch them to the provided handler.
 * The canvas handler will be installed in the handler object as a named property.
 *
 * @param {HTMLCanvasElement|string} canvas The canvas used for rendering and from which event will be received.
 * @param {object} handler The event handler.
 * @param {function()} [handler.onInitialize] onInitialize event handler.
 * @param {function()} [handler.onTerminate] onTerminate event handler.
 * @param {function(keyCode, event)} [handler.onKeyUp] onKeyUp event handler.
 * @param {function(keyCode, event)} [handler.onKeyDown] onKeyDown event handler.
 * @param {function(keyCode, event)} [handler.onKeyPress] onKeyPress event handler.
 * @param {function(button, cursorX, cursorY, event)} [handler.onMouseButtonDown] onMouseButtonDown event handler.
 * @param {function(button, cursorX, cursorY, event)} [handler.onMouseButtonUp] onMouseButtonUp event handler.
 * @param {function(cursorX, cursorY, event)} [handler.onMouseMove] onMouseMove event handler.
 * @param {function(wheelDelta, cursorX, cursorY, event)} [handler.onMouseWheel] onMouseWheel event handler.
 * @param {function(button, cursorX, cursorY, event)} [handler.onClick] onClick event handler.
 * @param {function(button, cursorX, cursorY, event)} [handler.onDoubleClick] onDoubleClick event handler.
 * @param {function(button, cursorX, cursorY)} [handler.onDragStart] onDragStart event handler.
 * @param {function(button, cursorX, cursorY)} [handler.onDragEnd] onDragEnd event handler.
 * @param {function(button, cursorX, cursorY)} [handler.onDrag] onDrag event handler.
 * @param {function(canvasWidth, canvasHeight)} [handler.onResize] onResize event handler.
 * @param {function(deltaTimeSecs)} [handler.onAnimate] onAnimate event handler.
 * @param {function()} [handler.onDraw] onDraw event handler.
 * @param {object} options Optional parameters (see {@link SpiderGL.UserInterface.CanvasHandler}).
 * @param {string} [options.uiName=SpiderGL.UserInterface.CanvasHandler.DEFAULT_PROPERTY_NAME] The name of the property to install in the handler object for accessing the canvas handler.
 *
 * @see SpiderGL.UserInterface.handleCanvasOnLoad
 * @see SpiderGL.UserInterface.CanvasHandler
 */
SpiderGL.UserInterface.handleCanvas = function (canvas, handler, options) {
	if (!canvas || !handler) return false;

	options = options || { };

	var gl = SpiderGL.WebGL.Context.getHijacked(canvas, options);
	if (!gl) return false;

	var ui = new SpiderGL.UserInterface.CanvasHandler(gl, handler, options);
	if (!ui) return false;

	var uiName = SpiderGL.Utility.getDefaultValue(options.uiName, SpiderGL.UserInterface.CanvasHandler.DEFAULT_PROPERTY_NAME);
	handler[uiName] = ui;
	ui._firstNotify();

	return true;
}

/**
 * Sets up a WebGL context and canvas event handling after window loading.
 * When the window fires the onload event, {@link SpiderGL.UserInterface.handleCanvas} is called.
 *
 * @param {HTMLCanvasElement|string} canvas The canvas used for rendering and from which event will be received.
 * @param {object} handler The event handler (see {@link SpiderGL.UserInterface.handleCanvas}).
 * @param {object} options Optional parameters (see {@link SpiderGL.UserInterface.handleCanvas}).
 *
 * @see SpiderGL.UserInterface.handleCanvas
 */
SpiderGL.UserInterface.handleCanvasOnLoad = function (canvas, handler, options) {
	if (!canvas || !handler) return false;

	options = options || { };
	var onLoad = SpiderGL.Utility.getDefaultValue(options.onLoad, null);

	function doHandle() {
		SpiderGL.UserInterface.handleCanvas(canvas, handler, options);
		if (onLoad) { onLoad(); }
	}

	window.addEventListener("load", doHandle, false);
	return true;
}

