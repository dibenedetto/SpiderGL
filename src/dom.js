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
 * @fileOverview DOM
 */

/**
 * The SpiderGL.DOM namespace.
 *
 * @namespace The SpiderGL.DOM namespace.
 */
SpiderGL.DOM = { };

/**
 * Gets a document element object by id.
 *
 * The returned element object is retrieved by a direct call to document.getElementById(id).
 *
 * @param {string} id The element id.
 * @return {Element} The document element.
 */
SpiderGL.DOM.getElementById = function (elementId) {
	return document.getElementById(elementId);
}

/**
 * Gets the text of a document element.
 *
 * The returned text is retrieved by concatenating the text content of internal element nodes.
 *
 * @param {string} id The element id.
 * @return {string} The text contained in the document element.
 */
SpiderGL.DOM.getElementText = function (elementId) {
	var elem = document.getElementById(elementId);
	if (!elem) return null;

	var str = "";
	elem = elem.firstChild;
	while (elem) {
		if (elem.nodeType == 3) {
			str += elem.textContent;
		}
		elem = elem.nextSibling;
	}

	return str;
}

