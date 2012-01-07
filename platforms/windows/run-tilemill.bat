rem change into current directory
cd /d %~dp0
rem then move to main tilemill folder
cd ..\..\
set PROJ_LIB=data\proj\nad
set GDAL_DATA=data\gdal\data
set PATH=%PATH%;node_modules\zipfile\lib
set PATH=%PATH%;mapnik-2.0\lib
start http://localhost:20009/
node index.js

