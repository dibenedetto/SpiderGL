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
 * @fileOverview Model
 */

/**
 * The SpiderGL.Model namespace.
 *
 * @namespace The SpiderGL.Model namespace.
 */
SpiderGL.Model = { };

/**
 * Creates a SpiderGL.Model.Model.
 *
 * @class The SpiderGL.Model.Model represents a complex geometric model.
 *
 * @augments SpiderGL.Core.ObjectBase
 */
SpiderGL.Model.Model = function (gl, descriptor, options) {
	SpiderGL.Core.ObjectBase.call(this);

	options = SpiderGL.Utility.getDefaultObject({
	}, options);

	if (descriptor && ("vertices" in descriptor)) {
		descriptor = SpiderGL.Model.Model._createSimpleDescriptor(descriptor);
	}

	this._descriptor = SpiderGL.Model.Model._fixDescriptor(descriptor);
	this._gl = null;
	this._renderData = { };

	if (gl) {
		this.updateGL(gl, options);
		this.updateRenderData();
	}
};

SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_SIZE       = 3;
SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_TYPE       = SpiderGL.Type.FLOAT32;
SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_NORMALIZED = false;
SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_STRIDE     = 0;
SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_OFFSET     = 0;

SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_MODE    = SpiderGL.Type.TRIANGLES;
SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_FIRST   = 0;
SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_COUNT   = -1;
SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_TYPE    = SpiderGL.Type.UINT16;
SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_OFFSET  = 0;

SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_VERTEX_MAP = { };

SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_VERTEX_MAP["position"] = {
	size       : 3,
	type       : SpiderGL.Type.FLOAT32,
	normalized : false,
	semantic   : "POSITION",
	index      : 0,
	value      : [0.0, 0.0, 0.0, 1.0]
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_VERTEX_MAP["normal"] = {
	size       : 3,
	type       : SpiderGL.Type.FLOAT32,
	normalized : false,
	semantic   : "NORMAL",
	index      : 0,
	value      : [0.0, 0.0, 1.0, 0.0]
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_VERTEX_MAP["color"] = {
	size       : 4,
	type       : SpiderGL.Type.UINT8,
	normalized : true,
	semantic   : "COLOR",
	index      : 0,
	value      : [0, 0, 0, 255]
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_VERTEX_MAP["texcoord"] = {
	size       : 2,
	type       : SpiderGL.Type.FLOAT32,
	normalized : false,
	semantic   : "TEXCOORD",
	index      : 0,
	value      : [0.0, 0.0, 0.0, 1.0]
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_VERTEX_MAP["user"] = {
	size       : 3,
	type       : SpiderGL.Type.FLOAT32,
	normalized : false,
	semantic   : "USER",
	index      : 0,
	value      : [0.0, 0.0, 0.0, 1.0]
};

SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP = { };
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP["triangles"] = {
	mode       : SpiderGL.Type.TRIANGLES,
	type       : SpiderGL.Type.UINT16,
	count      : -1,
	semantic   : "FILL"
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP["triangleStrip"] = {
	mode       : SpiderGL.Type.TRIANGLE_STRIP,
	type       : SpiderGL.Type.UINT16,
	count      : -1,
	semantic   : "FILL"
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP["triangleFan"] = {
	mode       : SpiderGL.Type.TRIANGLE_FAN,
	type       : SpiderGL.Type.UINT16,
	count      : -1,
	semantic   : "FILL"
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP["lines"] = {
	mode       : SpiderGL.Type.LINES,
	type       : SpiderGL.Type.UINT16,
	count      : -1,
	semantic   : "LINE"
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP["lineStrip"] = {
	mode       : SpiderGL.Type.LINE_STRIP,
	type       : SpiderGL.Type.UINT16,
	count      : -1,
	semantic   : "LINE"
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP["lineLoop"] = {
	mode       : SpiderGL.Type.LINE_LOOP,
	type       : SpiderGL.Type.UINT16,
	count      : -1,
	semantic   : "LINE"
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP["points"] = {
	mode       : SpiderGL.Type.POINTS,
	type       : SpiderGL.Type.UINT16,
	count      : -1,
	semantic   : "POINT"
};
SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP["user"] = {
	mode       : SpiderGL.Type.TRIANGLES,
	type       : SpiderGL.Type.UINT16,
	count      : -1,
	semantic   : "FILL"
};

SpiderGL.Model.Model._fixDescriptor = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		version  : "0.0.0.1 EXP",
		meta     : null,
		data     : null,
		access   : null,
		semantic : null,
		logic    : null
	}, d);

	d.meta     = SpiderGL.Model.Model._fixDescriptorMeta     (d.meta);
	d.data     = SpiderGL.Model.Model._fixDescriptorData     (d.data);
	d.access   = SpiderGL.Model.Model._fixDescriptorAccess   (d.access);
	d.semantic = SpiderGL.Model.Model._fixDescriptorSemantic (d.semantic);
	d.logic    = SpiderGL.Model.Model._fixDescriptorLogic    (d.logic);

	return d;
};

SpiderGL.Model.Model._fixDescriptorMeta = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		author      : null,
		date        : null,
		description : null
	}, d);
	return d;
};

SpiderGL.Model.Model._fixDescriptorData = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		vertexBuffers : null,
		indexBuffers  : null
	}, d);

	d.vertexBuffers = SpiderGL.Model.Model._fixDescriptorDataVertexBuffers (d.vertexBuffers);
	d.indexBuffers  = SpiderGL.Model.Model._fixDescriptorDataIndexBuffers  (d.indexBuffers);

	return d;
};

SpiderGL.Model.Model._fixDescriptorDataVertexBuffers = function (d) {
	d = SpiderGL.Utility.getDefaultObject({ }, d);
	for (var x in d) {
		d[x] = SpiderGL.Model.Model._fixDescriptorDataVertexBuffer(d[x]);
	}
	return d;
};

SpiderGL.Model.Model._fixDescriptorDataVertexBuffer = function (d) {
	return SpiderGL.Model.Model._fixDescriptorDataBuffer(d);
};

SpiderGL.Model.Model._fixDescriptorDataIndexBuffers = function (d) {
	d = SpiderGL.Utility.getDefaultObject({ }, d);
	for (var x in d) {
		d[x] = SpiderGL.Model.Model._fixDescriptorDataIndexBuffer(d[x]);
	}
	return d;
};

SpiderGL.Model.Model._fixDescriptorDataIndexBuffer = function (d) {
	return SpiderGL.Model.Model._fixDescriptorDataBuffer(d);
};

SpiderGL.Model.Model._fixDescriptorDataBuffer = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		type         : SpiderGL.Type.NO_TYPE,
		glType       : WebGLRenderingContext.NONE,
		untypedArray : null,
		typedArray   : null,
		glBuffer     : null
	}, d);
	return d;
};

