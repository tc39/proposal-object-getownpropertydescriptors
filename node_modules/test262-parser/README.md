# Parse test262 test files

This package will allow you to parse [test262](https://github.com/tc39/test262/) test files into their component pieces, for further use and manipulation.

## API

### parseFile

The simplest function exported by this module is `parseFile`, which expects either a string representing the file contents, or an object with members `file` and `contents`, which are strings containing the filename and contents respectively.

The result of parseFile is an object `f` with (at least) a `contents` member.

If the input to parseFile contains the special YAML frontmatter comments `/*---` `---*/`, then the following things are done:

1. the copyright message is stored in `f.copyright`
2. the YAML frontmatter is parsed and stored as an object, `f.attrs`
3. the test's async status (`true`/`false`) is stored in `f.async`
4. `f.contents` is **modified** to contain only the text following the YAML closer comment `---*/`

If the input does not contain YAML frontmatter, some of the above parsing is still attempted but the `f.contents` member will **remain unchanged**.  This provides backwards compatibility to `test262-runner` which uses `parseFile` to parse test helpers as well as test files.

#### parseFile examples

```js
'use strict';
var fs = require('fs');
var test262Parser = require('test262-parser');

var rawTest = fs.readFileSync('built-ins/Array/prototype/includes/array-like.js');

// Pass in file object and it will be mutated with parsed data:
var file = {
    file: 'built-ins/Array/prototype/includes/array-like.js',
    contents: rawTest
};

test262Parser.parseFile(file);
// `file` now has `attrs`, `async`, and `copyright` properties, with `contents` modified

console.log(file.attrs);
// Outputs normalized attributes from the YAML front-matter:
// https://github.com/tc39/test262/blob/master/CONTRIBUTING.md#frontmatter

console.log(file.async);
// Outputs `true` or `false` depending on whether the test is async:
// https://github.com/tc39/test262/blob/master/CONTRIBUTING.md#writing-asynchronous-tests

console.log(file.copyright);
// Outputs the copyright header:
// https://github.com/tc39/test262/blob/master/CONTRIBUTING.md#copyright

console.log(file.contents);
// Outputs the main test body, without the copyright or YAML front-matter.

// You can also parse test contents directly; it will create a file object
var parsedFile = test262Parser.parseFile(rawTest);

console.log(parsedFile.file);      // '<unknown>'
console.log(parsedFile.contents);  // the main test body
console.log(parsedFile.copyright); // the copyright header
console.log(parsedFile.attrs);     // the normalized attributes
consoel.log(parsedFile.async);     // whether or not the test is async
```

### extractYAML

The `extractYAML` function takes a string containing the text contents and returns back the substring that constitutes the YAML front matter:

```js
'use strict';
var fs = require('fs');
var test262Parser = require('test262-parser');

var testContents = fs.readFileSync('built-ins/Array/prototype/includes/array-like.js');

var yaml = test262Parser.extractYAML(testContents);
console.log(yaml);
```

will output

```
description: Array.prototype.includes works on array-like objects
author: Domenic Denicola
```

### Streaming interface

The default export of the module is a transform stream factory. Every time you write a string or file object to the transform stream, it emits a parsed file object:

```js
'use strict';
var fs = require('fs');
var test262Parser = require('test262-parser');

var transformStream = test262Parser();
transformStream.pipe(process.stdout);

var testContents = fs.readFileSync('built-ins/Array/prototype/includes/array-like.js');
transformStream.write(testContents);
```

will output to `process.stdout` the (stringification of the) file object.
