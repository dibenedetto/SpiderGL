REM ----------------------------------------------------
REM     Merge all .js files in one with DOS commands
REM ----------------------------------------------------

REM delete output (if any) before appending
del ..\lib\spidergl.js

REM merge
type ..\src\namespace.js  >> ..\lib\spidergl.js
type ..\src\version.js    >> ..\lib\spidergl.js
type ..\src\core.js       >> ..\lib\spidergl.js
type ..\src\type.js       >> ..\lib\spidergl.js
type ..\src\utility.js    >> ..\lib\spidergl.js
type ..\src\dom.js        >> ..\lib\spidergl.js
type ..\src\io.js         >> ..\lib\spidergl.js
type ..\src\math.js       >> ..\lib\spidergl.js
type ..\src\space.js      >> ..\lib\spidergl.js
type ..\src\webgl.js      >> ..\lib\spidergl.js
type ..\src\model.js      >> ..\lib\spidergl.js
type ..\src\ui.js         >> ..\lib\spidergl.js

REM pause