SpiderGL.Model.Model._fixDescriptorAccess = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		vertexStreams    : null,
		primitiveStreams : null
	}, d);

	d.vertexStreams     = SpiderGL.Model.Model._fixDescriptorAccessVertexStreams    (d.vertexStreams);
	d.primitiveStreams  = SpiderGL.Model.Model._fixDescriptorAccessPrimitiveStreams (d.primitiveStreams);

	return d;
};

SpiderGL.Model.Model._fixDescriptorAccessVertexStreams = function (d) {
	d = SpiderGL.Utility.getDefaultObject({ }, d);
	for (var x in d) {
		d[x] = SpiderGL.Model.Model._fixDescriptorAccessVertexStream(d[x]);
	}
	return d;
};

SpiderGL.Model.Model._fixDescriptorAccessVertexStream = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		buffer     : null,
		size       : SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_SIZE,
		type       : SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_TYPE,
		glType     : SpiderGL.Type.typeToGL(SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_TYPE),
		normalized : SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_NORMALIZED,
		stride     : SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_STRIDE,
		offset     : SpiderGL.Model.Model.DEFAULT_VERTEX_STREAM_OFFSET
	}, d);
	return d;
};

SpiderGL.Model.Model._fixDescriptorAccessPrimitiveStreams = function (d) {
	d = SpiderGL.Utility.getDefaultObject({ }, d);
	for (var x in d) {
		d[x] = SpiderGL.Model.Model._fixDescriptorAccessPrimitiveStream(d[x]);
	}
	return d;
};

SpiderGL.Model.Model._fixDescriptorAccessPrimitiveStream = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		buffer     : null,
		mode       : SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_MODE,
		first      : SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_FIRST,
		count      : SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_COUNT,
		type       : SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_TYPE,
		glType     : SpiderGL.Type.typeToGL(SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_TYPE),
		offset     : SpiderGL.Model.Model.DEFAULT_PRIMITIVE_STREAM_OFFSET
	}, d);
	return d;
};

SpiderGL.Model.Model._fixDescriptorSemantic = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		bindings : null,
		chunks   : null
	}, d);

	d.bindings = SpiderGL.Model.Model._fixDescriptorSemanticBindings (d.bindings);
	d.chunks   = SpiderGL.Model.Model._fixDescriptorSemanticChunks   (d.chunks);

	return d;
};

SpiderGL.Model.Model._fixDescriptorSemanticBindings = function (d) {
	d = SpiderGL.Utility.getDefaultObject({ }, d);
	for (var x in d) {
		d[x] = SpiderGL.Model.Model._fixDescriptorSemanticBinding(d[x]);
	}
	return d;
};

SpiderGL.Model.Model._fixDescriptorSemanticBinding = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		vertexStreams    : null,
		primitiveStreams : null
	}, d);

	d.vertexStreams    = SpiderGL.Model.Model._fixDescriptorSemanticBindingVertexStreams    (d.vertexStreams);
	d.primitiveStreams = SpiderGL.Model.Model._fixDescriptorSemanticBindingPrimitiveStreams (d.primitiveStreams);

	return d;
};

SpiderGL.Model.Model._fixDescriptorSemanticBindingVertexStreams = function (d) {
	d = SpiderGL.Utility.getDefaultObject({ }, d);
	for (var x in d) {
		d[x] = SpiderGL.Model.Model._fixDescriptorSemanticBindingVertexStream(d[x]);
	}
	return d;
};

SpiderGL.Model.Model._fixDescriptorSemanticBindingVertexStream = function (d) {
	if (!d) return null;
	if (SpiderGL.Type.isArray(d)) return d.slice();
	return [ d ];
};

SpiderGL.Model.Model._fixDescriptorSemanticBindingPrimitiveStreams = function (d) {
	d = SpiderGL.Utility.getDefaultObject({ }, d);
	for (var x in d) {
		d[x] = SpiderGL.Model.Model._fixDescriptorSemanticBindingPrimitiveStream(d[x]);
	}
	return d;
};

SpiderGL.Model.Model._fixDescriptorSemanticBindingPrimitiveStream = function (d) {
	if (!d) return null;
	if (SpiderGL.Type.isArray(d)) return d.slice();
	return [ d ];
};

SpiderGL.Model.Model._fixDescriptorSemanticChunks = function (d) {
	d = SpiderGL.Utility.getDefaultObject({ }, d);
	for (var x in d) {
		d[x] = SpiderGL.Model.Model._fixDescriptorSemanticChunk(d[x]);
	}
	return d;
};

SpiderGL.Model.Model._fixDescriptorSemanticChunk = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		techniques : null
	}, d);

	d.techniques = SpiderGL.Model.Model._fixDescriptorSemanticChunkTechniques(d.techniques);

	return d;
};

SpiderGL.Model.Model._fixDescriptorSemanticChunkTechniques = function (d) {
	d = SpiderGL.Utility.getDefaultObject({ }, d);
	for (var x in d) {
		d[x] = SpiderGL.Model.Model._fixDescriptorSemanticChunkTechnique(d[x]);
	}
	return d;
};

SpiderGL.Model.Model._fixDescriptorSemanticChunkTechnique = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		binding : null
	}, d);
	return d;
};

SpiderGL.Model.Model._fixDescriptorLogic = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		parts : null
	}, d);

	d.parts = SpiderGL.Model.Model._fixDescriptorLogicParts(d.parts);

	return d;
};

