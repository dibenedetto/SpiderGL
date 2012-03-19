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
 * @fileOverview Space
 */

/**
 * The SpiderGL.Space namespace.
 *
 * @namespace The SpiderGL.Space namespace.
 */
SpiderGL.Space = { };

/**
 * Creates a SpiderGL.Space.MatrixStack.
 *
 * SpiderGL.Space.MatrixStack is a stack for 4x4 matrices. Initially, the stack depth is one and contains an identity matrix.
 * Every method or getter to access the top matrix (or a derivation like inverse or transpose) returns a copy of the internal matrix.
 * For performance reasons, variants of the above accessors (having the same identifier with the postfix "$" appended) that return a reference to the internal matrix are also present.
 * The transpose, inverse, and inverse-transpose of the top matrix are calculated and cached when they are accessed.
 *
 * @class The SpiderGL.Space.MatrixStack is a stack for 4x4 matrices.
 *
 * @augments SpiderGL.Core.ObjectBase
 *
 * @param {function(this)} [onChange] A callback function called whenever the stack is modified.
 *
 * @example
 * var s = new SpiderGL.Space.MatrixStack();
 * s.loadIdentity();
 * s.scale([2, 0.5, 2]);
 * for (var i=0; i<n; ++i) {
 * 	s.push();
 * 		s.translate(positions[i]);
 * 		matrices[i] = {
 * 			m  : s.matrix,
 * 			i  : s.inverse,
 * 			t  : s.transpose,
 * 			it : s.inverseTranspose
 * 		};
 * 	s.pop();
 * }
 *
 * @see reset
 * @see SpiderGL.Space.TransformationStack
 */
SpiderGL.Space.MatrixStack = function (onChange) {
	SpiderGL.Core.ObjectBase.call(this);

	this._onChange = null;
	this.reset();
	this._onChange = onChange;
}

