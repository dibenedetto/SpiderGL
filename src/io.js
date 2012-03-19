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
 * @fileOverview IO
 */

/**
 * The SpiderGL.IO namespace.
 *
 * @namespace The SpiderGL.IO namespace.
 */
SpiderGL.IO = { };

/**
 * Creates a SpiderGL.IO.Request.
 *
 * SpiderGL.IO.Request is the base class for I/O requests.
 *
 * @class The SpiderGL.IO.Request is the base class for I/O requests.
 *
 * @augments SpiderGL.Core.ObjectBase
 */
SpiderGL.IO.Request = function (url, options) {
	SpiderGL.Core.ObjectBase.call(this);

	options = SpiderGL.Utility.getDefaultObject({
		async      : SpiderGL.IO.Request.DEFAULT_ASYNC,
		send       : SpiderGL.IO.Request.DEFAULT_SEND,
		onProgress : null,
		onCancel   : null,
		onError    : null,
		onSuccess  : null,
		onFinish   : null
	}, options);

	this._url     = url;
	this._async   = options.async;
	this._status  = SpiderGL.IO.Request.NONE;
	this._sent    = false;
	this._aborted = false;
	this._data    = null;
	this._loaded  = 0;
	this._total   = 0;

	this._events = {
		progress : { main : null, listeners : [ ] },
		cancel   : { main : null, listeners : [ ] },
		error    : { main : null, listeners : [ ] },
		success  : { main : null, listeners : [ ] },
		finish   : { main : null, listeners : [ ] }
	};

	this.onProgress = options.onProgress;
	this.onCancel   = options.onCancel;
	this.onError    = options.onError;
	this.onSuccess  = options.onSuccess;
	this.onFinish   = options.onFinish;
};

SpiderGL.IO.Request.NONE      = 0;
SpiderGL.IO.Request.ONGOING   = 1;
SpiderGL.IO.Request.CANCELLED = 2;
SpiderGL.IO.Request.FAILED    = 3;
SpiderGL.IO.Request.SUCCEEDED = 4;

SpiderGL.IO.Request.DEFAULT_ASYNC = true;
SpiderGL.IO.Request.DEFAULT_SEND  = true;