SpiderGL.Model.Model._fixDescriptorLogicParts = function (d) {
	d = SpiderGL.Utility.getDefaultObject({ }, d);
	for (var x in d) {
		d[x] = SpiderGL.Model.Model._fixDescriptorLogicPart(d[x]);
	}
	return d;
};

SpiderGL.Model.Model._fixDescriptorLogicPart = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		chunks : null
	}, d);

	d.chunks = SpiderGL.Model.Model._fixDescriptorLogicPartChunks(d.chunks);

	return d;
};

SpiderGL.Model.Model._fixDescriptorLogicPartChunks = function (d) {
	if (!d) return null;
	if (SpiderGL.Type.isArray(d)) return d.slice();
	return [ d ];
};

SpiderGL.Model.Model._createSimpleDescriptor = function (options) {
	options = SpiderGL.Utility.getDefaultObject({
		vertices   : null,
		primitives : null,
		options    : null
	}, options);

	var bindingName        = "mainBinding";
	var chunkName          = "mainChunk";
	var partName           = "mainPart";
	var vertexBufferSuffix = "VertexBuffer";
	var indexBufferSuffix  = "IndexBuffer";

	var d = {
		data : {
			vertexBuffers : {
			},
			indexBuffers : {
			},
		},
		access : {
			vertexStreams : {
			},
			primitiveStreams : {
			}
		},
		semantic : {
			bindings : {
			},
			chunks : {
			}
		},
		logic : {
			parts : {
			}
		}
	};

	var binding = {
		vertexStreams : {
		},
		primitiveStreams : {
		}
	};
	d.semantic.bindings[bindingName] = binding;

	var chunk = {
		techniques : {
			"common" : {
				binding : bindingName
			}
		}
	};
	d.semantic.chunks[chunkName] = chunk;

	var part = {
		chunks : [ chunkName ]
	};
	d.logic.parts[partName] = part;

	var minBufferedCount = -1;
	var hasBuffered = false;
	var hasConstant = false;

	for (var x in options.vertices) {
		var src = options.vertices[x];
		if (!src) continue;

		if (SpiderGL.Type.isArray(src) || SpiderGL.Type.isTypedArray(src) || SpiderGL.Type.instanceOf(src, ArrayBuffer)) {
			src = { data : src };
		}

		var map = SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_VERTEX_MAP[x];
		var mapSemantic = null;
		if (!map) {
			map = SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_VERTEX_MAP["user"];
			mapSemantic = x.toUpperCase();
		}
		else {
			mapSemantic = map.semantic;
		}

		var info = SpiderGL.Utility.getDefaultObject({
			size       : map.size,
			type       : map.type,
			normalized : map.normalized,
			semantic   : mapSemantic,
			index      : map.index,
			data       : null,
			value      : map.value.slice()
		}, src);

		var accessor = {
			buffer     : null,
			size       : info.size,
			type       : info.type,
			normalized : info.normalized,
			stride     : 0,
			offset     : 0,
			value      : info.value.slice(),
		};

		if (info.data) {
			var buffer = {
				type : info.type
			};
			var count = 0;
			if (SpiderGL.Type.isArray(info.data)) {
				buffer.untypedArray = info.data;
				count = buffer.untypedArray.length / accessor.size;
			}
			else if (SpiderGL.Type.isTypedArray(src) || SpiderGL.Type.instanceOf(src, ArrayBuffer)) {
				buffer.typedArray = info.data;
				count = (buffer.typedArray.byteLength - accessor.offset) / (accessor.size * SpiderGL.Type.typeSize(accessor.type));
			}
			else {
				continue;
			}
			count = SpiderGL.Math.floor(count);
			hasBuffered = true;
			minBufferedCount = (minBufferedCount >= 0) ? (SpiderGL.Math.min(minBufferedCount, count)) : (count);
			var bufferName = x + vertexBufferSuffix;
			d.data.vertexBuffers[bufferName] = buffer;
			accessor.buffer = bufferName;
		}
		else {
			hasConstant = true;
		}

		var streamName = x;
		d.access.vertexStreams[streamName] = accessor;

		var streams = new Array(info.index + 1);
		streams[info.index] = streamName;
		binding.vertexStreams[info.semantic] = streams;
	}

	var minCount = 0;
	if (hasBuffered) {
		minCount = minBufferedCount;
	}
	else if (hasConstant) {
		minCount = 1;
	}

	var optionsPrimitives = options.primitives;
	if (SpiderGL.Type.isString(optionsPrimitives)) {
		optionsPrimitives = [ optionsPrimitives ];
	}
	if (SpiderGL.Type.isArray(optionsPrimitives)) {
		var op = optionsPrimitives;
		optionsPrimitives = { };
		for (var i=0, n=op.length; i<n; ++i) {
			var pn = op[i];
			if (!SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP[pn]) continue;
			optionsPrimitives[pn] = { };
		}
	}

	for (var x in optionsPrimitives) {
		var src = optionsPrimitives[x];
		if (!src) continue;

		if (SpiderGL.Type.isArray(src) || SpiderGL.Type.isTypedArray(src) || SpiderGL.Type.instanceOf(src, ArrayBuffer)) {
			src = { data : src };
		}

		var map = SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP[x];
		if (!map) map = SpiderGL.Model.Model.DEFAULT_SIMPLE_MODEL_PRIMITIVE_MAP["user"];

		var info = SpiderGL.Utility.getDefaultObject({
			mode     : map.mode,
			type     : map.type,
			count    : ((map.count >= 0) ? (map.count) : (minCount)),
			semantic : map.semantic
		}, src);

		var accessor = {
			buffer     : null,
			mode       : info.mode,
			first      : 0,
			count      : info.count,
			type       : info.type,
			offset     : 0
		};

		if (info.data) {
			var buffer = {
				type : info.type
			};
			var count = 0
			if (SpiderGL.Type.isArray(info.data)) {
				buffer.untypedArray = info.data;
				count = buffer.untypedArray.length;
			}
			else if (SpiderGL.Type.isTypedArray(src) || SpiderGL.Type.instanceOf(src, ArrayBuffer)) {
				buffer.typedArray = info.data;
				count = (buffer.typedArray.byteLength - accessor.offset) / (SpiderGL.Type.typeSize(accessor.type));
			}
			else {
				continue;
			}
			count = SpiderGL.Math.floor(count);
			var bufferName = x + indexBufferSuffix;
			d.data.indexBuffers[bufferName] = buffer;
			accessor.buffer = bufferName;
			accessor.count  = count;
		}

		var streamName = x;
		d.access.primitiveStreams[streamName] = accessor;

		var streams = new Array(1);
		streams[0] = streamName;
		binding.primitiveStreams[info.semantic] = streams;
	}

	return d;
};

