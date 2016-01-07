@echo off
@rem change into current directory
cd /d %~dp0
@rem then move to main tilemill folder
cd ..\..\
@rem set PATH=node_modules/mapnik/lib/mapnik/lib;node_modules/zipfile/lib;%PATH%
@rem start /min cmd /C "node .\index.js 1>>"%USERPROFILE%"\tilemill.log 2>&1"
node.exe .\index.js