SpiderGL.IO.Request.prototype = {
	_indexOf : function (handlers, h) {
		for (var i=0, n=handlers.length; i<n; ++i) {
			if (handlers[i] == h) {
				return i;
			}
		}
		return -1;
	},

	_setMainListener : function (eventName, eventHandler) {
		var evt = this._events[eventName];
		if (!evt) return;
		if (evt.main == eventHandler) return;
		if (eventHandler) { this.addEventListener(eventName, eventHandler); }
		else { this.removeEventListener(eventName, eventHandler); }
		evt.main = eventHandler;
	},

	_dispatch : function () {
		var name = arguments[0];
		var evt  = this._events[name];
		if (!evt) return;
		var args = Array.prototype.slice.call(arguments, 1);
		args.push(this);
		var lst  = evt.listeners;
		for (var i=0, n=lst.length; i<n; ++i) {
			lst[i].apply(null, args);
		}
	},

	_doPostProgress : function () {
	},

	_doPostCancel : function () {
	},

	_doPostError : function () {
	},

	_doPostSuccess : function () {
	},

	_doPostFinish : function () {
	},

	_doOnProgress : function (loaded, total) {
		if (this._aborted) return;
		this._loaded = loaded;
		this._total  = total;
		this._doPostProgress();
		this._dispatch("progress", this._loaded, this._total);
	},

	_doOnCancel : function () {
		if (this._aborted) return;
		this._status = SpiderGL.IO.Request.CANCELLED;
		this._finishTime = SpiderGL.Utility.getTime();
		this._doPostCancel();
		this._dispatch("cancel");
	},

	_doOnError : function () {
		if (this._aborted) return;
		this._status = SpiderGL.IO.Request.FAILED;
		this._finishTime = SpiderGL.Utility.getTime();
		this._doPostError();
		this._dispatch("error");
	},

	_doOnSuccess : function () {
		if (this._aborted) return;
		this._status = SpiderGL.IO.Request.SUCCEEDED;
		this._finishTime = SpiderGL.Utility.getTime();
		this._doPostSuccess();
		this._dispatch("success");
	},

	_doOnFinish : function () {
		this._doPostFinish();
		this._dispatch("finish");
	},

	_doSend : function () {
		return false;
	},

	_doCancel : function () {
		return false;
	},

	get canSend() {
		return (this._url && !this._sent);
	},

	get url() {
		return this._url;
	},

	set url(s) {
		this.cancel();
		this._url = s;
	},

	get status() {
		return this._status;
	},

	get data() {
		return this._data;
	},

	get bytesLoaded() {
		return this._loaded;
	},

	get bytesTotal() {
		return this._total;
	},

	get sent() {
		return this._sent;
	},

	get ongoing() {
		return (this._status == SpiderGL.IO.Request.ONGOING);
	},

	get cancelled() {
		return (this._status == SpiderGL.IO.Request.CANCELLED);
	},

	get failed() {
		return (this._status == SpiderGL.IO.Request.FAILED);
	},

	get succeeded() {
		return (this._status == SpiderGL.IO.Request.SUCCEEDED);
	},

	get finished() {
		return (this.succeeded || this.failed || this.cancelled);
	},

	get startTime() {
		return this._startTime;
	},

	get finishTime() {
		return this._finishTime;
	},

	get elapsedTime() {
		if (this._startTime < 0) return 0;
		if (this._finishTime < 0) return (SpiderGL.Utility.getTime() - this._startTime);
		return (this._finishTime - this._startTime);
	},

	addEventListener : function (eventName, eventHandler) {
		if (!eventHandler) return;
		var evt = this._events[eventName];
		if (!evt) return;
		var idx = this._indexOf(evt.listeners, eventHandler);
		if (idx >= 0) return;
		evt.listeners.push(eventHandler);
	},

	removeEventListener : function (eventName, eventHandler) {
		var evt = this._events[eventName];
		if (!evt) return;
		var idx = this._indexOf(evt.listeners, eventHandler);
		if (idx < 0) return;
		evt.listeners.splice(idx, 1);
	},

	get onProgress() {
		return this._events.progress.main;
	},

	set onProgress(f) {
		this._setMainListener("progress", f);
	},

	get onCancel() {
		return this._events.cancel.main;
	},

	set onCancel(f) {
		this._setMainListener("cancel", f);
	},

	get onError() {
		return this._events.error.main;
	},

	set onError(f) {
		this._setMainListener("error", f);
	},

	get onSuccess() {
		return this._events.success.main;
	},

	set onSuccess(f) {
		this._setMainListener("success", f);
	},

	get onFinish() {
		return this._events.finish.main;
	},

	set onFinish(f) {
		this._setMainListener("finish", f);
	},

	cancel : function () {
		if (!this.ongoing) { return false; }
		this._status  = SpiderGL.IO.Request.CANCELLED;
		this._aborted = true;
		var r = this._doCancel();
		this._finishTime = SpiderGL.Utility.getTime();
		return r;
	},

	send : function () {
		if (!this.canSend) { return false; }
		this._data       = null;
		this._status     = SpiderGL.IO.Request.ONGOING;
		this._aborted    = false;
		this._sent       = true;
		this._finishTime = -1;
		this._startTime  = SpiderGL.Utility.getTime();
		var r = this._doSend();
		if (!r) {
			this._startTime = -1;
			this._status = SpiderGL.IO.Request.NONE;
			this._sent = false;
		};
		return r;
	}
};

SpiderGL.Type.extend(SpiderGL.IO.Request, SpiderGL.Core.ObjectBase);

/**
 * Creates a SpiderGL.IO.XHRRequestBase.
 *
 * SpiderGL.IO.XHRRequestBase is the base class for I/O requests.
 *
 * @class The SpiderGL.IO.XHRRequestBase is the base class for I/O requests.
 *
 * @augments SpiderGL.IO.Request
 */