SpiderGL.Model.Model.prototype = {
	get descriptor() {
		return this._descriptor;
	},

	get isReady() {
		return !!this._descriptor;
	},

	get gl() {
		return this._gl;
	},

	get renderData() {
		return this._renderData;
	},

	updateTypedArrays : function () {
		var d = this._descriptor;
		if (!d) return false;

		var buffer = null;
		var ctor   = null;

		var vertexBuffers = d.data.vertexBuffers;
		for (var x in vertexBuffers) {
			buffer = vertexBuffers[x];
			if (!buffer.untypedArray) continue;
			ctor = SpiderGL.Type.typeToTypedArrayConstructor(buffer.type);
			buffer.typedArray = new ctor(buffer.untypedArray);
		}

		var indexBuffers = d.data.indexBuffers;
		for (var x in indexBuffers) {
			buffer = indexBuffers[x];
			if (!buffer.untypedArray) continue;
			ctor = SpiderGL.Type.typeToTypedArrayConstructor(buffer.type);
			buffer.typedArray = new ctor(buffer.untypedArray);
		}

		return true;
	},

	updateGL : function (gl, options) {
		if (!gl) return false;

		var d = this._descriptor;
		if (!d) return false;

		this._gl = gl;

		var buffer     = null;
		var typedArray = null;
		var ctor       = null;

		var bufferOptions = SpiderGL.Utility.getDefaultObject({
			data   : null,
			usage  : SpiderGL.Core.DEFAULT
		}, options);
		bufferOptions.data = null;

		for (var x in d.data.vertexBuffers) {
			buffer = d.data.vertexBuffers[x];
			bufferOptions.data = buffer.typedArray;
			if (!bufferOptions.data) {
				ctor = SpiderGL.Type.typeToTypedArrayConstructor(buffer.type);
				bufferOptions.data = new ctor(buffer.untypedArray);
			}
			if (buffer.glBuffer) {
				buffer.glBuffer.destroy();
				buffer.glBuffer = null;
			}
			buffer.glBuffer = new SpiderGL.WebGL.VertexBuffer(gl, bufferOptions);
		}

		for (var x in d.data.indexBuffers) {
			buffer = d.data.indexBuffers[x];
			bufferOptions.data = buffer.typedArray;
			if (!bufferOptions.data) {
				ctor = SpiderGL.Type.typeToTypedArrayConstructor(buffer.type);
				bufferOptions.data = new ctor(buffer.untypedArray);
			}
			if (buffer.glBuffer) {
				buffer.glBuffer.destroy();
				buffer.glBuffer = null;
			}
			buffer.glBuffer = new SpiderGL.WebGL.IndexBuffer(gl, bufferOptions);
		}

		var stream = null;

		for (var x in d.access.vertexStreams) {
			stream = d.access.vertexStreams[x];
			stream.glType = SpiderGL.Type.typeToGL(stream.type);
		}

		for (var x in d.access.primitiveStreams) {
			stream = d.access.primitiveStreams[x];
			stream.glMode = SpiderGL.Type.primitiveToGL(stream.mode);
			stream.glType = SpiderGL.Type.typeToGL(stream.type);
		}

		return true;
	},

	updateRenderData : function () {
		var d = this._descriptor;
		if (!d) return false;

		var renderData = {
			partMap : { }
		};

		for (var partName in d.logic.parts) {
			var part = d.logic.parts[partName];
			var chunkNames = part.chunks;
			var partInfo = { };
			renderData.partMap[partName] = partInfo;

			for (var i=0, n=chunkNames.length; i<n; ++i) {
				var chunkName = chunkNames[i];
				var chunk = d.semantic.chunks[chunkName];
				var chunkInfo = { };
				partInfo[chunkName] = chunkInfo;

				var techniques = chunk.techniques;
				for (var techniqueName in techniques) {
					var techique = techniques[techniqueName];
					var techiqueInfo = {
						vertexStreams : {
							buffered : [ ],
							constant : [ ]
						},
						primitiveStreams : { }
					};
					chunkInfo[techniqueName] = techiqueInfo;

					var binding = d.semantic.bindings[techique.binding];

					var streams = binding.vertexStreams;
					var bufferMap = { };
					for (var semantic in streams) {
						var streamNames = streams[semantic];
						for (var j=0, m=streamNames.length; j<m; ++j) {
							var streamName = streamNames[j];
							var stream = d.access.vertexStreams[streamName];
							var streamInfo = {
								semantic : semantic,
								index    : j,
								stream   : stream
							}
							var bufferName = stream.buffer;
							if (bufferName) {
								bufferMap[bufferName] = bufferMap[bufferName] || [ ];
								bufferMap[bufferName].push(streamInfo);
							}
							else {
								techiqueInfo.vertexStreams.constant.push(streamInfo);
							}
						}
					}
					for (var bufferName in bufferMap) {
						var bufferInfo = {
							buffer  : d.data.vertexBuffers[bufferName],
							streams : bufferMap[bufferName].slice()
						};
						techiqueInfo.vertexStreams.buffered.push(bufferInfo);
					}

					var streams = binding.primitiveStreams;
					for (var semantic in streams) {
						var bufferMap = { };
						var primitiveStreamsInfo = {
							buffered : [ ],
							array    : [ ]
						};
						techiqueInfo.primitiveStreams[semantic] = primitiveStreamsInfo;

						var streamNames = streams[semantic];
						for (var j=0, m=streamNames.length; j<m; ++j) {
							var streamName = streamNames[j];
							var stream = d.access.primitiveStreams[streamName];
							var bufferName = stream.buffer;
							if (bufferName) {
								bufferMap[bufferName] = bufferMap[bufferName] || [ ];
								bufferMap[bufferName].push(stream);
							}
							else {
								primitiveStreamsInfo.array.push(stream);
							}
						}
						for (var bufferName in bufferMap) {
							var bufferInfo = {
								buffer  : d.data.indexBuffers[bufferName],
								streams : bufferMap[bufferName].slice()
							};
							primitiveStreamsInfo.buffered.push(bufferInfo);
						}
					}
				}
			}
		}

		this._renderData = renderData;
	}
};

