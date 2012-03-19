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
 * @fileOverview Version
 */

/**
 * The SpiderGL.Version namespace.
 *
 * @namespace The SpiderGL.Version namespace.
 */
SpiderGL.Version = { };

/**
 * Major version number.
 *
 * @constant
 * @type number
 */
SpiderGL.Version.VERSION_MAJOR = 0;

/**
 * Minor version number.
 *
 * @constant
 * @type number
 */
SpiderGL.Version.VERSION_MINOR = 2;

/**
 * Revision version number.
 *
 * @constant
 * @type number
 */
SpiderGL.Version.VERSION_REVISION = 0;

/**
 * Version string.
 *
 * The version string is: "{@link SpiderGL.Version.VERSION_MAJOR}.{@link SpiderGL.Version.VERSION_MINOR}.{@link SpiderGL.Version.VERSION_REVISION}"
 *
 * @constant
 * @type string
 */
SpiderGL.Version.VERSION_STRING = SpiderGL.Version.VERSION_MAJOR + "." + SpiderGL.Version.VERSION_MINOR + "." + SpiderGL.Version.VERSION_REVISION;

