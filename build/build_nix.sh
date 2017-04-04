#!/bin/bash -e

# ----------------------------------------------------
#     Merge all .js files in one with shell commands
# ----------------------------------------------------

#rm ../lib/spidergl.js

BUILDDIR=`dirname $0`
:> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/namespace.js  >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/version.js    >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/core.js       >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/type.js       >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/utility.js    >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/dom.js        >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/io.js         >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/math.js       >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/space.js      >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/webgl.js      >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/model.js      >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/ui.js         >> $BUILDDIR/../lib/spidergl.js
cat $BUILDDIR/../src/obj_importer.js >> $BUILDDIR/../lib/spidergl.js