SpiderGL.IO.XHRRequestBase = function (url, options) {
	options = options || { };
	SpiderGL.IO.Request.call(this, url, options);

	var that = this;

	var xhr = new XMLHttpRequest();
	this._xhr = xhr;

	xhr.onprogress = function (evt) { that._xhrOnProgress(evt); };
	xhr.onabort    = function ()    { that._doOnCancel(); that._doOnFinish(); };
	xhr.onerror    = function ()    { that._doOnError();  that._doOnFinish(); };
	xhr.onload     = function ()    {
		var status = xhr.status;
		if ((status === 0) || (status === 200) || (!!that._range && (status == 206))) {
			that._doOnSuccess();
		}
		else {
			that._doOnError();
		}
		that._doOnFinish();
	};

	this._range = null;

	this._xhr.open("GET", this._url, this._async);

	if ("range" in options) {
		this._range = [ options.range[0], options.range[1] ];
		var rangeStr = "bytes=" + options.range[0] + "-" + options.range[1];
		xhr.setRequestHeader("Range", rangeStr);
	}

	this._prepareXHR();

	var send = SpiderGL.Utility.getDefaultValue(options.send, SpiderGL.IO.Request.DEFAULT_SEND);
	if (send) {
		this.send();
	}
};

SpiderGL.IO.XHRRequestBase.prototype = {
	_prepareXHR : function () {
	},

	_doCancel : function () {
		this._xhr.abort();
		this._xhr = new XMLHttpRequest();
		this._xhr.open("GET", this._url, this._async);
		this._prepareXHR();
		return true;
	},

	_doSend : function () {
		this._xhr.send();
		return true;
	},

	_xhrOnProgress : function (evt) {
		var loaded = 0;
		var total  = 0;
		if (evt && evt.lengthComputable) {
			loaded = evt.loaded;
			total  = evt.total;
		}
		this._doOnProgress(loaded, total);
	}
};

SpiderGL.Type.extend(SpiderGL.IO.XHRRequestBase, SpiderGL.IO.Request);

/**
 * Creates a SpiderGL.IO.XHRRequest.
 *
 * SpiderGL.IO.XHRRequest is the base class for I/O requests.
 *
 * @class The SpiderGL.IO.XHRRequest is the base class for I/O requests.
 *
 * @augments SpiderGL.IO.XHRRequestBase
 */
SpiderGL.IO.XHRRequest = function (url, options) {
	SpiderGL.IO.XHRRequestBase.call(this, url, options);
};

SpiderGL.IO.XHRRequest.prototype = {
	_doPostSuccess : function () {
		this._data = this._xhr.responseText;
	},

	get xhr() {
		return this._xhr;
	},

	get response() {
		return this.data;
	}
};

SpiderGL.Type.extend(SpiderGL.IO.XHRRequest, SpiderGL.IO.XHRRequestBase);

/**
 * Creates a SpiderGL.IO.TextRequest.
 *
 * SpiderGL.IO.TextRequest is the base class for I/O requests.
 *
 * @class The SpiderGL.IO.TextRequest is the base class for I/O requests.
 *
 * @augments SpiderGL.IO.XHRRequestBase
 */
SpiderGL.IO.TextRequest = function (url, options) {
	SpiderGL.IO.XHRRequestBase.call(this, url, options);
};

SpiderGL.IO.TextRequest.prototype = {
	_doPostSuccess : function () {
		this._data = this._xhr.responseText;
	},

	get text() {
		return this.data;
	}
};

SpiderGL.Type.extend(SpiderGL.IO.TextRequest, SpiderGL.IO.XHRRequestBase);

/**
 * Synchronous text read.
 * This function is equivalent to issuing a SpiderGL.IO.TextRequest with the async flag set to false and no callbacks, and then reading its text property.
 *
 * @param {string} url The URL of the content
 *
 * @returns {string} The text content, or null on failure.
 */
SpiderGL.IO.readText = function (url) {
	var r = new SpiderGL.IO.TextRequest(url, {async:false});
	return r.text;
};

