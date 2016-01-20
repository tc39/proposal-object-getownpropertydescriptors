#!/usr/bin/env bash
set -e # exit with nonzero exit code if anything fails

# clear and re-create the out directory
rm -rf out || exit 0;
mkdir out;

# run our compile script
node_modules/ecmarkup/bin/ecmarkup.js spec.html out/index.html