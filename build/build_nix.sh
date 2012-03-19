#!/bin/bash

# ----------------------------------------------------
#     Merge all .js files in one with shell commands
# ----------------------------------------------------

rm ../lib/spidergl.js

cat ../src/namespace.js  >> ../lib/spidergl.js
cat ../src/version.js    >> ../lib/spidergl.js
cat ../src/core.js       >> ../lib/spidergl.js
cat ../src/type.js       >> ../lib/spidergl.js
cat ../src/utility.js    >> ../lib/spidergl.js
cat ../src/dom.js        >> ../lib/spidergl.js
cat ../src/io.js         >> ../lib/spidergl.js
cat ../src/math.js       >> ../lib/spidergl.js
cat ../src/space.js      >> ../lib/spidergl.js
cat ../src/webgl.js      >> ../lib/spidergl.js
cat ../src/model.js      >> ../lib/spidergl.js
cat ../src/ui.js         >> ../lib/spidergl.js