SpiderGL.Space.MatrixStack.prototype = {
	_invalidate : function () {
		this._i  = null;
		this._t  = null;
		this._it = null;
		if (this._onChange) {
			this._onChange(this);
		}
	},

	/**
	 * Resets the stack.
	 * The stack is reset to its initial state, that is, a stack with depth one containing the identity matrix.
	 *
	 * @see SpiderGL.Math.Mat4.identity
	 */
	reset : function () {
		var m = SpiderGL.Math.Mat4.identity();
		this._s  = [ m ];
		this._l  = 1;
		this._m  = m;
		this._i  = m;
		this._t  = m;
		this._it = m;
		if (this._onChange) {
			this._onChange(this);
		}
	},

	/**
	 * Gets/Sets the callback invoked whenever the top matrix changes.
	 * Initially, no callback is defined.
	 *
	 * @event
	 */
	get onChange() {
		return this._onChange;
	},

	set onChange(f) {
		this._onChange = f;
	},

	/**
	 * Gets the stack depth.
	 * Initially, the stack contains an identity matrix, so its depth is one.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get size() {
		return this._l;
	},

	/**
	 * Gets a reference to the matrix at the top of the stack.
	 * The returned array MUST NOT be changed.
	 * Initially, the stack has depth one and contains an identity matrix.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #matrix
	 */
	get matrix$() {
		return this._m;
	},

	/**
	 * Gets a copy of the matrix at the top of the stack.
	 * Initially, the stack has depth one and contains an identity matrix.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #matrix$
	 */
	get matrix() {
		return SpiderGL.Math.Mat4.dup(this.matrix$);
	},

	/**
	 * Alias for #matrix$.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #top
	 * @see #matrix$
	 */
	get top$() {
		return this.matrix$;
	},

	/**
	 * Alias for #matrix.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #top$
	 * @see #matrix
	 */
	get top() {
		return this.matrix;
	},

	/**
	 * Gets a reference to the inverse of the matrix at the top of the stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #inverse
	 */
	get inverse$() {
		return (this._i || (this._i = SpiderGL.Math.Mat4.inverse(this._m)));
	},

	/**
	 * Gets a copy of the inverse of the matrix at the top of the stack.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #inverse$
	 */
	get inverse() {
		return SpiderGL.Math.Mat4.dup(this.inverse$);
	},

	/**
	 * Gets a reference to the transpose of the matrix at the top of the stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #transpose
	 */
	get transpose$() {
		return (this._t || (this._t = SpiderGL.Math.Mat4.transpose(this._m)));
	},

	/**
	 * Gets a copy of the transpose of the matrix at the top of the stack.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #transpose$
	 */
	get transpose() {
		return SpiderGL.Math.Mat4.dup(this.transpose$);
	},

	/**
	 * Gets a reference to the transpose of the inverse of the matrix at the top of the stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #inverseTranspose
	 */
	get inverseTranspose$() {
		return (this._it || (this._it = SpiderGL.Math.Mat4.transpose(this.inverse$)));
	},

	/**
	 * Gets a copy of the transpose of the inverse of the matrix at the top of the stack.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #inverseTranspose$
	 */
	get inverseTranspose() {
		return SpiderGL.Math.Mat4.dup(this.inverseTranspose$);
	},

	/**
	 * Pushes into the stack the matrix at its top.
	 * After a push operation, the stack depth is incremented by one and the two matrices at its top are identical.
	 * There is no limit on the depth the stack can reach.
	 *
	 * @see #pop
	 */
	push : function () {
		var m = SpiderGL.Math.Mat4.dup(this._m);
		this._s.push(m);
		this._l++;
		this._m = m;
	},

	/**
	 * Pops the stack.
	 * After a pop operation, the stack depth is decremented by one.
	 * Nothing is done if the stack has only one element.
	 *
	 * @see #push
	 */
	pop : function () {
		if (this._l <= 1) return;
		this._s.pop();
		this._l--;
		this._m = this._s[this._l - 1];
		this._invalidate();
	},

	/**
	 * Replaces the matrix at the top with a clone of the passed matrix.
	 *
	 * @param {array} m The matrix whose clone will be set as the top of the stack.
	 *
	 * @see #loadIdentity
	 * @see #multiply
	 * @see SpiderGL.Math.Mat4.dup
	 */
	load : function (m) {
		m = SpiderGL.Math.Mat4.dup(m);
		this._s[this._l - 1] = m;
		this._m = m;
		this._invalidate();
	},

	/**
	 * Replaces the matrix at the top with an identity matrix.
	 *
	 * @see #load
	 * @see #multiply
	 * @see SpiderGL.Math.Mat4.identity
	 * @see SpiderGL.Math.Mat4.identity$
	 */
	loadIdentity : function () {
		var m = SpiderGL.Math.Mat4.identity$(this._m);
		this._i  = m;
		this._t  = m;
		this._it = m;
	},

	/**
	 * Post-multiplies the matrix at the top with the passed matrix
	 * The matrix a at the top will be replaced by a * m.
	 *
	 * @param {array} m The matrix to post-multiply.
	 *
	 * @see #load
	 * @see SpiderGL.Math.Mat4.mul
	 * @see SpiderGL.Math.Mat4.mul$
	 */
	multiply : function (m) {
		SpiderGL.Math.Mat4.mul$(this._m, m);
		this._invalidate();
	},

	/**
	 * Post-multiplies the matrix at the top with an ortographic projection matrix.
	 *
	 * @param {array} min The minimum coordinates of the parallel viewing volume.
	 * @param {array} max The maximum coordinates of the parallel viewing volume.
	 *
	 * @see #frustum
	 * @see #perspective
	 * @see SpiderGL.Math.Mat4.ortho
	 * @see SpiderGL.Math.Mat4.mul$
	 */
	ortho : function (min, max) {
		SpiderGL.Math.Mat4.mul$(this._m, SpiderGL.Math.Mat4.ortho(min, max));
		this._invalidate();
	},

	/**
	 * Post-multiplies the matrix at the top with a frustum matrix.
	 *
	 * @param {array} min A 3-component array with the minimum coordinates of the frustum volume.
	 * @param {array} max A 3-component array with the maximum coordinates of the frustum volume.
	 *
	 * @see #perspective
	 * @see #ortho
	 * @see SpiderGL.Math.Mat4.frustum
	 * @see SpiderGL.Math.Mat4.mul$
	 */
	frustum : function (min, max) {
		SpiderGL.Math.Mat4.mul$(this._m, SpiderGL.Math.Mat4.frustum(min, max));
		this._invalidate();
	},

	/**
	 * Post-multiplies the matrix at the top with a perspective projection matrix.
	 *
	 * @param {number} fovY The vertical field-of-view angle, in radians.
	 * @param {number} aspectRatio The projection plane aspect ratio.
	 * @param {number} zNear The distance of the near clipping plane.
	 * @param {number} zFar The distance of the far clipping plane.
	 *
	 * @see #frustum
	 * @see #ortho
	 * @see SpiderGL.Math.Mat4.perspective
	 * @see SpiderGL.Math.Mat4.mul$
	 */
	perspective : function (fovY, aspectRatio, zNear, zFar) {
		SpiderGL.Math.Mat4.mul$(this._m, SpiderGL.Math.Mat4.perspective(fovY, aspectRatio, zNear, zFar));
		this._invalidate();
	},

	/**
	 * Post-multiplies the matrix at the top with a look-at matrix.
	 *
	 * @param {array} position The viewer's position as a 3-dimensional vector.
	 * @param {array} target The viewer's look-at point as a 3-dimensional vector.
	 * @param {array} position The viewer's up vector as a 3-dimensional vector.
	 *
	 * @see SpiderGL.Math.Mat4.lookAt
	 * @see SpiderGL.Math.Mat4.mul$
	 */
	lookAt : function (position, target, up) {
		SpiderGL.Math.Mat4.mul$(this._m, SpiderGL.Math.Mat4.lookAt(position, target, up));
		this._invalidate();
	},

	/**
	 * Post-multiplies the matrix at the top with a translation matrix.
	 *
	 * @param {array} v A 3-dimensional vector with translation offsets.
	 *
	 * @see #rotate
	 * @see #scale
	 * @see SpiderGL.Math.Mat4.translation
	 * @see SpiderGL.Math.Mat4.translate$
	 */
	translate : function (v) {
		SpiderGL.Math.Mat4.translate$(this._m, v);
		this._invalidate();
	},

	/**
	 * Post-multiplies the matrix at the top with a rotation matrix.
	 *
	 * @param {number} angle The counter-clockwise rotation angle, in radians.
	 * @param {array} axis A 3-dimensional vector representing the rotation axis.
	 *
	 * @see #translate
	 * @see #scale
	 * @see SpiderGL.Math.Mat4.rotationAngleAxis
	 * @see SpiderGL.Math.Mat4.rotateAngleAxis$
	 */
	rotate : function (angle, axis) {
		SpiderGL.Math.Mat4.rotateAngleAxis$(this._m, angle, axis);
		this._invalidate();
	},

	/**
	 * Post-multiplies the matrix at the top with a scaling matrix.
	 *
	 * @param {array} v The scaling amount as a 3-dimensional array.
	 *
	 * @see #translate
	 * @see #rotate
	 * @see SpiderGL.Math.Mat4.scaling
	 * @see SpiderGL.Math.Mat4.scale$
	 */
	scale : function (v) {
		SpiderGL.Math.Mat4.scale$(this._m, v);
		this._invalidate();
	}
};

SpiderGL.Type.extend(SpiderGL.Space.MatrixStack, SpiderGL.Core.ObjectBase);