/**
 * Creates a SpiderGL.IO.JSONRequest.
 *
 * SpiderGL.IO.JSONRequest is the base class for I/O requests.
 *
 * @class The SpiderGL.IO.JSONRequest is the base class for I/O requests.
 *
 * @augments SpiderGL.IO.XHRRequestBase
 */
SpiderGL.IO.JSONRequest = function (url, options) {
	SpiderGL.IO.XHRRequestBase.call(this, url, options);
};

SpiderGL.IO.JSONRequest.prototype = {
	_doPostSuccess : function () {
		this._data = JSON.parse(this._xhr.responseText);
	},

	get text() {
		return this._xhr.responseText;
	},

	get json() {
		return this.data;
	}
};

SpiderGL.Type.extend(SpiderGL.IO.JSONRequest, SpiderGL.IO.XHRRequestBase);

/**
 * Synchronous JSON object read.
 * This function is equivalent to issuing a SpiderGL.IO.JSONRequest with the async flag set to false and no callbacks, and then reading its json property.
 *
 * @param {string} url The URL of the content
 *
 * @returns {object} The JSON-parsed object, or null on failure.
 */
SpiderGL.IO.readJSON = function (url) {
	var r = new SpiderGL.IO.JSONRequest(url, {async:false});
	return r.json;
};

/**
 * Creates a SpiderGL.IO.BinaryRequest.
 *
 * SpiderGL.IO.BinaryRequest is the base class for I/O requests.
 *
 * @class The SpiderGL.IO.BinaryRequest is the base class for I/O requests.
 *
 * @augments SpiderGL.IO.XHRRequestBase
 */
SpiderGL.IO.BinaryRequest = function (url, options) {
	SpiderGL.IO.XHRRequestBase.call(this, url, options);
};

SpiderGL.IO.BinaryRequest.prototype = {
	_prepareXHR : function () {
		var xhr = this._xhr;
		var overrideMime = false;

		/*
		if (xhr.hasOwnProperty("responseType")) {
			try {
				xhr.responseType = "arraybuffer";
			}
			catch (e) {
				overrideMime = true;
			}
		}
		else {
				overrideMime = true;
		}
		*/

		if (overrideMime) {
			xhr.overrideMimeType("text/plain; charset=x-user-defined");
		}

		xhr.responseType = "arraybuffer";
	},

	_setArrayBuffer : function () {
		var xhr = this._xhr;

		if (xhr.responseType == "arraybuffer") {
			this._data = xhr.response;
		}
		else if (xhr.mozResponseArrayBuffer != null) {
			this._data = xhr.mozResponseArrayBuffer;
		}
		else if (xhr.responseText != null) {
			var data = new String(xhr.responseText);
			var arr  = new Array(data.length);
			for (var i=0, n=data.length; i<n; ++i) {
				arr[i] = data.charCodeAt(i) & 0xff;
			}
			this._data = (new Uint8Array(arr)).buffer;
		}
		else {
			this._data = null;
		}
	},

	_doPostSuccess : function () {
		this._setArrayBuffer();
	},

	get data() {
		if (this.ongoing) {
			this._setArrayBuffer();
		}
		return this._data;
	},

	get buffer() {
		return this.data;
	}
};

SpiderGL.Type.extend(SpiderGL.IO.BinaryRequest, SpiderGL.IO.XHRRequestBase);

/**
 * Synchronous binary data read.
 * This function is equivalent to issuing a SpiderGL.IO.BinaryRequest with the async flag set to false and no callbacks, and then reading its buffer property.
 *
 * @param {string} url The URL of the content
 *
 * @returns {ArrayBuffer} The content binary data, or null on failure.
 */
SpiderGL.IO.readBinary = function (url) {
	var r = new SpiderGL.IO.BinaryRequest(url, {async:false});
	return r.buffer;
};

/**
 * Creates a SpiderGL.IO.ImageRequest.
 *
 * SpiderGL.IO.ImageRequest is the base class for I/O requests.
 * The request is always asynchronous, meaning that the async flag is ignored.
 *
 * @class The SpiderGL.IO.ImageRequest is the base class for I/O requests.
 *
 * @augments SpiderGL.IO.Request
 */