SpiderGL.Type.extend(SpiderGL.Model.Model, SpiderGL.Core.ObjectBase);

/**
 * Creates a SpiderGL.Model.Technique.
 *
 * @class The SpiderGL.Model.Technique handles the way a model is drawn.
 *
 * @augments SpiderGL.Core.ObjectBase
 */
SpiderGL.Model.Technique = function (gl, descriptor, options) {
	SpiderGL.Core.ObjectBase.call(this);

	options = SpiderGL.Utility.getDefaultObject({
	}, options);

	if (descriptor && ("vertexShader" in descriptor) && ("fragmentShader" in descriptor)) {
		descriptor = SpiderGL.Model.Technique._createSimpleDescriptor(gl, descriptor);
	}

	this._descriptor = SpiderGL.Model.Technique._fixDescriptor(descriptor);
	this._gl = this._descriptor.program.gl;
	this._renderData = { };

	if (gl) {
		this.updateRenderData();
	}
};

SpiderGL.Model.Technique._fixDescriptor = function (d) {
	d = SpiderGL.Utility.getDefaultObject({
		name     : "common",
		program  : null,
		semantic : { }
	}, d);

	if (d.vertexStreams) {
		d.semantic.vertexStreams = d.vertexStreams;
		delete d.vertexStreams;
	}

	if (d.globals) {
		d.semantic.globals = d.globals;
		delete d.globals;
	}

	d.semantic = SpiderGL.Model.Technique._fixSemantic(d.program, d.semantic);

	return d;
};

SpiderGL.Model.Technique._fixSemantic = function (p, d) {
	d = SpiderGL.Utility.getDefaultObject({
		vertexStreams : null,
		globals       : null
	}, d);

	d.vertexStreams = SpiderGL.Model.Technique._fixVertexStreams (p, d.vertexStreams);
	d.globals       = SpiderGL.Model.Technique._fixGlobals       (p, d.globals);

	return d;
};

SpiderGL.Model.Technique._fixVertexStreams = function (p, d) {
	var num = "0123456789";
	//var lwr = "abcdefghijklmnopqrstuvwxyz";
	//var upr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	var attribNames = p.getAttributesNames();
	var requiredAttribs = { };
	for (var i=0, n=attribNames.length; i<n; ++i) {
		var attribName  = attribNames[i];

		var semanticStr = "";
		var indexStr    = "";

		for (var j=attribName.length-1; j>=0; --j) {
			var ch = attribName.charAt(j);
			if (num.indexOf(ch, 0) == -1) {
				semanticStr = attribName.substring(0, j + 1);
				break;
			}
			indexStr = ch + indexStr;
		}
		var index = ((indexStr.length > 0) ? (parseInt(indexStr)) : (0));

		var len = semanticStr.length;
		if (len >= 2) {
			if (semanticStr.charAt(0) == "a") {
				var ch = semanticStr.charAt(1);
				if ((ch == "_") && (len > 2)) {
					semanticStr = semanticStr.substring(2);
				}
				else if (ch == semanticStr.charAt(1).toUpperCase()) {
					semanticStr = semanticStr.substring(1);
				}
			}
		}
		var semantic = semanticStr.toUpperCase();
		requiredAttribs[attribName] = {
			semantic : semantic,
			index    : index,
			value    : [0.0, 0.0, 0.0, 1.0]
		};
	}

	var dd = { };
	for (var x in d) {
		var r = requiredAttribs[x];
		if (!r) continue;

		var s = d[x];
		if (SpiderGL.Type.isString(s)) {
			s = { semantic : s };
		}
		else if (SpiderGL.Type.isArray(s) || SpiderGL.Type.isTypedArray(s)) {
			s = { value : s };
		}
		else if (SpiderGL.Type.isNumber(s)) {
			s = { value : [s, s, s, s] };
		}
		dd[x] = SpiderGL.Utility.getDefaultObject({
			semantic : r.semantic,
			index    : r.index,
			value    : r.value
		}, s);
	}

	d = SpiderGL.Utility.getDefaultObject(requiredAttribs, dd);
	return d;
};

SpiderGL.Model.Technique._fixGlobals = function (p, d) {
	var uniformValues = p.getUniformsValues();
	var requiredUniforms = { };
	for (var uniformName in uniformValues) {
		var semanticStr = uniformName;
		var len = semanticStr.length;
		if (len >= 2) {
			if (semanticStr.charAt(0) == "u") {
				var ch = semanticStr.charAt(1);
				if ((ch == "_") && (len > 2)) {
					semanticStr = semanticStr.substring(2);
				}
				else if (ch == semanticStr.charAt(1).toUpperCase()) {
					semanticStr = semanticStr.substring(1);
				}
			}
		}
		var semantic = semanticStr.toUpperCase();
		requiredUniforms[uniformName] = {
			semantic : semantic,
			value    : uniformValues[uniformName]
		};
	};

	d = SpiderGL.Utility.getDefaultObject(requiredUniforms, d);
	return d;
};