/**
 * Creates a SpiderGL.Space.ViewportStack.
 *
 * SpiderGL.Space.ViewportStack is a stack for viewport rectangles, specified with lower and left coordinates, width and height.
 * Initially, the stack depth is one and contains a rectangle with lower-eft coordinates equal to zero and width and height equal to one, that is, the array [0, 0, 1, 1].
 * Every method or getter to access the top rectangle returns a copy of the internal rectangle.
 * For performance reasons, variants of the above accessors (having the same identifier with the postfix "$" appended) that return a reference to the internal rectangle are also present.
 *
 * @class The SpiderGL.Space.ViewportStack is a stack for viewport rectangles.
 *
 * @augments SpiderGL.Core.ObjectBase
 *
 * @param {function(this)} [onChange] A callback function called whenever the stack is modified.
 *
 * @example
 * var s  = new SpiderGL.Space.ViewportStack();
 * var dw = width  / nx;
 * var dh = height / ny;
 * s.load(x, y, width, height);
 * for (var x=0; x<nx; ++x) {
 * 	for (var y=0; y<ny; ++y) {
 * 	s.push();
		s.inner([x*dw, y*dh, dw, dh]);
		viewports.push(s.rect);
 * 	s.pop();
 * }
 *
 * @see reset
 * @see SpiderGL.Space.TransformationStack
 */
SpiderGL.Space.ViewportStack = function (onChange) {
	SpiderGL.Core.ObjectBase.call(this);

	this._onChange = null;
	this.reset();
	this._onChange = onChange;
}

SpiderGL.Space.ViewportStack.prototype = {
	_invalidate : function () {
		if (this._onChange) {
			this._onChange(this);
		}
	},

	/**
	 * Resets the stack.
	 * The stack is reset to its initial state, that is, a stack with depth one containing the identity rectangle, that is, [0, 0, 1, 1].
	 *
	 * @see #loadIdentity
	 */
	reset : function () {
		var r = [0, 0, 1, 1];
		this._s  = [ r ];
		this._l  = 1;
		this._r  = r;
		if (this._onChange) {
			this._onChange(this);
		}
	},

	/**
	 * Gets/Sets the callback invoked whenever the top rectangle changes.
	 * Initially, no callback is defined.
	 *
	 * @event
	 */
	get onChange() {
		return this._onChange;
	},

	set onChange(f) {
		this._onChange = f;
	},

	/**
	 * Gets the stack depth.
	 * Initially, the stack contains the identity rectangle, that is, [0, 0, 1, 1].
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get size() {
		return this._l;
	},

	/**
	 * Gets a reference to the rectangle at the top of the stack.
	 * The returned array MUST NOT be changed.
	 * Initially, the stack has depth one and contains the identity rectangle, that is, [0, 0, 1, 1].
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #rect
	 */
	get rect$() {
		return this._r;
	},

	/**
	 * Gets a copy of the matrix at the top of the stack.
	 * Initially, the stack has depth one and contains the identity rectangle, that is, [0, 0, 1, 1].
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #rect$
	 */
	get rect() {
		return this.rect$.slice(0, 4);
	},

	/**
	 * Alias for #rect$.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #top
	 * @see #rect$
	 */
	get top$() {
		return this.rect$;
	},

	/**
	 * Alias for #rect.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #top$
	 * @see #rect
	 */
	get top() {
		return this.rect;
	},

	/**
	 * Pushes into the stack the rectangle at its top.
	 * After a push operation, the stack depth is incremented by one and the two rectangle at its top are identical.
	 * There is no limit on the depth the stack can reach.
	 *
	 * @see #pop
	 */
	push : function () {
		var r = this._r.slice(0, 4);
		this._s.push(r);
		this._l++;
		this._r = r;
	},

	/**
	 * Pops the stack.
	 * After a pop operation, the stack depth is decremented by one.
	 * Nothing is done if the stack has only one element.
	 *
	 * @see #push
	 */
	pop : function () {
		if (this._l <= 1) return;
		this._s.pop();
		this._l--;
		this._r = this._s[this._l - 1];
		this._invalidate();
	},

	/**
	 * Replaces the rectangle at the top with a clone of the passed rectangle.
	 *
	 * @param {array} m The rectangle whose clone will be set as the top of the stack.
	 *
	 * @see #loadIdentity
	 * @see #inner
	 */
	load : function (r) {
		r = r.slice(0, 4);
		this._s[this._l - 1] = r;
		this._r = r;
		this._invalidate();
	},

	/**
	 * Replaces the rectangle at the top with the identity rectangle, that is, [0, 0, 1, 1].
	 *
	 * @see #load
	 * @see #inner
	 */
	loadIdentity : function () {
		var r = [0, 0, 1, 1];
		this._r  = r;
	},

	/**
	 * Replace the rectangle r at the top of the stack with Post-multiplies the matrix at the top with the passed matrix
	 * The matrix a at the top will be replaced by a * m.
	 *
	 * @param {array} m The matrix to post-multiply.
	 *
	 * @see #load
	 */
	inner : function (r) {
		this._r[0] += r[0];
		this._r[1] += r[1];
		this._r[2]  = r[2];
		this._r[3]  = r[3];
		this._invalidate();
	}
};

SpiderGL.Type.extend(SpiderGL.Space.ViewportStack, SpiderGL.Core.ObjectBase);

/**
 * Creates a SpiderGL.Space.ViewportStack.
 *
 * SpiderGL.Space.ViewportStack is a stack for viewport rectangles, specified with lower and left coordinates, width and height.
 * Initially, the stack depth is one and contains a rectangle with lower-eft coordinates equal to zero and width and height equal to one, that is, the array [0, 0, 1, 1].
 * Every method or getter to access the top rectangle returns a copy of the internal rectangle.
 * For performance reasons, variants of the above accessors (having the same identifier with the postfix "$" appended) that return a reference to the internal rectangle are also present.
 *
 * @class The SpiderGL.Space.ViewportStack is a stack for viewport rectangles.
 *
 * @augments SpiderGL.Core.ObjectBase
 *
 * @param {function(this)} [onChange] A callback function called whenever the stack is modified.
 *
 * @example
 * var s  = new SpiderGL.Space.ViewportStack();
 * var dw = width  / nx;
 * var dh = height / ny;
 * s.load(x, y, width, height);
 * for (var x=0; x<nx; ++x) {
 * 	for (var y=0; y<ny; ++y) {
 * 	s.push();
		s.inner([0, 0, dw, dh]);
		viewports.push(s.rect);
 * 	s.pop();
 * }
 *
 * @see reset
 * @see SpiderGL.Space.TransformationStack
 */
