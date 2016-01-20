// Copyright (C) 2014, Test262 Project Authors. All rights reserved.
// This code is governed by the BSD License found in the LICENSE file.
/*global it, describe */
"use strict";

var parser = require('../lib/parser'),
    fs = require('fs'),
    assert = require('assert'),
    through = require('through'),
    fixtures = {
        S11_4: 'test/fixtures/11.4.1-5-a-5gs.js',
        S72: 'test/fixtures/S7.2_A1.1_T1.js',
        async: 'test/fixtures/async.js',
        badYAML: 'test/fixtures/badYAML.js',
        issue_9: 'test/fixtures/issue_9.js',
        no_newline: 'test/fixtures/no_newline.js',
        promise_length: 'test/fixtures/promise_length.js'
    };

Object.keys(fixtures).forEach(function (k) {
    /*jslint stupid:true*/
    fixtures[k] = fs.readFileSync(fixtures[k], {encoding: 'utf-8'});
});

it('parses a fixture', function () {
    var file = {
        contents: fixtures.S72
    };
    file = parser.parseFile(file);

    assert.equal(file.attrs.es5id, '7.2_A1.1_T1');
});

it('parses a fixture when given only the contents as a string', function () {
    var file = parser.parseFile(fixtures.S72);

    assert.equal(file.attrs.es5id, '7.2_A1.1_T1');
});

it('parses a fixture with flags', function () {
    var file = {
        contents: fixtures.S11_4
    };
    file = parser.parseFile(file);

    assert.equal(file.attrs.flags.onlyStrict, true);
});

it('extracts the YAML', function () {
    assert.equal(parser.extractYAML("/*---foo---*/"), "foo");
    assert.equal(parser.extractYAML("/*---\nfoo\n---*/"), "\nfoo\n");
    assert.equal(parser.extractYAML("no yaml here"), "");
});

it('parses an empty file', function () {
    var file = {
        contents: ''
    };
    file = parser.parseFile(file);

    assert.deepEqual({
        contents: '',
        async: false,
        attrs: {
            includes: [],
            flags: {}
        },
        copyright: '',
        isATest: false
    }, file);
});

it('recovers from bad YAML', function () {
    var file = {
        file: 'mock_filename.js',
        contents: fixtures.badYAML
    };

    assert.throws(function () {
        file = parser.parseFile(file);
    }, /YAML|insufficient_indent/);
});

it('decides if a test is async', function () {
    var file = {
        file: '',
        contents: fixtures.async
    };

    assert.equal(parser.parseFile(file).async, true);
});

describe('identifies copyright headers', function () {
    it('in S72', function () {
        var file = parser.parseFile(fixtures.S72),
            expected =
                "// Copyright 2009 the Sputnik authors.  All rights reserved.\n" +
                "// This code is governed by the BSD license found in the LICENSE file.\n";

        assert.equal(file.copyright, expected);
    });

    it('in S11_4', function () {
        var file = parser.parseFile(fixtures.S11_4);

        assert(file.copyright.search(/^\/\/ Copyright (c) 2012 Ecma/));
        assert(file.copyright.search(/comply with the Use Terms\.$/));
    });

});

describe('identifies body', function () {
    it('in S72', function () {
        var file = parser.parseFile(fixtures.S72);

        assert(file.contents.search(/^\/\/ CHECK#1"/));
        assert(file.contents.search(/\)\);\n\}$/m));
    });

    it('in S11_4', function () {
        var file = parser.parseFile(fixtures.S11_4);

        assert(file.contents.search(/^"use strict";/));
        assert(file.contents.search(/delete _11_4_1_5$/));
    });
});

describe('works on non-formatted files', function () {
    it('does not destroy file if missing YAML frontmatter', function () {
        var file = parser.parseFile("var foo = 3;");

        assert.equal(file.contents, "var foo = 3;");
    });

    it('does not fail if no newline at end of file', function () {
        var file = parser.parseFile(fixtures.no_newline);
    });
});

describe('reports valid test262 file', function() {
    it('in S72', function () {
        var file = parser.parseFile(fixtures.S72);
        assert(file.isATest);
    });

    it('in S11_4', function () {
        var file = parser.parseFile(fixtures.S11_4);
        assert(file.isATest);
    });

    it('in promise_length', function () {
        var file = parser.parseFile(fixtures.promise_length);
        assert(file.isATest);
    });
});

describe('reports non-test262 file', function () {
  it('detects a non-test262 file', function () {
    var file = parser.parseFile(fixtures.issue_9);

    assert(!file.isATest)
  });
});

describe('has a stream interface', function () {
// should be last test: ends stream (not repeatable)
it('provides a stream interface', function (done) {
    var counts = {
        processed: 0,
        error: 0
    };

    parser.on('data', function (f) {
        assert.equal(f.file, 'S72');
        assert.equal(f.attrs.es5id, '7.2_A1.1_T1');
        counts.processed += 1;
    });
    parser.on('error', function (e) {
        assert.ok(/YAML/.test(e));
        counts.error += 1;
    });
    parser.on('end', function () {
        assert.equal(counts.processed, 1);
        assert.equal(counts.error, 1);
        done();
    });

    parser.write({
        file: 'S72',
        contents: fixtures.S72
    });
    parser.write({
        file: 'badYAML.js',
        contents: fixtures.badYAML
    });
    parser.end();
});
});