SpiderGL.IO.ImageRequest = function (url, options) {
	options = options || { };
	SpiderGL.IO.Request.call(this, url, options);

	var that = this;

	var img = new Image();
	this._img  = img;
	this._data = img;

	img.onabort = function () { that._doOnCancel();  that._doOnFinish(); };
	img.onerror = function () { that._doOnError();   that._doOnFinish(); };
	img.onload  = function () { that._doOnSuccess(); that._doOnFinish(); };

	if (typeof img.onprogress != "undefined") {
		img.onprogress = function (evt) { that._imgOnProgress(evt); };
	}

	var send = SpiderGL.Utility.getDefaultValue(options.send, SpiderGL.IO.Request.DEFAULT_SEND);
	if (send) {
		this.send();
	}
};

SpiderGL.IO.ImageRequest.prototype = {
	_doPostSuccess : function () {
		this._data = this._img;
	},

	_doCancel : function () {
		this._img.src = null;
		this._img = new Image();
		return true;
	},

	_doSend : function () {
		this._img.src = this._url;
		return true;
	},

	_imgOnProgress : function (evt) {
		var loaded = 0;
		var total  = 0;
		if (evt && evt.lengthComputable) {
			loaded = evt.loaded;
			total  = evt.total;
		}
		this._doOnProgress(loaded, total);
	},

	get image() {
		return this.data;
	}
};

SpiderGL.Type.extend(SpiderGL.IO.ImageRequest, SpiderGL.IO.Request);

/**
 * Creates a SpiderGL.IO.AggregateRequest.
 *
 * SpiderGL.IO.AggregateRequest is the base class for I/O requests.
 *
 * @class The SpiderGL.IO.AggregateRequest is the base class for I/O requests.
 *
 * @augments SpiderGL.IO.Request
 */
SpiderGL.IO.AggregateRequest = function (options) {
	options = options || { };
	SpiderGL.IO.Request.call(this, "*", options);

	var that = this;

	this._proxyOnProgress = function (loaded, total, req) {
		that._reqOnProgress(loaded, total, req);
	};

	this._proxyOnCancel = function (req) {
		that._reqOnCancel(req);
	};

	this._proxyOnError = function (req) {
		that._reqOnError(req);
	};

	this._proxyOnSuccess = function (req) {
		that._reqOnSuccess(req);
	};

	this._proxyOnFinish = function (req) {
		that._reqOnFinish(req);
	};

	this._aggrStartTime  = -1;
	this._aggrFinishTime = -1;

	this._eventReq = null;
	this._cancelledReqs = 0;
	this._failedReqs    = 0;
	this._succeededReqs = 0;
	this._requests = [ ];
	var requests = options.requests;
	if (requests) {
		for (var i=0, n=requests.length; i<n; ++i) {
			var r = requests[i];
			if (r && !r.sent) {
				this._installProxies(r);
				this.addRequest(r);
			}
		}
	}

	var send = SpiderGL.Utility.getDefaultValue(options.send, SpiderGL.IO.Request.DEFAULT_SEND);
	if (send) {
		this.send();
	}
};