SpiderGL.Space.DepthRangeStack = function (onChange) {
	SpiderGL.Core.ObjectBase.call(this);

	this._onChange = null;
	this.reset();
	this._onChange = onChange;
}

SpiderGL.Space.DepthRangeStack.prototype = {
	_invalidate : function () {
		if (this._onChange) {
			this._onChange(this);
		}
	},

	/**
	 * Resets the stack.
	 * The stack is reset to its initial state, that is, a stack with depth one containing the identity rectangle, that is, [0, 0, 1, 1].
	 *
	 * @see #loadIdentity
	 */
	reset : function () {
		var r = [0, 1];
		this._s  = [ r ];
		this._l  = 1;
		this._r  = r;
		if (this._onChange) {
			this._onChange(this);
		}
	},

	/**
	 * Gets/Sets the callback invoked whenever the top rectangle changes.
	 * Initially, no callback is defined.
	 *
	 * @event
	 */
	get onChange() {
		return this._onChange;
	},

	set onChange(f) {
		this._onChange = f;
	},

	/**
	 * Gets the stack depth
	 * Initially, the stack contains an identity matrix, so its depth is one.
	 *
	 * @type number
	 *
	 * @readonly
	 */
	get size() {
		return this._l;
	},

	/**
	 * Gets a reference to the matrix at the top of the stack.
	 * The returned array MUST NOT be changed.
	 * Initially, the stack has depth one and contains an identity matrix.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #matrix
	 */
	get range$() {
		return this._r;
	},

	/**
	 * Gets a copy of the matrix at the top of the stack.
	 * Initially, the stack has depth one and contains an identity matrix.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #matrix$
	 */
	get range() {
		return this.range$.slice(0, 2);
	},

	/**
	 * Alias for #rect$.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #top
	 * @see #rect$
	 */
	get top$() {
		return this.range$;
	},

	/**
	 * Alias for #rect.
	 *
	 * @type array
	 *
	 * @readonly
	 *
	 * @see #top$
	 * @see #rect
	 */
	get top() {
		return this.range;
	},

	/**
	 * Pushes into the stack the range at its top.
	 * After a push operation, the stack depth is incremented by one and the two rectangle at its top are identical.
	 * There is no limit on the depth the stack can reach.
	 *
	 * @see #pop
	 */
	push : function () {
		var r = this._r.slice(0, 2);
		this._s.push(r);
		this._l++;
		this._r = r;
	},

	/**
	 * Pops the stack.
	 * After a pop operation, the stack depth is decremented by one.
	 * Nothing is done if the stack has only one element.
	 *
	 * @see #push
	 */
	pop : function () {
		if (this._l <= 1) return;
		this._s.pop();
		this._l--;
		this._r = this._s[this._l - 1];
		this._invalidate();
	},

	/**
	 * Replaces the matrix at the top with a clone of the passed matrix.
	 *
	 * @param {array} m The matrix to push on the stack. The matrix actually pushed is a clone of m.
	 *
	 * @see #loadIdentity
	 * @see #multiply
	 * @see SpiderGL.Math.Mat4.dup
	 */
	load : function (r) {
		r = r.slice(0, 2);
		this._s[this._l - 1] = r;
		this._r = r;
		this._invalidate();
	},

	/**
	 * Replaces the matrix at the top with an identity matrix.
	 *
	 * @see #load
	 * @see #multiply
	 * @see SpiderGL.Math.Mat4.identity
	 * @see SpiderGL.Math.Mat4.identity$
	 */
	loadIdentity : function () {
		var r = [0, 1];
		this._r  = r;
	},

	/**
	 * Post-multiplies the matrix at the top with the passed matrix
	 * The matrix a at the top will be replaced by a * m.
	 *
	 * @param {array} m The matrix to post-multiply.
	 *
	 * @see #load
	 */
	inner : function (r) {
		this._r[0] += r[0];
		this._r[1]  = r[1];
		this._invalidate();
	}
};

SpiderGL.Type.extend(SpiderGL.Space.DepthRangeStack, SpiderGL.Core.ObjectBase);

/**
 * Creates a SpiderGL.Space.TransformationStack.
 *
 * The purpose of SpiderGL.Space.TransformationStack is to provide transformation stack similar to the one in the fixed-pipeline versions of OpenGL.
 * Differently from OpenGL, which has two stacks, namely MODELVIEW and PRIJECTION, the SpiderGL.Space.TransformationStack is composed of three SpiderGL.Space.MatrixStack stacks: model, view and projection.
 * All three stacks can be directly accessed, as well as utility getters to obtain compositions of matrices, e.g. model-view-projection, model-view-inverse etc.
 * To avoid recalculation of several sub-products, matrix compositions and variations are cached and updated when stack operations occur.
 *
 * @class The SpiderGL.Space.TransformationStack holds the model, view and projection matrix stacks and calculates their matrix compositions.
 *
 * @augments SpiderGL.Core.ObjectBase
 *
 * @example
 * var xform = new SpiderGL.Space.TransformationStack();
 *
 * var uniforms = {
 * 	uModelViewprojection : null,
 * 	uNormalMatrix        : null,
 * 	uColor               : null
 * };
 *
 * program.bind();
 *
 * xform.projection.loadIdentity();
 * xform.projection.perspective(SpiderGL.Math.degToRad(60.0), width/height, 0.1, 100.0);
 *
 * xform.view.loadIdentity();
 * xform.view.lookAt([0, 0, 10], [0, 0, 0], [0, 1, 0]);
 *
 * xform.model.loadIdentity();
 * xform.model.scale([0.1, 0.1, 0.1]);
 *
 * for (var i=0; i<n; ++i) {
 * 	s.push();
 * 		s.translate(models[i].positions);
 * 		uniforms.uModelViewProjection = xform.modelViewProjectionMatrix;
 * 		uniforms.uNormalMatrix        = xform.modelSpaceNormalMatrix;
 * 		uniforms.uColor               = models[i].color;
 * 		program.setUniforms(uniforms);
 * 		drawModel(models[i]);
 * 	s.pop();
 * }
 *
 * @see reset
 * @see SpiderGL.Space.MatrixStack
 */
