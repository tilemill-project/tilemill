@echo off
@rem change into current directory
cd /d %~dp0
@rem then move to main tilemill folder
cd ..\..\
set PROJ_LIB=data\proj\nad
set GDAL_DATA=data\gdal\data
set PATH=node_modules\mapnik\lib\mapnik\lib;node_modules\zipfile\lib;%PATH%
start /min cmd /C "node index.js 1>>"%USERPROFILE%"\tilemill.log 2>&1"