SpiderGL.IO.AggregateRequest.prototype = {
	_doPostCancel : function () {
		if (!this._requestsFinished) {
			this._status = SpiderGL.IO.Request.ONGOING;
		}
	},

	_doPostError : function () {
		if (!this._requestsFinished) {
			this._status = SpiderGL.IO.Request.ONGOING;
		}
	},

	_doPostSuccess : function () {
		if (!this._requestsFinished) {
			this._status = SpiderGL.IO.Request.ONGOING;
		}
	},

	_doCancel : function () {
		var requests = this._requests;
		for (var i=0, n=requests.length; i<n; ++i) {
			requests[i].cancel();
		}
		this._aggrFinishTime = SpiderGL.Utility.getTime();
	},

	_doSend : function () {
		this._aggrStartTime = SpiderGL.Utility.getTime();
		var requests = this._requests;
		for (var i=0, n=requests.length; i<n; ++i) {
			requests[i].send();
		}
	},

	get _requestsFinished() {
		return ((this._cancelledReqs + this._failedReqs + this._succeededReqs) == this._requests.length);
	},

	_installProxies : function (req) {
		req.addEventListener("progress", this._proxyOnProgress);
		req.addEventListener("cancel",   this._proxyOnCancel);
		req.addEventListener("error",    this._proxyOnError);
		req.addEventListener("success",  this._proxyOnSuccess);
		req.addEventListener("finish",   this._proxyOnFinish);
	},

	_uninstallProxies : function (req) {
		req.removeEventListener("progress", this._proxyOnProgress);
		req.removeEventListener("cancel",   this._proxyOnCancel);
		req.removeEventListener("error",    this._proxyOnError);
		req.removeEventListener("success",  this._proxyOnSuccess);
		req.removeEventListener("finish",   this._proxyOnFinish);
	},

	_reqOnProgress : function (loaded, total, req) {
		var idx = this._indexOf(this._requests, req);
		if (idx < 0) return;
		this._eventReq = req;
		this._doOnProgress(loaded, total);
		this._eventReq = null;
	},

	_reqOnCancel : function (req) {
		var idx = this._indexOf(this._requests, req);
		if (idx < 0) return;
		this._eventReq = req;
		//this._doOnCancel();
		this._cancelledReqs++;
		if (this._requestsFinished) {
			this._aggrFinishTime = SpiderGL.Utility.getTime();
			if (this._cancelledReqs == this._requests.length) {
				this._eventReq = this;
				this._doOnCancel();
			}
		}
		else {
		}
		this._eventReq = null;
	},

	_reqOnError : function (req) {
		var idx = this._indexOf(this._requests, req);
		if (idx < 0) return;
		this._eventReq = req;
		//this._doOnError();
		this._failedReqs++;
		if (this._requestsFinished) {
			this._aggrFinishTime = SpiderGL.Utility.getTime();
			this._eventReq = this;
			this._doOnError();
		}
		this._eventReq = null;
	},

	_reqOnSuccess : function (req) {
		var idx = this._indexOf(this._requests, req);
		if (idx < 0) return;
		this._eventReq = req;
		//this._doOnSuccess();
		this._succeededReqs++;
		if (this._requestsFinished) {
			this._aggrFinishTime = SpiderGL.Utility.getTime();
			this._eventReq = this;
			if (this._failedReqs > 0) {
				this._doOnError();
			}
			else {
				this._doOnSuccess();
			}
		}
		this._eventReq = null;
	},

	_reqOnFinish : function (req) {
		var idx = this._indexOf(this._requests, req);
		if (idx < 0) return;
		this._uninstallProxies(req);
		this._eventReq = req;
		//this._doOnFinish();
		if (this._requestsFinished) {
			this._eventReq = this;
			this._doOnFinish();
		}
		this._eventReq = null;
	},

	get eventSenderRequest() {
		return this._eventReq;
	},

	get requests() {
		return this._requests.slice();
	},

	get requests$() {
		return this._requests;
	},

	get startTime() {
		return this._aggrStartTime;
	},

	get finishTime() {
		return this._aggrFinishTime;
	},

	get elapsedTime() {
		if (this._aggrStartTime < 0) return 0;
		if (this._aggrFinishTime < 0) return (SpiderGL.Utility.getTime() - this._aggrStartTime);
		return (this._aggrFinishTime - this._aggrStartTime);
	},

	addRequest : function (r) {
		if (!r || this._sent) return;
		var idx = this._indexOf(this._requests, r);
		if (idx >= 0) return;
		this._requests.push(r);
	},

	removeRequest : function (r) {
		if (!r || this._sent) return;
		var idx = this._indexOf(this._requests, r);
		if (idx < 0) return;
		this._requests.splice(idx, 1);
	}
};

SpiderGL.Type.extend(SpiderGL.IO.AggregateRequest, SpiderGL.IO.Request);

