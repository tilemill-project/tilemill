set DEVROOT=c:\dev2
set MAPNIK_INSTALL=c:\mapnik-v2.3.0
set NODEEXE="c:\dev2\nodist\v\0.10.25\node.exe"
set PATH=%PATH%;c:\Python27
@rem change into current directory
cd /d %~dp0
@rem then move to main tilemill folder
cd ..\..\
set TILEMILL_DIR=%CD%
set DEST=%TILEMILL_DIR%\node_modules

@rem remove then re-copy node-mapnik
rd /q /s %TILEMILL_DIR%\node_modules\mapnik
rd /q /s %TILEMILL_DIR%\node_modules\tilelive-mapnik\node_modules\mapnik
xcopy /i /s /exclude:%TILEMILL_DIR%\platforms\windows\excludes.txt %DEVROOT%\node-mapnik %DEST%\mapnik
@rem fixup paths to plugins making them relative 
@rem to future location of mapnik itself
cd %DEST%\mapnik
@rem - note, intentially not quoting the below
set MAPNIK_INPUT_PLUGINS=path.join(__dirname, 'mapnik/input')
set MAPNIK_FONTS=path.join(__dirname, 'mapnik/fonts')
python gen_settings.py
@rem augment the settings
echo var path = require('path'); module.exports.env = {'GDAL_DATA': path.join(__dirname, 'mapnik/share/gdal'),'PROJ_LIB': path.join(__dirname, 'mapnik/share/proj') }; >> lib/binding/mapnik_settings.js

set MAPNIK_DEST=%DEST%\mapnik\lib\binding\
mkdir %MAPNIK_DEST%\share
mkdir %MAPNIK_DEST%\fonts
mkdir %MAPNIK_DEST%\input

@rem - handle mapnik itself
xcopy /i /s /exclude:%TILEMILL_DIR%\platforms\windows\excludes.txt %MAPNIK_INSTALL%\lib %MAPNIK_DEST%
xcopy /i /s /exclude:%TILEMILL_DIR%\platforms\windows\excludes.txt %MAPNIK_INSTALL%\share %MAPNIK_DEST%\mapnik\share

del /q %TILEMILL_DIR%\node.exe
xcopy %NODEEXE% %TILEMILL_DIR%\node.exe
chdir %TILEMILL_DIR%
