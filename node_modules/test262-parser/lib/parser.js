// Copyright (C) 2014, Microsoft Corporation. All rights reserved.
// This code is governed by the BSD License found in the LICENSE file.
/*jslint regexp:true*/
'use strict';

var through = require('through'),
    yaml = require('js-yaml'),
    doneRegex = /\$DONE/,
    yamlStart = "/*---",
    yamlEnd = "---*/";

/**
 * @module Test262Parser
 */

/**
 * @class Test262File
 */
/**
 * filename
 * @property {string} file
 */
/**
 * test code
 * @property {string} contents
 */
/**
 * parsed, normalized attributes
 * @property {Test262FileAttrs} attrs
 */
/**
 * copyright message
 * @property {string} copyright
 */

/**
 * @class Test262FileAttrs
 */
/**
 * list of harness files to include
 * @attribute {Array} includes
 */
/**
 * test flags; valid values include:
 *   - onlyStrict
 *   - noStrict
 * @attribute {Object} flags
 */
/**
 * author name
 * @attribute {String} author
 * @optional
 */

/**
 * @class Test262Parser
 */

/**
 * Extract copyright message
 *
 * @method extractCopyright
 * @param {Test262File} file - file object
 * @return {string} the copyright string extracted from contents
 * @private
 */
function extractCopyright(file) {
    var result = /^(?:(?:\/\/.*\n)*)/.exec(file.contents);

    return result ? result[0] : "";
}


/**
 * Normalize a potential string into a file object
 * @method normalizeFile
 * @param {Test262File|string} file - file object or a string to convert into one
 * @return {Test262File} the file object if passed, or a Test262File with filename '<unknown>' if passed a string
 * @private
 */
function normalizeFile(file) {
    if (typeof file === 'string') {
        return { file: '<unknown>', contents: file };
    }
    return file;
}

/**
 * Extract YAML frontmatter from a test262 test
 * @method extractYAML
 * @param {string} text - text of test file
 * @return {string} the YAML frontmatter or empty string if none
 */
function extractYAML(text) {
    var start = text.indexOf(yamlStart),
        end;

    if (start > -1) {
        end = text.indexOf(yamlEnd);
        return text.substring(start + 5, end);
    }

    return "";
}


/**
 * Extract test body 
 *
 * @method extract
 * @param {Test262File} file - file object
 * @return {string} the test body (after all frontmatter)
 * @private
 */
function extractBody(file) {
    var text = file.contents,
        start = text.indexOf(yamlEnd);

    if (start > -1) {
        return text.substring(start + 5);
    }

    return text;
}

/**
 * Get async status
 *
 * @method isAsync
 * @param {Test262File} file - file object
 * @return {boolean} whether test is async
 * @private
 */
function isAsync(file) {
    return doneRegex.test(file.contents);
}

/**
 * Extract and parse frontmatter from a test
 * @method loadAttrs
 * @param {Test262File} file - file object
 * @return {Object} - raw, unnormalized attributes
 * @private
 */
function loadAttrs(file) {
    var y = extractYAML(file.contents);

    if (y) {
        try {
            return yaml.load(y);
        } catch (e) {
            throw new Error("Error loading frontmatter from file " +
                            file.file + "\n" + e.message);
        }
    }

    return {};
}

/**
 * Normalize attributes; ensure that flags, includes exist
 *
 * @method normalizeAttrs
 * @param {Object} attrs raw, unnormalized attributes
 * @return {Test262FileAttrs} normalized attributes
 * @private
 */
function normalizeAttrs(attrs) {
    attrs.flags = attrs.flags || [];
    attrs.flags = attrs.flags.reduce(function (acc, v) {
        acc[v] = true;
        return acc;
    }, {});

    attrs.includes = attrs.includes || [];

    return attrs;
}

/**
 * Parse a test file:
 *  - identify and parse frontmatter
 *  - set up normalized attributes
 *
 * @method parseFile
 * @param {Test262File|string} file - file object (only name, contents expected) or contents string
 * @return {Test262File} file object with attrs, async added
 * @throws Error if error parsing YAML
 */
function parseFile(file) {
    file = normalizeFile(file);

    file.attrs = normalizeAttrs(loadAttrs(file));

    file.async = isAsync(file);

    file.copyright = extractCopyright(file);

    file.contents = extractBody(file);

    file.isATest = (file.copyright !== "");

    return file;
}

/**
 * Adapter function to provide a stream interface
 *  - file object is read from input stream
 *  - use `parseFile` to parse front matter
 *  - successfully parsed files are queued to output stream
 *  - errors are emitted as 'error' events
 *
 * @method throughParseFile
 * @param {Test262File} file - file object (only name, contents expected)
 */
function throughParseFile(data) {
    try {
        this.queue(parseFile(data));
    } catch (e) {
        this.emit('error', e);
    }
}

module.exports = through(throughParseFile);
module.exports.parseFile = parseFile;
module.exports.extractYAML = extractYAML;