SpiderGL.Space.TransformationStack = function () {
	SpiderGL.Core.ObjectBase.call(this);

	var that = this;

	this._mv  = { };
	this._vp  = { };
	this._mvp = { };
	this._n   = { };
	this._c   = { };

	this._m = new SpiderGL.Space.MatrixStack(function(){
		that._mv  = { };
		that._mvp = { };
		that._n   = { };
		that._c   = { };
	});

	this._v = new SpiderGL.Space.MatrixStack(function(){
		that._mv  = { };
		that._vp  = { };
		that._mvp = { };
		that._n   = { };
		that._c   = { };
	});

	this._p = new SpiderGL.Space.MatrixStack(function(){
		that._vp  = { };
		that._mvp = { };
	});

	this._viewport = new SpiderGL.Space.ViewportStack(function(){
	});

	this._depth = new SpiderGL.Space.DepthRangeStack(function(){
	});
}

SpiderGL.Space.TransformationStack.prototype = {
	/**
	 * Resets the three stacks.
	 *
	 * @see SpiderGL.Space.MatrixStack.reset
	 */
	reset : function () {
		this._m.reset();
		this._v.reset();
		this._p.reset();
	},

	/**
	 * Gets the viewport stack.
	 *
	 * @type SpiderGL.Space.ViewportStack
	 *
	 * @see depthRange
	 */
	get viewport() {
		return this._viewport;
	},

	get viewportRect$() {
		return this._viewport.rect$;
	},

	get viewportRect() {
		return this._viewport.rect;
	},

	/**
	 * Gets the depth range stack.
	 *
	 * @type SpiderGL.Space.DepthRangeStack
	 *
	 * @see viewport
	 */
	get depth() {
		return this._depth;
	},

	get depthRange$() {
		return this._depth.range$;
	},

	get depthRange() {
		return this._depth.range;
	},

	/**
	 * Gets the model stack.
	 *
	 * @type SpiderGL.Space.MatrixStack
	 *
	 * @see view
	 * @see projection
	 */
	get model() {
		return this._m;
	},

	/**
	 * Gets a reference to the top matrix of the model stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @see modelMatrix
	 * @see SpiderGL.Space.MatrixStack.matrix$
	 */
	get modelMatrix$() {
		return this._m.matrix$;
	},

	/**
	 * Gets a copy of the top matrix of the model stack.
	 *
	 * @type array
	 *
	 * @see modelMatrix$
	 * @see SpiderGL.Space.MatrixStack.matrix
	 */
	get modelMatrix() {
		return this._m.matrix;
	},

	/**
	 * Gets a reference to the inverse of the top matrix of the model stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelMatrixInverse
	 * @see SpiderGL.Space.MatrixStack.inverse$
	 */
	get modelMatrixInverse$() {
		return this._m.inverse$;
	},

	/**
	 * Gets a copy of the inverse of the top matrix of the model stack.
	 *
	 * @type array
	 *
	 * @see modelMatrixInverse$
	 * @see SpiderGL.Space.MatrixStack.inverse
	 */
	get modelMatrixInverse() {
		return this._m.inverse;
	},

	/**
	 * Gets a reference to the transpose of the top matrix of the model stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelMatrixTranspose
	 * @see SpiderGL.Space.MatrixStack.transpose$
	 */
	get modelMatrixTranspose$() {
		return this._m.transpose$;
	},

	/**
	 * Gets a copy of the transpose of the top matrix of the model stack.
	 *
	 * @type array
	 *
	 * @see modelMatrixTranspose$
	 * @see SpiderGL.Space.MatrixStack.transpose
	 */
	get modelMatrixTranspose() {
		return this._m.transpose;
	},

	/**
	 * Gets a reference to the transpose of the inverse of the top matrix of the model stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelMatrixInverseTranspose
	 * @see SpiderGL.Space.MatrixStack.inverseTranspose$
	 */
	get modelMatrixInverseTranspose$() {
		return this._m.inverseTranspose$;
	},

	/**
	 * Gets a copy of the transpose of the inverse of the top matrix of the model stack.
	 *
	 * @type array
	 *
	 * @see modelMatrixInverseTranspose$
	 * @see SpiderGL.Space.MatrixStack.inverseTranspose
	 */
	get modelMatrixInverseTranspose() {
		return this._m.inverseTranspose;
	},

	/**
	 * Gets the view stack.
	 *
	 * @type SpiderGL.Space.MatrixStack
	 *
	 * @see model
	 * @see projection
	 */
	get view() {
		return this._v;
	},

	/**
	 * Gets a reference to the top matrix of the view stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see viewMatrix
	 * @see SpiderGL.Space.MatrixStack.matrix$
	 */
	get viewMatrix$() {
		return this._v.matrix$;
	},

	/**
	 * Gets a copy of the top matrix of the view stack.
	 *
	 * @type array
	 *
	 * @see viewMatrix$
	 * @see SpiderGL.Space.MatrixStack.matrix
	 */
	get viewMatrix() {
		return this._v.matrix;
	},

	/**
	 * Gets a reference to the inverse of the top matrix of the view stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see viewMatrixInverse
	 * @see SpiderGL.Space.MatrixStack.inverse$
	 */
	get viewMatrixInverse$() {
		return this._v.inverse$;
	},

	/**
	 * Gets a copy of the inverse of the top matrix of the view stack.
	 *
	 * @type array
	 *
	 * @see viewMatrixInverse$
	 * @see SpiderGL.Space.MatrixStack.inverse
	 */
	get viewMatrixInverse() {
		return this._v.inverse;
	},

	/**
	 * Gets a reference to the transpose of the top matrix of the view stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see viewMatrixTranspose
	 * @see SpiderGL.Space.MatrixStack.transpose$
	 */
	get viewMatrixTranspose$() {
		return this._v.transpose$;
	},

	/**
	 * Gets a copy of the transpose of the top matrix of the view stack.
	 *
	 * @type array
	 *
	 * @see viewMatrixTranspose$
	 * @see SpiderGL.Space.MatrixStack.transpose
	 */
	get viewMatrixTranspose() {
		return this._v.transpose;
	},

	/**
	 * Gets a reference to the transpose of the inverse of the top matrix of the view stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see viewMatrixInverseTranspose
	 * @see SpiderGL.Space.MatrixStack.inverseTranspose$
	 */
	get viewMatrixInverseTranspose$() {
		return this._v.inverseTranspose$;
	},

	/**
	 * Gets a copy of the transpose of the inverse of the top matrix of the view stack.
	 *
	 * @type array
	 *
	 * @see viewMatrixInverseTranspose$
	 * @see SpiderGL.Space.MatrixStack.inverseTranspose
	 */
	get viewMatrixInverseTranspose() {
		return this._v.inverseTranspose;
	},

	/**
	 * Gets the projection stack.
	 *
	 * @type SpiderGL.Space.MatrixStack
	 *
	 * @see model
	 * @see view
	 */
	get projection() {
		return this._p;
	},

	/**
	 * Gets a reference to the top matrix of the projection stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see projectionMatrix
	 * @see SpiderGL.Space.MatrixStack.matrix$
	 */
	get projectionMatrix$() {
		return this._p.matrix$;
	},

	/**
	 * Gets a copy of the top matrix of the projection stack.
	 *
	 * @type array
	 *
	 * @see projectionMatrix$
	 * @see SpiderGL.Space.MatrixStack.matrix
	 */
	get projectionMatrix() {
		return this._p.matrix;
	},

	/**
	 * Gets a reference to the inverse of the top matrix of the projection stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see projectionMatrixInverse
	 * @see SpiderGL.Space.MatrixStack.inverse$
	 */
	get projectionMatrixInverse$() {
		return this._p.inverse$;
	},

	/**
	 * Gets a copy of the inverse of the top matrix of the projection stack.
	 *
	 * @type array
	 *
	 * @see projectionMatrixInverse$
	 * @see SpiderGL.Space.MatrixStack.inverse
	 */
	get projectionMatrixInverse() {
		return this._p.inverse;
	},

	/**
	 * Gets a reference to the transpose of the top matrix of the projection stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see projectionMatrixTranspose
	 * @see SpiderGL.Space.MatrixStack.transpose$
	 */
	get projectionMatrixTranspose$() {
		return this._p.transpose$;
	},

	/**
	 * Gets a copy of the transpose of the top matrix of the projection stack.
	 *
	 * @type array
	 *
	 * @see projectionMatrixTranspose$
	 * @see SpiderGL.Space.MatrixStack.transpose
	 */
	get projectionMatrixTranspose() {
		return this._p.transpose;
	},

	/**
	 * Gets a reference to the transpose of the inverse of the top matrix of the projection stack.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see projectionMatrixInverseTranspose
	 * @see SpiderGL.Space.MatrixStack.inverseTranspose$
	 */
	get projectionMatrixInverseTranspose$() {
		return this._p.inverseTranspose$;
	},

	/**
	 * Gets a copy of the transpose of the inverse of the top matrix of the projection stack.
	 *
	 * @type array
	 *
	 * @see projectionMatrixInverseTranspose$
	 * @see SpiderGL.Space.MatrixStack.inverseTranspose
	 */
	get projectionMatrixInverseTranspose() {
		return this._p.inverseTranspose;
	},

	/**
	 * Gets a reference to the matrix T = V * M, where V is the view matrix and M the model matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelViewMatrix
	 */
	get modelViewMatrix$() {
		return (this._mv.m || (this._mv.m = SpiderGL.Math.Mat4.mul(this.viewMatrix$, this.modelMatrix$)));
	},

	/**
	 * Gets a copy of the matrix T = V * M, where V is the view matrix and M the model matrix.
	 *
	 * @type array
	 *
	 * @see modelViewMatrix$
	 */
	get modelViewMatrix() {
		return SpiderGL.Math.Mat4.dup(this.modelViewMatrix$);
	},

	/**
	 * Gets a reference to the inverse of the matrix T = V * M, where V is the view matrix and M the model matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelViewMatrixInverse
	 */
	get modelViewMatrixInverse$() {
		return (this._mv.i || (this._mv.i = SpiderGL.Math.Mat4.mul(this.modelMatrixInverse$, this.viewMatrixInverse$)));
	},

	/**
	 * Gets a copy of the inverse of the matrix T = V * M, where V is the view matrix and M the model matrix.
	 *
	 * @type array
	 *
	 * @see modelViewMatrixInverse$
	 */
	get modelViewMatrixInverse() {
		return SpiderGL.Math.Mat4.dup(this.modelViewMatrixInverse$);
	},

	/**
	 * Gets a reference to the transpose of the matrix T = V * M, where V is the view matrix and M the model matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelViewMatrixTranspose
	 */
	get modelViewMatrixTranspose$() {
		return (this._mv.t || (this._mv.t = SpiderGL.Math.Mat4.transpose(this.modelViewMatrix$)));
	},

	/**
	 * Gets a copy of the transpose of the matrix T = V * M, where V is the view matrix and M the model matrix.
	 *
	 * @type array
	 *
	 * @see modelViewMatrixTranspose$
	 */
	get modelViewMatrixTranspose() {
		return SpiderGL.Math.Mat4.dup(this.modelViewMatrixTranspose$);
	},

	/**
	 * Gets a reference to the transpose of the inverse of the matrix T = V * M, where V is the view matrix and M the model matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelViewMatrixInverseTranspose
	 */
	get modelViewMatrixInverseTranspose$() {
		return (this._mv.it || (this._mv.it = SpiderGL.Math.Mat4.transpose(this.modelViewMatrixInverse$)));
	},

	/**
	 * Gets a copy of the transpose of the inverse of the matrix T = V * M, where V is the view matrix and M the model matrix.
	 *
	 * @type array
	 *
	 * @see modelViewMatrixInverseTranspose$
	 */
	get modelViewMatrixInverseTranspose() {
		return SpiderGL.Math.Mat4.dup(this.modelViewMatrixInverseTranspose$);
	},

	/**
	 * Gets a reference to the matrix T = P * V, where P is the projection matrix and V the view matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see viewProjectionMatrix
	 */
	get viewProjectionMatrix$() {
		return (this._vp.m || (this._vp.m = SpiderGL.Math.Mat4.mul(this.projectionMatrix$, this.viewMatrix$)));
	},

	/**
	 * Gets a copy of the matrix T = P * V, where P is the projection matrix and V the view matrix.
	 *
	 * @type array
	 *
	 * @see viewProjectionMatrix$
	 */
	get viewProjectionMatrix() {
		return SpiderGL.Math.Mat4.dup(this.viewProjectionMatrix$);
	},

	/**
	 * Gets a reference to the inverse of the matrix T = P * V, where P is the projection matrix and V the view matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see viewProjectionMatrixInverse
	 */
	get viewProjectionMatrixInverse$() {
		return (this._vp.i || (this._vp.i = SpiderGL.Math.Mat4.mul(this.viewMatrixInverse$, this.projectionMatrixInverse$)));
	},

	/**
	 * Gets a copy of the inverse of the matrix T = P * V, where P is the projection matrix and V the view matrix.
	 *
	 * @type array
	 *
	 * @see viewProjectionMatrixInverse$
	 */
	get viewProjectionMatrixInverse() {
		return SpiderGL.Math.Mat4.dup(this.viewProjectionMatrixInverse$);
	},

	/**
	 * Gets a reference to the transpose of the matrix T = P * V, where P is the projection matrix and V the view matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see viewProjectionMatrixTranspose
	 */
	get viewProjectionMatrixTranspose$() {
		return (this._vp.t || (this._vp.t = SpiderGL.Math.Mat4.transpose(this.viewProjectionMatrix$)));
	},

	/**
	 * Gets a copy of the transpose of the matrix T = P * V, where P is the projection matrix and V the view matrix.
	 *
	 * @type array
	 *
	 * @see viewProjectionMatrixTranspose$
	 */
	get viewProjectionMatrixTranspose() {
		return SpiderGL.Math.Mat4.dup(this.viewProjectionMatrixTranspose$);
	},

	/**
	 * Gets a reference to the transpose of the inverse of the matrix T = P * V, where P is the projection matrix and V the view matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see viewProjectionMatrixInverseTranspose
	 */
	get viewProjectionMatrixInverseTranspose$() {
		return (this._vp.it || (this._vp.it = SpiderGL.Math.Mat4.transpose(this.viewProjectionMatrixInverse$)));
	},

	/**
	 * Gets a copy of the transpose of the inverse of the matrix T = P * V, where P is the projection matrix and V the view matrix.
	 *
	 * @type array
	 *
	 * @see viewProjectionMatrixInverseTranspose$
	 */
	get viewProjectionMatrixInverseTranspose() {
		return SpiderGL.Math.Mat4.dup(this.viewProjectionMatrixInverseTranspose$);
	},

	/**
	 * Gets a reference to the matrix T = P * V * M, where P is the projection matrix, V the view matrix and M the model matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelViewProjectionMatrix
	 */
	get modelViewProjectionMatrix$() {
		return (this._mvp.m || (this._mvp.m = SpiderGL.Math.Mat4.mul(this.viewProjectionMatrix$, this.modelMatrix$)));
	},

	/**
	 * Gets a copy of the matrix T = P * V * M, where P is the projection matrix, V the view matrix and M the model matrix.
	 *
	 * @type array
	 *
	 * @see modelViewProjectionMatrix$
	 */
	get modelViewProjectionMatrix() {
		return SpiderGL.Math.Mat4.dup(this.modelViewProjectionMatrix$);
	},

	/**
	 * Gets a reference to the inverse of the matrix T = P * V * M, where P is the projection matrix, V the view matrix and M the model matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelViewProjectionMatrix
	 */
	get modelViewProjectionMatrixInverse$() {
		return (this._mvp.i || (this._mvp.i = SpiderGL.Math.Mat4.inverse(this.modelViewProjectionMatrix$)));
	},

	/**
	 * Gets a copy of the inverse of the matrix T = P * V * M, where P is the projection matrix, V the view matrix and M the model matrix.
	 *
	 * @type array
	 *
	 * @see modelViewProjectionMatrix$
	 */
	get modelViewProjectionMatrixInverse() {
		return SpiderGL.Math.Mat4.dup(this.modelViewProjectionMatrixInverse$);
	},

	/**
	 * Gets a reference to the transpose of the matrix T = P * V * M, where P is the projection matrix, V the view matrix and M the model matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelViewProjectionMatrixTranspose
	 */
	get modelViewProjectionMatrixTranspose$() {
		return (this._mvp.t || (this._mvp.t = SpiderGL.Math.Mat4.transpose(this.modelViewProjectionMatrix$)));
	},

	/**
	 * Gets a copy of the transpose of the matrix T = P * V * M, where P is the projection matrix, V the view matrix and M the model matrix.
	 *
	 * @type array
	 *
	 * @see modelViewProjectionMatrixTranspose$
	 */
	get modelViewProjectionMatrixTranspose() {
		return SpiderGL.Math.Mat4.dup(this.modelViewProjectionMatrixTranspose$);
	},

	/**
	 * Gets a reference to the transpose of the inverse of the matrix T = P * V * M, where P is the projection matrix, V the view matrix and M the model matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelViewProjectionMatrixInverseTranspose
	 */
	get modelViewProjectionMatrixInverseTranspose$() {
		return (this._mvp.it || (this._mvp.it = SpiderGL.Math.Mat4.transpose(this.modelViewProjectionMatrixInverse$)));
	},

	/**
	 * Gets a copy of the transpose of the inverse of the matrix T = P * V * M, where P is the projection matrix, V the view matrix and M the model matrix.
	 *
	 * @type array
	 *
	 * @see modelViewProjectionMatrixInverseTranspose$
	 */
	get modelViewProjectionMatrixInverseTranspose() {
		return SpiderGL.Math.Mat4.dup(this.modelViewProjectionMatrixInverseTranspose$);
	},

	/**
	 * Gets a reference to the transpose of the inverse of the upper-left 3x3 matrix of the model matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see worldSpaceNormalMatrix
	 * @see viewSpaceNormalMatrix$
	 */
	get worldSpaceNormalMatrix$() {
		return (this._n.m || (this._n.m = SpiderGL.Math.Mat4.inverseTranspose33(this.modelMatrix$)));
	},

	/**
	 * Gets a copy of the transpose of the inverse of the upper-left 3x3 matrix of the model matrix.
	 *
	 * @type array
	 *
	 * @see worldSpaceNormalMatrix$
	 * @see viewSpaceNormalMatrix
	 */
	get worldSpaceNormalMatrix() {
		return SpiderGL.Math.Mat4.dup(this.worldSpaceNormalMatrix$);
	},

	/**
	 * Gets a reference to the transpose of the inverse of the upper-left 3x3 matrix of the model-view matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see viewSpaceNormalMatrix
	 * @see worldSpaceNormalMatrix$
	 */
	get viewSpaceNormalMatrix$() {
		return (this._n.v || (this._n.v = SpiderGL.Math.Mat4.inverseTranspose33(this.modelViewMatrix$)));
	},

	/**
	 * Gets a copy of the transpose of the inverse of the upper-left 3x3 matrix of the model matrix.
	 *
	 * @type array
	 *
	 * @see viewSpaceNormalMatrix$
	 * @see worldSpaceNormalMatrix
	 */
	get viewSpaceNormalMatrix() {
		return SpiderGL.Math.Mat4.dup(this.viewSpaceNormalMatrix$);
	},

	/**
	 * Gets a reference to the 3-dimensional vector representing the 4th column of the inverse of the model-view matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelSpaceViewerPosition
	 * @see modelSpaceViewDirection$
	 * @see worldSpaceViewerPosition$
	 */
	get modelSpaceViewerPosition$() {
		return (this._c.mp || (this._c.mp = SpiderGL.Math.Vec4.to3(SpiderGL.Math.Mat4.col(this.modelViewMatrixInverse$, 3))));
	},

	/**
	 * Gets a copy of the 3-dimensional vector representing the 4th column of the inverse of the model-view matrix.
	 *
	 * @type array
	 *
	 * @see modelSpaceViewerPosition$
	 * @see modelSpaceViewDirection$
	 * @see worldSpaceViewerPosition
	 */
	get modelSpaceViewerPosition() {
		return SpiderGL.Math.Vec3.dup(this.modelSpaceViewerPosition$);
	},

	/**
	 * Gets a reference to the 3-dimensional vector representing the 4th column of the inverse of the view matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see worldSpaceViewerPosition
	 * @see worldSpaceViewDirection$
	 * @see modelSpaceViewerPosition$
	 */
	get worldSpaceViewerPosition$() {
		return (this._c.wp || (this._c.wp = SpiderGL.Math.Vec4.to3(SpiderGL.Math.Mat4.col(this.viewMatrixInverse$, 3))));
	},

	/**
	 * Gets a copy of the 3-dimensional vector representing the 4th column of the inverse of the model-view matrix.
	 *
	 * @type array
	 *
	 * @see worldSpaceViewerPosition$
	 * @see worldSpaceViewDirection
	 * @see modelSpaceViewerPosition
	 */
	get worldSpaceViewerPosition() {
		return SpiderGL.Math.Vec3.dup(this.worldSpaceViewerPosition$);
	},

	/**
	 * Gets a reference to the 3-dimensional vector representing the negated 3rd row of the inverse of the model-view matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see modelSpaceViewDirection
	 * @see modelSpaceViewerPosition$
	 * @see worldSpaceViewDirection$
	 */
	get modelSpaceViewDirection$() {
		return (this._c.md || (this._c.md = SpiderGL.Math.Vec3.normalize$(SpiderGL.Math.Vec3.neg$(SpiderGL.Math.Vec4.to3(SpiderGL.Math.Mat4.row(this.modelViewMatrixInverse$, 2))))));
	},

	/**
	 * Gets a copy of the 3-dimensional vector representing the negated 3rd row of the inverse of the model-view matrix.
	 *
	 * @type array
	 *
	 * @see modelSpaceViewDirection$
	 * @see modelSpaceViewerPosition
	 * @see worldSpaceViewDirection
	 */
	get modelSpaceViewDirection() {
		return SpiderGL.Math.Vec3.dup(this.modelSpaceViewDirection$);
	},

	/**
	 * Gets a reference to the 3-dimensional vector representing the negated 3rd row of the inverse of the view matrix.
	 * The returned array MUST NOT be changed.
	 *
	 * @type array
	 *
	 * @see worldSpaceViewDirection
	 * @see worldSpaceViewerPosition$
	 * @see modelSpaceViewDirection$
	 */
	get worldSpaceViewDirection$() {
		return (this._c.wd || (this._c.wd = SpiderGL.Math.Vec3.normalize$(SpiderGL.Math.Vec3.neg$(SpiderGL.Math.Vec4.to3(SpiderGL.Math.Mat4.row(this.viewMatrixInverse$, 2))))));
	},

	/**
	 * Gets a reference to the 3-dimensional vector representing the negated 3rd row of the inverse of the model-view matrix.
	 *
	 * @type array
	 *
	 * @see worldSpaceViewDirection$
	 * @see worldSpaceViewerPosition
	 * @see modelSpaceViewDirection
	 */
	get worldSpaceViewDirection() {
		return SpiderGL.Math.Vec3.dup(this.worldSpaceViewDirection$);
	},

	project : function(xyzw) {
		return SpiderGL.Math.project(xyzw, this.modelViewProjectionMatrix$, this.viewportRect$, this.depthRange$);
	},

	unproject : function(xyz) {
		return SpiderGL.Math.unproject(xyz, this.modelViewProjectionMatrixInverse$, this.viewportRect$, this.depthRange$);
	}
};

SpiderGL.Type.extend(SpiderGL.Space.TransformationStack, SpiderGL.Core.ObjectBase);

