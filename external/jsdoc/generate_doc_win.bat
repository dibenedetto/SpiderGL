set JAVA_DIR=C:\Program Files (x86)\Java\jre6\bin

set JSDOC_DIR=.\jsdoc_toolkit-2.4.0-spidergl\jsdoc-toolkit-spidergl
set JSDOC_TEMPLATE=codeview_1.2-spidergl
set JSDOC_FLAGS=-a

set SPIDERGL_DIR=%CD%\..\..
set SPIDERGL_SRC_DIR=src
set SPIDERGL_DOC_DIR=doc

mkdir %SPIDERGL_DIR%\%SPIDERGL_DOC_DIR%

set PATH=%JAVA_DIR%;%PATH%
cd %JSDOC_DIR%

java -jar jsrun.jar app\run.js %JSDOC_FLAGS% -d=%SPIDERGL_DIR%\%SPIDERGL_DOC_DIR% -t=templates\%JSDOC_TEMPLATE% %SPIDERGL_DIR%\%SPIDERGL_SRC_DIR%\*.js