SpiderGL.Model.Technique._createSimpleDescriptor = function (gl, options) {
	options = SpiderGL.Utility.getDefaultObject({
		name           : "common",
		vertexShader   : null,
		fragmentShader : null,
		attributes     : null,
		uniforms       : null,
		semantic       : { },
		vertexStreams  : null,
		globals        : null,
		options        : null
	}, options);

	if (options.vertexStreams) {
		options.semantic.vertexStreams = options.vertexStreams;
		delete options.vertexStreams;
	}

	if (options.globals) {
		options.semantic.globals = options.globals;
		delete options.globals;
	}

	var d = {
		name     : options.name,
		program  : null,
		semantic : options.semantic
	};

	if (!gl) {
		return d;
	}

	var vertexShader = options.vertexShader;
	var fragmentShader = options.fragmentShader;

	if (!vertexShader || !fragmentShader) {
		return d;
	}

	if (SpiderGL.Type.isString(vertexShader)) {
		vertexShader = new SpiderGL.WebGL.VertexShader(gl, vertexShader);
	}
	else if (!SpiderGL.Type.instanceOf(vertexShader, SpiderGL.WebGL.VertexShader)) {
		return d;
	}

	if (SpiderGL.Type.isString(fragmentShader)) {
		fragmentShader = new SpiderGL.WebGL.FragmentShader(gl, fragmentShader);
	}
	else if (!SpiderGL.Type.instanceOf(fragmentShader, SpiderGL.WebGL.FragmentShader)) {
		return d;
	}

	var program = new SpiderGL.WebGL.Program(gl, {
		shaders    : [ vertexShader, fragmentShader ],
		attributes : options.attributes,
		uniforms   : options.uniforms
	});

	d.program = program;

	return d;
};

SpiderGL.Model.Technique.prototype = {
	get descriptor() {
		return this._descriptor;
	},

	get isReady() {
		return !!this._descriptor;
	},

	get gl() {
		return this._gl;
	},

	get name() {
		return this._descriptor.name;
	},

	get renderData() {
		return this._renderData;
	},

	get program() {
		return this._descriptor.program;
	},

	setUniforms : function (uniforms) {
		this._descriptor.program.setUniforms(uniforms);
	},

	updateRenderData : function () {
		var d = this._descriptor;

		var renderData = { };
		this._renderData = renderData;

		var attributesMap = { };
		renderData.attributesMap = attributesMap;
		var attributesIndices = d.program.getAttributesIndices();
		for (var attribName in d.semantic.vertexStreams) {
			var semanticInfo = d.semantic.vertexStreams[attribName];
			var semanticName = semanticInfo.semantic;
			var attribs = attributesMap[semanticName];
			if (!attribs) {
				attribs = [ ];
				attributesMap[semanticName] = attribs;
			}
			attribs[semanticInfo.index] = {
				index : attributesIndices[attribName],
				value : semanticInfo.value
			};
		}

		var globalsMap = { };
		renderData.globalsMap = globalsMap;
		for (var uniformName in d.semantic.globals) {
			var semanticInfo = d.semantic.globals[uniformName];
			globalsMap[semanticInfo.semantic] = {
				name  : uniformName,
				value : semanticInfo.value
			};
		}
	}
};

/**
 * Creates a SpiderGL.Model.Technique.
 *
 * @class The SpiderGL.Model.Technique handles the way a model is drawn.
 *
 * @augments SpiderGL.Core.ObjectBase
 */
SpiderGL.Model.ModelRenderer = function (gl) {
	this._gl = gl;
	this._vertexAttributesCount = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	this._textureUnitsCount     = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
	this._internalFramebuffer   = new SpiderGL.WebGL.Framebuffer(gl);
	this._reset();
};

