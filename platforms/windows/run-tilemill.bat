@rem change into current directory
cd /d %~dp0
@rem then move to main tilemill folder
cd ..\..\
set PROJ_LIB=data\proj\nad
set GDAL_DATA=data\gdal\data
set PATH=%PATH%;addons\zipfile\lib
@rem - below looks odd, but it puts the mapnik libs
@rem on that PATH that are inside of the node-mapnik dir
set PATH=%PATH%;addons\mapnik\lib\mapnik\lib
set NODE_PATH=addons;%NODE_PATH%
@rem start http://localhost:20009/
node index.js

