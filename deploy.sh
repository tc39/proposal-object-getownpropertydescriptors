#!/usr/bin/env bash
set -e # exit with nonzero exit code if anything fails

# clear and re-create the out directory
rm -rf out || exit 0;
mkdir out;

# run our compile script
node_modules/ecmarkup/bin/ecmarkup.js spec.html out/index.html

# grab content
INDEX=$(cat out/index.html)

# switch branch
git checkout gh-pages

# clean it up
rm -rf ./*

# create new index
echo -n "$INDEX" > index.html

# publish
git add .
git commit -m 'automatically generated index.html'
git push --force

# remember to switch back to master