SpiderGL.Model.ModelRenderer.prototype = {
	_reset : function () {
		this._technique        = null;
		this._model            = null;
		this._partName         = null;
		this._chunkName        = null;
		this._primMode         = null;
		this._framebuffer      = null;

		this._inBegin          = false;

		this._enabledArrays    = [ ];
		this._boundTextures    = [ ];
		this._attribValues     = [ ];
		this._primitiveStreams = [ ];

		this._techniqueDirty   = true;
		this._modelDirty       = true;
		this._modelPartDirty   = true;
		this._modelChunkDirty  = true;
		this._primModeDirty    = true;
		this._framebufferDirty = true;
		this._viewportDirty    = true;

		this._dirty            = true;
	},

	_resetContext : function () {
		var gl = this._gl;

		for (var i=0, n=this._vertexAttributesCount; i<n; ++i) {
			gl.disableVertexAttribArray(i);
		}

		for (var i=this._textureUnitsCount-1; i>=0; --i) {
			gl.activeTexture(gl.TEXTURE0 + i);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
		}

		SpiderGL.WebGL.VertexBuffer .unbind(gl);
		SpiderGL.WebGL.IndexBuffer  .unbind(gl);
		SpiderGL.WebGL.Program      .unbind(gl);
		SpiderGL.WebGL.Framebuffer  .unbind(gl);
	},

	_update : function () {
		if (!this._dirty) return true;

		var gl = this._gl;

		if (this._techniqueDirty) {
			var technique = this._technique;
			if (!technique) return false;

			var techniqueRenderData = technique.renderData;
			var attributesMap = techniqueRenderData.attributesMap;
			var attribValues = [ ];
			for (var semantic in attributesMap) {
				var attribs = attributesMap[semantic];
				for (var i in attribs) {
					var attribInfo = attribs[i];
					var attribData = null;
					if (attribInfo) {
						attribData = {
							index : attribInfo.index,
							value : attribInfo.value
						};
					}
					attribValues.push(attribData);
				}
			}
			this._attribValues = attribValues;

			technique.program.bind();

			this._techniqueDirty = false;
		}

		if (this._modelDirty) {
			var model = this._model;
			if (!model) return false;

			// default vertex attributes
			//////////////
			var attribValues = this._attribValues;
			for (var i=0, n=attribValues.length; i<n; ++i) {
				var attribData = attribValues[i];
				if (!attribData) continue;
				gl.vertexAttrib4fv(attribData.index, attribData.value);
			}
			//////////////

			var modelRenderData = model.renderData;

			var technique = this._technique;
			if (!technique) return false;

			var techniqueRenderData = technique.renderData;
			if (!techniqueRenderData) return false;
			var attributesMap = techniqueRenderData.attributesMap;

			if (this._modelPartDirty) {
				var partName = this._partName;
				if (!partName) return false;
				this._modelPartDirty = false;
			}

			if (this._modelChunkDirty) {
				var chunkName = this._chunkName;
				if (!chunkName) return false;

				var partInfo = modelRenderData.partMap[this._partName];
				if (!partInfo) return false;

				var chunkInfo = partInfo[chunkName];
				if (!chunkInfo) return false;

				var techniqueInfo = chunkInfo[technique.name];
				if (!techniqueInfo) {
					techniqueInfo = chunkInfo["common"];
				}
				if (!techniqueInfo) return false;

				// buffered vertex streams
				//////////////
				var enabledArrays = this._enabledArrays;
				for (var i=0, n=enabledArrays.length; i<n; ++i) {
					gl.disableVertexAttribArray(enabledArrays[i]);
				}
				enabledArrays = [ ];
				var streams = techniqueInfo.vertexStreams.buffered;
				for (var i=0, n=streams.length; i<n; ++i) {
					var data   = streams[i];
					var buffer = data.buffer.glBuffer;
					buffer.bind();

					var infos = data.streams;
					for (var j=0, m=infos.length; j<m; ++j) {
						var info   = infos[j];
						if (!attributesMap[info.semantic] || !attributesMap[info.semantic][info.index]) continue;
						var index  = attributesMap[info.semantic][info.index].index;
						var stream = info.stream;
						enabledArrays.push(index);
						buffer.vertexAttribPointer(index, stream);
						//gl.enableVertexAttribArray(index);
						//gl.vertexAttribPointer(index, stream.size, stream.glType, stream.normalized, stream.stride, stream.offset);
					}
				}
				this._enabledArrays = enabledArrays;
				//////////////

				// constant vertex streams
				//////////////
				var infos = techniqueInfo.vertexStreams.constant;
				for (var j=0, n=infos.length; j<n; ++j) {
					var info   = infos[j];
					if (!attributesMap[info.semantic] || !attributesMap[info.semantic][info.index]) continue;
					var index  = attributesMap[info.semantic][info.index].index;
					var stream = info.stream;
					gl.vertexAttrib4fv(index, stream.value);
				}
				//////////////

				this._modelChunkDirty = false;
			}

			if (this._primModeDirty) {
				var primMode = this._primMode;
				if (!primMode) return false;

				var partInfo = modelRenderData.partMap[this._partName];
				if (!partInfo) return false;

				var chunkInfo = partInfo[this._chunkName];
				if (!chunkInfo) return false;

				var techniqueInfo = chunkInfo[technique.name];
				if (!techniqueInfo) {
					techniqueInfo = chunkInfo["common"];
				}
				if (!techniqueInfo) return false;

				var primitiveStreams = techniqueInfo.primitiveStreams[primMode];
				if (!primitiveStreams) return false;

				// primitive streams
				/////////////////////////////////////////////////
				this._primitiveStreams = primitiveStreams;

				this._primModeDirty = false;
			}

			this._modelDirty = false;
		}

		if (this._framebufferDirty) {
			if (this._framebuffer) {
				this._framebuffer.bind();
			}
			else {
				SpiderGL.WebGL.Framebuffer.unbind(gl);
			}
			this._framebufferDirty = false;
		}

		if (this._viewportDirty) {
			if (this._framebuffer) {
				if (this._framebuffer.autoViewport) {
					this._framebuffer.applyViewport();
				}
			}
			this._viewportDirty = false;
		}

		this._dirty = false;

		return true;
	},

	get gl() {
		return this._gl;
	},

	get isValid() {
		return (!!this._gl);
	},

	destroy : function () {
		this.end();
		this._internalFramebuffer.destroy();
		this._internalFramebuffer = null;
		this._gl = null;
	},

	begin : function () {
		if (this._inBegin) return;
		this._resetContext();
		this._inBegin = true;
	},

	end : function () {
		if (!this._inBegin) return;
		this._inBegin = false;
		var gl = this._gl;

		var enabledArrays = this._enabledArrays;
		for (var i=0, n=enabledArrays.length; i<n; ++i) {
			gl.disableVertexAttribArray(enabledArrays[i]);
		}

		var boundTextures = this._boundTextures;
		for (var i=0, n=boundTextures.length; i<n; ++i) {
			var tex = boundTextures[i];
			if (!tex) continue;
			if (tex.target == gl.TEXTURE_2D) {
				SpiderGL.WebGL.Texture2D.unbind(gl, tex.unit);
			}
			else if (tex.target == gl.TEXTURE_CUBE_MAP) {
				SpiderGL.WebGL.TextureCubeMap.unbind(gl, tex.unit);
			}
		}

		this._internalFramebuffer.detachAll();

		this._reset();
		this._resetContext();
	},

	get isInBegin() {
		return this._inBegin;
	},

	setTechnique : function (t) {
		if (!this._inBegin) return;
		if (this._technique == t) return;
		this._technique = t;
		this._techniqueDirty = true;
		this._dirty = true;

		if (!t) {
			SpiderGL.WebGL.Program.unbind(this._gl);
		}
	},

	get technique() {
		return this._technique;
	},

	setModel : function (m) {
		if (!this._inBegin) return;
		if (this._model == m) return;
		this._model = m;
		this._modelDirty = true;
		this._modelPartDirty = true;
		this._modelChunkDirty = true;
		this._dirty = true;
	},

	get model() {
		return this._model;
	},

	setPart : function (p) {
		if (!this._inBegin) return;
		if (this._part == p) return;
		this._partName = p;
		this._modelPartDirty = true;
		this._modelDirty = true;
		this._dirty = true;
	},

	get part() {
		return this._partName;
	},

	setChunk : function (c) {
		if (!this._inBegin) return;
		if (this._chunk == c) return;
		this._chunkName = c;
		this._modelDirty = true;
		this._modelChunkDirty = true;
		this._primModeDirty = true;
		this._dirty = true;
	},

	get chunk() {
		return this._chunkName;
	},

	setPrimitiveMode : function (m) {
		if (!this._inBegin) return;
		if (this._primMode == m) return;
		this._primMode = m;
		this._primModeDirty = true;
		this._modelDirty = true;
		this._dirty = true;
	},

	get primitiveMode() {
		return this._primMode;
	},

	setUniforms : function (u) {
		if (!this._inBegin) return;
		if (!this._technique) return;
		this._technique.program.setUniforms(u);
	},

	setDefaultGlobals : function () {
		if (!this._inBegin) return;

		var technique = this._technique;
		if (!technique) return;

		var globalsMap = technique.renderData.globalsMap;
		var uniforms = { };
		for (var semantic in globalsMap) {
			var uniformName  = globalsMap[semantic].name;
			var uniformValue = globalsMap[semantic].value;
			uniforms[uniformName] = uniformValue;
		}

		technique.program.setUniforms(uniforms);
	},

	setGlobals : function (g) {
		if (!this._inBegin) return;
		if (!g) return;

		var technique = this._technique;
		if (!technique) return;

		var globalsMap = technique.renderData.globalsMap;
		var uniforms = { };
		for (var semantic in g) {
			var uniformName  = globalsMap[semantic].name;
			var uniformValue = g[semantic];
			uniforms[uniformName] = uniformValue;
		}

		technique.program.setUniforms(uniforms);
	},

	setFramebuffer : function (fb) {
		if (!this._inBegin) return;

		this._internalFramebuffer.detachAll();
		if (this._framebuffer == fb) return;

		this._framebuffer = fb;
		this._framebufferDirty = true;
		this._viewportDirty = true;
		this._dirty = true;

		if (!fb) {
			SpiderGL.WebGL.Framebuffer.unbind(this._gl);
		}
	},

	activateOffScreenFramebuffer : function () {
		this.setFramebuffer(this._internalFramebuffer);
	},

	activateMainFramebuffer : function () {
		return this.setFramebuffer(null);
	},

	setFramebufferAttachments : function (attachments) {
		if (!this._inBegin) return;
		if (!this._framebuffer) return;
		this._framebuffer.setAttachments(attachments);
		this._framebufferDirty = true;
		this._viewportDirty = true;
	},

	setColorRenderTarget : function (rt) {
		if (!this._inBegin) return;
		if (!this._framebuffer) return;
		this._framebuffer.colorTarget = rt;
		this._viewportDirty = true;
		this._dirty = true;
	},

	setDepthRenderTarget : function (rt) {
		if (!this._inBegin) return;
		if (!this._framebuffer) return;
		this._framebuffer.depthTarget = rt;
		this._viewportDirty = true;
		this._dirty = true;
	},

	setStencilRenderTarget : function (rt) {
		if (!this._inBegin) return;
		if (!this._framebuffer) return;
		this._framebuffer.stencilTarget = rt;
		this._viewportDirty = true;
		this._dirty = true;
	},

	setDepthStencilRenderTarget : function (rt) {
		if (!this._inBegin) return;
		if (!this._framebuffer) return;
		this._framebuffer.depthStencilTarget = rt;
		this._viewportDirty = true;
		this._dirty = true;
	},

	clearFramebuffer : function (options) {
		if (!this._inBegin) return;
		if (!options) return;
		var gl   = this._gl;
		var mask = 0;
		if (SpiderGL.Type.isNumber(options)) {
			mask = options;
		}
		else {
			if ("color" in options) {
				var color = options.color;
				if (color) {
					gl.clearColor(color[0], color[1], color[2], color[3]);
				}
				mask |= gl.COLOR_BUFFER_BIT;
			}
			if ("depth" in options) {
				var depth = options.depth;
				if (SpiderGL.Type.isNumber(depth)) {
					gl.clearDepth(depth);
				}
				mask |= gl.DEPTH_BUFFER_BIT;
			}
			if ("stencil" in options) {
				var stencil = options.stencil;
				if (SpiderGL.Type.isNumber(stencil)) {
					gl.clearStencil(stencil);
				}
				mask |= gl.Stencil_BUFFER_BIT;
			}
		}
		if (mask) {
			var fb = this._framebuffer;
			if (fb) {
				fb.clear(mask);
			}
			else {
				gl.clear(mask);
			}
		}
	},

	setViewport : function (x, y, width, height) {
		if (!this._inBegin) return;
		var gl = this._gl;
		gl.viewport(x, y, width, height);
	},

	setTexture : function (unit, texture) {
		if (texture) {
			texture.bind(unit);
		}
		else {
			var gl = this._gl;
			SpiderGL.WebGL.Texture2D.unbind(gl, unit);
			SpiderGL.WebGL.TextureCubeMap.unbind(gl, unit);
		}
	},

	get canRender() {
		return (!!this._inBegin && !!this._technique && !!this._model && !!this._partName && !!this._chunkName && !!this._primMode);
	},

	render : function () {
		if (!this.canRender) return;
		if (!this._update()) return;

		var gl = this._gl;

		var primitiveStreams = this._primitiveStreams;

		var bufferedStreams = primitiveStreams.buffered;
		var arrayStreams    = primitiveStreams.array;

		// buffered
		//////////////
		for (var i=0, n=bufferedStreams.length; i<n; ++i) {
			var data = bufferedStreams[i];
			var buffer = data.buffer.glBuffer;
			buffer.bind();

			var infos = data.streams;
			for (var j=0, m=infos.length; j<m; ++j) {
				var stream = infos[j];
				//gl.drawElements(stream.glMode, stream.count, stream.glType, stream.offset);
				buffer.drawElements(stream);
			}
		}
		//////////////

		// array
		//////////////
		for (var j=0, n=arrayStreams.length; j<n; ++j) {
			var stream = arrayStreams[j];
			gl.drawArrays(stream.glMode, stream.first, stream.count);
		}
		//////////////
	},

	renderModel : function() {
		var parts = this.model.descriptor.logic.parts;
		for (var partName in parts) {
			var part = parts[partName];
			this.setPart(partName);
			for (var c in part.chunks) {
				var chunkName = part.chunks[c];
				this.setChunk(chunkName);
				this.render();
			}
		}
	}
};
