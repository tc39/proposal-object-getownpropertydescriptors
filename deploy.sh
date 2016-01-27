#!/usr/bin/env bash
set -e # exit with nonzero exit code if anything fails

# run our compile script
npm run build

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

git checkout master